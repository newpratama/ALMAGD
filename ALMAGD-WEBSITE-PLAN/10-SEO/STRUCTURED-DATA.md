# البيانات المنظمة — جدول خصائص دون كود

DEC-010/011. المراجع: [Schema.org LodgingBusiness](https://schema.org/LodgingBusiness)،[Restaurant](https://schema.org/Restaurant)،[Google review snippets](https://developers.google.com/search/docs/appearance/structured-data/review-snippet). لا JSON-LD هنا؛ التوصيف لا يثبت تصنيفاً ولا يضمن rich result.

## الكيانات المقترحة

Organization للمجموعة،WebSite،WebPage لكل صفحة،BreadcrumbList للداخل. LodgingBusiness للإقامتين بعد تأكيد الهوية؛ C-05 يمنع اختيارHotel بالافتراض. CafeOrCoffeeShop أوRestaurant بعد اعتماد نوع النشاط وموقعه. Menu وأقسامه وأصنافه من المحتوى المنشور فقط.

| الكيان | الخاصية | المصدر أوالقيمة | شرط |
|---|---|---|---|
| Organization | name/alternateName | ALMAGD/المجد/ALMAGD Hospitality | الوصف ليسlegalName |
| Organization | legalName | PLACEHOLDER F-ALM-06 | MD-02 |
| Organization | url/id | domain وanchor ثابت | MD-07؛هوية ثابتة عبر اللغات |
| Organization | logo | logo معتمد | لا URL لملف غير موجود |
| Organization | address/telephone/email/sameAs | بيانات المجموعة | لا استعارة منvenue بلا قرار |
| WebSite | name/url/publisher | site وOrganization | domain حقيقي |
| WebSite | inLanguage | لغات منشورة | لا locale غير معتمد |
| WebPage | name/description/url/inLanguage | page copy وmetadata | تطابق المرئي |
| WebPage | isPartOf/about | WebSite أوvenue | الجهة الصحيحة |
| BreadcrumbList | itemListElement | ترتيب وروابط الصفحة | نظائر محلية منشورة |
| LodgingBusiness | name/url/id | venue وصفحته | MD-30 للاسم؛لا قانونية مفترضة |
| LodgingBusiness | address | F-NP-03/F-NJD-03 | MD-10 للـNP |
| LodgingBusiness | geo | pin المدخل | MD-11/35؛لا coordinates مشتبهة |
| LodgingBusiness | telephone | venue.phone | رقم فعلي معتمد |
| LodgingBusiness | image | صور المكان | حقوق مثبتة |
| LodgingBusiness | checkinTime/checkoutTime | F-NJD-16 أوNP مؤكد | لا نسخ سياسات |
| LodgingBusiness | amenityFeature | نفس FacilityGrid | حقائق مسموحة فقط |
| LodgingBusiness | numberOfRooms | PLACEHOLDER C-01 | اختياري؛لا4 افتراضاً |
| LodgingBusiness | starRating/priceRange | محجوب | تعارض النجوم وحظر أسعار الغرف |
| LodgingBusiness | parentOrganization | ALMAGD Organization | F-ALM-05؛لا ownership قانوني زائد |
| Cafe | name/url/telephone/image | F-CAFE-01/02 وصور معتمدة | contact/rights gates |
| Cafe | address/geo | PLACEHOLDER | MD-50؛لا وراثة NJD |
| Cafe | openingHoursSpecification | PLACEHOLDER | MD-52 وجدول معتمد |
| Cafe | hasMenu | canonical Menu URL أوMenu | صفحة منشورة |
| Cafe | servesCuisine | PLACEHOLDER | تصنيف إدارة، لا استنتاج مطبخ منصنف |
| Cafe | acceptsReservations | PLACEHOLDER | الاستفسار لايثبت حجز طاولة |
| Menu | name/url/hasMenuSection | الفئات المرئية | لا فئات مخفية |
| MenuSection | name/hasMenuItem | أصناف منشورة | لا uncategorised خام |
| MenuItem | name/description/image | أصل الاسم وحقول معتمدة | لا وصف أوصورة مختلقة |
| MenuItem | offers/priceCurrency/price | سعر منشور وIDR | null/HOLD لاOffer رقمي |
| MenuItem | suitableForDiet | PLACEHOLDER | لا halal/vegetarian بالاستنتاج |

## الحظر

لاaggregateRating أوReview من نصوصOTA حتى لو ظهرbadge منصة؛DEC-011 يحكم. لاHotelRoom URLs أوProduct غرف بأسعار أوReserveAction يوحي بحجز داخلي.

FAQPage ليسمتطلبP0 ولا وعدrich result. المرجع القديم [FAQ documentation](https://developers.google.com/search/docs/appearance/structured-data/faqpage) أعاد التوجيه أثناء المراجعة؛أي دعم أوأهلية يتأكد عندP1،لا يُستنتج من وجودAccordion.

## التحقق لاحقاً

Schema Validator للصحة العامة وRich Results Test للأنواع المدعومة. يراجع fact refs واللغة والـIDs والروابط والحقل المرئي؛0 blocked facts فيschema. إذا حجب الحقول المطلوبة يجعل النوع ناقصاً، يؤجل الكيان المتأثر بدل تعبئةdefaults. لاschema تسويقي على404.
