import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { Prisma } from '@prisma/client'
import { prisma } from './db.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173'
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

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

function bookingData(payload: Record<string, any>): Prisma.RentalBookingUncheckedCreateInput {
  const requiredFields = ['customer', 'phone', 'productId', 'variantId', 'orderDate', 'pickupDate', 'dueDate']
  if (requiredFields.some((field) => !String(payload[field] ?? '').trim())) {
    throw new Error('Thông tin đơn thuê không đầy đủ.')
  }

  return {
    code: `PA-${Date.now()}-${randomUUID().slice(0, 8)}`,
    customer: String(payload.customer),
    phone: String(payload.phone),
    productId: String(payload.productId),
    variantId: String(payload.variantId),
    orderDate: String(payload.orderDate),
    pickupDate: String(payload.pickupDate),
    dueDate: String(payload.dueDate),
    returnDate: payload.returnDate == null ? null : String(payload.returnDate),
    days: Number(payload.days ?? 0),
    pricePerDay: Number(payload.pricePerDay ?? 0),
    rentalTotal: Number(payload.rentalTotal ?? 0),
    depositType: String(payload.depositType ?? 'Tiền mặt'),
    depositAmount: Number(payload.depositAmount ?? 0),
    depositRefunded: Boolean(payload.depositRefunded),
    lateFee: Number(payload.lateFee ?? 0),
    paid: Boolean(payload.paid),
    status: String(payload.status ?? 'Đặt trước'),
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Chỉ cho phép upload file hình ảnh.'))
      return
    }
    cb(null, true)
  },
})

app.use(cors({ origin: clientUrl, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', asyncRoute(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`
  res.json({ status: 'ok', message: 'Phuong Anh backend is running', database: 'connected' })
}))

app.get('/api/categories', asyncRoute(async (_req, res) => {
  res.json(await categoryTree())
}))

app.post('/api/categories/groups', asyncRoute(async (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  if (!name) {
    res.status(400).json({ message: 'Tên nhóm danh mục không được để trống.' })
    return
  }

  const sortOrder = await prisma.categoryGroup.count()
  await prisma.categoryGroup.create({ data: { name, sortOrder } })
  res.status(201).json(await categoryTree())
}))

app.put('/api/categories/groups/:index', asyncRoute(async (req, res) => {
  const group = await groupAtIndex(Number(req.params.index))
  const name = String(req.body?.name ?? '').trim()
  if (!group) {
    res.status(404).json({ message: 'Nhóm danh mục không tồn tại.' })
    return
  }
  if (!name) {
    res.status(400).json({ message: 'Tên nhóm danh mục không được để trống.' })
    return
  }

  await prisma.categoryGroup.update({ where: { id: group.id }, data: { name } })
  res.json(await categoryTree())
}))

app.delete('/api/categories/groups/:index', asyncRoute(async (req, res) => {
  const group = await groupAtIndex(Number(req.params.index))
  if (!group) {
    res.status(404).json({ message: 'Nhóm danh mục không tồn tại.' })
    return
  }

  const categoryIds = group.categories.map((category) => category.id)
  const productCount = await prisma.product.count({ where: { categoryId: { in: categoryIds } } })
  if (productCount > 0) {
    res.status(409).json({ message: 'Hãy chuyển sản phẩm khỏi nhóm trước khi xóa.' })
    return
  }

  await prisma.categoryGroup.delete({ where: { id: group.id } })
  res.json(await categoryTree())
}))

app.post('/api/categories/:groupIndex/items', asyncRoute(async (req, res) => {
  const group = await groupAtIndex(Number(req.params.groupIndex))
  const name = String(req.body?.name ?? '').trim()
  if (!group) {
    res.status(404).json({ message: 'Nhóm danh mục không tồn tại.' })
    return
  }
  if (!name) {
    res.status(400).json({ message: 'Tên danh mục con không được để trống.' })
    return
  }

  const sortOrder = await prisma.category.count({ where: { groupId: group.id } })
  await prisma.category.create({ data: { name, groupId: group.id, sortOrder } })
  res.status(201).json(await categoryTree())
}))

app.put('/api/categories/:groupIndex/items/:oldName', asyncRoute(async (req, res) => {
  const group = await groupAtIndex(Number(req.params.groupIndex))
  const oldName = req.params.oldName
  const newName = String(req.body?.name ?? '').trim()
  if (!group) {
    res.status(404).json({ message: 'Nhóm danh mục không tồn tại.' })
    return
  }
  if (!newName) {
    res.status(400).json({ message: 'Tên danh mục con không được để trống.' })
    return
  }

  const category = await prisma.category.findFirst({ where: { groupId: group.id, name: oldName } })
  if (!category) {
    res.status(404).json({ message: 'Danh mục con không tồn tại.' })
    return
  }

  await prisma.category.update({ where: { id: category.id }, data: { name: newName } })
  res.json(await categoryTree())
}))

