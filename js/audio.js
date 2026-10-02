/**
 * Ses motoru
 * - Şarkı tek bir <audio> öğesinden çalar; mümkünse Web Audio zincirine bağlanır:
 *   şarkı → alçak geçiren filtre (geçitteki "boğuklaşma") → kazanç → analiz → çıkış
 * - Ritim: bas frekanslarının enerjisinden 0..1 arası bir "vuruş" değeri üretilir.
 *   file:// üzerinden açılırsa tarayıcı analizi engeller; o zaman şarkının
 *   temposundan hesaplanan bir vuruşa düşülür.
 * - Efekt sesleri dosya değil, anında sentezlenir (gürültü + osilatör).
 */
const Sound = (() => {
  const el = document.getElementById("music");
  const BPM = 123;
  const canRoute = location.protocol !== "file:";

  let ctx = null;
  let master, musicGain, filter, analyser, sfxBus, data, noiseBuf;
  let routed = false;
  let muted = false;
  let env = 0;
  let avg = 0;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    master = ctx.createGain();
    master.connect(ctx.destination);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.55;
    sfxBus.connect(master);

    if (canRoute) {
      try {
        const src = ctx.createMediaElementSource(el);
        filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 20000;
        filter.Q.value = 0.8;
        musicGain = ctx.createGain();
        musicGain.gain.value = 0;
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.55;
        data = new Uint8Array(analyser.frequencyBinCount);
        src.connect(filter);
        filter.connect(musicGain);
        musicGain.connect(analyser);
        analyser.connect(master);
        routed = true;
      } catch (e) {
        routed = false;
      }
    }

    // 1.5 sn beyaz gürültü: çatlama, yırtılma, rüzgâr bundan yapılır
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }

  /** Kullanıcı dokunuşu içinde çağrılmalı: ses kilidini açar, şarkıyı sessizce hazırlar. */
  function unlock() {
    init();
    if (ctx && ctx.state === "suspended") ctx.resume();
    if (!routed) el.volume = 0;
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  }

  /** Şarkıyı baştan, yavaşça açarak başlatır. */
  function start() {
    try { el.currentTime = 0; } catch (e) {}
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
    fadeTo(1, 2.6);
  }

  function fadeTo(v, secs) {
    if (routed && ctx) {
      const t = ctx.currentTime;
      musicGain.gain.cancelScheduledValues(t);
      musicGain.gain.setValueAtTime(musicGain.gain.value, t);
      musicGain.gain.linearRampToValueAtTime(v, t + secs);
    } else {
      const from = el.volume;
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / (secs * 1000));
        el.volume = Math.max(0, Math.min(1, from + (v - from) * k));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  /** Geçit: şarkı bir kapının arkasından geliyormuş gibi boğuklaşır. */
  function muffle(on, secs = 0.5) {
    if (!routed || !ctx) {
      fadeTo(on ? 0.45 : 1, secs);
      return;
    }
    const t = ctx.currentTime;
    filter.frequency.cancelScheduledValues(t);
    filter.frequency.setValueAtTime(filter.frequency.value, t);
    filter.frequency.exponentialRampToValueAtTime(on ? 420 : 20000, t + secs);
  }

  function setMuted(m) {
    muted = m;
    if (ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.08);
    el.muted = m && !routed;
  }

  /** 0..1 arası vuruş zarfı; her karede bir kez çağrılır. */
  function beat() {
    if (muted || el.paused) {
      env *= 0.9;
      return env;
    }
    if (routed && analyser) {
      analyser.getByteFrequencyData(data);
      let e = 0;
      for (let i = 1; i < 7; i++) e += data[i];
      e /= 6 * 255;
      avg = avg * 0.97 + e * 0.03;
      const hit = Math.max(0, (e - avg * 1.08) / 0.18);
      env = Math.max(Math.min(1, hit), env * 0.86);
    } else {
      const phase = (el.currentTime * BPM / 60) % 1;
      env = Math.pow(1 - phase, 5);
    }
    return env;
  }

  /* ---------- sentezlenmiş efektler ---------- */

  function noise({ t = 0, dur = 0.2, type = "bandpass", f = 1800, f2 = null, q = 1, vol = 0.6, attack = 0.005 }) {
    if (!ctx) return;
    const now = ctx.currentTime + t;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.setValueAtTime(f, now);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, now + dur);
    flt.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(sfxBus);
    src.start(now, Math.random() * 0.5);
    src.stop(now + dur + 0.05);
  }

  function tone({ t = 0, f = 440, dur = 1.2, vol = 0.18, type = "sine" }) {
    if (!ctx) return;
    const now = ctx.currentTime + t;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = f * 2;
    const g = ctx.createGain();
    const g2 = ctx.createGain();
    g2.gain.value = 0.18;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.012);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, now + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    o2.connect(g2);
    g2.connect(g);
    g.connect(sfxBus);
    o.start(now);
    o2.start(now);
    o.stop(now + dur + 0.05);
    o2.stop(now + dur + 0.05);
  }

  const NOTE = { D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392, A4: 440, B4: 493.88, Cs5: 554.37, D5: 587.33, E5: 659.25, Fs5: 739.99, A5: 880 };
  const PENTA = [NOTE.D4, NOTE.E4, NOTE.Fs4, NOTE.A4, NOTE.B4, NOTE.D5, NOTE.E5, NOTE.Fs5];

  const sfx = {
    crack() {
      noise({ dur: 0.09, f: 2600, q: 0.8, vol: 0.9 });
      noise({ t: 0.05, dur: 0.16, f: 1200, q: 1.4, vol: 0.7 });
      noise({ t: 0.12, dur: 0.07, f: 3400, q: 2, vol: 0.5 });
      tone({ f: 90, dur: 0.25, vol: 0.25, type: "sine" });
    },
    creak(level) {
      noise({ dur: 0.05, f: 700 + level * 900, q: 6, vol: 0.12 + level * 0.2 });
    },
    tick() {
      noise({ dur: 0.03, f: 3800, q: 3, vol: 0.18 });
    },
    tear(dur = 0.6) {
      const n = Math.round(dur * 26);
      for (let i = 0; i < n; i++) {
        noise({ t: (i / n) * dur + Math.random() * 0.02, dur: 0.035 + Math.random() * 0.04, f: 1400 + Math.random() * 2600, q: 1.2, vol: 0.25 + Math.random() * 0.35 });
      }
    },
    rip() {
      noise({ dur: 0.05, f: 1800 + Math.random() * 2000, q: 1.2, vol: 0.35 });
    },
    note(i = 0, t = 0) {
      tone({ t, f: PENTA[i % PENTA.length], dur: 1.4, vol: 0.16 });
    },
    chord(which, t = 0) {
      const sets = {
        today: [NOTE.D4, NOTE.Fs4, NOTE.A4, NOTE.Cs5],
        tomorrow: [NOTE.G4, NOTE.B4, NOTE.D5, NOTE.Fs5],
        bright: [NOTE.D5, NOTE.Fs5, NOTE.A5],
      };
      (sets[which] || sets.today).forEach((f, i) => tone({ t: t + i * 0.045, f, dur: 2.4, vol: 0.12 }));
    },
    pop() {
      if (!ctx) return;
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(880, now);
      o.frequency.exponentialRampToValueAtTime(240, now + 0.12);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      o.connect(g);
      g.connect(sfxBus);
      o.start(now);
      o.stop(now + 0.2);
    },
    wind(dur = 1.6) {
      noise({ dur, type: "bandpass", f: 260, f2: 1400, q: 0.7, vol: 0.5, attack: 0.5 });
      noise({ t: 0.3, dur: dur * 0.8, type: "lowpass", f: 500, f2: 160, q: 0.5, vol: 0.4, attack: 0.3 });
    },
    knock() {
      tone({ f: 120, dur: 0.14, vol: 0.4 });
      noise({ dur: 0.05, f: 500, q: 3, vol: 0.4 });
      tone({ t: 0.18, f: 115, dur: 0.14, vol: 0.4 });
      noise({ t: 0.18, dur: 0.05, f: 480, q: 3, vol: 0.4 });
    },
    shimmer() {
      [NOTE.A5, NOTE.Fs5, NOTE.D5, NOTE.A4].forEach((f, i) => tone({ t: i * 0.07, f: f * 2, dur: 0.9, vol: 0.05 }));
    },
  };

  function vibrate(p) {
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {}
  }

  return { unlock, start, fadeTo, muffle, setMuted, beat, sfx, vibrate, get muted() { return muted; } };
})();
