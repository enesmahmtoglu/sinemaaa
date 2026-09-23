/**
 * cinema-game.js — 3 Farklı Filme Özel Zanaat Piksel Mini Oyun Motoru
 * ====================================================================
 * 1. KÖFTE YAĞMURU (Flint Lockwood):
 *    - Mekanik: Yiyecek Yağmuru Avcısı (Food Rain Catcher)
 *    - Gökten dev köfteler, burgerler ve peynirler yağar.
 *    - Acı biberlere çarpmadan gümüş tepsiyle 10 lezzetli yiyecek topla!
 * 
 * 2. WALL-E (Hurdalıkta Solar Görev & Fide Kurtarma):
 *    - Mekanik: Hurdalık Manevrası & Solar Enerji (Junkyard Rover & Battery Collect)
 *    - Wall-E paletleriyle hurda bloklarından ve varillerden kaçar.
 *    - Güneş pillerini toplayarak şarjını %100 yapar ve EVE ile efsanevi Fideyi kurtarır!
 * 
 * 3. KUNG FU PANDA 1 (Po'nun Yeşim Sarayı Refleks Dövüşü):
 *    - Mekanik: Kung-Fu Çubuk Refleksi (Martial Arts Reflex Striker)
 *    - Po ortada savaş duruşunda; Shifu sol ve sağdan mantılar fırlatır!
 *    - Mantı vuruş alanına girdiğinde SOL veya SAĞ ile havada kap!
 *    - Tahta antrenman dikenlerine vurma, 10 mantı ile "SKADOOSH" Ejderha Aurasını aç!
 */

