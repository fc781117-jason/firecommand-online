import { requireActiveUser } from '../server/firebase-auth.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{await requireActiveUser(req);}catch(e){return res.status(e.status||503).json({error:e.message});}
 const key=process.env.GOOGLE_ROADS_API_KEY;if(!key)return res.status(503).json({error:'尚未設定道路辨識服務'});
 const points=req.body?.points;if(!Array.isArray(points)||points.length<2||points.length>100||points.some(p=>!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180))return res.status(400).json({error:'請提供2至100個有效道路座標'});
 if(points.some(p=>Math.abs(p.lat-points[0].lat)>.01||Math.abs(p.lng-points[0].lng)>.01))return res.status(400).json({error:'請限定在火場附近道路'});
 try{const url=new URL('https://roads.googleapis.com/v1/snapToRoads');url.searchParams.set('path',points.map(p=>p.lat+','+p.lng).join('|'));url.searchParams.set('interpolate','true');url.searchParams.set('key',key);const r=await fetch(url,{signal:AbortSignal.timeout(12000)}),d=await r.json();
 if(!r.ok||!d.snappedPoints?.length)return res.status(502).json({error:'道路服務未提供可用結果，請確認Roads API已啟用'});
 const result=d.snappedPoints.map(p=>({lat:p.location.latitude,lng:p.location.longitude}));if(result.some(p=>!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat-points[0].lat)>.012||Math.abs(p.lng-points[0].lng)>.012))return res.status(422).json({error:'道路候選超出火場範圍，請改用手動點選'});if(result.length<2)return res.status(422).json({error:'道路線段不足，請改用手動點選'});
 return res.status(200).json({points:result,source:'google-roads'});
 }catch{return res.status(502).json({error:'道路辨識暫時無法使用'});}
}
