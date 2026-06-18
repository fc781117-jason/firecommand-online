# FireCommand v17｜到建火人支初破警＋正式進度報告優化版

## 本版重點
- 到建火人支初新增「破」與「警」。
- 到場確認事項新增「關係人」，支援、破門、警戒與 PAR 回報流程優化。
- PAR 依已登錄分隊自動條列勾選，不需重新輸入。
- 戰情回報拆成「現場火勢/狀況回報」與「傷/患者狀況回報」。
- 建物內部作戰圖改為拖拉式工具，隔間以線段標示，人、火、入口、危害等以圖示標示。
- AI 戰術建議自動依現況輸出，按鈕保留 15 分鐘節流；最高管理員不受節流限制。
- 檢討及評估優化報告改為結案後才能使用。
- 進度報告移除操作歷程、時間軸流水帳與檢討後續評估，改為正式給長官檢閱的報告格式。
- 報告預覽與匯出 PDF 採制式表格與粗體標題，滿版浮水印包含使用者姓名、單位、案件編號與時間。
- 照片與 Firebase Storage 持續移除；不需設定 Storage Rules。

## 部署
上傳以下內容到 GitHub 專案根目錄：
- index.html
- assets/
- api/
- firebase/
- vercel.json
- README.md

## 必要設定
- Firebase Auth：Google 登入
- Firestore Database：發布 firebase/firestore.rules
- Vercel Environment Variables：OPENAI_API_KEY、OPENAI_MODEL

## 最高管理員
固定最高管理員：fc781117@gmail.com。首次登入會自動啟用，不需自我審核。
