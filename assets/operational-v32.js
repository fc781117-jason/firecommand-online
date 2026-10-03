(function(root){
'use strict';
const previous=typeof module!=='undefined'?require('./operational-v31'):root.FCOperationalV31;
const list=v=>Array.isArray(v)?v:[];
const text=v=>typeof v==='string'?v.trim():'';
function count(v){if(v==null||v===''||typeof v==='boolean')return null;const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:null;}
function trappedSummary(c={}){
  if(c.trapped==='無')return {state:'absent',count:0,line:'目前確認無人受困'};
  if(c.trapped==='有'){const n=count(c.trappedCount);return {state:'present',count:n>0?n:null,line:n>0?`已確認受困 ${n} 人`:'已確認有人受困，人數待確認'};}
  return {state:'unknown',count:null,line:'受困狀況待確認'};
}
function residentsSummary(rows){return rows.reduce((s,{resident:r})=>{const p=previous.population(r);s.households++;s.male+=p.male??0;s.female+=p.female??0;s.minimum+=p.minimum;if(!p.complete)s.pending++;return s;},{households:0,male:0,female:0,minimum:0,pending:0});}
function populationLine(s){return `${s.pending?'已確認至少':'已確認'} ${s.minimum} 人${s.pending?`｜${s.pending} 戶人口待確認`:''}`;}
function shortUnit(row){const v=text(row.unitNo)||text(row.address);return v.match(/(?:\d+(?:之\d+)?號.*|[A-Za-zＡ-Ｚａ-ｚ]戶.*)$/)?.[0]||v||'戶號待確認';}
function buildOperationalSummary(c={},live={}){
  const residents=previous.getLatestResidents(c),rs=residentsSummary(residents),patients=previous.getPatientSummaries(live.sitreps);
  const incident=[['地址',c.confirmedAddress||c.correctedAddress||c.address||c.reportedAddress],['案件',c.type],['建物',[c.buildingStructure,c.floors?`地上${c.floors}樓`:''].filter(Boolean).join('／')],['起火',c.fireFloor],['狀態',c.fireStatus]].filter(([,v])=>v!=null&&v!=='');
  const lifeSafety=[`本棟總戶數：${c.totalHouseholdsConfirmed===true&&count(c.totalHouseholds)!==null?`${count(c.totalHouseholds)} 戶`:'待確認'}`,`已登錄 ${rs.households} 戶`];
  if(rs.households)lifeSafety.push(`住戶：男 ${rs.male}｜女 ${rs.female}（已知小計）`,populationLine(rs));
  for(const status of ['已疏散','已救出']){const matching=residents.filter(x=>x.resident.status===status);if(matching.length){const s=residentsSummary(matching);lifeSafety.push(`住戶${status}：${populationLine(s)}（${s.households} 戶）`);}}
  for(const status of ['送醫','死亡']){const matching=residents.filter(x=>text(x.resident.status)===status||(status==='送醫'&&text(x.resident.status)==='已送醫'));const line=previous.householdStatusLine(status,matching);if(line)lifeSafety.push(line);}
  const trapped=trappedSummary(c);if(trapped.state!=='unknown')lifeSafety.push(trapped.line);
  lifeSafety.push(...patients.lines);
  if(rs.households&&(patients.people||patients.unresolvedReports))lifeSafety.push('住戶與患者可能為相同人員，不另行加總。');
  const floors=previous.getLatestFloorActions(c).map(e=>{
    const rows=residents.filter(x=>String(x.floor)===String(e.floor)),s=residentsSummary(rows),lines=[];
    if(rows.length)lines.push(`已登錄 ${s.households} 戶`,populationLine(s));
    if(e.action&&e.action!=='未標示')lines.push(`樓層作戰狀態：${e.action}`);
    return {floor:e.floor,lines,...s};
  }).filter(e=>e.lines.length);
  const deployment=list(live.crews).filter(c=>c.task&& !/^(未指定|待部署)$/.test(c.task)).map(c=>`${c.face?c.face+'：':''}${c.unit||'單位待確認'}${c.task==='RIT'?'擔任 RIT':`執行${c.task}`}${c.status&&c.status!=='作業中'?`（${c.status}）`:''}`);
  if(c.ritSet&&c.ritUnit&&!deployment.some(x=>x.includes(c.ritUnit)&&x.includes('RIT')))deployment.push(`${c.ritUnit}擔任 RIT`);
  list(live.hoses).forEach(h=>deployment.push(`${h.sourceName||h.vehicleName||'起點待確認'} → ${h.targetName||'終點待確認'}｜${h.kind||'水線'}（${h.status||'僅圖面紀錄，供水待確認'}）`));
  // Patient outcomes come only from the reconciled lifeSafety model above.
  // Raw patient event titles are history, not additional current patient facts.
  const situation=[c.fireStatus,...list(live.sitreps).filter(r=>!r.patient).sort((a,b)=>(b.eventAt||b.submittedAt||0)-(a.eventAt||a.submittedAt||0)).slice(0,5).map(r=>r.title||r.category)].filter(Boolean);
  const hazards=[c.hazardState==='none'?'已確認無危險物品':c.hazardItems,...list(live.hazards).map(h=>h.type)].filter(Boolean);
  const support=(Array.isArray(c.supportRequests)?c.supportRequests:list(c.supports)).map(s=>typeof s==='string'?s:[s.unit||s.type,s.task||s.item,({requested:'需求已登錄',contacted:'已聯絡',arrived:'已到場',completed:'已完成'})[s.status]||s.status||'需求已登錄'].filter(Boolean).join('｜'));
  const timestamps=[['報案',c.reportedAt],['建立',c.createdAt],['結案',c.closedAt]].filter(([,v])=>v);
  return {incident,lifeSafety,situation,deployment,floors,hazards,support,timestamps};
}
function summaryText(s){return [s.incident.map(([k,v])=>`${k}：${v}`).join('\n'),...['lifeSafety','situation','deployment','hazards','support'].map(k=>s[k].join('\n')),...s.floors.map(f=>`${Number(f.floor)<0?'B'+Math.abs(f.floor):f.floor+'F'}\n${f.lines.join('\n')}`)].filter(Boolean).join('\n\n');}
function viewportPoint(view,point,size,zoom){const next=Math.max(.6,Math.min(2.5,zoom));const w=size.w/next,h=size.h/next;return {zoom:next,x:point.x-(point.x-view.x)*w/view.w,y:point.y-(point.y-view.y)*h/view.h,w,h};}
root.FCOperationalV32={buildOperationalSummary,residentsSummary,populationLine,shortUnit,summaryText,viewportPoint,count,trappedSummary};
if(typeof module!=='undefined')module.exports=root.FCOperationalV32;
})(typeof window==='undefined'?globalThis:window);
