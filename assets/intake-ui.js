'use strict';
let intake28=null,intakeBusy28=false,resourceReady28=new Set(),intakeRequest29=null;
let aiPreference29='auto',aiFallback29=true;
function intakeSnapshot28(){return Object.fromEntries(FCIntake.collections.map(c=>[c,JSON.parse(JSON.stringify(live[c]||[]))]));}
function intakeRevision28(c=currentCase){return FCIntake.fingerprint({revision:c?.resourceRevision||0,box:c?.buildingBox||null});}
function intakePosition28(face,index){const box=getBuildingBox(),n=FCIntake.faces.indexOf(face),w=box.widthM/2+15,h=box.heightM/2+15;const p=n===0?[index%4*8,-h]:n===1?[w,index%4*8]:n===2?[index%4*8,h]:n===3?[-w,index%4*8]:[w+25,25-index*7];return {...localPointToLatLng(box,...p),anchorBuilding:true,staged:n<0};}
function closeIntake28(force=false){if(intakeBusy28&&!force)return;if($('intakeDialog28'))$('intakeDialog28').open=false;}
function clearIntake28(){intakeRequest29?.abort();intakeRequest29=null;intake28=null;if($('intakeDialog28'))setIntakeDisabled29(false);closeIntake28(true);if($('intakeText28'))$('intakeText28').value='';if($('intakeResult28'))$('intakeResult28').hidden=true;}
function ensureIntake29(){
 if(!currentCase||currentCase.id!==currentCaseId)throw Error('案件載入中，請稍候');
 if(firebaseEnabled&&resourceReady28.size<3)throw Error('人車與水線同步中，請稍候');
 if(currentCase.status==='closed')throw Error('案件已結束，請先重新開啟案件');
 if(currentCase.mode==='practice'&&myTrainingRole()==='觀察員')throw Error('觀察員僅可閱覽');
 if(intake28?.caseId!==currentCaseId)intake28={caseId:currentCaseId,commandId:uid('intake'),text:'',items:[],plan:null,revision:null};
 $('intakeCase28').textContent=`${currentCase.mode==='practice'?'練習模式':'實戰模式'} · ${currentCase.caseNo||currentCaseId}`;
 return intake28;
}
function openIntake28(text){
 try{ensureIntake29();if(intakeBusy28)return;switchCasePage('arrivalSection');activeStage='初';activeArrivalCard='deployment';selectCommandStage('初');
 if(typeof text==='string'){$('intakeText28').value=text;invalidateIntake28();}
 $('intakeDialog28').open=true;renderIntakeHistory28();$('intakeText28').focus();}catch(e){toast(e.message);}
}
function invalidateIntake28(){
 if(intakeBusy28)return;intakeRequest29?.abort();intakeRequest29=null;
 const s=ensureIntake29();s.text=$('intakeText28').value;s.plan=null;s.items=[];s.base=null;s.commandId=uid('intake');
 $('intakeResult28').hidden=true;$('intakeConfirm28').checked=false;$('intakeParse28').disabled=false;$('intakeLocal29').disabled=false;$('intakeAdd29').disabled=false;
 $('intakeMessage28').textContent='文字已更新，請點「AI 辨識內容」。也可以直接手動新增項目。';
}
function captureBase29(session){session.base=intakeSnapshot28();session.caseBase=JSON.parse(JSON.stringify(currentCase));session.revision=intakeRevision28();}
async function parseIntake28(local=false){
 const session=ensureIntake29();if(intakeBusy28||intakeRequest29)return;
 const text=$('intakeText28').value.trim();if(!text||text.length>6000)throw Error('請輸入 1–6,000 字的回報');
 session.text=text;session.commandId=uid('intake');const roster=FCIntake.roster(UNIT_TREE);captureBase29(session);
 let draft,meta;
 if(local===true){draft=FCIntake29.local(text,roster);meta={providerUsed:'local',modelUsed:'本機規則整理（非 AI）'};}
 else{
  const controller=new AbortController();intakeRequest29=controller;const timer=setTimeout(()=>controller.abort('timeout'),75000);
  $('intakeResult28').querySelectorAll('input,select,button').forEach(el=>el.disabled=true);$('intakeAdd29').disabled=true;
  $('intakeParse28').disabled=true;$('intakeLocal29').disabled=true;$('intakeMessage28').textContent='AI 正在分類原句、人數與部署；失敗時依設定切換服務。';
  try{
   const res=await authenticatedAI('/api/ai-advice',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({mode:'intake_parse',text,roster,crews:session.base.crews.map(({id,unit,voiceGroup,count,face,task})=>({id,unit,group:voiceGroup,count,face,task})),vehicles:session.base.vehicles.map(({id,name,unit,face})=>({id,name,unit,face})),hoses:session.base.hoses.map(({unit,vehicleName,targetName,supplyUnconfirmed})=>({unit,vehicleName,targetName,supplyUnconfirmed})),aiProvider:aiPreference29,aiFallback:aiFallback29})});
   const data=await res.json();if(session!==intake28||currentCaseId!==session.caseId||controller.signal.aborted)return;
   if(!res.ok)throw Error(data.error||'AI 未完成，請切換服務，或使用本機整理／手動新增');
   draft=FCIntake29.sanitize(data.draft,text,roster);meta={providerUsed:data.providerUsed,modelUsed:data.modelUsed,fallbackUsed:!!data.fallbackUsed,attempts:data.attempts||[]};
  }catch(e){if(controller.signal.aborted){if(controller.signal.reason==='timeout'&&session===intake28)throw Error('AI 等候逾時，原文保留，可切換服務或使用本機整理');return;}throw e;}
  finally{clearTimeout(timer);if(intakeRequest29===controller){$('intakeResult28').querySelectorAll('input,select,button').forEach(el=>el.disabled=false);$('intakeAdd29').disabled=false;intakeRequest29=null;$('intakeParse28').disabled=false;$('intakeLocal29').disabled=false;}}
 }
 if(session!==intake28||currentCaseId!==session.caseId)return;
 session.items=draft.items.map(x=>({...x,selected:!x.uncertainty,reviewed:false}));session.corrected=draft.correctedText;session.corrections=draft.corrections||[];session.meta=meta;
 renderIntakePlan28();
}
function describeIntakeRecord28(coll,x){if(!x)return '無';if(coll==='crews')return `${x.unit}${x.voiceGroup?' '+x.voiceGroup+'組':''} · ${x.count} 人 · ${x.face||'待部署'} · ${x.task||x.status||''}`;if(coll==='vehicles')return `${x.name} · ${x.face||'待部署'} · ${x.task||x.status||''}`;return `${x.vehicleName||x.unit+'（供水起點待確認）'} → ${x.targetName} · ${x.port||'水線'}`;}
function buildPlan29(){const s=intake28;if(!s?.base)return null;s.plan=FCIntake29.compile(s.items,s.base,s.caseBase,FCIntake.roster(UNIT_TREE),{locate:intakePosition28,vehicleType});return s.plan;}
function field29(i,key,label,type='text'){
 const id='edit29_'+i.id+'_'+key,v=i[key]??'';
 return `<label for="${escapeHtml(id)}">${label}<input id="${escapeHtml(id)}" data-field="${key}" value="${escapeHtml(String(v))}" ${type==='number'?'inputmode="text" placeholder="可填七、兩或 7；留空保留原數"':''} maxlength="${key==='text'?800:160}" /></label>`;
}
function select29(i,key,label,options){return `<label>${label}<select data-field="${key}">${options.map(([v,l])=>`<option value="${escapeHtml(v)}" ${String(i[key]||'')===v?'selected':''}>${escapeHtml(l)}</option>`).join('')}</select></label>`;}
function renderIntakePlan28(){
 const s=intake28;if(!s)return;if(!s.base)captureBase29(s);const p=buildPlan29();
 $('intakeResult28').hidden=false;$('intakeConfirm28').checked=false;
 $('intakeCorrected28').textContent=s.corrected||s.text||'手動新增';
 $('intakeCorrections28').innerHTML=(s.corrections||[]).map(c=>`<span class="intake-correction">${escapeHtml(c.from)} → <b>${escapeHtml(c.to)}</b></span>`).join('')||'<span class="hint">沒有自動名稱校正</span>';
 const roster=FCIntake.roster(UNIT_TREE);
 $('intakeChanges28').innerHTML=s.items.map(i=>{
  const resource=['crew','vehicle','hose'].includes(i.kind),faceOptions=[['','保留現況／未提供'],...FCIntake.faces.map(x=>[x,x])];
  let fields=select29(i,'kind','資料類型',FCIntake29.kinds.map(k=>[k,FCIntake29.labels[k]]));
  if(resource){fields+=`<label>分隊<select data-unit-select><option value="">請選擇分隊</option>${roster.map(r=>`<option value="${escapeHtml(r.brigade+'|'+r.unit)}" ${i.unit===r.unit&&(!i.brigade||i.brigade===r.brigade)?'selected':''}>${escapeHtml(r.unit+'｜'+r.brigade)}</option>`).join('')}</select></label>`;}
  if(i.kind==='crew'){
   fields+=field29(i,'number','本次人數','number')+select29(i,'quantityMode','數量意思',[['set','目前總數／修正為'],['add','本次增加'],['subtract','本次減少']])+field29(i,'group','編組（有分組時填寫）')+select29(i,'face','部署面向',faceOptions)+field29(i,'task','任務');
   const groups=(s.base.crews||[]).filter(c=>c.unit===i.unit);if(groups.length>1)fields+=select29(i,'targetId','更新哪一組',[['','依編組名稱判斷'],...groups.map(c=>[c.id,`${c.voiceGroup||c.leader||c.id.slice(-6)}｜${c.count}人｜${c.face||'待部署'}`])]);
  }
  if(i.kind==='vehicle')fields+=field29(i,'vehicle','完整車號（例：淡水11）')+select29(i,'face','車輛面向',faceOptions);
  if(i.kind==='hose')fields+=field29(i,'vehicle','來源車號（未提供可留空）')+field29(i,'number','水線條數','number')+select29(i,'quantityMode','數量意思',[['set','此起終點總條數'],['add','本次增加'],['subtract','本次減少']])+select29(i,'target','水線終點',[['','請選擇終點'],...FCIntake.faces.map(x=>[x,x]),...[...new Set([...(s.base.vehicles||[]).map(v=>v.name),...s.items.filter(x=>x.kind==='vehicle').map(x=>x.vehicle),i.target].filter(x=>x&&!FCIntake.faces.includes(x)))].map(x=>[x,x])])+field29(i,'task','水線任務');
  if(i.kind==='support')fields+=field29(i,'task','支援類型')+field29(i,'number','需要幾台（未定可留空）','number');
  if(!resource)fields+=field29(i,'text','紀錄內容');
  const preview=p.previews.find(x=>x.id===i.id);
  return `<article class="review-card29 ${i.selected?'':'deferred29'}" data-item="${escapeHtml(i.id)}"><div class="review-top29"><label><input type="checkbox" data-select ${i.selected?'checked':''}>${i.selected?'列入本次登錄':'稍後處理'} · ${escapeHtml(FCIntake29.labels[i.kind])}</label><button type="button" class="btn small ghost" data-remove>移除此項</button></div>${i.uncertainty?`<div class="review-warning29">${escapeHtml(i.uncertainty)}<label><input type="checkbox" data-review ${i.reviewed?'checked':''}>已核對原句並確認此項</label></div>`:''}<details class="review-evidence29"><summary>查看原句</summary><p>${escapeHtml(i.evidence||'手動新增')}</p></details><div class="review-fields29">${fields}</div><p class="review-preview29">${escapeHtml(preview?`${preview.before?'原：'+preview.before+' → ':''}${preview.after}`:'勾選後顯示本次差異')}</p><div data-error role="status"></div></article>`;
 }).join('')||'<p>尚無項目，可按下方按鈕新增並直接編輯。</p>';
 $('intakeChanges28').querySelectorAll('[data-item]').forEach(card=>{
  const i=s.items.find(x=>x.id===card.dataset.item);
  card.querySelector('[data-select]').onchange=e=>{i.selected=e.target.checked;renderIntakePlan28();};
  if(card.querySelector('[data-review]'))card.querySelector('[data-review]').onchange=e=>{i.reviewed=e.target.checked;updateIntakeSummary29();};
  card.querySelector('[data-remove]').onclick=()=>{s.items=s.items.filter(x=>x!==i);renderIntakePlan28();};
  card.querySelectorAll('[data-field]').forEach(el=>{const fn=()=>{i[el.dataset.field]=el.value;i.reviewed=false;const check=card.querySelector('[data-review]');if(check)check.checked=false;if(el.dataset.field==='kind')renderIntakePlan28();else updateIntakeSummary29();};el[el.tagName==='SELECT'?'onchange':'oninput']=fn;});
  if(card.querySelector('[data-unit-select]'))card.querySelector('[data-unit-select]').onchange=e=>{[i.brigade,i.unit]=e.target.value.split('|');i.targetId='';i.reviewed=false;renderIntakePlan28();};
 });
 updateIntakeSummary29();
}
function updateIntakeSummary29(){
 const s=intake28,p=buildPlan29();if(!p)return;$('intakeConfirm28').checked=false;
 const deferred=s.items.filter(i=>!i.selected).length,count=p.writes.length+p.caseChanges.length;
 $('intakeTotal28').textContent=`在冊 ${p.totalBefore} → ${p.totalAfter} 人｜${p.writes.length} 筆人車水線、${p.caseChanges.length} 個 SOP／情資欄位｜${deferred} 項稍後處理`;
 $('intakeIssues28').textContent=p.issues.length?`選入項目仍有 ${p.issues.length} 個問題。可直接修改，或取消該項的「列入本次登錄」。`:'';
 $('intakeChanges28').querySelectorAll('[data-item]').forEach(card=>{const errors=p.issues.filter(e=>e.id===card.dataset.item);card.querySelector('[data-error]').textContent=errors.map(x=>x.message).join('；');const v=p.previews.find(x=>x.id===card.dataset.item);card.querySelector('.review-preview29').textContent=v?`${v.before?'原：'+v.before+' → ':''}${v.after}`:'此項尚未列入變更';});
 $('intakeNotes28').textContent='來源：'+(s.meta?.providerUsed==='local'?'本機規則整理（非 AI）':s.meta?.providerUsed?`${s.meta.providerUsed} / ${s.meta.modelUsed}${s.meta.fallbackUsed?' · 已啟用備援':''}`:'手動編輯');
 $('intakeApply28').disabled=intakeBusy28||p.issues.length>0||!count;
 $('intakeMessage28').textContent=p.issues.length?'請修改標示的項目；其他已確認項目可先登錄。':!count?'尚無可儲存的差異。可新增項目，或勾選要登錄的資料。':'核對各項與總人數後，勾選下方確認並登錄。';
}
function addIntakeRow29(){const s=ensureIntake29();s.text=$('intakeText28').value;if(intakeBusy28||intakeRequest29)return;if(!s.base)captureBase29(s);const kind=$('intakeAddKind29').value;s.items.push(FCIntake29.item(kind,{id:uid('row'),text:kind==='note'?$('intakeText28').value.trim():'',evidence:'手動新增'}));renderIntakePlan28();}
function safeIntake28(fn){return async(...args)=>{try{return await fn(...args);}catch(err){$('intakeMessage28').textContent=err.message||'尚未儲存，請重試';toast(err.message||'尚未儲存',5000);}};}
function stampWrites28(writes,commandId){const now=Date.now();return writes.map(w=>({...w,after:w.after?{...w.after,...(w.coll==='crews'&&w.after.status==='作業中'&&w.before?.status!=='作業中'?{startAt:now,dispatchCount:(w.before?.dispatchCount||0)+1}:{}),createdAt:w.before?.createdAt||now,updatedAt:now,lastIntakeId:commandId}:null}));}
function withoutId28(x){const {id,...data}=x;return data;}
async function commitIntake28(event,revision){
 const id=event.caseId;
 if(id!==currentCaseId||event.authorUid!==profile.id)throw Error('案件或登入身分已變更');
 if(currentCase?.status==='closed')throw Error('案件已結束');
 if(currentCase?.mode==='practice'&&myTrainingRole()==='觀察員')throw Error('觀察員僅可閱覽');
 if(firebaseEnabled){
  const ref=db.collection('cases').doc(id),evRef=ref.collection('intakeEvents').doc(event.id);
  return db.runTransaction(async tx=>{
   const existing=await tx.get(evRef);if(existing.exists)return {duplicate:true,event:{id:existing.id,...existing.data()}};
   const cs=await tx.get(ref);if(!cs.exists||cs.data().status==='closed')throw Error('案件已結束或移除');
   if(intakeRevision28(cs.data())!==revision)throw Error('其他操作已更新人車或圖面，請重新辨識並確認');
   const docs=await Promise.all(event.writes.map(w=>tx.get(ref.collection(w.coll).doc(w.id))));
   const latest={crews:[],vehicles:[],hoses:[]};docs.forEach((d,i)=>{if(d.exists)latest[event.writes[i].coll].push({id:d.id,...d.data()});});FCIntake.assertFresh(event.writes,latest);
   FCIntake29.assertCaseFresh(event.caseChanges||[],cs.data());
   for(const w of event.writes){const d=ref.collection(w.coll).doc(w.id);if(w.after)tx.set(d,withoutId28(w.after));else tx.delete(d);}
   tx.set(evRef,withoutId28(event));
   tx.set(ref.collection('logs').doc(event.id),{type:'intake',message:event.summary,operatorId:event.authorUid,operator:event.operator||'',authorUid:event.authorUid,createdAt:event.createdAt});
   tx.update(ref,{...Object.fromEntries((event.caseChanges||[]).map(c=>[c.key,c.after])),resourceRevision:(cs.data().resourceRevision||0)+1,lastIntakeId:event.id,deploymentTextSource:'intake',updatedAt:event.createdAt});
   return {event,revision:(cs.data().resourceRevision||0)+1};
  });
 }
 if(id!==currentCaseId)throw Error('案件已切換');
 const old=(live.intakeEvents||[]).find(x=>x.id===event.id);if(old)return {duplicate:true,event:old};
 if(intakeRevision28()!==revision)throw Error('人車或圖面已更新，請重新辨識');
 FCIntake29.assertCaseFresh(event.caseChanges||[],currentCase);
 const result=FCIntake.apply({writes:event.writes,issues:[]},intakeSnapshot28());
 // Persist first. A quota/storage failure must leave the in-memory state unchanged too.
 const candidate={...currentCase,...result,...Object.fromEntries((event.caseChanges||[]).map(c=>[c.key,c.after])),resourceRevision:(currentCase.resourceRevision||0)+1,lastIntakeId:event.id,deploymentTextSource:'intake',intakeEvents:[...(live.intakeEvents||[]),event],logs:[...live.logs,{id:event.id,type:'intake',message:event.summary,operator:radioCallSign(),createdAt:event.createdAt}]};
 const casesNext=localState.cases.map(c=>c.id===id?candidate:c);
 localStorage.setItem(LOCAL_KEY,JSON.stringify({...localState,cases:casesNext}));
 Object.assign(currentCase,candidate);Object.assign(live,result,{intakeEvents:candidate.intakeEvents,logs:candidate.logs});localState.cases=casesNext;
 return {event};
}
async function applyIntake28(){
 if(intakeBusy28||intakeRequest29)return;if(!intake28?.plan||intake28.caseId!==currentCaseId)throw Error('請重新辨識本次回報');
 if(!$('intakeConfirm28').checked)throw Error('請先勾選核對名稱、人數及變更內容');
 const session=intake28,p=session.items?buildPlan29():session.plan;
 if(p.issues.length||!(p.writes.length+(p.caseChanges||[]).length))throw Error('選入項目尚有未確認資料或沒有變更');
 const writes=stampWrites28(p.writes,session.commandId),event={id:session.commandId,caseId:session.caseId,raw:session.text,corrected:session.corrected||p.corrected||session.text,corrections:session.corrections||[],writes,caseChanges:p.caseChanges||[],reviewedItems:(session.items||[]).filter(x=>x.selected),deferredItems:(session.items||[]).filter(x=>!x.selected),ai:session.meta||{providerUsed:'manual'},resumedFrom:session.resumedFrom||'',createdAt:Date.now(),authorUid:profile.id,operator:radioCallSign(),summary:`文字確認登錄：在冊 ${p.totalBefore}→${p.totalAfter} 人；${writes.length} 筆人車水線、${(p.caseChanges||[]).length} 個 SOP／情資欄位變更`,kind:'apply'};
 intakeBusy28=true;setIntakeDisabled29(true);
 try{
  const result=await commitIntake28(event,session.revision);
  if(currentCaseId!==session.caseId||intake28!==session)return;
  session.plan=null;session.base=null;session.items=[];session.resumedFrom='';session.text='';session.commandId=uid('intake');$('intakeText28').value='';$('intakeResult28').hidden=true;
  deploymentTextSource='intake';
  renderLiveParts();renderIntakeHistory28();
  // The shared SOP form must reflect committed values as well as its summary.
  if(!firebaseEnabled){syncIntakeCaseFields29();renderArrivalStatusCards();renderCommandGuide();}
  $('intakeMessage28').textContent=result.duplicate?'此筆已完成，未重複登錄。':`已確認登錄。${event.deferredItems.length?'待確認項目保留在「最近回報」，可繼續處理。':'可繼續輸入下一次回報。'}`;
 }finally{intakeBusy28=false;setIntakeDisabled29(false);}
}
function setIntakeDisabled29(value){$('intakeDialog28').querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=value);}
function syncIntakeCaseFields29(){
 for(const name of ['commandState','firstSideState','firstSideMode','supportState'])if(currentCase[name])setRadioValue(name,currentCase[name]);
 for(const key of ['commandSituation','supportDetails'])if($(key))$(key).value=currentCase[key]||'';
 applySupportValues(currentCase.supports||[]);
 updateArrivalConditionalPanels();
}
async function undoIntake28(eventId){
 if(intakeBusy28||intakeRequest29)return;const prior=(live.intakeEvents||[]).find(e=>e.id===eventId);if(!prior||prior.caseId!==currentCaseId)throw Error('找不到此案件的回報紀錄');
 const writes=prior.writes.map(w=>({coll:w.coll,id:w.id,before:w.after,after:w.before})),caseChanges=(prior.caseChanges||[]).map(c=>({key:c.key,before:c.after,after:c.before}));
 FCIntake.apply({writes,issues:[]},intakeSnapshot28());FCIntake29.assertCaseFresh(caseChanges,currentCase);
 const event={id:'undo_'+prior.id,caseId:currentCaseId,kind:'undo',undoOf:prior.id,raw:'',corrected:'',corrections:[],writes,caseChanges,authorUid:profile.id,operator:radioCallSign(),createdAt:Date.now(),summary:'復原回報：'+prior.summary};
 intakeBusy28=true;try{await commitIntake28(event,intakeRevision28());if(currentCaseId!==event.caseId)return;if(intake28)intake28.plan=null;$('intakeResult28').hidden=true;$('intakeMessage28').textContent='已復原，原回報與復原紀錄均保留。';if(!firebaseEnabled){renderLiveParts();syncIntakeCaseFields29();renderIntakeHistory28();}}finally{intakeBusy28=false;}
}
function renderIntakeHistory28(){
 const el=$('intakeHistory28');if(!el||!$('intakeDialog28').open)return;
 const list=(live.intakeEvents||[]).slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,10);
 el.innerHTML=list.map(e=>`<details><summary>${escapeHtml(new Date(e.createdAt).toLocaleTimeString('zh-TW'))} · ${escapeHtml(e.summary)}</summary><p>${escapeHtml(e.operator||'')}｜原文：${escapeHtml(e.raw||'復原操作')}</p><p>校正：${escapeHtml(e.corrected||'—')}</p><p>整理來源：${escapeHtml(e.ai?.providerUsed||'舊版／手動')}</p>${(e.writes||[]).map(w=>`<p>${escapeHtml(describeIntakeRecord28(w.coll,w.before))} → ${escapeHtml(describeIntakeRecord28(w.coll,w.after))}</p>`).join('')}${(e.caseChanges||[]).map(c=>`<p>${escapeHtml(c.key)}：${escapeHtml(String(c.before??'未填'))} → ${escapeHtml(String(c.after??'未填'))}</p>`).join('')}${e.deferredItems?.length&&!(live.intakeEvents||[]).some(x=>x.resumedFrom===e.id&&!(live.intakeEvents||[]).some(u=>u.undoOf===x.id))?`<p>${e.deferredItems.length} 項尚未登錄：${escapeHtml(e.deferredItems.map(x=>x.text||x.evidence||x.unit).join('；'))}</p><button type="button" class="btn small ghost" data-resume="${escapeHtml(e.id)}">繼續處理待確認項目</button>`:''}${e.kind==='apply'&&!(live.intakeEvents||[]).some(x=>x.undoOf===e.id)?`<button type="button" class="btn small ghost" data-intake-undo="${escapeHtml(e.id)}">復原這次登錄</button><p class="hint">若相關資料已再次修改，請用新的修正回報。</p>`:''}</details>`).join('')||'<p class="hint">本案件尚無文字辨識登錄紀錄</p>';
 el.querySelectorAll('[data-intake-undo]').forEach(b=>b.onclick=safeIntake28(()=>undoIntake28(b.dataset.intakeUndo)));
 el.querySelectorAll('[data-resume]').forEach(b=>b.onclick=safeIntake28(()=>{if(intakeBusy28||intakeRequest29)return;const e=live.intakeEvents.find(x=>x.id===b.dataset.resume),s=ensureIntake29();s.resumedFrom=e.id;s.items=JSON.parse(JSON.stringify(e.deferredItems));s.text=e.raw;s.corrected=e.corrected;s.meta=e.ai;s.commandId=uid('intake');$('intakeText28').value=s.text;captureBase29(s);renderIntakePlan28();}));
}
async function checkAI29(){
 $('aiStatus29').textContent='檢查設定中…';const r=await authenticatedAI('/api/ai-config'),data=await r.json();if(!r.ok)throw Error(data.error||'請登入後檢查設定');
 $('aiStatus29').textContent=Object.entries(data.providers).map(([k,v])=>`${k}：${v.configured?'已設定 '+v.model:'未設定金鑰'}`).join('；')+'。'+data.note;
}
function initV28(){
 $('parseDeploymentBtn').textContent='帶入初期部署辨識';$('parseDeploymentBtn').onclick=()=>openIntake28($('deploymentTextRecord').value.trim());
 $('intakeDialog28').addEventListener('toggle',()=>{if($('intakeDialog28').open)safeIntake28(()=>{ensureIntake29();renderIntakeHistory28();})();});
 $('intakeText28').oninput=safeIntake28(invalidateIntake28);
 $('intakeParse28').onclick=safeIntake28(()=>parseIntake28(false));$('intakeLocal29').onclick=safeIntake28(()=>parseIntake28(true));$('intakeApply28').onclick=safeIntake28(applyIntake28);
 $('intakeNew28').onclick=safeIntake28(()=>{if(intakeBusy28)return;$('intakeText28').value='';invalidateIntake28();$('intakeText28').focus();});
 $('intakeAdd29').onclick=safeIntake28(addIntakeRow29);
 $('intakeRefresh29').onclick=safeIntake28(()=>{if(!intake28||intakeBusy28)return;captureBase29(intake28);renderIntakePlan28();});
 $('aiProvider29').onchange=()=>{aiPreference29=$('aiProvider29').value;};$('aiFallback29').onchange=()=>{aiFallback29=$('aiFallback29').checked;};$('aiCheck29').onclick=safeIntake28(checkAI29);
 document.querySelectorAll('[data-intake-example]').forEach(b=>b.onclick=safeIntake28(()=>{$('intakeText28').value=b.dataset.intakeExample;invalidateIntake28();$('intakeText28').focus();}));
}
