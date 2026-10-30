# استراتيجية الجودة

المرحلة الحالية تخطيط فقط؛كل اختبار موقع فعلي NOT_RUN. الهدف إثبات صحة الحقائق والتوجيه والقراءة واللغة والأداء قبل الإطلاق. اكتمال Markdown لا يمنح PASS لموقع لم يُبن.

| طبقة | التغطية | الدليل لاحقاً |
|---|---|---|
| المحتوى | F/MD/C،قائمة 47،copy،حقوق | سجل مصدر واعتماد |
| الوظائف | nav و WhatsApp و OTA و menu/gallery/maps | خطوات و expected/actual |
| الاستجابة | widths واللغات و zoom و safe-area | screenshots لكل template |
| الوصول | keyboard وقارئ شاشة وتباين و reflow | فحص بشري وآلي |
| SEO | HTTP/canonical/lang/schema/sitemap | response/head و validator |
| الأداء | payload و Lighthouse و CWV | profile/revision؛field بعد الإطلاق |
| الخصوصية والأمن | consent والشبكة و PII و headers | network/header review |

## تصنيف العيوب

Critical: رقم جهة خاطئ،تسرب بيانات،حقيقة غير مسموحة،حقوق غير مثبتة،تعقب بلا موافقة،أو تعطل رحلة رئيسية. High: حاجز وصول،RTL غير مقروء،canonical خاطئ،أو إخفاق أداء يمنع الاستخدام. Medium: خلل وظيفة اختيارية أو layout مؤثر. Low: اختلاف زخرفي لا يغير الفهم. عند الإطلاق 0 Critical/High؛الاستثناء لا يلغي DEC-010/027.

## تسجيل الفحص

QA-ID،T-ID/AC،revision،device/browser/version،locale،preconditions،خطوات،expected،actual،status،severity،evidence،مسؤول الإصلاح،وتاريخ إعادة الفحص. الحالات NOT_RUN/PASS/FAIL/BLOCKED/N_A مع سبب.

preview يمثل البيانات والصور المعتمدة؛لا صور عامة ثم إعلان نجاح تصوير المنتج. نقص required يسجل BLOCKED_DATA. تغطية 3 لغات و P0 والزيارات المباشرة و QR ورفض consent. أدوات Lighthouse/axe لا تثبت الترجمة أوقارئ الشاشة أو field p75.

لا شراء أوحجز أوإرسال WhatsApp للاختبار؛مراجعة الرابط والرسالة تكفي. يعاد فحص المتأثر بعد الإصلاح،و regression عند تعديل مكون مشترك. القبول النهائي مرتبط بـ PRE-LAUNCH-CHECKLIST و AC،ودليله نسخة محددة.
