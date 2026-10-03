interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
  extraClass?: string
}

/** Port của renderThemeToggle() gốc. */
export default function ThemeToggle({ isDark, onToggle, extraClass = '' }: ThemeToggleProps) {
  return (
    <button
      className={`icon-btn ${extraClass}`}
      onClick={onToggle}
      aria-label="Đổi giao diện sáng/tối"
      title="Chế độ sáng / tối"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
