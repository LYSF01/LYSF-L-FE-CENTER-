
import * as firebase from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// --- BURAYI DOLDURUNUZ ---
// Google Firebase Konsolu'ndan (Step 2) aldığınız bilgileri buraya yapıştırın.
// Bu bilgileri girdiğiniz anda sistem otomatik olarak "Demo Modu"ndan çıkıp "Cloud Modu"na geçecektir.

const firebaseConfig = {
  apiKey: "BURAYA_API_KEY_YAZILACAK",          // Örn: "AIzaSyD..."
  authDomain: "BURAYA_AUTH_DOMAIN_YAZILACAK",  // Örn: "lysf-system.firebaseapp.com"
  projectId: "BURAYA_PROJECT_ID_YAZILACAK",    // Örn: "lysf-system"
  storageBucket: "BURAYA_STORAGE_BUCKET",      // Örn: "lysf-system.appspot.com"
  messagingSenderId: "BURAYA_SENDER_ID",       // Örn: "8452..."
  appId: "BURAYA_APP_ID"                       // Örn: "1:8452...:web:..."
};

// ---------------------------------------------------------

// Sistem, API Key hala varsayılan ("BURAYA_...") ise Demo Modunda kalır.
// Gerçek key girdiğinizde otomatik olarak False olur ve Bulut'a bağlanır.
export let isDemoMode = firebaseConfig.apiKey.includes("BURAYA_API_KEY") || firebaseConfig.apiKey.includes("SİZİN_API_KEYİNİZ");

let app;
let db: any = null;

if (!isDemoMode) {
  try {
    console.log("🔥 Firebase Cloud Modu Başlatılıyor (PWA Enhanced)...");
    app = firebase.initializeApp(firebaseConfig);
    
    // Modern Offline Persistence (Multi-Tab Support)
    // Bu yapılandırma, internet kesildiğinde verilerin cihazda güvenle saklanmasını
    // ve internet geldiğinde otomatik senkronize olmasını sağlar.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });

    console.log("✅ Firebase Bağlantısı Mühürlendi (Offline-Ready)!");
  } catch (error) {
    console.error("❌ Firebase Bağlantı Hatası:", error);
    // Hata olursa uygulamayı çökertmemek için demo moduna düşür
    isDemoMode = true; 
  }
} else {
  console.log("⚠️ DEMO MODU AKTİF (Veriler sadece bu cihazda saklanır)");
}

export { db };
