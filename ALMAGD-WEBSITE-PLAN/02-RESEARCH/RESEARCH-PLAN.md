# RESEARCH PLAN & LOG

## Objective
Collect and verify every public fact about ALMAGD, New Pratama Villa, Villa NJD and NJD Cafe before any planning decision; record sources, confidence, conflicts and gaps.

## Method (executed 2026-10-06)

| Step | Action | Result |
|---|---|---|
| 1 | Fetch owner-supplied URLs (Agoda NP, Instagram NP, TikTok NP, Google share NP, Traveloka NJD, Tiket NJD, Google search NJD) | Traveloka & Tiket fully parsed; TikTok bio read; IG meta only; Agoda & Google JS-only → not accessible |
| 2 | Extract embedded structured data (JSON-LD, page state) from OTA HTML | Address, ratings, policies, room types, nearby POIs, review texts obtained |
| 3 | Try Agoda internal API with property ID 86433029 | Returned UI strings only |
| 4 | Independent web searches (≥ 14 queries) for each entity incl. "Villa NJD", "Vila NJD", "New Pratama Puncak/Cisarua", "NJD Cafe", "ALMAGD", @njdvilla/@njdhotel, Booking.com, Agoda, Trip.com, "Dulang Restaurant" | NP address & facilities (low reliability), NJD alt channels, @njdvilla discovered, no ALMAGD or NJD Cafe web presence |
| 5 | Fetch @njdvilla, @njdhotel | @njdvilla meta OK (14K); @njdhotel no data |
| 6 | Register sources → SOURCE-REGISTRY | 22 sources |
| 7 | Build fact table with statuses → DATA-AUDIT | ~110 fields incl. 47 menu items |
| 8 | Log conflicts → DATA-CONFLICTS | 13 conflicts |
| 9 | Log gaps → MISSING-DATA | ~50 items, 23 launch blockers |

## Limitations
- No login to Instagram/TikTok/Google → post content, GBP data, Maps coordinates unavailable.
- No keyword-volume tool → SEO uses intent-based prioritisation.
- Search-summary facts are leads, not evidence.
- WhatsApp catalog not accessed directly; menu taken from owner brief.

## Follow-up research (after owner answers)
1. Open each owner-supplied Google Maps link → record Place ID, coordinates, GBP categories, hours, review count.
2. Verify Tiket.com (NP), Booking.com/Agoda/Trip.com (NJD) URLs resolve and names match DEC-004.
3. Re-check ratings monthly for `ratings.yaml` (`asOf` date).
4. Check domain availability for DEC-017 options.
5. NAP consistency sweep across all OTAs & GBP once official spellings are confirmed (see [LOCAL-SEO.md](../10-SEO/LOCAL-SEO.md)).
