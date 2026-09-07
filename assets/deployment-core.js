(function(root){'use strict';
const faces=['第一面','第二面','第三面','第四面'];
function localParse(text){
 const plan={vehicles:[],crews:[],hoses:[],unresolved:[]};
 const nums={'一':1,'二':2,'兩':2,'三':3,'四':4,'五':5,'六':6};
 for(const line of text.split(/[；;。\n]/).map(x=>x.trim()).filter(Boolean)){
  const names=[...line.replace(/供水給|供水至|連接|接至|接給/g,' ').matchAll(/([\u4e00-\u9fff]{2,5}\d{2,3})/g)].map(x=>x[1]);
  const face=(line.match(/第[一二三四]面/)||[])[0]||'';
  for(const name of names){if(!plan.vehicles.some(x=>x.name===name))plan.vehicles.push({name,unit:name.replace(/\d+$/,''),face:names.length===1?face:'',task:''});}
  const link=/供水給|供水至|連接|接至|接給/.test(line)&&names.length>=2;
  const lineCount=line.match(/(?:出|佈|布|拉)([一二兩三四五六1-6])(?:條)?(?:水)?線/);
  if(link)plan.hoses.push({source:names[0],target:names[1],count:1,kind:'供水水線',task:''});
  else if(names.length===1&&face&&lineCount)plan.hoses.push({source:names[0],target:face,count:nums[lineCount[1]]||Number(lineCount[1]),kind:/防護/.test(line)?'防護水線':'進攻水線',task:line});
  const crew=line.match(/([\u4e00-\u9fff]{2,5})(?:小組|分隊)?\s*([0-9]{1,2})人/);
  if(crew&&face)plan.crews.push({unit:crew[1],count:Number(crew[2]),face,task:line});
  if((!link&&!lineCount&&!crew)||(!link&&lineCount&&!face)||/消防栓|水源|樓|地下/.test(line))plan.unresolved.push(line);
 }
 return plan;
}
function validate(raw,existing=[]){
 if(!raw||!Array.isArray(raw.vehicles)||!Array.isArray(raw.hoses)||!Array.isArray(raw.crews))throw Error('草圖資料格式不完整');
 const p=JSON.parse(JSON.stringify(raw));
 if(p.vehicles.length>30||p.crews.length>30||p.hoses.length>60)throw Error('單次資料過多，請分段輸入');
 const names=new Set(existing.map(x=>x.name));const added=new Set();
 for(const v of p.vehicles){if(typeof v.name!=='string'||!v.name.trim()||v.name.length>30||added.has(v.name))throw Error('車號空白或重複');added.add(v.name);names.add(v.name);if(v.face&&!faces.includes(v.face))throw Error('車輛面向需為第一至第四面');}
 for(const c of p.crews){if(!c.unit||!Number.isInteger(Number(c.count))||Number(c.count)<1||Number(c.count)>30||!faces.includes(c.face))throw Error('人員需有單位、1–30 人與正確面向');}
 for(const h of p.hoses){if(!names.has(h.source)||(!names.has(h.target)&&!faces.includes(h.target))||h.source===h.target)throw Error('水線起終點未確認或自接');if(!Number.isInteger(Number(h.count))||h.count<1||h.count>6)throw Error('水線數需為 1–6 條');}
 return p;
}
root.FCDeployment={faces,localParse,validate};if(typeof module!=='undefined')module.exports=root.FCDeployment;
})(typeof window==='undefined'?globalThis:window);
