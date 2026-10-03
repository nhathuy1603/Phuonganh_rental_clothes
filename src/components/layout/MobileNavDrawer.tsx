import { useState, type MouseEvent } from 'react'
import type { CategoryGroup, MakeupCategory } from '../../types/catalog'
import type { NavTarget } from '../../types/navigation'
import { preventAnd } from '../../utils/events'
import type { AccountUser } from './AccountControl'

interface MobileNavDrawerProps {
  categoryTree: CategoryGroup[]
  makeupCategories: MakeupCategory[]
  user: AccountUser | null
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (target: NavTarget) => void
  onLogout: () => void
  onClose: () => void
}

/**
 * Port của renderMobileNavDrawer() gốc (menu hamburger dạng accordion).
 * State accordion (catalogOpen / makeupOpen / openGroupIndex) là state cục bộ;
 * mỗi lần drawer đóng rồi mở lại sẽ tự về mặc định gập hết (như closeMobileNav() gốc reset).
 */
export default function MobileNavDrawer({
  categoryTree,
  makeupCategories,
  user,
  isDark,
  onToggleTheme,
  onNavigate,
  onLogout,
  onClose,
}: MobileNavDrawerProps) {
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [makeupOpen, setMakeupOpen] = useState(false)
  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(null)

  return (
    <div
      className="overlay"
      style={{ background: 'rgba(24,26,24,.5)', justifyContent: 'flex-start' }}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mobile-nav-drawer" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <div className="cart-head">
          <a href="#" onClick={preventAnd(() => onNavigate({ page: 'home' }))} className="logo">
            Phương <span>Anh</span>
          </a>
          <button className="modal-close" style={{ position: 'static' }} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="mobile-nav-body">
          {user ? (
            <div className="mobile-nav-account">
              <div className="account-dropdown-name">{user.name}</div>
              <div className="account-dropdown-sub">{user.email}</div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '8px' }} onClick={onLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginBottom: '18px' }}
              onClick={() => onNavigate({ page: 'login' })}
            >
              👤 Đăng nhập / Đăng ký
            </button>
          )}

          <a href="#" className="mobile-nav-link" onClick={preventAnd(() => onNavigate({ page: 'home' }))}>
            Trang chủ
          </a>
          <a href="#" className="mobile-nav-link" onClick={preventAnd(() => onNavigate({ page: 'contact' }))}>
            Liên hệ
          </a>

          <button type="button" className="mobile-accordion-btn" onClick={() => setCatalogOpen(!catalogOpen)}>
            Danh mục sản phẩm <span className={`mobile-accordion-chevron ${catalogOpen ? 'open' : ''}`}>▾</span>
          </button>
          {catalogOpen && (
            <div className="mobile-accordion-panel">
              {categoryTree.map((g, gi) => (
                <div key={g.group}>
                  <button
                    type="button"
                    className="mobile-nav-group-btn"
                    onClick={() => setOpenGroupIndex(openGroupIndex === gi ? null : gi)}
                  >
                    {g.group}{' '}
                    <span className={`mobile-accordion-chevron ${openGroupIndex === gi ? 'open' : ''}`}>▾</span>
                  </button>
                  {openGroupIndex === gi &&
                    g.items.map((it) => (
                      <a
                        href="#"
                        key={it}
                        className="mobile-nav-link mobile-nav-sub"
                        onClick={preventAnd(() => onNavigate({ page: 'catalog', category: it }))}
                      >
                        {it}
                      </a>
                    ))}
                </div>
              ))}
            </div>
          )}

          <button type="button" className="mobile-accordion-btn" onClick={() => setMakeupOpen(!makeupOpen)}>
            💄 Trang điểm <span className={`mobile-accordion-chevron ${makeupOpen ? 'open' : ''}`}>▾</span>
          </button>
          {makeupOpen && (
            <div className="mobile-accordion-panel">
              {makeupCategories.map((c) => (
                <a
                  href="#"
                  key={c.id}
                  className="mobile-nav-link mobile-nav-sub"
                  onClick={preventAnd(() => onNavigate({ page: 'makeup-detail', id: c.id }))}
                >
                  {c.emoji} {c.name}
                </a>
              ))}
              <a
                href="#"
                className="mobile-nav-link mobile-nav-sub"
                onClick={preventAnd(() => onNavigate({ page: 'makeup-hub' }))}
              >
                ✨ Xem tất cả dịch vụ trang điểm
              </a>
            </div>
          )}

          <div className="mobile-nav-section">Khác</div>
          <a href="#" className="mobile-nav-link" onClick={preventAnd(onToggleTheme)}>
            {isDark ? '☀️ Chế độ sáng' : '🌙 Chế độ tối'}
          </a>
        </div>
      </div>
    </div>
  )
}
