# syntax=docker/dockerfile:1
# Pinned Node 20.19 + corepack install (reads packageManager field → pnpm 10.32.1).
# `corepack enable` alone pulls latest pnpm (needs Node 22) and fails — use install.

FROM node:20.19-alpine3.21 AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack install
RUN pnpm install --frozen-lockfile

FROM node:20.19-alpine3.21 AS builder
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN corepack install
# Convex client + CSP origins are baked at build time (NEXT_PUBLIC_*). Pass YOUR
# deployment's URLs as build args (Dokploy → Build Args, or `--build-arg`). SITE_URL
# must be baked too, else next.config's CSP allowlists the wrong .convex.site.
ARG NEXT_PUBLIC_CONVEX_URL=https://YOUR-DEPLOYMENT.convex.cloud
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_SITE_URL=https://YOUR-DEPLOYMENT.convex.site
ENV NEXT_PUBLIC_CONVEX_SITE_URL=$NEXT_PUBLIC_CONVEX_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM node:20.19-alpine3.21 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# curl is required by Dokploy's injected healthcheck (curl -f .../api/health).
# Without it the probe exits -1 → container "unhealthy" → Traefik 502.
RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
