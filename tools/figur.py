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

def cokgen(g, noktalar, ch):
    """Tarama satırıyla çokgen doldurur. M ve ok gibi köşeli şekiller
    elipsle çizilemiyor, logoyu gerçek geometrisiyle kurmak için bu lazım."""
    h, w = len(g), len(g[0])
    ys = [p[1] for p in noktalar]
    for y in range(max(0, int(min(ys))), min(h, int(max(ys)) + 2)):
        yc = y + 0.5
        kesim = []
        n = len(noktalar)
        for i in range(n):
            ax, ay = noktalar[i]
            bx, by = noktalar[(i + 1) % n]
            if (ay <= yc < by) or (by <= yc < ay):
                kesim.append(ax + (yc - ay) / (by - ay) * (bx - ax))
        kesim.sort()
        for i in range(0, len(kesim) - 1, 2):
            for x in range(max(0, int(round(kesim[i]))), min(w, int(round(kesim[i + 1])))):
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
# İstanbul metro logosu. Üç parça: lacivert daire, beyaz M ve M'nin
# üstüne binen kırmızı ok. Kırmızı ok da aslında bir M: tepesi ortada
# V yapıp aşağı iniyor, altta oklara açılıp sivriliyor. İlk denemede
# bunu döngülerle çizmeye çalışınca M'nin ortası dağıldı.
MW, MH = 23, 29
met = bos(MW, MH)

# Oranlar doğrudan logodan ölçüldü: daire yüksekliğin %78'i, M'nin
# tepesi %10'u, beyaz V'nin ucu ile kırmızı V'nin çukuru aynı yerde
# (%47), okun kanatları %74'te, ucu en altta.
leke(met, 11.5, 11.3, 11.5, 11.3, 'v')

BEYAZ_M = [
    (3.0, 2.9), (6.9, 2.9), (11.5, 14.3), (16.1, 2.9), (20.0, 2.9),
    (20.0, 21.7), (16.1, 21.7), (16.1, 9.0), (11.5, 17.4), (6.9, 9.0),
    (6.9, 21.7), (3.0, 21.7),
]
cokgen(met, BEYAZ_M, 'B')

KIRMIZI_OK = [
    (6.4, 9.3), (11.5, 13.6), (16.6, 9.3), (16.6, 21.5),
    (22.5, 21.5), (11.5, 28.9), (0.5, 21.5), (6.4, 21.5),
]
cokgen(met, KIRMIZI_OK, 'K')

if __name__ == '__main__':
    import json, sys
    print(json.dumps({'FOK': satirlar(fok), 'RAKUN': satirlar(rak), 'METRO': satirlar(met)}))

