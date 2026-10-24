import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import type { MakeupCategory } from '../../types/catalog'
import type { MakeupAppointment } from '../../types/makeup-appointment'
import type { Product, RentalBooking } from '../../types/product'
import { fmtDate } from '../../utils/dates'
import { money } from '../../utils/format'

interface AdminCustomer {
  id: string
  name: string
  phone: string | null
  email: string | null
  createdAt: string
  hasPassword: boolean
  hasGoogle: boolean
  bookingCount: number
  appointmentCount: number
}

interface AdminCustomersPageProps {
  bookings: RentalBooking[]
  makeupAppointments: MakeupAppointment[]
  products: Product[]
  makeupServices: MakeupCategory[]
}

interface ResetResult {
  customer: AdminCustomer
  phone: string
  temporaryPassword: string
}

export default function AdminCustomersPage({ bookings, makeupAppointments, products, makeupServices }: AdminCustomersPageProps) {
  const [customers, setCustomers] = useState<AdminCustomer[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [resetResult, setResetResult] = useState<ResetResult | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let isMounted = true
    api.get<AdminCustomer[]>('/api/admin/customers')
      .then((list) => { if (isMounted) setCustomers(list) })
      .catch((loadError: unknown) => { if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Không tải được danh sách khách.') })
    return () => {
      isMounted = false
    }
  }, [])

  const query = search.trim().toLocaleLowerCase('vi')
  const filtered = (customers ?? []).filter((customer) => !query || [customer.name, customer.phone ?? '', customer.email ?? '']
    .some((value) => value.toLocaleLowerCase('vi').includes(query)))
  const detail = customers?.find((customer) => customer.id === detailId)
  const detailBookings = detail ? bookings.filter((booking) => booking.customerId === detail.id) : []
  const detailAppointments = detail ? makeupAppointments.filter((appointment) => appointment.customerId === detail.id) : []

  const resetPassword = async (customer: AdminCustomer) => {
    if (!window.confirm(`Đặt lại mật khẩu cho “${customer.name}”? Mật khẩu cũ sẽ không dùng được nữa.`)) return
    setError(null)
    try {
      const result = await api.post<{ temporaryPassword: string; phone: string }>(`/api/admin/customers/${customer.id}/reset-password`, {})
      setCopied(false)
      setResetResult({ customer, ...result })
      setCustomers((current) => current?.map((item) => item.id === customer.id ? { ...item, hasPassword: true } : item) ?? null)
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Không đặt lại được mật khẩu.')
    }
  }

  const zaloMessage = resetResult
    ? `Phương Anh gửi bạn mật khẩu mới để đăng nhập: SĐT ${resetResult.phone}, mật khẩu ${resetResult.temporaryPassword}.`
    : ''

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(zaloMessage)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const productName = (booking: RentalBooking) => products.find((product) => product.id === booking.productId)?.name ?? 'Sản phẩm đã xoá'

  return (
    <div className="admin-customers">
      <section className="panel">
        <div className="panel-head admin-booking-head">
          <div>
            <h3>Tài khoản khách hàng</h3>
            <p>{customers ? `${customers.length} tài khoản. Đơn của khách vãng lai không nằm ở đây.` : 'Đang tải…'}</p>
          </div>
          <input className="admin-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, SĐT, email..." aria-label="Tìm khách hàng" />
        </div>
        {error && <p className="admin-date-error" role="alert">{error}</p>}
        <div className="table-scroll">
          <table>
            <thead><tr><th>Khách hàng</th><th>Đăng nhập bằng</th><th>Đơn thuê</th><th>Lịch makeup</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td><b>{customer.name}</b><small className="admin-table-sub">{[customer.phone ?? 'Chưa có SĐT', customer.email].filter(Boolean).join(' · ')}</small></td>
                  <td>
                    <div className="admin-customer-methods">
                      {customer.hasPassword && <span className="badge badge-book">SĐT</span>}
                      {customer.hasGoogle && <span className="badge badge-active">Google</span>}
                    </div>
                  </td>
                  <td>{customer.bookingCount}</td>
                  <td>{customer.appointmentCount}</td>
                  <td>{fmtDate(customer.createdAt.slice(0, 10))}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-text-button" onClick={() => setDetailId(customer.id)}>Xem đơn</button>
                      <button type="button" className="admin-text-button" onClick={() => void resetPassword(customer)}>Đặt lại mật khẩu</button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers && filtered.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">{customers.length === 0 ? 'Chưa có khách nào tạo tài khoản.' : 'Không tìm thấy khách phù hợp.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {resetResult && (
        <div className="overlay admin-appointment-overlay" onClick={(event) => { if (event.target === event.currentTarget) setResetResult(null) }}>
          <section className="modal admin-appointment-modal" role="dialog" aria-modal="true" aria-labelledby="admin-reset-title">
            <button type="button" className="modal-close" onClick={() => setResetResult(null)} aria-label="Đóng">×</button>
            <div className="admin-appointment-modal-head"><div className="eyebrow-plain">Đã đặt lại mật khẩu</div><h2 id="admin-reset-title">{resetResult.customer.name}</h2></div>
            <div className="admin-customer-reset">
              <p>Gửi thông tin này cho khách qua Zalo. Mật khẩu chỉ hiện <b>một lần</b>; nếu đóng mà chưa gửi, hãy đặt lại lần nữa.</p>
              <dl>
                <dt>Số điện thoại</dt><dd>{resetResult.phone}</dd>
                <dt>Mật khẩu mới</dt><dd className="admin-customer-password">{resetResult.temporaryPassword}</dd>
              </dl>
              <p className="admin-customer-message">{zaloMessage}</p>
              <div className="admin-appointment-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setResetResult(null)}>Đóng</button>
                <button type="button" className="btn btn-primary" onClick={() => void copyMessage()}>{copied ? 'Đã copy ✓' : 'Copy tin nhắn'}</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {detail && (
        <div className="overlay admin-appointment-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDetailId(null) }}>
          <section className="modal admin-appointment-modal" role="dialog" aria-modal="true" aria-labelledby="admin-customer-title">
            <button type="button" className="modal-close" onClick={() => setDetailId(null)} aria-label="Đóng">×</button>
            <div className="admin-appointment-modal-head"><div className="eyebrow-plain">Đơn của khách</div><h2 id="admin-customer-title">{detail.name}</h2></div>
            <div className="admin-customer-orders">
              <h3>Đơn thuê ({detailBookings.length})</h3>
              {detailBookings.length === 0 ? <p className="admin-empty">Chưa có đơn thuê.</p> : (
                <ul>
                  {detailBookings.map((booking) => (
                    <li key={booking.id}>
                      <b>{productName(booking)}</b>
                      <span>{fmtDate(booking.pickupDate)} → {fmtDate(booking.dueDate)} · {money(booking.rentalTotal)}</span>
                      <span className="badge badge-book">{booking.status}</span>
                    </li>
                  ))}
                </ul>
              )}
              <h3>Lịch makeup ({detailAppointments.length})</h3>
              {detailAppointments.length === 0 ? <p className="admin-empty">Chưa có lịch makeup.</p> : (
                <ul>
                  {detailAppointments.map((appointment) => (
                    <li key={appointment.id}>
                      <b>{makeupServices.find((service) => service.id === appointment.serviceId)?.name ?? 'Dịch vụ makeup'}</b>
                      <span>{fmtDate(appointment.date)} · {appointment.time} · {money(appointment.amount)}</span>
                      <span className="badge badge-book">{appointment.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
