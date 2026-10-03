import type { Product } from '../../types/product'
import GarmentIcon from './GarmentIcon'

interface ProductVisualProps {
  product: Product
  fallbackColor?: string
}

/** Port của productVisualHtml() gốc — ưu tiên ảnh đã upload, nếu chưa có thì vẽ icon minh hoạ. */
export default function ProductVisual({ product, fallbackColor }: ProductVisualProps) {
  if (product.images.length > 0) {
    return (
      <img
        src={product.images[0]}
        alt={product.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    )
  }
  const c = fallbackColor || Object.values(product.colorHex)[0] || '#2B2B2B'
  return <GarmentIcon type={product.icon} colorHex={c} />
}
