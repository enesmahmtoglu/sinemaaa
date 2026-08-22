# -*- coding: utf-8 -*-
"""Fok ve rakunu üretir.

Pikselleri tek tek elle dizmek yerine gövdeyi elips olarak taratıp
ışığa göre tonluyorum: 17 piksellik figürlerde yüz sığmıyordu, bu
boyutta elle dizmek de saatler sürerdi. Gözler, burun, kulak gibi
ayrıntılar elips üstüne elle basılıyor.
"""
import math

def bos(w, h):
    return [['.'] * w for _ in range(h)]

def elips(g, cx, cy, rx, ry, ramp, lx=-0.50, ly=-0.72, kenar=None, kesme=1.0):
    """Elipsi ışığa göre tonlayarak doldurur. ramp: açıktan koyuya."""
    h, w = len(g), len(g[0])
    for y in range(h):
        for x in range(w):
            dx = (x + 0.5 - cx) / rx
            dy = (y + 0.5 - cy) / ry
            r2 = dx * dx + dy * dy
            if r2 > kesme:
                continue
            isik = (dx * lx + dy * ly) / math.hypot(lx, ly)       # +1 aydınlık, -1 koyu
            t = (1 - isik) / 2
            t = min(0.999, max(0.0, t * 0.86 + r2 * 0.16))
            g[y][x] = ramp[int(t * len(ramp))]
            if kenar and r2 > 0.80:
                g[y][x] = kenar

def leke(g, cx, cy, rx, ry, ch, kesme=1.0):
    h, w = len(g), len(g[0])
    for y in range(h):
        for x in range(w):
            dx = (x + 0.5 - cx) / rx
            dy = (y + 0.5 - cy) / ry
            if dx * dx + dy * dy <= kesme:
                g[y][x] = ch

def nokta(g, x, y, ch):
    if 0 <= y < len(g) and 0 <= x < len(g[0]):
        g[y][x] = ch

def goz(g, cx, cy, koyu='e', parilti='h'):
    """İki piksel genişliğinde, üstünde parıltısı olan yuvarlak göz."""
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            if dx * dx * 1.4 + dy * dy <= 3.4:
                nokta(g, cx + dx, cy + dy, koyu)
    nokta(g, cx - 1, cy - 1, parilti)
    nokta(g, cx, cy - 1, parilti)

def satirlar(g):
    return [''.join(r) for r in g]

# ------------------------------------------------------------------ FOK
FW, FH = 28, 22
fok = bos(FW, FH)
BEYAZ = ['1', '2', '2', '3', '3', '4']
# gövde: peluş tam daire değil, aşağı doğru hafif genişliyor
elips(fok, 13.5, 8.4, 10.4, 8.0, BEYAZ)
elips(fok, 13.5, 12.6, 12.0, 8.4, BEYAZ)
# yüzgeçler gövdenin üstüne: altına çizince gövde onları yutuyordu
elips(fok, 4.6, 17.6, 4.6, 2.6, ['2', '3', '3', '3', '4', '4'])
elips(fok, 22.4, 17.6, 4.6, 2.6, ['3', '3', '3', '4', '4', '4'])
# yanaklar: küçük ve gözlerin biraz altında
leke(fok, 6.6, 12.4, 1.7, 1.3, 'p')
leke(fok, 20.4, 12.4, 1.7, 1.3, 'p')
# gözler
goz(fok, 9, 9)
goz(fok, 18, 9)
# burun: küçük ters üçgen, tam ortada
for x in (12, 13, 14, 15):
    nokta(fok, x, 13, 'e')
nokta(fok, 13, 14, 'e'); nokta(fok, 14, 14, 'e')

# ---------------------------------------------------------------- RAKUN
RW, RH = 28, 30
rak = bos(RW, RH)
KURK  = ['5', '6', '6', '7', '7', '8']
KREM  = ['a', 'a', 'b', 'b', 'c', 'c']
# kulaklar
elips(rak, 6.5, 4.2, 4.2, 4.0, KURK)
elips(rak, 21.5, 4.2, 4.2, 4.0, KURK)
leke(rak, 6.5, 4.8, 2.2, 2.2, 'b')
leke(rak, 21.5, 4.8, 2.2, 2.2, 'b')
# gövde: kafadan dar olsun ki boyun okunsun
elips(rak, 14.0, 23.2, 8.8, 6.8, KURK)
# kollar
elips(rak, 5.6, 23.8, 2.8, 3.4, ['6', '6', '7', '7', '8', '8'])
elips(rak, 22.4, 23.8, 2.8, 3.4, ['7', '7', '8', '8', '8', '8'])
# göbek
elips(rak, 14.0, 24.2, 5.8, 4.8, KREM)
# patiler
elips(rak, 10.0, 28.8, 3.0, 1.9, KREM)
elips(rak, 18.0, 28.8, 3.0, 1.9, KREM)
# kafa
elips(rak, 14.0, 10.5, 11.0, 9.4, KURK)
# yüz
elips(rak, 13.7, 12.6, 8.6, 7.2, KREM)
# göz çevresindeki iki leke — tek bant yapınca kaş gibi duruyordu
elips(rak, 8.6, 10.4, 3.1, 2.9, ['m', 'm', 'm', 'k', 'k', 'k'])
elips(rak, 18.9, 10.4, 3.1, 2.9, ['m', 'm', 'm', 'k', 'k', 'k'])
# gözler
goz(rak, 9, 10, 'n')
goz(rak, 18, 10, 'n')
# burun
for x in (12, 13, 14, 15):
    nokta(rak, x, 15, 'n')
nokta(rak, 13, 16, 'n'); nokta(rak, 14, 16, 'n')

# ---------------------------------------------------------------- METRO
# İstanbul metro logosu: lacivert daire, beyaz M, M'nin içinden geçip
# aşağı sivrilen kırmızı ok.
MW, MH = 21, 27
met = bos(MW, MH)
leke(met, 10.5, 10.0, 10.4, 10.0, 'v')
# M'nin dikey kolları
for y in range(4, 18):
    for x in (3, 4, 5, 15, 16, 17):
        nokta(met, x, y, 'B')
# M'nin ortadaki V'si
for i in range(10):
    y = 4 + i
    t = i / 9.0
    xl = 5 + t * 5.0
    xr = 15 - t * 5.0
    for d in (-1, 0, 1):
        nokta(met, int(round(xl)) + d, y, 'B')
        nokta(met, int(round(xr)) + d, y, 'B')
# kırmızı okun gövdesi
for y in range(9, 18):
    for x in range(8, 13):
        nokta(met, x, y, 'K')
# ok başı
for i, y in enumerate(range(18, MH)):
    yari = 10.5 - i * 1.2
    if yari < 0:
        break
    for x in range(int(round(10.5 - yari)), int(round(10.5 + yari)) + 1):
        nokta(met, x, y, 'K')

if __name__ == '__main__':
    import json, sys
    print(json.dumps({'FOK': satirlar(fok), 'RAKUN': satirlar(rak), 'METRO': satirlar(met)}))

