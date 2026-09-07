# FireCommand v28｜登入修正與部署設定

## 為什麼 v26 改 Popup 後仍可能看到同一錯誤

提供的 Firebase 截圖網址位於 `firecommand-online.firebaseapp.com` 的登入中繼頁。錯誤代表它拿不到這一次登入所需的初始狀態；舊分頁被還原、暫存被清除或瀏覽器的儲存分割都可能造成。僅依截圖，無法斷言一定是哪一種。

v27 主程式雖呼叫 `signInWithPopup`，啟動時仍讀取 `getRedirectResult()`。此外，Firebase Popup本身仍使用認證輔助頁。因此更換成 Popup 不能保證完全消除輔助頁問題；主網站的 catch 也無法改寫另一個網域上已卡住的錯誤頁。

## 本版程式已改動

- 移除啟動時不必要的 `getRedirectResult()`；沒有 `signInWithRedirect` 呼叫。
- 登入持續性依序嘗試 LOCAL → SESSION → NONE。長期暫存不可用時，不再直接禁用整個 Firebase。
- 新增 **Google Identity Services → Firebase signInWithCredential** 路徑。設定完成後，以Google官方登入按鈕取代原按鈕。Google回傳ID token交Firebase SDK驗證，沿用同一Firebase帳號、權限與案件。
- 原 Firebase Popup 作為未設定新版登入時的備援，不把未設定的登入方式假裝成已啟用。
- 增加 `login-help.html` 與明確錯誤文字，說明回到正式首頁；沒有清空全站儲存、刪除案件或記錄ID token。

## 管理員需要完成的設定（本次尚未操作）

1. 開啟此 Firebase 專案所對應的 Google Cloud Console → APIs & Services → Credentials。取得既有 **OAuth 2.0 Web application client ID**。若不清楚，不要隨意使用其他專案的用戶端。
2. 在該 Web 用戶端的 **Authorized JavaScript origins** 加入正式網站完整origin，例如 `https://你的正式網域`。只填協定與主機，沒有 `/index.html` 或 `/__/auth/handler` 路徑。自訂網域及實際使用的Vercel固定網域分別加入；不建議用每次變動的預覽網址登入。
3. Firebase Console → Authentication → Settings → Authorized domains 中加入正式網站主機名稱，並確認Google登入提供者已啟用。
4. Vercel 專案新增環境變數 `GOOGLE_WEB_CLIENT_ID`，值為步驟1的公開client ID，通常以 `.apps.googleusercontent.com` 結尾；選取正式環境並重新部署。**不填client secret，也不更換Firebase API key。**
5. 開啟 `/api/auth-config`，應只看到公開的 `googleClientId`。首頁應顯示 Google 官方按鈕。若使用純靜態主機，改在 `firebase/firebase-config.js` 的 `FIRECOMMAND_GOOGLE_CLIENT_ID` 填同一公開值。
6. 用 Safari／Chrome 開啟正式首頁完成登入；再測試原本會失敗的App內建瀏覽器。某些內建瀏覽器會限制OAuth或彈出視窗，仍應引導到系統瀏覽器。不可宣稱所有WebView都可登入。

Google OAuth 設定與正式手機登入，需要管理端權限與實際裝置，本次沒有代為修改或驗證。若未設定以上公開client ID，仍走原Firebase Popup，不能把「更新ZIP」當成登入根因已在正式站排除。

## 已卡住的舊分頁

關閉顯示 firebaseapp.com 英文錯誤的分頁 → 從原本正式 FireCommand 首頁重新開啟 → 按 Google 登入。首頁的登入協助頁也提供返回入口。請重新收藏正式系統首頁，避免收藏中繼頁。

外部 firebaseapp.com 已開啟的錯誤頁不會因為更新Vercel檔案而自動改寫；這是跨網域的限制。本次不設定整體攔截 `/__/auth/handler` 的重新導向，避免破壞正常OAuth流程。

## 來源（2026-09-07 查核）

- Firebase：Google Sign-In 與手動Google credential登入：[官方說明](https://firebase.google.com/docs/auth/web/google-signin)。
- Firebase：跨站儲存問題與可用改善方式：[redirect最佳實務](https://firebase.google.com/docs/auth/web/redirect-best-practices)。
- Google：初始化、credential callback、renderButton：[Google Identity Services API](https://developers.google.com/identity/gsi/web/reference/js-reference)。

本版採Google credential路徑，不實作反向代理方案；若未來改用同網域認證代理，需同時設定OAuth redirect URI及Firebase authDomain，不能只添加302跳轉。
