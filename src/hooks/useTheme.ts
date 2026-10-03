import { useCallback, useEffect, useState } from 'react'
import {
  applyTheme,
  getStoredTheme,
  persistTheme,
  systemPrefersDark,
  type ThemeMode,
} from '../services/theme-service'

/** Tương đương isDarkMode() + toggleTheme() của bản gốc, dưới dạng React hook. */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode | null>(() => getStoredTheme())

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  const isDark = mode ? mode === 'dark' : systemPrefersDark()

  const toggle = useCallback(() => {
    const next: ThemeMode = isDark ? 'light' : 'dark'
    persistTheme(next)
    setMode(next)
  }, [isDark])

  return { isDark, toggle }
}
