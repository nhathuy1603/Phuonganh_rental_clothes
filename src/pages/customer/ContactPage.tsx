import { useState, type ChangeEvent, type FormEvent } from 'react'

interface ContactFormState {
  name: string
  email: string
  phone: string
  message: string
}

interface ContactPageProps {
  onSubmit: (values: ContactFormState) => void
}

const initialState: ContactFormState = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

export default function ContactPage({ onSubmit }: ContactPageProps) {
  const [form, setForm] = useState<ContactFormState>(initialState)

  const handleChange = (field: keyof ContactFormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(form)
    setForm(initialState)
  }

  return (
    <section className="wrap" style={{ paddingTop: '34px', paddingBottom: '80px' }}>
      <div className="section-title reveal" style={{ marginBottom: '22px' }}>
        <div>
          <div className="eyebrow-plain">Liên hệ</div>
          <h2 style={{ margin: '6px 0 0' }}>Gửi yêu cầu cho Phương Anh</h2>
        </div>
      </div>

      <div className="contact-grid reveal">
        <div>
          <div className="eyebrow-plain" style={{ marginBottom: '12px' }}>Thông tin</div>
          <div className="contact-info">
            <div><span>📞</span><b>Hotline:</b> 090 123 4567</div>
            <div><span>📍</span><b>Địa chỉ:</b> 447/27 Núi Thành, Phường Hòa Cường, Đà Nẵng</div>
            <div><span>🕒</span><b>Giờ làm việc:</b> 8:30 – 20:30, mỗi ngày</div>
            <div><span>✉️</span><b>Email:</b> hello@phuonganhrental.vn</div>
          </div>

          <div className="map-card">
            <iframe
              className="contact-map"
              src="https://maps.google.com/maps?q=447%2F27%20N%C3%BAi%20Th%C3%A0nh%2C%20Ph%C6%B0%E1%BB%9Dng%20H%C3%B2a%20C%C6%B0%E1%BB%9Dng%2C%20%C4%90%C3%A0%20N%E1%BA%B5ng&output=embed"
              title="Bản đồ Phương Anh Studio tại 447/27 Núi Thành, Đà Nẵng"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="map-caption">
              <b>Phương Anh Studio</b>
              <span>447/27 Núi Thành, Phường Hòa Cường, Đà Nẵng</span>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Họ tên</label>
          <input id="name" type="text" value={form.name} onChange={handleChange('name')} placeholder="Nhập họ tên" required />

          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={handleChange('email')} placeholder="Nhập email" required />

          <label htmlFor="phone">Số điện thoại</label>
          <input id="phone" type="tel" value={form.phone} onChange={handleChange('phone')} placeholder="Nhập số điện thoại" required />

          <label htmlFor="message">Yêu cầu</label>
          <textarea id="message" value={form.message} onChange={handleChange('message')} rows={5} placeholder="Ví dụ: Tôi cần thuê váy cưới cho 2 ngày, size M..." required />

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
            Gửi yêu cầu
          </button>
        </form>
      </div>
    </section>
  )
}
