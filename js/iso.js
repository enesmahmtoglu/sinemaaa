/* iso.js — küçük bir izometrik piksel çizim motoru.
 *
 * Her diorama 240x150 gibi minik bir tuvale çizilir, sonra CSS ile
 * büyütülür (image-rendering: pixelated). Bu yüzden burada tek bir
 * kural var: hiçbir şey yumuşak kenarlı olmayacak. Canvas'ın kendi
 * yol doldurma fonksiyonu kenarları yumuşatıyor, o yüzden çokgenleri
 * satır satır kendimiz dolduruyoruz — böylece pikseller keskin kalıyor.
 */

const Iso = (() => {

  const TW = 20;   // karo genişliği
  const TH = 10;    // karo yüksekliği (2:1 izometrik)
  const ZH = 12;    // bir birim yükseklik

  /* --- renk yardımcıları --- */

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgbToHex(r, g, b) {
    const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  }

  /* amount > 0 açar, < 0 karartır. Sadece parlaklık değil, biraz da
     doygunluk kaydırıyoruz — düz lerp cansız duruyor. */
  function shade(hex, amount) {
    let [r, g, b] = hexToRgb(hex);
    if (amount >= 0) {
      r += (255 - r) * amount * 0.86;
      g += (255 - g) * amount * 0.86;
      b += (255 - b) * amount * 0.70;   // ışık hafif sıcak
    } else {
      const k = 1 + amount;
      r *= k; g *= k; b *= k * 1.06;     // gölge hafif mavi
    }
    return rgbToHex(r, g, b);
  }

  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }

  /* --- keskin çokgen doldurma (tarama satırı) --- */

  function fillPoly(ctx, pts, color) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }
    minY = Math.floor(minY);
    maxY = Math.ceil(maxY);
    ctx.fillStyle = color;
    const xs = [];
    for (let y = minY; y < maxY; y++) {
      const yc = y + 0.5;
      xs.length = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) {
          xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
      }
      if (xs.length < 2) continue;
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = Math.round(xs[i]), x1 = Math.round(xs[i + 1]);
        if (x1 > x0) ctx.fillRect(x0, y, x1 - x0, 1);
      }
    }
  }

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /* --- izdüşüm --- */

  function project(x, y, z) {
    return [(x - y) * (TW / 2), (x + y) * (TH / 2) - z * ZH];
  }

  /* Bir kutu: üst yüz en aydınlık, sol yüz ara ton, sağ yüz en koyu.
     Işık soldan üstten geliyor, bütün sahnelerde aynı yönde. */
  function box(ctx, ox, oy, x, y, z, w, d, h, color, opts = {}) {
    const top   = opts.top   || shade(color, 0.30);
    const left  = opts.left  || color;
    const right = opts.right || shade(color, -0.30);
    const P = (a, b, c) => { const p = project(a, b, c); return [p[0] + ox, p[1] + oy]; };

    // sağ yüz (+x)
    fillPoly(ctx, [P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)], right);
    // sol yüz (+y)
    fillPoly(ctx, [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)], left);
    // üst yüz
    fillPoly(ctx, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top);
  }

  /* Sadece üst yüz — zemin karosu, su, yol için */
  function tile(ctx, ox, oy, x, y, z, w, d, color) {
    const P = (a, b, c) => { const p = project(a, b, c); return [p[0] + ox, p[1] + oy]; };
    fillPoly(ctx, [P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], color);
  }

  /* Silindir gibi duran şey (baca, ağaç gövdesi): dar bir kutu yeter,
     ama üstüne bir piksel açık şerit koyunca yuvarlak okunuyor. */
  function post(ctx, ox, oy, x, y, z, h, color, thick = 0.34) {
    box(ctx, ox, oy, x, y, z, thick, thick, h, color);
  }

  return { TW, TH, ZH, project, box, tile, post, fillPoly, rect, shade, mix, hexToRgb, rgbToHex };
})();
