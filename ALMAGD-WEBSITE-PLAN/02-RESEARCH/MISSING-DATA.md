# MISSING DATA AUDIT

> Every gap that blocks or weakens the website. Facts → [DATA-AUDIT.md](./DATA-AUDIT.md). Questions to owner → [QUESTIONS-FOR-MANAGEMENT.md](./QUESTIONS-FOR-MANAGEMENT.md).
> **Blocks launch = Y** means the related page/section cannot go live (it may still be built with PLACEHOLDER in dev).

## ALMAGD

| ID | Item | Why needed | Page(s) affected | Priority | Blocks launch | Owner action |
|---|---|---|---|---|---|---|
| MD-01 | Logo (Latin + Arabic) | Header, favicon, OG image, trust | All | P0 | N (interim text wordmark allowed — see LOGO-REQUIREMENTS) | Commission logo or approve interim wordmark |
| MD-02 | Legal/registered company name | Footer ©, Organization schema, Privacy Policy controller | Footer, Privacy, About | P0 | **Y** (Privacy Policy) | Provide name as on NIB/akta |
| MD-03 | Company story (who, since when, why) | About page | About, Home intro | P0 | N (About ships with neutral copy only) | 3–5 true sentences |
| MD-04 | Corporate contact (phone/WhatsApp, email) | Contact page "general inquiries" | Contact, Footer | P1 | N (venue numbers used) | Decide if a group number exists |
| MD-05 | Corporate address | Organization schema, Privacy | Footer, Privacy | P1 | N | Provide or use primary venue address |
| MD-06 | Corporate social accounts | Footer, `sameAs` | Footer | P2 | N | Decide whether to create @almagd |
| MD-07 | Domain | Launch | All | P0 | **Y** | DEC-017 |
| MD-08 | Approval of decisions DEC-002…029 | Binding plan | All | P0 | **Y** | Review MASTER-DECISIONS |

## New Pratama Villa

