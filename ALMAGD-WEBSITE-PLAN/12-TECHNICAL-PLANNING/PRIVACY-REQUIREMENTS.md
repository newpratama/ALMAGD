# متطلبات الخصوصية ومواصفة صفحة Privacy

P0 /privacy ونظائرها؛DEC-018/019/020،MD-02/73 blockers. هذه brief للمراجعة القانونية وليست سياسة نافذة أو استشارة قانونية مكتملة. لا جمع form/booking/payment داخل الموقع؛لكن hosting logs و analytics والخدمات الخارجية تحتاج وصفاً صحيحاً.

مرجع رسمي راجعته 2026-10-09: [Indonesia UU27/2022 Pelindungan Data Pribadi](https://peraturan.bpk.go.id/Details/229798/uu-no-27-). القانون أساس مراجعة إندونيسيا؛تحديد الالتزامات العملية واللوائح السارية والأسس ونقل البيانات يعتمده reviewer MD-73،ولا يفترض امتثال الموقع أو DPO requirement تلقائياً.

## مخطط الصفحة

| Section ID / H2 | المعلومات المطلوبة | الحالة الآن |
|---|---|---|
| controller — مسؤول المعالجة |legal name،وسيلة حقوق/privacy contact |PLACEHOLDER MD-02؛لا اسم ALMAGD كاسم شركة مسجل |
| scope — نطاق السياسة |الموقع واللغات والخدمات المقصودة |DRAFT؛تطابق implementation النهائي |
| data — البيانات |hosting logs،consent preference،GA4 بعد موافقة |تحتاج إعدادات فعلية؛لا «نجمع لا شيء» |
| purposes — الأغراض والأساس |تشغيل الموقع/قياس بعد consent،أساس كل غرض |LEGAL_REVIEW_REQUIRED |
| cookies — ملفات الارتباط |الأسماء/المزود/الغرض/expiry بعد اختيار الإعداد |PLACEHOLDER؛لا مدد مختلقة |
| third-parties — الجهات |Cloudflare/Google وروابط WhatsApp/OTA/Maps/social |اختيار نهائي مطلوب؛تمييز الروابط من embeddeds |
| transfers — النقل |أماكن ومعايير النقل حسب vendor/config |PLACEHOLDER؛لا local-only claim |
| retention — الاحتفاظ |logs/analytics/consent لكل نوع |NEEDS_OWNER_DECISION مع reviewer |
| rights — الحقوق |قنوات ومراحل الاستجابة والحقوق المنطبقة |MD-02/privacycontact و MD-73 |
| choices — الاختيارات |رفض وسحب consent،footer preferences |SPECIFIED؛تختبر لاحقاً |
| security — الأمن |وصف إجراءات فعلية دون guarantee |DRAFT بعد التنفيذ |
| updates — التحديث |تاريخ سريان فعلي ومسؤول مراجعة |PLACEHOLDER؛تاريخ pack ليس effective date |

## consent وتجربة الصفحة

Basic Consent Mode،default denied لكل إشارات analytics/ads؛لا analytics requests عندرفض؛ad signals تبقى denied P0. الزائر يستطيع رفض أو قبول analytics أو تغيير الاختيار،لا جعل خدمات اتصال رهينة consent. ملاحظة links الخارجية واضحة؛Maps facade يكشف خدمة Google ويحمّل باختيار الزائر وفق السياسة المعتمدة.

Privacy layout: HeroPage بعنوان محلي H1،RichText max68ch،روابط sections اختيارية،لا photo،D/T نص مريح،M full،AR start وأرقام مستقلة. Footer Preferences button≥44،Floating group وفق NAVIGATION. meta description تبقى PLACEHOLDER حتى النص النهائي؛schema WebPage بدون claims مبالغ فيها.

قبول إطلاق:legalName/contact/policy/settings فعلية ومتطابقة،مراجعة قانونية وتراجم الصفحات المنشورة،cookie inventory evidence،لا بيانات ضيوف في events،و noPII leak من outbound URLs. جميع approvals الحالية PENDING؛لا تطبيق consent أو نشر سياسة ضمن هذه المحادثة.
