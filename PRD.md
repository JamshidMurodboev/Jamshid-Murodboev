# Product Requirements Document (PRD)
## Scholarship & University Consulting Website
**Owner:** Jamshid Murodboev
**Date:** June 9, 2026
**Version:** 1.0

---

## 1. Overview

### 1.1 Problem
Uzbek students lack a single, centralized channel to find suitable scholarship opportunities and tuition-based university options abroad. More critically, they do not know how to navigate the application process correctly to win fully-funded scholarships.

### 1.2 Solution
A personal consulting website that displays Jamshid's credentials and services alongside curated scholarship and university directories. Students browse the information and contact Jamshid directly via Telegram or WhatsApp for personalized guidance.

### 1.3 Why Jamshid
- Personally won the fully-funded Türkiye Bursları scholarship
- Mentored 5 students to win the same full-ride scholarship
- Helped 100+ students secure admissions to tuition-based universities in Turkey
- Now expanding reach to full-ride scholarships worldwide

### 1.4 Target Audience
Uzbek students (ages 17–28) seeking:
- Fully-funded scholarships abroad
- Admission to tuition-based universities abroad (primarily Turkey, expanding globally)

---

## 2. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Establish online credibility | 500+ unique visitors/month within 3 months of launch |
| Drive student inquiries | 50+ Telegram/WhatsApp contacts per month |
| Showcase results | 100% of mentored student wins published as success stories |
| Content freshness | At least 2 new news posts per week |

---

## 3. Site Structure (Public)

```
Home
├── Hero (headline, CTA → contact)
├── About / Why Me
├── Stats banner (students helped, full-ride winners, countries)
Scholarships
├── Filterable directory of scholarship listings
Universities
├── Filterable directory of tuition-based universities
Results
├── Stats banner
└── Student success cards (photo, name, award, quote)
News
├── Feed: deadline alerts, personal updates, study-abroad news, winner announcements
Blog / Tips
└── Articles: guides, tips, application strategies
Contact
└── Telegram button, WhatsApp button, contact form
```

---

## 4. Feature Specifications

### 4.1 Public — Home Page
- Hero section: headline, subheadline, primary CTA ("Contact me on Telegram")
- About section: Jamshid's story, credentials, personal photo
- Quick stats banner: e.g., "5 full-ride winners · 100+ university admissions · 10+ countries"
- Teaser sections linking to Scholarships, Universities, Results, News

### 4.2 Public — Scholarship Directory
**Listing card fields:**
- Scholarship name
- Country & hosting university (if applicable)
- Coverage (tuition / housing / monthly stipend / flights — checkboxes)
- Eligibility criteria (age, GPA, nationality)
- Application deadline
- Difficulty level (1–5 stars, set by Jamshid)
- Jamshid's personal tip/note
- Official application link (external)
- Status badge: Open / Closed / Coming Soon

**Filters:** Country, coverage type, deadline month, difficulty level, status

**Search:** Full-text search by name or country

### 4.3 Public — University Directory
**Listing card fields:**
- University name
- Country & city
- Annual tuition cost (range or exact, in USD)
- Available programs / faculties
- Language of instruction
- Application requirements summary
- Application deadline
- Official website link
- Status badge: Accepting / Closed / Rolling admissions

**Filters:** Country, tuition range, language, program type

**Search:** Full-text search by name, city, or program

### 4.4 Public — Results
- Stats banner (editable from admin): total students helped, full-ride winners, countries represented, years active
- Student success cards grid:
  - Student photo (optional, with consent)
  - First name (or initials for privacy)
  - Award: scholarship name or university admitted to
  - Year
  - Short quote/testimonial
  - Country flag

### 4.5 Public — News
Feed of posts with:
- Title, cover image, category tag (Deadline Alert / Personal Update / Study Abroad News / Winner Announcement), publish date, short excerpt, full article view

**Categories:**
- Deadline Alert — scholarship opening/closing notifications
- Personal Update — Jamshid's activities, partnerships, events
- Study Abroad News — general news relevant to Uzbek students
- Winner Announcement — new student success stories

### 4.6 Public — Blog / Tips
- Article listings with title, cover image, reading time, publish date, category
- Categories: Scholarship Tips, Application Strategy, Personal Statement, Interview Prep, Country Guides
- Full article view with rich text content

### 4.7 Public — Contact
- Telegram button (opens t.me link)
- WhatsApp button (opens wa.me link)
- Contact form fields: Full name, Email, Phone (optional), Subject (dropdown: Scholarship Inquiry / University Admission / General Question), Message
- Form submission → email notification to Jamshid + stored in admin dashboard

---

## 5. Admin Dashboard

### 5.1 Access & Roles

| Role | Permissions |
|---|---|
| Super Admin (Jamshid) | Full access to all features, settings, and user management |
| Editor | Can add/edit/delete scholarships, universities, results, news, blog posts — cannot manage settings or other users |

### 5.2 Dashboard Home
- Summary cards: total scholarships, universities, news posts, blog posts, student cards, unread inquiries
- Recent inquiries preview
- Quick-add shortcuts

### 5.3 Scholarship Management
- Table view with search and filters
- Add / Edit / Delete scholarship listings
- Toggle status (Open / Closed / Coming Soon)
- All fields from section 4.2

### 5.4 University Management
- Table view with search and filters
- Add / Edit / Delete university listings
- Toggle status
- All fields from section 4.3

