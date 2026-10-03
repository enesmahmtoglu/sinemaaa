/**
 * Akış: Mühür → Kıvılcım → Kişilik Salonu → Gün → Geçit → Ağaç kapıları → Mini oyun → Bilet → Jenerik
 * Her sahne bir async fonksiyon; bir sonrakine kendi geçişini yaparak devreder.
 */
const STORE_KEY = "ipek_davet_v2";
// İlk girişte iki kapının arkasında da Soul var; film bir kez açılınca bu not düşülür
// ve sonraki girişlerde kapılar normale döner (biri Soul, biri Nightmare, rastgele).
const FIRST_DOOR_KEY = "ipek_ilk_kapi_goruldu";
const FILMS = {
  soul: { name: "Soul", pass: "Dünya Bileti", title: "Soul", meta: "Pixar · 2020" },
  nightmare: { name: "The Nightmare Before Christmas", pass: "Halloween Town Bileti", title: "The <em>Nightmare</em> Before Christmas", meta: "Henry Selick · 1993" },
};
const State = { dayKey: null, dayLong: "", dayShort: "", film: null, dev: false };

// Davet 3 Ekim için hazırlandı: "Bugün" = 3 Ekim Cumartesi, "Yarın" = 4 Ekim Pazar
const today = new Date(2026, 9, 3);
const tomorrow = new Date(2026, 9, 4);
const fmtLong = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
const fmtShort = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

let zTop = 1;
function show(id) {
  const el = $("#s-" + id);
  el.classList.add("on");
  el.style.zIndex = ++zTop;
  return el;
}
function hide(id) {
  $("#s-" + id).classList.remove("on");
}
function setTone(t) {
  document.body.classList.toggle("is-light", t === "light");
  document.body.classList.toggle("is-dark", t !== "light");
}
function progress(i) {
  let s = "";
  for (let k = 0; k < 9; k++) {
    const x = 10 + k * 20;
    s += `<path class="${k <= i ? "" : "todo"}" d="M${x - 5} 9L${x + 5} 3M${x - 5} 3L${x + 5} 9"/>`;
  }
  $("#progress").innerHTML = s;
}
const circleReveal = (el, x, y, ms = 1100) => {
  const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 20;
  return anim(el, [
    { clipPath: `circle(0px at ${x}px ${y}px)` },
    { clipPath: `circle(${R}px at ${x}px ${y}px)` },
  ], { duration: ms, easing: "cubic-bezier(.7,0,.2,1)" }).then(() => {
    el.getAnimations().forEach((a) => a.cancel());
  });
};
function fadeUp(els, { delay = 0, gap = 110, dur = 800, steps = false } = {}) {
  els.forEach((el, i) =>
    anim(el, [{ opacity: 0, translate: "0 14px" }, { opacity: 1, translate: "0 0" }], {
      duration: dur,
      delay: delay + i * gap,
      easing: steps ? "steps(8)" : "cubic-bezier(.16,.84,.3,1)",
    })
  );
}

/** Şarkıyı başlatır; tarayıcı ilk dokunuşta izin vermezse parmak kalkınca yeniden dener. */
function startMusic() {
  Sound.unlock();
  Sound.start();
  const music = $("#music");
  const retry = () => {
    if (music.paused) {
      Sound.unlock();
      Sound.start();
    }
  };
  ["pointerup", "touchend", "click"].forEach((t) => addEventListener(t, retry, { once: true }));
}

/* =========================================================
   00 · MÜHÜR
   ========================================================= */
