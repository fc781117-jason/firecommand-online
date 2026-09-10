/* v29 shared semantic contract. Both AI providers return drafts; only reviewed drafts become writes. */
(function(root){'use strict';
const Core=root.FCIntake||(typeof require==='function'?require('./intake-core.js'):null);
const T=root.FCTactics31||(typeof require==='function'?require('./tactics31.js'):null);
const kinds=['crew','vehicle','hose','command','firstSide','support','note'];
const fields={kind:{type:'string',enum:kinds},unit:{type:'string'},group:{type:'string'},vehicle:{type:'string'},number:{type:['integer','null']},quantityMode:{type:'string',enum:['set','add','subtract']},face:{type:'string'},target:{type:'string'},task:{type:'string'},text:{type:'string'},evidence:{type:'string'},uncertainty:{type:'string'}};
const schema={type:'object',additionalProperties:false,properties:{correctedText:{type:'string'},items:{type:'array',items:{type:'object',additionalProperties:false,properties:fields,required:Object.keys(fields)}}},required:['correctedText','items']};
const labels={crew:'人員報到／部署',vehicle:'車輛',hose:'水線',command:'指揮權轉移',firstSide:'第一面設定',support:'支援需求',note:'情資／補充紀錄'};
const alias={...Core.aliases,'竹園':'竹圍','竹圓':'竹圍','主圍':'竹圍','三隻':'三芝'};
const clone=x=>JSON.parse(JSON.stringify(x));
function number(value){
 if(value===null||value===undefined||String(value).trim()==='')return null;
 let s=String(value).normalize('NFKC').trim().replace(/[\s,，]/g,'').replace(/[壹貳參肆伍陸柒捌玖拾佰仟萬两]/g,c=>({'壹':'一','貳':'二','參':'三','肆':'四','伍':'五','陸':'六','柒':'七','捌':'八','玖':'九','拾':'十','佰':'百','仟':'千','萬':'万','两':'兩'}[c]));
 if(/^\d+$/.test(s))return Number(s);if(!/^[零〇一二兩三四五六七八九十百千万]+$/.test(s))return NaN;
 const digit={'零':0,'〇':0,'一':1,'二':2,'兩':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
 if(!/[十百千万]/.test(s))return Number([...s].map(x=>digit[x]).join(''));
 let result=0,section=0,n=0;for(const c of s){if(c in digit)n=digit[c];else{const scale={十:10,百:100,千:1000,万:10000}[c];if(scale===10000){result+=(section+n||1)*scale;section=0;n=0;}else{section+=(n||1)*scale;n=0;}}}return result+section+n;
}
function canonicalFace(value){
 const s=String(value||'').normalize('NFKC').trim();
 if(/^(?:正面|前面|建物正面|火場正面|front|alpha|A)$/i.test(s))return '第一面';
 const m=s.match(/^(?:第)?([一二三四1234])(?:面|側)?$/);return m?Core.faces['一二三四'.includes(m[1])?'一二三四'.indexOf(m[1]):Number(m[1])-1]:s;
}
function radioVehicles(text,roster,corrections){
 const names=[...new Set(roster.map(x=>x.unit))].sort((a,b)=>b.length-a.length);
 if(!names.length)return text;
 const re=new RegExp('('+names.join('|')+')(?:分隊)?\\s*([0-9零〇一二三四五六七八九么幺拐洞]{2,4})(?![0-9零〇一二三四五六七八九么幺拐洞人名位])','g');
 return text.replace(re,(all,unit,code)=>{
  const digits=code.replace(/[零〇一二三四五六七八九么幺拐洞]/g,c=>({'零':0,'〇':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'么':1,'幺':1,'拐':7,'洞':0}[c]));
  const value=digits.length===4?unit+digits.slice(0,2)+'、'+unit+digits.slice(2):unit+digits;
  if(value!==all)corrections.push({from:all,to:value});return value;
 });
}
function enrich(items,source,roster){
 const norm=normalize(source,roster).text;
 const globalFaces=[...new Set(norm.match(/第[一二三四]面/g)||[])];
 for(const i of items){
  i.face=canonicalFace(i.face);i.target=canonicalFace(i.target);
  const evidence=normalize(i.evidence||'',roster).text;
  const mentioned=[...new Set(evidence.match(/第[一二三四]面/g)||[])];
  if(!i.face&&['crew','vehicle','hose'].includes(i.kind)){
   if(mentioned.length===1)i.face=mentioned[0];
   else if(globalFaces.length===1&&/從|由|進入|部署|出.*線/.test(norm)&&!/(?:未|預計|準備|不要|不宜|將)/.test(norm))i.face=globalFaces[0];
  }
  if(i.kind==='crew'&&!i.task&&/進入|內攻|佈線|布線/.test(evidence)&&!/(?:未|預計|準備|不要|不宜|將)/.test(evidence))i.task='內攻';
  if(i.kind==='hose'){
   if(!i.target)i.target=i.face;
   if(Core.faces.includes(i.target))i.face=i.target;else if(i.target)i.face='';
   if(!i.vehicle){const vs=items.filter(v=>v.kind==='vehicle'&&v.unit===i.unit&&(!i.face||v.face===i.face));if(vs.length===1&&norm.includes(vs[0].vehicle)&&/出|佈|布|水線/.test(norm)){i.vehicle=vs[0].vehicle;i.inference='依同分隊出線描述帶入來源車';}}
  }
 }
 // Merge an unnumbered positional follow-up into the same unambiguous crew draft.
 for(const i of [...items])if(i.kind==='crew'&&i.number===null){const peers=items.filter(x=>x!==i&&x.kind==='crew'&&x.unit===i.unit&&x.group===i.group&&x.number!==null);if(peers.length===1){const peer=peers[0];if(i.face)peer.face=i.face;if(i.task)peer.task=i.task;peer.evidence=[peer.evidence,i.evidence].filter(Boolean).join('；');items.splice(items.indexOf(i),1);}}
 return T.augment(items,norm,roster,item);
}
function connectedVehicles(state,id){
 const seen=new Set([id]),queue=[id];
 while(queue.length){const next=queue.shift();for(const h of state.hoses||[])if(h.targetType==='vehicle'&&!h.supplyUnconfirmed){const other=h.vehicleId===next?h.targetId:h.targetId===next?h.vehicleId:null;if(other&&!seen.has(other)){seen.add(other);queue.push(other);}}}
 return (state.vehicles||[]).filter(v=>seen.has(v.id));
}
function normalize(raw,roster=[]){
 let text=String(raw).normalize('NFKC');const corrections=[];
 text=text.replace(/[零〇一二兩三四五六七八九十百千壹貳參肆伍陸柒捌玖拾佰仟两\d]+(?=\s*(?:名|位|個)?(?:人|台|輛|條|線|面))/g,s=>{const n=number(s);if(Number.isFinite(n)&&String(n)!==s){corrections.push({from:s,to:String(n)});return String(n);}return s;});
 text=text.replace(/第([1-4])面/g,(_,n)=>Core.faces[n-1]);
 for(const [from,to]of Object.entries(alias))if(!roster.length||roster.some(x=>x.unit===to)){
  const re=new RegExp(from+'(?=分隊|小組|[\\d\\s]|跟|與|及|各|由|第|報到|抵達|移|人數|新增|增加|修正|減少|[；，、。]|$)','g');text=text.replace(re,()=>{corrections.push({from,to});return to;});
 }
 text=radioVehicles(text,roster,corrections);
 text=text.replace(/(?:建物|火場)?正面|前面/g,'第一面');
 const codes=Core.normalize(text,roster);corrections.push(...codes.corrections);return {text:codes.corrected,corrections};
}
function item(kind,patch={}){return {id:'',kind,unit:'',group:'',vehicle:'',number:null,quantityMode:'set',face:'',target:'',task:'',text:'',evidence:'',uncertainty:'',selected:true,reviewed:false,...patch};}
function local(raw,roster){
 const normalized=normalize(raw,roster),items=[],names=[...new Set(roster.map(x=>x.unit))].sort((a,b)=>b.length-a.length),unitRE=names.join('|');
 const clauses=normalized.text.split(/[，,；;。\n]/).map(x=>x.trim()).filter(Boolean);
 const add=(kind,data)=>items.push(item(kind,{...data,id:'item'+items.length}));
 for(const line of clauses){let handled=false;
  if(/指揮權.*(?:轉移|移轉|交接)/.test(line)){add(/(?:已|完成|進行).*指揮權.*(?:轉移|移轉|交接)|指揮權.*(?:轉移|移轉|交接).*完成/.test(line)&&!/未|尚未|準備|將|預計/.test(line)?'command':'note',{text:line,evidence:line});handled=true;}
  if(/(?:正面.*第一面|第一面(?:為|是|當作)第一面)/.test(line)){add('firstSide',{text:'現場正面為第一面',evidence:line});handled=true;}
  if(/支援|增援/.test(line)){const m=line.match(/(\d+)台(水庫車|水車|雲梯車|救護車)/);add('support',{text:line,number:m?Number(m[1]):null,task:m?.[2]||(/水庫車/.test(line)?'水庫車':/大隊/.test(line)?'大隊支援':''),evidence:line,uncertainty:/[^\d]台水庫車/.test(line)?'請確認需要幾台水庫車；原文數量不明，不自動猜成十台':''});continue;}
  if(/水源.*(?:缺乏|缺芝|不足|缺之)|待確認|預計|準備|將要|即將|計畫|尚未|未到|不宜|不要|不是|受傷|失聯|撤離|休息|PAR/.test(line)){add('note',{text:line,evidence:line});continue;}
  const peopleRE=new RegExp('('+unitRE+')(?:分隊)?\\s*(?:([A-Z一二三四\\d]+)組)?\\s*(?:人數)?\\s*(?:(?:從\\d+人)?(?:修正為|更正為|改為|改成|新增|增加|減少))?\\s*(\\d+)\\s*(?:名|位|個)?人','g');
  const people=[...line.matchAll(peopleRE)];
  for(const m of people){const segment=line.slice(m.index,(people.find(x=>x.index>m.index)?.index)||line.length);add('crew',{unit:m[1],group:m[2]||'',number:Number(m[3]),quantityMode:/新增|增加/.test(segment)?'add':/減少/.test(segment)?'subtract':'set',face:people.length===1?(line.match(/第[一二三四]面/)||[])[0]||'':'',task:(segment.match(/搜救|內攻|滅火|警戒|供水|待命/)||[])[0]||'',evidence:line});handled=true;}
  const vehicles=[...line.matchAll(new RegExp('('+unitRE+')(?:分隊)?\\s*(\\d{2,3})(?!\\d|人)','g'))].map(m=>({unit:m[1],vehicle:m[1]+m[2]}));
  for(const v of vehicles){add('vehicle',{...v,face:/移至|移到|停在|部署在|進入|出|佈|布/.test(line)?(line.match(/第[一二三四]面/)||[])[0]||'':'',evidence:line});handled=true;}
  const mentioned=names.filter(u=>line.includes(u)&&!names.some(long=>long!==u&&long.includes(u)&&line.includes(long)));
  const face=(line.match(/第[一二三四]面/)||[])[0]||'';
  const hoseCount=line.replace(/\d{2,3}(?=水線)/,'').match(/(\d+)(?:條)?(?:水)?線/);
  if(hoseCount&&mentioned.length){
   const units=/各(?:部|布|佈|出|拉)?\d/.test(line)?mentioned:[mentioned[0]];
   for(const unit of units){
    const explicit=(line.match(new RegExp(unit+'(?:分隊)?(?:由|從|在|於)(第[一二三四]面)'))||[])[1];
    const unitFace=units.length===1?face:explicit||'';
    add('hose',{unit,vehicle:vehicles.find(v=>v.unit===unit)?.vehicle||'',number:Number(hoseCount[1]),face:unitFace,target:vehicles[1]?.vehicle||unitFace,task:/防護/.test(line)?'防護水線':'部署水線',evidence:line,uncertainty:!unitFace&&!vehicles[1]?'請補選此單位的水線目的面向':''});
   }handled=true;
  }
  else if(vehicles.length>1&&/供水給|供水至|接|串|連結|連接/.test(line)){for(let j=0;j<vehicles.length-1;j++)add('hose',{...vehicles[j],number:1,target:vehicles[j+1].vehicle,task:/供水給|供水至|接至/.test(line)?'供水水線':'車輛串接（流向未指定）',evidence:line});handled=true;}
  if(!people.length&&!vehicles.length&&!hoseCount&&mentioned.length===1&&face){add('crew',{unit:mentioned[0],face,task:(line.match(/搜救|內攻|滅火|警戒|供水|待命/)||[])[0]||'',evidence:line,uncertainty:/不宜|不直|不先|未|準備|將/.test(line)?'請核對這是已執行部署還是預定動作':''});handled=true;}
  if(vehicles.length===1&&/供水給|供水至|接至|改接|改至|水線/.test(line)&&!hoseCount){add('note',{text:line,evidence:line,uncertainty:'請補充水線來源、終點與條數；可改為水線項目直接填寫'});handled=true;}
  if(!handled)add('note',{text:line,evidence:line});
 }
 return {correctedText:normalized.text,corrections:normalized.corrections,items:enrich(items,raw,roster)};
}
function sanitize(raw,source,roster){
 if(!raw||!Array.isArray(raw.items)||raw.items.length>60)throw Error('AI 回傳的分類格式不完整');
 const normalized=normalize(source,roster),text=String(raw.correctedText||source).slice(0,6000);
 const items=raw.items.map((x,index)=>{
  if(!x||!kinds.includes(x.kind)||!['set','add','subtract'].includes(x.quantityMode))throw Error('AI 回傳未知的資料類型或數量意思');
  const result=item(x.kind,{id:'item'+index});for(const key of Object.keys(fields)){if(key==='number')result.number=number(x.number);else result[key]=String(x[key]??result[key]).slice(0,['evidence','text'].includes(key)?800:160);}
  if(result.number!==null&&!Number.isFinite(result.number))result.uncertainty='數量無法辨識，請直接修改數量';
  const evidence=normalize(result.evidence,roster).text;
  if(!evidence||!normalized.text.includes(evidence)){result.sourceEvidence=source;result.evidenceNotice='原句對照請見完整輸入';}
  if(result.number!==null&&!new RegExp('(^|[^0-9])'+result.number+'([^0-9]|$)').test(normalized.text))result.uncertainty='請核對數量；完整輸入未明確出現此數字';
  if(result.kind==='crew'&&result.unit&&result.number!==null){const pattern=new RegExp(result.unit+'(?:分隊)?[^，；、。]{0,12}?'+result.number+'(?:名|位|個)?人');if(!pattern.test(normalized.text))result.uncertainty=result.uncertainty||'請核對這個人數是否屬於此分隊';}
  if(result.kind==='command'&&/未|準備|預計|將/.test(result.evidence))result.uncertainty='原句可能不是已完成交接，請確認或改為情資紀錄';
  const originalUnit=result.unit;result.unit=alias[result.unit]||result.unit;if(originalUnit!==result.unit)result.uncertainty=result.uncertainty||`${originalUnit} 是否為 ${result.unit}？`;
  result.face=result.face.replace(/第([1-4])面/g,(_,n)=>Core.faces[n-1]);
  result.reviewed=false;return result;
 });
 return {correctedText:text,corrections:normalized.corrections,items:enrich(items,source,roster)};
}
const caseKeys=['commandTransfer','commandState','commandSituation','firstSideSet','firstSideState','firstSideMode','firstSideName','supportNeeded','supportState','supportDetails','supports','intakeNotes','tacticalZones','drawingRuleVersion'];
function compile(items,state,caseData,roster,options={}){
 const before=clone(state),working=clone(state),nextCase=clone(caseData),errors=[],previews=[];
 const addError=(x,msg)=>errors.push({id:x.id,message:msg});
 function putCase(k,v){nextCase[k]=v;}
 function append(k,text){const lines=String(nextCase[k]||'').split('\n').filter(Boolean);if(!lines.includes(text))lines.push(text);nextCase[k]=lines.join('\n');}
 const seen=new Set(),selected=items.filter(x=>{if(!x.selected)return false;const key=Core.fingerprint(Object.fromEntries(Object.keys(fields).map(k=>[k,x[k]??null])));if(seen.has(key))return false;seen.add(key);return true;});
 const order={crew:0,vehicle:1,hose:2,command:3,firstSide:3,support:3,note:4};
 for(const original of selected.slice().sort((a,b)=>order[a.kind]-order[b.kind])){
  const i={...original,face:canonicalFace(original.face),target:canonicalFace(original.target)};
  if(['vehicle','hose'].includes(i.kind))i.vehicle=T.vehicleName(i.unit,i.vehicle)||i.vehicle;
  if(i.kind==='hose'&&i.useHead&&!i.vehicle){const heads=working.vehicles.filter(v=>v.face===(i.target||i.face)&&v.headVehicle===v.name&&v.canHose);if(heads.length===1)i.vehicle=heads[0].name;}
  if(i.kind==='hose'&&i.target)i.face=Core.faces.includes(i.target)?i.target:'';
  if(!kinds.includes(i.kind)||!['set','add','subtract'].includes(i.quantityMode)){addError(i,'請選有效類型及數量意思');continue;}
  if(i.kind==='hose'&&i.target)i.target=normalize(i.target,roster).text;
  let adoptedBefore=null;
  if(i.uncertainty&&!i.reviewed){addError(i,'請核對提醒，勾選「已確認此項」，或改列稍後處理');continue;}
  const num=number(i.number);let intent;
  if(['crew','vehicle','hose'].includes(i.kind)){
   const matches=roster.filter(x=>x.unit===i.unit&&(!i.brigade||x.brigade===i.brigade));if(matches.length!==1){addError(i,'請選擇正確分隊及所屬大隊');continue;}
   const brigade=matches[0].brigade;
   if(i.face&&!Core.faces.includes(i.face)){addError(i,'面向請選第一至第四面');continue;}
   if(i.kind==='crew'){
    if(num!==null&&(!Number.isInteger(num)||num<0||num>99)){addError(i,'人數請填0–99，支援中文數字');continue;}
    intent={kind:'crew',key:i.id,line:i.evidence||'',unit:i.unit,brigade,group:i.group||'',count:num===null?undefined:num,mode:i.quantityMode||'set',face:i.face||undefined,task:i.task||undefined,status:i.task&&/內攻|進入|搜救|滅火|供水|警戒/.test(i.task)?'作業中':undefined,targetId:i.targetId||undefined,allowUnknown:!!i.allowUnknown,interior:!!i.interior};
   }else if(i.kind==='vehicle'){
    const vehicle=(i.vehicle||'').replace(/\s/g,'');if(!vehicle.startsWith(i.unit)||!/^\d{2,3}$/.test(vehicle.slice(i.unit.length))){addError(i,'請填車輛編號，例如11或111；分隊會自動加上，完整車號也可');continue;}
    intent={kind:'vehicle',key:i.id,line:i.evidence,unit:i.unit,brigade,name:vehicle,face:i.face||undefined};
   }else{
    if(!Number.isInteger(num)||num<0||num>6){addError(i,'水線條數請填0–6');continue;}
    const target=i.target||i.face;
    const vehicle=(i.vehicle||'').replace(/\s/g,'');
    if(vehicle){
     const v=working.vehicles.find(v=>v.name===vehicle);
     if(v?.canHose&&i.quantityMode==='set'){
      const confirmed=working.hoses.filter(h=>h.vehicleId===v.id&&h.targetName===target);
      const pending=working.hoses.filter(h=>h.supplyUnconfirmed&&h.unit===i.unit&&h.targetName===target);
      if(pending.length&&confirmed.length){addError(i,'同時有已連接與待確認水線，請在圖面逐線確認來源，避免重複');continue;}
      if(pending.length){adoptedBefore=clone(working.hoses);for(const h of pending)Object.assign(h,{vehicleId:v.id,vehicleName:v.name,supplyUnconfirmed:false,status:'使用中'});}
     }
     intent={kind:'hose',key:i.id,line:i.evidence,source:vehicle,target,count:num,task:i.task||undefined,mode:i.quantityMode||'set',rewire:/改接/.test(i.text||i.evidence),lineNo:i.lineNo,owner:i.unit,useHead:i.useHead};
    }
    else{
     if(!Core.faces.includes(target)){addError(i,'未提供來源車號時，請先選建物面向，或補填已登錄的來源車號');continue;}
     const existing=working.hoses.filter(h=>h.supplyUnconfirmed&&h.unit===i.unit&&h.targetName===target&&(!i.lineNo||h.lineNo===i.lineNo));
     const count=i.quantityMode==='add'?existing.length+num:i.quantityMode==='subtract'?existing.length-num:num;
     if(count<0||count>6){addError(i,'修正後水線需為0–6條');continue;}
     for(let n=0;n<count;n++)if(!existing[n])working.hoses.push({id:'unit_line_'+encodeURIComponent(i.unit+'|'+target+'|'+(i.lineNo||n)),unit:i.unit,owner:i.unit,vehicleId:'',vehicleName:'',sourceFace:target,supplyUnconfirmed:true,targetType:'buildingFace',targetId:'face'+(Core.faces.indexOf(target)+1),targetName:target,port:'第'+(i.lineNo||n+1)+'線',lineNo:i.lineNo||n+1,useHead:!!i.useHead,task:i.task||'部署水線',kind:i.task||'進攻水線',status:'供水起點待確認'});
     const deleted=new Set(existing.slice(count).map(h=>h.id));working.hoses=working.hoses.filter(h=>!deleted.has(h.id));
     previews.push({id:i.id,before:`${existing.length}條`,after:`${i.unit} → ${target} ${count}條（供水起點待確認）`});continue;
    }
   }
   const result=Core.plan({intents:[intent],issues:[],corrections:[]},working,options);
   if(result.issues.length){if(adoptedBefore)working.hoses=adoptedBefore;for(const e of result.issues)addError(i,e.message);continue;}
   Object.assign(working,result.after);previews.push({id:i.id,before:result.writes.map(w=>w.before?.count??w.before?.face??(w.before?'既有':'新增')).join('、')||'已相同',after:i.kind==='crew'?`${i.unit} ${result.after.crews.some(c=>c.unit===i.unit&&c.countUnknown)?'人數待補':result.after.crews.filter(c=>c.unit===i.unit).reduce((n,c)=>n+Number(c.count||0),0)+'人'} ${i.face||''} ${i.task||''}`:i.kind==='vehicle'?`${i.vehicle} ${i.face||'待部署'}`:`${i.vehicle} → ${i.target||i.face} ${num}條`});
  }else if(i.kind==='command'){
   putCase('commandTransfer',true);putCase('commandState','transferred');putCase('commandSituation',i.text||i.evidence);previews.push({id:i.id,after:'SOP：已完成指揮權轉移'});
  }else if(i.kind==='firstSide'){
   if(!/正面/.test(i.text||i.evidence)){addError(i,'此欄支援正面為第一面；其他方向請在SOP指定方位');continue;}
   putCase('firstSideSet',true);putCase('firstSideState','set');putCase('firstSideMode','front');putCase('firstSideName','建物正面');previews.push({id:i.id,after:'SOP：現場正面為第一面；圖框方向仍可手動旋轉'});
  }else if(i.kind==='support'){
   if(num!==null&&(!Number.isInteger(num)||num<0||num>99)){addError(i,'支援數量請填0–99，或留空待確認');continue;}
   const text=(i.task?i.task+(/車/.test(i.task)?(num!==null?' '+num+' 台':' 數量待確認'):'')+'｜':'')+(i.text||i.evidence);
   if(!text.trim()){addError(i,'請填支援需求');continue;}
   putCase('supportNeeded',true);putCase('supportState','needed');append('supportDetails',text);
   const allowed=['水車','水庫車','雲梯車','救護車','台電','瓦斯','警察','台水','毒災應變隊','排煙車','照明車','大隊支援'];if(allowed.includes(i.task))putCase('supports',[...new Set([...(nextCase.supports||[]),i.task])]);
   previews.push({id:i.id,after:'支援需求：'+text+'（不計入已到場人車）'});
  }else if(i.kind==='note'){
   const text=(i.text||i.evidence||'').trim();if(!text){addError(i,'請輸入情資內容');continue;}append('intakeNotes',text);previews.push({id:i.id,after:'情資紀錄：'+text});
  }
 }
 if(!errors.length)T.apply(selected,before,working,nextCase,options);
 const writes=[];for(const coll of Core.collections){const ids=new Set([...(before[coll]||[]),...(working[coll]||[])].map(x=>x.id));for(const id of ids){const a=(before[coll]||[]).find(x=>x.id===id)||null,b=(working[coll]||[]).find(x=>x.id===id)||null;if(Core.fingerprint(a)!==Core.fingerprint(b))writes.push({coll,id,before:a,after:b});}}
 const caseChanges=caseKeys.filter(k=>Core.fingerprint(caseData[k]??null)!==Core.fingerprint(nextCase[k]??null)).map(key=>({key,before:caseData[key]??null,after:nextCase[key]??null}));
 if(writes.length>100)errors.push({id:'all',message:'本次超過100筆變更，請分次確認'});
 return {writes,caseChanges,issues:errors,previews,totalBefore:(before.crews||[]).reduce((n,c)=>n+Number(c.count||0),0),totalAfter:(working.crews||[]).reduce((n,c)=>n+Number(c.count||0),0),after:working};
}
function assertCaseFresh(changes,current){for(const c of changes||[]){if(!caseKeys.includes(c.key))throw Error('不允許的案件欄位');if(Core.fingerprint(current[c.key]??null)!==Core.fingerprint(c.before))throw Error('SOP資料已更新，請重新核對');}}
root.FCIntake29={schema,kinds,labels,number,normalize,local,sanitize,item,compile,assertCaseFresh,caseKeys,canonicalFace,enrich,connectedVehicles,tactics:T};if(typeof module!=='undefined')module.exports=root.FCIntake29;
})(typeof window==='undefined'?globalThis:window);
