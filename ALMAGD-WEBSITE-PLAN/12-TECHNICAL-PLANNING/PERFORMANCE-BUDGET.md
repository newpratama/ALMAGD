# ميزانية الأداء

DEC-027: p75 mobile LCP≤2.5s،INP≤200ms،CLS≤0.1؛Lighthouse mobile≥90 بكل الفئات. [Web Vitals](https://web.dev/articles/vitals) يميز بيانات الزيارات الفعلية من التشخيص المعملي؛لا claim p75 قبل توفر field data. كل القياسات الآن NOT_RUN.

## الميزانيات المقترحة للبناء

| المورد | حد مستهدف compressed transfer | نطاق |
|---|---|---|
| HTML |≤50KiB | page entry |
| CSS |≤35KiB | critical/site styles total initial |
| first-party JS |≤50KiB initial،≤80KiB page total | enhancements فقط |
| fonts initial |≤160KiB لكل locale،preload≤2 | subset وأوزان فعلية فقط |
| hero image mobile |≤150KiB | chosen source واحد |
| initial viewport images |≤300KiB | لا lightbox full images |
| total initial first-party |≤650KiB | no video/embeds |
| page images lazy loaded |≤1.5MiB لصفحة طويلة نموذجيّة | grid/lightbox عند الطلب منفصل |
| third-party before consent |0 analytics/Maps/social requests | الروابط outbound لا تحميل |
| P1 desktop video |≤2.5MB،≤12s | اختياري gate DEC-022 |

هذه أهداف project budget وليست أرقاماً مقاسة؛ميزانية analytics بعد consent مستقلة تسجل حجمها الفعلي ولا تمنح waiver للـ CWV. إذا Arabic font subset أكبر من target يراجع أوزان/preload وجودة القراءة قبل exception موثق.

## استراتيجية

LCP صورة poster أو hero عالية الأولوية،لا lazy؛أبعاد الصور محجوزة؛صور below-fold lazy؛large lightbox عند فتحه؛لا Map/Instagram/TikTok/YouTube initial iframe. self-hosted fonts والمحتوى statically readable؛لا bundle framework كامل للمعرض.

## إثبات لاحق

Lighthouse mobile cold-cache ثلاث تشغيلات لكل template ممثل ولكل locale مؤثر،profile/device/network/version/revision ثابتة وتوثيق median والقيم المفردة. menu/gallery/dialog long-page interaction لقياس latency؛Lighthouse TBT لا يثبت INP field. بعد الإطلاق field p75/CrUX عند توفر عينة؛low data = NOT_AVAILABLE،لا 0.

قبول: CWV target مقفل،payload ضمن الميزانية أو استثناء مراجَع قبل launch،لا tricks بإخفاء محتوى الاختبار،رفض consent لا يحرم الأداء أو الروابط،والنتائج الفعلية تسجل بعد التنفيذ فقط.
