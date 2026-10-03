import { useMemo, useState, type FormEvent } from 'react'
import type { MakeupCategory } from '../../types/catalog'
import type { MakeupAppointment, MakeupAppointmentInput, MakeupAppointmentStatus } from '../../types/makeup-appointment'

interface AdminMakeupCalendarPageProps {
  appointments: MakeupAppointment[]
  services: MakeupCategory[]
  onCreate: (appointment: MakeupAppointmentInput) => Promise<void>
  onUpdate: (id: string, appointment: MakeupAppointmentInput) => Promise<void>
  onDelete: (id: string) => void
}

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const appointmentStatuses: MakeupAppointmentStatus[] = ['Chờ xác nhận', 'Đã xác nhận', 'Hoàn thành', 'Đã hủy']

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDate(value: string) {
  return value.split('-').reverse().join('/')
}

function formatMonth(value: Date) {
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1)))
}

function statusClass(status: MakeupAppointmentStatus) {
  if (status === 'Đã hủy') return 'badge-low'
  if (status === 'Hoàn thành') return 'badge-done'
  if (status === 'Đã xác nhận') return 'badge-active'
  return 'badge-book'
}

function blankAppointment(date: string, services: MakeupCategory[]): MakeupAppointmentInput {
  const service = services[0]
  return {
    customer: '',
    phone: '',
    serviceId: service?.id ?? '',
    date,
    time: '09:00',
    notes: '',
    amount: service?.priceFrom ?? 0,
    depositAmount: 0,
    depositRefunded: false,
    lateFee: 0,
    paid: false,
    status: 'Chờ xác nhận',
  }
}

