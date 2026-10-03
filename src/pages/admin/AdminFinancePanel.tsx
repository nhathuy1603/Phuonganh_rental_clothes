import { useMemo } from 'react'
import type { MakeupCategory } from '../../types/catalog'
import type { MakeupAppointment } from '../../types/makeup-appointment'
import type { RentalBooking } from '../../types/product'
import { money } from '../../utils/format'

export type AdminDatePreset = 'today' | 'month' | 'year' | 'custom'
export type AdminFinanceMode = 'overview' | 'finance'

interface AdminFinancePanelProps {
  mode: AdminFinanceMode
  rentalBookings: RentalBooking[]
  makeupAppointments: MakeupAppointment[]
  makeupServices: MakeupCategory[]
  datePreset: AdminDatePreset
  fromDate: string
  toDate: string
  onSelectPreset: (preset: AdminDatePreset) => void
  onDateChange: (field: 'from' | 'to', value: string) => void
  onOpenFinance?: () => void
}

const presets: { id: AdminDatePreset; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'month', label: 'Tháng này' },
  { id: 'year', label: 'Năm nay' },
  { id: 'custom', label: 'Tùy chỉnh' },
]

function utcDay(value: string) {
  return Date.parse(`${value}T00:00:00Z`)
}

function nextDay(value: string) {
  return new Date(utcDay(value) + 86400000).toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return value.split('-').reverse().join('/')
}

function formatMonth(value: string) {
  const [year, month] = value.split('-')
  return `${month}/${year}`
}

function dateRangeText(fromDate: string, toDate: string) {
  return `${formatDate(fromDate)} – ${formatDate(toDate)}`
}

function dateRangeMetrics<T>(items: T[], revenueOrders: T[], revenueFor: (item: T) => number, depositFor: (item: T) => number, lateFeeFor: (item: T) => number) {
  return {
    revenue: revenueOrders.reduce((total, item) => total + revenueFor(item), 0),
    revenueCount: revenueOrders.length,
    lateFees: items.reduce((total, item) => total + lateFeeFor(item), 0),
    deposits: items.reduce((total, item) => total + depositFor(item), 0),
  }
}

