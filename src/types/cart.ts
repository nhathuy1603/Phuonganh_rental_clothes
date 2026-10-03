export interface CartLine {
  lineId: string
  productId: string
  variantId: string
  size: string
  color: string
  pickupDate: string
  dueDate: string
  days: number
  pricePerDay: number
  lineTotal: number
  deposit: number
}
