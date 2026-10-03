import { useCallback, useEffect, useState } from 'react'

/** Port của cơ chế STATE.toast (tự ẩn sau 2.6s) ở bản gốc, dưới dạng hook. */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 2600)
    return () => clearTimeout(t)
  }, [message])

  const showToast = useCallback((msg: string) => setMessage(msg), [])

  return { toastMessage: message, showToast }
}
