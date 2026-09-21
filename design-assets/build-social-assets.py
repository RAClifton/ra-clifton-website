from PIL import Image, ImageDraw, ImageFont
import os

NAVY_TOP, NAVY_BOT = (8, 22, 31), (12, 33, 43)
GOLD, WHITE, BODY = (238, 189, 86), (255, 253, 248), (178, 190, 198)
GEO_B = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
AVN = ("/System/Library/Fonts/Avenir Next.ttc", 2)
HELV = ("/System/Library/Fonts/HelveticaNeue.ttc", 0)
SRC = "../images/1.png"

def f(s, sz):
    return ImageFont.truetype(s[0], sz, index=s[1]) if isinstance(s, tuple) else ImageFont.truetype(s, sz)

def tracked(d, xy, text, font, fill, track, measure=False):
    x, y = xy
    for ch in text:
        if not measure: d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + track
    return x - track - xy[0]

def field(W, H, rule=False):
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        d.line([(0,y),(W,y)], fill=tuple(int(NAVY_TOP[i]+(NAVY_BOT[i]-NAVY_TOP[i])*t) for i in range(3)))
    if rule: d.rectangle([0, H-rule, W, H], fill=GOLD)
    return im, d

def lockup(im, d, cx, cy, logo_d, head_px, with_logo=True):
    """Measure the whole lockup, then draw it centred on (cx, cy)."""
    eb, hd, bd = f(AVN, int(head_px*0.26)), f(GEO_B, head_px), f(HELV, int(head_px*0.42))
    trk = head_px * 0.035
    w_eb = tracked(d, (0,0), "AI-FIRST CPA & BUSINESS ADVISORY", eb, GOLD, trk, measure=True)
    w_tx = max(w_eb, d.textlength("See Your Business", font=hd), d.textlength("More Clearly.", font=hd))
    gap = int(logo_d*0.22) if with_logo else 0
    total_w = (logo_d + gap if with_logo else 0) + w_tx
    block_h = int(head_px*2.60)
    x0 = cx - total_w/2
    if with_logo:
        logo = Image.open(SRC).convert("RGBA").resize((logo_d, logo_d), Image.LANCZOS)
        im.paste(logo, (int(x0), int(cy - logo_d/2)), logo)
    tx = x0 + (logo_d + gap if with_logo else 0)
    y = cy - block_h/2
    tracked(d, (tx, y), "AI-FIRST CPA & BUSINESS ADVISORY", eb, GOLD, trk)
    y += head_px*0.72
    d.text((tx, y), "See Your Business", font=hd, fill=WHITE)
    y += head_px*1.14
    d.text((tx, y), "More Clearly.", font=hd, fill=GOLD)
    y += head_px*1.30
    d.text((tx, y), "RAClifton.com", font=bd, fill=BODY)
    return x0, x0 + total_w

# ---------- YouTube 2560x1440 : centre the lockup in the FRAME so the 2560-wide
# desktop band and the 1546-wide mobile band are both balanced. No bottom rule:
# it only ever appears in the TV crop and reads as a stray line everywhere else.
im, d = field(2560, 1440)
l, r = lockup(im, d, 1280, 720, 340, 78)
sx0, sx1 = (2560-1546)//2, (2560+1546)//2
print(f"YT  lockup x {l:.0f}-{r:.0f} | mobile safe area {sx0}-{sx1} -> "
      f"{'OK' if l>=sx0 and r<=sx1 else 'OVERFLOW'}")
im.save("yt-banner-2560x1440.jpg", quality=95, subsampling=0, optimize=True)

# ---------- X 1500x500 : no logo in the header. The profile photo overlaps the
# bottom-left and IS this same mark, so repeating it only gets it clipped.
im, d = field(1500, 500, rule=5)
l, r = lockup(im, d, 750, 232, 0, 58, with_logo=False)
CLEAR = 300   # bottom-left square the avatar covers
print(f"X   lockup x {l:.0f}-{r:.0f} | avatar clear zone x<{CLEAR} -> "
      f"{'OK' if l >= CLEAR else 'COLLISION'}")
im.save("x-header-1500x500.jpg", quality=95, subsampling=0, optimize=True)

for o in ["yt-banner-2560x1440.jpg","x-header-1500x500.jpg"]:
    print(f"  {o}: {Image.open(o).size}  {os.path.getsize(o)/1024:.0f} KB")
