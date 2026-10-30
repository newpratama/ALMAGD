# SOURCE REGISTRY

> **Single Source of Truth for: sources.** Every fact in [DATA-AUDIT.md](./DATA-AUDIT.md) cites a Source ID from this file.
> Research date for all entries: **2026-10-06** (unless noted). Researcher: planning agent (automated fetch + web search).

## Reliability scale

| Level | Meaning |
|---|---|
| High | Owner-controlled channel (official social, WhatsApp Business) or owner statement |
| Medium | Major OTA listing (data supplied by property, may be outdated / auto-generated) |
| Low | Search-engine summary, blog, aggregator, AI-generated OTA prose |
| n/a | Source could not be read |

## Access method notes

- OTA pages (Traveloka, Tiket.com) were fetched as raw HTML; data was extracted from embedded JSON-LD and page state. These are reliable for what the property supplied to the OTA, **not** proof of current reality.
- Agoda and Google pages are JavaScript-rendered; their content could **not** be extracted directly.
- Instagram returned only public meta (name, follower/post counts). Post content/bio not accessible without login.
- "Search summary" sources = web-search engine summaries citing tiket.com / trip.com / YouTube / wisataraya.id. Original pages were not individually opened; treat as **Low** reliability leads only.

---

## ALMAGD (parent brand)

| Source ID | Entity | Platform | URL | Source Type | Official / 3rd party | Accessible? | Date Checked | Information Found | Reliability | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| SRC-ALM-001 | ALMAGD | Owner brief (this project prompt) | — | Owner statement | Official | Yes | 2026-10-06 | Brand name ALMAGD / المجد; portfolio = New Pratama, Villa NJD, NJD Cafe; brand goals | High | Status USER_PROVIDED |
| SRC-ALM-002 | ALMAGD | Web search | query: `ALMAGD hospitality Indonesia Puncak "Al Magd" OR "Almagd" villa` | Search summary | 3rd party | Yes | 2026-10-06 | **No public web presence found** for ALMAGD as a hospitality brand | Low | Confirms brand is new / unindexed. No website, no GBP, no social found |

## NEW PRATAMA

| Source ID | Entity | Platform | URL | Source Type | Official / 3rd party | Accessible? | Date Checked | Information Found | Reliability | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| SRC-NP-001 | New Pratama | Agoda | https://www.agoda.com/id-id/new-pratama-villa/hotel/puncak-id.html | OTA | 3rd party | **Partial** | 2026-10-06 | Listing exists; listing name slug "new-pratama-villa"; Agoda property ID **86433029**; city "Puncak" | Medium | Page is JS-rendered; facilities, rooms, reviews **not extractable**. Status SOURCE_NOT_ACCESSIBLE for details |
| SRC-NP-002 | New Pratama | Agoda internal API | agoda.com/api/cronos/property/BelowFoldParams/GetSecondaryData?hotel_id=86433029 | OTA API | 3rd party | Partial | 2026-10-06 | Only UI translation strings returned (truncated) | n/a | No property data obtained |
| SRC-NP-003 | New Pratama | Instagram | https://www.instagram.com/newpratamavilla/ | Official social | Official (presumed) | Partial (meta only) | 2026-10-06 | Display name "New Pratama Villa" (stylised unicode); 333 followers; 59 following; 36 posts | High (for existence) | Bio/posts not readable without login |
| SRC-NP-004 | New Pratama | TikTok | https://www.tiktok.com/@newpratama88 | Official social | Official (presumed) | Yes (profile header) | 2026-10-06 | Name "NEW PRATAMA VILLA"; bio: "Villa kamar & Resort · RESERVASI ADMIN 0851-1758-8248 · DM AVAILABLE · Ticket.com · IG: @newpratamavilla" | High | Bio confirms reservation number, Tiket.com presence and IG cross-link |
| SRC-NP-005 | New Pratama | Google share link | https://share.google/Gaq98ZowEc3sf5akB | Google Search / Maps share | Official GBP (presumed) | **No** | 2026-10-06 | Redirects to a JS-only Google Search page; no data extracted | n/a | SOURCE_NOT_ACCESSIBLE. Owner must provide the canonical Google Maps URL / Place ID |
| SRC-NP-006 | New Pratama | Web search | query: `"New Pratama Villa" Puncak Cisarua` (+3 variants) | Search summary citing tiket.com, trip.com, YouTube, wisataraya.id | 3rd party | Yes | 2026-10-06 | Address "Jl. Sukamaju 1, RT.01/RW.08, Desa Tugu Selatan, Kec. Cisarua, Kab. Bogor, Jawa Barat 16750"; outdoor shared pool (adult ~1.5 m + kids area); "Full 1 Villa" and "Villa Kamar" rental modes; a room type referenced as "Sweet Deluxe" with kitchen; WiFi; parking (~10 cars); mushola; BBQ tools; smoking area; mountain + night city view; bamboo-themed room; check-in 14:00–23:59, check-out 12:00; noise-insulation complaints; gang (alley) access limits online ojek; Trip.com rating "9.9/10" | Low | All facts → PUBLIC_SOURCE_ONLY until owner confirms |
| SRC-NP-007 | New Pratama | Tiket.com | URL **not identified** | OTA | 3rd party | Not located | 2026-10-06 | Existence implied by SRC-NP-004 bio and search citations | n/a | Owner to provide exact listing URL |
| SRC-NP-008 | New Pratama | Trip.com | URL not identified | OTA | 3rd party | Not located | 2026-10-06 | Cited by search summary (rating 9.9/10) | Low | Owner to confirm whether Trip.com is an approved channel |

