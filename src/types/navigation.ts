/**
 * Các "đích" điều hướng của phía khách hàng.
 * Thay thế cho các hàm goCatalog()/goContact()/goMakeupDetail()... của bản HTML/JS gốc.
 * Ở bước 2e sẽ được ánh xạ sang route thật của React Router.
 */
export type NavTarget =
  | { page: 'home' }
  | { page: 'catalog'; category: string }
  | { page: 'contact' }
  | { page: 'makeup-hub' }
  | { page: 'makeup-detail'; id: string }
  | { page: 'login' }
  | { page: 'admin' }

export type PageKey = NavTarget['page']
