# FireCommand v34.2 V3｜目前施工狀態（2026-10-03）

## 基準與保護

- Repository：`fc781117-jason/firecommand-online`
- Production 基準：`main` / `94c674fdc00704b08e6fd6f009d3197db58e7a4e`
- Feature Branch：`feature/v34-2-tactical-simplification-v3`
- 功能完成 commit：`e2a1cd7a96bb7fc47c91827bacd00b1460b699ea`
- Draft PR：<https://github.com/fc781117-jason/firecommand-online/pull/5>
- Preview：<https://firecommand-online-git-feature-v-207742-fc781117-4321s-projects.vercel.app/>
- Production：**HOLD**。未合併、未改正式資料、未發布 Rules。

## 已完成

- 初期辨識卡任務改用既有任務下拉；選「其他」才顯示自由輸入。
- 未知人數仍可從真正 SOP 手動新增入口登錄；`null` 與 0 分開。
- 續報稿排除「人數待補／任務未指定」，依面向、任務、RIT、待命整理。
- 部署首頁只保留人員、車輛、圖面三個逐層入口。
- 戰術部署圖改為非 Google Maps 的消防示意畫布；案件定位仍保留於案件資訊。
- 車輛第一次點選顯示選取狀態；再點另一車建立 A→B 水線；再點同車開啟操作面板。
- 水線可選取、確認移除並進入 Undo；Preview 未實際執行刪除，避免測試過程誤刪。
- 「危害圖示」改為「戰術圖示」，選單與畫布共用 SVG；含起火點、瓦斯、高壓電、危險物、前進指揮所、休息區、救護區。
- 一般／危險物關係人共用 Contact Component；合併「穿著／特徵／補充」；照片走既有案件私有 Storage 流程。
- 疏散樓層可新增多戶；男女皆已知才自動計算總人數，未知不轉 0，多戶不互相覆蓋。

## 資料與設定

- 無破壞性 migration；舊欄位與舊案件可讀。
- 新增皆為選填相容資料：`contacts[].detail/photoStatus`、`hazardRecord.contactInfo/photoStatus`、`buildingOps.floorActions[].residents[]`、`buildingOpsRevision`。
- 本輪沒有修改 Firestore Rules 或 Storage Rules，也沒有新增環境變數。
- Preview 示範入口只在隔離且無 Firebase 的 Preview 網域啟用；正式登入邏輯未改。

## 尚待實測

- iPhone 真機、相機權限、iOS 鍵盤與觸控。
- 隔離 Firebase／Storage 中的照片上傳、重開案件縮圖持久化及不同權限帳號讀取。
- 兩裝置即時同步、離線重連及衝突。
- Preview 實際執行水線刪除再 Undo（自動測試已通過）。

完整對照與測試結果見 `V34_UI_V3_STATUS.md` 與 `TEST_RESULTS.md`。
