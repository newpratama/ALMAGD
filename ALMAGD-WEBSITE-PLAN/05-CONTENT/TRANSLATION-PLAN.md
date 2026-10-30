# خطة الترجمة والتحرير

DEC-012/013/026، [BRAND-VOICE](../03-BRAND/BRAND-VOICE.md)، [CONTENT-MODEL](./CONTENT-MODEL.md). اللغات ID أصل، EN دولية واضحة، AR فصحى RTL. كل النسخ الجديدة مسودات وليست ترجمات معتمدة.

## دورة الاعتماد

| الخطوة | المسؤول المقترح | الناتج / gate |
|---|---|---|
| تثبيت الحقائق | الإدارة | F-ID وحالة مسموحة، معالجة MD/C |
| تحرير ID | محرر Indonesian، اسمه PLACEHOLDER MD-71 | source revision؛ العبارات التجارية صحيحة |
| ترجمة EN | مترجم، PLACEHOLDER | يطابق المصدر دون توسعة الادعاء |
| ترجمة AR | مترجم عربي أصلي، PLACEHOLDER MD-70 | فصحى، أسماء Latin، قراءة RTL سليمة |
| تدقيق وظيفي | QA + reviewer | CTA و WhatsApp و meta و alt و FAQ متسقة |
| اعتماد صفحة/لغة | الإدارة + مراجع اللغة | سجل الصفحة والنسخة والتاريخ والاسم وحالة approved |

تحديث الأصل يلغي اعتماد المقاطع المتأثرة فقط؛ صفحة لغة لا تنشر حتى اكتمال نصوصها المطلوبة. لا ترجمة آلية كـ fallback ولا مزج ID داخل body عربي. إذا الصفحة غائبة في لغة ما لا href/hreflang/sitemap لها؛ switcher يوضح عدم توافر الصفحة ويعرض رابط الصفحة الرئيسية في اللغة المختارة كخيار صريح.

## قاموس مقفل

| الأصل | ID | EN | AR |
|---|---|---|---|
| ALMAGD | ALMAGD | ALMAGD | المجد؛ Latin عند العلامة المزدوجة |
| groupName | Koleksi ALMAGD | The ALMAGD Collection | مجموعة المجد |
| tagline | Udara Sejuk, Sambutan Hangat. | Cool Air. Warm Welcome. | هواءٌ عليل… وترحيبٌ دافئ |
| venue names | New Pratama Villa / Villa NJD / NJD Cafe | نفس الأصل | نفس الأصل Latin دون استبدال |
| availability inquiry | Tanya ketersediaan | Ask about availability | استفسروا عن التوافر |
| property | Penginapan | Stay / property حسب السياق | مكان الإقامة |

الأماكن والشوارع والإحداثيات وأسماء الأنواع الرسمية لا تترجم كبيانات رسمية. Menu: name أصل محفوظ، altName ترجمة معتمدة؛ Koleja/Gemat/Roti Pataer/Milo Dino لا معنى مخترع. IDR لا يتحول إلى عملة أخرى؛ AR digits Latin والأرقام معزولة اتجاهياً. Tax/halal لا ترجمة لإجابة غير مثبتة.

## نطاق التسليم

لكل صفحة: H1 و lead والمقاطع والبطاقات و CTA و FAQ و meta/OG و alt وتسميات الوصول ورسالة WhatsApp والواجهة العامة. Privacy تُراجع قانونياً في كل لغة منشورة؛ لا تجعل ترجمتها بديلاً عن MD-73. 404 ونصوص consent و switcher جزء من الحزمة وليست ثانوية.

حدود تخطيط: summary ≤160 حرفاً؛ room summary ≤140؛ menu description ≤120؛ section body ≤60 كلمة؛ لا قص العربية mid-word. طول meta إرشادي وفق META-STRATEGY ولا يولّد ملخصاً جديداً آلياً عند التجاوز.

## سجل المراجعة المطلوب لاحقاً

صفحة، locale، source revision، reviewer، review date، fact refs، strings complete، RTL checked، approval status، remarks. جميع أسماء المراجعين وتواريخ الاعتماد الحالية PLACEHOLDER. لا تدّعي final approved الآن.

قبول: key parity للنصوص المشتركة، اكتمال الحقول اللازمة للصفحة، لا placeholders معروضة، مراجعة عربية بشرية، توافق المعنى بين اللغات، ورسائل WhatsApp لا تحتوي متغيرات تقنية غير مستبدلة.
