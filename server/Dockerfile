# API Phương Anh: build TypeScript rồi chạy bằng Node, migrate DB khi khởi động.
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate
COPY --from=build /app/dist ./dist
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
ENV UPLOAD_DIR=/data/uploads
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
