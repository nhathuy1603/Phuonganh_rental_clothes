import { useState } from 'react'
import type { Product, RentalBooking, RentalBookingInput } from '../../types/product'
import type { CategoryGroup, MakeupCategory } from '../../types/catalog'
import type { MakeupAppointment, MakeupAppointmentInput } from '../../types/makeup-appointment'
import { availableNow } from '../../services/catalog-service'
import { TODAY_ISO } from '../../utils/dates'
import AdminFinancePanel, { type AdminDatePreset } from './AdminFinancePanel'
import AdminMakeupCalendarPage from './AdminMakeupCalendarPage'
import AdminMakeupServicesPage from './AdminMakeupServicesPage'
import AdminCategoriesPage from './AdminCategoriesPage'
import AdminRentalBookingsPage from './AdminRentalBookingsPage'
import AdminProductsPage from './AdminProductsPage'

type AdminSection = 'overview' | 'bookings' | 'inventory' | 'finance' | 'categories' | 'makeup-calendar' | 'makeup-services'

interface AdminDashboardPageProps {
  bookings: RentalBooking[]
  onCreateRentalBooking: (booking: RentalBookingInput) => void
  onUpdateRentalBooking: (id: string, booking: RentalBookingInput) => void
  onDeleteRentalBooking: (id: string) => void
  products: Product[]
  onCreateProduct: (product: Omit<Product, 'id'>) => void
  onUpdateProduct: (id: string, product: Omit<Product, 'id'>) => void
  onDeleteProduct: (id: string) => void
  categories: CategoryGroup[]
  makeupAppointments: MakeupAppointment[]
  makeupServices: MakeupCategory[]
  onCreateMakeupAppointment: (appointment: MakeupAppointmentInput) => Promise<void>
  onUpdateMakeupAppointment: (id: string, appointment: MakeupAppointmentInput) => Promise<void>
  onDeleteMakeupAppointment: (id: string) => void
  onCreateMakeupService: (service: Omit<MakeupCategory, 'id'>) => Promise<void>
  onUpdateMakeupService: (id: string, service: Omit<MakeupCategory, 'id'>) => Promise<void>
  onDeleteMakeupService: (id: string) => void
  onRenameCategoryGroup: (groupIndex: number, name: string) => void
  onDeleteCategoryGroup: (groupIndex: number) => void
  onAddCategoryGroup: (name: string) => void
  onAddCategory: (groupIndex: number, name: string) => void
  onRenameCategory: (groupIndex: number, oldName: string, newName: string) => void
  onDeleteCategory: (groupIndex: number, name: string, moveProductsTo?: string) => void
  onBackToStore: () => void
}

const sections: { id: AdminSection; icon: string; label: string }[] = [
  { id: 'overview', icon: '◫', label: 'Tổng quan' },
  { id: 'bookings', icon: '▤', label: 'Đơn thuê' },
  { id: 'inventory', icon: '◇', label: 'Sản phẩm & kho' },
  { id: 'categories', icon: '▦', label: 'Danh mục' },
  { id: 'finance', icon: '▥', label: 'Tài chính' },
  { id: 'makeup-calendar', icon: '▦', label: 'Lịch Makeup' },
  { id: 'makeup-services', icon: '✦', label: 'Dịch vụ Makeup' },
]

