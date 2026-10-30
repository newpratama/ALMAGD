# DESIGN SYSTEM — المرجع التنفيذي للتصميم

المصدر الأعلى [IMPLEMENTATION-CONTEXT §5/6](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md)، DEC-025/026/027. القيم مواصفات وليست CSS أو كوداً. الألوان كاملة في [COLOR-SYSTEM](./COLOR-SYSTEM.md)، الخطوط في [TYPOGRAPHY](./TYPOGRAPHY.md).

| عائلة | القيم المقفلة | التطبيق |
|---|---|---|
| spacing |4،8،12،16،24،32،48،64،96،128 |قاعدة 4؛لا قيم عشوائية لكل صفحة |
| radius |sm6،md12،lg20،pill999 |6 أزرار صغيرة،12cards،20dialogs |
| breakpoints |sm480،md768،lg1024،xl1280،2xl1536 |widths inclusively من القيمة؛mobile أقل 768 |
| container |max1200 |gutter16 M،24 T،32 D؛ text68ch |
| display |40 M→64 D |hero Home |
| h1/h2/h3 |32→48 /26→36 /20→24 |صفحات/مقاطع/بطاقات |
| body/small/caption |16→17 /14 /13 |caption ليس policy أو CTA رئيسياً |
| line height |body1.6،Arabic1.8 |headings Latin1.15–1.25،AR1.4 اقتراح تفصيلي |
| touch |44 minimum؛primary48 |Floating56؛icons24 |
| shadow-1 |ظل خفيف منخفض التباين |header بعد scroll/cards عند الحاجة؛قيمة تنفيذية تضبط ضمن المراجعة |

## أدوار semantic

page=Mist،surface=White،surface-alt=Stone،text=Ink،text-secondary=Muted،heading/action-primary=Pine،action-hover=Pine700،accent-decoration=Brass،accent-readable=BrassText،action-whatsapp=Wa/WaText. state colors تحتاج icon/label ولا لون فقط. focus واضح ذو تباين 3:1 مع كل سطح؛ dual ring عند image/dark خلفيات.

## حالات المكونات

Button: default/hover/focus/pressed، disabled فقط للأفعال غير المتاحة مؤقتاً في تفاعل فعلي؛ missing fact لا disabled CTA في production بل hidden. Link: underline أو دليل شكلي غير اللون؛ focus. Card: title/link واضح؛ avoid nested full-card link مع buttons. Dialog: heading/close/focus return. Consent: accept/reject/preferences متساوية الوضوح.

## اتجاه وحركة

Logical start/end لل padding وال margin والأزرار؛ DOM و source order ثابتان، logo/photo/clock لا mirror، arrows directional فقط. Motion100–200ms transitions كمواصفة جديدة؛ reduced motion لا حركة غير لازمة. لا scale مبالغ أو parallax.

## الحوكمة

تعديل token يتطلب تحديث هذا المرجع وملف العائلة والـ QA المتأثر؛ لا تعديل IMPLEMENTATION-CONTEXT الأساسي في هذه المهمة. أي تعارض مع §6 يُسجل OPEN-DECISIONS ولا يُعالج باختراع بديل. استعمال قيم core ثابت؛ supplementary sizes قابلة للضبط بحدود الوصول. لا components بأسماء مخالفة للقائمة canonical.
