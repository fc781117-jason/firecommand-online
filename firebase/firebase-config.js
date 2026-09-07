// FireCommand Firebase 設定檔
// 已依目前 Firebase Web App 設定完成。
// 注意：這不是 Google 帳號密碼，也不是 Service Account private key。
// Firebase Web config 可放在前端；真正安全性請依靠 Auth、Firestore Rules 與 Vercel / Firebase 授權網域。

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

// v28 preferred login: set Vercel GOOGLE_WEB_CLIENT_ID to the existing Google OAuth Web client ID.
// For static hosting you may set the same PUBLIC client ID below. Never put a client secret here.
window.FIRECOMMAND_GOOGLE_CLIENT_ID = '';
