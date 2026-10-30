# DATA AUDIT

> **Single Source of Truth for: facts & data.** Every website fact must come from this file. If a fact is not here with an allowed status, it must not be published.
> Sources → [SOURCE-REGISTRY.md](./SOURCE-REGISTRY.md) · Conflicts → [DATA-CONFLICTS.md](./DATA-CONFLICTS.md) · Gaps → [MISSING-DATA.md](./MISSING-DATA.md)
> Audit date: 2026-10-06

## Status legend

| Status | Meaning | Publishable? |
|---|---|---|
| USER_CONFIRMED | Owner explicitly confirmed | ✅ Yes |
| USER_PROVIDED | Owner supplied (in brief), not re-verified | ✅ Yes (owner's own data) |
| OFFICIAL_SOURCE | From owner-controlled channel (official social/WA) | ✅ Yes |
| VERIFIED | Checked against original source | ✅ Yes |
| VERIFIED_MULTIPLE_SOURCES | ≥2 independent sources agree | ✅ Yes, but owner confirmation recommended |
| PUBLIC_SOURCE_ONLY | Only on an OTA / 3rd party | ⚠️ Only after owner confirms |
| NEEDS_CONFIRMATION | Owner must confirm | ❌ No (use PLACEHOLDER) |
| CONFLICT | Sources disagree | ❌ No |
| SUSPICIOUS | Looks wrong | ❌ No |
| MISSING | No data | ❌ No |
| SOURCE_NOT_ACCESSIBLE | Source could not be read | ❌ No |

**Publishing rule (DEC-010):** Before launch every field shown on the site must be `USER_CONFIRMED`, `USER_PROVIDED`, `OFFICIAL_SOURCE`, `VERIFIED` or `VERIFIED_MULTIPLE_SOURCES`. Anything else renders as nothing (section hidden) — never as invented text.

---

## A. ALMAGD (parent brand)

| ID | Field | Value | Status | Source |
|---|---|---|---|---|
| F-ALM-01 | Brand name (Latin) | ALMAGD | USER_PROVIDED | SRC-ALM-001 |
| F-ALM-02 | Brand name (Arabic) | المجد | USER_PROVIDED | SRC-ALM-001 |
| F-ALM-03 | Meaning | "Glory" (Arabic) | VERIFIED (linguistic) | — |
| F-ALM-04 | Country | Indonesia | USER_PROVIDED | SRC-ALM-001 |
| F-ALM-05 | Portfolio | New Pratama, Villa NJD, NJD Cafe | USER_PROVIDED | SRC-ALM-001 |
| F-ALM-06 | Legal / registered company name | — | MISSING | — |
| F-ALM-07 | Logo | — | MISSING | — |
| F-ALM-08 | Founding year / story | — | MISSING | — |
| F-ALM-09 | Corporate phone / WhatsApp | — | MISSING | — |
| F-ALM-10 | Corporate email | — | MISSING | — |
| F-ALM-11 | Corporate address | — | MISSING | — |
| F-ALM-12 | Corporate social accounts | none found | MISSING | SRC-ALM-002 |
| F-ALM-13 | Existing website / domain | none found | MISSING | SRC-ALM-002 |
| F-ALM-14 | Web presence | No indexed presence for "ALMAGD" hospitality | VERIFIED | SRC-ALM-002 |

## B. NEW PRATAMA

| ID | Field | Value | Status | Source |
|---|---|---|---|---|
| F-NP-01 | Public name | "New Pratama Villa" (Agoda slug, IG, TikTok); owner brief: "NEW PRATAMA" | VERIFIED_MULTIPLE_SOURCES | SRC-NP-001/003/004 |
| F-NP-02 | Type | Villa complex renting **full villa** and **per room** ("Villa kamar & Resort") | OFFICIAL_SOURCE (TikTok bio) + PUBLIC_SOURCE_ONLY (details) | SRC-NP-004, SRC-NP-006 |
| F-NP-03 | Address | Jl. Sukamaju 1, RT.01/RW.08, Desa Tugu Selatan, Kec. Cisarua, Kab. Bogor, Jawa Barat 16750 | PUBLIC_SOURCE_ONLY → NEEDS_CONFIRMATION | SRC-NP-006 |
| F-NP-04 | Area labels | Puncak / Cisarua / Bogor | VERIFIED_MULTIPLE_SOURCES | SRC-NP-001, SRC-NP-006 |
| F-NP-05 | Coordinates | — | MISSING | SRC-NP-005 not accessible |
| F-NP-06 | Reservation phone / WhatsApp | **+62 851-1758-8248** (written "0851-1758-8248", "RESERVASI ADMIN") | OFFICIAL_SOURCE | SRC-NP-004 |
| F-NP-07 | Instagram | @newpratamavilla — https://www.instagram.com/newpratamavilla/ (333 followers, 36 posts on 2026-10-06) | OFFICIAL_SOURCE | SRC-NP-003, cross-linked in SRC-NP-004 |
| F-NP-08 | TikTok | @newpratama88 — https://www.tiktok.com/@newpratama88 | OFFICIAL_SOURCE | SRC-NP-004 |
| F-NP-09 | Agoda listing | https://www.agoda.com/id-id/new-pratama-villa/hotel/puncak-id.html (ID 86433029) | VERIFIED (exists) | SRC-NP-001 |
| F-NP-10 | Tiket.com listing | Exists per owner's TikTok bio; URL unknown | OFFICIAL_SOURCE (existence) / MISSING (URL) | SRC-NP-004 |
| F-NP-11 | Trip.com listing | Mentioned by search summary | PUBLIC_SOURCE_ONLY | SRC-NP-008 |
| F-NP-12 | Google Business Profile | Share link supplied by owner | USER_PROVIDED (link) / SOURCE_NOT_ACCESSIBLE (content) | SRC-NP-005 |
| F-NP-13 | Number of villas | — | MISSING | — |
| F-NP-14 | Villa / room type names | "Full 1 Villa", "Villa Kamar", "Sweet Deluxe" (likely "Suite Deluxe") | PUBLIC_SOURCE_ONLY / "Sweet Deluxe" SUSPICIOUS | SRC-NP-006 |
| F-NP-15 | Capacity / bedrooms / bathrooms per type | — | MISSING | — |
| F-NP-16 | Swimming pool | Outdoor shared pool, adult section (~1.5 m) + children's section | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-17 | WiFi | Yes | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-18 | Parking | Yes, ~10 cars | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-19 | Kitchen | In some types (e.g. "Sweet Deluxe") + cooking utensils | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-20 | BBQ equipment | Yes | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-21 | Prayer room (mushola) | Yes | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-22 | Smoking area | Yes | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-23 | Views | Mountain view; city lights at night | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-24 | Room style note | Bamboo-themed room exists | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-25 | Check-in / check-out | 14:00–23:59 / by 12:00 | PUBLIC_SOURCE_ONLY | SRC-NP-006 |
| F-NP-26 | Access note | Located in a residential alley (gang); online-ojek access may be limited; local eateries walkable | PUBLIC_SOURCE_ONLY (internal insight only, do not publish as-is) | SRC-NP-006 |
| F-NP-27 | Guest-feedback themes | Positive: view, cool air, price/value, pool. Negative: sound insulation, shared hot-water dispenser | PUBLIC_SOURCE_ONLY (insight only) | SRC-NP-006 |
| F-NP-28 | Ratings | Trip.com 9.9/10 (search summary) | PUBLIC_SOURCE_ONLY — do not publish | SRC-NP-008 |
| F-NP-29 | Policies (pets, parties, age, deposit, cancellation) | — | MISSING | — |
| F-NP-30 | Prices | — | MISSING (and not required: site does not show room prices — DEC-007) | — |
| F-NP-31 | Photos | Exist on IG/TikTok/OTAs (owner copyright unknown) | NEEDS_CONFIRMATION | SRC-NP-003/004 |

## C. VILLA NJD

| ID | Field | Value | Status | Source |
|---|---|---|---|---|
| F-NJD-01 | Public name | "Villa NJD" (Tiket), "VILLA NJD" (Traveloka, IG), "Vila NJD" (Booking.com per search), "NJD Hotel" (some reviews/@njdhotel) | CONFLICT (spelling variants) — recommended display "Villa NJD" | SRC-NJD-001/002/003/005 |
| F-NJD-02 | Type | Listed as "Vila" (Traveloka) / Hotel 3★ (Tiket); operates hotel-style (24h reception, numbered rooms, multiple floors) | CONFLICT (classification) | SRC-NJD-001/002/007 |
| F-NJD-03 | Address | Jl. Ciburial RT.01/RW.05, Desa Tugu Utara, Kec. Cisarua, Kab. Bogor, Jawa Barat 16750 | VERIFIED_MULTIPLE_SOURCES (Traveloka + Tiket agree) | SRC-NJD-001/002 |
| F-NJD-04 | Coordinates | Traveloka page state repeats −6.680261, 106.942256 (most frequent coordinate pair) | NEEDS_CONFIRMATION (not labelled as the hotel's own pin) | SRC-NJD-001 |
| F-NJD-05 | Phone / WhatsApp | **+62 813-3303-5141** | VERIFIED_MULTIPLE_SOURCES (Tiket JSON-LD + search summaries) → owner confirm it is WhatsApp-enabled | SRC-NJD-002/005 |
| F-NJD-06 | Instagram | @njdvilla — https://www.instagram.com/njdvilla/ (14K followers, 120 posts on 2026-10-06) | OFFICIAL_SOURCE (presumed) → NEEDS_CONFIRMATION | SRC-NJD-003 |
| F-NJD-07 | Instagram (alt) | @njdhotel | SOURCE_NOT_ACCESSIBLE / NEEDS_CONFIRMATION | SRC-NJD-004 |
| F-NJD-08 | TikTok / Facebook | — | MISSING | — |
| F-NJD-09 | Traveloka listing | https://www.traveloka.com/id-id/hotel/indonesia/villa-njd-9000000927251 | VERIFIED | SRC-NJD-001 |
| F-NJD-10 | Tiket.com listing | https://www.tiket.com/id-id/hotel/indonesia/villa-njd-909001790061495938 | VERIFIED | SRC-NJD-002 |
| F-NJD-11 | Booking.com / Agoda / Trip.com | Listings exist per search; URLs unverified | PUBLIC_SOURCE_ONLY | SRC-NJD-005 |
| F-NJD-12 | Built year | 2023 | PUBLIC_SOURCE_ONLY | SRC-NJD-001 |
| F-NJD-13 | Room types | Standard With Balcony · Deluxe With Balcony · Deluxe Suite (+ possibly a 4th type; one review mentions a "royal" room; another mentions a room "with mini pool") | PUBLIC_SOURCE_ONLY / NEEDS_CONFIRMATION | SRC-NJD-001/007 |
| F-NJD-14 | Room sizes | Standard With Balcony 28 m²; Deluxe With Balcony **784 m²**; Deluxe Suite 28 m² | SUSPICIOUS | SRC-NJD-001 |
| F-NJD-15 | Number of rooms | Traveloka FAQ "4 kamar" vs. review citing "Kamar 108" and "every floor" | CONFLICT | SRC-NJD-001/007 |
| F-NJD-16 | Check-in / check-out | 14:00–23:59 / until 12:00 | VERIFIED_MULTIPLE_SOURCES | SRC-NJD-001/002 |
| F-NJD-17 | Early check-in / late check-out | Not allowed (Traveloka) | PUBLIC_SOURCE_ONLY | SRC-NJD-001 |
| F-NJD-18 | ID requirement | ID card required at check-in (digital copy accepted) | PUBLIC_SOURCE_ONLY | SRC-NJD-001 |
| F-NJD-19 | Minimum check-in age | 17; children must be accompanied by an adult | PUBLIC_SOURCE_ONLY | SRC-NJD-001 |
| F-NJD-20 | Pets | Not allowed | VERIFIED_MULTIPLE_SOURCES | SRC-NJD-001/002 |
| F-NJD-21 | Parties / events | Not allowed | PUBLIC_SOURCE_ONLY | SRC-NJD-001 |
| F-NJD-22 | Breakfast | Not included on any room type ("Semua Type Room tidak ada sarapan") | PUBLIC_SOURCE_ONLY | SRC-NJD-001 |
| F-NJD-23 | Swimming pool | Outdoor pool; photos in OTA "Kolam Renang" category; mountain view mentioned | VERIFIED_MULTIPLE_SOURCES (Traveloka photos + search) | SRC-NJD-001/005 |
| F-NJD-24 | WiFi | Free | VERIFIED_MULTIPLE_SOURCES | SRC-NJD-002/005 |
| F-NJD-25 | Parking | Free (reviews: limited car spaces) | VERIFIED_MULTIPLE_SOURCES | SRC-NJD-002/005/007 |
| F-NJD-26 | Reception | 24-hour front desk | PUBLIC_SOURCE_ONLY | SRC-NJD-002 |
| F-NJD-27 | Security | Door guard / security | PUBLIC_SOURCE_ONLY | SRC-NJD-002 |
| F-NJD-28 | In-room | Work desk, flat-screen TV (not smart TV per reviews), shower, toiletries, hot water; balcony on balcony types; kitchen set in some rooms | PUBLIC_SOURCE_ONLY | SRC-NJD-002/007 |
| F-NJD-29 | Air conditioning | No AC (fans available on request) | PUBLIC_SOURCE_ONLY (reviews) — NEEDS_CONFIRMATION | SRC-NJD-007 |
| F-NJD-30 | Lift | None (stairs) | PUBLIC_SOURCE_ONLY (review) — NEEDS_CONFIRMATION | SRC-NJD-007 |
| F-NJD-31 | Shared amenities | Water / coffee / tea refill dispenser on each floor | PUBLIC_SOURCE_ONLY (reviews) | SRC-NJD-005/007 |
| F-NJD-32 | On-site dining | Guests praise the on-site "resto"; Tiket text names "Dulang Restaurant" | CONFLICT | SRC-NJD-002/007 |
| F-NJD-33 | Views & ambience | Mountain view, sunset/sunrise, night view, river sound, birdsong, cool climate | PUBLIC_SOURCE_ONLY (reviews, consistent) | SRC-NJD-007 |
| F-NJD-34 | Ratings | Traveloka 8.9/10 (717 reviews); Tiket 4.5/5 (search) — total-reviews field 1,511; Trip.com 8.3/10 (search) | VERIFIED (Traveloka only) / PUBLIC_SOURCE_ONLY (others) | SRC-NJD-001/002/005 |
| F-NJD-35 | Star classification | Tiket 3★; Traveloka 0 (unrated) | CONFLICT — do not publish stars | SRC-NJD-001/002 |
| F-NJD-36 | Business registration | Tiket shows "NIB Terdaftar" | PUBLIC_SOURCE_ONLY | SRC-NJD-002 |
| F-NJD-37 | Nearby attractions (distance from property) | Taman Safari Indonesia ~5 km (both OTAs); Perkebunan Teh Cisarua 2.7 km; Cimory Mountain View 6.3 km; Gunung Mas tea plantation ~7 km; Curug Cilember ~8 km; Kebun Raya Cibodas ~10 km; Taman Bunga Nusantara ~12 km; Halim Perdanakusuma airport 64.3 km | Safari: VERIFIED_MULTIPLE_SOURCES; others PUBLIC_SOURCE_ONLY | SRC-NJD-001/002 |
| F-NJD-38 | Prices | From ~Rp 396k (Standard Balcony) on Traveloka | PUBLIC_SOURCE_ONLY — **never published** (DEC-007) | SRC-NJD-001 |

## D. NJD CAFE

| ID | Field | Value | Status | Source |
|---|---|---|---|---|
| F-CAFE-01 | Name | NJD Cafe | USER_PROVIDED | SRC-CAFE-001 |
| F-CAFE-02 | Phone / WhatsApp Business | +62 811-1661-8075 (wa.me/6281116618075) | USER_PROVIDED | SRC-CAFE-001 |
| F-CAFE-03 | WhatsApp catalog | Exists (47 items) | USER_PROVIDED | SRC-CAFE-001 |
| F-CAFE-04 | Location / address | Likely inside or adjacent to Villa NJD (inferred from reviews praising the on-site resto) | NEEDS_CONFIRMATION | SRC-CAFE-003 |
| F-CAFE-05 | Open to public or guests only | — | MISSING | — |
| F-CAFE-06 | Opening hours | — | MISSING | — |
| F-CAFE-07 | Halal status | — | MISSING (high-importance for target audience) | — |
| F-CAFE-08 | Payment methods | — | MISSING | — |
| F-CAFE-09 | Delivery / room service | — | MISSING | — |
| F-CAFE-10 | Social accounts / GBP | none found | MISSING | SRC-CAFE-002 |
| F-CAFE-11 | Seating capacity / indoor-outdoor | — | MISSING | — |
| F-CAFE-12 | Menu items & prices | See Section E | USER_PROVIDED (with audit flags) | SRC-CAFE-001 |

## E. NJD CAFE MENU — Raw data audit

**Totals:** 47 products listed · 44 prices listed · **3 items without price** · 0 exact duplicates · 0 price conflicts · currency IDR.
Names are kept **exactly as provided**. `name_flag` explains doubts. Category is the **proposed** category (see [MENU-CONTENT.md](../05-CONTENT/MENU-CONTENT.md)); it is a planning decision, not a fact.

| # | id | Name (as provided) | Price (IDR) | Price status | Name flag | Proposed category |
|---|---|---|---|---|---|---|
| 1 | m001 | Aqua Besar | 10,000 | USER_PROVIDED | OK (brand bottled water, large) | water-soft-drinks |
| 2 | m002 | Aqua Tanggung | 7,000 | USER_PROVIDED | OK (medium bottle) | water-soft-drinks |
| 3 | m003 | Teh Tarik Panas | 10,000 | USER_PROVIDED | OK | tea |
| 4 | m004 | Ice Teh Tarik | 15,000 | USER_PROVIDED | Mixed EN/ID naming ("Ice" vs "Es") | tea |
| 5 | m005 | Matcha Hot | 10,000 | USER_PROVIDED | OK | chocolate-matcha-milk |
| 6 | m006 | Coklat Hot | 10,000 | USER_PROVIDED | OK ("Coklat" common ID spelling; formal "Cokelat") | chocolate-matcha-milk |
| 7 | m007 | Es Teh Manis | 10,000 | USER_PROVIDED | OK | tea |
| 8 | m008 | Teh Panas | 10,000 | USER_PROVIDED | OK | tea |
| 9 | m009 | Kapal Api Hot | 10,000 | USER_PROVIDED | OK (Kapal Api = coffee brand) | coffee |
| 10 | m010 | Ice Thai Tea | 20,000 | USER_PROVIDED | OK | tea |
| 11 | m011 | Strawberry Milo Milk | 20,000 | USER_PROVIDED | OK | chocolate-matcha-milk |
| 12 | m012 | Ice Coklat Milk | 20,000 | USER_PROVIDED | OK | chocolate-matcha-milk |
| 13 | m013 | Lemon Yakult | 20,000 | USER_PROVIDED | OK | mocktails-refreshers |
| 14 | m014 | Ice Milk Tea | 20,000 | USER_PROVIDED | OK | tea |
| 15 | m015 | Milo Dino | 20,000 | USER_PROVIDED | Short for "Milo Dinosaur"? NEEDS_CONFIRMATION | chocolate-matcha-milk |
| 16 | m016 | Es Kopi | — | **MISSING** | OK | coffee |
| 17 | m017 | Es Tebu | 20,000 | USER_PROVIDED | OK (sugarcane juice) | juices |
| 18 | m018 | Ice Red Velvet | 20,000 | USER_PROVIDED | OK | chocolate-matcha-milk |
| 19 | m019 | Taro Ice | 20,000 | USER_PROVIDED | Word order inconsistent with "Ice …" items | chocolate-matcha-milk |
| 20 | m020 | Aneka Jus | 18,000 | USER_PROVIDED | "Assorted juices" — which fruits? NEEDS_CONFIRMATION (variants) | juices |
| 21 | m021 | Mie Goreng | 25,000 | USER_PROVIDED | OK | noodles |
| 22 | m022 | Spaghetti Bolognese | 35,000 | USER_PROVIDED | OK | western |
| 23 | m023 | Spaghetti Creamy | 50,000 | USER_PROVIDED | Price 43% above Bolognese — **SUSPICIOUS**, confirm | western |
| 24 | m024 | Mojito | 20,000 | USER_PROVIDED | Assumed non-alcoholic (virgin) — NEEDS_CONFIRMATION | mocktails-refreshers |
| 25 | m025 | Cappuccino Hot | 10,000 | USER_PROVIDED | OK (sachet vs espresso unknown) | coffee |
| 26 | m026 | Koleja | 7,000 | USER_PROVIDED | **Unknown word** — typo? NEEDS_CONFIRMATION (what is it, drink or snack?) | uncategorised |
| 27 | m027 | Bakso Bakar | 20,000 | USER_PROVIDED | OK | snacks |
| 28 | m028 | Nasi Goreng | 25,000 | USER_PROVIDED | OK | rice |
| 29 | m029 | Pizza | 50,000 | USER_PROVIDED | Size / toppings unknown | western |
| 30 | m030 | Chicken Wings | 20,000 | USER_PROVIDED | Portion unknown | snacks |
| 31 | m031 | Kwetiaw Goreng | 25,000 | USER_PROVIDED | OK (variant of "Kwetiau") | noodles |
| 32 | m032 | Bihun Goreng | 25,000 | USER_PROVIDED | OK | noodles |
| 33 | m033 | Sambosa | 20,000 | USER_PROVIDED | Middle-Eastern spelling of samosa — keep; confirm | middle-eastern |
| 34 | m034 | Roti Pataer | 25,000 | USER_PROVIDED | **Likely typo** — "Fatayer" (Arabic pastry) or "Paratha"? NEEDS_CONFIRMATION | middle-eastern |
| 35 | m035 | Nasi Ayam Bakar/Goreng | — | **MISSING** | Two variants in one item → model as variants | rice |
| 36 | m036 | Vietnam Drip | — | **MISSING** | OK (Vietnamese drip coffee) | coffee |
| 37 | m037 | Kentang Goreng | 20,000 | USER_PROVIDED | OK (French fries) | snacks |
| 38 | m038 | Nugget | 20,000 | USER_PROVIDED | OK | snacks |
| 39 | m039 | Indomie | 15,000 | USER_PROVIDED | Goreng or kuah? variants? | noodles |
| 40 | m040 | Iga Bakar + Nasi | 75,000 | USER_PROVIDED | Beef or lamb? NEEDS_CONFIRMATION | signature-mains |
| 41 | m041 | Sop Iga + Nasi | 75,000 | USER_PROVIDED | Beef or lamb? | signature-mains |
| 42 | m042 | Gemat | 20,000 | USER_PROVIDED | **Unknown word** — NEEDS_CONFIRMATION (possibly a Middle-Eastern sweet, e.g. "Luqaimat"?) | uncategorised |
| 43 | m043 | Kebab | 20,000 | USER_PROVIDED | Filling unknown | middle-eastern |
| 44 | m044 | Burger | 20,000 | USER_PROVIDED | OK | western |
| 45 | m045 | Roti Bakar | 20,000 | USER_PROVIDED | Toppings unknown | sweet-bites |
| 46 | m046 | Pisang Goreng | 20,000 | USER_PROVIDED | OK | sweet-bites |
| 47 | m047 | Pisang Bakar | 20,000 | USER_PROVIDED | OK | sweet-bites |

### Menu data gaps (all items)

| Field | Status |
|---|---|
| Descriptions | MISSING for all 47 |
| Photos | Exist in WhatsApp catalog (not received) — MISSING |
| Availability / seasonal | MISSING |
| Dietary (halal, vegetarian, spicy) | MISSING |
| Variants (juice flavours, Indomie style, Nasi Ayam bakar/goreng) | MISSING |
| Tax / service charge inclusion | MISSING |
| Featured / best-sellers | MISSING (owner to pick 6) |

## F. Cross-entity facts

| ID | Field | Value | Status |
|---|---|---|---|
| F-X-01 | All venues located in Kec. Cisarua, Kab. Bogor (Puncak area) | New Pratama: Tugu Selatan; Villa NJD: Tugu Utara; NJD Cafe: unknown | Partly VERIFIED |
| F-X-02 | Same phone for all venues? | **No** — 3 different numbers found (NP 0851-1758-8248, NJD 0813-3303-5141, Cafe 0811-1661-8075) | VERIFIED (numbers differ) |
| F-X-03 | Gulf / Middle-East visitor base in Cisarua (Tugu Selatan area) | Widely known regional fact; menu contains Middle-Eastern items (Sambosa, Kebab, likely Fatayer) | General knowledge — used for strategy, not published as a claim |
