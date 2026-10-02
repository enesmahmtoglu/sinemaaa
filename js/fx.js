/**
 * Ortak yardımcılar ve parçacık katmanı
 * - FX: tüm ekranı kaplayan tek canvas; kıvılcım, iz parçacıkları, patlamalar
 * - Her karede şarkının vuruşunu --beat CSS değişkenine yazar
 */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Bir öğenin ekrandaki merkez noktası. */
const centerOf = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Web Animations kısayolu; animasyon bitince çözülen bir söz döner. */
function anim(el, keyframes, opts = {}) {
  if (!el) return Promise.resolve();
  const a = el.animate(keyframes, { duration: 600, easing: "cubic-bezier(.16,.84,.3,1)", fill: "forwards", ...opts });
  return a.finished.catch(() => {});
}

/** Belirli bir öğeye bir kez gelen olayı bekler. */
function once(el, type) {
  return new Promise((r) => el.addEventListener(type, r, { once: true }));
}

/**
 * Metni harf harf "mürekkeple" açar: her harf soldan sağa açılır,
 * kalemin ucunda küçük bir ışık gezinir.
 */
async function writeText(el, text, { speed = 1, pen = true } = {}) {
  el.textContent = "";
  const spans = [];
  for (const c of text) {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = c;
    el.appendChild(s);
    spans.push(s);
  }
  if (REDUCED) {
    spans.forEach((s) => s.classList.add("done"));
    return;
  }
  for (const s of spans) {
    const isSpace = s.textContent === " ";
    const d = (isSpace ? 40 : rand(55, 95)) / speed;
    s.animate([{ clipPath: "inset(-30% 100% -30% -10%)" }, { clipPath: "inset(-30% -10% -30% -10%)" }], { duration: d * 1.6, easing: "cubic-bezier(.3,.1,.3,1)", fill: "forwards" });
    if (pen && !isSpace) {
      const r = s.getBoundingClientRect();
      FX.ink(r.right, r.top + r.height * 0.55);
    }
    await wait(d);
  }
  await wait(200);
  spans.forEach((s) => s.classList.add("done"));
}

const FX = (() => {
  const cv = document.getElementById("fx");
  const c = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const parts = [];
  const hooks = new Set();
  const root = document.documentElement;

  const pointer = { x: innerWidth / 2, y: innerHeight / 2, down: false, moved: 0 };

  const spark = {
    on: false,
    x: 0, y: 0,
    tx: 0, ty: 0,
    r: 9,
    follow: true,
    hue: "142,230,207",
  };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth;
    H = innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize);
  resize();

  const setPointer = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  };
  addEventListener("pointermove", (e) => { setPointer(e); pointer.moved++; }, { passive: true });
  addEventListener("pointerdown", (e) => { setPointer(e); pointer.down = true; }, { passive: true });
  addEventListener("pointerup", () => { pointer.down = false; }, { passive: true });
  addEventListener("pointercancel", () => { pointer.down = false; }, { passive: true });

  function add(p) {
    parts.push(Object.assign({ vx: 0, vy: 0, life: 1, decay: 0.02, size: 2, rgb: "246,217,139", g: 0, drag: 0.98 }, p));
    if (parts.length > 500) parts.splice(0, parts.length - 500);
  }

  function burst(x, y, n = 24, colors = ["246,217,139", "142,230,207", "183,176,255"], power = 4) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(0.6, 1) * power;
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rand(1.2, 3.2), decay: rand(0.012, 0.03), rgb: colors[i % colors.length], g: 0.03 });
    }
  }

  function ink(x, y) {
    add({ x, y, vx: rand(-0.3, 0.3), vy: rand(-0.6, -0.1), size: rand(1, 2.2), decay: 0.04, rgb: "246,217,139" });
  }

  let last = performance.now();
  let lastBeat = 0;
  function frame(now) {
    const dt = Math.min(50, now - last) / 16.67;
    last = now;

    const b = typeof Sound !== "undefined" ? Sound.beat() : 0;
    lastBeat = b;
    root.style.setProperty("--beat", b.toFixed(3));

    c.clearRect(0, 0, W, H);
    hooks.forEach((h) => h(c, dt, now, b));

    // kıvılcım
    if (spark.on) {
      if (spark.follow) {
        spark.x = lerp(spark.x, spark.tx, 0.12 * dt);
        spark.y = lerp(spark.y, spark.ty, 0.12 * dt);
      }
      const speed = Math.hypot(spark.tx - spark.x, spark.ty - spark.y);
      const emit = Math.min(4, 1 + speed / 30);
      for (let i = 0; i < emit; i++) {
        add({ x: spark.x + rand(-3, 3), y: spark.y + rand(-3, 3), vx: rand(-0.4, 0.4), vy: rand(-0.7, 0.1), size: rand(1, 2.6), decay: rand(0.015, 0.03), rgb: Math.random() < 0.5 ? spark.hue : "246,217,139" });
      }
      const pulse = 1 + b * 0.35 + Math.sin(now / 300) * 0.06;
      const R = spark.r * pulse;
      c.globalCompositeOperation = "lighter";
      const g = c.createRadialGradient(spark.x, spark.y, 0, spark.x, spark.y, R * 6);
      g.addColorStop(0, `rgba(${spark.hue},.55)`);
      g.addColorStop(0.3, `rgba(${spark.hue},.16)`);
      g.addColorStop(1, `rgba(${spark.hue},0)`);
      c.fillStyle = g;
      c.beginPath();
      c.arc(spark.x, spark.y, R * 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(255,252,236,.95)";
      c.beginPath();
      c.arc(spark.x, spark.y, R * 0.7, 0, Math.PI * 2);
      c.fill();
      // kıvılcımın iki küçük gözü — Büyük Önce'deki ruhlara selam
      c.globalCompositeOperation = "source-over";
      c.fillStyle = "rgba(40,34,80,.75)";
      c.beginPath();
      c.ellipse(spark.x - R * 0.25, spark.y - R * 0.05, 0.9, 1.4, 0, 0, Math.PI * 2);
      c.ellipse(spark.x + R * 0.25, spark.y - R * 0.05, 0.9, 1.4, 0, 0, Math.PI * 2);
      c.fill();
    }

    // parçacıklar
    c.globalCompositeOperation = "lighter";
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vx *= Math.pow(p.drag, dt);
      p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      c.fillStyle = `rgba(${p.rgb},${(p.life * 0.9).toFixed(3)})`;
      c.beginPath();
      c.arc(p.x, p.y, p.size * (0.4 + p.life * 0.6), 0, Math.PI * 2);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    pointer,
    spark,
    add,
    burst,
    ink,
    hook: (fn) => { hooks.add(fn); return () => hooks.delete(fn); },
    get beat() { return lastBeat; },
    get W() { return W; },
    get H() { return H; },
  };
})();
