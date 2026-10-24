import { useState, type FormEvent } from 'react'
import { api, type AdminSession } from '../../services/api'

interface AdminLoginPageProps {
  notice?: string | null
  onLoggedIn: (session: AdminSession) => void
  onBackToStore?: () => void
}

export default function AdminLoginPage({ notice, onLoggedIn, onBackToStore }: AdminLoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      onLoggedIn(await api.post<AdminSession>('/api/auth/login', { username: username.trim(), password }))
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Không thể đăng nhập.')
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card admin-login-form" onSubmit={handleSubmit}>
        <div className="eyebrow-plain">Khu vực quản trị</div>
        <h1 className="serif">Đăng nhập Phương Anh</h1>
        {notice && !error && <p className="admin-login-notice">{notice}</p>}
        <label htmlFor="admin-username">Tên đăng nhập</label>
        <input id="admin-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoFocus />
        <label htmlFor="admin-password">Mật khẩu</label>
        <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
        {onBackToStore && (
          <a href="#store" className="admin-login-back" onClick={(event) => { event.preventDefault(); onBackToStore() }}>← Quay lại cửa hàng</a>
        )}
      </form>
    </div>
  )
}
