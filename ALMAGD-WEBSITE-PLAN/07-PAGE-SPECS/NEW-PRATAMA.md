# NEW PRATAMA — صفحة المنشأة

P0 /properties/new-pratama؛ template property. copy [NEW-PRATAMA-CONTENT](../05-CONTENT/NEW-PRATAMA-CONTENT.md). DEC-009: لا URLs مستقلة للأنواع. كل Section ID canonical من URL-STRUCTURE.

| Section ID | الغرض / component | العنوان | CTA | الصورة / ratio | Desktop / Tablet / Mobile | RTL |
|---|---|---|---|---|---|---|
| hero | هوية / HeroPage | New Pratama Villa H1 | WhatsApp NP | ≥3000؛16:9 D/T،4:5 M | overlay محدود / نفسه / stack | start؛ crop مستقل |
| stay-switcher | مقارنة / Link | Our stays | NP/NJD | — | pills / wrap / wrap | اتجاه منطقي |
| overview | تعريف / IntroBlock | Overview | — | optional 2000×1500؛4:3 | نص 7+صورة 5 / نصفان / stack | start |
| rooms | خيارات / RoomCardList + RoomDetailDialog | Stay options | details + WA مع النوع | 1600×1200؛4:3 | 3 / 2 / 1 | أسماء Latin؛ أرقام مستقلة |
| facilities | مرافق / FacilityGrid | Facilities | — | — | 4 / 3 / 2 | icon ثابت، label start |
| gallery | دليل بصري / GalleryGrid + Lightbox | Gallery | more photos | 1600×1200؛4:3 | 3 / 2 / 1 | controls اتجاهية فقط mirror |
| location | وصول / MapCard + AttractionList | Location | directions | 1200×800؛3:2 | map نصف+نص / نصفان / stack | map لا mirror |
| policies | توقعات / PolicyList | Good to know | — | — | 2 / 2 / 1 | ترتيب عربي منطقي |
| faq | إجابات / FAQAccordion | FAQ | Contact إذا معتمد | — | text68ch / نفسه / كامل | button كامل لا hover |
| book | تحويل / BookingPanel + CTASection | Book or ask | WA أولاً ثم OTA معتمدة | — | panel جانبي اختياري / sheet+bar / sheet+bar | رقم LTR، label wrap |
| related | المجموعة / CollectionGrid | Also in The ALMAGD Collection | NJD/Cafe |1600×1200؛4:3 |2 /2 /1 | لا nearby غير مثبت |

## بيانات وشرط الإطلاق

MD-10/11/12/19/72، الأنواع MD-13/14/15 blockers لقسم rooms. Facilities F-NP-16…22 غير منشورة حالياً؛ المقطع محجوب بالكامل حتى تأكيد مفيد. لا نقل مواعيد NJD. NP ratings غير صالحة حالياً ولذلك لا قسم ratings إلزامي. Agoda الرابط يحتاج MD-18؛ Tiket رابط مفقود.

## تفاعلات وقبول

bar <1024 ارتفاع 64+safe-area وفق NAVIGATION/MOBILE-UX، floating direct desktop فقط عند غياب bar. Dialog يبدأ بعنوان النوع، صور ثم حقائق، close وفوكس؛ لا price/date/payment. room_detail_open event يعبر عن الفتح فقط. property_view venue=new_pratama مرة لكل page load مقاس. Placeholder types لا تُعرض للإنتاج؛ مقاطع مخفية لا anchors navigation ميتة. ≥12 صور أصلية معتمدة إطلاقاً وفق MD-19، كلها تطابق المنشأة ولا توحي بميزة محجوبة.
