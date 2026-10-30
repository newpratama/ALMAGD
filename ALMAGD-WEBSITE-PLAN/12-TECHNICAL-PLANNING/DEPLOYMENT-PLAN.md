# خطة النشر — لاحقاً فقط

Astro SSG + Cloudflare Pages DEC-014/016،domain DEC-017/MD-07. لا deploy أو DNS أو حسابات أو تثبيت في المهمة الحالية. الإجراءات أدناه خطة للنموذج التنفيذي بعد إغلاق gates واعتماد النتيجة.

## البيئات

| بيئة | الغرض | ضوابط |
|---|---|---|
| local/dev | بناء layout مع markers |PLACEHOLDER مرئي،لا بيانات حقيقية حساسة |
| review preview | مراجعة الصفحة/اللغات |non-indexable،access مناسب،no production analytics افتراضي |
| production | محتوى معتمد فقط |domain فعلي،noPLACEHOLDER،موافقةإطلاق و QA |

## ترتيب النشر

1. تثبيت source revision و versions/lockfile وقت التنفيذ؛تسجيل build artifact.
2. مراجعة launch blockers MD وقائمة الفحوص؛translations/media/privacy والروابط.
3. Static output يناسب canonical no-slash؛plan file-style output وتحقق host routes قبل تغيير أي URL contract.
4. إعداد preview لاحق،فحص /en و/ar/nested و vanity redirects،real404،headers/cache/consent.
5. تجهيز domain HTTPS والـ hostcanonical؛قياس actual finalURL،لا loop /page→/page/→/page.
6. نتيجة review واضحة للمالك مع evidence؛approval للإطلاق إذا لم يسبق الإذن.
7. نشر production النسخة المحددة؛smoke contact/menu/lang/maps/404/robots/canonical.
8. Search Console verification/sitemap بعد إذن الحساب،تفعيل analytics المحدد بعد consent،monitoring ومسؤول MD-75.

## تعقيدات موثقة

[Cloudflare Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/) يصف extensionless URLs و closest404؛لا SPA fallback. كل locale يحتاج 404 artifact مناسب واختبار الاستضافة،ولا infer local language من browser. [Cloudflare Redirects](https://developers.cloudflare.com/pages/configuration/redirects/) يحدد أولوية القواعد؛static routes قبل wildcards،ولا يضاف serverruntime للتجاوز. الـ hostwww/pages.dev treatment يثبت مع canonical domain لاحقاً.

## rollback

آخر deployment معروف و source revision مسجل،عودة artifact سابق عبر capability الحساب،ثم smoke الوظائف والـ headers/robots. إذا سبب rollback خطأ content رقم/سعر،الرجوع لا يكفي إن النسخة السابقة غير مؤكدة؛يُحجب المحتوى المتأثر حتى تصحيح الدليل. لا rollbackDNS عشوائي أو حذفحساب.

قبول:لا نشرقبل approval/gates،production noindex غير موجود،previewindexing محجوب،404status صحيح،links معتمدة،domain ليس PLACEHOLDER،والـ actualtechnicalchecks ليست منجزة في هذه المرحلة.
