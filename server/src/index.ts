import 'dotenv/config'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173'
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const categories = [
  { group: 'Váy & Đầm dạ hội', items: ['Váy dạ hội', 'Đầm đôi'] },
  { group: 'Áo dài', items: ['Áo dài cách tân', 'Áo dài truyền thống & cưới'] },
  { group: 'Vest & Suit nam', items: ['Vest công sở', 'Tuxedo & dạ tiệc nam'] },
  { group: 'Phụ kiện dạ tiệc', items: ['Trang sức dạ tiệc', 'Giày & túi dạ hội'] },
]

const products = [
  {
    id: 'p1',
    name: 'Váy dạ hội đuôi cá ánh kim',
    category: 'Váy dạ hội',
    icon: 'dress',
    pricePerDay: 250000,
    deposit: 2000000,
    depositNote: 'Cọc tiền mặt 2.000.000đ hoặc giữ CCCD bản gốc',
    desc: 'Chất liệu vải nhung ánh kim co giãn, dáng đuôi cá tôn dáng.',
    colorHex: { 'Đỏ rượu vang': '#7A2233', Đen: '#241A28' },
    variants: [
      { id: 'p1-v1', size: 'M', color: 'Đỏ rượu vang', total: 3, renting: 0, cleaning: 1, repair: 0 },
      { id: 'p1-v2', size: 'L', color: 'Đen', total: 2, renting: 0, cleaning: 0, repair: 0 },
    ],
    images: ['https://images.unsplash.com/...'],
    videoUrl: '',
  },
  {
    id: 'p2',
    name: 'Áo dài cách tân thêu hoa',
    category: 'Áo dài cách tân',
    icon: 'aodai',
    pricePerDay: 150000,
    deposit: 1000000,
    depositNote: 'Cọc tiền mặt 1.000.000đ hoặc giữ CCCD bản gốc',
    desc: 'Áo dài lụa cách tân thêu hoa nổi tay, form ôm nhẹ.',
    colorHex: { 'Hồng phấn': '#D9AFAE', 'Trắng ngà': '#F1E7D8' },
    variants: [
      { id: 'p2-v1', size: 'S', color: 'Hồng phấn', total: 3, renting: 1, cleaning: 0, repair: 0 },
      { id: 'p2-v2', size: 'M', color: 'Trắng ngà', total: 2, renting: 0, cleaning: 0, repair: 0 },
    ],
    images: ['https://images.unsplash.com/...'],
    videoUrl: '',
  },
]

const bookings = [
  {
    id: 'b1',
    code: 'PA-1001',
    customer: 'Ngọc Hà',
    phone: '0901234561',
    productId: 'p1',
    variantId: 'p1-v1',
    orderDate: '2026-09-25',
    pickupDate: '2026-09-29',
    dueDate: '2026-10-02',
    returnDate: '2026-10-03',
    days: 3,
    pricePerDay: 250000,
    rentalTotal: 750000,
    depositType: 'Tiền mặt',
    depositAmount: 2000000,
    depositRefunded: true,
    lateFee: 10000,
    status: 'Đã trả',
    paid: true,
  },
]

const makeupAppointments = [
  {
    id: 'ma1',
    customer: 'Ngọc Hà',
    phone: '0901234561',
    serviceId: 'mk1',
    date: '2026-10-03',
    time: '09:30',
    notes: 'Makeup cô dâu tông tự nhiên',
    amount: 1200000,
    depositAmount: 300000,
    depositRefunded: false,
    lateFee: 0,
    paid: true,
    status: 'Đã xác nhận',
  },
]

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Phuong Anh backend is running' })
})

app.get('/api/categories', (_req, res) => {
  res.json(categories)
})

app.get('/api/products', (_req, res) => {
  res.json(products)
})

app.get('/api/products/:id', (req, res) => {
  const product = products.find((item) => item.id === req.params.id)
  if (!product) {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
    return
  }
  res.json(product)
})

app.post('/api/products', (req, res) => {
  const payload = req.body
  const newProduct = {
    ...payload,
    id: `p${Date.now()}`,
    images: payload.images ?? [],
    variants: payload.variants ?? [],
  }
  products.push(newProduct)
  res.status(201).json(newProduct)
})

app.put('/api/products/:id', (req, res) => {
  const index = products.findIndex((item) => item.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật.' })
    return
  }

  products[index] = { ...products[index], ...req.body }
  res.json(products[index])
})

app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex((item) => item.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
    return
  }

  const [removed] = products.splice(index, 1)
  res.json({ message: 'Đã xóa sản phẩm.', removed })
})

app.get('/api/bookings', (_req, res) => {
  res.json(bookings)
})

app.get('/api/makeup-appointments', (_req, res) => {
  res.json(makeupAppointments)
})

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

  res.status(400).json({ message: error.message ?? 'Có lỗi không xác định.' })
})

app.listen(port, () => {
  console.log(`Phuong Anh backend listening on http://localhost:${port}`)
})
