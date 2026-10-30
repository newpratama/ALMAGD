# CONTENT MODEL

> **Single Source of Truth for: content structure.** Entity names match [IMPLEMENTATION-CONTEXT §3](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md). This is a content model for Git-stored YAML/JSON/Markdown files validated by schemas (DEC-015) — **not** a database.

## Conventions
- `L10n` = localized object `{ id: string, en: string, ar: string }`. `id` required; `en`/`ar` required only when that locale is published for the page.
- `Status` = one of the DATA-AUDIT statuses.
- `PLACEHOLDER` value = the literal string `"PLACEHOLDER"` (or `L10n` whose values are `"PLACEHOLDER"`). Dev build renders a visible yellow marker; production build **fails** if a `published` entity contains it in a rendered field.
- Every factual field may have an entry in `fieldStatus: { fieldName: Status }`. A field renders only if its status is publishable (DEC-010). Missing entry = treated as `NEEDS_CONFIRMATION` for facts listed in DATA-AUDIT.
- IDs: kebab-case, unique, permanent.
- File naming: `src/content/{collection}/{id}.yaml`.

## site (single file `site/site.yaml`)
| Field | Type | Req | L10n | Validation / example |
|---|---|---|---|---|
| brandName | string | Y | N | "ALMAGD" |
| brandNameAr | string | Y | N | "المجد" |
| groupName | L10n | Y | Y | "Koleksi ALMAGD" / "The ALMAGD Collection" / "مجموعة المجد" |
| corporateDescriptor | L10n | Y | Y | "ALMAGD Hospitality" |
| tagline | L10n | Y | Y | DEC-005 |
| descriptor | L10n | Y | Y | "Villas, stays & dining in Puncak, Bogor" |
| legalName | string | Y (launch) | N | PLACEHOLDER (MD-02) |
| logo | object{svg, svgInverse, alt:L10n} | N | — | null → interim wordmark |
| defaultOgImage | image ref | Y | N | 1200×630 |
| email | string(email) | N | N | MISSING |
| phone | string(E.164) | N | N | MISSING |
| socials | list{platform, url, handle, status} | N | N | group-level (none yet) |
| domain | string | Y | N | PLACEHOLDER (DEC-017) |
| lastUpdated | date | Y | N | ISO date |

## venue (`venues/{id}.yaml`)
| Field | Type | Req | L10n | Validation / example |
|---|---|---|---|---|
| id | string | Y | N | `villa-njd` |
| slug | string | Y | N | equals URL slug |
| type | enum villa\|hotel\|resort\|restaurant\|cafe\|experience | Y | N | villa-njd: `villa` (C-05 pending) |
| collection | enum stays\|dining\|experiences | Y | N | derived from type |
| name | string | Y | N | "Villa NJD" (never translated) |
| shortName | string | N | N | "New Pratama" |
| typeLabel | L10n | Y | Y | "Villa · Tugu Utara" |
| endorsement | L10n | Y | Y | "by ALMAGD" / "oleh ALMAGD"? → use "by ALMAGD" in id too (brand phrase); ar "من المجد" |
| status | enum draft\|published | Y | N | |
| sortOrder | int | Y | N | NJD 1, NP 2, Cafe 3 |
| summary | L10n (≤ 160 chars) | Y | Y | card text |
| description | L10n (Markdown, 80–200 words) | Y | Y | overview |
| highlights | list{icon, label:L10n, factRef} (3–5) | N | Y | each must cite F-ID |
| address | {street, village, district, regency, province, postalCode, country} | Y | N | Indonesian form, not translated |
| geo | {lat:number, lng:number} | Y (launch) | N | from owner's pin |
| mapsUrl | url | Y (launch) | N | Google Maps share URL |
| directionsUrl | url | N | N | derived: maps "dir" link with destination=placeId/lat,lng |
| placeId | string | N | N | Google Place ID |
| staticMap | image ref | N | N | generated once, self-hosted |
| phone | E.164 string | Y | N | "+6281333035141" |
| whatsapp | E.164 digits | Y | N | "6281333035141" |
| email | string | N | N | |
| socials | list{platform: instagram\|tiktok\|facebook, url, handle} | N | N | |
| otaLinks | list{platform: traveloka\|tiket\|agoda\|booking_com\|trip_com, url, verified:boolean} | N | N | render only `verified: true` |
| checkIn / checkOut | string "HH:MM" (+ checkInUntil) | N | N | NJD "14:00"/"12:00" |
| openingHours | list{days:[mo..su], opens, closes} | cafe Y | N | MISSING |
| servesCuisine | list<L10n> | cafe | Y | "Indonesian", "Western", "Middle Eastern" (pending) |
| acceptsWalkIns | boolean | cafe | N | MD-51 |
| facilities | list<facilityId> | N | N | ids from facility dictionary below |
| policies | list{key, value:L10n} | N | Y | keys: checkIn, checkOut, idRequired, minAge, pets, parties, breakfast, earlyCheckIn, lateCheckOut, smoking, deposit, cancellation |
| heroImage / cardImage | image ref | Y | N | gallery ids |
| gallery | list<galleryImage id> | N | N | |
| faqIds | list | N | N | |
| relatedVenueIds | list | N | N | |
| ratingIds | list | N | N | |
| seo | {title:L10n, description:L10n, ogImage} | Y | Y | META-STRATEGY |
| fieldStatus | map | Y | N | |

