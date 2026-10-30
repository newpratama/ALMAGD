# NAVIGATION

Components: `SiteHeader`, `MobileNav`, `LanguageSwitcher`, `SiteFooter`, `Breadcrumbs`, `FloatingWhatsApp`, `WhatsAppChooser`.

## Desktop header (≥ 1024 px)
| Slot (LTR order; mirrored in RTL) | Content |
|---|---|
| Start | ALMAGD logo/wordmark → `/{locale}` |
| Center/inline | About · Stays ▾ · Dining · Gallery · Location · Contact |
| End | LanguageSwitcher (ID / EN / AR) · Primary button "Contact us" (opens `WhatsAppChooser`; on venue pages becomes "WhatsApp {Venue}") |

- **Stays ▾** dropdown (click/Enter to open, Esc to close, not hover-only): New Pratama Villa · Villa NJD · divider · All stays (`/properties`). Each item shows type label ("Villa · Tugu Selatan").
- Height 72 px; sticky; transparent over Home hero with white text, becomes solid mist with shadow-1 after 24 px scroll. Inner pages always solid.
- Active page: 2 px brass underline + `aria-current="page"`.

## Tablet (768–1023)
Logo · LanguageSwitcher (compact "ID ▾") · WhatsApp icon button · burger. Nav in `MobileNav`.

## Mobile header (< 768)
Height 60 px, sticky. Logo (start) · WhatsApp icon button 44×44 · burger 44×44 (end). Language switcher inside MobileNav.

## MobileNav (full-screen sheet)
- Opens from inline-end; focus trapped; Esc/close button; body scroll locked.
- Order: About · Stays (expanded list: New Pratama Villa, Villa NJD, All stays) · Dining (NJD Cafe, Menu) · Gallery · Location · Contact.
- Bottom area: LanguageSwitcher as 3 segmented buttons; WhatsApp button (opens chooser); Instagram icons for the venues with confirmed accounts.
- Item height ≥ 52 px, font 20 px.

## LanguageSwitcher
- Labels in own language: "Bahasa Indonesia", "English", "العربية" (short: ID / EN / AR).
- Switches to **the same page** in the target locale; if that page isn't published in that locale, link goes to target locale home and is marked "(home)".
- Fires `language_change{from,to}`. Sets `hreflang` + `lang` on links.

## Property switcher (venue pages only)
Under hero on property pages: small pill row "Our stays: New Pratama Villa | Villa NJD" (current highlighted). Hidden when only one venue published.

## Sticky mobile booking bar (venue pages, < 1024)
Fixed bottom, 64 px + safe-area: [WhatsApp {Venue}] (primary, 60%) + [Book ▾] (secondary, opens BookingPanel sheet with OTA links). On Cafe page: [WhatsApp] + [Menu]. When the bar is present, `FloatingWhatsApp` is hidden.

## FloatingWhatsApp
Bottom inline-end, 56×56, offset 16 px + safe area; visible on all pages except where sticky bar exists. Group pages → opens `WhatsAppChooser` (3 venue options + labels). Venue pages (desktop) → direct link to that venue. Never overlaps cookie banner (banner pushes it up).

## Breadcrumbs
All pages except Home: e.g. Home › Stays › Villa NJD. Visible on ≥ 768; on mobile show only back-link "‹ Stays". Mirrors in RTL (› becomes ‹). BreadcrumbList schema.

## Footer navigation
See [FOOTER.md](../07-PAGE-SPECS/FOOTER.md). Columns: Stays · Dining · ALMAGD (About, Gallery, Location, Contact) · Contact per venue · Legal (Privacy) · Language.

## Not shown in navigation
Offers (until live), FAQ (P1, footer only when live), Privacy (footer only), 404, OTA links (only inside venue pages).
