# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: Dependencies (cached independently from the application source)
# ---------------------------------------------------------------------------
# Node 20 reached end-of-life in April 2026; build and run on the active LTS.
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2: Build (Next.js standalone compilation)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Public, build-time environment variables are inlined into the client bundle.
# Pass them with `--build-arg` so the runtime image never embeds server secrets.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_PAYMENT_PROVIDER
ARG NEXT_PUBLIC_SENTRY_DSN

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} \
    NEXT_PUBLIC_PAYMENT_PROVIDER=${NEXT_PUBLIC_PAYMENT_PROVIDER} \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Secure, minimal production runtime (runs as a non-root user)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

# tini reaps zombies and forwards SIGTERM so `docker stop` shuts Node down
# gracefully instead of waiting for the SIGKILL timeout. `apk upgrade` pulls
# in fixes published after the base image was built.
RUN apk upgrade --no-cache && apk add --no-cache tini

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --no-create-home nextjs

# Next.js standalone output ships server.js plus a minimal node_modules tree.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

