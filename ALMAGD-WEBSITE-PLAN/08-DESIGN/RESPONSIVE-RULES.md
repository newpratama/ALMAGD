# قواعد الاستجابة

Breakpoints من العقد:480/768/1024/1280/1536؛mobile-first في التنفيذ اللاحق. [NAVIGATION](../04-INFORMATION-ARCHITECTURE/NAVIGATION.md) مرجع header والشريط. لا تغيير العتبات من ملف إلى آخر.

| السياق | <768 | 768–1023 | ≥1024 |
|---|---|---|---|
| header |60؛اللغة داخل MobileNav |لغة مختصرة و WA و burger |72 وقائمة كاملة |
| hero |4:5 وعنوان 32/40 |16:9 وحجم وسيط |16:9 و display64 |
| cards |1؛food قد 2 إن اتسع |2 |3،والإقامات 2 |
| feature |stack |نصفان إذا قرئ النص |نصفان |
| facilities |2 أو 1 للنص الطويل |3 |4 |
| property bar |64+safe-area؛WA60% و Book |نفسه |لا bar؛floating direct |
| Cafe bar |WhatsApp و Menu |نفسه |floating direct |
| Menu |floating direct Cafe |نفسه |نفسه |
| breadcrumbs |رابط عودة |كامل |كامل |
| dialog |عرض مناسب للشاشة،scroll داخلي |حد متوسط |max800 للغرفة إن مناسب |

## اتجاه ومحتوى

العرض الفعلي والتكبير يحكمان reflow؛landscape ليس desktop تلقائياً. هدف 44 محفوظ مع pointer coarse،والـ hover لايكشف معلومة وحيدة. ارتفاع النص يتوسع مع Arabic،ولا fixed height يقطع سياسة أواسم.

مصادر الصور من IMAGE-SPECS؛النسبة محفوظة و crop للهاتف إذا احتاج. الجداول تتحول إلى cards أو scroll محلي معنّون دونتصغير الخط. لا تحميل 3000px على 360px بلاسبب.

## طبقات ثابتة

bar يخفي floating؛consent يدفع CTA أعلى أو يخفيه مؤقتاً عندضيق. Dialog يخفي CTA الثابت أثناءالفتح. نهايةالمحتوى تحجزالارتفاع الفعلي،و focus لايغطى. RTL يستخدم start/end؛الأسهم فقط mirror.

قبول: screenshots320/390/768/1024/1280/1536 ولغات 3،orientation و zoom200/400 وحالاتمحتوىطويل أوغائب. هذه خطة لم تفحص واجهة فعلية.