async function sceneSeal(returning) {
  show("seal");
  document.body.classList.add("at-seal");
  progress(0);
  if (returning) {
    $("#sealHint").textContent = "tekrar hoş geldin · mührü basılı tut";
    $(".env-letter span").textContent = "hâlâ geçerli";
  }
  fadeUp([$("#sealKicker"), $("#envelope"), $("#sealHint")], { gap: 240, dur: 1100 });
  setTimeout(() => $("#sealHint").classList.add("show"), 1400);

  const seal = $("#seal");
  const ring = $("#sealRing");

  await new Promise((resolve) => {
    let p = 0;
    let holding = false;
    let last = performance.now();
    let lastCreak = 0;
    let buzzed = 0;
    let finished = false;

    const start = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      holding = true;
      Sound.unlock();
      if (e && e.pointerId != null && seal.setPointerCapture) {
        try { seal.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };
    const stop = () => { holding = false; };
    seal.addEventListener("pointerdown", start);
    // bırakma yalnızca gerçek "parmak kalktı" olaylarından okunur; dokunuşun mühre
    // aktarılması sırasında içteki çizimden gelen lostpointercapture tutmayı kesmesin
    // Android uzun basışta pointercancel gönderebilir; onu bırakma saymıyoruz
    addEventListener("pointerup", stop);
    addEventListener("touchend", stop);
    seal.addEventListener("contextmenu", (e) => e.preventDefault());
    seal.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); start(); }
    });
    seal.addEventListener("keyup", stop);

    const tick = (now) => {
      if (finished) return;
      const dt = Math.min(50, now - last);
      last = now;
      p = holding ? p + dt / 1350 : Math.max(0, p - dt / 500);
      ring.style.strokeDashoffset = (100 - p * 100).toFixed(2);
      const a = p * p * 3.2;
      seal.style.transform = `translate(${rand(-a, a).toFixed(2)}px, ${rand(-a, a).toFixed(2)}px) rotate(${rand(-a, a).toFixed(2)}deg)`;
      if (holding && now - lastCreak > 150 - p * 90) {
        lastCreak = now;
        Sound.sfx.creak(p);
      }
      if (holding && p > (buzzed + 1) / 4) {
        buzzed++;
        Sound.vibrate(8 + buzzed * 6);
      }
      if (p >= 1) {
        finished = true;
        holding = false;
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // — mühür kırılır —
  const sc = centerOf(seal);
  seal.style.transform = "";
  Sound.sfx.crack();
  Sound.vibrate([25, 40, 70]);
  startMusic();
  $("#sealHint").classList.remove("show");
  anim($("#sealHint"), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
  anim($("#sealKicker"), [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });

  $$("#sealCracks path").forEach((pth, i) =>
    anim(pth, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 140, delay: i * 60, easing: "linear" })
  );
  await wait(200);
  FX.spark.on = true;
  FX.spark.follow = false;
  FX.spark.x = FX.spark.tx = sc.x;
  FX.spark.y = FX.spark.ty = sc.y;
  FX.burst(sc.x, sc.y, 46, ["155,35,53", "246,217,139", "208,105,122"], 5);
  anim(ring, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
  anim($("#sealL"), [{ transform: "none", opacity: 1 }, { transform: "translate(-46px, 120px) rotate(-42deg)", opacity: 0 }], { duration: 950, easing: "cubic-bezier(.5,0,.8,.45)" });
  anim($("#sealR"), [{ transform: "none", opacity: 1 }, { transform: "translate(52px, 130px) rotate(36deg)", opacity: 0 }], { duration: 1000, easing: "cubic-bezier(.5,0,.8,.45)" });
  anim($(".seal-seam"), [{ opacity: 0.55 }, { opacity: 0 }], { duration: 200 });
  anim($("#sealCracks"), [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 250 });
  await wait(260);

  // kapak açılır, mektup yükselir
  const flap = $("#envFlap");
  anim(flap, [{ transform: "rotateX(0deg)" }, { transform: "rotateX(178deg)" }], { duration: 760, easing: "cubic-bezier(.6,0,.3,1)" });
  setTimeout(() => flap.classList.add("open"), 380);
  Sound.sfx.tear(0.25);
  await wait(420);
  anim($(".env-letter"), [{ transform: "translateY(0)" }, { transform: "translateY(-46%)" }], { duration: 900, easing: "cubic-bezier(.2,.9,.3,1)" });
  await wait(900);

  // kamera zarfın içine dalar, geriye sadece kıvılcım kalır
  FX.spark.follow = true;
  FX.spark.tx = innerWidth / 2;
  FX.spark.ty = innerHeight * 0.5;
  anim($("#envelope"), [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(4.5)", opacity: 0 }], { duration: 1150, easing: "cubic-bezier(.7,0,.3,1)" });
  await wait(700);
  const next = show("spark");
  await anim(next, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, fill: "none" });
  hide("seal");
  document.body.classList.remove("at-seal");
}

/* =========================================================
   01 · KIVILCIM
   ========================================================= */
async function sceneSpark() {
  setTone("dark");
  progress(1);
  const sp = FX.spark;
  sp.on = true;
  sp.follow = true;
  await wait(600);
  await writeText($("#sparkL1"), "şimdiii,");
  await wait(250);
  await writeText($("#sparkL2"), "bir yere gideceğiz");
  await wait(450);
  await writeText($("#sparkL3"), "ama öncesinde ufak bi isteğim var", { speed: 1.4 });
  await wait(300);

  const ring = $("#soulRing");
  await anim(ring, [{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }], { duration: 900 });
  $("#sparkHint").classList.add("show");
  Sound.sfx.shimmer();

  const rc = centerOf(ring);
  const startMoves = FX.pointer.moved;
  const t0 = performance.now();
  await new Promise((resolve) => {
    const off = FX.hook((c, dt, now) => {
      if (FX.pointer.moved !== startMoves || FX.pointer.down) {
        sp.tx = FX.pointer.x;
        sp.ty = FX.pointer.y;
      } else if (now - t0 > 9000) {
        // hiç dokunmazsa kıvılcım halkaya doğru kendi süzülmeye başlar
        sp.tx = lerp(sp.tx, rc.x, 0.01 * dt);
        sp.ty = lerp(sp.ty, rc.y, 0.01 * dt);
      }
      const d = Math.hypot(sp.x - rc.x, sp.y - rc.y);
      ring.classList.toggle("near", d < 110);
      if (d < 32) {
        off();
        resolve();
      }
    });
  });

  sp.tx = rc.x;
  sp.ty = rc.y;
  $("#sparkHint").classList.remove("show");
  Sound.sfx.chord("bright");
  Sound.vibrate(25);
  FX.burst(rc.x, rc.y, 50, ["142,230,207", "183,176,255", "246,217,139"], 6);
  anim(ring, [{ scale: 1, opacity: 1 }, { scale: 1.8, opacity: 0 }], { duration: 700 });
  await wait(250);

  // kıvılcım çiçek gibi açılır ve Büyük Önce'nin lavanta salonu olur
  const hall = show("hall");
  setTone("light");
  sp.on = false;
  await circleReveal(hall, rc.x, rc.y, 1150);
  hide("spark");
}

/* =========================================================
   02 · KİŞİLİK SALONU
   ========================================================= */
async function sceneHall() {
  progress(2);
  const badges = $$(".badge");
  $$("#s-hall .hp").forEach((p, i) => {
    anim(p, [{ opacity: 0, transform: "translateY(-30px) scale(1.15)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: 200 + i * 160, easing: "cubic-bezier(.2,1.2,.4,1)" });
  });
  badges.forEach((b, i) =>
    anim(b, [{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1)" }], { duration: 650, delay: 500 + i * 110, easing: "cubic-bezier(.2,1.4,.4,1)" })
  );

  const sub = $("#badgeSub");
  await new Promise((resolve) => {
    let n = 0;
    badges.forEach((b) =>
      b.addEventListener("click", () => {
        const disc = $(".badge-disc", b);
        anim(disc, [{ transform: "scale(.82)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 480, easing: "cubic-bezier(.2,1.2,.4,1)", fill: "none" });
        writeText(sub, b.dataset.sub, { speed: 1.6, pen: false });
        if (b.classList.contains("on")) return;
        b.classList.add("on");
        n++;
        Sound.sfx.note(n + 1);
        Sound.vibrate(12);
        const c = centerOf(disc);
        FX.burst(c.x, c.y, 18, ["246,217,139", "142,230,207", "255,194,174"], 3);
        if (n === badges.length) resolve();
      })
    );
  });

  await wait(1500);
  anim(sub, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });
  await writeText($("#hallW1"), "Eksik tek bir şey kaldı:");
  await anim($("#hallBig"), [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 900 });
  Sound.sfx.chord("today");
  await wait(1300);

  // Dünya Bileti aşağıdan gelir, mühürlenir
  const pass = $("#pass");
  anim($(".hall-col"), [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0.25, filter: "blur(2px)" }], { duration: 700 });
  await anim(pass, [{ translate: "0 120vh", rotate: "9deg" }, { translate: "0 0", rotate: "-2deg" }], { duration: 1100, easing: "cubic-bezier(.2,1.05,.3,1)" });
  await wait(250);
  Sound.sfx.knock();
  Sound.vibrate(30);
  await anim($(".pass-stamp"), [{ opacity: 0, scale: 2.4 }, { opacity: 0.9, scale: 1 }], { duration: 300, easing: "steps(5)" });

  await once($("#passFlip"), "click");
  Sound.sfx.note(5);
  await anim(pass, [{ transform: "rotateY(0deg)" }, { transform: "rotateY(180deg)" }], { duration: 950, easing: "cubic-bezier(.5,0,.2,1)" });
  await wait(400);

  // biletin arka yüzü büyüyüp gökyüzüne dönüşür
  prepareDay();
  const r = pass.getBoundingClientRect();
  const s = Math.max(innerWidth / r.width, innerHeight / r.height) * 1.4;
  anim($(".pass-q"), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
  anim(pass, [{ transform: "rotateY(180deg) scale(1)" }, { transform: `rotateY(180deg) scale(${s})` }], { duration: 950, easing: "cubic-bezier(.7,0,.3,1)" });
  await wait(620);
  const day = show("day");
  await anim(day, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, fill: "none" });
  hide("hall");
}

/* =========================================================
   03 · GÜN
   ========================================================= */
const Sky = {
  phase: "dusk",
  set(phase, ms = 1400) {
    const scene = $("#s-day");
    scene.style.setProperty("--skyT", ms + "ms");
    $("#sky").dataset.phase = phase;
    this.phase = phase;
    scene.classList.toggle("is-day", phase === "day");
    setTone(phase === "day" ? "light" : "dark");
    this.bodies(phase, ms);
  },
  bodies(phase, ms) {
    const W = innerWidth;
    const H = innerHeight;
    const city = H - $("#keys").offsetHeight - 110; // silüetin ortalama çatı hizası
    const P = {
      sun: { day: [0.7 * W, 0.36 * H], dusk: [0.82 * W, city + 20], night: [0.95 * W, H + 200], dawn: [0.14 * W, city + 20] },
      moon: { night: [0.3 * W, 0.3 * H], dusk: [0.14 * W, city + 60], dawn: [0.88 * W, city + 120], day: [0.3 * W, H + 200] },
    };
    [["#sun", P.sun[phase]], ["#moonS", P.moon[phase]]].forEach(([sel, to]) => {
      const el = $(sel);
      const from = el._pos || to;
      const mid = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - H * 0.1];
      const T = (p) => `translate(${p[0]}px, ${p[1]}px)`;
      el.getAnimations().forEach((a) => a.cancel());
      el.animate(ms ? [{ transform: T(from) }, { transform: T(mid) }, { transform: T(to) }] : [{ transform: T(to) }, { transform: T(to) }], { duration: Math.max(1, ms), easing: "ease-in-out", fill: "forwards" });
      el._pos = to;
    });
  },
};

function realPhase() {
  const h = new Date().getHours();
  if (h >= 7 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  if (h >= 5 && h < 7) return "dawn";
  return "night";
}

/** Ekran genişliğine göre iki katmanlı bir şehir silüeti çizer. */
function buildSkyline() {
  const svg = $("#skyline");
  const W = Math.ceil(innerWidth);
  const H = 240;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  let far = "", near = "", ant = "", wins = "";
  for (let x = -10; x < W + 10; ) {
    const w = rand(34, 86), h = rand(80, 200);
    far += `M${x.toFixed(1)} ${H}V${(H - h).toFixed(1)}h${w.toFixed(1)}V${H}z`;
    if (Math.random() < 0.18) ant += `M${(x + w / 2).toFixed(1)} ${(H - h).toFixed(1)}v-${rand(12, 30).toFixed(0)}`;
    x += w - 1;
  }
  const blocks = [];
  for (let x = -6; x < W + 6; ) {
    const w = rand(38, 74), h = rand(46, 140);
    const top = H - h;
    if (Math.random() < 0.3) {
      const sw = w * rand(0.4, 0.6), sh = rand(10, 22);
      near += `M${(x + (w - sw) / 2).toFixed(1)} ${top.toFixed(1)}v-${sh.toFixed(1)}h${sw.toFixed(1)}v${sh.toFixed(1)}z`;
    }
    near += `M${x.toFixed(1)} ${H}V${top.toFixed(1)}h${w.toFixed(1)}V${H}z`;
    if (Math.random() < 0.12) ant += `M${(x + w * 0.3).toFixed(1)} ${top.toFixed(1)}v-${rand(14, 26).toFixed(0)}`;
    blocks.push({ x, w, top });
    x += w + rand(0, 3);
  }
  // iki özel pencere: biri solda biri sağda, ikisi de hep yanık — iki ev
  const mid = W / 2;
  const leftB = blocks.filter((b) => b.x + b.w < mid - 20 && b.x > 10).pop();
  const rightB = blocks.find((b) => b.x > mid + 20 && b.x + b.w < W - 10);
  blocks.forEach((b) => {
    const cols = Math.floor((b.w - 10) / 10);
    const rows = Math.floor((H - b.top - 16) / 13);
    const usC = Math.floor(cols / 2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isUs = (b === leftB || b === rightB) && r === 1 && c === usC;
        if (!isUs && Math.random() < 0.35) continue;
        const cls = isUs ? "win us" : Math.random() < 0.38 ? "win on" : "win";
        wins += `<rect class="${cls}" x="${(b.x + 6 + c * 10).toFixed(1)}" y="${(b.top + 10 + r * 13).toFixed(1)}" width="4" height="6"/>`;
      }
    }
  });
  svg.innerHTML = `<path class="sk-far" d="${far}"/><path class="sk-ant" d="${ant}"/><path class="sk-near" d="${near}"/>${wins}`;
}

/** Ekranı kenardan kenara dolduran klavye; ortadaki iki tuş Bugün ve Yarın. */
function buildPiano() {
  const bed = $("#keybed");
  bed.innerHTML = "";
  const W = innerWidth;
  const kw = clamp(W * 0.36, 120, 168);
  const side = Math.ceil((W / kw - 2) / 2) + 1;
  const NOTES = ["C", "D", "E", "F", "G", "A", "B"];
  const BLACK_AFTER = new Set(["C", "D", "F", "G", "A"]);
  const blacks = [];
  for (let i = -side; i < 2 + side; i++) {
    const note = NOTES[((i % 7) + 7) % 7];
    let k;
    if (i === 0 || i === 1) {
      const d = i === 0 ? today : tomorrow;
      const name = i === 0 ? "Bugün" : "Yarın";
      k = document.createElement("button");
      k.type = "button";
      k.className = "key";
      k.dataset.day = i === 0 ? "today" : "tomorrow";
      k.innerHTML = `<span class="key-name">${name}</span><span class="key-date">${fmtShort(d)}</span>`;
      k.setAttribute("aria-label", `${name}, ${fmtLong(d)}`);
    } else {
      k = document.createElement("span");
      k.className = "key key--deco";
      k.setAttribute("aria-hidden", "true");
    }
    k.style.width = kw + "px";
    bed.appendChild(k);
    if (BLACK_AFTER.has(note)) blacks.push(i + side + 1); // bu tuşla bir sonrakinin arasındaki sınır
  }
  // siyah tuşlar ayrı bir üst katmanda, tam iki beyaz tuşun sınırına ortalanır
  const total = (2 + side * 2) * kw;
  const offset = (W - total) / 2;
  const layer = document.createElement("div");
  layer.className = "blacks";
  layer.setAttribute("aria-hidden", "true");
  blacks.forEach((n) => {
    const bk = document.createElement("span");
    bk.className = "bk";
    bk.style.width = kw * 0.58 + "px";
    bk.style.left = offset + n * kw - kw * 0.29 + "px";
    layer.appendChild(bk);
  });
  bed.appendChild(layer);
}

function prepareDay() {
  const stars = $("#dayStars");
  if (!stars.childElementCount) {
    for (let i = 0; i < 70; i++) {
      const s = document.createElement("span");
      s.style.left = rand(2, 98) + "%";
      s.style.top = rand(2, 98) + "%";
      s.style.animationDelay = -rand(0, 3) + "s";
      if (Math.random() < 0.2) { s.style.width = s.style.height = "3px"; }
      stars.appendChild(s);
    }
  }
  $("#s-day").classList.add("on");
  buildSkyline();
  buildPiano();
  Sky.set("dusk", 0);
  $("#s-day").classList.remove("on");
}

async function sceneDay() {
  progress(3);
  Sky.set("dusk", 0);
  fadeUp([...$$("#s-day .head > *")], { gap: 130 });
  anim($("#keys"), [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 900, delay: 200, easing: "cubic-bezier(.2,1,.3,1)" });
  await wait(700);
  Sky.set(realPhase(), 1600);

  const keys = $$("#keybed button.key");
  const picked = await new Promise((resolve) => {
    let chosen = false;
    keys.forEach((k) => {
      k.addEventListener("pointerdown", () => { if (!chosen) k.classList.add("press"); });
      ["pointerup", "pointerleave", "pointercancel"].forEach((t) => k.addEventListener(t, () => k.classList.remove("press")));
      k.addEventListener("click", () => {
        if (chosen) return;
        chosen = true;
        k.classList.add("press");
        setTimeout(() => k.classList.remove("press"), 180);
        resolve(k.dataset.day);
      });
    });
  });

  const key = $(`#keybed button[data-day="${picked}"]`);
  keys.forEach((o) => { o.classList.toggle("sel", o === key); o.classList.toggle("dim", o !== key); });
  Sound.sfx.chord(picked);
  Sound.vibrate(15);

  if (picked === "today") {
    const h = new Date().getHours();
    Sky.set(h >= 20 || h < 5 ? "night" : "dusk", 1600);
    writeText($("#dayCaption"), `bu akşam · ${fmtLong(today)}`, { speed: 1.6, pen: false });
    await wait(1900);
  } else {
    writeText($("#dayCaption"), "bir gece, bir sabah, bir gün daha…", { speed: 1.8, pen: false });
    for (const p of ["night", "dawn", "day", "dusk"]) {
      Sky.set(p, 750);
      await wait(800);
    }
    await writeText($("#dayCaption"), `yarın akşam · ${fmtLong(tomorrow)}`, { speed: 1.6, pen: false });
    await wait(700);
  }

  State.dayKey = picked;
  State.dayLong = picked === "today" ? `Bu akşam · ${fmtLong(today)}` : `Yarın akşam · ${fmtLong(tomorrow)}`;
  State.dayShort = picked === "today" ? `Bugün (${fmtLong(today)})` : `Yarın (${fmtLong(tomorrow)})`;

  // seçilen tuş son bir kez çalınır, piyano aşağı iner
  Sound.sfx.chord("bright");
  Sound.vibrate(20);
  const kc = centerOf(key);
  FX.burst(kc.x, kc.y - 30, 26, ["246,217,139", "255,230,168", "183,176,255"], 4);
  anim($("#keys"), [{ transform: "translateY(0)" }, { transform: "translateY(110%)" }], { duration: 900, delay: 150, easing: "cubic-bezier(.6,0,.4,1)" });
  anim($(".day-col"), [{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 200 });
  await wait(1000);
}

/* =========================================================
   04 · GEÇİT — gökyüzü bir dikişten sökülür
   ========================================================= */
async function sceneGate() {
  progress(4);
  const W = innerWidth;
  const H = innerHeight;

  // dikiş hattı: yukarıdan aşağı hafif dalgalı bir çizgi
  const pts = [];
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const y = -20 + ((H + 40) * i) / N;
    const x = W * 0.5 + (i === 0 || i === N ? 0 : rand(-W * 0.07, W * 0.07));
    pts.push([x, y]);
  }
  const poly = (pre, post) => "polygon(" + [...pre, ...pts, ...post].map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(",") + ")";
  const leftClip = poly([[-10, -20]], [[-10, H + 20]]);
  const rightClip = "polygon(" + [[W + 10, -20], ...pts, [W + 10, H + 20]].map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(",") + ")";

  const cloneSky = () => {
    const src = $("#sky");
    const cl = src.cloneNode(true);
    cl.removeAttribute("id");
    [["#sun", ".sun"], ["#moonS", ".moon-s"]].forEach(([id, cls]) => {
      const t = getComputedStyle($(id)).transform;
      const n = cl.querySelector(cls);
      n.style.transform = t;
    });
    cl.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    return cl;
  };
  const L = $("#gateL");
  const R = $("#gateR");
  [[L, leftClip], [R, rightClip]].forEach(([half, clip]) => {
    half.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "gate-inner";
    inner.style.clipPath = clip;
    inner.appendChild(cloneSky());
    half.appendChild(inner);
  });

  // dikişler (Sally'nin dikişleri gibi, hattı dik kesen kısa çizgiler)
  const svg = $("#gateStitches");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";
  const stitches = [];
  const sample = (t) => {
    const f = t * N;
    const i = Math.min(N - 1, Math.floor(f));
    const k = f - i;
    return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k), pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]];
  };
  const count = Math.round(H / 38);
  for (let i = 1; i < count; i++) {
    const [x, y, dx, dy] = sample(i / count);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const a = 11;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", `M${(x - nx * a).toFixed(1)} ${(y - ny * a - 3).toFixed(1)}L${(x + nx * a).toFixed(1)} ${(y + ny * a + 3).toFixed(1)}`);
    p.setAttribute("pathLength", "1");
    p.style.strokeDasharray = "1";
    p.style.strokeDashoffset = "1";
    svg.appendChild(p);
    stitches.push(p);
  }

  const gate = show("gate");
  hide("day");
  for (const p of stitches) {
    anim(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 110, easing: "linear" });
    Sound.sfx.tick();
    await wait(55);
  }
  await wait(500);

  // altta Halloween Town hazır bekler
  show("forest");
  gate.style.zIndex = ++zTop;
  forestIntro();

  Sound.muffle(true, 0.35);
  Sound.sfx.tear(1.1);
  Sound.vibrate([20, 30, 20, 30, 60]);
  stitches.forEach((p, i) =>
    anim(p, [{ transform: "none", opacity: 1 }, { transform: `translate(${rand(-26, 26)}px, ${rand(-30, 6)}px) rotate(${rand(-120, 120)}deg)`, opacity: 0 }], { duration: 300, delay: i * 30, easing: "cubic-bezier(.3,0,.7,1)" })
  );
  await wait(stitches.length * 30 * 0.6);

  anim(L, [{ transform: "rotateY(0deg) translateX(0)" }, { transform: "rotateY(-84deg) translateX(-28%)" }], { duration: 1500, easing: "cubic-bezier(.6,0,.25,1)" });
  anim(R, [{ transform: "rotateY(0deg) translateX(0)" }, { transform: "rotateY(84deg) translateX(28%)" }], { duration: 1550, easing: "cubic-bezier(.6,0,.25,1)" });
  await wait(1000);
  Sound.muffle(false, 2.2);
  await wait(650);
  hide("gate");
  L.innerHTML = "";
  R.innerHTML = "";
}

/* =========================================================
   05 · AĞAÇ KAPILARI
   ========================================================= */
/** Ekran genişliğine göre eğri büğrü Halloween Town evleri çizer. */
function buildTown() {
  const svg = $("#town");
  const W = Math.ceil(innerWidth * 1.1);
  const H = 200;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  let houses = "", wins = "", fence = "";
  for (let x = rand(-20, 10); x < W + 10; ) {
    const w = rand(34, 66), h = rand(46, 110), lean = rand(-7, 7);
    const top = H - h;
    const px = x + w / 2 + lean * 1.8 + rand(-6, 6);
    const rh = rand(26, 64);
    const tip = rand(-10, 10);
    houses += `M${x} ${H}L${x + lean} ${top}L${x + w + lean} ${top}L${x + w} ${H}Z`;
    houses += `M${x + lean - 6} ${top + 2}Q${px - 8} ${top - rh * 0.45} ${px + tip} ${top - rh}Q${px + 6} ${top - rh * 0.4} ${x + w + lean + 6} ${top + 2}Z`;
    if (Math.random() < 0.45) {
      const cx = x + w * 0.72 + lean;
      houses += `M${cx} ${top}l2 -${rand(18, 30)}l7 1l-1 ${rand(16, 26)}z`;
    }
    const n = Math.floor(rand(1, 3.6));
    for (let i = 0; i < n; i++) {
      const wx = x + lean * 0.5 + (w / (n + 1)) * (i + 1) - 3.5;
      const wy = top + rand(10, Math.max(12, h - 30));
      const lit = Math.random() < 0.6 ? " lit" : "";
      wins += `<rect class="town-win${lit}" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="7" height="10" rx="3.5" transform="rotate(${rand(-6, 6).toFixed(1)} ${wx + 3.5} ${wy + 5})"/>`;
    }
    if (Math.random() < 0.4) {
      wins += `<circle class="town-win lit" cx="${(px + tip * 0.3).toFixed(1)}" cy="${(top - rh * 0.35).toFixed(1)}" r="3.4"/>`;
    }
    x += w + rand(6, 38);
  }
  // önde çarpık bir çit
  for (let x = 0; x < W; x += rand(11, 16)) {
    const t = H - rand(18, 26);
    fence += `M${x.toFixed(1)} ${H}L${(x + rand(-2, 2)).toFixed(1)} ${t.toFixed(1)}l2 -5l2 5`;
  }
  fence += `M0 ${H - 12}C${W * 0.3} ${H - 16} ${W * 0.6} ${H - 8} ${W} ${H - 13}`;
  svg.innerHTML = `<path class="town-house" d="${houses}"/>${wins}<path class="town-fence" d="${fence}"/>`;
}

function forestIntro() {
  setTone("dark");
  // dar ekranda tepe büyük dursun, geniş ekranda kıvrım kırpılmasın
  $("#s-forest .l-far").setAttribute("preserveAspectRatio", innerWidth / innerHeight > 0.9 ? "xMidYMax meet" : "xMidYMax slice");
  buildTown();
  const stars = $("#forestStars");
  if (!stars.childElementCount) {
    for (let i = 0; i < 46; i++) {
      const st = document.createElement("span");
      st.style.left = rand(1, 99) + "%";
      st.style.top = rand(1, 99) + "%";
      st.style.animationDelay = -rand(0, 3) + "s";
      stars.appendChild(st);
    }
  }
  const layers = $$("#s-forest .layer");
  layers.forEach((l, i) =>
    anim(l, [{ translate: "0 60px", opacity: 0 }, { translate: "0 0", opacity: 1 }], { duration: 1300, delay: 300 + i * 220, easing: "steps(10)" })
  );
  anim($("#moon"), [{ translate: "0 80px", opacity: 0 }, { translate: "0 0", opacity: 1 }], { duration: 1600, delay: 200, easing: "steps(12)" });
  fadeUp([...$$("#s-forest .head > *")], { delay: 1300, gap: 160, steps: true });
  $$(".door-tree, .sign").forEach((el) => el.classList.add("stop"));
}

function secretWire(btn) {
  let taps = [];
  btn.addEventListener("click", () => {
    btn.classList.remove("tap");
    void btn.offsetWidth;
    btn.classList.add("tap");
    Sound.sfx.note(taps.length + 4);
    const now = performance.now();
    taps = taps.filter((t) => now - t < 1800);
    taps.push(now);
    if (taps.length >= 3) {
      taps = [];
      openSecret();
    }
  });
}

async function openSecret() {
  const box = $("#secret");
  $("#figures").classList.add("show");
  box.hidden = false;
  Sound.sfx.shimmer();
  Sound.vibrate([10, 50, 10]);
  anim($(".secret-card"), [{ transform: "translateY(40px) rotate(6deg)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 700, easing: "steps(8)" });
  await once($("#secretClose"), "click");
  await anim($(".secret-card"), [{ opacity: 1 }, { opacity: 0, transform: "translateY(30px) rotate(-4deg)" }], { duration: 400, easing: "steps(5)" });
  box.hidden = true;
}

async function sceneForest() {
  progress(5);
  const forest = $("#forest");
  const layers = $$("#s-forest .layer");

  // eğim: telefonu eğince kâğıt katmanlar kayar (masaüstünde fare ile)
  let tilt = 0;
  let gyro = false;
  const onTilt = (e) => {
    if (e.gamma == null) return;
    gyro = true;
    tilt = clamp(e.gamma / 25, -1, 1);
  };
  addEventListener("deviceorientation", onTilt);
  const offTilt = FX.hook(() => {
    if (Math.random() < 0.12) {
      FX.add({ x: rand(0, innerWidth), y: innerHeight + 6, vx: rand(-0.3, 0.3), vy: rand(-1.1, -0.5), drag: 1, decay: rand(0.004, 0.008), size: rand(0.8, 1.8), rgb: Math.random() < 0.7 ? "240,140,60" : "246,217,139" });
    }
    const t = gyro ? tilt : (FX.pointer.x / innerWidth - 0.5) * 2;
    layers.forEach((l) => { l.style.transform = `translateX(${(-t * Number(l.dataset.depth)).toFixed(1)}px)`; });
  });

  // hangi filmin hangi kapının arkasında olduğu her seferinde rastgele
  let firstDoors = true;
  try { firstDoors = !localStorage.getItem(FIRST_DOOR_KEY); } catch (e) {}
  const order = firstDoors ? ["soul", "soul"] : Math.random() < 0.5 ? ["soul", "nightmare"] : ["nightmare", "soul"];
  const doors = $$(".door");
  doors.forEach((d, i) => (d.dataset.film = order[i]));
  const film = await new Promise((resolve) => {
    let chosen = false;
    doors.forEach((d) =>
      d.addEventListener("click", () => {
        if (chosen) return;
        const tree = d.closest(".door-tree");
        const sign = $(".sign", tree);
        if (d.dataset.k !== "1") {
          doors.forEach((o) => (o.dataset.k = ""));
          d.dataset.k = "1";
          d.classList.remove("knock");
          sign.classList.remove("knock");
          void d.offsetWidth;
          d.classList.add("knock");
          sign.classList.add("knock");
          Sound.sfx.knock();
          Sound.vibrate([15, 160, 15]);
          const lines = ["Tık tık… içeriden bir ses geliyor. Bir kez daha dokun.", "Tık tık… bu kapı da açılıyor. Emin misin? Bir kez daha dokun."];
          writeText($("#forestSub"), lines[doors.indexOf(d)], { speed: 1.8, pen: false });
          return;
        }
        chosen = true;
        resolve(d.dataset.film);
      })
    );
  });

  State.film = film;
  if (!State.dev) {
    try { localStorage.setItem(FIRST_DOOR_KEY, "1"); } catch (e) {}
  }
  const door = $(`.door[data-film="${film}"]`);
  const dc = centerOf(door);
  const color = film === "soul" ? "142,230,207" : "240,122,46";

  Sound.sfx.wind(2.2);
  Sound.vibrate(45);
  anim($(".door-leaf", door), [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-118deg)" }], { duration: 900, easing: "steps(9)" });
  anim($(".door-light", door), [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 200, easing: "steps(6)" });
  await wait(500);

  // rüzgâr her şeyi kapının içine çeker
  const suck = FX.hook(() => {
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = rand(innerWidth * 0.5, innerWidth * 0.9);
      const x = dc.x + Math.cos(a) * r, y = dc.y + Math.sin(a) * r;
      FX.add({ x, y, vx: (dc.x - x) / 26, vy: (dc.y - y) / 26, drag: 1, decay: 0.038, size: rand(1, 2.4), rgb: Math.random() < 0.5 ? color : "237,228,211" });
    }
  });
  forest.style.transformOrigin = `${dc.x}px ${dc.y}px`;
  anim(forest, [{ transform: "scale(1)" }, { transform: "scale(3.4)" }], { duration: 1500, easing: "cubic-bezier(.7,0,.3,1)" });
  anim($("#s-forest .forest-col"), [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
  await wait(1000);
  suck();
  offTilt();
  removeEventListener("deviceorientation", onTilt);

  // açılış: kapının ardında hangi film var
  const f = FILMS[film];
  const rv = show("reveal");
  rv.dataset.film = film;
  setTone(film === "soul" ? "light" : "dark");
  $("#revealT").innerHTML = "";
  $("#revealS").textContent = f.meta;
  [$("#revealK"), $("#revealS")].forEach((el) => (el.style.opacity = 0));
  await circleReveal(rv, dc.x, dc.y, 900);
  hide("forest");
  await anim($("#revealK"), [{ opacity: 0, translate: "0 8px" }, { opacity: 0.8, translate: "0 0" }], { duration: 700 });
  await wait(500);
  // film adı harf harf düşer
  const tmp = document.createElement("div");
  tmp.innerHTML = f.title;
  const T = $("#revealT");
  let k = 0;
  const addWord = (text, wrap) => {
    const holder = wrap ? document.createElement("em") : T;
    if (wrap) T.appendChild(holder);
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { holder.appendChild(document.createTextNode(" ")); return; }
      const word = document.createElement("span");
      word.className = "w";
      holder.appendChild(word);
      for (const ch of part) {
        const sp = document.createElement("span");
        sp.textContent = ch;
        word.appendChild(sp);
        anim(sp, [{ opacity: 0, transform: "translateY(-0.4em) rotate(-8deg)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: k * 45, easing: film === "soul" ? "cubic-bezier(.2,1.3,.4,1)" : "steps(5)" });
        k++;
      }
    });
  };
  tmp.childNodes.forEach((n) => addWord(n.textContent, n.nodeType === 1));
  Sound.sfx.chord(film === "soul" ? "today" : "tomorrow");
  Sound.vibrate([20, 60, 40]);
  await wait(k * 45 + 500);
  FX.burst(innerWidth / 2, innerHeight / 2, 40, film === "soul" ? ["142,230,207", "183,176,255", "246,217,139"] : ["240,122,46", "246,217,139", "237,228,211"], 6);
  await anim($("#revealS"), [{ opacity: 0 }, { opacity: 0.7 }], { duration: 600 });
  await wait(1700);

  const id = film === "soul" ? "gsoul" : "gnight";
  const next = show(id);
  await anim(next, [{ opacity: 0 }, { opacity: 1 }], { duration: 800, fill: "none", easing: film === "soul" ? "ease" : "steps(8)" });
  hide("reveal");
  return film;
}

/* =========================================================
   06 · MİNİ OYUN
   ========================================================= */
async function sceneGame(film) {
  progress(6);
  const id = film === "soul" ? "gsoul" : "gnight";
  if (film === "soul") await SoulGame.run();
  else await NightGame.run();

  // oyun karanlığa çekilir, bilet yukarı süzülür
  const scene = $("#s-" + id);
  prepareTicket();
  const t = show("ticket");
  t.style.opacity = 0;
  await anim(scene, [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(.9)", opacity: 0 }], { duration: 900, easing: film === "soul" ? "cubic-bezier(.6,0,.4,1)" : "steps(9)" });
  hide(id);
  t.style.opacity = "";
}

/* =========================================================
   07 · BİLET
   ========================================================= */
function prepareTicket() {
  const f = FILMS[State.film] || FILMS.soul;
  const ticket = $("#ticket");
  ticket.dataset.film = State.film || "soul";
  $("#tFilm").textContent = f.name;
  $(".t-top span").textContent = f.pass;
  $("#tDay").textContent = State.dayLong || "Bu akşam";
}

async function sceneTicket() {
  progress(7);
  setTone("dark");
  const ticket = $("#ticket");
  const stub = $("#tStub");
  const hint = $("#ticketHint");
  hint.style.opacity = 0;
  await anim(ticket, [{ transform: "translateY(75vh) rotate(-16deg)" }, { transform: "translateY(0) rotate(-1.5deg)" }], { duration: 1300, easing: "cubic-bezier(.2,1.05,.3,1)" });
  hint.style.opacity = "";
  writeText(hint, "Koçanı aşağı çekip yırt. Yırtmak = evet.", { speed: 1.4 });

  await new Promise((resolve) => {
    let drag = null;
    let travelled = 0;
    let done = false;
    const pos = (d) => `translate(${(d * 0.1).toFixed(1)}px, ${(d * 0.22).toFixed(1)}px) rotate(${Math.min(d, 150) * 0.15}deg)`;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    stub.addEventListener("pointerdown", (e) => {
      if (done) return;
      drag = { x: e.clientX, y: e.clientY, d: 0 };
      travelled = 0;
      try { stub.setPointerCapture(e.pointerId); } catch (_) {}
      stub.style.cursor = "grabbing";
    });
    stub.addEventListener("pointermove", (e) => {
      if (!drag || done) return;
      const d = Math.max(0, e.clientY - drag.y) + Math.max(0, e.clientX - drag.x) * 0.5;
      if (d - travelled > 12) {
        travelled = d;
        Sound.sfx.rip();
        if (Math.random() < 0.5) Sound.vibrate(6);
      }
      drag.d = d;
      stub.style.transform = pos(d);
      if (d > 120) finish();
    });
    const release = () => {
      if (!drag || done) return;
      const d = drag.d;
      drag = null;
      stub.style.cursor = "";
      anim(stub, [{ transform: pos(d) }, { transform: "none" }], { duration: 450, easing: "cubic-bezier(.2,1.4,.4,1)" }).then(() => {
        stub.getAnimations().forEach((a) => a.cancel());
        stub.style.transform = "";
      });
    };
    stub.addEventListener("pointerup", release);
    stub.addEventListener("pointercancel", release);
    stub.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); finish(); } });
    $("#tearBtn").addEventListener("click", finish);
  });

  // — yırtıldı —
  const from = stub.style.transform || "none";
  Sound.sfx.tear(0.4);
  Sound.vibrate([30, 30, 90]);
  anim(stub, [{ transform: from, opacity: 1 }, { transform: "translate(60px, 80vh) rotate(48deg)", opacity: 1 }], { duration: 1300, easing: "cubic-bezier(.5,0,.9,.6)" });
  anim(ticket, [{ transform: "rotate(-1.5deg)" }, { transform: "rotate(2deg) translateY(-6px)" }, { transform: "rotate(-1deg)" }], { duration: 600, easing: "cubic-bezier(.2,1.2,.4,1)" });
  anim($("#tearBtn"), [{ opacity: 0.45 }, { opacity: 0 }], { duration: 300 });

  saveChoice();
  await wait(700);
  Sound.sfx.knock();
  Sound.vibrate(35);
  await anim($("#tStamp"), [{ opacity: 0, scale: 2.4 }, { opacity: 0.92, scale: 1 }], { duration: 320, easing: "steps(5)" });
  writeText(hint, "Kaydedildi. Artık resmî.", { speed: 1.4 });
  await wait(2600);

  // ışıklar söner
  const credits = show("credits");
  prepareCredits();
  await anim(credits, [{ opacity: 0 }, { opacity: 1 }], { duration: 1600, fill: "none", easing: "steps(12)" });
  hide("ticket");
}

function saveChoice() {
  if (State.dev) return; // ?sahne= ile yapılan denemeler kayda geçmesin
  const f = FILMS[State.film] || FILMS.soul;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ film: State.film, dayLong: State.dayLong, at: Date.now() }));
  } catch (e) {}
  try {
    if (window.CinemaDB) window.CinemaDB.saveRSVP({ day: State.dayShort, movie: f.name }).catch(() => {});
  } catch (e) {}
}

/* =========================================================
   08 · JENERİK
   ========================================================= */
function prepareCredits() {
  const f = FILMS[State.film] || FILMS.soul;
  $("#cFilm").textContent = f.name;
  $("#cDay").textContent = State.dayLong || "";
  const stars = $("#creditStars");
  if (!stars.childElementCount) {
    for (let i = 0; i < 90; i++) {
      const s = document.createElement("span");
      s.style.left = rand(1, 99) + "%";
      s.style.top = rand(1, 99) + "%";
      s.style.animationDelay = -rand(0, 3) + "s";
      if (Math.random() < 0.15) { s.style.width = s.style.height = "3px"; }
      stars.appendChild(s);
    }
  }
}

async function sceneCredits() {
  progress(8);
  setTone("dark");
  const credits = $("#credits");
  await wait(300);
  const h = credits.offsetHeight;
  const dist = innerHeight + h;
  const a = credits.animate([{ transform: "translateY(0)" }, { transform: `translateY(${-dist}px)` }], { duration: (dist / 48) * 1000, easing: "linear", fill: "forwards" });
  // basılı tutunca jenerik hızlanır
  const fast = () => { a.playbackRate = 5; };
  const slow = () => { a.playbackRate = 1; };
  const sc = $("#s-credits");
  sc.addEventListener("pointerdown", fast);
  addEventListener("pointerup", slow);
  await a.finished.catch(() => {});
  sc.removeEventListener("pointerdown", fast);
  showEnd();
}

function showEnd() {
  const f = FILMS[State.film] || FILMS.soul;
  const msg = `Davetiyeni açtım, biletimi de yırttım 🎟️

Film: ${f.name}
Seans: ${State.dayLong || ""}

Görüşürüz 🌙`;
  $("#waShare").href = "https://api.whatsapp.com/send?text=" + encodeURIComponent(msg);
  const end = $("#theEnd");
  end.classList.add("show");
  Sound.sfx.chord("today");
}

/* =========================================================
   Başlangıç
   ========================================================= */
function wireGlobal() {
  const mute = $("#mute");
  mute.addEventListener("click", () => {
    const m = !Sound.muted;
    Sound.setMuted(m);
    mute.setAttribute("aria-pressed", String(m));
    mute.setAttribute("aria-label", m ? "Müziği aç" : "Müziği kapat");
  });
  secretWire($("#moon"));
  secretWire($("#moon2"));
  $("#replay").addEventListener("click", () => {
    try { sessionStorage.setItem("replay", "1"); } catch (e) {}
    location.reload();
  });
  document.addEventListener("visibilitychange", () => {
    const m = $("#music");
    if (document.hidden) m.pause();
    else if (!document.body.classList.contains("at-seal") && !Sound.muted) m.play().catch(() => {});
  });
}

(async function main() {
  wireGlobal();
  let saved = null;
  let replay = false;
  try {
    saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    replay = sessionStorage.getItem("replay") === "1";
    sessionStorage.removeItem("replay");
  } catch (e) {}

  // geliştirme için: ?sahne=forest gibi doğrudan bir sahneden başlat
  const jump = new URLSearchParams(location.search).get("sahne");
  if (jump) return devJump(jump);

  const returning = !!(saved && saved.film && !replay);
  await sceneSeal(returning);

  await sceneSpark();
  await sceneHall();
  await sceneDay();
  await sceneGate();
  const film = await sceneForest();
  await sceneGame(film);
  await sceneTicket();
  await sceneCredits();
})();

async function devJump(name) {
  State.dev = true;
  State.film = new URLSearchParams(location.search).get("film") || "soul";
  State.dayKey = "today";
  State.dayLong = `Bu akşam · ${fmtLong(today)}`;
  State.dayShort = `Bugün (${fmtLong(today)})`;
  const steps = {
    spark: async () => { show("spark"); FX.spark.x = innerWidth / 2; FX.spark.y = innerHeight / 2; await sceneSpark(); await sceneHall(); },
    hall: async () => { show("hall"); setTone("light"); await sceneHall(); await sceneDay(); },
    day: async () => { prepareDay(); show("day"); await sceneDay(); await sceneGate(); },
    forest: async () => { show("forest"); forestIntro(); const f = await sceneForest(); await sceneGame(f); },
    game: async () => { const id = State.film === "soul" ? "gsoul" : "gnight"; show(id); setTone(State.film === "soul" ? "light" : "dark"); await sceneGame(State.film); await sceneTicket(); },
    ticket: async () => { prepareTicket(); show("ticket"); await sceneTicket(); await sceneCredits(); },
    credits: async () => { show("credits"); prepareCredits(); await sceneCredits(); },
  };
  if (steps[name]) await steps[name]();
}