app.delete('/api/categories/:groupIndex/items/:name', asyncRoute(async (req, res) => {
  const group = await groupAtIndex(Number(req.params.groupIndex))
  const name = req.params.name
  const moveTo = String(req.query.moveTo ?? '').trim()
  if (!group) {
    res.status(404).json({ message: 'Nhóm danh mục không tồn tại.' })
    return
  }

  const category = await prisma.category.findFirst({
    where: { groupId: group.id, name },
    include: { _count: { select: { products: true } } },
  })
  if (!category) {
    res.status(404).json({ message: 'Danh mục con không tồn tại.' })
    return
  }
  if (category._count.products > 0 && !moveTo) {
    res.status(409).json({ message: 'Hãy chọn danh mục nhận sản phẩm trước khi xóa.' })
    return
  }

  await prisma.$transaction(async (transaction) => {
    if (category._count.products > 0) {
      const target = await transaction.category.findUnique({ where: { name: moveTo } })
      if (!target || target.id === category.id) {
        throw new Error('Danh mục nhận sản phẩm không hợp lệ.')
      }
      await transaction.product.updateMany({ where: { categoryId: category.id }, data: { categoryId: target.id } })
    }
    await transaction.category.delete({ where: { id: category.id } })
  })
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
  if (!product) {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
    return
  }
  res.json(serializeProduct(product))
}))

app.post('/api/products', asyncRoute(async (req, res) => {
  const { category: categoryName, variants = [], ...fields } = req.body ?? {}
  if (!fields.name || !categoryName) {
    res.status(400).json({ message: 'Tên và danh mục sản phẩm là bắt buộc.' })
    return
  }
  const category = await prisma.category.findUnique({ where: { name: String(categoryName) } })
  if (!category) {
    res.status(400).json({ message: 'Danh mục sản phẩm không tồn tại.' })
    return
  }

  const product = await prisma.product.create({
    data: {
      ...fields,
      colorHex: fields.colorHex ?? {},
      images: fields.images ?? [],
      videoUrl: fields.videoUrl ?? '',
      category: { connect: { id: category.id } },
      variants: { create: Array.isArray(variants) ? variants : [] },
    },
    include: { category: true, variants: true },
  })
  res.status(201).json(serializeProduct(product))
}))

app.put('/api/products/:id', asyncRoute(async (req, res) => {
  const { id: _id, category: categoryName, variants, ...fields } = req.body ?? {}
  const current = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!current) {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật.' })
    return
  }

  const data: Prisma.ProductUpdateInput = { ...fields }
  if (categoryName !== undefined) {
    const category = await prisma.category.findUnique({ where: { name: String(categoryName) } })
    if (!category) {
      res.status(400).json({ message: 'Danh mục sản phẩm không tồn tại.' })
      return
    }
    data.category = { connect: { id: category.id } }
  }
  if (Array.isArray(variants)) {
    data.variants = { deleteMany: {}, create: variants }
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
    include: { category: true, variants: true },
  })
  res.json(serializeProduct(product))
}))

app.delete('/api/products/:id', asyncRoute(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, variants: true },
  })
  if (!product) {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
    return
  }

  await prisma.product.delete({ where: { id: req.params.id } })
  res.json({ message: 'Đã xóa sản phẩm.', removed: serializeProduct(product) })
}))

app.get('/api/bookings', asyncRoute(async (_req, res) => {
  res.json(await prisma.rentalBooking.findMany({ orderBy: { createdAt: 'asc' } }))
}))

app.post('/api/bookings/bulk', asyncRoute(async (req, res) => {
  const payloads = req.body
  if (!Array.isArray(payloads) || payloads.length === 0) {
    res.status(400).json({ message: 'Danh sách đơn thuê không hợp lệ.' })
    return
  }

  const created = await prisma.$transaction(
    payloads.map((payload: Record<string, any>) => prisma.rentalBooking.create({ data: bookingData(payload) })),
  )
  res.status(201).json(created)
}))

app.post('/api/bookings', asyncRoute(async (req, res) => {
  const booking = await prisma.rentalBooking.create({ data: bookingData(req.body ?? {}) })
  res.status(201).json(booking)
}))

app.put('/api/bookings/:id', asyncRoute(async (req, res) => {
  const { id: _id, code: _code, ...fields } = req.body ?? {}
  const existing = await prisma.rentalBooking.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ message: 'Không tìm thấy đơn thuê.' })
    return
  }

  res.json(await prisma.rentalBooking.update({ where: { id: req.params.id }, data: fields }))
}))

