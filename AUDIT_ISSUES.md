# Audit Issues — Scholarship CRM

**Date:** 2026-11-12

---

## Fixed Issues

| ID | Severity | File | Description | Fix Applied |
|----|----------|------|-------------|-------------|
| FIX-01 | Critical | `src/app/api/cron/route.ts` | Overdue race condition: `updateMany` ran after `findMany`, missing same-day newly-overdue payments | Reordered: update statuses first, then query |
| FIX-02 | High | `src/lib/auth.ts` | JWT fallback secret — missing `JWT_SECRET` in production silently used insecure hardcoded value | Added production startup guard: throws if `JWT_SECRET` not set |
| FIX-03 | Medium | `src/app/api/cron/route.ts` | Weekly summary never fired: double condition `nowHour === sumHour && nowDay === summaryDay` — time check always failed | Removed time check; fires on day match only |
| FIX-04 | Medium | `src/components/settings/settings-client.tsx` | UI showed time-of-day picker that had no effect | Removed time picker; added note "Notifications sent at 08:00 UTC" |
| FIX-05 | Medium | `next.config.ts` | `serverActions.allowedOrigins: ["localhost:3000"]` blocked production server actions | Reset to `{}` |
| FIX-06 | Medium | `src/components/students/student-detail-client.tsx` | Installment creation: no error checking, no partial-failure feedback | Added `Promise.allSettled`, response status check, partial-failure toast |
| FIX-07 | Low | `src/components/students/student-detail-client.tsx` | Installment table header showed "Amount Due" for paid-amount column | Changed to `t.payments.paid` |
| FIX-08 | Low | `src/components/students/student-detail-client.tsx` | Plan notes hidden input — users could never enter notes when adding a payment | Replaced `<input type="hidden">` with visible textarea |
| FIX-09 | Low | `src/lib/utils.ts` | Dead code: duplicate `computePaymentStatus` function (unused, shadowed by `computeStatus` in payment-utils.ts) | Removed |
| FIX-10 | Info | `src/app/robots.ts` | No robots.txt — private CRM was indexable | Created `robots.ts` disallowing all crawlers |

---

## Open Issues

| ID | Severity | File | Description | Recommendation |
|----|----------|------|-------------|----------------|
| OPEN-01 | High | `src/app/api/auth/login/route.ts` | No rate limiting on login endpoint — brute-force possible | Add rate limiter (e.g. `rate-limiter-flexible`) or Vercel Edge middleware |
| OPEN-02 | High | `package.json` | `xlsx` package has prototype pollution + ReDoS (no upstream fix) | Replace with `exceljs` |
| OPEN-03 | Medium | `package.json` | `zod` memory exhaustion vulnerability; fix is breaking change to v4 | Upgrade to zod v4 when ready |
| OPEN-04 | Low | `src/app/layout.tsx` | `html lang="en"` hardcoded; app supports Uzbek and Russian | Store language in cookie, read in server layout |
| OPEN-05 | Low | Various API routes | No explicit CSRF token; relies on `sameSite: "lax"` | Low risk for internal CRM; add explicit token if public-facing |
| OPEN-06 | Low | `src/app/api/settings/route.ts` | PATCH endpoint accepts any key-value pair (no allowlist) | Validate keys against known enum; low risk since admin-only |
| OPEN-07 | Info | `src/constants/translations.ts` | `timeOfDay` translation key exists but no longer used in UI | Remove from translations (cosmetic) |
| OPEN-08 | Info | Multiple components | No pagination on students/payments tables — may be slow with large datasets | Add server-side pagination for lists >200 rows |
| OPEN-09 | Info | `src/app/api/analytics/route.ts` | Fetches all payments with full joins for analytics — O(n) in memory | Add date-range filtering and aggregate in DB |
| OPEN-10 | Info | Various | Icon-only buttons lack `aria-label` in a few places | Add aria-labels for screen reader support |
