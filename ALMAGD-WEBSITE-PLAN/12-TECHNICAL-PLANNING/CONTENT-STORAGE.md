# تخزين المحتوى ومراجع الحقائق

DEC-015؛[CONTENT-MODEL](../05-CONTENT/CONTENT-MODEL.md) مرجع تفاصيل schema،[العقد §2/3](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md) مرجع المسارات والأسماء. هذه خطة ملفات Git لا database ولا CMS implementation.

## قواعد البيانات التحريرية

محتوى منظم للـ site/venues/rooms/menu/gallery/faqs/attractions/ratings،Markdown long copy للصفحات،localized UI strings مستقلة. venue IDs kebab-case،menu m001…m047 ثابتة،events venue underscore عبر mapping. لا تعديل اسم source menu؛helper translations في altName.

| حالة | التعامل |
|---|---|
| fieldStatus مسموح | يمر بعد مراجعة اللغة والحقوق/gates التشغيلية |
| absent status للحقيقة | NEEDS_CONFIRMATION،لا اختراع default |
| optional fact غير صالح | hide field وربطه/أيقونته/schema |
| required field ناقص | draft entity أو blocked publish |
| price null | label Ask for price وفق CONTENT-MODEL لا صفر |
| availability مجهول | draft،لا available بالافتراض |
| asset rights غير مؤكدة | لا image مرئي في production |
| PLACEHOLDER في rendered published field | fail production validation |

فصل حالات التحرير مثل DRAFT_COPY/APPROVED_TRANSLATION عن حالات الحقائق؛لا تضع DRAFT_COPY في fieldStatus enum. السجلات الداخلية revisions/reviewers تربط بالحقائق F-ID،لا تغيير content schema خفي لإضافة حقول تنفيذية دون مراجعة.

## حل تعارض النموذج والعقد

CONTENT-MODEL يعرف room.kind،العقد الملخص room.type؛التفصيل kind هو المرجع،ولا يولّد النموذج حقلي kind و type. gallery.topic يعامل بمسميات النموذج،والهوية تعتمد references لا file name. menu availability مطلوب لكن قيمته غير معروفة: لا draft default «available». قرارات التوفيق موثقة OPEN-DECISIONS وتحتاج تحقق عند نقل البيانات.

## تحديث لاحق

طلب إدارة موثق → audit supplement مع دليل → مراجعة conflict/gates → تعديل ملفات التنفيذ المصدرية → ترجمة المتأثر → QA/build → preview → نشر معتمد. الملفات الأساسية read-only في مهمة التخطيط؛لا تعمل هذه المواصفة على تغيير DATA-AUDIT الآن. أسعار غرف ليست storage مطلوباً للموقع.

قبول: مرجع واحد لكل حقيقة،لا نص أسعار أو أرقام hardcoded في templates،كل ID unique،العلاقات صحيحة،الحقول المحجوبة لا تخرج في schema/meta/alt/analytics.
