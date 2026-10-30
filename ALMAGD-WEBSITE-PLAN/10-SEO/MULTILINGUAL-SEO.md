# SEO متعدد اللغات

DEC-012/013؛URL-STRUCTURE و TRANSLATION-PLAN. مراجعة 2026-10-09:[Google localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions). مواصفات دونكود.

## النشر و canonical

ID root،EN/en،AR/ar؛English slugs مشتركة بلا slash ختامية إلا root. نشر صفحة/لغة عند مراجعة كل النصوص المطلوبة. لا ID body على EN URL ولا machine fallback.

canonical ذاتية مطلقة HTTPS لكل نسخة. alternate cluster يشمل self والنظراء المنشورين بروابط متبادلة. x-default يشير إلى ID لنفس الصفحة،لا Home لكل الصفحات. id/en/ar لغة،لا استنتاج دولة الضيف. head/sitemap متسقان مع route map واحد.

## switcher

الأسماء Bahasa Indonesia/English/العربية. النظير متاح→نفس الصفحة؛غائب→خيار الرئيسية معلن وفق NAVIGATION. لا IP/browser redirects. الصفحات الغائبة لا تدخل hreflang أو sitemap أو card بلغةغير معتمدة.

## المحتوى

title/description/OG/alt/FAQ مراجعة محلية. اسم venue Latin ثابت،وصورة واحدة قد تحمل alt مترجماً دون 3assets. لا canonical كللغاتإلى ID ولا mixed language filler.

## التحقق

جدول page×locale→canonical→alternates→sitemap،كل destination200 ومحتوىمعتمد. error404 خارج cluster. تخطيط 36 وجه P0 يشمل error؛حتى 33contentindexable عند 3 لغات. Arabic يحتاج مراجعة بشرية لا Lighthouse وحده.

تعديل ID يلغيالتراجم المتأثرة إلى المراجعة؛lastmod منتحريرفعلي لامن مجرد build. أسماء المراجعين وتواريخ التوقيع PLACEHOLDER الآن.
