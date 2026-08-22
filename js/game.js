/* game.js — "foku yüzdür".
 *
 * Tek parmakla oynanıyor: basılı tut, fok dalar; bırak, yüzeye çıkar.
 * Vapurların altından geçmek, denizanalarına çarpmamak, yol boyunca
 * simit toplamak gerekiyor. Kaybetmek yok: çarpınca sadece yavaşlıyor.
 * Davetiyede insanı kapıda tutan bir oyun istemedim.
 *
 * Ekran 320x200 çiziliyor ve CSS ile büyütülüyor; telefonda kutunun
 * neredeyse tamamını kaplasın diye oranı 8:5 tuttum.
 */

const Game = (() => {

  const W = 320, H = 200;
  const SURF = 70;              // su yüzeyi
  const HEDEF = 1200;           // metre
  const FOKX = 46;              // fokun sabit yatay yeri

  const COL = {
    gokUst: '#4E9FC0', gokAlt: '#BFE0E6',
    uzak:   '#7FA6B4', yakin:  '#5D8697',
    suUst:  '#2A6484', suOrta: '#1C4A63', suDip: '#0E2939',
    kopuk:  '#CDE7EC',
    kirmizi: '#B4382C', beyaz: '#EFE6D6', koyu: '#22323C',
    pembe:  '#E3A79E', altin: '#DFAE3E', yesil: '#5C7F4E', pas: '#8C5A38',
  };
  const KONFETI = ['#B4382C', '#DFAE3E', '#8C5A38', '#5C7F4E', '#1C4A63', '#E3A79E'];

  let cv, ctx, msgEl, distEl, simitEl, againEl;
  let raf = null, running = false, held = false, last = 0;

  const fok = { x: FOKX, y: SURF + 4, vy: 0, hit: 0, batik: false };
  let dist, speed, gecen, engel, simitler, parca, kabarcik, konfeti, gullar;
  let spawnAt, simitAt, durum, bitisT, sarsinti, toplanan, carpma, kilometre, mesajT;

  /* ---------------- kurulum ---------------- */

  function reset() {
    fok.x = FOKX; fok.y = SURF + 4; fok.vy = 0; fok.hit = 0; fok.batik = false;
    dist = 0; speed = 52; gecen = 0;
    engel = []; simitler = []; parca = []; kabarcik = []; konfeti = [];
    gullar = [{ x: 40, y: 18, f: 0 }, { x: 170, y: 30, f: 1 }, { x: 260, y: 12, f: 0 }];
    spawnAt = 120; simitAt = 70; durum = 'oyna'; bitisT = 0; sarsinti = 0;
    toplanan = 0; carpma = 0; kilometre = 0; mesajT = 0;
    msgEl.textContent = 'basılı tut — fok dalar';
    againEl.hidden = true;
    const stats = document.querySelector('.game__stats');
    stats.innerHTML = '<b id="gameSimit">0</b> simit &middot; <b id="gameDist">0 m</b>';
    simitEl = document.getElementById('gameSimit');
    distEl = document.getElementById('gameDist');
  }

  /* ---------------- doğurma ---------------- */

  function spawn() {
    const r = Math.random();
    if (r < 0.46) {
      const w = 52 + Math.round(Math.random() * 40);
      engel.push({ tip: 'vapur', x: W + 14, y: SURF - 20, w: w, h: 28, ph: Math.random() * 6 });
    } else if (r < 0.80) {
      engel.push({ tip: 'anason', x: W + 10, y: SURF + 48 + Math.random() * 62, w: 13, h: 16, ph: Math.random() * 6 });
    } else {
      engel.push({ tip: 'samandira', x: W + 10, y: SURF + 22 + Math.random() * 26, w: 11, h: 14, ph: Math.random() * 6 });
    }
  }

  function spawnSimit() {
    const y = SURF + 10 + Math.random() * 110;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      simitler.push({ x: W + 12 + i * 18, y: y + Math.sin(i) * 8, al: false });
    }
  }

  function patlat(x, y, renk, n, hiz) {
    hiz = hiz || 1;
    for (let i = 0; i < n; i++) {
      parca.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 90 * hiz,
        vy: (-Math.random() * 70 - 15) * hiz,
        t: 0.45 + Math.random() * 0.3, c: renk, g: 240,
      });
    }
  }

  function konfetiAt(n) {
    for (let i = 0; i < n; i++) {
      konfeti.push({
        x: Math.random() * W, y: -6 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 24, vy: 22 + Math.random() * 34,
        c: KONFETI[i % KONFETI.length], d: Math.random() * 6, s: Math.random() < 0.5 ? 2 : 3,
      });
    }
  }

  /* ---------------- güncelleme ---------------- */

  function update(dt) {
    // parçacıklar her durumda yaşasın
    for (const p of parca) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
    parca = parca.filter(p => p.t > 0);
    for (const k of kabarcik) { k.t -= dt; k.y -= k.hz * dt; k.x -= speed * dt * 0.35; }
    kabarcik = kabarcik.filter(k => k.t > 0 && k.y > SURF - 2);
    for (const k of konfeti) {
      k.x += k.vx * dt; k.y += k.vy * dt; k.d += dt * 6;
      k.vx += Math.sin(k.d) * 8 * dt;
    }
    for (const k of konfeti) {
      if (k.y > SURF && !k.dustu) {
        k.dustu = true;
        parca.push({ x: k.x, y: SURF, vx: (Math.random() - 0.5) * 20, vy: -22, t: 0.25, c: COL.kopuk, g: 200 });
      }
    }
    konfeti = konfeti.filter(k => !k.dustu);
    if (sarsinti > 0) sarsinti -= dt * 26;

    if (durum === 'bitti') {
      bitisT += dt;
      /* Konfeti bir kere atılıp bitince ekran iki saniyede sönüyordu;
         kutlama açık kaldığı sürece azar azar dökülmeye devam etsin. */
      if (Math.random() < dt * 26) konfetiAt(2);
      // geride kalan engeller ve simitler süzülüp çıksın
      for (const e of engel) e.x -= 44 * dt;
      engel = engel.filter(e => e.x + e.w > -20);
      for (const sm of simitler) sm.x -= 44 * dt;
      simitler = simitler.filter(sm => sm.x > -14);
      for (const g of gullar) {
        g.x -= 22 * dt; g.f += dt * 7;
        if (g.x < -14) { g.x = W + 14; g.y = 8 + Math.random() * 34; }
      }
      // fok iskeleye doğru süzülüp sevinçle zıplıyor
      fok.x += (W - 168 - fok.x) * Math.min(1, dt * 1.6);
      const hedefY = SURF - 2 + Math.sin(bitisT * 4.2) * 5;
      fok.y += (hedefY - fok.y) * Math.min(1, dt * 5);
      if (bitisT > 1.4 && Math.random() < dt * 6) {
        patlat(fok.x + 14, SURF, COL.kopuk, 3, 0.5);
      }
      return;
    }

    gecen += dt;
    speed = Math.min(112, speed + dt * 3.4);
    dist += speed * dt * 0.42;

    // dikey hareket
    const oncekiBatik = fok.batik;
    fok.vy += (held ? 168 : -128) * dt;
    fok.vy *= 0.90;
    fok.y += fok.vy * dt;
    if (fok.y < SURF - 15) { fok.y = SURF - 15; fok.vy *= -0.25; }
    if (fok.y > H - 26)    { fok.y = H - 26;   fok.vy = 0; }
    fok.batik = fok.y + 10 > SURF;

    // yüzeyi her geçişte sıçrama
    if (fok.batik !== oncekiBatik && Math.abs(fok.vy) > 18) {
      patlat(FOKX + 14, SURF, COL.kopuk, 7, 0.8);
      kabarcik.push({ x: FOKX + 14, y: SURF + 2, r: 3, t: 0.5, hz: 26 });
    }
    // dalarken kabarcık izi
    if (fok.batik && Math.random() < dt * 26) {
      kabarcik.push({
        x: FOKX + 4 + Math.random() * 16, y: fok.y + 14,
        r: 1 + Math.floor(Math.random() * 2), t: 1.4, hz: 16 + Math.random() * 16,
      });
    }

    // engeller
    spawnAt -= speed * dt;
    if (spawnAt <= 0) { spawn(); spawnAt = 86 + Math.random() * 70; }
    simitAt -= speed * dt;
    if (simitAt <= 0) { spawnSimit(); simitAt = 150 + Math.random() * 160; }

    if (fok.hit > 0) fok.hit -= dt;

    for (const e of engel) {
      e.x -= speed * dt;
      if (fok.hit <= 0 &&
          e.x < FOKX + 24 && e.x + e.w > FOKX + 4 &&
          fok.y + 19 > e.y && fok.y + 4 < e.y + e.h) {
        fok.hit = 0.9;
        sarsinti = 5;
        carpma++;
        speed = Math.max(38, speed * 0.58);
        patlat(FOKX + 16, fok.y + 11, e.tip === 'vapur' ? COL.beyaz : COL.pembe, 12);
        msgEl.textContent = e.tip === 'vapur' ? 'eh, vapurla da gideriz' : 'denizanası, aman';
        mesajT = 2.2;
      }
    }
    engel = engel.filter(e => e.x + e.w > -20);

    for (const s of simitler) {
      s.x -= speed * dt;
      if (!s.al && Math.abs(s.x - (FOKX + 14)) < 14 && Math.abs(s.y - (fok.y + 11)) < 14) {
        s.al = true; toplanan++;
        simitEl.textContent = String(toplanan);
        patlat(s.x, s.y, COL.altin, 8, 0.7);
      }
    }
    simitler = simitler.filter(s => !s.al && s.x > -14);

    // martılar
    for (const g of gullar) {
      g.x -= (18 + g.y * 0.2) * dt;
      if (g.x < -14) { g.x = W + 14; g.y = 8 + Math.random() * 34; }
      g.f += dt * 7;
    }

    // mesaj birkaç saniye sonra sönsün, ekranda takılı kalmasın
    if (mesajT > 0) {
      mesajT -= dt;
      if (mesajT <= 0) msgEl.textContent = 'basılı tut — fok dalar';
    }

    // ara mesajlar
    const oran = dist / HEDEF;
    if (oran > 0.35 && kilometre === 0) { kilometre = 1; msgEl.textContent = "Boğaz'ın ortası"; mesajT = 2.6; }
    if (oran > 0.70 && kilometre === 1) { kilometre = 2; msgEl.textContent = 'Beşiktaş göründü'; mesajT = 2.6; }

    if (dist >= HEDEF) {
      durum = 'bitti'; bitisT = 0; konfetiAt(40);
      const sn = gecen.toFixed(1);
      let yeniRekor = false, eski = null;
      try {
        eski = localStorage.getItem('fokRekor');
        if (!eski || parseFloat(eski) > gecen) { localStorage.setItem('fokRekor', sn); yeniRekor = true; }
      } catch (err) { /* gizli sekmede localStorage kapalı olabilir */ }
      /* Metinler uzun olunca HUD iki satıra taşıp düğmeleri aşağı
         itiyordu; kısa tutuyorum. */
      msgEl.textContent = yeniRekor ? 'Beşiktaş! yeni rekor' : 'Beşiktaş! karşıya geçtik';
      simitEl.parentNode.innerHTML =
        '<b>' + sn + '</b> sn &middot; <b>' + toplanan + '</b> simit';
      againEl.hidden = false;
    }
    distEl.textContent = Math.round(Math.min(dist, HEDEF)) + ' m';
  }

  /* ---------------- çizim ---------------- */

  function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  function cizGok(t) {
    for (let y = 0; y < SURF; y++) {
      ctx.fillStyle = Iso.mix(COL.gokUst, COL.gokAlt, y / SURF);
      ctx.fillRect(0, y, W, 1);
    }
    // güneş
    const sx = 258, sy = 20, r = 9;
    ctx.fillStyle = '#FFF3D0';
    for (let y = -r; y <= r; y++) {
      const half = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
      ctx.fillRect(sx - half, sy + y, half * 2, 1);
    }
    // bulutlar
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 4; i++) {
      const x = Math.round(((i * 97 - dist * 0.05) % (W + 70)) - 35);
      const y = 8 + (i * 11) % 22;
      ctx.fillRect(x, y, 22 + (i % 3) * 9, 3);
      ctx.fillRect(x + 5, y - 3, 13 + (i % 2) * 6, 3);
    }
    // uzak kıyı
    for (let i = 0; i < 24; i++) {
      const x = Math.round(((i * 21 - dist * 0.07) % (W + 44)) - 22);
      const bw = 10 + ((i * 5) % 13);
      const h = 6 + ((i * 13) % 20);
      ctx.fillStyle = COL.uzak;
      ctx.fillRect(x, SURF - h, bw, h);
      if (i % 7 === 3) {
        ctx.fillStyle = Iso.mix(COL.uzak, COL.yakin, 0.6);
        ctx.fillRect(x + (bw >> 1), SURF - h - 14, 2, 14);
        ctx.fillRect(x + (bw >> 1) - 1, SURF - h - 8, 4, 1);
      }
    }
    // yakın kıyı, daha hızlı kayıyor
    for (let i = 0; i < 16; i++) {
      const x = Math.round(((i * 33 - dist * 0.15) % (W + 60)) - 30);
      const bw = 14 + ((i * 7) % 16);
      const h = 4 + ((i * 11) % 12);
      ctx.fillStyle = COL.yakin;
      ctx.fillRect(x, SURF - h, bw, h);
    }
    // martılar
    for (const g of gullar) {
      const art = Math.sin(g.f) > 0 ? Sprites.MARTI : Sprites.MARTI2;
      Sprites.draw(ctx, art, Math.round(g.x), Math.round(g.y), { scale: 1 });
    }
  }

  function cizDeniz(t) {
    for (let y = SURF; y < H; y++) {
      const k = (y - SURF) / (H - SURF);
      ctx.fillStyle = k < 0.45
        ? Iso.mix(COL.suUst, COL.suOrta, k / 0.45)
        : Iso.mix(COL.suOrta, COL.suDip, (k - 0.45) / 0.55);
      ctx.fillRect(0, y, W, 1);
    }
    // ışık huzmeleri
    ctx.fillStyle = 'rgba(205,231,236,0.05)';
    for (let i = 0; i < 5; i++) {
      const x = Math.round(((i * 79 - dist * 0.5) % (W + 120)) - 60);
      for (let d = 0; d < 46; d++) {
        ctx.fillRect(x + d, SURF + d, 10 - Math.floor(d / 8), 1);
      }
    }
    // yüzey çizgisi ve köpük
    px(0, SURF, W, 1, COL.kopuk);
    ctx.fillStyle = 'rgba(205,231,236,0.4)';
    for (let i = 0; i < 22; i++) {
      const x = Math.round(((i * 27 - dist * 1.5) % (W + 50)) - 25);
      ctx.fillRect(x, SURF + 2 + (i % 3), 5 + (i % 4) * 3, 1);
    }
    // derin akıntı çizgileri
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 10; i++) {
      const x = Math.round(((i * 47 - dist * 0.9) % (W + 90)) - 45);
      ctx.fillRect(x, SURF + 26 + i * 12, 26 + (i % 3) * 10, 1);
    }
  }

  function cizEngel(e, t) {
    const x = Math.round(e.x), y = Math.round(e.y);
    if (e.tip === 'vapur') {
      const sal = Math.round(Math.sin(t * 1.6 + e.ph) * 1.5);
      px(x, y + 16 + sal, e.w, 12, COL.koyu);                       // su altı gövde
      px(x + 3, y + 6 + sal, e.w - 6, 11, COL.beyaz);
      px(x + (e.w >> 1) - 4, y - 6 + sal, 9, 13, COL.kirmizi);       // baca
      px(x + (e.w >> 1) - 4, y - 6 + sal, 9, 4, COL.koyu);
      ctx.fillStyle = '#2D4E5F';
      for (let i = 0; i < Math.floor((e.w - 14) / 9); i++) ctx.fillRect(x + 8 + i * 9, y + 9 + sal, 5, 4);
      // dümen suyu
      ctx.fillStyle = 'rgba(205,231,236,0.5)';
      for (let i = 0; i < 4; i++) ctx.fillRect(x - 4 - i * 6, y + 27 + sal + (i % 2), 5, 1);
    } else if (e.tip === 'anason') {
      const yy = y + Math.round(Math.sin(t * 2.4 + e.ph) * 2.5);
      px(x + 2, yy, 9, 7, COL.pembe);
      px(x, yy + 2, 13, 4, COL.pembe);
      px(x + 3, yy + 1, 4, 2, '#F3C7C1');
      ctx.fillStyle = 'rgba(227,167,158,0.7)';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + 2 + i * 2, yy + 7, 1, 5 + ((i + Math.floor(t * 7)) % 4));
      }
    } else {
      const yy = y + Math.round(Math.sin(t * 1.9 + e.ph) * 1.6);
      px(x, yy, 11, 10, COL.kirmizi);
      px(x, yy - 3, 11, 3, COL.koyu);
      px(x + 3, yy + 3, 5, 2, '#D9695C');
    }
  }

  function cizSimit(s, t) {
    const x = Math.round(s.x), y = Math.round(s.y + Math.sin(t * 3 + s.x * 0.1) * 1.5);
    // halka: dış daire çiz, ortasını oy
    ctx.fillStyle = COL.altin;
    for (let dy = -5; dy <= 5; dy++) {
      const half = Math.round(Math.sqrt(Math.max(0, 30 - dy * dy)));
      if (half > 0) ctx.fillRect(x - half, y + dy, half * 2, 1);
    }
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.clearRect(0, 0, 0, 0);
    for (let dy = -2; dy <= 2; dy++) {
      const half = Math.round(Math.sqrt(Math.max(0, 6 - dy * dy)));
      if (half > 0) { ctx.fillStyle = 'rgba(20,55,74,0.75)'; ctx.fillRect(x - half, y + dy, half * 2, 1); }
    }
    px(x - 4, y - 3, 2, 1, '#F2D089');            // üstte ışık
    ctx.fillStyle = 'rgba(140,90,56,0.5)';        // susam
    for (let i = 0; i < 5; i++) ctx.fillRect(x - 4 + ((i * 3) % 9), y - 4 + ((i * 5) % 9), 1, 1);
  }

  function cizFok(t) {
    const fy = Math.round(fok.y);
    const fx = Math.round(fok.x);
    // kabarcık izi
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    if (fok.batik) {
      for (let i = 0; i < 5; i++) {
        const bx = fx - 4 - i * 9 - ((t * 60) % 9);
        ctx.fillRect(Math.round(bx), fy + 11 + (i % 2) * 3, 2, 2);
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const bx = fx - 2 - i * 10 - ((t * 70) % 10);
        ctx.fillRect(Math.round(bx), SURF + 1 + (i % 2), 6 - i, 1);
      }
    }
    // hız çizgileri
    if (speed > 84) {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      for (let i = 0; i < 4; i++) {
        const lx = ((t * 260 + i * 83) % (W + 60)) - 60;
        ctx.fillRect(Math.round(lx), 90 + i * 24, 20, 1);
      }
    }
    if (!(fok.hit > 0 && Math.floor(fok.hit * 16) % 2 === 0)) {
      Sprites.draw(ctx, Sprites.FOK, fx, fy, { scale: 1 });
    }
  }

  function cizBitis(t) {
    // iskele sağdan kayarak giriyor
    const a = Math.min(1, bitisT / 1.5);
    const e = 1 - Math.pow(1 - a, 3);
    const ix = Math.round(W - 122 + (1 - e) * 170);
    px(ix, SURF - 6, 110, 8, COL.pas);
    px(ix, SURF + 2, 110, 3, Iso.shade(COL.pas, -0.3));
    for (let i = 0; i < 5; i++) px(ix + 8 + i * 22, SURF + 5, 5, 26, Iso.shade(COL.pas, -0.42));
    px(ix + 6, SURF - 20, 4, 14, '#4A555E');
    px(ix + 2, SURF - 24, 12, 5, COL.altin);
    // rakun iskelede el sallıyor
    const zip = Math.round(Math.sin(bitisT * 7) * 2);
    Sprites.draw(ctx, Sprites.RAKUN, ix + 44, SURF - 6 - Sprites.height(Sprites.RAKUN) + zip, { scale: 1 });
  }

  function render(t) {
    ctx.save();
    if (sarsinti > 0) {
      ctx.translate(Math.round((Math.random() - 0.5) * sarsinti), Math.round((Math.random() - 0.5) * sarsinti));
    }

    cizGok(t);
    cizDeniz(t);

    if (durum === 'bitti') cizBitis(t);

    for (const e of engel) cizEngel(e, t);
    for (const s of simitler) cizSimit(s, t);

    // kabarcıklar
    for (const k of kabarcik) {
      ctx.fillStyle = 'rgba(205,231,236,' + (0.15 + 0.35 * Math.min(1, k.t)) + ')';
      ctx.fillRect(Math.round(k.x), Math.round(k.y), k.r, k.r);
    }

    cizFok(t);

    for (const p of parca) { px(p.x, p.y, 2, 2, p.c); }
    for (const k of konfeti) { px(k.x, k.y, k.s, k.s + 1, k.c); }

    ctx.restore();

    // ilerleme şeridi — vapur biçiminde bir imleç taşıyor
    const oran = Math.min(dist, HEDEF) / HEDEF;
    px(10, 8, W - 20, 3, 'rgba(23,37,46,0.28)');
    px(10, 8, Math.round(oran * (W - 20)), 3, COL.altin);
    const mx = 10 + Math.round(oran * (W - 20));
    px(mx - 3, 5, 6, 3, COL.beyaz);
    px(mx - 1, 2, 2, 3, COL.kirmizi);
  }

  /* ---------------- döngü ---------------- */

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render(now / 1000);
    raf = requestAnimationFrame(loop);
  }

  function press(ev) {
    if (ev) ev.preventDefault();
    if (durum === 'bitti') return;
    held = true;
  }
  function release(ev) {
    if (ev) ev.preventDefault();
    held = false;
  }

  function open() {
    document.getElementById('game').hidden = false;
    reset();
    running = true; last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function close() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    document.getElementById('game').hidden = true;
  }

  function init() {
    cv = document.getElementById('gameCanvas');
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    msgEl = document.getElementById('gameMsg');
    distEl = document.getElementById('gameDist');
    simitEl = document.getElementById('gameSimit');
    againEl = document.getElementById('gameAgain');

    cv.addEventListener('pointerdown', press);
    cv.addEventListener('pointercancel', release);
    window.addEventListener('pointerup', release);
    window.addEventListener('keydown', ev => {
      if (!running) return;
      if (ev.code === 'Space' || ev.code === 'ArrowDown') press(ev);
      if (ev.code === 'Escape') close();
      if (ev.code === 'Enter' && durum === 'bitti') reset();
    });
    window.addEventListener('keyup', ev => {
      if (ev.code === 'Space' || ev.code === 'ArrowDown') release(ev);
    });
    againEl.addEventListener('click', () => { reset(); });
    document.getElementById('gameClose').addEventListener('click', close);
    document.getElementById('game').addEventListener('click', ev => {
      if (ev.target.id === 'game') close();
    });
  }

  return { init, open, close, isOpen: () => running };
})();
