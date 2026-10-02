# FireCommand v34.2 V3｜測試紀錄（2026-10-03）

## 自動檢查

- `node --check assets/app.js assets/intake-ui.js assets/scene32.js assets/scene-ui32.js assets/v34-v3.js`：PASS。
- `node --test tests/*.test.cjs`：**147/147 PASS**。
- `git diff --check`：PASS。

## 真正入口 Preview 驗收

使用隔離示範案件 `FC-20261003-001`，資料僅存 Preview 本機，不寫正式 Firebase。

- SOP → 初期部署 → 手動新增：淡水、人數未知、第一面、滅火攻擊可登錄；摘要顯示 1 筆待補。
- 續報稿實際產生「第一面由淡水分隊執行滅火攻擊」，未出現「人數待補／任務未指定」。
- 部署首頁只有人員、車輛、圖面三入口。
- 登錄淡水11、淡水16；點 A 再點 B 建立供水線；同車第二次點擊開車輛面板。
- 點水線可開啟「移除水線」面板；未執行刪除，Undo 由自動測試驗證。
- 戰術圖示七項可展開；起火點放入畫布後使用 `#scene-fire` SVG，無錯誤 Emoji／文字。
- 4F 設為疏散離開後新增兩戶：第一戶男2女1自動共3；第二戶男性未知、女性2，總數維持未完整；第一戶未被覆蓋。

## 未實測

- iPhone／Android 真機、相機、照片上傳與重開持久化。
- 隔離 Firebase Auth／Firestore／Storage、多帳號、跨裝置、離線重連。
- 正式 Production（依要求 HOLD）。

注意：自動測試 PASS 不等於上述真機或後端端到端項目 PASS。
