# الروابط الداخلية لمحركات البحث

مصدر ملزم [INTERNAL-LINKING](../04-INFORMATION-ARCHITECTURE/INTERNAL-LINKING.md). المصفوفة الموجودة تحكم الوجهات؛هذا الملف يحدد القبول ولا ينشئ هيكلاً جديداً.

| مسار | anchor مقترح | الغرض |
|---|---|---|
| Home→Properties | Explore our stays | اختيار إقامة |
| Home/About→venues | اسم المنشأة | اكتشاف المجموعة |
| Properties→NP/NJD | View {Venue} | تقييم المكان |
| venue→#rooms/#policies/#book | تسمية القسم | وصول لمحتوى حاضر |
| venue→other stay/Cafe | Also by ALMAGD | ارتباط محايد |
| Cafe→Menu | View the NJD Cafe menu | الأصناف والأسعار |
| Menu→Cafe/Location/Contact | تسمية الصفحة | متابعة الزيارة |
| Gallery image→venue | View {Venue} | تعريف الصورة |
| Location/Contact→venue | اسم المنشأة | تفاصيل |

## قواعد

كل رابط يتبع لغة الصفحة والأزواج المنشورة. nav/footer لا يغنيان عن رابط سياقي مفيد،ولا يفرض ذلك تكرار عشرات الروابط. on-site/nearby/at Villa NJD مشروطة بـ C-08/MD-50؛الحالي Also by ALMAGD.

مستهدف المشروع: الوصول إلى P0 من Home خلال≤3 خطوات. Menu مرتبطة مباشرة بـ Cafe/Footer. FAQ/Offers لا روابط قبل نشرهما. غرفة أوفلتر معرض ليس URL قابل للفهرسة؛hash فقط إذا يعمل.

## QA

destination status صالح،لا redirect chains في الروابط الداخلية،لا anchors ميتة،نصوص descriptive،لغة صحيحة. حذف section يحذف رابطها؛لا nofollow للروابط الداخلية العادية. RTL يعكس سهم breadcrumb لااسم URL.

قبول: المصفوفة مغطاة بصياغة محايدة،ولا keywords لمرافق محجوبة أو links لصفحات future.
