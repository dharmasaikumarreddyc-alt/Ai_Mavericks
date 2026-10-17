"""Generate the accurate Aisle AI hackathon presentation."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# Colors
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
BLACK      = RGBColor(0x1A, 0x1A, 0x1A)
GREEN      = RGBColor(0x2D, 0xBF, 0x6E)
LIGHT_GREEN= RGBColor(0xE8, 0xF8, 0xEE)
DARK_GREEN = RGBColor(0x1A, 0x8C, 0x4E)
GRAY       = RGBColor(0x6B, 0x72, 0x80)
LIGHT_GRAY = RGBColor(0xF3, 0xF4, 0xF6)
DARK_GRAY  = RGBColor(0x37, 0x41, 0x51)
ORANGE     = RGBColor(0xF5, 0x9E, 0x0B)

W = Inches(13.33)
H = Inches(7.5)

prs = Presentation()
prs.slide_width  = W
prs.slide_height = H

BLANK = prs.slide_layouts[6]  # completely blank

def add_rect(slide, l, t, w, h, fill=None, border=None, border_w=Pt(1)):
    shp = slide.shapes.add_shape(1, l, t, w, h)  # MSO_SHAPE_TYPE.RECTANGLE = 1
    shp.line.fill.background() if border is None else None
    if fill:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    else:
        shp.fill.background()
    if border:
        shp.line.color.rgb = border
        shp.line.width = border_w
    else:
        shp.line.fill.background()
    return shp

def add_text(slide, text, l, t, w, h, size=18, bold=False, color=BLACK,
             align=PP_ALIGN.LEFT, wrap=True, italic=False):
    txb = slide.shapes.add_textbox(l, t, w, h)
    tf  = txb.text_frame
    tf.word_wrap = wrap
    p   = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size   = Pt(size)
    run.font.bold   = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return txb

def add_multiline(slide, lines, l, t, w, h, base_size=14, color=BLACK, align=PP_ALIGN.LEFT):
    """lines = list of (text, size, bold, color)"""
    txb = slide.shapes.add_textbox(l, t, w, h)
    tf  = txb.text_frame
    tf.word_wrap = True
    first = True
    for (txt, sz, bld, clr) in lines:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = align
        run = p.add_run()
        run.text = txt
        run.font.size  = Pt(sz)
        run.font.bold  = bld
        run.font.color.rgb = clr
    return txb

def circle_bullet(slide, cx, cy, r, label, sub="", num_label=""):
    """Draw a circle with icon text and label below."""
    add_rect(slide, cx - r, cy - r, r*2, r*2, fill=LIGHT_GRAY)
    # num
    if num_label:
        add_text(slide, num_label, cx - r, cy - r, r*2, r*2,
                 size=20, bold=True, color=DARK_GREEN, align=PP_ALIGN.CENTER)
    if label:
        add_text(slide, label, cx - Inches(0.9), cy + r + Inches(0.05),
                 Inches(1.8), Inches(0.4), size=11, bold=False, color=DARK_GRAY, align=PP_ALIGN.CENTER)
    if sub:
        add_text(slide, sub, cx - Inches(1.0), cy + r + Inches(0.45),
                 Inches(2.0), Inches(0.5), size=10, color=GRAY, align=PP_ALIGN.CENTER)

# ─────────────────────────────────────────────
# SLIDE 1 – Title
# ─────────────────────────────────────────────
sl = prs.slides.add_slide(BLANK)

# Green top bar
add_rect(sl, 0, 0, W, Inches(0.08), fill=GREEN)

# Left accent stripe
add_rect(sl, 0, Inches(0.08), Inches(0.06), H - Inches(0.08), fill=GREEN)

# Big title
add_text(sl, "Aisle AI",
         Inches(1.0), Inches(1.5), Inches(8), Inches(1.4),
         size=52, bold=True, color=BLACK)

# Green underline
add_rect(sl, Inches(1.0), Inches(2.9), Inches(4.5), Inches(0.06), fill=GREEN)

# Subtitle
add_text(sl, "Closed-Loop Commerce, From Intent to Action",
         Inches(1.0), Inches(3.1), Inches(9), Inches(0.7),
         size=26, bold=False, color=DARK_GRAY)

# Description
add_text(sl,
         "Gemini-assisted discovery prepares a grounded cart; deterministic\n"
         "controls persist a customer-confirmed order; merchant signals\n"
         "turn into evidence-grounded operational action.",
         Inches(1.0), Inches(3.9), Inches(8), Inches(1.5),
         size=17, color=GRAY)

# Team badge
add_rect(sl, Inches(1.0), Inches(5.6), Inches(2.2), Inches(0.5), fill=LIGHT_GREEN, border=GREEN)
add_text(sl, "EA Mavericks Team",
         Inches(1.05), Inches(5.62), Inches(2.1), Inches(0.46),
         size=13, bold=True, color=DARK_GREEN)

# Right side decorative block
add_rect(sl, Inches(9.5), Inches(1.0), Inches(3.5), Inches(5.5), fill=LIGHT_GREEN)
for i, (label, icon) in enumerate([
    ("Find Merchants", "🔍"),
    ("Compare & Rank", "⚖️"),
    ("Talk to AI", "🎙️"),
    ("Human Approval", "🔒"),
]):
    y = Inches(1.3) + i * Inches(1.25)
    add_text(sl, icon + "  " + label,
             Inches(9.8), y, Inches(3.0), Inches(0.55),
             size=16, bold=True, color=DARK_GREEN)
    line_y = y + Inches(0.55)
    if i < 3:
        add_rect(sl, Inches(9.8), line_y, Inches(2.8), Inches(0.02), fill=GREEN)

add_rect(sl, 0, H - Inches(0.08), W, Inches(0.08), fill=GREEN)

# ─────────────────────────────────────────────
# SLIDE 2 – Before vs After (matching the image)
# ─────────────────────────────────────────────
sl = prs.slides.add_slide(BLANK)
add_rect(sl, 0, 0, W, Inches(0.08), fill=GREEN)

# Title
add_text(sl, "Aisle AI",
         Inches(0.4), Inches(0.15), Inches(7), Inches(0.7),
         size=28, bold=True, color=BLACK)

# ---- BEFORE column ----
add_rect(sl, Inches(0.4), Inches(1.0), Inches(2.8), Inches(0.45), fill=LIGHT_GRAY, border=GRAY, border_w=Pt(1.5))
add_text(sl, "Before", Inches(0.5), Inches(1.0), Inches(1.2), Inches(0.45), size=16, bold=True, color=BLACK)

add_rect(sl, Inches(0.4), Inches(1.52), Inches(2.8), Inches(0.38), fill=LIGHT_GRAY)
add_text(sl, "Fragmented and repetitive", Inches(0.5), Inches(1.54), Inches(2.6), Inches(0.35), size=12, bold=False, color=DARK_GRAY)

before_steps = ["manual browsing", "merchant search", "product comparison", "cart management"]
for i, step in enumerate(before_steps):
    y = Inches(2.1) + i * Inches(0.75)
    add_rect(sl, Inches(0.55), y, Inches(0.45), Inches(0.45), fill=LIGHT_GRAY, border=GRAY)
    add_text(sl, "○", Inches(0.6), y, Inches(0.4), Inches(0.45), size=18, color=GRAY, align=PP_ALIGN.CENTER)
    add_text(sl, step, Inches(1.1), y + Inches(0.05), Inches(1.9), Inches(0.4), size=13, color=DARK_GRAY)
    if i < len(before_steps) - 1:
        add_rect(sl, Inches(0.75), y + Inches(0.45), Inches(0.05), Inches(0.28), fill=GRAY)

# ---- Arrow ----
add_text(sl, "›", Inches(3.35), Inches(2.5), Inches(0.6), Inches(0.7), size=36, bold=True, color=GREEN, align=PP_ALIGN.CENTER)

# ---- AFTER column ----
add_rect(sl, Inches(4.0), Inches(1.0), Inches(2.8), Inches(0.45), fill=LIGHT_GREEN, border=GREEN, border_w=Pt(1.5))
add_text(sl, "After", Inches(4.1), Inches(1.0), Inches(1.2), Inches(0.45), size=16, bold=True, color=DARK_GREEN)

add_rect(sl, Inches(4.0), Inches(1.52), Inches(2.8), Inches(0.38), fill=LIGHT_GREEN)
add_text(sl, "one request and one confirmation", Inches(4.1), Inches(1.54), Inches(2.9), Inches(0.35), size=12, bold=False, color=DARK_GREEN)

after_steps = ["grounded catalog search", "Gemini-assisted selection", "explicit confirmation +\nmerchant fulfillment"]
for i, step in enumerate(after_steps):
    y = Inches(2.1) + i * Inches(1.0)
    add_rect(sl, Inches(4.15), y, Inches(0.45), Inches(0.45), fill=LIGHT_GREEN, border=GREEN)
    add_text(sl, "✓", Inches(4.18), y, Inches(0.4), Inches(0.45), size=14, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
    add_text(sl, step, Inches(4.7), y + Inches(0.02), Inches(1.9), Inches(0.55), size=13, color=DARK_GRAY)
    if i < len(after_steps) - 1:
        add_rect(sl, Inches(4.35), y + Inches(0.45), Inches(0.05), Inches(0.53), fill=GREEN)

# ---- Right panel ----
add_rect(sl, Inches(7.2), Inches(0.9), Inches(5.85), Inches(5.9), fill=WHITE)

add_text(sl, "Aisle AI: Closed-Loop\nCommerce Copilot",
         Inches(7.4), Inches(1.0), Inches(5.5), Inches(1.1),
         size=22, bold=True, color=BLACK)

add_text(sl,
         "A governed commerce copilot that connects grounded product discovery,\n"
         "explicit customer confirmation, persistent orders, merchant fulfillment,\n"
         "and evidence-grounded operational insight.",
         Inches(7.4), Inches(2.15), Inches(5.5), Inches(1.1),
         size=13, color=DARK_GRAY)

add_text(sl,
         "Manual browsing and repeated comparison add friction to the shopping journey.\n"
         "Aisle AI reduces those repeated steps by connecting grounded discovery,\n"
         "explicit confirmation, and merchant operations in one governed flow.",
         Inches(7.4), Inches(3.35), Inches(5.5), Inches(1.0),
         size=13, color=GRAY)

# Green highlight box
add_rect(sl, Inches(7.4), Inches(4.45), Inches(5.5), Inches(1.15), fill=LIGHT_GREEN, border=GREEN)
add_text(sl, "✓  Aisle AI connects customer intent with merchant action.",
         Inches(7.55), Inches(4.5), Inches(5.2), Inches(0.5),
         size=13, bold=True, color=DARK_GREEN)
add_text(sl,
         "From fragmented browsing to one grounded request and explicit confirmation.\nCustomer intent now connects to merchant action.",
         Inches(7.55), Inches(4.98), Inches(5.2), Inches(0.55),
         size=12, color=DARK_GRAY)

# Bottom three pillars
for i, (icon, title, desc) in enumerate([
    ("→", "Discover",       "Search a bounded synthetic\ndemo catalog"),
    ("→", "Compose",      "Gemini helps satisfy\nintent and constraints"),
    ("→", "Close the Loop","Confirmed orders reach\nmerchant operations"),
]):
    x = Inches(0.4) + i * Inches(4.3)
    add_rect(sl, x, Inches(6.5), Inches(4.0), Inches(0.02), fill=GREEN)
    add_text(sl, icon + "  " + title,
             x, Inches(6.55), Inches(4.0), Inches(0.4),
             size=14, bold=True, color=DARK_GREEN)
    add_text(sl, desc, x, Inches(6.95), Inches(4.0), Inches(0.45),
             size=11, color=GRAY)

add_rect(sl, 0, H - Inches(0.08), W, Inches(0.08), fill=GREEN)

# ─────────────────────────────────────────────
# SLIDE 3 – Talk to AI: Hands-Free Ordering
# ─────────────────────────────────────────────
sl = prs.slides.add_slide(BLANK)
add_rect(sl, 0, 0, W, Inches(0.08), fill=GREEN)
add_rect(sl, 0, Inches(0.08), Inches(0.06), H - Inches(0.08), fill=GREEN)

# Section label
add_rect(sl, Inches(0.4), Inches(0.3), Inches(2.0), Inches(0.35), fill=GREEN)
add_text(sl, "KEY FEATURE", Inches(0.45), Inches(0.31), Inches(1.9), Inches(0.33),
         size=11, bold=True, color=WHITE)

add_text(sl, "Talk to AI",
         Inches(0.4), Inches(0.8), Inches(7), Inches(1.0),
         size=44, bold=True, color=BLACK)
add_text(sl, "Hands-Free Ordering — Just Speak, We Handle the Rest.",
         Inches(0.4), Inches(1.75), Inches(9), Inches(0.6),
         size=20, color=DARK_GREEN, bold=True)
add_text(sl,
         "No browsing. No searching. No checkout forms.\n"
         "Simply tell the AI what you want — it finds the best merchant, compares options,\n"
         "checks your budget rules, and prepares an order for explicit confirmation.",
         Inches(0.4), Inches(2.45), Inches(8.5), Inches(1.2),
         size=15, color=DARK_GRAY)

# Conversation demo box
add_rect(sl, Inches(0.4), Inches(3.75), Inches(6.5), Inches(2.9), fill=LIGHT_GRAY)
add_text(sl, "Live Demo Conversation",
         Inches(0.6), Inches(3.82), Inches(4), Inches(0.4),
         size=13, bold=True, color=DARK_GRAY)

convos = [
    ("🧑  You:",    "I have a serious coffee craving. Find me the best place on my way home.", DARK_GRAY, False),
    ("🤖  AI:",     "Found 3 synthetic demo merchants. Aisle Coffee Lab has your latte. Choose it?", DARK_GREEN, False),
    ("🧑  You:",    "Aisle Coffee Lab.", DARK_GRAY, False),
    ("🤖  AI:",     "Adding a Medium Latte — $5.75. Use a simulated token or COD?", DARK_GREEN, False),
    ("🧑  You:",    "Yes.", DARK_GRAY, False),
    ("🤖  AI:",     "✓ Order confirmed! The merchant can now begin preparation.", GREEN, True),
]
for i, (who, msg, clr, bld) in enumerate(convos):
    y = Inches(4.3) + i * Inches(0.36)
    add_text(sl, who, Inches(0.6), y, Inches(1.0), Inches(0.35), size=11, bold=True, color=GRAY)
    add_text(sl, msg, Inches(1.65), y, Inches(5.0), Inches(0.35), size=11, bold=bld, color=clr)

# Right side – what the agents did
add_rect(sl, Inches(7.3), Inches(0.9), Inches(5.7), Inches(5.7), fill=LIGHT_GREEN)
add_text(sl, "What happened in the background",
         Inches(7.5), Inches(1.0), Inches(5.3), Inches(0.6),
         size=16, bold=True, color=BLACK)

agents = [
    ("Catalog Retrieval", "Searched bounded synthetic\nmerchant records"),
    ("Gemini Reasoning",   "Interpreted intent and explained\nthe grounded recommendation"),
    ("Commerce Controls",  "Recomputed prices and required\nexplicit confirmation"),
    ("Order Workflow",     "Persisted the order with honest\npayment status"),
]
for i, (name, desc) in enumerate(agents):
    y = Inches(1.75) + i * Inches(1.1)
    add_rect(sl, Inches(7.5), y, Inches(0.45), Inches(0.45), fill=GREEN)
    add_text(sl, str(i+1), Inches(7.5), y, Inches(0.45), Inches(0.45),
             size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(sl, name, Inches(8.1), y, Inches(4.5), Inches(0.45),
             size=14, bold=True, color=DARK_GREEN)
    add_text(sl, desc, Inches(8.1), y + Inches(0.42), Inches(4.5), Inches(0.5),
             size=12, color=DARK_GRAY)

add_rect(sl, 0, H - Inches(0.08), W, Inches(0.08), fill=GREEN)

# ─────────────────────────────────────────────
# SLIDE 4 – Multi-Agent Architecture
# ─────────────────────────────────────────────
sl = prs.slides.add_slide(BLANK)
add_rect(sl, 0, 0, W, Inches(0.08), fill=GREEN)
add_rect(sl, 0, Inches(0.08), Inches(0.06), H - Inches(0.08), fill=GREEN)

add_text(sl, "Governed Commerce Architecture",
         Inches(0.4), Inches(0.25), Inches(10), Inches(0.75),
         size=32, bold=True, color=BLACK)
add_text(sl, "Gemini reasons over bounded evidence; deterministic services control consequential actions.",
         Inches(0.4), Inches(1.0), Inches(10), Inches(0.5),
         size=15, color=GRAY)

agent_cards = [
    ("🔍", "Search & Grounding", LIGHT_GREEN, DARK_GREEN,
     "Retrieves synthetic catalog records.\nProduct, price and availability evidence\nstays bounded and inspectable."),
    ("✨", "Gemini Planner", RGBColor(0xEF, 0xF6, 0xFF), RGBColor(0x1D, 0x4E, 0xD8),
     "Interprets natural-language intent\nand explains choices. PII is redacted\nand failures use a labelled fallback."),
    ("📋", "Commerce Controls", RGBColor(0xFF, 0xF7, 0xED), RGBColor(0xC2, 0x61, 0x0B),
     "Recomputes prices and totals, checks\nroles and ownership, and requires an\nexplicit customer confirmation."),
    ("🔒", "Order Workflow", RGBColor(0xFD, 0xF2, 0xF8), RGBColor(0x86, 0x19, 0x7A),
     "Persists customer and merchant views.\nPayment is simulated-token or COD;\nfulfillment follows valid transitions."),
]

for i, (icon, name, bg, accent, desc) in enumerate(agent_cards):
    x = Inches(0.4) + i * Inches(3.2)
    add_rect(sl, x, Inches(1.7), Inches(3.0), Inches(4.8), fill=bg)
    add_text(sl, icon, x + Inches(0.2), Inches(1.85), Inches(0.7), Inches(0.7), size=28)
    add_text(sl, name, x + Inches(0.2), Inches(2.6), Inches(2.6), Inches(0.55),
             size=15, bold=True, color=accent)
    add_rect(sl, x + Inches(0.2), Inches(3.2), Inches(2.6), Inches(0.04), fill=accent)
    add_text(sl, desc, x + Inches(0.2), Inches(3.35), Inches(2.65), Inches(2.8),
             size=12, color=DARK_GRAY)

    if i < 3:
        add_text(sl, "→", x + Inches(3.0), Inches(3.8), Inches(0.2), Inches(0.4),
                 size=18, bold=True, color=GREEN, align=PP_ALIGN.CENTER)

add_rect(sl, 0, H - Inches(0.08), W, Inches(0.08), fill=GREEN)

# ─────────────────────────────────────────────
# SLIDE 5 – Responsible AI & Human Control
# ─────────────────────────────────────────────
sl = prs.slides.add_slide(BLANK)
add_rect(sl, 0, 0, W, Inches(0.08), fill=GREEN)
add_rect(sl, 0, Inches(0.08), Inches(0.06), H - Inches(0.08), fill=GREEN)

add_rect(sl, Inches(0.4), Inches(0.3), Inches(2.4), Inches(0.35), fill=GREEN)
add_text(sl, "SECURITY", Inches(0.45), Inches(0.31), Inches(2.3), Inches(0.33),
         size=11, bold=True, color=WHITE)

add_text(sl, "Responsible AI Controls",
         Inches(0.4), Inches(0.8), Inches(7), Inches(0.85),
         size=38, bold=True, color=BLACK)
add_text(sl, "Grounded assistance with deterministic controls and human approval.",
         Inches(0.4), Inches(1.65), Inches(8), Inches(0.5),
         size=17, color=DARK_GREEN, bold=True)

flow_steps = [
    ("1", "Customer\nApproves",     "You confirm\nthe purchase"),
    ("2", "PII\nRedacted",          "Sensitive text is\nremoved from prompts"),
    ("3", "Evidence\nGrounded",      "Catalog and metrics\nbound the answer"),
    ("4", "Order\nPersisted",       "Simulated token\nor COD status"),
    ("5", "Merchant\nControls",      "Status changes are\nexplicitly approved"),
]

for i, (num, title, sub) in enumerate(flow_steps):
    x = Inches(0.5) + i * Inches(2.5)
    y_circle = Inches(2.5)
    r = Inches(0.4)
    add_rect(sl, x, y_circle, r*2, r*2, fill=GREEN)
    add_text(sl, num, x, y_circle, r*2, r*2,
             size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(sl, title, x - Inches(0.15), y_circle + Inches(0.95), Inches(1.1), Inches(0.6),
             size=13, bold=True, color=DARK_GRAY, align=PP_ALIGN.CENTER)
    add_text(sl, sub, x - Inches(0.15), y_circle + Inches(1.55), Inches(1.1), Inches(0.6),
             size=11, color=GRAY, align=PP_ALIGN.CENTER)
    if i < 4:
        add_text(sl, "→", x + Inches(0.9), y_circle + Inches(0.1), Inches(1.6), Inches(0.6),
                 size=22, bold=True, color=GREEN, align=PP_ALIGN.CENTER)

# Security benefits
add_rect(sl, Inches(0.4), Inches(4.8), Inches(12.5), Inches(2.1), fill=LIGHT_GREEN)
add_text(sl, "Why This Matters",
         Inches(0.6), Inches(4.9), Inches(5), Inches(0.45),
         size=16, bold=True, color=DARK_GREEN)

benefits = [
    "✓  PII redaction before model calls and on model output",
    "✓  Prompt-injection boundary for reviews and customer text",
    "✓  Deterministic price, policy, authentication, and order controls",
    "✓  Transparent fallbacks and prototype limitations",
]
for i, b in enumerate(benefits):
    x = Inches(0.6) + (i % 2) * Inches(6.2)
    y = Inches(5.45) + (i // 2) * Inches(0.5)
    add_text(sl, b, x, y, Inches(5.8), Inches(0.45), size=13, color=DARK_GRAY)

add_rect(sl, 0, H - Inches(0.08), W, Inches(0.08), fill=GREEN)

# ─────────────────────────────────────────────
# SLIDE 6 – Demand Intelligence & Merchant Console
# ─────────────────────────────────────────────
sl = prs.slides.add_slide(BLANK)
add_rect(sl, 0, 0, W, Inches(0.08), fill=GREEN)
add_rect(sl, 0, Inches(0.08), Inches(0.06), H - Inches(0.08), fill=GREEN)

add_text(sl, "Demand Intelligence  &  Merchant Operations",
         Inches(0.4), Inches(0.25), Inches(11), Inches(0.75),
         size=30, bold=True, color=BLACK)

# Intelligence left
add_rect(sl, Inches(0.4), Inches(1.1), Inches(5.9), Inches(5.5), fill=LIGHT_GREEN)
add_text(sl, "📈  Demand Intelligence",
         Inches(0.6), Inches(1.2), Inches(5.5), Inches(0.6),
         size=20, bold=True, color=DARK_GREEN)
add_text(sl,
         "Historical order patterns become directional forecasts.\n"
         "Gemini explains the evidence and suggests preparation,\n"
         "while the merchant keeps decision authority.",
         Inches(0.6), Inches(1.9), Inches(5.5), Inches(1.0),
         size=14, color=DARK_GRAY)

rewards = [
    ("Evidence",        "historical weekday and item patterns"),
    ("Explainable",     "sample size and source shown to merchant"),
    ("Actionable",      "stock-preparation guidance, not guarantees"),
    ("Resilient",       "deterministic fallback if Gemini is unavailable"),
]
for i, (k, v) in enumerate(rewards):
    y = Inches(3.1) + i * Inches(0.65)
    add_rect(sl, Inches(0.6), y, Inches(1.6), Inches(0.5), fill=GREEN)
    add_text(sl, k, Inches(0.65), y, Inches(1.5), Inches(0.5),
             size=12, bold=True, color=WHITE)
    add_text(sl, v, Inches(2.35), y + Inches(0.08), Inches(3.7), Inches(0.4),
             size=12, color=DARK_GRAY)

# Merchant console right
add_rect(sl, Inches(6.7), Inches(1.1), Inches(6.2), Inches(5.5), fill=LIGHT_GRAY)
add_text(sl, "🖥️  Merchant Console",
         Inches(6.9), Inches(1.2), Inches(5.8), Inches(0.6),
         size=20, bold=True, color=DARK_GRAY)
add_text(sl,
         "Live application order visibility for the signed-in merchant,\n"
         "with deterministic status transitions.",
         Inches(6.9), Inches(1.9), Inches(5.8), Inches(0.7),
         size=14, color=DARK_GRAY)

console_steps = [
    ("New Order Arrives",   "Persistent customer-confirmed order details"),
    ("Start Preparing",     "One click to accept and begin preparation"),
    ("Mark Ready",          "Status is persisted and visible to the customer"),
    ("Delivered",           "Order closes with its honest payment status"),
]
for i, (step, desc) in enumerate(console_steps):
    y = Inches(2.8) + i * Inches(0.78)
    add_rect(sl, Inches(6.9), y, Inches(0.45), Inches(0.45), fill=DARK_GRAY)
    add_text(sl, str(i+1), Inches(6.9), y, Inches(0.45), Inches(0.45),
             size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(sl, step, Inches(7.45), y, Inches(5.1), Inches(0.4),
             size=13, bold=True, color=DARK_GRAY)
    add_text(sl, desc, Inches(7.45), y + Inches(0.38), Inches(5.1), Inches(0.38),
             size=12, color=GRAY)

add_rect(sl, 0, H - Inches(0.08), W, Inches(0.08), fill=GREEN)

# ─────────────────────────────────────────────
# SLIDE 7 – Summary / Closing
# ─────────────────────────────────────────────
sl = prs.slides.add_slide(BLANK)
add_rect(sl, 0, 0, W, Inches(0.08), fill=GREEN)
add_rect(sl, 0, Inches(0.08), Inches(0.06), H - Inches(0.08), fill=GREEN)

add_text(sl, "The Future of Commerce\nIs Closed-Loop.",
         Inches(0.5), Inches(0.4), Inches(8), Inches(1.6),
         size=40, bold=True, color=BLACK)

add_rect(sl, Inches(0.5), Inches(1.95), Inches(5.0), Inches(0.06), fill=GREEN)

add_text(sl,
         "Aisle AI delivers a closed-loop shopping and merchant experience —\n"
         "from spoken intent to confirmed order and operational action.",
         Inches(0.5), Inches(2.1), Inches(8.5), Inches(0.9),
         size=16, color=DARK_GRAY)

summary = [
    ("🎙️", "Conversational Ordering", "Talk or type; Gemini prepares a grounded cart for confirmation"),
    ("🔍", "Intelligent Discovery",    "Gemini reasons over bounded synthetic catalog evidence"),
    ("📋", "Deterministic Commerce",   "Prices, roles, confirmation, payment status and order transitions are controlled"),
    ("🔒", "Responsible AI",           "PII redaction, grounding, role isolation, and human approval"),
    ("📈", "Demand Intelligence",      "Directional forecasts explain the historical evidence used"),
    ("🖥️", "Merchant Dashboard",       "Persistent order workflow and evidence-grounded customer insights"),
]

for i, (icon, title, desc) in enumerate(summary):
    col = i % 2
    row = i // 2
    x = Inches(0.5) + col * Inches(6.4)
    y = Inches(3.1) + row * Inches(1.1)
    add_rect(sl, x, y, Inches(0.5), Inches(0.5), fill=GREEN)
    add_text(sl, icon, x, y, Inches(0.5), Inches(0.5), size=18, align=PP_ALIGN.CENTER)
    add_text(sl, title, x + Inches(0.65), y, Inches(5.5), Inches(0.45),
             size=14, bold=True, color=DARK_GREEN)
    add_text(sl, desc, x + Inches(0.65), y + Inches(0.42), Inches(5.5), Inches(0.45),
             size=12, color=GRAY)

# Final tagline
add_rect(sl, Inches(0.5), Inches(6.35), Inches(12.3), Inches(0.7), fill=GREEN)
add_text(sl, "From customer intent to merchant action — one transparent, Gemini-powered loop.",
         Inches(0.7), Inches(6.4), Inches(11.9), Inches(0.6),
         size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

add_rect(sl, 0, H - Inches(0.08), W, Inches(0.08), fill=GREEN)

# ─────────────────────────────────────────────
prs.save("Agentic_AI_Checkout.pptx")
print("Saved: Agentic_AI_Checkout.pptx")
