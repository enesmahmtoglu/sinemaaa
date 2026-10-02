# İki Dünya Arasında Bir Davet

İpek için hazırlanmış, *Soul* (2020) ve *The Nightmare Before Christmas* temalı etkileşimli film gecesi davetiyesi.

Saf HTML, CSS ve JavaScript ile yazıldı. Derleme adımı ya da paket bağımlılığı yok. Telefonda, dikey ekranda açılmak üzere tasarlandı.

## Akış

| # | Sahne | Ne oluyor |
|---|---|---|
| 0 | **Mühür** | Zarfın mührü basılı tutulunca ısınıp çatlar; şarkı o an başlar. |
| 1 | **Kıvılcım** | Parmağı takip eden bir ışık. İsim kendiliğinden yazılır, kıvılcım halkaya götürülür. |
| 2 | **Kişilik Salonu** | Beş rozet dolar, "Dünya Bileti" mühürlenir ve çevrilir. |
| 3 | **Gün** | İki piyano tuşu: Bugün / Yarın. Her tuş gökyüzünü o akşama götürür. |
| 4 | **Geçit** | Gökyüzü bir dikiş hattından yırtılır, altından Halloween Town çıkar. Şarkı bir an boğuklaşır. |
| 5 | **Ağaç kapıları** | Film seçimi. İlk dokunuş kapıyı çalar, ikincisi açar. |
| 6 | **Mini oyun** | Soul: düşen tohumları yakala. Nightmare: Zero'nun burnuyla sisin altındakileri bul. Ödül: anı fotoğrafları. |
| 7 | **Bilet** | Koçan aşağı çekilip yırtılır; seçim Firebase'e kaydedilir. |
| 8 | **Jenerik** | Film jeneriği ve kapanış. |

Gizli: aya üç kez dokununca bir not açılır.

## Dosyalar

- `index.html`: tüm sahnelerin iskeleti ve çizimler (SVG)
- `css/app.css`: iki dünyanın görsel dili
- `js/audio.js`: şarkı, ritim takibi, geçitteki filtre, sentezlenmiş efekt sesleri
- `js/fx.js`: parçacık katmanı, kıvılcım, elle yazılma efekti
- `js/games.js`: iki mini oyun ve fotoğraflar
- `js/app.js`: sahne akışı ve geçişler
- `js/firebase-config.js`: Firestore kaydı (`cinema_invites` koleksiyonu)

## Yerelde çalıştırma

Ritim analizi ve ses filtresi `file://` üzerinden çalışmaz; bir yerel sunucu kullanın:

```bash
python -m http.server 5173
```

Belirli bir sahneden başlamak için (bu modda Firebase'e kayıt yapılmaz):
`http://localhost:5173/?sahne=forest`, `?sahne=game&film=nightmare`, `?sahne=ticket`…
