(function(root){'use strict';
const tasks=['待命','滅火攻擊','人命搜救','內攻','警戒','供水','排煙','救護','休息','RIT'];
const missing=/^(?:|未指定|待部署|任務未填|任務未指定)$/;
const faces=['第一面','第二面','第三面','第四面'];
function taskChoice(value=''){
  const text=String(value||'').trim();
  if(!text||tasks.includes(text))return {choice:text,other:''};
  return {choice:'其他',other:text};
}
function validTask(value=''){const text=String(value||'').trim();return !missing.test(text);}
function cleanUnit(value=''){return String(value||'').trim().replace(/分隊$/,'');}
function listNames(items=[]){const names=[...new Set(items.map(cleanUnit).filter(Boolean))];return names.length<2?(names[0]||''):names.slice(0,-1).join('、')+'、'+names.at(-1);}
function deploymentClauses(crews=[],caseData={}){
  const known=(crews||[]).filter(c=>c&&c.unit);
  const ritUnits=new Set(known.filter(c=>c.status==='RIT'||c.task==='RIT').map(c=>c.unit));
  if(caseData.ritSet&&caseData.ritUnit)ritUnits.add(caseData.ritUnit);
  const standby=known.filter(c=>c.status==='待命'||c.task==='待命').map(c=>c.unit).filter(u=>!ritUnits.has(u));
  const operating=known.filter(c=>validTask(c.task)&&c.task!=='待命'&&c.task!=='RIT'&&c.status!=='RIT');
  const byFace=new Map();
  for(const c of operating){const face=faces.includes(c.face)?c.face:'';if(!byFace.has(face))byFace.set(face,[]);byFace.get(face).push(c);}
  const clauses=[];
  for(const face of [...faces,'']){
    const rows=byFace.get(face)||[];
    if(rows.length)clauses.push(`${face?face+'由':''}${rows.map(c=>`${cleanUnit(c.unit)}分隊執行${c.task}`).join('，')}`);
  }
  if(ritUnits.size)clauses.push(`${listNames([...ritUnits])}分隊擔任 RIT`);
  if(standby.length)clauses.push(`${listNames(standby)}分隊待命`);
  return clauses;
}
function deploymentSpeech(crews=[],caseData={}){const clauses=deploymentClauses(crews,caseData);return clauses.length?clauses.join('；')+'。':'';}
function stripIncomplete(text=''){
  return String(text||'').split(/[；。\n]/).map(x=>x.trim()).filter(x=>x&&!/人數待補|任務未指定|任務未填|尚未指定任務/.test(x)).join('；');
}
function parseOptionalCount(value){if(value===null||value===undefined||value==='')return {valid:true,value:null};const n=Number(value);return {valid:Number.isInteger(n)&&n>=0,value:Number.isInteger(n)&&n>=0?n:null};}
function residentTotal(male,female){const m=parseOptionalCount(male),f=parseOptionalCount(female);return m.valid&&f.valid&&m.value!==null&&f.value!==null?m.value+f.value:null;}
function residentPopulation(male,female){
  const m=parseOptionalCount(male),f=parseOptionalCount(female),valid=m.valid&&f.valid;
  const minimum=(m.value??0)+(f.value??0),complete=valid&&m.value!==null&&f.value!==null;
  return {valid,complete,total:complete?minimum:null,minimum};
}
function floorResidentSummary(rows=[]){return (rows||[]).reduce((s,r)=>{const p=residentPopulation(r.maleCount??r.male,r.femaleCount??r.female);return {households:s.households+1,knownTotal:s.knownTotal+(p.total??0),confirmedMinimum:s.confirmedMinimum+p.minimum,pending:s.pending+(p.complete?0:1)};},{households:0,knownTotal:0,confirmedMinimum:0,pending:0});}
function residentPopulationLabel(male,female){const p=residentPopulation(male,female);if(p.complete)return `共 ${p.total} 人`;return p.minimum>0?`至少 ${p.minimum} 人／人數未完整`:'人數未完整';}
function composeResidentAddress(base,unit,floor){return [base,unit,floor].map(value=>String(value||'').trim()).filter(Boolean).join(' ');}
function residentAddressDraft(existing={},base='',unit='',floor=''){
  const manual=existing.addressMode==='manual'||(existing.addressMode!=='auto'&&typeof existing.address==='string'&&existing.address.trim()!=='');
  return {mode:manual?'manual':'auto',address:manual?existing.address:composeResidentAddress(base,unit,floor)};
}
root.FCV34V3={composeResidentAddress,residentAddressDraft,tasks,taskChoice,validTask,deploymentClauses,deploymentSpeech,stripIncomplete,parseOptionalCount,residentTotal,residentPopulation,residentPopulationLabel,floorResidentSummary};
if(typeof module!=='undefined')module.exports=root.FCV34V3;
})(typeof window==='undefined'?globalThis:window);
