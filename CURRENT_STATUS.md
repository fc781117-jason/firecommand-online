# FireCommand VNext｜現場回饋施工斷點（2026-09-30）

## 基準與保護

- Repository：`fc781117-jason/firecommand-online`；遠端 `main` 查詢時為 `e7c37b46f888cee850a025d22e536be2c1e5545e`。
- 工作分支：`feature/vnext-field-feedback`，承接未推送的本機 v33 帳號管理 commit `875d5a5`。Production 沒有更新。
- 現況：靜態 HTML＋原生 JavaScript；Firebase Auth／Firestore；Vercel 以 Git 部署。未找到 Service Worker、PWA manifest、獨立 Preview Firebase 設定或本機 Vercel 專案連結。帳號管理 v33 在本分支沿用，未重做。
- 本次未寫入正式資料、未發布 Firestore Rules、未推送或部署 Production。
- 2026-09-30 推送功能分支失敗：`git push -u origin feature/vnext-field-feedback` 回覆 `fatal: could not read Username for 'https://github.com'`；此工作環境沒有可用的 GitHub 寫入登入憑證。遠端沒有本分支，Preview 因此未建立。請使用核准的 GitHub 連接／登入方式，或由使用者自行推送；不要分享個人存取權杖到對話。

## 已施工（第一批，不是整份 VNext 完工）

| 項目 | 目前成果 |
|---|---|
| P01、P03、P04、P06 | 獨立人員登錄只需名冊內有效單位；空白儲存 `count:null`，明確 0 保留，無效值拒絕。同一普通單位再填人數更新原 ID；舊資料缺 count 顯示待補。 |
| P05、R01 | 部署及部分總覽／匯出改標「已確認人數小計＋待補筆數」，不稱已知小計為總人數。仍須確認舊有母隊與拆組資料是否有重複歸屬。 |
| P07、P08、P09、P10、U01 | 人員、車輛分離成兩個收合入口；另有危害、水線導向同一戰術圖。單位選單依大隊分組，車輛只需大隊、單位、車號，重複保存以固定 ID 避免重複。 |
| V01–V03 部分 | 本機語意解析支援連續單位／人數例句；未到、建議保留為情資；重要操作仍走人工確認。未知人數不再強迫補填。 |
| D01、D02 部分 | 新表單「尚未儲存／儲存中／已同步儲存／儲存失敗／版本衝突」；Firestore 交易讀取舊版時間戳，失敗保留輸入。示範模式標為本機，未聲稱離線同步。 |
| 權限 | 保留既有案件權限與練習觀察員限制；Firestore Rules 對新／更動 count 的資料驗證空白、null 或 0–99 整數，舊資料僅改其他欄位時不強制洗掉。Rules 尚未部署驗證。 |

## 尚未完成／安全阻礙

- 關係人逐筆儲存及照片、外單位支援獨立儲存、前進指揮所橫列尚未施工。現有關係人／支援仍會在到場表變更時自動儲存，不能宣稱整頁都已改成手動確認。
- 戰術圖仍有既有複雜工具，僅入口整合；A→B 車間水線、交叉不接合／明確接點、編輯草稿取消及人工幾何保留尚未驗收。
- 照片暫停實作：目前 `firebase/storage.rules` 的 `case-photos/{caseId}` 對所有已登入者開放讀寫，未達「僅案件授權人員可見」。必須先設計、測試 Storage Rules 與 Preview 隔離，再啟用此功能；不得把照片上傳到現有寬鬆目錄。
- Preview 防護：在非正式的 `*.vercel.app` 網域，現在停用 Firebase 並只提供本機示範入口，防止 Preview 寫入正式 Firebase；這不是多帳號 Preview 驗收。正式固定網址 `firecommand-online.vercel.app` 保持原登入。自訂 Preview 網域尚未支援，使用前必須核對隔離；完整 Preview Auth／Firestore／Storage 實測仍需經核准的測試 Firebase 專案。
- 人員母隊與分組目前缺可靠 `parentCrewId` 等歸屬欄位；既有數值只能稱逐筆已知小計，不能當去重後可用戰力。未自行搬動歷史 0 或批次 migration。
- 沒有原始 Case 001／002 的驗證資料集；既有敘述不可充當 replay 標準答案。通知與 Service Worker 仍非本輪實作。

## 下一安全批次

1. 先以本機示範模式在 Preview 檢查畫面；在隔離測試專案驗證 Firebase Rules／新舊案件／練習模式／重連及雙裝置衝突。
2. 關係人照片先收斂 Storage Rules 與授權；再實作逐筆文字與附件結果分流。
3. 支援需求獨立草稿與後端交易；再整理前進指揮所和圖面模式。
4. 補足 A/B 連線、顯式接點與圖面版本衝突；建立 Case replay 合成資料。
5. 完整 Preview 與 iPhone 驗收後，交使用者確認；Production 維持 HOLD。
