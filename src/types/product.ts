export interface ProductVariant {
  id: string
  size: string
  color: string
  total: number
  renting: number
  cleaning: number
  repair: number
}

export interface Product {
  id: string
  name: string
  category: string
  icon: 'dress' | 'aodai' | 'suit' | 'accessory' | 'couple'
  pricePerDay: number
  deposit: number
  depositNote: string
  desc: string
  colorHex: Record<string, string>
  variants: ProductVariant[]
  images: string[]
  videoUrl: string
}

export type RentalStatus = 'Đặt trước' | 'Đang thuê' | 'Đã trả'

export interface RentalBooking {
  id: string
  code: string
  /** Tài khoản khách đã đặt đơn (null nếu khách vãng lai). */
  customerId?: string | null
  customer: string
  phone: string
  productId: string
  variantId: string
  orderDate: string
  pickupDate: string
  dueDate: string
  returnDate: string | null
  days: number
  pricePerDay: number
  rentalTotal: number
  depositType: 'Tiền mặt' | 'CCCD'
  depositAmount: number
  depositRefunded: boolean
  lateFee: number
  status: RentalStatus
  paid: boolean
}

export type RentalBookingInput = Omit<RentalBooking, 'id' | 'code'>

/** Phần lịch thuê công khai, đủ để tính còn hàng mà không lộ thông tin khách. */
export type BookingSlot = Pick<RentalBooking, 'id' | 'productId' | 'variantId' | 'pickupDate' | 'dueDate' | 'status'>

export interface Review {
  name: string
  item: string
  rating: number
  quote: string
  icon: Product['icon']
  color: string
}

export interface Differentiator {
  icon: string
  title: string
  desc: string
}
