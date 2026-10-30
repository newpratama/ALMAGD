# IMPLEMENTATION CONTEXT (token-efficient brief)

> Give **this file** (plus the one task-relevant spec) to the coding model for each task. It contains the binding contract: stack, folders, data model names, component names, tokens, events, rules. Details live in linked files. If anything here conflicts with [MASTER-DECISIONS.md](../00-MASTER/MASTER-DECISIONS.md), MASTER-DECISIONS wins.

## 1. Project in 10 lines

- Corporate promotional site for **ALMAGD** (المجد), a hospitality group in Puncak (Cisarua, Bogor, Indonesia).
- Venues: **New Pratama Villa** (villa complex, full-villa & per-room), **Villa NJD** (hotel-style villa, rooms w/ balcony), **NJD Cafe** (cafe/restaurant, 47-item menu).
- Masterbrand ALMAGD; venues endorsed "by ALMAGD"; group name **The ALMAGD Collection**.
- Tagline: "Cool Air. Warm Welcome." / "Udara Sejuk, Sambutan Hangat." / "هواءٌ عليل… وترحيبٌ دافئ".
- Not a booking engine. Conversions = WhatsApp, phone, OTA click-outs, directions, menu views.
- Locales: `id` (default, root), `en` (`/en`), `ar` (`/ar`, RTL). English slugs everywhere.
- Stack: **Astro (static)**, content collections (YAML/JSON + MD), Astro Image (AVIF/WebP), Cloudflare Pages. No DB, no CMS, no forms, no backend.
- Mobile-first, WCAG 2.2 AA, CWV good (LCP ≤ 2.5 s mobile).
- **Never invent content.** Unconfirmed facts are hidden (see §9).
- No room prices. Menu prices shown.

## 2. Repository layout (target)

```
/
├─ astro.config.(mjs)          i18n: defaultLocale id, locales [id,en,ar], prefixDefaultLocale false
├─ public/                     favicons, robots.txt, _redirects, _headers, og fallback, fonts (woff2)
├─ src/
│  ├─ content/                 ← ALL site data (source of truth for build)
│  │  ├─ site/                 site.yaml (brand, org, socials, defaults)
│  │  ├─ venues/               new-pratama.yaml, villa-njd.yaml, njd-cafe.yaml
│  │  ├─ rooms/                {venue}--{room-slug}.yaml
│  │  ├─ menu/                 categories.yaml, items.yaml
│  │  ├─ gallery/              gallery.yaml (image registry)
│  │  ├─ faqs/                 {venue}.yaml
│  │  ├─ attractions/          attractions.yaml
│  │  ├─ ratings/              ratings.yaml (OTA rating badges, as-of dates)
│  │  ├─ pages/                {page}.{locale}.md long-form copy (about, privacy, location intro)
│  │  └─ i18n/                 ui.id.yaml, ui.en.yaml, ui.ar.yaml (UI strings)
│  ├─ assets/images/           source images (see 09-MEDIA/IMAGE-NAMING.md)
│  ├─ components/              see §5
│  ├─ layouts/                 BaseLayout, PageLayout
│  ├─ lib/                     i18n helpers, whatsapp link builder, schema builders, analytics
│  ├─ styles/                  tokens + global styles
│  └─ pages/                   [...locale] routing per URL-STRUCTURE
└─ docs/ → this planning pack (read-only)
```

## 3. Content model (entity names — fields in [CONTENT-MODEL.md](../05-CONTENT/CONTENT-MODEL.md))

