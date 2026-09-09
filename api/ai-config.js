import { requireActiveUser } from '../server/firebase-auth.js';
import { configuration } from '../server/ai-router.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{await requireActiveUser(req);return res.status(200).json({...configuration(),note:'已設定僅代表環境變數存在，不代表金鑰、模型權限或額度已驗證。'});}catch(e){return res.status(e.status||503).json({error:e.message});}
}
