import type { Product, RentalBooking } from '../types/product'
import type { CartLine } from '../types/cart'
import { getProducts } from './catalog-service'
import { TODAY_ISO } from '../utils/dates'

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
  bookings: RentalBooking[],
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

/**
 * Port nguyên từ submitCheckout() gốc (phần tạo booking) — hàm THUẦN, không đụng DOM/State,
 * chỉ tính toán và trả về danh sách booking mới để App tự setBookings(prev => [...prev, ...mới]).
 * `nextSeq` do App truyền vào (đếm dựa trên bookings hiện có) để mã đơn không trùng.
 */
export function createBookingsFromCart(
  cart: CartLine[],
  customer: string,
  phone: string,
  depositType: 'Tiền mặt' | 'CCCD',
  nextSeq: number,
): RentalBooking[] {
  return cart.map((c, i) => {
    const seq = nextSeq + i
    return {
      id: 'b' + seq,
      code: 'PA-' + (1000 + seq),
      customer,
      phone,
      productId: c.productId,
      variantId: c.variantId,
      orderDate: TODAY_ISO,
      pickupDate: c.pickupDate,
      dueDate: c.dueDate,
      returnDate: null,
      days: c.days,
      pricePerDay: c.pricePerDay,
      rentalTotal: c.lineTotal,
      depositType,
      depositAmount: c.deposit,
      depositRefunded: false,
      lateFee: 0,
      status: 'Đặt trước',
      paid: false,
    }
  })
}
