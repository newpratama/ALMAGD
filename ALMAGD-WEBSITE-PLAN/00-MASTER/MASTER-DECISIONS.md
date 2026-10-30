# MASTER DECISIONS (Decision Log)

> **Single Source of Truth for: decisions.** Other files reference decisions by ID (e.g. `DEC-005`). If any other file contradicts this one, **this file wins**.
> Status values: `PROPOSED` (planning team recommends; becomes binding on owner approval) · `APPROVED` · `NEEDS_OWNER_DECISION` (default shown is used if owner gives no answer).

---

## Strategy & Brand

### DEC-001 — Site type
- **DECISION:** What kind of website is this?
- **RECOMMENDATION:** Corporate promotional & informational website for ALMAGD and its venues. No booking engine, no payments, no accounts, no ordering.
- **REASON:** Owner brief; venues already sell via OTAs and WhatsApp. A booking engine would need PMS/channel-manager integration and inventory sync — high cost, high risk, no evidence of need.
- **ALTERNATIVES:** Direct booking engine (e.g. SiteMinder/Cloudbeds widget); WhatsApp-only landing page.
- **TRADE-OFFS:** Commission still paid to OTAs; mitigated by WhatsApp direct inquiries.
- **STATUS:** APPROVED (owner brief)

### DEC-002 — Brand architecture
- **DECISION:** How do ALMAGD and its venues relate?
- **RECOMMENDATION:** **Endorsed brand architecture.** ALMAGD is the masterbrand (site identity, header, footer, domain). Venues keep their own names and are endorsed with the line **"by ALMAGD"** / **"Part of The ALMAGD Collection"**.
- **REASON:** Venues already have OTA reviews, social followings (Villa NJD 14K IG) and search equity under their own names; renaming would destroy that. ALMAGD has zero public presence, so it borrows trust from venues while giving the group a professional umbrella.
- **ALTERNATIVES:** Branded house (rename to "ALMAGD Villa NJD") — loses equity; House of brands (separate sites) — triples cost, ALMAGD invisible.
- **TRADE-OFFS:** Visual system must accommodate venue names that ALMAGD doesn't control typographically.
- **STATUS:** PROPOSED

### DEC-003 — Portfolio name
- **DECISION:** Marketing name for the group of venues.
- **RECOMMENDATION:** **The ALMAGD Collection** (EN) · **Koleksi ALMAGD** (ID) · **مجموعة المجد** (AR).
- **REASON:** "Collection" scales to hotels, villas, restaurants and experiences without implying luxury hotel chain status; reads naturally in all 3 languages.
- **ALTERNATIVES:** "ALMAGD Hospitality", "ALMAGD Stays", "ALMAGD Group", "ALMAGD Portfolio".
- **TRADE-OFFS:** "ALMAGD Hospitality" kept as the **corporate descriptor** (About page, Organization schema `alternateName`).
- **STATUS:** PROPOSED

### DEC-004 — Venue display names
- **DECISION:** Exact names shown on the site.
- **RECOMMENDATION:** `New Pratama Villa` (short: New Pratama) · `Villa NJD` · `NJD Cafe`. Never "Vila NJD", "NJD Hotel", "Sweet Deluxe".
- **REASON:** Most frequent spellings on owner-controlled channels (see C-06, C-11).
- **STATUS:** NEEDS_OWNER_DECISION (default as above)

### DEC-005 — Tagline
- **DECISION:** Masterbrand tagline.
- **RECOMMENDATION:** **"Cool Air. Warm Welcome."** · ID: **"Udara Sejuk, Sambutan Hangat."** · AR: **"هواءٌ عليل… وترحيبٌ دافئ"**. Descriptor line under it: "Villas, stays & dining in Puncak, Bogor".
- **REASON:** Truthful (Puncak climate is cool — guests repeatedly note "sejuk tanpa AC"); expresses hospitality; non-luxury; short; translates well. Full rationale & 10 options: [TAGLINE-OPTIONS.md](../03-BRAND/TAGLINE-OPTIONS.md).
- **STATUS:** PROPOSED

### DEC-006 — Positioning
- **RECOMMENDATION:** "Comfortable, well-kept highland stays and honest food in Puncak for families, couples and groups — run by one caring hospitality team." Value-tier positioning (good value, clean, friendly), **not** luxury.
- **REASON:** OTA price points (~Rp 400–530k/night) and review themes (clean, friendly, view, value).
- **STATUS:** PROPOSED

## Scope

### DEC-007 — Prices on the site
- **RECOMMENDATION:** **No room prices** anywhere (no "from Rp…"). **Menu prices are shown** (owner-provided, rarely change, help decision).
- **REASON:** Room prices change daily on OTAs; stale prices create disputes and rate-parity issues.
- **STATUS:** PROPOSED

