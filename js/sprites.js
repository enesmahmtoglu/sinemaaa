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
    /* fok: açıktan koyuya dört ton */
    '1': '#FFFFFF', '2': '#F7F1E6', '3': '#E4D8C6', '4': '#CBBCA6',
    p: '#F0C6BC',   e: '#221D19',   h: '#FFFFFF',
    /* rakun kürkü ve kremi */
    '5': '#B5A694', '6': '#A0917F', '7': '#89796A', '8': '#6E6153',
    a: '#FBF6EE',   b: '#EDE3D4',   c: '#D8CAB6',
    m: '#6E5A49',   k: '#54432F',   n: '#2A231E',
    /* martı */
    G: '#F7F3EA',
    /* metro levhası */
    v: '#0A2A66',  B: '#FFFFFF',  K: '#E1051E',
  };

  /* --- fok: tombul, gözleri parlak, yanakları pembe --- */
  const FOK = [
    '............222.............',
    '........12222222222.........',
    '......122222222222222.......',
    '.....22222222222222233......',
    '....2222222222222222333.....',
    '....2221222222222222333.....',
    '...221222222222222222233....',
    '...222222222222222222333....',
    '...22222hhe222222hhe2333....',
    '..222222eee222222eee33333...',
    '..222222eee222222eee33333...',
    '..222ppp22222222223ppp333...',
    '..222ppp22222222233ppp333...',
    '..2222pp2222eeee333pp3333...',
    '..22222222222ee3333333344...',
    '..33333223333333333333333...',
    '333333333333333333333333344.',
    '333333334333333333333333444.',
    '333333444333333334333444444.',
    '.4444444333333444444444444..',
    '.........444444444..........',
    '............................',
  ];

  /* --- rakun: göz çevresinde iki leke, iri parlak gözler --- */
  const RAKUN = [
    '.....666............666.....',
    '...6666667.666666.6666667...',
    '...6666656666666666666667...',
    '..666bb56666666666666bb777..',
    '..66bb6666666666666667bb78..',
    '...6b6666666aaa66666677b7...',
    '...766666aaaaaaabb6677778...',
    '....6666aaaaaaaabbbb7777....',
    '...666mmmmmaaaabbmmmm7777...',
    '...666mmhhnkaaabmhhnkk777...',
    '...66ammnnnkabbbmnnnkk777...',
    '...66amknnnabbbbmnnnkk778...',
    '...66bkkkkkbbbbbbkkkkc788...',
    '....6bbbbbbbbbbbbbbccc88....',
    '....7bbbbbbbbbbbbccccc88....',
    '.....7bbbbbbnnnncccccc8.....',
    '......bbbbbbbnncccccc8......',
    '.......bbbcccccccccc8.......',
    '........7cccccccccc8........',
    '.......6666ccccc86677.......',
    '.....66666aaaaaabb67777.....',
    '....66776aaaaaabbbb77778....',
    '...666776aaaaabbbbb777788...',
    '...66777aaaaabbbbbcc78888...',
    '...77778bbbbbbbbbbcc88888...',
    '...77788bbbbbbbbcccc88888...',
    '....88877bbbbbbcccc88888....',
    '.......7aaabccccaaab8.......',
    '.......aabbbcccaabbbc.......',
    '.......bbbbcc88bbbbcc.......',
  ];

  /* --- martı: uzaktan iki piksellik bir çentik --- */
  const MARTI = [
    'GG.......GG',
    '.GGG...GGG.',
    '...GGGGG...',
  ];

  /* --- martı, kanat aşağıda --- */
  const MARTI2 = [
    '...GGGGG...',
    '.GGG...GGG.',
    'GG.......GG',
  ];

  /* --- metro levhası: lacivert daire, beyaz M, kırmızı ok --- */
  const METRO = [
    '.......vvvvvvv.......',
    '.....vvvvvvvvvvv.....',
    '....vvvvvvvvvvvvv....',
    '...vvvvvvvvvvvvvvv...',
    '..vBBBBvvvvvvvBBBBv..',
    '.vvBBBBBvvvvvBBBBBvv.',
    '.vvBBBBBvvvvvBBBBBvv.',
    'vvvBBBBBBvvvBBBBBBvvv',
    'vvvBBBBBBvvvBBBBBBvvv',
    'vvvBBBvBKKKKKBvBBBvvv',
    'vvvBBBvBKKKKKBvBBBvvv',
    'vvvBBBvvKKKKKvvBBBvvv',
    'vvvBBBvvKKKKKvvBBBvvv',
    '.vvBBBvvKKKKKvvBBBvv.',
    '.vvBBBvvKKKKKvvBBBvv.',
    '..vBBBvvKKKKKvvBBBv..',
    '...BBBvvKKKKKvvBBB...',
    '...BBBvvKKKKKvvBBB...',
    'KKKKKKKKKKKKKKKKKKKKK',
    '.KKKKKKKKKKKKKKKKKKKK',
    '..KKKKKKKKKKKKKKKKKK.',
    '....KKKKKKKKKKKKKK...',
    '.....KKKKKKKKKKKK....',
    '......KKKKKKKKKK.....',
    '.......KKKKKKKK......',
    '........KKKKKK.......',
    '..........KK.........',
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
