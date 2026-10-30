# NJD CAFE MENU — مواصفات القائمة

P0 /dining/njd-cafe/menu؛ template menu. /menu vanity redirect في كل locale؛ anchors categoryId من [MENU-CONTENT](../05-CONTENT/MENU-CONTENT.md). الهدف قراءة اسم وسعر ثم استفسار، لا شراء.

| Section ID | الغرض / component | العنوان | CTA | صورة / ratio | Desktop / Tablet / Mobile | RTL |
|---|---|---|---|---|---|---|
| hero | تعريف / HeroPage | NJD Cafe Menu H1 | العودة لـ Cafe | لا hero ثقيل |text68ch /نفسه /كامل | start |
| menu-nav | وصول سريع / MenuNav | تسميات categories | روابط anchors | — |wrap /wrap /wrap أو scroll محلي | ترتيب المصدر لا يقلب |
| categoryId لكل فئة | قائمة / MenuSection + MenuItemRow | اسم الفئة H2، الصنف H3 | استفسار صنف عند الحاجة | optional800×800؛1:1 |صفوف بعمودين /صفوف /عمود واحد | الاسم Latin ثم helper AR؛ السعر LTR |
| menu-notes | دقة / RichText | ملاحظة السعر المعتمدة | — | — |max68ch /نفسه /كامل | أرقام مستقلة |
| ask | تواصل / CTASection | Ask NJD Cafe | WhatsApp Cafe | — |row /wrap /stack | target≥44 |

## شكل الصنف

الاسم الأصلي دائماً، helper مترجم أصغر اختيارياً، وصف فقط عند اعتماده، سعر واضح أو Ask for price، صورة اختياريّة. لا tooltip إجباري لفهم الصنف، لا cart أو order button، لا إخفاء أسماء داخل الصور. ثبات ارتفاع thumbnails يمنع CLS؛ عند عدم وجود صور تستخدم صفوف نصية دون صورة عامة بديلة.

## حجب البيانات

الـ 47 records محفوظة كاملة في المواصفة؛ القائمة الظاهرة تعتمد status. m026/034/042 hidden، m015 و m024 hold إلى التوضيح، m023 price hold. m016/035/036 السعر null بسؤال معتمد. availability غير معروف لا available افتراضي. category بلا أصناف تُحذف من nav والمحتوى. tax/service/halal/featured لا auto-filled.

## التفاعل والقبول

يُقرأ المحتوى دون JS؛ links الفئات تعمل ولا تدخل URL جديدة سوى hash؛ header offset يحمي العنوان. menu_view مرة بعد consent في page load، menu_category_select لكل اختيار user فقط. Floating direct Cafe؛ لا bar جديد في Menu. QR tracking لا يدخل canonical ولا الرسالة أو event URL. 320px/AR: لا انكسار السعر، أسماء تلتف، keyboard يصل لكل فئة، no menu PDF-only. مراجعة 47 id و 44 source prices مع حالات hold قبل إدخال البيانات لاحقاً.
