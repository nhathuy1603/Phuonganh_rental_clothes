import { api } from './api'

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_IMAGE_EDGE_PX = 1600

/** Thu nhỏ ảnh về tối đa 1600px cạnh dài, xuất JPEG để upload nhẹ hơn. */
function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`File “${file.name}” không phải ảnh hợp lệ.`))
    }
    image.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_IMAGE_EDGE_PX / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Trình duyệt không hỗ trợ xử lý ảnh.'))
        return
      }
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Không thể xử lý ảnh.')), 'image/jpeg', 0.85)
    }
    image.src = url
  })
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', await resizeImage(file), file.name.replace(/\.\w+$/, '') + '.jpg')
  const { url } = await api.upload<{ url: string }>('/api/admin/upload-image', form)
  return url
}

/**
 * Kiểm tra giới hạn 5MB rồi upload lần lượt. Trả về link các ảnh đã lưu
 * và thông báo lỗi (nếu có) để form hiển thị.
 */
export async function uploadImages(files: File[]): Promise<{ urls: string[]; error: string | null }> {
  const oversized = files.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES)
  const errors = oversized.length > 0
    ? [`Ảnh vượt quá 5MB: ${oversized.map((file) => file.name).join(', ')}. Vui lòng chọn ảnh nhỏ hơn 5MB.`]
    : []

  const urls: string[] = []
  for (const file of files.filter((candidate) => candidate.size <= MAX_IMAGE_SIZE_BYTES)) {
    try {
      urls.push(await uploadImage(file))
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Không thể tải ảnh “${file.name}”.`)
    }
  }
  return { urls, error: errors.length > 0 ? errors.join(' ') : null }
}