| Entity | Key fields (abbrev.) |
|---|---|
| `site` | brandName, brandNameAr, groupName{id,en,ar}, tagline{…}, descriptor{…}, legalName, logo, defaultOgImage, socials[], email, domain |
| `venue` | id, slug, type(villa/hotel/resort/restaurant/cafe/experience), name, shortName, endorsement, status(draft/published), summary{…}, description{…}, highlights[{…}], address{street,village,district,regency,province,postalCode,country}, geo{lat,lng}, mapsUrl, placeId, phone, whatsapp, email, socials[], otaLinks[{platform,url,verified}], checkIn, checkOut, facilities[ids], policies[{…}], heroImage, cardImage, gallery[ids], faqIds[], relatedVenueIds[], seo{title,description}{…}, fieldStatus{field:STATUS} |
| `room` | id, venueId, slug, name, type(room/villa), sizeM2, maxGuests, beds, bathrooms, features[ids], images[ids], summary{…}, sortOrder, status |
| `menuCategory` | id, slug, name{…}, description{…}, sortOrder |
| `menuItem` | id, slug, name(original), altName{…}, categoryId, description{…}, price, currency(IDR), image, availability(available/seasonal/unavailable), featured, dietary[], spicy(0–3), variants[{name,price}], notes, sortOrder, status |
| `galleryImage` | id, file, venueId, topic, alt{…}, caption{…}, credit, orientation, width, height, featured, rightsConfirmed |
| `faq` | id, venueId, question{…}, answer{…}, answerStatus |
| `attraction` | id, name, distanceKm{fromVenueId:km}, distanceStatus, category |
| `rating` | venueId, platform, score, scale, count, url, asOf |

`{…}` = localized object `{ id, en, ar }`. Every factual field also has a `fieldStatus` entry using the DATA-AUDIT statuses.

## 4. Pages & templates
See [SITEMAP.md](../04-INFORMATION-ARCHITECTURE/SITEMAP.md) and [URL-STRUCTURE.md](../04-INFORMATION-ARCHITECTURE/URL-STRUCTURE.md). Templates: `home, about, property-index, property, restaurant, menu, gallery, location, contact, legal, error` (+ P1 `faq`, P2 `offers`).

## 5. Component inventory (canonical names — specs in [COMPONENT-INVENTORY.md](../08-DESIGN/COMPONENT-INVENTORY.md))

Layout: `SiteHeader`, `MobileNav`, `LanguageSwitcher`, `SiteFooter`, `Breadcrumbs`, `SkipLink`, `FloatingWhatsApp`, `WhatsAppChooser`, `ConsentBanner`.
Sections: `HeroHome`, `HeroPage`, `IntroBlock`, `CollectionGrid`, `VenueFeature`, `HighlightList`, `FacilityGrid`, `RoomCardList`, `RoomDetailDialog`, `PolicyList`, `FAQAccordion`, `RatingBadges`, `GalleryGrid`, `Lightbox`, `GalleryFilter`, `MenuNav`, `MenuSection`, `MenuItemRow`, `FeaturedMenuGrid`, `MapCard`, `MapEmbedFacade`, `AttractionList`, `ContactCard`, `BookingPanel`, `CTASection`, `SocialStrip`, `RichText`.
Primitives: `Button` (primary / secondary / ghost / whatsapp / ota), `Link`, `Badge`, `Icon`, `ResponsiveImage`, `Tag`, `Divider`, `Container`, `Section`.

## 6. Design tokens (summary — full in [DESIGN-SYSTEM.md](../08-DESIGN/DESIGN-SYSTEM.md))

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `color.pine` | #1E3B32 | primary brand, headings, primary button bg, footer bg | white on pine 12.16 |
| `color.pine-700` | #152B24 | hover/pressed primary, dark sections | white 14.97 |
| `color.tea` | #4F6B4C | secondary accents, icons, tags | white on tea 5.93 |
| `color.tea-100` | #DCE5D6 | soft tinted panels | pine on it 9.39 |
| `color.brass` | #B8873B | decorative only (rules, icons ≥ 24px on dark) — **never body text on light** | on pine 3.8 (large/graphic only) |
| `color.brass-300` | #D9B77A | accent text on dark pine | on pine 6.37 |
| `color.brass-text` | #8A6420 | accent text/links on light | on white 5.35, on mist 4.83 |
| `color.mist` | #F6F3EC | page background | — |
| `color.white` | #FFFFFF | cards/surfaces | — |
| `color.stone` | #ECE7DD | alt section bg | muted on stone 5.43 |
| `color.ink` | #1A1D1B | body text | on mist 15.34 |
| `color.muted` | #565E58 | secondary text | on mist 6.04 |
| `color.border` | #D6D0C4 | dividers (decorative, not for input boundaries alone) | — |
| `color.wa` / `color.wa-text` | #25D366 / #0A2A17 | WhatsApp button bg / text | 7.81 |
| `color.error` / `color.success` | #B3261E / #2E7D4F | status | 6.54 / 5.05 |

