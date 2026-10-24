import type { BookingSlot, Product } from '../types/product'
import { getProducts } from './catalog-service'

/** Port nguyên từ overlaps() gốc. */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

/**
 * Port nguyên từ availableForRange() gốc.
 * Nhận `bookings` hiện tại làm tham số (thay vì đọc STATE.data.bookings toàn cục)
 * vì ở bản React, bookings là state do App quản lý.
 */
export function availableForRange(
  bookings: BookingSlot[],
  productId: string,
  variantId: string,
  pickup: string,
  due: string,
  ignoreBookingId?: string,
  catalogProducts: Product[] = getProducts(),
): number {
  const v = catalogProducts.find((product) => product.id === productId)?.variants.find((variant) => variant.id === variantId)
  if (!v) return 0
  const blockedByCondition = v.cleaning + v.repair
  let reserved = 0
  bookings.forEach((b) => {
    if (b.id === ignoreBookingId) return
    if (b.variantId !== variantId) return
    if (!['Đặt trước', 'Đang thuê'].includes(b.status)) return
    if (overlaps(pickup, due, b.pickupDate, b.dueDate)) reserved++
  })
  return Math.max(0, v.total - blockedByCondition - reserved)
}
