# ترتيب البناء والقراءة

الترتيب للمبرمج لاحقاً؛ لا إنشاء أي من ملفات الموقع الآن. أسماء target folders/components من IMPLEMENTATION-CONTEXT، والتفاصيل من CONTENT-MODEL. مهام T المرجع لتنفيذ جزء صغير.

| الترتيب | النطاق المستهدف | مهام | ما يقرأ |
|---|---|---|---|
| 1 | report/data gates قبل أي config | T-01/02 | العقد والقرارات و MISSING-DATA |
| 2 | static config و content contracts | T-03…07 | التقنية والنموذج والقائمة/الميديا |
| 3 | localized UI و route map | T-08 | اللغات و URL-STRUCTURE |
| 4 | styles/fonts/primitives/images | T-09…12 | DESIGN-SYSTEM و IMAGE-SPECS |
| 5 | layouts/nav/switcher/WA/consent/footer | T-13…20 | NAVIGATION و UX و CTA |
| 6 | sections و Home/About/Properties | T-21…25 | 07-PAGE-SPECS +copy |
| 7 | facilities/rooms/FAQ/ratings/BookingPanel | T-26…31 | property specs و factRefs |
| 8 | property page composition | T-32/33 | NEW-PRATAMA و VILLA-NJD |
| 9 | menu components و Cafe/Menu | T-34…37 | MENU-CONTENT و restaurant/menu specs |
| 10 | Gallery والـ Lightbox | T-38…40 | GALLERY و rights/alt |
| 11 | maps/social/contacts/Location | T-41…45 | LOCATION/CONTACT و pins |
| 12 | Privacy/error/metadata/schema/sitemap/headers | T-46…51 | القانونية و SEO و host |
| 13 | consent-aware GA4/events | T-52/53 | EVENT-TRACKING |
| 14 | integration QA/retests | T-54…59 | 13-QA و AC |
| 15 | review/release/maintenance | T-60…62 | gates و DEPLOYMENT-PLAN |

Content source data قد تدخل تدريجياً ك draft،لكن لا published facts ناقصة. المكونات المشتركة قبل تركيب الصفحة لمنع نسخ متفرعة. event wiring بعد ثبات interactions و consent،لا GA قبل بناء البوابة.

مجلد التخطيط read-only للمبرمج إلا طلب تحديث وثيقة محددة؛ لا يحذف placeholders من الوثائق ليخفي نقصها،بل يستبدل بيانات التنفيذ بعد source approval. Gallery/room refs تأتي من registry وليست filename تخميني.

قبول: الترتيب يحترم التبعيات،no production deployment قبل review،ولا room pages أو DB أو CMS أو stack إضافية تظهر في build order.
