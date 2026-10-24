export type MakeupAppointmentStatus = 'Chờ xác nhận' | 'Đã xác nhận' | 'Hoàn thành' | 'Đã hủy'

export interface MakeupAppointment {
  id: string
  /** Tài khoản khách đã đặt đơn (null nếu khách vãng lai). */
  customerId?: string | null
  customer: string
  phone: string
  serviceId: string
  date: string
  time: string
  notes: string
  amount: number
  depositAmount: number
  depositRefunded: boolean
  lateFee: number
  paid: boolean
  status: MakeupAppointmentStatus
}

export type MakeupAppointmentInput = Omit<MakeupAppointment, 'id'>
