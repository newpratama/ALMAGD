# مواصفات الصور

DEC-022/027؛ PHOTOGRAPHY-DIRECTION للأصل، PERFORMANCE-BUDGET للتحميل. هذه قيم مستهدفة للمشتقات بعد الاستلام،لاقياساتموجودة.

| دور | نسبة | source | responsive widths المقترحة | ميزانية مشتق مستهدف |
|---|---|---|---|---|
| hero D |16:9 |≥3000longedge |768/1280/1920 |≤250KiB عند 1920 |
| hero M |4:5 |crop حقيقيمنأصلكافٍ |480/768 |≤150KiB عند 768 |
| feature |4:3 |≥2000 |480/800/1200 |≤160KiB عند 1200 |
| card/gallerythumb |4:3 |≥2000 |320/480/800 |≤100KiB عند 800 |
| food |1:1 |≥2000 |240/480/800 |≤90KiB عند 800 |
| lightbox |aspect الأصل |≥2000 |1280/2000 |≤300KiB لـ 2000 عندالطلب |
| staticmap |3:2 أو 8:5 |مرخصوبـ pin |480/800/1200 |≤150KiB |
| socialOG |1200×630 |approvedbrand |1200 |≤300KiBJPEG/PNG توافق social |

## إخراج المشتقات لاحقاً

AVIF/WebP مع fallback مناسببواسطة Astroimagepipeline و ResponsiveImage. تحققبصريلا quality رقميأعمى؛لامفعول compression يمسالنصأويشوّهالغرفة. originalsRGBJPEG،nofilterheavy،لاتكبر lowres لتجاوز minimum. الشعار vector عندوصولهلايدخل rasterphotopipeline.

## التحميل

hero واحد highpriority وغير lazy؛كل belowfoldlazy مع width/height/aspect محفوظة. desktop/mobilesources لاتحملمعاًلهيرونفسه. lightboxlarge عندفتحهوليسكل fullres مسبقاً. Alt من content؛decorativeemptyalt فقطإذاحقاًزخرفيلا venueevidence.

focalpoint يحميالسرير والطبق والبناء؛crops لا تخفي عناصر محيط توهم بالخصوصية. لا mirrorimage في AR. strippingEXIF منالمشتقات يزيل GPS/PII،بينما originalrightsmetadata محفوظ داخلياً.

قبول:حدود size وأبعاد التحميل مقاسة بالصفحة والشبكة،صور واضحةعلى DPR2 دون overserve،noCLS،rights/altapproved،ولا assetplaceholder في production. إنتعذر target مع quality سليميسجل الاستثناء ودليله ولا يرفع الميزانية بصمت.
