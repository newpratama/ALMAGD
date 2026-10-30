# CTA COPY — النصوص ورسائل WhatsApp

مرجع DEC-023/024، [العقد §7/8](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md). قوالب DRAFT_COPY ثلاثية اللغة. الأقواس حقول يملؤها الضيف في المحادثة؛ لا تُرسل كلمة PLACEHOLDER ولا معلومات حساسة ولا اسم كامل آلياً.

## أزرار وروابط

| المفتاح | ID | EN | AR |
|---|---|---|---|
| cta.whatsapp | Tanya melalui WhatsApp | Ask on WhatsApp | استفسروا عبر واتساب |
| cta.availability | Tanya ketersediaan | Ask about availability | استفسروا عن التوافر |
| cta.bookOn | Pesan di {platform} | Book on {platform} | احجزوا عبر {platform} |
| cta.viewProperty | Lihat penginapan | View property | اطّلعوا على مكان الإقامة |
| cta.viewMenu | Lihat menu | View menu | اطّلعوا على القائمة |
| cta.roomDetails | Lihat detail kamar | View room details | اطّلعوا على تفاصيل الغرفة |
| cta.directions | Petunjuk arah | Get directions | اتجاهات الوصول |
| cta.phone | Telepon {venue} | Call {venue} | اتصلوا بـ{venue} |
| cta.email | Kirim email | Send email | أرسلوا بريداً إلكترونياً |
| cta.morePhotos | Lihat semua foto | View all photos | شاهدوا جميع الصور |
| cta.externalTab | Membuka tab baru | Opens in a new tab | يفتح في تبويب جديد |
| cta.close | Tutup | Close | إغلاق |

## مصفوفة التوجيه

| السياق | الوجهة | الرقم التخطيطي digits | بوابة التفعيل |
|---|---|---|---|
| New Pratama page / room | new_pratama | 6285117588248 | MD-12؛ F-NP-06 |
| Villa NJD page / room | villa_njd | 6281333035141 | MD-34؛ WhatsApp-enabled تأكيد |
| NJD Cafe page / menu item | njd_cafe | 6281116618075 | F-CAFE-02 USER_PROVIDED؛ اختبار الإدارة §8 |
| Home/About/Gallery/Location/Contact/Footer group | group → chooser | لا رقم مؤسسي | 3 خيارات مع بيانات صالحة فقط |

## New Pratama Villa — القالب العام

**ID:** Halo tim New Pratama Villa. Saya melihat situs ALMAGD dan ingin menanyakan ketersediaan menginap. Tanggal masuk: [tanggal]. Tanggal keluar: [tanggal]. Jumlah tamu: [dewasa/anak]. Mohon informasi pilihan menginap yang sesuai. Terima kasih.

**EN:** Hello New Pratama Villa team. I found you on the ALMAGD website and would like to ask about a stay. Check-in: [date]. Check-out: [date]. Guests: [adults/children]. Please let me know which stay options may suit us. Thank you.

**AR:** مرحباً فريق New Pratama Villa. اطّلعت على موقع المجد وأرغب في الاستفسار عن إقامة. تاريخ الوصول: [التاريخ]. تاريخ المغادرة: [التاريخ]. عدد الضيوف: [بالغون/أطفال]. أرجو تزويدي بخيارات الإقامة المناسبة. شكراً لكم.

## Villa NJD — القالب العام

**ID:** Halo tim Villa NJD. Saya melihat situs ALMAGD dan ingin menanyakan ketersediaan kamar. Tanggal masuk: [tanggal]. Tanggal keluar: [tanggal]. Jumlah tamu: [dewasa/anak]. Mohon informasi pilihan kamar dan detail menginap. Terima kasih.

**EN:** Hello Villa NJD team. I found you on the ALMAGD website and would like to ask about room availability. Check-in: [date]. Check-out: [date]. Guests: [adults/children]. Please share room options and stay details. Thank you.

**AR:** مرحباً فريق Villa NJD. اطّلعت على موقع المجد وأرغب في الاستفسار عن توافر الغرف. تاريخ الوصول: [التاريخ]. تاريخ المغادرة: [التاريخ]. عدد الضيوف: [بالغون/أطفال]. أرجو تزويدي بخيارات الغرف وتفاصيل الإقامة. شكراً لكم.

## NJD Cafe — القالب العام

**ID:** Halo tim NJD Cafe. Saya melihat menu di situs ALMAGD. Saya ingin menanyakan informasi menu dan kunjungan. Rencana kunjungan: [tanggal/waktu]. Jumlah orang: [jumlah]. Mohon informasi lebih lanjut. Terima kasih.

**EN:** Hello NJD Cafe team. I saw your menu on the ALMAGD website. I would like to ask about the menu and visiting. Planned visit: [date/time]. People: [number]. Please share more information. Thank you.

**AR:** مرحباً فريق NJD Cafe. اطّلعت على قائمتكم في موقع المجد وأرغب في الاستفسار عن القائمة والزيارة. موعد الزيارة المقترح: [التاريخ/الوقت]. عدد الأشخاص: [العدد]. أرجو تزويدي بمزيد من المعلومات. شكراً لكم.

هذه ليست طلب حجز طاولة أو طلب توصيل مؤكد؛ الخدمة نفسها غير مثبتة.

## إضافات السياق

| السياق | ID | EN | AR |
|---|---|---|---|
| غرفة محددة | Saya tertarik dengan tipe: {room_name}. | I am interested in: {room_name}. | أهتم بخيار الإقامة: {room_name}. |
| صنف محدد | Saya ingin menanyakan item: {item_name}, termasuk harga dan ketersediaannya. | I would like to ask about {item_name}, including its price and availability. | أود الاستفسار عن الصنف {item_name} وسعره وتوافره. |
| استفسار وصول | Mohon informasi akses menuju {venue}. | Please share access information for {venue}. | أرجو تزويدي بمعلومات الوصول إلى {venue}. |

تستبدل المتغيرات بأسماء منشورة فقط؛ لا `room_name` مجهول. لا يُدرج URL الحالي أو query أو بيانات التحليلات في الرسالة. قالب UTF-8 يُرمز للرابط مرة واحدة حسب §8؛ لا أرقام + أو 0 محلية داخل digits. لا كتابة روابط تشغيلية لرقم غير معتمد في الإنتاج.

## القياس والقبول

النقرة click_whatsapp تحمل venue/locale/placement فقط؛ لا نص الرسالة أو رقم الهاتف أو التاريخ أو عدد الضيوف. فتح chooser = whatsapp_chooser_open وليس lead. لا حدث «booking_complete». التحقق على Android/iOS/Desktop: اللغة، الاسم، الرقم، الرسالة المقروءة، وإمكانية الرجوع؛ لا إرسال رسالة تجريبية دون طلب منفصل.
