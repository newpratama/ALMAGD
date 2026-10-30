# فحص الأداء

NOT_RUN؛PERFORMANCE-BUDGET مرجعالحدود. لم يشغّل build أو Lighthouse في مرحلة التخطيط.

- [ ] PERF-01 profile/revision/browser/device/network/cache موثقة.
- [ ] PERF-02 ثلاثة Lighthouse mobile runs مماثلة؛≥90 بكلالفئات.
- [ ] PERF-03 LCP معروف و hero غير lazy و source واحد.
- [ ] PERF-04 CLS≤0.1 معالصور والخطوط و consent؛أبعادمحجوزة.
- [ ] PERF-05 nav/chooser/menu/lightbox بلا long task معيق.
- [ ] PERF-06 payload لكللغة ضمنميزانية HTML/CSS/JS/fonts/images.
- [ ] PERF-07 below-fold lazy و full-res lightbox عندالطلب.
- [ ] PERF-08 fonts محلية وأوزان/subsets مناسبة و preload≤2.
- [ ] PERF-09 لا initial embeds أو GA قبل consent.
- [ ] PERF-10 قراءة وروابط علىشبكةضعيفة ومعفشل enhancement.
- [ ] PERF-11 الهاتف image-only؛P1 video≤2.5MB/12s و motion gates.
- [ ] PERF-12 compressed transfer مقاس cold-cache لا cached-only.
- [ ] PERF-13 field p75 لاحقاً LCP≤2.5s/INP≤200ms/CLS≤0.1.
- [ ] PERF-14 field ناقص=NOT_AVAILABLE؛TBT لايسمى INP.

## عينة الاختبار

Home/property/Cafe/Menu/Gallery أنماط مختلفة؛Arabic ضروري للخط والنص. تسجل قيمكل run و median،ولا field p75 منثلاث تشغيلات. لا صوربديلة أوخفض جودة يضرالمحتوى لتحسينالنتيجة. الاستثناء يراجعأثره ولايلغي DEC-027.