const CinemaGame = (() => {
  const W = 320;
  const H = 240;
  const TARGET_SCORE = 10;

  let canvas, ctx;
  let animId = null;
  let isRunning = false;
  let currentFilmId = 1;
  let onFinishCallback = null;

  // Oyun Durumu
  let score = 0;
  let isWon = false;
  let winTimer = 0;
  let lastTime = 0;
  let floatingTexts = [];
  let particles = [];
  let confetti = [];

  // =====================================================================
  // Web Audio API — Filme Özel 8-Bit Retro Ses Efektleri
  // =====================================================================
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, gainLevel = 0.12) {
    try {
      const ac = getAudioCtx();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(gainLevel, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch (e) {}
  }

  // Ses Efekti Fonksiyonları
  function sfxFlintCatch() {
    playTone(523.25, 'triangle', 0.08, 0.15); // C5
    setTimeout(() => playTone(783.99, 'sine', 0.12, 0.18), 50); // G5
  }
  function sfxFlintChili() {
    playTone(160, 'sawtooth', 0.22, 0.2); // acı yanma sesi
    setTimeout(() => playTone(120, 'sawtooth', 0.2, 0.15), 100);
  }

  function sfxWallEBattery() {
    playTone(587.33, 'sine', 0.07, 0.14); // D5
    setTimeout(() => playTone(880, 'sine', 0.1, 0.18), 60); // A5
  }
  function sfxWallEChirp() {
    // Wall-E "Waall-ee" robot sesi
    playTone(440, 'triangle', 0.1, 0.15);
    setTimeout(() => playTone(660, 'sine', 0.14, 0.18), 90);
    setTimeout(() => playTone(550, 'sine', 0.2, 0.16), 200);
  }
  function sfxWallEHurt() {
    playTone(130, 'square', 0.15, 0.18); // metal çarpma
  }

  function sfxPoStrike() {
    playTone(480, 'square', 0.05, 0.16); // çubuk vuruşu
    setTimeout(() => playTone(880, 'triangle', 0.12, 0.2), 40); // kapma
  }
  function sfxPoGong() {
    // Yeşim gongu
    playTone(220, 'triangle', 0.6, 0.25);
    setTimeout(() => playTone(330, 'sine', 0.8, 0.2), 80);
  }
  function sfxPoMiss() {
    playTone(180, 'sawtooth', 0.12, 0.12);
  }

  function sfxWinFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'square', 0.22, 0.16), idx * 110);
    });
  }

  // Piksel Çizim Kısayolu
  function p(x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  /* =====================================================================
     OYUN 1: KÖFTE YAĞMURU (FLINT LOCKWOOD)
     ===================================================================== */
  const GameFlint = {
    x: W / 2,
    targetX: W / 2,
    items: [],
    spawnTimer: 0,
    isHurt: 0, // acı biber sersemlemesi
    bgClouds: [],

    reset() {
      this.x = W / 2;
      this.targetX = W / 2;
      this.items = [];
      this.spawnTimer = 0;
      this.isHurt = 0;
      this.bgClouds = [
        { x: 30, y: 25, speed: 8, w: 45 },
        { x: 140, y: 45, speed: 12, w: 60 },
        { x: 260, y: 20, speed: 9, w: 50 }
      ];
    },

    spawnItem() {
      const isChili = Math.random() < 0.22; // %22 ihtimalle acı biber
      if (isChili) {
        this.items.push({
          type: "chili",
          x: 25 + Math.random() * (W - 50),
          y: -18,
          vy: 95 + Math.random() * 30,
          w: 16,
          h: 18,
          label: "ACI BİBER!"
        });
      } else {
        const types = ["kofte", "burger", "spagetti", "peynir"];
        const t = types[Math.floor(Math.random() * types.length)];
        this.items.push({
          type: t,
          x: 25 + Math.random() * (W - 50),
          y: -18,
          vy: 75 + Math.random() * 40,
          w: 18,
          h: 18,
          label: t === "burger" ? "+1 Burger!" : t === "kofte" ? "+1 Köfte!" : "+1 Lezzet!"
        });
      }
    },

    update(dt) {
      // Hareket
      const moveSpeed = this.isHurt > 0 ? 6 : 14;
      this.x += (this.targetX - this.x) * Math.min(1, dt * moveSpeed);
      if (this.isHurt > 0) this.isHurt -= dt;

      // Bulutlar
      this.bgClouds.forEach((c) => {
        c.x += c.speed * dt;
        if (c.x > W + 60) c.x = -70;
      });

      if (isWon) return;

      this.spawnTimer += dt;
      if (this.spawnTimer >= 0.75) {
        this.spawnTimer = 0;
        this.spawnItem();
      }

      const catcherY = H - 38;
      const catcherW = 46;

      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        it.y += it.vy * dt;

        const hitX = Math.abs(it.x - this.x) < catcherW / 2 + 4;
        const hitY = it.y >= catcherY - 8 && it.y <= catcherY + 14;

        if (hitX && hitY) {
          if (it.type === "chili") {
            // Acı bibere çarptı!
            this.isHurt = 1.2;
            sfxFlintChili();
            addFloatingText("🔥 ACI BİBER! 🔥", it.x, it.y - 12, "#EF4444");
            spawnParticles(it.x, it.y, "#DC2626", 12);
          } else {
            // Lezzetli yiyecek yakalandı!
            score++;
            sfxFlintCatch();
            addFloatingText(it.label, it.x, it.y - 12, "#FBBF24");
            spawnParticles(it.x, it.y, "#F59E0B", 8);
            updateHUD();

            if (score >= TARGET_SCORE) {
              triggerVictory();
            }
          }
          this.items.splice(i, 1);
          continue;
        }

        if (it.y > H + 25) this.items.splice(i, 1);
      }
    },

    render(time) {
      // Chewandswallow Gün Batımı Gökyüzü
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#2D4059");
      sky.addColorStop(0.5, "#E57A44");
      sky.addColorStop(0.85, "#F4C078");
      sky.addColorStop(1, "#3E4E59");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Pamuk Şeker Bulutları
      ctx.fillStyle = "rgba(255, 235, 235, 0.35)";
      this.bgClouds.forEach((c) => {
        p(c.x, c.y, c.w, 14, "rgba(254, 226, 226, 0.4)");
        p(c.x + 6, c.y - 5, c.w - 12, 6, "rgba(254, 226, 226, 0.45)");
      });

      // Kasaba Silüeti
      p(0, H - 28, W, 28, "#28343E");
      p(15, H - 44, 22, 16, "#1F2830"); // ev
      p(70, H - 52, 28, 24, "#1F2830"); // sardalya fabrikası kulesi
      p(220, H - 40, 32, 12, "#1F2830");
      p(0, H - 28, W, 2, "#4B5E6D");

      // Düşen Yiyecekler
      this.items.forEach((it) => {
        const ix = Math.floor(it.x);
        const iy = Math.floor(it.y);

        if (it.type === "chili") {
          // Kırmızı Acı Biber
          p(ix - 3, iy - 6, 6, 12, "#DC2626");
          p(ix - 1, iy + 4, 3, 4, "#EF4444");
          p(ix - 1, iy - 9, 2, 4, "#16A34A"); // yeşil sap
        } else if (it.type === "burger") {
          // Hamburger
          p(ix - 8, iy - 7, 16, 4, "#D97706");
          p(ix - 5, iy - 6, 2, 1, "#FEF3C7");
          p(ix + 2, iy - 6, 2, 1, "#FEF3C7");
          p(ix - 8, iy - 3, 16, 3, "#16A34A");
          p(ix - 7, iy, 14, 3, "#EAB308");
          p(ix - 8, iy + 3, 16, 4, "#451A03");
          p(ix - 7, iy + 7, 14, 3, "#B45309");
        } else if (it.type === "spagetti") {
          // Spagetti Topu
          p(ix - 7, iy - 7, 14, 14, "#FDE047");
          p(ix - 4, iy - 4, 8, 8, "#DC2626");
          p(ix - 1, iy - 1, 4, 4, "#78350F");
        } else {
          // Dev Köfte
          p(ix - 7, iy - 7, 14, 14, "#78350F");
          p(ix - 5, iy - 5, 10, 10, "#9A3412");
          p(ix - 1, iy - 3, 3, 3, "#DC2626");
          p(ix + 1, iy + 1, 2, 2, "#16A34A");
        }
      });

      // Flint Lockwood Çizimi
      const px = Math.floor(this.x);
      const py = Math.floor(H - 34);
      const bob = Math.sin(time * 12) * 1.5;

      // Çılgın Siyah Saçlar
      p(px - 10, py - 40 + bob, 20, 10, "#1A1A24");
      p(px - 14, py - 38 + bob, 6, 8, "#1A1A24");
      p(px + 8, py - 42 + bob, 6, 12, "#1A1A24");
      p(px - 4, py - 46 + bob, 8, 8, "#1A1A24");

      // Yüz (Acı biber yediyse kırmızı alevli yüz!)
      const faceCol = this.isHurt > 0 ? "#F87171" : "#FBD3B6";
      p(px - 8, py - 30 + bob, 16, 14, faceCol);
      p(px + 6, py - 26 + bob, 6, 6, this.isHurt > 0 ? "#DC2626" : "#F5B895"); // büyük burun
      p(px - 4, py - 27 + bob, 4, 4, "#FFFFFF");
      p(px - 2, py - 26 + bob, 2, 3, "#1C2D42");
      p(px + 2, py - 27 + bob, 4, 4, "#FFFFFF");
      p(px + 4, py - 26 + bob, 2, 3, "#1C2D42");

      if (this.isHurt > 0) {
        // Ağzından alev çıkar
        p(px - 4, py - 18 + bob, 8, 4, "#EF4444");
        p(px - 2, py - 17 + bob, 4, 2, "#FDE047");
      } else {
        p(px - 3, py - 19 + bob, 7, 2, "#9A4030");
      }

      // Önlük & Mavi Gömlek
      p(px - 10, py - 16 + bob, 20, 20, "#FFFFFF");
      p(px - 4, py - 16 + bob, 8, 14, "#38BDF8");
      p(px - 1, py - 16 + bob, 2, 10, "#1E293B");

      // Pantolon & Kırmızı Spor Ayakkabı
      p(px - 8, py + 4, 6, 12, "#1E3A5F");
      p(px + 2, py + 4, 6, 12, "#1E3A5F");
      p(px - 10, py + 14, 8, 4, "#EF4444");
      p(px + 2, py + 14, 8, 4, "#EF4444");

      // Büyük Gümüş Servis Tepsisi
      p(px - 23, py - 14 + bob, 46, 4, "#E2E8F0");
      p(px - 25, py - 16 + bob, 4, 4, "#CBD5E1");
      p(px + 21, py - 16 + bob, 4, 4, "#CBD5E1");
      p(px - 21, py - 13 + bob, 42, 2, "#FFFFFF");
    }
  };


  /* =====================================================================
     OYUN 2: WALL-E (HURDALIKTA SOLAR GÖREV & FİDE KURTARMA)
     ===================================================================== */
  const GameWallE = {
    x: 70,
    y: H - 55,
    targetX: 70,
    targetY: H - 55,
    obstacles: [], // düşen / kayan ezilmiş hurda blokları
    pickups: [],   // güneş pilleri ve kasetler
    spawnTimer: 0,
    eveX: 230,
    eveY: 55,
    eveBob: 0,
    plantFound: false,

    reset() {
      this.x = 70;
      this.y = H - 55;
      this.targetX = 70;
      this.targetY = H - 55;
      this.obstacles = [];
      this.pickups = [];
      this.spawnTimer = 0;
      this.eveX = 230;
      this.eveY = 55;
      this.plantFound = false;
    },

    spawnElements() {
      // Hurda Bloğu (Engel)
      if (Math.random() < 0.65) {
        this.obstacles.push({
          x: W + 20,
          y: H - 75 + (Math.random() < 0.5 ? 0 : 30),
          w: 22,
          h: 20,
          vx: -95 - Math.random() * 35
        });
      }

      // Güneş Pili veya Kaset (Toplanacak)
      const isFinalPlant = score === 9 && !this.plantFound;
      this.pickups.push({
        type: isFinalPlant ? "plant" : (Math.random() < 0.5 ? "battery" : "tape"),
        x: W + 25,
        y: H - 80 + Math.random() * 45,
        w: 18,
        h: 18,
        vx: -80
      });
      if (isFinalPlant) this.plantFound = true;
    },

    update(dt, time) {
      // Wall-E Yumuşak Hareket
      this.x += (this.targetX - this.x) * Math.min(1, dt * 10);
      this.y += (this.targetY - this.y) * Math.min(1, dt * 10);

      // Sınırlar
      this.x = Math.max(30, Math.min(W - 40, this.x));
      this.y = Math.max(H - 95, Math.min(H - 40, this.y));

      // EVE Süzülmesi
      this.eveBob = Math.sin(time * 3) * 6;
      this.eveX = W - 70 + Math.sin(time * 1.5) * 20;

      if (isWon) return;

      this.spawnTimer += dt;
      if (this.spawnTimer >= 0.95) {
        this.spawnTimer = 0;
        this.spawnElements();
      }

      // Engelleri Güncelle
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const ob = this.obstacles[i];
        ob.x += ob.vx * dt;

        // Çarpışma
        if (Math.abs(ob.x - this.x) < 20 && Math.abs(ob.y - this.y) < 18) {
          sfxWallEHurt();
          spawnParticles(this.x, this.y, "#92400E", 10);
          addFloatingText("BİP! HURDA!", this.x, this.y - 18, "#F87171");
          this.obstacles.splice(i, 1);
          continue;
        }

        if (ob.x < -30) this.obstacles.splice(i, 1);
      }

      // Toplanacakları Güncelle
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const pk = this.pickups[i];
        pk.x += pk.vx * dt;

        if (Math.abs(pk.x - this.x) < 22 && Math.abs(pk.y - this.y) < 20) {
          score++;
          if (pk.type === "plant") {
            sfxWallEChirp();
            addFloatingText("🌱 FİDE BULUNDU! 🌱", this.x, this.y - 20, "#4ADE80");
            spawnParticles(this.x, this.y, "#22C55E", 20);
          } else {
            sfxWallEBattery();
            addFloatingText(pk.type === "battery" ? "⚡ +%10 GÜNEŞ ŞARJI" : "📼 HELLO DOLLY!", this.x, this.y - 16, "#FACC15");
            spawnParticles(this.x, this.y, "#FBBF24", 8);
          }
          this.pickups.splice(i, 1);
          updateHUD();

          if (score >= TARGET_SCORE) {
            triggerVictory();
          }
          continue;
        }

        if (pk.x < -30) this.pickups.splice(i, 1);
      }
    },

    render(time) {
      // Hurdalık Gece Gökyüzü & Kızıl Ufuk
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0F172A");
      sky.addColorStop(0.4, "#291528");
      sky.addColorStop(0.7, "#6B351E");
      sky.addColorStop(1, "#27160C");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Uzak Hurda Gökdelenleri Silüeti
      p(10, 60, 36, 120, "#1E121B");
      p(55, 45, 48, 140, "#190F16");
      p(115, 75, 40, 110, "#1E121B");
      p(170, 50, 52, 130, "#190F16");
      p(240, 70, 45, 110, "#1E121B");

      // Hurdalık Zemin
      p(0, H - 45, W, 45, "#451A03");
      p(0, H - 45, W, 3, "#78350F");
      // Metal artık dokusu
      for (let sx = 0; sx < W; sx += 20) {
        p(sx, H - 35, 8, 4, "#291002");
        p(sx + 10, H - 20, 6, 3, "#78350F");
      }

      // EVE (Havada Süzülen Beyaz Robot)
      const ex = Math.floor(this.eveX);
      const ey = Math.floor(this.eveY + this.eveBob);
      // Gövde (Zarif oval beyaz)
      p(ex - 6, ey - 10, 12, 18, "#F8FAFC");
      p(ex - 4, ey - 12, 8, 3, "#F8FAFC");
      p(ex - 4, ey + 7, 8, 2, "#F8FAFC");
      // Mavi Işıklı Visor (Gözler)
      p(ex - 5, ey - 6, 10, 5, "#0F172A");
      p(ex - 4, ey - 5, 3, 2, "#38BDF8"); // sol mavi göz
      p(ex + 1, ey - 5, 3, 2, "#38BDF8"); // sağ mavi göz
      // EVE Mavi Tarayıcı Lazer Işığı
      ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(this.x - 12, this.y + 10);
      ctx.lineTo(this.x + 12, this.y + 10);
      ctx.closePath();
      ctx.fill();

      // Engeller (Ezilmiş Hurda Blokları)
      this.obstacles.forEach((ob) => {
        const ox = Math.floor(ob.x);
        const oy = Math.floor(ob.y);
        p(ox, oy, ob.w, ob.h, "#78350F");
        p(ox + 2, oy + 2, ob.w - 4, ob.h - 4, "#92400E");
        p(ox + 4, oy + 4, 6, 6, "#B45309");
        p(ox + 12, oy + 10, 5, 5, "#451A03");
      });

      // Toplanacaklar (Güneş Pili / Kaset / Fide)
      this.pickups.forEach((pk) => {
        const kx = Math.floor(pk.x);
        const ky = Math.floor(pk.y);

        if (pk.type === "plant") {
          // Bot İçindeki Yeşil Fide!
          p(kx - 6, ky + 4, 14, 8, "#78350F"); // postal
          p(kx - 4, ky - 2, 10, 6, "#58280C");
          p(kx, ky - 7, 3, 6, "#15803D");      // gövde
          p(kx - 4, ky - 9, 4, 3, "#22C55E"); // sol yaprak
          p(kx + 3, ky - 10, 4, 3, "#4ADE80"); // sağ yaprak
          // Parlama efekti
          ctx.fillStyle = "rgba(74, 222, 128, 0.3)";
          ctx.beginPath();
          ctx.arc(kx + 2, ky - 2, 12, 0, Math.PI * 2);
          ctx.fill();
        } else if (pk.type === "battery") {
          // Güneş Pili
          p(kx - 5, ky - 7, 10, 14, "#0284C7");
          p(kx - 2, ky - 9, 4, 2, "#94A3B8");
          p(kx - 3, ky - 3, 6, 6, "#FACC15"); // şimşek
        } else {
          // Kaset
          p(kx - 8, ky - 5, 16, 10, "#334155");
          p(kx - 6, ky - 3, 12, 6, "#E2E8F0");
          p(kx - 4, ky - 1, 2, 2, "#0F172A");
          p(kx + 2, ky - 1, 2, 2, "#0F172A");
        }
      });

      // WALL-E Çizimi
      const wx = Math.floor(this.x);
      const wy = Math.floor(this.y);
      const bob = Math.sin(time * 16) * 1;

      // Dürbün Gözler
      p(wx - 13, wy - 30 + bob, 11, 9, "#CBD5E1");
      p(wx - 11, wy - 28 + bob, 7, 5, "#1E293B");
      p(wx - 9, wy - 27 + bob, 3, 3, "#38BDF8"); // sol lens
      p(wx + 2, wy - 30 + bob, 11, 9, "#CBD5E1");
      p(wx + 4, wy - 28 + bob, 7, 5, "#1E293B");
      p(wx + 6, wy - 27 + bob, 3, 3, "#38BDF8"); // sağ lens
      p(wx - 2, wy - 21 + bob, 5, 5, "#64748B"); // boyun

      // Sarı-Pas Kutu Gövde
      p(wx - 15, wy - 15 + bob, 30, 20, "#EAB308");
      p(wx - 13, wy - 13 + bob, 26, 3, "#CA8A04");
      p(wx - 11, wy - 7 + bob, 22, 10, "#A16207"); // pas
      // Solar Gösterge (Şarj seviyesine göre yeşil LED'ler!)
      const chargeLeds = Math.min(5, Math.ceil((score / TARGET_SCORE) * 5));
      for (let l = 0; l < 5; l++) {
        p(wx - 6 + l * 3, wy - 11 + bob, 2, 3, l < chargeLeds ? "#22C55E" : "#334155");
      }

      // Paletler
      p(wx - 20, wy - 7, 7, 20, "#334155");
      p(wx + 13, wy - 7, 7, 20, "#334155");
      p(wx - 19, wy + 9, 5, 4, "#0F172A");
      p(wx + 14, wy + 9, 5, 4, "#0F172A");

      // Mekanik Kollar & Ön Kasa
      p(wx - 21, wy - 3 + bob, 42, 4, "#94A3B8");
      p(wx - 22, wy - 8 + bob, 3, 6, "#64748B");
      p(wx + 19, wy - 8 + bob, 3, 6, "#64748B");
    }
  };


  /* =====================================================================
     OYUN 3: KUNG FU PANDA 1 (PO'NUN YEŞİM SARAYI MANTI REFLEKSİ)
     ===================================================================== */
  const GamePo = {
    x: W / 2,
    y: H - 50,
    poStance: "idle", // "idle" | "strike-left" | "strike-right"
    stanceTimer: 0,
    targets: [],      // Shifu'nun attığı mantılar & şeftaliler
    spawnTimer: 0,
    dragonAura: false,
    cherryBlossoms: [],

    reset() {
      this.poStance = "idle";
      this.stanceTimer = 0;
      this.targets = [];
      this.spawnTimer = 0;
      this.dragonAura = false;
      this.cherryBlossoms = [];
      for (let i = 0; i < 20; i++) {
        this.cherryBlossoms.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vy: 20 + Math.random() * 25,
          vx: (Math.random() - 0.5) * 15,
          rot: Math.random() * Math.PI
        });
      }
    },

    strike(direction) {
      if (isWon) return;
      this.poStance = direction === "left" ? "strike-left" : "strike-right";
      this.stanceTimer = 0.28;

      // Mantı yakalama kontrolü (Vuruş bölgesi: Po'ya 25 - 75 px mesafede)
      let hitFound = false;
      const targetSide = direction; // "left" | "right"

      for (let i = this.targets.length - 1; i >= 0; i--) {
        const tg = this.targets[i];
        if (tg.side === targetSide && tg.dist >= 18 && tg.dist <= 75) {
          hitFound = true;
          if (tg.isDummy) {
            // Tahta kuklaya vurdu!
            sfxPoMiss();
            addFloatingText("AH! TAHTA KUKLA!", this.x + (direction === "left" ? -45 : 45), this.y - 30, "#EF4444");
            spawnParticles(this.x + (direction === "left" ? -40 : 40), this.y - 10, "#92400E", 10);
          } else {
            // Mantıyı kaptı!
            score++;
            sfxPoStrike();
            const quotes = ["SKADOOSH!", "WUSHAA!", "LEZZETLİ!", "HARİKA!"];
            const q = quotes[Math.floor(Math.random() * quotes.length)];
            addFloatingText(`🥢 ${q} (+1)`, this.x + (direction === "left" ? -45 : 45), this.y - 35, "#FBBF24");
            spawnParticles(this.x + (direction === "left" ? -40 : 40), this.y - 10, "#F59E0B", 12);
            updateHUD();

            if (score >= TARGET_SCORE) {
              this.dragonAura = true;
              sfxPoGong();
              triggerVictory();
            }
          }
          this.targets.splice(i, 1);
          break;
        }
      }

      if (!hitFound) {
        sfxPoMiss();
      }
    },

    spawnTarget() {
      const side = Math.random() < 0.5 ? "left" : "right";
      const isDummy = Math.random() < 0.25; // antrenman kuklası (vurulmamalı!)
      const types = ["manti", "eriste", "seftali"];
      const type = types[Math.floor(Math.random() * types.length)];

      this.targets.push({
        side: side,
        type: type,
        isDummy: isDummy,
        dist: 140, // merkez Po'ya olan uzaklık
        speed: 95 + Math.random() * 35,
        y: this.y - 12 + Math.sin(Math.random()) * 8
      });
    },

    update(dt) {
      if (this.stanceTimer > 0) {
        this.stanceTimer -= dt;
        if (this.stanceTimer <= 0) this.poStance = "idle";
      }

      // Kiraz Çiçekleri (Petals)
      this.cherryBlossoms.forEach((b) => {
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        if (b.y > H + 10) {
          b.y = -10;
          b.x = Math.random() * W;
        }
      });

      if (isWon) return;

      this.spawnTimer += dt;
      if (this.spawnTimer >= 0.85) {
        this.spawnTimer = 0;
        this.spawnTarget();
      }

      // Hedefleri Merkeze Doğru İlerlet
      for (let i = this.targets.length - 1; i >= 0; i--) {
        const tg = this.targets[i];
        tg.dist -= tg.speed * dt;

        // Merkez Po'yu geçti mi? (Iskalandı)
        if (tg.dist < 8) {
          this.targets.splice(i, 1);
        }
      }
    },

    render(time) {
      // Yeşim Sarayı Alacakaranlığı
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#231138");
      sky.addColorStop(0.5, "#6A244E");
      sky.addColorStop(0.85, "#9A4035");
      sky.addColorStop(1, "#2F1924");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Yeşim Dağları & Çin Pagoda Çatıları
      p(15, 65, 75, 45, "#1C0D26"); // sol pagoda
      p(10, 63, 85, 4, "#2C143B"); // kavisli çatı
      p(W - 90, 70, 75, 40, "#1C0D26"); // sağ pagoda
      p(W - 95, 68, 85, 4, "#2C143B");

      // Antrenman Meydanı (Yeşim Taşlı Dövüş Zemini)
      p(0, H - 36, W, 36, "#243329");
      p(0, H - 36, W, 3, "#4ADE80"); // yeşim taş kenar
      // Kırmızı Fenerler (Tepede asılı)
      p(35, 20, 10, 14, "#DC2626");
      p(38, 34, 4, 6, "#FBBF24");
      p(W - 45, 20, 10, 14, "#DC2626");
      p(W - 42, 34, 4, 6, "#FBBF24");

      // Kiraz/Şeftali Çiçek Yaprakları
      this.cherryBlossoms.forEach((b) => {
        p(b.x, b.y, 3, 2, "#FDA4AF");
        p(b.x + 1, b.y + 1, 1, 1, "#FB7185");
      });

      // Vuruş Hedef Çemberleri (Sol ve Sağ Vuruş Alanı Göstergeleri)
      const leftTargetX = this.x - 48;
      const rightTargetX = this.x + 48;
      const targetZoneY = this.y - 10;

      // Sol Çember
      ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(leftTargetX, targetZoneY, 18, 0, Math.PI * 2);
      ctx.stroke();
      p(leftTargetX - 12, targetZoneY + 22, 24, 8, "rgba(0, 0, 0, 0.5)");
      ctx.fillStyle = "#FBBF24";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("SOL VUR", leftTargetX, targetZoneY + 28);

      // Sağ Çember
      ctx.beginPath();
      ctx.arc(rightTargetX, targetZoneY, 18, 0, Math.PI * 2);
      ctx.stroke();
      p(rightTargetX - 12, targetZoneY + 22, 24, 8, "rgba(0, 0, 0, 0.5)");
      ctx.fillText("SAĞ VUR", rightTargetX, targetZoneY + 28);

      // Uçan Mantılar & Nesneler
      this.targets.forEach((tg) => {
        const itemX = tg.side === "left" ? (this.x - tg.dist) : (this.x + tg.dist);
        const itemY = tg.y;

        if (tg.isDummy) {
          // Tahta Antrenman Kuklası
          p(itemX - 5, itemY - 6, 10, 14, "#92400E");
          p(itemX - 2, itemY - 9, 4, 3, "#B45309");
          p(itemX - 7, itemY - 2, 14, 3, "#78350F"); // sivri sopa
        } else if (tg.type === "manti") {
          // Buharlı Beyaz Mantı (Baozi)
          p(itemX - 6, itemY - 4, 12, 10, "#F8FAFC");
          p(itemX - 3, itemY - 7, 6, 4, "#E2E8F0");
          p(itemX, itemY - 10, 2, 3, "rgba(255,255,255,0.7)"); // buhar
        } else if (tg.type === "eriste") {
          // Kırmızı Erişte Kasesi
          p(itemX - 7, itemY - 2, 14, 9, "#DC2626");
          p(itemX - 6, itemY - 5, 12, 4, "#FDE047");
        } else {
          // Kutsal Şeftali
          p(itemX - 6, itemY - 5, 12, 12, "#FDA4AF");
          p(itemX - 3, itemY - 2, 6, 6, "#FB7185");
          p(itemX - 1, itemY - 8, 2, 3, "#15803D");
        }
      });

      // Ejderha Savaşçısı Altın Aurası (Kazanıldığında!)
      if (this.dragonAura) {
        ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
        ctx.beginPath();
        ctx.arc(this.x, this.y - 12, 38 + Math.sin(time * 10) * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Po the Panda Çizimi
      const px = Math.floor(this.x);
      const py = Math.floor(this.y);
      const bob = Math.sin(time * 8) * 1.5;

      // Kulaklar (Siyah)
      p(px - 16, py - 38 + bob, 8, 8, "#18181B");
      p(px + 8, py - 38 + bob, 8, 8, "#18181B");

      // Beyaz Tombul Kafa
      p(px - 14, py - 32 + bob, 28, 18, "#F4F4F5");
      // Siyah Göz Yamaları & Yeşil Gözler
      p(px - 11, py - 29 + bob, 8, 8, "#18181B");
      p(px + 3, py - 29 + bob, 8, 8, "#18181B");
      p(px - 8, py - 27 + bob, 3, 3, "#22C55E");
      p(px + 5, py - 27 + bob, 3, 3, "#22C55E");
      p(px - 2, py - 23 + bob, 4, 3, "#18181B"); // burun
      p(px - 4, py - 19 + bob, 8, 2, "#E11D48"); // gülen ağız

      // Siyah Kollar & Dev Beyaz Göbek
      p(px - 18, py - 14 + bob, 36, 18, "#18181B");
      p(px - 12, py - 12 + bob, 24, 18, "#F4F4F5"); // göbek

      // Kung-Fu Pantolonu
      p(px - 14, py + 2, 28, 10, "#D97706");
      p(px - 14, py, 28, 2, "#92400E");
      p(px - 12, py + 10, 8, 6, "#18181B");
      p(px + 4, py + 10, 8, 6, "#18181B");

      // Duruşa Göre Çubuk Hamlesi (Left / Right Strike)
      if (this.poStance === "strike-left") {
        // Sol vuruş çubuğu
        p(px - 34, py - 18, 22, 3, "#CA8A04");
        p(px - 36, py - 19, 4, 5, "#FEF08A"); // vuruş parıltısı
      } else if (this.poStance === "strike-right") {
        // Sağ vuruş çubuğu
        p(px + 12, py - 18, 22, 3, "#CA8A04");
        p(px + 32, py - 19, 4, 5, "#FEF08A");
      } else {
        // Hazır Bekleme Çubukları
        p(px - 16, py - 10, 10, 3, "#CA8A04");
        p(px + 6, py - 10, 10, 3, "#CA8A04");
      }
    }
  };


  /* =====================================================================
     ORTAK EFEKTLER & ZAFER YÖNETİMİ
     ===================================================================== */
  function addFloatingText(text, x, y, color = "#FFFFFF") {
    floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -45,
      alpha: 1,
      color: color
    });
  }

  function spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 90,
        vy: -20 - Math.random() * 60,
        life: 0.45 + Math.random() * 0.35,
        color: color
      });
    }
  }

  function spawnConfetti() {
    const colors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#FDE047"];
    for (let i = 0; i < 60; i++) {
      confetti.push({
        x: Math.random() * W,
        y: -10 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 45,
        vy: 45 + Math.random() * 75,
        color: colors[i % colors.length],
        w: 3 + Math.random() * 4,
        h: 5 + Math.random() * 6
      });
    }
  }

  function triggerVictory() {
    if (isWon) return;
    isWon = true;
    winTimer = 0;
    sfxWinFanfare();
    spawnConfetti();
  }

  function updateHUD() {
    const scoreVal = document.getElementById("cgScoreVal");
    const scoreFill = document.getElementById("cgScoreFill");
    if (scoreVal) scoreVal.textContent = score;
    if (scoreFill) {
      const pct = Math.min(100, Math.floor((score / TARGET_SCORE) * 100));
      scoreFill.style.width = `${pct}%`;
    }
  }

  /* =====================================================================
     KONTROLLER & ETKİLEŞİM
     ===================================================================== */
  function bindInput() {
    // Klavye Dinleyicisi
    window.addEventListener("keydown", (e) => {
      if (!isRunning || isWon) return;

      if (currentFilmId === 1) {
        // Flint: Sol / Sağ
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          GameFlint.targetX = Math.max(30, GameFlint.targetX - 40);
        } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
          GameFlint.targetX = Math.min(W - 30, GameFlint.targetX + 40);
        }
      } else if (currentFilmId === 2) {
        // Wall-E: Yukarı / Aşağı / Sol / Sağ
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") GameWallE.targetX -= 35;
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") GameWallE.targetX += 35;
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") GameWallE.targetY -= 25;
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") GameWallE.targetY += 25;
      } else if (currentFilmId === 3) {
        // Po: Sol Vuruş / Sağ Vuruş
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          GamePo.strike("left");
        } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
          GamePo.strike("right");
        }
      }
    });

    // Fare Hareketi ve Tıklama
    canvas.addEventListener("mousemove", (e) => {
      if (!isRunning || isWon) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      if (currentFilmId === 1) {
        GameFlint.targetX = Math.max(30, Math.min(W - 30, mx));
      } else if (currentFilmId === 2) {
        GameWallE.targetX = mx;
        GameWallE.targetY = my;
      }
    });

    canvas.addEventListener("click", (e) => {
      if (!isRunning || isWon) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const mx = (e.clientX - rect.left) * scaleX;

      if (currentFilmId === 3) {
        // Po: Ekranın soluna tıklanırsa SOL, sağına tıklanırsa SAĞ vuruş
        if (mx < W / 2) GamePo.strike("left");
        else GamePo.strike("right");
      }
    });

    // Dokunmatik (Mobil)
    canvas.addEventListener("touchmove", (e) => {
      if (!isRunning || isWon) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const tx = (touch.clientX - rect.left) * scaleX;
      const ty = (touch.clientY - rect.top) * scaleY;

      if (currentFilmId === 1) {
        GameFlint.targetX = Math.max(30, Math.min(W - 30, tx));
      } else if (currentFilmId === 2) {
        GameWallE.targetX = tx;
        GameWallE.targetY = ty;
      }
    }, { passive: false });

    canvas.addEventListener("touchstart", (e) => {
      getAudioCtx();
      if (!isRunning || isWon) return;
      if (currentFilmId === 3) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const tx = (touch.clientX - rect.left) * scaleX;
        if (tx < W / 2) GamePo.strike("left");
        else GamePo.strike("right");
      }
    }, { passive: true });

    // Ekran altındaki butonlar
    const btnLeft = document.getElementById("cgBtnLeft");
    const btnRight = document.getElementById("cgBtnRight");
    if (btnLeft) {
      btnLeft.onclick = () => {
        if (currentFilmId === 1) GameFlint.targetX = Math.max(30, GameFlint.targetX - 45);
        else if (currentFilmId === 2) GameWallE.targetX -= 40;
        else if (currentFilmId === 3) GamePo.strike("left");
      };
    }
    if (btnRight) {
      btnRight.onclick = () => {
        if (currentFilmId === 1) GameFlint.targetX = Math.min(W - 30, GameFlint.targetX + 45);
        else if (currentFilmId === 2) GameWallE.targetX += 40;
        else if (currentFilmId === 3) GamePo.strike("right");
      };
    }
  }

  /* =====================================================================
     ANA OYUN DÖNGÜSÜ (LOOP)
     ===================================================================== */
  function startLoop() {
    if (isRunning) return;
    isRunning = true;
    lastTime = performance.now();
    animId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
  }

  function loop(now) {
    if (!isRunning) return;
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    const time = now / 1000;

    // Aktif Oyunu Güncelle
    if (currentFilmId === 1) GameFlint.update(dt);
    else if (currentFilmId === 2) GameWallE.update(dt, time);
    else if (currentFilmId === 3) GamePo.update(dt);

    // Aktif Oyunu Çiz
    if (currentFilmId === 1) GameFlint.render(time);
    else if (currentFilmId === 2) GameWallE.render(time);
    else if (currentFilmId === 3) GamePo.render(time);

    // Parçacıkları Çiz ve Güncelle
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      p(pt.x, pt.y, 2, 2, pt.color);
      if (pt.life <= 0) particles.splice(i, 1);
    }

    // Uçan Metinleri Çiz
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.4;
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(ft.text, Math.floor(ft.x), Math.floor(ft.y));
      ctx.restore();
      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }

    // Zafer Kutlaması & Son Ekrana Geçiş
    if (isWon) {
      winTimer += dt;
      confetti.forEach((c) => {
        c.y += c.vy * dt;
        c.x += c.vx * dt;
        p(c.x, c.y, c.w, c.h, c.color);
      });

      // Şık Tebrik Bannerı
      p(W / 2 - 100, H / 2 - 38, 200, 64, "rgba(15, 23, 42, 0.94)");
      p(W / 2 - 100, H / 2 - 38, 200, 3, "#F59E0B");
      p(W / 2 - 100, H / 2 + 23, 200, 3, "#F59E0B");

      ctx.fillStyle = "#FBBF24";
      ctx.font = "bold 14px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("★ BÖLÜM GEÇİLDİ! ★", W / 2, H / 2 - 12);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "11px sans-serif";
      ctx.fillText("Harika bir iş çıkardın!", W / 2, H / 2 + 6);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "9px sans-serif";
      ctx.fillText("Son ekrana geçiliyor...", W / 2, H / 2 + 18);

      if (winTimer > 2.4 && onFinishCallback) {
        stopLoop();
        onFinishCallback(score);
        return;
      }
    }

    animId = requestAnimationFrame(loop);
  }

  /* =====================================================================
     BAŞLATMA METODU
     ===================================================================== */
  function init(canvasEl, filmId, onFinish) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    currentFilmId = parseInt(filmId, 10) || 1;
    onFinishCallback = onFinish;

    score = 0;
    isWon = false;
    winTimer = 0;
    floatingTexts = [];
    particles = [];
    confetti = [];

    // Seçilen oyunu başlat
    if (currentFilmId === 1) GameFlint.reset();
    else if (currentFilmId === 2) GameWallE.reset();
    else if (currentFilmId === 3) GamePo.reset();

    updateHUD();
    updateControlsUI(currentFilmId);
    bindInput();
    startLoop();
  }

  function updateControlsUI(filmId) {
    const desktopHint = document.querySelector(".desktop-hint");
    const mobileHint = document.querySelector(".mobile-hint");
    const btnLeft = document.getElementById("cgBtnLeft");
    const btnRight = document.getElementById("cgBtnRight");

    if (filmId === 1) {
      if (desktopHint) desktopHint.textContent = "← → veya Fare ile tepsiyi yönlendir, acı biberlerden kaç!";
      if (mobileHint) mobileHint.textContent = "Tepsiyi parmağınla kaydır";
      if (btnLeft) btnLeft.innerHTML = "&larr; Sol";
      if (btnRight) btnRight.innerHTML = "Sağ &rarr;";
    } else if (filmId === 2) {
      if (desktopHint) desktopHint.textContent = "Ok tuşları / W-A-S-D veya Fare ile Wall-E'yi yönlendir, hurdadan kaç!";
      if (mobileHint) mobileHint.textContent = "Wall-E'yi parmağınla hareket ettir";
      if (btnLeft) btnLeft.innerHTML = "&larr; Geri";
      if (btnRight) btnRight.innerHTML = "İleri &rarr;";
    } else if (filmId === 3) {
      if (desktopHint) desktopHint.textContent = "Sol Tık / A ile SOLA, Sağ Tık / D ile SAĞA vuruş yap!";
      if (mobileHint) mobileHint.textContent = "Ekranın soluna veya sağına dokun";
      if (btnLeft) btnLeft.innerHTML = "🥢 SOL VUR";
      if (btnRight) btnRight.innerHTML = "SAĞ VUR 🥢";
    }
  }

  return {
    init,
    stop: stopLoop
  };
})();

window.CinemaGame = CinemaGame;
