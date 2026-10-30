# المعمارية الموصى بها — Astro SSG + Cloudflare Pages

مرجع DEC-014/015/016 و[العقد](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md). توصية تقنية ملزمة للتسليم الافتراضي؛حالات PROPOSED تبقى تحتاج إقرار MD-08 قبل الإطلاق. لا تنفيذ أو حساب استضافة أُنشئ هنا.

## تدفق المعلومات

DATA-AUDIT والاعتمادات → ملفات المحتوى Git → validation/status gates → قوالب الصفحات والمكونات → static build/images → مراجعة preview → Cloudflare Pages production بعد اعتماد إطلاق. التحليلات enhancement بعد consent؛WhatsApp/OTA/Maps روابط خارجية مستقلة.

| طبقة | المسؤولية | الحدود |
|---|---|---|
| Content collections | site/venue/room/menu/gallery/faq/attraction/rating | نموذج CONTENT-MODEL هو الأعلى لتفاصيل الحقول |
| Page routing | root ID،/en،/ar،English slugs | published locale pairs فقط |
| Presentation | components canonical + tokens | لا copy داخل component أو schema invented |
| Media | responsive approved images/fonts | no third-party embeds initial |
| Interaction | mobile nav،gallery،menu filter عند الحاجة | no React app أو backend ضمن P0 |
| Consent/analytics | gate tags/events،preferences | لا request قبل الموافقة |
| Hosting | CDN/HTTPS/static headers/redirects | لا database أو Pages Functions |

## gates البناء

حالة fact مسموحة،ترجمة صفحة approved،assets حقوق مؤكدة،روابط اتصال/OTA تستوفي owner confirmation،no PLACEHOLDER في rendered published content. optional field غير صالح يُحجب،required blocker يمنع launch. نسخة development تسمح بمؤشرات انتظار،preview لمراجعة placeholders غير قابلة للفهرسة.

## نقطة توافق الاستضافة

file-style static output مرشح لتوافق no trailing slash؛اختبار actual host للمسارات /en و/ar و nested و 404،لا فرض directory output ينتج loops. التفاصيل [DEPLOYMENT-PLAN](./DEPLOYMENT-PLAN.md) و TECHNICAL-SEO. Documented platform behavior مرجع [Cloudflare Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)،لكن نتيجة تكامل المشروع NOT_TESTED الآن.

الصيانة: تعديل source content ثم مراجعة ثم build/new deployment؛لا editing production files مباشرة،لا prices API،ولا إدخال بيانات الضيف أو مخزون الغرف. العودة لإصدار سابق تستعيد build مع source revision ويعاد اختبار contact links.

قبول: التزام static stack،محتوى مركزي،locale map موحد،لا ممنوعات نطاق،وبناء إنتاج لاحق يفشل عند بيانات required غير معتمدة.
