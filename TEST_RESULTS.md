# FireCommand VNext｜測試紀錄（2026-09-30）

- `node --check assets/app.js`、`assets/field-entry-core.js`：通過。
- `node --test tests/*.test.cjs`：131 項通過、0 失敗（含 v33 帳號管理既有測試、無人數建立後補、空白／0 區別、連續單位口述與 Preview 網域隔離判斷）。
- `git diff --check`：通過。
- Firestore 規則模擬器：未跑；需隔離專案或 emulator 及權限驗證。
- Vercel Preview：功能分支推送遭 GitHub 認證阻擋，尚未發布；預覽網域改以本機示範模式隔離，實際部署與視覺驗收未測。
- iPhone、相機、Google 底圖、兩帳號即時同步、離線重連、Case 001／002 replay：未測。

以上僅為本機單元與模擬 Firestore 交易測試，並非端到端正式資料驗收。
