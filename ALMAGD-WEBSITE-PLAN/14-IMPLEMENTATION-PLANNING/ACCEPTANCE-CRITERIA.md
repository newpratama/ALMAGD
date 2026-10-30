# معايير القبول

معايير تنفيذ لاحق؛ runtime evidence الآن غير موجود. المصادر MASTER-DECISIONS/DATA-AUDIT/CONTENT-MODEL و 13-QA.

| AC | معيار | دليل |
|---|---|---|
| AC-01 | موقع معلوماتي دون booking/payment/forms/accounts/DB/CMS | مراجعة repo/routes |
| AC-02 | facts مسموحة فقط و required gates مغلقة | F refs وتحقق published placeholders |
| AC-03 | URLs و IA والأسماء ثابتة | route inventory و HTTP |
| AC-04 | ID/EN/AR معتمدة و RTL/switcher سليم | native review و device QA |
| AC-05 | WhatsApp رقم وجهة ولغة ورسالة صحيحة | MD-12/34 و Cafe contact check |
| AC-06 | OTA owner-confirmed وتسميات وتبويب آمن | سجل إدارة وفحص links |
| AC-07 | 47 records؛44 source prices و 3null؛HOLD محجوب | reconciliation القائمة |
| AC-08 | صور حقيقية وحقوق وتطابق أنواع وأعداد كافية | rights registry ومراجعة صور |
| AC-09 | WCAG2.2AA وأهداف 44 | keyboard/screenreader/contrast/reflow |
| AC-10 | Lighthouse≥90 وأهداف CWV و payload | lab reports؛field لاحقاً |
| AC-11 | canonical/lang/sitemap/schema/real404 سليمة | SEO/host evidence |
| AC-12 | لا analytics عند denied ولا PII في events | network و DebugView |
| AC-13 | Cafe address/hours/public و pins مؤكدة | MD-50/51/52 و maps review |
| AC-14 | سياسة قانونية توافق التنفيذ | MD-02/73 و cookie inventory |
| AC-15 | 0 Critical/High و revision approved | QA triage وإقرار إطلاق |
| AC-16 | rollback وصيانة ومسؤول محدد | deployment record و MD-75 |

## قبول التخطيط

كل الملفات المطلوبة Markdown؛ الأساس غير معدل؛ 95 جديدة +39 موجودة؛ روابط سليمة؛ gates و PLACEHOLDER صريحة؛ مهام صغيرة؛ لا metrics مختلقة أو runtime PASS. هذا قبول وثائق لا قبول تنفيذ.

تغيير page/locale/token/scope يحتاج قرار مالك؛ النموذج لا يقره. استثناء rooms section-only ضمن MISSING-DATA ممكن بموافقة موثقة؛ لا استثناء يحول CONFLICT إلى معلومة منشورة أو يجيز تسرب PII.

قبول التنفيذ يتطلب دليلاً لنسخة محددة لكل معيار؛ لا «looks good» بديل للحقائق والفحوص.
