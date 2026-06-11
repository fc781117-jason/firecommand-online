// FireCommand Firebase 設定檔
// 1. 此檔案提供給 FireCommand Web App 讀取 Firebase 設定。
// 2. 已啟用 Firebase，正式上線時會使用 Firebase Auth / Firestore / Storage。
// 3. 不要把 Google 帳號密碼或 Service Account private key 放在這裡。
// 4. Firebase 沒有提供 measurementId 沒關係，這不是必要欄位。

window.FIRECOMMAND_FIREBASE_ENABLED = true;

window.FIRECOMMAND_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBbhrtHh5JCeukTlx1_6_nuF0hcgpJwUsw",
  authDomain: "firecommand-online.firebaseapp.com",
  projectId: "firecommand-online",
  storageBucket: "firecommand-online.firebasestorage.app",
  messagingSenderId: "575184567138",
  appId: "1:575184567138:web:4173df8ba7be8a4a7bca3b",
  measurementId: ""
};