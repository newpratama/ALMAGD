# المسافات والشبكة

contract§6؛ قاعدة 4، spacing set4/8/12/16/24/32/48/64/96/128. Container max1200؛ لا صفحات عرض غير محدد.

| مستوى الشاشة | أعمدة تخطيطية | gutter الصفحة | gap الشبكة | section padding block |
|---|---|---|---|---|
| <480 |4 |16 |16 |48 |
|480–767 |4 |24 |16/24 |48/64 |
|768–1023 |8 |24 |24 |64 |
|1024–1279 |12 |32 |32 |96 |
|≥1280 |12 ضمن 1200 |32 minimum خارج الحاوية |32 |96؛hero حتى 128 إن احتاج |

## تطبيقات

نصفان image/text على desktop6+6، tablet4+4،mobile ترتيب نص ثم صورة إلا hero/page حسب spec. card grids3/2/1؛ facilities4/3/2 إذا labels تقرأ وإلا 1 على أضيق عرض. FeaturedMenu3/2/1–2 وفق المحتوى لا عدد ثابت يضغط AR. Long copy max68ch؛ لا ملء الشاشة بنص طويل لمجرد 12cols.

بين eyebrow/title12؛ title/body16؛ body/CTA24؛ cards inner24 desktop و 16 mobile؛ button icon/text8، buttons group12. هذه تفصيلات token-based لا الزام قص النص. radius مستقل عن spacing.

## المحاذاة والاتجاه

inline-start هو حافة النص والشريط؛ RTL يعكس alignment بدون عكس ترتيب حقائق أو صور. العناوين والبطاقات متراصفة؛ لا padding فرعي غير موثق. source order يسهل القراءة عند stack. Header/footer height content-aware؛ fixed CTA reserve actual height بما فيه safe-area.

## الحالات القصوى

320px، أسماء Latin طويلة، وصف Arabic أطول،zoom200/400؛ صف CTA يلتف، tables تصير cards أو scroll محلي معنّون، لا overflow عام. لا اقتطاع سياسة أو اختيار لغة. Gallery صور محفوظة النسبة دون masonry تقفز موضع الفوكس.

قبول: المسافات منالسلم، alignment ثابت عبر ثلاث صفحات/لغات، مقاطع hidden لا margin شبحية، آخر عنصر لا يختفي تحت bar، واستقلال شريط consent عن grid لا يغطي controls.
