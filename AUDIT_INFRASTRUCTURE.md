# Audit Infrastructure Report — Scholarship CRM

**Date:** 2026-11-12

---

## Deployment Platform

**Vercel** — Serverless Next.js deployment

### Build Command
```
prisma generate && prisma db push --skip-generate && next build
```

**Note:** `prisma db push` runs on every deploy. This applies schema changes without migrations. Acceptable for early-stage projects but introduces risk:
- No migration history
- Irreversible schema changes could silently apply
- Recommend migrating to `prisma migrate deploy` for production

### Cron Job
- **Schedule:** `0 8 * * *` (08:00 UTC daily)
- **Route:** `GET /api/cron`
- **Auth:** `Authorization: Bearer {CRON_SECRET}`
- **Config:** `vercel.json`

```json
{
  "crons": [{ "path": "/api/cron", "schedule": "0 8 * * *" }]
}
```

---

## Database

**Neon PostgreSQL** (serverless)

- Connection via `DATABASE_URL` env var
- Prisma singleton pattern to prevent connection exhaustion in serverless
- Prisma log level: `["error", "warn"]` in development, `["error"]` in production

### Schema Models
| Model | Purpose |
|-------|---------|
| `User` | Admin/Assistant accounts |
| `Batch` | Cohort/batch of students |
| `Student` | Student records (archived flag for soft delete) |
| `Package` | Pricing packages |
| `Scholarship` | Scholarship definitions |
| `DiscountType` | Discount configurations |
| `ProgressStage` | Student progress stages |
| `Payment` | Payment obligations per student |
| `Installment` | Partial payments against a Payment |
| `Attendance` | Per-student attendance records |
| `AppSetting` | Key-value configuration store |

---

## Environment Variables

### Required
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (now enforced in production) |
| `CRON_SECRET` | Bearer token for cron endpoint |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |

### Optional / Conditional
| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | Set automatically by Vercel |

**Security Note:** `JWT_SECRET` is now required in production — the app will throw at startup if missing (fixed during this audit).

---

## Next.js Configuration

**File:** `next.config.ts`

Current config (after audit fix):
```ts
const nextConfig: NextConfig = {};
export default nextConfig;
```

Previous config had `serverActions.allowedOrigins: ["localhost:3000"]` which blocked production server actions (fixed).

---

## Package Analysis

### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.1.x | Framework |
| react | 19.x | UI |
| prisma | 5.22.0 | ORM |
| @prisma/client | 5.22.0 | DB client |
| jose | 5.x | JWT |
| bcryptjs | 2.x | Password hashing |
| recharts | 2.x | Charts |
| xlsx | 0.18.5 | Excel export ⚠️ |
| zod | 3.x | Validation ⚠️ |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.x | Type checking |
| tailwindcss | 3.x | Styling |
| @playwright/test | — | E2E tests |
| eslint | — | Linting |

---

## SEO / Crawlability

- **robots.txt:** `src/app/robots.ts` → disallows all crawlers (added during audit)
- **sitemap.xml:** None — appropriate for private internal CRM
- **favicon:** Default Next.js favicon (no custom one)
- **meta description:** "Mentorship scholarship management system"
- **Open Graph tags:** None — not needed for private CRM

---

## Monitoring

- No application monitoring (Sentry, Datadog, etc.) configured
- Vercel provides basic deployment logs and function logs
- Telegram notifications serve as a lightweight operational alert system
- No health check endpoint (`/api/health` missing)

**Recommendation:** Add `/api/health` endpoint returning `{ ok: true, ts: Date.now() }` for uptime monitoring.
