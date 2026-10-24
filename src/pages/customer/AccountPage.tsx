import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, type CustomerProfile } from '../../services/api'
import type { MakeupCategory } from '../../types/catalog'
import type { MakeupAppointment } from '../../types/makeup-appointment'
import type { Product, RentalBooking } from '../../types/product'
import { fmtDate, TODAY_ISO } from '../../utils/dates'
import { money } from '../../utils/format'

interface AccountPageProps {
  customer: CustomerProfile
  products: Product[]
  makeupServices: MakeupCategory[]
  onBrowse: () => void
  onLogout: () => void
  onProfileUpdated: (customer: CustomerProfile) => void
}

/** Tài khoản Google chưa có SĐT: hỏi bổ sung để cửa hàng liên hệ và tự điền khi đặt. */
function PhoneForm({ onSaved }: { onSaved: (customer: CustomerProfile) => void }) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      onSaved(await api.put<CustomerProfile>('/api/customers/me/phone', { phone }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không lưu được số điện thoại.')
      setSaving(false)
    }
  }

  return (
    <form className="account-phone-form" onSubmit={handleSubmit}>
      <p><b>Bổ sung số điện thoại</b> để cửa hàng xác nhận đơn và tự điền khi bạn đặt đồ.</p>
      <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xxxxxxxx" aria-label="Số điện thoại" required />
      <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu số điện thoại'}</button>
      {error && <p className="customer-auth-error" role="alert">{error}</p>}
    </form>
  )
}

interface CustomerOrders {
  bookings: RentalBooking[]
  appointments: MakeupAppointment[]
}

function rentalBadge(booking: RentalBooking): { label: string; className: string } {
  if (booking.status === 'Đang thuê' && booking.dueDate < TODAY_ISO) return { label: 'Quá hạn trả', className: 'badge-late' }
  if (booking.status === 'Đang thuê') return { label: 'Đang thuê', className: 'badge-active' }
  if (booking.status === 'Đã trả') return { label: 'Đã trả', className: 'badge-done' }
  return { label: 'Đặt trước', className: 'badge-book' }
}

function appointmentBadge(status: MakeupAppointment['status']): string {
  if (status === 'Hoàn thành') return 'badge-done'
  if (status === 'Đã xác nhận') return 'badge-active'
  if (status === 'Đã hủy') return 'badge-late'
  return 'badge-book'
}

export default function AccountPage({ customer, products, makeupServices, onBrowse, onLogout, onProfileUpdated }: AccountPageProps) {
  const [orders, setOrders] = useState<CustomerOrders | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    api.get<CustomerOrders>('/api/customers/me/orders')
      .then((result) => { if (isMounted) setOrders(result) })
      .catch((loadError: unknown) => {
        // 401 đã đưa khách về màn đăng nhập.
        if (!isMounted || (loadError instanceof ApiError && loadError.status === 401)) return
        setError(loadError instanceof Error ? loadError.message : 'Không tải được đơn hàng.')
      })
    return () => {
      isMounted = false
    }
  }, [customer.id])

  const productName = (booking: RentalBooking) => {
    const product = products.find((item) => item.id === booking.productId)
    const variant = product?.variants.find((item) => item.id === booking.variantId)
    return { name: product?.name ?? 'Sản phẩm đã ngừng cho thuê', detail: variant ? `${variant.size} · ${variant.color}` : '' }
  }

  return (
    <section className="wrap account-page">
      <header className="account-head">
        <div>
          <div className="eyebrow-plain">Tài khoản của tôi</div>
          <h1 className="serif">Xin chào, {customer.name}</h1>
          <p>{[customer.phone, customer.email].filter(Boolean).join(' · ')}</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>Đăng xuất</button>
      </header>

      {!customer.phone && <PhoneForm onSaved={onProfileUpdated} />}

      {error && <p className="customer-auth-error" role="alert">{error}</p>}
      {!orders && !error && <p className="account-empty">Đang tải đơn hàng…</p>}

      {orders && (
        <>
          <h2 className="account-section-title">Đơn thuê đồ ({orders.bookings.length})</h2>
          {orders.bookings.length === 0 ? (
            <div className="account-empty">
              Chưa có đơn thuê nào. <a href="#catalog" onClick={(event) => { event.preventDefault(); onBrowse() }}>Xem bộ sưu tập →</a>
            </div>
          ) : (
            <div className="account-list">
              {orders.bookings.map((booking) => {
                const { name, detail } = productName(booking)
                const badge = rentalBadge(booking)
                return (
                  <article className="account-card" key={booking.id}>
                    <div className="account-card-top">
                      <div><b>{name}</b>{detail && <small>{detail}</small>}</div>
                      <span className={`badge ${badge.className}`}>{badge.label}</span>
                    </div>
                    <dl>
                      <div><dt>Ngày lấy</dt><dd>{fmtDate(booking.pickupDate)}</dd></div>
                      <div><dt>Ngày trả</dt><dd>{fmtDate(booking.dueDate)}</dd></div>
                      <div><dt>Tiền thuê</dt><dd>{money(booking.rentalTotal)} · {booking.days} ngày</dd></div>
                      <div><dt>Đặt cọc</dt><dd>{booking.depositType === 'CCCD' ? 'Giữ CCCD' : money(booking.depositAmount)}</dd></div>
                    </dl>
                    <small className="account-code">Mã đơn {booking.code}</small>
                  </article>
                )
              })}
            </div>
          )}

          <h2 className="account-section-title">Lịch makeup ({orders.appointments.length})</h2>
          {orders.appointments.length === 0 ? (
            <div className="account-empty">Chưa có lịch makeup nào.</div>
          ) : (
            <div className="account-list">
              {orders.appointments.map((appointment) => (
                <article className="account-card" key={appointment.id}>
                  <div className="account-card-top">
                    <div><b>{makeupServices.find((service) => service.id === appointment.serviceId)?.name ?? 'Dịch vụ makeup'}</b></div>
                    <span className={`badge ${appointmentBadge(appointment.status)}`}>{appointment.status}</span>
                  </div>
                  <dl>
                    <div><dt>Ngày hẹn</dt><dd>{fmtDate(appointment.date)} · {appointment.time}</dd></div>
                    <div><dt>Giá từ</dt><dd>{money(appointment.amount)}</dd></div>
                    {appointment.notes && <div className="account-card-wide"><dt>Ghi chú</dt><dd>{appointment.notes}</dd></div>}
                  </dl>
                </article>
              ))}
            </div>
          )}
          <p className="account-note">Chỉ hiển thị các đơn bạn đặt khi đã đăng nhập. Đơn đặt trước đó vui lòng liên hệ cửa hàng để tra cứu.</p>
        </>
      )}
    </section>
  )
}
