# Build stage: full deps for build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit

# Generate Prisma client
COPY prisma prisma
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Run stage: production deps only
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Install production dependencies (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --prefer-offline --no-audit

# Generate Prisma client for production
COPY prisma prisma
RUN npx prisma generate

# Copy built app from builder
COPY --from=builder /app/build ./build

# Migrations run at startup (needs DATABASE_URL). Then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
