# FireCommand UI Design V1 — 部署頁 Golden Reference

## 基準與範圍

- 基準：`feature/v34-2-field-revision-v3-3`，`69d35db2f96ac65c4e14ec4524085a05038d82d6`。
- 分支：`feature/firecommand-ui-deployment-v1`；僅作 Preview，Production HOLD。
- 依 `FireCommand_UI_Design_Handoff_V1.zip` 的 Style A、Style B、`design_tokens.json`。參考 PNG 中的案件資料未複製到程式。
- Style A 用於四張操作卡、表單與狀態；Style B 只用於部署頁短幅品牌 Hero。Hero 為本輪原創視覺素材。
- 未修改 Firestore Schema、Rules、Auth、權限、路由、SOP、人車資料、戰術互動、語音、任務、通知或結案流程。

## 差異與視覺契約

| 原部署頁 | 本輪 Preview |
|---|---|
| 淡色純文字區塊與舊式收合列 | Token 驅動的白底卡、深藍標題、獨立圖示與清楚的次要摘要 |
| 人員、車輛、兩張圖各自顏色與空間感較弱 | 四張卡維持原排序、原生 inline Accordion 和相同觸控區，資源與圖面仍以 Divider 區分 |
| 沒有品牌視覺焦點 | 部署頁頂部加短幅 Style B Hero；實際操作區仍保持 Style A 高可讀性 |
| 主要按鈕和欄位沿用既有尺寸 | 只在部署區套用 48/56px Token；ID、表單事件和畫布未更動 |

本輪沒有將原參考 PNG 用作 UI 背景或測試資料；首頁與其他頁面仍維持既有視覺，待 Golden Reference 確認後再評估擴散。右側品牌照片對不同裝置裁切會有差異，文字區維持深色覆蓋以提高對比。

## 驗證紀錄

- `git diff --check`：PASS。
- `node scripts/verify.cjs`：288 / 288 PASS（本機一般環境；受限沙箱內有一項既有測試無法啟動 `git show` 子程序）。
- 新增 token 對照、四張原始 Accordion／ID／表單保留的自動測試。
- Vercel Preview／iPhone Safari／實際登入案件點擊、捲動和展開：待實測。請勿把本機測試當成真機驗收。

## 發布與回退

- Preview 指向獨立分支，PR 以 V3.3 分支為 base，避免將未合併 V3.x 誤上 Production。
- 無資料遷移、Rules 或環境變數操作。
- 回退只需使 Preview 分支回到基準 SHA；不會改動正式資料。正式發布須另行確認。

## Preview 入口修正

首次 Preview 雖已建置，`/api/preview-mode` 的精確允許清單遺漏此 UI 分支，手機登入按鈕因此停用。後續提交只將 `feature/firecommand-ui-deployment-v1` 加入 Preview 示範允許清單，並擴充相同測試矩陣。Production、其他分支及實際 Firebase 案件的隔離條件保持不變；此項屬驗收入口修復，沒有更動業務功能。
