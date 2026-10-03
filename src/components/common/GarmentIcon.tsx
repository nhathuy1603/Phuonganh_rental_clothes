import type { ReactNode } from 'react'
import type { Product } from '../../types/product'

interface GarmentIconProps {
  type: Product['icon']
  colorHex?: string
}

/**
 * Port của icon() gốc — vẽ minh hoạ SVG cho từng loại trang phục.
 * Bản gốc build chuỗi HTML bằng string nối; ở đây viết trực tiếp bằng JSX,
 * nhưng toạ độ path/màu sắc giữ NGUYÊN VĂN để hình vẽ ra giống hệt.
 */
export default function GarmentIcon({ type, colorHex }: GarmentIconProps) {
  const c = colorHex || '#2B2B2B'
  const shapes: Record<Product['icon'], ReactNode> = {
    dress: (
      <>
        <path
          d="M83,14 C93,14 97,24 95,32 C124,54 138,128 116,168 C110,182 56,182 50,168 C28,128 42,54 71,32 C69,24 73,14 83,14 Z"
          fill={c}
          opacity="0.92"
        />
        <path
          d="M83,14 C93,14 97,24 95,32 C90,38 76,38 71,32 C69,24 73,14 83,14 Z"
          fill={c}
          opacity="0.5"
        />
      </>
    ),
    aodai: (
      <>
        <path
          d="M63,16 L103,16 L107,110 C107,128 120,148 125,176 L103,176 C99,152 90,136 83,136 C76,136 67,152 63,176 L41,176 C46,148 59,128 59,110 Z"
          fill={c}
          opacity="0.92"
        />
        <rect x="80" y="16" width="6" height="34" fill={c} opacity="0.4" />
      </>
    ),
    suit: (
      <>
        <path
          d="M48,26 L83,14 L118,26 L128,58 L110,52 L106,176 L60,176 L56,52 L38,58 Z"
          fill={c}
          opacity="0.92"
        />
        <path d="M70,20 L83,52 L64,40 Z" fill="#FAF6F0" opacity="0.85" />
        <path d="M96,20 L83,52 L102,40 Z" fill="#FAF6F0" opacity="0.85" />
      </>
    ),
    accessory: (
      <>
        <path d="M83,26 L128,80 L83,166 L38,80 Z" fill={c} opacity="0.9" />
        <path
          d="M83,26 L83,166 M38,80 L128,80 M58,50 L108,50"
          stroke="#FAF6F0"
          strokeWidth="2"
          opacity="0.55"
          fill="none"
        />
      </>
    ),
    couple: (
      <>
        <path
          d="M45,20 C51,20 54,26 52,31 C68,44 76,90 63,112 C59,120 31,120 27,112 C14,90 22,44 38,31 C36,26 39,20 45,20 Z"
          fill={c}
          opacity="0.92"
        />
        <path
          d="M96,24 L118,17 L138,24 L143,46 L133,42 L131,112 L104,112 L102,42 L92,46 Z"
          fill={c}
          opacity="0.7"
        />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 166 190" xmlns="http://www.w3.org/2000/svg">
      {shapes[type] ?? shapes.dress}
    </svg>
  )
}
