# SEO التقني

DEC-013/014/016/027؛[URL-STRUCTURE](../04-INFORMATION-ARCHITECTURE/URL-STRUCTURE.md). قواعدمخططةلـ SSG لا implementation هنا. [Cloudflare Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/) و[Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)راجعتهما 2026-10-09؛host/fileformat يؤثران على المسار النهائي.

| البند | المتطلب | تحققلاحق |
|---|---|---|
|status |P0published200؛unknown404 فعلي |HTTPresponse لا SPA200 |
|canonical |selfabsoluteHTTPS،noquery/noslash |متطابقمع finalURL |
|redirect |http/www/id/vanity/slash→المعتمد 301 |one-hop ممكن،no loops |
|sitemap |publishedindexablepages فقط+alternates |≤33P0content عند 3locales |
|robots |production يسمحالمحتوى،preview لا index |noaccidentalDisallowall |
|preview |accessrestriction عندوصول host+noindex |robotsdisallow وحده لا يكفي لمنع الفهرسة |
|404 |errorlocale وفق prefix،noindex |unknown/ar/enstatus404 |
|images |alt،dimensions،responsive،rights |CWV+imagecrawler |
|headings |H1 واحد،hierarchy |noheading بناء decorative |
|links |nativecrawlable،locale-aware |noJSonlynav |
|schema |visiblepublishablefacts فقط |STRUCTURED-DATAchecks |

## Cloudflare gate

Astro بناء file-style مقترحلملاءمة noslash؛لا directoryindex افتراضياًمع redirect مضاديولد loop. يثبت المبرمج لاحقاًoutput/serving لـ/ar و/en ومسارات nested،ثم redirects للفروعالمعلومة. CloudflarePagefunctions غير مطلوبة ولا تضاف لعلاج host بطريقةتغير staticcontract. أقرب 404 محليةممكنةفي host لكنالتوزيععلى prefix يحتاج proof،لا وعدبدوننشر preview تقنيلاحق.

الـ hostcanonicalrules لا يغيرهاالمبرمج لمجرد سهولة التوليد؛إن تعذر التوافق يسجل ال blockerOPEN-DECISIONS. لا genericSPA fallback،لا 200rewrite لغرفمفقودة،لا privatepreview برابطيفهرس.

## metadata وصيانة

descriptionunique،OGimage1200×630،favicons،manifest وفق IA؛لاملفات generated هنا. privacyindexable منخفضةالأولوية،no404sitemap،nofollow ليسعلاج hiddenpages. تتبعمراجعة brokenexternalURLsmonthly بعد الإطلاق،GSCmanualinspection للممثلينوال alternateclusters،معالمسؤول MD-75.

قبول:لا PLACEHOLDERbuildpublished،لا brokenlinks/redirectloops،headersproduction تختلفعن preview فعلاً،domaincanonical لا PLACEHOLDER،والصفحة القابلة لل index ترجمتها fullapproved.
