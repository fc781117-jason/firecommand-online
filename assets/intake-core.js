/* Shared, deterministic report intake. No writes occur until a human confirms a plan. */
(function(root){'use strict';
const collections=['crews','vehicles','hoses'];
const aliases={'但水':'淡水','淡誰':'淡水','主委':'竹圍','竹唯':'竹圍','竹維':'竹圍','戶尾':'滬尾','滬緯':'滬尾'};
const faces=['第一面','第二面','第三面','第四面'];
const clone=x=>JSON.parse(JSON.stringify(x));
const fingerprint=x=>JSON.stringify(sort(x??null));
function sort(x){if(Array.isArray(x))return x.map(sort);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().filter(k=>x[k]!==undefined).map(k=>[k,sort(x[k])]));return x;}
function number(s){if(/^\d+$/.test(s))return Number(s);const digits={'零':0,'〇':0,'一':1,'二':2,'兩':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};if(s.includes('十')){const [a,b]=s.split('十');return (a?digits[a]:1)*10+(b?digits[b]:0);}return digits[s];}
function roster(tree){return Object.entries(tree).flatMap(([brigade,teams])=>[...new Set(Object.values(teams).flat())].map(unit=>({brigade,unit})));}
function normalize(raw,units){
 let corrected=String(raw).normalize('NFKC').replace(/第([1234])面/g,(_,n)=>faces[Number(n)-1]);const corrections=[];
 for(const [from,to]of Object.entries(aliases))if(units.some(x=>x.unit===to)){
  // Alias must be the subject of a reporting clause, not an arbitrary word in a sentence.
  const re=new RegExp('(^|[，,；;。\\n、\\s])'+from+'(?=分隊|小組|編組|[A-ZＡ-Ｚ]|[\\d一二兩三四五六七八九十]|\\s|報到|抵達|人數|增加|新增|減少|修正|改為|移至|移到|第|到場|待命|搜救|供水|出|$)','g');
  corrected=corrected.replace(re,(all,prefix)=>{corrections.push({from,to});return prefix+to;});
 }
 for(const unit of [...new Set(units.map(x=>x.unit))].sort((a,b)=>b.length-a.length)){
  const re=new RegExp(unit+'([零〇一二三四五六七八九]{2,3})(?![零〇一二三四五六七八九人名位組])','g');
  corrected=corrected.replace(re,(all,digits)=>{const to=unit+[...digits].map(number).join('');corrections.push({from:all,to});return to;});
 }
 return {raw,corrected,corrections};
}
function editDistance(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length];}
function parse(raw,units,choices={}){
 const normalized=normalize(raw,units),intents=[],issues=[];
 const names=[...new Set(units.map(x=>x.unit))].sort((a,b)=>b.length-a.length);
 const vehicleRE=new RegExp('('+names.join('|')+')\\s*(\\d{2,3})(?!\\d|人)','g');
 const lines=normalized.corrected.split(/[；;。\n，,]/).map(x=>x.trim()).filter(Boolean);
 if(raw.length>3000||lines.length>30)throw Error('每次請輸入 3,000 字、30 段以內');
 const outputLines=lines.slice();
 const quantity='([0-9]{1,3}|[零〇一二兩三四五六七八九十]{1,3})';
 lines.forEach((line,index)=>{
  const key=String(index),face=(line.match(/第[一二三四]面/)||[])[0];
  let unit=names.find(n=>line.startsWith(n)),body=unit?line.slice(unit.length):line;
  if(!unit){
   const token=(line.match(/^([\u4e00-\u9fff]{2,4}?)(?=分隊|\d|人數|報到|新增|增加|第|\s)/)||[])[1];
   const candidates=token?names.filter(n=>editDistance(n,token)<=1).slice(0,6):[];
   if(choices['name:'+key]&&names.includes(choices['name:'+key])&&token){unit=choices['name:'+key];body=line.slice(token.length);normalized.corrections.push({from:token,to:unit});outputLines[index]=unit+body;}
   else {issues.push({key:'name:'+key,line,message:'請確認單位名稱，或改成「分隊＋人數／車號」回報',candidates});return;}
  }
  const unitRows=units.filter(x=>x.unit===unit);let brigade=unitRows.length===1?unitRows[0].brigade:choices['brigade:'+key];
  if(!brigade||!unitRows.some(x=>x.brigade===brigade)){issues.push({key:'brigade:'+key,line,message:'此名稱出現在多個大隊，請選擇所屬大隊',candidates:unitRows.map(x=>x.brigade)});return;}
  const canonical=unit+body,vehicles=[...canonical.matchAll(vehicleRE)].map(m=>({unit:m[1],name:m[1]+m[2]}));
  const otherUnits=names.filter(n=>n!==unit&&body.includes(n));
  if(otherUnits.length&&!/供水給|供水至|連接|接至|接給/.test(body)){issues.push({key:'detail:'+key,line,message:'同段包含多個單位，請用逗號分開，逐隊確認人數'});return;}
  const countMatches=[...body.matchAll(new RegExp(quantity+'\\s*(?:位|名|個)?人','g'))];
  const countMatch=/修正|改為|改成|更正|調整/.test(body)?countMatches.at(-1):countMatches[0];
  if(countMatches.length>1&&!/修正|改為|改成|更正|調整/.test(body)){issues.push({key:'count:'+key,line,message:'同段有多個人數，請分段說明單位與人數'});return;}
  const count=countMatch?number(countMatch[1]):undefined;
  const group=(body.match(/^\s*(?:分隊)?\s*([A-Za-z0-9一二三四五六]+)(?:組|小組|編組)/)||[])[1]||'';
  const task=(body.match(/搜救|搜索|救護|警戒|供水|滅火|排煙|人命救助|防護|撤離|待命|原地休息|休息區休息/)||[])[0];
  const status=task==='待命'?'待命':task?.includes('休息')?task:task==='撤離'?'待命':task?'作業中':undefined;
  if(/\d+樓|地[上下]|消防栓|水源|救出|受傷|失聯|尚未|未到|沒有|不要|取消|不是|預計|可能|等一下|如果|請問|是否|嗎|到齊|共.*組/.test(body)){
   issues.push({key:'detail:'+key,line,message:'此段含待確認位置、條件、否定或人員安全資訊；請分開登錄，避免當成已完成的報到'});return;
  }
  // Only supported complete clauses become actions; unfamiliar qualifiers remain a confirmation issue.
  let residual=canonical;
  for(const name of names)residual=residual.split(name).join('');
  residual=residual.replace(/第[一二三四]面/g,'').replace(/[A-Za-z0-9一二三四五六]+(?:小組|編組|組)/g,'').replace(/[0-9零〇一二兩三四五六七八九十]+/g,'');
  residual=residual.replace(/分隊|小組|編組|總人數|人數|修正為|修正成|修正|更正為|更正|改為|改成|調整為|調整|供水給|供水至|連接|接至|接給|改接|改至|出水線|水線|防護水線|進攻水線|新增|增加|減少|減為|再到|再來|加派|補上|報到|抵達|到場|移至|移到|停在|停靠|部署在|部署至|部署|目前|現在|已經|已|搜救|搜索|救護|警戒|供水|滅火|排煙|人命救助|防護|待命|人員|總共|合計|全隊|共計|共|人|名|位|個|的|從|為|在|到|於|請|再出|再拉|出|拉|條|線|了|\s/g,'');
  if(residual){issues.push({key:'detail:'+key,line,message:'部分描述尚未支援（'+residual+'），請分段補說或用原有表單登錄'});return;}
  if(count!==undefined||(!vehicles.length&&(face||task||/報到|抵達|人數/.test(body)))){
   if(count!==undefined&&(!Number.isInteger(count)||count<0||count>99)){issues.push({key:'count:'+key,line,message:'請確認 0–99 人的數字'});return;}
   const mode=/新增|增加|再到|再來|加派|補上/.test(body)?'add':/減少/.test(body)?'subtract':'set';
   if(count===undefined&&/報到|抵達|人數/.test(body)){issues.push({key:'count:'+key,line,message:'未提供人數；請補說人數，不會預設為 4 人'});return;}
   intents.push({kind:'crew',key,line,unit,brigade,group,count,mode,face,task,status,targetId:choices['target:'+key]});
  }
  if(vehicles.length){
   const hoseBody=body.replace(/^\s*\d{2,3}/,'');
   const hoseCount=hoseBody.match(new RegExp(quantity+'\\s*(?:條)?(?:水)?線'))||hoseBody.match(new RegExp('水線(?:修正為|改為|改成)'+quantity+'條'));
   const hoseVerb=/供水給|供水至|連接|接至|接給|改接|改至|出.*線|拉.*線|水線/.test(body);
   const target=vehicles[1]?.name||face;
   const moving=/移至|移到|停在|停靠|部署在|部署至/.test(body)&&!hoseVerb;
   for(const [i,v]of vehicles.entries())intents.push({kind:'vehicle',key:key+':v'+i,line,...v,brigade:units.find(x=>x.unit===v.unit)?.brigade||brigade,face:i===0&&moving?face:undefined});
   if(hoseVerb){
    if(!hoseCount&&!/改接|改至/.test(body)&&vehicles.length<2){issues.push({key:'hose:'+key,line,message:'請補說明確水線條數'});return;}
    if(!target){issues.push({key:'hose:'+key,line,message:'請補說水線終點，例如「淡水11出兩線到第一面」'});return;}
    intents.push({kind:'hose',key,line,source:vehicles[0].name,target,count:hoseCount?number(hoseCount[1]):(/改接|改至/.test(body)?undefined:1),mode:/新增|增加|再出|再拉/.test(body)?'add':'set',rewire:/改接|改至/.test(body)});
   }else if(!moving&&!/報到|到場|抵達|待命/.test(body))issues.push({key:'detail:'+key,line,message:'車輛已辨識；請說明「報到」或「移至第幾面」'});
  }else if(count===undefined&&!face&&!task&&!/報到|抵達|人數/.test(body))issues.push({key:'detail:'+key,line,message:'未辨識可登錄的動作，請使用下方範例格式'});
 });
 return {...normalized,corrected:outputLines.join('；'),intents,issues};
}
function plan(parsed,state,options={}){
 const working=Object.fromEntries(collections.map(c=>[c,clone(state[c]||[])])),before=clone(working),issues=[...parsed.issues],notes=[];
 const newId=(c,key)=>'voice_'+c+'_'+encodeURIComponent(key);
 const locate=options.locate||((face,index)=>({lat:0,lng:0,anchorBuilding:true,staged:!face}));
 const fail=(intent,message,candidates=[])=>issues.push({key:'target:'+intent.key,line:intent.line,message,candidates});
 for(const intent of parsed.intents){
  const i=intent;
  if(i.kind==='crew'){
   let matches=working.crews.filter(c=>c.unit===i.unit&&(!c.brigade||c.brigade===i.brigade)&&(!i.group||(c.voiceGroup||c.leader)===i.group));
   if(i.targetId)matches=matches.filter(x=>x.id===i.targetId);
   if(matches.length>1&&/全隊|合計|總人數|總共|共/.test(i.line)){fail(i,'此單位有多組；全隊總人數請分組更正，避免重複計算');continue;}
   if(matches.length>1){fail(i,'同分隊有多個編組，請選擇此次更新的編組',matches.map(c=>({value:c.id,label:`${c.unit} ${c.voiceGroup||c.leader||c.id.slice(-6)} · ${c.count}人 · ${c.face||'待部署'} · ${c.task||c.status||''}`})));continue;}
   if(i.targetId&&!matches.length){fail(i,'原選擇已不存在，請重新辨識');continue;}
   let c=matches[0];
   if(!c){
    if((i.count===undefined&&!i.allowUnknown)||i.mode==='subtract'){fail(i,'尚無此編組的報到資料；請先提供完整人數');continue;}
    const id=newId('crew',i.brigade+'|'+i.unit+'|'+i.group);
    if(working.crews.some(x=>x.id===id)){fail(i,'編組識別重複，請在原編組修改');continue;}
    c={id,unit:i.unit,brigade:i.brigade,voiceGroup:i.group,leader:i.group,count:0,...(i.count===undefined?{countUnknown:true}:{}),status:'待命',task:'待部署',...locate(i.face,working.crews.length)};working.crews.push(c);
   }
   if(i.count!==undefined){const n=i.mode==='add'?Number(c.count||0)+i.count:i.mode==='subtract'?Number(c.count||0)-i.count:i.count;if(n<0||n>99){fail(i,'修正後人數需在 0–99 人之間');continue;}c.count=n;c.countUnknown=false;}
   if(i.face&&i.face!==c.face){Object.assign(c,locate(i.face,working.crews.indexOf(c)),{face:i.face,staged:false});}
   if(i.task)c.task=i.task;if(i.status)c.status=i.status;
   if(i.mode==='add'||i.mode==='subtract')notes.push(`${i.unit} 本次${i.mode==='add'?'增加':'減少'} ${i.count} 人，確認後為 ${c.count} 人`);
  }
  if(i.kind==='vehicle'){
   const found=working.vehicles.filter(x=>x.name===i.name);
   if(found.length>1){fail(i,`${i.name} 有同名車輛，請先整理車號`);continue;}
   let v=found[0];if(!v){const code=i.name.replace(i.unit,'');const info=options.vehicleType?.(i.name)||{label:'消防車',canHose:/^[156]/.test(code)};v={id:newId('vehicle',i.name),name:i.name,unit:i.unit,brigade:i.brigade,type:info.label,canHose:info.canHose,status:'待命',task:'待部署',...locate(i.face,working.vehicles.length)};working.vehicles.push(v);}
   if(i.face&&v.face!==i.face){
    const oldLat=Number(v.lat),oldLng=Number(v.lng),group=new Set([v.id]),queue=[v.id];
    while(queue.length){const id=queue.shift();for(const h of working.hoses)if(h.targetType==='vehicle'&&!h.supplyUnconfirmed){const other=h.vehicleId===id?h.targetId:h.targetId===id?h.vehicleId:null;if(other&&!group.has(other)){group.add(other);queue.push(other);}}}
    Object.assign(v,locate(i.face,working.vehicles.indexOf(v)),{face:i.face,staged:false});
    for(const peer of working.vehicles)if(peer.id!==v.id&&group.has(peer.id))Object.assign(peer,{lat:Number(peer.lat)+Number(v.lat)-oldLat,lng:Number(peer.lng)+Number(v.lng)-oldLng,face:i.face,staged:false});
   }
  }
  if(i.kind==='hose'){
   const v=working.vehicles.find(x=>x.name===i.source),targetVehicle=working.vehicles.find(x=>x.name===i.target),face=faces.indexOf(i.target);
   if(!v?.canHose||(!targetVehicle&&face<0)||targetVehicle?.id===v.id){fail(i,'請確認可供水車輛及不同的水線終點');continue;}
   const targetType=face>=0?'buildingFace':'vehicle',targetId=face>=0?'face'+(face+1):targetVehicle.id;
   let selected=working.hoses.filter(h=>h.vehicleId===v.id&&h.targetType===targetType&&h.targetId===targetId);
   if(i.lineNo)selected=selected.filter((h,n)=>(h.lineNo||n+1)===i.lineNo);
   if(i.rewire){
    selected=working.hoses.filter(h=>h.vehicleId===v.id);
    if(!selected.length){fail(i,'尚無可改接的既有水線');continue;}
    if(new Set(selected.map(h=>h.targetType+':'+h.targetId)).size>1){fail(i,'此車有多個水線終點，請在圖面選擇要改接的水線');continue;}
   }
   const count=i.count===undefined?selected.length:i.mode==='add'?selected.length+i.count:i.mode==='subtract'?selected.length-i.count:i.count;
   if(!Number.isInteger(count)||count<0||count>6){fail(i,'同一起終點水線數需為 0–6 條');continue;}
   for(let j=0;j<count;j++){
    let h=selected[j];
    if(!h){h={id:newId('hose',v.id+'|'+targetType+'|'+targetId+'|'+(i.lineNo?i.lineNo-1:j)),vehicleId:v.id,vehicleName:v.name,unit:v.unit,owner:v.unit,port:'出水口 '+(j+1),kind:face>=0?'進攻水線':'供水水線',task:'水線作業',status:'使用中'};if(working.hoses.some(x=>x.id===h.id)){fail(i,'水線識別衝突，請在圖面確認現況');break;}working.hoses.push(h);}
    Object.assign(h,{targetType,targetId,targetName:i.target,...(i.lineNo?{lineNo:i.lineNo,port:'第'+i.lineNo+'線'}:{}),...(i.owner?{owner:i.owner}:{}),useHead:!!i.useHead,...(i.task?{task:i.task}:{}),...(targetType==='vehicle'?{linkedMove:true}:{} )});
   }
   const excess=new Set(selected.slice(count).map(x=>x.id));working.hoses=working.hoses.filter(x=>!excess.has(x.id));
  }
 }
 for(let pass=0;pass<working.vehicles.length;pass++)for(const h of working.hoses){
  if(h.targetType!=='vehicle')continue;
  const a=working.vehicles.find(v=>v.id===h.vehicleId),b=working.vehicles.find(v=>v.id===h.targetId);
  if(!a||!b)continue;
  const anchor=a.face?a:b.face?b:null,follower=anchor===a?b:a;
  if(anchor&&!follower.face){const n=working.vehicles.indexOf(follower)+1;Object.assign(follower,{face:anchor.face,staged:false,lat:Number(anchor.lat)+n*0.000018,lng:Number(anchor.lng)+n*0.000028,anchorBuilding:true});}
 }
 const writes=[];
 for(const coll of collections){const ids=new Set([...before[coll],...working[coll]].map(x=>x.id));for(const id of ids){const a=before[coll].find(x=>x.id===id)||null,b=working[coll].find(x=>x.id===id)||null;if(fingerprint(a)!==fingerprint(b))writes.push({coll,id,before:a,after:b});}}
 if(writes.length>100)issues.push({message:'單次變更超過 100 筆，請分次回報'});
 return {...parsed,issues,notes,writes,before,after:working,totalBefore:before.crews.reduce((n,c)=>n+Number(c.count||0),0),totalAfter:working.crews.reduce((n,c)=>n+Number(c.count||0),0)};
}
function assertFresh(writes,latest){for(const w of writes){const now=(latest[w.coll]||[]).find(x=>x.id===w.id)||null;if(fingerprint(now)!==fingerprint(w.before))throw Error('資料已被更新，請重新辨識並確認本次差異');}}
function apply(plan,state){if(plan.issues.length)throw Error('尚有未確認項目');assertFresh(plan.writes,state);const result=clone(state);for(const w of plan.writes){result[w.coll]=result[w.coll].filter(x=>x.id!==w.id);if(w.after)result[w.coll].push(clone(w.after));}const removed=plan.writes.filter(w=>!w.after&&['crews','vehicles'].includes(w.coll));for(const w of removed){if(result.hoses.some(h=>h.vehicleId===w.id||(h.targetId===w.id&&['vehicle','crew'].includes(h.targetType))))throw Error('仍有其他水線連到此人車，請先確認連結後再復原');}return result;}
root.FCIntake={collections,aliases,faces,number,roster,normalize,parse,plan,apply,assertFresh,fingerprint};if(typeof module!=='undefined')module.exports=root.FCIntake;
})(typeof window==='undefined'?globalThis:window);
