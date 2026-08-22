/* game.js — "foku yüzdür".
 *
 * Tek parmakla oynanıyor: basılı tut, fok dalar; bırak, yüzeye çıkar.
 * Vapurların altından geçmek, denizanalarına çarpmamak gerekiyor.
 * Kaybetmek yok — çarpınca sadece yavaşlıyorsun. Davetiyede insanı
 * yenen bir oyun istemedim.
 */

const Game = (() => {

  const W = 240, H = 132;
  const SURF = 46;              // su yüzeyi
  const HEDEF = 1400;           // metre

  let cv, ctx, msgEl, distEl, raf = null, running = false;
  let held = false, last = 0;

  const fok = { y: SURF + 6, vy: 0, hit: 0 };
  let dist = 0, speed = 0, engel = [], parts = [], spawnAt = 60, bitti = false, sway = 0;

  const COL = {
    gok: '#8FC0D0', gokAlt: '#C6E0E4',
    su: '#1C4A63', suUst: '#2A6484', suDip: '#12303F',
    kirmizi: '#B4382C', beyaz: '#EFE6D6', koyu: '#22323C',
    pembe: '#E3A79E', altin: '#DFAE3E',
  };

  function reset() {
    fok.y = SURF + 8; fok.vy = 0; fok.hit = 0;
    dist = 0; speed = 46; engel = []; parts = []; spawnAt = 70; bitti = false; sway = 0;
    msgEl.textContent = 'basılı tut — fok dalar';
  }

  function spawn() {
    const r = Math.random();
    if (r < 0.48) {
      // vapur: yüzeyde, altından geçilecek
      const w = 34 + Math.round(Math.random() * 26);
      engel.push({ tip: 'vapur', x: W + 10, y: SURF - 12, w: w, h: 18 });
    } else if (r < 0.82) {
      // denizanası: derinde, yukarıda kalmak gerek
      engel.push({ tip: 'anason', x: W + 8, y: SURF + 40 + Math.random() * 30, w: 9, h: 12 });
    } else {
      // şamandıra: tam ortada, iki yandan geçilir
      engel.push({ tip: 'samandira', x: W + 8, y: SURF + 22 + Math.random() * 14, w: 8, h: 10 });
    }
  }

  function patlat(x, y, renk, n) {
    for (let i = 0; i < n; i++) {
      parts.push({ x: x, y: y, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 50 - 10, t: 0.5, c: renk });
    }
  }

  function update(dt) {
    if (bitti) { sway += dt; return; }

    speed += dt * 3.2;
    if (speed > 96) speed = 96;
    dist += speed * dt * 0.42;

    // dikey hareket
    fok.vy += (held ? 150 : -118) * dt;
    fok.vy *= 0.90;
    fok.y += fok.vy * dt;
    if (fok.y < SURF - 7) { fok.y = SURF - 7; fok.vy = 0; }
    if (fok.y > H - 15)   { fok.y = H - 15;   fok.vy = 0; }

    // engeller
    spawnAt -= speed * dt;
    if (spawnAt <= 0) { spawn(); spawnAt = 52 + Math.random() * 46; }

    if (fok.hit > 0) fok.hit -= dt;

    for (const e of engel) {
      e.x -= speed * dt;
      if (fok.hit <= 0 &&
          e.x < 59 && e.x + e.w > 46 &&
          fok.y + 11 > e.y && fok.y + 2 < e.y + e.h) {
        fok.hit = 0.9;
        speed = Math.max(34, speed * 0.55);
        patlat(52, fok.y + 6, e.tip === 'vapur' ? COL.beyaz : COL.pembe, 8);
        msgEl.textContent = e.tip === 'vapur' ? 'eh, vapurla da gideriz' : 'denizanası, aman';
      }
    }
    engel = engel.filter(e => e.x + e.w > -12);

    for (const p of parts) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; }
    parts = parts.filter(p => p.t > 0);

    if (dist >= HEDEF) {
      bitti = true;
      msgEl.textContent = 'Beşiktaş. iskeleye yanaşıyoruz';
    }
    distEl.textContent = Math.round(Math.min(dist, HEDEF)) + ' m';
  }

  function render(t) {
    // gök
    for (let y = 0; y < SURF; y++) {
      ctx.fillStyle = Iso.mix(COL.gok, COL.gokAlt, y / SURF);
      ctx.fillRect(0, y, W, 1);
    }
    /* uzak kıyı: hepsi aynı boyda dikdörtgen olunca grafik gibi
       duruyordu — yükseklik ve genişliği karıştırıp araya iki minare
       koydum, siluet İstanbul'a benzesin. */
    for (let i = 0; i < 20; i++) {
      const x = Math.round(((i * 17 - dist * 0.07) % (W + 40)) - 20);
      const bw = 8 + ((i * 5) % 11);
      const h = 5 + ((i * 13) % 17);
      ctx.fillStyle = (i % 3 === 0) ? '#5A7E90' : '#688C9C';
      ctx.fillRect(x, SURF - h, bw, h);
      if (i % 7 === 3) {                       // minare
        ctx.fillStyle = '#4E7183';
        ctx.fillRect(x + Math.round(bw / 2), SURF - h - 11, 2, 11);
        ctx.fillRect(x + Math.round(bw / 2) - 1, SURF - h - 6, 4, 1);
      }
    }
    ctx.fillStyle = 'rgba(30,60,78,0.25)';
    ctx.fillRect(0, SURF - 2, W, 2);
    // su
    for (let y = SURF; y < H; y++) {
      const k = (y - SURF) / (H - SURF);
      ctx.fillStyle = Iso.mix(COL.suUst, COL.suDip, k);
      ctx.fillRect(0, y, W, 1);
    }
    ctx.fillStyle = '#BFE0E6';
    ctx.fillRect(0, SURF, W, 1);
    // yüzey kabarcıkları
    ctx.fillStyle = 'rgba(191,224,230,0.35)';
    for (let i = 0; i < 18; i++) {
      const x = Math.round(((i * 29 - dist * 1.4) % (W + 40)) - 20);
      ctx.fillRect(x, SURF + 2 + (i % 3), 4 + (i % 3) * 3, 1);
    }
    // derinlik çizgileri
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 8; i++) {
      const x = Math.round(((i * 41 - dist * 0.9) % (W + 60)) - 30);
      ctx.fillRect(x, SURF + 22 + i * 9, 22, 1);
    }

    // engeller
    for (const e of engel) {
      const x = Math.round(e.x);
      if (e.tip === 'vapur') {
        ctx.fillStyle = COL.koyu;  ctx.fillRect(x, Math.round(e.y) + 11, e.w, 7);
        ctx.fillStyle = COL.beyaz; ctx.fillRect(x + 2, Math.round(e.y) + 4, e.w - 4, 7);
        ctx.fillStyle = COL.kirmizi; ctx.fillRect(x + Math.round(e.w / 2) - 3, Math.round(e.y) - 4, 6, 8);
        ctx.fillStyle = COL.koyu;  ctx.fillRect(x + Math.round(e.w / 2) - 3, Math.round(e.y) - 4, 6, 2);
        ctx.fillStyle = '#2D4E5F';
        for (let i = 0; i < Math.floor((e.w - 8) / 6); i++) ctx.fillRect(x + 5 + i * 6, Math.round(e.y) + 6, 3, 3);
      } else if (e.tip === 'anason') {
        const yy = Math.round(e.y + Math.sin(t * 3 + e.x) * 1.5);
        ctx.fillStyle = COL.pembe;
        ctx.fillRect(x + 1, yy, 7, 5);
        ctx.fillRect(x, yy + 1, 9, 3);
        ctx.fillStyle = 'rgba(227,167,158,0.65)';
        for (let i = 0; i < 4; i++) ctx.fillRect(x + 1 + i * 2, yy + 5, 1, 4 + ((i + Math.floor(t * 6)) % 3));
      } else {
        ctx.fillStyle = COL.kirmizi; ctx.fillRect(x, Math.round(e.y), 8, 8);
        ctx.fillStyle = COL.koyu;    ctx.fillRect(x, Math.round(e.y) - 2, 8, 2);
      }
    }

    // fok
    const fy = Math.round(fok.y) + (bitti ? Math.round(Math.sin(sway * 4) * 2) : 0);
    if (fok.hit > 0 && Math.floor(fok.hit * 14) % 2 === 0) {
      // çarpınca bir kare atla: yanıp söner
    } else {
      Sprites.draw(ctx, Sprites.FOK, 44, fy, { scale: 1 });
    }
    // arkasında kabarcık izi
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 4; i++) {
      const bx = 42 - i * 7 - ((t * 40) % 7);
      ctx.fillRect(Math.round(bx), fy + 7 + (i % 2), 2, 1);
    }

    for (const p of parts) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }

    // ilerleme çubuğu
    const pw = Math.round((Math.min(dist, HEDEF) / HEDEF) * (W - 16));
    ctx.fillStyle = 'rgba(23,37,46,0.35)'; ctx.fillRect(8, 6, W - 16, 3);
    ctx.fillStyle = COL.altin;             ctx.fillRect(8, 6, pw, 3);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render(now / 1000);
    raf = requestAnimationFrame(loop);
  }

  function press(e) { if (e) e.preventDefault(); held = true; if (bitti) { reset(); } }
  function release(e) { if (e) e.preventDefault(); held = false; }

  function open() {
    document.getElementById('game').hidden = false;
    reset();
    running = true; last = performance.now();
    raf = requestAnimationFrame(loop);
    document.getElementById('gameClose').focus();
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

    cv.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);
    window.addEventListener('keydown', ev => {
      if (!running) return;
      if (ev.code === 'Space' || ev.code === 'ArrowDown') press(ev);
      if (ev.code === 'Escape') close();
    });
    window.addEventListener('keyup', ev => {
      if (ev.code === 'Space' || ev.code === 'ArrowDown') release(ev);
    });
    document.getElementById('gameClose').addEventListener('click', close);
    document.getElementById('game').addEventListener('click', ev => {
      if (ev.target.id === 'game') close();
    });
  }

  return { init, open, close, isOpen: () => running };
})();