app.delete('/api/bookings/:id', asyncRoute(async (req, res) => {
  const existing = await prisma.rentalBooking.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ message: 'Không tìm thấy đơn thuê.' })
    return
  }

  await prisma.rentalBooking.delete({ where: { id: req.params.id } })
  res.json({ message: 'Đã xóa đơn thuê.', removed: existing })
}))

app.get('/api/makeup-services', asyncRoute(async (_req, res) => {
  res.json(await prisma.makeupService.findMany({ orderBy: { createdAt: 'asc' } }))
}))

app.post('/api/makeup-services', asyncRoute(async (req, res) => {
  const { id: _id, ...fields } = req.body ?? {}
  const service = await prisma.makeupService.create({
    data: { ...fields, highlights: fields.highlights ?? [], images: fields.images ?? [] },
  })
  res.status(201).json(service)
}))

app.put('/api/makeup-services/:id', asyncRoute(async (req, res) => {
  const { id: _id, ...fields } = req.body ?? {}
  const existing = await prisma.makeupService.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ message: 'Không tìm thấy dịch vụ makeup.' })
    return
  }

  res.json(await prisma.makeupService.update({ where: { id: req.params.id }, data: fields }))
}))

app.delete('/api/makeup-services/:id', asyncRoute(async (req, res) => {
  const existing = await prisma.makeupService.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ message: 'Không tìm thấy dịch vụ makeup.' })
    return
  }

  await prisma.makeupService.delete({ where: { id: req.params.id } })
  res.json({ message: 'Đã xóa dịch vụ makeup.', removed: existing })
}))

app.get('/api/makeup-appointments', asyncRoute(async (_req, res) => {
  res.json(await prisma.makeupAppointment.findMany({ orderBy: [{ date: 'asc' }, { time: 'asc' }] }))
}))

app.post('/api/makeup-appointments', asyncRoute(async (req, res) => {
  const { id: _id, ...fields } = req.body ?? {}
  const appointment = await prisma.makeupAppointment.create({
    data: {
      ...fields,
      notes: fields.notes ?? '',
      depositAmount: Number(fields.depositAmount ?? 0),
      depositRefunded: Boolean(fields.depositRefunded),
      lateFee: Number(fields.lateFee ?? 0),
      paid: Boolean(fields.paid),
      status: fields.status ?? 'Chờ xác nhận',
    },
  })
  res.status(201).json(appointment)
}))

app.put('/api/makeup-appointments/:id', asyncRoute(async (req, res) => {
  const { id: _id, ...fields } = req.body ?? {}
  const existing = await prisma.makeupAppointment.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ message: 'Không tìm thấy lịch makeup.' })
    return
  }

  res.json(await prisma.makeupAppointment.update({ where: { id: req.params.id }, data: fields }))
}))

app.delete('/api/makeup-appointments/:id', asyncRoute(async (req, res) => {
  const existing = await prisma.makeupAppointment.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    res.status(404).json({ message: 'Không tìm thấy lịch makeup.' })
    return
  }

  await prisma.makeupAppointment.delete({ where: { id: req.params.id } })
  res.json({ message: 'Đã xóa lịch makeup.', removed: existing })
}))

app.post('/api/admin/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'Thiếu file hình ảnh để upload.' })
    return
  }

  if (req.file.size > MAX_IMAGE_SIZE_BYTES) {
    res.status(400).json({ message: 'Ảnh vượt quá giới hạn 5MB.' })
    return
  }

  res.status(201).json({
    message: 'Upload ảnh thành công.',
    filename: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
  })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'Ảnh vượt quá giới hạn 5MB.' })
      return
    }
    res.status(400).json({ message: error.message })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({ message: 'Dữ liệu đã tồn tại.' })
      return
    }
    if (error.code === 'P2003') {
      res.status(409).json({ message: 'Không thể xóa dữ liệu đang được sử dụng.' })
      return
    }
  }

  if (error.message === 'Danh mục nhận sản phẩm không hợp lệ.') {
    res.status(400).json({ message: error.message })
    return
  }
  if (error.message === 'Thông tin đơn thuê không đầy đủ.') {
    res.status(400).json({ message: error.message })
    return
  }

  console.error(error)
  res.status(500).json({ message: 'Có lỗi máy chủ. Vui lòng thử lại.' })
})

async function start() {
  await prisma.$connect()
  app.listen(port, () => {
    console.log(`Phuong Anh backend listening on http://localhost:${port}`)
  })
}

void start().catch(async (error: unknown) => {
  console.error('Could not connect to PostgreSQL. Check DATABASE_URL.', error)
  await prisma.$disconnect()
  process.exitCode = 1
})