## VILLA NJD

| Source ID | Entity | Platform | URL | Source Type | Official / 3rd party | Accessible? | Date Checked | Information Found | Reliability | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| SRC-NJD-001 | Villa NJD | Traveloka | https://www.traveloka.com/id-id/hotel/indonesia/villa-njd-9000000927251 | OTA | 3rd party | **Yes** | 2026-10-06 | Name "VILLA NJD"; type "Vila"; address "Jl. ciburial Rt.01/05 Tugu Utara cisarua bogor, Cisarua, Puncak, Jawa Barat 16750"; rating **8.9/10 from 717 reviews**; star rating 0.0 (unrated); check-in 14:00–23:59; check-out 00:01–12:00; built year **2023**; FAQ "Ada 4 kamar"; room types (SEO text): Standard With Balcony (28 m², from Rp 396.694), Deluxe With Balcony (**784 m²**, from Rp 446.281), Deluxe Suite (28 m², from Rp 528.926); policies (ID required, min age 17, no early check-in, no late check-out, no parties, no pets, no breakfast on any room type); photo categories (exterior, common space, pool, lobby, other); nearby: Taman Safari ~5 km, Gunung Mas ~7 km, Curug Cilember ~8 km, Kebun Raya Cibodas ~10 km, Taman Bunga Nusantara ~12 km; ~27 recent review texts | Medium | Room sizes and FAQ room count look auto-generated → see DATA-CONFLICTS |
| SRC-NJD-002 | Villa NJD | Tiket.com | https://www.tiket.com/id-id/hotel/indonesia/villa-njd-909001790061495938 | OTA | 3rd party | **Yes** | 2026-10-06 | Name "Villa NJD"; star rating **3**; telephone **+62 813-3303-5141**; address "Jalan Ciburial Rt.01/05 Desa Tugu Utara Kecamatan Cisarua Jawa Barat"; check-in 14:00–23:59, check-out 12:00; free WiFi, free parking, 24h reception, door security, pets not allowed; "NIB Terdaftar" badge (business registration); description mentions work desk, flat-screen TV, shower, free toiletries, "Dulang Restaurant", 2.7 km to Perkebunan Teh Cisarua, 5 km Taman Safari, 6.3 km Cimory Mountain View, 64.3 km Halim airport; total reviews field 1,511 | Medium | Description appears copied from a Booking.com-style template ("Dulang Restaurant" is a separate external restaurant) |
| SRC-NJD-003 | Villa NJD | Instagram | https://www.instagram.com/njdvilla/ | Official social | Official (presumed) | Partial (meta only) | 2026-10-06 | Display name "VILLA NJD"; **14K followers**; 181 following; 120 posts | High (for existence) | Strongest social asset in the portfolio |
| SRC-NJD-004 | Villa NJD | Instagram | https://www.instagram.com/njdhotel/ | Social (unverified) | Unknown | **No** (no meta returned) | 2026-10-06 | Mentioned by search summaries/YouTube as "@njdhotel" | Low | Could be old/duplicate account → owner to confirm |
| SRC-NJD-005 | Villa NJD | Web search | queries: `"Villa NJD" Puncak Cisarua Tugu Utara`, `Villa NJD Cisarua booking.com`, `instagram njdvilla OR njdhotel` | Search summary (tiket, traveloka, trip.com, booking.com, YouTube, planetofhotels) | 3rd party | Yes | 2026-10-06 | Booking.com listing exists (as "Vila NJD"); Agoda + Trip.com listings exist; Trip.com rating 8.3/10; Tiket rating 4.5/5; phone/WhatsApp 0813-3303-5141; outdoor pool with mountain view (Gede-Pangrango); kitchen set in some units; refill water/coffee/tea station | Low | Booking.com / Agoda / Trip.com URLs not individually verified |
| SRC-NJD-006 | Villa NJD | Google Search | https://www.google.com/search?q=VILA+NJD | Search engine | 3rd party | **No** (JS) | 2026-10-06 | Not extracted | n/a | Owner to supply Google Maps link / Place ID |
| SRC-NJD-007 | Villa NJD | Traveloka guest reviews (embedded in SRC-NJD-001) | same as SRC-NJD-001 | UGC reviews | 3rd party | Yes | 2026-10-06 | Recurring themes: friendly staff, cleanliness, mountain/sunset/night view, river sound, cool air "without AC", on-site restaurant food praised, balcony, kitchen set in some rooms, no AC (fans available), no lift (stairs), non-smart TV, room numbering e.g. "Kamar 108", water/coffee/tea dispenser on every floor, occasional maintenance complaints | Medium | Use only for insight & FAQ planning. **Do not copy text to website** (see Reviews policy) |

