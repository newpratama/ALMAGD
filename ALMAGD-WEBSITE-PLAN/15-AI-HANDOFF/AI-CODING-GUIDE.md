# دليل النموذج البرمجي — يستخدم لاحقاً

هذا الدليل للتنفيذ بعد طلب مستقل. المرحلة الحالية Markdown فقط: لا code أو package install أو deployment. اقرأ [IMPLEMENTATION-CONTEXT](./IMPLEMENTATION-CONTEXT.md) لكل مهمة، ثم spec المهمة من [TASK-BREAKDOWN](../14-IMPLEMENTATION-PLANNING/TASK-BREAKDOWN.md).

## عقد العمل

1. اختر T-ID واحداً وحدد ownership للملفات والمكونات والناتج ودليل القبول.
2. اقرأ القرارات ثم الحقائق ثم بنية الصفحة والتفصيل المناسب. لا تعِد البحث عن بيانات المنشأة لتجاوز DATA-AUDIT.
3. استخدم النصوص و IDs والألوان والخطوط والمسارات والأحداث canonical؛ لا تؤلف copy أو facts.
4. طبّق gates الحقائق والترجمة والصور والأرقام؛ missing optional يختفي،required يمنع launch. Dev فقط markers.
5. حافظ على Astro static و Git content و Cloudflare Pages. لا dependencies إضافية أو backend/CMS/forms.
6. احترم RTL وأهداف 44 والحالات والـ keyboard؛ لا تعتبر responsiveness مجرد تصغير desktop.
7. نفذ تحقق المهمة المناسب وسجل revision و expected/actual. عند الفشل أصلح قبل الانتقال.
8. سلّم changed/why/verification/remaining blockers؛ لا تعلن عمل لم ينفذ.

## حزمة سياق صغيرة

العقد + صف المهمة + spec واحد أو اثنان + فقرة الحقائق اللازمة تكفي للمهمة المعتادة. مثال تخطيطي: T-34 يحتاج MENU-CONTENT و NJD-CAFE-MENU ونموذج menu، ولا يحتاج إعادة قراءة كامل branding. نموذج أرخص لا يعوض قصر السياق بالاختراع.

## التعامل مع التعارض

MASTER-DECISIONS > DATA-AUDIT > SITEMAP > المواصفات التابعة. CONTENT-MODEL يحكم حقول النموذج، NAVIGATION يحكم header/bar. room.kind هو تفصيل النموذج مقابل room.type الملخص؛ لا يولّد حقلاً ثانياً. تعارض لا يحله ترتيب المصدر يسجل OPEN-DECISIONS مع أثره والمطلوب، ويستمر العمل المستقل عنه.

حالات PROPOSED و NEEDS_OWNER_DECISION لا تعتبر approvals تلقائية؛ المستخدم أكد tagline في هذه المحادثة فقط. لا تعديل للملفات الأساسية ضمن هذا التسليم.

## مراجعة ونشر

تصميم preview قابل للمراجعة قبل طلب إطلاق؛ إكمال build ليس إذناً للنشر أو لحسابات/رسائل خارجية. يطبق PRE-LAUNCH-CHECKLIST وبوابات MD وحقوق وترجمة و Privacy. لا إرسال WhatsApp تجريبي للموظفين أو شراء حجز كاختبار.

قبول المهمة: التزام النطاق والدليل والحقائق،0 بيانات مختلقة،لا claimed runtime PASS قبل فحصه،ومشكلة unresolved ظاهرة في التقرير.
