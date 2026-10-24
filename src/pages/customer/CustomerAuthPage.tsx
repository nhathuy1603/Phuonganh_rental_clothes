import { useState, type FormEvent } from 'react'
import { api, type CustomerSession } from '../../services/api'
import GoogleSignInButton from '../../components/common/GoogleSignInButton'

interface CustomerAuthPageProps {
  notice?: string | null
  onLoggedIn: (session: CustomerSession) => void
  onOpenAdminLogin: () => void
}

type Mode = 'login' | 'register'

export default function CustomerAuthPage({ notice, onLoggedIn, onOpenAdminLogin }: CustomerAuthPageProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  const handleGoogleCredential = async (credential: string) => {
    setError(null)
    setSubmitting(true)
    try {
      onLoggedIn(await api.post<CustomerSession>('/api/customers/google', { credential }))
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Không đăng nhập được bằng Google.')
      setSubmitting(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (mode === 'register' && password !== confirm) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }

    setSubmitting(true)
    try {
      const session = mode === 'login'
        ? await api.post<CustomerSession>('/api/customers/login', { phone, password })
        : await api.post<CustomerSession>('/api/customers/register', { name: name.trim(), phone, password })
      onLoggedIn(session)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Không thể đăng nhập.')
      setSubmitting(false)
    }
  }

  return (
    <section className="wrap auth-wrap">
      <form className="auth-card customer-auth-form" onSubmit={handleSubmit}>
        <div className="eyebrow-plain">Tài khoản khách hàng</div>
        <h1 className="serif">{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        <p className="customer-auth-intro">
          {mode === 'login'
            ? 'Đăng nhập để xem lại đơn thuê, lịch makeup và đặt nhanh hơn.'
            : 'Chỉ cần họ tên, số điện thoại và mật khẩu. Bạn vẫn có thể đặt đồ mà không cần tài khoản.'}
        </p>
        {notice && !error && <p className="customer-auth-notice">{notice}</p>}
        <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />

        {mode === 'register' && (
          <>
            <label htmlFor="customer-name">Họ và tên</label>
            <input id="customer-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nguyễn Văn A" required />
          </>
        )}
        <label htmlFor="customer-phone">Số điện thoại</label>
        <input id="customer-phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xxxxxxxx" required />
        <label htmlFor="customer-password">Mật khẩu</label>
        <input
          id="customer-password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={mode === 'register' ? 6 : undefined}
          required
        />
        {mode === 'register' && (
          <>
            <label htmlFor="customer-confirm">Nhập lại mật khẩu</label>
            <input id="customer-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
          </>
        )}

        {error && <p className="customer-auth-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>

        <p className="auth-switch">
          {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <a href="#" onClick={(event) => { event.preventDefault(); switchMode(mode === 'login' ? 'register' : 'login') }}>
            {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
          </a>
        </p>
        {mode === 'login' && <p className="customer-auth-forgot">Quên mật khẩu? Nhắn Zalo cho cửa hàng để được hỗ trợ đặt lại.</p>}
        <a href="#admin" className="customer-auth-admin" onClick={(event) => { event.preventDefault(); onOpenAdminLogin() }}>Đăng nhập quản trị</a>
      </form>
    </section>
  )
}
