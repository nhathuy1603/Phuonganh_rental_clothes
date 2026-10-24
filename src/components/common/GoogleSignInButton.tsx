import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/api'

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void; ux_mode?: 'popup' }) => void
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client'
let scriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Không tải được Google. Vui lòng kiểm tra mạng.'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

interface GoogleSignInButtonProps {
  /** Nhận ID token Google để gửi cho backend kiểm tra. */
  onCredential: (credential: string) => void
  onError: (message: string) => void
}

/** Nút "Đăng nhập bằng Google"; không hiện gì nếu backend chưa cấu hình GOOGLE_CLIENT_ID. */
export default function GoogleSignInButton({ onCredential, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  // Giữ callback mới nhất mà không phải khởi tạo lại nút Google.
  const handlersRef = useRef({ onCredential, onError })
  handlersRef.current = { onCredential, onError }

  useEffect(() => {
    let isMounted = true
    api.get<{ clientId: string | null }>('/api/customers/google-config')
      .then(async ({ clientId }) => {
        if (!clientId || !isMounted) return
        await loadGoogleScript()
        if (!isMounted || !containerRef.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: (response) => handlersRef.current.onCredential(response.credential),
        })
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          locale: 'vi',
          width: Math.min(containerRef.current.offsetWidth || 320, 400),
        })
        setEnabled(true)
      })
      .catch((error: unknown) => {
        if (isMounted) handlersRef.current.onError(error instanceof Error ? error.message : 'Không tải được Google.')
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="google-signin" hidden={!enabled}>
      <div ref={containerRef} className="google-signin-button" />
      <div className="google-signin-divider"><span>hoặc dùng số điện thoại</span></div>
    </div>
  )
}
