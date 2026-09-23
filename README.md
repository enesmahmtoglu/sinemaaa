# 🍿 Sinema Gecesi Davetiyesi

Özel bir sinema gecesi için hazırlanmış, zanaat odaklı ve retro estetiğe sahip etkileşimli bir web davetiyesi.

Saf HTML, modern CSS ve modüler JavaScript. Build/derleme adımı yok, bağımlılık yok, çerçeve karmaşası yok. Doğrudan tarayıcıda çalışır.

---

## 🎬 Akış ve Deneyim

1. **Giriş Bileti:** Yırtılabilir kuponlu, vintage sinema kulübü giriş bileti ve "Bileti Aç & Keşfet" butonu.
2. **Gün Seçimi:** "Bugün" ve "Yarın" seçenekleri için fiziksel ıstampa mührü basma animasyonu.
3. **3 Gizemli Film Kutusu:**
   - 1. Seçenek: **Köfte Yağmuru** (Cloudy with a Chance of Meatballs)
   - 2. Seçenek: **Wall-E**
   - 3. Seçenek: **Kung Fu Panda 1**
   - Seçilen gün ve film otomatik olarak veritabanına kaydedilir.
4. **Retro Piksel Mini Oyun:**
   - Seçilen filme göre dinamik değişen el yapımı piksel karakterler:
     - Köfte Yağmuru &rarr; **Flint Lockwood** havadan yağan köfte, burger ve spagettileri yakalar.
     - Wall-E &rarr; **Wall-E** bot içindeki filizi, pilleri ve kasetleri toplar.
     - Kung Fu Panda &rarr; **Panda Po** buharlı mantıları, erişteleri ve şeftalileri kapar.
   - 10 puan toplandığında zafer konfetisi ve ses efekti eşliğinde otomatik son ekrana geçiş.
5. **Kapanış ve Hatıra Ekranı:**
   - Belirlenen gün ve filmin yazılı olduğu onaylanmış hatıra bileti.
   - *"O zaman hazırsan senden mesajını bekliyorum."* kapanış mesajı.
   - WhatsApp'tan tek tıkla mesaj gönderme ve tekrar oynama butonları.

---

## 🚀 Başlatmak İçin

`index.html` dosyasını herhangi bir web tarayıcısında açmanız yeterlidir.

---

## 💾 Firebase Kurulumu (İsteğe Bağlı)

Projede varsayılan olarak **Cloud Firestore** entegrasyonu hazır bulunmaktadır.
Kendi Firebase projenizi bağlamak için:

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin.
2. Projenizin **Project Settings** sayfasındaki web yapılandırma anahtarlarını kopyalayın.
3. `js/firebase-config.js` dosyasındaki `firebaseConfig` alanına yapıştırın:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "projeniz.firebaseapp.com",
  projectId: "projeniz",
  storageBucket: "projeniz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:..."
};
```

> **NOT:** Firebase anahtarları girilmemiş olsa bile site hiçbir zaman hata vermez. Otomatik olarak güvenli `localStorage` yerel depolama modunda çalışır ve seçimleri tarayıcıda saklar.

---

## 📁 Dosya Yapısı

```
index.html              Tüm sahne yapıları ve anlamsal bilet öğeleri
css/style.css           Kadife sinema salonu, bilet perforasyonu ve damga animasyonları
js/firebase-config.js   Firestore bağlantısı ve çevrimdışı yedekleme katmanı
js/cinema-game.js       Flint, Wall-E ve Po karakterleri için Canvas piksel oyun motoru
js/main.js              Sahne yöneticisi, atmosferik projektör ışığı ve müzik kontrolleri
assets/audio/muzik.mp3  Nostaljik arka plan müziği
```
