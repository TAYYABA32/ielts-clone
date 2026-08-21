# syntax=docker/dockerfile:1

# ---- deps: install dependencies only (its own stage so it's cached
# independently of application code changes) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# prisma/schema.prisma must be present before `npm ci`: @prisma/client's own
# postinstall script runs `prisma generate` automatically, and needs the
# schema file to do it.
COPY prisma ./prisma
RUN npm ci

# ---- builder: compile the Next.js production build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Re-run generate explicitly in case the schema changed after `deps` was
# cached — cheap, and guarantees the client matches this exact build's schema.
RUN npx prisma generate
# Build-time-only placeholders: `next build` needs these vars to be *set* to
# compile (Clerk's build-time checks, metadata's `new URL(...)` call), but
# never needs them to be *valid* — nothing is contacted at build time. Real
# values are supplied at container run time via `docker run -e` / `env_file`
# / your platform's secrets — see docker-compose.yml and DEPLOYMENT.md.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_placeholder"
ENV CLERK_SECRET_KEY="sk_test_placeholder"
RUN npm run build

# ---- runner: minimal production image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user — never run the production process as root.
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# `output: "standalone"` (next.config.js) traces only the node_modules this
# app actually needs into .next/standalone, instead of shipping the whole
# node_modules tree.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
