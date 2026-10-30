# URL STRUCTURE

> Implements DEC-013. Pages → [SITEMAP.md](./SITEMAP.md). SEO → [MULTILINGUAL-SEO.md](../10-SEO/MULTILINGUAL-SEO.md).

## Rules

1. Lowercase, hyphen-separated, ASCII, English slugs. Identical slugs in every locale.
2. Indonesian (default) has **no prefix**; English `/en/`; Arabic `/ar/`.
3. **No trailing slash** in canonical URLs (configure host to 301 the slash variant). Root is `/`, `/en`, `/ar`.
4. No query parameters in canonical URLs. Gallery/menu filters use in-page state (optional `#hash`), never new URLs.
5. No dates, IDs or file extensions in URLs.
6. Venue slugs are permanent; if a venue is renamed, keep slug or add 301.

## Final URL table

| Page | Indonesian (x-default) | English | Arabic |
|---|---|---|---|
| Home | `/` | `/en` | `/ar` |
| About | `/about` | `/en/about` | `/ar/about` |
| Stays index | `/properties` | `/en/properties` | `/ar/properties` |
| New Pratama Villa | `/properties/new-pratama` | `/en/properties/new-pratama` | `/ar/properties/new-pratama` |
| Villa NJD | `/properties/villa-njd` | `/en/properties/villa-njd` | `/ar/properties/villa-njd` |
| NJD Cafe | `/dining/njd-cafe` | `/en/dining/njd-cafe` | `/ar/dining/njd-cafe` |
| NJD Cafe Menu | `/dining/njd-cafe/menu` | `/en/dining/njd-cafe/menu` | `/ar/dining/njd-cafe/menu` |
| Gallery | `/gallery` | `/en/gallery` | `/ar/gallery` |
| Location | `/location` | `/en/location` | `/ar/location` |
| Contact | `/contact` | `/en/contact` | `/ar/contact` |
| Privacy | `/privacy` | `/en/privacy` | `/ar/privacy` |
| FAQ (P1) | `/faq` | `/en/faq` | `/ar/faq` |
| Offers (P2) | `/offers` | `/en/offers` | `/ar/offers` |
| 404 | `/404` (served for unknown paths, `noindex`) | same page localised by path prefix | same |

## Section anchors (stable, used by internal links & analytics)

| Page | Anchors |
|---|---|
| Property pages | `#overview`, `#rooms`, `#facilities`, `#gallery`, `#location`, `#policies`, `#faq`, `#book` |
| NJD Cafe | `#about`, `#featured`, `#hours`, `#location` |
| Menu | one anchor per category slug, e.g. `#coffee`, `#noodles` |
| Location | `#map`, `#new-pratama`, `#villa-njd`, `#njd-cafe`, `#getting-here`, `#explore-puncak` |

## Redirects (301)

| From | To |
|---|---|
| `/dining`, `/en/dining`, `/ar/dining` | matching `/dining/njd-cafe` |
| `/menu` | `/dining/njd-cafe/menu` (same for `/en`, `/ar`) |
| `/new-pratama`, `/villa-njd`, `/njd-cafe` (short vanity links for print/QR) | matching full page |
| `/id/*` | `/*` (prevent duplicate default-locale prefix) |
| `www.` host | apex host (or vice-versa; pick one) |
| `http://` | `https://` |
| trailing-slash variants | no-slash |

## QR / print vanity URLs

`/menu` is the URL printed on table QR codes at NJD Cafe (with `?utm_source=qr&utm_medium=print&utm_campaign=table` appended in the QR only; canonical stays clean).

## Files generated at build

`/sitemap-index.xml` (+ per-locale entries with `xhtml:link` alternates), `/robots.txt`, `/manifest.webmanifest`, favicons. See [TECHNICAL-SEO.md](../10-SEO/TECHNICAL-SEO.md).
