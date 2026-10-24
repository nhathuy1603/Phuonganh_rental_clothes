import { hashPassword } from '../src/password.js'

// Dùng: npm run admin:hash -- "mat-khau-moi"  → dán kết quả vào ADMIN_PASSWORD_HASH
const password = process.argv[2]
if (!password || password.length < 10) {
  console.error('Hãy truyền mật khẩu dài ít nhất 10 ký tự: npm run admin:hash -- "mat-khau-moi"')
  process.exit(1)
}

// Bọc trong nháy đơn vì hash có ký tự $, dotenv sẽ giữ nguyên.
console.log(`ADMIN_PASSWORD_HASH='${hashPassword(password)}'`)
