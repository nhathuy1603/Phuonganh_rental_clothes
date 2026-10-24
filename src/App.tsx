import { useEffect, useState } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/customer/HomePage'
import CatalogPage from './pages/customer/CatalogPage'
import ContactPage from './pages/customer/ContactPage'
import MakeupHubPage from './pages/customer/MakeupHubPage'
import MakeupDetailPage from './pages/customer/MakeupDetailPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
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
import { fetchBookingSlots, fetchCategoryTree, fetchMakeupCategories, fetchMakeupAppointments, fetchBookings, fetchProducts } from './services/catalog-service'
import { api, ApiError, readSession, saveSession, SESSION_EXPIRED_EVENT, type AdminSession } from './services/api'
import type { NavTarget, PageKey } from './types/navigation'
import type { CartLine } from './types/cart'
import type { BookingSlot, RentalBooking, RentalBookingInput } from './types/product'

/** admin.<domain> mở thẳng trang quản trị; domain chính là storefront. */
const isAdminHost = window.location.hostname.startsWith('admin.')
const storeUrl = import.meta.env.VITE_STORE_URL

/**
 * APP SHELL (Phase 2c-2): thêm Product Modal + Giỏ hàng + Checkout thật.
 * `cart` và `bookings` là state ở đây (thay cho STATE.cart / STATE.data.bookings toàn cục
 * của bản gốc) — UI con chỉ nhận qua props, không đụng trực tiếp vào state này.
 * `bookingSlots` là lịch giữ đồ công khai cho khách; `bookings` đầy đủ chỉ tải khi admin đã đăng nhập.
 */
function App() {
  const { isDark, toggle } = useTheme()
  const { toastMessage, showToast } = useToast()

  const [currentPage, setCurrentPage] = useState<PageKey>(isAdminHost ? 'admin' : 'home')
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [makeupDetailId, setMakeupDetailId] = useState<string | null>(null)
  const [modalProductId, setModalProductId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(readSession)
  const [loginNotice, setLoginNotice] = useState<string | null>(null)
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([])
  const [bookings, setBookings] = useState<RentalBooking[]>([])
  const [categoryTree, setCategoryTree] = useState<CategoryGroup[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [makeupAppointments, setMakeupAppointments] = useState<MakeupAppointment[]>([])
  const [makeupCategories, setMakeupCategories] = useState<MakeupCategory[]>([])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [categories, productList, slots, serviceList] = await Promise.all([
          fetchCategoryTree(),
          fetchProducts(),
          fetchBookingSlots(),
          fetchMakeupCategories(),
        ])

        if (!isMounted) return

        setCategoryTree(categories)
        setProducts(productList)
        setBookingSlots(slots)
        setMakeupCategories(serviceList)
      } catch (error) {
        if (!isMounted) return
        showToast(error instanceof Error ? error.message : 'Không tải được dữ liệu cửa hàng.')
      }
    }

    void loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Dữ liệu có thông tin khách (đơn thuê, lịch makeup) chỉ tải sau khi admin đăng nhập.
  useEffect(() => {
    if (!adminSession) {
      setBookings([])
      setMakeupAppointments([])
      return
    }

    let isMounted = true
    void Promise.all([fetchBookings(), fetchMakeupAppointments()])
      .then(([bookingList, appointmentList]) => {
        if (!isMounted) return
        setBookings(bookingList)
        setMakeupAppointments(appointmentList)
      })
      .catch((error: unknown) => {
        // 401 đã được màn đăng nhập báo, không cần toast trùng.
        if (!isMounted || (error instanceof ApiError && error.status === 401)) return
        showToast(error instanceof Error ? error.message : 'Không tải được dữ liệu quản trị.')
      })
    return () => {
      isMounted = false
    }
  }, [adminSession])

  useEffect(() => {
    const handleExpired = () => {
      setAdminSession(null)
      setLoginNotice('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired)
  }, [])

  const modalProduct = modalProductId ? products.find((product) => product.id === modalProductId) : undefined
  // Khi admin đã đăng nhập, dùng danh sách đơn đầy đủ (mới nhất) để tính còn hàng.
  const availabilityBookings: BookingSlot[] = adminSession ? bookings : bookingSlots

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
      const createdBookings = await api.post<RentalBooking[]>('/api/bookings/checkout', {
        customer: name,
        phone,
        depositType,
        items: cart.map(({ productId, variantId, pickupDate, dueDate }) => ({ productId, variantId, pickupDate, dueDate })),
      })
      setBookingSlots((current) => [...current, ...createdBookings])
      if (adminSession) setBookings((current) => [...current, ...createdBookings])
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

  /** Khách tự đặt lịch: server tự lấy giá dịch vụ và đặt trạng thái "Chờ xác nhận". */
  const handleRequestMakeupAppointment = async ({ customer, phone, serviceId, date, time, notes }: MakeupAppointmentInput) => {
    try {
      const created = await api.post<MakeupAppointment>('/api/makeup-appointments/request', { customer, phone, serviceId, date, time, notes })
      if (adminSession) setMakeupAppointments((current) => [...current, created])
      showToast('Đã ghi nhận lịch makeup. Cửa hàng sẽ liên hệ xác nhận.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể ghi nhận lịch makeup.')
      throw error
    }
  }

  const handleLoggedIn = (session: AdminSession) => {
    saveSession(session)
    setAdminSession(session)
    setLoginNotice(null)
    handleNavigate({ page: 'admin' })
  }

  const handleLogout = () => {
    saveSession(null)
    setAdminSession(null)
    setLoginNotice('Bạn đã đăng xuất.')
    handleNavigate({ page: 'admin' })
  }

  const handleBackToStore = () => {
    if (isAdminHost && storeUrl) window.location.href = storeUrl
    else handleNavigate({ page: 'home' })
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

  const isAdminArea = currentPage === 'admin' || currentPage === 'login'

  return (
    <>
      {!isAdminArea && <Header
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
          onBook={handleRequestMakeupAppointment}
        />
      )}

      {isAdminArea && !adminSession && (
        <AdminLoginPage notice={loginNotice} onLoggedIn={handleLoggedIn} onBackToStore={isAdminHost && !storeUrl ? undefined : handleBackToStore} />
      )}

      {isAdminArea && adminSession && (
        <AdminDashboardPage
          adminName={adminSession.username}
          onLogout={handleLogout}
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
          onBackToStore={handleBackToStore}
        />
      )}

      {!isAdminArea && <Footer />}

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          products={products}
          bookings={availabilityBookings}
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

      {!isAdminArea && <FloatingContactActions />}
      <Toast message={toastMessage} />
    </>
  )
}

export default App
