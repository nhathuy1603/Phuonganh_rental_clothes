import { useState } from 'react'
import type { CategoryGroup, MakeupCategory } from '../../types/catalog'
import type { NavTarget, PageKey } from '../../types/navigation'
import { preventAnd } from '../../utils/events'
import ThemeToggle from '../common/ThemeToggle'
import AccountControl, { type AccountUser } from './AccountControl'
import MegaPanel from './MegaPanel'
import MakeupPanel from './MakeupPanel'
import MobileNavDrawer from './MobileNavDrawer'

interface HeaderProps {
  currentPage: PageKey
  categoryTree: CategoryGroup[]
  makeupCategories: MakeupCategory[]
  cartCount: number
  user: AccountUser | null
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (target: NavTarget) => void
  onCartClick: () => void
  onLogout: () => void
}

/**
 * Port của renderHeader() gốc.
 * Trạng thái mở/đóng của 2 dropdown + drawer mobile là state cục bộ của Header
 * (bản gốc để trong STATE toàn cục: megaMenuOpen / makeupMenuOpen / mobileNavOpen).
 */
export default function Header({
  currentPage,
  categoryTree,
  makeupCategories,
  cartCount,
  user,
  isDark,
  onToggleTheme,
  onNavigate,
  onCartClick,
  onLogout,
}: HeaderProps) {
  const [megaOpen, setMegaOpen] = useState(false)
  const [makeupOpen, setMakeupOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeAll = () => {
    setMegaOpen(false)
    setMakeupOpen(false)
    setMobileOpen(false)
  }
  // Mọi lần điều hướng đều đóng hết menu (giống các hàm goXxx() gốc set megaMenuOpen=false...)
  const navigate = (target: NavTarget) => {
    closeAll()
    onNavigate(target)
  }
  const logout = () => {
    closeAll()
    onLogout()
  }
  const toggleMega = () => {
    setMegaOpen(!megaOpen)
    setMakeupOpen(false)
  }
  const toggleMakeup = () => {
    setMakeupOpen(!makeupOpen)
    setMegaOpen(false)
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <button type="button" className="hamburger-btn" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
            ☰
          </button>
          <a href="#" onClick={preventAnd(() => navigate({ page: 'home' }))} className="logo">
            Phương <span>Anh</span>
          </a>
          <nav className="main-nav">
            <a
              href="#"
              onClick={preventAnd(() => navigate({ page: 'home' }))}
              className={`nav-pill ${currentPage === 'home' ? 'trigger-active' : ''}`}
            >
              Trang chủ
            </a>
            <button type="button" className={`nav-pill ${megaOpen ? 'trigger-active' : ''}`} onClick={toggleMega}>
              Danh mục sản phẩm <span className="nav-caret">▾</span>
            </button>
            <button
              type="button"
              className={`nav-pill ${makeupOpen ? 'trigger-active-makeup' : ''}`}
              onClick={toggleMakeup}
            >
              💄 Trang điểm <span className="nav-caret">▾</span>
            </button>
            <a
              href="#"
              onClick={preventAnd(() => navigate({ page: 'contact' }))}
              className={`nav-pill ${currentPage === 'contact' ? 'trigger-active' : ''}`}
            >
              Liên hệ
            </a>
          </nav>
          <div className="header-actions">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} extraClass="header-theme-toggle" />
            <AccountControl user={user} onLogin={() => navigate({ page: 'login' })} onLogout={logout} />
            <button className="icon-btn" onClick={onCartClick} aria-label="Giỏ hàng">
              🧺{cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
          </div>
        </div>
        {megaOpen && (
          <MegaPanel
            categoryTree={categoryTree}
            onClose={() => setMegaOpen(false)}
            onSelectCategory={(category) => navigate({ page: 'catalog', category })}
          />
        )}
        {makeupOpen && (
          <MakeupPanel
            makeupCategories={makeupCategories}
            onClose={() => setMakeupOpen(false)}
            onSelectService={(id) => navigate({ page: 'makeup-detail', id })}
            onSelectHub={() => navigate({ page: 'makeup-hub' })}
          />
        )}
      </header>
      {mobileOpen && (
        <MobileNavDrawer
          categoryTree={categoryTree}
          makeupCategories={makeupCategories}
          user={user}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onNavigate={navigate}
          onLogout={logout}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