### DEC-008 — Pages at launch
- **RECOMMENDATION:** P0 pages: Home, About, Properties index, New Pratama Villa, Villa NJD, NJD Cafe, NJD Cafe Menu, Gallery, Location, Contact, Privacy Policy, 404. **Not at launch:** Offers page (P2 — build only when a real offer exists), standalone FAQ page (P1 — FAQs live inside venue pages at launch), Experiences page (not planned; "Explore Puncak" lives on Location page), blog (not planned).
- **REASON:** Each page must answer a real visitor question; no thin pages.
- **STATUS:** PROPOSED

### DEC-009 — Rooms
- **RECOMMENDATION:** Rooms/villa types are **sections inside the property page** (cards + modal/gallery), not separate URLs.
- **REASON:** Only ~2–4 types per property; separate pages would be thin content.
- **STATUS:** PROPOSED

### DEC-010 — No-fabrication publishing rule
- **RECOMMENDATION:** Only statuses USER_CONFIRMED / USER_PROVIDED / OFFICIAL_SOURCE / VERIFIED / VERIFIED_MULTIPLE_SOURCES may render. Fields with other statuses hide their UI element; never show "Coming soon" text for facts.
- **STATUS:** APPROVED (owner brief)

### DEC-011 — Reviews
- **RECOMMENDATION:** Show **rating summary badges** per platform (score, scale, review count, platform name, "as of" month, link to source). **Do not copy review texts from OTAs.** Optional P1: owner-collected guest quotes with written consent. No aggregateRating schema.
- **REASON:** OTA content is copyrighted/ToS-restricted; Google disallows self-serving / third-party review markup for LocalBusiness.
- **STATUS:** PROPOSED

## Languages

### DEC-012 — Languages
- **RECOMMENDATION:** Three locales at launch: **Bahasa Indonesia (`id`, default)**, **English (`en`)**, **Arabic (`ar`, RTL)**.
- **REASON:** Domestic guests (largest segment, Indonesian search), international guests (English), Gulf/Middle-East visitors common in Cisarua + Arabic brand name.
- **TRADE-OFFS:** Arabic needs human translation & RTL QA. Rule: a locale page is published only when its translation is approved; otherwise that page is omitted from that locale (no machine-translated fallback, no hreflang for it).
- **STATUS:** NEEDS_OWNER_DECISION (default: all three)

### DEC-013 — URL & locale strategy
- **RECOMMENDATION:** Subdirectories. Indonesian at root without prefix (`/`), English at `/en/`, Arabic at `/ar/`. **Slugs are English and identical across locales.** No automatic IP/browser redirects; a language switcher + optional one-time dismissible suggestion banner.
- **REASON:** Simplest to build/maintain; one domain authority; clean hreflang. Full spec: [URL-STRUCTURE.md](../04-INFORMATION-ARCHITECTURE/URL-STRUCTURE.md).
- **STATUS:** PROPOSED

## Technology

### DEC-014 — Framework
- **RECOMMENDATION:** **Astro (static output / SSG)** with built-in i18n routing and image optimisation; zero client JS by default, small "islands" only for gallery lightbox, mobile menu, menu filter.
- **REASON:** Content site, image-heavy, SEO-first, no server logic needed. Astro ships the least JS of mainstream options. Comparison: [ARCHITECTURE-OPTIONS.md](../12-TECHNICAL-PLANNING/ARCHITECTURE-OPTIONS.md).
- **ALTERNATIVES:** Next.js (heavier runtime, unnecessary SSR), Eleventy (fine, weaker image/i18n DX), hand-coded HTML (hard to maintain 3 locales), WordPress (hosting/security overhead).
- **STATUS:** PROPOSED

### DEC-015 — Content storage
- **RECOMMENDATION:** **Git-stored structured content files** (YAML/JSON data + Markdown for long text) validated by schemas (Astro content collections). **No database. No Supabase. No headless CMS at launch.** P1 option: a Git-based editor (e.g. Pages CMS / Decap) if owner staff must edit without a developer.
- **REASON:** ~12 pages, ~50 menu items, changes are monthly at most.
- **STATUS:** PROPOSED

### DEC-016 — Hosting
- **RECOMMENDATION:** **Cloudflare Pages** (static hosting, free tier, global CDN with Jakarta edge, free SSL, redirects/headers files). Alternatives: Netlify, Vercel.
- **STATUS:** PROPOSED

### DEC-017 — Domain
- **RECOMMENDATION:** Owner registers one domain, preference order: `almagd.co.id` (requires Indonesian entity docs) → `almagd.id` → `almagdhospitality.com`. Availability **not checked**.
- **STATUS:** NEEDS_OWNER_DECISION

### DEC-018 — Analytics
- **RECOMMENDATION:** **Google Analytics 4** (free, outbound-click events, links to Google Ads/Search Console) loaded **only after consent** via a minimal consent banner (Google Consent Mode v2, default denied). Search Console mandatory.
- **ALTERNATIVE:** Cookieless Plausible (paid, no banner) — acceptable if owner prefers no banner.
- **STATUS:** NEEDS_OWNER_DECISION (default GA4 + consent)

