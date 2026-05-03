import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_REAL_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// 🔥 DEBUG TEST (runs immediately)
async function testConnection() {
  try {
    const snap = await getDocs(collection(db, "events"));
    console.log("🔥 FIREBASE CONNECTED");
    console.log("📊 EVENTS COUNT:", snap.size);

    if (snap.size === 0) {
      console.warn("⚠️ Connected BUT no data found");
    }

    snap.forEach(doc => {
      console.log("DOC:", doc.id, doc.data());
    });

  } catch (err) {
    console.error("❌ FIREBASE ERROR:", err);
  }
}

testConnection();
