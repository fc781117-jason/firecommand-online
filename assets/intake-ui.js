'use strict';
let intake28=null,intakeSpeech28=null,intakeBusy28=false,resourceReady28=new Set(),intakeReturnFocus28=null;
function intakeSnapshot28(){return Object.fromEntries(FCIntake.collections.map(c=>[c,JSON.parse(JSON.stringify(live[c]||[]))]));}
function intakeRevision28(c=currentCase){return FCIntake.fingerprint({revision:c?.resourceRevision||0,box:c?.buildingBox||null});}
function intakePosition28(face,index){const box=getBuildingBox(),n=FCIntake.faces.indexOf(face),w=box.widthM/2+15,h=box.heightM/2+15;const p=n===0?[index%4*8,-h]:n===1?[w,index%4*8]:n===2?[index%4*8,h]:n===3?[-w,index%4*8]:[w+25,25-index*7];return {...localPointToLatLng(box,...p),anchorBuilding:true,staged:n<0};}
function cancelIntakeSpeech28(){if(intakeSpeech28){const r=intakeSpeech28;intakeSpeech28=null;r.onresult=null;r.onend=null;r.onerror=null;r.abort();}if($('intakeMic28'))$('intakeMic28').textContent='開始語音';}
function closeIntake28(force=false){if(intakeBusy28&&!force)return;cancelIntakeSpeech28();$('intakeDialog28')?.close();intakeReturnFocus28?.focus?.();}
function clearIntake28(){cancelIntakeSpeech28();intake28=null;closeIntake28(true);}
function openIntake28(text){
 if(!currentCase||currentCase.id!==currentCaseId)return toast('案件載入中，請稍候');
 if(firebaseEnabled&&resourceReady28.size<3)return toast('人車與水線同步中，請稍候');
 if(currentCase.status==='closed')return toast('案件已結束，請先重新開啟案件');
 if(currentCase.mode==='practice'&&myTrainingRole()==='觀察員')return toast('觀察員僅可閱覽');
 if(intakeBusy28)return;
 if(intake28?.caseId!==currentCaseId)intake28={caseId:currentCaseId,commandId:uid('intake'),text:'',choices:{},plan:null,revision:null};
 if(typeof text==='string'){intake28.text=text;intake28.plan=null;intake28.choices={};intake28.commandId=uid('intake');}
 intakeReturnFocus28=document.activeElement;
 $('intakeCase28').textContent=`${currentCase.mode==='practice'?'練習模式':'實戰模式'} · ${currentCase.caseNo||currentCaseId}`;
 $('intakeText28').value=intake28.text;
 $('intakeResult28').hidden=!intake28.plan;$('intakeConfirm28').checked=false;
 $('intakeMessage28').textContent='每次只說本次新增或修正。確認後同步人員、圖面與概要。';
 $('intakeDialog28').showModal();renderIntakeHistory28();if(intake28.plan)renderIntakePlan28();$('intakeText28').focus();
}
function invalidateIntake28(){if(!intake28||intakeBusy28)return;intake28.text=$('intakeText28').value;intake28.plan=null;intake28.choices={};intake28.commandId=uid('intake');$('intakeResult28').hidden=true;$('intakeConfirm28').checked=false;}
function parseIntake28(){
 if(!intake28||intake28.caseId!==currentCaseId)throw Error('案件已切換，請重新開啟快速回報');
 if(intakeBusy28)throw Error('正在登錄，請稍候');
 const text=$('intakeText28').value.trim();if(!text)throw Error('請先說明或輸入此次回報');
 intake28.text=text;const parsed=FCIntake.parse(text,FCIntake.roster(UNIT_TREE),intake28.choices);
 intake28.plan=FCIntake.plan(parsed,intakeSnapshot28(),{locate:intakePosition28,vehicleType});intake28.revision=intakeRevision28();
 renderIntakePlan28();
}
function describeIntakeRecord28(coll,x){if(!x)return '無';if(coll==='crews')return `${x.unit}${x.voiceGroup?' '+x.voiceGroup+'組':''} · ${x.count} 人 · ${x.face||'待部署'} · ${x.task||x.status||''}`;if(coll==='vehicles')return `${x.name} · ${x.face||'待部署'} · ${x.task||x.status||''}`;return `${x.vehicleName} → ${x.targetName} · ${x.port||'水線'}`;}
function renderIntakePlan28(){
 const p=intake28?.plan;if(!p)return;
 const host=$('intakeResult28');host.hidden=false;$('intakeConfirm28').checked=false;
 $('intakeCorrected28').textContent=p.corrected;
 $('intakeCorrections28').innerHTML=p.corrections.map(c=>`<span class="intake-correction">${escapeHtml(c.from)} → <b>${escapeHtml(c.to)}</b></span>`).join('')||'<span class="hint">未套用名稱校正</span>';
 $('intakeChanges28').innerHTML=p.writes.map(w=>`<article class="intake-change"><div><span class="tag">${w.before?(w.after?'更新':'移除'):'新增'}${{crews:'人員',vehicles:'車輛',hoses:'水線'}[w.coll]}</span></div><div class="intake-before">原：${escapeHtml(describeIntakeRecord28(w.coll,w.before))}</div><div class="intake-after">改為：${escapeHtml(describeIntakeRecord28(w.coll,w.after))}</div></article>`).join('')||'<p>本次內容與現況相同，沒有需要重複登錄的資料。</p>';
 $('intakeTotal28').textContent=`在冊人數 ${p.totalBefore} → ${p.totalAfter} 人 · ${p.writes.length} 筆變更`;
 $('intakeIssues28').innerHTML=p.issues.map(issue=>`<div class="intake-issue"><b>${escapeHtml(issue.message)}</b><p>${escapeHtml(issue.line||'')}</p>${issue.candidates?.length?`<label>請點選確認<select data-intake-choice="${escapeHtml(issue.key)}"><option value="">選擇對象</option>${issue.candidates.map(c=>`<option value="${escapeHtml(typeof c==='string'?c:c.value)}">${escapeHtml(typeof c==='string'?c:c.label)}</option>`).join('')}</select></label>`:''}</div>`).join('');
 $('intakeIssues28').querySelectorAll('[data-intake-choice]').forEach(el=>el.onchange=()=>{intake28.choices[el.dataset.intakeChoice]=el.value;parseIntake28();});
 $('intakeNotes28').textContent=p.notes.join('；');
 $('intakeApply28').disabled=p.issues.length>0||!p.writes.length;
 $('intakeMessage28').textContent=p.issues.length?'尚有未確認項目，請選擇對象或補說後重新辨識。':'請核對原文、校正名稱及本次差異，再一次確認登錄。';
}
function startIntakeSpeech28(){
 if(intakeBusy28)return;
 if(intakeSpeech28){intakeSpeech28.stop();return;}
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){$('intakeText28').focus();$('intakeMessage28').textContent='此瀏覽器請使用鍵盤麥克風；輸入後按「辨識本次回報」。';return;}
 const session=intake28,caseId=currentCaseId,rec=new Speech();let received=false;
 rec.lang='zh-TW';rec.continuous=false;rec.interimResults=true;intakeSpeech28=rec;
 $('intakeMic28').textContent='停止收音';$('intakeMessage28').textContent='收音中… 請說單位、人數、位置或水線變更。';
 rec.onresult=e=>{if(intake28!==session||currentCaseId!==caseId||!$('intakeDialog28').open)return;
  let interim='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal){received=true;$('intakeText28').value=($('intakeText28').value+'；'+e.results[i][0].transcript).replace(/^；/,'');invalidateIntake28();}else interim+=e.results[i][0].transcript;}
  $('intakeMessage28').textContent=interim||'語音已轉成文字，停止收音後顯示差異。';
 };
 rec.onerror=e=>{received=false;$('intakeMessage28').textContent=e.error==='not-allowed'?'麥克風未獲允許，可使用鍵盤語音或直接輸入。':'未取得完整語音，原文字保留，可重新收音。';};
 rec.onend=()=>{if(intakeSpeech28===rec)intakeSpeech28=null;$('intakeMic28').textContent='開始語音';if(received&&currentCaseId===caseId&&intake28===session&&$('intakeDialog28').open)safeIntake28(parseIntake28)();};
 try{rec.start();}catch{cancelIntakeSpeech28();$('intakeMessage28').textContent='無法啟動麥克風，請使用鍵盤語音或文字。';}
}
function safeIntake28(fn){return async(...args)=>{try{return await fn(...args);}catch(err){$('intakeMessage28').textContent=err.message||'尚未儲存，請重試';toast(err.message||'尚未儲存',5000);}};}
function stampWrites28(writes,commandId){const now=Date.now();return writes.map(w=>({...w,after:w.after?{...w.after,...(w.coll==='crews'&&w.after.status==='作業中'&&w.before?.status!=='作業中'?{startAt:now,dispatchCount:(w.before?.dispatchCount||0)+1}:{}),createdAt:w.before?.createdAt||now,updatedAt:now,lastIntakeId:commandId}:null}));}
function withoutId28(x){const {id,...data}=x;return data;}
async function commitIntake28(event,revision){
 const id=event.caseId;
 if(firebaseEnabled){
  const ref=db.collection('cases').doc(id),evRef=ref.collection('intakeEvents').doc(event.id);
  return db.runTransaction(async tx=>{
   const existing=await tx.get(evRef);if(existing.exists)return {duplicate:true,event:{id:existing.id,...existing.data()}};
   const cs=await tx.get(ref);if(!cs.exists||cs.data().status==='closed')throw Error('案件已結束或移除');
   if(intakeRevision28(cs.data())!==revision)throw Error('其他操作已更新人車或圖面，請重新辨識並確認');
   const docs=await Promise.all(event.writes.map(w=>tx.get(ref.collection(w.coll).doc(w.id))));
   const latest={crews:[],vehicles:[],hoses:[]};docs.forEach((d,i)=>{if(d.exists)latest[event.writes[i].coll].push({id:d.id,...d.data()});});FCIntake.assertFresh(event.writes,latest);
   for(const w of event.writes){const d=ref.collection(w.coll).doc(w.id);if(w.after)tx.set(d,withoutId28(w.after));else tx.delete(d);}
   tx.set(evRef,withoutId28(event));
   tx.set(ref.collection('logs').doc(event.id),{type:'intake',message:event.summary,operatorId:event.authorUid,operator:event.operator||'',authorUid:event.authorUid,createdAt:event.createdAt});
   tx.update(ref,{resourceRevision:(cs.data().resourceRevision||0)+1,lastIntakeId:event.id,deploymentTextSource:'intake',updatedAt:event.createdAt});
   return {event,revision:(cs.data().resourceRevision||0)+1};
  });
 }
 if(id!==currentCaseId)throw Error('案件已切換');
 const old=(live.intakeEvents||[]).find(x=>x.id===event.id);if(old)return {duplicate:true,event:old};
 if(intakeRevision28()!==revision)throw Error('人車或圖面已更新，請重新辨識');
 const result=FCIntake.apply({writes:event.writes,issues:[]},intakeSnapshot28());
 // Persist first. A quota/storage failure must leave the in-memory state unchanged too.
 const candidate={...currentCase,...result,resourceRevision:(currentCase.resourceRevision||0)+1,lastIntakeId:event.id,deploymentTextSource:'intake',intakeEvents:[...(live.intakeEvents||[]),event],logs:[...live.logs,{id:event.id,type:'intake',message:event.summary,operator:radioCallSign(),createdAt:event.createdAt}]};
 const casesNext=localState.cases.map(c=>c.id===id?candidate:c);
 localStorage.setItem(LOCAL_KEY,JSON.stringify({...localState,cases:casesNext}));
 Object.assign(currentCase,candidate);Object.assign(live,result,{intakeEvents:candidate.intakeEvents,logs:candidate.logs});localState.cases=casesNext;
 return {event};
}
async function applyIntake28(){
 if(intakeBusy28)return;if(!intake28?.plan||intake28.caseId!==currentCaseId)throw Error('請重新辨識本次回報');
 if(!$('intakeConfirm28').checked)throw Error('請先勾選核對名稱、人數及變更內容');
 const session=intake28,p=session.plan;if(p.issues.length||!p.writes.length)throw Error('尚有未確認項目或沒有變更');
 if(currentCase.mode==='practice'&&myTrainingRole()==='觀察員')throw Error('觀察員僅可閱覽');
 const writes=stampWrites28(p.writes,session.commandId),event={id:session.commandId,caseId:session.caseId,raw:session.text,corrected:p.corrected,corrections:p.corrections,choices:session.choices,writes,createdAt:Date.now(),authorUid:profile.id,operator:radioCallSign(),summary:`語音／文字確認登錄：在冊 ${p.totalBefore}→${p.totalAfter} 人；${writes.length} 筆人車水線變更`,kind:'apply'};
 intakeBusy28=true;$('intakeText28').disabled=true;$('intakeApply28').disabled=true;cancelIntakeSpeech28();
 try{
  const result=await commitIntake28(event,session.revision);
  if(currentCaseId!==session.caseId||intake28!==session)return;
  if(!firebaseEnabled){currentCase.deploymentTextSource='intake';deploymentTextSource='intake';}
  session.plan=null;session.text='';session.choices={};session.commandId=uid('intake');$('intakeText28').value='';$('intakeResult28').hidden=true;
  $('intakeMessage28').textContent=result.duplicate?'此筆已完成，未重複登錄。':'已確認登錄，可繼續說下一次回報。';
  renderLiveParts();renderIntakeHistory28();
 }finally{intakeBusy28=false;$('intakeText28').disabled=false;$('intakeApply28').disabled=false;}
}
async function undoIntake28(eventId){
 if(intakeBusy28)return;const prior=(live.intakeEvents||[]).find(e=>e.id===eventId);if(!prior||prior.caseId!==currentCaseId)throw Error('找不到此案件的回報紀錄');
 const writes=prior.writes.map(w=>({coll:w.coll,id:w.id,before:w.after,after:w.before}));FCIntake.apply({writes,issues:[]},intakeSnapshot28());
 const event={id:'undo_'+prior.id,caseId:currentCaseId,kind:'undo',undoOf:prior.id,raw:'',corrected:'',corrections:[],choices:{},writes,authorUid:profile.id,operator:radioCallSign(),createdAt:Date.now(),summary:'復原回報：'+prior.summary};
 intakeBusy28=true;try{await commitIntake28(event,intakeRevision28());if(currentCaseId!==event.caseId)return;intake28.plan=null;$('intakeResult28').hidden=true;$('intakeMessage28').textContent='已復原，此次回報及復原紀錄均保留。';if(!firebaseEnabled){renderLiveParts();renderIntakeHistory28();}}finally{intakeBusy28=false;}
}
function renderIntakeHistory28(){
 const el=$('intakeHistory28');if(!el||!$('intakeDialog28').open)return;
 const list=(live.intakeEvents||[]).slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,6);
 el.innerHTML=list.map(e=>`<details><summary>${escapeHtml(new Date(e.createdAt).toLocaleTimeString('zh-TW'))} · ${escapeHtml(e.summary)}</summary><p>${escapeHtml(e.operator||'')}｜原文：${escapeHtml(e.raw||'復原操作')}</p><p>校正：${escapeHtml(e.corrected||'—')}</p>${(e.writes||[]).map(w=>`<p>${escapeHtml(describeIntakeRecord28(w.coll,w.before))} → ${escapeHtml(describeIntakeRecord28(w.coll,w.after))}</p>`).join('')}${e.kind==='apply'&&!(live.intakeEvents||[]).some(x=>x.undoOf===e.id)?`<button type="button" class="btn small ghost" data-intake-undo="${escapeHtml(e.id)}">復原這次登錄</button><p class="hint">若相關資料已再次修改，系統會阻止復原，請用新的修正回報。</p>`:''}</details>`).join('')||'<p class="hint">本案件尚無快速回報紀錄</p>';
 el.querySelectorAll('[data-intake-undo]').forEach(b=>b.onclick=safeIntake28(()=>undoIntake28(b.dataset.intakeUndo)));
}
function initV28(){
 $('openIntake28').onclick=()=>openIntake28();
 $('parseDeploymentBtn').textContent='辨識本次部署／人員回報';$('parseDeploymentBtn').onclick=()=>openIntake28($('deploymentTextRecord').value.trim());
 $('intakeClose28').onclick=()=>closeIntake28();$('intakeDialog28').addEventListener('cancel',e=>{e.preventDefault();closeIntake28();});
 $('intakeText28').oninput=invalidateIntake28;
 $('intakeParse28').onclick=safeIntake28(parseIntake28);$('intakeMic28').onclick=startIntakeSpeech28;$('intakeApply28').onclick=safeIntake28(applyIntake28);
 $('intakeNew28').onclick=()=>{cancelIntakeSpeech28();$('intakeText28').value='';invalidateIntake28();$('intakeText28').focus();};
 document.querySelectorAll('[data-intake-example]').forEach(b=>b.onclick=()=>{$('intakeText28').value=b.dataset.intakeExample;invalidateIntake28();$('intakeText28').focus();});
 // The same entry is offered beside the existing manual personnel roster.
 const btn=document.createElement('button');btn.type='button';btn.className='btn small ghost';btn.textContent='語音／文字報到與人數修正';btn.onclick=()=>openIntake28();$('dashboardSection').prepend(btn);
}
