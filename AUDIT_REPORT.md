# Scholarship CRM — Full Audit Report

**Audit Date:** 2026-11-12  
**Auditor:** Automated deep audit (19-phase)  
**Application:** Scholarship CRM — Next.js 15 / App Router / Prisma / PostgreSQL  

---

## Executive Summary

The Scholarship CRM is a well-structured internal tool for managing mentorship scholarship students, batches, payments, and attendance. The codebase is clean, TypeScript-strict, and follows Next.js App Router conventions correctly. Several bugs and security issues were found and fixed during this audit.

**Overall Health: Good** (with caveats around security hardening and missing infrastructure safeguards)

---

## 1. Project Architecture

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.1.x (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| ORM | Prisma v5.22.0 |
| Database | PostgreSQL (Neon serverless) |
| Auth | JWT via `jose`, httpOnly cookie `crm_session` |
| Notifications | Telegram Bot API |
| Deployment | Vercel + cron job at 08:00 UTC daily |
| Testing | Playwright (pre-installed browser tests) |
| i18n | Uzbek + Russian, `useLanguage()` context hook |

**Route structure:**
- `/` → redirect to `/login` or `/dashboard`
- `/login` → public auth page
- `/(dashboard)/*` → protected layout (all require valid JWT session)
- `/api/*` → REST API routes, all protected except `/api/auth/login`

---

## 2. Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 1 | Fixed |
| High | 2 | Fixed (1), Documented (1) |
| Medium | 5 | Fixed (3), Documented (2) |
| Low | 6 | Fixed (4), Documented (2) |
| Info | 4 | Documented |

---

## 3. Fixed Issues

### 3.1 Cron Race Condition (Critical → Fixed)
**File:** `src/app/api/cron/route.ts`  
The overdue status update (`updateMany PENDING → OVERDUE`) was running *after* the overdue query. Payments that became overdue that day were missed in Telegram notifications. Fixed by reordering: update statuses first, then query.

### 3.2 JWT Secret Fallback in Production (High → Fixed)
**File:** `src/lib/auth.ts`  
If `JWT_SECRET` env var was not set, the app silently fell back to a hardcoded string `"fallback-secret-change-in-production"`, making all sessions forgeable. Added a guard that throws at startup in production when `JWT_SECRET` is missing.

### 3.3 Weekly Summary Never Fired (Medium → Fixed)
**File:** `src/app/api/cron/route.ts` + `src/components/settings/settings-client.tsx`  
The weekly summary had a double condition: `nowHour === sumHour && nowDay === summaryDay`. Since the cron fires at exactly 08:00 UTC and `sumHour` was a configurable setting, the hourly match almost never succeeded. Fixed by removing the time condition and firing purely on day match. Also removed the now-meaningless time-of-day picker from the settings UI.

### 3.4 Installment Column Header Semantic Error (Low → Fixed)
**File:** `src/components/students/student-detail-client.tsx`  
The installment table header used `t.payments.amountDue` ("Amount Due") for a column that shows amounts already *paid*. Fixed to use `t.payments.paid`.

### 3.5 Installment Creation Error Handling (Medium → Fixed)
**File:** `src/components/students/student-detail-client.tsx`  
Installment creation on payment add used bare `fetch()` with no error checking. Fixed with `Promise.allSettled`, response status checks, and a toast notification for partial failures.

### 3.6 Plan Notes Hidden Input (Low → Fixed)
**File:** `src/components/students/student-detail-client.tsx`  
The "add payment" form had a `<input type="hidden" name="planNotes" value="" />` with no way for users to enter notes. Replaced with a visible controlled textarea.

### 3.7 `next.config.ts` Blocking Production Server Actions (Medium → Fixed)
**File:** `next.config.ts`  
`serverActions.allowedOrigins: ["localhost:3000"]` was blocking server actions from production domains. Fixed to empty config `{}`.

### 3.8 Dead Code: Duplicate `computePaymentStatus` (Low → Fixed)
**File:** `src/lib/utils.ts`  
An unused duplicate of `computeStatus` from `payment-utils.ts` was removed.

### 3.9 robots.txt Missing (Info → Fixed)
**File:** `src/app/robots.ts` (created)  
The app had no robots.txt. Added one that disallows all crawlers, appropriate for a private internal CRM.

---

## 4. Open Issues (Not Fixed)

### 4.1 No Rate Limiting on Login Endpoint (High)
**File:** `src/app/api/auth/login/route.ts`  
The login endpoint has no rate limiting. An attacker can brute-force passwords. Recommended fix: add an in-memory rate limiter (e.g., `rate-limiter-flexible` package) or Vercel's Edge middleware.

### 4.2 npm Vulnerabilities — 12 Remaining (Medium)
After `npm audit fix`, 12 vulnerabilities remain:
- **xlsx** (prototype pollution + ReDoS): No upstream fix. Consider replacing with ExcelJS.
- **zod** (memory exhaustion): Fix requires breaking change to v4.
- **postcss** (XSS): devDependency only — not in production runtime.
- 9 moderate in dev tooling (eslint plugins, minimatch, uuid).

### 4.3 `html lang="en"` Static Attribute (Low)
**File:** `src/app/layout.tsx`  
The `<html lang="en">` is hardcoded. The app supports Uzbek and Russian. Since language preference is stored in `localStorage`, it can't be known at SSR time without a cookie. Recommended: store language in a cookie and read it in the root layout.

### 4.4 No CSRF Protection (Low)
Server Actions and API routes rely on `sameSite: "lax"` cookies, which provides basic CSRF protection for cross-origin form submissions but not for same-site attacks. The API routes could benefit from an explicit CSRF token, though this is low risk for an internal CRM.

---

## 5. Test Results

- **TypeScript:** 0 errors (strict mode)
- **Production build:** Successful, 0 warnings
- **Playwright tests:** 13/13 pass
  - Login page renders correctly
  - Unauthenticated redirects to /login
  - API routes return 401 for missing auth
  - Cron route returns 401 for missing CRON_SECRET
  - 404 page renders
  - Mobile viewport layout works

---

## 6. Performance Observations

- Database queries use `Promise.all` for parallel fetching — good
- Dashboard page fetches all batches, students, and payments in one round trip
- Analytics endpoint fetches all payments with full includes — may be slow at scale
- No pagination on students or payments list — could be an issue with large datasets
- No query caching layer

---

## 7. Accessibility Observations

- Login form has correct `autoComplete` attributes
- Shadcn/ui components (Radix UI) are ARIA-compliant
- Table headers present for all data tables
- Color contrast appears adequate for both light and dark themes
- No `aria-label` on icon-only buttons in some places (minor)

---

## 8. i18n Completeness

- All UI strings use `t.xxx` translation keys
- Both Uzbek and Russian translations appear complete
- `timeOfDay` key exists in translations but is no longer used in the UI (harmless)
- `html lang` is hardcoded to "en" (see Open Issues)

---

## 9. Security Summary

| Check | Status |
|-------|--------|
| JWT stored in httpOnly cookie | ✅ |
| JWT uses `sameSite: "lax"` | ✅ |
| Passwords hashed with bcrypt (cost 12) | ✅ |
| All API routes require `requireSession()` | ✅ |
| Admin routes require `requireAdmin()` | ✅ |
| Cron route requires `CRON_SECRET` Bearer token | ✅ |
| JWT_SECRET required in production | ✅ Fixed |
| Rate limiting on login | ❌ Missing |
| Input validation beyond required fields | ⚠️ Partial |
| npm vulnerability scan | ⚠️ 12 remaining |
