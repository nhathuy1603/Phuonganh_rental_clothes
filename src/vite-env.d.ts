/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL backend, ví dụ https://api.phuonganhthuedodanang.com */
  readonly VITE_API_BASE_URL?: string
  /** URL storefront, dùng cho nút "Quay lại cửa hàng" khi chạy ở admin.<domain> */
  readonly VITE_STORE_URL?: string
}
