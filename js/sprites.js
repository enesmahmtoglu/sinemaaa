/* sprites.js — elle yazılmış piksel figürler.
 *
 * Her figür bir satır dizisi, her harf bir piksel, '.' saydam.
 * Fok ile rakun masadaki iki peluşa bakılarak çizildi. İlk denemede
 * ikisi de asık suratlıydı: fokun gözleri düz siyah bloktu, rakununki
 * koyu maskenin içinde koyu yarıklar gibi duruyordu. İkisine de göz
 * parıltısı ve gülümseme eklendi, rakunun maskesi de açıldı.
 */

const Sprites = (() => {

  const PAL = {
    /* fok */
    w: '#FBF8F3',  s: '#EDE6DA',  e: '#1F1A17',  p: '#F3CDC4',
    /* rakun */
    g: '#9C8D7E',  G: '#7E7062',  d: '#6F5B4B',  l: '#F4EEE5',  L: '#E4DACB',  n: '#2A231E',
    /* ikisinde de göz parıltısı */
    h: '#FFFFFF',
    /* martı */
    m: '#F7F3EA',
    /* metro levhası */
    v: '#0A2A66',  B: '#FFFFFF',  K: '#E1051E',
  };

  /* --- fok: tombul, gözleri parlak, yanakları pembe --- */
  const FOK = [
    '.....wwwwwww.....',
    '...wwwwwwwwwww...',
    '..wwwwwwwwwwwww..',
    '.wwwwwwwwwwwwwss.',
    '.wwwhewwwwwhewss.',
    '.wwweewwwwweewss.',
    '.wpwwweeewwwpwss.',
    '.wwwwwwewwwwwwss.',
    '..wwwwwwwwwwwss..',
    '..wwwwwwwwwwwss..',
    '..wwwwwwwwwwwss..',
    '.wwwwwwwwwwwwwss.',
    'www..wwwwwww..sss',
  ];

  /* --- rakun: göz çevresinde iki leke, iri parlak gözler --- */
  const RAKUN = [
    '.GGGG.......GGGG.',
    '.GLLG.......GLLG.',
    '.GLLgggggggggLLG.',
    '.ggggggggggggggg.',
    '.ggggggggggggggg.',
    '.gglllllllllllgg.',
    '.ggdddllllldddgg.',
    '.ggdhnlllllhndgg.',
    '.ggdnnlllllnndgg.',
    '.ggdddllllldddgg.',
    '.gglllllllllllgg.',
    '.ggllllnnnllllgg.',
    '.gglllllnlllllgg.',
    '..gglllllllllgg..',
    '.gggglllllllgggg.',
    '.ggglllllllllggg.',
    'ggglllllllllllggg',
    '.LLLLgggggggLLLL.',
  ];

  /* --- martı: uzaktan iki piksellik bir çentik --- */
  const MARTI = [
    'mm...mm',
    '..mmm..',
  ];

  /* --- martı, kanat aşağıda --- */
  const MARTI2 = [
    '..m.m..',
    '.mmmmm.',
  ];

  /* --- metro levhası: lacivert daire, beyaz M, kırmızı ok --- */
  const METRO = [
    '....vvvvv....',
    '..vvvvvvvvv..',
    '.vBBvvvvvBBv.',
    'vvBBBvvvBBBvv',
    'vvBBBBvBBBBvv',
    'vvBBKKKKKBBvv',
    'vvBBKKKKKBBvv',
    'vvBBKKKKKBBvv',
    'vvBBKKKKKBBvv',
    '.vBBKKKKKBBv.',
    'KKKKKKKKKKKKK',
    '.KKKKKKKKKKK.',
    '..KKKKKKKKK..',
    '...KKKKKKK...',
    '....KKKKK....',
    '.....KKK.....',
    '......K......',
  ];

  function draw(ctx, art, x, y, opts = {}) {
    const scale = opts.scale || 1;
    const flip = !!opts.flip;
    const pal = opts.pal ? Object.assign({}, PAL, opts.pal) : PAL;
    const w = art[0].length;
    x = Math.round(x); y = Math.round(y);
    for (let r = 0; r < art.length; r++) {
      const row = art[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        const col = pal[ch];
        if (!col) continue;
        const cx = flip ? (w - 1 - c) : c;
        ctx.fillStyle = col;
        ctx.fillRect(x + cx * scale, y + r * scale, scale, scale);
      }
    }
  }

  function width(art)  { return art[0].length; }
  function height(art) { return art.length; }

  /* Figürlerin altına yassı bir gölge — yere basmalarını sağlıyor. */
  function shadow(ctx, cx, cy, rw, rh, color = 'rgba(15,40,58,0.20)') {
    ctx.fillStyle = color;
    for (let y = -rh; y <= rh; y++) {
      const t = 1 - (y * y) / (rh * rh + 0.0001);
      if (t <= 0) continue;
      const half = Math.round(rw * Math.sqrt(t));
      ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, 1);
    }
  }

  return { FOK, RAKUN, MARTI, MARTI2, METRO, PAL, draw, width, height, shadow };
})();
