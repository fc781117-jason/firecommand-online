/** Public deployment classification only. Never returns credentials or raw env values. */
export default function handler(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('Vercel-CDN-Cache-Control','no-store');
  res.setHeader('CDN-Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({demoEnabled:false,target:'unavailable'});
  const value=process.env.VERCEL_ENV;
  const target=['preview','production','development'].includes(value)?value:'unavailable';
  // This review fixture belongs only to the authorized revision branch.
  const demoEnabled=target==='preview'&&['feature/v34-2-field-revision-v3-1','feature/v34-2-field-revision-v3-2','feature/v34-2-field-revision-v3-3'].includes(process.env.VERCEL_GIT_COMMIT_REF);
  return res.status(200).json({demoEnabled,target});
}
