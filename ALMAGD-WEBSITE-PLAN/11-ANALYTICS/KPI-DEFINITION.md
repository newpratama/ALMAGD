# تعريف مؤشرات الأداء

الأهداف من BUSINESS-GOALS؛ كل baseline أوtarget تجاري PLACEHOLDER / NEEDS_OWNER_DECISION. حدود الأداء DEC-027 معتمدة، لكنها لا تعني توقع مبيعات.

| KPI | التعريف والحساب | المصدر | الحد |
|---|---|---|---|
| measured sessions | جلسات GA4 بعد الموافقة في الفترة | GA4 | عينة مقاسة، ليست كل الزيارات |
| venue interest | جلسات property_view لكل جهة | GA4 | اهتمام بصفحة، لا إقامة |
| WhatsApp CTR | جلسات click_whatsapp للجهة ÷ جلسات قراءة صفحتها | GA4 | لا message sent |
| OTA CTR | جلسات click_ota للجهة ÷ جلسات قراءة صفحتها | GA4 | لا booked |
| outbound union rate | اتحاد جلسات WA أوOTA أوphone ÷ جلسات السياق | GA4 | لا جمع النسب أوتكرار الجلسة |
| menu engagement | جلسات category select ÷ جلسات menu_view | GA4 | اختيار الفئة اختياري |
| directions CTR | جلسات directions ÷ جلسات صفحات الوصول المعنية | GA4 | لا وصول فعلي |
| organic clicks/CTR | GSC clicks؛clicks ÷ impressions | GSC | نفس فترة ونطاق query/page |
| indexed pages | صفحات canonical صالحة مفهرسة | GSC | لا رقم متوقع الآن |
| CWV | p75 mobile: LCP≤2.5s،INP≤200ms،CLS≤0.1 | field data حين تتاح | لا p75 منlab |
| lab quality | Lighthouse mobile≥90 بكل الفئات | تقارير lab | NOT_RUN الآن |
| data quality | أحداث مكررة أوPII أوmisrouting | QA | هدف0 عيوب حرجة |

## التقرير

فترة وتاريخ ومنطقة زمنية لحساب GA4 يحددها المالك؛ لا تنسخ timezone بيئة المستخدم إلى مشروع Bogor تلقائياً. baseline مقترح لأول28 يوماً بعد الإطلاق، مع حجم العينة ونسبة نقص البيانات. الأهداف التجارية تعتمد لاحقاً من الإدارة.

عند غياب بيانات field كافية، يسجل NOT_AVAILABLE لا0. استبعاد bots والزيارات الداخلية يراجع كي لا يحذف زيارات حقيقية. لا ROI أوcost per booking دون تكلفة ونتيجة حجز مثبتتين.

قياس consent acceptance ليس بتعقب denied users علىGA4؛ إن طلبته الإدارة يحتاج تصميماً مستقلاً للخصوصية. المسؤول MD-75 واسم صاحب التقرير PLACEHOLDER.

قبول: كل KPI له بسط ومقام وفترة وسياق؛ لا تعرض النقرات كضيوف، ولا تجعل العينة المقاسة ممثلة لجميع الزوار بلا تحفظ.
