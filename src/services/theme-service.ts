export type ThemeMode = 'light' | 'dark'

/** Cùng key với bản HTML/JS gốc để người dùng không mất lựa chọn theme đã lưu. */
const STORAGE_KEY = 'pa-theme'

export function getStoredTheme(): ThemeMode | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'dark' || saved === 'light' ? saved : null
  } catch {
    return null
  }
}

export function systemPrefersDark(): boolean {
  return !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Gắn/gỡ thuộc tính data-theme trên <html> — CSS (base.css) dựa vào thuộc tính này. */
export function applyTheme(mode: ThemeMode | null): void {
  if (mode) document.documentElement.setAttribute('data-theme', mode)
}

export function persistTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* bỏ qua: trình duyệt chặn localStorage */
  }
}

/** Gọi 1 lần trước khi render để tránh nhấp nháy sai theme lúc tải trang. */
export function applyStoredTheme(): void {
  applyTheme(getStoredTheme())
}
