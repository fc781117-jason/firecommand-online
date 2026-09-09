# FireCommand v29｜OpenAI／Gemini 設定與切換指南

查核日期：2026-09-07。此 App 使用 API，不是直接借用 ChatGPT 或 Gemini 聊天視窗。您提到的另一服務，本版依 Google Gemini 實作。

## 先準備什麼

| 資料 | 放在哪裡 | 用途 |
|---|---|---|
| OpenAI API key | Vercel 環境變數 `OPENAI_API_KEY` | 呼叫 OpenAI 模型 |
| Gemini API key | Vercel 環境變數 `GEMINI_API_KEY` | 呼叫 Google Gemini |
| 正式 App 網址、原 Vercel 專案 | 原部署專案 | 保持案件與登入設定連續 |
| Firebase 專案 ID／Web API key（換專案才需調整） | `FIREBASE_PROJECT_ID`／`FIREBASE_WEB_API_KEY`，並與前端 Firebase 設定一致 | AI 端點驗證使用者登入及啟用狀態 |
| Google OAuth Web client ID（原登入尚未設定時） | `GOOGLE_IDENTITY_CLIENT_ID` | 處理原本的 Google 登入；不是 AI 金鑰 |

API 金鑰請由管理者直接填在 Vercel，不要放到 `index.html`、`assets`、前端 Firebase 設定或聊天訊息中。前端「檢查 AI 設定」只顯示是否已配置、模型名稱，不顯示密鑰。

## 1. OpenAI

