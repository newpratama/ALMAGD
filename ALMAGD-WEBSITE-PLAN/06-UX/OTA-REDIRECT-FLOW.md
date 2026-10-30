# الانتقال إلى منصات الحجز

DEC-024 و DEC-007؛ لا أسعار غرف أو availability داخل الموقع. منصة خارجية مسؤولة عن توافر وشروط الحجز؛ الموقع لا يؤكد الحجز أو السعر.

## مصفوفة أهلية

| الجهة | رابط معروف في التدقيق | حالته الآن | قبل التشغيل |
|---|---|---|---|
| New Pratama | Agoda F-NP-09 | VERIFIED وجوداً | owner confirm MD-18 |
| New Pratama | Tiket، Trip.com | URL مفقود أو PUBLIC_SOURCE_ONLY | تقديم الرابط والتحقق واعتماد المالك |
| Villa NJD | Traveloka F-NJD-09، Tiket F-NJD-10 | VERIFIED | owner confirm DEC-024 |
| Villa NJD | Agoda/Booking.com/Trip.com | غير موثق | MD-37؛ hide |
| NJD Cafe | لا قناة OTA | غير منطبق | لا إضافة زر OTA |

ترتيب العرض عند وجودها: Traveloka، Tiket.com، Agoda، Booking.com، Trip.com. الغائب لا يحجز مساحة ولا logo. لا تغيير locale path الخاص بالمنصة تخميناً؛ استخدام exact owner-confirmed URL.

## خطوات التدفق

1. الضيف يختار زر «Book on {Platform}» مع اسم المنصة وتوضيح تبويب جديد.
2. الوجهة URL ثابتة ومثبتة للمنشأة، ليست query يختاره المستخدم؛ لا internal redirect service.
3. التبويب الخارجي يفتح مع عزل الصفحة الجديدة وفق عقد §9 وقاعدة DEC-024؛ صفحة المنشأة تبقى في التبويب الأصلي.
4. click_ota يرسل بعد consent venue/locale/placement/platform؛ لا URL كامل ولا PII ولا تأخير النقر.
5. الضيف يتمم العملية خارج الموقع؛ لا success page أو booking event داخل ALMAGD.

## الحالات البديلة

URL معطل أو listing تغير: يُعلّق الزر في content بعد تحقق مسؤول الصيانة؛ لا redirect صامت إلى منشأة أخرى أو search generic. لا رابط معتمد: WhatsApp يبقى الأساسي إذا معتمد. حظر pop-up: الرابط نفسه user-initiated وقابل لنسخ الوجهة من قائمة المتصفح، لا window تشغيل مؤجل.

## مراجعة قبل الإطلاق

اسم المنشأة وصور listing صحيحة، الرابط يعمل دون login مفروض للوصول الأولي، اللغة مفهومة، الموقع ليس نسخة مشابهة باسم خاطئ، HTTPS، لا tracking parameter غير معتمد. مراجعة دورية شهرية مقترحة للمسؤول MD-75، وبعد أي تغيير OTA. لا نسخ reviews أو booking widget.
