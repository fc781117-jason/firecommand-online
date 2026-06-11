# FireCommand 火場指揮系統 v6 Online

這是一版可直接放到 GitHub + Vercel，並串接 Firebase 的 FireCommand 線上版。

## 功能

- Google 登入
- 首次登入填寫真實姓名、稱呼、大隊、單位、職稱、APP 角色
- 下次登入免重填個人資料
- 開案首頁與案件列表
- 案件編號自動產生
- 新增案件 / 派遣令預設收合
- 地址定位與 200m 作業圈
- 車輛部署、拖曳移動
- 人員部署、拖曳移動
- 水線建立
- 危害標示建立與拖曳移動
- 人車掌控儀表板
- 規則式提示
- 時間軸紀錄
- 照片上傳
- 北海回報草稿

## 檔案結構

```text
index.html
assets/styles.css
assets/app.js
firebase/firebase-config.js
firebase/firestore.rules
firebase/storage.rules
vercel.json
```

## 上線前必做

1. 建立 Firebase Project。
2. 新增 Web App，取得 firebaseConfig。
3. 修改 `firebase/firebase-config.js`。
4. Firebase Authentication 啟用 Google 登入。
5. 建立 Firestore Database。
6. 建立 Storage。
7. 將 `firebase/firestore.rules` 貼到 Firestore Rules。
8. 將 `firebase/storage.rules` 貼到 Storage Rules。
9. 上傳到 GitHub。
10. Vercel 匯入 GitHub Repo 並部署。

## Demo 模式

若 `FIRECOMMAND_FIREBASE_ENABLED = false`，系統會使用瀏覽器 localStorage 作為本機 Demo，不會多人同步。

## 正式提醒

此版本仍屬 MVP，尚未經機關資安審查，不應輸入正式案件機敏資料或個資。
