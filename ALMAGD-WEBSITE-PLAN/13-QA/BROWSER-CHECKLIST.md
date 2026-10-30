# فحص المتصفحات

NOT_RUN؛تسجل الإصدارات وقت الاختبار. تغطية مقترحة:آخر نسختين stable حيث متاح،ولا وعد دعم متصفح قديم دون قرار.

| البيئة | الرئيسي | الإضافي |
|---|---|---|
| Chrome/Edge desktop | nav/dialog/menu/consent | network/Lighthouse |
| Firefox desktop | keyboard/focus/layout | NVDA عند توفره |
| Safari macOS | fonts/RTL/external links | VoiceOver |
| Safari iOS | safe-area/bar/sheet/WhatsApp | orientation و VoiceOver |
| Chrome Android | mobile/menu/WhatsApp | TalkBack وشبكة بطيئة |
| social in-app browser | قراءة وتواصل smoke | P1 عند توفر بيئة |

- [ ] BRW-01 المحتوى والروابط يعملان عند script failure.
- [ ] BRW-02 رابط خارجي user-initiated لا يعتمد popup مؤجلاً.
- [ ] BRW-03 WhatsApp رقم ورسالة صحيحان؛لا افتراض كشف التطبيق المثبت.
- [ ] BRW-04 tel/mailto يراعيان handler دون وعد نجاح اتصال.
- [ ] BRW-05 image fallback وخط بديل مقروءان دون overserve.
- [ ] BRW-06 إغلاق modal يحرر body ويعيد focus.
- [ ] BRW-07 Arabic/Latin/phone/IDR سليم على Safari و Firefox.
- [ ] BRW-08 private mode أوتخزين غير متاح لايتيح GA افتراضياً.
- [ ] BRW-09 zoom/reduced motion و dynamic viewport لاتقطع CTA.
- [ ] BRW-10 real404/redirects تفحص على host لا local dev وحده.

البيئة غير المتاحة NOT_RUN/BLOCKED معسبب؛emulation لاتساوي اختبار iOS حقيقي. لايلزم تطابق كل pixel،لكن القراءة والرحلات تنجح. يحفظ التقرير OS/browser/version/revision وتاريخ وخطوات.
