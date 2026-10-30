# استراتيجية التحليلات

DEC-018 default GA4 مع consent؛ القرار NEEDS_OWNER_DECISION ولا يعني إنشاء حساب الآن. التحويلات = اهتمام واتصال وانتقال خارجي. لا إثبات حجوزات أو إيراد أو إرسال رسالة من click-out.

| سؤال الإدارة | القياس | حد الاستنتاج |
|---|---|---|
| أي منشأة يقرأها الزوار؟ | property_view + venue؛ cafe_view | فقط الزيارات المقاسة بعد consent |
| أي قناة يختارون؟ | click_whatsapp/click_phone/click_ota | نقر، لا تواصل مكتمل |
| هل القائمة مفيدة؟ | menu_view/menu_category_select | لا مبيعات طعام |
| من يحتاج اتجاهات؟ | click_directions/click_google_maps | لا وصول فعلي |
| هل اللغات تستخدم؟ | locale/language_change | لا جنسية أو بلد مؤكد |

## الموافقة والإعداد

نمط **Basic Consent Mode** مناسب للعقد الذي يمنع تحميل analytics قبل consent؛ لا advanced cookieless pings قبل الموافقة. analytics_storage و ad_storage و ad_user_data و ad_personalization تبدأ denied. Analytics قبول مستقل؛ advertising يبقى denied في P0 إذ لا ads integration معتمدة. رفض أو سحب الموافقة لا يعطل WhatsApp/OTA/Menu/Maps link.

يدعم [Google Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode) نمطي basic/advanced؛ اختيار basic هنا قرار تنفيذ مشتق من DEC-018، وليس ادعاء أن كل consent mode يمنع الشبكة تلقائياً. عند قبول متأخر لا replay للنقرات السابقة؛ يبدأ قياس الحالة الحالية فقط. Preferences في Footer،local consent storage لإدارة الاختيار فقط،version ومدة الاحتفاظ يراجعها MD-73.

## خصوصية وجودة

لا WhatsApp text/number،email،guest dates،room number،PII،full outboundURL أو query في events. page_location يرسل canonical/path مسموحاً بعد تنظيف query؛إغلاق enhanced outbound measurement التلقائي إذا يرسل wa.me?text أو يتسبب ازدواج custom events. UTM whitelist لحملات الإدارة دون قيم من مستخدمين. GA4 ID وحسابات المالك PLACEHOLDER.

المسؤول MD-75 يراجع تقارير شهرية؛GSC مصدر queries/indexing مستقل عن GA4 consent. baseline أول 28 يوماً قياس اقتراح لا أرقام مستهدفة مثبتة. تقارير ratio تذكر measured denominator و consent bias،small samples و missing data.

قبول: network=0GArequests قبل/بعدرفض،once-per-click events،noPII،consent settings متاحة،no real booking metrics. جميع الاختبارات NOT_RUN الآن؛ [EVENT-TRACKING](./EVENT-TRACKING.md) المرجع الوحيد للتسمية.
