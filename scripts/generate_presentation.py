import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    C_NAVY = RGBColor(15, 30, 54)        # #0F1E36
    C_NAVY_LIGHT = RGBColor(26, 47, 82)  # #1A2F52
    C_GOLD = RGBColor(197, 168, 105)     # #C5A869
    C_GOLD_DARK = RGBColor(163, 134, 75)
    C_WHITE = RGBColor(255, 255, 255)
    C_BG_OFFWHITE = RGBColor(248, 250, 252) # #F8FAFC
    C_SLATE = RGBColor(71, 85, 105)      # #475569
    C_SLATE_LIGHT = RGBColor(241, 245, 249) # #F1F5F9
    C_CARD_BORDER = RGBColor(226, 232, 240)
    C_EMERALD = RGBColor(16, 185, 129)   # #10B981
    C_AMBER = RGBColor(245, 158, 11)     # #F59E0B
    C_CRIMSON = RGBColor(239, 68, 68)    # #EF4444
    C_BLUE = RGBColor(59, 130, 246)      # #3B82F6

    def add_bg(slide, color):
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = color
        shape.line.fill.background()
        return shape

    def add_header(slide, title, category="ALMAGD PMS · نيو براتاما الفندقي", dark=False):
        # Category label
        tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
        p_cat = tb_cat.text_frame.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = C_GOLD if dark else C_GOLD_DARK

        # Main Title
        tb_t = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.8))
        p_t = tb_t.text_frame.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(22)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE if dark else C_NAVY

        # Gold divider line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.73), Inches(0.03))
        line.fill.solid()
        line.fill.fore_color.rgb = C_GOLD
        line.line.fill.background()

    def add_card(slide, left, top, width, height, bg_color=C_WHITE, border_color=C_CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        return card

    # ==========================================================
    # SLIDE 1: Title & Hero
    # ==========================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1, C_NAVY)

    # Decorative gold frame
    f1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
    f1.fill.solid()
    f1.fill.fore_color.rgb = C_NAVY_LIGHT
    f1.line.color.rgb = C_GOLD
    f1.line.width = Pt(2)

    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.4), Inches(10.9), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "مجمع نيو براتاما الفندقي · بونشاك | ALMAGD Hospitality"
    p0.font.size = Pt(14)
    p0.font.bold = True
    p0.font.color.rgb = C_GOLD
    p0.alignment = PP_ALIGN.CENTER

    p1 = tf.add_paragraph()
    p1.text = "الدليل التشغيلي الشامل لنظام إدارة العمليات الفندقية"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p1.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = "شرح عملي وتطبيقي لكافة السيناريوهات الـ 24 المعتمدة للاستقبال والإدارة"
    p2.font.size = Pt(16)
    p2.font.color.rgb = RGBColor(203, 213, 225)
    p2.alignment = PP_ALIGN.CENTER

    p3 = tf.add_paragraph()
    p3.text = "\n\nنظام إدارة الحجوزات PMS v1.0 | الرابط الحي: almagd.pages.dev/admin"
    p3.font.size = Pt(12)
    p3.font.color.rgb = C_GOLD
    p3.alignment = PP_ALIGN.CENTER

    # ==========================================================
    # SLIDE 2: Objectives & Roles
    # ==========================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2, C_BG_OFFWHITE)
    add_header(s2, "الأهداف التشغيلية ومصفوفة الصلاحيات (Roles Matrix)")

    # Left: 3 Objectives
    add_card(s2, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    tb = s2.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🎯 الأهداف الثلاثة للتشغيل الاحترافي"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = C_NAVY

    items = [
        ("1. منع الحجز المزدوج نهائياً (Zero Overbooking)", "قاعدة البيانات تمنع بيع نفس الغرفة في نفس التواريخ ثانية بثانية وتفحص التضارب آلياً."),
        ("2. دقة الصندوق والتحصيلات (100% Cash Reconciliation)", "فرز واضح بين الكاش الفعلي في الدرج، والتحويلات البنكية، ومستحقات التطبيقات."),
        ("3. جاهزية الغرف قبل التسليم (Housekeeping Quality)", "لا يستلم أي نزيل غرفة إلا بعد اكتمال تنظيفها وتأكيد جودتها بعلامة ✨ جاهزة.")
    ]
    for h, b in items:
        p_h = tf.add_paragraph()
        p_h.text = f"\n{h}"
        p_h.font.size = Pt(13)
        p_h.font.bold = True
        p_h.font.color.rgb = C_GOLD_DARK
        p_b = tf.add_paragraph()
        p_b.text = b
        p_b.font.size = Pt(11)
        p_b.font.color.rgb = C_SLATE

    # Right: Roles
    add_card(s2, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0))
    tb2 = s2.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.1), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "👥 توزيع المهام والصلاحيات"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = C_NAVY

    roles = [
        ("موظف الاستقبال (Reception Pratama):", "• إنشاء الحجوزات المباشرة وتسكين النزلاء (Check-in)\n• تمديد الإقامة، ونقل الغرف، وتسجيل المغادرة\n• تسجيل الدفعات النقدية وطباعة سندات القبض\n• تحديث دورة نظافة الغرف بنقرة زر"),
        ("مدير الفندق (Manager Pratama):", "• مراجعة واعتماد الحجوزات والتسويات المالية\n• الاطلاع على إجمالي صندوق الدرج وكشف المقبوضات\n• تصدير تقارير الإشغال اليومية والشهرية إلى Excel\n• إدارة أسعار الفلل وإغلاقات الصيانة وحذف الحجوزات")
    ]
    for r_title, r_desc in roles:
        p_h = tf2.add_paragraph()
        p_h.text = f"\n{r_title}"
        p_h.font.size = Pt(13)
        p_h.font.bold = True
        p_h.font.color.rgb = C_BLUE if "الاستقبال" in r_title else C_GOLD_DARK
        p_d = tf2.add_paragraph()
        p_d.text = r_desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = C_SLATE

    # ==========================================================
    # SLIDE 3: Today Dashboard
    # ==========================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3, C_BG_OFFWHITE)
    add_header(s3, "لوحة التحكم اليومية — مركز القيادة الأمامي (Today Page)")

    # 4 KPI Cards
    kpis = [
        ("الإشغال اليومي (Occupancy)", "نسبة مئوية حية", "توضح عدد الغرف المشغولة من إجمالي الغرف العاملة وتستثني المغلق للصيانة.", C_GOLD),
        ("وصول اليوم (Arrivals)", "قائمة القدوم المجدول", "توضح مواعيد وصول النزلاء وحالة السداد وجاهزية الغرفة للنظافة.", C_NAVY),
        ("مغادرة اليوم (Departures)", "قائمة المغادرة", "توضح مواعيد الخروج، وفحص الرصيد المتبقي لتحصيله قبل خروج الضيف.", C_SLATE),
        ("النزلاء المقيمون (In-House)", "الفلل والغرف المشغولة", "جدول تفصيلي بالنزلاء الساكنين حالياً مع أرقام هواتفهم ومصادر حجوزاتهم.", C_EMERALD),
    ]
    card_w = Inches(2.7)
    for i, (k_t, k_s, k_d, col) in enumerate(kpis):
        left = Inches(0.8 + i * 2.95)
        add_card(s3, left, Inches(1.8), card_w, Inches(2.4), bg_color=C_WHITE)
        tb = s3.shapes.add_textbox(left + Inches(0.15), Inches(1.9), card_w - Inches(0.3), Inches(2.2))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = k_t
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = col
        p_sub = tf.add_paragraph()
        p_sub.text = k_s
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = C_SLATE
        p_d = tf.add_paragraph()
        p_d.text = f"\n{k_d}"
        p_d.font.size = Pt(10)
        p_d.font.color.rgb = C_NAVY

    # Lower big card: Housekeeping bar & Overdue alerts
    add_card(s3, Inches(0.8), Inches(4.5), Inches(11.73), Inches(2.3))
    tb_low = s3.shapes.add_textbox(Inches(1.1), Inches(4.7), Inches(11.1), Inches(1.9))
    tf_l = tb_low.text_frame
    tf_l.word_wrap = True
    p = tf_l.paragraphs[0]
    p.text = "⚡ أدوات التنبيه الذكية في شاشة اليوم"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_NAVY

    p1 = tf_l.add_paragraph()
    p1.text = "• شريط متابعة النظافة الفوري (Housekeeping Panel): يعرض في الأعلى عدد الغرف النظيفة ✨، والتي جاري تنظيفها 🧼، والتي تنتظر التنظيف 🧹 بنقرة واحدة."
    p1.font.size = Pt(12)
    p1.font.color.rgb = C_SLATE

    p2 = tf_l.add_paragraph()
    p2.text = "• شريط المتأخرات الأحمر (Overdue Bookings Alert): ينبه فوراً عن النزلاء الذين تجاوزوا موعد الخروج المحدد أو حجوزات لم تحضر في موعدها لحسم موقفهم فوراً."
    p2.font.size = Pt(12)
    p2.font.color.rgb = C_CRIMSON

    # Save initial version
    os.makedirs("dist", exist_ok=True)
    out_path = "ALMAGD_PMS_Operational_Guide.pptx"
    
    # Helper for 2-column scenario slide
    def make_scenario_slide(title, scen_num_title, scen_body, right_title, right_body, highlight_note):
        slide = prs.slides.add_slide(blank_layout)
        add_bg(slide, C_BG_OFFWHITE)
        add_header(slide, title)

        # Left Card
        add_card(slide, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.3))
        tb_l = slide.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(3.8))
        tf_l = tb_l.text_frame
        tf_l.word_wrap = True
        p = tf_l.paragraphs[0]
        p.text = scen_num_title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p_desc = tf_l.add_paragraph()
        p_desc.text = f"\n{scen_body}"
        p_desc.font.size = Pt(11.5)
        p_desc.font.color.rgb = C_SLATE

        # Right Card
        add_card(slide, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.3))
        tb_r = slide.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.1), Inches(3.8))
        tf_r = tb_r.text_frame
        tf_r.word_wrap = True
        p = tf_r.paragraphs[0]
        p.text = right_title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p_desc = tf_r.add_paragraph()
        p_desc.text = f"\n{right_body}"
        p_desc.font.size = Pt(11.5)
        p_desc.font.color.rgb = C_SLATE

        # Bottom Highlight Pill
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.3), Inches(11.73), Inches(0.8))
        pill.fill.solid()
        pill.fill.fore_color.rgb = C_NAVY
        pill.line.fill.background()
        tb_p = slide.shapes.add_textbox(Inches(1.0), Inches(6.4), Inches(11.3), Inches(0.6))
        p_p = tb_p.text_frame.paragraphs[0]
        p_p.text = f"💡 قاعدة تشغيلية للاستقبال: {highlight_note}"
        p_p.font.size = Pt(12)
        p_p.font.bold = True
        p_p.font.color.rgb = C_GOLD

    # ==========================================================
    # SLIDE 4: Scenarios 1 & 2
    # ==========================================================
    make_scenario_slide(
        "دورة الحجز الأساسية — الحجز المباشر والسريع",
        "السيناريو 1: حجز مباشر جديد (Walk-in)",
        "• ضيف يصل للاستقبال أو يتواصل عبر الهاتف/الواتساب.\n• يضغط الموظف «+ حجز جديد» ويحدد التواريخ.\n• النظام يعرض فقط الوحدات الشاغرة ويمنع أي تضارب.\n• إمكانية تسجيل دفعة أولى كاش أو تحويل بنكي.\n• إصدار كود تسلسلي فوري وتحديث التقويم لحظياً.",
        "السيناريو 2: حجز سريع لنزيل مسجل مسبقاً",
        "• ضيف سبق له الإقامة في الفندق.\n• كتابة أول حرفين من اسمه أو هاتفه في خانة الضيف.\n• استرجاع كافة بياناته وهويته وتفضيلاته تلقائياً.\n• ظهور وسام VIP الذهبي للنزلاء المتميزين.\n• توفير وقت الاستقبال وعدم تكرار إدخال البيانات.",
        "كل حجز يتم حفظه يقفل الغرفة على الفور في التقويم ويحميها من البيع المزدوج."
    )

    # ==========================================================
    # SLIDE 5: Scenarios 3, 4, 5
    # ==========================================================
    make_scenario_slide(
        "دورة الحجز الأساسية — الوصول والمغادرة والتحذير المالي",
        "السيناريو 3 و 4: التسكين والمغادرة المعتادة",
        "• تسجيل الوصول (Check-in): التحقق من نظافة الغرفة أولاً ثم ضغط زر «الوصول» لنقل الحجز لقائمة المقيمين.\n• تسجيل المغادرة (Check-out): عند انتهاء مدة الإقامة وسداد كامل الحساب، يضغط الموظف زر «المغادرة» بنقرة واحدة لتحرير الغرفة.",
        "السيناريو 5: التحذير من المتبقي المالي ⚠️",
        "• إذا حاول الموظف عمل مغادرة لنزيل لم يسدد كامل حسابه، يظهر تحذير أحمر بارز:\n  (⚠️ هذا الحجز عليه متبقي قدره X روبية)\n• يمنع خروج النزيل حتى سداد المبلغ أو تسجيل دفعة رسمية، مما يحمي أموال الفندق من الضياع.",
        "تأكد دائماً من علامة «✓ خالص» قبل تسليم النزيل أمتعته وتوديعه."
    )

    # ==========================================================
    # SLIDE 6: Scenario 6 (Receipt & Voucher)
    # ==========================================================
    make_scenario_slide(
        "الوثائق الفندقية — إيصالات وسندات القبض المعتمدة",
        "السيناريو 6: طباعة إيصال وسند الحجز (Print Receipt)",
        "• يطلب النزيل إثبات سداد رسمي أو فاتورة إقامة معتمدة.\n• من صفحة الحجز، يضغط الموظف «🖨️ طباعة الإيصال».\n• يُنشئ النظام سنداً فندقياً مروّساً باسم نيو براتاما.\n• يحتوي: التواريخ، تفصيل الدفعات، الرصيد، والختم.\n• تنسيق ذكي يتجاهل أزرار الشاشة ويطبع الوثيقة فقط.",
        "أهمية الوثيقة التشغيلية والمحاسبية",
        "• حماية قانونية للفندق والنزيل تثبت المبالغ المسددة.\n• سند قبض رسمي معتمد للمحاسب القانوني والإدارة.\n• إمكانية حفظ الإيصال كملف PDF وإرساله للنزيل عبر الواتساب بنقرة زر واحدة دون الحاجة لطابعة ورقية.",
        "يمكنك إرسال الإيصال كـ PDF على واتساب النزيل عبر خيار الطباعة واختيار حفظ كـ PDF."
    )

    # ==========================================================
    # SLIDE 7: Scenario 7 (OTA Prepaid)
    # ==========================================================
    make_scenario_slide(
        "حجوزات المنصات — الحجوزات المسددة إلكترونياً (OTA)",
        "السيناريو 7: مدفوع بالتطبيق (Tiket.com / Booking)",
        "• النزيل دفع بالكامل بالبطاقة الائتمانية عبر التطبيق.\n• يظهر الحجز في النظام بالبادج الأزرق المميز:\n  «📱 مدفوع بالتطبيق · استحقاق الوصول»\n• المتبقي المطلوب من النزيل عند الاستقبال هو 0 روبية.\n• لا تطلب من النزيل أي أموال للإقامة إطلاقاً.",
        "القواعد المحاسبية لحجوزات التطبيقات",
        "• النزيل عميل للمنصة، والمنصة هي المدين للفندق.\n• لا تقم بتسجيل دفعة كاش في النظام لهذا الحجز.\n• تسجيل كاش وهمي يسبب عجزاً في الصندوق عند الجرد.\n• الأموال تصرف من المنصة لحساب الفندق البنكي.",
        "المتبقي عند الكاونتر لنزيل المنصة مسبقة الدفع = 0. رحّب بالنزيل وسلّمه المفتاح فوراً."
    )

    # ==========================================================
    # SLIDE 8: Scenario 8 (Future Payouts)
    # ==========================================================
    make_scenario_slide(
        "حجوزات المنصات — الحجوزات المستقبلية والاستحقاق البنكي",
        "السيناريو 8: جدولة التحويلات البنكية للمنصات",
        "• حجز تطبيق مؤكد وصل اليوم، وموعد وصوله بعد أسبوعين.\n• التطبيق يحتجز الأموال ولا يودعها إلا يوم وصول النزيل.\n• النظام يوضح فترة الانتظار: (⏳ بعد أسبوعين تقريباً).\n• توضيح بارز: «استحقاق بنكي عند الوصول».\n• حماية دقة كاش اليوم من التداخل مع إيرادات المستقبل.",
        "الأثر المالي في لوحة المدير",
        "• فرز مستحقات المنصات المستقبلية عن السيولة النقدية الحالية.\n• تتبع دقيق لمواعيد تدفق السيولة النقدية في البنك.\n• يسهل على الإدارة مطابقة كشف الحساب البنكي الأسبوعي مع الحجوزات المنفذة فعلياً.",
        "الحجوزات المستقبلية تظهر مؤكدة في التقويم لكن سيولتها المالية مجدولة لتاريخ الوصول."
    )

    # ==========================================================
    # SLIDE 9: Scenarios 9 & 10 (Pay at Hotel & Review)
    # ==========================================================
    make_scenario_slide(
        "حجوزات المنصات — التحصيل عند الوصول والتدقيق",
        "السيناريو 9: حجز تطبيق مع تحصيل بالفندق",
        "• حجوزات Booking.com بخيار الدفع نقداً عند الوصول.\n• الحجز يتبع للمنصة لكن رصيده يظهر بالأحمر ⚠️.\n• موظف الاستقبال هو المسؤول عن تحصيل القيمة كاش أو تحويل بنكي عند تسليم المفتاح.\n• يتم تسجيل دفعة عادية في خانة المدفوعات.",
        "السيناريو 10: شريط التدقيق الإداري الأصفر ⚠️",
        "• الحجوزات المستوردة تظهر بشريط أصفر يحتاج تدقيق.\n• يقوم المدير بمطابقة الأسعار والعمولات وعدد الليالي.\n• الضغط على «إتمام المراجعة» لاعتماد الحجز رسمياً.\n• حماية الفندق من أي أخطاء تسعيرية غير مقصودة.",
        "انتبه لنوع حجز المنصة: إما مسبق الدفع (بادج أزرق)، أو تحصيل عند الكاونتر (رصيد أحمر)."
    )

    # ==========================================================
    # SLIDE 10: Scenario 11 (Extend Stay)
    # ==========================================================
    make_scenario_slide(
        "العمليات أثناء الإقامة — تمديد فترة الإقامة (Extend Stay)",
        "السيناريو 11: آلية تمديد الإقامة للنزيل الساكن",
        "• النزيل مقيم حالياً ويرغب بزيادة ليلة أو ليلتين إضافيتين.\n• الضغط على زر «⏱️ تمديد الإقامة» في صفحة الحجز.\n• أزرار تمديد سريعة: (+1 ليلة، +2 ليالٍ، +3 ليالٍ، +أسبوع).\n• حساب السعر الإضافي المقترح تلقائياً بناءً على الليلة.\n• تحديث تاريخ المغادرة والرصيد المطلوب بنقرة واحدة.",
        "الفحص التلقائي للشغور ومنع التعارض",
        "• يفحص النظام فوراً توفر الوحدة في الأيام الممتدة.\n• إذا كانت شاغرة: يظهر شريط أخضر ✨ الوحدة شاغرة.\n• إذا كانت محجوزة لغيره: يمنع النظام التمديد ويعطي تحذيراً أحمر لحماية حجز النزيل القادم.\n• تدوين ملاحظة أرشفة تلقائية بتاريخ وقيمة التمديد.",
        "استخدم دائماً زر «تمديد الإقامة» ولا تعدل التاريخ يدوياً لضمان فحص التوفر التلقائي."
    )

    # ==========================================================
    # SLIDE 11: Scenario 12 (Early Check-Out)
    # ==========================================================
    make_scenario_slide(
        "العمليات أثناء الإقامة — المغادرة المبكرة والتسوية المالية",
        "السيناريو 12: تسجيل مغادرة مبكرة (Early Check-Out)",
        "• نزيل حجز 5 ليالٍ واضطر للمغادرة بعد ليلتين فقط.\n• الضغط على زر «🚪🏃‍♂️ مغادرة مبكرة».\n• النظام يحدد تاريخ اليوم ومجموع الليالي المقضية (2).\n• خيار إعادة احتساب الحساب حسب الليالي الفعلية فقط.\n• احتساب مستحق الاسترداد للنزيل (Refund) إن كان دافعاً مقدماً.",
        "تحرير الغرفة والتسوية النقدية اللحظية",
        "• خيار تسجيل إرجاع الكاش للنزيل فوراً بسند صرف رسمي.\n• تحرير الغرفة فوراً على التقويم لتصبح متاحة لضيف آخر.\n• تحول الغرفة تلقائياً لحالة «🧹 تحتاج تنظيف».\n• تدوين ملاحظة أرشفة تفصيلية بالليالي والمبلغ المسترد.",
        "المغادرة المبكرة تعيد بيع الغرفة في نفس اليوم للنزلاء الجدد دون خسارة الإيراد."
    )

    # ==========================================================
    # SLIDE 12: Scenario 13 (Room Transfer)
    # ==========================================================
    make_scenario_slide(
        "العمليات أثناء الإقامة — نقل النزيل وترقية الغرفة",
        "السيناريو 13: نقل الغرفة أو الفيلا (Room Transfer)",
        "• عطل فني طارئ في الغرفة، أو طلب النزيل ترقية لفيلا.\n• الضغط على زر «🔄 نقل الوحدة» في صفحة الحجز.\n• يعرض النظام فقط البدائل الشاغرة في نفس التواريخ.\n• الاحتفاظ بالسعر السابق (مجاناً كتعويض عن العطل).\n• أو تعديل السعر حسب الوحدة الجديدة (ترقية مدفوعة).",
        "تحديث الإشغال وسجل الملاحظات الفوري",
        "• نقل الحجز للغرفة الجديدة وتحديث التقويم فوراً.\n• تحرير الغرفة السابقة لتخضع للصيانة أو إعادة التنظيف.\n• تسجيل سبب النقل (صيانة / ترقية / رغبة الضيف).\n• نقل كافة الدفعات والمستحقات السابقة للغرفة الجديدة.",
        "نقل الغرفة يحفظ سجل المدفوعات كاملاً وينقل الإشغال في قاعدة البيانات بأمان."
    )

    # ==========================================================
    # SLIDE 13: Scenario 14 (Split Payments)
    # ==========================================================
    make_scenario_slide(
        "العمليات أثناء الإقامة — تعدد الدفعات وطرق السداد المختلطة",
        "السيناريو 14: السداد بالتقسيط والدفعات المجزأة",
        "• حجز إجمالي قيمته 3.000.000 روبية.\n• دفعة 1: 1.000.000 روبية تحويل بنكي كعربون حجز.\n• دفعة 2: 1.000.000 روبية كاش عند تسجيل الوصول.\n• دفعة 3: 1.000.000 روبية كاش عند المغادرة.\n• النظام يسجل كل دفعة بتاريخها وطريقتها واسم الموظف.",
        "دقة المطابقة المحاسبية",
        "• احتساب الرصيد المتبقي بدقة متناهية بعد كل دفعة.\n• إمكانية طباعة إيصال محدث بعد كل سداد.\n• فرز المقبوضات النقدية عن البنكية لضمان مطابقة الدرج اليومي.\n• منع حدوث أي لبس أو خلاف مالي مع النزيل.",
        "سجل كل مبلغ يستلمه الاستقبال فوراً كدفعة في الحجز ولا تؤجل التسجيل لنهاية الوردية."
    )

    # ==========================================================
    # SLIDE 14: Scenarios 15, 16, 17 (Cancellations)
    # ==========================================================
    make_scenario_slide(
        "الإلغاء والتسويات — مسارات الإلغاء الذكية واقتطاع الغرامات",
        "السيناريوهات 15 و 16: الإلغاء المجاني والاسترداد الكامل",
        "• إلغاء بدون دفعات: تحرير الغرفة فوراً بدون أي قيد مالي.\n• إلغاء مع استرداد كامل: النزيل ألغى ضمن المهلة المسموحة؛ يعتمد النظام استرداد كامل العربون (غرامة الفندق = 0) مع تسجيل إرجاع الكاش بسند صرف رسمي.",
        "السيناريو 17: الإلغاء مع خصم غرامة فندقية",
        "• إلغاء متأخر يستحق غرامة (مثلاً ليلة واحدة 300 ألف).\n• تحديد مبلغ الغرامة المحتفظ به كدخل رسمي للفندق.\n• حساب المستحق إرجاعه للنزيل بدقة (المدفوع - الغرامة).\n• تعديل قيمة الحجز لتساوي الغرامة فقط لتدخل في أرباح الفندق.",
        "عند خصم غرامة، تسجل الغرامة كدخل فندقي رسمي ويسترد النزيل ما زاد عنها فقط."
    )

    # ==========================================================
    # SLIDE 15: Scenario 18 (No-Show)
    # ==========================================================
    make_scenario_slide(
        "الإلغاء والتسويات — تسجيل عدم الحضور ومصادرة العربون",
        "السيناريو 18: عدم حضور النزيل (No-Show with Full Forfeit)",
        "• النزيل حجز ودفع عربوناً ولم يحضر وانقضت مهلة الوصول.\n• يضغط الموظف على زر «لم يحضر (No-Show)».\n• اختيار سياسة: «مصادرة كامل المبلغ / غير قابل للاسترداد».\n• يعتمد النظام المبلغ المدفوع كاملاً كإيراد غرامة فندقية.\n• تحرير الغرفة لتباع لضيف آخر دون مطالبات معلقة.",
        "الأثر التشغيلي والمحاسبي",
        "• إخلاء الغرفة من جدول الإشغال لتصبح جاهزة للاستقبال.\n• تصفير مستحقات الاسترداد لتظهر علامة — محايدة.\n• إثبات حق الفندق المالي في مصادرة العربون تعويضاً عن حجز الغرفة.\n• ظهور وسام أصفر رسمي بحالة الحجز: «لم يحضر».",
        "حالة No-Show تحرر الغرفة للبيع الفوري وتحتفظ بالعربون كإيراد مستحق للفندق."
    )

    # ==========================================================
    # SLIDE 16: Scenarios 19 & 20 (Housekeeping)
    # ==========================================================
    make_scenario_slide(
        "إدارة المرافق — نظام متابعة نظافة الغرف والفلل",
        "السيناريو 19: التحول التلقائي للنظافة بعد المغادرة",
        "• بمجرد ضغط زر «تسجيل المغادرة» لأي نزيل.\n• يتحول بادج الوحدة تلقائياً إلى: 🧹 تحتاج تنظيف.\n• يظهر التنبيه فوراً في شاشات الاستقبال والتقويم.\n• منع تسليم المفتاح لأي نزيل جديد قبل تنظيف الوحدة.",
        "السيناريو 20: دورة تحديث النظافة الفورية",
        "• تحديث الحالة بنقرة واحدة من لوحة النظافة:\n  🧹 تحتاج تنظيف ⬅️ 🧼 جاري التنظيف ⬅️ ✨ جاهزة ونظيفة\n• لوحة علوية في شاشة اليوم تعطي إحصائية فورية بالوحدات.\n• تزامن لحظي بين أجهزة الاستقبال والإدارة دون تحديث.",
        "لا تسكن أي ضيف في غرفة بادجها 🧹 أو 🧼؛ تأكد دائماً أنها ✨ جاهزة ونظيفة."
    )

    # ==========================================================
    # SLIDE 17: Scenarios 21 & 22 (Parent-Child & Blocks)
    # ==========================================================
    make_scenario_slide(
        "إدارة المرافق — هيكل الفلل المتشعبة وإغلاقات الصيانة",
        "السيناريو 21: حجز الفيلا كاملة مقابل الغرف التابعة",
        "• بعض الفلل تؤجر إما كاملة (Villa 16) أو كغرف منفصلة.\n• حجز الفيلا بالكامل: يغلق تلقائياً كافة غرفها التابعة.\n• حجز غرفة واحدة داخل الفيلا: يمنع حجز الفيلا كاملة ككتلة واحدة في نفس التاريخ لمنع التضارب، ويسمح ببيع باقي الغرف فقط.",
        "السيناريو 22: إغلاقات الصيانة المجدولة (Room Blocks)",
        "• إغلاق غرفة أو فيلا لأعمال الدهان أو صيانة المسبح.\n• تحديد تاريخ البداية والنهاية وسبب الإغلاق.\n• تظهر الوحدة كمغلقة على التقويم وتستثنى من الحجوزات.\n• استثناء الغرف المغلقة للصيانة من حساب نسبة الإشغال.",
        "نظام الغرف المتشعبة يضمن عدم حدوث أي تضارب بين تأجير الفيلا كاملة أو مفرقة."
    )

    # ==========================================================
    # SLIDE 18: Scenarios 23 & 24 (Audits & Excel)
    # ==========================================================
    make_scenario_slide(
        "الرقابة المالية — المتأخرات وجرد الصندوق وتصدير الإكسل",
        "السيناريو 23: متابعة المتأخرات (Overdue Alerts)",
        "• شريط أحمر عاجل ينبه عن تأخر المغادرة أو تأخر القدوم.\n• اتصال الاستقبال بالغرفة لحسم التمديد أو المغادرة.\n• حماية الفندق من بقاء النزيل دون احتساب تكلفة إضافية.\n• الحفاظ على انضباط مواعيد تسليم الغرف للنزلاء الجدد.",
        "السيناريو 24: تقفيل الصندوق وتصدير الإكسل",
        "• فرز دقيق للمقبوضات: كاش 💵 | بنك 🏦 | تطبيقات 📱.\n• مطابقة النقد الفعلي في درج الاستقبال مع النظام.\n• زر «📥 تصدير إلى Excel»: تنزيل تقرير الفلاش اليومي المعتمد للمحاسب القانوني والإدارة العليا بنقرة زر واحدة.",
        "قم بتصدير تقرير الإكسل اليومي في نهاية كل وردية لمطابقة الكاش مع الحسابات."
    )

    # ==========================================================
    # SLIDE 19: SOP Cheat Sheet
    # ==========================================================
    s19 = prs.slides.add_slide(blank_layout)
    add_bg(s19, C_NAVY)

    # Gold frame
    f = s19.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
    f.fill.solid()
    f.fill.fore_color.rgb = C_NAVY_LIGHT
    f.line.color.rgb = C_GOLD
    f.line.width = Pt(2)

    tb = s19.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(10.9), Inches(5.3))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "📋 القواعد الذهبية الست لموظف الاستقبال (Reception SOP)"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = C_GOLD
    p.alignment = PP_ALIGN.CENTER

    sops = [
        ("1. حجوزات التطبيقات مسبقة الدفع (OTA):", "المتبقي المطلوب من النزيل عند الاستقبال هو 0. لا تطلب كاش إطلاقاً ولا تدخل دفعة كاش وهمية."),
        ("2. معيار تسليم الغرفة للنظافة:", "لا تسكن أي ضيف في غرفة بادجها 🧹 أو 🧼؛ تأكد دائماً أنها ✨ جاهزة ونظيفة."),
        ("3. التحذير المالي عند المغادرة:", "إذا ظهر لك تنبيه المتبقي المالي الأحمر عند المغادرة، لا تضغط موافق حتى تحصيل المبلغ كاملاً."),
        ("4. تمديد الإقامة الآمن:", "استخدم زر «تمديد الإقامة» دائماً ليفحص النظام التوفر ويمنع حدوث حجز مزدوج لغيره."),
        ("5. الخروج المبكر ونقل الغرف:", "استخدم أزرار النظام المخصصة لتسوية الحساب تلقائياً وتحرير الغرفة للبيع لغيره في نفس اليوم."),
        ("6. جرد نهاية الوردية اليومية:", "طابق الكاش الفعلي في الدرج مع رقم المقبوضات النقدية وقم بتصدير تقرير الإكسل للإدارة.")
    ]
    for title, desc in sops:
        p_t = tf.add_paragraph()
        p_t.text = f"\n{title} {desc}"
        p_t.font.size = Pt(13)
        p_t.font.color.rgb = C_WHITE

    # ==========================================================
    # SLIDE 20: Conclusion & Access
    # ==========================================================
    s20 = prs.slides.add_slide(blank_layout)
    add_bg(s20, C_NAVY)

    tb = s20.shapes.add_textbox(Inches(1.5), Inches(1.8), Inches(10.3), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "معاً نحو إدارة فندقية رائدة وضيافة استثنائية"
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = C_GOLD
    p.alignment = PP_ALIGN.CENTER

    p1 = tf.add_paragraph()
    p1.text = "\nمجمع نيو براتاما الفندقي · خدمات المجد للضيافة"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p1.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = "\nرابط لوحة العمليات الحية: https://almagd.pages.dev/admin"
    p2.font.size = Pt(14)
    p2.font.color.rgb = RGBColor(147, 197, 253)
    p2.alignment = PP_ALIGN.CENTER

    p3 = tf.add_paragraph()
    p3.text = "بيانات الدخول المعتمدة محفوظة في ملف CREDENTIALS.md"
    p3.font.size = Pt(12)
    p3.font.color.rgb = RGBColor(203, 213, 225)
    p3.alignment = PP_ALIGN.CENTER

    prs.save(out_path)
    print(f"Presentation saved successfully to: {out_path}")

if __name__ == "__main__":
    create_deck()
