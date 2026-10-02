/**
 * Mini oyunlar — her biri kendi dünyası olan bağımsız birer oyun.
 * Soul: "Half Note Kulübü" — düşen ruh-notaları halkaya geldiğinde yakalanan ritim oyunu.
 * Nightmare: "Noel gecesi uçuşu" — hediye toplayıp havai fişek ve yarasalardan kaçılan uçuş oyunu.
 */

function setupCanvas(cv) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = innerWidth;
  const H = innerHeight;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  const c = cv.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, W, H, dpr };
}

function offscreen(W, H, dpr) {
  const o = document.createElement("canvas");
  o.width = Math.round(W * dpr);
  o.height = Math.round(H * dpr);
  const c = o.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { o, c };
}

/** Kartı gösterir, düğmeye basılınca gizler. */
async function cardPrompt(card, btn, { kicker, title, text, goal, button } = {}) {
  if (kicker != null) $(".kicker", card).textContent = kicker;
  if (title != null) $(".g-title", card).innerHTML = title;
  if (text != null) $(".g-text", card).textContent = text;
  if (goal != null) $(".g-goal", card).textContent = goal;
  if (button != null) btn.textContent = button;
  card.hidden = false;
  await anim(card, [{ opacity: 0, transform: "translateY(24px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 600, easing: "cubic-bezier(.2,1.2,.4,1)" });
  await once(btn, "click");
  Sound.sfx.pop();
  await anim(card, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-16px) scale(.96)" }], { duration: 350 });
  card.hidden = true;
}

function toast(el, text, ms = 1600) {
  el.textContent = text;
  el.getAnimations().forEach((a) => a.cancel());
  el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none", offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: ms, fill: "forwards" });
}

/* =========================================================
   SOUL — Half Note Kulübü
   ========================================================= */
const SoulGame = {
  run() {
    return new Promise(async (resolve) => {
      const scene = $("#s-gsoul");
      const cv = $("#soulCv");
      const card = $("#soulCard");
      const hud = $("#soulHud");
      let { c, W, H, dpr } = setupCanvas(cv);
      const safeB = 20;

      // sahne geometrisi
      const laneW = Math.min(W * 0.9, 440) / 4;
      const left = (W - laneW * 4) / 2;
      const spawnY = H * 0.3;
      const hitY = H * 0.72;
      const keyTop = hitY + laneW * 0.42;
      const TRAVEL = 1.55; // saniye: ruh tepeden halkaya
      const laneX = (l) => left + laneW * (l + 0.5);

      const bg = clubBackground(W, H, dpr, { left, laneW, hitY });

      // nota dizisi: 123 BPM, üç bölüm, giderek yoğunlaşır
      const B = 60 / 123;
      const chart = [];
      const add = (beat, ...lanes) => lanes.forEach((l) => chart.push({ t: beat * B, lane: l, dbl: lanes.length > 1, done: false, hit: false }));
      [0, 1, 2, 3, 3, 2, 1, 0].forEach((l, i) => add(4 + i, l));
      const p2 = [[12, 0], [13, 2], [13.5, 3], [14, 1], [15, 2], [16, 0], [17, 3], [17.5, 2], [18, 1], [19, 0], [20, 2], [21, 1], [21.5, 0], [22, 3], [23, 2], [24, 1], [25, 3], [25.5, 1], [26, 2], [27, 0]];
      p2.forEach(([b, l]) => add(b, l));
      add(29, 0, 3); add(30, 1); add(31, 1, 2); add(32, 3); add(33, 0); add(33.5, 1); add(34, 0, 2);
      add(35, 3); add(36, 1, 3); add(37, 2); add(37.5, 1); add(38, 0); add(39, 0, 3); add(40, 2); add(41, 1); add(41.5, 2); add(42, 1, 2);
      add(43, 0); add(43.5, 1); add(44, 2); add(44.5, 3); add(46, 0, 3);
      const END = 48 * B;
      const PASS = 0.7;

      const flash = [0, 0, 0, 0];
      const pops = [];
      let running = false;
      let t0 = 0;
      let combo = 0;
      let best = 0;
      let hits = 0;
      let judged = 0;
      let raf = 0;
      let countShown = -1;

      const now = () => performance.now() / 1000 - t0;

      function resetChart() {
        chart.forEach((n) => { n.done = false; n.hit = false; });
        combo = best = hits = judged = 0;
        countShown = -1;
        updateHud();
      }

      function updateHud() {
        $("#soulCombo").textContent = combo;
        const pct = chart.length ? Math.round((hits / chart.length) * 100) : 0;
        $("#soulPct").textContent = pct + "%";
        $("#soulMeter").style.width = Math.min(100, (hits / chart.length) * 100) + "%";
      }

      function judge(n, label, good) {
        n.done = true;
        judged++;
        pops.push({ x: laneX(n.lane), y: hitY - laneW * 0.55, text: label, t: 0, good });
      }

      function press(lane) {
        if (!running || lane < 0 || lane > 3) return;
        flash[lane] = 1;
        const t = now();
        let target = null;
        for (const n of chart) {
          if (n.done || n.lane !== lane) continue;
          const d = Math.abs(n.t - t);
          if (d < 0.17 && (!target || Math.abs(target.t - t) > d)) target = n;
          if (n.t - t > 0.17) break;
        }
        if (!target) {
          Sound.sfx.tick();
          return;
        }
        const d = Math.abs(target.t - t);
        target.hit = true;
        hits++;
        combo++;
        best = Math.max(best, combo);
        judge(target, d < 0.075 ? "harika" : "iyi", true);
        Sound.sfx.note(lane + (target.dbl ? 4 : 1));
        if (combo > 0 && combo % 10 === 0) Sound.sfx.shimmer();
        Sound.vibrate(8);
        FX.burst(laneX(lane), hitY, d < 0.075 ? 16 : 9, ["142,230,207", "183,176,255", "246,217,139"], d < 0.075 ? 3.4 : 2.4);
        updateHud();
      }

      const onDown = (e) => {
        if (!running) return;
        e.preventDefault();
        press(Math.floor((e.clientX - left) / laneW));
      };
      const onKey = (e) => {
        const map = { d: 0, f: 1, j: 2, k: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
        const l = map[e.key.toLowerCase()];
        if (l != null && !e.repeat) press(l);
      };
      cv.addEventListener("pointerdown", onDown);
      addEventListener("keydown", onKey);

      function drawSoul(x, y, r, dbl, wob) {
        const col = dbl ? "201,194,255" : "159,240,218";
        const g = c.createRadialGradient(x, y, 0, x, y, r * 2.4);
        g.addColorStop(0, `rgba(${col},.55)`);
        g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, r * 2.4, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = `rgb(${col})`;
        c.beginPath();
        c.ellipse(x, y, r * (1 + wob * 0.06), r * (1 - wob * 0.06), 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "rgba(255,255,255,.55)";
        c.beginPath();
        c.ellipse(x - r * 0.35, y - r * 0.4, r * 0.28, r * 0.18, -0.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#1d2a40";
        c.beginPath();
        c.ellipse(x - r * 0.3, y + r * 0.05, r * 0.1, r * 0.17, 0, 0, Math.PI * 2);
        c.ellipse(x + r * 0.3, y + r * 0.05, r * 0.1, r * 0.17, 0, 0, Math.PI * 2);
        c.fill();
      }

      function frame() {
        raf = requestAnimationFrame(frame);
        if (!scene.classList.contains("on")) return;
        const t = running ? now() : -10;
        const ms = performance.now();
        c.drawImage(bg, 0, 0, W, H);

        // neon tabela
        const flick = Math.random() < 0.03 ? 0.35 : 1;
        c.save();
        c.textAlign = "center";
        c.font = `700 ${Math.min(52, W * 0.13)}px Caveat, cursive`;
        c.shadowColor = "#ff5fa8";
        c.shadowBlur = 22 * flick;
        c.fillStyle = `rgba(255,140,190,${0.92 * flick})`;
        c.fillText("Half Note", W / 2, H * 0.17);
        c.font = `600 ${Math.min(12, W * 0.03)}px Figtree, sans-serif`;
        c.shadowColor = "#8EE6CF";
        c.shadowBlur = 10;
        c.fillStyle = "rgba(170,240,222,.9)";
        c.fillText("C A Z   K U L Ü B Ü", W / 2, H * 0.17 + 22);
        c.restore();

        // spot ışığı şarkının vuruşuyla nefes alır
        const beat = FX.beat || 0;
        c.save();
        c.globalCompositeOperation = "lighter";
        const sg = c.createRadialGradient(W / 2, hitY, 10, W / 2, hitY, laneW * 3.2);
        sg.addColorStop(0, `rgba(255,214,150,${0.1 + beat * 0.08})`);
        sg.addColorStop(1, "rgba(255,214,150,0)");
        c.fillStyle = sg;
        c.fillRect(0, 0, W, H);
        c.restore();

        // şerit ışıkları
        for (let l = 0; l < 4; l++) {
          flash[l] *= 0.86;
          if (flash[l] > 0.02) {
            const lg = c.createLinearGradient(0, spawnY, 0, hitY);
            lg.addColorStop(0, "rgba(142,230,207,0)");
            lg.addColorStop(1, `rgba(142,230,207,${0.22 * flash[l]})`);
            c.fillStyle = lg;
            c.fillRect(left + laneW * l + 2, spawnY, laneW - 4, hitY - spawnY);
          }
        }

        // halkalar
        for (let l = 0; l < 4; l++) {
          const x = laneX(l);
          const r = laneW * 0.3 * (1 + flash[l] * 0.12);
          c.save();
          c.strokeStyle = `rgba(142,230,207,${0.55 + flash[l] * 0.45})`;
          c.lineWidth = 2.5;
          c.shadowColor = "#8EE6CF";
          c.shadowBlur = 10 + flash[l] * 14;
          c.setLineDash([4, 6]);
          c.lineDashOffset = -ms / 60;
          c.beginPath();
          c.arc(x, hitY, r, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }

        // ruhlar
        if (running) {
          for (const n of chart) {
            if (n.done) continue;
            const dt = n.t - t;
            if (dt > TRAVEL + 0.1) break;
            if (dt < -0.17) {
              combo = 0;
              judge(n, "kaçtı", false);
              updateHud();
              continue;
            }
            const y = hitY - (dt / TRAVEL) * (hitY - spawnY);
            const fade = clamp((y - spawnY + 30) / 60, 0, 1);
            c.globalAlpha = fade;
            drawSoul(laneX(n.lane), y, laneW * 0.19, n.dbl, Math.sin(ms / 140 + n.t * 9));
            c.globalAlpha = 1;
          }

          // sayım: bir, iki, bir-iki-üç-dört
          const beatNow = Math.floor(t / B);
          if (t < 4 * B && beatNow >= 0 && beatNow !== countShown) {
            countShown = beatNow;
            Sound.sfx.tick();
          }
          if (t < 4 * B && t > -0.3) {
            const words = ["bir", "iki", "üç", "dört"];
            const w = words[clamp(Math.floor(t / B), 0, 3)];
            const k = (t / B) % 1;
            c.save();
            c.globalAlpha = Math.max(0, 1 - k * 1.2);
            c.fillStyle = "#F6D98B";
            c.textAlign = "center";
            c.font = `700 ${46 + k * 14}px Caveat, cursive`;
            c.fillText(w, W / 2, (spawnY + hitY) / 2);
            c.restore();
          }
        }

        // piyano tuşları
        const kh = H - keyTop - safeB;
        for (let l = 0; l < 4; l++) {
          const x = left + laneW * l + 3;
          const pressed = flash[l] > 0.4;
          const g = c.createLinearGradient(0, keyTop, 0, keyTop + kh);
          g.addColorStop(0, pressed ? "#e8dcc0" : "#fffaf0");
          g.addColorStop(1, pressed ? "#cbbd9e" : "#e7dcc6");
          c.fillStyle = g;
          roundRect(c, x, keyTop + (pressed ? 3 : 0), laneW - 6, kh, 8);
          c.fill();
          c.fillStyle = "rgba(0,0,0,.18)";
          c.fillRect(x, keyTop + kh - 7 + (pressed ? 3 : 0), laneW - 6, 7);
        }
        for (let l = 1; l < 4; l++) {
          if (l === 2) continue;
          const bx = left + laneW * l - laneW * 0.2;
          c.fillStyle = "#0e0c14";
          roundRect(c, bx, keyTop - 2, laneW * 0.4, kh * 0.55, 5);
          c.fill();
        }

        // değerlendirme yazıları
        for (let i = pops.length - 1; i >= 0; i--) {
          const p = pops[i];
          p.t += 1 / 60;
          if (p.t > 0.8) { pops.splice(i, 1); continue; }
          c.save();
          c.globalAlpha = 1 - p.t / 0.8;
          c.textAlign = "center";
          c.font = "700 24px Caveat, cursive";
          c.fillStyle = p.good ? (p.text === "harika" ? "#F6D98B" : "#BFF3E5") : "rgba(255,170,190,.85)";
          c.fillText(p.text, p.x, p.y - p.t * 40);
          c.restore();
        }

        if (running && combo >= 5) {
          c.save();
          c.textAlign = "center";
          c.fillStyle = "rgba(246,217,139,.9)";
          c.font = "700 20px Caveat, cursive";
          c.fillText(`${combo} kombo`, W / 2, spawnY - 14);
          c.restore();
        }
      }
      frame();

      // oyun döngüsü: kart → çal → sonuç
      let first = true;
      while (true) {
        if (first) {
          await cardPrompt(card, $("#soulStart"));
          first = false;
        }
        resetChart();
        hud.classList.add("show");
        Sound.fadeTo(0.3, 0.8);
        t0 = performance.now() / 1000 + 0.6;
        running = true;
        await new Promise((r) => {
          const check = () => (now() > END ? r() : setTimeout(check, 100));
          check();
        });
        running = false;
        const score = hits / chart.length;
        Sound.fadeTo(1, 1.2);
        if (score >= PASS) {
          Sound.sfx.chord("bright");
          Sound.vibrate([20, 40, 60]);
          for (let i = 0; i < 4; i++) setTimeout(() => FX.burst(rand(W * 0.2, W * 0.8), rand(H * 0.3, H * 0.6), 30, ["142,230,207", "183,176,255", "246,217,139", "255,140,190"], 5), i * 220);
          await cardPrompt(card, $("#soulStart"), {
            kicker: "kulüp ayakta",
            title: `<em>%${Math.round(score * 100)}</em> uyum`,
            text: "",
            goal: "alkışlar…",
            button: "devam",
          });
          break;
        } else {
          await cardPrompt(card, $("#soulStart"), {
            kicker: "neredeyse",
            title: `<em>%${Math.round(score * 100)}</em> uyum`,
            text: "Ritim sende var, ruhlar biraz hızlı kaçtı. Bir tur daha?",
            goal: "hedef: %70",
            button: "bir daha çalalım",
          });
        }
      }
      hud.classList.remove("show");
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", onDown);
      removeEventListener("keydown", onKey);
      resolve();
    });
  },
};

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + w, y);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.closePath();
}

/** Kulübün değişmeyen arka planı: tuğla duvar, kadife perdeler, sahne. Bir kez çizilir. */
function clubBackground(W, H, dpr, { left, laneW, hitY }) {
  const { o, c } = offscreen(W, H, dpr);
  const wall = c.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, "#1b1430");
  wall.addColorStop(1, "#0e0a1a");
  c.fillStyle = wall;
  c.fillRect(0, 0, W, H);
  // tuğlalar
  c.strokeStyle = "rgba(255,255,255,.035)";
  c.lineWidth = 1;
  for (let y = 0, row = 0; y < H; y += 20, row++) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    for (let x = (row % 2) * 22; x < W; x += 44) { c.moveTo(x, y); c.lineTo(x, y + 20); }
    c.stroke();
  }
  // sahne zemini
  const fl = c.createLinearGradient(0, hitY - 40, 0, H);
  fl.addColorStop(0, "#2a1c1a");
  fl.addColorStop(1, "#120b0a");
  c.fillStyle = fl;
  c.fillRect(0, hitY - 20, W, H);
  // şerit çizgileri
  c.strokeStyle = "rgba(183,176,255,.10)";
  for (let l = 0; l <= 4; l++) {
    c.beginPath();
    c.moveTo(left + laneW * l, H * 0.28);
    c.lineTo(left + laneW * l, hitY);
    c.stroke();
  }
  // kadife perdeler
  const cw = Math.max(34, W * 0.11);
  [0, W - cw].forEach((x0, side) => {
    for (let i = 0; i < 5; i++) {
      const fx = x0 + (cw / 5) * i;
      const g = c.createLinearGradient(fx, 0, fx + cw / 5, 0);
      g.addColorStop(0, "#4a0f1d");
      g.addColorStop(0.5, "#7a1a2e");
      g.addColorStop(1, "#3a0a16");
      c.fillStyle = g;
      c.fillRect(fx, 0, cw / 5 + 1, H);
    }
    c.fillStyle = "rgba(0,0,0,.35)";
    c.fillRect(side ? x0 : x0 + cw - 4, 0, 4, H);
  });
  // üst saçak
  c.fillStyle = "#5e1424";
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(W, 0);
  c.lineTo(W, 26);
  for (let x = W; x > 0; x -= 30) c.quadraticCurveTo(x - 15, 46, x - 30, 26);
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(214,180,110,.5)";
  c.fillRect(0, 22, W, 2);
  return o;
}

/* =========================================================
   NIGHTMARE — Noel gecesi uçuşu
   ========================================================= */
const NightGame = {
  run() {
    return new Promise(async (resolve) => {
      const scene = $("#s-gnight");
      const cv = $("#nightCv");
      const card = $("#nightCard");
      const hud = $("#nightHud");
      const toastEl = $("#nightToast");
      let { c, W, H, dpr } = setupCanvas(cv);
      const GOAL = 12;
      const sky = nightSky(W, H, dpr);
      const town = makeTown(W * 2, H);

      const P = { x: W * 0.24, y: H * 0.5, ty: H * 0.5, vy: 0, inv: 0, hp: 3, gifts: 0 };
      let scroll = 0;
      let speed = 3.1;
      let running = false;
      let raf = 0;
      let last = performance.now();
      let elapsed = 0;
      let shake = 0;
      const gifts = [];
      const bats = [];
      const flaks = [];
      const falling = [];
      let nextGift = 0.8, nextBat = 2.6, nextFlak = 5;
      const startMoves = { v: FX.pointer.moved };

      const lives = $$("#nightLives svg");
      const updateHud = () => {
        $("#nightGifts").textContent = `${P.gifts} / ${GOAL}`;
        lives.forEach((l, i) => l.classList.toggle("lost", i >= P.hp));
      };

      function reset() {
        gifts.length = bats.length = flaks.length = falling.length = 0;
        P.y = P.ty = H * 0.5; P.hp = 3; P.gifts = 0; P.inv = 0;
        speed = 3.1; elapsed = 0; nextGift = 0.8; nextBat = 2.6; nextFlak = 5;
        updateHud();
      }

      function hurt() {
        if (P.inv > 0) return;
        P.hp--;
        P.inv = 1.5;
        shake = 12;
        Sound.sfx.crack();
        Sound.vibrate([40, 30, 40]);
        FX.burst(P.x, P.y, 24, ["240,122,46", "237,228,211"], 4);
        if (P.hp <= 0) {
          const lost = Math.min(3, P.gifts);
          for (let i = 0; i < lost; i++) falling.push({ x: P.x + rand(-10, 10), y: P.y, vx: rand(-2, 1), vy: rand(-4, -1), r: rand(0, 6), col: GIFT_COLS[i % GIFT_COLS.length] });
          P.gifts -= lost;
          P.hp = 3;
          toast(toastEl, lost ? `Ah! ${lost} hediye düştü. Devam…` : "Ucuz atlattık. Devam…", 1800);
        }
        updateHud();
      }

      const onMove = (e) => { P.ty = clamp(e.clientY, H * 0.16, H * 0.86); };
      cv.addEventListener("pointermove", onMove);
      cv.addEventListener("pointerdown", onMove);

      function step(dt) {
        elapsed += dt / 60;
        speed = Math.min(5.2, 3.1 + elapsed * 0.045);
        scroll += speed * dt;

        // oyuncu
        const py = P.y;
        P.y = lerp(P.y, P.ty, 0.12 * dt);
        P.vy = P.y - py;
        P.inv = Math.max(0, P.inv - dt / 60);

        // doğurma
        nextGift -= dt / 60;
        nextBat -= dt / 60;
        nextFlak -= dt / 60;
        if (nextGift <= 0) {
          gifts.push({ x: W + 30, y: rand(H * 0.2, H * 0.82), col: GIFT_COLS[Math.floor(Math.random() * GIFT_COLS.length)], ph: rand(0, 6) });
          nextGift = rand(1.0, 1.6);
        }
        if (nextBat <= 0) {
          const cy = rand(H * 0.22, H * 0.78);
          const n = Math.floor(rand(3, 5.99));
          const fast = rand(1.3, 1.7);
          for (let i = 0; i < n; i++) bats.push({ x: W + 30 + i * 34, y0: cy + rand(-20, 20), ph: i * 0.9, amp: rand(18, 34), fast });
          nextBat = rand(2.2, 3.4) - Math.min(0.8, elapsed * 0.01);
        }
        if (nextFlak <= 0 && elapsed > 3) {
          flaks.push({ x: rand(W * 0.5, W * 0.95), y: rand(H * 0.2, H * 0.78), t: 0, col: Math.random() < 0.5 ? "142,230,120" : "190,120,240" });
          nextFlak = rand(2.2, 3.4) - Math.min(1, elapsed * 0.015);
        }

        // hediyeler
        for (let i = gifts.length - 1; i >= 0; i--) {
          const g = gifts[i];
          g.x -= speed * dt;
          if (g.x < -40) { gifts.splice(i, 1); continue; }
          if (Math.hypot(g.x - P.x, g.y - P.y) < 36) {
            gifts.splice(i, 1);
            P.gifts++;
            Sound.sfx.note(Math.min(7, P.gifts % 8));
            Sound.vibrate(10);
            FX.burst(g.x, g.y, 14, ["246,217,139", g.col.rgb], 3);
            updateHud();
          }
        }
        // yarasalar
        for (let i = bats.length - 1; i >= 0; i--) {
          const b = bats[i];
          b.x -= speed * b.fast * dt;
          b.y = b.y0 + Math.sin(b.x / 50 + b.ph) * b.amp;
          if (b.x < -40) { bats.splice(i, 1); continue; }
          if (Math.hypot(b.x - P.x, b.y - P.y) < 24) hurt();
        }
        // havai fişekler: önce yükselen iz, sonra patlama
        for (let i = flaks.length - 1; i >= 0; i--) {
          const f = flaks[i];
          f.t += dt / 60;
          f.x -= speed * dt;
          if (f.t > 1.0 && !f.boom) {
            f.boom = true;
            Sound.sfx.crack();
            FX.burst(f.x, f.y, 36, [f.col, "246,217,139", "255,255,255"], 5.5);
          }
          if (f.t > 1.6 || f.x < -60) { flaks.splice(i, 1); continue; }
          if (f.boom && f.t < 1.45 && Math.hypot(f.x - P.x, f.y - P.y) < 52) hurt();
        }
        // düşen hediyeler
        for (let i = falling.length - 1; i >= 0; i--) {
          const g = falling[i];
          g.vy += 0.25 * dt;
          g.x += g.vx * dt;
          g.y += g.vy * dt;
          g.r += 0.1 * dt;
          if (g.y > H + 40) falling.splice(i, 1);
        }
      }

      function draw(ms) {
        c.save();
        if (shake > 0.3) { c.translate(rand(-shake, shake), rand(-shake, shake)); shake *= 0.86; }
        c.drawImage(sky, 0, 0, W, H);
        // uzak spiral tepe
        drawSpiralHill(c, W * 0.62 - ((scroll * 0.12) % (W * 1.6)), H, H);
        drawSpiralHill(c, W * 0.62 - ((scroll * 0.12) % (W * 1.6)) + W * 1.6, H, H);
        // kasaba
        const tx = -((scroll * 0.5) % town.width);
        c.drawImage(town.canvas, tx, H - town.height, town.width, town.height);
        c.drawImage(town.canvas, tx + town.width, H - town.height, town.width, town.height);

        // havai fişek izleri ve patlamaları
        for (const f of flaks) {
          if (!f.boom) {
            const k = f.t / 1.0;
            const sy = H - (H - f.y) * k;
            c.strokeStyle = `rgba(${f.col},.8)`;
            c.lineWidth = 2;
            c.setLineDash([3, 5]);
            c.beginPath();
            c.moveTo(f.x, H);
            c.lineTo(f.x, sy);
            c.stroke();
            c.setLineDash([]);
            // hedef uyarısı
            c.strokeStyle = `rgba(${f.col},${0.25 + 0.35 * Math.abs(Math.sin(ms / 90))})`;
            c.beginPath();
            c.arc(f.x, f.y, 46, 0, Math.PI * 2);
            c.stroke();
          } else {
            const k = clamp((f.t - 1) / 0.5, 0, 1);
            const R = 20 + k * 40;
            const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, R);
            g.addColorStop(0, `rgba(255,255,255,${0.7 * (1 - k)})`);
            g.addColorStop(0.4, `rgba(${f.col},${0.5 * (1 - k)})`);
            g.addColorStop(1, `rgba(${f.col},0)`);
            c.fillStyle = g;
            c.beginPath();
            c.arc(f.x, f.y, R, 0, Math.PI * 2);
            c.fill();
          }
        }

        for (const g of gifts) drawGift(c, g.x, g.y + Math.sin(ms / 300 + g.ph) * 5, g.col, 0);
        for (const g of falling) drawGift(c, g.x, g.y, g.col, g.r);
        for (const b of bats) drawBat(c, b.x, b.y, ms);

        // kızak (dokunulmazken yanıp söner)
        if (!(P.inv > 0 && Math.floor(ms / 90) % 2)) drawSleigh(c, P.x, P.y, clamp(P.vy * 0.04, -0.3, 0.3), ms);
        c.restore();
      }

      function frame(ms) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(3, (ms - last) / 16.67);
        last = ms;
        if (!scene.classList.contains("on")) return;
        if (running) step(dt);
        else { scroll += 1.2 * dt; P.y = lerp(P.y, H * 0.5 + Math.sin(ms / 600) * 20, 0.05); }
        draw(ms);
      }
      raf = requestAnimationFrame(frame);

      await cardPrompt(card, $("#nightStart"));
      reset();
      hud.classList.add("show");
      running = true;
      toast(toastEl, "Zero yolu gösteriyor!", 1600);

      await new Promise((r) => {
        const check = () => (P.gifts >= GOAL ? r() : setTimeout(check, 100));
        check();
      });

      // kazanınca kızak aya doğru süzülür
      running = false;
      Sound.sfx.chord("bright");
      Sound.vibrate([20, 40, 80]);
      const sx = P.x, sy = P.y;
      const t1 = performance.now();
      await new Promise((r) => {
        const fly = (ms) => {
          const k = Math.min(1, (ms - t1) / 1600);
          P.x = lerp(sx, W * 0.85, k * k);
          P.y = lerp(sy, H * 0.18, k);
          P.ty = P.y;
          if (k < 1) requestAnimationFrame(fly); else r();
        };
        requestAnimationFrame(fly);
      });
      for (let i = 0; i < 4; i++) setTimeout(() => FX.burst(rand(W * 0.2, W * 0.9), rand(H * 0.15, H * 0.5), 34, ["142,230,120", "190,120,240", "246,217,139", "240,122,46"], 5.5), i * 200);
      hud.classList.remove("show");
      await cardPrompt(card, $("#nightStart"), {
        kicker: "noel kurtarıldı",
        title: "12 hediye <em>teslim</em>",
        text: "Kasaba hâlâ havai fişek atıyor ama kızak çoktan gitti. Zero gurur duyuyor.",
        goal: "",
        button: "devam",
      });
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerdown", onMove);
      resolve();
    });
  },
};

const GIFT_COLS = [
  { body: "#6b3fa0", ribbon: "#9FE9D5", rgb: "159,233,213" },
  { body: "#2f7a5a", ribbon: "#F07A2E", rgb: "240,122,46" },
  { body: "#a03a2a", ribbon: "#F6D98B", rgb: "246,217,139" },
  { body: "#24314f", ribbon: "#EDE4D3", rgb: "237,228,211" },
];

function drawGift(c, x, y, col, rot) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.shadowColor = "rgba(246,217,139,.6)";
  c.shadowBlur = 12;
  c.fillStyle = col.body;
  c.fillRect(-13, -11, 26, 22);
  c.shadowBlur = 0;
  c.fillStyle = "rgba(255,255,255,.12)";
  c.fillRect(-13, -11, 26, 5);
  c.fillStyle = col.ribbon;
  c.fillRect(-2.5, -11, 5, 22);
  c.fillRect(-13, -2.5, 26, 5);
  c.strokeStyle = col.ribbon;
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(-5, -14, 5, 3.5, -0.4, 0, Math.PI * 2);
  c.ellipse(5, -14, 5, 3.5, 0.4, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

function drawBat(c, x, y, ms) {
  const f = Math.floor(ms / 110) % 2 ? 0.45 : 1; // stop-motion kanat
  c.save();
  c.translate(x, y);
  c.fillStyle = "#0a080c";
  c.beginPath();
  c.moveTo(0, -3);
  c.quadraticCurveTo(-8, -14 * f, -20, -6 * f);
  c.quadraticCurveTo(-14, -2, -16, 4 * f);
  c.quadraticCurveTo(-8, 0, -3, 4);
  c.lineTo(0, 6);
  c.lineTo(3, 4);
  c.quadraticCurveTo(8, 0, 16, 4 * f);
  c.quadraticCurveTo(14, -2, 20, -6 * f);
  c.quadraticCurveTo(8, -14 * f, 0, -3);
  c.fill();
  c.fillStyle = "#F07A2E";
  c.fillRect(-2.5, -1, 1.6, 1.6);
  c.fillRect(1, -1, 1.6, 1.6);
  c.restore();
}

/** Tabut kızak, iki iskelet geyik ve önde burnu parlayan Zero. */
function drawSleigh(c, x, y, tilt, ms) {
  const gal = Math.sin(ms / 110);
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  c.lineCap = "round";
  c.lineJoin = "round";

  // Zero
  const zx = 112, zy = -10 + Math.sin(ms / 260) * 4;
  const glow = c.createRadialGradient(zx + 14, zy, 0, zx + 14, zy, 46);
  glow.addColorStop(0, "rgba(240,122,46,.55)");
  glow.addColorStop(1, "rgba(240,122,46,0)");
  c.fillStyle = glow;
  c.beginPath();
  c.arc(zx + 14, zy, 46, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(237,228,211,.92)";
  c.beginPath();
  c.ellipse(zx, zy, 11, 8, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(zx - 8, zy + 3);
  c.quadraticCurveTo(zx - 24, zy + 10 + gal * 3, zx - 34, zy + 2);
  c.quadraticCurveTo(zx - 20, zy - 2, zx - 8, zy - 4);
  c.fill();
  c.beginPath();
  c.ellipse(zx - 4, zy - 7, 4, 8, -0.9, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#121016";
  c.fillRect(zx + 2, zy - 3, 2, 3);
  c.fillStyle = "#F07A2E";
  c.beginPath();
  c.arc(zx + 12, zy + 1, 3.6, 0, Math.PI * 2);
  c.fill();

  // iskelet geyikler
  c.strokeStyle = "#EDE4D3";
  c.lineWidth = 2;
  [[62, 4], [34, 10]].forEach(([rx, ry], i) => {
    const g = Math.sin(ms / 110 + i * 1.4);
    c.beginPath();
    c.moveTo(rx - 12, ry);
    c.lineTo(rx + 10, ry - 2);
    for (let k = -9; k <= 7; k += 4) { c.moveTo(rx + k, ry - 1); c.lineTo(rx + k + 1, ry + 4); }
    c.moveTo(rx + 10, ry - 2);
    c.lineTo(rx + 16, ry - 10);
    c.moveTo(rx - 10, ry + 1); c.lineTo(rx - 14 + g * 4, ry + 12);
    c.moveTo(rx - 7, ry + 1); c.lineTo(rx - 4 - g * 4, ry + 12);
    c.moveTo(rx + 6, ry); c.lineTo(rx + 2 + g * 4, ry + 12);
    c.moveTo(rx + 9, ry); c.lineTo(rx + 12 - g * 4, ry + 12);
    c.moveTo(rx + 17, ry - 12); c.lineTo(rx + 14, ry - 20); c.lineTo(rx + 10, ry - 22);
    c.moveTo(rx + 15, ry - 17); c.lineTo(rx + 19, ry - 21);
    c.stroke();
    c.fillStyle = "#EDE4D3";
    c.beginPath();
    c.ellipse(rx + 19, ry - 10, 4.5, 3, 0.4, 0, Math.PI * 2);
    c.fill();
  });
  // dizginler
  c.strokeStyle = "rgba(237,228,211,.5)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(12, -4);
  c.quadraticCurveTo(40, 6, 76, -2);
  c.moveTo(76, -2);
  c.lineTo(zx - 30, zy + 4);
  c.stroke();

  // tabut kızak
  c.fillStyle = "#3a2c38";
  c.strokeStyle = "#EDE4D3";
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-34, -2);
  c.lineTo(-26, -12);
  c.lineTo(10, -12);
  c.lineTo(18, -2);
  c.lineTo(10, 12);
  c.lineTo(-26, 12);
  c.closePath();
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(-10, -6); c.lineTo(-10, 6); c.moveTo(-15, -1); c.lineTo(-5, -1);
  c.stroke();
  // kızak ayakları
  c.strokeStyle = "#c9a46a";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-30, 18);
  c.lineTo(16, 18);
  c.quadraticCurveTo(28, 18, 24, 8);
  c.moveTo(-20, 12); c.lineTo(-20, 18); c.moveTo(4, 12); c.lineTo(4, 18);
  c.stroke();

  // Jack
  c.fillStyle = "#0d0b10";
  c.beginPath();
  c.moveTo(-22, -12);
  c.lineTo(-16, -30);
  c.lineTo(-10, -12);
  c.fill();
  c.fillStyle = "#EDE4D3";
  c.beginPath();
  c.ellipse(-16, -38, 7, 8, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#0d0b10";
  c.beginPath();
  c.ellipse(-18.6, -39, 1.8, 2.4, 0, 0, Math.PI * 2);
  c.ellipse(-13.4, -39, 1.8, 2.4, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#0d0b10";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-20, -34);
  c.quadraticCurveTo(-16, -31, -12, -34);
  c.stroke();
  // yarasa papyon
  c.fillStyle = "#0d0b10";
  c.beginPath();
  c.moveTo(-16, -29); c.lineTo(-21, -32); c.lineTo(-20, -27); c.closePath();
  c.moveTo(-16, -29); c.lineTo(-11, -32); c.lineTo(-12, -27); c.closePath();
  c.fill();
  // kol, dizgini tutuyor
  c.strokeStyle = "#0d0b10";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-14, -24);
  c.lineTo(-2, -18);
  c.lineTo(12, -6);
  c.stroke();
  c.restore();
}

function drawSpiralHill(c, cx, W, H) {
  const s = H / 300 * 0.9;
  c.save();
  c.translate(cx, H);
  c.scale(s, s);
  c.fillStyle = "#1c1722";
  c.beginPath();
  c.moveTo(-260, 0);
  c.lineTo(-260, -60);
  c.bezierCurveTo(-180, -64, -110, -80, -60, -150);
  c.bezierCurveTo(-45, -172, -38, -192, -36, -208);
  c.lineTo(-24, -208);
  c.bezierCurveTo(-20, -170, 10, -90, 140, -64);
  c.lineTo(260, -60);
  c.lineTo(260, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = "#1c1722";
  c.lineWidth = 11;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-30, -204);
  c.bezierCurveTo(-28, -240, -46, -260, -68, -256);
  c.bezierCurveTo(-90, -252, -92, -224, -74, -220);
  c.bezierCurveTo(-60, -217, -54, -232, -64, -238);
  c.stroke();
  c.restore();
}

/** Gökyüzü: degrade, yıldızlar, büyük ay. Bir kez çizilir. */
function nightSky(W, H, dpr) {
  const { o, c } = offscreen(W, H, dpr);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0d0a16");
  g.addColorStop(0.6, "#1f1828");
  g.addColorStop(1, "#2b2030");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    c.fillStyle = `rgba(255,245,220,${rand(0.2, 0.8)})`;
    c.beginPath();
    c.arc(rand(0, W), rand(0, H * 0.7), rand(0.5, 1.4), 0, Math.PI * 2);
    c.fill();
  }
  const mx = W * 0.72, my = H * 0.24, mr = Math.min(W, H) * 0.17;
  const halo = c.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 2.4);
  halo.addColorStop(0, "rgba(243,233,198,.25)");
  halo.addColorStop(1, "rgba(243,233,198,0)");
  c.fillStyle = halo;
  c.fillRect(0, 0, W, H);
  const mg = c.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 0, mx, my, mr);
  mg.addColorStop(0, "#fbf4dc");
  mg.addColorStop(1, "#dccd9f");
  c.fillStyle = mg;
  c.beginPath();
  c.arc(mx, my, mr, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(160,140,100,.2)";
  [[-0.3, 0.25, 0.18], [0.3, -0.25, 0.12], [0.35, 0.35, 0.08]].forEach(([dx, dy, r]) => {
    c.beginPath();
    c.arc(mx + dx * mr, my + dy * mr, r * mr, 0, Math.PI * 2);
    c.fill();
  });
  return o;
}

/** Kaydırılarak tekrar eden çatı şeridi. */
function makeTown(width, H) {
  const height = Math.round(H * 0.24);
  const o = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  o.width = Math.round(width * dpr);
  o.height = Math.round(height * dpr);
  const c = o.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let x = 0; x < width; ) {
    const w = rand(40, 80), h = rand(height * 0.35, height * 0.8), lean = rand(-6, 6);
    const top = height - h;
    c.fillStyle = "#17121b";
    c.beginPath();
    c.moveTo(x, height);
    c.lineTo(x + lean, top);
    c.lineTo(x + w + lean, top);
    c.lineTo(x + w, height);
    c.closePath();
    c.fill();
    const px = x + w / 2 + lean * 1.6, rh = rand(26, 60), tip = rand(-10, 10);
    c.beginPath();
    c.moveTo(x + lean - 6, top + 2);
    c.quadraticCurveTo(px - 8, top - rh * 0.45, px + tip, top - rh);
    c.quadraticCurveTo(px + 6, top - rh * 0.4, x + w + lean + 6, top + 2);
    c.closePath();
    c.fill();
    const n = Math.floor(rand(1, 3.5));
    for (let i = 0; i < n; i++) {
      const lit = Math.random() < 0.65;
      c.fillStyle = lit ? "#f0a040" : "#29212d";
      if (lit) { c.shadowColor = "#f0a040"; c.shadowBlur = 8; }
      const wx = x + lean * 0.5 + (w / (n + 1)) * (i + 1) - 3.5;
      const wy = top + rand(10, Math.max(12, h - 26));
      roundRect(c, wx, wy, 7, 10, 3);
      c.fill();
      c.shadowBlur = 0;
    }
    x += w + rand(8, 36);
  }
  return { canvas: o, width, height };
}
