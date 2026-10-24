import { config } from './config.js'
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import multer from 'multer'
import { Prisma } from '@prisma/client'
import { checkCredentials, clearLoginFailures, issueToken, loginRateLimit, recordLoginFailure, requireAdmin } from './auth.js'
import { prisma } from './db.js'
import { HttpError } from './errors.js'
import { deleteUnusedImages, ensureUploadDir, MAX_IMAGE_SIZE_BYTES, saveImage, UPLOAD_ROUTE } from './storage.js'
import {
  appointmentRequestSchema,
  appointmentSchema,
  bookingSchema,
  checkoutSchema,
  loginSchema,
  makeupServiceSchema,
  nameSchema,
  parse,
  productSchema,
} from './validation.js'

const app = express()
const ACTIVE_RENTAL_STATUSES = ['Đặt trước', 'Đang thuê']

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: { category: true; variants: true }
}>

type AsyncRoute = (req: Request, res: Response) => Promise<void>

function asyncRoute(handler: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res).catch(next)
  }
}

function serializeProduct(product: ProductWithDetails) {
  const { category, ...fields } = product
  return { ...fields, category: category.name }
}

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
}

function rentalDays(pickup: string, due: string): number {
  return Math.max(1, Math.round((Date.parse(due) - Date.parse(pickup)) / 86400000))
}

function bookingCode(): string {
  return `PA-${Date.now()}-${randomUUID().slice(0, 8)}`
}

async function orderedGroups() {
  return prisma.categoryGroup.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: { categories: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } },
  })
}

async function categoryTree() {
  const groups = await orderedGroups()
  return groups.map((group) => ({
    group: group.name,
    items: group.categories.map((category) => category.name),
  }))
}

async function groupAtIndex(index: number) {
  if (!Number.isInteger(index) || index < 0) return null
  return (await orderedGroups())[index] ?? null
}

async function categoryIdByName(name: string): Promise<string> {
  const category = await prisma.category.findUnique({ where: { name } })
  if (!category) throw new HttpError(400, 'Danh mục sản phẩm không tồn tại.')
  return category.id
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new HttpError(400, 'Chỉ cho phép upload file hình ảnh.'))
      return
    }
    cb(null, true)
  },
})

app.set('trust proxy', config.trustProxy)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
// Dev: chấp nhận mọi cổng localhost (Vite có thể đổi sang 5174…) và admin.localhost.
const devOrigin = /^http:\/\/([\w-]+\.)?(localhost|127\.0\.0\.1)(:\d+)?$/
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin) || (!config.isProduction && devOrigin.test(origin))),
}))
app.use(express.json({ limit: '2mb' }))
app.use(UPLOAD_ROUTE, express.static(config.uploadDir, { index: false, immutable: true, maxAge: '365d' }))

