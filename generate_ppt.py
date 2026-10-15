"""Generate Agentic AI Checkout presentation."""
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
add_text(sl, "Agentic AI Checkout",
         Inches(1.0), Inches(1.5), Inches(8), Inches(1.4),
         size=52, bold=True, color=BLACK)

# Green underline
add_rect(sl, Inches(1.0), Inches(2.9), Inches(4.5), Inches(0.06), fill=GREEN)

# Subtitle
add_text(sl, "The 30-Second E-Commerce Revolution",
         Inches(1.0), Inches(3.1), Inches(9), Inches(0.7),
         size=26, bold=False, color=DARK_GRAY)

# Description
add_text(sl,
         "A multi-agent AI system that autonomously finds merchants,\n"
         "selects products, and completes checkout — transforming\n"
         "shopping from manual effort to intelligent automation.",
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
    ("Tokenized Pay", "🔒"),
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
add_text(sl, "Agentic AI Checkout",
         Inches(0.4), Inches(0.15), Inches(7), Inches(0.7),
         size=28, bold=True, color=BLACK)

# ---- BEFORE column ----
add_rect(sl, Inches(0.4), Inches(1.0), Inches(2.8), Inches(0.45), fill=LIGHT_GRAY, border=GRAY, border_w=Pt(1.5))
add_text(sl, "Before", Inches(0.5), Inches(1.0), Inches(1.2), Inches(0.45), size=16, bold=True, color=BLACK)

add_rect(sl, Inches(0.4), Inches(1.52), Inches(2.8), Inches(0.38), fill=LIGHT_GRAY)
add_text(sl, "5 minutes and 12 clicks", Inches(0.5), Inches(1.54), Inches(2.6), Inches(0.35), size=12, bold=False, color=DARK_GRAY)

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
add_text(sl, "30 seconds and 2 clicks", Inches(4.1), Inches(1.54), Inches(2.6), Inches(0.35), size=12, bold=False, color=DARK_GREEN)

after_steps = ["AI agents find merchants", "select products", "prepare order for\none-click confirmation"]
for i, step in enumerate(after_steps):
    y = Inches(2.1) + i * Inches(1.0)
    add_rect(sl, Inches(4.15), y, Inches(0.45), Inches(0.45), fill=LIGHT_GREEN, border=GREEN)
    add_text(sl, "✓", Inches(4.18), y, Inches(0.4), Inches(0.45), size=14, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
    add_text(sl, step, Inches(4.7), y + Inches(0.02), Inches(1.9), Inches(0.55), size=13, color=DARK_GRAY)
    if i < len(after_steps) - 1:
        add_rect(sl, Inches(4.35), y + Inches(0.45), Inches(0.05), Inches(0.53), fill=GREEN)

# ---- Right panel ----
add_rect(sl, Inches(7.2), Inches(0.9), Inches(5.85), Inches(5.9), fill=WHITE)

add_text(sl, "Cart Pilot: The 30-Second\nE-Commerce Revolution",
         Inches(7.4), Inches(1.0), Inches(5.5), Inches(1.1),
         size=22, bold=True, color=BLACK)

add_text(sl,
         "A multi-agent AI system that autonomously finds merchants, selects\n"
         "products, and prepares orders — transforming online shopping from\n"
         "manual labour to intelligent automation.",
         Inches(7.4), Inches(2.15), Inches(5.5), Inches(1.1),
         size=13, color=DARK_GRAY)

add_text(sl,
         "Manual friction destroys conversion rates and user patience. E-commerce\n"
         "remains a labour-intensive chore — and that is the problem Cart Pilot\n"
         "was built to solve.",
         Inches(7.4), Inches(3.35), Inches(5.5), Inches(1.0),
         size=13, color=GRAY)

# Green highlight box
add_rect(sl, Inches(7.4), Inches(4.45), Inches(5.5), Inches(1.15), fill=LIGHT_GREEN, border=GREEN)
add_text(sl, "✓  Cart Pilot doesn't just speed up shopping — it redefines it.",
         Inches(7.55), Inches(4.5), Inches(5.2), Inches(0.5),
         size=13, bold=True, color=DARK_GREEN)
add_text(sl,
         "From 5 minutes to 30 seconds. From 12 clicks to 2.\nThe future of e-commerce is autonomous.",
         Inches(7.55), Inches(4.98), Inches(5.2), Inches(0.55),
         size=12, color=DARK_GRAY)

# Bottom three pillars
for i, (icon, title, desc) in enumerate([
    ("→", "Find Merchants",       "Agents scan and identify\nthe best sources instantly"),
    ("→", "Select Products",      "Smart comparison based\non your intent"),
    ("→", "One-Click Confirmation","Orders prepared and\nready for instant approval"),
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
         "checks your budget rules, and completes payment. All in under 30 seconds.",
         Inches(0.4), Inches(2.45), Inches(8.5), Inches(1.2),
         size=15, color=DARK_GRAY)

# Conversation demo box
add_rect(sl, Inches(0.4), Inches(3.75), Inches(6.5), Inches(2.9), fill=LIGHT_GRAY)
add_text(sl, "Live Demo Conversation",
         Inches(0.6), Inches(3.82), Inches(4), Inches(0.4),
         size=13, bold=True, color=DARK_GRAY)

convos = [
    ("🧑  You:",    "I have a serious coffee craving. Find me the best place on my way home.", DARK_GRAY, False),
    ("🤖  AI:",     "Found 3 coffee shops on your route. Starbucks (0.1 mi) · Tower Cafe (0.3 mi) · Peet's (0.5 mi). Which would you like?", DARK_GREEN, False),
    ("🧑  You:",    "Starbucks.", DARK_GRAY, False),
    ("🤖  AI:",     "Adding a Medium Latte — $5.75. Paying via your saved card. Shall I place the order?", DARK_GREEN, False),
    ("🧑  You:",    "Yes.", DARK_GRAY, False),
    ("🤖  AI:",     "✓ Order confirmed! Loyalty points earned. Ready in ~5 mins.", GREEN, True),
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
    ("Shopping Agent",    "Scanned every nearby merchant\ncatalog for coffee"),
    ("Comparison Agent",  "Ranked by route proximity,\nrating, and price"),
    ("Rules Agent",       "Checked your spending limits\nbefore showing options"),
    ("Checkout Agent",    "Generated a tokenized payment\ntoken on approval"),
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

add_text(sl, "Multi-Agent Architecture",
         Inches(0.4), Inches(0.25), Inches(10), Inches(0.75),
         size=32, bold=True, color=BLACK)
add_text(sl, "Four specialized AI agents working in concert to deliver a seamless checkout experience.",
         Inches(0.4), Inches(1.0), Inches(10), Inches(0.5),
         size=15, color=GRAY)

agent_cards = [
    ("🔍", "Shopping Agent",    LIGHT_GREEN, DARK_GREEN,
     "Scans every onboarded merchant\ncatalog in real time. Surfaces\nrelevant items based on your request,\nlocation, and preferences."),
    ("⚖️", "Comparison Agent",  RGBColor(0xEF, 0xF6, 0xFF), RGBColor(0x1D, 0x4E, 0xD8),
     "Ranks results by price, distance,\nrating, and merchant reputation.\nPresents the top options with full\ntransparency."),
    ("📋", "Rules Agent",       RGBColor(0xFF, 0xF7, 0xED), RGBColor(0xC2, 0x61, 0x0B),
     "Validates every transaction against\nyour spending rules — monthly budget,\ncategory limits, and approval thresholds\n— before any option is shown."),
    ("🔒", "Checkout Agent",    RGBColor(0xFD, 0xF2, 0xF8), RGBColor(0x86, 0x19, 0x7A),
     "Generates a single-use tokenized\npayment credential. Your real card\nnumber is never exposed to the\nmerchant."),
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
# SLIDE 5 – Tokenized Payment & Security
# ─────────────────────────────────────────────
sl = prs.slides.add_slide(BLANK)
add_rect(sl, 0, 0, W, Inches(0.08), fill=GREEN)
add_rect(sl, 0, Inches(0.08), Inches(0.06), H - Inches(0.08), fill=GREEN)

add_rect(sl, Inches(0.4), Inches(0.3), Inches(2.4), Inches(0.35), fill=GREEN)
add_text(sl, "SECURITY", Inches(0.45), Inches(0.31), Inches(2.3), Inches(0.33),
         size=11, bold=True, color=WHITE)

add_text(sl, "Tokenized Payment",
         Inches(0.4), Inches(0.8), Inches(7), Inches(0.85),
         size=38, bold=True, color=BLACK)
add_text(sl, "Your real card number is never shared with any merchant.",
         Inches(0.4), Inches(1.65), Inches(8), Inches(0.5),
         size=17, color=DARK_GREEN, bold=True)

flow_steps = [
    ("1", "Customer\nApproves",     "You confirm\nthe purchase"),
    ("2", "Token\nGenerated",       "A one-time token\nis created"),
    ("3", "Token\nSent",            "Only token goes\nto merchant"),
    ("4", "Payment\nCompleted",     "Token expires\nimmediately"),
    ("5", "Receipt +\nRewards",     "Customer gets\nconfirmation"),
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
    "✓  Zero merchant card exposure — eliminates card-skimming risk",
    "✓  Single-use token expires the moment payment is complete",
    "✓  Even in a data breach, the token is worthless to attackers",
    "✓  Full PCI-compliant flow — customer card details never transit merchant systems",
]
for i, b in enumerate(benefits):
    x = Inches(0.6) + (i % 2) * Inches(6.2)
    y = Inches(5.45) + (i // 2) * Inches(0.5)
    add_text(sl, b, x, y, Inches(5.8), Inches(0.45), size=13, color=DARK_GRAY)

add_rect(sl, 0, H - Inches(0.08), W, Inches(0.08), fill=GREEN)

# ─────────────────────────────────────────────
# SLIDE 6 – Loyalty & Merchant Console
# ─────────────────────────────────────────────
sl = prs.slides.add_slide(BLANK)
add_rect(sl, 0, 0, W, Inches(0.08), fill=GREEN)
add_rect(sl, 0, Inches(0.08), Inches(0.06), H - Inches(0.08), fill=GREEN)

add_text(sl, "Loyalty Rewards  &  Merchant Console",
         Inches(0.4), Inches(0.25), Inches(11), Inches(0.75),
         size=30, bold=True, color=BLACK)

# Loyalty left
add_rect(sl, Inches(0.4), Inches(1.1), Inches(5.9), Inches(5.5), fill=LIGHT_GREEN)
add_text(sl, "🎁  Loyalty Rewards",
         Inches(0.6), Inches(1.2), Inches(5.5), Inches(0.6),
         size=20, bold=True, color=DARK_GREEN)
add_text(sl,
         "Every transaction automatically earns points.\n"
         "No sign-up forms. No manual redemption.\n"
         "The AI handles it all.",
         Inches(0.6), Inches(1.9), Inches(5.5), Inches(1.0),
         size=14, color=DARK_GRAY)

rewards = [
    ("$1 spent",        "= 1 loyalty point"),
    ("Points visible",  "instantly after order confirmation"),
    ("Auto-applied",    "on next eligible purchase"),
    ("No expiry",       "points never expire"),
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
         "Real-time order visibility for every onboarded merchant.\n"
         "No separate POS system needed.",
         Inches(6.9), Inches(1.9), Inches(5.8), Inches(0.7),
         size=14, color=DARK_GRAY)

console_steps = [
    ("New Order Arrives",   "Instant notification with full order details"),
    ("Start Preparing",     "One click to accept and begin preparation"),
    ("Mark Ready",          "Status updates pushed to customer in real time"),
    ("Delivered",           "Order closed — payment already settled"),
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

add_text(sl, "The Future of Commerce\nIs Autonomous.",
         Inches(0.5), Inches(0.4), Inches(8), Inches(1.6),
         size=40, bold=True, color=BLACK)

add_rect(sl, Inches(0.5), Inches(1.95), Inches(5.0), Inches(0.06), fill=GREEN)

add_text(sl,
         "Cart Pilot delivers a complete end-to-end agentic shopping experience —\n"
         "from spoken intent to confirmed order — in under 30 seconds.",
         Inches(0.5), Inches(2.1), Inches(8.5), Inches(0.9),
         size=16, color=DARK_GRAY)

summary = [
    ("🎙️", "Hands-Free Ordering",     "Just talk — AI handles everything from search to payment"),
    ("🔍", "Intelligent Discovery",    "Agents find the best local merchants and products instantly"),
    ("📋", "Spend Rule Enforcement",   "Budget and category limits checked before any transaction"),
    ("🔒", "Tokenized Security",       "One-use tokens keep your card details 100% private"),
    ("🎁", "Automatic Loyalty",        "Points earned and applied without any manual effort"),
    ("🖥️", "Merchant Dashboard",       "Real-time order management for every onboarded merchant"),
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
add_text(sl, "From intent to checkout in 30 seconds.  No multiple apps.  No friction.  Just AI.",
         Inches(0.7), Inches(6.4), Inches(11.9), Inches(0.6),
         size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

add_rect(sl, 0, H - Inches(0.08), W, Inches(0.08), fill=GREEN)

# ─────────────────────────────────────────────
prs.save("Agentic_AI_Checkout.pptx")
print("Saved: Agentic_AI_Checkout.pptx")
