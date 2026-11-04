FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/library_db"
RUN npx prisma generate
RUN npm run build
RUN node scripts/copy-runtime-modules.mjs

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/runtime-modules ./node_modules
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