export default function AdminFinancePanel({
  mode,
  rentalBookings,
  makeupAppointments,
  makeupServices,
  datePreset,
  fromDate,
  toDate,
  onSelectPreset,
  onDateChange,
  onOpenFinance,
}: AdminFinancePanelProps) {
  const validRange = Boolean(fromDate && toDate && fromDate <= toDate)
  const rentalInRange = useMemo(
    () => validRange ? rentalBookings.filter((booking) => booking.pickupDate >= fromDate && booking.pickupDate <= toDate) : [],
    [rentalBookings, validRange, fromDate, toDate],
  )
  const makeupInRange = useMemo(
    () => validRange ? makeupAppointments.filter((appointment) => appointment.date >= fromDate && appointment.date <= toDate) : [],
    [makeupAppointments, validRange, fromDate, toDate],
  )
  const rentalRevenueOrders = rentalInRange.filter((booking) => booking.paid)
  const makeupRevenueOrders = makeupInRange.filter((appointment) => appointment.status !== 'Đã hủy')
  const rentalMetrics = dateRangeMetrics(rentalInRange, rentalRevenueOrders, (booking) => booking.rentalTotal, (booking) => booking.depositAmount, (booking) => booking.lateFee)
  const makeupMetrics = dateRangeMetrics(makeupInRange, makeupRevenueOrders, (appointment) => appointment.amount, (appointment) => appointment.depositAmount, (appointment) => appointment.lateFee)
  const serviceById = useMemo(() => new Map(makeupServices.map((service) => [service.id, service])), [makeupServices])

  const chartBuckets = useMemo(() => {
    if (!validRange) return []
    const dayCount = Math.round((utcDay(toDate) - utcDay(fromDate)) / 86400000) + 1
    const daily = dayCount <= 31
    const buckets = new Map<string, { label: string; title: string; rental: number; makeup: number }>()

    if (daily) {
      for (let date = fromDate; date <= toDate; date = nextDay(date)) {
        buckets.set(date, { label: date.slice(8, 10), title: formatDate(date), rental: 0, makeup: 0 })
      }
    } else {
      const lastMonth = toDate.slice(0, 7)
      for (let month = `${fromDate.slice(0, 7)}-01`; month.slice(0, 7) <= lastMonth;) {
        const key = month.slice(0, 7)
        buckets.set(key, { label: formatMonth(key), title: formatMonth(key), rental: 0, makeup: 0 })
        const [year, monthNumber] = key.split('-').map(Number)
        month = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10)
      }
    }

    rentalRevenueOrders.forEach((booking) => {
      const key = daily ? booking.pickupDate : booking.pickupDate.slice(0, 7)
      const bucket = buckets.get(key)
      if (bucket) bucket.rental += booking.rentalTotal
    })
    makeupRevenueOrders.forEach((appointment) => {
      const key = daily ? appointment.date : appointment.date.slice(0, 7)
      const bucket = buckets.get(key)
      if (bucket) bucket.makeup += appointment.amount
    })

    return [...buckets.entries()].map(([key, bucket]) => ({ key, ...bucket }))
  }, [validRange, fromDate, toDate, rentalRevenueOrders, makeupRevenueOrders])

  const chartMax = Math.max(0, ...chartBuckets.map((bucket) => Math.max(bucket.rental, bucket.makeup)))
  const chartIsDaily = validRange && Math.round((utcDay(toDate) - utcDay(fromDate)) / 86400000) + 1 <= 31

  const renderMetrics = (title: string, icon: string, metrics: typeof rentalMetrics, makeup = false) => (
    <section className={`admin-finance-segment${makeup ? ' is-makeup' : ''}`}>
      <h3>{icon} {title}</h3>
      <div className="admin-segment-metrics">
        <article className="stat-card"><span>Doanh thu</span><b>{money(metrics.revenue)}</b><small>{makeup ? 'Lịch chưa bị huỷ' : 'Đơn đã thanh toán'}</small></article>
        <article className="stat-card"><span>Đơn ghi nhận doanh thu</span><b>{metrics.revenueCount}</b><small>{dateRangeText(fromDate, toDate)}</small></article>
        <article className="stat-card"><span>Phí trễ hạn</span><b>{money(metrics.lateFees)}</b><small>Phát sinh trong kỳ</small></article>
        <article className="stat-card"><span>Tổng tiền cọc</span><b>{money(metrics.deposits)}</b><small>Theo ngày nhận/lịch hẹn</small></article>
      </div>
    </section>
  )

  return (
    <div className={`admin-finance-content is-${mode}`}>
      <section className="panel admin-date-filter" aria-label="Bộ lọc khoảng thời gian">
        <div className="panel-head">
          <div><h3>Khoảng thời gian</h3><p>Thuê đồ lọc theo ngày lấy đồ; Makeup lọc theo ngày hẹn.</p></div>
          <div className="filter-row" role="group" aria-label="Lọc nhanh theo thời gian">
            {presets.map((preset) => (
              <button type="button" key={preset.id} className={`chip-sm${datePreset === preset.id ? ' active' : ''}`} aria-pressed={datePreset === preset.id} onClick={() => onSelectPreset(preset.id)}>{preset.label}</button>
            ))}
          </div>
        </div>
        <div className="admin-date-fields">
          <label>Từ ngày<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => onDateChange('from', event.target.value)} /></label>
          <label>Đến ngày<input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => onDateChange('to', event.target.value)} /></label>
        </div>
        {!validRange && <p className="admin-date-error" role="alert">Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</p>}
      </section>

      {mode === 'overview' ? (
        <>
          <div className="admin-overview-segments">
            <article className="admin-overview-segment"><span>👗 Thuê đồ</span><b>{money(rentalMetrics.revenue)}</b><small>{rentalMetrics.revenueCount} đơn đã thanh toán trong kỳ</small></article>
            <article className="admin-overview-segment is-makeup"><span>💄 Makeup</span><b>{money(makeupMetrics.revenue)}</b><small>{makeupMetrics.revenueCount} lịch không bị huỷ trong kỳ</small></article>
          </div>
          <section className="panel admin-revenue-panel">
            <div className="panel-head"><div><h3>Doanh thu theo {chartIsDaily ? 'ngày' : 'tháng'}</h3><p>So sánh doanh thu thuê đồ và Makeup trong cùng khoảng ngày.</p></div><button type="button" className="admin-text-button" onClick={onOpenFinance}>Chi tiết tài chính →</button></div>
            <div className="admin-chart-scroll">
              <div className="admin-revenue-chart admin-dual-chart" role="img" aria-label="Biểu đồ cột doanh thu thuê đồ và makeup">
                {chartBuckets.map((bucket) => (
                  <div className="admin-chart-column admin-dual-column" key={bucket.key} title={`${bucket.title} · Thuê đồ ${money(bucket.rental)} · Makeup ${money(bucket.makeup)}`}>
                    <div className="admin-dual-track">
                      <span className="admin-chart-bar admin-bar-rental" style={{ height: `${chartMax ? Math.max(bucket.rental ? 3 : 1, bucket.rental / chartMax * 100) : 1}%` }} />
                      <span className="admin-chart-bar admin-bar-makeup" style={{ height: `${chartMax ? Math.max(bucket.makeup ? 3 : 1, bucket.makeup / chartMax * 100) : 1}%` }} />
                    </div>
                    <small>{bucket.label}</small>
                  </div>
                ))}
                {validRange && chartBuckets.length > 0 && chartMax === 0 && <p className="admin-chart-empty">Chưa có doanh thu trong khoảng này.</p>}
              </div>
            </div>
            <div className="admin-chart-legend"><span><i className="admin-legend-rental" />Thuê đồ</span><span><i className="admin-legend-makeup" />Makeup</span></div>
          </section>
        </>
      ) : (
        <>
          {renderMetrics('Thuê đồ', '👗', rentalMetrics)}
          {renderMetrics('Makeup', '💄', makeupMetrics, true)}
          <section className="panel admin-revenue-panel">
            <div className="panel-head"><div><h3>Doanh thu theo {chartIsDaily ? 'ngày' : 'tháng'}</h3><p>Cột xanh: thuê đồ · Cột hồng: Makeup</p></div></div>
            <div className="admin-chart-scroll">
              <div className="admin-revenue-chart admin-dual-chart" role="img" aria-label="Biểu đồ cột doanh thu thuê đồ và makeup">
                {chartBuckets.map((bucket) => (
                  <div className="admin-chart-column admin-dual-column" key={bucket.key} title={`${bucket.title} · Thuê đồ ${money(bucket.rental)} · Makeup ${money(bucket.makeup)}`}>
                    <div className="admin-dual-track">
                      <span className="admin-chart-bar admin-bar-rental" style={{ height: `${chartMax ? Math.max(bucket.rental ? 3 : 1, bucket.rental / chartMax * 100) : 1}%` }} />
                      <span className="admin-chart-bar admin-bar-makeup" style={{ height: `${chartMax ? Math.max(bucket.makeup ? 3 : 1, bucket.makeup / chartMax * 100) : 1}%` }} />
                    </div>
                    <small>{bucket.label}</small>
                  </div>
                ))}
                {validRange && chartBuckets.length > 0 && chartMax === 0 && <p className="admin-chart-empty">Chưa có doanh thu trong khoảng này.</p>}
              </div>
            </div>
            <div className="admin-chart-legend"><span><i className="admin-legend-rental" />Thuê đồ</span><span><i className="admin-legend-makeup" />Makeup</span></div>
          </section>

          <section className="panel">
            <div className="panel-head"><div><h3>👗 Cọc & thanh toán thuê đồ</h3><p>{rentalInRange.length} đơn theo ngày lấy đồ</p></div></div>
            <div className="table-scroll">
              <table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày lấy</th><th>Tiền cọc</th><th>Hoàn cọc</th><th>Tiền thuê</th><th>Thanh toán</th><th>Phí trễ</th></tr></thead>
                <tbody>{rentalInRange.map((booking) => <tr key={booking.id}><td><b>{booking.code}</b></td><td>{booking.customer}<small className="admin-table-sub">{booking.phone}</small></td><td>{formatDate(booking.pickupDate)}</td><td>{money(booking.depositAmount)}<small className="admin-table-sub">{booking.depositType}</small></td><td><span className={`badge ${booking.depositRefunded ? 'badge-done' : 'badge-book'}`}>{booking.depositRefunded ? 'Đã hoàn' : 'Chưa hoàn'}</span></td><td>{money(booking.rentalTotal)}</td><td><span className={`badge ${booking.paid ? 'badge-done' : 'badge-book'}`}>{booking.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></td><td>{money(booking.lateFee)}</td></tr>)}
                  {rentalInRange.length === 0 && <tr><td colSpan={8} className="admin-empty">Không có đơn thuê trong khoảng này.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><div><h3>💄 Cọc & thanh toán Makeup</h3><p>{makeupInRange.length} lịch theo ngày hẹn</p></div></div>
            <div className="table-scroll">
              <table><thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Ngày hẹn</th><th>Giờ</th><th>Dịch vụ</th><th>Tiền cọc</th><th>Giá dịch vụ</th><th>Thanh toán</th><th>Trạng thái</th></tr></thead>
                <tbody>{makeupInRange.map((appointment) => <tr key={appointment.id}><td><b>{appointment.customer}</b></td><td>{appointment.phone}</td><td>{formatDate(appointment.date)}</td><td>{appointment.time}</td><td>{serviceById.get(appointment.serviceId)?.name ?? 'Dịch vụ đã xoá'}</td><td>{money(appointment.depositAmount)}<small className="admin-table-sub">{appointment.depositRefunded ? 'Đã hoàn' : 'Chưa hoàn'}</small></td><td>{money(appointment.amount)}</td><td><span className={`badge ${appointment.paid ? 'badge-done' : 'badge-book'}`}>{appointment.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></td><td><span className={`badge ${appointment.status === 'Đã hủy' ? 'badge-low' : appointment.status === 'Hoàn thành' ? 'badge-done' : 'badge-active'}`}>{appointment.status}</span></td></tr>)}
                  {makeupInRange.length === 0 && <tr><td colSpan={9} className="admin-empty">Không có lịch Makeup trong khoảng này.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
