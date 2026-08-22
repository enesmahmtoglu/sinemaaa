# 27 Ağustos

Bir buluşma davetiyesi. Rota soldan sağa akıyor:
Kadıköy → vapur → Beşiktaş → Yıldız Parkı → Çırağan → dönüş.

Saf HTML, CSS ve JavaScript. Build adımı yok, bağımlılık yok, çerçeve yok.

## Açmak için

`index.html` dosyasını tarayıcıda aç. Hepsi bu.

## Neyi nereden değiştirirsin

| Ne | Nerede |
|---|---|
| Şarkı ve fotoğraf dosya adı | `js/main.js` &rarr; en üstteki `CONFIG` |
| Altı rengin adı ve kodu | `js/main.js` &rarr; `PALET` |
| Durak metinleri | `index.html` &rarr; ilgili `<section>` içindeki `ticket__body` |
| Saatler | `index.html` &rarr; `ticket__head` içindeki ikinci `<span>` |
| Sürpriz durağının yazısı | `index.html` &rarr; `ticket--secret` içindeki `ticket__body` |

## Dosyaları koyacağın yerler

- Şarkı &rarr; `assets/audio/muzik.mp3`
- Son sayfadaki fotoğraf &rarr; `assets/img/son.jpg`

Adları farklıysa `js/main.js` içindeki `CONFIG` satırlarını güncelle.
Dosya yoksa site yine çalışır: ses düğmesi soluklaşır, fotoğrafın yerinde
boş bir polaroid durur.

## Dosya yapısı

```
index.html        yapı ve bütün metinler
css/style.css     düzen, bilet kartları, tipografi
js/iso.js         izometrik piksel çizim motoru
js/sprites.js     elle yazılmış piksel figürler (fok, rakun, martı)
js/scenes.js      sekiz izometrik diorama
js/sky.js         sabit Boğaz manzarası, saate göre değişen ışık
js/game.js        vapur geçişi mini oyunu
js/main.js        ayarlar, kaydırma, ses, fotoğraf
tools/figur.py    fok, rakun ve metro levhasını üreten betik
```

## Notlar

- Sayfa yatay kaydırılır. Telefonda parmakla, masaüstünde fare tekerleğiyle
  ya da ok tuşlarıyla.
- Gökyüzü sayfa boyunca öğleden akşama döner; son durakta ufuk, vapur
  bacasının kırmızısına iner.
- Piksel figürler hazır görsel değil. Fok, rakun ve metro levhası
  `tools/figur.py` ile üretiliyor: gövde elips olarak taranıp ışığa göre
  tonlanıyor, gözler ve burun üstüne elle basılıyor. Çıktı `js/sprites.js`
  içine harf harf yazılıyor. Şekli değiştirmek için `tools/figur.py`,
  sadece rengi değiştirmek için `js/sprites.js` içindeki `PAL` tablosu.
- `noindex` etiketi var: arama motorlarına düşmez, linki bilen açar.
