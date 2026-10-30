# الخطوط والطباعة

DEC-026؛ [TYPOGRAPHY-DIRECTION](../03-BRAND/TYPOGRAPHY-DIRECTION.md) و contract§6. Fraunces500/600 display Latin؛ Plus Jakarta Sans400/500/600/700 body Latin؛ IBM Plex Sans Arabic400/500/600/700 لكل headings/body Arabic. تحميل self-hosted woff2 فقط في التنفيذ اللاحق؛ لا تنزيل خطوط الآن.

| role | Mobile | Tablet مقترح | Desktop | weight |
|---|---|---|---|---|
| display |40 |52 |64 |600 |
| h1 |32 |40 |48 |600 |
| h2 |26 |30 |36 |600 |
| h3 |20 |22 |24 |600 |
| body |16 |16 |17 |400 |
| button/nav |16 |16 |16 |600 |
| small |14 |14 |14 |400/500 |
| caption |13 |13 |13 |400 |

الانتقال بالحجم لا يقص المحتوى؛ حجم tablet تفصيل داخل النطاق المقفل. line-height body1.6/AR1.8؛ headings Latin1.15–1.25 و AR1.4. max68ch Latin؛ العربية عرض مريح نحو 38–55 حرفاً بحسب الشاشة، دون hard-wrap.

## العربية والنص المختلط

لا tracking للحروف العربية ولا uppercase؛ اتصال الحروف سليم. أسماء المنشآت Latin تُعزل اتجاهياً وتستخدم font Latin المتاح دون تحميل أوزان زائدة. أسعار/هواتف/ساعات Latin لا تعكس ترتيبها. لا manual spaces لتعديل مواضع العلامات. Wordmark AR حسب LOGO-REQUIREMENTS؛ tagline حرفياً مع ellipsis المعتمد.

## التحميل والبدائل

اعتماد subset يحفظ Indonesian diacritics وكل علامات العربية المطلوبة؛ لا تدمير تشكيل الشعار. فقط أوزان مستخدمة؛ preload ≤2 ملفات حرجة لكل locale وفق PERFORMANCE-BUDGET، Arabic يحتاج خطه لا تحميل جميع families تلقائياً. font-display سلوك عرض النص فوراً مع بديل، وتحقق CLS عند swap. fallback system serif/sans بحسب الدور ويُختبر العربي.

## قبول

قراءة سياسة وأسعار و CTA واضحة عند 320 و 200%، بلا ellipsis لمعلومة أساسية؛ contrast كل وزن؛ no remote font request؛ license OFL وملف حقوق محفوظ لاحقاً. لا تزعم قياس font payload قبل امتلاك الملفات. أي اختلاف metric أو font availability يرفع إلى design review ولا يستبدل family بصمت.
