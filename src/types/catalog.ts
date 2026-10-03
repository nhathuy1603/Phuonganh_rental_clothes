/** Danh mục sản phẩm thuê đồ: nhóm mẹ + danh sách danh mục con. */
export interface CategoryGroup {
  group: string
  items: string[]
}

/** Dịch vụ trang điểm (Makeup). */
export interface MakeupCategory {
  id: string
  emoji: string
  name: string
  tagline: string
  desc: string
  priceFrom: number
  duration: string
  highlights: string[]
  images: string[]
}