export default function AdminMakeupCalendarPage({ appointments, services, onCreate, onUpdate, onDelete }: AdminMakeupCalendarPageProps) {
  const today = new Date()
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)))
  const [selectedDate, setSelectedDate] = useState(() => isoDate(today.getFullYear(), today.getMonth(), today.getDate()))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MakeupAppointmentInput>(() => blankAppointment(selectedDate, services))
  const [formOpen, setFormOpen] = useState(false)

  const year = visibleMonth.getUTCFullYear()
  const month = visibleMonth.getUTCMonth()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7
  const calendarCells = [...Array.from({ length: firstWeekday }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  const appointmentsByDate = useMemo(() => {
    const grouped = new Map<string, MakeupAppointment[]>()
    appointments.forEach((appointment) => {
      const dayAppointments = grouped.get(appointment.date) ?? []
      dayAppointments.push(appointment)
      grouped.set(appointment.date, dayAppointments)
    })
    grouped.forEach((dayAppointments) => dayAppointments.sort((a, b) => a.time.localeCompare(b.time)))
    return grouped
  }, [appointments])

  const selectedAppointments = appointmentsByDate.get(selectedDate) ?? []
  const serviceById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services])

  const moveMonth = (difference: number) => {
    setVisibleMonth((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + difference, 1)))
  }

  const goToToday = () => {
    const current = new Date()
    setVisibleMonth(new Date(Date.UTC(current.getFullYear(), current.getMonth(), 1)))
    setSelectedDate(isoDate(current.getFullYear(), current.getMonth(), current.getDate()))
  }

  const openCreateForm = () => {
    setEditingId(null)
    setForm(blankAppointment(selectedDate, services))
    setFormOpen(true)
  }

  const openEditForm = (appointment: MakeupAppointment) => {
    const { id: _id, ...values } = appointment
    setEditingId(appointment.id)
    setForm(values)
    setFormOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      if (editingId) await onUpdate(editingId, form)
      else await onCreate(form)
      const [year, month] = form.date.split('-').map(Number)
      setSelectedDate(form.date)
      setVisibleMonth(new Date(Date.UTC(year, month - 1, 1)))
      setFormOpen(false)
    } catch {
      // The app-level toast already reports the API error.
    }
  }

  const handleDelete = (appointment: MakeupAppointment) => {
    if (window.confirm(`Xoá lịch hẹn của ${appointment.customer} lúc ${appointment.time}?`)) onDelete(appointment.id)
  }

  const updateForm = <K extends keyof MakeupAppointmentInput>(field: K, value: MakeupAppointmentInput[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="admin-makeup-calendar-page">
      <section className="panel admin-calendar-panel">
        <div className="admin-calendar-toolbar">
          <div className="admin-calendar-month-nav">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveMonth(-1)} aria-label="Tháng trước">‹</button>
            <h2>{formatMonth(visibleMonth)}</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveMonth(1)} aria-label="Tháng sau">›</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={goToToday}>Hôm nay</button>
          </div>
          <button type="button" className="btn btn-primary makeup-book-btn" onClick={openCreateForm}>+ Thêm lịch makeup</button>
        </div>

        <div className="cal-grid admin-real-calendar" role="grid" aria-label={`Lịch makeup ${formatMonth(visibleMonth)}`}>
          {weekdays.map((day) => <div className="cal-dow" role="columnheader" key={day}>{day}</div>)}
          {calendarCells.map((day, index) => {
            if (!day) return <div className="cal-cell cal-cell-empty" role="gridcell" key={`empty-${index}`} />
            const date = isoDate(year, month, day)
            const dayAppointments = appointmentsByDate.get(date) ?? []
            const isToday = date === isoDate(today.getFullYear(), today.getMonth(), today.getDate())
            const tooltip = dayAppointments.map((appointment) => `${appointment.time} · ${appointment.customer} · ${serviceById.get(appointment.serviceId)?.name ?? 'Dịch vụ đã xoá'}`).join('\n')
            return (
              <button
                type="button"
                role="gridcell"
                key={date}
                title={tooltip || undefined}
                aria-label={`${formatDate(date)}${dayAppointments.length ? `, ${dayAppointments.length} lịch hẹn` : ''}`}
                aria-pressed={selectedDate === date}
                className={`cal-cell admin-cal-cell${dayAppointments.length ? ' has-bookings' : ''}${isToday ? ' is-today' : ''}${selectedDate === date ? ' is-selected' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <span className="cal-daynum">{day}</span>
                {dayAppointments.slice(0, 2).map((appointment) => (
                  <span className="cal-chip" key={appointment.id}>{appointment.time} {appointment.customer}</span>
                ))}
                {dayAppointments.length > 2 && <span className="cal-more">+{dayAppointments.length - 2} lịch</span>}
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel admin-makeup-day-detail">
        <div className="panel-head">
          <div><h3>Lịch ngày {formatDate(selectedDate)}</h3><p>{selectedAppointments.length} lịch hẹn</p></div>
          <button type="button" className="admin-text-button" onClick={openCreateForm}>+ Thêm lịch ngày này</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Dịch vụ</th><th>Giờ hẹn</th><th>Ghi chú</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {selectedAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td><b>{appointment.customer}</b></td>
                  <td>{appointment.phone}</td>
                  <td>{serviceById.get(appointment.serviceId)?.name ?? 'Dịch vụ đã xoá'}</td>
                  <td>{appointment.time}</td>
                  <td className="admin-makeup-notes">{appointment.notes || '—'}</td>
                  <td><span className={`badge ${statusClass(appointment.status)}`}>{appointment.status}</span></td>
                  <td><div className="admin-row-actions"><button type="button" className="admin-text-button" onClick={() => openEditForm(appointment)}>Sửa</button><button type="button" className="admin-delete-button" onClick={() => handleDelete(appointment)}>Xoá</button></div></td>
                </tr>
              ))}
              {selectedAppointments.length === 0 && <tr><td colSpan={7} className="admin-empty">Chưa có lịch makeup trong ngày này.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && (
        <div className="overlay admin-appointment-overlay" onClick={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}>
          <section className="modal admin-appointment-modal" role="dialog" aria-modal="true" aria-labelledby="admin-appointment-title">
            <button type="button" className="modal-close" onClick={() => setFormOpen(false)} aria-label="Đóng">×</button>
            <div className="admin-appointment-modal-head"><div className="eyebrow-plain">Lịch makeup</div><h2 id="admin-appointment-title">{editingId ? 'Sửa lịch hẹn' : 'Thêm lịch hẹn'}</h2></div>
            <form className="admin-appointment-form" onSubmit={handleSubmit}>
              <label>Khách hàng<input value={form.customer} onChange={(event) => updateForm('customer', event.target.value)} required /></label>
              <label>Số điện thoại<input type="tel" value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} required /></label>
              <label>Dịch vụ<select value={form.serviceId} onChange={(event) => updateForm('serviceId', event.target.value)} required disabled={services.length === 0}>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
              <label>Ngày hẹn<input type="date" value={form.date} onChange={(event) => updateForm('date', event.target.value)} required /></label>
              <label>Giờ hẹn<input type="time" value={form.time} onChange={(event) => updateForm('time', event.target.value)} required /></label>
              <label>Trạng thái<select value={form.status} onChange={(event) => updateForm('status', event.target.value as MakeupAppointmentStatus)}>{appointmentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label>Giá dịch vụ<input type="number" min="0" step="1000" value={form.amount} onChange={(event) => updateForm('amount', Number(event.target.value))} required /></label>
              <label>Tiền cọc<input type="number" min="0" step="1000" value={form.depositAmount} onChange={(event) => updateForm('depositAmount', Number(event.target.value))} required /></label>
              <label className="admin-appointment-notes">Ghi chú<textarea rows={3} value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} /></label>
              <div className="admin-appointment-flags">
                <label><input type="checkbox" checked={form.paid} onChange={(event) => updateForm('paid', event.target.checked)} /> Đã thanh toán</label>
                <label><input type="checkbox" checked={form.depositRefunded} onChange={(event) => updateForm('depositRefunded', event.target.checked)} /> Đã hoàn cọc</label>
              </div>
              <label>Phí trễ hạn<input type="number" min="0" step="1000" value={form.lateFee} onChange={(event) => updateForm('lateFee', Number(event.target.value))} required /></label>
              {services.length === 0 && <p className="admin-date-error">Hãy thêm dịch vụ makeup trước khi tạo lịch hẹn.</p>}
              <div className="admin-appointment-actions"><button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Huỷ</button><button type="submit" className="btn btn-primary makeup-book-btn" disabled={services.length === 0}>Lưu lịch hẹn</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
