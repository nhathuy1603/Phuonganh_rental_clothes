/** Định dạng tiền VND — port nguyên từ money() của bản gốc. */
export function money(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ'
}
