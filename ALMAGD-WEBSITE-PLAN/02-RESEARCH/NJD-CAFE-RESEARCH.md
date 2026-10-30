# NJD CAFE — RESEARCH SUMMARY

Facts → [DATA-AUDIT.md §D–E](./DATA-AUDIT.md). Sources → SRC-CAFE-001…003.

## Findings
- Only source is the owner's WhatsApp Business (+62 811-1661-8075) and catalog (USER_PROVIDED).
- **No web presence**: no Google Business Profile, no social account, no listing found.
- Villa NJD reviews repeatedly praise an on-site "resto" → NJD Cafe is probably located at Villa NJD (NEEDS_CONFIRMATION, C-08). Tiket's text naming "Dulang Restaurant" is a template error referring to an external restaurant.

## Menu analysis (47 items)
| Group | Items | Price range (IDR) |
|---|---|---|
| Coffee | Kapal Api Hot, Cappuccino Hot, Es Kopi*, Vietnam Drip* | 10,000 (*missing) |
| Tea | Teh Panas, Es Teh Manis, Teh Tarik Panas, Ice Teh Tarik, Ice Thai Tea, Ice Milk Tea | 10,000–20,000 |
| Chocolate / matcha / milk-based | Matcha Hot, Coklat Hot, Ice Coklat Milk, Strawberry Milo Milk, Milo Dino, Ice Red Velvet, Taro Ice | 10,000–20,000 |
| Juices & refreshers | Aneka Jus, Es Tebu, Lemon Yakult, Mojito | 18,000–20,000 |
| Water | Aqua Besar, Aqua Tanggung | 7,000–10,000 |
| Rice | Nasi Goreng, Nasi Ayam Bakar/Goreng* | 25,000 |
| Noodles | Mie Goreng, Kwetiaw Goreng, Bihun Goreng, Indomie | 15,000–25,000 |
| Western | Spaghetti Bolognese, Spaghetti Creamy, Pizza, Burger | 20,000–50,000 |
| Middle-Eastern | Sambosa, Kebab, Roti Pataer (likely Fatayer) | 20,000–25,000 |
| Signature mains | Iga Bakar + Nasi, Sop Iga + Nasi | 75,000 |
| Snacks | Kentang Goreng, Nugget, Chicken Wings, Bakso Bakar | 20,000 |
| Sweet bites | Roti Bakar, Pisang Goreng, Pisang Bakar | 20,000 |
| Unclear | Koleja (7,000), Gemat (20,000) | — |

**Insights**
- Very accessible price band (most items Rp 10–25k) → position as a **casual, friendly cafe**, not fine dining.
- Unique angle: **Indonesian comfort food + Middle-Eastern bites** (Sambosa, Kebab, Fatayer?) — relevant to Gulf visitors and differentiating in Puncak. Use only after MD-54 confirmation of names.
- Hero dishes for photography: Iga Bakar, Sop Iga (highest price, "signature"), Nasi Goreng, Spaghetti, Pizza, Sambosa, Teh Tarik, Ice Thai Tea.
- Naming inconsistent (Ice vs Es; "Taro Ice") — keep original names as provided (DEC-010), provide `altName` translations.

## Marketing implications
1. Cafe page goals: show menu & prices fast, open hours, WhatsApp, location.
2. Table QR → `/menu` (URL-STRUCTURE).
3. Creating a GBP for NJD Cafe (P1) is the single biggest local-SEO win for it.

## Gaps
MD-50…MD-63 (location, public access, hours, halal, missing prices, unknown names, photos, payments).
