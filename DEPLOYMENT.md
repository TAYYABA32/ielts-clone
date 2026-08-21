# Deployment Guide — IELTS Clone

**Date:** 2026-08-05

## Honest verification status

Everything in this document was checked as thoroughly as this environment allows:
- **Docker itself is not installed in this environment**, so the full `docker build`/`docker run` cycle has not been executed end-to-end. What *was* verified directly: the `standalone` output actually produces `.next/standalone/server.js` (confirmed via a real `next build`), and that exact server — run with `node .next/standalone/server.js`, the Dockerfile's precise `CMD` — was started twice: once with a required env var deliberately unset (confirmed it fails fast with `process.exit(1)` and a clear message — see Production Environment Validation below, which caught a real bug this way) and once with all required vars present (confirmed it starts normally and `/api/health` responds correctly). The one thing not exercised is the Docker layer/image-build mechanics themselves (COPY paths, multi-stage caching) — run `docker build` once before relying on this in production.
- **Supabase Storage, Upstash Redis, Resend, and Sentry** are all implemented and safe-without-credentials (each fails open/no-ops rather than crashing — see `PROJECT_ANALYSIS.md`), but none has been exercised against a live account from this environment except Sentry's build-time integration and Supabase's Postgres connection (both genuinely verified live in M4.1). Smoke-test each before go-live — see the checklist at the end of this document.

---

## Production environment validation

`lib/env.ts` + `instrumentation.ts` validate `DATABASE_URL`, `DIRECT_URL`, `CLERK_SECRET_KEY`, and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` at process startup (not per-request) — a misconfigured deployment fails immediately with a clear message naming every missing variable, instead of failing confusingly deep inside the first request that happens to touch Prisma or Clerk. Deliberately **not** required: `SENTRY_DSN`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`/`TOKEN` — these already have designed fail-safe behavior (no-op provider, fail-open rate limiting), and making them required here would contradict that design and block a valid deployment that simply hasn't set up optional observability/email/rate-limiting yet.

**Verified, not assumed — and a real bug caught in the process:** the first implementation threw inside `register()` but didn't actually call `process.exit()`. Testing against the *actual* standalone server (`node .next/standalone/server.js` — the exact command the Dockerfile's `CMD` runs, not `next start`, which as of `output: "standalone"` prints its own warning that it's the wrong way to run this build) showed Next.js logs an instrumentation-hook error but does **not** treat it as fatal by default: the process logged the error and then reported "Ready" anyway, continuing to serve requests in a broken, half-validated state. Fixed by explicitly calling `process.exit(1)` on validation failure. Re-verified both directions: with `CLERK_SECRET_KEY` unset, the standalone server now logs the exact missing variable and exits with code 1 (no "Ready" state ever reached); with all required vars present, it starts normally and `/api/health` responds correctly.

## Environment variables

See `.env.example` for the full list with inline explanations. Grouped by whether the app breaks without them:

| Required (validated at startup) | Optional (fails open/no-ops without it) |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`/`PROJECT`/`AUTH_TOKEN` |
| `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `RESEND_API_KEY`, `EMAIL_PROVIDER`, `EMAIL_FROM_ADDRESS` |
| | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` — **functionally required** for file uploads to work (admin content, speaking recordings) even though nothing crashes without them; treat as required in practice |
| | `NEXT_PUBLIC_APP_URL`, `LOG_LEVEL` |

---

## Deploying to Vercel

The path this app was built closest to (Clerk + Next.js App Router + Vercel is a well-trodden combination).

1. Import the repo in the Vercel dashboard (or `vercel` CLI) — build command and output are auto-detected for Next.js, no config needed.
2. Set every variable from the table above in **Project Settings → Environment Variables** (Production + Preview as appropriate). `NEXT_PUBLIC_*` variables must be set before the build that needs them, since they're inlined at build time.
3. `npx prisma generate` runs automatically via `@prisma/client`'s own postinstall hook during Vercel's `npm install` step — no extra build command needed.
4. If using Sentry's source-map upload, also set `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` — `withSentryConfig` (`next.config.js`) picks these up automatically; omit them and it just skips upload with a warning (confirmed safe — this environment's own builds ran without them throughout this whole project).
5. Point your domain's DNS at Vercel; HTTPS/CDN are automatic.
6. After first deploy, hit `/api/health` and `/api/health/ready` to confirm liveness and DB connectivity (see the checklist).

**Vercel-specific note:** the `output: "standalone"` setting in `next.config.js` is inert on Vercel (it's specifically for the Docker path) — Vercel uses its own build output format regardless.

## Deploying with Docker

For self-hosting on any container platform (a VPS, DigitalOcean App Platform, AWS ECS, etc.).

```bash
# Build
docker build -t ielts-clone .

