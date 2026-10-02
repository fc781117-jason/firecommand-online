# FireCommand v34.2 V3｜更新包與逐檔說明

> 此包供功能分支／Preview 更新。Production 仍 HOLD。若遠端功能分支與 Preview 已存在，不必重複上傳 ZIP。

## 基準

- Repository：`fc781117-jason/firecommand-online`
- Base：`main` / `94c674fdc00704b08e6fd6f009d3197db58e7a4e`
- Branch：`feature/v34-2-tactical-simplification-v3`
- Draft PR：<https://github.com/fc781117-jason/firecommand-online/pull/5>

## 程式變更檔／Changed program files

| 路徑 | 用途 |
|---|---|
| `index.html` | 正式 SOP／部署入口與 V3 資源載入 |
| `assets/app.js` | 續報、聯絡人、建物住戶及案件資料整合 |
| `assets/intake-ui.js` | 任務下拉、未知人數手動登錄 |
| `assets/scene-ui32.js` | 戰術畫布操作與車輛／水線事件 |
| `assets/scene32.js` | 戰術示意資料與拓樸 |
| `assets/v34-v3.css` | V3 手機／畫布／資訊卡樣式 |
| `assets/v34-v3.js` | V3 任務、續報、戰術圖示與住戶功能 |
| `tests/scene32.test.cjs` | 場景回歸 |
| `tests/v34-v3.test.cjs` | V3 專項回歸 |

## GitHub 網頁上傳／Web upload

1. 解壓 ZIP；進入 [GitHub Repository](https://github.com/fc781117-jason/firecommand-online)。
2. 使用 **Branch selector（分支選擇器）**選 `feature/v34-2-tactical-simplification-v3`。不要選 `main`。
3. 點 **Add file（新增檔案）→ Upload files（上傳檔案）**，把解壓後內容依原路徑上傳；Repository 根目錄應直接看到 `index.html`、`assets/`、`tests/`，不要多一層 ZIP 資料夾。
4. 在 **Commit changes（提交變更）**確認目標仍是功能分支，訊息可用 `Update FireCommand v34.2 V3`；不要按 Merge。
5. 到 Vercel → FireCommand → **Deployments（部署）**，找到同一 branch／commit 的 Preview，等待 **Ready（就緒）**。
6. 用 Preview 的合成或隔離資料驗收；不要使用正式案件做刪除或照片權限測試。

GitHub 網頁不會自動解壓 ZIP；必須先在電腦解壓。若瀏覽器無法正確保留資料夾結構，改用 GitHub Desktop，不要把 `assets` 內容全部丟到根目錄。

## 設定與 Migration

- 本輪不需要修改 Google OAuth、Vercel 環境變數、Firestore Rules 或 Storage Rules。
- 本輪不需要資料庫 migration。
- 真實照片端到端驗收仍需要隔離 Firebase／Storage 與核准測試帳號；這是測試環境需求，不是本包上傳的必要步驟。

## 回退／Rollback

功能分支可關閉 PR 或 revert 本輪 commits；正式 `main` 未改。不要 `reset --hard`、force push 或刪除正式資料。若未來另外獲准合併，正式回退須使用 Vercel 前一個正常部署及 Git revert，並重新驗收登入與舊案件。
