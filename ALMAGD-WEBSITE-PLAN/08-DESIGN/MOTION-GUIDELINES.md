# إرشادات الحركة

DEC-022/025/027. الحركة توضح الحالة؛P0 صور أولاً ولافيديو hero. المدد التالية مواصفات لاكود.

| عنصر | حركة مسموحة | مدة مقترحة | reduced motion |
|---|---|---|---|
| Button/Link |لون وحد فقط |100–150ms |فوري |
| dropdown/chooser |opacity وإزاحة≤8px |150–200ms |ظهورفوري |
| MobileNav |من inline-end |200ms |بلا slide |
| FAQ |تبديل دونفقد focus |≤150ms أوفوري |فوري |
| Lightbox |تبديل دون zoom إجباري |100ms |فوري |
| anchor |تمرير لطيف اختياري |سلوكالمتصفح |فوري |

## القيود

لا parallax أو auto-slider أو scroll-jacking أو bounce CTA أو flashing أو animated counters. المحتوى لايبدأ مخفياً بحيث يصبحفشل JS صفحةفارغة. الحركة لا تغير موضع المحتوى بمايرفع CLS.

الفيديو P1 للـ Home desktop فقط:≤12s و≤2.5MB،muted،poster هو LCP،لا Save-Data/2G/3G/reduced-motion. حركةتلقائية طويلة لها pause control44؛لا audio تلقائي ولافيديو mobile.

## الاتجاه والحالة

RTL يعتمد inline-end للحركة ولايعكسالصورة. Dialog ينقل focus عندالفتح دونانتظار animation يمنعالتصرف،ويغلق Escape فوراً. لا dialog مزدوج معضغطمتكرر. تحميل Map facade لهحالةونصخطأ؛لا spinner بلاشرح.

قبول: OS reduced-motion محترم،والمهام نفسها تنجح بدونه،ولا CLS أو focus محجوب. الحاجة لحركة جديدة توثقفيالمكون قبل تنفيذها.
