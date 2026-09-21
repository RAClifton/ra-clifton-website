"""YouTube video thumbnail template, 1280x720.

Call make(out, eyebrow, lines, gold_from) where `lines` are the title lines and
`gold_from` is the index at which the title turns gold. Type auto-shrinks until
it fits, so long titles cannot silently run off the edge.
"""
from PIL import Image, ImageDraw, ImageFont
import os, sys

W, H = 1280, 720
NAVY_TOP, NAVY_BOT = (8, 22, 31), (12, 33, 43)
GOLD, WHITE, BODY = (238, 189, 86), (255, 253, 248), (178, 190, 198)
GEO_B = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
AVN = ("/System/Library/Fonts/Avenir Next.ttc", 2)
SRC = "../images/1.png"

MARGIN, LOGO_D, RULE = 68, 196, 8

def f(s, sz):
    return ImageFont.truetype(s[0], sz, index=s[1]) if isinstance(s, tuple) else ImageFont.truetype(s, sz)

def tracked(d, xy, text, font, fill, track):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + track

def make(out, eyebrow, lines, gold_from=1):
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        d.line([(0,y),(W,y)], fill=tuple(int(NAVY_TOP[i]+(NAVY_BOT[i]-NAVY_TOP[i])*t) for i in range(3)))
    d.rectangle([0, H-RULE, W, H], fill=GOLD)

    logo = Image.open(SRC).convert("RGBA").resize((LOGO_D, LOGO_D), Image.LANCZOS)
    lx, ly = W - MARGIN - LOGO_D, H - RULE - MARGIN - LOGO_D
    im.paste(logo, (lx, ly), logo)

    avail = W - MARGIN*2
    size = 104
    while size > 48:
        hd = f(GEO_B, size)
        widest = max(d.textlength(l, font=hd) for l in lines)
        block = int(size * 1.20) * len(lines)
        # title must clear the logo's column once it reaches the logo's rows
        if widest <= avail and MARGIN + 56 + block <= ly - 24:
            break
        size -= 4
    hd = f(GEO_B, size)

    tracked(d, (MARGIN, MARGIN), eyebrow, f(AVN, 26), GOLD, 3.4)
    # Centre the title in the band between the eyebrow and the logo row, so a
    # two-line title does not leave a hole in the middle of the frame.
    top, bottom = MARGIN + 70, ly - 24
    block = int(size * 1.20) * len(lines)
    y = max(top, top + (bottom - top - block) // 2)
    for i, line in enumerate(lines):
        d.text((MARGIN, y), line, font=hd, fill=GOLD if i >= gold_from else WHITE)
        y += int(size * 1.20)

    im.save(out, quality=95, subsampling=0, optimize=True)
    widest = max(d.textlength(l, font=hd) for l in lines)
    print(f"  {os.path.basename(out)}: title {size}px, widest line {widest:.0f}/{avail} "
          f"-> {'OK' if widest <= avail else 'OVERFLOW'}  ({os.path.getsize(out)/1024:.0f} KB)")

if __name__ == "__main__":
    print("examples:")
    make("thumb-ex1.jpg", "R.A. CLIFTON RESEARCH",
         ["AI for Small Business:", "The Case for Starting Now"], gold_from=1)
    make("thumb-ex2.jpg", "AI READINESS",
         ["What Is an", "AI Readiness Score?"], gold_from=1)
    make("thumb-ex3.jpg", "A PRACTICAL POINT OF VIEW",
         ["Start Small.", "Govern It.", "Measure It."], gold_from=1)
