# LOCATION — الوصول والسياق

P0 /location؛ template location. DEC-020 maps image-first؛ [CONTACT-CONTENT](../05-CONTENT/CONTACT-CONTENT.md). لا أزمنة سفر أو مسافات عامة غير موجودة بالتدقيق.

| Section ID | الغرض / component | العنوان | CTA | صورة / ratio | Desktop / Tablet / Mobile | RTL |
|---|---|---|---|---|---|---|
| hero | سياق / HeroPage | Location & Getting Here H1 | — |optional area2400×1350؛16:9 |text /text /stack | start |
| map | اختيار مكان / MapEmbedFacade + MapCard | Our places on the map | تحميل embed اختيارياً؛Open Maps |static1600×1000؛8:5 |خريطة وعناوين /stack /stack | map لا mirror |
| new-pratama | NP / MapCard | New Pratama Villa | directions؛page |1200×800؛3:2 |نصفان /نصفان /stack |address LTR |
| villa-njd | NJD / MapCard | Villa NJD | directions؛page |1200×800؛3:2 |نصفان /نصفان /stack |address LTR |
| njd-cafe | Cafe / MapCard | NJD Cafe | directions؛page/menu |1200×800؛3:2 |نصفان /نصفان /stack | لا وراثة pin |
| getting-here | الوصول / RichText | Getting here | maps/WA جهة | صورة مدخل 2000×1500؛4:3 |text68ch /نفسه /كامل | أسماء شوارع أصلية |
| explore-puncak | سياق / AttractionList | Explore Puncak | روابط موثقة |area1600×1000؛8:5 |3 /2 /1 | صورة وجهة خارجية صريحة |

## قواعد الحقائق

MD-11/35/50 pins blockers. تعليمات Jakarta/Bogor PLACEHOLDER حتى إدارة تؤكد المسار ومدخل المنشأة؛ لا traffic schedules أو travel time. F-NJD-37 Safari ~5km قابل للنشر من NJD فقط وبصيغة تقريبية، لا نقل المسافة إلى NP/Cafe. بقية distances PUBLIC_SOURCE_ONLY تُحجب؛ لا معلومات ساعات/تذاكر لمزارات من ذاكرة.

## Maps والموافقة

لا iframe على التحميل؛ facade يوضح خدمة Google قبل نقرة تحميل ولا يتبع analytics consent كشرط إجباري للاتجاهات. قرار الخصوصية MD-73 يضبط موافقة embed، بينما رابط خارجي ممكن دائماً عند pin معتمد. static map يجب ترخيصه وتوفير نسبته/attribution؛ لا screenshot مسروق من Maps. إذا map asset مفقود تبقى العناوين والروابط المعتمدة؛ لا pin تخميني.

قبول: كل directions إلى entrance الصحيح، click_google_maps مقابل click_directions متميزان، map_embed_load فقط بعد فعل load، صورة منطقة لا تمثل المنشأة. Mobile ≥44، AR لا mirror للخريطة. navigation anchors لكل كتلة منشورة فقط.
