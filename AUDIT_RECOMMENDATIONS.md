# Audit Recommendations — Scholarship CRM

**Date:** 2026-11-12  
Prioritized list of improvements. Issues already fixed during this audit are marked [DONE].

---

## Priority 1: Security (Address Before Next Release)

### 1.1 Add Login Rate Limiting
**Risk:** Brute-force password attacks  
**File:** `src/app/api/auth/login/route.ts`

```ts
// Option A: In-memory rate limiter (simple, resets on cold start)
import { RateLimiterMemory } from "rate-limiter-flexible";
const limiter = new RateLimiterMemory({ points: 5, duration: 60 });

// In POST handler:
try {
  await limiter.consume(email);
} catch {
  return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
}
```

For production, use Redis-backed `RateLimiterRedis` or Vercel's Edge middleware with IP-based limiting.

### 1.2 JWT_SECRET Required in Production [DONE]
**File:** `src/lib/auth.ts`  
Added production guard — app now throws at startup if `JWT_SECRET` is not set.

### 1.3 Replace xlsx Package
**Risk:** Prototype pollution + ReDoS — no upstream fix  
**Action:** Replace `xlsx` (SheetJS) with `exceljs`:

```ts
// In src/lib/export.ts, replace xlsx with:
import ExcelJS from "exceljs";
```

ExcelJS is actively maintained and has no known high-severity vulnerabilities.

---

## Priority 2: Reliability (Address This Sprint)

### 2.1 Migrate from `prisma db push` to Migrations
**Current build command:** `prisma db push --skip-generate`  
**Risk:** No migration history; irreversible changes apply silently

**Recommended build command:**
```
prisma generate && prisma migrate deploy && next build
```

Create a baseline migration first: `npx prisma migrate dev --name init`

### 2.2 Add Health Check Endpoint
Create `src/app/api/health/route.ts`:
```ts
export async function GET() {
  return Response.json({ ok: true, ts: Date.now() });
}
```
Use for Vercel uptime monitoring or external ping services.

### 2.3 Add Pagination to Student and Payment Lists
**Files:** `src/components/students/students-client.tsx`, `src/components/payments/payments-client.tsx`  
Current implementation fetches all records. At 500+ students this will be slow.

Add server-side cursor pagination to `/api/students` and `/api/payments`:
```
GET /api/students?page=1&pageSize=50&search=...
```

---

## Priority 3: Code Quality (Next Maintenance Window)

### 3.1 Upgrade Zod to v4
**Risk:** Memory exhaustion in v3 (CVE pending)  
Check the [Zod v4 migration guide](https://zod.dev/changelog) — breaking changes are mostly in advanced schema composition.

### 3.2 Store Language Preference in Cookie
**Files:** `src/context/lang-context.tsx`, `src/app/layout.tsx`  
Current: language stored in `localStorage` → `html lang="en"` hardcoded  
Fix: Set a `crm_lang` cookie on language change; read it in `layout.tsx` for correct `<html lang>` attribute.

```ts
// In layout.tsx (server component):
const lang = cookies().get("crm_lang")?.value ?? "uz";
return <html lang={lang}>
```

### 3.3 Add `aria-label` to Icon-Only Buttons
Several buttons show only an icon with no text label. Add `aria-label` for screen reader support:
```tsx
<Button aria-label={t.common.delete} variant="ghost" size="icon">
  <Trash2 className="h-4 w-4" />
</Button>
```

### 3.4 Add Settings Key Allowlist
**File:** `src/app/api/settings/route.ts`  
The PATCH handler accepts any key. Add an explicit allowlist:
```ts
const ALLOWED_KEYS = new Set([
  "telegram_alert_days_before",
  "weekly_summary_enabled", 
  "weekly_summary_day",
]);
```

### 3.5 Clean Up Unused Translation Key
**File:** `src/constants/translations.ts`  
The `timeOfDay` translation key is no longer used in any component (settings UI was updated to remove the time picker). Remove from both `uz` and `ru` translation objects.

---

## Priority 4: Performance (Backlog)

### 4.1 Analytics Query Optimization
**File:** `src/app/api/analytics/route.ts`  
Currently fetches all payments with joins and groups them in JS memory. For large datasets, move aggregation to the database:
```ts
// Use Prisma groupBy or raw SQL aggregates
const revenueByBatch = await db.payment.groupBy({
  by: ["student.batch.id"],
  _sum: { amountDue: true, amountPaid: true },
});
```

### 4.2 Add Date Range Filtering to Analytics
Allow filtering analytics by date range to reduce data volume and improve UX.

### 4.3 Add Response Caching for Dashboard
The dashboard data (`/api/dashboard`) rarely changes in real time. Add a short cache:
```ts
export const revalidate = 60; // 1-minute ISR cache
```

---

## Summary Table

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | Login rate limiting | Small | High security |
| 1 | Replace xlsx | Medium | High security |
| 2 | Prisma migrations | Medium | High reliability |
| 2 | Health check endpoint | Tiny | Medium reliability |
| 2 | Pagination | Medium | Medium reliability |
| 3 | Zod v4 upgrade | Medium | Medium security |
| 3 | Cookie-based language | Small | Low quality |
| 3 | Aria labels | Small | Medium accessibility |
| 3 | Settings key allowlist | Tiny | Low security |
| 4 | Analytics optimization | Large | Medium performance |
