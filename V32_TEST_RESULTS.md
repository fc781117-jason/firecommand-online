# V3.2 分批交付及驗收 — 2026-10-03

**Production HOLD。這是 Phase A／B 部分交付，不是完整 V3.2 正式更新包。**

## 版本及環境

- Branch：`feature/v34-2-field-revision-v3-2`
- 程式 HEAD：`0fb9c0fa2f174d18fd0c6366a710c63a1ba29ef5`
- Phase A commit：`ba5e4f21eb91dede92401650587fd57afa2ffb5b`
- PR：https://github.com/fc781117-jason/firecommand-online/pull/7 （Draft，base 為 V3.1，尚未合併）
- Preview：https://firecommand-online-git-feature-v-1a6f13-fc781117-4321s-projects.vercel.app/
- 已驗收程式 Deployment ID：`2G5PeCmk2oQoX3mUJVvmq8zEdXBE`
- GitHub 的 Vercel commit status：success。直接 Vercel 團隊存取回覆403，未取得完整 build log／環境設定。
- 介面仍保留 v34.2 標籤；識別本次程式請用 HEAD／Deployment，不以版號猜測。
- 所有瀏覽器操作使用 Preview 的合成本機示範資料，未向正式 Firebase 寫入。

## 已修改實際入口

|需求|實際入口／程式|結果|
|---|---|---|
|A1 圖示入口|部署 → 戰術部署圖；index.html、v34-v32.css|兩行說明、置中|
|A2 Zoom/Pan|同一 SVG 畫布；app.js|新增 viewBox 縮放、手勢處理、＋／－／Fit、座標轉換|
|A3–A7 住戶|部署 → 建物內部作戰圖 → 樓層；app.js|每層橫向 Compact Card；點卡片查看完整資料|
|A8 人口|operational-v32.js|未知不當0，空樓層顯示人口尚未登錄|
|A9–A19 概要|概要 → 即時案件概要|共用結構化摘要；樓層分隔；住戶與患者不相加|
|B 任務歷程|部署人員表單、圖面人員設定、快捷操作、確認辨識；assignment-v32.js、app.js、intake-ui.js|共用 transition、開始／結束段、工作／休息合計及歷程|
|B 歷程檢視|更多 → 人員與車輛 → 查看歷程|實際 Preview 已操作|
|C 結案升級|尚未完整接入|不可宣稱完成；closeSegments 僅 helper 已測|
|D PWA Push|尚未建立完整管線|不可宣稱背景通知可用|

摘要模型目前接入概要及既有摘要文字來源；續報、全部 AI Context、Final Snapshot、Push 尚未全數共用，需續作。底圖與既有物件拖動能力沿用 V3.1，不代表已完成 iPhone 手勢驗收。

## 測試範圍

`node scripts/verify.cjs`：**264 PASS，0 FAIL**。包含程式語法、既有回歸、未知人口、患者去重、viewBox範圍與錨點、任務轉換、補人數不重啟、legacy時間保留，以及部分 closed guard 模擬。這個數字不是264項真機或雲端端到端測試。

