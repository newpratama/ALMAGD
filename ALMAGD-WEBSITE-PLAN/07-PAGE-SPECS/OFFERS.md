# OFFERS — مواصفة مستقبلية

**P2، غير مفعّلة في الإطلاق.** /offers ونظائرها فقط بعد عرض حقيقي معتمد DEC-008. لا offers entity جديد في P0؛ النموذج والعقد الحاليان لا يشملانه، فيرفع توسيعه إلى OPEN-DECISIONS لاحقاً.

| Section ID | الغرض / component موجود | العنوان | CTA | صورة / ratio | Desktop / Tablet / Mobile | RTL |
|---|---|---|---|---|---|---|
| hero | تعريف / HeroPage | Offers H1 ترجمة لاحقة | — | optional2400×1350؛16:9 |text /text /stack | start |
| live-offers | العرض / VenueFeature + RichText | اسم عرض PLACEHOLDER | WA المنشأة المعنية |1600×1200؛4:3 |2 /2 /1 | التواريخ والأرقام LTR |
| terms | وضوح / PolicyList | Terms ترجمة لاحقة | — | — |text68ch /نفسه /كامل | no truncation |
| contact | استفسار / CTASection | عنوان معتمد لاحقاً | WA جهة العرض | — |row /wrap /stack | جهة واضحة |

## حقول العرض المطلوبة عند فتح P2

offerId، اسم/وصف لكل locale، venue، start/end مع timezone معتمد، eligibility، inclusions/exclusions، طريقة الاستفادة، صاحب الاعتماد، شروط الإلغاء إن تنطبق، صورة وحقوق، قناة التواصل، وآخر تحقق. جميعها PLACEHOLDER الآن. لا percent/discount/original-price ولا مخزون أو countdown من تخمين. أسعار إقامة الموقع محظورة DEC-007؛ عرض يطلب تسعيراً عاماً يحتاج قرار تغيير مستقل، ولا يسمح هذا الملف به.

## دورة الحياة

Draft → إدارة تراجع → QA/ترجمة → نشر عند موعد فعلي → expiry يحجب العرض ويزيل رابط navigation. إذا لا live offers لا صفحة thin أو «قريباً». عند URL منشور سابقاً تنتهي: مراجعة SEO تقرر بديل مفيد أو حالة إزالة؛ لا redirect عشوائي ولا صفحة 200 خالية.

قبول P2: مالك يؤكد العرض والشروط، لا تغيير لنطاق حجز/دفع، لا schema Offer بسعر مفبرك، Locale معتمد فقط، CTA يحمل جهة العرض؛ قياسه يستخدم الأحداث canonical دون اختراع conversion booked.
