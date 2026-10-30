# سجل الأصول والـ slots

حالة الاستلام الآن NOT_RECEIVED؛ لم يتم تنزيل أو إنشاء صور. assetid أدناه معرّف تخطيطي يُستبدل/يربط بسجل galleryImage بعد استلام الملف، وليس ادعاء وجوده.

| Slot ID | الجهة/النوع | الاستخدام | الحد الأدنى | الحالة / blocker |
|---|---|---|---|---|
| alm-logo |brand |header/footer/favicon |logo أو interimwordmark معتمد |MISSING؛MD-01 لا blocker للـ wordmark |
| alm-og |brand |defaultOG1200×630 |1 تصميممنصور/هويةحقوقهاواضحة |PLACEHOLDER؛launchsocialgate |
| np-hero /np-card |NP |hero/card |1 أو 2 مشتقات من أصل مناسب |NOT_RECEIVED؛MD-19 |
| np-gallery |NP |rooms/gallery |≥12 صورفريدةإجمالاً |NOT_RECEIVED؛MD-19/72 |
| njd-hero /njd-card |NJD |hero/card |1 أو 2 مشتقات |NOT_RECEIVED؛MD-40 |
| njd-gallery |NJD |rooms/gallery |≥15 فريدةإجمالاً |NOT_RECEIVED؛MD-40/72 |
| cafe-hero /cafe-interior |Cafe |hero/about |exterior+interior |NOT_RECEIVED؛MD-62 |
| cafe-featured-01…06 |Cafe |featured/menu |≥6 مستحسن |NOT_RECEIVED؛MD-59؛grid يمكنحجبها |
| location-map-np/njd/cafe |maps |staticfacade |1 لكل pinconfirmed |PLACEHOLDER؛pin/licensing |
| area-puncak |area |Explore/Location |optional |PLACEHOLDER؛licensed،notvenue |
| fonts-latin/ar |font |self-hostedtype |woff2weights/subsets المستخدمة |NOT_RECEIVED؛license/checklater |
| gallery-set |cross |Gallery |≥30approvedunique |NOT_RECEIVED |

## حقولالسجللاحقاً

id،filename،venueId/topic،roomTypeId إنينطبق،width/height/aspect،capturedate،owner/photographer،rightsbasis/documentref،releaseifpeople،alloweduses،expiry إنوجد،focalpointD/M،alt3locales،caption،approvalby/date،status،sourceoriginal/derivatives،sizebytes لكلمشتق.

عدم إرسال الصورة لا يثبت rights=true؛موافقة شفوية غير مسجلة لا يستنتجها النموذج. حقوق thumbnail تتبعالأصل؛publicURL ليس license. catalogphotos و socialphotos أدلةوجودفقطلا assetsreceived.

## تتبعالاستلام

الإدارةتملأسجل batch،المراجعيتأكداسم venue والنوع،QA يفحصحقوقالناس/الميتاداتا،editor يعتمد alt،tech لاحقاًيقيسالمشتقات. ليسهناكحقلفي CONTENT-MODEL للـ roomTypeId داخلال gallery؛تحفظ مطابقة النوع في images للـ room وسجلداخليدون تغيير entity.

قبول:لا أصلبلا id/rights،لا صوريتيمة،noincorrectassociation،countunique لا derivative؛metadataPII يزال من مشتقات الإنتاج لاحقاً. الأصلمحفوظولا overwrite.
