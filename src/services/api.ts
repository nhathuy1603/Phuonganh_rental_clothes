export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '')

export type SessionKind = 'admin' | 'customer'

const SESSION_KEYS: Record<SessionKind, string> = {
  admin: 'pa-admin-session',
  customer: 'pa-customer-session',
}
/** Phát ra khi API trả 401 để App đưa người dùng về màn đăng nhập tương ứng. */
export const SESSION_EXPIRED_EVENT: Record<SessionKind, string> = {
  admin: 'pa:session-expired',
  customer: 'pa:customer-session-expired',
}

export interface AdminSession {
  token: string
  username: string
  expiresAt: string
}

export interface CustomerProfile {
  id: string
  name: string
  /** Tài khoản Google có thể chưa bổ sung SĐT. */
  phone: string | null
  email: string | null
}

export interface CustomerSession {
  token: string
  expiresAt: string
  customer: CustomerProfile
}

type SessionOf<K extends SessionKind> = K extends 'admin' ? AdminSession : CustomerSession

export function readSession<K extends SessionKind = 'admin'>(kind: K = 'admin' as K): SessionOf<K> | null {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEYS[kind]) ?? 'null') as SessionOf<K> | null
    return session && Date.parse(session.expiresAt) > Date.now() ? session : null
  } catch {
    return null
  }
}

export function saveSession<K extends SessionKind>(kind: K, session: SessionOf<K> | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEYS[kind], JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEYS[kind])
  } catch {
    // Trình duyệt chặn localStorage: phiên chỉ sống tới khi tải lại trang.
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

/** API phía khách (tài khoản, đặt đơn) dùng token khách; còn lại dùng token admin. */
function sessionKindFor(path: string): SessionKind {
  return /^\/api\/(customers|bookings\/checkout|makeup-appointments\/request)/.test(path) ? 'customer' : 'admin'
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const kind = sessionKindFor(path)
  const token = readSession(kind)?.token
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    if (response.status === 401 && token) {
      saveSession(kind, null)
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT[kind]))
    }
    throw new ApiError(response.status, body?.message ?? `Yêu cầu thất bại (${response.status}).`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
}
