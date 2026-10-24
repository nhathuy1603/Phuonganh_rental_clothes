export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '')

const TOKEN_KEY = 'pa-admin-session'
/** Phát ra khi API trả 401 để App đưa admin về màn đăng nhập. */
export const SESSION_EXPIRED_EVENT = 'pa:session-expired'

export interface AdminSession {
  token: string
  username: string
  expiresAt: string
}

export function readSession(): AdminSession | null {
  try {
    const session = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? 'null') as AdminSession | null
    return session && Date.parse(session.expiresAt) > Date.now() ? session : null
  } catch {
    return null
  }
}

export function saveSession(session: AdminSession | null) {
  try {
    if (session) localStorage.setItem(TOKEN_KEY, JSON.stringify(session))
    else localStorage.removeItem(TOKEN_KEY)
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = readSession()?.token
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
      saveSession(null)
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
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
