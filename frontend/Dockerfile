# syntax=docker/dockerfile:1

# ---- deps: install node modules ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate prisma client + build Next.js ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at BUILD time, so the
# public backend URL must be a build arg — it cannot be changed at runtime.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000

# Other values here are build-time placeholders — real DATABASE_URL / auth secrets
# are injected at runtime; no DB or auth call happens during the build.
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
    NEXTAUTH_SECRET="build-time-placeholder" \
    NEXTAUTH_URL="http://localhost:3000"

RUN npx prisma generate
RUN npm run build

# ---- migrator: full node_modules so the Prisma CLI can run `migrate deploy` ----
# (the standalone runner below strips the CLI's own dependency tree)
FROM node:20-bookworm-slim AS migrator
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- runner: minimal standalone server ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone bundle + static assets + public dir
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma generated client + engine (schema needed for `migrate deploy` at deploy time)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