### DEC-019 — Forms
- **RECOMMENDATION:** **No forms at launch.** All inquiries via WhatsApp deep links, tel: links and (if provided) mailto:.
- **REASON:** No backend, no spam handling, WhatsApp is the dominant channel in Indonesia.
- **STATUS:** PROPOSED

### DEC-020 — Maps
- **RECOMMENDATION:** No Google Maps iframe on initial load. Use a static map image (self-hosted, generated once) + "Open in Google Maps" / "Get directions" links. On the Location page, a click-to-load embed facade.
- **REASON:** Maps iframe adds ~500 KB+ JS and hurts LCP/INP.
- **STATUS:** PROPOSED

### DEC-021 — Social embeds
- **RECOMMENDATION:** **No Instagram/TikTok embeds.** Curated static image grid (owner-approved images, self-hosted) + profile link buttons.
- **REASON:** Embeds add 300 KB–1 MB JS each, cookies, layout shift.
- **STATUS:** PROPOSED

### DEC-022 — Video
- **RECOMMENDATION:** Image-first hero everywhere. Optional P1 muted loop on Home hero desktop only (≤ 2.5 MB, ≤ 12 s, poster image is LCP, not loaded on Save-Data/2G/3G or `prefers-reduced-motion`). No YouTube embeds on load.
- **STATUS:** PROPOSED

## UX

### DEC-023 — WhatsApp routing
- **RECOMMENDATION:** Each venue has its own WhatsApp number; CTAs on a venue page go to that venue. Global floating button opens a small **chooser sheet** (New Pratama / Villa NJD / NJD Cafe) on group-level pages; on venue pages it goes directly to that venue. Prefilled message templates per venue & language ([CTA-COPY.md](../05-CONTENT/CTA-COPY.md)).
- **REASON:** 3 distinct numbers found (F-X-02); no corporate number exists.
- **STATUS:** PROPOSED (numbers NEEDS_CONFIRMATION)

### DEC-024 — OTA links
- **RECOMMENDATION:** Show only OTA channels whose exact URL is owner-confirmed. Open in new tab with `rel="noopener"` and an external icon; label "Book on {Platform}". Order: Traveloka, Tiket.com, Agoda, Booking.com, Trip.com (only those that exist per venue). WhatsApp "Ask about availability" always shown first as primary.
- **STATUS:** PROPOSED

### DEC-025 — Design direction
- **RECOMMENDATION:** "Highland Calm" — warm off-white backgrounds, deep pine green, sparing brass accent, real photography, generous whitespace, serif display + humanist sans. Spec: [DESIGN-DIRECTION.md](../08-DESIGN/DESIGN-DIRECTION.md). Tokens: [DESIGN-SYSTEM.md](../08-DESIGN/DESIGN-SYSTEM.md).
- **STATUS:** PROPOSED

### DEC-026 — Fonts
- **RECOMMENDATION:** Latin display **Fraunces** (500/600), Latin body **Plus Jakarta Sans** (400/500/600/700, variable), Arabic **IBM Plex Sans Arabic** (400/500/600/700). All OFL, self-hosted woff2, subset.
- **STATUS:** PROPOSED

### DEC-027 — Accessibility & performance standard
- **RECOMMENDATION:** WCAG 2.2 AA; Core Web Vitals "Good" at p75 mobile (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1); Lighthouse mobile ≥ 90 all categories. Budgets: [PERFORMANCE-BUDGET.md](../12-TECHNICAL-PLANNING/PERFORMANCE-BUDGET.md).
- **STATUS:** APPROVED (owner brief)

### DEC-028 — Halal / dietary labelling
- **RECOMMENDATION:** Show "Halal" badge only if owner confirms certification or owner-declared halal kitchen (wording differs — see MENU-CONTENT). Never infer.
- **STATUS:** NEEDS_OWNER_DECISION

### DEC-029 — Gallery filters
- **RECOMMENDATION:** Filters by venue (All / New Pratama / Villa NJD / NJD Cafe) at launch; topic filters (Rooms, Pool & Views, Food & Drinks) only if ≥ 60 approved images.
- **STATUS:** PROPOSED

### DEC-030 — Work order
- **RECOMMENDATION:** Implementation follows [IMPLEMENTATION-ROADMAP.md](../14-IMPLEMENTATION-PLANNING/IMPLEMENTATION-ROADMAP.md) phases 0–12 with atomic tasks in [TASK-BREAKDOWN.md](../14-IMPLEMENTATION-PLANNING/TASK-BREAKDOWN.md). The site may be built with placeholders before owner data arrives, but **cannot launch** until the P0 data items in [MISSING-DATA.md](../02-RESEARCH/MISSING-DATA.md) are resolved.
- **STATUS:** PROPOSED
