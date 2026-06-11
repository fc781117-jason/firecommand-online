# FireCommand v9 Online Release

本版以 v8 為基礎，整合：

- 外勤大隊編制修正（依 115 年 4 月電話簿外勤單位區塊整理）
- 第三大隊移除錯誤的五股中隊；第三大隊單位為：大隊部、三重中隊、蘆洲中隊、淡水中隊、三重、重陽、二重、鷺江、蘆洲、龍源、八里、淡水、竹圍、三芝、滬尾
- 最高管理員固定：fc781117@gmail.com
- 新帳號預設 pending，需最高管理員啟用；最高管理員不可被停權
- 水線可標示「進攻水線 / 供水線 / 防護水線 / 搜救掩護水線 / 中繼水線」並連接人員編組 / 分隊
- 建物內部作戰圖：左側縱向剖面圖、右側水平俯視圖
- OpenAI 戰術建議模組：15 分鐘節流；需在 Vercel 設定 OPENAI_API_KEY
- 報告與浮水印功能沿用 v8

## OpenAI 啟用方式

請勿將 OpenAI API Key 寫入前端或 GitHub。請在 Vercel Project → Settings → Environment Variables 新增：

- `OPENAI_API_KEY`：你的 OpenAI API key
- `OPENAI_MODEL`：可選，例如 `gpt-4.1-mini`

完成後重新 Deploy。

## Firebase Rules

請同步將 `firebase/firestore.rules` 與 `firebase/storage.rules` 貼到 Firebase Console 後發布。
