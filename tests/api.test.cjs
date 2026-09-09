const {test}=require('node:test');const assert=require('node:assert/strict');
const response=(data,ok=true,status=200)=>({ok,status,json:async()=>data});
async function call(body,auth=true,active=true,output='{}'){
 const original=global.fetch;const key=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-only-not-a-key';let upstream=0;
 global.fetch=async url=>{if(String(url).includes('accounts:lookup'))return response({users:[{localId:'test-user'}]});if(String(url).includes('firestore.googleapis'))return response({fields:{status:{stringValue:active?'active':'pending'}}});upstream++;return response({output_text:output});};
 try{const {default:handler}=await import('../api/ai-advice.js');const res={code:200,status(n){this.code=n;return this;},json(data){this.data=data;return this;}};await handler({method:'POST',headers:auth?{authorization:'Bearer test-token'}:{},body},res);return {code:res.code,data:res.data,upstream};}finally{global.fetch=original;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
}
test('API 無登入與待審核帳號均不得呼叫付費模型',async()=>{const a=await call({mode:'deployment_parse'},false);assert.equal(a.code,401);assert.equal(a.upstream,0);const b=await call({mode:'deployment_parse'},true,false);assert.equal(b.code,403);assert.equal(b.upstream,0);});
test('API 部署解析、SDS 與角色回應回傳各自結構',async()=>{let r=await call({mode:'deployment_parse'},true,true,'{"vehicles":[],"crews":[],"hoses":[],"unresolved":[]}');assert.deepEqual(r.data.plan.vehicles,[]);r=await call({mode:'sds_extract'},true,true,'{"productName":"來源產品","sections":{"5":"原文未提供"}}');assert.equal(r.data.sds.sections['5'],'原文未提供');r=await call({mode:'simulation_role'},true,true,'{"text":"請確認任務位置"}');assert.equal(r.data.message.text,'請確認任務位置');});
test('API 拒絕模型格式錯誤，不回傳假成功',async()=>{const r=await call({mode:'sds_extract'},true,true,'{"productName":"沒有章節"}');assert.equal(r.code,503);});

test('v29 intake API 真正呼叫模型並傳回可供核對的結構',async()=>{const row=require('../assets/intake-semantic').item('crew',{unit:'淡水',number:7,evidence:'淡水七人'});const r=await call({mode:'intake_parse',text:'淡水七人',roster:[{unit:'淡水',brigade:'第三大隊'}]},true,true,JSON.stringify({correctedText:'淡水7人',items:[row]}));assert.equal(r.code,200);assert.equal(r.upstream,1);assert.equal(r.data.draft.items[0].number,7);assert.equal(r.data.providerUsed,'openai');});
