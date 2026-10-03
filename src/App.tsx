import { useState } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/customer/HomePage'
import CatalogPage from './pages/customer/CatalogPage'
import ContactPage from './pages/customer/ContactPage'
import MakeupHubPage from './pages/customer/MakeupHubPage'
import MakeupDetailPage from './pages/customer/MakeupDetailPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import type { CategoryGroup, MakeupCategory } from './types/catalog'
import type { MakeupAppointment, MakeupAppointmentInput } from './types/makeup-appointment'
import type { Product } from './types/product'
import ProductModal from './components/product/ProductModal'
import CartDrawer from './components/cart/CartDrawer'
import Toast from './components/common/Toast'
import { useTheme } from './hooks/useTheme'
import { useScrollReveal } from './hooks/useScrollReveal'
import { useToast } from './hooks/useToast'
import { getCategoryTree, getMakeupCategories, getMakeupAppointments, getBookings, getProducts } from './services/catalog-service'
import { createBookingsFromCart } from './services/booking-service'
import type { NavTarget, PageKey } from './types/navigation'
import type { CartLine } from './types/cart'
import type { RentalBooking, RentalBookingInput } from './types/product'

/**
 * APP SHELL (Phase 2c-2): thêm Product Modal + Giỏ hàng + Checkout thật.
 * `cart` và `bookings` là state ở đây (thay cho STATE.cart / STATE.data.bookings toàn cục
 * của bản gốc) — UI con chỉ nhận qua props, không đụng trực tiếp vào state này.
 */
