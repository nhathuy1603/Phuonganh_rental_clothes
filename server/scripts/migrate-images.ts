import { prisma } from '../src/db.js'
import { ensureUploadDir, saveImage } from '../src/storage.js'

/** Chuyển ảnh data URL cũ (lưu thẳng trong DB) thành file trong UPLOAD_DIR. Chạy lại nhiều lần vẫn an toàn. */
async function toStoredImages(images: string[]): Promise<string[] | null> {
  if (!images.some((image) => image.startsWith('data:image/'))) return null
  const converted: string[] = []
  for (const image of images) {
    if (!image.startsWith('data:image/')) {
      converted.push(image)
      continue
    }
    const base64 = image.slice(image.indexOf(',') + 1)
    converted.push(await saveImage(Buffer.from(base64, 'base64')))
  }
  return converted
}

async function main() {
  await ensureUploadDir()
  let updated = 0

  for (const product of await prisma.product.findMany({ select: { id: true, images: true } })) {
    const images = await toStoredImages(product.images)
    if (!images) continue
    await prisma.product.update({ where: { id: product.id }, data: { images } })
    updated++
  }

  for (const service of await prisma.makeupService.findMany({ select: { id: true, images: true } })) {
    const images = await toStoredImages(service.images)
    if (!images) continue
    await prisma.makeupService.update({ where: { id: service.id }, data: { images } })
    updated++
  }

  console.log(`Đã chuyển ảnh cho ${updated} bản ghi.`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
