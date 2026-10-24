import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { config } from './config.js'
import { prisma } from './db.js'
import { HttpError } from './errors.js'

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const UPLOAD_ROUTE = '/uploads'

const uploadUrlPrefix = `${config.publicApiUrl}${UPLOAD_ROUTE}/`

/** Nhận diện định dạng theo nội dung file, không tin vào mimetype trình duyệt gửi lên. */
function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

export async function ensureUploadDir(): Promise<void> {
  await mkdir(config.uploadDir, { recursive: true })
}

export async function saveImage(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) throw new HttpError(400, 'Ảnh vượt quá giới hạn 5MB.')
  const extension = detectImageExtension(buffer)
  if (!extension) throw new HttpError(400, 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.')

  const filename = `${new Date().toISOString().slice(0, 7)}-${randomUUID()}.${extension}`
  await writeFile(path.join(config.uploadDir, filename), buffer)
  return `${uploadUrlPrefix}${filename}`
}

function storedFilename(url: string): string | null {
  if (!url.startsWith(uploadUrlPrefix)) return null
  const filename = url.slice(uploadUrlPrefix.length)
  return /^[\w-]+\.(jpg|png|webp)$/.test(filename) ? filename : null
}

/** Xóa file ảnh không còn sản phẩm hay dịch vụ makeup nào dùng tới. */
export async function deleteUnusedImages(urls: string[]): Promise<void> {
  for (const url of new Set(urls)) {
    const filename = storedFilename(url)
    if (!filename) continue
    const [productUses, serviceUses] = await Promise.all([
      prisma.product.count({ where: { images: { has: url } } }),
      prisma.makeupService.count({ where: { images: { has: url } } }),
    ])
    if (productUses + serviceUses > 0) continue
    await unlink(path.join(config.uploadDir, filename)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') console.error('Không xóa được ảnh cũ', filename, error)
    })
  }
}
