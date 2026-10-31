# معلومات وبيانات الدخول وإدارة النظام | ALMAGD Admin Credentials

هذا الملف مرجعي وخاص لإدارة الفندق والمشرفين للرجوع إليه عند الحاجة، ولا يحتوي الكود البرمجي على أي من هذه البيانات.

---

## 1. روابط لوحة التحكم (Admin Panel)

* **الرابط على الإنترنت (Live):** [https://almagd.pages.dev/admin/login](https://almagd.pages.dev/admin/login)
* **الرابط المحلي (Local Dev):** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## 2. حسابات المستخدمين وكلمات المرور (User Accounts)

### أ) حساب الإدارة العامة (Manager / Admin)
* **البريد الإلكتروني:** `newpratama25@gmail.com`
* **كلمة المرور:** `1NP.A@M.com`
* **UUID في سوبابيس:** `601b35d5-484c-4ceb-9eef-668ffd2ec078`
* **الدور والصلاحية:** `manager` (مفعل ونشط 100%)
  * كامل الصلاحيات: التقارير المالية، إشغال الوحدات، إغلاق وفتح الفلل، إدارة الأسعار.

### ب) حساب موظف الاستقبال (Reception)
* **البريد الإلكتروني:** `pratama.res26@gmail.com`
* **كلمة المرور:** `1NP.R@M.com`
* **UUID في سوبابيس:** `c4b003ca-6a68-4c8b-baae-0d7bdadf0afa`
* **الدور والصلاحية:** `reception` (مفعل ونشط 100% - استقبال فقط)
  * إدارة العمليات اليومية: تسكين النزلاء (وصول/مغادرة)، استعراض التقويم والوحدات المشغولة، حالة النظافة، وطباعة السندات (مع حجب التقارير المالية والإعدادات وإجمالي المقبوضات تلقائياً).

---

## 3. إدارة المستخدمين وتأكيد الحسابات عبر سوبابيس (Supabase)

* **رابط مستخدمي سوبابيس:** [Supabase Users Dashboard](https://supabase.com/dashboard/project/cpnvqdodmiacrvldykli/auth/users)

### تفعيل أي مستخدم فوراً (Confirm Email):
إذا ظهرت رسالة `Email not confirmed` عند تسجيل الدخول لمستخدم جديد مسجل عبر الموقع:
1. ادخل إلى الرابط أعلاه في سوبابيس.
2. اضغط على النقاط الثلاث `...` بجانب البريد الإلكتروني.
3. اختر **"Confirm Email"**، وسيتم تفعيله فوراً دون الحاجة للرجوع إلى صندوق البريد الإلكتروني.

### إضافة مستخدم جديد مباشرة بدون طلب تأكيد:
1. من نفس الصفحة اضغط على زر **"Add user"** ثم **"Create user"**.
2. أدخل البريد وكلمة المرور المطلوبة.
3. تأكد من تفعيل خيار **"Auto Confirm User?"** ليكون الحساب مفعلاً على الفور.
4. انتقل إلى جدول `public.staff` في Table Editor وأضف معرف المستخدم `id` وحدد دوره `role` (`manager` أو `reception`).

---

## 4. إعدادات الربط التقني (Supabase Config)

* **Project URL:** `https://cpnvqdodmiacrvldykli.supabase.co`
* **Publishable / Anon Key:** `sb_publishable_y2mTbCDgd2fLoqQuWYn-2w_9sd6z22p`