### 5.5 Results Management
- Edit global stats banner (4 editable number fields + labels)
- Add / Edit / Delete student success cards
- Upload student photo (with alt text)

### 5.6 News Management
- Add / Edit / Delete news posts
- Rich text editor
- Cover image upload
- Category selection
- Publish / Draft / Schedule toggle

### 5.7 Blog / Tips Management
- Add / Edit / Delete blog articles
- Rich text editor
- Cover image upload
- Category selection
- Publish / Draft / Schedule toggle
- Estimated reading time (auto-calculated)

### 5.8 Inquiry Inbox
- List of all contact form submissions
- Fields shown: name, email, phone, subject, message, date received
- Mark as read / unread
- Archive / Delete
- No reply functionality needed (follow-up happens via Telegram/email externally)

### 5.9 Analytics
- Page views (total and per-page)
- Most viewed scholarships and universities
- Contact form submission count over time
- Traffic sources
- Powered by: Vercel Analytics (free) + optional Plausible/Umami

### 5.10 Editor Management (Super Admin only)
- Invite editor by email
- View active editors
- Remove editor access

---

## 6. Internationalization (i18n)

- Three languages: **Uzbek (uz)**, **Russian (ru)**, **English (en)**
- Default language: Uzbek
- Language switcher in header (visible on all pages)
- All static UI text translated
- Dynamic content (scholarship listings, blog posts, etc.) — admin enters content in one language at MVP; multi-language content fields are a post-MVP enhancement
- URL structure: `/uz/...`, `/ru/...`, `/en/...`

---

## 7. Design & Branding

### 7.1 Style
- **Tone:** Warm & approachable — feels like a knowledgeable mentor's personal site, not a corporate platform
- **Typography:** Clean, readable — large headings, comfortable body text
- **Color palette:** To be defined, but warm and trustworthy (e.g., deep teal/green + warm cream/white + accent gold)
- **Photography:** Jamshid's personal photos, student success photos, country/university imagery

### 7.2 Responsive Design
- Mobile-first
- Fully responsive across mobile, tablet, desktop

### 7.3 Accessibility
- WCAG 2.1 AA compliance
- Alt text on all images
- Keyboard navigable

---

## 8. Technical Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | SSR/SSG for SEO, built-in i18n routing, fast |
| **Language** | TypeScript | Type safety across frontend and backend |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI, consistent design system |
| **Database** | Supabase (PostgreSQL) | Free tier, auth, row-level security, file storage |
| **Authentication** | Supabase Auth | Email/password login, role-based access |
| **File Storage** | Supabase Storage | Image uploads for blog, news, student cards |
| **i18n** | next-intl | Clean trilingual support with App Router |
| **Forms** | React Hook Form + Zod | Validation, type-safe form handling |
| **Email** | Resend | Contact form → email notification to Jamshid |
| **Rich Text** | Tiptap | Blog and news post editor in admin |
| **Analytics** | Vercel Analytics | Free, privacy-friendly page view tracking |
| **Hosting** | Vercel (frontend) | Free tier, automatic deploys from Git |
| **Backend** | Supabase (database + auth + storage) | Free tier covers MVP needs |

---

## 9. Data Models (Simplified)

### Scholarship
```
id, title, country, university, coverage[], eligibility, deadline,
difficulty (1-5), tip, application_url, status, created_at, updated_at
```

### University
```
id, name, country, city, tuition_min, tuition_max, currency, programs[],
language_of_instruction, requirements, deadline, website_url, status,
created_at, updated_at
```

### Student Result
```
id, first_name, photo_url, award_type (scholarship|university), award_name,
year, quote, country, display_order, created_at
```

### Stats
```
id, students_helped, full_ride_winners, countries_count, years_active
```

### News Post
```
id, title, slug, cover_image_url, category, content (rich text),
status (draft|published|scheduled), published_at, created_by, created_at
```

### Blog Post
```
id, title, slug, cover_image_url, category, content (rich text),
reading_time_minutes, status, published_at, created_by, created_at
```

### Inquiry
```
id, full_name, email, phone, subject, message, is_read, archived,
created_at
```

### User (Admin)
```
id, email, role (super_admin|editor), created_at, last_sign_in
```

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load speed | < 2s LCP on mobile (3G) |
| SEO | Meta tags, OG tags, sitemap.xml, robots.txt on all pages |
| Uptime | 99.9% (Vercel SLA) |
| Security | HTTPS, Supabase RLS on all tables, input sanitization, no exposed API keys |
| Scalability | Free tier handles MVP; upgrade path to paid Vercel/Supabase as traffic grows |

---

## 11. Out of Scope (MVP)

- Video courses or paid content platform
- In-app payment processing
- Student account creation / login
- Multi-language content fields in admin (content in one language at MVP)
- Mobile app
- Automated deadline reminder emails to students
- CRM / pipeline management for consultations

---

## 12. Launch Checklist

- [ ] Domain purchased and connected
- [ ] All static pages live in 3 languages
- [ ] Minimum 10 scholarship listings added
- [ ] Minimum 10 university listings added
- [ ] Minimum 3 student success stories published
- [ ] Minimum 1 blog post published
- [ ] Contact form tested end-to-end
- [ ] Telegram and WhatsApp links verified
- [ ] Admin accounts created for Jamshid + editors
- [ ] Analytics active
- [ ] SEO meta tags verified on all pages
- [ ] Mobile responsiveness QA passed
- [ ] Performance audit (Lighthouse score > 90)

---

*PRD v1.0 — Subject to revision as development progresses.*
