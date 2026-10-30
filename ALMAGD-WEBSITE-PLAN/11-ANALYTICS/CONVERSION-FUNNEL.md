# مسار التحويل

المراجع USER-JOURNEYS و EVENT-TRACKING. Funnel يقيس اهتماماً داخل الموقع،ولا يثبت حجزاً أوطلب طعام. لا baseline وصل الآن.

| مسار | الدخول | التقييم | متابعة اختيارية | نهاية الموقع |
|---|---|---|---|---|
| إقامة | landing/session | property_view | room_detail_open | click_whatsapp/ota/phone |
| طعام | Cafe أو Menu مباشرة | menu_view | category_select | WhatsApp Cafe |
| وصول | Location أو venue | عنوان/خريطة | اختيار جهة | click_directions |
| تواصل جماعي | group page | chooser_open | اختيار venue | click_whatsapp النهائي |

## قراءة المسار

ليس كل زائر يمر Home أو room dialog. اعرض open funnel للدخول المباشر،و closed cohort عند مقارنة رحلة محددة. تجاوز خطوة اختيارية لايسمىفشلاً.

العدد الإجمالي events؛النسبة تعتمد جلسات مقاسة فريدة. جلسةتنقر 3 مرات ليست 3 ضيوف. اتحاد WA/OTA/phone يمنع جمع النسب كأنها conversion rate واحدة. denominator لنفس venue والفترة والعينة ذات الموافقة.

الخروج لا يكشف إرسال رسالة أو إتمام حجز؛العودةلا تعني cancelled booking. مراجعة استفسارات الموظفين خارج الموقع عملية مستقبلية بسياسة خصوصية؛لا CRM/servertracking/webhook في P0.

## تقرير

فترة،venue،locale،device،landing،sessions،step counts،outbound union،حصةالقنوات،الدخولالمباشر،وملاحظاتالجودة. 28 يوماًفترة baseline مقترحة؛QR دخول print وليس organic.

قبول: لا label حجوزاتللنقرات،ولا double count أوتجاهل consent bias أو small samples. بيانات الحجوزات الفعلية خارجنطاقهذا funnel.
