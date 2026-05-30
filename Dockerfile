# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts && \
    npm ci --ignore-scripts

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG DATABASE_URL
ARG JWT_SECRET
ARG NEXTAUTH_SECRET
ARG LICENSE_MASTER_SECRET

RUN DATABASE_URL=${DATABASE_URL} \
    JWT_SECRET=${JWT_SECRET} \
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    LICENSE_MASTER_SECRET=${LICENSE_MASTER_SECRET} \
    DOCKER_BUILD=true \
    npm run build --ignore-scripts || \
    (echo "Build tanpa migrate..." && \
    JWT_SECRET=${JWT_SECRET} \
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    LICENSE_MASTER_SECRET=${LICENSE_MASTER_SECRET} \
    DOCKER_BUILD=true \
    npx next build)

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Entry script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
