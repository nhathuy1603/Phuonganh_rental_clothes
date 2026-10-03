import { useMemo, useState, type FormEvent } from 'react'
import type { Product, RentalBooking, RentalBookingInput, RentalStatus } from '../../types/product'
import { addDays, diffDays, rentalDays, TODAY_ISO } from '../../utils/dates'
import { money } from '../../utils/format'
import ProductVisual from '../../components/common/ProductVisual'

interface AdminRentalBookingsPageProps {
  bookings: RentalBooking[]
  products: Product[]
  onCreate: (booking: RentalBookingInput) => void
  onUpdate: (id: string, booking: RentalBookingInput) => void
  onDelete: (id: string) => void
}

const statusFilters: Array<'Tất cả' | RentalStatus> = ['Tất cả', 'Đặt trước', 'Đang thuê', 'Đã trả']

function formatDate(value: string | null) {
  return value ? value.split('-').reverse().join('/') : '—'
}

function statusClass(status: RentalStatus) {
  if (status === 'Đang thuê') return 'badge-active'
  if (status === 'Đã trả') return 'badge-done'
  return 'badge-book'
}

function createDraft(products: Product[]): RentalBookingInput {
  const product = products[0]
  const variant = product?.variants[0]
  const dueDate = addDays(TODAY_ISO, 1)
  return {
    customer: '',
    phone: '',
    productId: product?.id ?? '',
    variantId: variant?.id ?? '',
    orderDate: TODAY_ISO,
    pickupDate: TODAY_ISO,
    dueDate,
    returnDate: null,
    days: 1,
    pricePerDay: product?.pricePerDay ?? 0,
    rentalTotal: product?.pricePerDay ?? 0,
    depositType: 'Tiền mặt',
    depositAmount: product?.deposit ?? 0,
    depositRefunded: false,
    lateFee: 0,
    status: 'Đặt trước',
    paid: false,
  }
}

function getLateFee(status: RentalStatus, returnDate: string | null, dueDate: string) {
  return status === 'Đã trả' && returnDate && returnDate > dueDate ? diffDays(dueDate, returnDate) * 10000 : 0
}