function App() {
  const { isDark, toggle } = useTheme()
  const { toastMessage, showToast } = useToast()

  const [currentPage, setCurrentPage] = useState<PageKey>('home')
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [makeupDetailId, setMakeupDetailId] = useState<string | null>(null)
  const [modalProductId, setModalProductId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [bookings, setBookings] = useState<RentalBooking[]>(() => getBookings())
  const [nextBookingSeq, setNextBookingSeq] = useState(16) // nối tiếp đúng 15 đơn mẫu (b1..b15) của bản gốc
  const [categoryTree, setCategoryTree] = useState<CategoryGroup[]>(() => getCategoryTree())
  const [products, setProducts] = useState<Product[]>(() => getProducts())
  const [makeupAppointments, setMakeupAppointments] = useState<MakeupAppointment[]>(() => getMakeupAppointments())
  const [nextMakeupAppointmentSeq, setNextMakeupAppointmentSeq] = useState(() => getMakeupAppointments().length + 1)
  const [makeupCategories, setMakeupCategories] = useState<MakeupCategory[]>(() => getMakeupCategories())

  const modalProduct = modalProductId ? products.find((product) => product.id === modalProductId) : undefined

  const handleNavigate = (target: NavTarget) => {
    setCurrentPage(target.page)
    if (target.page === 'catalog') {
      setActiveCategory(target.category)
    }
    if (target.page === 'makeup-detail') {
      setMakeupDetailId(target.id)
    } else {
      setMakeupDetailId(null)
    }
    window.scrollTo(0, 0)
  }

  const handleAddToCart = (line: CartLine) => {
    setCart((prev) => [...prev, line])
    setModalProductId(null)
    setCartOpen(true)
    showToast('Đã thêm vào giỏ hàng')
  }

  const handleRemoveCartLine = (lineId: string) => {
    setCart((prev) => prev.filter((c) => c.lineId !== lineId))
  }

  const handleSubmitCheckout = (name: string, phone: string, depositType: 'Tiền mặt' | 'CCCD') => {
    if (!name || !phone) {
      showToast('Vui lòng nhập họ tên và số điện thoại')
      return
    }
    const newBookings = createBookingsFromCart(cart, name, phone, depositType, nextBookingSeq)
    setBookings((prev) => [...prev, ...newBookings])
    setNextBookingSeq((seq) => seq + cart.length)
    setCart([])
    setCartOpen(false)
    showToast('Đặt thuê thành công! Chúng tôi sẽ liên hệ xác nhận sớm.')
  }

  const handleCreateRentalBooking = (booking: RentalBookingInput) => {
    const sequence = nextBookingSeq
    setBookings((current) => [...current, { ...booking, id: `b${sequence}`, code: `PA-${1000 + sequence}` }])
    setNextBookingSeq((current) => current + 1)
    showToast('Đã tạo đơn thuê.')
  }

  const handleUpdateRentalBooking = (id: string, booking: RentalBookingInput) => {
    setBookings((current) => current.map((item) => item.id === id ? { ...booking, id, code: item.code } : item))
    showToast('Đã cập nhật đơn thuê.')
  }

  const handleDeleteRentalBooking = (id: string) => {
    setBookings((current) => current.filter((item) => item.id !== id))
    showToast('Đã xóa đơn thuê.')
  }

  const handleCreateProduct = (product: Omit<Product, 'id'>) => {
    const id = `p-${Date.now()}`
    setProducts((current) => [...current, { ...product, id }])
    showToast('Đã thêm sản phẩm vào catalog.')
  }

  const handleUpdateProduct = (id: string, product: Omit<Product, 'id'>) => {
    setProducts((current) => current.map((item) => item.id === id ? { ...product, id } : item))
    showToast('Đã cập nhật sản phẩm.')
  }

  const handleDeleteProduct = (id: string) => {
    setProducts((current) => current.filter((item) => item.id !== id))
    if (modalProductId === id) setModalProductId(null)
    showToast('Đã xóa sản phẩm khỏi catalog.')
  }

  const handleSubmitContact = () => {
    showToast('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm.')
  }

  const handleCreateMakeupAppointment = (appointment: MakeupAppointmentInput) => {
    const id = `ma${nextMakeupAppointmentSeq}`
    setMakeupAppointments((prev) => [...prev, { ...appointment, id }])
    setNextMakeupAppointmentSeq((sequence) => sequence + 1)
    showToast('Đã ghi nhận lịch makeup. Cửa hàng sẽ liên hệ xác nhận.')
  }

  const handleUpdateMakeupAppointment = (id: string, appointment: MakeupAppointmentInput) => {
    setMakeupAppointments((prev) => prev.map((item) => item.id === id ? { ...appointment, id } : item))
    showToast('Đã cập nhật lịch makeup.')
  }

  const handleDeleteMakeupAppointment = (id: string) => {
    setMakeupAppointments((prev) => prev.filter((item) => item.id !== id))
    showToast('Đã xoá lịch makeup.')
  }

  const handleCreateMakeupService = (service: Omit<MakeupCategory, 'id'>) => {
    setMakeupCategories((prev) => [...prev, { ...service, id: `mk-${Date.now()}` }])
    showToast('Đã thêm dịch vụ makeup.')
  }

  const handleUpdateMakeupService = (id: string, service: Omit<MakeupCategory, 'id'>) => {
    setMakeupCategories((prev) => prev.map((item) => item.id === id ? { ...service, id } : item))
    showToast('Đã cập nhật dịch vụ makeup.')
  }

  const handleDeleteMakeupService = (id: string) => {
    setMakeupCategories((prev) => prev.filter((item) => item.id !== id))
    showToast('Đã xoá dịch vụ makeup.')
  }

  const handleRenameCategoryGroup = (groupIndex: number, name: string) => {
    setCategoryTree((current) => current.map((group, index) => index === groupIndex ? { ...group, group: name } : group))
  }

  const handleDeleteCategoryGroup = (groupIndex: number) => {
    setCategoryTree((current) => current.filter((_, index) => index !== groupIndex))
  }

  const handleAddCategoryGroup = (name: string) => {
    setCategoryTree((current) => [...current, { group: name, items: [] }])
  }

  const handleAddCategory = (groupIndex: number, name: string) => {
    setCategoryTree((current) => current.map((group, index) => index === groupIndex ? { ...group, items: [...group.items, name] } : group))
  }

  const handleRenameCategory = (groupIndex: number, oldName: string, newName: string) => {
    setCategoryTree((current) => current.map((group, index) => index === groupIndex
      ? { ...group, items: group.items.map((item) => item === oldName ? newName : item) }
      : group))
    setProducts((current) => current.map((product) => product.category === oldName ? { ...product, category: newName } : product))
  }

  const handleDeleteCategory = (groupIndex: number, name: string, moveProductsTo?: string) => {
    if (products.some((product) => product.category === name) && !moveProductsTo) return
    setCategoryTree((current) => current.map((group, index) => index === groupIndex
      ? { ...group, items: group.items.filter((item) => item !== name) }
      : group))
    if (moveProductsTo) {
      setProducts((current) => current.map((product) => product.category === name ? { ...product, category: moveProductsTo } : product))
    }
  }

  // Chạy lại việc quan sát .reveal mỗi khi đổi trang/danh mục — giống initScrollReveal() gốc
  useScrollReveal([currentPage, activeCategory])

  return (
    <>
      {currentPage !== 'admin' && <Header
        currentPage={currentPage}
        categoryTree={categoryTree}
        makeupCategories={makeupCategories}
        cartCount={cart.length}
        user={null}
        isDark={isDark}
        onToggleTheme={toggle}
        onNavigate={handleNavigate}
        onCartClick={() => setCartOpen(true)}
        onLogout={() => showToast('Đăng xuất (chưa làm — thuộc Phase 4)')}
      />}

      {currentPage === 'home' && (
        <HomePage
          categories={categoryTree}
          products={products}
          onSelectCategory={(category) => handleNavigate({ page: 'catalog', category })}
          onOpenProduct={setModalProductId}
        />
      )}

      {currentPage === 'catalog' && (
        <CatalogPage
          activeCategory={activeCategory}
          categories={categoryTree}
          products={products}
          onSelectCategory={(category) => handleNavigate({ page: 'catalog', category })}
          onOpenProduct={setModalProductId}
        />
      )}

      {currentPage === 'contact' && <ContactPage onSubmit={handleSubmitContact} />}

      {currentPage === 'makeup-hub' && (
        <MakeupHubPage
          makeupCategories={makeupCategories}
          onOpenService={(id) => handleNavigate({ page: 'makeup-detail', id })}
          onBack={() => handleNavigate({ page: 'home' })}
        />
      )}

      {currentPage === 'makeup-detail' && (
        <MakeupDetailPage
          makeupCategories={makeupCategories}
          serviceId={makeupDetailId ?? makeupCategories[0]?.id ?? null}
          onBack={() => handleNavigate({ page: 'makeup-hub' })}
          onBook={handleCreateMakeupAppointment}
        />
      )}

      {currentPage === 'admin' && (
        <AdminDashboardPage
          bookings={bookings}
          onCreateRentalBooking={handleCreateRentalBooking}
          onUpdateRentalBooking={handleUpdateRentalBooking}
          onDeleteRentalBooking={handleDeleteRentalBooking}
          products={products}
          onCreateProduct={handleCreateProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          categories={categoryTree}
          makeupAppointments={makeupAppointments}
          makeupServices={makeupCategories}
          onCreateMakeupAppointment={handleCreateMakeupAppointment}
          onUpdateMakeupAppointment={handleUpdateMakeupAppointment}
          onDeleteMakeupAppointment={handleDeleteMakeupAppointment}
          onCreateMakeupService={handleCreateMakeupService}
          onUpdateMakeupService={handleUpdateMakeupService}
          onDeleteMakeupService={handleDeleteMakeupService}
          onRenameCategoryGroup={handleRenameCategoryGroup}
          onDeleteCategoryGroup={handleDeleteCategoryGroup}
          onAddCategoryGroup={handleAddCategoryGroup}
          onAddCategory={handleAddCategory}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
          onBackToStore={() => handleNavigate({ page: 'home' })}
        />
      )}

      {currentPage === 'login' && (
        <section className="wrap" style={{ paddingTop: '60px', paddingBottom: '80px', minHeight: '45vh' }}>
          <div className="eyebrow-plain">Khu vực quản trị</div>
          <h1 className="serif" style={{ fontSize: '26px', margin: '0 0 14px' }}>
            Đăng nhập quản trị
          </h1>
          <p style={{ maxWidth: '520px', color: 'var(--ink-soft)', lineHeight: 1.7 }}>
            Xác thực admin chưa được kết nối. Bạn có thể mở bản xem trước giao diện bằng dữ liệu mẫu bên dưới.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => handleNavigate({ page: 'admin' })}>
            Xem trang quản trị
          </button>
        </section>
      )}

      {currentPage !== 'admin' && <Footer />}

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          products={products}
          bookings={bookings}
          onClose={() => setModalProductId(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onRemoveLine={handleRemoveCartLine}
          onSubmitCheckout={handleSubmitCheckout}
        />
      )}

      <Toast message={toastMessage} />
    </>
  )
}

export default App
