/* scenes.js — sekiz izometrik diorama.
 *
 * Her sahne 124x84'lük minik bir tuvale çizilir. Kural: her renk
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

  /* Bir figürü ızgara noktasına oturt: yatayda ortalar, ayakları
     noktanın hizasına gelir. Her sahnede elle kaydırmaktan kurtardı. */
  function figure(ctx, art, ox, oy, x, y, z, dy, golge) {
    const p = Iso.project(x, y, z);
    const w = Sprites.width(art), h = Sprites.height(art);
    /* Yere basan yassı gölge. Bunsuz figürler sahnenin üstüne
       yapıştırılmış çıkartma gibi duruyordu. */
    if (golge !== false) {
      Sprites.shadow(ctx, ox + p[0], oy + p[1] + 1, Math.round(w * 0.42), 3, 'rgba(12,32,46,0.22)');
    }
    Sprites.draw(ctx, art, ox + p[0] - Math.floor(w / 2), oy + p[1] - h + 3 + (dy || 0));
  }

  /* Su: koyu taban + üstünde kayan açık şeritler. */
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

  /* Karakterlerin ufak nefesi: yarım saniyede bir piksel oynuyor */
  function bob(t, off) { return Math.round(Math.sin(t * 1.8 + (off || 0)) * 0.5 - 0.5); }

  /* ---------- sahneler ---------- */

  const list = {

    /* açılış: denizin üstünde bir şamandıra ve bekleyen fok.
       Arka planda zaten deniz var, buraya ikinci bir su karosu
       koymak yamalı gösteriyordu. */
    intro(ctx, w, h, t) {
      const ox = w / 2, oy = 33;
      const dalga = Math.round(Math.sin(t * 1.1) * 1.2);

      const b = Iso.project(4.6, 1.4, 0);
      Iso.box(ctx, ox, oy + dalga, 4.6, 1.4, 0, 0.55, 0.55, 1.5, C.seaRed);
      Iso.box(ctx, ox, oy + dalga, 4.52, 1.32, 1.5, 0.72, 0.72, 0.25, '#2E3840');
      Iso.rect(ctx, ox + b[0] + 1, oy + dalga + b[1] + 3, 8, 1, 'rgba(191,224,230,0.5)');

      // fok: sadece sırtı ve kafası suyun üstünde
      const p = Iso.project(2.0, 2.8, 0);
      const fh = Sprites.height(Sprites.FOK);
      const fy = oy + p[1] - fh + 9 + Math.round(Math.sin(t * 1.5) * 1.4);
      const fx = ox + p[0] - Math.floor(Sprites.width(Sprites.FOK) / 2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, fy + fh - 5);
      ctx.clip();
      Sprites.draw(ctx, Sprites.FOK, fx, fy, { scale: 1 });
      ctx.restore();
      Iso.rect(ctx, fx - 3, fy + fh - 5, 34, 1, 'rgba(191,224,230,0.45)');

      gulls(ctx, w, t, 2, 2);
    },

    /* 01 — Kadıköy: turnikeler, metro levhası, iskeleye inen merdiven.
       Merdiven önce havada asılı kalıyordu; artık peronun ön kenarından
       başlayıp basamak basamak aşağı iniyor. */
    kadikoy(ctx, w, h, t) {
      const ox = w / 2, oy = 53;
      plinth(ctx, ox, oy, 6, 4.6, C.stone, Iso.shade(C.stone, -0.3));

      // yönlendirme şeridi
      Iso.tile(ctx, ox, oy, 0.4, 4.05, 0.02, 5.2, 0.18, C.gold);

      // turnike sırası
      for (let i = 0; i < 3; i++) {
        const y = 0.6 + i * 1.35;
        Iso.box(ctx, ox, oy, 1.2, y, 0, 0.9, 0.7, 1.05, '#5D6970');
        Iso.box(ctx, ox, oy, 1.2, y, 1.05, 0.9, 0.7, 0.12, '#88949C');
        Iso.box(ctx, ox, oy, 2.1, y + 0.16, 0.55, 0.7, 0.1, 0.35, C.seaRed);
      }

      // metro direği ve levhası
      Iso.box(ctx, ox, oy, 5.0, 0.7, 0, 0.16, 0.16, 2.2, '#3C4750');
      const lp = Iso.project(5.08, 0.78, 2.2);
      Sprites.draw(ctx, Sprites.METRO,
        ox + lp[0] - Math.floor(Sprites.width(Sprites.METRO) / 2),
        oy + lp[1] - Sprites.height(Sprites.METRO) + 1, { scale: 1 });

      // iskeleye inen basamaklar: her biri peronun altına kadar iniyor
      const bas = [[4.6, 1.30, 0.5], [5.1, 1.00, 0.5], [5.6, 0.70, 0.5]];
      for (const [y, yuk, d] of bas) {
        Iso.box(ctx, ox, oy, 0.7, y, -1.6, 4.2, d, yuk, Iso.shade(C.stone, -0.16),
                { top: Iso.shade(C.stone, 0.1) });
      }

      figure(ctx, Sprites.FOK, ox, oy, 4.2, 3.3, 0, bob(t));
      gulls(ctx, w, t, 1, 4);
    },

    /* 02 — Vapur: gövde, kırmızı baca, ön güvertede ikisi.
       Figürler büyüyünce ilk tekne oyuncak gibi kaldı, gövdeyi ve
       kabini büyüttüm. */
    vapur(ctx, w, h, t) {
      const ox = w / 2 - 15, oy = 60;
      water(ctx, ox, oy, 9, 6, t);
      const oyy = oy + Math.round(Math.sin(t * 0.9) * 1.6);

      Iso.box(ctx, ox, oyy, 0.8, 1.4, 0, 7.2, 3.2, 1.1, '#2B3A44');
      Iso.box(ctx, ox, oyy, 0.8, 1.4, 1.1, 7.2, 3.2, 0.9, C.hull);
      Iso.tile(ctx, ox, oyy, 0.8, 1.4, 2.0, 7.2, 3.2, C.deck);
      Iso.box(ctx, ox, oyy, 1.8, 1.7, 2.0, 4.8, 2.0, 1.2, C.hull);
      Iso.tile(ctx, ox, oyy, 1.8, 1.7, 3.2, 4.8, 2.0, '#D9CDB6');
      for (let i = 0; i < 6; i++) {
        faceY(ctx, ox, oyy, 3.7, 2.1 + i * 0.72, 2.32, 2.62 + i * 0.72, 2.94, '#2D4E5F');
      }
      Iso.box(ctx, ox, oyy, 3.75, 2.3, 3.2, 0.9, 0.9, 1.4, C.seaRed);
      Iso.box(ctx, ox, oyy, 3.70, 2.25, 4.5, 1.0, 1.0, 0.28, '#22282C');
      Iso.box(ctx, ox, oyy, 7.7, 3.0, 1.9, 0.16, 0.16, 1.7, '#4A555E');
      Iso.box(ctx, ox, oyy, 7.3, 3.0, 3.2, 0.6, 0.07, 0.4, C.seaRed);

      figure(ctx, Sprites.FOK,   ox, oyy, 2.5, 4.3, 2.0, bob(t));
      figure(ctx, Sprites.RAKUN, ox, oyy, 5.9, 4.1, 2.0, bob(t, 1.4));

      gulls(ctx, w, t, 3, 4);
    },

    /* 03 — Beşiktaş: iskele, sahil binaları, ikisi de burada */
    besiktas(ctx, w, h, t) {
      const ox = w / 2 - 5, oy = 53;
      water(ctx, ox, oy, 7, 6, t);
      plinth(ctx, ox, oy, 4.6, 6, C.stone, Iso.shade(C.stone, -0.32), 1.2);
      for (let i = 0; i < 3; i++) Iso.box(ctx, ox, oy, 4.7, 0.7 + i * 2, -0.2, 0.36, 0.36, 0.8, C.seaRust);

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
      Iso.tile(ctx, ox, oy, 1.5, 3.3, 0.03, 0.9, 2.6, Iso.shade(C.stone, -0.14));

      figure(ctx, Sprites.RAKUN, ox, oy, 1.5, 4.5, 0, bob(t));
      figure(ctx, Sprites.FOK,   ox, oy, 4.0, 3.2, 0, bob(t, 1.2));
      gulls(ctx, w, t, 2, 3);
    },

    /* 05 — Yıldız Parkı: kademeli yeşil, patika, ağaçlar */
    yildiz(ctx, w, h, t) {
      const ox = w / 2, oy = 53;
      Iso.box(ctx, ox, oy, 0, 0, -1.6, 6, 6, 1.6, Iso.shade(C.green, -0.42), { top: C.green });
      Iso.box(ctx, ox, oy, 0.4, 0.4, 0, 4.2, 4.2, 0.7, Iso.shade(C.green, -0.3), { top: Iso.shade(C.green, 0.12) });
      Iso.box(ctx, ox, oy, 1.1, 1.1, 0.7, 2.6, 2.6, 0.6, Iso.shade(C.green, -0.22), { top: Iso.shade(C.green, 0.22) });
      Iso.tile(ctx, ox, oy, 4.8, 0.6, 0.03, 0.7, 5.0, '#C0AE8C');
      Iso.tile(ctx, ox, oy, 1.6, 5.0, 0.03, 3.4, 0.6, '#C0AE8C');

      tree(ctx, ox, oy, 1.3, 1.3, 1.15, '#4E7343');
      tree(ctx, ox, oy, 2.6, 2.4, 0.95, C.green);
      tree(ctx, ox, oy, 0.3, 3.4, 1.0, '#557A47');
      tree(ctx, ox, oy, 3.6, 0.5, 0.85, '#66894F');

      figure(ctx, Sprites.RAKUN, ox, oy, 2.0, 5.2, 0, bob(t));
      figure(ctx, Sprites.FOK,   ox, oy, 5.1, 2.6, 0, bob(t, 2.2));
    },

    /* 06 — Sürpriz: kaidenin üstünde havada duran hediye.
       İlk hâli piksel bir çıkartmaydı, hediye kutusuna benzemiyordu:
       artık kapağı taşan, dört yanından kurdele geçen, fiyonklu bir
       kutu — hepsi izometrik. */
    surpriz(ctx, w, h, t) {
      const ox = w / 2, oy = 57;
      plinth(ctx, ox, oy, 5, 5, Iso.shade(C.seaBlue, 0.16), Iso.shade(C.seaBlue, -0.28), 1.4);
      Iso.box(ctx, ox, oy, 1.4, 1.4, 0, 2.2, 2.2, 0.85, Iso.shade(C.seaBlue, 0.04));

      const lift = Math.round(Math.sin(t * 1.4) * 2);
      const yoy = oy - 5 + lift;
      const g = Iso.project(2.5, 2.5, 0.85);
      Sprites.shadow(ctx, ox + g[0], oy + g[1] - 1, 12 - Math.abs(lift), 3, 'rgba(8,26,40,0.32)');

      const x0 = 1.35, y0 = 1.35, s = 2.3, z0 = 0.9, hh = 1.6;
      const kur = C.gold, kurK = Iso.shade(C.gold, -0.22);

      // gövde
      Iso.box(ctx, ox, yoy, x0, y0, z0, s, s, hh, C.seaRed);
      // kurdele: iki görünen yüzden de geçiyor
      faceY(ctx, ox, yoy, y0 + s, x0 + s / 2 - 0.22, z0, x0 + s / 2 + 0.22, z0 + hh, kur);
      faceX(ctx, ox, yoy, x0 + s, y0 + s / 2 - 0.22, z0, y0 + s / 2 + 0.22, z0 + hh, kurK);

      // kapak: gövdeden taşıyor
      const kx = x0 - 0.22, ks = s + 0.44, kz = z0 + hh;
      Iso.box(ctx, ox, yoy, kx, y0 - 0.2, kz, ks, ks, 0.42, Iso.shade(C.seaRed, 0.14));
      faceY(ctx, ox, yoy, y0 - 0.2 + ks, kx + ks / 2 - 0.22, kz, kx + ks / 2 + 0.22, kz + 0.42, kur);
      faceX(ctx, ox, yoy, kx + ks, y0 - 0.2 + ks / 2 - 0.22, kz, y0 - 0.2 + ks / 2 + 0.22, kz + 0.42, kurK);
      // kapağın üstündeki kurdele haçı
      const kt = kz + 0.42;
      Iso.tile(ctx, ox, yoy, 2.33, y0 - 0.2, kt, 0.34, ks, kur);
      Iso.tile(ctx, ox, yoy, kx, 2.33, kt, ks, 0.34, Iso.shade(kur, 0.1));

      /* Fiyonk: dört ilmek ortada birleşince altın bir yumak gibi
         duruyordu; ilmekleri inceltip aralarına kırmızıyı geri
         soktum, düğümü de açtım ki ayrışsın. */
      Iso.box(ctx, ox, yoy, 1.82, 2.36, kt, 0.5, 0.28, 0.2, kur);
      Iso.box(ctx, ox, yoy, 2.86, 2.36, kt, 0.5, 0.28, 0.2, kur);
      Iso.box(ctx, ox, yoy, 2.36, 1.82, kt, 0.28, 0.5, 0.2, Iso.shade(kur, -0.14));
      Iso.box(ctx, ox, yoy, 2.36, 2.86, kt, 0.28, 0.5, 0.2, Iso.shade(kur, -0.14));
      Iso.box(ctx, ox, yoy, 2.34, 2.34, kt, 0.34, 0.34, 0.3, Iso.shade(kur, 0.34));

      // etrafında dolanan kıvılcımlar
      const c0 = Iso.project(2.5, 2.5, 2.6);
      for (let i = 0; i < 6; i++) {
        const a = t * 1.3 + i * 1.05;
        const rx = Math.round(Math.cos(a) * (15 + i));
        const ry = Math.round(Math.sin(a * 1.4) * 6 - i);
        Iso.rect(ctx, ox + c0[0] + rx, yoy + c0[1] + ry, 2, 1, i % 2 ? C.gold : C.pink);
      }
    },

    /* 07 — Çırağan: sarı taş cephe, rıhtım, koşu yolu */
    ciragan(ctx, w, h, t) {
      const ox = w / 2 - 10, oy = 57;
      water(ctx, ox, oy, 8, 6, t, '#245C77');
      plinth(ctx, ox, oy, 6, 4.2, '#CDBEA0', '#9E8C70', 1.3);
      Iso.tile(ctx, ox, oy, 0.2, 3.1, 0.03, 5.6, 0.9, '#B08A63');
      Iso.tile(ctx, ox, oy, 0.2, 3.52, 0.05, 5.6, 0.08, '#E6D7B6');

      Iso.box(ctx, ox, oy, 0.3, 0.3, 0, 5.2, 2.2, 2.6, C.gold, { top: Iso.shade(C.gold, 0.26) });
      for (let i = 0; i < 7; i++) {
        const x = 0.55 + i * 0.72;
        faceY(ctx, ox, oy, 2.5, x, 0.55, x + 0.34, 1.75, '#7E5F2C');
        Iso.box(ctx, ox, oy, x + 0.36, 2.4, 0, 0.16, 0.16, 2.1, Iso.shade(C.gold, 0.3));
      }
      Iso.box(ctx, ox, oy, 0.15, 0.15, 2.6, 5.5, 2.5, 0.32, '#EFD79A');

      lamp(ctx, ox, oy, 0.3, 3.9, false);
      lamp(ctx, ox, oy, 5.6, 3.1, false);

      figure(ctx, Sprites.FOK,   ox, oy, 0.9, 3.6, 0, bob(t));
      figure(ctx, Sprites.RAKUN, ox, oy, 4.2, 3.2, 0, bob(t, 1.1));
      gulls(ctx, w, t, 2, 2);
    },

    /* 08 — Dönüş: aynı vapur, ışıkları yanmış, su altın */
    donus(ctx, w, h, t) {
      const ox = w / 2 - 15, oy = 60;
      water(ctx, ox, oy, 9, 6, t, '#16354A');
      const oyy = oy + Math.round(Math.sin(t * 0.8) * 1.6);

      Iso.box(ctx, ox, oyy, 0.8, 1.4, 0, 7.2, 3.2, 1.1, '#1D2830');
      Iso.box(ctx, ox, oyy, 0.8, 1.4, 1.1, 7.2, 3.2, 0.9, '#C9C1B2');
      Iso.tile(ctx, ox, oyy, 0.8, 1.4, 2.0, 7.2, 3.2, '#7E6647');
      Iso.box(ctx, ox, oyy, 1.8, 1.7, 2.0, 4.8, 2.0, 1.2, '#C9C1B2');
      Iso.tile(ctx, ox, oyy, 1.8, 1.7, 3.2, 4.8, 2.0, '#B3A78F');
      for (let i = 0; i < 6; i++) {
        const on = (i + Math.floor(t * 0.7)) % 5 !== 0;
        faceY(ctx, ox, oyy, 3.7, 2.1 + i * 0.72, 2.32, 2.62 + i * 0.72, 2.94, on ? C.gold : '#2D4E5F');
      }
      Iso.box(ctx, ox, oyy, 3.75, 2.3, 3.2, 0.9, 0.9, 1.4, Iso.shade(C.seaRed, -0.18));
      Iso.box(ctx, ox, oyy, 3.70, 2.25, 4.5, 1.0, 1.0, 0.28, '#191E22');

      for (let i = 0; i < 6; i++) {
        const p = Iso.project(2.6 + i * 0.6, 5.2 + (i % 2) * 0.5, 0);
        Iso.rect(ctx, ox + p[0], oy + p[1], 5 + (i % 2) * 2, 1, 'rgba(223,174,62,0.42)');
      }

      figure(ctx, Sprites.FOK,   ox, oyy, 2.5, 4.3, 2.0, bob(t));
      figure(ctx, Sprites.RAKUN, ox, oyy, 5.9, 4.1, 2.0, bob(t, 0.7));
    },
  };

  function draw(name, ctx, w, h, t) {
    const fn = list[name];
    ctx.clearRect(0, 0, w, h);
    if (fn) fn(ctx, w, h, t);
  }

  return { draw, list, C };
})();
