from PIL import Image, ImageDraw, ImageFont
import sys

S = 2                      # render at 2x: 2400x1260
W, H = 1200 * S, 630 * S
NAVY_TOP, NAVY_BOT = (8, 22, 31), (12, 33, 43)
GOLD, WHITE = (238, 189, 86), (255, 253, 248)
BODY = (178, 190, 198)     # lifted from (150,163,171): survives re-compression better

GEO_B = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
AVN = ("/System/Library/Fonts/Avenir Next.ttc", 2)
HELV = ("/System/Library/Fonts/HelveticaNeue.ttc", 0)

def f(s, size):
    return ImageFont.truetype(s[0], size, index=s[1]) if isinstance(s, tuple) else ImageFont.truetype(s, size)

def tracked(d, xy, text, font, fill, track):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + track
    return x

def canvas():
    base = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(base)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(NAVY_TOP[i] + (NAVY_BOT[i]-NAVY_TOP[i])*t) for i in range(3)))
    d.rectangle([0, H - 6*S, W, H], fill=GOLD)
    return base, d

def combined(out):
    base, d = canvas()
    LD = 452 * S
    logo = Image.open("../images/1.png").convert("RGBA").resize((LD, LD), Image.LANCZOS)
    base.paste(logo, (58*S, (H - 6*S - LD)//2), logo)

    TX = 576 * S
    y = 150 * S
    tracked(d, (TX, y), "COMPLIMENTARY DURING PRE-LAUNCH", f(AVN, 19*S), GOLD, 2.5*S)
    y += 50 * S
    d.text((TX, y), "Discover Your", font=f(GEO_B, 50*S), fill=WHITE)
    y += 62 * S
    head = f(GEO_B, 50*S)
    d.text((TX, y), "AI Readiness Score", font=head, fill=GOLD)
    d.text((TX + d.textlength("AI Readiness Score", font=head) + 4*S, y + 2*S),
           "™", font=f(GEO_B, 22*S), fill=GOLD)
    y += 84 * S
    for i, line in enumerate(["See where your business actually stands",
                              "with AI — and what is worth doing first."]):
        d.text((TX, y + i*33*S), line, font=f(HELV, 23*S), fill=BODY)
    y += 98 * S
    bx = TX
    bf = f(HELV, 20*S)
    for label in ["About 5 minutes", "Private and secure"]:
        d.ellipse([bx, y+8*S, bx+9*S, y+17*S], fill=GOLD)
        d.text((bx + 18*S, y), label, font=bf, fill=BODY)
        bx += 18*S + d.textlength(label, font=bf) + 34*S
    base.save(out, quality=95, subsampling=0, optimize=True)
    return out

def logo_only(out):
    base, d = canvas()
    LD = 540 * S
    logo = Image.open("../images/1.png").convert("RGBA").resize((LD, LD), Image.LANCZOS)
    base.paste(logo, ((W-LD)//2, (H - 6*S - LD)//2), logo)
    base.save(out, quality=95, subsampling=0, optimize=True)
    return out

import os
for fn, name in [(combined, "hq-combined.jpg"), (logo_only, "hq-logo-only.jpg")]:
    p = fn(name)
    print(f"{p}: {Image.open(p).size}  {os.path.getsize(p)/1024:.0f} KB")
