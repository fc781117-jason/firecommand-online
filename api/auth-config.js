// Public OAuth client ID only. No secret or token is exposed by this endpoint.
module.exports=(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const googleClientId=process.env.GOOGLE_WEB_CLIENT_ID||'';
 res.setHeader('Cache-Control','no-store');
 return res.status(200).json({googleClientId:/^[\w.-]+\.apps\.googleusercontent\.com$/.test(googleClientId)?googleClientId:''});
};