export default function AdminDashboardPage({
  bookings,
  onCreateRentalBooking,
  onUpdateRentalBooking,
  onDeleteRentalBooking,
  products,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  categories,
  makeupAppointments,
  makeupServices,
  onCreateMakeupAppointment,
  onUpdateMakeupAppointment,
  onDeleteMakeupAppointment,
  onCreateMakeupService,
  onUpdateMakeupService,
  onDeleteMakeupService,
  onRenameCategoryGroup,
  onDeleteCategoryGroup,
  onAddCategoryGroup,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onBackToStore,
}: AdminDashboardPageProps) {
  const [section, setSection] = useState<AdminSection>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [datePreset, setDatePreset] = useState<AdminDatePreset>('month')
  const [fromDate, setFromDate] = useState(`${TODAY_ISO.slice(0, 7)}-01`)
  const [toDate, setToDate] = useState(TODAY_ISO)

  const selectDatePreset = (preset: AdminDatePreset) => {
    setDatePreset(preset)
    if (preset === 'today') {
      setFromDate(TODAY_ISO)
      setToDate(TODAY_ISO)
    } else if (preset === 'month') {
      setFromDate(`${TODAY_ISO.slice(0, 7)}-01`)
      setToDate(TODAY_ISO)
    } else if (preset === 'year') {
      setFromDate(`${TODAY_ISO.slice(0, 4)}-01-01`)
      setToDate(TODAY_ISO)
    }
  }

  const updateDateRange = (field: 'from' | 'to', value: string) => {
    setDatePreset('custom')
    if (field === 'from') setFromDate(value)
    else setToDate(value)
  }

  return (
    <div className="admin-shell">
      {sidebarOpen && <button type="button" className="admin-sidebar-backdrop open" aria-label="Đóng menu quản trị" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-side${sidebarOpen ? ' open' : ''}`}>
        <div className="admin-logo">Phương <span>Anh</span></div>
        <div className="side-section-label">Quản lý cửa hàng</div>
        <nav aria-label="Điều hướng quản trị">
          {sections.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`side-link admin-nav-button${section === item.id ? ' active' : ''}`}
              onClick={() => { setSection(item.id); setSidebarOpen(false) }}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <a href="#store" onClick={(event) => { event.preventDefault(); onBackToStore() }}>← Quay lại cửa hàng</a>
        </div>
      </aside>

      <main className="admin-main">
        <button type="button" className="admin-hamburger btn btn-ghost" onClick={() => setSidebarOpen(true)} aria-label="Mở menu quản trị">
          ☰ Menu
        </button>
        <header className="admin-top">
          <div>
            <h1>{sections.find((item) => item.id === section)?.label}</h1>
            <p>Không gian quản lý cửa hàng Phương Anh</p>
          </div>
          <div className="admin-preview-tag">BẢN XEM TRƯỚC · DỮ LIỆU MẪU</div>
        </header>

        {section === 'overview' && (
          <>
            <AdminFinancePanel
              mode="overview"
              rentalBookings={bookings}
              makeupAppointments={makeupAppointments}
              makeupServices={makeupServices}
              datePreset={datePreset}
              fromDate={fromDate}
              toDate={toDate}
              onSelectPreset={selectDatePreset}
              onDateChange={updateDateRange}
              onOpenFinance={() => setSection('finance')}
            />

            <section className="panel admin-inventory-summary">
              <div className="panel-head"><h3>Tình trạng sản phẩm</h3><button type="button" className="admin-text-button" onClick={() => setSection('inventory')}>Quản lý kho →</button></div>
              <div className="admin-stock-list">
                {products.slice(0, 5).map((product) => {
                  const total = product.variants.reduce((sum, variant) => sum + variant.total, 0)
                  const available = product.variants.reduce((sum, variant) => sum + availableNow(variant), 0)
                  return <div className="admin-stock-row" key={product.id}><span>{product.name}</span><span>{available} / {total} sẵn sàng</span></div>
                })}
              </div>
            </section>
          </>
        )}

        {section === 'finance' && (
          <AdminFinancePanel
            mode="finance"
            rentalBookings={bookings}
            makeupAppointments={makeupAppointments}
            makeupServices={makeupServices}
            datePreset={datePreset}
            fromDate={fromDate}
            toDate={toDate}
            onSelectPreset={selectDatePreset}
            onDateChange={updateDateRange}
          />
        )}

        {section === 'makeup-calendar' && (
          <AdminMakeupCalendarPage
            appointments={makeupAppointments}
            services={makeupServices}
            onCreate={onCreateMakeupAppointment}
            onUpdate={onUpdateMakeupAppointment}
            onDelete={onDeleteMakeupAppointment}
          />
        )}

        {section === 'makeup-services' && (
          <AdminMakeupServicesPage
            services={makeupServices}
            onCreate={onCreateMakeupService}
            onUpdate={onUpdateMakeupService}
            onDelete={onDeleteMakeupService}
          />
        )}

        {section === 'bookings' && (
          <AdminRentalBookingsPage
            bookings={bookings}
            products={products}
            onCreate={onCreateRentalBooking}
            onUpdate={onUpdateRentalBooking}
            onDelete={onDeleteRentalBooking}
          />
        )}

        {section === 'inventory' && (
          <AdminProductsPage products={products} categories={categories} onCreate={onCreateProduct} onUpdate={onUpdateProduct} onDelete={onDeleteProduct} />
        )}

        {section === 'categories' && (
          <AdminCategoriesPage
            categories={categories}
            products={products}
            onRenameGroup={onRenameCategoryGroup}
            onDeleteGroup={onDeleteCategoryGroup}
            onAddGroup={onAddCategoryGroup}
            onAddCategory={onAddCategory}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
          />
        )}
      </main>
    </div>
  )
}