### Facility dictionary (`site/facilities.yaml`)
`{ id, icon, label: L10n }`. Initial ids: `pool-outdoor`, `pool-kids`, `wifi-free`, `parking-free`, `parking`, `kitchen`, `bbq`, `prayer-room`, `smoking-area`, `reception-24h`, `security`, `balcony`, `mountain-view`, `city-view`, `hot-water`, `tv`, `work-desk`, `refill-station`, `restaurant-onsite`, `family-friendly`. Each venue lists only facilities with publishable status.

## room (`rooms/{venueId}--{slug}.yaml`)
| Field | Type | Req | L10n | Example |
|---|---|---|---|---|
| id, venueId, slug | string | Y | N | `villa-njd--standard-balcony` |
| name | string | Y | N | "Standard With Balcony" (owner's official name) |
| kind | enum room\|villa | Y | N | |
| summary | L10n ≤ 140 | Y | Y | |
| sizeM2 | number | N | N | hidden unless confirmed |
| maxGuests | int | N | N | |
| bedrooms | int | N | N | villas |
| beds | L10n | N | Y | "1 king bed" |
| bathrooms | int | N | N | |
| features | list<facilityId> | N | N | |
| images | list<galleryImage id> (1–8) | Y | N | |
| sortOrder | int | Y | N | |
| status, fieldStatus | | Y | N | |

## menuCategory (`menu/categories.yaml`)
`id, slug, name:L10n, description:L10n?, sortOrder, visible:boolean`. List → [MENU-CONTENT.md](./MENU-CONTENT.md).

## menuItem (`menu/items.yaml`)
| Field | Type | Req | L10n | Rule |
|---|---|---|---|---|
| id | string | Y | N | m001…m047 (DATA-AUDIT §E) |
| slug | string | Y | N | kebab of name |
| name | string | Y | N | **exactly as provided** |
| altName | L10n | N | Y | helper translation shown smaller (e.g. en "Fried rice") |
| categoryId | string | Y | N | |
| description | L10n | N | Y | ≤ 120 chars, owner-approved |
| price | int (IDR) or null | Y | N | null → shows "Ask us" label (if owner approves) or item hidden — default: show "Ask us" |
| currency | "IDR" | Y | N | |
| image | image ref | N | N | 1:1 |
| availability | enum available\|seasonal\|unavailable | Y | N | unavailable → hidden |
| featured | boolean | Y | N | max 6 |
| dietary | list enum halal\|vegetarian\|contains-nuts\|contains-dairy | N | N | only owner-confirmed |
| spicy | int 0–3 | N | N | |
| variants | list{name:L10n, price:int} | N | Y | e.g. Nasi Ayam Bakar / Goreng |
| notes | string | N | N | internal |
| sortOrder | int | Y | N | |
| status | enum draft\|published\|hidden | Y | N | unknown names (Koleja, Gemat, Roti Pataer) = `hidden` until MD-54 |

## galleryImage (`gallery/gallery.yaml`)
`id, file, venueId|null, topic (exterior|room|pool|view|food|drink|interior|facility|people|area), alt:L10n (required), caption:L10n?, credit?, orientation, width, height, focalPoint{x,y}% (for crops), featured, rightsConfirmed:boolean (must be true to publish), sortOrder`.

## faq (`faqs/{venueId|general}.yaml`)
`id, venueId|null, question:L10n, answer:L10n, answerStatus (publishable statuses only render), factRefs[], sortOrder`.

## attraction (`attractions/attractions.yaml`)
`id, name (proper noun), category (nature|park|food|culture|transport), description:L10n?, distances:[{venueId, km, status, source}], mapsUrl?`. Render distance only if status publishable; otherwise show attraction without distance.

## rating (`ratings/ratings.yaml`)
`venueId, platform, score, scale (5|10), count, url, asOf (YYYY-MM), approved:boolean`. Renders only if `approved` and `asOf` ≤ 6 months old (build warns at 4 months).

## page copy (`pages/{page}.{locale}.md`)
Frontmatter: `title, description, ogImage?, status`. Body Markdown for long text (About, Privacy, Location intro).

## UI strings (`i18n/ui.{locale}.yaml`)
Flat keys `nav.about`, `cta.whatsapp`, `cta.bookOn` ("Book on {platform}"), etc. Source: [CTA-COPY.md](./CTA-COPY.md).

## Adding a new venue (procedure)
1. Create `venues/{id}.yaml` with `status: draft`. 2. Add rooms (stays) or menu files (dining). 3. Add images to gallery with `rightsConfirmed`. 4. Fill fieldStatus. 5. Set `published` → page, cards, nav dropdown, sitemap, schema, gallery filter update automatically.
