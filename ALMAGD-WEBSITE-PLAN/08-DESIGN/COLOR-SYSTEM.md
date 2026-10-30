# نظام الألوان

القيم من [IMPLEMENTATION-CONTEXT §6](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md) و COLOR-DIRECTION. نسب contrast في العقد مرجع تاريخي؛ ليست نتيجة فحص هذه المحادثة. اختبار التباين الفعلي بكل حالة مطلوب قبل النشر، وأي رقم غير دقيق يُسجل دون تغيير الملف الأساسي.

| token | Hex | استخدام مسموح | قيد |
|---|---|---|---|
| color.pine |#1E3B32 |headings،primary،footer |نص White/Mist عليه |
| color.pine-700 |#152B24 |hover/pressed primary |لا تبديل بالأسود |
| color.tea |#4F6B4C |icons/tags،secondary |فحص نص صغير على السطح الفعلي |
| color.tea-100 |#DCE5D6 |panels |نص Pine/Ink |
| color.brass |#B8873B |decoration؛graphic كبير على Pine |ممنوع body light |
| color.brass-300 |#D9B77A |accent text على Pine |لا white surface small text |
| color.brass-text |#8A6420 |accent links light |underline وفحص التباين |
| color.mist |#F6F3EC |page background |default |
| color.white |#FFFFFF |cards/surface/text dark bg |لا default page stark white |
| color.stone |#ECE7DD |section alt |نص Ink/Muted |
| color.ink |#1A1D1B |body |للقراءة الأساسية |
| color.muted |#565E58 |secondary body |ليس opacity يخفض التباين |
| color.border |#D6D0C4 |decorative divider |لا حد تفاعلي وحيد |
| color.wa |#25D366 |WhatsApp only |نص WaText لا white |
| color.wa-text |#0A2A17 |WhatsApp text/icon |اسم مفهوم دون اللون |
| color.error |#B3261E |error |نص/رمز يفسر |
| color.success |#2E7D4F |success فعل موثق |لا «حجز ناجح» بالموقع |

## قواعد التباين

هدف ≥4.5:1 للنص المعتاد، ≥3:1 للنص الكبير وفق تعريف WCAG، ≥3:1 للضوابط/الحالات المهمة. scrim صورة الهيرو يُفحص فوق أسوأ crop وليس المتوسط؛ يمكن وضع النص على سطح solid إذا لا يحقق ذلك. الزر لا يصبح منخفض التباين في hover/focus، ولا text opacity مخفض عشوائياً.

## تركيبات

Primary Pine+White؛ WhatsApp Wa+WaText؛ cards White+Ink؛ footer Pine+Mist/Brass300؛ subdued panels Tea100+Pine. BrassText على Mist للروابط مع underline. Focus قد يحتاج ring مزدوج فاتح/غامق للحفاظ على الوضوح فوق الصورة. active nav underline2 Brass زخرفي يصاحبه current semantic وحالة نص مقروءة.

المراجعة: COLOR pair،حجم/وزن الخط،ratio measured،device/state،نتيجة. لا dark mode منفصل في P0، ولا per-venue palette. كل تغيير لون ينطبق على اللغات الثلاث ويختبر forced colors حيث متاح.