Fonts: Latin display **Fraunces** 500/600; Latin body **Plus Jakarta Sans** 400–700; Arabic **IBM Plex Sans Arabic** 400–700 (headings and body in `ar`). Type scale (mobile→desktop): display 40→64, h1 32→48, h2 26→36, h3 20→24, body 16→17, small 14, caption 13. Line-height body 1.6 (Arabic 1.8).
Spacing 4-pt base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Radius: sm 6, md 12, lg 20, pill 999. Breakpoints: sm 480, md 768, lg 1024, xl 1280, 2xl 1536. Container max 1200 (text max 68ch). Use **logical CSS properties** (inline-start/end) for RTL.

## 7. Analytics events (canonical — details [EVENT-TRACKING.md](../11-ANALYTICS/EVENT-TRACKING.md))

`click_whatsapp`, `click_phone`, `click_email`, `click_google_maps`, `click_directions`, `click_ota` (param `platform`: agoda|traveloka|tiket|booking_com|trip_com), `click_instagram`, `click_tiktok`, `whatsapp_chooser_open`, `menu_view`, `menu_category_select`, `gallery_open`, `gallery_filter`, `room_detail_open`, `map_embed_load`, `language_change`, `property_view` (param `venue`), `cafe_view`. Common params: `venue` (new_pratama|villa_njd|njd_cafe|group), `locale`, `placement` (header|hero|floating|section|footer|room_card|booking_panel|contact_card).
Note: brief's `new_pratama_view`, `villa_njd_view`, `click_agoda` etc. are implemented as **parameters** of the generic events above (GA4 best practice), and mapped in GA4 as custom dimensions.

## 8. WhatsApp link format

`https://wa.me/{E164 digits without +}?text={urlencoded template}`. Numbers (all NEEDS_CONFIRMATION before launch): New Pratama `6285117588248` · Villa NJD `6281333035141` · NJD Cafe `6281116618075` (USER_PROVIDED). Templates per venue/locale in [CTA-COPY.md](../05-CONTENT/CTA-COPY.md). Phone links: `tel:+62…`.

## 9. Non-negotiable rules for the coder

1. Do not redesign, rename, restructure URLs, or change decisions. Raise questions in [OPEN-DECISIONS.md](./OPEN-DECISIONS.md).
2. Do not write or invent copy/facts. Use only content files. Missing → component hides; in dev builds show a visible `PLACEHOLDER` marker; production build **fails** if a `published` page references a `PLACEHOLDER` value.
3. No new dependencies beyond the approved list in [STACK-DECISION.md](../12-TECHNICAL-PLANNING/STACK-DECISION.md) without approval.
4. No third-party embeds on load (Maps, IG, TikTok, YouTube).
5. Every image via `ResponsiveImage` with alt text from content; hero image `fetchpriority=high`, others lazy.
6. RTL: `dir="rtl"` + `lang="ar"` on `/ar`; use logical properties; mirror directional icons only.
7. One `h1` per page. Semantic landmarks. Visible focus.
8. After each task run the task's verification (build, lint, Lighthouse/axe where specified) and stop on failure or blocker.

## 10. Where to look

| Need | File |
|---|---|
| Facts | 02-RESEARCH/DATA-AUDIT.md |
| Page section specs | 07-PAGE-SPECS/{PAGE}.md |
| Copy | 05-CONTENT/*-CONTENT.md, CTA-COPY.md |
| Components & tokens | 08-DESIGN/COMPONENT-INVENTORY.md, DESIGN-SYSTEM.md |
| SEO per page | 10-SEO/META-STRATEGY.md, STRUCTURED-DATA.md |
| Tasks & order | 14-IMPLEMENTATION-PLANNING/TASK-BREAKDOWN.md, 15-AI-HANDOFF/FILE-BUILD-ORDER.md |
| Acceptance | 14-IMPLEMENTATION-PLANNING/ACCEPTANCE-CRITERIA.md |
