# المهام الذرية للنموذج البرمجي — لاحقاً

جميع المهام NOT_STARTED. لا تنفذها في مرحلة Markdown الحالية. كل مهمة تستخدم IMPLEMENTATION-CONTEXT و spec المذكور ومراجع حقائقها. أسماء المكونات مقفلة؛ T-xx معرفات ثابتة. الملكية هنا نطاق التنفيذ المقترح، ولا توجد ملفات موقع منشأة الآن.

| ID | Phase / أولوية | المهمة والملفات/المكونات المملوكة | تبعيات | spec | التحقق اللاحق |
|---|---|---|---|---|---|
| T-01 | 0/P0 | تقرير الإصدارات وتوافق host | — | STACK-DECISION؛TECHNICAL-SEO | docs حديثة وخطة proof |
| T-02 | 0/P0 | مصفوفة صفحات/لغات وبوابات البيانات | — | MISSING-DATA؛TRANSLATION-PLAN | عدم نشر زوج غير معتمد |
| T-03 | 1/P0 | إعداد static وهيكل folders | T-01 | RECOMMENDED-ARCHITECTURE | بناء static أولي |
| T-04 | 1/P0 | تحقق site/venue | T-03 | CONTENT-MODEL | رفض حقائق required غير صالحة |
| T-05 | 1/P0 | تحقق room/faq/rating | T-04 | CONTENT-STORAGE | kind والعلاقات وحداثة badge |
| T-06 | 1/P0 | تحقق category/menuItem47 | T-04 | MENU-CONTENT | 47 IDs،44 أسعار،3 null و HOLD |
| T-07 | 1/P0 | تحقق gallery/attraction | T-04 | ASSET-INVENTORY | حقوق وعلاقات و geo |
| T-08 | 1/P0 | UI strings والـ locale map | T-02/04 | LOCALIZATION-ARCHITECTURE | key parity وأزواج معتمدة |
| T-09 | 2/P0 | tokens و global styles | T-03 | DESIGN-SYSTEM | قيم وتباين |
| T-10 | 2/P0 | تحميل الخطوط و type scale | T-09 | TYPOGRAPHY | خطوط محلية وميزانية و AR |
| T-11 | 2/P0 | Button/Link/Badge/Icon/Tag/Divider | T-09/10 | COMPONENT-INVENTORY | focus وأهداف 44 وحالات |
| T-12 | 2/P0 | Container/Section/ResponsiveImage | T-07/09 | SPACING-GRID؛IMAGE-SPECS | نسب وأبعاد و alt |
| T-13 | 3/P0 | BaseLayout/PageLayout/SkipLink | T-08/11/12 | ACCESSIBILITY-UX | landmarks و lang/dir و H1 |
| T-14 | 3/P0 | SiteHeader/Breadcrumbs | T-13 | NAVIGATION | paths و current و keyboard |
| T-15 | 3/P0 | MobileNav | T-14 | MOBILE-UX | focus و Escape وعودة scroll |
| T-16 | 3/P0 | LanguageSwitcher | T-08/14 | MULTILINGUAL-SEO | same-page و home معلن |
| T-17 | 3/P0 | بناء روابط WhatsApp وتوجيهها | T-08 | CTA-COPY | 3 أرقام و 9 قوالب وسياق |
| T-18 | 3/P0 | WhatsAppChooser/FloatingWhatsApp | T-15/17 | CONTACT-FLOW | group/direct و focus والبديل |
| T-19 | 3/P0 | ConsentBanner/preferences | T-13 | ANALYTICS-STRATEGY | denied بلا شبكة GA |
| T-20 | 3/P0 | SiteFooter | T-16/18/19 | FOOTER | روابط منشورة و legal gating |
| T-21 | 4/P0 | HeroHome/HeroPage/IntroBlock/RichText | T-12/13 | HOME؛ALMAGD-CONTENT | copy وصور و H1 و RTL |
| T-22 | 4/P0 | CollectionGrid/VenueFeature | T-04/12 | HOME؛PROPERTIES | sortOrder وحالة منشأة |
| T-23 | 4/P0 | تركيب Home | T-18/21/22 | HOME | sections و CTA وحجب |
| T-24 | 4/P0 | تركيب About | T-21/22 | ABOUT | لا قصة مختلقة |
| T-25 | 4/P0 | Properties والمقارنة | T-22 | PROPERTIES | إقامتان وفروق موثقة |
| T-26 | 5/P0 | FacilityGrid/HighlightList/PolicyList | T-04/11 | VILLA-NJD؛NEW-PRATAMA | حقائق وتسميات |
| T-27 | 5/P0 | RoomCardList | T-05/12/17 | NEW-PRATAMA | أنواع معتمدة بلا أسعار |
| T-28 | 5/P0 | RoomDetailDialog | T-27 | ACCESSIBILITY-UX | تطابق النوع وفوكس |
| T-29 | 5/P0 | FAQAccordion | T-05/11 | FAQ-CONTENT | answerStatus و keyboard |
| T-30 | 5/P0 | RatingBadges | T-05/11 | VILLA-NJD-CONTENT | approved/asOf بلا review schema |
| T-31 | 5/P0 | BookingPanel والشريط الثابت | T-17/26 | MOBILE-UX؛OTA-REDIRECT-FLOW | <1024 و safe-area وحجب floating |
| T-32 | 5/P0 | تركيب New Pratama | T-26/28/29/31 | NEW-PRATAMA | أقسام وبوابات MD |
| T-33 | 5/P0 | تركيب Villa NJD | T-26/28/29/30/31 | VILLA-NJD | لا 784 ولا 4 غرف وبوابات MD |
| T-34 | 6/P0 | MenuNav/MenuSection/MenuItemRow | T-06/12 | NJD-CAFE-MENU | الأصل والأسعار وال anchors |
| T-35 | 6/P0 | FeaturedMenuGrid | T-34 | MENU-CONTENT | 6 مختارات إدارة وحقوق |
| T-36 | 6/P0 | تركيب Menu ووجهة vanity | T-34/17 | NJD-CAFE-MENU | فئات و canonical بلا cart |
| T-37 | 6/P0 | تركيب Cafe | T-31/35/36 | NJD-CAFE | ساعات وموقع واستقبال جمهور |
| T-38 | 7/P0 | GalleryGrid/GalleryFilter | T-07/12 | GALLERY | فلاتر منشآت وحقوق و alt |
| T-39 | 7/P0 | Lightbox | T-38 | ACCESSIBILITY-UX | buttons و focus و keyboard |
| T-40 | 7/P0 | صفحة Gallery ومعارض المنشآت | T-38/39 | GALLERY | ≥30 أصل وتطابق جهة |
| T-41 | 8/P0 | MapCard/MapEmbedFacade | T-04/07/19 | LOCATION | pin وترخيص ولا iframe initial |
| T-42 | 8/P0 | AttractionList/SocialStrip | T-07/11 | LOCATION؛MEDIA-STRATEGY | مسافات وروابط معتمدة |
| T-43 | 8/P0 | ContactCard | T-17/41 | CONTACT-CONTENT | رقم و WA و Maps صحيحون |
| T-44 | 8/P0 | تركيب Location | T-41/42 | LOCATION | 3 pins بلا أزمنة مختلقة |
| T-45 | 8/P0 | تركيب Contact | T-43/42 | CONTACT | لا form ولارقم شركة مختلق |
| T-46 | 9/P0 | تركيب Privacy | T-19/21 | PRIVACY-REQUIREMENTS | مراجعة وتطابق إعدادات |
| T-47 | 9/P0 | 404 المحلية واختبار host | T-13/20 | FOOTER §404 | status و locale و noindex |
| T-48 | 9/P0 | metadata/canonical/OG | T-02/21 | META-STRATEGY | تفرد ومراجعة ونطاق حقيقي |
| T-49 | 9/P0 | schema mapping | T-04/05/06/48 | STRUCTURED-DATA | حقائق مرئية و validators |
| T-50 | 9/P0 | sitemap/robots/hreflang | T-02/48 | MULTILINGUAL-SEO | indexable approved pairs |
| T-51 | 9/P0 | redirects/headers على host | T-01/47 | DEPLOYMENT-PLAN | لا loops و real404 و CSP |
| T-52 | 10/P0 | GA4 loader/pageviews | T-19/48 | ANALYTICS-STRATEGY | denied بلا requests و URL نظيف |
| T-53 | 10/P0 | توصيل أحداث المكونات | T-52 ومهام التفاعل | EVENT-TRACKING | once/params بلا PII أو aliases |
| T-54 | 11/P0 | QA المحتوى والوظائف والخصوصية | T-32/33/37/40/44/45/46/53 | 13-QA | أدلة وتصنيف عيوب |
| T-55 | 11/P0 | QA الاستجابة والمتصفحات و AR | T-54 | 13-QA | matrix وأجهزة حقيقية |
| T-56 | 11/P0 | QA الوصول البشري والآلي | T-55 | ACCESSIBILITY-CHECKLIST | keyboard وقارئ شاشة |
| T-57 | 11/P0 | QA SEO و host | T-49/50/51/54 | SEO-CHECKLIST | status/canonical/schema/lang |
| T-58 | 11/P0 | QA الأداء والـ payload | T-55/56 | PERFORMANCE-CHECKLIST | 3 runs بلا field claim |
| T-59 | 11/P0 | إصلاحات محددة وإعادة الفحص | T-54…58 | ACCEPTANCE-CRITERIA | 0 Critical/High |
| T-60 | 12/P0 | readiness و preview مراجعة | T-02/59 | PRE-LAUNCH-CHECKLIST | بوابات MD و revision معتمد |
| T-61 | 12/P0 | نشر مأذون و smoke | T-60 واعتماد إطلاق | DEPLOYMENT-PLAN | core flows و robots و rollback |
| T-62 | 12/P1 | الصيانة و GSC و field monitoring | T-61 | KPI-DEFINITION | صلاحيات صحيحة بلا baseline مختلق |

## تعليمات المهمة

Prompt يحدد T-ID والملفات المملوكة والنسخة المصدرية وقبولها. مهمة تركيب صفحة لا تعيد كتابة المكونات المشتركة. نقص بيانات يسمح dev بمؤشرات انتظار؛ لا يسمح launch. عند توسيع ownership أو ظهور dependency جديدة يوثق السبب قبل العمل. التقدير الزمني NEEDS_ESTIMATION بعد تحديد فريق وأصول.

Future FAQ/Offers/video/Git editor مهام منفصلة بعد قرار فتح P1/P2. لا إضافتها إلى P0 تلقائياً.
