# ── Dashboard Builder — production image (Next.js standalone) ────────────────
# Multi-stage: install deps → build → minimal runtime. Designed for Render
# (and any Docker host). Relies on next.config.ts `output: 'standalone'` and
# `outputFileTracingRoot` so the standalone output is flat at /app.

# NOTE: Debian-based "slim" (not alpine). Alpine's musl/OpenSSL build fails the
# TLS handshake with MongoDB Atlas ("tlsv1 alert internal error", SSL alert 80).
# slim uses standard OpenSSL and connects to Atlas reliably.

# 1. Dependencies (cached layer) ─────────────────────────────────────────────
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build ───────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* are inlined at build time. Provide a build-time default; the
# runtime value should still be set as an env var on the host (it also covers
# server-side reads). Render injects real env vars at build + run.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as non-root.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone server (includes traced node_modules, public/, excel-upload-tool/).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets are NOT auto-included in standalone — copy them in.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Render sets $PORT; Next standalone respects PORT. Default to 3002 locally.
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
EXPOSE 3002

CMD ["node", "server.js"]
