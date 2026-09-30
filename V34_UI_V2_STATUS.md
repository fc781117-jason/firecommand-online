# FireCommand v34 實際畫面修訂 V2.0｜施工與驗收紀錄

基準：`fc781117-jason/firecommand-online` 的 `main`，`02803624e758d12e32657286a02cc2157f589b20`。施工分支：`feature/v34-ui-correction-v2`。Production HOLD；此紀錄不代表正式部署。

功能分支已推送；首筆遠端 commit：`a6e779951ccf1d2900e4707510008da55c4e812c`。Draft PR：https://github.com/fc781117-jason/firecommand-online/pull/3 。PR 不得合併。

此批只修改 FireCommand，原始交接 ZIP、病患／關係人照片與六張參考截圖均不提交公開儲存庫。

| 需求 ID／參考截圖 | 實際入口／路由 | 本次修改 | 自動測試 | 修改後實拍 |
|---|---|---|---|---|
| C01／IMG_1663 | SOP → 人 → 關係人，`#contactRows` | 新增表單無刪除；文字確認儲存後以資訊卡顯示；卡底修改／刪除；選填拍照，失敗保留文字成功狀態 | 區塊交易與結構測試 PASS；照片上傳未測 | 未取得；需隔離 Preview + 授權測試帳號 |
| H01／IMG_1664 | SOP → 人 → 危險物品，`#hazardDetailFields` | 同樣照片／儲存／資訊卡／修改刪除；沿用舊欄位 | 結構與不被自動儲存覆蓋 PASS；照片未測 | 未取得 |
| S01／IMG_1665 | SOP → 支 → 支援，`#supportDetailFields` | 消防／外單位兩格；外單位再選單位與事項、多筆、自由補充及整組明確儲存；需求一律標記 requested | 結構 PASS；後端與真機未測 | 未取得 |
| I01／IMG_1667 | SOP → 初期部署 → 辨識確認，`#intakeChanges28` | 標題僅單位；基本資料 2×2，面向及任務 2×2；欄位直接改；底部確認／移除；取消上方修改／稍後及「本次變更」欄 | VM 整合與 UI 模板 PASS | 未取得 |
| R01／IMG_1668 | SOP → 初 → RIT，`#ritDetailFields` | 大隊／單位連動；舊單位可核對；選填補充說明；明確確認儲存 | 結構 PASS；真人同步未測 | 未取得 |
| D01／IMG_1669 | 部署 → 人員／車輛／圖面，`#tacticalMapSection` | 人數未知與0–15、舊值 >15 保留；車號預設改新增特殊碼；外層三入口，圖面進入戰術／建物；水線 A 車→B 車、取消、復原；危害工具在圖右上 | 既有人車資料流與新專項 PASS；觸控與地圖 API 未測 | 未取得 |

## 執行過的檢查

- `node --check assets/app.js`、`node --check assets/intake-ui.js`：PASS。
- `node --test tests/*.test.cjs`：136/136 PASS（靜態、VM／模擬資料及既有回歸）；不等於 iPhone、Firebase Storage 或多裝置端到端驗收。
- `git diff --check`：PASS。
- 本機服務能啟動，但 `agent-browser` 不存在、Playwright 沒有已安裝的 Chromium，雲端瀏覽器阻擋本機網址；因此不能產生可信的六組「修改後」實際截圖。**不要用此測試結果當作真機 PASS。**
- GitHub 的遠端 commit 顯示 Vercel 狀態 `success`，指向部署紀錄 `J3GeZTMLx93G3wW6isMoc4d2uNcQ`；但 Vercel 專案範圍回應 403、要求重新授權，所以**沒有可核實的實際 Preview 網址／環境詳情**。成功狀態不等於 SOP 實際操作通過。
- 此版未查到 Service Worker 註冊或 Service Worker 原始檔；改動的 JS/CSS 已換查詢版本 `v=34.2`，不把這次修訂聲稱為新增離線 PWA。

## 資料與權限

- 既有 `contacts`、`hazardItems` 等欄位可繼續讀；新欄位採選填 `contactsRevision`、`hazardRecord`、`hazardRevision`、`supportRequests`、`supportRevision`、`ritBrigade`、`ritRevision`，不批次改寫舊案件。新單筆修改用交易 revision 拒絕並行覆蓋。
- 未知人數仍為 `null`，0 為確定 0；SOP 與部署共用既有 `crews`，沒有第二份人員表。手動車輛仍存既有 `vehicles`。
- 圖面只儲存示意線；新連線狀態為「規劃」，不能視為已供水。
- 照片只存受案件分隊／角色規則限制的 Storage 路徑，案件文件存 `photoPath`；不存公開下載 token。瀏覽器跨來源照片讀取需要桶的 CORS 設定及授權實測。
- 此分支包含較嚴格的 `firebase/storage.rules` 與 `firebase.json` Storage 規則配置。**GitHub／Vercel 提交不會發布 Firebase Rules。**先用隔離測試環境驗證，再由管理者依批准流程發布；不能在本輪直接改正式 Rules。

## 未完成／阻礙與續作

1. 將功能分支推至 GitHub 後核對 Vercel Preview 的精確 URL、環境、commit 與 build ID；不得填猜測網址。
2. 用隔離 Firebase 專案、核准測試帳號跑 SOP 真正入口及部署分頁，拍攝六組修改後實拍；照片權限、相機拒絕、上傳失敗、iOS 鍵盤與觸控、水線移車、同時修改均待驗收。
3. 核對當前 Storage CORS 配置後合併新增必要來源；不要盲目覆蓋已有設定。檢查 Rules 模擬器、未授權者與不同大隊不能讀寫案件照片。
4. 如任一項未通過，保留此分支，修正後重新跑 136 項及案例回放；Production 維持 HOLD。

回退：網站只回退功能分支／Preview，不影響正式站；若未來獲准發布 Rules，先備份當時正式版本及 CORS 設定，回退時也須重新核對照片權限與原有案件。
