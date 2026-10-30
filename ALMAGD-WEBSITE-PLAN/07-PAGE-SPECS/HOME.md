# HOME — مواصفات الرئيسية

P0؛ /، /en، /ar. template home. مصادر [SITEMAP](../04-INFORMATION-ARCHITECTURE/SITEMAP.md)، [CONTENT-HIERARCHY](../04-INFORMATION-ARCHITECTURE/CONTENT-HIERARCHY.md)، [ALMAGD-CONTENT](../05-CONTENT/ALMAGD-CONTENT.md). العناوين أدناه مفاتيح/نماذج EN؛ استخدام النسخة المحلية المعتمدة. Desktop ≥1024، Tablet 768–1023، Mobile <768؛ container 1200. ترتيب DOM لا يتغير بين اللغات.

| Section ID | الغرض / component | العنوان | CTA | صورة مصدر / ratio | Desktop / Tablet / Mobile | RTL |
|---|---|---|---|---|---|---|
| hero | تعريف فوري / HeroHome | tagline H1 | /properties؛ chooser | ≥3000px؛16:9 D/T،4:5 M | نص 7 أعمدة / 8 / كامل؛ صورة image-first | النص inline-start؛ focal point مستقل لا mirror |
| intro | هوية / IntroBlock | Welcome to ALMAGD | /about | لا صورة | نص max68ch / نفسه / stack | محاذاة start |
| collection | الوجهات / CollectionGrid | The ALMAGD Collection | صفحات الثلاث | 1600×1200؛4:3 | 3 / 2 / 1 بطاقات | ترتيب NJD ثم NP ثم Cafe وفق sortOrder لا انقلاب DOM |
| villa-njd-feature | تقييم إقامة / VenueFeature | Villa NJD | الصفحة | 2000×1500؛4:3 | صورة/نص نصفين / نصفين / stack | تبادل بصري منطقي؛ الصورة لا تعكس |
| new-pratama-feature | إقامة أخرى / VenueFeature | New Pratama Villa | الصفحة | 2000×1500؛4:3 | نص/صورة / نصفين / stack | start للنص |
| cafe-feature | مطعم / VenueFeature | NJD Cafe | /dining/njd-cafe/menu | 2000×1500؛4:3 | نصفين / نصفين / stack | لا on-site wording |
| highlights | دليل الاختيار / HighlightList | Why guests choose us | المنشآت المناسبة | لا صورة | حتى 4 / 2 / 1–2 | أيقونات غير اتجاهية ثابتة |
| ratings | ثقة / RatingBadges | Guest ratings | مصدر المنصة | لا صورة | صف wrap / wrap / stack | الرقم LTR؛ conditional MD-41 |
| explore-puncak | سياق / AttractionList | Explore Puncak | /location#explore-puncak | 1600×1000؛8:5 إن مرخصة | 3 / 2 / 1 | أسماء الأماكن ثابتة |
| gallery | تصوير / GalleryGrid | Gallery | /gallery | 1600×1200؛4:3 | 3 / 2 / 1، 6 صور | captions start |
| find-us | وصول / MapCard | Find us | /location + directions | map 1200×800؛3:2 | 3 / 2 / 1 | pins لا mirror |
| follow | social / SocialStrip | Follow us | حسابات موثقة | لا embeds | صف wrap بكل الأجهزة | logo لا mirror |
| contact | تحويل / CTASection | Talk to us directly | chooser | لا صورة | مركز أو start / wrap / full-width | start والتفاف طبيعي |

## شروط الكتل

highlights ليست أربع مزايا مختلقة: منشأتان للإقامة، قائمة Cafe، معلومات وتواصل منفصلان فقط إذا تدعمها المصادر؛ إن لم تتوافر 4 حقائق اظهر العدد المتاح. ratings و social/maps/attractions حقول مشروطة؛ إخفاؤها يزيل مساحتها والعنوان. hero لا stock ممثل للمكان، ويمكن منظر عام مرخص مصنف area مع وصف صريح لا يوحي أنه property.

## التفاعل والقبول

Header حسب NAVIGATION، FloatingWhatsApp group chooser، hero LCP غير lazy. صفحة بلا صورة معتمدة غير جاهزة للإطلاق MD-19/40/62. جميع روابط cross-sell محلية اللغة. لا Offers في nav؛ FAQ داخل المنشآت. H1 واحد، alt لكل صورة، mobile أول scroll يعرّف المجموعة ويوضح المسار. Analytics page_view بعد consent؛ لا property_view للرئيسية.
