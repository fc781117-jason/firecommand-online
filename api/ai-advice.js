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
    const prompt = mode === 'assessment'
      ? `你是消防火場指揮檢討與案例教育輔助系統。請根據下列案件資料，產出「檢討及評估優化報告」草稿。請用繁體中文，分成：1資料完整性、2時間序列摘要、3人車水線統計、4搶救部署評估、5安全風險與PAR/RIT、6優點、7缺點、8策進建議。不要杜撰未提供事實；不取代正式調查與指揮官判斷。\n\n案件資料：${JSON.stringify(dataPayload).slice(0,16000)}`
      : `你是消防火場指揮輔助系統。請依據新北市消防局火場指揮作業邏輯，針對下列火場態勢提出「僅供參考」的戰術提醒。不要杜撰法律命令，不取代現場指揮官判斷。請用繁體中文，分成：1態勢摘要、2立即確認、3安全風險、4人命搜救、5水源水線、6支援與回報。\n\n案件資料：${JSON.stringify(dataPayload).slice(0,16000)}`;
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
