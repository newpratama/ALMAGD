# وصول تجربة المستخدم

المعيار التعاقدي DEC-027: WCAG 2.2 AA، مع targets ≥44 وفق مطلب المستخدم حتى حيث يجيز المعيار أقل. هذه متطلبات تصميم واختبار؛ لا شهادة توافق أو اختبار منفذ.

## المهام والمخاطر

| المهمة | المتطلب | القبول |
|---|---|---|
| تجاوز التنقل | SkipLink إلى main و landmarks واضحة | أول Tab يكشف الرابط ويعمل |
| قراءة الصفحة | H1 واحد وترتيب عناوين منطقي | قارئ الشاشة يفهم المنشأة والقسم |
| اختيار WhatsApp | اسم إجراء واسم جهة واضحان | الأيقونة ليست المصدر الوحيد للمعنى |
| فتح sheet/dialog | عنوان معروف، focus داخله، background غير تفاعلي | Escape/close يعيدان focus للعنصر الأصلي |
| FAQ | triggers أزرار مع expanded state | Enter/Space وقراءة الجواب دون hover |
| Gallery | alt حقيقي، controls next/previous/close | لا swipe-only؛ موضع واسم الصورة معلوم |
| Menu | قائمة نصية وفئات وأسعار مفهومة | لا صورة menu وحدها ولا جدول صغير يصعب تكبيره |
| تبديل اللغة | أسماء اللغات بألسنتها، language/dir صحيحان | لا علم دولة فقط؛ لا تغير تلقائي |
| consent | قبول/رفض واضحان وتحكم keyboard | رفض لا يعطل الوظائف الأساسية |

## القراءة وإعادة التدفق

تكبير 200% دون فقد النص أو الضوابط؛ 400%/320px reflow دون تمرير أفقي عام. عنوان Arabic يلتف تلقائياً، أسماء Latin والأرقام تُعزل اتجاهياً. لا text truncation يخفي سعر أو سياسة. order البصري يوافق القراءة؛ RTL لا يعكس كل شيء آلياً، logos والصور لا mirror.

الفوكس لا يُغطى بال header أو consent أو booking bar؛ أنشطة تثبيت الشاشة تُراجع عند zoom. اللون ليس الدليل الوحيد للحالة: رمز ونص للحالة أو الرابط underline. لا auto-carousel ولا flashing؛ reduced motion يلغي حركات الانتقال غير الضرورية. لا autoplay audio.

## الأصول الخارجية

OTA توضح تبويباً جديداً؛ WhatsApp يوضح جهة وخدمة؛ Maps link متاح دون embed. فشل خدمة خارجية لا يمنع قراءة العنوان. الوصول للمبنى نفسه حقيقة تجارية منفصلة: لا استخدام wheelchair badge أو accessible room قبل MD-39.

## خطة اختبار

Keyboard كامل، قارئ شاشة NVDA/Firefox أو Chrome و VoiceOver/Safari، TalkBack/Chrome Android، zoom/reflow، contrast، reduced motion، high contrast حيث متاح. تسجيل البيئة والإصدار والسيناريو والنتيجة الفعلية لاحقاً. axe/Lighthouse مساعدان لا بديل مراجعة بشرية. معايير QA تفصيلية في [ACCESSIBILITY-CHECKLIST](../13-QA/ACCESSIBILITY-CHECKLIST.md).

لا أي إخفاق يمنع contact/menu/language يبقى مفتوحاً عند الإطلاق. النتائج الحالية NOT_RUN لأن المرحلة تخطيطية فقط.
