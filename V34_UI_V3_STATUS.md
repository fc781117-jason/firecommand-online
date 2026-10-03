# FireCommand v34.2 現場操作修訂 V3.0｜施工與驗收紀錄

基準：`main` / `94c674fdc00704b08e6fd6f009d3197db58e7a4e`。功能分支：`feature/v34-2-tactical-simplification-v3`。Production HOLD。

## 需求對照

| 需求 | 實際入口／元件 | 修改內容 | 結果 |
|---|---|---|---|
| B1、B2 | SOP → 初期部署 → `#intakeChanges28` | 任務改既有 Enum 下拉；其他才開文字；未知／0／1–15 分離；真正手動新增允許未知 | Preview PASS、automated PASS |
| C1、C2 | 概要／續報 → `#commandSpeech` | 只輸出已確認且具指揮價值內容；不朗讀缺口 | Preview PASS、automated PASS |
| D、E、J、K | 部署 → `#tacticalMapSection`、`#tacticalCanvasV3` | 三入口逐層展開；戰術示意與案件 Google 定位解耦 | Preview PASS、automated PASS |
| F1–F5 | 戰術畫布車輛／水線 | Selected State；A→B 建線；同車第二次點擊開面板；水線選取／移除／Undo | 建線與面板 Preview PASS；刪除＋Undo automated PASS、Preview NOT TESTED |
| G1–G4 | `#tacticalIconPaletteV3`、SVG symbols | 改名戰術圖示；七項工具；選單與畫布共用 SVG | Preview PASS、automated PASS |
| H1–H5 | SOP 關係人、危險物關係人 | 共用 Contact Component、合併補充欄、右側縮圖、照片狀態 | UI／資料流 automated PASS；照片端到端 NOT TESTED |
| I1–I7 | 部署 → 建物內部作戰圖 → 樓層住戶 | 多戶、戶號、聯絡人、男女、總數、補充、照片、修改、樓層統計 | Preview PASS（無照片）、automated PASS |

## TEST-01～20

| TEST | 結果 | 證據／限制 |
|---|---|---|
| 01 | PASS | 正式 SOP 卡可選既有任務與其他文字 |
| 02 | PASS | Preview 續報無未知人數文字 |
| 03 | PASS | Preview 與測試均不輸出未指定任務 |
| 04 | PASS | 續報排序自動測試 |
| 05 | NOT TESTED | 相機／隔離 Storage 未提供 |
| 06 | NOT TESTED | 同上，不能宣稱重開仍有縮圖 |
| 07 | PASS / 部分 | 共用元件與資料流 PASS；照片端到端未測 |
| 08 | PASS | Preview 為獨立戰術 SVG 畫布 |
| 09 | PASS | A 車出現選取狀態 |
| 10 | PASS | A→B 建立一條供水線 |
| 11 | PASS | 同車第二次點擊開啟面板 |
| 12 | PARTIAL | 水線選取與移除 UI PASS；實際刪除／Undo 僅 automated PASS |
| 13 | PASS | 實際放置使用 `href=#scene-fire` |
| 14 | PASS | 七項戰術圖示 Preview 可見 |
| 15 | PASS | Preview 4F 疏散後可新增多戶 |
| 16 | PASS / 部分 | 欄位與無照片儲存 PASS；照片未測 |
| 17 | PASS | 男2女1自動共3 |
| 18 | PASS | 男未知、女2仍顯示未完整 |
| 19 | PASS | 修改入口存在；automated PASS |
| 20 | PASS | Preview 兩戶並存，不覆蓋第一戶 |

## 變更檔案

- `index.html`
- `assets/app.js`
- `assets/intake-ui.js`
- `assets/scene-ui32.js`
- `assets/scene32.js`
- `assets/v34-v3.css`
- `assets/v34-v3.js`
- `tests/scene32.test.cjs`
- `tests/v34-v3.test.cjs`
- 本輪狀態、測試、交接與更新說明文件

## 資料相容性與回退

- 無必要資料庫 migration，無 Firestore／Storage Rules 變更，無環境變數變更。
- 新欄位均為選填；舊程式可忽略，舊案件不批次重寫。
- 回退方式：保留 `main` 不動；關閉 Draft PR 或在功能分支 revert 本輪 commits。禁止 reset、force push、刪除正式資料。

## 仍待完成

- 隔離 Firebase／Storage 的照片儲存、重開、權限實測。
- iPhone 真機、相機權限、觸控、鍵盤與旋轉。
- 多裝置同步、離線重連、衝突。
- 使用者確認 Preview；之後才可規劃 Production。
