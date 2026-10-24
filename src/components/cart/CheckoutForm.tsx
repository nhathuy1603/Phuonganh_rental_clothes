import { useRef, useState, type ChangeEvent } from 'react'

interface CheckoutFormProps {
  defaultName?: string
  defaultPhone?: string
  onSubmit: (name: string, phone: string, depositType: 'Tiền mặt' | 'CCCD') => Promise<void>
}

/**
 * Port của renderCheckoutForm() + phần đọc input của submitCheckout() gốc.
 * Bản gốc đọc giá trị input qua document.getElementById(...).value lúc bấm nút;
 * ở đây dùng uncontrolled input (useRef) để giữ đúng hành vi đó mà không phải
 * validate theo từng phím gõ.
 */
export default function CheckoutForm({ defaultName = '', defaultPhone = '', onSubmit }: CheckoutFormProps) {
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const [depositType, setDepositType] = useState<'Tiền mặt' | 'CCCD'>('Tiền mặt')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const name = (nameRef.current?.value || '').trim()
    const phone = (phoneRef.current?.value || '').trim()
    setIsSubmitting(true)
    try {
      await onSubmit(name, phone, depositType)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="checkout-form" style={{ padding: 0 }}>
      <label>Họ và tên</label>
      <input type="text" ref={nameRef} placeholder="Nguyễn Văn A" defaultValue={defaultName} />
      <label>Số điện thoại</label>
      <input type="tel" ref={phoneRef} placeholder="09xxxxxxxx" defaultValue={defaultPhone} />
      <label>Hình thức đặt cọc</label>
      <select value={depositType} onChange={(e: ChangeEvent<HTMLSelectElement>) => setDepositType(e.target.value as 'Tiền mặt' | 'CCCD')}>
        <option value="Tiền mặt">Tiền mặt tại cửa hàng</option>
        <option value="CCCD">Giữ CCCD bản gốc</option>
      </select>
      <button className="btn btn-primary btn-block" style={{ marginTop: '6px' }} onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Đang gửi...' : 'Xác nhận đặt thuê'}
      </button>
    </div>
  )
}
