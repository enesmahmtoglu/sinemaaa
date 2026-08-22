/* sky.js — sabit duran Boğaz manzarası.
 *
 * Sayfa sağa kaydıkça ışık öğleden akşama dönüyor. Renk kilometre
 * taşları aşağıda; aradaki her şey karışımla bulunuyor. Son durakta
 * ufuk, vapur bacasının kırmızısına düşüyor — paletteki ilk renk.
 */

const Sky = (() => {

  const SCALE = 3;          // düşük çözünürlükte çiz, büyüt: pikseller iri kalsın
  const SEA_AT = 0.60;      // ufuk çizgisi, yüksekliğin oranı

  const KEYS = [
    { p: 0.00, zenith: '#17679B', mid: '#63A9C4', horizon: '#C6E0E4', sea: '#1C4A63', sun: '#FFF6DC', sunY: 0.09 },
    { p: 0.40, zenith: '#2478A2', mid: '#8AC6D6', horizon: '#E9DAB4', sea: '#235B79', sun: '#FFE8AE', sunY: 0.24 },
    { p: 0.74, zenith: '#3A6892', mid: '#D9A08A', horizon: '#E3A79E', sea: '#2A5670', sun: '#F8C273', sunY: 0.45 },
    { p: 1.00, zenith: '#13304C', mid: '#5A4260', horizon: '#B4382C', sea: '#11283B', sun: '#D95F3E', sunY: 0.57 },
  ];

  /* Uzaktaki siluet. Elle yerleştirdim: kubbeler, minareler, yamaçtaki
     apartmanlar. Sayılar karo değil, oran — genişliğe göre ölçekleniyor. */
  const SKYLINE = [
    // [x oranı, genişlik oranı, yükseklik oranı, tip]
    [0.02, 0.055, 0.30, 'blok'], [0.07, 0.035, 0.44, 'blok'],
    [0.11, 0.070, 0.52, 'kubbe'], [0.175, 0.012, 1.00, 'minare'], [0.152, 0.012, 0.92, 'minare'],
    [0.20, 0.050, 0.34, 'blok'], [0.245, 0.040, 0.48, 'blok'],
    [0.30, 0.060, 0.40, 'blok'], [0.345, 0.030, 0.62, 'kule'],
    [0.39, 0.075, 0.55, 'kubbe'], [0.455, 0.012, 0.98, 'minare'], [0.432, 0.012, 0.90, 'minare'],
    [0.50, 0.045, 0.32, 'blok'], [0.545, 0.055, 0.46, 'blok'],
    [0.61, 0.065, 0.50, 'kubbe'], [0.665, 0.011, 0.94, 'minare'],
    [0.70, 0.050, 0.36, 'blok'], [0.745, 0.035, 0.58, 'kule'],
    [0.79, 0.070, 0.42, 'blok'], [0.855, 0.045, 0.52, 'blok'],
    [0.90, 0.060, 0.34, 'blok'], [0.955, 0.040, 0.47, 'blok'],
  ];

  let cv, ctx, W, H, prog = 0, dpr = 1;

  function lerpKeys(p) {
    let a = KEYS[0], b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (p >= KEYS[i].p && p <= KEYS[i + 1].p) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    }
    const t = b.p === a.p ? 0 : (p - a.p) / (b.p - a.p);
    const e = t * t * (3 - 2 * t);   // yumuşak geçiş
    return {
      zenith: Iso.mix(a.zenith, b.zenith, e),
      mid: Iso.mix(a.mid, b.mid, e),
      horizon: Iso.mix(a.horizon, b.horizon, e),
      sea: Iso.mix(a.sea, b.sea, e),
      sun: Iso.mix(a.sun, b.sun, e),
      sunY: a.sunY + (b.sunY - a.sunY) * e,
    };
  }

  function resize() {
    W = Math.max(1, Math.ceil(window.innerWidth / SCALE));
    H = Math.max(1, Math.ceil(window.innerHeight / SCALE));
    cv.width = W; cv.height = H;
    cv.style.width = window.innerWidth + 'px';
    cv.style.height = window.innerHeight + 'px';
  }

  function draw(t) {
    const c = lerpKeys(prog);
    const seaY = Math.round(H * SEA_AT);

    // gökyüzü: zenit → orta → ufuk, bantlar hâlinde
    for (let y = 0; y < seaY; y++) {
      const k = y / seaY;
      const col = k < 0.55
        ? Iso.mix(c.zenith, c.mid, k / 0.55)
        : Iso.mix(c.mid, c.horizon, (k - 0.55) / 0.45);
      ctx.fillStyle = col;
      ctx.fillRect(0, y, W, 1);
    }

    // güneş
    const sunX = Math.round(W * (0.16 + prog * 0.66));
    const sunY = Math.round(seaY * (c.sunY + 0.06));
    const rad = Math.round(Math.min(W, H) * 0.045) + 2;
    ctx.fillStyle = c.sun;
    for (let y = -rad; y <= rad; y++) {
      const half = Math.round(Math.sqrt(Math.max(0, rad * rad - y * y)));
      if (half <= 0) continue;
      ctx.fillRect(sunX - half, sunY + y, half * 2, 1);
    }

    // siluet: yavaş kayan uzak kıyı
    const shift = -prog * W * 0.13;
    const silCol = Iso.mix(c.horizon, '#16303F', 0.70 + prog * 0.18);
    for (const [rx, rw, rh, tip] of SKYLINE) {
      let x = Math.round(rx * W * 1.3 + shift);
      const bw = Math.max(1, Math.round(rw * W * 1.3));
      const bh = Math.max(2, Math.round(rh * H * 0.13));
      const top = seaY - bh;
      if (x > W || x + bw < 0) continue;
      if (tip === 'minare') {
        ctx.fillStyle = silCol;
        ctx.fillRect(x, top, bw, bh);
        ctx.fillRect(x - 1, top + Math.round(bh * 0.35), bw + 2, 1);
        ctx.fillRect(x, top - 2, bw, 2);
      } else if (tip === 'kubbe') {
        ctx.fillStyle = silCol;
        ctx.fillRect(x, top + Math.round(bh * 0.45), bw, Math.round(bh * 0.55) + 1);
        const r = Math.round(bw / 2);
        const cx = x + r, cy = top + Math.round(bh * 0.45);
        for (let y = 0; y <= r; y++) {
          const half = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
          ctx.fillRect(cx - half, cy - y, half * 2, 1);
        }
      } else {
        ctx.fillStyle = silCol;
        ctx.fillRect(x, top, bw, bh);
        if (tip === 'kule') ctx.fillRect(x + Math.round(bw / 3), top - Math.round(bh * 0.25), Math.max(1, Math.round(bw / 3)), Math.round(bh * 0.25));
      }
    }

    // deniz
    ctx.fillStyle = c.sea;
    ctx.fillRect(0, seaY, W, H - seaY);
    // yakınlaştıkça açılan taban
    for (let y = seaY; y < H; y++) {
      const k = (y - seaY) / Math.max(1, H - seaY);
      ctx.fillStyle = Iso.mix(c.sea, Iso.shade(c.sea, -0.28), k);
      ctx.fillRect(0, y, W, 1);
    }
    // ufukta ışık şeridi
    ctx.fillStyle = Iso.mix(c.horizon, c.sea, 0.45);
    ctx.fillRect(0, seaY, W, 1);

    /* Güneşin suya vuruşu. Öğlen güneş tepede olduğu için neredeyse
       yok; akşama doğru uzayıp altın bir yola dönüşüyor. Önceden hep
       aynı güçte çiziyordum, öğlen sahnesinde merdiven gibi duruyordu. */
    const guc = Math.pow(prog, 1.6);
    if (guc > 0.02) {
      const derin = H - seaY;
      const boy = Math.round(derin * (0.25 + guc * 0.75));
      for (let i = 0; i < boy; i += 2) {
        const y = seaY + 1 + i;
        if (y >= H) break;
        const k = i / boy;
        const parla = Math.sin(t * 1.5 + i * 1.1) * 0.5 + 0.5;
        if (parla < 0.4 + k * 0.5) continue;
        const wob = Math.sin(t * 0.6 + i * 0.5) * (1 + k * 5);
        const half = Math.max(1, Math.round(2.6 - k * 1.8));
        ctx.globalAlpha = guc * (1 - k * 0.85) * 0.3;
        ctx.fillStyle = c.sun;
        ctx.fillRect(Math.round(sunX - half + wob), y, half * 2, 1);
      }
      ctx.globalAlpha = 1;
    }

    // dalga çizgileri — seyrek ve kısa; deniz sakin olsun
    ctx.fillStyle = 'rgba(233,244,247,0.085)';
    const satir = Math.max(5, Math.round((H - seaY) / 7));
    for (let i = 0; i < 7; i++) {
      const y = seaY + 6 + i * satir;
      if (y >= H - 1) break;
      const speed = 2 + i * 0.5;
      const x = Math.round(((t * speed + i * 53) % (W + 80)) - 40);
      ctx.fillRect(x, y, 3 + (i % 3) * 2, 1);
      const x2 = Math.round(((t * speed * 0.7 + i * 91 + W * 0.55) % (W + 80)) - 40);
      ctx.fillRect(x2, y, 2 + (i % 2) * 2, 1);
    }
  }

  function init() {
    cv = document.getElementById('sky');
    ctx = cv.getContext('2d', { alpha: false });
    resize();
    window.addEventListener('resize', () => { resize(); draw(performance.now() / 1000); });
  }

  function setProgress(p) { prog = Math.max(0, Math.min(1, p)); }

  return { init, draw, setProgress, SEA_AT };
})();
