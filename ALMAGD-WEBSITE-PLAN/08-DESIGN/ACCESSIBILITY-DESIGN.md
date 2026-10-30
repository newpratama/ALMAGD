# وصول التصميم

DEC-027:WCAG2.2AA؛أهداف 44 مطلبالمشروع. [W3C WCAG2.2](https://www.w3.org/TR/WCAG22/) مرجعالمعيار،و[ACCESSIBILITY-UX](../06-UX/ACCESSIBILITY-UX.md) مرجعالمهام. لاشهادةتوافق هنا.

| بند | متطلب | دليل لاحق |
|---|---|---|
| النص |4.5:1 عادي و 3:1 كبير |pairs مقاسة |
| controls |3:1 للدلالة المهمة و targets44 |أبعاد وتباين |
| focus |ظاهر غير مغطى؛ring3:1 هدفمشروع |keyboard screenshots |
| التكبير |200% كامل،400% reflow |320px مكافئ |
| اللون |ليسالدليل الوحيد |label/icon/underline |
| text spacing |لا clip عند تعديل المستخدم |مراجعةبشرية |
| images |alt/caption حقيقيان |مطابقةالأصل واللغة |

## الهيرو والقراءة

فحص overlay على crop لكل viewport؛إذافشل استخدمسطحاًثابتاً خلفالنص. WhatsApp يستخدم WaText الغامق؛Brass لا body على Mist. السياسات والأسعار ليست caption13. المرفقغيرالمؤكد لا icon يثبته.

## المكونات

Dialog لهعنوانو close44 و focus واضح. swipe ليس الوسيلة الوحيدة؛أسعار وأرقام يمكن قراءتها ونسخها. اللغةباسمها دون flags فقط. consent خياراته سهلة ومتساوية الوضوح.

يسلمالمصمم حالات default/hover/focus/pressed،التباين،ترتيبالقراءة D/M/AR،safe-area و bar،والحجب عند نقص البيانات. وصولالويب لا يثبت وصول المبنى MD-39.

قبول:المتطلبات شاملة للّغاتوالشاشات،ولا known barrier في contact/menu؛كل نتائج الاختبار الفعلية NOT_RUN حتىالتنفيذ.
