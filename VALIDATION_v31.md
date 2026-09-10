# v31 驗證紀錄

- 自動測試：109項通過、0失敗（原有96項＋13項本次繪圖案例）。完整輸出見tests/test-results-v31.txt。
- 覆蓋：裸車號、重複分隊前綴、111車號保留、跨分隊來源與水線歸屬、六車接龍、兩條攻擊線、各面獨立車隊、先後句順序、人員入室與樓層、未知人數、指揮站與待命區、救護車集結、跨次補頭車、重複回報、人工位置、逐筆依賴提交。
- JavaScript語法、HTML重複ID、本機資源存在、版本參照、ZIP及逐檔SHA256：封裝時驗證，結果见tests/static-results-v31.json與MANIFEST_SHA256.json。
- 示意圖：以新版deploymentSchematicHtml與真實例句編譯結果產生SVG，再渲染PNG並目視檢查；不是另畫一張與程式無關的概念圖。
- 沒有完成實機瀏覽器測試。Google Maps、iPhone Safari、Google登入、付費AI真實回應及雙帳號線上同步仍需部署後驗收。
- Firebase規則、登入程式與設定未因本次繪圖功能改動。
