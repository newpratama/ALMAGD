import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Typography
    FONT_AR = "Arial"

    # Color Palette
    C_NAVY = RGBColor(15, 30, 54)          # #0F1E36
    C_NAVY_LIGHT = RGBColor(26, 47, 82)    # #1A2F52
    C_GOLD = RGBColor(197, 168, 105)       # #C5A869
    C_GOLD_DARK = RGBColor(163, 134, 75)
    C_GOLD_BG = RGBColor(254, 250, 240)
    C_WHITE = RGBColor(255, 255, 255)
    C_BG_OFFWHITE = RGBColor(248, 250, 252)# #F8FAFC
    C_SLATE = RGBColor(71, 85, 105)        # #475569
    C_SLATE_DARK = RGBColor(30, 41, 59)
    C_CARD_BORDER = RGBColor(226, 232, 240)
    C_EMERALD = RGBColor(16, 185, 129)     # #10B981
    C_BLUE = RGBColor(59, 130, 246)        # #3B82F6
    C_CRIMSON = RGBColor(225, 29, 72)      # #E11D48
    C_AMBER = RGBColor(245, 158, 11)       # #F59E0B

    def add_bg(slide, color):
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = color
        shape.line.fill.background()
        return shape

    def add_card(slide, left, top, width, height, bg_color=C_WHITE, border_color=C_CARD_BORDER, border_width=1):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(border_width)
        return card

    def add_header(slide, title, category="ALMAGD PMS · مجمع نيو براتاما الفندقي", dark=False):
        # Category Pill
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.35), Inches(4.5), Inches(0.32))
        pill.fill.solid()
        pill.fill.fore_color.rgb = C_NAVY_LIGHT if dark else C_GOLD_BG
        pill.line.color.rgb = C_GOLD if dark else C_GOLD_DARK
        pill.line.width = Pt(0.75)
        tb_p = pill.text_frame
        p_p = tb_p.paragraphs[0]
        p_p.text = category
        p_p.font.size = Pt(10)
        p_p.font.bold = True
        p_p.font.name = FONT_AR
        p_p.font.color.rgb = C_GOLD if dark else C_GOLD_DARK

        # Main Title
        tb_t = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.65))
        p_t = tb_t.text_frame.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(22)
        p_t.font.bold = True
        p_t.font.name = FONT_AR
        p_t.font.color.rgb = C_WHITE if dark else C_NAVY
        p_t.alignment = PP_ALIGN.RIGHT

        # Gold Accent Line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.4), Inches(11.733), Inches(0.025))
        line.fill.solid()
        line.fill.fore_color.rgb = C_GOLD
        line.line.fill.background()

    def add_footer_rule(slide, rule_text):
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.5), Inches(11.733), Inches(0.65))
        pill.fill.solid()
        pill.fill.fore_color.rgb = C_NAVY
        pill.line.fill.background()
        tb = slide.shapes.add_textbox(Inches(1.0), Inches(6.55), Inches(11.3), Inches(0.55))
        p = tb.text_frame.paragraphs[0]
        p.text = f"💡 قاعدة تشغيلية هامة للاستقبال: {rule_text}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.name = FONT_AR
        p.font.color.rgb = C_GOLD
        p.alignment = PP_ALIGN.RIGHT

    # Helper to build scenario slide WITH live screenshot (RTL reading layout)
    def build_slide_with_screenshot(cat_title, slide_title, scen_num, case_desc, steps, rule_text, shot_filename):
        slide = prs.slides.add_slide(blank_layout)
        add_bg(slide, C_BG_OFFWHITE)
        add_header(slide, slide_title, category=cat_title)

        # Right Column (Primary RTL reading): Operational Steps & Case Study
        add_card(slide, Inches(6.8), Inches(1.6), Inches(5.7), Inches(4.7), bg_color=C_WHITE)
        tb_r = slide.shapes.add_textbox(Inches(6.95), Inches(1.75), Inches(5.4), Inches(4.4))
        tf_r = tb_r.text_frame
        tf_r.word_wrap = True

        p_tag = tf_r.paragraphs[0]
        p_tag.text = scen_num
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.name = FONT_AR
        p_tag.font.color.rgb = C_GOLD_DARK
        p_tag.alignment = PP_ALIGN.RIGHT

        p_h = tf_r.add_paragraph()
        p_h.text = f"📌 الحالة: {case_desc}"
        p_h.font.size = Pt(11)
        p_h.font.name = FONT_AR
        p_h.font.color.rgb = C_SLATE_DARK
        p_h.alignment = PP_ALIGN.RIGHT

        p_st = tf_r.add_paragraph()
        p_st.text = "\n🛠️ خطوات التنفيذ في النظام:"
        p_st.font.size = Pt(13)
        p_st.font.bold = True
        p_st.font.name = FONT_AR
        p_st.font.color.rgb = C_NAVY
        p_st.alignment = PP_ALIGN.RIGHT

        for idx, (st_t, st_b) in enumerate(steps, 1):
            p_s = tf_r.add_paragraph()
            p_s.text = f"[{idx}] {st_t}"
            p_s.font.size = Pt(11)
            p_s.font.bold = True
            p_s.font.name = FONT_AR
            p_s.font.color.rgb = C_BLUE
            p_s.alignment = PP_ALIGN.RIGHT

            p_sb = tf_r.add_paragraph()
            p_sb.text = f"     {st_b}"
            p_sb.font.size = Pt(10)
            p_sb.font.name = FONT_AR
            p_sb.font.color.rgb = C_SLATE
            p_sb.alignment = PP_ALIGN.RIGHT

        # Left Column (Visual Proof): Real Screenshot Frame
        add_card(slide, Inches(0.8), Inches(1.6), Inches(5.8), Inches(4.7), bg_color=C_WHITE)

        # Title for screenshot
        tb_st = slide.shapes.add_textbox(Inches(0.95), Inches(1.7), Inches(5.5), Inches(0.35))
        p_shot = tb_st.text_frame.paragraphs[0]
        p_shot.text = "📱 صورة حية من شاشة النظام (Live System Screen)"
        p_shot.font.size = Pt(11)
        p_shot.font.bold = True
        p_shot.font.name = FONT_AR
        p_shot.font.color.rgb = C_NAVY
        p_shot.alignment = PP_ALIGN.CENTER

        shot_path = os.path.join("screenshots", shot_filename)
        if os.path.exists(shot_path):
            slide.shapes.add_picture(
                shot_path,
                Inches(0.95),
                Inches(2.1),
                width=Inches(5.5),
                height=Inches(4.0)
            )

        add_footer_rule(slide, rule_text)

    def build_detailed_scenario_slide(cat_title, slide_title, scen_num, case_desc, steps, result_text, rule_text, shot_filename=None):
        slide = prs.slides.add_slide(blank_layout)
        add_bg(slide, C_BG_OFFWHITE)
        add_header(slide, slide_title, category=cat_title)

        # Right Column (Primary RTL reading): Operational Steps & Case Study
        add_card(slide, Inches(6.8), Inches(1.6), Inches(5.7), Inches(4.7), bg_color=C_WHITE)
        tb_r = slide.shapes.add_textbox(Inches(6.95), Inches(1.75), Inches(5.4), Inches(4.4))
        tf_r = tb_r.text_frame
        tf_r.word_wrap = True

        p_tag = tf_r.paragraphs[0]
        p_tag.text = scen_num
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.name = FONT_AR
        p_tag.font.color.rgb = C_GOLD_DARK
        p_tag.alignment = PP_ALIGN.RIGHT

        p_h = tf_r.add_paragraph()
        p_h.text = f"📌 الحالة: {case_desc}"
        p_h.font.size = Pt(10)
        p_h.font.name = FONT_AR
        p_h.font.color.rgb = C_SLATE_DARK
        p_h.alignment = PP_ALIGN.RIGHT

        p_st = tf_r.add_paragraph()
        p_st.text = "\n🛠️ خطوات التنفيذ في النظام:"
        p_st.font.size = Pt(12)
        p_st.font.bold = True
        p_st.font.name = FONT_AR
        p_st.font.color.rgb = C_NAVY
        p_st.alignment = PP_ALIGN.RIGHT

        for idx, (st_t, st_b) in enumerate(steps, 1):
            p_s = tf_r.add_paragraph()
            p_s.text = f"[{idx}] {st_t}"
            p_s.font.size = Pt(10.5)
            p_s.font.bold = True
            p_s.font.name = FONT_AR
            p_s.font.color.rgb = C_BLUE
            p_s.alignment = PP_ALIGN.RIGHT

            p_sb = tf_r.add_paragraph()
            p_sb.text = f"     {st_b}"
            p_sb.font.size = Pt(9.5)
            p_sb.font.name = FONT_AR
            p_sb.font.color.rgb = C_SLATE
            p_sb.alignment = PP_ALIGN.RIGHT

        # Left Column: Either Live Screenshot OR 2 Analytical Cards
        shot_path = os.path.join("screenshots", shot_filename) if shot_filename else None
        if shot_path and os.path.exists(shot_path):
            add_card(slide, Inches(0.8), Inches(1.6), Inches(5.8), Inches(4.7), bg_color=C_WHITE)
            tb_st = slide.shapes.add_textbox(Inches(0.95), Inches(1.7), Inches(5.5), Inches(0.35))
            p_shot = tb_st.text_frame.paragraphs[0]
            p_shot.text = "📱 صورة حية من شاشة النظام (Live System Screen)"
            p_shot.font.size = Pt(11)
            p_shot.font.bold = True
            p_shot.font.name = FONT_AR
            p_shot.font.color.rgb = C_NAVY
            p_shot.alignment = PP_ALIGN.CENTER

            slide.shapes.add_picture(
                shot_path,
                Inches(0.95),
                Inches(2.1),
                width=Inches(5.5),
                height=Inches(4.0)
            )
        else:
            add_card(slide, Inches(0.8), Inches(1.6), Inches(5.8), Inches(2.2), bg_color=C_WHITE, border_color=C_BLUE)
            tb_r1 = slide.shapes.add_textbox(Inches(0.95), Inches(1.75), Inches(5.5), Inches(1.9))
            tf_r1 = tb_r1.text_frame
            tf_r1.word_wrap = True
            p_r1 = tf_r1.paragraphs[0]
            p_r1.text = "💡 النتيجة والأثر المباشر في النظام:"
            p_r1.font.size = Pt(12)
            p_r1.font.bold = True
            p_r1.font.name = FONT_AR
            p_r1.font.color.rgb = C_NAVY
            p_r1.alignment = PP_ALIGN.RIGHT

            p_r1_b = tf_r1.add_paragraph()
            p_r1_b.text = f"\n{result_text}"
            p_r1_b.font.size = Pt(10.5)
            p_r1_b.font.name = FONT_AR
            p_r1_b.font.color.rgb = C_SLATE_DARK
            p_r1_b.alignment = PP_ALIGN.RIGHT

            add_card(slide, Inches(0.8), Inches(4.0), Inches(5.8), Inches(2.3), bg_color=C_GOLD_BG, border_color=C_GOLD)
            tb_r2 = slide.shapes.add_textbox(Inches(0.95), Inches(4.15), Inches(5.5), Inches(2.0))
            tf_r2 = tb_r2.text_frame
            tf_r2.word_wrap = True
            p_r2 = tf_r2.paragraphs[0]
            p_r2.text = "⭐ المعيار التشغيلي المعتمد (SOP):"
            p_r2.font.size = Pt(12)
            p_r2.font.bold = True
            p_r2.font.name = FONT_AR
            p_r2.font.color.rgb = C_GOLD_DARK
            p_r2.alignment = PP_ALIGN.RIGHT

            p_r2_b = tf_r2.add_paragraph()
            p_r2_b.text = f"\n{rule_text}"
            p_r2_b.font.size = Pt(10.5)
            p_r2_b.font.name = FONT_AR
            p_r2_b.font.color.rgb = C_SLATE_DARK
            p_r2_b.alignment = PP_ALIGN.RIGHT

        add_footer_rule(slide, rule_text)

    # ==========================================================
    # SLIDE 1: Title & Hero
    # ==========================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1, C_NAVY)

    f1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
    f1.fill.solid()
    f1.fill.fore_color.rgb = C_NAVY_LIGHT
    f1.line.color.rgb = C_GOLD
    f1.line.width = Pt(2)

    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.4), Inches(10.9), Inches(4.8))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "مجمع نيو براتاما الفندقي · بونشاك | ALMAGD Hospitality"
    p0.font.size = Pt(15)
    p0.font.bold = True
    p0.font.name = FONT_AR
    p0.font.color.rgb = C_GOLD
    p0.alignment = PP_ALIGN.CENTER

    p1 = tf.add_paragraph()
    p1.text = "الدليل التشغيلي المصور لنظام إدارة العمليات الفندقية"
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.name = FONT_AR
    p1.font.color.rgb = C_WHITE
    p1.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = "شرح عملي بالصور الحية من شاشات النظام لكافة السيناريوهات الـ 24 المعتمدة"
    p2.font.size = Pt(16)
    p2.font.name = FONT_AR
    p2.font.color.rgb = RGBColor(203, 213, 225)
    p2.alignment = PP_ALIGN.CENTER

    p3 = tf.add_paragraph()
    p3.text = "\n\nنظام إدارة الحجوزات PMS v1.0 | الرابط الحي: almagd.pages.dev/admin"
    p3.font.size = Pt(13)
    p3.font.bold = True
    p3.font.name = FONT_AR
    p3.font.color.rgb = C_GOLD
    p3.alignment = PP_ALIGN.CENTER

    # ==========================================================
    # SLIDE 2: Agenda
    # ==========================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2, C_BG_OFFWHITE)
    add_header(s2, "فهرس السيناريوهات التشغيلية (24 سيناريو في 6 أقسام)")

    sections = [
        ("1️⃣ دورة الحجز الأساسي", "الحجز المباشر، النزلاء السابقين، التسكين، المغادرة، تنبيه الرصيد المتبقي، وطباعة سندات القبض."),
        ("2️⃣ حجوزات المنصات (OTA)", "الحجوزات المدفوعة مسبقاً، جدولة الصرف البنكي، التحصيل عند الوصول، ومراجعة الأسعار."),
        ("3️⃣ العمليات أثناء الإقامة", "تمديد الإقامة، المغادرة المبكرة، نقل الغرف والترقية، وتجزئة السداد نقداً وبنكياً."),
        ("4️⃣ الإلغاء وعدم الحضور", "الإلغاء المجاني، الاسترداد الكامل، اقتطاع غرامة الفندق، ومصادرة العربون لعدم الحضور."),
        ("5️⃣ النظافة وإدارة المرافق", "التحول التلقائي للنظافة، دورة تنظيف الغرف، تفرع الفلل والغرف، وإغلاقات الصيانة."),
        ("6️⃣ الرقابة والتدقيق المالي", "شريط المتأخرات العاجل، إقفال الصندوق اليومي، وتصدير تقرير الإكسل المعتمد للمحاسبة.")
    ]
    for i, (sec_title, sec_desc) in enumerate(sections):
        row = i // 3
        col = i % 3
        left = Inches(0.8 + col * 3.95)
        top = Inches(1.7 + row * 2.3)
        add_card(s2, left, top, Inches(3.8), Inches(2.1), bg_color=C_WHITE)
        tb = s2.shapes.add_textbox(left + Inches(0.15), top + Inches(0.15), Inches(3.5), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = sec_title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.name = FONT_AR
        p.font.color.rgb = C_NAVY

        p_b = tf.add_paragraph()
        p_b.text = f"\n{sec_desc}"
        p_b.font.size = Pt(10)
        p_b.font.name = FONT_AR
        p_b.font.color.rgb = C_SLATE

    add_footer_rule(s2, "تمت برمجة جميع هذه المسارات في النظام لتوفير الحماية المالية والتشغيلية الكاملة للمجمع.")

    # ==========================================================
    # SLIDE 3: Permissions Matrix
    # ==========================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3, C_BG_OFFWHITE)
    add_header(s3, "مصفوفة الصلاحيات والأدوار (Reception vs Manager)")

    add_card(s3, Inches(0.8), Inches(1.7), Inches(5.6), Inches(4.5), bg_color=C_WHITE)
    tb_l = s3.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(5.2), Inches(4.1))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    p = tf_l.paragraphs[0]
    p.text = "👤 موظف الاستقبال (Reception Pratama)"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.name = FONT_AR
    p.font.color.rgb = C_BLUE

    rec_lines = [
        "✅ إنشاء الحجوزات المباشرة وتسكين النزلاء (Check-In)",
        "✅ تسجيل مغادرة النزيل (Check-Out) وطباعة إيصال القبض",
        "✅ تمديد الإقامة الآمن ونقل الغرف عند الأعطال والترقية",
        "✅ تسجيل الدفعات النقدية والتحويلات المستلمة من النزيل",
        "✅ تحديث دورة نظافة الغرف (تحتاج تنظيف 🧹 ⬅️ جاهزة ✨)",
        "❌ محجوب: لا يرى إجمالي كاش الصندوق أو التقارير الشهرية",
        "❌ محجوب: لا يستطيع تعديل أسعار الغرف أو حذف الحجوزات"
    ]
    for line in rec_lines:
        p_l = tf_l.add_paragraph()
        p_l.text = line
        p_l.font.size = Pt(10.5)
        p_l.font.name = FONT_AR
        p_l.font.color.rgb = C_SLATE_DARK if "✅" in line else C_CRIMSON

    add_card(s3, Inches(6.8), Inches(1.7), Inches(5.7), Inches(4.5), bg_color=C_WHITE)
    tb_r = s3.shapes.add_textbox(Inches(7.0), Inches(1.85), Inches(5.3), Inches(4.1))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    p = tf_r.paragraphs[0]
    p.text = "⭐ مدير الفندق (Manager Pratama)"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.name = FONT_AR
    p.font.color.rgb = C_GOLD_DARK

    mgr_lines = [
        "✅ كافة صلاحيات موظف الاستقبال مضافة إليها إدارة الفندق",
        "✅ الاطلاع على كشف المقبوضات وصندوق الدرج النقدي اليومي",
        "✅ مراجعة واعتماد الحجوزات المستوردة وشريط التدقيق الأصفر",
        "✅ تسعير الفلل والغرف وتعديل الأسعار الافتراضية للوحدات",
        "✅ جدولة إغلاقات الصيانة (Room Blocks) للفلل والمسابح",
        "✅ الاطلاع على تقارير الإشغال ومتوسط سعر الغرفة (ADR)",
        "✅ تصدير التقارير الرسمية إلى Excel وحذف الحجوزات الملغاة"
    ]
    for line in mgr_lines:
        p_l = tf_r.add_paragraph()
        p_l.text = line
        p_l.font.size = Pt(10.5)
        p_l.font.name = FONT_AR
        p_l.font.color.rgb = C_SLATE_DARK

    add_footer_rule(s3, "صلاحيات الاستقبال مخصصة للعمليات اليومية؛ والمسائل المحاسبية والإلغاءات الكبرى من صلاحية المدير.")

    # ==========================================================
    # SLIDE 4: Portal Login & Security
    # ==========================================================
    build_slide_with_screenshot(
        "الأمان وتسجيل الدخول",
        "بوابة الدخول الموحدة للوحة تحكم المجد (ALMAGD Portal)",
        "أمان النظام",
        "دخول الموظفين والمديرين عبر بوابة مؤمنة سحابياً بنظام التحقق المشفر بدون حفظ كلمات السر في المتصفح.",
        [
            ("الوصول للرابط الرسمي", "فتح الرابط المعتمد: almagd.pages.dev/admin/login عبر أي متصفح أو جهاز لوحي."),
            ("إدخال البريد الإلكتروني", "كتابة البريد الوظيفي المعتمد للاستقبال أو الإدارة."),
            ("إدخال كلمة المرور المشفرة", "كتابة كلمة المرور المعتمدة بدقة."),
            ("التحويل التلقائي للوحة العمليات", "الضغط على «تسجيل الدخول»؛ يفتح النظام فوراً شاشة «اليوم» بالصلاحيات المخصصة.")
        ],
        "بيانات الدخول محمية ومشفرة عبر Supabase Auth ولا تظهر كلمات السر في الكود البرمجي.",
        "shot_01_login.png"
    )

    # ==========================================================
    # SLIDE 5: Today Dashboard
    # ==========================================================
    build_slide_with_screenshot(
        "مركز العمليات الرئيسي",
        "لوحة التحكم اليومية (Today Page) وشريط النظافة",
        "شاشة التحكم الحية",
        "الشاشة الأمامية اليومية لموظف الاستقبال لمتابعة الإشغال والقدوم والمغادرة وحالة النظافة الفورية.",
        [
            ("متابعة بطاقات الإشغال الـ 4", "قراءة فورية لنسبة الإشغال، وصول اليوم، مغادرة اليوم، والنزلاء المقيمون."),
            ("شريط النظافة الفوري (Housekeeping)", "متابعة عدد الغرف النظيفة ✨، والتي جاري تنظيفها 🧼، والتي تحتاج تنظيف 🧹."),
            ("كشف القدوم والمغادرة", "معرفة النزلاء القادمين لتجهيز مفاتيحهم، والمغادرين لمطابقة رصيدهم المالي."),
            ("فلترة الفلل والغرف المشغولة", "البحث المباشر برقم الفيلا أو اسم الغرفة لمعرفة تفاصيل النزيل فوراً.")
        ],
        "شاشة اليوم تتحدث لحظياً عبر تقنية البث الحي (BroadcastChannel) دون الحاجة لعمل تحديث يدوي للمتصفح.",
        "shot_02_today_dashboard.png"
    )

    # ==========================================================
    # SLIDE 6: Scenario 1 (Direct Walk-in)
    # ==========================================================
    build_detailed_scenario_slide(
        "1️⃣ دورة الحجز الأساسية",
        "الحجز المباشر للنزلاء الجدد (Direct Walk-in)",
        "السيناريو رقم 1",
        "ضيف يصل للاستقبال بدون حجز مسبق، أو يتواصل هاتفياً/واتساب ويريد الإقامة في فيلا أو غرفة مستقلة.",
        [
            ("فتح نموذج الحجز", "الضغط على «الحجوزات» ثم «+ حجز جديد» في أعلى الشاشة."),
            ("إدخال بيانات الضيف والتواريخ", "كتابة اسم الضيف، رقم هاتفه، تاريخ الوصول وتاريخ المغادرة وعدد الليالي."),
            ("اختيار الوحدة الشاغرة", "يعرض النظام الوحدات المتاحة فعلياً فقط ويمنع بيع الغرف المشغولة لمنع التضارب."),
            ("تسجيل الدفعة الأولى والحفظ", "تحديد المصدر (Walk-in)، وإدخال المبلغ المقبوض كاش أو تحويل، ثم الضغط على «إنشاء الحجز».")
        ],
        "إصدار كود حجز تسلسلي فوري (مثل B0181)، وإغلاق الوحدة في التقويم لحظياً مانعاً حجزها لغيره.",
        "كل حجز يتم حفظه يُقفل الغرفة لحظياً في قاعدة البيانات ولا مجال لحدوث أي تضارب.",
        "shot_04_new_booking.png"
    )

    # ==========================================================
    # SLIDE 7: Scenario 2 (Returning Guest)
    # ==========================================================
    build_slide_with_screenshot(
        "1️⃣ دورة الحجز الأساسية",
        "حجز النزيل السابق والتعرف على وسام VIP",
        "السيناريو رقم 2",
        "نزيل سبق له الإقامة في الفندق عاد للحجز مرة أخرى؛ النظام يحتفظ بملفه وهويته لتسريع عملية الاستقبال.",
        [
            ("البحث السريع عن الضيف", "كتابة أول حرفين من اسم الضيف أو رقم هاتفه في خانة «الضيف» داخل الحجز الجديد."),
            ("استدعاء الملف والوسام", "تظهر قائمة بالنزلاء المطابقين فوراً مع إظهار وسام ⭐ VIP للنزلاء المتميزين."),
            ("اختيار الضيف بنقرة واحدة", "تكتمل بيانات الهاتف والهوية تلقائياً دون الحاجة لإعادة كتابتها مرة أخرى."),
            ("إتمام الحجز", "تحديد الوحدة المطلوبة والدفعة كالمعتاد وحفظ الحجز في ثوانٍ معدودة.")
        ],
        "ربط الحجز بنفس ملف النزيل السابق لتتبع تاريخ إقاماته وسجل مدفوعاته وولائه للفندق.",
        "shot_04_new_booking.png"
    )

    # ==========================================================
    # SLIDE 8: Scenarios 3 & 4 (Check-in & Check-out)
    # ==========================================================
    build_detailed_scenario_slide(
        "1️⃣ دورة الحجز الأساسية",
        "دورة تسجيل الوصول (Check-in) والمغادرة (Check-out)",
        "السيناريوهات 3 و 4",
        "الوصول: نزيل وصل في موعده لاستلام الغرفة. المغادرة: نزيل انتهت إقامته وسدد حسابه ويريد تسليم المفتاح.",
        [
            ("فحص نظافة الغرفة أولاً", "التأكد من أن بادج نظافة الغرفة يظهر ✨ جاهزة ونظيفة قبل تسليم المفتاح."),
            ("تسجيل الوصول (Check-in)", "ضغط زر «الوصول»؛ تتحول حالة الحجز فوراً إلى «مقيم» ويظهر في قائمة المقيمين اليوم."),
            ("فحص الرصيد عند المغادرة", "التأكد من أن الرصيد المتبقي = 0 (يظهر باللون الأخضر ✓ خالص)."),
            ("تسجيل المغادرة (Check-out)", "ضغط زر «المغادرة»؛ تتحول الحالة إلى «غادر» وتتحول الغرفة فوراً إلى 🧹 تحتاج تنظيف.")
        ],
        "تحديث فوري لنسبة الإشغال اللحظية، وتحرير الغرفة لتنتقل لدورة النظافة لتجهيزها للنزيل القادم.",
        "لا تسلم المفتاح للنزيل إطلاقاً إلا إذا كان بادج نظافة الغرفة يظهر ✨ جاهزة ونظيفة.",
        "shot_07_booking_detail.png"
    )

    # ==========================================================
    # SLIDE 9: Scenario 5 (Balance Due Warning)
    # ==========================================================
    build_slide_with_screenshot(
        "1️⃣ دورة الحجز الأساسية",
        "التحذير من المتبقي المالي ومنع خروج النزيل المدين",
        "السيناريو رقم 5",
        "نزيل يحاول تسجيل المغادرة وتسليم المفتاح ولا زال في ذمته متبقي مالي لم يسدده (مثال: باقي 450 ألف).",
        [
            ("محاولة الضغط على مغادرة", "يضغط الموظف على زر «تسجيل المغادرة» كالمعتاد."),
            ("ظهور التنبيه التحذيري الأحمر ⚠️", "يعترض النظام العملية ويفتح نافذة تحذيرية: (⚠️ هذا الحجز عليه متبقي قدره X روبية)."),
            ("تحصيل المبلغ من النزيل", "يطلب الموظف من النزيل سداد المبلغ المتبقي نقداً أو عبر التحويل البنكي."),
            ("تسجيل الدفعة وإتمام الخروج", "يضغط الموظف «إضافة دفعة» ويسجل المبلغ؛ فيصبح الرصيد 0 خالص، وتتم المغادرة بأمان.")
        ],
        "تنبيه المتبقي المالي يحمي إيرادات الفندق من الضياع؛ لا تؤكد المغادرة قبل استلام الكاش.",
        "shot_07_booking_detail.png"
    )

    # ==========================================================
    # SLIDE 10: Scenario 6 (Receipt Voucher Printing)
    # ==========================================================
    build_slide_with_screenshot(
        "1️⃣ دورة الحجز الأساسية",
        "إصدار وطباعة إيصال تأكيد الحجز وسند القبض الرسمي",
        "السيناريو رقم 6",
        "النزيل يطلب إثبات سداد رسمي أو سند قبض معتمد لإرفاقه لشركته أو لحفظ حقوقه المالية.",
        [
            ("الدخول على تفاصيل الحجز", "فتح صفحة الحجز المطلوبة من جدول الحجوزات أو شاشة اليوم."),
            ("معاينة السند الرسمي", "ضغط زر «👁️ معاينة الإيصال» لمراجعة التواريخ والدفعات والمتبقي."),
            ("أمر الطباعة المباشر", "ضغط زر «🖨️ طباعة الإيصال»؛ يفتح النظام نافذة الطباعة الرسمية المجهزة فوراً."),
            ("الحفظ كـ PDF أو الطباعة الورقية", "تنسيق مبرمج يتجاهل أزرار الشاشة ويطبع فقط السند المروّس باسم مجمع نيو براتاما.")
        ],
        "سند قانوني ومالي رسمي معتمد للمحاسبة يثبت استلام المبالغ وتفاصيل الليالي وقنوات السداد.",
        "shot_12_receipt_modal.png"
    )

    # ==========================================================
    # SLIDE 11: Scenario 7 (OTA Prepaid App Bookings)
    # ==========================================================
    build_slide_with_screenshot(
        "2️⃣ حجوزات المنصات (OTA)",
        "حجوزات التطبيقات المسددة إلكترونياً (OTA Prepaid)",
        "السيناريو رقم 7",
        "حجز قادم عبر منصة Tiket.com أو Booking.com أو Agoda حيث دفع النزيل بالبطاقة مسبقاً على التطبيق.",
        [
            ("التعرف على بادج المنصة الأزرق", "يظهر الحجز في النظام بالبادج الأزرق المميز: «📱 مدفوع بالتطبيق · استحقاق الوصول»."),
            ("التحقق من الرصيد المطلوب", "المتبقي المطلوب تحصيله من النزيل عند الاستقبال هو 0 روبية (خالص تماماً للإقامة)."),
            ("استقبال النزيل دون طلب أموال", "يتم الترحيب بالنزيل وتسجيل وصوله دون مطالبته بأي رسوم إقامة لأنه دفع للمنصة مسبقاً."),
            ("منع تسجيل كاش وهمي", "يُمنع منعاً باتاً إدخال دفعة نقدية في النظام لهذا الحجز لأن الأموال ستصل عبر الحساب البنكي.")
        ],
        "القاعدة الذهبية: حجز التطبيق بالبادج الأزرق = لا تطلب كاش من النزيل إطلاقاً.",
        "shot_13_ota_booking_detail.png"
    )

    # ==========================================================
    # SLIDE 12: Scenario 8 (Future Payouts)
    # ==========================================================
    build_detailed_scenario_slide(
        "2️⃣ حجوزات المنصات (OTA)",
        "الحجوزات المستقبلية وجدولة التحويلات البنكية للمنصات",
        "السيناريو رقم 8",
        "حجز مؤكد من تطبيق إلكتروني وصل للنظام اليوم، لكن موعد قدوم النزيل الفعلي بعد أسبوع أو أسبوعين.",
        [
            ("فهم سياسة تحويلات المنصات", "المنصة (مثل Booking أو Tiket) تحتجز الأموال ولا تحولها لحساب الفندق إلا في تاريخ وصول النزيل."),
            ("قراءة مؤشر المدة في النظام", "يُظهر النظام الحجز مع توضيح المدة الزمنية المتبقية: (⏳ بعد أسبوعين تقريباً)."),
            ("توضيح طبيعة المبلغ", "يوضح النظام بجانب المبلغ: «استحقاق بنكي عند الوصول» ليعلم المحاسب موعد دخول السيولة."),
            ("حماية كاش اليومية", "لا يتم إدراج هذا المبلغ في كاش اليوم حتى لا يختل جرد الدرج اليومي لموظف الاستقبال.")
        ],
        "إثبات الحجز في التقويم لحماية الغرفة، مع تأجيل إقرار السيولة المالية النقدية لتاريخ وصول النزيل الفعلي.",
        "الحجوزات المستقبلية تحجز الغرفة فوراً، لكن أموالها تنزل في الحساب البنكي يوم وصول النزيل.",
        "shot_13_ota_booking_detail.png"
    )

    # ==========================================================
    # SLIDE 13: Scenario 11 (Extend Stay Modal)
    # ==========================================================
    build_slide_with_screenshot(
        "3️⃣ العمليات أثناء الإقامة",
        "تمديد فترة الإقامة لنزيل ساكن والفحص الآلي للتوفر",
        "السيناريو رقم 11",
        "نزيل مقيم حالياً ويرغب بتمديد إقامته ليلة أو ليلتين إضافيتين دون الحاجة لعمل حجز جديد مكرر.",
        [
            ("الضغط على زر تمديد الإقامة", "من صفحة الحجز، يضغط الموظف على الزر المخصص: «⏱️ تمديد الإقامة»."),
            ("اختيار عدد الليالي السريعة", "تظهر أزرار سريعة: (+1 ليلة، +2 ليالٍ، +3 ليالٍ، +أسبوع) أو اختيار تاريخ مغادرة جديد."),
            ("الفحص التلقائي للشغور", "يفحص النظام توفر الوحدة في الأيام الممتدة؛ إذا كانت شاغرة تظهر رسالة خضراء ✨ الوحدة شاغرة ومتاحة."),
            ("حساب السعر الإضافي وتأكيد التمديد", "يحسب النظام السعر الإضافي المقترح آلياً ويضيفه على الرصيد، وبضغطة واحدة يتحدث التقويم.")
        ],
        "استخدم دائماً زر «تمديد الإقامة» لأنه يفحص التوفر التلقائي ويمنع تضارب الحجوزات.",
        "shot_08_extend_modal.png"
    )

    # ==========================================================
    # SLIDE 14: Scenario 12 (Early Check-Out Modal)
    # ==========================================================
    build_slide_with_screenshot(
        "3️⃣ العمليات أثناء الإقامة",
        "المغادرة المبكرة وإعادة احتساب الحساب والاسترداد",
        "السيناريو رقم 12",
        "نزيل حجز 5 ليالٍ ودفع مقدماً، لكن لظرف طارئ اضطر للمغادرة بعد ليلتين فقط ويريد تسوية حسابه فوراً.",
        [
            ("الضغط على زر مغادرة مبكرة", "من صفحة الحجز المقيم، يضغط الموظف زر «🚪🏃‍♂️ مغادرة مبكرة»."),
            ("احتساب الليالي الفعلية تلقائياً", "يحدد النظام تاريخ اليوم كتاريخ مغادرة فعلي ويحسب عدد الليالي المسكونة (ليلتين)."),
            ("اختيار سياسة التسوية المالية", "1. إعادة احتساب الحساب حسب الليالي الفعلية (موصى به) ويظهر فوراً المبلغ المستحق استرداده للنزيل."),
            ("تسجيل سند الاسترداد وإخلاء الغرفة", "تفعيل خيار: (تسجيل تسليم المبلغ المسترد للنزيل كاش الآن)؛ فيتم الخروج وتحرير الغرفة للبيع فوراً.")
        ],
        "المغادرة المبكرة تتيح للفندق إعادة بيع الغرفة في نفس الليلة لضيف آخر بدلاً من بقائها معلقة.",
        "shot_10_early_checkout_modal.png"
    )

    # ==========================================================
    # SLIDE 15: Scenario 13 (Room Transfer Modal)
    # ==========================================================
    build_slide_with_screenshot(
        "3️⃣ العمليات أثناء الإقامة",
        "نقل النزيل لغرفة أخرى وترقية الوحدات أثناء السكن",
        "السيناريو رقم 13",
        "حدث عطل فني في الغرفة (تكييف/سباكة)، أو طلب النزيل ترقية إقامته من غرفة مستقلة إلى فيلا كاملة بمسبح.",
        [
            ("الضغط على زر نقل الوحدة", "من صفحة الحجز، يضغط الموظف زر «🔄 نقل الوحدة»."),
            ("عرض البدائل الشاغرة فقط", "يعرض النظام قائمة منسدلة بالوحدات المتاحة فعلياً فقط في التواريخ المتبقية لنفس الحجز."),
            ("اختيار سياسة التسعير", "الاحتفاظ بنفس السعر السابق (مجاناً كتعويض عن العطل)، أو تعديل السعر حسب الوحدة الجديدة (ترقية مدفوعة)."),
            ("تسجيل سبب النقل والتأكيد", "اختيار سبب النقل (صيانة وعطل فني / ترقية Upgrade / طلب النزيل) ثم الضغط على تأكيد النقل.")
        ],
        "نقل الوحدة يحافظ على سجل الدفعات السابقة بالكامل ويوثق سبب النقل في الملاحظات.",
        "shot_09_transfer_modal.png"
    )

    # ==========================================================
    # SLIDE 16: Scenario 14 (Split Payments)
    # ==========================================================
    build_detailed_scenario_slide(
        "3️⃣ العمليات أثناء الإقامة",
        "تجزئة السداد وتعدد طرق الدفع كاش وبنكياً",
        "السيناريو رقم 14",
        "حجز بقيمة 3 ملايين روبية، النزيل دفع مليون عربون بالتحويل البنكي، ومليون كاش عند الوصول، ومليون كاش عند المغادرة.",
        [
            ("تسجيل الدفعة الأولى (عربون بنكي)", "تسجيل دفعة بقيمة 1.000.000 بطريقة (تحويل بنكي Transfer) مع كتابة رقم المرجع البنكي."),
            ("تسجيل الدفعة الثانية (كاش عند الدخول)", "عند تسجيل الوصول يضغط الموظف «إضافة دفعة» ويسجل 1.000.000 بطريقة (نقداً Cash)."),
            ("تسجيل الدفعة الثالثة (تصفية الحساب)", "قبل المغادرة يضغط الموظف «إضافة دفعة» ويسجل المليون الأخير ليصبح الرصيد 0 خالص."),
            ("طباعة الإيصال النهائي المجمع", "استخراج إيصال تأكيد الحجز المحدث الذي يظهر كل دفعة بتاريخها وطريقتها واسم الموظف المستلم.")
        ],
        "تتبع دقيق للرصيد المتبقي لحظة بلحظة، وتوزيع المقبوضات حسب قنواتها لمنع أي عجز أو تداخل في صندوق الدرج.",
        "سجل كل دفعة فور استلامها مباشرة داخل الحجز؛ تأجيل التسجيل هو السبب الأول لحدوث العجز المالي.",
        "shot_12_receipt_modal.png"
    )

    # ==========================================================
    # SLIDE 17: Scenarios 15, 16, 17 (Cancellations & Penalty Modal)
    # ==========================================================
    build_slide_with_screenshot(
        "4️⃣ الإلغاء وعدم الحضور",
        "الإلغاء مع اقتطاع غرامة فندقية رسمية وتسوية المبالغ",
        "السيناريوهات 15 و 16 و 17",
        "نزيل دفع مليون روبية وألغى متأخراً؛ وسياسة الفندق تقتضي خصم ليلة واحدة (400 ألف) كغرامة وإرجاع الباقي.",
        [
            ("الضغط على زر إلغاء الحجز", "فتح صفحة الحجز وضغط زر «إلغاء الحجز»."),
            ("اختيار سياسة خصم غرامة فندقية", "اختيار: «خصم غرامة إلغاء / رسوم إدارية (Partial Penalty)»."),
            ("إدخال مبلغ الغرامة المستقطع", "كتابة مبلغ غرامة الفندق (مثال: 400.000)؛ فيحسب النظام آلياً: المستحق إرجاعه للنزيل = 600.000."),
            ("تعديل قيمة الحجز واعتماد الإيراد", "يعدل النظام إجمالي الحجز ليصبح 400 ألف فقط (ليدخل في أرباح الفندق الرسمية) ويسجل استرداد 600 ألف للنزيل.")
        ],
        "الغرامة الفندقية هي إيراد رسمي للفندق؛ والنظام يضمن إدراجها ضمن دخل الفندق المحاسبي بدقة.",
        "shot_11_cancel_modal.png"
    )

    # ==========================================================
    # SLIDE 18: Scenario 18 (No-Show)
    # ==========================================================
    build_detailed_scenario_slide(
        "4️⃣ الإلغاء وعدم الحضور",
        "تسجيل عدم حضور النزيل ومصادرة العربون",
        "السيناريو رقم 18",
        "النزيل حجز ودفع عربوناً وانقضى موعد وصوله ولم يحضر ولم يتواصل مع الفندق إطلاقاً.",
        [
            ("الضغط على زر لم يحضر", "من صفحة الحجز المؤكد، يضغط الموظف على زر «لم يحضر (No-Show)»."),
            ("اختيار مصادرة كامل المبلغ", "اختيار سياسة: «مصادرة كامل المبلغ / غير قابل للاسترداد (Denda 100%)»."),
            ("اعتماد الغرامة بالكامل", "يعتمد النظام كامل المبلغ المدفوع كإيراد غرامة عدم حضور رسمية للفندق (المستحق للنزيل = 0)."),
            ("تحرير الغرفة للبيع الفوري", "تتحول حالة الحجز لـ «لم يحضر» بالوسام الأصفر، وتتحرر الغرفة فوراً في التقويم لتباع لنزيل جديد.")
        ],
        "مصادرة العربون كإيراد مستحق للفندق تعويضاً عن حجز الغرفة ومنع بيعها، مع إخلاء الغرفة لإعادة استثمارها.",
        "تسجيل No-Show يحفظ حق الفندق المالي ويسمح لك ببيع الغرفة فوراً لأي نزيل Walk-in في نفس الليلة.",
        "shot_11_cancel_modal.png"
    )

    # ==========================================================
    # SLIDE 19: Scenarios 19 & 20 (Housekeeping)
    # ==========================================================
    build_slide_with_screenshot(
        "5️⃣ النظافة وإدارة المرافق",
        "نظام متابعة نظافة الغرف والفلل الفوري (Housekeeping)",
        "السيناريوهات 19 و 20",
        "متابعة دورة نظافة الغرف والفلل لمنع تسليم أي غرفة غير نظيفة أو تأخير تسكين النزلاء القادمين.",
        [
            ("التحول التلقائي بعد المغادرة (س 19)", "بمجرد ضغط الموظف على «تسجيل المغادرة»، تتحول حالة الغرفة فوراً إلى 🧹 تحتاج تنظيف."),
            ("بدء تنظيف الغرفة بواسطة العامل", "عندما يدخل عامل النظافة للغرفة، ينقر الموظف البادج لتتحول إلى 🧼 جاري التنظيف."),
            ("اكتمال النظافة والفحص (س 20)", "عند انتهاء التنظيف وتعطير الغرفة، ينقر الموظف لتتحول إلى ✨ جاهزة ونظيفة."),
            ("لوحة النظافة في شاشة اليوم", "متابعة إحصائية الفلل والغرف الجاهزة والفلترة بنقرة زر واحدة من شريط النظافة العلوي.")
        ],
        "القاعدة الذهبية: لا تسكن أي ضيف في غرفة بادجها 🧹 أو 🧼؛ تأكد دائماً أنها ✨ جاهزة ونظيفة.",
        "shot_02_today_dashboard.png"
    )

    # ==========================================================
    # SLIDE 20: Scenario 21 (Parent-Child Hierarchy)
    # ==========================================================
    build_slide_with_screenshot(
        "5️⃣ النظافة وإدارة المرافق",
        "حجز الفيلا كاملة مقابل الغرف التابعة لها في التقويم",
        "السيناريو رقم 21",
        "طبيعة فلل نيو براتاما: بعض الفلل تُؤجر إما كفيلا كاملة (مثل Villa 16) أو كغرف مستقلة (Villa 16 - Kamar 1, 2, 3...).",
        [
            ("حجز الفيلا بالكامل (Master Villa)", "إذا حجز النزيل الفيلا كاملة، يقوم النظام تلقائياً بإغلاق وحظر جميع غرفها التابعة في نفس التواريخ."),
            ("حجز غرفة واحدة داخل الفيلا", "إذا حجز النزيل غرفة واحدة، يقوم النظام تلقائياً بحظر بيع الفيلا كاملة ككتلة واحدة في تلك التواريخ."),
            ("إتاحة الغرف المتبقية فقط", "يسمح النظام فقط ببيع الغرف الأخرى الشاغرة داخل نفس الفيلا للنزلاء الآخرين."),
            ("عرض التقويم التفاعلي بـ 96 وحدة", "إمكانية طي وتوسيع غرف الفلل في التقويم لمتابعة الإشغال بنظرة بانورامية واحدة.")
        ],
        "نظام الغرف المتشعبة يضمن عدم حدوث أي تضارب بين تأجير الفيلا كاملة أو مفرقة.",
        "shot_05_calendar.png"
    )

    # ==========================================================
    # SLIDE 21: Scenario 22 (Maintenance Blocks)
    # ==========================================================
    build_detailed_scenario_slide(
        "5️⃣ النظافة وإدارة المرافق",
        "إغلاقات الصيانة المجدولة وحظر البيع (Room Blocks)",
        "السيناريو رقم 22",
        "فيلا تحتاج صيانة مسبح أو غرفة تحتاج أعمال دهان وسباكة لمدة 3 أيام؛ يجب حظر بيعها على التقويم.",
        [
            ("الدخول على إعدادات الصيانة", "من القائمة الجانبية يختار المدير «الإعدادات» ثم تبويب «إغلاقات الصيانة»."),
            ("إضافة إغلاق صيانة جديد", "الضغط على زر «إضافة إغلاق» وتحديد الوحدة المعطلة (فيلا أو غرفة)."),
            ("تحديد فترة الصيانة والسبب", "تحديد تاريخ البدء وتاريخ الانتهاء وكتابة سبب الصيانة (مثال: صيانة مسبح / دهان)."),
            ("حظر الوحدة من البيع آلياً", "تظهر الوحدة بلون رمادي مغلق على التقويم وتُحجب تلقائياً من قائمة الحجز وتُستثنى من حساب الإشغال.")
        ],
        "حماية الغرف المعطلة من البيع بالخطأ، واستثناؤها من حساب نسبة الإشغال الفعلية حتى لا تؤثر سلباً على أرقام الفندق.",
        "إغلاقات الصيانة هي من صلاحيات المدير فقط لحوكمة أسباب خروج الوحدات من الخدمة.",
        "shot_05_calendar.png"
    )

    # ==========================================================
    # SLIDE 22: Scenario 23 (Overdue Alerts)
    # ==========================================================
    build_detailed_scenario_slide(
        "6️⃣ الرقابة والتدقيق المالي",
        "متابعة المتأخرات وحسم تأخر الخروج والدخول",
        "السيناريو رقم 23",
        "نزيل تجاوز موعد خروجه دون التنسيق مع الاستقبال، أو حجز مؤكد انتهى موعد وصوله ولم يحضر النزيل بعد.",
        [
            ("شريط التنبيهات الأحمر العاجل", "يظهر شريط أحمر بارز أعلى شاشة اليوم: «تنبيهات تتطلب إجراءً (تأخر دخول أو مغادرة)»."),
            ("حالة تجاوز موعد المغادرة", "إذا كانت الحالة (تجاوز موعد المغادرة): يتصل الاستقبال بالنزيل فوراً لطلب الخروج أو عمل تمديد إقامة مدفوع."),
            ("حالة التأخر عن تسجيل الدخول", "إذا كانت الحالة (لم يسجل الدخول بعد): يتواصل الاستقبال مع النزيل للتأكد من موعد قدومه أو تسجيل No-Show."),
            ("حسم التنبيه بنقرة زر", "بمجرد عمل المغادرة أو التمديد، يختفي التنبيه الأحمر تلقائياً من الشاشة.")
        ],
        "منع بقاء النزلاء في الغرف مجاناً بعد انتهاء حجزهم، وضمان تجهيز الغرف في مواعيدها المحددة للنزلاء القادمين.",
        "راقب الشريط الأحمر أعلى شاشة اليوم أولاً بأول؛ أي اسم يظهر فيه يتطلب اتصالاً هاتفياً فورياً من الاستقبال.",
        "shot_02_today_dashboard.png"
    )

    # ==========================================================
    # SLIDE 23: Scenario 24 (Cash Audit & Excel Flash Report)
    # ==========================================================
    build_slide_with_screenshot(
        "6️⃣ الرقابة والتدقيق المالي",
        "تقفيل الصندوق وتوزيع المقبوضات وتصدير الإكسل",
        "السيناريو رقم 24",
        "نهاية الوردية اليومية وجرد النقدية الفعلي في الدرج مقارنة بما تم تحصيله بنكياً وعبر التطبيقات وتصدير تقرير المحاسبة.",
        [
            ("فحص كرت المقبوضات في لوحة المدير", "يظهر كرت المقبوضات اليومية موزعاً بدقة: (كاش 💵 | بنك 🏦 | تطبيقات 📱)."),
            ("مطابقة النقد الفعلي في الدرج", "مطابقة رقم المقبوضات النقدية (Cash) مع الكاش الفعلي في درج الاستقبال بالروبية."),
            ("تصدير التقرير اليومي الشامل للإكسل", "الضغط على زر «📥 تصدير إلى Excel» لتنزيل ملف الفلاش اليومي المعتمد بنقرة واحدة."),
            ("مشاركة التقرير مع الإدارة والمحاسب", "يحتوي ملف الإكسل على كافة تفاصيل الإشغال، الحجوزات، وأسماء النزلاء، وتوزيع الإيرادات.")
        ],
        "تصدير تقرير الإكسل ومطابقة كاش الدرج هو الإجراء الإلزامي الأخير قبل تسليم الوردية.",
        "shot_06_reports.png"
    )

    # ==========================================================
    # SLIDE 24: Golden SOP Cheat Sheet
    # ==========================================================
    s24 = prs.slides.add_slide(blank_layout)
    add_bg(s24, C_NAVY)

    f24 = s24.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9))
    f24.fill.solid()
    f24.fill.fore_color.rgb = C_NAVY_LIGHT
    f24.line.color.rgb = C_GOLD
    f24.line.width = Pt(2)

    tb = s24.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(10.9), Inches(5.3))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "📋 القواعد الذهبية الست لموظف الاستقبال (Front Desk Golden SOP)"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.name = FONT_AR
    p.font.color.rgb = C_GOLD
    p.alignment = PP_ALIGN.CENTER

    golden_sops = [
        ("1. حجوزات التطبيقات مسبقة الدفع (OTA):", "المتبقي المطلوب عند الكاونتر = 0. لا تطلب كاش إطلاقاً ولا تسجل دفعة كاش وهمية."),
        ("2. معيار تسليم الغرفة للنظافة:", "لا تسكن أي ضيف في غرفة بادجها 🧹 أو 🧼؛ تأكد دائماً أنها ✨ جاهزة ونظيفة ومفحوصة."),
        ("3. التحذير المالي عند المغادرة:", "إذا ظهر لك تنبيه المتبقي المالي الأحمر عند المغادرة، لا تضغط موافق حتى تحصيل المبلغ كاملاً."),
        ("4. تمديد الإقامة الآمن:", "استخدم دائماً زر «⏱️ تمديد الإقامة» ليفحص النظام التوفر ويمنع حدوث حجز مزدوج لغيره."),
        ("5. الخروج المبكر ونقل الغرف:", "استخدم أزرار النظام المخصصة لتسوية الحساب تلقائياً وتحرير الغرفة للبيع لغيره في نفس اليوم."),
        ("6. جرد نهاية الوردية اليومية:", "طابق الكاش الفعلي في الدرج مع رقم المقبوضات النقدية وقم بتصدير تقرير الإكسل للإدارة فوراً.")
    ]
    for title, desc in golden_sops:
        p_t = tf.add_paragraph()
        p_t.text = f"\n{title} {desc}"
        p_t.font.size = Pt(12)
        p_t.font.name = FONT_AR
        p_t.font.color.rgb = C_WHITE

    # ==========================================================
    # SLIDE 25: Conclusion & System Access
    # ==========================================================
    s25 = prs.slides.add_slide(blank_layout)
    add_bg(s25, C_NAVY)

    tb = s25.shapes.add_textbox(Inches(1.5), Inches(1.6), Inches(10.3), Inches(4.8))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "معاً نحو إدارة فندقية رائدة وضيافة استثنائية"
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.name = FONT_AR
    p.font.color.rgb = C_GOLD
    p.alignment = PP_ALIGN.CENTER

    p1 = tf.add_paragraph()
    p1.text = "\nمجمع نيو براتاما الفندقي · بونشاك | ALMAGD Hospitality"
    p1.font.size = Pt(18)
    p1.font.bold = True
    p1.font.name = FONT_AR
    p1.font.color.rgb = C_WHITE
    p1.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = "\nرابط النظام الحي: https://almagd.pages.dev/admin"
    p2.font.size = Pt(15)
    p2.font.bold = True
    p2.font.name = FONT_AR
    p2.font.color.rgb = RGBColor(147, 197, 253)
    p2.alignment = PP_ALIGN.CENTER

    p3 = tf.add_paragraph()
    p3.text = "\nبيانات الدخول المعتمدة للاستقبال والإدارة محفوظة في ملف CREDENTIALS.md"
    p3.font.size = Pt(13)
    p3.font.name = FONT_AR
    p3.font.color.rgb = RGBColor(203, 213, 225)
    p3.alignment = PP_ALIGN.CENTER

    out_file = "ALMAGD_PMS_Visual_Master_Presentation.pptx"
    prs.save(out_file)
    print(f"Visual Master presentation successfully generated: {out_file} (25 slides with screenshots)")

if __name__ == "__main__":
    build_presentation()
