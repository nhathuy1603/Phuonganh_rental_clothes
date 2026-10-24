import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { config } from './config.js'
import { HttpError } from './errors.js'
import { verifyPassword } from './password.js'

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function sign(payload: string): string {
  return createHmac('sha256', config.auth.secret).update(payload).digest('base64url')
}

interface SessionPayload {
  sub: string
  exp: number
}

export function issueToken(username: string): { token: string; expiresAt: string } {
  const exp = Date.now() + config.auth.sessionHours * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ sub: username, exp } satisfies SessionPayload)).toString('base64url')
  return { token: `${payload}.${sign(payload)}`, expiresAt: new Date(exp).toISOString() }
}

function readToken(token: string): SessionPayload | null {
  const [payload, signature] = token.split('.')
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionPayload
    if (typeof session.exp !== 'number' || session.exp < Date.now()) return null
    if (session.sub !== config.auth.username) return null
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
  const header = req.headers.authorization ?? ''
  const session = header.startsWith('Bearer ') ? readToken(header.slice(7)) : null
  if (!session) {
    next(new HttpError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'))
    return
  }
  res.locals.admin = session.sub
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
