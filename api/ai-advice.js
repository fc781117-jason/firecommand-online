export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(501).json({ error: 'OPENAI_API_KEY 尚未在 Vercel Environment Variables 設定。' });
  try {
    const body = req.body || {};
    const caseData = body.caseData || {};
    const prompt = `你是消防火場指揮輔助系統。請依據新北市消防局火場指揮作業邏輯，針對下列火場態勢提出「僅供參考」的戰術提醒。不要杜撰法律命令，不取代現場指揮官判斷。請用繁體中文，分成：1態勢摘要、2立即確認、3安全風險、4人命搜救、5水源水線、6支援與回報。\n\n案件資料：${JSON.stringify({caseData, vehicles:body.vehicles, crews:body.crews, hoses:body.hoses, hazards:body.hazards, buildingOps:body.buildingOps, localRules:body.localRules}).slice(0,12000)}`;
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', input: prompt, max_output_tokens: 900 })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'OpenAI API error' });
    const advice = data.output_text || (data.output || []).flatMap(o => o.content || []).map(c => c.text || '').join('\n') || 'AI 未回傳文字。';
    return res.status(200).json({ advice });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
