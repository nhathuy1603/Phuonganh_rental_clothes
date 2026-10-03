# Phương Anh Backend

REST API for the Phương Anh rental clothes storefront, backed by PostgreSQL through Prisma.

## Scripts

- `npm install`
- `npm run db:generate`
- `npm run dev`
- `npm run build`
- `npm start`

## Local database

1. Start PostgreSQL with Docker Compose from this directory: `docker compose -f compose.yaml up -d`.
2. Copy `.env.example` to `.env`.
3. Run `npm install` and `npm run db:generate`.
4. Run `npm run db:setup` to create the schema and load the starter catalog.
5. Start the API with `npm run dev`.

`DATABASE_URL` can also point to a PostgreSQL instance hosted elsewhere. Keep `.env` private.

## Database commands

- `npm run db:migrate` creates a development migration.
- `npm run db:deploy` applies committed migrations in production.
- `npm run db:seed` safely inserts or updates the starter records.

The API persists product variants, categories, rental bookings, makeup services, and makeup appointments. Image upload still validates files up to 5MB but does not store image files. CORS defaults to the Vite frontend on port 5173.
