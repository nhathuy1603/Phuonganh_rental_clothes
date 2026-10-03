import { useEffect } from 'react'

/**
 * Port của initScrollReveal() + biến _revealObserver toàn cục ở bản gốc.
 * Bản gốc gọi lại hàm này (qua setTimeout 20ms) sau MỌI lần render() — ở đây
 * thay bằng useEffect chạy lại mỗi khi `deps` đổi (thường là trang/danh mục hiện tại),
 * để các phần tử ".reveal" mới xuất hiện (do chuyển trang) cũng được quan sát.
 */
let sharedObserver: IntersectionObserver | null = null

export function useScrollReveal(deps: readonly unknown[]) {
  useEffect(() => {
    const run = () => {
      if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'))
        return
      }
      if (!sharedObserver) {
        sharedObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('in-view')
                sharedObserver?.unobserve(entry.target)
              }
            })
          },
          { threshold: 0.12 },
        )
      }
      document.querySelectorAll('.reveal:not(.in-view)').forEach((el) => sharedObserver?.observe(el))
    }
    const t = setTimeout(run, 20)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
