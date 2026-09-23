/**
 * main.js — Sinema Gecesi Davetiyesi Ana Kontrolcüsü
 * ----------------------------------------------------
 * Sahne akışı, projektör ve toz partikülleri, ses kontrolleri,
 * gün ve film seçimleri, Firebase bağlantısı ve son ekran yönetimi.
 */

(function () {
  'use strict';

  // Uygulama Durumu (State)
  const state = {
    currentScreen: 1,
    selectedDay: null,       // "Bugün" | "Yarın"
    selectedMovieId: null,   // 1 | 2 | 3
    selectedMovieName: "",   // "Köfte Yağmuru" | "Wall-E" | "Kung Fu Panda 1"
    gameScore: 0
  };

  // Film Bilgileri Veritabanı
  const MOVIES = {
    1: {
      name: "Köfte Yağmuru",
      badge: "SEÇENEK 01",
      icon: "🍝",
      genre: "Animasyon / Macera / Komedi",
      tagline: "Gökyüzünden lezzet yağıyor! Çılgın mucit Flint ve spagetti kasırgaları seni bekliyor.",
      hero: "Flint Lockwood"
    },
    2: {
      name: "Wall-E",
      badge: "SEÇENEK 02",
      icon: "🌱",
      genre: "Animasyon / Bilim Kurgu / Romantik",
      tagline: "Dünyanın son çöp toplayıcısının kalpleri ısıtan, uzay boşluğuna uzanan büyülü serüveni.",
      hero: "Wall-E"
    },
    3: {
      name: "Kung Fu Panda 1",
      badge: "SEÇENEK 03",
      icon: "🥟",
      genre: "Animasyon / Dövüş Sanatları / Komedi",
      tagline: "Efsanevi Ejderha Savaşçısı Po'nun sıcacık mantılar eşliğinde kung-fu ustalığına giden yolu.",
      hero: "Panda Po"
    }
  };

  /* ==========================================================================
     1. PİKSEL SANAT AÇIK HAVA SİNEMASI (PIXEL-ART OPEN-AIR CINEMA)
     ========================================================================== */
  function initPixelOpenAirCinema() {
    const canvas = document.getElementById("projector-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Dahili Piksel Çözünürlüğü (Otantik 16-Bit Retro Oran)
    const PW = 360;
    const PH = 220;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = PW;
    offCanvas.height = PH;
    const octx = offCanvas.getContext("2d");
    octx.imageSmoothingEnabled = false;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Piksel Çizim Kısayolu
    function px(x, y, w, h, col) {
      octx.fillStyle = col;
      octx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    }

    // Yıldızlar
    const stars = [];
    for (let i = 0; i < 55; i++) {
      stars.push({
        x: Math.floor(Math.random() * PW),
        y: Math.floor(Math.random() * 110),
        size: Math.random() < 0.25 ? 2 : 1,
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 2.5
      });
    }

    // Akan Yıldız (Shooting Star)
    let shootingStar = null;
    let shootingTimer = 0;

    // Asılı Peri Masalı Işık Zinciri (String Lights)
    const lightBulbs = [];
    const bulbColors = ["#FDE047", "#F472B6", "#6EE7B7", "#FBBF24", "#60A5FA"];
    const wirePoints = 16;
    for (let i = 0; i < wirePoints; i++) {
      const t = i / (wirePoints - 1);
      const bx = 10 + t * (PW - 20);
      // Sarkma eğrisi
      const sag = Math.sin(t * Math.PI) * 16;
      const by = 16 + sag;
      lightBulbs.push({
        x: bx,
        y: by,
        color: bulbColors[i % bulbColors.length],
        pulse: Math.random() * Math.PI * 2
      });
    }

    // Ateş Böcekleri (Fireflies)
    const fireflies = [];
    for (let i = 0; i < 14; i++) {
      fireflies.push({
        x: Math.random() * PW,
        y: 120 + Math.random() * 90,
        baseY: 120 + Math.random() * 90,
        vx: (Math.random() - 0.5) * 12,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Projektör Toz Zerreleri
    const beamDust = [];
    for (let i = 0; i < 18; i++) {
      beamDust.push({
        t: Math.random(), // 0: projektör, 1: perde
        offsetY: (Math.random() - 0.5) * 20,
        speed: 0.15 + Math.random() * 0.25,
        alpha: 0.2 + Math.random() * 0.6
      });
    }

    let reelAngle = 0;
    let movieFrame = 0;
    let lastT = performance.now();

    function renderOpenAirCinema(now) {
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;
      const time = now / 1000;

      octx.clearRect(0, 0, PW, PH);

      // 1. GECE GÖKYÜZÜ (Koyu Gece Gradyanı & Dithering)
      const skyGrad = octx.createLinearGradient(0, 0, 0, PH);
      skyGrad.addColorStop(0, "#080C16");
      skyGrad.addColorStop(0.45, "#13162C");
      skyGrad.addColorStop(0.75, "#1E1A38");
      skyGrad.addColorStop(1, "#121C20");
      octx.fillStyle = skyGrad;
      octx.fillRect(0, 0, PW, PH);

      // Gökyüzü Piksel Dithering Çizgileri
      for (let dy = 65; dy < 110; dy += 6) {
        octx.fillStyle = "rgba(22, 28, 56, 0.4)";
        for (let dx = (dy % 4 === 0 ? 0 : 2); dx < PW; dx += 4) {
          octx.fillRect(dx, dy, 2, 1);
        }
      }

      // 2. PARILTI YILDIZLAR
      stars.forEach((s) => {
        const tw = (Math.sin(time * s.speed + s.phase) + 1) / 2;
        if (tw > 0.15) {
          const alpha = tw > 0.85 ? 1 : 0.55;
          octx.fillStyle = `rgba(254, 243, 199, ${alpha})`;
          octx.fillRect(s.x, s.y, s.size, s.size);
          if (s.size > 1 && tw > 0.7) {
            octx.fillStyle = `rgba(254, 243, 199, ${alpha * 0.4})`;
            octx.fillRect(s.x - 1, s.y, 3, 1);
            octx.fillRect(s.x, s.y - 1, 1, 3);
          }
        }
      });

      // 3. AKAN YILDIZ (Shooting Star)
      shootingTimer += dt;
      if (shootingTimer > 5.5 && !shootingStar) {
        shootingTimer = 0;
        if (Math.random() < 0.7) {
          shootingStar = {
            x: 40 + Math.random() * 200,
            y: 15 + Math.random() * 40,
            vx: 180 + Math.random() * 120,
            vy: 90 + Math.random() * 60,
            len: 14,
            life: 0.6
          };
        }
      }
      if (shootingStar) {
        shootingStar.x += shootingStar.vx * dt;
        shootingStar.y += shootingStar.vy * dt;
        shootingStar.life -= dt;
        octx.strokeStyle = `rgba(254, 240, 138, ${Math.max(0, shootingStar.life / 0.6)})`;
        octx.lineWidth = 1;
        octx.beginPath();
        octx.moveTo(shootingStar.x, shootingStar.y);
        octx.lineTo(shootingStar.x - shootingStar.vx * 0.05, shootingStar.y - shootingStar.vy * 0.05);
        octx.stroke();
        if (shootingStar.life <= 0) shootingStar = null;
      }

      // 4. HİLAL AY (Piksel Ay ve Halesi)
      const moonX = PW - 55, moonY = 32;
      // Hale
      octx.fillStyle = "rgba(254, 240, 138, 0.08)";
      octx.beginPath();
      octx.arc(moonX + 6, moonY + 6, 16, 0, Math.PI * 2);
      octx.fill();
      // Ay Hilali
      px(moonX + 3, moonY, 6, 2, "#FEF08A");
      px(moonX + 1, moonY + 2, 9, 2, "#FEF08A");
      px(moonX, moonY + 4, 10, 5, "#FEF08A");
      px(moonX + 1, moonY + 9, 9, 2, "#FEF08A");
      px(moonX + 3, moonY + 11, 6, 2, "#FEF08A");
      // İç oyuntu (Hilal formu)
      px(moonX + 4, moonY + 2, 7, 2, "#13162C");
      px(moonX + 3, moonY + 4, 8, 5, "#13162C");
      px(moonX + 4, moonY + 9, 7, 2, "#13162C");
      // Ay krateri detayı
      px(moonX + 1, moonY + 5, 2, 2, "#FDE047");

      // 5. UZAK DAĞLAR & AĞAÇ SİLÜETLERİ
      // Arka Dağ Sırası
      octx.fillStyle = "#121424";
      octx.beginPath();
      octx.moveTo(0, 115);
      octx.lineTo(60, 92);
      octx.lineTo(140, 110);
      octx.lineTo(210, 85);
      octx.lineTo(290, 105);
      octx.lineTo(PW, 88);
      octx.lineTo(PW, PH);
      octx.lineTo(0, PH);
      octx.fill();

      // Orta Sıra Çam Ağaçları
      octx.fillStyle = "#0A171B";
      for (let tx = 0; tx < PW; tx += 12) {
        const th = 20 + Math.sin(tx * 0.1) * 8;
        const ty = 120 - th;
        px(tx + 4, ty, 4, th, "#0A171B");
        px(tx + 2, ty + 4, 8, th - 4, "#0A171B");
        px(tx, ty + 8, 12, th - 8, "#0A171B");
      }

      // 6. ÇİMENLİK AÇIK HAVA ZEMİNİ (Arka ve Orta Katmanlar - Boşlukları Kapatır)
      // Arka Tepe Çimeni (y: 135'ten itibaren)
      octx.fillStyle = "#0B1D17";
      octx.beginPath();
      octx.moveTo(0, 142);
      octx.quadraticCurveTo(PW * 0.35, 134, PW * 0.7, 140);
      octx.quadraticCurveTo(PW * 0.88, 144, PW, 138);
      octx.lineTo(PW, PH);
      octx.lineTo(0, PH);
      octx.fill();

      // Orta Tepe Çimeni (y: 160'tan itibaren)
      octx.fillStyle = "#0E241D";
      octx.beginPath();
      octx.moveTo(0, 164);
      octx.quadraticCurveTo(PW * 0.4, 156, PW * 0.75, 162);
      octx.quadraticCurveTo(PW * 0.9, 166, PW, 160);
      octx.lineTo(PW, PH);
      octx.lineTo(0, PH);
      octx.fill();

      // 7. AÇIK HAVA SİNEMA PERDESİ (Yere Tam Oturan Ahşap Direkler & Kumaş)
      const screenX = 26, screenY = 62;
      const screenW = 86, screenH = 54;
      const poleBottomY = 186; // Çimenliğin içine kadar inen derinlik

      // Sol ve Sağ Ahşap Destek Direkleri (Tepeden toprağa kadar kesintisiz!)
      px(screenX - 4, screenY - 8, 4, poleBottomY - (screenY - 8), "#3D1E0B"); // sol direk
      px(screenX - 3, screenY - 8, 2, poleBottomY - (screenY - 8), "#6B3512");
      px(screenX + screenW, screenY - 8, 4, poleBottomY - (screenY - 8), "#3D1E0B"); // sağ direk
      px(screenX + screenW + 1, screenY - 8, 2, poleBottomY - (screenY - 8), "#6B3512");

      // Direk Altı Toprak ve Gölge (Yere temas hissi)
      px(screenX - 6, poleBottomY - 2, 8, 3, "#050D0A");
      px(screenX + screenW - 2, poleBottomY - 2, 8, 3, "#050D0A");

      // Ahşap Çapraz Takviye Kirişleri (Perdenin altında sağlam durması için)
      octx.strokeStyle = "#4D260E";
      octx.lineWidth = 2;
      octx.beginPath();
      octx.moveTo(screenX - 2, screenY + screenH + 2);
      octx.lineTo(screenX + screenW + 2, poleBottomY - 6);
      octx.moveTo(screenX + screenW + 2, screenY + screenH + 2);
      octx.lineTo(screenX - 2, poleBottomY - 6);
      octx.stroke();

      // Gergi İpleri & Yere Çakılı Ahşap Kazıklar (Ground Pegs)
      octx.strokeStyle = "#9A6538";
      octx.lineWidth = 1;
      octx.beginPath();
      octx.moveTo(screenX - 4, screenY + 4);
      octx.lineTo(screenX - 18, poleBottomY - 4);
      octx.moveTo(screenX + screenW + 4, screenY + 4);
      octx.lineTo(screenX + screenW + 18, poleBottomY - 4);
      octx.stroke();

      // Kazıklar
      px(screenX - 20, poleBottomY - 7, 4, 6, "#542A12");
      px(screenX + screenW + 16, poleBottomY - 7, 4, 6, "#542A12");

      // Perde Kumaşı (Beyaz/Açık Gri)
      px(screenX, screenY, screenW, screenH, "#0F172A"); // çerçeve gölgesi
      px(screenX + 2, screenY + 2, screenW - 4, screenH - 4, "#E2E8F0"); // bez yüzey
      px(screenX + 3, screenY + 3, screenW - 6, screenH - 6, "#F8FAFC");

      // Perde İçinde Oynayan Retro Film / Projeksiyon Işığı
      movieFrame = Math.floor(time * 3) % 4;
      const screenGlowFlicker = 0.85 + Math.sin(time * 18) * 0.12;
      octx.fillStyle = `rgba(186, 230, 253, ${screenGlowFlicker * 0.5})`;
      octx.fillRect(screenX + 4, screenY + 4, screenW - 8, screenH - 8);

      // Perde Üzerinde Dönen Klasik 35mm Geri Sayım / Film Çemberi
      const scX = screenX + screenW / 2;
      const scY = screenY + screenH / 2;
      octx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      octx.lineWidth = 1;
      octx.beginPath();
      octx.arc(scX, scY, 14, 0, Math.PI * 2);
      octx.stroke();
      octx.beginPath();
      octx.moveTo(scX, scY - 14);
      octx.lineTo(scX, scY + 14);
      octx.moveTo(scX - 14, scY);
      octx.lineTo(scX + 14, scY);
      octx.stroke();

      // Perde üzerindeki retro film sembolü (Yıldız / Kalp)
      px(scX - 3, scY - 3, 6, 6, "rgba(239, 68, 68, 0.7)");
      px(scX - 1, scY - 1, 2, 2, "rgba(254, 240, 138, 0.9)");

      // 8. VİNTAGE 35mm PROJEKTÖR & IŞIK KONİSİ (Yere Basan Tripod Ayakları)
      const projX = PW - 58;
      const projY = 114;
      const tripodGroundY = 186; // Tripodun çimene oturduğu yükseklik

      // Uzun Ahşap Tripod Ayakları (3 Bacak, Yere Kadar Uzanır)
      octx.strokeStyle = "#3A1A07";
      octx.lineWidth = 2;
      octx.beginPath();
      // Sol bacak (Dışa açılı)
      octx.moveTo(projX + 4, projY + 12);
      octx.lineTo(projX - 10, tripodGroundY);
      // Sağ bacak (Dışa açılı)
      octx.moveTo(projX + 14, projY + 12);
      octx.lineTo(projX + 26, tripodGroundY);
      // Orta bacak (Merkez)
      octx.moveTo(projX + 9, projY + 12);
      octx.lineTo(projX + 8, tripodGroundY + 2);
      octx.stroke();

      // Ayak pabuçları ve zemin gölgesi
      px(projX - 12, tripodGroundY - 2, 5, 3, "#1A0D04");
      px(projX + 24, tripodGroundY - 2, 5, 3, "#1A0D04");
      px(projX + 6, tripodGroundY, 5, 3, "#1A0D04");
      // Zemin gölge lekesi
      px(projX - 14, tripodGroundY + 1, 42, 3, "#050D0A");

      // Tripod Üst Başlığı (Mount)
      px(projX + 3, projY + 10, 12, 3, "#542A12");

      // Projektör Gövdesi
      px(projX, projY - 2, 18, 12, "#1E293B");
      px(projX + 2, projY, 14, 8, "#334155");
      px(projX - 3, projY + 2, 4, 5, "#94A3B8"); // Projeksiyon Lensi

      // Dönen İkili Film Makaraları (Twin Spinning Reels)
      reelAngle += dt * 4;
      // Sol Makara
      const r1x = projX + 4, r1y = projY - 7;
      px(r1x - 5, r1y - 5, 10, 10, "#475569");
      px(r1x - 3, r1y - 3, 6, 6, "#64748B");
      px(r1x - 1, r1y - 1, 2, 2, "#F8FAFC");
      // Sağ Makara
      const r2x = projX + 14, r2y = projY - 7;
      px(r2x - 5, r2y - 5, 10, 10, "#475569");
      px(r2x - 3, r2y - 3, 6, 6, "#64748B");
      px(r2x - 1, r2y - 1, 2, 2, "#F8FAFC");

      // IŞIK KONİSİ (Projektörden Açık Hava Perdesine Vuran Işık Hüzmesi)
      const beamGrad = octx.createRadialGradient(
        projX - 3, projY + 4, 4,
        screenX + screenW, screenY + screenH / 2, 210
      );
      const beamFlick = 0.12 + Math.sin(time * 22) * 0.035;
      beamGrad.addColorStop(0, `rgba(254, 249, 195, ${beamFlick * 1.8})`);
      beamGrad.addColorStop(0.35, `rgba(224, 242, 254, ${beamFlick})`);
      beamGrad.addColorStop(1, "transparent");

      octx.fillStyle = beamGrad;
      octx.beginPath();
      octx.moveTo(projX - 3, projY + 4);
      octx.lineTo(screenX + screenW + 2, screenY);
      octx.lineTo(screenX + screenW + 2, screenY + screenH);
      octx.closePath();
      octx.fill();

      // Işık Demeti İçindeki Toz Zerreleri
      beamDust.forEach((d) => {
        d.t += d.speed * dt;
        if (d.t > 1) d.t = 0;
        const dx = (projX - 3) + (screenX + screenW - (projX - 3)) * d.t;
        const spread = (d.t * screenH * 0.45);
        const dy = (projY + 4) + (screenY + screenH / 2 - (projY + 4)) * d.t + d.offsetY * (d.t * 1.2);
        octx.fillStyle = `rgba(255, 255, 255, ${d.alpha * beamFlick * 3.5})`;
        octx.fillRect(Math.floor(dx), Math.floor(dy), 1, 1);
      });

      // 9. ASILI PERİ MASALI IŞIKLARI (FESTIVAL STRING LIGHTS)
      // Sarkıt İpi
      octx.strokeStyle = "rgba(71, 85, 105, 0.6)";
      octx.lineWidth = 1;
      octx.beginPath();
      lightBulbs.forEach((b, idx) => {
        if (idx === 0) octx.moveTo(b.x, b.y);
        else octx.lineTo(b.x, b.y);
      });
      octx.stroke();

      // Ampuller ve Halesi
      lightBulbs.forEach((b) => {
        const glow = 0.4 + Math.sin(time * 3 + b.pulse) * 0.35;
        // Dış hale
        octx.fillStyle = `rgba(254, 240, 138, ${glow * 0.25})`;
        octx.fillRect(b.x - 2, b.y - 1, 5, 5);
        // Ampul çekirdeği
        px(b.x - 1, b.y, 3, 3, b.color);
        px(b.x, b.y + 1, 1, 1, "#FFFFFF");
      });

      // 10. ÖN PLAN ÇİMLER, PİKNİK ALANI & MISIR KOVASI
      // Ön Zemin Çimeni (y: 184'ten PH'a kadar)
      px(0, PH - 34, PW, 34, "#0A1612");
      px(0, PH - 34, PW, 3, "#132D24");
      // Çimen Papatyaları ve Çıkıntıları
      for (let gx = 0; gx < PW; gx += 8) {
        px(gx + 2, PH - 37, 2, 4, "#1A4032");
        px(gx + 4, PH - 36, 2, 3, "#235341");
      }

      // Kırmızı-Beyaz Ekose Piknik Örtüsü
      const rugX = 145, rugY = PH - 24;
      px(rugX, rugY, 44, 16, "#991B1B");
      for (let rx = 0; rx < 44; rx += 8) {
        px(rugX + rx, rugY, 4, 16, "#F8FAFC");
      }
      for (let ry = 0; ry < 16; ry += 6) {
        px(rugX, rugY + ry, 44, 2, "rgba(255, 255, 255, 0.4)");
      }
      // Örtü püskülleri
      px(rugX - 2, rugY + 4, 2, 8, "#E2E8F0");
      px(rugX + 44, rugY + 4, 2, 8, "#E2E8F0");

      // Patlamış Mısır Kutusu (Popcorn Bucket)
      const popX = rugX + 48, popY = PH - 30;
      px(popX, popY + 4, 12, 18, "#DC2626"); // kırmızı kutu
      px(popX + 3, popY + 4, 3, 18, "#FFFFFF"); // beyaz şerit
      px(popX + 8, popY + 4, 3, 18, "#FFFFFF");
      // Taşan Sarı Mısırlar
      px(popX - 1, popY + 1, 4, 4, "#FDE047");
      px(popX + 3, popY - 1, 6, 5, "#FEF08A");
      px(popX + 8, popY + 1, 4, 4, "#FDE047");
      px(popX + 5, popY + 1, 2, 2, "#F59E0B");

      // Şezlong / Bahçe Minderi Silüeti
      px(rugX - 32, PH - 26, 24, 14, "#1E293B");
      px(rugX - 34, PH - 30, 8, 14, "#334155");

      // 10. ATEŞ BÖCEKLERİ (FIREFLIES)
      fireflies.forEach((f) => {
        f.x += f.vx * dt;
        f.y = f.baseY + Math.sin(time * 2 + f.phase) * 6;
        if (f.x < -10) f.x = PW + 10;
        if (f.x > PW + 10) f.x = -10;

        const fGlow = (Math.sin(time * 3 + f.phase) + 1) / 2;
        if (fGlow > 0.2) {
          octx.fillStyle = `rgba(163, 230, 53, ${fGlow * 0.35})`;
          octx.fillRect(Math.floor(f.x) - 1, Math.floor(f.y) - 1, 3, 3);
          px(f.x, f.y, 1, 1, "#FACC15");
        }
      });

      // 11. DAHİLİ PİKSEL ÇİZİMİNİ EKRANA BLİTLEME (Piksel Netliğinde Büyütme)
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offCanvas, 0, 0, width, height);

      requestAnimationFrame(renderOpenAirCinema);
    }

    requestAnimationFrame(renderOpenAirCinema);
  }

  /* ==========================================================================
     2. SES KONTROLÜ (ARKA PLAN MÜZİĞİ & MOBİL OTO-BAŞLATICI)
     ========================================================================== */
  let playMusic = () => {};

  function initAudioController() {
    const audio = document.getElementById("track-audio");
    const toggleBtn = document.getElementById("audioToggle");
    if (!audio || !toggleBtn) return;

    let isPlaying = false;

    playMusic = function() {
      if (isPlaying) return;
      audio.play().then(() => {
        toggleBtn.classList.add("is-playing");
        toggleBtn.querySelector(".audio-toggle__text").textContent = "Müzik Çalıyor";
        isPlaying = true;
      }).catch((err) => {
        // Tarayıcı henüz izin vermediyse sessizce bekle
      });
    };

    function pauseMusic() {
      audio.pause();
      toggleBtn.classList.remove("is-playing");
      toggleBtn.querySelector(".audio-toggle__text").textContent = "Müziği Aç";
      isPlaying = false;
    }

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isPlaying) pauseMusic();
      else playMusic();
    });

    // 1. Sayfa açılır açılmaz çalmayı dene (Bazı tarayıcılarda serbesttir)
    playMusic();

    // 2. Mobilde ekrana yapılan İLK DOKUNUŞTA (kaydırma, dokunma, tıklama) müziği başlat
    const unlockAudio = () => {
      playMusic();
      document.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("touchend", unlockAudio);
      document.removeEventListener("click", unlockAudio);
    };

    document.addEventListener("pointerdown", unlockAudio, { passive: true });
    document.addEventListener("touchstart", unlockAudio, { passive: true });
    document.addEventListener("touchend", unlockAudio, { passive: true });
    document.addEventListener("click", unlockAudio, { passive: true });
  }

  /* ==========================================================================
     3. EKRAN GEÇİŞ YÖNETİMİ
     ========================================================================== */
  function goToScreen(screenNumber) {
    state.currentScreen = screenNumber;

    document.querySelectorAll(".screen-panel").forEach((panel) => {
      panel.classList.remove("active");
    });

    const targetPanel = document.getElementById(`screen-${screenNumber}`);
    if (targetPanel) {
      targetPanel.classList.add("active");
      const stage = document.querySelector(".cinema-stage");
      if (stage) stage.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  /* ==========================================================================
     4. EKRAN 1 — GİRİŞ BİLETİ
     ========================================================================== */
  function setupScreen1() {
    const btnStart = document.getElementById("btnStartInvite");
    if (btnStart) {
      btnStart.addEventListener("click", () => {
        // İlk butona tıklandığı an müziği kesin olarak başlat
        if (typeof playMusic === "function") playMusic();
        goToScreen(2);
      });
    }
  }

  /* ==========================================================================
     5. EKRAN 2 — GÜN SEÇİMİ (BUGÜN / YARIN)
     ========================================================================== */
  function setupScreen2() {
    const btnToday = document.getElementById("btnDayToday");
    const btnTomorrow = document.getElementById("btnDayTomorrow");

    function handleDaySelect(dayText, btnEl) {
      state.selectedDay = dayText;

      // Damga animasyonunu tetikle
      document.querySelectorAll(".btn-day-stamp").forEach((b) => b.classList.remove("stamped"));
      btnEl.classList.add("stamped");

      // Hafif beklemeden sonra 3. ekrana geç
      setTimeout(() => {
        goToScreen(3);
      }, 700);
    }

    if (btnToday) {
      btnToday.addEventListener("click", () => handleDaySelect("Bugün", btnToday));
    }
    if (btnTomorrow) {
      btnTomorrow.addEventListener("click", () => handleDaySelect("Yarın", btnTomorrow));
    }
  }

  /* ==========================================================================
     6. EKRAN 3 — 3 GİZEMLİ SÜRPRİZ FİLM KUTUSU
     ========================================================================== */
  function setupScreen3() {
    const mysteryBoxes = document.querySelectorAll(".mystery-box");
    const btnProceed = document.getElementById("btnProceedGame");

    mysteryBoxes.forEach((box) => {
      box.addEventListener("click", () => {
        const filmId = parseInt(box.dataset.filmId, 10);
        const movieData = MOVIES[filmId];
        if (!movieData) return;

        state.selectedMovieId = filmId;
        state.selectedMovieName = movieData.name;

        // Tüm kutulardan seçimi kaldır, tıklanana ver
        mysteryBoxes.forEach((b) => {
          b.classList.remove("selected");
          b.classList.remove("revealed");
        });

        box.classList.add("selected");
        box.classList.add("revealed");

        // Başlığı ve açıklamayı gizemden çıkarıp göster
        const titleEl = box.querySelector(".mystery-title");
        const descEl = box.querySelector(".mystery-desc");
        const iconEl = box.querySelector(".mystery-icon");

        if (titleEl) titleEl.textContent = movieData.name;
        if (descEl) descEl.textContent = movieData.tagline;
        if (iconEl) iconEl.textContent = movieData.icon;

        // Veritabanına (Firebase & localStorage) derhal kaydet
        if (window.CinemaDB && typeof window.CinemaDB.saveRSVP === "function") {
          window.CinemaDB.saveRSVP({
            day: state.selectedDay,
            movie: state.selectedMovieName
          });
        }

        // Oyuna geç butonunu görünür kıl
        if (btnProceed) {
          btnProceed.classList.add("visible");
          btnProceed.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    });

    if (btnProceed) {
      btnProceed.addEventListener("click", () => {
        if (!state.selectedMovieId) return;
        startMiniGame(state.selectedMovieId);
      });
    }
  }

  /* ==========================================================================
     7. EKRAN 4 — PİKSEL MİNİ OYUN BAŞLATMA
     ========================================================================== */
  function startMiniGame(filmId) {
    goToScreen(4);

    const canvas = document.getElementById("cinemaGameCanvas");
    const movieData = MOVIES[filmId];

    // Kabin başlıklarını güncelle
    const cabinetTitle = document.getElementById("cgCabinetTitle");
    const heroName = document.getElementById("cgHeroName");

    if (cabinetTitle && movieData) {
      cabinetTitle.textContent = `${movieData.name.toUpperCase()} PİKSEL OYUNU`;
    }
    if (heroName && movieData) {
      heroName.textContent = movieData.hero;
    }

    // Oyunu başlat
    if (window.CinemaGame && canvas) {
      window.CinemaGame.init(canvas, filmId, (finalScore) => {
        state.gameScore = finalScore;
        // Zafer sonrası son ekrana geç
        renderFinalScreen();
        goToScreen(5);
      });
    }
  }

  /* ==========================================================================
     8. EKRAN 5 — SON EKRAN (HATIRA BİLETİ & MESAJ)
     ========================================================================== */
  function renderFinalScreen() {
    const finalDay = document.getElementById("finalSelectedDay");
    const finalMovie = document.getElementById("finalSelectedMovie");
    const finalScore = document.getElementById("finalScoreAchieved");
    const btnShare = document.getElementById("btnShareWhatsApp");
    const btnReplay = document.getElementById("btnReplayAll");

    if (finalDay) finalDay.textContent = state.selectedDay || "Bugün";
    if (finalMovie) finalMovie.textContent = state.selectedMovieName || "Sürpriz Film";
    if (finalScore) finalScore.textContent = `${state.gameScore || 10} / 10`;

    // WhatsApp'ta Tek Tıkla Paylaşım Linki
    if (btnShare) {
      const msg = encodeURIComponent(
        `Selam! Sinema gecesi davetiyeni açtım ve seçimimi yaptım 🎬🍿\n\n` +
        `📅 Gün: ${state.selectedDay || 'Bugün'}\n` +
        `🎞️ Film: ${state.selectedMovieName || 'Köfte Yağmuru'}\n` +
        `🎮 Piksel Oyun Skorum: ${state.gameScore || 10} puan!\n\n` +
        `Hazırım, mesajını bekliyorum! ✨`
      );
      btnShare.onclick = () => {
        window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
      };
    }

    if (btnReplay) {
      btnReplay.onclick = () => {
        goToScreen(1);
      };
    }
  }

  /* ==========================================================================
     BAŞLATICI (DOM READY)
     ========================================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    initPixelOpenAirCinema();
    initAudioController();
    setupScreen1();
    setupScreen2();
    setupScreen3();
  });

})();
