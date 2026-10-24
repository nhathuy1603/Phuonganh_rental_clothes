# Phương Anh Backend

REST API for the Phương Anh rental clothes storefront, backed by PostgreSQL through Prisma.

## Scripts

- `npm install`
- `npm run db:generate`
- `npm run dev`
- `npm run build`
- `npm start` (or `npm run start:prod` to apply migrations first)

## Local database

1. Start PostgreSQL with Docker Compose from this directory: `docker compose -f compose.yaml up -d`.
2. Copy `.env.example` to `.env`.
3. Run `npm install` and `npm run db:generate`.
4. Create the admin login: `npm run admin:hash -- "your-password"` and paste the printed line into `.env`. Set `AUTH_SECRET` to a random string.
5. Run `npm run db:setup` to create the schema and load the starter catalog.
6. Start the API with `npm run dev`.

`DATABASE_URL` can also point to a PostgreSQL instance hosted elsewhere. Keep `.env` private.

## Database commands

- `npm run db:migrate` creates a development migration.
- `npm run db:deploy` applies committed migrations in production.
- `npm run db:seed` safely inserts or updates the starter records.
- `npm run db:seed:makeup` restores missing default makeup services without changing existing services.

## Admin authentication

There is one admin account, configured through `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (scrypt). `POST /api/auth/login` returns a signed token valid for `ADMIN_SESSION_HOURS`; the admin UI sends it as `Authorization: Bearer <token>`. Changing `AUTH_SECRET` logs every admin out. After 10 failed logins from one IP, login is locked for 15 minutes.

Public routes (no login): `GET /api/categories`, `GET /api/products`, `GET /api/makeup-services`, `GET /api/bookings/availability` (dates only, no customer data), `POST /api/bookings/checkout`, `POST /api/makeup-appointments/request`. Every other `/api` route requires the admin token.

## Customer accounts

Customers sign up and log in with phone number + password (`POST /api/customers/register`, `POST /api/customers/login`). Phone numbers are normalized (`+84 905…` → `0905…`). The customer token lasts 30 days and only works on `/api/customers/*`; it cannot reach admin routes, and the admin token cannot reach customer routes.

Accounts are optional: guests can still check out. Orders placed while logged in get a `customerId`, and `GET /api/customers/me/orders` returns only those. Earlier guest orders are not matched by phone, because signing up does not verify that the person owns the number. There is no password reset yet, neither self-service nor from the admin dashboard.

### Sign in with Google

Set `GOOGLE_CLIENT_ID` to enable it; leave it empty and the button stays hidden. The frontend reads the ID from `GET /api/customers/google-config`, so it only has to be set on the backend. `POST /api/customers/google` verifies the Google ID token (signature, expiry and audience) with `google-auth-library` and creates or finds the customer by Google account ID. Google does not share phone numbers, so a new Google account starts without one and "Đơn của tôi" asks for it (`PUT /api/customers/me/phone`). A phone number that already belongs to another account is refused; that person should log in with phone + password instead.

Creating the Client ID (free): Google Cloud Console → APIs & Services → OAuth consent screen (External, app name, support email), then Credentials → Create credentials → OAuth client ID → Web application. Under "Authorized JavaScript origins" add every frontend origin, for example `http://localhost:5173`, `https://phuonganhthuedodanang.com`, `https://www.phuonganhthuedodanang.com`. No redirect URI is needed.

Customer checkout and makeup requests only accept the customer's choices; prices, deposits and status are computed on the server, and checkout refuses dates that are already fully booked.

## Images

`POST /api/admin/upload-image` accepts JPG, PNG or WebP up to 5MB (checked against the file content, not only the browser's mimetype), saves it to `UPLOAD_DIR` and returns its public URL under `PUBLIC_API_URL/uploads/`. When a product or makeup service drops an image, or is deleted, the file is removed once nothing else uses it.

- `npm run images:migrate` converts old base64 images stored in the database into files. Safe to run more than once.
- `npm run images:clean` deletes uploaded files older than one day that no product or service uses (for example an upload followed by Cancel). Run it occasionally or from a cron job.

## Production

1. Copy `.env.production.example` and fill in every value. The server refuses to start in production without `AUTH_SECRET` (32+ characters) and `ADMIN_PASSWORD_HASH`.
2. Build with `npm run build`, then start with `npm run start:prod`, which applies migrations before starting. Or build the `Dockerfile` in this directory.
3. Mount persistent storage at `UPLOAD_DIR` (default `/data/uploads` in Docker). Without a persistent disk, uploaded images are lost on every redeploy.
4. Set `TRUST_PROXY=true` behind Nginx, Render or Railway so the login rate limit sees real client IPs.

Suggested domains: storefront `phuonganhthuedodanang.com`, admin `admin.phuonganhthuedodanang.com` (the same frontend build opens the dashboard directly on an `admin.` host), API `api.phuonganhthuedodanang.com`. List both frontend origins in `CORS_ORIGINS`.

Frontend environment (Vercel/Netlify): `VITE_API_BASE_URL=https://api.phuonganhthuedodanang.com`, and on the admin site `VITE_STORE_URL=https://phuonganhthuedodanang.com`.
