# FireCommand v34 V2.0｜更新包逐檔清單／Update Manifest

基準 `main` commit：`02803624e758d12e32657286a02cc2157f589b20`。目標僅 FireCommand。**Production HOLD；目前此包不是「解壓後直接覆蓋正式網站」的授權。**

## 更新檔／Changed files

把解壓後下列路徑放在 Repository 根目錄的相同路徑，不要多一層資料夾：

| 路徑／Path | 內容／Purpose |
|---|---|
| `index.html` | 真正 SOP／部署頁入口、Storage SDK |
| `assets/app.js` | 單筆儲存、照片、支援、RIT、人車圖面操作 |
| `assets/intake-ui.js` | 真正初期辨識確認卡 |
| `assets/field-entry.css` | 手機表單與圖面工具排版 |
| `firebase/storage.rules` | 案件照片權限，需獨立部署 |
| `firebase.json` | 指向 Storage 規則檔 |
| `tests/field-entry-vnext.test.cjs` | V2 入口回歸 |
| `tests/v34-ui-v2.test.cjs` | V2 專項測試 |
| `V34_UI_V2_STATUS.md` | 驗收狀態與剩餘風險 |
| `V34_UI_V2_UPDATE_GUIDE_ZH_EN.md` | 本逐檔清單 |

無刪除／重新命名。不要上傳交接包原始六張截圖或案件照片、`.env`、金鑰、`.git`。

## 網頁操作／GitHub web workflow

若此分支已由 Work 推送且 Vercel Preview 正常，**不必再次上傳 ZIP**；直接檢查該分支。GitHub 網頁不會把上傳的 ZIP 自動解成 Repo 檔案。

1. 開啟 [GitHub Repository](https://github.com/fc781117-jason/firecommand-online)，進入 **Code（程式碼）**；確認是 `fc781117-jason/firecommand-online`。
2. 點 **Branch selector（分支選擇器）**，選 `feature/v34-ui-correction-v2`；若尚未在遠端，從最新 `main` 建立同名分支。不要改 `main`。
3. 解壓更新包，選 **Add file（新增檔案）→ Upload files（上傳檔案）**，上傳表中檔案與資料夾，核對最後路徑不含 ZIP 外層名稱。若 GitHub 無法維持子資料夾結構，停止並用 GitHub Desktop／Git 命令，不要只傳根目錄檔。
4. 在 **Commit changes（提交變更）** 檢查目標是此功能分支。不要勾「直接提交到 main」。按 **Commit changes / Propose changes（提交／提議變更）** 後核對檔案與 commit。
5. 可建立 **Pull requests（拉取請求）→ New pull request（新增）**，base=`main`、compare=功能分支；建立 PR 不是合併。**不要按 Merge（合併）。**
6. 到 [Vercel Dashboard](https://vercel.com/dashboard)，進入原 FireCommand Project → **Deployments（部署）**，按此分支／Preview 找相同 commit，記下精確 Preview URL、環境、建置 ID、Ready 或失敗原因。不要另建專案，不要以正式網址代替 Preview。
7. Preview 必須用隔離資料驗收；已知 `*.vercel.app` Preview 會停用正式 Firebase，示範模式不會測到真實照片／多裝置同步。這些項目要另備隔離後端與授權測試帳號，不能用正式案件試刪除。

## Firebase Storage／照片額外設定（不是普通上傳自動完成）

這次新增有權限的照片上傳／讀取，所以需要獨立檢查 Storage。先由管理者備份現有規則並在**隔離專案**測試；尚未得到 Production 授權時不要發布到正式專案。

1. 在 [Firebase Console](https://console.firebase.google.com/) 選 **FireCommand 對應測試專案 → Build（建構）→ Storage（儲存空間）→ Rules（規則）**，比對 `firebase/storage.rules`。新規則參照 Firestore 使用者和案件文件；控制台或 CLI 可能要求啟用 Rules 對 Firestore 的跨服務讀取權限，先審核再操作。正式專案仍 HOLD。
2. 若隔離測試規則驗證通過，可從解壓包根目錄由具授權管理者執行 `firebase deploy --only storage --project <隔離專案ID>`。**不要將 `<隔離專案ID>` 改成正式專案，除非日後另外明確核准。**
3. 桶的 CORS 需允許測試站／正式站將來用授權讀取照片；先用 `gcloud storage buckets describe gs://<測試bucket> --format=json` 檢查現有 CORS，再合併所需的 origin、GET 與必要回應標頭。不要用單一範例覆蓋其他現有 origin。需權限時由管理者操作，記錄原值與回退值。Firebase 官方說明直接在瀏覽器取得 Blob 需 CORS，Google Cloud 文件提供 `gcloud storage buckets update ... --cors-file=...`。
4. 確認本大隊有權者能上傳／讀圖，不同大隊、待審、未登入者不能；相機取消及 CORS 失敗時文字儲存仍須誠實回饋。

## 回退／Rollback

在合併前可關閉 Preview 或回退此功能分支；正式站仍使用原 commit。不要 `reset --hard`、`clean`、force push 或刪除正式資料。若未來另行核准發布 Storage Rules，請先匯出原規則及 bucket CORS，出問題時由管理者依備份回退並重新測照片權限。新增選填案件欄位可由舊程式忽略，不批次改寫歷史案件。

## 安全停點／Stop points

任何 Preview 無法開啟、需要對正式 Firebase 改規則、照片無權限卻可讀、缺少六組實際畫面、或未通過真機驗收，都停在功能分支。正式合併／正式部署等待使用者另行確認。
