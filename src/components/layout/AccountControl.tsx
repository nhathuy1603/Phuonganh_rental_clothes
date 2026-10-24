import { useState } from 'react'
import { preventAnd } from '../../utils/events'

export interface AccountUser {
  name: string
  phone: string | null
  email?: string | null
}

interface AccountControlProps {
  user: AccountUser | null
  onLogin: () => void
  onOpenAccount: () => void
  onLogout: () => void
}

/**
 * Port của renderAccountControl() gốc.
 * Khách đã đăng nhập thấy tên, SĐT, lối vào "Đơn của tôi" và nút đăng xuất.
 */
export default function AccountControl({ user, onLogin, onOpenAccount, onLogout }: AccountControlProps) {
  const [open, setOpen] = useState(false)

  if (!user) {
    return (
      <a href="#" className="tiny-admin-link" onClick={preventAnd(onLogin)}>
        👤 Đăng nhập
      </a>
    )
  }

  const firstName = user.name.split(' ').slice(-1)[0]
  return (
    <div className="account-menu">
      <button type="button" className="tiny-admin-link" onClick={() => setOpen(!open)}>
        👤 {firstName} <span className="nav-caret">▾</span>
      </button>
      {open && (
        <>
          <div className="mega-backdrop" onClick={() => setOpen(false)} />
          <div className="account-dropdown">
            <div className="account-dropdown-name">{user.name}</div>
            <div className="account-dropdown-sub">{user.phone ?? user.email}</div>
            <button
              type="button"
              className="btn btn-primary btn-sm btn-block"
              style={{ marginTop: '10px' }}
              onClick={() => {
                setOpen(false)
                onOpenAccount()
              }}
            >
              Đơn của tôi
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-block"
              style={{ marginTop: '10px' }}
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
            >
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  )
}
