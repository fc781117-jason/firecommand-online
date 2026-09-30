# FireCommand v34

本版加入人員與車輛分開登錄、人數可後補、部署入口收合、連續分隊語音預填，以及 v33 帳號管理優化。先開啟 `UPDATE_v34.html`，依其中步驟更新。

## 更新重點

1. 解壓縮完整專案包，將內容上傳到原 FireCommand GitHub Repository；不需建立新的 Firebase 或 Vercel 專案。
2. 保留原 Vercel 環境變數、Google OAuth、Firebase 專案及正式網域設定，不需要重新輸入登入參數。
3. GitHub 更新後，原本與 GitHub 連動的 Vercel 會依現有流程部署。
4. `firebase/firestore.rules` 加入人數欄位驗證。網站可先更新；完整後端保護仍需依 `UPDATE_v34.html` 發布 Rules。
5. Production 更新後，先以練習案件驗收空白人數登錄、後補人數、車輛登錄及帳號搜尋，再使用正式案件。

舊版文件保留作歷史參考；本版限制及尚未施工項目見 `VALIDATION_v34.md`。
