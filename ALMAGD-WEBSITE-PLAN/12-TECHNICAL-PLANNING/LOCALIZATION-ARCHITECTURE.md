# معمارية اللغات

DEC-012/013؛[TRANSLATION-PLAN](../05-CONTENT/TRANSLATION-PLAN.md). static generation لنظائر الصفحة المعتمدة فقط؛لا browser/IP redirect،لا runtime translation API،ولا DB.

| مستوى | المفتاح | المسؤولية |
|---|---|---|
| entity | L10n id/en/ar | title/summary/description والحقائق التحريرية |
| UI | ui strings مشتركة | nav/CTA/accessibility/consent/errors |
| page prose | page.locale Markdown | About/Privacy/Location long text |
| route map | pageId + locale | path canonical + available alternates |
| presentation | locale language/direction | Arabic RTL،Latin LTR |

ID أصل مطلوب؛EN/AR مطلوبان عندما الصفحة منشورة فيهما. نفس published-pair map يغذي nav/switcher/sitemap/hreflang/canonicals لتجنب اختلاف الجاهزية. no default content fallback لصفحة غير معتمدة. root/ en/ ar patterns تتبع URL-STRUCTURE حرفياً دون slash إضافي.

## الصفحات غير المتاحة

Switcher يوضح home fallback صراحة كما NAVIGATION؛لا يوجه إلى غير مترجم كأنه target page. لا sitemap/alternate/card لصفحة غير منشورة في لغة. قرار launch all3 الافتراضي لا يحول placeholder translations إلى approved؛MD-70/71 blockers،وأي اختلاف launch scope يقره المالك قبل النشر.

## RTL والنصوص

مكونات مشتركة logical start/end،DOM order مستقل عن visual direction،mirror للأسهم فقط،لا mirrored photos/logos. names Latin،phone/IDR/times/coordinates معزولة اتجاهياً،لا ترجمة رسمية address. الخط العربي self-hosted،form fields غير منطبقة P0،WhatsApp messages localized من CTA-COPY.

## الاختبار

key parity للواجهة،required locale fields،truncation،plural/number/date formatting،same-page switcher،head/meta/schema language،ar reflow/dialogs/price rows. numeric data لا يكتب ثلاث مرات بصيغ مخزنة مختلفة؛formatting يقابل language approved.

[Astro i18n](https://docs.astro.build/en/guides/internationalization/) مرجع helpers؛version-specific details تتأكد T-01؛لا reliance على fallback framework حين سياسة المشروع تمنعه. 404 local handling يحسم host proof،لا إضافة runtime لتجاوز قرار static.
