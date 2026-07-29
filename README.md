# FireCommand v22｜Google Maps 精準定位與戰術繪圖重構版

## 本版核心成果

### Google Maps 全面取代 OpenStreetMap

- 外部戰術部署圖改為 Google Maps JavaScript API。
- 地址輸入可使用 Places API（New）候選結果，不再直接採用模糊地址的第一筆結果。
- Google Geocoder 僅用於地址候選與備援查詢。
- 內建定位診斷，可分別檢查：
  - Vercel `GOOGLE_MAPS_BROWSER_KEY`
  - HTTPS
  - Maps JavaScript API
  - Places API（New）
  - Geocoding API
  - 手機 GPS 權限
  - Google 地圖是否成功顯示
- Google 地圖載入失敗時，不再偷偷切回行政區中心地圖；改為顯示明確錯誤與重新檢查按鈕。
- GPS 改為連續取樣，最多約 18 秒，自動採用精度最佳的一筆。
- 地址、GPS、手動點選均需經使用者確認後才能鎖定案件中心。

### 拖拉式人車與水線部署

- 車輛、人員、危害標示集中在地圖上方的橫向資源列。
- 可先點選資源再點地圖放置；桌面及支援拖放的裝置也可直接拖到地圖。
- 水線可從水車快速建立，再點車輛、人員或地圖位置完成連接。
- 水線永遠保存來源與終點；來源或目標移動時會同步更新。
- 點選人、車、水線或危害標示，使用底部操作面板修改、重接或刪除，不再依賴瀏覽器 prompt。
- 人員拖到另一作業編組附近可執行任務接替，水線與任務同步轉移並記錄時間。

### 建物內部作戰圖

- 直向與橫向都可使用；直向時顯示橫向繪圖提示，但不強制旋轉。
- 預設 3F、2F、1F，可增加上方樓層與地下室。
- 支援：
  - 點選放置起火點、待救者、死亡者、入口、危害物
  - 手指拖曳繪製隔間線與水線
  - 水平、垂直、45 度吸附
  - 選取並拖曳點狀圖示或整條線
  - 調整線段兩端
  - 橡皮擦
  - 復原／重做
  - 複製相鄰樓層
  - 清除本樓層
  - 鎖定圖面防止誤觸
- 文字備註改為選用；非必要不要求輸入文字。

### 手機鍵盤語音輸入提示

- 戰情、患者補述、到場補述及重要備註欄位顯示「使用手機鍵盤語音輸入」。
- 本版不收集、不上傳語音，也不使用第三方語音辨識服務。
- 按鈕只會聚焦文字欄位，提示使用 iOS／Android 鍵盤內建麥克風。

### 正式報告與返回機制

- PDF／列印改為同頁報告預覽，不再依賴另開彈出視窗。
- 報告頁永遠保留「返回系統」按鈕；瀏覽器返回鍵也能回到原案件分頁。
- 列印或存 PDF 完成後，報告預覽不會卡住 APP。
- PDF 不放 Google 導航底圖，改用正式化戰術部署示意圖：
  - 建物範圍
  - 車輛
  - 人員
  - 危害標示
  - 水線連接
  - 建物內部作戰圖
- 滿版浮水印仍包含姓名、單位、案件編號與產出時間。

### 其他修正

- 帳號管理不再嘗試把管理動作寫入不存在的案件紀錄。
- Vercel rewrite 僅處理首頁，避免 `/api/maps-config` 被錯誤導向 `index.html`。
- 案件頁維持真正分頁工作區，不再是一頁式長頁面。

## 必要環境變數

### OpenAI

```text
OPENAI_API_KEY
OPENAI_MODEL
```

### Google Maps

```text
GOOGLE_MAPS_BROWSER_KEY
```

瀏覽器用 Key 必須在 Google Cloud 設定：

1. Billing 已啟用。
2. 已啟用：
   - Maps JavaScript API
   - Places API（New）
   - Geocoding API
3. Application restrictions：Websites。
4. Website restrictions 至少包含：

```text
https://firecommand-online.vercel.app/*
```

5. API restrictions 只允許上述三個 API。
6. Vercel Environment Variable 套用至 Production；如使用 Preview 測試，也必須套用 Preview，並將 Preview 網址加入網站限制。
7. 修改 Vercel 環境變數後必須重新部署。

## 定位診斷

發布後進入案件：

```text
部署 → 車輛／人員／危害／水線部署圖 → 定位診斷
```

依序執行：

```text
執行定位診斷
複製診斷結果
```

診斷內容不會複製完整 API Key。

## 部署

將以下內容完整覆蓋到 GitHub 專案根目錄：

```text
index.html
assets/
api/
firebase/
vercel.json
README.md
```

確認 Vercel 已設定環境變數後重新部署。
