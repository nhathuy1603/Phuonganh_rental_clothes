interface ToastProps {
  message: string | null
}

/** Port của khối `${STATE.toast ? ... }` trong render() gốc. */
export default function Toast({ message }: ToastProps) {
  if (!message) return null
  return <div className="toast">{message}</div>
}
