# فحص الوظائف

الحالة NOT_RUN. المصادر NAVIGATION و USER-FLOWS و CONTACT-FLOW و OTA-REDIRECT-FLOW. يسجل المراجع الدليل واللغة والجهاز؛البند غير المفحوص ليس PASS.

- [ ] FNC-01 Logo يعود لرئيسية اللغة؛nav و active current صحيحان.
- [ ] FNC-02 Dropdown يعمل بالنقر و Enter و Escape دون hover إجباري.
- [ ] FNC-03 MobileNav يقفل الخلفية مؤقتاً ويعيد focus و scroll عند الإغلاق.
- [ ] FNC-04 LanguageSwitcher يفتح النظير أو home المعلن؛لا صفحة غير مترجمة.
- [ ] FNC-05 WhatsApp الجماعي يفتح chooser؛لا يختار Cafe افتراضياً.
- [ ] FNC-06 كل جهة ورقم وقالب لغة صحيحة؛سياق room/item من اسم منشور.
- [ ] FNC-07 tel/mailto للبيانات المعتمدة؛لا بريد أو رقم شركة مخترع.
- [ ] FNC-08 OTA باسم منصة ورابط مالك مؤكد وتبويب معزول وحدث واحد.
- [ ] FNC-09 RoomDetailDialog يطابق النوع وصوره؛لا سعر أو checkout.
- [ ] FNC-10 FAQ يطبق answerStatus،وأزرار expanded صحيحة.
- [ ] FNC-11 Gallery filters و Lightbox والعودة للصورة دون swipe فقط.
- [ ] FNC-12 Menu anchors والأسماء والأسعار والحجب مطابقة للسجل.
- [ ] FNC-13 Maps/directions إلى المدخل المعتمد؛لا iframe عند التحميل.
- [ ] FNC-14 consent قبول ورفض وتعديل وسحب؛لا GA requests عند denied.
- [ ] FNC-15 events مرة لكل فعل وبالأسماء/parameters canonical،دون PII.
- [ ] FNC-16 دون JS: المحتوى والقائمة والروابط؛chooser له بديل Contact.
- [ ] FNC-17 unknown URL يعيد 404 فعلياً،و vanity redirects سليمة.
- [ ] FNC-18 hidden sections لا gaps أو anchors ميتة أو schema facts مكشوفة.
- [ ] FNC-19 FAQ/Offers المستقبلية ليست صفحات إطلاق.

## دليل القبول

لكل بند خطوات و expected/actual و revision ولقطة/URL. فحص الرابط الخارجي ينتهي بمراجعة الوجهة دون إرسال طلب أوشراء. خطأ التوجيه أوالخصوصية أوالحقائق الحرجة يمنع الإطلاق حتى الإصلاح وإعادة الفحص.
