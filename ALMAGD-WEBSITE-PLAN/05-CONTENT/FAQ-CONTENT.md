# محتوى الأسئلة الشائعة

المصدر [DATA-AUDIT](../02-RESEARCH/DATA-AUDIT.md)، نموذج faq من [CONTENT-MODEL](./CONTENT-MODEL.md). قسم داخل كل منشأة P0؛ صفحة /faq مستقلة P1 وفق DEC-008. كل سؤال وجواب DRAFT_COPY يحتاج مراجعة لغة؛ حالة حقيقة الجواب مستقلة.

## إجابات مدعومة

| faq id / factRefs | ID — السؤال ثم الجواب | EN — question then answer | AR — السؤال ثم الجواب | answerStatus |
|---|---|---|---|---|
| general-contact / F-X-02 | Bagaimana cara menghubungi tempat yang saya pilih? — Pilih tempat di halaman Kontak untuk melihat kontaknya. | How do I contact my chosen venue? — Choose the venue on the Contact page to see its contact details. | كيف نتواصل مع الوجهة المختارة؟ — اختاروا الوجهة في صفحة التواصل للاطّلاع على معلوماتها. | VERIFIED لتميّز الأرقام؛ مراجعة صلاحية الروابط واجبة |
| njd-check-in / F-NJD-16 | Kapan waktu check-in dan check-out Villa NJD? — Check-in pukul 14.00–23.59; check-out paling lambat pukul 12.00. | What are Villa NJD’s check-in and check-out times? — Check-in is 2:00 pm–11:59 pm; check-out is by 12:00 pm. | ما مواعيد الوصول والمغادرة في Villa NJD؟ — الوصول 14:00–23:59، والمغادرة حتى 12:00. | VERIFIED_MULTIPLE_SOURCES |
| njd-pets / F-NJD-20 | Apakah hewan peliharaan diperbolehkan di Villa NJD? — Hewan peliharaan tidak diperbolehkan. | Are pets allowed at Villa NJD? — Pets are not allowed. | هل يسمح بالحيوانات الأليفة في Villa NJD؟ — لا يسمح باصطحاب الحيوانات الأليفة. | VERIFIED_MULTIPLE_SOURCES |
| njd-wifi / F-NJD-24 | Apakah WiFi tersedia di Villa NJD? — WiFi gratis tersedia. | Is WiFi available at Villa NJD? — Free WiFi is available. | هل يتوفر WiFi في Villa NJD؟ — يتوفر WiFi مجاني. | VERIFIED_MULTIPLE_SOURCES |
| njd-pool / F-NJD-23 | Apakah Villa NJD memiliki kolam renang? — Tersedia kolam renang luar ruangan. | Does Villa NJD have a pool? — There is an outdoor pool. | هل يوجد مسبح في Villa NJD؟ — يوجد مسبح خارجي. | VERIFIED_MULTIPLE_SOURCES |
| cafe-menu / F-CAFE-12 | Di mana saya bisa melihat menu NJD Cafe? — Buka halaman Menu NJD Cafe untuk melihat item dan harga yang dipublikasikan. | Where can I see the NJD Cafe menu? — Open the NJD Cafe Menu page to see published items and prices. | أين نطّلع على قائمة NJD Cafe؟ — افتحوا صفحة القائمة للاطّلاع على الأصناف والأسعار المنشورة. | USER_PROVIDED مع فحص حقول القائمة |

## أسئلة انتظار الإدارة — لا تظهر للزائر

| faq id | ID | EN | AR | answer / سبب |
|---|---|---|---|---|
| np-options | Apa pilihan menginap di New Pratama Villa? | What stay options does New Pratama Villa offer? | ما خيارات الإقامة في New Pratama Villa؟ | PLACEHOLDER؛ MD-13/14/15 |
| np-policies | Apa kebijakan menginap New Pratama Villa? | What are New Pratama Villa’s stay policies? | ما سياسات الإقامة في New Pratama Villa؟ | PLACEHOLDER؛ MD-17 |
| np-pool | Apakah kolam renang tersedia? | Is there a pool? | هل يوجد مسبح؟ | PLACEHOLDER؛ MD-16 |
| njd-balcony | Kamar mana yang memiliki balkon? | Which rooms have a balcony? | أي الغرف تحتوي شرفة؟ | PLACEHOLDER؛ MD-31/33 |
| njd-access | Bagaimana akses untuk tamu dengan keterbatasan mobilitas? | What access is available for guests with limited mobility? | ما ترتيبات الوصول للضيوف ذوي الحركة المحدودة؟ | PLACEHOLDER؛ MD-39؛ لا ضمان وصول |
| njd-breakfast | Apakah sarapan termasuk? | Is breakfast included? | هل يشمل الحجز الإفطار؟ | PLACEHOLDER؛ MD-38 |
| cafe-hours | Kapan NJD Cafe buka? | When is NJD Cafe open? | متى يفتح NJD Cafe؟ | PLACEHOLDER؛ MD-52 |
| cafe-public | Apakah NJD Cafe terbuka untuk umum? | Is NJD Cafe open to the public? | هل NJD Cafe مفتوح للجمهور؟ | PLACEHOLDER؛ MD-51 |
| cafe-halal | Apa informasi halal yang tersedia? | What halal information is available? | ما معلومات الحلال المتوفرة؟ | PLACEHOLDER؛ MD-56/DEC-028 |
| cafe-payment | Metode pembayaran apa yang tersedia? | Which payment methods are accepted? | ما طرق الدفع المتاحة؟ | PLACEHOLDER؛ MD-60 |
| cafe-tax | Apakah harga termasuk pajak dan layanan? | Do prices include tax and service charges? | هل تشمل الأسعار الضرائب ورسوم الخدمة؟ | PLACEHOLDER؛ MD-61 |

## العرض والصيانة

FAQAccordion يعرض فقط answerStatus مسموحاً، والسؤال لا يُعرض إذا الجواب مخفي. ترتيب 3–6 أسئلة عملية لكل منشأة، لا حد أدنى يفرض اختراع إجابة. لا إجابة «نعم» عامة للسياسات عبر جميع المنشآت. الروابط داخل الجواب محلية اللغة. لا FAQ schema إلزامي؛ [STRUCTURED-DATA](../10-SEO/STRUCTURED-DATA.md) يضبط ذلك.

المراجعة: كل جواب يملك factRefs، لغة مراجعة، تاريخ تحقق داخلي، ومالك تحديث. الحالات الناقصة تبقى في التخطيط فقط؛ لا «Coming soon». الأسئلة الجماعية حول إتمام الدفع لا تظهر كخدمة لأن الموقع معلوماتي DEC-001.
