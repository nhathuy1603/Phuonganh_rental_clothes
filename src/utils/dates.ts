/**
 * Port nguyên từ config/constants.js + utils/format-utils.js (phần liên quan ngày tháng) của bản gốc.
 * TODAY_ISO cố định tại thời điểm module này được nạp (giống bản gốc dùng `const TODAY = new Date()`
 * ở top-level) — dữ liệu mẫu (bookings) dùng addDays(TODAY_ISO, n) để luôn "mới" so với ngày chạy thử.
 */
const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function localIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const TODAY_ISO = localIsoDate(TODAY)

export function addDays(base: string, n: number): string {
  const d = new Date(`${base}T00:00:00`)
  d.setDate(d.getDate() + n)
  return localIsoDate(d)
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function diffDays(a: string, b: string): number {
  const toUtcDay = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  return Math.round((toUtcDay(b) - toUtcDay(a)) / 86400000)
}

export function rentalDays(pickup: string, due: string): number {
  return Math.max(1, diffDays(pickup, due))
}
