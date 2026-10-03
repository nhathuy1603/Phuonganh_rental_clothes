/**
 * Dùng cho các thẻ <a href="#"> điều hướng: chặn nhảy trang rồi chạy hành động.
 * Thay cho mẫu `onclick="...;return false;"` lặp lại rất nhiều lần ở bản gốc.
 */
export function preventAnd(action?: () => void) {
  return (e: { preventDefault(): void }) => {
    e.preventDefault()
    action?.()
  }
}