| ID | Item | Why needed | Page(s) | Priority | Blocks launch | Owner action |
|---|---|---|---|---|---|---|
| MD-10 | Confirm address (F-NP-03) | NAP, schema, map | NP page, Location, Contact | P0 | **Y** | Confirm text exactly |
| MD-11 | Google Maps link / Place ID / pin (F-NP-05) | Directions, map, schema geo | NP, Location | P0 | **Y** | Send Maps URL of entrance |
| MD-12 | Confirm reservation WhatsApp 0851-1758-8248 (F-NP-06) | Primary CTA | NP, Contact, chooser | P0 | **Y** | Confirm + say if WhatsApp Business |
| MD-13 | Number of villas & names | Stay options section | NP | P0 | **Y** for stay section | List villas |
| MD-14 | Unit types (Full Villa / Villa Kamar / "Sweet Deluxe"?) official names (C-12) | Room cards | NP | P0 | **Y** for stay section | List exact names |
| MD-15 | Per type: max guests, bedrooms, beds, bathrooms, kitchen y/n, size | Room cards | NP | P0 | **Y** for stay section | Fill table template |
| MD-16 | Facility confirmation: pool (adult/kids), WiFi, parking (#cars), kitchen, BBQ, mushola, smoking area (F-NP-16…22) | Facilities grid | NP | P0 | N (unconfirmed items hidden) | Tick checklist |
| MD-17 | Policies: check-in/out, ID, age, pets, parties, deposit, cancellation, extra bed | Policies, FAQ | NP | P0 | N (section hidden) | Fill policy template |
| MD-18 | OTA URLs: Tiket.com (+ confirm Agoda, Trip.com) | Booking panel | NP | P0 | N (WhatsApp always available) | Send links |
| MD-19 | Photos with usage rights (≥ 12 for launch) | Hero, gallery, cards | NP, Home, Gallery | P0 | **Y** | Provide originals / photoshoot |
| MD-20 | Short description in owner's words (what makes it special) | Overview | NP | P1 | N | 3 sentences |
| MD-21 | Halal-friendly / mushola / family details | Gulf & family segments | NP | P1 | N | Confirm |

## Villa NJD

| ID | Item | Why needed | Page(s) | Priority | Blocks launch | Owner action |
|---|---|---|---|---|---|---|
| MD-30 | Official name spelling (C-06) | NAP, branding | All | P0 | **Y** | Choose "Villa NJD" or other |
| MD-31 | Room types official list (C-04) | Room cards | NJD | P0 | **Y** for rooms section | List names |
| MD-32 | Room count total & per type (C-01) | Copy, schema `numberOfRooms` (optional) | NJD | P1 | N (count not shown until confirmed) | Provide |
| MD-33 | Room sizes (C-02, C-03), max guests, beds, kitchen, balcony | Room cards | NJD | P0 | N (field hidden) | Fill template |
| MD-34 | Confirm WhatsApp 0813-3303-5141 (F-NJD-05) | CTA | NJD, Contact | P0 | **Y** | Confirm |
| MD-35 | Google Maps link / pin (C-10) | Map, directions | NJD, Location | P0 | **Y** | Send link |
| MD-36 | Official Instagram(s) (C-07) | Social links | NJD, Footer | P0 | N | Confirm @njdvilla / @njdhotel |
| MD-37 | OTA URLs: Booking.com, Agoda, Trip.com (Traveloka & Tiket verified) | Booking panel | NJD | P1 | N | Send links |
| MD-38 | Policy confirmation (F-NJD-17…22) | Policies | NJD | P0 | N | Confirm |
| MD-39 | AC / lift / accessibility info (F-NJD-29, 30) | Honest expectations, FAQ | NJD | P1 | N | Confirm |
| MD-40 | Photos with usage rights (≥ 15) | Hero, rooms, gallery | NJD, Home | P0 | **Y** | Provide |
| MD-41 | Permission to show rating badges + which platforms | Ratings | NJD, Home | P1 | N | Approve |

## NJD Cafe

| ID | Item | Why needed | Page(s) | Priority | Blocks launch | Owner action |
|---|---|---|---|---|---|---|
| MD-50 | Location: inside Villa NJD? separate address? (F-CAFE-04, C-08) | Location, schema | Cafe, Location | P0 | **Y** | Confirm |
| MD-51 | Open to public or guests only (F-CAFE-05) | Copy, schema | Cafe | P0 | **Y** | Confirm |
| MD-52 | Opening hours per day (F-CAFE-06) | Hours block, schema | Cafe, Contact | P0 | **Y** | Provide |
| MD-53 | Prices for Es Kopi, Nasi Ayam Bakar/Goreng, Vietnam Drip | Menu | Menu | P0 | N (shown "Ask us" — or hidden) | Provide |
| MD-54 | Unknown names: Koleja, Gemat, Roti Pataer, Milo Dino | Menu accuracy | Menu | P0 | N (items hidden until clarified) | Explain each |
| MD-55 | Spaghetti Creamy price check (C-13) | Menu accuracy | Menu | P0 | N | Confirm |
| MD-56 | Halal status (F-CAFE-07, DEC-028) | Key trust signal | Cafe, Menu | P0 | N | Certified / owner-declared / none |
| MD-57 | Variants: Aneka Jus flavours, Indomie style, Iga beef/lamb, Kebab filling, Pizza toppings | Menu clarity | Menu | P1 | N | Provide |
| MD-58 | Item descriptions (at least featured 6) | Menu, featured grid | Cafe, Menu | P1 | N | Approve drafts |
| MD-59 | Menu photos (WhatsApp catalog export) | Featured grid, thumbnails | Cafe, Menu | P0 (≥ 6) | N | Export catalog images |
| MD-60 | Payment methods (cash/QRIS/card) | FAQ | Cafe | P1 | N | Provide |
| MD-61 | Prices include tax/service? | Menu footnote | Menu | P0 | N | Confirm |
| MD-62 | Cafe interior/exterior photos | Hero | Cafe | P0 | **Y** | Provide |
| MD-63 | Social account / GBP for cafe | Local SEO | Cafe | P2 | N | Decide |

## Cross-cutting

| ID | Item | Priority | Blocks launch | Owner action |
|---|---|---|---|---|
| MD-70 | Arabic translation reviewer (native) | P0 | **Y** for `/ar` | Name a reviewer |
| MD-71 | Indonesian copy reviewer | P0 | **Y** | Name a reviewer |
| MD-72 | Photo usage rights confirmation for any OTA/IG photo reused | P0 | **Y** | Sign-off |
| MD-73 | Privacy policy legal review | P0 | **Y** | Engage reviewer |
| MD-74 | Analytics choice (DEC-018) | P0 | N (default GA4) | Decide |
| MD-75 | Who maintains content after launch | P1 | N | Name person |

## Launch-blocker summary

`MD-02, MD-07, MD-08, MD-10, MD-11, MD-12, MD-13*, MD-14*, MD-15*, MD-19, MD-30, MD-31*, MD-34, MD-35, MD-40, MD-50, MD-51, MD-52, MD-62, MD-70, MD-71, MD-72, MD-73` (* blocks only the stays/rooms section; page can launch without that section only if owner accepts).
