from PIL import Image
import math

W, H = 1920, 1080

# --- warm radial gradient background ---
cx, cy = W * 0.5, H * 0.42
maxd = math.hypot(max(cx, W - cx), max(cy, H - cy))
center = (96, 58, 30)
mid = (40, 26, 16)
edge = (8, 5, 4)

bg = Image.new("RGB", (W, H))
px = bg.load()
for y in range(H):
    for x in range(W):
        d = math.hypot(x - cx, y - cy) / maxd
        if d < 0.5:
            t = d / 0.5
            c = tuple(int(center[i] + (mid[i] - center[i]) * t) for i in range(3))
        else:
            t = (d - 0.5) / 0.5
            t = min(t, 1.0)
            c = tuple(int(mid[i] + (edge[i] - mid[i]) * t) for i in range(3))
        px[x, y] = c
bg.save("/home/user/icsc/output/txt2/bg_warm.png")

# --- small firefly glow sprite ---
def make_glow(size, color, peak_alpha):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    p = img.load()
    r = size / 2
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - r, y - r) / r
            if d > 1:
                a = 0
            else:
                a = int(peak_alpha * (1 - d) ** 2)
            p[x, y] = (color[0], color[1], color[2], a)
    return img

make_glow(64, (255, 205, 130), 230).save("/home/user/icsc/output/txt2/firefly.png")
make_glow(900, (255, 190, 120), 60).save("/home/user/icsc/output/txt2/bigglow.png")
print("assets done")
