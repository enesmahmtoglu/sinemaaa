/* sky.js — sabit duran Boğaz manzarası.
 *
 * Sayfa sağa kaydıkça ışık öğleden akşama dönüyor. Renk kilometre
 * taşları aşağıda; aradaki her şey karışımla bulunuyor. Son durakta
 * ufuk, vapur bacasının kırmızısına düşüyor — paletteki ilk renk.
 *
 * Siluet iki katman: uzaktaki tepeler puslu ve yavaş, sahildeki
 * yapılar koyu ve hızlı kayıyor. İlk sürümde tek katman düz
 * dikdörtgenlerdi, herhangi bir şehre benziyordu.
 */

const Sky = (() => {

  const SCALE = 2;          // düşük çözünürlükte çiz, büyüt: pikseller iri kalsın
  const SEA_AT = 0.60;      // ufuk çizgisi, yüksekliğin oranı
  const SERIT = 700;        // siluetin tekrar eden şerit genişliği

  const KEYS = [
    { p: 0.00, zenith: '#17679B', mid: '#8AC6D6', horizon: '#C6E0E4', sea: '#1C4A63', sun: '#FFF6DC', sunY: 0.09 },
    { p: 0.40, zenith: '#2478A2', mid: '#8AC6D6', horizon: '#E9DAB4', sea: '#235B79', sun: '#FFE8AE', sunY: 0.24 },
    { p: 0.74, zenith: '#3A6892', mid: '#D9A08A', horizon: '#E3A79E', sea: '#2A5670', sun: '#F8C273', sunY: 0.45 },
    { p: 1.00, zenith: '#13304C', mid: '#5A4260', horizon: '#B4382C', sea: '#11283B', sun: '#D95F3E', sunY: 0.57 },
  ];

  let cv, ctx, W, H, prog = 0;

  function lerpKeys(p) {
    let a = KEYS[0], b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (p >= KEYS[i].p && p <= KEYS[i + 1].p) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    }
    const t = b.p === a.p ? 0 : (p - a.p) / (b.p - a.p);
    const e = t * t * (3 - 2 * t);
    return {
      zenith: Iso.mix(a.zenith, b.zenith, e),
      mid: Iso.mix(a.mid, b.mid, e),
      horizon: Iso.mix(a.horizon, b.horizon, e),
      sea: Iso.mix(a.sea, b.sea, e),
      sun: Iso.mix(a.sun, b.sun, e),
      sunY: a.sunY + (b.sunY - a.sunY) * e,
    };
  }

  /* ---------------- siluet ----------------
   *
   * Üç katman: uzak tepeler (puslu, yavaş), orta sırt (ara ton) ve
   * sahil şeridi (en koyu, en hızlı). Tepe hattı artık ayrı ayrı
   * dikdörtgenler değil, x'e bağlı sürekli bir yükseklik fonksiyonu;
   * üstüne konan cami, ev ve selvi tam sırta oturuyor. Fonksiyon
   * periyodik olduğu için şerit tekrar ederken dikiş görünmüyor.
   */

  function kutu(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  /* periyodik parabolik tümsek */
  function tumsek(x, c, w) {
    let d = Math.abs(x - c);
    if (d > SERIT / 2) d = SERIT - d;
    const t = d / (w / 2);
    return t >= 1 ? 0 : (1 - t * t);
  }

  const UZAK_TEPE = [[40, 340, 40], [230, 260, 27], [400, 360, 46], [600, 260, 33]];
  const ORTA_TEPE = [[120, 300, 22], [330, 280, 15], [520, 320, 25], [680, 220, 13]];

  function uzakY(x) { let h = 5; for (const [c, w, a] of UZAK_TEPE) h = Math.max(h, a * tumsek(x, c, w)); return h; }
  function ortaY(x) { let h = 3; for (const [c, w, a] of ORTA_TEPE) h = Math.max(h, a * tumsek(x, c, w)); return h; }

  /* Sırtı sütun sütun doldur: ekranın her pikseli için yüksekliği
     hesaplayıp tek bir dikey çubuk çiziyorum. */
  function sirt(fn, kay, taban, c) {
    ctx.fillStyle = c;
    for (let px = 0; px < W; px++) {
      const wx = (((px + kay) % SERIT) + SERIT) % SERIT;
      const h = Math.round(fn(wx));
      if (h > 0) ctx.fillRect(px, taban - h, 1, h + 1);
    }
  }

  /* --- yapı parçaları --- */

  function kubbe(cx, taban, r, c, alem) {
    ctx.fillStyle = c;
    for (let y = 0; y <= r; y++) {
      const half = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
      if (half > 0) ctx.fillRect(Math.round(cx - half), Math.round(taban - y), half * 2, 1);
    }
    if (alem !== false) kutu(cx, taban - r - 3, 1, 3, c);
  }

  /* Minare: gövde, iki şerefe, sivri külah. Şerefesiz hali antene
     benziyordu. */
  function minare(x, taban, h, c) {
    const w = h > 26 ? 2 : 1;
    kutu(x, taban - h, w, h, c);
    kutu(x - 1, taban - Math.round(h * 0.44), w + 2, 1, c);
    kutu(x - 1, taban - Math.round(h * 0.70), w + 2, 1, c);
    const k = Math.max(3, Math.round(h * 0.13));
    for (let i = 0; i < k; i++) {
      const ww = i < k * 0.5 ? w : 1;
      kutu(x + (w - ww) / 2, taban - h - k + i, ww, 1, c);
    }
  }

  function cami(cx, taban, o, c) {
    const g = Math.round(28 * o), gh = Math.round(7 * o);
    kutu(cx - g / 2, taban - gh, g, gh, c);                       // avlu duvarı
    kubbe(cx - Math.round(9 * o), taban - gh, Math.round(4.4 * o), c, false);
    kubbe(cx + Math.round(9 * o), taban - gh, Math.round(4.4 * o), c, false);
    kutu(cx - Math.round(8 * o), taban - gh - Math.round(3 * o), Math.round(16 * o), Math.round(3 * o), c); // kasnak
    kubbe(cx, taban - gh - Math.round(3 * o), Math.round(8.5 * o), c);
    minare(cx - Math.round(16 * o), taban, Math.round(38 * o), c);
    minare(cx + Math.round(15 * o), taban, Math.round(38 * o), c);
  }

  /* Boğaz köprüsü. Ana kablo kulelerde yüksek, ortada sarkık; yan
     açıklıklarda kuleden aşağı iniyor. */
  function kopru(x, taban, w, c) {
    const kh = Math.round(w * 0.30);
    const dy = taban - Math.round(kh * 0.30);
    const k1 = x + Math.round(w * 0.20), k2 = x + Math.round(w * 0.80);
    const sark = kh * 0.55;
    ctx.fillStyle = c;

    ctx.fillRect(Math.round(x), Math.round(dy), Math.round(w), 2);          // tabliye
    ctx.fillRect(Math.round(k1), Math.round(taban - kh), 2, kh);            // kuleler
    ctx.fillRect(Math.round(k2), Math.round(taban - kh), 2, kh);
    ctx.fillRect(Math.round(k1 - 1), Math.round(taban - kh), 4, 1);
    ctx.fillRect(Math.round(k2 - 1), Math.round(taban - kh), 4, 1);

    const orta = (k1 + k2) / 2, yari = (k2 - k1) / 2;
    for (let px = k1; px <= k2 + 1; px++) {                                 // ana açıklık
      const t = (px - orta) / yari;
      const y = Math.round(taban - kh + sark * (1 - t * t));
      ctx.fillRect(Math.round(px), y, 1, 1);
      if ((px - k1) % 9 === 0 && dy - y > 2) ctx.fillRect(Math.round(px), y, 1, dy - y);
    }
    for (let px = x; px < k1; px++) {                                        // sol yan açıklık
      const t = (px - x) / (k1 - x);
      const y = Math.round(dy - 1 - (dy - (taban - kh)) * t * t);
      ctx.fillRect(Math.round(px), y, 1, 1);
    }
    for (let px = k2 + 2; px <= x + w; px++) {                               // sağ yan açıklık
      const t = 1 - (px - k2 - 2) / (x + w - k2 - 2);
      const y = Math.round(dy - 1 - (dy - (taban - kh)) * t * t);
      ctx.fillRect(Math.round(px), y, 1, 1);
    }
  }

  function selvi(x, taban, h, c) {
    ctx.fillStyle = c;
    for (let i = 0; i < h; i++) {
      const k = i / h;
      const w = k < 0.16 ? 1 : (k < 0.38 ? 2 : (k < 0.68 ? 3 : 4));
      ctx.fillRect(Math.round(x - w / 2), Math.round(taban - h + i), w, 1);
    }
  }

  /* Dolmabahçe: uzun alçak cephe, ortada yükselen bölüm, yanında
     saat kulesi. */
  function saray(x, taban, w, c, isik) {
    const h = 10;
    kutu(x, taban - h, w, h, c);
    kutu(x + w * 0.34, taban - h - 4, w * 0.32, 4, c);
    kutu(x - 2, taban - h - 1, w + 4, 2, c);                       // saçak
    kutu(x + w * 0.32, taban - h - 6, w * 0.36, 2, c);
    if (isik > 0.01) {
      ctx.fillStyle = 'rgba(244,206,128,' + (isik * 0.5).toFixed(3) + ')';
      for (let i = 0; i < Math.floor(w / 6); i++) ctx.fillRect(Math.round(x + 3 + i * 6), Math.round(taban - h + 4), 1, 2);
      ctx.fillStyle = c;
    }
    const kx = x + w + 5;
    kutu(kx, taban - 22, 5, 22, c);
    kutu(kx - 1, taban - 26, 7, 4, c);
    kutu(kx + 2, taban - 30, 1, 4, c);
    if (isik > 0.01) kutu(kx + 1, taban - 19, 3, 3, 'rgba(244,206,128,' + (isik * 0.8).toFixed(3) + ')');
  }

  function iskele(x, taban, w, c) {
    kutu(x, taban - 6, w, 4, c);
    for (let i = 0; i < 4; i++) kutu(x + 3 + i * (w / 4), taban - 2, 1, 3, c);
    kutu(x + w * 0.4, taban - 11, 6, 5, c);
    kutu(x + w * 0.42, taban - 14, 1, 3, c);
  }

  function gemi(x, taban, w, c) {
    kutu(x, taban - 3, w, 3, c);
    kutu(x + w * 0.22, taban - 6, w * 0.55, 3, c);
    kutu(x + w * 0.46, taban - 9, 2, 3, c);
  }

  /* --- katmanların içerikleri --- */

  /* Sırtın üstüne serpiştirilmiş evler ve selviler. Konumlar sabit
     bir formülden geliyor, her karede aynı yere düşüyorlar. */
  function sirtaOturt(fn, kay, taban, c, adim, tohum) {
    for (let i = 0; i < Math.floor(SERIT / adim); i++) {
      const wx = (i * adim + ((i * 37 + tohum) % adim)) % SERIT;
      const zemin = taban - Math.round(fn(wx));
      const tip = (i * 7 + tohum) % 5;
      ogeCiz(wx, kay, px => {
        if (tip === 0) {
          selvi(px, zemin, 7 + ((i * 11) % 5), c);
        } else {
          const w = 3 + ((i * 13) % 5), h = 3 + ((i * 29) % 6);
          kutu(px, zemin - h, w, h, c);
          if (tip === 4) kutu(px + w / 2, zemin - h - 2, 1, 2, c);
        }
      });
    }
  }

  /* Bir yapıyı şeridin her tekrarında doğru yere çizer. */
  function ogeCiz(wx, kay, ciz) {
    const temel = (((wx - kay) % SERIT) + SERIT) % SERIT;
    for (let px = temel - SERIT; px < W + SERIT; px += SERIT) {
      if (px < -220 || px > W + 220) continue;
      ciz(px);
    }
  }

  /* Sahil şeridi: köprü, yalı sıraları, cami, saray, iskele. */
  const SAHIL_BINA = [[210, 400], [610, 700]];

  function sahilBinalari(kay, taban, c, isik) {
    for (const [x0, x1] of SAHIL_BINA) {
      let i = Math.floor(x0 / 7);
      for (let wx = x0; wx < x1; ) {
        const w = 7 + ((i * 29) % 9);
        const h = 7 + ((i * 71) % 14);
        const tepesi = (i * 17) % 4;
        const cizen = (px) => {
          if (px < -20 || px > W + 20) return;
          kutu(px, taban - h, w, h, c);
          if (tepesi === 0) kutu(px + 1, taban - h - 2, w - 2, 2, c);
          if (tepesi === 1) kutu(px + w / 2, taban - h - 4, 1, 4, c);
          if (isik > 0.01) {
            ctx.fillStyle = 'rgba(244,206,128,' + (isik * (0.28 + ((i * 17) % 4) * 0.11)).toFixed(3) + ')';
            for (let j = 0; j < 3; j++) {
              if ((i * 7 + j * 13) % 3 === 0) continue;
              const wy = taban - h + 3 + j * 4;
              if (wy < taban - 2) ctx.fillRect(Math.round(px + 2 + ((j * 3) % Math.max(1, w - 3))), Math.round(wy), 1, 1);
            }
            ctx.fillStyle = c;
          }
        };
        ogeCiz(wx, kay, cizen);
        wx += w + 1 + ((i * 13) % 3);
        i++;
      }
    }
  }

  function siluet(seaY, t) {
    const c = lerpKeys(prog);
    const uzakCol  = Iso.mix(c.horizon, '#3B5C71', 0.30 + prog * 0.18);
    const ortaCol  = Iso.mix(c.horizon, '#1D3648', 0.62 + prog * 0.18);
    const yakinCol = Iso.mix(c.horizon, '#0D1922', 0.82 + prog * 0.14);
    const suCol    = Iso.mix(c.sea, '#0A141C', 0.72);
    const isik = Math.max(0, (prog - 0.48) / 0.52);

    const kayUzak  = prog * SERIT * 0.30;
    const kayOrta  = prog * SERIT * 0.58;
    const kayYakin = prog * SERIT * 1.05;

    // uzak tepeler
    sirt(uzakY, kayUzak, seaY - 3, uzakCol);
    sirtaOturt(uzakY, kayUzak, seaY - 3, uzakCol, 46, 1);
    ogeCiz(400, kayUzak, px => cami(px, seaY - 3 - Math.round(uzakY(400)), 0.5, uzakCol));

    // orta sırt
    sirt(ortaY, kayOrta, seaY - 1, ortaCol);
    sirtaOturt(ortaY, kayOrta, seaY - 1, ortaCol, 30, 3);
    ogeCiz(150, kayOrta, px => cami(px, seaY - 1 - Math.round(ortaY(150)), 0.62, ortaCol));

    // ufuk pusu: katmanların arasına hava girsin
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = c.horizon;
    ctx.fillRect(0, seaY - 6, W, 6);
    ctx.globalAlpha = 1;

    // sahil
    ogeCiz(20,  kayYakin, px => kopru(px, seaY, 175, yakinCol));
    sahilBinalari(kayYakin, seaY, yakinCol, isik);
    ogeCiz(455, kayYakin, px => cami(px, seaY, 1.0, yakinCol));
    ogeCiz(500, kayYakin, px => saray(px, seaY, 84, yakinCol, isik));
    ogeCiz(430, kayYakin, px => { selvi(px, seaY, 18, yakinCol); selvi(px + 7, seaY, 13, yakinCol); selvi(px + 14, seaY, 16, yakinCol); });
    ogeCiz(180, kayYakin, px => iskele(px, seaY, 24, yakinCol));

    // suda süzülen vapurlar — zamana bağlı, kaydırmadan bağımsız
    for (let i = 0; i < 3; i++) {
      const hiz = 5 + i * 3;
      const x = ((t * hiz + i * 240) % (W + 90)) - 45;
      gemi(x, seaY + 4 + i * 5, 16 + i * 5, suCol);
    }
  }

  /* ---------------- ana çizim ---------------- */

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

    // gökyüzü
    for (let y = 0; y < seaY; y++) {
      const k = y / seaY;
      ctx.fillStyle = k < 0.55
        ? Iso.mix(c.zenith, c.mid, k / 0.55)
        : Iso.mix(c.mid, c.horizon, (k - 0.55) / 0.45);
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

    siluet(seaY, t);

    // deniz
    for (let y = seaY; y < H; y++) {
      const k = (y - seaY) / Math.max(1, H - seaY);
      ctx.fillStyle = Iso.mix(c.sea, Iso.shade(c.sea, -0.28), k);
      ctx.fillRect(0, y, W, 1);
    }
    ctx.fillStyle = Iso.mix(c.horizon, c.sea, 0.45);
    ctx.fillRect(0, seaY, W, 1);

    // güneşin suya vuruşu: öğlen neredeyse yok, akşama doğru uzuyor
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
        const half = Math.max(1, Math.round(3.4 - k * 2.2));
        ctx.globalAlpha = guc * (1 - k * 0.85) * 0.3;
        ctx.fillStyle = c.sun;
        ctx.fillRect(Math.round(sunX - half + wob), y, half * 2, 1);
      }
      ctx.globalAlpha = 1;
    }

    // dalga çizgileri — seyrek ve kısa; deniz sakin olsun
    ctx.fillStyle = 'rgba(233,244,247,0.075)';
    const satir = Math.max(6, Math.round((H - seaY) / 8));
    for (let i = 0; i < 8; i++) {
      const y = seaY + 8 + i * satir;
      if (y >= H - 1) break;
      const speed = 3 + i * 0.7;
      const x = Math.round(((t * speed + i * 53) % (W + 90)) - 45);
      ctx.fillRect(x, y, 5 + (i % 3) * 4, 1);
      const x2 = Math.round(((t * speed * 0.7 + i * 91 + W * 0.55) % (W + 90)) - 45);
      ctx.fillRect(x2, y, 4 + (i % 2) * 3, 1);
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
