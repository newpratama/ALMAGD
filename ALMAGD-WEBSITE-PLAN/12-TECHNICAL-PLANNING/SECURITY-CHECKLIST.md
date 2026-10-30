# الأمن — قائمة مواصفات التحقق

نطاق static informational site من DEC-001/015/019؛لا auth/backend/payments. متطلبات تنفيذ لاحق دون إعداد secrets أو خدمات هنا.

- [ ] HTTPS و canonical domain فعليان؛TLS/DNS بملكية الإدارة وحسابات بصلاحيات مناسبة.
- [ ] محتوى وروابط ثابتة من source معتمد؛لا user-controlled redirect destination.
- [ ] outbound OTA/Maps/social الجديدة مع عزل opener وفق DEC-024،وبروتوكول موثوق.
- [ ] CSP مخطط وفق الموارد المستخدمة،لا wildcards عامة؛اختبار consent tags و facade بعد التحميل الاختياري.
- [ ] منع framing غير المرخص،nosniff،Referrer-Policy تقلل تسرب query،Permissions-Policy تحد الموارد غير المستخدمة.
- [ ] secrets/tokens داخل إعدادات build المحمية فقط إن احتاجت،لا content/public/repo؛GA4 measurement ID ليس سرّاً.
- [ ] production لا ينشر originals مع PII/EXIF أو وثائق حقوق أو consent forms.
- [ ] Markdown content لا يقبل untrusted executable markup؛الـ HTML الخام ليس وسيلة إضافة features.
- [ ] dependencies محدودة ومقفلة وتراجع alerts الفعلية وقت التنفيذ،لا packages غير معتمدة.
- [ ] preview لا يكشف محتوى خاص؛noindex لا يحمي سريّة البيانات،access controls عند الحاجة.
- [ ] accounts لمالك الموقع مع MFA وصلاحيات نشر محدودة؛ownership/rollback موثق.

## headers

[Cloudflare Headers](https://developers.cloudflare.com/pages/configuration/headers/) يطبق قواعد على static responses؛redirect precedence يحتاج فحص HTTP فعلي. لا كتابة محتويات _headers هنا. headers المتفق عليها تُثبت في preview ثم production؛لا تمكين HSTS شامل subdomains قبل مراجعة نطاقات الإدارة.

## رابط البيانات وحجبها

unknown facts لا تخفي نفسها بالمتصفح فقط؛لا تُسلسل في الإنتاج metadata/schema/page content. WhatsApp URL يضم template عامة دون PII،ولا يصل query إلى GA4 أو referrer كبيانات ضيف. أي رابط خارجي يراجع typo/phishing/domain قبل owner confirmation.

قبول: لا secret leakage،لا unsafe links،لا third-party قبل موافقة،headers مثبتة ولا broken flows،لا اختبار اختراق أو عمليات خارجية أُجريت الآن. تسجل النتيجة evidence بعد التنفيذ؛كل بند NOT_RUN حالياً.
