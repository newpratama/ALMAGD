# DATA CONFLICTS

> No conflict is resolved by the planning team. Each must be resolved by the owner before the affected field is published. Until then the field is **hidden** on the website.
> Facts → [DATA-AUDIT.md](./DATA-AUDIT.md)

| # | Entity | Field | Source A | Value A | Source B | Value B | Impact | Recommended Verification Method |
|---|---|---|---|---|---|---|---|---|
| C-01 | Villa NJD | Number of rooms | SRC-NJD-001 Traveloka FAQ | "Ada 4 kamar" | SRC-NJD-007 Traveloka review | Room "108" exists; dispensers "on every floor" (multi-floor building) | Room count claim; capacity copy | Owner states total rooms and rooms per type. Likely "4" = number of room **types** |
| C-02 | Villa NJD | Room size — Deluxe With Balcony | SRC-NJD-001 | 784 m² | Common sense / sibling types | Standard 28 m², Suite 28 m² | Room cards | Owner measures/confirms each type's m². 784 is almost certainly a data-entry error |
| C-03 | Villa NJD | Room size — Deluxe Suite vs Standard | SRC-NJD-001 | Suite 28 m² | SRC-NJD-001 | Standard 28 m² (same) | Room differentiation | Owner confirms |
| C-04 | Villa NJD | Room types list | SRC-NJD-001 | 3 named types (Standard w/ Balcony, Deluxe w/ Balcony, Deluxe Suite) | SRC-NJD-007 reviews | Mentions "royal" room and a room "with mini pool"; FAQ implies 4 | Rooms section | Owner sends official room-type list with names exactly as wanted on site |
| C-05 | Villa NJD | Property classification | SRC-NJD-001 | "Vila", star rating 0 | SRC-NJD-002 | Hotel, 3★ | Schema type, copy ("villa" vs "hotel") | Owner decides positioning (see DEC-004). Do **not** display star rating |
| C-06 | Villa NJD | Name spelling | SRC-NJD-001/003 | "VILLA NJD" | SRC-NJD-005 Booking.com / Google query | "Vila NJD"; also "NJD Hotel" | NAP consistency, SEO | Owner confirms official name; then align GBP & OTAs |
| C-07 | Villa NJD | Instagram account | SRC-NJD-003 | @njdvilla (14K, active) | SRC-NJD-004 | @njdhotel | Social links | Owner confirms which account(s) are official and active |
| C-08 | Villa NJD / NJD Cafe | On-site restaurant | SRC-NJD-002 Tiket description | "Tamu dapat menikmati makanan di Dulang Restaurant" (an external restaurant at Jl. Raya Puncak KM 83.7) | SRC-NJD-007 / SRC-CAFE-003 | Guests praise the in-house "resto" | Dining claims; NJD Cafe location | Owner confirms NJD Cafe is located at Villa NJD; request Tiket to correct description |
| C-09 | Villa NJD | Guest rating | SRC-NJD-001 | 8.9/10 (717 reviews) | SRC-NJD-005 | Tiket 4.5/5; Trip.com 8.3/10 | Rating badges | Not a true conflict (different platforms). Display per-platform with "as of" date only after owner approves |
| C-10 | Villa NJD | Coordinates | SRC-NJD-001 | −6.680261, 106.942256 (repeated) | SRC-NJD-002 | Several pairs present (−6.6882, 106.9559 etc.) none labelled as hotel | Map pin, schema geo | Owner sends Google Maps pin of the entrance |
| C-11 | New Pratama | Listing name | SRC-NP-001/003/004 | "New Pratama Villa" | SRC-ALM-001 brief | "NEW PRATAMA" | Display name | Owner chooses display name (recommended: "New Pratama Villa", short form "New Pratama") |
| C-12 | New Pratama | Room type "Sweet Deluxe" | SRC-NP-006 | "Sweet Deluxe" | Industry convention | "Suite Deluxe" / "Deluxe Suite" | Room naming | Owner confirms official spelling of every type |
| C-13 | NJD Cafe | Price — Spaghetti Creamy vs Bolognese | SRC-CAFE-001 | Creamy 50,000 | SRC-CAFE-001 | Bolognese 35,000 | Menu accuracy | Owner re-checks catalog (not an error unless confirmed) |
