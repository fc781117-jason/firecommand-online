function normalizeModelName(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'gpt-4.1-mini';
  if (/^gpt-|^o\d|^chat-latest$/i.test(raw)) return raw;
  // 允許在 Vercel 輸入「5.4 mini」這類口語寫法，轉成常見 API model id 格式。
  return `gpt-${raw.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-')}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(501).json({ error: 'OPENAI_API_KEY 尚未在 Vercel Environment Variables 設定。' });
  const model = normalizeModelName(process.env.OPENAI_MODEL);
  try {
    const body = req.body || {};
    const caseData = body.caseData || {};
    const mode = body.mode || 'advice';
    const dataPayload = {caseData, vehicles:body.vehicles, crews:body.crews, hoses:body.hoses, hazards:body.hazards, sitreps:body.sitreps, logs:body.logs, buildingOps:body.buildingOps, localRules:body.localRules, assessmentDraft:body.assessmentDraft, baseReport:body.baseReport};
    let prompt;
    if (mode === 'assessment') {
      prompt = `你是消防火場指揮檢討與案例教育輔助系統。請根據下列案件資料，產出「檢討及評估優化報告」草稿。請用繁體中文，分成：1資料完整性、2時間序列摘要、3人車水線統計、4搶救部署評估、5安全風險與PAR/RIT、6優點、7缺點、8策進建議。不要杜撰未提供事實；不取代正式調查與指揮官判斷。

案件資料：${JSON.stringify(dataPayload).slice(0,16000)}`;
    } else if (mode === 'report') {
      prompt = `你是消防火場勤務報告撰寫輔助系統。請依據提供的案件資料與本機報告草稿，產出可供長官檢閱的正式火場進度報告。僅保留：一、火場概要與目前發展；二、目前部署與戰力概況；三、各單位戰情及傷患者回報彙整；四、建物內部作戰圖與戰術部署摘要；五、目前注意事項與建議。請使用正式標題、次標題與完整段落；必要時才使用一般條列。不得使用 Markdown 的星號、井字號、粗體符號或程式碼格式，不得把每一句拆成短句方框。第四節不得逐項抄錄入口、隔間、水線、起火點等繪圖工具紀錄，只需整體說明，詳細位置由附圖呈現。不得杜撰未提供的事實，不得加入操作歷程、完整時間軸、檢討或後續評估章節。

使用者補充指令：${body.reportInstruction || ''}

案件資料：${JSON.stringify(dataPayload).slice(0,16000)}`;
    } else {
      prompt = `你是消防火場指揮輔助系統。請依據新北市消防局火場指揮作業邏輯，針對下列火場態勢提出「僅供參考」的戰術提醒。不要杜撰法律命令，不取代現場指揮官判斷。請用繁體中文，分成：1態勢摘要、2立即確認、3安全風險、4人命搜救、5水源水線、6支援與回報。

案件資料：${JSON.stringify(dataPayload).slice(0,16000)}`;
    }
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model, input: prompt, max_output_tokens: mode === 'report' ? 1800 : 900 })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'OpenAI API error', modelUsed: model });
    const advice = data.output_text || (data.output || []).flatMap(o => o.content || []).map(c => c.text || '').join('\n') || 'AI 未回傳文字。';
    return res.status(200).json({ advice, modelUsed: model });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error', modelUsed: model });
  }
}
