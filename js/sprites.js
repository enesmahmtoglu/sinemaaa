/* sprites.js — elle yazılmış piksel figürler.
 *
 * Her figür bir satır dizisi. Her harf bir piksel, '.' saydam.
 * Hazır görsel indirmek yerine böyle yazdım: dosya birkaç kilobayt
 * kalıyor ve rengi paletle beraber değiştirebiliyorum.
 */

const Sprites = (() => {

  const PAL = {
    /* fok */
    w: '#F2EBDD',  s: '#DBD0BC',  e: '#2B2119',  p: '#C98F84',
    /* rakun */
    g: '#7E8892',  G: '#5E6975',  d: '#2A2C31',  l: '#DCDFE2',  n: '#1E1F22',
    /* martı */
    m: '#F7F3EA',  M: '#CFC7B6',
    /* hediye */
    r: '#B4382C',  R: '#8E2A21',  k: '#DFAE3E',
  };

  /* --- fok: önden, tombul, iki yüzgeç --- */
  const FOK = [
    '....wwwww....',
    '..wwwwwwwww..',
    '.wwwwwwwwwss.',
    '.wwewwwwwews.',
    '.wwwwwpwwwws.',
    '.wwwwwwwwwss.',
    '..wwwwwwwss..',
    '..swwwwwwss..',
    '.sswwwwwwwss.',
    '..ss.....ss..',
  ];

  /* --- rakun: maskesi, çizgili kuyruğu sağda --- */
  const RAKUN = [
    '..dd.....dd..',
    '..gggg.gggg..',
    '.ggggggggggg.',
    '.gglllllllgg.',
    '.gddldddlddg.',
    '.gglllllllgg.',
    '.gglllnlllgg.',
    '.ggglllllggg.',
    '..gggggggGG..',
    '..gggggggGd..',
    '..ggggggGdl..',
    '..gggggGdld..',
    '...ggg..dld..',
  ];

  /* --- martı: uzaktan üç piksellik bir çentik --- */
  const MARTI = [
    'mm...mm',
    '..mmm..',
  ];
  const MARTI2 = [
    '..m.m..',
    '.mmmmm.',
  ];

  /* --- metro levhası: kırmızı zemin, beyaz M --- */
  const M4 = [
    'rrrrrrrrr',
    'rrrrrrrrr',
    'rrwrrrwrr',
    'rrwwrwwrr',
    'rrwrwrwrr',
    'rrwrrrwrr',
    'rrwrrrwrr',
    'rrrrrrrrr',
    'rRRRRRRRr',
  ];

  /* --- hediye kutusu: kurdeleli --- */
  const KUTU = [
    '...kk...',
    '..kkkk..',
    'rrrkkrrr',
    'RRRkkRRR',
    'rrrkkrrr',
    'rrrkkrrr',
    'RRRkkRRR',
    'RRRRRRRR',
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

  return { FOK, RAKUN, MARTI, MARTI2, M4, KUTU, PAL, draw, width, height, shadow };
})();