app.get('/health', asyncRoute(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`
  res.json({ status: 'ok', message: 'Phuong Anh backend is running', database: 'connected' })
}))

/* ---------- Public: storefront ---------- */

app.post('/api/auth/login', loginRateLimit, (req, res) => {
  const { username, password } = parse(loginSchema, req.body)
  if (!checkCredentials(username, password)) {
    recordLoginFailure(req.ip)
    throw new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu.')
  }
  clearLoginFailures(req.ip)
  res.json({ ...issueToken(username), username })
})

app.get('/api/categories', asyncRoute(async (_req, res) => {
  res.json(await categoryTree())
}))

app.get('/api/products', asyncRoute(async (_req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true, variants: { orderBy: { id: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
  res.json(products.map(serializeProduct))
}))

app.get('/api/products/:id', asyncRoute(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, variants: true },
  })
  if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm.')
  res.json(serializeProduct(product))
}))

app.get('/api/makeup-services', asyncRoute(async (_req, res) => {
  res.json(await prisma.makeupService.findMany({ orderBy: { createdAt: 'asc' } }))
}))

/** Lịch giữ đồ để trang khách kiểm tra còn hàng — không trả tên / SĐT khách. */
app.get('/api/bookings/availability', asyncRoute(async (_req, res) => {
  res.json(await prisma.rentalBooking.findMany({
    where: { status: { in: ACTIVE_RENTAL_STATUSES }, dueDate: { gte: todayIso() } },
    select: { id: true, productId: true, variantId: true, pickupDate: true, dueDate: true, status: true },
  }))
}))

app.post('/api/bookings/checkout', asyncRoute(async (req, res) => {
  const order = parse(checkoutSchema, req.body)
  const today = todayIso()
  if (order.items.some((item) => item.pickupDate < today)) {
    throw new HttpError(400, 'Ngày lấy đồ không được ở trong quá khứ.')
  }

  const created = await prisma.$transaction(async (transaction) => {
    const bookings = []
    for (const item of order.items) {
      const product = await transaction.product.findUnique({ where: { id: item.productId }, include: { variants: true } })
      const variant = product?.variants.find((candidate) => candidate.id === item.variantId)
      if (!product || !variant) throw new HttpError(400, 'Sản phẩm trong giỏ không còn tồn tại. Vui lòng tải lại trang.')

      const reserved = await transaction.rentalBooking.count({
        where: {
          variantId: variant.id,
          status: { in: ACTIVE_RENTAL_STATUSES },
          pickupDate: { lte: item.dueDate },
          dueDate: { gte: item.pickupDate },
        },
      })
      if (variant.total - variant.cleaning - variant.repair - reserved <= 0) {
        throw new HttpError(409, `“${product.name}” (${variant.size} / ${variant.color}) đã hết trong khoảng ngày đã chọn.`)
      }

      const days = rentalDays(item.pickupDate, item.dueDate)
      bookings.push(await transaction.rentalBooking.create({
        data: {
          code: bookingCode(),
          customer: order.customer,
          phone: order.phone,
          productId: product.id,
          variantId: variant.id,
          orderDate: today,
          pickupDate: item.pickupDate,
          dueDate: item.dueDate,
          days,
          pricePerDay: product.pricePerDay,
          rentalTotal: days * product.pricePerDay,
          depositType: order.depositType,
          depositAmount: product.deposit,
          status: 'Đặt trước',
        },
      }))
    }
    return bookings
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  res.status(201).json(created)
}))

app.post('/api/makeup-appointments/request', asyncRoute(async (req, res) => {
  const request = parse(appointmentRequestSchema, req.body)
  if (request.date < todayIso()) throw new HttpError(400, 'Ngày hẹn không được ở trong quá khứ.')
  const service = await prisma.makeupService.findUnique({ where: { id: request.serviceId } })
  if (!service) throw new HttpError(400, 'Dịch vụ makeup không tồn tại.')

  const appointment = await prisma.makeupAppointment.create({
    data: { ...request, amount: service.priceFrom, status: 'Chờ xác nhận' },
  })
  res.status(201).json(appointment)
}))

/* ---------- Admin: mọi route /api phía dưới cần đăng nhập ---------- */

app.use('/api', requireAdmin)

app.get('/api/auth/me', (_req, res) => {
  res.json({ username: res.locals.admin })
})

app.post('/api/categories/groups', asyncRoute(async (req, res) => {
  const { name } = parse(nameSchema, req.body)
  const sortOrder = await prisma.categoryGroup.count()
  await prisma.categoryGroup.create({ data: { name, sortOrder } })
  res.status(201).json(await categoryTree())
}))

app.put('/api/categories/groups/:index', asyncRoute(async (req, res) => {
  const { name } = parse(nameSchema, req.body)
  const group = await groupAtIndex(Number(req.params.index))
  if (!group) throw new HttpError(404, 'Nhóm danh mục không tồn tại.')

  await prisma.categoryGroup.update({ where: { id: group.id }, data: { name } })
  res.json(await categoryTree())
}))

app.delete('/api/categories/groups/:index', asyncRoute(async (req, res) => {
  const group = await groupAtIndex(Number(req.params.index))
  if (!group) throw new HttpError(404, 'Nhóm danh mục không tồn tại.')

  const categoryIds = group.categories.map((category) => category.id)
  const productCount = await prisma.product.count({ where: { categoryId: { in: categoryIds } } })
  if (productCount > 0) throw new HttpError(409, 'Hãy chuyển sản phẩm khỏi nhóm trước khi xóa.')

  await prisma.categoryGroup.delete({ where: { id: group.id } })
  res.json(await categoryTree())
}))

app.post('/api/categories/:groupIndex/items', asyncRoute(async (req, res) => {
  const { name } = parse(nameSchema, req.body)
  const group = await groupAtIndex(Number(req.params.groupIndex))
  if (!group) throw new HttpError(404, 'Nhóm danh mục không tồn tại.')

  const sortOrder = await prisma.category.count({ where: { groupId: group.id } })
  await prisma.category.create({ data: { name, groupId: group.id, sortOrder } })
  res.status(201).json(await categoryTree())
}))

app.put('/api/categories/:groupIndex/items/:oldName', asyncRoute(async (req, res) => {
  const { name: newName } = parse(nameSchema, req.body)
  const group = await groupAtIndex(Number(req.params.groupIndex))
  if (!group) throw new HttpError(404, 'Nhóm danh mục không tồn tại.')

  const category = await prisma.category.findFirst({ where: { groupId: group.id, name: req.params.oldName } })
  if (!category) throw new HttpError(404, 'Danh mục con không tồn tại.')

  await prisma.category.update({ where: { id: category.id }, data: { name: newName } })
  res.json(await categoryTree())
}))

app.delete('/api/categories/:groupIndex/items/:name', asyncRoute(async (req, res) => {
  const group = await groupAtIndex(Number(req.params.groupIndex))
  const moveTo = String(req.query.moveTo ?? '').trim()
  if (!group) throw new HttpError(404, 'Nhóm danh mục không tồn tại.')

  const category = await prisma.category.findFirst({
    where: { groupId: group.id, name: req.params.name },
    include: { _count: { select: { products: true } } },
  })
  if (!category) throw new HttpError(404, 'Danh mục con không tồn tại.')
  if (category._count.products > 0 && !moveTo) throw new HttpError(409, 'Hãy chọn danh mục nhận sản phẩm trước khi xóa.')

  await prisma.$transaction(async (transaction) => {
    if (category._count.products > 0) {
      const target = await transaction.category.findUnique({ where: { name: moveTo } })
      if (!target || target.id === category.id) throw new HttpError(400, 'Danh mục nhận sản phẩm không hợp lệ.')
      await transaction.product.updateMany({ where: { categoryId: category.id }, data: { categoryId: target.id } })
    }
    await transaction.category.delete({ where: { id: category.id } })
  })
  res.json(await categoryTree())
}))

app.post('/api/products', asyncRoute(async (req, res) => {
  const { category, variants, colorHex, ...fields } = parse(productSchema, req.body)
  const product = await prisma.product.create({
    data: {
      ...fields,
      colorHex,
      category: { connect: { id: await categoryIdByName(category) } },
      variants: { create: variants },
    },
    include: { category: true, variants: true },
  })
  res.status(201).json(serializeProduct(product))
}))

app.put('/api/products/:id', asyncRoute(async (req, res) => {
  const { category, variants, colorHex, ...fields } = parse(productSchema, req.body)
  const current = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!current) throw new HttpError(404, 'Không tìm thấy sản phẩm để cập nhật.')

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...fields,
      colorHex,
      category: { connect: { id: await categoryIdByName(category) } },
      variants: { deleteMany: {}, create: variants },
    },
    include: { category: true, variants: true },
  })
  await deleteUnusedImages(current.images.filter((image) => !product.images.includes(image)))
  res.json(serializeProduct(product))
}))

app.delete('/api/products/:id', asyncRoute(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, variants: true },
  })
  if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm.')

  await prisma.product.delete({ where: { id: req.params.id } })
  await deleteUnusedImages(product.images)
  res.json({ message: 'Đã xóa sản phẩm.', removed: serializeProduct(product) })
}))

app.get('/api/bookings', asyncRoute(async (_req, res) => {
  res.json(await prisma.rentalBooking.findMany({ orderBy: { createdAt: 'asc' } }))
}))

app.post('/api/bookings', asyncRoute(async (req, res) => {
  const booking = await prisma.rentalBooking.create({ data: { ...parse(bookingSchema, req.body), code: bookingCode() } })
  res.status(201).json(booking)
}))

app.put('/api/bookings/:id', asyncRoute(async (req, res) => {
  const fields = parse(bookingSchema, req.body)
  const existing = await prisma.rentalBooking.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Không tìm thấy đơn thuê.')

  res.json(await prisma.rentalBooking.update({ where: { id: req.params.id }, data: fields }))
}))

app.delete('/api/bookings/:id', asyncRoute(async (req, res) => {
  const existing = await prisma.rentalBooking.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Không tìm thấy đơn thuê.')

  await prisma.rentalBooking.delete({ where: { id: req.params.id } })
  res.json({ message: 'Đã xóa đơn thuê.', removed: existing })
}))

app.post('/api/makeup-services', asyncRoute(async (req, res) => {
  res.status(201).json(await prisma.makeupService.create({ data: parse(makeupServiceSchema, req.body) }))
}))

app.put('/api/makeup-services/:id', asyncRoute(async (req, res) => {
  const fields = parse(makeupServiceSchema, req.body)
  const existing = await prisma.makeupService.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Không tìm thấy dịch vụ makeup.')

  const service = await prisma.makeupService.update({ where: { id: req.params.id }, data: fields })
  await deleteUnusedImages(existing.images.filter((image) => !service.images.includes(image)))
  res.json(service)
}))

app.delete('/api/makeup-services/:id', asyncRoute(async (req, res) => {
  const existing = await prisma.makeupService.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Không tìm thấy dịch vụ makeup.')

  await prisma.makeupService.delete({ where: { id: req.params.id } })
  await deleteUnusedImages(existing.images)
  res.json({ message: 'Đã xóa dịch vụ makeup.', removed: existing })
}))

app.get('/api/makeup-appointments', asyncRoute(async (_req, res) => {
  res.json(await prisma.makeupAppointment.findMany({ orderBy: [{ date: 'asc' }, { time: 'asc' }] }))
}))

app.post('/api/makeup-appointments', asyncRoute(async (req, res) => {
  res.status(201).json(await prisma.makeupAppointment.create({ data: parse(appointmentSchema, req.body) }))
}))

app.put('/api/makeup-appointments/:id', asyncRoute(async (req, res) => {
  const fields = parse(appointmentSchema, req.body)
  const existing = await prisma.makeupAppointment.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Không tìm thấy lịch makeup.')

  res.json(await prisma.makeupAppointment.update({ where: { id: req.params.id }, data: fields }))
}))

app.delete('/api/makeup-appointments/:id', asyncRoute(async (req, res) => {
  const existing = await prisma.makeupAppointment.findUnique({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'Không tìm thấy lịch makeup.')

  await prisma.makeupAppointment.delete({ where: { id: req.params.id } })
  res.json({ message: 'Đã xóa lịch makeup.', removed: existing })
}))

app.post('/api/admin/upload-image', upload.single('image'), asyncRoute(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Thiếu file hình ảnh để upload.')
  const url = await saveImage(req.file.buffer)
  res.status(201).json({ message: 'Upload ảnh thành công.', url, size: req.file.size })
}))

app.use((_req, _res, next) => {
  next(new HttpError(404, 'Không tìm thấy đường dẫn API.'))
})

app.use((error: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message })
    return
  }

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh vượt quá giới hạn 5MB.' : 'File upload không hợp lệ.'
    res.status(400).json({ message })
    return
  }

  if (error.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Dữ liệu gửi lên không đúng định dạng JSON.' })
    return
  }
  if (error.type === 'entity.too.large') {
    res.status(413).json({ message: 'Dữ liệu gửi lên quá lớn.' })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const known: Record<string, [number, string]> = {
      P2002: [409, 'Dữ liệu đã tồn tại.'],
      P2003: [409, 'Không thể xóa dữ liệu đang được sử dụng.'],
      P2025: [404, 'Không tìm thấy dữ liệu.'],
      P2034: [409, 'Có người vừa đặt cùng lúc. Vui lòng thử lại.'],
    }
    const match = known[error.code]
    if (match) {
      res.status(match[0]).json({ message: match[1] })
      return
    }
  }

  console.error(error)
  res.status(500).json({ message: 'Có lỗi máy chủ. Vui lòng thử lại.' })
})

async function start() {
  await ensureUploadDir()
  await prisma.$connect()
  const server = app.listen(config.port, () => {
    console.log(`Phuong Anh backend listening on port ${config.port}`)
  })

  const shutdown = () => {
    server.close(() => void prisma.$disconnect())
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

void start().catch(async (error: unknown) => {
  console.error('Could not start the backend. Check DATABASE_URL and the environment.', error)
  await prisma.$disconnect()
  process.exitCode = 1
})