export default function AdminRentalBookingsPage({ bookings, products, onCreate, onUpdate, onDelete }: AdminRentalBookingsPageProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Tất cả' | RentalStatus>('Tất cả')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<RentalBookingInput>(() => createDraft(products))

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const variantById = useMemo(() => new Map(products.flatMap((product) => product.variants.map((variant) => [variant.id, variant] as const))), [products])
  const sortedBookings = useMemo(() => [...bookings].sort((a, b) => b.orderDate.localeCompare(a.orderDate)), [bookings])
  const normalizedSearch = search.trim().toLocaleLowerCase('vi')
  const filteredBookings = sortedBookings.filter((booking) => {
    if (statusFilter !== 'Tất cả' && booking.status !== statusFilter) return false
    const product = productById.get(booking.productId)
    const variant = variantById.get(booking.variantId)
    return !normalizedSearch || [booking.code, booking.customer, booking.phone, product?.name ?? '', variant?.size ?? '', variant?.color ?? '']
      .some((value) => value.toLocaleLowerCase('vi').includes(normalizedSearch))
  })
  const selectedBooking = bookings.find((booking) => booking.id === detailId)
  const selectedProduct = productById.get(draft.productId)
  const selectedBookingProduct = selectedBooking ? productById.get(selectedBooking.productId) : undefined
  const selectedBookingVariant = selectedBooking ? variantById.get(selectedBooking.variantId) : undefined

  const openCreate = () => {
    setDetailId(null)
    setEditingId(null)
    setDraft(createDraft(products))
    setFormOpen(true)
  }

  const openEdit = (booking: RentalBooking) => {
    const { id: _id, code: _code, ...values } = booking
    setDetailId(null)
    setEditingId(booking.id)
    setDraft(values)
    setFormOpen(true)
  }

  const updateDraft = <K extends keyof RentalBookingInput>(field: K, value: RentalBookingInput[K]) => {
    setDraft((current) => {
      const next = { ...current, [field]: value }
      if (field === 'productId') {
        const product = products.find((item) => item.id === value)
        const variant = product?.variants[0]
        if (product && variant) {
          next.variantId = variant.id
          next.pricePerDay = product.pricePerDay
          next.depositAmount = product.deposit
        }
      }
      const datesAreValid = Boolean(next.pickupDate && next.dueDate && next.dueDate > next.pickupDate)
      next.days = datesAreValid ? rentalDays(next.pickupDate, next.dueDate) : 0
      next.rentalTotal = next.days * next.pricePerDay
      next.lateFee = getLateFee(next.status, next.returnDate, next.dueDate)
      return next
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.productId || !draft.variantId || !draft.customer.trim() || !draft.phone.trim()) return
    if (!draft.pickupDate || !draft.dueDate || draft.dueDate <= draft.pickupDate) return
    if (draft.status === 'Đã trả' && !draft.returnDate) return
    if (editingId) onUpdate(editingId, { ...draft, customer: draft.customer.trim(), phone: draft.phone.trim() })
    else onCreate({ ...draft, customer: draft.customer.trim(), phone: draft.phone.trim() })
    setFormOpen(false)
    setEditingId(null)
  }

  const handleDelete = (booking: RentalBooking) => {
    if (window.confirm(`Xóa đơn ${booking.code} của ${booking.customer}?`)) {
      onDelete(booking.id)
      setDetailId(null)
    }
  }

  const editingBooking = bookings.find((booking) => booking.id === editingId)

  return (
    <div className="admin-rental-manager">
      <section className="panel">
        <div className="panel-head admin-booking-head">
          <div><h3>Đơn thuê</h3><p>{filteredBookings.length} / {bookings.length} đơn</p></div>
          <button type="button" className="btn btn-primary" onClick={openCreate}>+ Thêm đơn thuê</button>
        </div>
        <div className="admin-rental-filters">
          <input className="admin-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã đơn, khách hàng, sản phẩm..." aria-label="Tìm đơn thuê" />
          <div className="filter-row" role="group" aria-label="Lọc theo trạng thái">
            {statusFilters.map((filter) => <button type="button" className={`chip-sm${statusFilter === filter ? ' active' : ''}`} aria-pressed={statusFilter === filter} key={filter} onClick={() => setStatusFilter(filter)}>{filter}</button>)}
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Ngày lấy</th><th>Ngày trả</th><th>Tiền thuê</th><th>Trạng thái</th><th aria-label="Xem chi tiết">Chi tiết</th></tr></thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td><b>{booking.code}</b></td>
                  <td>{booking.customer}<small className="admin-table-sub">{booking.phone}</small></td>
                  <td>{productById.get(booking.productId)?.name ?? 'Sản phẩm đã xóa'}</td>
                  <td>{formatDate(booking.pickupDate)}</td>
                  <td>{formatDate(booking.dueDate)}</td>
                  <td>{money(booking.rentalTotal)}</td>
                  <td><span className={`badge ${statusClass(booking.status)}`}>{booking.status}</span></td>
                  <td className="admin-rental-detail-cell"><button type="button" className="admin-icon-action" aria-label={`Xem chi tiết đơn ${booking.code}`} title="Xem chi tiết" onClick={() => setDetailId(booking.id)}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg></button></td>
                </tr>
              ))}
              {filteredBookings.length === 0 && <tr><td colSpan={8} className="admin-empty">Không tìm thấy đơn thuê phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {detailId && selectedBooking && (
        <div className="overlay admin-rental-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDetailId(null) }}>
          <section className="modal admin-rental-detail" role="dialog" aria-modal="true" aria-labelledby="rental-detail-title">
            <button type="button" className="modal-close" onClick={() => setDetailId(null)} aria-label="Đóng chi tiết">×</button>
            <header className="admin-rental-detail-head">
              <div className="admin-rental-heading-main">
                <span className="admin-rental-order-code">ĐƠN THUÊ · {selectedBooking.code}</span>
                <h2 id="rental-detail-title">{selectedBookingProduct?.name ?? 'Sản phẩm đã xóa'}</h2>
                <span className="admin-rental-variant">{selectedBookingVariant ? `${selectedBookingVariant.size} · ${selectedBookingVariant.color}` : 'Không có biến thể'}</span>
              </div>
              <span className={`badge ${statusClass(selectedBooking.status)}`}>{selectedBooking.status}</span>
            </header>
              <div className="admin-rental-detail-body">
            <div className="admin-rental-overview">
              <div className="admin-rental-product-visual">
                {selectedBookingProduct && <ProductVisual product={selectedBookingProduct} fallbackColor={selectedBookingVariant ? selectedBookingProduct.colorHex[selectedBookingVariant.color] : undefined} />}
              </div>
              <div className="admin-rental-overview-metrics">
                <div><span>Ngày lấy</span><b>{formatDate(selectedBooking.pickupDate)}</b></div>
                <div><span>Hẹn trả</span><b>{formatDate(selectedBooking.dueDate)}</b></div>
                <div><span>Thời gian thuê</span><b>{selectedBooking.days} ngày</b></div>
                <div className="is-total"><span>Tiền thuê</span><b>{money(selectedBooking.rentalTotal)}</b></div>
              </div>
            </div>
            <div className="admin-rental-detail-grid">
              <section>
                <h3>Khách hàng</h3>
                <dl><dt>Họ tên</dt><dd>{selectedBooking.customer}</dd><dt>Số điện thoại</dt><dd><a href={`tel:${selectedBooking.phone}`}>{selectedBooking.phone}</a></dd><dt>Ngày đặt đơn</dt><dd>{formatDate(selectedBooking.orderDate)}</dd></dl>
              </section>
              <section>
                <h3>Chi tiết thuê</h3>
                <dl><dt>Danh mục</dt><dd>{selectedBookingProduct?.category ?? '—'}</dd><dt>Đơn giá</dt><dd>{money(selectedBooking.pricePerDay)} / ngày</dd><dt>Ngày trả thực tế</dt><dd>{formatDate(selectedBooking.returnDate)}</dd></dl>
              </section>
              <section className="admin-rental-payment-section">
                <h3>Thanh toán & tiền cọc</h3>
                <dl><dt>Hình thức cọc</dt><dd>{selectedBooking.depositType}</dd><dt>Tiền cọc</dt><dd>{money(selectedBooking.depositAmount)}</dd><dt>Hoàn cọc</dt><dd><span className={`badge ${selectedBooking.depositRefunded ? 'badge-done' : 'badge-book'}`}>{selectedBooking.depositRefunded ? 'Đã hoàn' : 'Chưa hoàn'}</span></dd><dt>Thanh toán tiền thuê</dt><dd><span className={`badge ${selectedBooking.paid ? 'badge-done' : 'badge-book'}`}>{selectedBooking.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></dd><dt>Phí trễ hạn</dt><dd className={selectedBooking.lateFee > 0 ? 'admin-rental-late-fee' : ''}>{money(selectedBooking.lateFee)}</dd></dl>
              </section>
            </div>
            </div>
            <footer className="admin-rental-detail-actions">
              <button type="button" className="admin-delete-button" onClick={() => handleDelete(selectedBooking)}>Xóa đơn</button>
              <div><button type="button" className="btn btn-ghost" onClick={() => openEdit(selectedBooking)}>Sửa đơn</button><button type="button" className="btn btn-primary" onClick={() => setDetailId(null)}>Đóng</button></div>
            </footer>
          </section>
        </div>
      )}

      {formOpen && (
        <div className="overlay admin-rental-overlay" onClick={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}>
          <section className="modal admin-rental-form-modal" role="dialog" aria-modal="true" aria-labelledby="rental-form-title">
            <button type="button" className="modal-close" onClick={() => setFormOpen(false)} aria-label="Đóng form">×</button>
            <header className="admin-rental-detail-head"><div><span className="eyebrow-plain">Quản lý đơn thuê</span><h2 id="rental-form-title">{editingBooking ? `Sửa đơn ${editingBooking.code}` : 'Thêm đơn thuê'}</h2></div></header>
            <form className="admin-rental-form" onSubmit={handleSubmit}>
              <label>Họ tên khách<input value={draft.customer} onChange={(event) => updateDraft('customer', event.target.value)} autoComplete="name" required /></label>
              <label>Số điện thoại<input type="tel" value={draft.phone} onChange={(event) => updateDraft('phone', event.target.value)} autoComplete="tel" required /></label>
              <label className="admin-rental-wide">Sản phẩm<select value={draft.productId} onChange={(event) => updateDraft('productId', event.target.value)} required>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
              <label>Size / màu<select value={draft.variantId} onChange={(event) => updateDraft('variantId', event.target.value)} required>{selectedProduct?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.size} · {variant.color}</option>)}</select></label>
              <label>Trạng thái<select value={draft.status} onChange={(event) => updateDraft('status', event.target.value as RentalStatus)}>{statusFilters.filter((status): status is RentalStatus => status !== 'Tất cả').map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              <label>Ngày đặt<input type="date" value={draft.orderDate} onChange={(event) => updateDraft('orderDate', event.target.value)} required /></label>
              <label>Ngày lấy<input type="date" value={draft.pickupDate} onChange={(event) => updateDraft('pickupDate', event.target.value)} required /></label>
              <label>Ngày hẹn trả<input type="date" value={draft.dueDate} min={draft.pickupDate || undefined} onChange={(event) => updateDraft('dueDate', event.target.value)} required /></label>
              <label>Ngày trả thực tế<input type="date" value={draft.returnDate ?? ''} onChange={(event) => updateDraft('returnDate', event.target.value || null)} /></label>
              <label>Đơn giá / ngày<input type="number" min="0" step="1000" value={draft.pricePerDay} onChange={(event) => updateDraft('pricePerDay', Number(event.target.value))} required /></label>
              <label>Hình thức cọc<select value={draft.depositType} onChange={(event) => updateDraft('depositType', event.target.value as RentalBookingInput['depositType'])}><option value="Tiền mặt">Tiền mặt</option><option value="CCCD">Giữ CCCD</option></select></label>
              <label>Tiền cọc<input type="number" min="0" step="1000" value={draft.depositAmount} onChange={(event) => updateDraft('depositAmount', Number(event.target.value))} required /></label>
              <div className="admin-rental-total"><span>{draft.days} ngày thuê</span><b>{money(draft.rentalTotal)}</b><small>Phí trễ dự kiến: {money(draft.lateFee)}</small></div>
              <div className="admin-rental-flags"><label><input type="checkbox" checked={draft.paid} onChange={(event) => updateDraft('paid', event.target.checked)} /> Đã thanh toán</label><label><input type="checkbox" checked={draft.depositRefunded} onChange={(event) => updateDraft('depositRefunded', event.target.checked)} /> Đã hoàn cọc</label></div>
              <footer className="admin-rental-form-actions"><button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Huỷ</button><button type="submit" className="btn btn-primary">{editingId ? 'Lưu thay đổi' : 'Tạo đơn thuê'}</button></footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
