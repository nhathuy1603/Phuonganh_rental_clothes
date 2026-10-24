import type { CategoryGroup, MakeupCategory } from '../types/catalog'
import type { MakeupAppointment } from '../types/makeup-appointment'
import type { BookingSlot, Product, ProductVariant, RentalBooking, Review, Differentiator } from '../types/product'
import { defaultCategoryTree, makeupCategories, products, bookings, REVIEWS, DIFFS } from '../data/seed-data'
import { api } from './api'

/**
 * Lớp truy cập dữ liệu danh mục. UI CHỈ gọi các hàm ở đây, không import seed-data trực tiếp.
 * Các hàm fetch* gọi API; chỉ khi chạy dev mới dùng dữ liệu mẫu nếu API lỗi,
 * còn production báo lỗi thật để không hiển thị sản phẩm giả cho khách.
 */
async function withDevFallback<T>(load: Promise<T>, sample: () => T): Promise<T> {
  try {
    return await load
  } catch (error) {
    if (!import.meta.env.DEV) throw error
    return sample()
  }
}

export function getCategoryTree(): CategoryGroup[] {
  return defaultCategoryTree()
}

export function fetchCategoryTree(): Promise<CategoryGroup[]> {
  return withDevFallback(api.get<CategoryGroup[]>('/api/categories'), defaultCategoryTree)
}

export function getMakeupCategories(): MakeupCategory[] {
  return makeupCategories
}

export function fetchMakeupCategories(): Promise<MakeupCategory[]> {
  return withDevFallback(api.get<MakeupCategory[]>('/api/makeup-services'), () => makeupCategories)
}

/** Chỉ admin đã đăng nhập mới gọi được. */
export function fetchMakeupAppointments(): Promise<MakeupAppointment[]> {
  return api.get<MakeupAppointment[]>('/api/makeup-appointments')
}

export function getProducts(): Product[] {
  return products
}

export function fetchProducts(): Promise<Product[]> {
  return withDevFallback(api.get<Product[]>('/api/products'), () => products)
}

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function findVariant(productId: string, variantId: string): ProductVariant | undefined {
  return findProduct(productId)?.variants.find((v) => v.id === variantId)
}

/** Port nguyên từ availableNow() gốc. */
export function availableNow(v: ProductVariant): number {
  return Math.max(0, v.total - v.renting - v.cleaning - v.repair)
}

/** Port nguyên từ groupChildren() gốc — trả về danh sách danh mục con nếu `name` là 1 danh mục mẹ. */
export function groupChildren(name: string, categoryTree: CategoryGroup[] = defaultCategoryTree()): string[] | null {
  const g = categoryTree.find((x) => x.group === name)
  return g ? g.items : null
}

/** Port nguyên từ topCategoryChips() gốc. */
export function topCategoryChips(categoryTree: CategoryGroup[] = defaultCategoryTree()): string[] {
  return ['Tất cả', ...categoryTree.map((g) => g.group)]
}

/** Danh sách sản phẩm hiển thị cho 1 danh mục đang chọn (bao gồm cả trường hợp là danh mục mẹ). */
export function getProductsForCategory(
  active: string,
  categoryTree: CategoryGroup[] = defaultCategoryTree(),
  productList: Product[] = products,
): Product[] {
  if (active === 'Tất cả') return productList
  const kids = groupChildren(active, categoryTree)
  return kids ? productList.filter((p) => kids.includes(p.category)) : productList.filter((p) => p.category === active)
}

/** Lịch giữ đồ công khai (không có thông tin khách) để kiểm tra còn hàng. */
export function fetchBookingSlots(): Promise<BookingSlot[]> {
  return withDevFallback(api.get<BookingSlot[]>('/api/bookings/availability'), () => bookings)
}

/** Chỉ admin đã đăng nhập mới gọi được. */
export function fetchBookings(): Promise<RentalBooking[]> {
  return api.get<RentalBooking[]>('/api/bookings')
}

/** Port nguyên từ mostRentedProducts() gốc — xếp hạng sản phẩm theo số lượt đặt. */
export function mostRentedProducts(limit = 6, productList: Product[] = products): { p: Product; count: number }[] {
  const counts: Record<string, number> = {}
  bookings.forEach((b) => {
    counts[b.productId] = (counts[b.productId] || 0) + 1
  })
  return productList
    .map((p) => ({ p, count: counts[p.id] || 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/** Sản phẩm nổi bật do admin chọn (Phase 2d sẽ nối phần chỉnh sửa); tạm cố định theo bản gốc. */
const FEATURED_IDS = ['p1', 'p4', 'p2', 'p9']
export function getFeaturedProducts(productList: Product[] = products): Product[] {
  const ids = FEATURED_IDS.length ? FEATURED_IDS : productList.slice(0, 4).map((p) => p.id)
  return ids.map((id) => productList.find((product) => product.id === id)).filter((p): p is Product => !!p)
}

export function getReviews(): Review[] {
  return REVIEWS
}

export function getDifferentiators(): Differentiator[] {
  return DIFFS
}