前往 [OpenAI API 平台](https://platform.openai.com/)，選擇您的組織／專案，從 API keys 建立該專案的金鑰。確認此 API 專案可使用您選擇的模型，並在 [API 帳務設定](https://platform.openai.com/settings/organization/billing/overview) 查看餘額及付費方式。

**ChatGPT Plus／Pro 與 API 分開計費**。聊天介面還有用量，不代表 API 有額度；ChatGPT 的使用上限也不會直接消耗本 App 的 API 額度。[OpenAI 官方帳務說明](https://help.openai.com/en/articles/9039756)

本版預設 `gpt-4.1-mini`，透過 Responses API 與 JSON Schema 輸出分類草稿。若更換模型，請填完整 API model ID，並確認支援 Structured Outputs；不要填「ChatGPT」「5.4 mini」等顯示名稱。[OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

## 2. Google Gemini

前往 [Google AI Studio API keys](https://aistudio.google.com/apikey)，登入您的 Google 帳號，在對應 Google Cloud 專案建立／選用 Gemini API key。於 AI Studio Dashboard 查看該專案的模型權限、使用量與 API 計費狀態。

Gemini API 的使用額度依 API 專案、模型、地區、用量層級及帳務狀態而異，不能因為平常較少使用 Gemini 聊天就推定 App 有更多免費額度。Google AI 訂閱在 AI Studio 介面的福利，與外部 App 直接呼叫 API 分開管理；部分符合資格的 Cloud credits 需另外啟用並依規則套用。[Google 官方訂閱與 API 區別](https://ai.google.dev/gemini-api/docs/google-ai-plans)

本版預設 `gemini-2.5-flash`，備用 `gemini-2.5-flash-lite`，使用 `generateContent` 與 JSON Schema；兩者可由環境變數調整。模型是否能使用，仍以您的 API 專案實際回應為準。[Gemini 模型清單](https://ai.google.dev/gemini-api/docs/models)、[generateContent API](https://ai.google.dev/api/generate-content)

## 3. 填入 Vercel

開啟原 FireCommand 的 Vercel 專案，進入專案設定中的 **Environment Variables**，新增下表變數，選定要使用的環境（正式站選 Production；測試部署另選 Preview）。儲存後重新部署。**環境變數變更不會套用到已完成的舊部署**。[Vercel 官方環境變數指南](https://vercel.com/docs/environment-variables/managing-environment-variables)

| 變數名稱 | 建議值／預設 | 必要性 |
|---|---|---|
| `OPENAI_API_KEY` | 您的 OpenAI API key | 使用 OpenAI 才需要 |
| `OPENAI_MODEL` | `gpt-4.1-mini` | 可省略，使用預設 |
| `OPENAI_FALLBACK_MODEL` | 留空；如需同家降級，填您已確認可用且支援結構化輸出的模型 ID | 選填；未設不增加同家嘗試 |
| `GEMINI_API_KEY` | 您的 Gemini API key | 使用 Gemini 才需要 |
| `GEMINI_MODEL` | `gemini-2.5-flash` | 可省略，使用預設 |
| `GEMINI_FALLBACK_MODEL` | `gemini-2.5-flash-lite` | 可省略，使用預設 |
| `AI_PRIMARY_PROVIDER` | `openai` 或 `gemini`；預設 `openai` | 想平常優先 Gemini 時改為 `gemini` |
| `AI_FALLBACK_ENABLED` | `true`；停用時填 `false` | 管理者的備援總開關 |

**最少可以先只填一家的金鑰**。要跨服務備援，兩家都需有可用 API key；只有 ChatGPT／Google 登入帳密不夠。不要填引號、不要在值後面附註說明。

本包已將 `/api/ai-advice` Function 的 `maxDuration` 設為 90 秒，請確認原專案的執行設定／方案允許。若使用較舊的短時限設定，備援可能被平台提前中止，需調整執行設定。程式本身仍限制模型嘗試時間，不會等滿 90 秒才開始處理。[Vercel Function 時限說明](https://vercel.com/docs/functions/configuring-functions/duration)

## 4. 在 App 裡怎麼切換

SOP → 初期部署 → 部署 → 文字回報 → 展開 **AI 服務與備援設定**。

- 「優先使用」：依系統設定、OpenAI、Google Gemini。
- 「失敗時允許切換」：勾選才允許跨家及備用模型嘗試；管理者若在環境變數停用，前端不能重新開啟。
- 「檢查 AI 設定」：只檢查伺服器是否有設定金鑰、使用哪個模型；**不是 API 連線或餘額測試**。
- 「AI 辨識內容」：以少量測試敘述實際驗證，成功時顯示實際服務與模型。
- 「本機整理（非 AI）」：不呼叫模型、不產生 AI API 費用；能力較受限制，仍可手動新增及修改項目。

此頁的優先服務與備援選項會套用到本次開啟 App 的其他 AI 功能，包括報告、建議、演練情境與 SDS 摘錄。重新載入後回到系統預設。勾選跨服務備援代表必要時同一份輸入會送到另一家已設定服務；若只希望資料送至一家，選定該家並取消勾選。

## 5. 備援順序

每次最多三次，跳過未配置的服務及重複模型：

1. 您指定或系統預設的主要服務／模型。
2. 另一家已配置的主要模型。
3. 主要服務的備用模型；若未配置，使用另一家的備用模型。

例如預設 OpenAI，未設 OpenAI 備用模型：`gpt-4.1-mini → gemini-2.5-flash → gemini-2.5-flash-lite`。若優先 Gemini 且配置兩家：`gemini-2.5-flash → gpt-4.1-mini → gemini-2.5-flash-lite`。

每次模型嘗試約 17 秒上限，模型階段總預算約 48 秒；還需加登入驗證與網路時間。這是保護上限，不是保證回應速度。遇 429（額度／速率）、網路／逾時、上游錯誤、格式不完整會依順序嘗試。被截斷的 JSON 不會作為成功資料登錄。模型內容拒絕則停止並請人工處理，不透過另一服務規避拒絕。

同一 API 專案的限制可能跨模型共享，**降級模型不保證能繞過額度限制**。如果兩家都失敗，原文與既有資料保留，使用者可選擇本機整理或手動新增。模型只讀取並整理；即使重試，也不會自己重複寫入消防案件。

## 6. 常見問題

| 畫面／狀況 | 處理方式 |
|---|---|
| 尚未設定 API 金鑰 | 確認名稱、Production／Preview 選擇是否正確，儲存後重新部署 |
| 已設定但仍失敗 | 「已設定」只表示有值；檢查金鑰有效性、模型 ID／權限、帳務餘額與網路；可切換另一服務測試 |
| 請先登入／帳號尚未啟用 | 完成 Firebase 登入及帳號審核；本機模式不能跳過 API 身分驗證 |
| 等候逾時 | 可切換服務，或縮短本次報告；原文保留。若固定很短時間就中斷，檢查 Vercel Function 時限 |
| AI 少辨識一個分隊 | 直接新增「人員報到／部署」卡片，選分隊、填人數，確認後同步；也可修改原文重新辨識 |
| 確認登錄仍不可按 | 查看選入項目的紅字；修改欄位、完成單項確認，或取消選入問題項目；再做總確認 |
| 同時有人修改現場資料 | 點「以最新資料重新核對」，檢查新差異後再送出 |
| 地圖缺少精確位置 | 本版可整理四面與人車水線關係；消防栓地點、樓層走線等請用原圖面工具補上 |
| 又看到 missing initial state | 這是 Google／Firebase 登入問題，與 AI key 無關；看 `LOGIN_v28.md`，關閉舊 Firebase 回跳頁，從正式 App 首頁登入 |

## 7. 初次驗收

先開練習案件，輸入「淡水分隊七人、竹圍分隊六人、三芝分隊三人到場」，按 AI 辨識，確認服務／模型有顯示、三筆人員合計 16。把淡水改成中文「九」，確認後應合計 18；再回報「竹圍新增兩人」應為 20。到部署圖及人員名冊比對。

再測「淡水第一面一線」，應為待確認來源的示意線；補上「淡水11到場，淡水11第一面一線」，確認沿用原線。最後分別選 OpenAI、Gemini 並關閉備援，驗證兩家皆可實際呼叫。不要用真實案件作第一次測試。

本次交付使用模擬 API 驗證路由、格式、回退及登錄流程，尚未取得您的實際 API key；上述真實模型與真機測試需部署後完成。