# Run (bring your own real .env — see .env.example)
docker run -p 3000:3000 --env-file .env ielts-clone
```

Or via Compose (includes a self-hosted Postgres container — see the file's own comments if you're using an external database like Supabase instead):

```bash
cp .env.example .env   # fill in real values
docker compose up --build
```

**Reverse proxy:** the container serves plain HTTP on port 3000 — put a reverse proxy (Caddy, nginx, Traefik) in front for TLS termination and your real domain if self-hosting on a bare VPS; a platform like Railway/Fly/DO App Platform handles this for you.

**Database:** if self-hosting Postgres via the bundled `docker-compose.yml`, you own backups/PITR yourself (see Backup Strategy below) — Supabase's managed backup features don't apply to a container you're running. If you'd rather keep Supabase as the database (recommended — this schema's `DATABASE_URL`/`DIRECT_URL` split is specifically tuned for Supabase's PgBouncer pooling), delete the `postgres` service from `docker-compose.yml` and put your real Supabase connection strings in `.env` instead.

**Rate limiting caveat:** Upstash's rate limiter (`lib/rateLimit/*`) talks to Upstash over its REST API, not the standard Redis wire protocol — a self-hosted Redis container is **not** a drop-in replacement. Self-hosted deployments either need a real Upstash account (works from anywhere, not Vercel-specific) or accept that rate limiting fails open (already designed to do so — see `SECURITY_AUDIT.md`) until one is configured.

## Deploying to Railway

1. Connect the repo — Railway detects the `Dockerfile` automatically and builds from it (or uses Nixpacks if you remove/rename the Dockerfile; the Dockerfile path is more predictable given the Prisma-generate-on-install requirement).
2. Set every variable from the environment-variables table in Railway's dashboard under the service's **Variables** tab.
3. If you want Railway to host Postgres too: add Railway's Postgres plugin and point `DATABASE_URL`/`DIRECT_URL` at it (both to the same connection — Railway's Postgres doesn't have Supabase's separate pooled/direct distinction, so a single connection string for both is correct here, unlike the Supabase setup this schema's comments describe). Otherwise keep using external Supabase, same as the Vercel path.
4. Railway assigns a public domain automatically (or attach your own); TLS is automatic.

---

## Backup strategy

- **If using Supabase (recommended, and what this project was built/tested against):** Supabase provides automatic daily backups on paid plans, with point-in-time recovery (PITR) on higher tiers — enable PITR if your RPO (recovery point objective) needs to be tighter than 24 hours. Configure via the Supabase dashboard → Database → Backups.
- **Manual backup (works regardless of hosting):** `pg_dump` against `DIRECT_URL` (not `DATABASE_URL` — PgBouncer transaction-mode pooling doesn't support the session-level operations a full dump needs, same reason `prisma migrate` requires `DIRECT_URL`):
  ```bash
  pg_dump "$DIRECT_URL" -F c -f "backup-$(date +%Y%m%d).dump"
  ```
  Restore with `pg_restore -d "$DIRECT_URL" backup-YYYYMMDD.dump`. Schedule this via cron/a CI job if not relying on Supabase's built-in backups.
- **File storage (Supabase Storage):** uploaded audio/images do **not** get the same PITR guarantees as the Postgres database — back these up separately if retention matters (e.g. a periodic `rclone`/`aws s3 sync`-style copy to a second bucket or provider, since Supabase Storage is S3-compatible).
- **What's *not* backed up by any of the above:** anything in Sentry/Upstash/Resend — those are third-party SaaS with their own retention policies, not this app's data to back up.

## Disaster recovery

| Scenario | Recovery steps |
|---|---|
| **Database corruption / bad data** | Restore from the most recent Supabase backup (dashboard → Database → Backups → Restore) or your own `pg_dump`. Prisma migrations are idempotent/ordered (`prisma/migrations/`), so a fresh restore + `prisma migrate deploy` brings schema and data back in sync. |
| **Full Supabase project loss** | Provision a new Supabase project, run `prisma migrate deploy` against it to recreate the schema from `prisma/migrations/` (the source of truth — not a snapshot), restore data from your most recent `pg_dump`, update `DATABASE_URL`/`DIRECT_URL` in your deployment platform, redeploy. |
| **Bad application deployment** | Vercel: roll back to the previous deployment via the dashboard (instant, no rebuild). Docker/Railway: redeploy the previous image tag. Neither requires a database change, since app rollback and schema migrations are handled independently (per the standing `DATABASE_MIGRATION_PLAN.md` policy — never migrate and deploy as one inseparable step). |
| **Compromised credentials** (leaked API key, etc.) | Rotate the specific key at its source (Clerk dashboard, Supabase project settings, Upstash console, Resend dashboard, Sentry project settings) and redeploy with the new value — none of this app's own code stores or logs full credential values (`lib/logger.ts`'s `redact` config is a safety net, not the primary control). |

## Production checklist

- [ ] All required env vars set (see table above); `/api/health` and `/api/health/ready` both return 200 against the deployed instance.
- [ ] Supabase Storage bucket created and `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_STORAGE_BUCKET` set — smoke-test one admin upload and one speaking-recording upload (M1.4's flagged gap).
- [ ] Upstash Redis database created and `UPSTASH_REDIS_REST_URL`/`TOKEN` set — confirm a real `429` fires past a tier's limit (M2.3's flagged gap).
- [ ] Resend (or your chosen `EMAIL_PROVIDER`) configured and `RESEND_API_KEY` set — confirm one real grading-notification email arrives (M3.3's flagged gap).
- [ ] Sentry project created, `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` set — confirm a deliberately-triggered error actually appears in the Sentry dashboard.
- [ ] `DATABASE_MIGRATION_PLAN.md`'s 6 pending proposals reviewed and either applied (`prisma migrate deploy`) or explicitly deferred — don't let this document silently go stale.
- [ ] `next.config.js`'s CSP is still `Content-Security-Policy-Report-Only` — after confirming zero violations in real browser usage against the live domain, flip the header key to `Content-Security-Policy` (enforcing). Don't flip it blind.
- [ ] `robots.txt`/`sitemap.xml` verified against the live domain (not just localhost) — `NEXT_PUBLIC_APP_URL` must be the real production URL for these to be correct.
- [ ] `SECURITY_AUDIT.md`'s 3 remaining Medium findings reviewed (CSRF cookie verification against the live Clerk instance, speaking-recording URL exposure policy, CONTENT_EDITOR module-deletion scope) — each needs a judgment call or live check, not just a code change.
- [ ] A full `docker build`/`docker run` cycle actually executed at least once if using the Docker deployment path (not verified in this environment — see the note at the top of this document).
