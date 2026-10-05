(function(root){
'use strict';

/* Pure, shared live/practice summary contract. No DOM, persistence, or permissions.
 * getLatestPatients(sitreps) => [{key, patient, identityKind, eventAt,
 *   submittedAt, sourceId}]. Use key as a selector value and patient to prefill.
 * identityKind is id, legacy, or unresolved. Only the first two count people.
 * Keys prefer patient.id/patient.patientId. A complete, unambiguous legacy
 * name+gender+foundAt may join one explicit ID, never two different IDs.
 * Event time wins over upload time, so a late backfill cannot undo newer status.
 * getPatientSummaries(sitreps) exposes counts and lines, without personal fields.
 * Explicit transportStatus is authoritative, including unknown/not transported.
 * Only legacy records without that field may use a narrowly affirmative note.
 * Household and patient sources are never added into one person total.
 */
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const list=value=>Array.isArray(value)?value:[];
const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
function text(value){return typeof value==='string'?value.normalize('NFKC').trim().replace(/\s+/g,' '):typeof value==='number'&&Number.isFinite(value)?String(value):'';}
function identifier(value){const valueText=text(value);return valueText&&!/^(?:unknown|null|undefined|未知|未明)$/i.test(valueText)?valueText:'';}
// The UI promotes an old selector key to patient.id on its first explicit edit.
function idKey(id){return /^(?:legacy:|report:)/.test(id)?id:`id:${id}`;}
function timestamp(value){
  if(value===null||value===undefined||value==='')return null;
  let n;
  if(typeof value==='number')n=value;
  else if(value instanceof Date)n=value.getTime();
  else if(typeof value?.toMillis==='function'){try{n=value.toMillis();}catch{return null;}}
  else if(record(value)&&Number.isFinite(value.seconds))n=value.seconds*1000+(Number(value.nanoseconds)||0)/1e6;
  else if(typeof value==='string')n=/^\d+(?:\.\d+)?$/.test(value.trim())?Number(value):Date.parse(value);
  return Number.isFinite(n)&&n>=0?n:null;
}
function isLater(candidate,previous){
  if(!previous)return true;
  const a=candidate.eventAt??candidate.submittedAt??0,b=previous.eventAt??previous.submittedAt??0;
  if(a!==b)return a>b;
  if((candidate.submittedAt??0)!==(previous.submittedAt??0))return (candidate.submittedAt??0)>(previous.submittedAt??0);
  return candidate.index>previous.index;
}
function legacyIdentity(patient){
  const name=text(patient.name),gender=text(patient.gender),foundAt=text(patient.foundAt);
  const unknown=/未知|未明|未填|未提供|不明|待確認|未確認|待補|待查|不詳|疑似|可能|無名|路人|匿名|unknown|unnamed|anonymous|^n\/?a$|^(?:無|none|null|undefined|john doe|jane doe)$|^[?？-]+$/i;
  if(!name||!foundAt||unknown.test(name)||unknown.test(foundAt))return '';
  // Surname-only honorifics and generic labels are not reliable identity evidence.
  if(/^(?:[\u3400-\u9fff]{0,2}(?:先生|小姐|女士)|傷者|傷患|患者|住戶|民眾|男性|女性|男|女)$/.test(name))return '';
  const normalizedGender={男:'男',男性:'男',male:'男',女:'女',女性:'女',female:'女'}[gender.toLowerCase()];
  return normalizedGender?JSON.stringify([name,normalizedGender,foundAt]):'';
}
function getLatestPatients(sitreps=[]){
  const candidates=list(sitreps).flatMap((source,index)=>{
    if(!record(source)||!record(source.patient))return [];
    const patient=source.patient,id=identifier(patient.id)||identifier(patient.patientId);
    return [{patient,id,legacy:legacyIdentity(patient),eventAt:timestamp(source.eventAt??patient.eventAt),submittedAt:timestamp(source.submittedAt??source.createdAt??patient.submittedAt),sourceId:identifier(source.id),index}];
  });
  const explicitByLegacy=new Map(),explicitKeys=new Set(candidates.filter(candidate=>candidate.id).map(candidate=>idKey(candidate.id)));
  for(const candidate of candidates)if(candidate.id&&candidate.legacy){
    if(!explicitByLegacy.has(candidate.legacy))explicitByLegacy.set(candidate.legacy,new Set());
    explicitByLegacy.get(candidate.legacy).add(candidate.id);
  }
  const latest=new Map();
  for(const candidate of candidates){
    const matchedIds=explicitByLegacy.get(candidate.legacy),matchedId=matchedIds?.size===1?[...matchedIds][0]:'';
    const resolvedId=candidate.id||matchedId;
    const safeLegacy=candidate.legacy&&(!matchedIds||matchedIds.size===1);
    const key=resolvedId?idKey(resolvedId):safeLegacy?`legacy:${candidate.legacy}`:`report:${candidate.sourceId||candidate.index}`;
    const identityKind=resolvedId||explicitKeys.has(key)?'id':safeLegacy?'legacy':'unresolved';
    const value={...candidate,key,identityKind};
    if(isLater(value,latest.get(key)))latest.set(key,value);
  }
  return [...latest.values()].sort((a,b)=>a.key.localeCompare(b.key)).map(({key,patient,identityKind,eventAt,submittedAt,sourceId})=>({key,patient:{...patient},identityKind,eventAt,submittedAt,sourceId}));
}
const statusLabels={rescued:'已救出',mild:'輕傷',severe:'重傷',ohca:'OHCA',fatal:'死亡',awaiting:'待救援',evacuated:'已疏散',unknown:'狀況待確認'};
const statuses={'已救出':'rescued','輕傷':'mild','重傷':'severe','OHCA':'ohca','死亡':'fatal','待救援':'awaiting','已疏散':'evacuated'};
function patientStatus(patient){const value=text(patient.status);return statuses[value.toUpperCase()]||(/^(?:送醫|已送醫)$/.test(value)&&isTransported(patient)?'transportOnly':'unknown');}
function legacyTransportConfirmed(note){
  const value=text(note);
  if(!value||/未|尚|沒有|無法|不是|並非|非已|不確定|不詳|疑似|預計|預定|可能|據說|傳聞|擬|計畫|計劃|待|將|是否|否認|取消|更正|[?？]/.test(value))return false;
  // Do not guess from a mention of a hospital, another person, a quotation, or
  // ambiguous "送醫". Only a standalone completed-transport clause is evidence.
  return value.split(/[，,；;。\n]/).some(clause=>/^(?:(?:本)?(?:患者|傷患|傷者|個案)\s*[：:]?\s*)?(?:已送醫|已送(?:往|至)[^，,；;。\n]{1,40}(?:醫院|醫療中心|醫學中心|診所))$/.test(clause.trim()));
}
function isTransported(patient){
  if(own(patient,'transportStatus'))return ['已送醫','送醫','transported','hospitalized'].includes(text(patient.transportStatus).toLowerCase());
  return /^(?:送醫|已送醫)$/.test(text(patient.status))||legacyTransportConfirmed(patient.note);
}
function tally(entries){return {people:entries.filter(entry=>entry.identityKind!=='unresolved').length,reports:entries.filter(entry=>entry.identityKind==='unresolved').length};}
function patientCountLine(label,count,suffix=''){
  const parts=[];
  if(count.people)parts.push(`${count.people} 人`);
  if(count.reports)parts.push(`${count.reports} 筆身分待核對回報`);
  return parts.length?`患者回報：${label} ${parts.join('；另有 ')}${suffix}。`:'';
}
function getPatientSummaries(sitreps=[]){
  const latest=getLatestPatients(sitreps),overall=tally(latest),byStatus={},lines=[];
  for(const [status,label] of Object.entries(statusLabels)){
    const count=tally(latest.filter(entry=>patientStatus(entry.patient)===status));
    byStatus[status]=count;
    const line=patientCountLine(label,count);if(line)lines.push(line);
  }
  const transported=tally(latest.filter(entry=>isTransported(entry.patient)));
  const line=patientCountLine('已送醫',transported,'（與患者狀況可能重疊，不另加總）');if(line)lines.push(line);
  if(overall.reports)lines.push(`患者身分待核對：${overall.reports} 筆回報；尚無法確認不重複人數。`);
  return {people:overall.people,unresolvedReports:overall.reports,byStatus,transported,lines};
}
function optionalCount(value){
  if(value===null||value===undefined||typeof value==='boolean'||(typeof value==='string'&&!value.trim()))return null;
  if(typeof value!=='string'&&typeof value!=='number')return null;
  const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n:null;
}
function population(resident){
  const male=optionalCount(own(resident,'maleCount')?resident.maleCount:resident.male),female=optionalCount(own(resident,'femaleCount')?resident.femaleCount:resident.female);
  const minimum=(male??0)+(female??0),complete=male!==null&&female!==null&&Number.isSafeInteger(minimum);
  return {male,female,minimum:Number.isSafeInteger(minimum)?minimum:0,total:complete?minimum:null,complete};
}
function getLatestResidents(caseRecord={}){
  const latest=new Map();let index=0;
  for(const entry of list(caseRecord?.buildingOps?.floorActions)){
    if(!record(entry))continue;
    for(const resident of list(entry.residents)){
      if(!record(resident))continue;
      const id=identifier(resident.id)||identifier(resident.householdId);
      const key=id?`id:${id}`:`record:${index}`;
      const candidate={key,resident:{...resident},floor:entry.floor,eventAt:timestamp(resident.updatedAt??resident.createdAt??entry.updatedAt),submittedAt:null,index:index++};
      if(isLater(candidate,latest.get(key)))latest.set(key,candidate);
    }
  }
  return [...latest.values()].map(({key,resident,floor})=>({key,resident,floor}));
}
function summarizeResidents(entries){return entries.reduce((sum,entry)=>{const value=population(entry.resident);sum.households++;sum.confirmedMinimum+=value.minimum;sum.pending+=value.complete?0:1;return sum;},{households:0,confirmedMinimum:0,pending:0});}
function populationText(summary){
  if(!summary.pending)return `已確認 ${summary.confirmedMinimum} 人`;
  return `${summary.confirmedMinimum>0?`已確認至少 ${summary.confirmedMinimum} 人，`:''}${summary.pending} 戶人數待確認`;
}
function householdStatusLine(label,entries){
  if(!entries.length)return '';
  const summary=summarizeResidents(entries);
  if(label==='已疏散'||label==='已救出'){
    const count=summary.pending?(summary.confirmedMinimum>0?`至少 ${summary.confirmedMinimum} 人`:'人數待確認'):`${summary.confirmedMinimum} 人`;
    return `住戶紀錄：${label} ${count}（${summary.households} 戶${summary.pending?`；${summary.pending} 戶人數未完整`:''}）。`;
  }
  // A household disposition does not prove every listed member had that outcome.
  return `住戶紀錄：${label} ${summary.households} 戶（${label}人數待確認）。`;
}
function floorKey(value){const n=Number(value);return value!==null&&value!==undefined&&text(value)!==''&&Number.isInteger(n)&&n!==0?String(n):'';}
function floorLabel(value){const key=floorKey(value);return key?(Number(key)>0?`${key}F`:`B${Math.abs(Number(key))}`):'樓層待確認';}
const floorActions=new Set(['滅火','滅火攻擊','阻隔延燒','就地避難','疏散離開','搜索救援','搜索中','搜索完成','已完成搜索','搜索未完成']);
function getLatestFloorActions(caseRecord={}){
  const floors=new Map();
  list(caseRecord?.buildingOps?.floorActions).forEach((entry,index)=>{
    if(!record(entry))return;
    const key=floorKey(entry.floor)||'unknown',candidate={entry,eventAt:timestamp(entry.updatedAt??entry.createdAt),submittedAt:null,index};
    if(isLater(candidate,floors.get(key)))floors.set(key,candidate);
  });
  return [...floors.values()].map(({entry})=>entry);
}
function buildSituationLines(caseRecord={},live={}){
  const lines=[],residents=getLatestResidents(caseRecord),patients=getPatientSummaries(live?.sitreps);
  if(caseRecord?.trapped==='有'){
    const count=optionalCount(caseRecord.trappedCount);
    lines.push(count!==null&&count>0?`已確認受困 ${count} 人。`:'已確認有人受困，人數待確認。');
  }else if(caseRecord?.trapped==='無')lines.push('目前確認無人受困。');
  if(residents.length&&(patients.people||patients.unresolvedReports))lines.push('住戶與患者為不同來源回報，可能指向同一人；以下分列，不合併人數。');
  for(const label of ['已疏散','已救出','送醫','死亡']){
    const matching=residents.filter(entry=>text(entry.resident.status)===label||(label==='送醫'&&text(entry.resident.status)==='已送醫'));
    const line=householdStatusLine(label,matching);if(line)lines.push(line);
  }
  lines.push(...patients.lines);
  if(residents.length){const summary=summarizeResidents(residents);lines.push(`建物住戶已記錄 ${summary.households} 戶；${populationText(summary)}。`);}
  for(const entry of getLatestFloorActions(caseRecord)){
    const key=floorKey(entry.floor)||'unknown';
    const rows=residents.filter(row=>(floorKey(row.floor)||'unknown')===key),action=floorActions.has(text(entry.action))?text(entry.action):'';
    if(!rows.length&&!action)continue;
    const label=floorLabel(entry.floor);
    if(rows.length){const summary=summarizeResidents(rows);lines.push(`${label}：已記錄 ${summary.households} 戶，${populationText(summary)}${action?`；樓層作戰狀態：${action}`:''}。`);}
    else lines.push(`${label}：樓層作戰狀態為${action}；尚未登錄住戶資料。`);
  }
  return lines;
}
root.FCOperationalV31={buildSituationLines,getLatestPatients,getPatientSummaries,getLatestResidents,getLatestFloorActions,population,householdStatusLine,legacyTransportConfirmed,isTransported};
if(typeof module!=='undefined')module.exports=root.FCOperationalV31;
})(typeof window==='undefined'?globalThis:window);
