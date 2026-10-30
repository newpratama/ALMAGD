# جرد المكونات — الأسماء canonical

مرجع [IMPLEMENTATION-CONTEXT §5](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md). لا أسماء components بديلة أو مكتبة جديدة تلقائياً؛ القائمة عقد تسليم. الجدول يجمع مكونات ذات مسؤوليات متقاربة لكنه لا يدمج أسماءها.

| المجموعة / أسماء المكونات | البيانات | الحالات / القواعد | مواضع |
|---|---|---|---|
| SiteHeader،MobileNav |nav/locale/site |sticky72D/60M،focus،menu open/close |global |
| LanguageSwitcher |published locale pairs |same page،home labeled fallback |header/footer |
| SiteFooter،Breadcrumbs،SkipLink |links/current path |no hidden-page links؛skip main |global |
| FloatingWhatsApp،WhatsAppChooser |venue/verified number/template |group chooser؛venue direct؛bar suppression |global |
| ConsentBanner |choice/version |accept/reject/preferences؛default denied |global |
| HeroHome،HeroPage |title/body/image/CTA |image-first،H1،no slider |Home/inner |
| IntroBlock،RichText |approved localized prose |≤60words visible block،max68ch |sections |
| CollectionGrid،VenueFeature |published venues/images |sortOrder،2/3cards،rights |Home/index/related |
| HighlightList،FacilityGrid |publishable facts+factRefs |no unconfirmed icon |venues |
| RoomCardList،RoomDetailDialog |room fields/images |hide fields、keyboard/focus return |property#rooms |
| PolicyList،FAQAccordion |policy/faq status |hide invalid answer،toggle accessible |property/cafe |
| RatingBadges |platform score/scale/count/asOf |approved،≤6months،no copied text |NJD/Home |
| GalleryGrid،Lightbox،GalleryFilter |galleryImage/rights/alt |venue-only filters P0؛non-JS fallback |Gallery/property |
| MenuNav،MenuSection،MenuItemRow |category/menuItem |null-price helper،name original |Menu |
| FeaturedMenuGrid |owner-chosen ≤6 items |photo/price/description approved |Cafe |
| MapCard،MapEmbedFacade،AttractionList |pin/address/licensed map |no iframe load؛distances gated |Location/property |
| ContactCard،BookingPanel |contacts/OTA/locale |WA primary؛CTA bar<1024 |Contact/venues |
| CTASection،SocialStrip |approved links |no social embeds؛external notice |sections/footer |
| Button،Link،Badge،Icon |label/variant/destination |primary/secondary/ghost/whatsapp/ota،all focus states |primitives |
| ResponsiveImage |image ref/alt/dimensions/focal |hero high priority؛lazy rest；no fake placeholder prod |all photos |
| Tag،Divider،Container،Section |tokens/semantics |decorative distinction،headings/anchors |layout primitives |

## اشتراطات موحدة

كل مكون يقبل locale و direction من page context ولا يستنتجهما من الاسم. fact status مفحوص قبل العرض؛ inherited audit يسمح بإظهار محتوى صحيح ولا يعالج conflict. الصورة فقط rightsConfirmed. Interactive state واضح؛ no custom role إن native behavior يكفي. أحداثه canonical parameters بلا PII.

المكون يحافظ على ارتفاع الصور وأهداف 44. hidden content لا يترك زر navigation أو lightbox ميتاً. Dialog/chooser/mobile nav تعود إلى trigger عند الإغلاق، ولا تفتح dialogs متراكبة. Progressive enhancement للمحتوى والروابط؛ chooser fallback /contact.

## قبول وتنفيذ لاحق

لكل component: responsibility،data fields،allowed states،pages،keyboard،RTL،events،empty handling،verification. لا code examples في هذه المرحلة. component غير مدرج مطلوب لتوسعة P2 يرفع OPEN-DECISIONS؛ لا بإضافة dependencies أو room URLs من تلقاءالنموذج.
