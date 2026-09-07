/* Pure state transitions. Shared by UI and regression tests. */
(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||a));
function normalizeStep(e,i=0){return {...e,id:String(e.id||`step-${i}`),order:Number(e.order)||i+1,timeLimitSec:clamp(e.timeLimitSec||([180,180,120,300,30][i%5]),30,900)};}
function initial(){return {revision:0,phase:'waiting',index:-1,deadline:0,remainingMs:0,pausedAt:0,pauseCount:0,pauseMs:0,outcomes:[],reason:''};}
function remaining(s,now){return s.phase==='paused'?s.remainingMs:s.phase==='running'?Math.max(0,s.deadline-now):0;}
function transition(state,action,steps,now){
 const s=JSON.parse(JSON.stringify(state||initial())); const active=steps[s.index];
 function next(){s.index++;if(s.index>=steps.length){s.phase='completed';s.deadline=0;s.reason='全部情境已結束';s.endedAt=now;}else{s.phase='running';s.deadline=now+steps[s.index].timeLimitSec*1000;s.stepStartedAt=now;s.stepPauseMs=0;s.stepPauses=[];}}
 if(action.type==='start'&&s.phase==='waiting'&&steps.length){s.startedAt=now;next();}
 else if(action.type==='pause'&&s.phase==='running'){s.remainingMs=remaining(s,now);s.pausedAt=now;s.pauseCount++;s.phase='paused';}
 else if(action.type==='resume'&&s.phase==='paused'){const p=Math.max(0,now-s.pausedAt);s.pauseMs+=p;(s.stepPauses=s.stepPauses||[]).push({start:s.pausedAt,end:now});s.stepPauseMs=(s.stepPauseMs||0)+p;s.deadline=now+s.remainingMs;s.pausedAt=0;s.phase='running';}
 else if(['respond','timeout','skip'].includes(action.type)&&s.phase==='running'&&active){
   if(action.eventId!==active.id) return null;
   if(action.type==='timeout'&&now<s.deadline)return null;
   const response=action.response;
   if(action.type==='respond'&&(!response||!String(response.text||'').trim()||response.eventId!==active.id))return null;
   s.outcomes.push({eventId:active.id,title:active.title,result:action.type,responseId:response?.id||'',responseText:response?.text||'',role:response?.role||'',elapsedMs:Math.max(0,Math.min(response?.createdAt||now,s.deadline)-s.stepStartedAt-(s.stepPauses||[]).reduce((sum,p)=>sum+Math.max(0,Math.min(response?.createdAt||now,p.end)-p.start),0)),late:action.type==='timeout'||!!(response&&response.createdAt>s.deadline),recordedAt:now});next();
 }else if(action.type==='finish'&&['running','paused'].includes(s.phase)){
   if(s.phase==='paused')s.pauseMs+=Math.max(0,now-s.pausedAt);
   s.phase='completed';s.deadline=0;s.endedAt=now;s.reason=action.reason||'教官結束演練';
 }else return null;
 s.revision++;return s;
}
function summary(s,steps){const o=s.outcomes||[],done=o.filter(x=>x.result==='respond'&&!x.late).length;return {total:steps.length,responded:o.filter(x=>x.result==='respond').length,onTime:done,timeouts:o.filter(x=>x.result==='timeout'||x.late).length,skipped:o.filter(x=>x.result==='skip').length,timingScore:steps.length?Math.round(done/steps.length*100):0,pauseCount:s.pauseCount||0,pauseMs:s.pauseMs||0};}
root.FCTraining={normalizeStep,initial,remaining,transition,summary};
if(typeof module!=='undefined')module.exports=root.FCTraining;
})(typeof window==='undefined'?globalThis:window);
