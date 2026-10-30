# بدائل المعمارية

مقارنة تخطيطية تنفذ DEC-014/015/016؛ لا إنشاء مشروع أو تثبيت حزم. متطلبات الموقع: صفحات معلومات،3 لغات،صور،قائمة 47 سجلاً،روابط خارجية،لا حجز أو دفع أو حسابات.

| البديل | الملاءمة | التشغيل والصيانة | trade-off | قرار P0 |
|---|---|---|---|---|
| Astro SSG + Git content | مرتفعة لمحتوى ثابت وصور | بناء عند تحديث المحتوى،لا server app | تحديث يحتاج workflow محرر/مطور | موصى به وفق العقد |
| Eleventy SSG | جيد للمحتوى | static build | يحتاج توحيد image/i18n pipeline منفصل | لا موجب لتغيير العقد |
| Next.js static | ممكن | منظومة أعرض | يزيد تعقيداً لا تحتاجه هذه النطاقات | غير مختار |
| WordPress | تحرير مباشر | hosting/patching/backups للمحتوى | صيانة plugins و database تخالف P0 | مستبعد |
| Hand-authored pages | بسيط أولياً | تكرار يدوي عبر اللغات | ارتفاع خطر drift للأسماء/الأسعار | مستبعد |

هذه أحكام ملاءمة للمشروع لا benchmarks مقاسة أو أسعار خدمات حالية. [Astro i18n](https://docs.astro.build/en/guides/internationalization/) يتيح أدوات المسارات؛المواصفة تعتمد البناء للغات المعتمدة فقط دون fallback. [Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/) يستضيف ناتجاً ثابتاً؛التوافق مع canonical/404 يحتاج إثباتاً لاحقاً.

## شروط الاختيار

الحفاظ على static output،الأسماء والحقائق من ملفات المحتوى،توليد صفحات معتمدة فقط،image optimization،واجهة صغيرة بلا مكتبة UI ثقيلة،روابط أساسية تعمل دون enhancements. عدم وجود backend يعني عدم جمع بيانات استفسارات داخلياً،وعدم معرفة نتيجة الحجز الخارجي.

## إعادة تقييم مستقبلية

إضافة محرر Git P1 عند MD-75 وعدم قدرة الفريق على الصيانة؛تقييم separate permissions/review ولا إدخاله الآن. CMS أو booking engine أو realtime availability يحتاج طلباً جديداً وتغيير DEC-001/015؛ليس تحسيناً تقنياً مخفياً. أي مبرمج يقترح بديل يوضح أثره على URLs/SEO/RTL/maintenance ويوقف تغيير العقد حتى القرار.

قبول: التوصية متسقة مع IMPLEMENTATION-CONTEXT،لا اعتماد DB/Supabase/server functions،ولا تكلفة أو SLA أو version مستحدثة غير متحققة.
