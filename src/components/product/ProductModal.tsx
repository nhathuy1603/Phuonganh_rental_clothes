import { useEffect, useState, type ChangeEvent, type MouseEvent } from 'react'
import type { Product } from '../../types/product'
import type { CartLine } from '../../types/cart'
import type { RentalBooking } from '../../types/product'
import { money } from '../../utils/format'
import { rentalDays, TODAY_ISO } from '../../utils/dates'
import { availableForRange } from '../../services/booking-service'
import ProductVisual from '../common/ProductVisual'

interface ProductModalProps {
  product: Product
  products: Product[]
  bookings: RentalBooking[]
  onClose: () => void
  onAddToCart: (line: CartLine) => void
}

interface Selection {
  size: string
  color: string
  pickupDate: string
  dueDate: string
}

/** Port của renderProductModal() + openProduct()/selectVariantOpt()/setModalDate()/addToCart() gốc. */
export default function ProductModal({ product, products, bookings, onClose, onAddToCart }: ProductModalProps) {
  const [sel, setSel] = useState<Selection>({
    size: product.variants[0].size,
    color: product.variants[0].color,
    pickupDate: '',
    dueDate: '',
  })

  // Mỗi khi mở SẢN PHẨM KHÁC (đổi product.id), reset lựa chọn về mặc định — giống openProduct() gốc
  useEffect(() => {
    setSel({
      size: product.variants[0].size,
      color: product.variants[0].color,
      pickupDate: '',
      dueDate: '',
    })
  }, [product.id])

  const variant =
    product.variants.find((v) => v.size === sel.size && v.color === sel.color) ?? product.variants[0]
  const sizes = [...new Set(product.variants.map((v) => v.size))]
  const colors = [...new Set(product.variants.map((v) => v.color))]

  const { pickupDate, dueDate } = sel
  const days = pickupDate && dueDate && dueDate > pickupDate ? rentalDays(pickupDate, dueDate) : 0
  const total = days * product.pricePerDay
  const avail =
    pickupDate && dueDate && dueDate > pickupDate
      ? availableForRange(bookings, product.id, variant.id, pickupDate, dueDate, undefined, products)
      : null
  const canAdd = days > 0 && !!avail && avail > 0

  const availabilityBox = () => {
    if (!pickupDate || !dueDate) {
      return <div className="avail-box avail-idle">Chọn ngày lấy và ngày trả để kiểm tra tình trạng còn hàng.</div>
    }
    if (dueDate <= pickupDate) {
      return <div className="avail-box avail-bad">Ngày trả phải sau ngày lấy.</div>
    }
    if (avail && avail > 0) {
      return (
        <div className="avail-box avail-ok">
          ✓ Còn hàng — {avail} sản phẩm khả dụng trong khoảng ngày này.
        </div>
      )
    }
    return (
      <div className="avail-box avail-bad">
        ✕ Hết hàng cho khoảng ngày đã chọn. Vui lòng đổi ngày hoặc chọn màu/size khác.
      </div>
    )
  }

  const handleAddToCart = () => {
    onAddToCart({
      lineId: 'c' + Date.now() + Math.random().toString(16).slice(2),
      productId: product.id,
      variantId: variant.id,
      size: variant.size,
      color: variant.color,
      pickupDate,
      dueDate,
      days,
      pricePerDay: product.pricePerDay,
      lineTotal: days * product.pricePerDay,
      deposit: product.deposit,
    })
  }

  return (
    <div
      className="overlay"
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <div className="pd-grid">
          <div className="pd-figure">
            <ProductVisual product={product} fallbackColor={product.colorHex[variant.color]} />
          </div>
          <div className="pd-body">
            <div className="pd-cat">{product.category}</div>
            <h2 className="pd-name">{product.name}</h2>
            <p className="pd-desc">{product.desc}</p>
            {product.videoUrl && (
              <a href={product.videoUrl} target="_blank" rel="noopener" className="video-link">
                ▶ Xem video giới thiệu
              </a>
            )}
            <div className="pd-price-row">
              <b>{money(product.pricePerDay)}</b>
              <span>/ ngày thuê</span>
            </div>

            <div className="field-label">Size</div>
            <div className="opt-row">
              {sizes.map((s) => (
                <button
                  key={s}
                  className={`opt-btn ${s === sel.size ? 'active' : ''}`}
                  onClick={() => setSel({ ...sel, size: s })}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="field-label">Màu sắc</div>
            <div className="opt-row">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`opt-btn color-btn ${c === sel.color ? 'active' : ''}`}
                  onClick={() => setSel({ ...sel, color: c })}
                >
                  <i style={{ background: product.colorHex[c] || '#999' }} />
                  {c}
                </button>
              ))}
            </div>

            <div className="field-label">Thời gian thuê</div>
            <div className="date-row">
              <label>
                <span className="dl">Ngày lấy</span>
                <input
                  type="date"
                  value={pickupDate}
                  min={TODAY_ISO}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSel({ ...sel, pickupDate: e.target.value })}
                />
              </label>
              <label>
                <span className="dl">Ngày trả</span>
                <input
                  type="date"
                  value={dueDate}
                  min={pickupDate || TODAY_ISO}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSel({ ...sel, dueDate: e.target.value })}
                />
              </label>
            </div>
            {availabilityBox()}
            {days > 0 && (
              <div className="sum-row" style={{ marginTop: '14px' }}>
                <span>
                  {days} ngày × {money(product.pricePerDay)}
                </span>
                <b>{money(total)}</b>
              </div>
            )}

            <div className="pd-actions">
              <button className="btn btn-primary btn-block" disabled={!canAdd} onClick={handleAddToCart}>
                Thêm vào giỏ
              </button>
            </div>
            <div className="deposit-note">🔒 {product.depositNote}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
