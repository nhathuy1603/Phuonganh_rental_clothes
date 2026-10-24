import { z } from 'zod'
import { HttpError } from './errors.js'

const text = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự.`)
const requiredText = (max: number) => text(max).min(1, 'Không được để trống.')
const money = z.coerce.number().int('Phải là số nguyên.').min(0, 'Không được âm.').max(1_000_000_000)
const count = z.coerce.number().int('Phải là số nguyên.').min(0, 'Không được âm.').max(10_000)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD.')
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ phải có dạng HH:MM.')
const phone = z
  .string()
  .transform((value) => value.replace(/[\s.-]/g, ''))
  .refine((value) => /^(\+84|0)\d{9,10}$/.test(value), 'Số điện thoại không hợp lệ.')

// Chấp nhận ảnh đã upload (URL) và ảnh data URL cũ còn trong DB trước khi chuyển sang lưu file.
const imageUrl = z
  .string()
  .refine((value) => /^https?:\/\//.test(value) || value.startsWith('data:image/'), 'Link ảnh không hợp lệ.')
const images = z.array(imageUrl).max(20, 'Tối đa 20 ảnh.').default([])

export const nameSchema = z.object({ name: requiredText(100) })

const variantSchema = z
  .object({
    id: z.string().min(1).max(100).optional(),
    size: requiredText(40),
    color: requiredText(60),
    total: count,
    renting: count.default(0),
    cleaning: count.default(0),
    repair: count.default(0),
  })
  .refine((variant) => variant.renting + variant.cleaning + variant.repair <= variant.total, {
    message: 'Số đang thuê, đang giặt và đang sửa không được vượt tổng số lượng.',
    path: ['total'],
  })

export const productSchema = z.object({
  name: requiredText(200),
  category: requiredText(100),
  icon: z.enum(['dress', 'aodai', 'suit', 'accessory', 'couple']),
  pricePerDay: money,
  deposit: money,
  depositNote: text(500).default(''),
  desc: text(5000).default(''),
  colorHex: z.record(z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Mã màu không hợp lệ.')).default({}),
  images,
  videoUrl: z.union([z.literal(''), z.string().trim().url('Link video không hợp lệ.')]).default(''),
  variants: z.array(variantSchema).min(1, 'Cần ít nhất một size / màu.').max(100),
})

const rentalStatus = z.enum(['Đặt trước', 'Đang thuê', 'Đã trả'])
const depositType = z.enum(['Tiền mặt', 'CCCD'])

export const bookingSchema = z
  .object({
    customer: requiredText(120),
    phone,
    productId: requiredText(100),
    variantId: requiredText(100),
    orderDate: isoDate,
    pickupDate: isoDate,
    dueDate: isoDate,
    returnDate: isoDate.nullable().default(null),
    days: count,
    pricePerDay: money,
    rentalTotal: money,
    depositType,
    depositAmount: money,
    depositRefunded: z.boolean().default(false),
    lateFee: money.default(0),
    status: rentalStatus,
    paid: z.boolean().default(false),
  })
  .refine((booking) => booking.dueDate >= booking.pickupDate, { message: 'Ngày trả phải sau ngày lấy.', path: ['dueDate'] })

/** Đơn khách tự đặt: chỉ nhận lựa chọn của khách, giá và trạng thái do server tính. */
export const checkoutSchema = z.object({
  customer: requiredText(120),
  phone,
  depositType,
  items: z
    .array(
      z
        .object({ productId: requiredText(100), variantId: requiredText(100), pickupDate: isoDate, dueDate: isoDate })
        .refine((item) => item.dueDate > item.pickupDate, { message: 'Ngày trả phải sau ngày lấy.', path: ['dueDate'] }),
    )
    .min(1, 'Giỏ hàng đang trống.')
    .max(20),
})

const appointmentStatus = z.enum(['Chờ xác nhận', 'Đã xác nhận', 'Hoàn thành', 'Đã hủy'])

export const appointmentSchema = z.object({
  customer: requiredText(120),
  phone,
  serviceId: requiredText(100),
  date: isoDate,
  time: clockTime,
  notes: text(1000).default(''),
  amount: money,
  depositAmount: money.default(0),
  depositRefunded: z.boolean().default(false),
  lateFee: money.default(0),
  paid: z.boolean().default(false),
  status: appointmentStatus.default('Chờ xác nhận'),
})

export const appointmentRequestSchema = appointmentSchema.pick({
  customer: true,
  phone: true,
  serviceId: true,
  date: true,
  time: true,
  notes: true,
})

export const makeupServiceSchema = z.object({
  emoji: requiredText(16),
  name: requiredText(120),
  tagline: text(300).default(''),
  desc: text(5000).default(''),
  priceFrom: money,
  duration: text(60).default(''),
  highlights: z.array(requiredText(200)).max(20).default([]),
  images,
})

export const loginSchema = z.object({
  username: requiredText(100),
  password: z.string().min(1, 'Không được để trống.').max(200),
})

const fieldLabels: Record<string, string> = {
  name: 'Tên',
  category: 'Danh mục',
  customer: 'Họ tên khách',
  phone: 'Số điện thoại',
  pickupDate: 'Ngày lấy',
  dueDate: 'Ngày trả',
  date: 'Ngày',
  time: 'Giờ',
  variants: 'Size / màu',
  images: 'Ảnh',
  videoUrl: 'Video',
  username: 'Tên đăng nhập',
  password: 'Mật khẩu',
}

export function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  const issue = result.error.issues[0]
  const field = issue.path.find((part): part is string => typeof part === 'string' && part in fieldLabels)
  throw new HttpError(400, field ? `${fieldLabels[field]}: ${issue.message}` : issue.message)
}
