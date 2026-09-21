from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
NAVY_TOP, NAVY_BOT = (8, 22, 31), (12, 33, 43)
GOLD, WHITE, BODY = (238, 189, 86), (255, 253, 248), (150, 163, 171)
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

base = Image.new("RGB", (W, H))
d = ImageDraw.Draw(base)
for y in range(H):
    t = y / H
    d.line([(0, y), (W, y)], fill=tuple(int(NAVY_TOP[i] + (NAVY_BOT[i]-NAVY_TOP[i])*t) for i in range(3)))
d.rectangle([0, H-6, W, H], fill=GOLD)

LOGO_D = 452
logo = Image.open("../images/1.png").convert("RGBA").resize((LOGO_D, LOGO_D), Image.LANCZOS)
base.paste(logo, (58, (H-6-LOGO_D)//2), logo)

TX = 576
eyebrow, head, body, bullet = f(AVN,19), f(GEO_B,50), f(HELV,23), f(HELV,20)

y = 150
end = tracked(d, (TX,y), "COMPLIMENTARY DURING PRE-LAUNCH", eyebrow, GOLD, 2.5)
print("eyebrow ends at", round(end))
y += 50
d.text((TX,y), "Discover Your", font=head, fill=WHITE)
y += 62
d.text((TX,y), "AI Readiness Score", font=head, fill=GOLD)
tm = TX + d.textlength("AI Readiness Score", font=head)
d.text((tm+4, y+2), "™", font=f(GEO_B,22), fill=GOLD)
print("headline ends at", round(tm + 4 + d.textlength("™", font=f(GEO_B,22))), "of", W)
y += 84
for i, line in enumerate(["See where your business actually stands",
                          "with AI — and what is worth doing first."]):
    d.text((TX, y + i*33), line, font=body, fill=BODY)
    print("body line ends at", round(TX + d.textlength(line, font=body)))
y += 98
bx = TX
for label in ["About 5 minutes", "Private and secure"]:
    d.ellipse([bx, y+8, bx+9, y+17], fill=GOLD)
    d.text((bx+18, y), label, font=bullet, fill=BODY)
    bx += 18 + d.textlength(label, font=bullet) + 34
print("bullets end at", round(bx), " text block bottom:", y+26)
base.save("cand-F-combined.jpg", quality=92, subsampling=0)
