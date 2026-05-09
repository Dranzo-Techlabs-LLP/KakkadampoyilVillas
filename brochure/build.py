"""Kakkadampoyil Villas — Editorial brochure.

Restrained, magazine-quality, full-bleed photography, generous space.
No survey markings. No 'PLATE'. No 'EST.'. No 'FIG.'. Just the place.
"""
import os, shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "img")
FONT_DIR = "/Users/shinky777/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/79680b2b-5bdd-436b-a580-77c33343911e/89491b29-894e-45b2-bc06-b56182decd74/skills/canvas-design/canvas-fonts"
OUT_PDF = os.path.join(HERE, "Kakkadampoyil_Villas_Brochure.pdf")
DESKTOP_PDF = os.path.expanduser("~/Desktop/Kakkadampoyil_Villas_Brochure.pdf")

pdfmetrics.registerFont(TTFont("Serif",       os.path.join(FONT_DIR, "CrimsonPro-Regular.ttf")))
pdfmetrics.registerFont(TTFont("SerifItalic", os.path.join(FONT_DIR, "CrimsonPro-Italic.ttf")))
pdfmetrics.registerFont(TTFont("SerifBold",   os.path.join(FONT_DIR, "CrimsonPro-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Italiana",    os.path.join(FONT_DIR, "Italiana-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Mono",        os.path.join(FONT_DIR, "DMMono-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Sans",        os.path.join(FONT_DIR, "InstrumentSans-Regular.ttf")))

# Refined palette — warm cream, deep forest, single gilt
INK    = Color(0.07, 0.13, 0.09)
INK_70 = Color(0.07, 0.13, 0.09, 0.70)
INK_50 = Color(0.07, 0.13, 0.09, 0.50)
INK_25 = Color(0.07, 0.13, 0.09, 0.25)
PAPER  = Color(0.973, 0.961, 0.929)
GILT   = Color(0.78, 0.59, 0.34)
WHITE  = Color(0.99, 0.985, 0.96)
WHITE_85 = Color(1, 1, 1, 0.85)
WHITE_60 = Color(1, 1, 1, 0.60)

W, H = A4
M = 22*mm  # base margin

def fill_paper(c):
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

def hairline(c, x1, y1, x2, y2, color=INK_25, width=0.4):
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)

def img_dims(path):
    with Image.open(path) as im:
        return im.size

def draw_image_clipped(c, path, x, y, w, h):
    iw, ih = img_dims(path)
    src_ratio = iw / ih
    dst_ratio = w / h
    c.saveState()
    p = c.beginPath()
    p.rect(x, y, w, h)
    c.clipPath(p, stroke=0, fill=0)
    if src_ratio > dst_ratio:
        new_w = h * src_ratio
        c.drawImage(path, x - (new_w - w) / 2, y, new_w, h,
                    preserveAspectRatio=False, mask='auto')
    else:
        new_h = w / src_ratio
        c.drawImage(path, x, y - (new_h - h) / 2, w, new_h,
                    preserveAspectRatio=False, mask='auto')
    c.restoreState()

def quiet_runner(c, page_num, chapter, on_dark=False):
    """Single-line top runner: kakkadampoyil villas — chapter — page #."""
    color = WHITE_60 if on_dark else INK_50
    c.setFillColor(color)
    c.setFont("Mono", 7)
    c.drawString(M, H - 14*mm, "KAKKADAMPOYIL  VILLAS")
    c.drawCentredString(W/2, H - 14*mm, chapter.upper())
    c.drawRightString(W - M, H - 14*mm, f"{page_num:02d}")

def quiet_footer(c, on_dark=False):
    color = WHITE_60 if on_dark else INK_50
    c.setFillColor(color)
    c.setFont("Mono", 7)
    c.drawString(M, 14*mm, "kakkadampoyilvillas.com")
    c.drawRightString(W - M, 14*mm, "Western Ghats · Kerala")

# ─────────────────────────────────────────────  PAGE 1  COVER
def page_cover(c):
    draw_image_clipped(c, os.path.join(IMG, "cover.jpg"), 0, 0, W, H)
    # gradient vignettes
    c.setFillColor(Color(0, 0, 0, 0.30))
    c.rect(0, H - 70*mm, W, 70*mm, fill=1, stroke=0)
    c.setFillColor(Color(0, 0, 0, 0.55))
    c.rect(0, 0, W, 110*mm, fill=1, stroke=0)

    # Top minimal mark
    c.setFillColor(WHITE_60)
    c.setFont("Mono", 7)
    c.drawString(M, H - 14*mm, "KAKKADAMPOYIL  VILLAS")
    c.drawRightString(W - M, H - 14*mm, "KERALA, IND")

    # Pull-quote upper area
    c.setFillColor(WHITE_85)
    c.setFont("Italiana", 22)
    c.drawString(M, H - 60*mm, "Where the mist")
    c.setFont("SerifItalic", 22)
    c.drawString(M, H - 72*mm, "kisses the hills.")
    hairline(c, M, H - 78*mm, M + 30*mm, H - 78*mm, color=GILT, width=0.7)

    # Title — generous, anchored bottom
    c.setFillColor(WHITE)
    c.setFont("Italiana", 78)
    c.drawString(M, 78*mm, "Kakkadampoyil")

    c.setFillColor(GILT)
    c.setFont("SerifItalic", 28)
    c.drawString(M, 60*mm, "Villas")

    # Whisper subtitle
    c.setFillColor(WHITE_85)
    c.setFont("Mono", 7.5)
    c.drawString(M, 44*mm, "THREE  PRIVATE  HOUSES   ·   ONE  MISTED  HILL")

    # Bottom rule + footer
    hairline(c, M, 22*mm, W - M, 22*mm, color=Color(1, 1, 1, 0.25))
    quiet_footer(c, on_dark=True)

# ─────────────────────────────────────────────  PAGE 2  THE PLACE
def page_place(c):
    fill_paper(c)
    quiet_runner(c, 2, "The Place")

    # Right column — large vertical photograph (extends near bleed)
    px = W * 0.46
    py = M + 5*mm
    pw = W - px - M
    ph = H - 2*M - 4*mm
    draw_image_clipped(c, os.path.join(IMG, "place_hero.jpg"), px, py, pw, ph)

    # Left column — generous text
    tx = M
    ty = H - 56*mm

    # Tiny chapter mark
    c.setFillColor(GILT)
    c.setFont("Mono", 8)
    c.drawString(tx, ty + 18*mm, "01")
    hairline(c, tx + 6*mm, ty + 19*mm, tx + 30*mm, ty + 19*mm, color=GILT, width=0.6)

    # Display headline
    c.setFillColor(INK)
    c.setFont("Italiana", 34)
    c.drawString(tx, ty,           "Three private")
    c.drawString(tx, ty - 16*mm,   "houses,")
    c.drawString(tx, ty - 32*mm,   "set into")
    c.drawString(tx, ty - 48*mm,   "a single")
    c.setFont("SerifItalic", 34)
    c.drawString(tx, ty - 64*mm,   "ridgeline.")

    # Body
    c.setFillColor(INK_70)
    c.setFont("Serif", 11)
    body = [
        "Kakkadampoyil sits at three thousand feet,",
        "in the misted folds of the Western Ghats.",
        "Forest above. River below. Weather, always.",
        "",
        "Each house is its own quiet country —",
        "private compound, garden, swimming pool,",
        "campfire, and a long view of the valley.",
    ]
    for i, line in enumerate(body):
        c.drawString(tx, ty - 90*mm - i*5.6*mm, line)

    quiet_footer(c)

# ─────────────────────────────────────────────  VILLA PAGE
def villa_page(c, page_num, chapter, name, tagline, body_lines, hero, side_a, side_b,
               capacity, bedrooms, bath_text, dorm_text=None):
    fill_paper(c)
    quiet_runner(c, page_num, chapter)

    # Left: large hero photograph (no crop marks)
    hx = M
    hy = M + 5*mm
    hw = W * 0.50
    hh = H - 2*M - 4*mm
    draw_image_clipped(c, hero, hx, hy, hw, hh)

    # Right column
    rx = hx + hw + 14*mm
    rw = W - rx - M
    top_y = H - 56*mm

    # Chapter mark + gilt rule
    c.setFillColor(GILT)
    c.setFont("Mono", 8)
    c.drawString(rx, top_y + 18*mm, f"{page_num - 2:02d}")
    hairline(c, rx + 8*mm, top_y + 19*mm, rx + 36*mm, top_y + 19*mm, color=GILT, width=0.6)

    # Display name (single word, large)
    short = name.split()[0]
    c.setFillColor(INK)
    c.setFont("Italiana", 56)
    c.drawString(rx, top_y, short)

    # Subtle "Villa" follow-up
    c.setFillColor(INK_50)
    c.setFont("Mono", 7.5)
    c.drawString(rx, top_y - 7*mm, "—  V I L L A")

    # Tagline italic
    c.setFillColor(GILT)
    c.setFont("SerifItalic", 12)
    c.drawString(rx, top_y - 16*mm, tagline)

    # Body
    c.setFillColor(INK)
    c.setFont("Serif", 10.5)
    line_y = top_y - 30*mm
    for line in body_lines:
        c.drawString(rx, line_y, line)
        line_y -= 5.4*mm

    # Stats — two-column compressed
    sy = line_y - 8*mm
    rows = [
        ("Capacity",  capacity),
        ("Bedrooms",  bedrooms),
        ("Bath",      bath_text),
    ]
    if dorm_text:
        rows.append(("Dormitory", dorm_text))

    c.setFillColor(INK_50)
    c.setFont("Mono", 7)
    c.drawString(rx, sy, "—  ESSENCE")

    sy -= 6*mm
    for label, value in rows:
        c.setFillColor(INK_50)
        c.setFont("Mono", 7)
        c.drawString(rx, sy, label.upper())
        c.setFillColor(INK)
        c.setFont("SerifItalic", 10.5)
        c.drawRightString(rx + rw, sy, value)
        sy -= 5.4*mm

    # Amenities — single tasteful italic line
    sy -= 4*mm
    c.setFillColor(INK_50)
    c.setFont("Mono", 7)
    c.drawString(rx, sy, "—  AMENITIES")
    sy -= 5.5*mm
    c.setFillColor(INK)
    c.setFont("SerifItalic", 9.5)
    c.drawString(rx, sy,           "Campfire   ·   Pool   ·   BBQ   ·   WiFi")
    sy -= 4.6*mm
    c.drawString(rx, sy,           "Children's play   ·   Carrom   ·   Private compound")

    # Two side photos pinned to bottom of right column
    sx = rx
    sy_img = M + 8*mm
    sw = (rw - 4*mm) / 2
    sh = 42*mm
    draw_image_clipped(c, side_a, sx,            sy_img, sw, sh)
    draw_image_clipped(c, side_b, sx + sw + 4*mm, sy_img, sw, sh)

    quiet_footer(c)

# ─────────────────────────────────────────────  PAGE  VISIT (CONTACT)
def page_visit(c, page_num):
    fill_paper(c)
    quiet_runner(c, page_num, "Visit")

    # Top half — invitation
    cx = W / 2
    c.setFillColor(GILT)
    c.setFont("Mono", 8)
    c.drawCentredString(cx, H - 50*mm, "—  04  —")

    c.setFillColor(INK)
    c.setFont("Italiana", 50)
    c.drawCentredString(cx, H - 78*mm, "Tell us about")
    c.setFont("SerifItalic", 50)
    c.drawCentredString(cx, H - 100*mm, "your getaway.")

    c.setFillColor(INK_50)
    c.setFont("Mono", 8)
    c.drawCentredString(cx, H - 116*mm, "WE  REPLY  WITHIN  TWELVE  HOURS")

    # Three contact columns
    col_y = H - 142*mm
    col_w = (W - 2*M - 20*mm) / 3
    col_x = [M + i*(col_w + 10*mm) for i in range(3)]

    cols = [
        ("ADDRESS",
         ["Foggy Mountain Park Road,",
          "Kakkadampoyil, Kerala",
          "India"]),
        ("CALL",
         ["+91 85898 50641",
          "WhatsApp available"]),
        ("ENQUIRE",
         ["enquiry@",
          "  kakkadampoyilvillas.com",
          "kakkadampoyilvillas.com"]),
    ]
    for (label, lines), x in zip(cols, col_x):
        c.setFillColor(GILT)
        c.setFont("Mono", 7)
        c.drawString(x, col_y, label)
        hairline(c, x, col_y - 3*mm, x + 14*mm, col_y - 3*mm, color=GILT, width=0.6)
        c.setFillColor(INK)
        c.setFont("Serif", 10.5)
        for i, line in enumerate(lines):
            c.drawString(x, col_y - 9*mm - i*5.5*mm, line)

    # Bottom half — full-bleed atmospheric image with overlay sign-off
    img_h = 90*mm
    draw_image_clipped(c, os.path.join(IMG, "closing.jpg"), 0, 0, W, img_h)
    c.setFillColor(Color(0, 0, 0, 0.50))
    c.rect(0, 0, W, img_h, fill=1, stroke=0)
    hairline(c, M, img_h + 4*mm, W - M, img_h + 4*mm, color=GILT, width=0.6)

    c.setFillColor(WHITE)
    c.setFont("Italiana", 28)
    c.drawCentredString(cx, img_h - 32*mm, "Above the clouds.")
    c.setFont("SerifItalic", 14)
    c.drawCentredString(cx, img_h - 48*mm, "Kakkadampoyil Villas")

    # Footer (light over dark)
    c.setFillColor(WHITE_60)
    c.setFont("Mono", 7)
    c.drawString(M, 14*mm, "kakkadampoyilvillas.com")
    c.drawRightString(W - M, 14*mm, "Western Ghats · Kerala")

# ─────────────────────────────────────────────  BUILD
def build():
    c = canvas.Canvas(OUT_PDF, pagesize=A4)
    c.setTitle("Kakkadampoyil Villas")
    c.setAuthor("Kakkadampoyil Villas")
    c.setSubject("Brochure")

    page_cover(c);  c.showPage()
    page_place(c);  c.showPage()

    villa_page(
        c, page_num=3, chapter="The Houses · Lux",
        name="Lux Villa",
        tagline="A-Type Architectural Retreat",
        body_lines=[
            "An iconic A-frame villa built for groups",
            "of nine. Three bedrooms, a private",
            "compound, and every essential — pool,",
            "campfire, BBQ — set against the misty",
            "hills of Kakkadampoyil.",
        ],
        hero=os.path.join(IMG, "lux_hero.jpg"),
        side_a=os.path.join(IMG, "lux_2.jpg"),
        side_b=os.path.join(IMG, "lux_3.jpg"),
        capacity="9 guests   (6 + 3)",
        bedrooms="3",
        bath_text="3 attached",
    ); c.showPage()

    villa_page(
        c, page_num=4, chapter="The Houses · Fortune",
        name="Fortune Villa",
        tagline="Scenic Hilltop Escape",
        body_lines=[
            "A scenic three-bedroom hilltop villa",
            "for nine guests — one AC and two non-AC",
            "rooms, all with attached bathrooms.",
            "Comes with a private pool, campfire",
            "setup, and a 360° terrace view.",
        ],
        hero=os.path.join(IMG, "fortune_hero.jpg"),
        side_a=os.path.join(IMG, "fortune_2.jpg"),
        side_b=os.path.join(IMG, "fortune_3.jpg"),
        capacity="9 guests   (6 + 3)",
        bedrooms="3   (1 AC + 2 Non-AC)",
        bath_text="3 attached",
    ); c.showPage()

    villa_page(
        c, page_num=5, chapter="The Houses · Munnas",
        name="Munnas Villa",
        tagline="Group & Family Retreat",
        body_lines=[
            "Built for big gatherings. Two AC and",
            "one non-AC bedroom plus a 12-bed",
            "dormitory — sleeps eighteen in total.",
            "Ideal for extended families, friend",
            "trips, and celebration weekends.",
        ],
        hero=os.path.join(IMG, "munnas_hero.jpg"),
        side_a=os.path.join(IMG, "munnas_2.jpg"),
        side_b=os.path.join(IMG, "munnas_3.jpg"),
        capacity="18 guests   (12 + 6)",
        bedrooms="3   (2 AC + 1 Non-AC)",
        bath_text="3 attached",
        dorm_text="12 beds",
    ); c.showPage()

    page_visit(c, page_num=6); c.showPage()

    c.save()
    shutil.copy2(OUT_PDF, DESKTOP_PDF)
    size = os.path.getsize(OUT_PDF) / 1024
    print(f"Wrote {OUT_PDF} ({size:.1f} KB)")
    print(f"Copied to {DESKTOP_PDF}")

if __name__ == "__main__":
    build()
