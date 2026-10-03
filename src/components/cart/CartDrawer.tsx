import { useState, type MouseEvent } from 'react'
import type { CartLine } from '../../types/cart'
import { money } from '../../utils/format'
import { fmtDate } from '../../utils/dates'
import { findProduct } from '../../services/catalog-service'
import ProductVisual from '../common/ProductVisual'
import CheckoutForm from './CheckoutForm'

interface CartDrawerProps {
  cart: CartLine[]
  onClose: () => void
  onRemoveLine: (lineId: string) => void
  onSubmitCheckout: (name: string, phone: string, depositType: 'Tiền mặt' | 'CCCD') => void
}

/** Port của renderCartDrawer() + toggleCart()/removeCartLine()/openCheckout() gốc. */
export default function CartDrawer({ cart, onClose, onRemoveLine, onSubmitCheckout }: CartDrawerProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const subtotal = cart.reduce((a, c) => a + c.lineTotal, 0)
  const depositTotal = cart.reduce((a, c) => a + c.deposit, 0)

  return (
    <div
      className="overlay"
      style={{ background: 'rgba(36,26,40,.35)' }}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="cart-drawer" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <div className="cart-head">
          <h3 className="serif" style={{ margin: 0, fontSize: '19px' }}>
            Giỏ hàng của bạn
          </h3>
          <button className="modal-close" style={{ position: 'static' }} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-note">
              Giỏ hàng đang trống.
              <br />
              Hãy chọn trang phục bạn thích nhé!
            </div>
          ) : (
            cart.map((c) => {
              const p = findProduct(c.productId)
              if (!p) return null
              return (
                <div className="cart-item" key={c.lineId}>
                  <div className="ci-figure">
                    <ProductVisual product={p} fallbackColor={p.colorHex[c.color]} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="ci-name">{p.name}</div>
                    <div className="ci-meta">
                      {c.size} · {c.color}
                      <br />
                      {fmtDate(c.pickupDate)} → {fmtDate(c.dueDate)} ({c.days} ngày)
                    </div>
                    <div className="ci-price">{money(c.lineTotal)}</div>
                  </div>
                  <button className="mini-x" onClick={() => onRemoveLine(c.lineId)} title="Xoá">
                    ✕
                  </button>
                </div>
              )
            })
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-foot">
            <div className="sum-row">
              <span>Tiền thuê</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="sum-row">
              <span>Tiền cọc (hoàn lại khi trả đồ)</span>
              <b>{money(depositTotal)}</b>
            </div>
            <div className="sum-total">
              <span>Tổng cần thanh toán</span>
              <span>{money(subtotal + depositTotal)}</span>
            </div>
            {checkoutOpen ? (
              <CheckoutForm onSubmit={onSubmitCheckout} />
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => setCheckoutOpen(true)}>
                Tiến hành đặt thuê
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
