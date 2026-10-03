import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/*
 * THỨ TỰ IMPORT CSS Ở ĐÂY LÀ BẮT BUỘC GIỮ NGUYÊN.
 * Đây chính là thứ tự đã được kiểm chứng ở Phase 1 (mô phỏng cascade 296 selector,
 * 0 sai lệch so với bản gốc). Vite gộp CSS theo đúng thứ tự import nên cascade được bảo toàn.
 */
import './styles/base.css'
import './styles/buttons.css'
import './styles/header-nav.css'
import './styles/auth.css'
import './styles/admin.css'
import './styles/hero-catalog.css'
import './styles/modal-cart.css'
import './styles/footer.css'
import './styles/animations.css'
import './styles/responsive.css'
import './styles/pages-extra.css'
import './styles/makeup.css'

import App from './App'
import { applyStoredTheme } from './services/theme-service'

// Áp theme đã lưu TRƯỚC khi render để không bị nháy sai giao diện sáng/tối
applyStoredTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