## NJD CAFE

| Source ID | Entity | Platform | URL | Source Type | Official / 3rd party | Accessible? | Date Checked | Information Found | Reliability | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| SRC-CAFE-001 | NJD Cafe | WhatsApp Business (owner-provided) | wa.me/6281116618075 | Official channel | Official | Via owner | 2026-10-06 | Name "NJD Cafe"; phone **+62 811-1661-8075**; catalog of 47 items with 44 prices | High | Status USER_PROVIDED. Catalog not independently fetched |
| SRC-CAFE-002 | NJD Cafe | Web search | queries: `"NJD Cafe" OR "NJD Resto" Puncak Cisarua`, `"NJD" cafe restoran Tugu Utara Cisarua` | Search summary | 3rd party | Yes | 2026-10-06 | **No independent web presence found** (no GBP, no social, no listing) | Low | Cafe location, hours, socials all MISSING |
| SRC-CAFE-003 | NJD Cafe (inferred) | Traveloka reviews of Villa NJD (SRC-NJD-007) | same as SRC-NJD-001 | UGC | 3rd party | Yes | 2026-10-06 | Multiple guests praise "makanan restonya" (the resto's food) at Villa NJD → suggests an on-site restaurant | Low | Relationship NJD Cafe ⇄ Villa NJD = **NEEDS_CONFIRMATION** |

## Reference / competitor sources

Competitor and benchmark observations are recorded in [COMPETITOR-BENCHMARK.md](./COMPETITOR-BENCHMARK.md) and are based on general industry knowledge, not on facts about ALMAGD properties. They are therefore not given Source IDs.

## Sources still required from owner (blocking verification)

| Needed | Why |
|---|---|
| Google Maps URL / Place ID for each of the 3 venues | Coordinates, NAP, reviews, map embed |
| Tiket.com URL for New Pratama | OTA CTA |
| Booking.com, Agoda, Trip.com URLs for Villa NJD | OTA CTA (only add approved channels) |
| Confirmation of @njdhotel status | Avoid linking a dead/unofficial account |
| WhatsApp catalog export or screenshots (NJD Cafe) | Menu verification & images |
