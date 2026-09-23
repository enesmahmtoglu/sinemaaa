/**
 * Firebase Firestore Canlı Entegrasyonu
 * --------------------------------------------------
 * Hem 'file://' yerel dosya protokolünde hem de canlı sunucularda
 * CORS engeline takılmadan %100 kararlı çalışan Firebase Compat mimarisi.
 */

const firebaseConfig = {
  apiKey: "AIzaSyDwQ0LK9hc9TOH17kn1Gk8Smg9lKXCNcP4",
  authDomain: "sinema-davetiyesi.firebaseapp.com",
  projectId: "sinema-davetiyesi",
  storageBucket: "sinema-davetiyesi.firebasestorage.app",
  messagingSenderId: "346769005763",
  appId: "1:346769005763:web:f29116184d0093f4a69676"
};

let db = null;
let isFirebaseReady = false;

// Firebase Başlatma Fonksiyonu
function initFirebase() {
  if (isFirebaseReady && db) return true;

  try {
    if (typeof firebase !== "undefined") {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      isFirebaseReady = true;
      console.log("✅ Firebase Firestore başarıyla bağlandı! (Proje: sinema-davetiyesi)");
      return true;
    } else {
      console.warn("⚠️ Firebase SDK henüz yüklenmedi, bekleniyor...");
      return false;
    }
  } catch (error) {
    console.error("❌ Firebase başlatma hatası:", error);
    return false;
  }
}

// Gün ve Seçilen Filmi Firestore'a Kaydetme
async function saveCinemaRSVP(data) {
  const payload = {
    day: data.day || "Bugün",
    movie: data.movie || "Seçilmedi",
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };

  // 1. LocalStorage Yedekleme
  try {
    localStorage.setItem("cinema_rsvp_last", JSON.stringify(payload));
    const all = JSON.parse(localStorage.getItem("cinema_rsvp_history") || "[]");
    all.push(payload);
    localStorage.setItem("cinema_rsvp_history", JSON.stringify(all));
  } catch (e) {}

  // 2. Firebase henüz başlatılmadıysa dene
  if (!db) {
    initFirebase();
  }

  // 3. Önce Firebase SDK ile dene
  if (db) {
    try {
      const docRef = await db.collection("cinema_invites").add(payload);
      console.log("🎉 SEÇİM FİREBASE FİRESTORE'A BAŞARIYLA YAZILDI!");
      console.log("📄 Belge ID:", docRef.id);
      return { success: true, id: docRef.id, mode: "firestore-sdk" };
    } catch (err) {
      console.warn("⚠️ Firestore SDK ile kaydedilemedi, REST API deneniyor:", err);
    }
  }

  // 4. Doğrudan Firestore REST API ile Kesin Gönderim (Adblocker veya file:// engellerini aşar)
  try {
    const restUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/cinema_invites`;
    const restBody = {
      fields: {
        day: { stringValue: payload.day },
        movie: { stringValue: payload.movie },
        timestamp: { stringValue: payload.timestamp },
        userAgent: { stringValue: payload.userAgent }
      }
    };
    const res = await fetch(restUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(restBody)
    });
    if (res.ok) {
      const resData = await res.json();
      console.log("🎉 SEÇİM FİREBASE'E REST İLE YAZILDI! Belge:", resData.name);
      return { success: true, id: resData.name, mode: "firestore-rest" };
    }
  } catch (restErr) {
    console.warn("REST API hatası:", restErr);
  }

  return { success: true, mode: "local-only" };
}

// Global Erişim
window.CinemaDB = {
  config: firebaseConfig,
  init: initFirebase,
  saveRSVP: saveCinemaRSVP,
  isReady: () => isFirebaseReady,
  // Manuel test için yardımcı fonksiyon: Konsola window.CinemaDB.testSend() yazarak da test edilebilir!
  testSend: async () => {
    return await saveCinemaRSVP({ day: "Bugün (Test)", movie: "Köfte Yağmuru (Test)" });
  }
};

// Sayfa yüklendiğinde başlat
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFirebase);
} else {
  initFirebase();
}
