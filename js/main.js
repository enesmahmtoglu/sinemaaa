/* main.js — parçaları birleştiren yer.
 *
 * DEĞİŞTİRİLEBİLİR AYARLAR hemen aşağıda. Şarkıyı ve son sayfadaki
 * fotoğrafı buradan bağlıyorsun; başka hiçbir yere dokunmana gerek yok.
 */

const CONFIG = {
  // assets/audio/ içine koyduğun şarkının adı
  muzik: 'assets/audio/muzik.mp3',
  // assets/img/ içine koyduğun fotoğrafın adı
  foto: 'assets/img/son.jpg',
  // polaroidin altındaki küçük yazı
  fotoYazi: '27.08',
};

const PALET = {
  enes: [
    { ad: 'Baca kırmızısı', hex: '#B4382C' },
    { ad: 'Boğaz lacisi',   hex: '#1C4A63' },
    { ad: 'İskele pası',    hex: '#8C5A38' },
  ],
  ipek: [
    { ad: 'Yıldız yeşili',  hex: '#5C7F4E' },
    { ad: 'Çırağan sarısı', hex: '#DFAE3E' },
    { ad: 'Sedef pembe',    hex: '#E3A79E' },
  ],
};

(() => {
  const track = document.getElementById('track');
  const panels = Array.from(track.querySelectorAll('.panel'));
  const azHareket = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- palet kartları ---------------- */

  function swatch(r) {
    const li = document.createElement('li');
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.background = r.hex;
    const txt = document.createElement('span');
    txt.innerHTML = r.ad + '<span class="chip__hex">' + r.hex.toUpperCase() + '</span>';
    li.append(chip, txt);
    return li;
  }
  PALET.enes.forEach(r => document.getElementById('swEnes').appendChild(swatch(r)));
  PALET.ipek.forEach(r => document.getElementById('swIpek').appendChild(swatch(r)));

  /* ---------------- ray (alttaki noktalar) ---------------- */

  const rail = document.getElementById('rail');
  const dots = panels.map((p, i) => {
    const b = document.createElement('button');
    b.className = 'rail__dot';
    b.type = 'button';
    b.setAttribute('aria-label', (i === 0 ? 'Başa dön' : 'Durak ' + i));
    b.addEventListener('click', () => goto(i));
    rail.appendChild(b);
    return b;
  });

  /* scroll-snap ile programlı kaydırma çakışıyor: tarayıcı yumuşak
     kaydırmayı ilk durakta kesip bırakıyordu. Kaydırma boyunca snap'i
     kapatıp bitince geri açmak tek güvenilir çözüm. */
  let snapTimer = null;
  function goto(i) {
    const p = panels[i];
    const x = p.offsetLeft - (track.clientWidth - p.clientWidth) / 2;
    track.style.scrollSnapType = 'none';
    track.scrollTo({ left: x, behavior: azHareket ? 'auto' : 'smooth' });
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => { track.style.scrollSnapType = ''; }, 700);
  }

  /* ---------------- kaydırma ---------------- */

  let prog = 0, aktif = -1;

  function onScroll() {
    const max = track.scrollWidth - track.clientWidth;
    prog = max > 0 ? track.scrollLeft / max : 0;
    Sky.setProgress(prog);

    const orta = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestD = Infinity;
    panels.forEach((p, i) => {
      const d = Math.abs(p.offsetLeft + p.clientWidth / 2 - orta);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best !== aktif) {
      aktif = best;
      dots.forEach((d, i) => d.classList.toggle('is-on', i === aktif));
    }
    if (track.scrollLeft > 40) document.querySelector('.swipe')?.style.setProperty('opacity', '0');
    else document.querySelector('.swipe')?.style.setProperty('opacity', '1');
  }
  track.addEventListener('scroll', onScroll, { passive: true });

  /* masaüstünde fare tekerleği dikey döner — onu yataya çeviriyoruz */
  track.addEventListener('wheel', ev => {
    if (Game.isOpen()) return;
    if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) return;   // trackpad zaten yatay
    ev.preventDefault();
    track.scrollLeft += ev.deltaY;
  }, { passive: false });

  /* klavye */
  window.addEventListener('keydown', ev => {
    if (Game.isOpen()) return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); goto(Math.min(panels.length - 1, aktif + 1)); }
    if (ev.key === 'ArrowLeft')  { ev.preventDefault(); goto(Math.max(0, aktif - 1)); }
    if (ev.key === 'Home')       { ev.preventDefault(); goto(0); }
    if (ev.key === 'End')        { ev.preventDefault(); goto(panels.length - 1); }
  });

  /* ---------------- dioramalar ---------------- */

  const sahneler = Array.from(document.querySelectorAll('.diorama')).map(cv => {
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { cv, ctx, ad: cv.dataset.scene, panel: cv.closest('.panel') };
  });

  function gorunur(el) {
    const r = el.getBoundingClientRect();
    return r.right > -window.innerWidth * 0.6 && r.left < window.innerWidth * 1.6;
  }

  /* ---------------- çizim döngüsü ---------------- */

  Sky.init();
  Game.init();

  let sonKare = 0;
  function tick(now) {
    const t = now / 1000;
    if (now - sonKare > 62) {          // ~16 kare/sn yeter, pil yansın istemiyoruz
      sonKare = now;
      Sky.draw(t);
      for (const s of sahneler) {
        if (gorunur(s.panel)) Scenes.draw(s.ad, s.ctx, s.cv.width, s.cv.height, t);
      }
    }
    requestAnimationFrame(tick);
  }

  if (azHareket) {
    Sky.draw(0);
    sahneler.forEach(s => Scenes.draw(s.ad, s.ctx, s.cv.width, s.cv.height, 0));
  } else {
    requestAnimationFrame(tick);
  }

  /* ---------------- oyun ---------------- */

  document.getElementById('playBtn').addEventListener('click', () => Game.open());

  /* ---------------- müzik ---------------- */

  const audio = document.getElementById('track-audio');
  const sesBtn = document.getElementById('soundBtn');
  audio.src = CONFIG.muzik;
  audio.volume = 0;

  let calisiyor = false, fadeId = null;
  function fade(hedef, bitince) {
    clearInterval(fadeId);
    fadeId = setInterval(() => {
      const d = hedef - audio.volume;
      if (Math.abs(d) < 0.03) { audio.volume = hedef; clearInterval(fadeId); bitince && bitince(); return; }
      audio.volume = Math.max(0, Math.min(1, audio.volume + Math.sign(d) * 0.03));
    }, 40);
  }

  sesBtn.addEventListener('click', () => {
    if (!calisiyor) {
      audio.play().then(() => {
        calisiyor = true;
        sesBtn.setAttribute('aria-pressed', 'true');
        sesBtn.setAttribute('aria-label', 'Müziği kapat');
        fade(0.55);
      }).catch(() => {
        sesBtn.setAttribute('aria-label', 'Müzik dosyası bulunamadı');
        sesBtn.style.opacity = '.45';
      });
    } else {
      fade(0, () => audio.pause());
      calisiyor = false;
      sesBtn.setAttribute('aria-pressed', 'false');
      sesBtn.setAttribute('aria-label', 'Müziği aç');
    }
  });

  /* dosya yoksa düğmeyi sessizce soluklaştır */
  audio.addEventListener('error', () => { sesBtn.style.opacity = '.4'; sesBtn.title = 'assets/audio/ içine muzik.mp3 koy'; });

  /* ---------------- son karedeki fotoğraf ---------------- */

  const kutu = document.getElementById('polaroidImg');
  const cap = document.querySelector('.polaroid__cap');
  if (cap) cap.textContent = CONFIG.fotoYazi;
  const im = new Image();
  im.onload = () => {
    kutu.style.backgroundImage = 'url("' + CONFIG.foto + '")';
    kutu.classList.add('is-loaded');
  };
  im.src = CONFIG.foto;

  /* ---------------- ilk hâl ---------------- */

  onScroll();
  track.focus({ preventScroll: true });
})();
