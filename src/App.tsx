import { useEffect, useState } from 'react'
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
import FloatingContactActions from './components/common/FloatingContactActions'
import { useTheme } from './hooks/useTheme'
import { useScrollReveal } from './hooks/useScrollReveal'
import { useToast } from './hooks/useToast'
import { getCategoryTree, getMakeupCategories, getMakeupAppointments, getBookings, getProducts, fetchCategoryTree, fetchMakeupCategories, fetchMakeupAppointments, fetchBookings, fetchProducts } from './services/catalog-service'
import { createBookingsFromCart } from './services/booking-service'
import { api } from './services/api'
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
  const [bookings, setBookings] = useState<RentalBooking[]>([])
  const [nextBookingSeq, setNextBookingSeq] = useState(16)
  const [categoryTree, setCategoryTree] = useState<CategoryGroup[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [makeupAppointments, setMakeupAppointments] = useState<MakeupAppointment[]>([])
  const [makeupCategories, setMakeupCategories] = useState<MakeupCategory[]>([])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [categories, productList, bookingsList, appointmentList, serviceList] = await Promise.all([
          fetchCategoryTree(),
          fetchProducts(),
          fetchBookings(),
          fetchMakeupAppointments(),
          fetchMakeupCategories(),
        ])

        if (!isMounted) return

        setCategoryTree(categories)
        setProducts(productList)
        setBookings(bookingsList)
        setMakeupAppointments(appointmentList)
        setMakeupCategories(serviceList)
        setNextBookingSeq(Math.max(16, bookingsList.length + 16))
      } catch {
        if (!isMounted) return
        setCategoryTree(getCategoryTree())
        setProducts(getProducts())
        setBookings(getBookings())
        setMakeupAppointments(getMakeupAppointments())
        setMakeupCategories(getMakeupCategories())
        setNextBookingSeq(16)
      }
    }

    void loadData()
    return () => {
      isMounted = false
    }
  }, [])

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

  const handleSubmitCheckout = async (name: string, phone: string, depositType: 'Tiền mặt' | 'CCCD') => {
    if (!name || !phone) {
      showToast('Vui lòng nhập họ tên và số điện thoại')
      return
    }

    try {
      const bookingDrafts = createBookingsFromCart(cart, name, phone, depositType, nextBookingSeq)
      const createdBookings = await api.post<RentalBooking[]>('/api/bookings/bulk', bookingDrafts)
      setBookings((current) => [...current, ...createdBookings])
      setNextBookingSeq((sequence) => sequence + createdBookings.length)
      setCart([])
      setCartOpen(false)
      showToast('Đặt thuê thành công! Chúng tôi sẽ liên hệ xác nhận sớm.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể tạo đơn thuê.')
    }
  }

  const handleCreateRentalBooking = async (booking: RentalBookingInput) => {
    try {
      const created = await api.post<RentalBooking>('/api/bookings', booking)
      setBookings((current) => [...current, created])
      setNextBookingSeq((current) => current + 1)
      showToast('Đã tạo đơn thuê.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể tạo đơn thuê.')
    }
  }

  const handleUpdateRentalBooking = async (id: string, booking: RentalBookingInput) => {
    try {
      const updated = await api.put<RentalBooking>(`/api/bookings/${id}`, booking)
      setBookings((current) => current.map((item) => item.id === id ? updated : item))
      showToast('Đã cập nhật đơn thuê.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể cập nhật đơn thuê.')
    }
  }

  const handleDeleteRentalBooking = async (id: string) => {
    try {
      await api.del(`/api/bookings/${id}`)
      setBookings((current) => current.filter((item) => item.id !== id))
      showToast('Đã xóa đơn thuê.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa đơn thuê.')
    }
  }

  const handleCreateProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const created = await api.post<Product>('/api/products', product)
      setProducts((current) => [...current, created])
      showToast('Đã thêm sản phẩm vào catalog.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể tạo sản phẩm.')
    }
  }

  const handleUpdateProduct = async (id: string, product: Omit<Product, 'id'>) => {
    try {
      const updated = await api.put<Product>(`/api/products/${id}`, product)
      setProducts((current) => current.map((item) => item.id === id ? updated : item))
      showToast('Đã cập nhật sản phẩm.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể cập nhật sản phẩm.')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.del(`/api/products/${id}`)
      setProducts((current) => current.filter((item) => item.id !== id))
      if (modalProductId === id) setModalProductId(null)
      showToast('Đã xóa sản phẩm khỏi catalog.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa sản phẩm.')
    }
  }

  const handleSubmitContact = () => {
    showToast('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại sớm.')
  }

  const handleCreateMakeupAppointment = async (appointment: MakeupAppointmentInput) => {
    try {
      const created = await api.post<MakeupAppointment>('/api/makeup-appointments', appointment)
      setMakeupAppointments((current) => [...current, created])
      showToast('Đã ghi nhận lịch makeup. Cửa hàng sẽ liên hệ xác nhận.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể ghi nhận lịch makeup.')
      throw error
    }
  }

  const handleUpdateMakeupAppointment = async (id: string, appointment: MakeupAppointmentInput) => {
    try {
      const updated = await api.put<MakeupAppointment>(`/api/makeup-appointments/${id}`, appointment)
      setMakeupAppointments((current) => current.map((item) => item.id === id ? updated : item))
      showToast('Đã cập nhật lịch makeup.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể cập nhật lịch makeup.')
      throw error
    }
  }

  const handleDeleteMakeupAppointment = async (id: string) => {
    try {
      await api.del(`/api/makeup-appointments/${id}`)
      setMakeupAppointments((current) => current.filter((item) => item.id !== id))
      showToast('Đã xoá lịch makeup.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa lịch makeup.')
    }
  }

  const handleCreateMakeupService = async (service: Omit<MakeupCategory, 'id'>) => {
    try {
      const created = await api.post<MakeupCategory>('/api/makeup-services', service)
      setMakeupCategories((current) => [...current, created])
      showToast('Đã thêm dịch vụ makeup.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể thêm dịch vụ makeup.')
      throw error
    }
  }

  const handleUpdateMakeupService = async (id: string, service: Omit<MakeupCategory, 'id'>) => {
    try {
      const updated = await api.put<MakeupCategory>(`/api/makeup-services/${id}`, service)
      setMakeupCategories((current) => current.map((item) => item.id === id ? updated : item))
      showToast('Đã cập nhật dịch vụ makeup.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể cập nhật dịch vụ makeup.')
      throw error
    }
  }

  const handleDeleteMakeupService = async (id: string) => {
    try {
      await api.del(`/api/makeup-services/${id}`)
      setMakeupCategories((current) => current.filter((item) => item.id !== id))
      showToast('Đã xoá dịch vụ makeup.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa dịch vụ makeup.')
    }
  }

  const handleRenameCategoryGroup = async (groupIndex: number, name: string) => {
    try {
      const nextCategories = await api.put<CategoryGroup[]>(`/api/categories/groups/${groupIndex}`, { name })
      setCategoryTree(nextCategories)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể đổi tên nhóm danh mục.')
    }
  }

  const handleDeleteCategoryGroup = async (groupIndex: number) => {
    try {
      const nextCategories = await api.del<CategoryGroup[]>(`/api/categories/groups/${groupIndex}`)
      setCategoryTree(nextCategories)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa nhóm danh mục.')
    }
  }

  const handleAddCategoryGroup = async (name: string) => {
    try {
      const nextCategories = await api.post<CategoryGroup[]>('/api/categories/groups', { name })
      setCategoryTree(nextCategories)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể thêm nhóm danh mục.')
    }
  }

  const handleAddCategory = async (groupIndex: number, name: string) => {
    try {
      const nextCategories = await api.post<CategoryGroup[]>(`/api/categories/${groupIndex}/items`, { name })
      setCategoryTree(nextCategories)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể thêm danh mục con.')
    }
  }

  const handleRenameCategory = async (groupIndex: number, oldName: string, newName: string) => {
    try {
      const nextCategories = await api.put<CategoryGroup[]>(`/api/categories/${groupIndex}/items/${encodeURIComponent(oldName)}`, { name: newName })
      setCategoryTree(nextCategories)
      setProducts((current) => current.map((product) => product.category === oldName ? { ...product, category: newName } : product))
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể đổi tên danh mục con.')
    }
  }

  const handleDeleteCategory = async (groupIndex: number, name: string, moveProductsTo?: string) => {
    if (products.some((product) => product.category === name) && !moveProductsTo) return

    try {
      const nextCategories = await api.del<CategoryGroup[]>(`/api/categories/${groupIndex}/items/${encodeURIComponent(name)}${moveProductsTo ? `?moveTo=${encodeURIComponent(moveProductsTo)}` : ''}`)
      setCategoryTree(nextCategories)
      if (moveProductsTo) {
        setProducts((current) => current.map((product) => product.category === name ? { ...product, category: moveProductsTo } : product))
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể xóa danh mục con.')
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

      {currentPage !== 'admin' && <FloatingContactActions />}
      <Toast message={toastMessage} />
    </>
  )
}

export default App
