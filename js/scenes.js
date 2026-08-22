/* scenes.js — sekiz izometrik diorama.
 *
 * Her sahne 168x112'lik minik bir tuvale çizilir. Kural: her şey
 * paletin altı renginden ya da onların açığından/koyusundan türer.
 */

const Scenes = (() => {

  const C = {
    seaRed:   '#B4382C',
    seaBlue:  '#1C4A63',
    seaRust:  '#8C5A38',
    green:    '#5C7F4E',
    gold:     '#DFAE3E',
    pink:     '#E3A79E',
    stone:    '#C9BCA4',
    deck:     '#A8875E',
    hull:     '#EFE6D6',
  };

  /* ---------- ortak parçalar ---------- */

  /* yConst yüzeyi = izleyiciye sol bakan yüz */
  function faceY(ctx, ox, oy, yC, x0, z0, x1, z1, color) {
    const P = (a, b, c) => { const p = Iso.project(a, b, c); return [p[0] + ox, p[1] + oy]; };
    Iso.fillPoly(ctx, [P(x0, yC, z0), P(x1, yC, z0), P(x1, yC, z1), P(x0, yC, z1)], color);
  }
  /* xConst yüzeyi = izleyiciye sağ bakan yüz */
  function faceX(ctx, ox, oy, xC, y0, z0, y1, z1, color) {
    const P = (a, b, c) => { const p = Iso.project(a, b, c); return [p[0] + ox, p[1] + oy]; };
    Iso.fillPoly(ctx, [P(xC, y0, z0), P(xC, y1, z0), P(xC, y1, z1), P(xC, y0, z1)], color);
  }

  function plinth(ctx, ox, oy, gw, gd, top, side, h) {
    h = h || 1.6;
    Iso.box(ctx, ox, oy, 0, 0, -h, gw, gd, h, side, { top: top });
  }

  /* Su: koyu taban + üstünde kayan açık şeritler. Şeritler karo
     boyunca değil, ekran satırı boyunca hareket ediyor; izometrik
     dalganın böyle okunduğunu deneyerek buldum. */
  function water(ctx, ox, oy, gw, gd, t, base) {
    base = base || C.seaBlue;
    Iso.tile(ctx, ox, oy, 0, 0, 0, gw, gd, base);
    const light = Iso.shade(base, 0.26);
    const lighter = Iso.shade(base, 0.44);
    for (let i = 0; i < 7; i++) {
      const yy = (i * 1.05 + (t * 0.35 + i * 0.31) % 1.05);
      if (yy > gd - 0.15) continue;
      const x0 = 0.4 + ((i * 1.7 + t * 0.6) % (gw - 2.2));
      const w = 0.7 + (i % 3) * 0.45;
      Iso.tile(ctx, ox, oy, x0, yy, 0.02, w, 0.16, i % 3 === 0 ? lighter : light);
    }
  }

  function tree(ctx, ox, oy, x, y, scale, tone) {
    const g = tone || C.green;
    Iso.box(ctx, ox, oy, x + 0.32, y + 0.32, 0, 0.36, 0.36, 0.9 * scale, C.seaRust);
    Iso.box(ctx, ox, oy, x - 0.05, y - 0.05, 0.75 * scale, 1.1, 1.1, 0.75 * scale, Iso.shade(g, -0.12));
    Iso.box(ctx, ox, oy, x + 0.16, y + 0.16, 1.4 * scale, 0.75, 0.75, 0.6 * scale, g);
    Iso.box(ctx, ox, oy, x + 0.34, y + 0.34, 1.9 * scale, 0.4, 0.4, 0.4 * scale, Iso.shade(g, 0.2));
  }

  function lamp(ctx, ox, oy, x, y, lit) {
    Iso.box(ctx, ox, oy, x, y, 0, 0.16, 0.16, 1.6, '#4A555E');
    Iso.box(ctx, ox, oy, x - 0.12, y - 0.12, 1.6, 0.4, 0.4, 0.25, lit ? C.gold : '#6C7880');
  }

  function gulls(ctx, w, t, n, y0) {
    for (let i = 0; i < n; i++) {
      const ph = t * 0.5 + i * 2.1;
      const x = ((ph * 9) % (w + 24)) - 12;
      const y = y0 + Math.sin(ph * 1.6) * 3 + i * 6;
      const art = (Math.sin(t * 4.5 + i) > 0) ? Sprites.MARTI : Sprites.MARTI2;
      Sprites.draw(ctx, art, x, y, { scale: 1 });
    }
  }

  /* Karakterlerin ufak nefesi: her yarım saniyede bir piksel oynuyor */
  function bob(t, off) { return Math.round(Math.sin(t * 1.8 + (off || 0)) * 0.5 - 0.5); }

  /* ---------- sahneler ---------- */

  const list = {

    /* açılış: denizin üstünde bir şamandıra ve bekleyen fok.
       Arka planda zaten deniz var, buraya ikinci bir su karosu koymak
       yamalı gösteriyordu — sadece figürleri bırakıyorum. */
    intro(ctx, w, h, t) {
      const ox = w / 2, oy = 18;
      const dalga = Math.round(Math.sin(t * 1.1) * 1.2);

      // şamandıra
      const b = Iso.project(4.6, 1.4, 0);
      Iso.box(ctx, ox, oy + dalga, 4.6, 1.4, 0, 0.55, 0.55, 1.5, C.seaRed);
      Iso.box(ctx, ox, oy + dalga, 4.52, 1.32, 1.5, 0.72, 0.72, 0.25, '#2E3840');
      Iso.rect(ctx, ox + b[0] + 1, oy + dalga + b[1] + 3, 8, 1, 'rgba(191,224,230,0.5)');

      // fok: sadece sırtı ve kafası suyun üstünde
      const p = Iso.project(2.0, 2.8, 0);
      const fy = oy + p[1] - 9 + Math.round(Math.sin(t * 1.5) * 1.2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, fy + 8);
      ctx.clip();
      Sprites.draw(ctx, Sprites.FOK, ox + p[0], fy, { scale: 1 });
      ctx.restore();
      // suya değdiği yerde halka
      Iso.rect(ctx, ox + p[0] - 2, fy + 8, 17, 1, 'rgba(191,224,230,0.45)');

      gulls(ctx, w, t, 2, 2);
    },

    /* 01 — Kadıköy: turnikeler, M4 tabelası, aşağı inen merdiven */
    kadikoy(ctx, w, h, t) {
      const ox = w / 2, oy = 34;
      plinth(ctx, ox, oy, 6, 6, C.stone, Iso.shade(C.stone, -0.3));
      // zemin çizgisi: yönlendirme şeridi
      Iso.tile(ctx, ox, oy, 0.4, 3.5, 0.02, 5.2, 0.18, C.gold);

      // turnike sırası
      for (let i = 0; i < 3; i++) {
        const y = 0.8 + i * 1.5;
        Iso.box(ctx, ox, oy, 1.4, y, 0, 0.9, 0.75, 1.05, '#5D6970');
        Iso.box(ctx, ox, oy, 1.4, y, 1.05, 0.9, 0.75, 0.12, '#8894 9C'.replace(' ', ''));
        // kanatlar
        Iso.box(ctx, ox, oy, 2.3, y + 0.18, 0.55, 0.75, 0.1, 0.35, C.seaRed);
      }

      // M4 direği ve levhası
      Iso.box(ctx, ox, oy, 4.7, 0.7, 0, 0.2, 0.2, 3.0, '#3C4750');
      const lp = Iso.project(4.8, 0.8, 3.0);
      Sprites.draw(ctx, Sprites.M4, ox + lp[0] - 4, oy + lp[1] - 9, { scale: 1 });

      // iskeleye inen merdiven
      for (let i = 0; i < 3; i++) {
        Iso.box(ctx, ox, oy, 0.3, 4.5 + i * 0.5, -0.4 * i, 3.4, 0.5, 0.3, C.stone);
      }

      // fok bekliyor
      const p = Iso.project(3.2, 4.0, 0);
      Sprites.shadow(ctx, ox + p[0] + 6, oy + p[1] + 1, 7, 2);
      Sprites.draw(ctx, Sprites.FOK, ox + p[0], oy + p[1] - 10 + bob(t), { scale: 1 });
      gulls(ctx, w, t, 1, 6);
    },

    /* 02 — Vapur: gövde, kırmızı baca, güvertede ikisi */
    vapur(ctx, w, h, t) {
      const ox = w / 2 - 6, oy = 36;
      water(ctx, ox, oy, 8, 6, t);
      const sway = Math.round(Math.sin(t * 0.9) * 1.2);
      const oyy = oy + sway;

      // gövde
      Iso.box(ctx, ox, oyy, 0.8, 1.4, 0, 5.4, 2.6, 1.1, '#2B3A44');
      Iso.box(ctx, ox, oyy, 0.8, 1.4, 1.1, 5.4, 2.6, 0.9, C.hull);
      // güverte
      Iso.tile(ctx, ox, oyy, 0.8, 1.4, 2.0, 5.4, 2.6, C.deck);
      // üst kat
      Iso.box(ctx, ox, oyy, 1.5, 1.75, 2.0, 3.6, 1.9, 1.2, C.hull);
      Iso.tile(ctx, ox, oyy, 1.5, 1.75, 3.2, 3.6, 1.9, '#D9CDB6');
      // pencereler
      for (let i = 0; i < 5; i++) {
        faceY(ctx, ox, oyy, 3.65, 1.75 + i * 0.66, 2.35, 2.15 + i * 0.66, 2.9, '#2D4E5F');
      }
      // baca — kırmızı, siyah bantlı
      Iso.box(ctx, ox, oyy, 2.9, 2.35, 3.2, 0.72, 0.72, 1.5, C.seaRed);
      Iso.box(ctx, ox, oyy, 2.86, 2.31, 4.5, 0.8, 0.8, 0.3, '#22282C');
      // bayrak direği
      Iso.box(ctx, ox, oyy, 5.9, 2.5, 1.9, 0.14, 0.14, 1.6, '#4A555E');
      Iso.box(ctx, ox, oyy, 5.6, 2.5, 3.1, 0.5, 0.06, 0.35, C.seaRed);

      // güvertede fok + rakun
      const a = Iso.project(1.9, 3.75, 2.0), b = Iso.project(3.2, 3.8, 2.0);
      Sprites.draw(ctx, Sprites.FOK,   ox + a[0] - 5, oyy + a[1] - 10 + bob(t),      { scale: 1 });
      Sprites.draw(ctx, Sprites.RAKUN, ox + b[0] - 5, oyy + b[1] - 13 + bob(t, 1.4), { scale: 1 });

      gulls(ctx, w, t, 3, 2);
    },

    /* 03 — Beşiktaş: iskele, sahil binaları, yokuş */
    besiktas(ctx, w, h, t) {
      const ox = w / 2 - 3, oy = 34;
      water(ctx, ox, oy, 7, 6, t);
      // iskele platformu
      plinth(ctx, ox, oy, 4.6, 6, C.stone, Iso.shade(C.stone, -0.32), 1.2);
      // iskele babaları
      for (let i = 0; i < 3; i++) Iso.box(ctx, ox, oy, 4.7, 0.7 + i * 2, -0.2, 0.36, 0.36, 0.8, C.seaRust);

      // arkada binalar, farklı yükseklik ve tonda
      const blds = [
        [0.2, 0.2, 1.5, 1.4, 3.4, C.stone],
        [1.9, 0.1, 1.3, 1.2, 4.6, '#D6C7AC'],
        [0.4, 1.9, 1.2, 1.3, 2.7, '#BFAF94'],
        [3.3, 0.4, 1.1, 1.1, 3.9, C.pink],
      ];
      for (const [x, y, bw, bd, bh, col] of blds) {
        Iso.box(ctx, ox, oy, x, y, 0, bw, bd, bh, col);
        for (let r = 0; r < Math.floor(bh / 1.1); r++) {
          faceY(ctx, ox, oy, y + bd, x + 0.25, 0.5 + r * 1.05, x + bw - 0.25, 1.0 + r * 1.05, '#3D5665');
        }
      }
      // yokuş: yukarı çıkan yol
      Iso.tile(ctx, ox, oy, 1.5, 3.3, 0.03, 0.9, 2.6, Iso.shade(C.stone, -0.14));

      const p = Iso.project(2.8, 3.6, 0);
      Sprites.shadow(ctx, ox + p[0] + 6, oy + p[1] + 1, 7, 2);
      Sprites.draw(ctx, Sprites.RAKUN, ox + p[0], oy + p[1] - 13 + bob(t), { scale: 1 });
      gulls(ctx, w, t, 2, 3);
    },

    /* 05 — Yıldız Parkı: eğimli yeşil, patika, ağaçtaki rakun */
    yildiz(ctx, w, h, t) {
      const ox = w / 2, oy = 32;
      // eğim: üç kademe
      Iso.box(ctx, ox, oy, 0, 0, -1.6, 6, 6, 1.6, Iso.shade(C.green, -0.42), { top: C.green });
      Iso.box(ctx, ox, oy, 0.4, 0.4, 0, 4.2, 4.2, 0.7, Iso.shade(C.green, -0.3), { top: Iso.shade(C.green, 0.12) });
      Iso.box(ctx, ox, oy, 1.1, 1.1, 0.7, 2.6, 2.6, 0.6, Iso.shade(C.green, -0.22), { top: Iso.shade(C.green, 0.22) });
      // patika
      Iso.tile(ctx, ox, oy, 4.8, 0.6, 0.03, 0.7, 5.0, '#C0AE8C');
      Iso.tile(ctx, ox, oy, 1.6, 5.0, 0.03, 3.4, 0.6, '#C0AE8C');

      tree(ctx, ox, oy, 1.3, 1.3, 1.15, '#4E7343');
      tree(ctx, ox, oy, 2.6, 2.4, 0.95, C.green);
      tree(ctx, ox, oy, 0.3, 3.4, 1.0, '#557A47');
      tree(ctx, ox, oy, 3.6, 0.5, 0.85, '#66894F');

      const p = Iso.project(2.0, 5.2, 0);
      Sprites.shadow(ctx, ox + p[0] + 6, oy + p[1] + 1, 7, 2);
      Sprites.draw(ctx, Sprites.RAKUN, ox + p[0], oy + p[1] - 13 + bob(t), { scale: 1 });
      const q = Iso.project(4.7, 2.4, 0);
      Sprites.shadow(ctx, ox + q[0] + 4, oy + q[1] + 1, 6, 2);
      Sprites.draw(ctx, Sprites.FOK, ox + q[0] - 2, oy + q[1] - 10 + bob(t, 2.2), { scale: 1 });
    },

    /* 06 — Sürpriz: kaideye konmuş kapalı kutu */
    surpriz(ctx, w, h, t) {
      const ox = w / 2, oy = 38;
      plinth(ctx, ox, oy, 5, 5, Iso.shade(C.seaBlue, 0.16), Iso.shade(C.seaBlue, -0.28), 1.4);
      // kaide
      Iso.box(ctx, ox, oy, 1.6, 1.6, 0, 1.8, 1.8, 1.0, Iso.shade(C.seaBlue, 0.05));
      // havada duran kutu
      const lift = Math.round(Math.sin(t * 1.4) * 1.5);
      const p = Iso.project(2.5, 2.5, 1.0);
      Sprites.shadow(ctx, ox + p[0], oy + p[1] + 2, 9 - Math.abs(lift), 2, 'rgba(10,30,45,0.28)');
      Sprites.draw(ctx, Sprites.KUTU, ox + p[0] - 4, oy + p[1] - 16 + lift, { scale: 1 });
      // kıvılcımlar
      for (let i = 0; i < 4; i++) {
        const a = t * 1.1 + i * 1.57;
        const rx = Math.round(Math.cos(a) * 15), ry = Math.round(Math.sin(a * 1.3) * 7);
        Iso.rect(ctx, ox + p[0] - 1 + rx, oy + p[1] - 14 + ry, 1, 1, i % 2 ? C.gold : C.pink);
      }
    },

    /* 07 — Çırağan: sarı taş cephe, sahil, koşu yolu */
    ciragan(ctx, w, h, t) {
      const ox = w / 2 - 6, oy = 36;
      water(ctx, ox, oy, 8, 6, t, '#245C77');
      // rıhtım
      plinth(ctx, ox, oy, 6, 4.2, '#CDBEA0', '#9E8C70', 1.3);
      // koşu yolu
      Iso.tile(ctx, ox, oy, 0.2, 3.1, 0.03, 5.6, 0.9, '#B08A63');
      Iso.tile(ctx, ox, oy, 0.2, 3.52, 0.05, 5.6, 0.08, '#E6D7B6');
      // saray cephesi
      Iso.box(ctx, ox, oy, 0.3, 0.3, 0, 5.2, 2.2, 2.6, C.gold, { top: Iso.shade(C.gold, 0.26) });
      // sütunlar ve pencereler
      for (let i = 0; i < 7; i++) {
        const x = 0.55 + i * 0.72;
        faceY(ctx, ox, oy, 2.5, x, 0.55, x + 0.34, 1.75, '#7E5F2C');
        Iso.box(ctx, ox, oy, x + 0.36, 2.4, 0, 0.16, 0.16, 2.1, Iso.shade(C.gold, 0.3));
      }
      // saçak
      Iso.box(ctx, ox, oy, 0.15, 0.15, 2.6, 5.5, 2.5, 0.32, '#EFD79A');

      lamp(ctx, ox, oy, 0.35, 3.85, false);
      lamp(ctx, ox, oy, 5.5, 3.15, false);

      const a = Iso.project(1.0, 3.4, 0), b = Iso.project(4.0, 3.35, 0);
      Sprites.draw(ctx, Sprites.FOK,   ox + a[0] - 4, oy + a[1] - 10 + bob(t),      { scale: 1 });
      Sprites.draw(ctx, Sprites.RAKUN, ox + b[0] - 4, oy + b[1] - 13 + bob(t, 1.1), { scale: 1 });
      gulls(ctx, w, t, 2, 2);
    },

    /* 08 — Dönüş: aynı vapur, ışıkları yanmış, ay çıkmış */
    donus(ctx, w, h, t) {
      const ox = w / 2 - 6, oy = 36;
      water(ctx, ox, oy, 8, 6, t, '#16354A');
      const sway = Math.round(Math.sin(t * 0.8) * 1.2);
      const oyy = oy + sway;

      Iso.box(ctx, ox, oyy, 0.8, 1.4, 0, 5.4, 2.6, 1.1, '#1D2830');
      Iso.box(ctx, ox, oyy, 0.8, 1.4, 1.1, 5.4, 2.6, 0.9, '#C9C1B2');
      Iso.tile(ctx, ox, oyy, 0.8, 1.4, 2.0, 5.4, 2.6, '#7E6647');
      Iso.box(ctx, ox, oyy, 1.5, 1.75, 2.0, 3.6, 1.9, 1.2, '#C9C1B2');
      Iso.tile(ctx, ox, oyy, 1.5, 1.75, 3.2, 3.6, 1.9, '#B3A78F');
      for (let i = 0; i < 5; i++) {
        const on = (i + Math.floor(t * 0.7)) % 4 !== 0;
        faceY(ctx, ox, oyy, 3.65, 1.75 + i * 0.66, 2.35, 2.15 + i * 0.66, 2.9, on ? C.gold : '#2D4E5F');
      }
      Iso.box(ctx, ox, oyy, 2.9, 2.35, 3.2, 0.72, 0.72, 1.5, Iso.shade(C.seaRed, -0.18));
      Iso.box(ctx, ox, oyy, 2.86, 2.31, 4.5, 0.8, 0.8, 0.3, '#191E22');

      // suya vuran ışık
      for (let i = 0; i < 5; i++) {
        const p = Iso.project(2.4 + i * 0.5, 4.6 + (i % 2) * 0.5, 0);
        Iso.rect(ctx, ox + p[0], oy + p[1], 3 + (i % 2), 1, 'rgba(223,174,62,0.42)');
      }

      const a = Iso.project(1.9, 3.75, 2.0), b = Iso.project(3.1, 3.8, 2.0);
      Sprites.draw(ctx, Sprites.FOK,   ox + a[0] - 5, oyy + a[1] - 10 + bob(t),      { scale: 1 });
      Sprites.draw(ctx, Sprites.RAKUN, ox + b[0] - 5, oyy + b[1] - 13 + bob(t, 0.7), { scale: 1 });
    },
  };

  function draw(name, ctx, w, h, t) {
    const fn = list[name];
    ctx.clearRect(0, 0, w, h);
    if (fn) fn(ctx, w, h, t);
  }

  return { draw, list, C };
})();
