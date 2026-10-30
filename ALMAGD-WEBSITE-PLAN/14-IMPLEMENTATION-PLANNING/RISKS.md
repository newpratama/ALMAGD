# سجل المخاطر

تقييم نوعي؛ لا احتمالات مئوية أو تكلفة أو موعد مختلق. جميع المخاطر OPEN حالياً. الأدوار مقترحة وأسماء الأشخاص PLACEHOLDER.

| ID | الخطر | الأثر | المسؤول | الاستجابة |
|---|---|---|---|---|
| R-01 | تأخر pins/phones/Cafe hours | إطلاق محجوب | الإدارة | MD launch summary، لا defaults |
| R-02 | نشر room count/size/types المتعارضة | توقعات خاطئة | الإدارة/editor | C-01…04/12، حجب حتى جواب |
| R-03 | استنتاج Cafe داخل NJD | علاقة ووصول خاطئان | الإدارة | C-08/MD-50 |
| R-04 | صور OTA/social بلا حقوق | حقوق ومصداقية | الإدارة/المصور | MD-72 وأصول/releases |
| R-05 | Arabic بلا reviewer أو RTL مكسور | فهم ووصول | AR reviewer/QA | MD-70 وفحص بشري |
| R-06 | أسماء menu وأسعار ومكونات ناقصة | خطأ تجاري | Cafe owner | MD-53…61 و HOLD |
| R-07 | GA4 قبل consent أو تسرب WA text | خصوصية | tech/privacy reviewer | Basic gate وحجب outbound auto-PII |
| R-08 | host يفرض slash مخالفاً | loops/SEO/404 | technical lead | اختبار Cloudflare preview |
| R-09 | payload الصور والخطوط كبير | CWV fail | media/tech | budgets وصور متجاوبة |
| R-10 | clicks تعرض كحجوزات | تقرير مضلل | analytics owner | تعريف outbound proxy |
| R-11 | PROPOSED يعامل APPROVED | إطلاق غير مقر | owner/PM | MD-08 و OPEN-DECISIONS |
| R-12 | لا مسؤول صيانة | بيانات قديمة | الإدارة | MD-75 ومراجعة شهرية |
| R-13 | النموذج البرمجي يولد copy | حقائق وهوية تتغير | PM/editor | AI-CODING-GUIDE |
| R-14 | اختبارات غير منفذة تعرض PASS | إطلاق بلا دليل | QA lead | NOT_RUN وسياسة evidence |

إغلاق الخطر يتطلب نتيجة وتاريخاً ومراجعاً ودليلاً؛ أحياناً حجب feature اختيارية كافٍ، لكنه لا يحل required launch gate. مشاكل routing/privacy/content الحرجة تمنع إطلاق النسخة المتأثرة.

لا تعد هذه القائمة الموافقات أو اختبارات الأمن مكتملة. عند تغير مصدر أو رقم أو حق صورة، يعاد فتح الخطر المرتبط حتى المراجعة.

قبول: المخاطر مرتبطة بتبعيات حقيقية، لكل منها إجراء ومسؤول، ولا يستعمل التخفيف ذريعة لتوسيع النطاق أو اختراع معلومة.
