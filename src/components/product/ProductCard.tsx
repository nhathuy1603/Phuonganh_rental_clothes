import type { Product } from '../../types/product'
import { money } from '../../utils/format'
import { availableNow } from '../../services/catalog-service'
import { preventAnd } from '../../utils/events'
import ProductVisual from '../common/ProductVisual'

interface ProductCardProps {
  product: Product
  badge?: string
  onOpen: (id: string) => void
}

/** Port của productCard() gốc. */
export default function ProductCard({ product, badge, onOpen }: ProductCardProps) {
  const colorEntries = Object.entries(product.colorHex)
  const visible = colorEntries.slice(0, 4)
  const extra = colorEntries.length - visible.length
  const minAvail = product.variants.reduce((a, v) => a + availableNow(v), 0)
  const open = preventAnd(() => onOpen(product.id))

  return (
    <div className="p-card reveal">
      <div className="p-figure" onClick={() => onOpen(product.id)} style={{ cursor: 'pointer' }}>
        <span className="brand-tag">Phương Anh</span>
        {product.videoUrl && <span className="video-pill">▶ Video</span>}
        {badge && <span className="rank-badge">🔥 {badge}</span>}
        <ProductVisual product={product} />
      </div>
      <div className="p-body">
        <div className="p-cat">{product.category}</div>
        <div className="p-name">{product.name}</div>
        <div className="p-meta">
          {product.variants.map((v) => v.size).join(' · ')} · còn {minAvail} sản phẩm
        </div>
        <div className="p-price">
          <div>
            <b>{money(product.pricePerDay)}</b>
            <span> /ngày</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={open}>
            Xem chi tiết
          </button>
        </div>
        <div className="swatches">
          {visible.map(([name, hex]) => (
            <span key={name} className="swatch-dot" style={{ background: hex }} title={name} />
          ))}
          {extra > 0 && <span className="swatch-more">+{extra}</span>}
        </div>
      </div>
    </div>
  )
}
