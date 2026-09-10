/* User-confirmed FireCommand drawing conventions. Coordinates are schematic, not a safety-distance calculation. */
(function(root){'use strict';
const faces=['第一面','第二面','第三面','第四面'];
const version='31.0';
const blocked=/尚未|還沒|未進入|未到|不要|不宜|不是|取消|預計|準備|將要|即將|計畫|如果|假設|是否/;
function vehicleName(unit,value){
 let code=String(value||'').normalize('NFKC').replace(/\s/g,'');
 while(unit&&code.startsWith(unit))code=code.slice(unit.length);
 code=code.replace(/^分隊/,'').replace(/[零〇一二三四五六七八九么幺拐洞]/g,c=>({'零':0,'〇':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'么':1,'幺':1,'拐':7,'洞':0}[c]));
 return unit&&/^\d{2,3}$/.test(code)?unit+code:'';
}
function augment(items,text,roster,make){
 const names=[...new Set(roster.map(r=>r.unit))].sort((a,b)=>b.length-a.length);
 const vehicleRE=new RegExp('('+names.join('|')+')(?:分隊)?\\s*(\\d{2,3})(?!\\d|人)','g');
 const units=line=>names.filter(u=>line.includes(u)&&!names.some(long=>long!==u&&long.includes(u)&&line.includes(long)));
 const clauses=text.split(/[，,；;。\n]/).map(s=>s.trim()).filter(Boolean),heads={},orders={},attacks=[];
 let face='',queue=null,ambulanceFace='';const entering={},totals={};
 const add=(kind,data)=>{const i=make(kind,{...data,id:'t31_'+items.length});items.push(i);return i;};
 const putVehicle=(v,extra,evidence)=>{
  let i=items.find(x=>x.kind==='vehicle'&&vehicleName(x.unit,x.vehicle)===v.vehicle);
  if(!i)i=add('vehicle',{...v,evidence});Object.assign(i,extra);return i;
 };
 for(const line of clauses){
  if(blocked.test(line)){queue=null;continue;}
  const f=(line.match(/第[一二三四]面/)||[])[0];if(f){if(face&&face!==f)queue=null;face=f;}
  const amount=line.match(/(?:布|佈|出)(\d+)(?:條)?(?:水)?線/);if(amount)totals[face||'第一面']={number:Number(amount[1]),evidence:line};
  if(amount&&/進入/.test(line))entering[face||'第一面']=line;
  const vs=[...line.matchAll(vehicleRE)].map(m=>({unit:m[1],vehicle:m[1]+m[2]}));
  if(/指揮站.*(?:設|在|位於)|(?:設|成立).*指揮站/.test(line)&&face){
   let i=items.find(x=>x.kind==='note'&&x.evidence===line)||add('note',{text:line,evidence:line});i.zoneType='command';i.face=face;queue=null;
  }
  if(/救護車?集結區/.test(line)&&face){
   ambulanceFace=face;let i=items.find(x=>x.kind==='note'&&x.evidence===line)||add('note',{text:line,evidence:line});i.zoneType='ambulance';i.face=face;queue=null;
  }
  const head=vs.find(v=>new RegExp(v.vehicle+'(?:[^，,；;。]{0,8})(?:出水|做攻擊車|為攻擊車|當頭車|擔任攻擊車|布線出水|佈線出水)').test(line))||(/頭車|第一台車|攻擊車/.test(line)&&vs.length===1?vs[0]:null);
  if(head){
   const hf=face||'第一面';heads[hf]=head;orders[hf]=[head];face=hf;
   putVehicle(head,{face:hf,headVehicle:head.vehicle,queueOrder:0,task:'攻擊車／頭車'},line);
  }
  if(/後續|後面/.test(line)&&/依序|車序|接著/.test(line)){
   const hf=face||'第一面';queue=heads[hf]?{face:hf,head:heads[hf],last:orders[hf].at(-1),index:orders[hf].length}:null;
  }
  if(queue&&vs.length&&!head){
   for(const v of vs){
    if(v.vehicle===queue.last.vehicle)continue;
    putVehicle(v,{face:queue.face,headVehicle:queue.head.vehicle,queueOrder:queue.index++,task:'接力供水'},line);
    const prior=queue.last;
    if(!items.some(x=>x.kind==='hose'&&x.vehicle===v.vehicle&&x.target===prior.vehicle))add('hose',{...v,number:1,target:prior.vehicle,task:'供水水線',evidence:line,headVehicle:queue.head.vehicle});
    orders[queue.face].push(v);queue.last=v;
   }
  }else if(queue&&!/後續|後面/.test(line))queue=null;
  for(const v of vs)if(/9\d$/.test(v.vehicle)&&ambulanceFace)putVehicle(v,{face:ambulanceFace,task:'救護車集結',zoneType:'ambulance'},line);
  const lineMatch=line.match(/第([1-6一二三四五六])線(?:由|是)?/),entry=/進入|內攻/.test(line);
  if(lineMatch){
   const owner=units(line)[0],n=Number(lineMatch[1])||'一二三四五六'.indexOf(lineMatch[1])+1;
   if(owner)attacks.push({unit:owner,face:face||'第一面',lineNo:n,entered:entry||!!entering[face||'第一面'],evidence:(entering[face||'第一面']?entering[face||'第一面']+'；':'')+line});
  }else if(entry&&/布|佈/.test(line)&&units(line).length>1&&!vs.length){
   const us=units(line).sort((a,b)=>line.indexOf(a)-line.indexOf(b));
   const n=Number((line.match(/(\d+)(?:條)?(?:水)?線/)||[])[1]);
   if(n===us.length)us.forEach((unit,index)=>attacks.push({unit,face:face||'第一面',lineNo:index+1,entered:true,evidence:line}));
  }
 }
 for(const [f,total]of Object.entries(totals))if(heads[f]&&!attacks.some(a=>a.face===f)){
  const old=items.find(i=>i.kind==='hose'&&(i.target===f||i.face===f)&&!i.vehicle);if(old){old.vehicle=heads[f].vehicle;old.face=f;old.target=f;}else if(!items.some(i=>i.kind==='hose'&&i.vehicle===heads[f].vehicle&&i.target===f))add('hose',{unit:heads[f].unit,vehicle:heads[f].vehicle,number:total.number,face:f,target:f,task:'進攻水線',evidence:total.evidence});
 }
 for(const a of attacks){
  const head=heads[a.face];
  // Replace ambiguous aggregate drafts only for the explicitly numbered attack group.
  for(let j=items.length-1;j>=0;j--)if(items[j].kind==='hose'&&!items[j].lineNo&&(!items[j].target||faces.includes(items[j].target))&&((head&&items[j].vehicle===head.vehicle)||attacks.some(x=>x.face===a.face&&x.unit===items[j].unit)))items.splice(j,1);
  const h=add('hose',{unit:a.unit,vehicle:head?.vehicle||'',number:1,face:a.face,target:a.face,task:'進攻水線',evidence:a.evidence,lineNo:a.lineNo,useHead:true});
  if(a.entered){
   let c=items.find(x=>x.kind==='crew'&&x.unit===a.unit&&!x.group);
   if(!c)c=add('crew',{unit:a.unit,number:null,evidence:a.evidence});
   Object.assign(c,{face:a.face,task:'內攻',interior:true,allowUnknown:true});
  }
 }
 // Explicit entry changes placement; a floor is metadata on the same top-down marker.
 for(const i of items){
  if(i.kind==='vehicle')i.vehicle=vehicleName(i.unit,i.vehicle)||i.vehicle;
  if(i.kind==='crew'&&!blocked.test(i.evidence||'')&&/進入|內攻/.test(i.evidence||'')){
   i.interior=true;const floor=(i.evidence||'').match(/(?:地下\s*[一二三四五六七八九十\d]+|[一二三四五六七八九十\d]+)樓|B\d+F?/i);if(floor)i.floor=floor[0];
  }
 }
 // Stable unique IDs survive local reclassification and AI response normalization.
 const seen=new Set();for(let j=0;j<items.length;j++){const i=items[j],key=i.kind+'|'+i.unit+'|'+i.vehicle+'|'+i.target+'|'+(i.lineNo||'')+'|'+i.evidence;if(seen.has(key)){items.splice(j--,1);}else seen.add(key);}items.forEach((i,n)=>i.id='item'+n);
 return items;
}
function point(box,face,role,index=0){
 const f=Math.max(0,faces.indexOf(face)),w=Number(box.widthM||40)/2,h=Number(box.heightM||28)/2;
 const width=f%2?h:w,depth=f%2?w:h;
 let x=0,y=0;
 if(role==='vehicle'){x=width+18+index*17;y=-depth-14;}
 else if(role==='ambulance'){x=width+18+index*17;y=-depth-24;}
 else if(role==='ambulanceZone'){x=width+8;y=-depth-50;}
 else if(role==='command'){x=-width-24;y=-depth-38;}
 else if(role==='standby'){x=-width-24+(index%3)*9;y=-depth-53-Math.floor(index/3)*9;}
 else {x=-width*.55+(index%3)*width*.55;y=-depth*.10+Math.floor(index/3)*Math.min(5,depth*.28);y=Math.min(depth*.55,y);}
 const r=(f*90+Number(box.rotationDeg||0))*Math.PI/180,rx=x*Math.cos(r)-y*Math.sin(r),ry=x*Math.sin(r)+y*Math.cos(r);
 return {lat:Number(box.lat)+ry/111320,lng:Number(box.lng)+rx/(111320*Math.max(.2,Math.cos(Number(box.lat)*Math.PI/180))),anchorBuilding:true,staged:role==='standby'};
}
function apply(items,before,state,c,options){
 const locate=(face,role,n)=>options.tacticalPosition?options.tacticalPosition(face,role,n):point(c.buildingBox||{lat:c.lat||0,lng:c.lng||0,widthM:40,heightM:28},face,role,n);
 for(const i of items){
  if(i.zoneType&&i.kind==='note'&&faces.includes(i.face)){
   c.tacticalZones={...(c.tacticalZones||{}),[i.zoneType]:{face:i.face,...locate(i.face,i.zoneType==='ambulance'?'ambulanceZone':i.zoneType,0),label:i.zoneType==='command'?'指揮站':'救護車集結區'}};
  }
  if(i.kind==='vehicle'){
   const v=state.vehicles.find(v=>v.name===vehicleName(i.unit,i.vehicle));if(!v)continue;
   if(i.headVehicle){v.headVehicle=i.headVehicle;v.queueOrder=i.queueOrder;v.task=i.task;v.layout31=true;v.positionManual=false;}
   if(i.zoneType==='ambulance'){v.zoneType='ambulance';v.task='救護車集結';v.layout31=true;}
   if(!before.vehicles.some(x=>x.id===v.id))v.layout31=true;
  }
  if(i.kind==='crew'){
   const targets=state.crews.filter(x=>x.unit===i.unit&&(!i.targetId||x.id===i.targetId)&&(!i.group||(x.voiceGroup||x.leader)===i.group));
   if(targets.length!==1)continue;const p=targets[0];
   if(i.interior){p.interior=true;p.layout31=true;p.positionManual=false;p.task=i.task||'內攻';p.status='作業中';p.staged=false;}
   if(i.floor)p.floor=i.floor;
   if(i.task==='待命'){p.interior=false;p.status='待命';p.task='待命';p.layout31=true;p.positionManual=false;}
   if(!before.crews.some(x=>x.id===p.id))p.layout31=true;
  }
 }
 // One confirmed attack vehicle anchors its face; a later source declaration can attach pending lines.
 for(const v of state.vehicles)if(v.canHose&&state.hoses.some(h=>h.vehicleId===v.id&&h.targetType==='buildingFace')){
  const target=state.hoses.find(h=>h.vehicleId===v.id&&h.targetType==='buildingFace').targetName;
  if(!v.face)v.face=target;
  if(!v.headVehicle){v.headVehicle=v.name;v.queueOrder=0;v.layout31=true;}
 }
 for(const h of state.hoses)if(h.supplyUnconfirmed&&h.useHead){
  const hs=state.vehicles.filter(v=>v.face===h.targetName&&v.headVehicle===v.name&&v.canHose);
  if(hs.length===1)Object.assign(h,{vehicleId:hs[0].id,vehicleName:hs[0].name,supplyUnconfirmed:false,status:'使用中'});
 }
 for(const head of state.vehicles.filter(v=>v.headVehicle===v.name)){
  const visited=new Set([head.id]),queue=[head];
  while(queue.length){const front=queue.shift();for(const h of state.hoses){
   if(h.targetType!=='vehicle'||h.supplyUnconfirmed)continue;
   const id=h.targetId===front.id?h.vehicleId:h.task==='車輛串接（流向未指定）'&&h.vehicleId===front.id?h.targetId:null;
   const rear=state.vehicles.find(v=>v.id===id);if(!rear||visited.has(id)||rear.headVehicle&&rear.headVehicle!==head.name)continue;
   visited.add(id);queue.push(rear);
   if(!rear.headVehicle)Object.assign(rear,{headVehicle:head.name,queueOrder:(front.queueOrder||0)+1,layout31:true});
   if(!rear.face)rear.face=head.face;
  }}
 }
 const commandFace=c.tacticalZones?.command?.face||'第一面';
 let standby=0;const inside={},vehicleIndex={},ambulanceIndex={};
 for(const v of state.vehicles){
  if(!v.layout31||v.positionManual)continue;
  const f=v.face||'第一面';
  if(/救護/.test(v.type)&&c.tacticalZones?.ambulance){v.face=c.tacticalZones.ambulance.face;v.zoneType='ambulance';v.task='救護車集結';}
  const vf=v.face||f;
  if(v.zoneType==='ambulance')Object.assign(v,locate(vf,'ambulance',ambulanceIndex[vf]||0)),ambulanceIndex[vf]=(ambulanceIndex[vf]||0)+1;
  else {const n=Number.isInteger(v.queueOrder)?v.queueOrder:vehicleIndex[vf]||0;Object.assign(v,locate(vf,'vehicle',n),{heading31:(270+faces.indexOf(vf)*90+Number(c.buildingBox?.rotationDeg||0)+360)%360});vehicleIndex[vf]=Math.max(vehicleIndex[vf]||0,n+1);}
 }
 for(const p of state.crews){
  if(!p.layout31||p.positionManual)continue;
  if(p.interior){const f=p.face||'第一面';Object.assign(p,locate(f,'interior',inside[f]||0),{staged:false});inside[f]=(inside[f]||0)+1;}
  else if(p.status==='待命')Object.assign(p,locate(commandFace,'standby',standby++),{staged:true});
 }
 if(items.some(i=>['vehicle','crew','hose'].includes(i.kind)||i.zoneType))c.drawingRuleVersion=version;
}
const prompt='繪圖慣例 v31：已選分隊加車輛編號構成唯一車號，不重複分隊。頭車／攻擊車／某車出水代表該面第一台車；後續各車依序代表在頭車後單側順向排隊，相鄰車預設一條供水線，後車供前車。第二面另有出水車時建立第二面的獨立頭車。「正面布兩線，第一線由淡水，第二線由竹圍布線進入，由淡水111出水」兩線來源同為淡水111，執行分隊各別保留；不得當成兩條車間供水線。明確已進入的人員保留crew紀錄（未報人數用null），task內攻；樓層放在text與evidence，俯視圖放建物內。未指派者保持待命。指揮站、救護車集結區用note保留完整原句及face；91/92依既有車種屬救護車。不可把假設、預定或否定回報當成已執行。';
root.FCTactics31={version,vehicleName,augment,point,apply,prompt};if(typeof module!=='undefined')module.exports=root.FCTactics31;
})(typeof window==='undefined'?globalThis:window);
