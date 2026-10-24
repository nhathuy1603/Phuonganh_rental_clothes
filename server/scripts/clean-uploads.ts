import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { config } from '../src/config.js'
import { prisma } from '../src/db.js'
import { deleteUnusedImages, UPLOAD_ROUTE } from '../src/storage.js'

/**
 * Xóa ảnh đã upload nhưng không được lưu vào sản phẩm / dịch vụ nào
 * (ví dụ admin tải ảnh lên rồi bấm Huỷ). Bỏ qua file mới hơn 1 ngày để không đụng form đang mở.
 */
const MIN_AGE_MS = 24 * 60 * 60 * 1000

async function main() {
  const now = Date.now()
  const candidates: string[] = []
  for (const filename of await readdir(config.uploadDir)) {
    const info = await stat(path.join(config.uploadDir, filename))
    if (info.isFile() && now - info.mtimeMs > MIN_AGE_MS) {
      candidates.push(`${config.publicApiUrl}${UPLOAD_ROUTE}/${filename}`)
    }
  }
  const before = (await readdir(config.uploadDir)).length
  await deleteUnusedImages(candidates)
  const after = (await readdir(config.uploadDir)).length
  console.log(`Đã xóa ${before - after} ảnh không dùng (kiểm tra ${candidates.length} file cũ hơn 1 ngày).`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
