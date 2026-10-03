import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import type { MakeupCategory } from '../../types/catalog'
import type { MakeupAppointmentInput } from '../../types/makeup-appointment'
import { money } from '../../utils/format'

interface MakeupDetailPageProps {
  makeupCategories: MakeupCategory[]
  serviceId: string | null
  onBack: () => void
  onBook: (appointment: MakeupAppointmentInput) => Promise<void>
}

interface BookingFormState {
  name: string
  phone: string
  date: string
  time: string
  notes: string
}

export default function MakeupDetailPage({ makeupCategories, serviceId, onBack, onBook }: MakeupDetailPageProps) {
  const service = makeupCategories.find((item) => item.id === serviceId) ?? makeupCategories[0]
  const [selectedServiceId, setSelectedServiceId] = useState<string>(service?.id ?? makeupCategories[0]?.id ?? '')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [booking, setBooking] = useState<BookingFormState>({
    name: '',
    phone: '',
    date: '',
    time: '',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)

  const selectedService = makeupCategories.find((item) => item.id === selectedServiceId) ?? service

  useEffect(() => {
    if (service?.id) setSelectedServiceId(service.id)
    setShowBookingForm(false)
    setError(null)
    setBooking({ name: '', phone: '', date: '', time: '', notes: '' })
  }, [service?.id])

  if (!service) {
    return (
      <section className="wrap" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        <div className="eyebrow-plain">Dịch vụ trang điểm</div>
        <h2>Không tìm thấy dịch vụ</h2>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Quay lại danh sách
        </button>
      </section>
    )
  }

  const gallery = selectedService.images.length > 0 ? selectedService.images : Array.from({ length: 4 }, () => '')

  const handleBookingChange = (field: keyof BookingFormState) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBooking((prev) => ({ ...prev, [field]: e.target.value }))
    setError(null)
  }

  const handleSubmitBooking = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!booking.name.trim() || !booking.phone.trim() || !booking.date || !booking.time) {
      setError('Vui lòng điền đầy đủ họ tên, số điện thoại, ngày và giờ đặt lịch.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await onBook({
        customer: booking.name.trim(),
        phone: booking.phone.trim(),
        serviceId: selectedService.id,
        date: booking.date,
        time: booking.time,
        notes: booking.notes.trim(),
        amount: selectedService.priceFrom,
        depositAmount: 0,
        depositRefunded: false,
        lateFee: 0,
        paid: false,
        status: 'Chờ xác nhận',
      })
      setBooking({ name: '', phone: '', date: '', time: '', notes: '' })
      setShowBookingForm(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể ghi nhận lịch makeup.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="wrap" style={{ paddingTop: '34px', paddingBottom: '60px' }}>
      <div className="section-title reveal" style={{ marginBottom: '16px' }}>
        <div>
          <div className="eyebrow-plain">Dịch vụ trang điểm</div>
          <h2 style={{ margin: '6px 0 0' }}>{selectedService.name}</h2>
        </div>
        <button type="button" className="link-btn" onClick={onBack}>
          ← Quay lại
        </button>
      </div>

      <div className="makeup-detail-hero reveal">
        <div className="makeup-hero-figure">
          {gallery[0] ? <img src={gallery[0]} alt={selectedService.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '62px' }}>{selectedService.emoji}</span>}
        </div>

        <div>
          <div className="eyebrow-plain" style={{ marginBottom: '12px' }}>{selectedService.tagline}</div>

          <div className="makeup-info-row">
            <div>
              <span>Giá từ</span>
              <b>{money(selectedService.priceFrom)}</b>
            </div>
            <div>
              <span>Thời lượng</span>
              <b>{selectedService.duration}</b>
            </div>
          </div>

          <p style={{ color: 'var(--ink)', lineHeight: 1.7, marginBottom: '18px' }}>{selectedService.desc}</p>

          <ul className="makeup-highlights">
            {selectedService.highlights.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary makeup-book-btn" onClick={() => setShowBookingForm(true)}>
              Đặt lịch ngay
            </button>
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Xem tất cả dịch vụ
            </button>
          </div>
        </div>
      </div>

      {showBookingForm && (
        <div
          className="overlay"
          style={{ background: 'rgba(36,26,40,.45)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBookingForm(false)
          }}
        >
          <div
            className="modal"
            style={{
              maxWidth: '720px',
              borderRadius: '22px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(21, 15, 19, 0.28)',
            }}
          >
            <button type="button" className="modal-close" onClick={() => setShowBookingForm(false)}>
              ✕
            </button>

            <div
              style={{
                background: 'linear-gradient(135deg, var(--makeup-bg), var(--white))',
                padding: '20px 24px 18px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div className="eyebrow-plain" style={{ marginBottom: '6px' }}>Đăng ký đặt lịch</div>
              <h3 style={{ margin: 0, fontSize: '26px', lineHeight: 1.2 }}>Chọn dịch vụ & đặt lịch ngay</h3>
            </div>

            <form
              onSubmit={handleSubmitBooking}
              className="contact-form makeup-booking-form-shell"
              style={{
                background: 'var(--paper)',
                padding: '22px 24px 24px',
                borderRadius: 0,
                gap: '16px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '14px' }}>
                <div>
                  <label htmlFor="booking-service">Danh mục makeup</label>
                  <select
                    id="booking-service"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background: 'var(--white)',
                      color: 'var(--ink)',
                      fontSize: '14px',
                    }}
                  >
                    {makeupCategories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="booking-date">Ngày book</label>
                  <input
                    id="booking-date"
                    type="date"
                    value={booking.date}
                    onChange={handleBookingChange('date')}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="booking-time">Giờ book</label>
                  <input id="booking-time" type="time" value={booking.time} onChange={handleBookingChange('time')} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label htmlFor="booking-name">Tên khách hàng</label>
                  <input id="booking-name" type="text" value={booking.name} onChange={handleBookingChange('name')} placeholder="Nhập họ tên" required style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label htmlFor="booking-phone">Số điện thoại</label>
                <input id="booking-phone" type="tel" value={booking.phone} onChange={handleBookingChange('phone')} placeholder="Nhập số điện thoại" required style={{ width: '100%' }} />
              </div>

              <div>
                <label htmlFor="booking-notes">Ghi chú thêm</label>
                <textarea
                  id="booking-notes"
                  rows={4}
                  value={booking.notes}
                  onChange={handleBookingChange('notes')}
                  placeholder="Ví dụ: Muốn tone makeup tự nhiên, dịp cưới hỏi, hoặc cần làm tóc đi kèm..."
                  style={{ resize: 'vertical', width: '100%' }}
                />
              </div>

              {error && (
                <div className="makeup-booking-error" role="alert">{error}</div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBookingForm(false)}>
                  Huỷ
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="makeup-gallery" style={{ marginTop: '24px' }}>
        {gallery.map((image, index) => (
          <div key={`${selectedService.id}-${index}`} className="makeup-gallery-item">
            {image ? <img src={image} alt={`${selectedService.name} ${index + 1}`} /> : <div className="makeup-gallery-placeholder"><span>{selectedService.emoji}</span></div>}
          </div>
        ))}
      </div>

      <div className="makeup-cta-band reveal" style={{ marginTop: '18px' }}>
        <div>
          <div className="eyebrow-plain">Tư vấn nhanh</div>
          <h3 style={{ margin: '8px 0 0' }}>Bạn muốn có một looks đẹp ngay cho buổi sự kiện?</h3>
        </div>
        <button type="button" className="btn btn-primary makeup-book-btn" onClick={() => setShowBookingForm(true)}>
          Đặt lịch với Phương Anh
        </button>
      </div>
    </section>
  )
}
