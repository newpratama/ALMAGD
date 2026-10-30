# EVENT TRACKING — العقد

أسماء مقفلة من [IMPLEMENTATION-CONTEXT §7](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md). [GA4 events](https://developers.google.com/analytics/devguides/collection/ga4/events) مرجع ضبط الأحداث والتحقق في DebugView لاحقاً. لا code ولا GA4 property أنشئت هنا.

## parameters مشتركة

venue: new_pratama/villa_njd/njd_cafe/group؛locale:id/en/ar؛placement:header/hero/floating/section/footer/room_card/booking_panel/contact_card. تستخدم parameter قيم source entity عبر mapping ثابت، لا تبديل kebab-case entityids. platform:agoda/traveloka/tiket/booking_com/trip_com.

| event | trigger | parameters إضافية | شرط / de-dup |
|---|---|---|---|
| property_view | تحميل صفحة إحدى الإقامتين | venue | مرة لكل page load مقاس،لا Homecardview |
| cafe_view | تحميل Cafe | venue=njd_cafe | لا Menu تلقائياً |
| menu_view | تحميل Menu | venue=njd_cafe | مرة بعد consent؛لافتح category |
| click_whatsapp | نقرة outgoing فعلية | جهة المختارة | ليس chooseropen؛keyevent مقترح |
| click_phone | نقرة tel | venue | لا phone value |
| click_email | نقرة mailto معتمد | venue/group | لا email value |
| click_ota | نقرة منصة معتمدة | platform | keyevent مقترح؛مرةواحدة |
| click_google_maps | فتح رابط معلومات Maps | venue | ليس directions أو embed |
| click_directions | فتح اتجاهات إلى pin | venue | لا geocoords في payload |
| click_instagram | رابط officialprofile | venue | nohandle/fullURL |
| click_tiktok | رابط officialprofile | venue | لا embedevent |
| whatsapp_chooser_open | فتح chooseruser | venue=group | ليس conversion |
| menu_category_select | useranchor/filter اختيار | category_id | قيمة allowlist؛لاصنفتفصيلشخصي |
| gallery_open | فتح Lightbox | image_id | registryid غيرشخصي |
| gallery_filter | اختيارفلتر | filter=all/new_pratama/villa_njd/njd_cafe | دون auto-init |
| room_detail_open | فتح roomdialog | room_id | النوعالمعتمد،لا roomnumber |
| map_embed_load | user يحمّل facade | venue/group | مرةلفعل load لا pageload |
| language_change | اختيارلغة | from/to | locale قبلالفعل؛لا auto-detect |

category_id/image_id/room_id/filter/from/to إضافات تفصيل لهذه المواصفة، بلا تغيير أسماءالأحداث. Customdimensions event-scoped لـ venue/locale/placement/platform/category_id/from/to عند الحاجة؛image_id/room_id تُراجع cardinality قبل تسجيل dimension عام.

## page_view وإعادةالقبول

GA4 page_view ليساسم custom جديد؛يضبط once مع sanitised URL. قبول بعد تحميل صفحة يرسل لتلك الصفحة و eventview المناسبمرة؛رفضثمقبوللاحقلا replay لأنشطةسابقة. no analytics code/network قبل consent. لا click_agoda/new_pratama_view/villa_njd_view مستقلة؛التمييز parameters بالعقد.

## keyevents والقبول

مقترح click_whatsapp و click_ota كـ key events؛phone/email/directionssecondary بعدإقرارالإدارة،لا generate_lead يعبرعن booked. DebugView يفحصالاسم/params/once،network يفحصالرفض/سحبالموافقة،enhancedclick لايُضاعف customclick ولايكشفرسالة WhatsApp. missingdestination لا eventclick وهمية. لا user_id،measurementprotocolbackend،purchase أو revenueevents.
