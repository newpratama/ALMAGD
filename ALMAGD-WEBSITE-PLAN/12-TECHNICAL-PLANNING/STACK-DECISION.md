# قرار الأدوات والنطاق المسموح

هذه **قائمة تخطيط** وليست إذناً بالتثبيت في المحادثة الحالية. DEC-014/015/016/026؛العقد §9 يحظر dependencies خارج القائمة دون موافقة في مرحلة التنفيذ المستقبلية.

| أداة/قدرة | نطاق السماح في التنفيذ اللاحق | version الآن |
|---|---|---|
| Astro | framework static،content collections،routing،images | NEEDS_TECHNICAL_VERIFICATION عند بدء التنفيذ |
| Astro image pipeline | AVIF/WebP وصور محلية | يعتمد الإصدار المختار؛لا direct package إضافية تلقائياً |
| Validation المتاحة في Astro | نموذج المحتوى وحالاته | وفق docs الإصدار؛CONTENT-MODEL محفوظ |
| CSS native + fonts self-hosted | tokens،logical direction،responsive | لا Tailwind/UI framework تلقائياً |
| Vanilla browser interactions | nav/chooser/lightbox/filter/consent المحدودة | لا front-end framework dependency |
| GA4 Google tag | بعد consent فقط إن DEC-018 default قائم | account ID PLACEHOLDER |
| Cloudflare Pages | hosting static output | account/domain PLACEHOLDER |
| Lighthouse + axe + browser QA tooling | verification dev-only لاحقاً | versions تسجل وقت التشغيل |
| lockfile/runtime/package manager | تثبيت reproducible لاحقاً | اختيار متوافق مع Astro الحالي بعد التحقق |

Framework يعني اسم Astro فقط؛لا اعتماد نسخة قديمة من الذاكرة،ولا ادعاء أن أحدث إصدار مثبت. sitemap/robots يمكن توليدهما بأدوات المشروع دون dependency جديدة؛أي integration مضافة تقترح منفصلة مع سبب وحجم وأثر قبل الاعتماد. أدوات QA dev-only لا تدخل payload الإنتاج.

## مستبعد

DB/SQL/Supabase/headless CMS/WordPress،React/Next/Vue،payment/forms/chat backend،WhatsApp API أو webhooks،map/social SDK على load،external fonts،tracking pixels غير معتمدة،AI media للمنشآت. لا تقنيات مستبعدة حتى لو ظهرت في قالب جاهز.

## تحقق بدء التنفيذ

يتحقق المبرمج من official Astro release/runtime support و Cloudflare behavior ويثبت exact versions و lockfile ضمن تقرير T-01. إن dependency لازمة غير مدرجة،يسجل purpose/alternatives/security/license/size في OPEN-DECISIONS؛الموافقة شرط تعديل نطاق التنفيذ لا مسار موافقة جديد للتوثيق الحالي.

قبول: قائمة صغيرة مفهومة،لا ambiguous «أي حزمة مطلوبة»،لا external services حسابها أنشئ،ولا code/package files في هذه الحزمة.
