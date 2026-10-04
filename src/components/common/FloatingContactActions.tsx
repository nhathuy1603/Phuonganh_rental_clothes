import { useEffect, useState } from 'react'

const PHONE_NUMBER = '0901234567'
const FACEBOOK_PAGE_URL = 'https://www.facebook.com/profile.php?id=61550858204802'

export default function FloatingContactActions() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const updateScrollState = () => setShowScrollTop(window.scrollY > 320)
    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollState)
  }, [])

  return (
    <aside className="floating-contact-actions" aria-label="Liên hệ nhanh">
      {showScrollTop && (
        <button
          type="button"
          className="floating-contact-button floating-scroll-button"
          aria-label="Cuộn lên đầu trang"
          title="Lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
      <a
        className="floating-contact-button floating-zalo-button"
        href={`https://zalo.me/${PHONE_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Nhắn tin qua Zalo"
        title="Nhắn tin qua Zalo"
      >
        <span aria-hidden="true">Zalo</span>
      </a>
      <a
        className="floating-contact-button floating-facebook-button"
        href={FACEBOOK_PAGE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Mở Fanpage Phương Anh trên Facebook"
        title="Fanpage Facebook"
      >
        <span aria-hidden="true">f</span>
      </a>
    </aside>
  )
}
