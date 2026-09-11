# v32 驗證紀錄

- 121 項 Node 自動測試通過（詳 tests/test-results-v32.txt）。
- 新增共用場景、2–6線分流、離群點、等比例、撤出狀態、SOP位置、各面頭車、道路折線、手動位置、UI安裝與道路交易、待命區、道路API權限與結果驗證。
- PNG由assets/scene32.js共用繪圖函式產生並目視檢查；非AI生成圖。
- 正式站未部署。測試瀏覽器無法連入本機地址（ERR_BLOCKED_BY_CLIENT）；不宣稱瀏覽器互動或iPhone實測通過。
- Google底圖、真實Roads API、兩帳號同步及觸控拖曳需上線驗收。
- Roads API為選用功能；未配置金鑰時明確提示，可使用底圖兩點校正。
