import 'dotenv/config'
import path from 'node:path'

const isProduction = process.env.NODE_ENV === 'production'

function required(name: string, devFallback?: string): string {
  const value = process.env[name]?.trim()
  if (value) return value
  if (!isProduction && devFallback !== undefined) return devFallback
  throw new Error(`Thiếu biến môi trường ${name}.`)
}

function list(value: string): string[] {
  return value.split(',').map((item) => item.trim().replace(/\/$/, '')).filter(Boolean)
}

const port = Number(process.env.PORT ?? 4000)
const authSecret = required('AUTH_SECRET', 'dev-only-secret-change-me')
if (isProduction && authSecret.length < 32) {
  throw new Error('AUTH_SECRET phải dài ít nhất 32 ký tự trong production.')
}

export const config = {
  isProduction,
  port,
  // Danh sách origin được phép gọi API, ví dụ customer + admin domain.
  corsOrigins: list(process.env.CORS_ORIGINS ?? process.env.CLIENT_URL ?? 'http://localhost:5173'),
  // URL công khai của API, dùng để tạo link ảnh đã upload.
  publicApiUrl: required('PUBLIC_API_URL', `http://localhost:${port}`).replace(/\/$/, ''),
  trustProxy: process.env.TRUST_PROXY === 'true',
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? 'uploads'),
  // Client ID OAuth của Google; để trống thì tắt đăng nhập bằng Google.
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || null,
  auth: {
    secret: authSecret,
    username: required('ADMIN_USERNAME', 'admin'),
    passwordHash: required('ADMIN_PASSWORD_HASH'),
    sessionHours: Number(process.env.ADMIN_SESSION_HOURS ?? 12),
  },
}
