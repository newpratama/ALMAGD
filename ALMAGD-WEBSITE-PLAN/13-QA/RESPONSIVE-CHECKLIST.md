# فحص الاستجابة

NOT_RUN؛المراجع RESPONSIVE-RULES و MOBILE-UX. Matrix:320/360/390/430/768/1024/1280/1536،ID/EN/AR،portrait/landscape،zoom200%/400%.

- [ ] RSP-01 لا تمرير أفقي عام،container max1200 والشبكة حسب spec.
- [ ] RSP-02 Header60 هاتف/72desktop؛language داخل MobileNav على الهاتف.
- [ ] RSP-03 النص العربي الطويل يلتف دون clip أوتصغير معلومة مهمة.
- [ ] RSP-04 Hero16:9 و 4:5 يصون focal point والتباين دونتحميل source مزدوج.
- [ ] RSP-05 Feature/card stack يحفظ القراءة ولا يوسع viewport.
- [ ] RSP-06 Facility labels طويلة تتحول لأعمدة أقل عند الحاجة.
- [ ] RSP-07 Menu name يلتف والسعر وحدة مقروءة دون overflow.
- [ ] RSP-08 Comparison cards أو scroll محلي معنّون،لاصفحة أفقية كاملة.
- [ ] RSP-09 bar<1024،64+safe-area يتوسع؛WA60% و Book أو Menu.
- [ ] RSP-10 Floating56 و offset16،ويختفي عند bar؛RTL inline-end.
- [ ] RSP-11 consent يزيح CTA أو يخفيه مؤقتاً دون تغطية خياراته.
- [ ] RSP-12 نهاية المحتوى تكفي bar؛focused control لايتوارى.
- [ ] RSP-13 chooser/dialog عند landscape لايقطع close أوآخر خيار.
- [ ] RSP-14 Lightbox يحفظ صورة contain و buttons وتعليق مقروء.
- [ ] RSP-15 Footer والأرقام سليمة؛mobile breadcrumb رابط عودة.
- [ ] RSP-16 RTL يعكس الأسهم فقط؛صور وشعارات وأرقام لاتتغير.
- [ ] RSP-17 المقاطع المحجوبة لاتترك فراغاً أو placeholder في الإنتاج.

## أدلة لاحقة

screenshots لكل template على 320/390/1024 و Arabic مع bar/consent/sheet و zoom. اختبار iOS الحقيقي يشمل safe-area. نقص صورة لايعالج بـ stock لمطابقة mockup. كل جهاز غير مفحوص يبقى NOT_RUN.