|ID／範圍|狀態|證據與限制|
|---|---|---|
|A 圖示兩行、＋／Fit|PASS（桌面 Preview）|SVG viewBox 由900寬變720，Fit恢復；非頁面縮放|
|A Pinch／Pan／長按／44px真機触控|NOT TESTED|已寫入實作與幾何測試，仍需 iPhone Safari/PWA|
|A Compact Card／詳細面板|PASS（桌面 Preview）|A戶/B戶横排；卡片短戶號，詳細面板完整地址／聯絡資料|
|A Structured Summary|PASS（桌面 Preview＋單元）|2戶、至少7人、1戶待確認；患者另列；未當本棟總戶數|
|TEST-TIME-01|PASS（單元）|新作業任務記錄startedAt|
|TEST-TIME-02|PASS（單元；Preview短時間操作）|作業轉休息；10分鐘採可控時間單元測試，未現場等10分鐘|
|TEST-TIME-03|PASS（單元＋Preview本機）|REHAB結束、新搜索段開始；reload仍保留|
|TEST-TIME-04|NOT TESTED（正式結案流程）|僅closeSegments helper PASS，尚未接入正式結案|
|TEST-TIME-05|NOT TESTED（最終結案報告）|已提供各段、合計、派遣格式；未完成結案端到端|
|所有task入口的雲端同步／衝突|NOT TESTED|共用路徑已接入及mock測試；不是多裝置實測|
|TEST-CLOSE-01～09（每項）|NOT TESTED|Phase C未完成；不可使用作V3.2結案驗收依據|
|TEST-PUSH-01～10（每項）|NOT TESTED|Phase D未完成；沒有鎖屏推播證據|
|照片拍攝→Storage→重開|NOT TESTED|沿用既有照片管線；Preview縮圖為合成素材，不是上傳成功證據|
|Carry-over表單／帳號／RIT|NOT TESTED（本輪真機）|既有自動回歸保留，不以繼承功能冒稱真機PASS|
|iPhone尺寸、鍵盤、2–3樓層同屏|NOT TESTED|當前browser工具未提供viewport改尺寸，證據為桌面|

## 畫面證據（全部合成資料）

- `docs/evidence/v32/v32-residents-latest.jpg`：實際部署／樓層住戶卡。
- `docs/evidence/v32/v32-overview-latest.jpg`：實際概要，已知小計與重複來源警語。
- `docs/evidence/v32/v32-task-history.jpg`：從圖面人員設定切換REHAB→搜索後的歷程。

Preview示範原始crew沒有可靠開始時間，因此不捏造先前滅火攻擊期間。畫面中REHAB僅13秒，四捨五入／分鐘顯示為0分，不代表漏記該段；單元測試另外驗證10分鐘及多段合計。

## 修改檔案

`assets/app.js`、`assets/intake-ui.js`、`assets/assignment-v32.js`、`assets/operational-v32.js`、`assets/v34-v32.css`、`index.html`、`api/preview-mode.js`、`tests/app-harness.cjs`、`tests/assignment-v32.test.cjs`、`tests/field-entry-vnext.test.cjs`、`tests/operational-v32.test.cjs`、`tests/preview-isolation-v31.test.cjs`、`V32_CHECKPOINT.md`及本報告／證據。

## Schema、Migration、Rules與回退

- crews新增相容可選欄位：`taskSegments[]`、`assignmentRevision`。仍是原本crew，不另建集合。
- 只在後續確定任務變更時附加歷程；舊資料不批次改写。來源不明的過去任務時間不補造。
- Firestore Rules、Storage Rules、登入、Secrets、Production環境變數：**本輪未更改**。
- Task資料仍需 Rules／真實 transaction 回歸才能發布。安全結案不能只靠前端guard。
- Phase A/B現有Preview不需使用者重設參數。Phase C/D後端及隔離設定尚未確定，不能承諾完整V3.2無須設定。
- 回退使用git revert本輪程式commit，再部署Preview驗證；不刪除既有taskSegments歷史。勿reset、覆蓋main或刪資料。

## 阻礙、下一步

1. Vercel連線需重新授權既有`fc781117-4321s-projects`團隊範圍；不提供secret到聊天。
2. 請確認可用隔離Firebase測試專案／授權測試帳號，才能驗收Rules、照片、多人同步與結案安全；不使用正式案件作破壞測試。
3. 完成Phase C：雙確認、全寫入入口唯讀及Rules、管理員重開原因與audit、不可覆寫Final Snapshot、closedAt關閉任務。
4. 完成Phase D：選定既有backend上的安全scheduler/sender，manifest/SW/subscription、routing/ack/dedupe，然後iPhone主畫面／鎖屏實測。
5. 未完成這些閘門前，不把本分支打包當作可直接上線的完整版本。
