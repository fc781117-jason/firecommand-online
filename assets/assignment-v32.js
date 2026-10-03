(function(root){
'use strict';
const keys=['task','status','face','floor'];
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const signature=v=>keys.map(k=>String(v?.[k]??'')).join('\u001f');
const validTime=v=>Number.isFinite(v)&&v>0;
function category(s){return /^(休息|REHAB)$/i.test(s.status||'')?'rehab':/^(作業中|OPERATING)$/i.test(s.status||'')?'work':'other';}
function transition(before={},patch={},meta={}){
  const next={...before,...patch};
  if(!keys.some(k=>own(patch,k))||signature(before)===signature(next)){
    const safe={...patch};for(const k of ['taskSegments','assignmentRevision']){if(own(before,k))safe[k]=before[k];else delete safe[k];}return safe;
  }
  const now=meta.at;if(!validTime(now))throw Error('任務時間無效');
  const segments=(before.taskSegments||[]).map(s=>({...s}));
  if(!segments.length&&validTime(before.startAt)&&before.startAt<=now&&before.status){
    segments.push({id:`legacy-${meta.crewId||''}-${before.startAt}`,crewId:meta.crewId||'',unit:before.unit||'',task:before.task||'',status:before.status,face:before.face||'',floor:before.floor||'',startedAt:before.startAt,endedAt:validTime(before.endAt)?Math.max(before.startAt,Math.min(before.endAt,now)):now,source:'legacy',operator:'',legacyPartial:true});
  }
  for(const s of segments)if(s.endedAt==null)s.endedAt=Math.max(s.startedAt,now);
  if(next.status&&next.status!=='未指定')segments.push({id:meta.id,crewId:meta.crewId||'',unit:next.unit||'',task:next.task||'',status:next.status,face:next.face||'',floor:next.floor||'',startedAt:now,endedAt:null,source:meta.source||'manual',operator:meta.operator||''});
  const latest=segments.at(-1),enteredWork=category(next)==='work'&&category(before)!=='work';
  return {...patch,taskSegments:segments,assignmentRevision:(before.assignmentRevision||0)+1,dispatchCount:(before.dispatchCount||0)+(enteredWork?1:0),...(latest?.endedAt==null?{startAt:now,endAt:null}:{})};
}
function closeSegments(crew,at){return (crew.taskSegments||[]).map(s=>s.endedAt==null?{...s,endedAt:Math.max(s.startedAt,at),closureReason:'case_closed'}:{...s});}
function totals(crew,now,closedAt){
  const stop=validTime(closedAt)?closedAt:now,segments=(crew.taskSegments||[]).map(s=>({...s,durationMs:Math.max(0,(s.endedAt??stop)-s.startedAt)}));
  return {segments,workMs:segments.filter(s=>category(s)==='work').reduce((n,s)=>n+s.durationMs,0),rehabMs:segments.filter(s=>category(s)==='rehab').reduce((n,s)=>n+s.durationMs,0),dispatchCount:crew.dispatchCount||0};
}
root.FCAssignmentV32={transition,closeSegments,totals,signature};
if(typeof module!=='undefined')module.exports=root.FCAssignmentV32;
})(typeof window==='undefined'?globalThis:window);
