import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { config } from './config.js'
import { HttpError } from './errors.js'
import { verifyPassword } from './password.js'

const CUSTOMER_SESSION_DAYS = 30

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function sign(payload: string): string {
  return createHmac('sha256', config.auth.secret).update(payload).digest('base64url')
}

type Role = 'admin' | 'customer'

interface SessionPayload {
  sub: string
  role: Role
  exp: number
}

function issue(sub: string, role: Role, ttlMs: number): { token: string; expiresAt: string } {
  const exp = Date.now() + ttlMs
  const payload = Buffer.from(JSON.stringify({ sub, role, exp } satisfies SessionPayload)).toString('base64url')
  return { token: `${payload}.${sign(payload)}`, expiresAt: new Date(exp).toISOString() }
}

export function issueToken(username: string) {
  return issue(username, 'admin', config.auth.sessionHours * 60 * 60 * 1000)
}

export function issueCustomerToken(customerId: string) {
  return issue(customerId, 'customer', CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000)
}

function readToken(req: Request, role: Role): SessionPayload | null {
  const header = req.headers.authorization ?? ''
  if (!header.startsWith('Bearer ')) return null
  const [payload, signature] = header.slice(7).split('.')
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionPayload
    if (session.role !== role || typeof session.exp !== 'number' || session.exp < Date.now()) return null
    if (role === 'admin' && session.sub !== config.auth.username) return null
    return session
  } catch {
    return null
  }
}

export function checkCredentials(username: string, password: string): boolean {
  // Luôn chạy scrypt để thời gian phản hồi không lộ username đúng hay sai.
  const passwordOk = verifyPassword(password, config.auth.passwordHash)
  return safeEqual(username, config.auth.username) && passwordOk
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const session = readToken(req, 'admin')
  if (!session) {
    next(new HttpError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'))
    return
  }
  res.locals.admin = session.sub
  next()
}

export function requireCustomer(req: Request, res: Response, next: NextFunction): void {
  const session = readToken(req, 'customer')
  if (!session) {
    next(new HttpError(401, 'Vui lòng đăng nhập để tiếp tục.'))
    return
  }
  res.locals.customerId = session.sub
  next()
}

/** Gắn khách đang đăng nhập (nếu có) vào res.locals; khách vãng lai vẫn đi tiếp. */
export function optionalCustomer(req: Request, res: Response, next: NextFunction): void {
  res.locals.customerId = readToken(req, 'customer')?.sub ?? null
  next()
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_FAILURES = 10
const loginFailures = new Map<string, { count: number; resetAt: number }>()

export function loginRateLimit(req: Request, _res: Response, next: NextFunction): void {
  const entry = loginFailures.get(req.ip ?? 'unknown')
  if (entry && entry.resetAt > Date.now() && entry.count >= LOGIN_MAX_FAILURES) {
    next(new HttpError(429, 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'))
    return
  }
  next()
}

export function recordLoginFailure(ip = 'unknown'): void {
  const now = Date.now()
  const entry = loginFailures.get(ip)
  if (!entry || entry.resetAt <= now) loginFailures.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
  else entry.count++
}

export function clearLoginFailures(ip = 'unknown'): void {
  loginFailures.delete(ip)
}
