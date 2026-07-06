# syntax=docker/dockerfile:1

# ---------- Stage 1: deps ----------
FROM node:22-slim AS deps
WORKDIR /app
# openssl cần cho Prisma
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage 2: builder ----------
FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client (output: src/generated/prisma) — bị gitignore nên phải sinh lại
RUN npx prisma generate
# Build Next.js standalone
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# DB nằm trên volume /data
ENV DATABASE_URL=file:/data/prod.db

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs \
    && mkdir -p /data && chown -R nextjs:nodejs /data

# --- Next.js standalone output ---
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# --- Những gì cần để chạy prisma db push + seed lúc khởi động ---
# Prisma schema, config, seed, và generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
# node_modules đầy đủ cần cho prisma CLI + tsx + adapter (standalone chỉ gói cho runtime app)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
VOLUME ["/data"]

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
