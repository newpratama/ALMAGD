# FOOTER — المكونات العامة و 404

P0 global SiteFooter؛ مصادر [NAVIGATION](../04-INFORMATION-ARCHITECTURE/NAVIGATION.md)، CONTACT-CONTENT، DEC-010/012/019/023.

| Section ID | الغرض / component | العنوان | CTA | صورة / ratio | Desktop / Tablet / Mobile | RTL |
|---|---|---|---|---|---|---|
| footer-brand | هوية / SiteFooter | ALMAGD + tagline | locale home |logo lockup≥120wide؛لا photo |عمود /نصف /كامل | lockup وفق LOGO-REQUIREMENTS |
| footer-stays | تنقل / Link | Stays | صفحتان + properties | — |عمود /نصف /قائمة |start |
| footer-dining | طعام / Link | Dining | Cafe/Menu | — |عمود /نصف /قائمة |start |
| footer-almagd | مجموعة / Link | ALMAGD | About/Gallery/Location/Contact | — |عمود /نصف /قائمة |start |
| footer-contact | قنوات / ContactCard + SocialStrip | Contact per venue | WA/phone موثقة | — |wrap /wrap /stack | أرقام LTR |
| footer-legal | حقوق / Link + RichText | Privacy Policy | /privacy؛consent settings | — |صف /wrap /stack |legal name exact |
| footer-language | اللغة / LanguageSwitcher | ID/EN/AR | نظير الصفحة المنشور | — |صف /wrap /stack |labels native |

## شروط مشتركة

خلفية Pine ونص Mist، contrast الأفعال ظاهر، decorative brass فقط. corporate socials/address/email مخفية إلى بيانات مؤكدة. © يحمل صاحب الحقوق المعتمد MD-02 وسنة النشر؛ لا تلميح أن ALMAGD legalName تلقائي. Offers/FAQ روابط فقط عندما live في أولوية لاحقة. WhatsApp/footer يختار الجهة؛ لا corporate number مختلق. Height تلقائي ولا accordion إلزامي لإخفاء كل الروابط على الهاتف.

## 404 — template error

| Section ID | الغرض / component | العنوان | CTA | صورة | Desktop / Tablet / Mobile | RTL |
|---|---|---|---|---|---|---|
| error | إيضاح / HeroPage + RichText | Page not found H1، نسخة ALMAGD-CONTENT | home؛properties؛contact | لا صورة |text68ch /نفسه /كامل | locale وفق prefix |
| error-help | بدائل / Link | روابط واضحة | /gallery أو Cafe/Menu | — |row /wrap /stack |start |

404 response فعلي، noindex، ليست 200 SPA fallback؛ لا canonical إلى Home. shell header/footer و floating group حسب NAVIGATION، كلها تعمل. Static hosting locale-aware error presentation تحتاج تحقق host؛ إن لم يتحقق تحديد اللغة عند المسار يسجل blocker التقني ويطبق صفحة error متعددة اللغة معتمدة، لا إضافة runtime server دون قرار.

قبول: links كلها منشورة، legal/controller placeholder يمنع Privacy readiness، tab order واضح، 404 غير مدرجة في XML sitemap، ونظائر /en و/ar صحيحة عند خطأ المسار.
