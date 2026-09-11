/* One metric scene for overview, editing, Google map and export. */
(function(root){'use strict';
const T=root.FCTactics31||(typeof require==='function'?require('./tactics31.js'):null),faces=['第一面','第二面','第三面','第四面'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function xy(b,p){return {x:(Number(p.lng)-b.lng)*111320*Math.max(.2,Math.cos(b.lat*Math.PI/180)),y:(Number(p.lat)-b.lat)*111320};}
function ll(b,p){return {lat:b.lat+p.y/111320,lng:b.lng+p.x/(111320*Math.max(.2,Math.cos(b.lat*Math.PI/180)))};}
function rotate(p,a){const r=a*Math.PI/180;return {x:p.x*Math.cos(r)-p.y*Math.sin(r),y:p.x*Math.sin(r)+p.y*Math.cos(r)};}
function crewName(p){const u=p.unit||'',l=String(p.leader||p.voiceGroup||'');return u+(!l||l===u?'':l.replaceAll(u,''));}
function faceOf(text){const t=String(text||'').replace(/正面|前面/g,'第一面').replace(/第([1-4])面/g,(_,n)=>faces[n-1]);return (t.match(/第[一二三四]面/)||[])[0]||'';}
function roadPoint(path,distance){
 let d=distance;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)continue;if(d<=len){const t=Math.max(0,d)/len;return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,heading:(Math.atan2(a.x-b.x,a.y-b.y)*180/Math.PI+360)%360};}d-=len;}return null;
}
function build(c,state,options={}){
 const b={lat:Number(c.lat||25),lng:Number(c.lng||121),widthM:40,heightM:28,rotationDeg:0,...c.buildingBox},s=JSON.parse(JSON.stringify(state)),notes=[];
 const local=(x,y)=>rotate({x,y},b.rotationDeg),pos=(f,role,i)=>xy(b,T.point(b,f,role,i));
 const zoneMap={...(c.tacticalZones||{})};
 // Only explicit confirmed location statements produce additional zone positions.
 const source=String(c.firstSideNote||'');if(source&&!/尚未|預計|準備|不要|未設/.test(source)&&faceOf(source)&&!zoneMap.command)zoneMap.command={face:faceOf(source),label:'指揮站',derived:'SOP'};
 const texts=[String(c.intakeNotes||''),...((state.sitreps||[]).map(r=>r.detail||r.text||''))];
 for(const text of texts)for(const clause of text.split(/[，,；;。\n]/)){
  if(/尚未|預計|準備|不要|未設|如果/.test(clause))continue;const f=faceOf(clause);
  for(const [key,label]of [['forward','前進指揮所'],['command','指揮站'],['ambulance','救護車集結區']])if(clause.includes(label)&&/設|成立|位於|在/.test(clause)){
   if(f&&!zoneMap[key])zoneMap[key]={face:f,label,derived:'回報'};else if(!f&&!zoneMap[key])notes.push(label+'已回報，位置待指定');
  }
 }
 if(c.firstSideSet)notes.push('第一面：'+(c.firstSideCustom||c.firstSideName||'建物正面'));
 const commandFace=zoneMap.command?.face||'第一面';
 const nodes=[],map=new Map(),make=(coll,item,point,label,extra={})=>{const n={id:item.id,coll,item,...point,label,...extra};if(Number.isFinite(n.x)&&Number.isFinite(n.y)){nodes.push(n);map.set(n.id,n);}return n;};
 const heads={};for(const v of s.vehicles||[])if(v.headVehicle===v.name||/頭車|攻擊車/.test(v.task||'')||(s.hoses||[]).some(h=>(h.vehicleId===v.id||h.vehicleName===v.name)&&h.targetType==='buildingFace')){const f=v.face||(s.hoses.find(h=>h.vehicleId===v.id&&h.targetType==='buildingFace')?.targetName)||'第一面';(heads[f]??=[]).push(v);}
 const counts={},ambulances={};
 for(const v of s.vehicles||[]){
  const f=v.face||'第一面',isHead=(heads[f]||[]).some(h=>h.id===v.id);let p=xy(b,v),heading=v.heading31;
  if(!v.positionManual){
   if(v.zoneType==='ambulance'||(/救護/.test(v.type)&&zoneMap.ambulance)){const af=zoneMap.ambulance?.face||f;p=pos(af,'ambulance',ambulances[af]||0);ambulances[af]=(ambulances[af]||0)+1;}
   else {const n=isHead?0:Number.isInteger(v.queueOrder)?v.queueOrder:(counts[f]||((heads[f]||[]).length?1:0));counts[f]=Math.max(counts[f]||0,n+1);p=pos(f,'vehicle',n);heading=(270+faces.indexOf(f)*90+b.rotationDeg+360)%360;
    const road=c.deploymentRoads32?.[f];if(road?.points?.length>=2){const route=road.points.map(pt=>xy(b,pt)),rp=roadPoint(route,n*12);if(rp){p=rp;heading=rp.heading;}else notes.push(v.name+'超出已指定道路長度，請延長道路');}
   }
  }
  make('vehicles',v,p,T.vehicleName(v.unit,v.name)||v.name,{type:/救護/.test(v.type)?'ambulance':'vehicle',heading:heading??270,head:isHead});
 }
 const commandMarker=(s.hazards||[]).find(h=>h.type==='指揮站')||zoneMap.command;
 const standbyPoint=i=>{if(commandMarker&&Number.isFinite(commandMarker.lat)&&Number.isFinite(commandMarker.lng)){const a=xy(b,commandMarker);return {x:a.x+(i%4)*11,y:a.y-15-Math.floor(i/4)*10};}return pos(commandFace,'standby',i);};
 let standby=0;const interiors={},outside={};
 for(const p of s.crews||[]){
  const f=p.face||'第一面',inside=!/待命|休息|撤出/.test(p.status||'')&&(p.interior||/內攻|進入/.test(p.task||''));let at=xy(b,p);
  if(!p.positionManual){if(inside){const n=interiors[f]||0;interiors[f]=n+1;at=pos(f,'interior',n);}
   else if(p.status==='待命'||!p.task||p.task==='待部署')at=standbyPoint(standby++);
   else {const n=outside[f]||0;outside[f]=n+1;at=pos(f,'standby',n);}}
  make('crews',p,at,crewName(p),{type:'crew',inside,detail:[p.countUnknown?'人數待補':p.count+'人',p.status,p.floor,p.task,c.ritSet&&c.ritUnit===p.unit?'RIT':''].filter(Boolean).join('｜')});
 }
 if(c.ritSet&&c.ritUnit&&!nodes.some(n=>n.coll==='crews'&&n.item.unit===c.ritUnit))notes.push(c.ritUnit+'已指定RIT，人員位置待登錄');
 const existingTypes=new Set((s.hazards||[]).map(h=>h.type));
 for(const [key,z]of Object.entries(zoneMap))if(!existingTypes.has(z.label)){
  const point=Number.isFinite(z.lat)&&Number.isFinite(z.lng)?xy(b,z):pos(z.face,key==='ambulance'?'ambulanceZone':key==='forward'?'command':'command',0);
  if(key==='forward'&&!Number.isFinite(z.lat)){point.x+=12;point.y+=12;}
  make('zones',{id:'zone32_'+key,...z},point,z.label||key,{type:'zone',detail:z.face+'｜'+(z.derived||'已登錄')});
 }
 for(const h of s.hazards||[])make('hazards',h,xy(b,h),h.type,{type:'zone',detail:'手動標示'});
 if(standby){const at=standbyPoint(0);at.y+=7;make('zones',{id:'standby32'},at,'待命區',{type:'zone'});}
 const corners=[[-b.widthM/2,-b.heightM/2],[b.widthM/2,-b.heightM/2],[b.widthM/2,b.heightM/2],[-b.widthM/2,b.heightM/2]].map(p=>local(...p));
 const entrances=[local(0,-b.heightM/2),local(b.widthM/2,0),local(0,b.heightM/2),local(-b.widthM/2,0)];
 const hoses=(s.hoses||[]).map(h=>{let source=map.get(h.vehicleId);if(!source&&h.vehicleName)source=nodes.find(v=>v.coll==='vehicles'&&v.label===h.vehicleName);
  if(!source&&h.targetType==='buildingFace'){const hs=heads[h.targetName]||[];if(hs.length===1)source=map.get(hs[0].id);}
  if(!source){notes.push((h.port||'水線')+'供水來源待確認');return {...h,missing:true};}return {...h,source};});
 const paths=[];
 for(const h of hoses){if(h.missing)continue;const a=h.source,peers=hoses.filter(x=>!x.missing&&x.source.id===a.id).sort((x,y)=>String(x.id).localeCompare(String(y.id))),rank=peers.indexOf(h),spread=(rank-(peers.length-1)/2)*1.8;
  const direction=rotate({x:0,y:1},-a.heading),normal={x:-direction.y,y:direction.x};
  const start={x:a.x+direction.x*2.8+normal.x*spread,y:a.y+direction.y*2.8+normal.y*spread};
  let end=map.get(h.targetId),path;
  if(h.targetType==='buildingFace'){
   const fi=Math.max(0,faces.indexOf(h.targetName)),entry=entrances[fi],same=peers.filter(x=>x.targetType==='buildingFace'&&x.targetName===h.targetName),j=same.indexOf(h),offset=(j-(same.length-1)/2)*2.5,tangent=rotate({x:1,y:0},fi*90+b.rotationDeg),gate={x:entry.x+tangent.x*offset,y:entry.y+tangent.y*offset};
   const bend={x:(start.x+gate.x)/2+normal.x*spread*2,y:(start.y+gate.y)/2+normal.y*spread*2};
   path=[start,bend,gate];const crew=nodes.filter(p=>p.type==='crew'&&p.inside&&p.item.unit===(h.owner||h.unit)&&p.item.face===h.targetName);if(crew.length===1)path.push({x:crew[0].x,y:crew[0].y});
  }else if(end)path=[start,{x:(start.x+end.x)/2+normal.x*spread*2,y:(start.y+end.y)/2+normal.y*spread*2},{x:end.x,y:end.y}];
  else if(Number.isFinite(h.lat)&&Number.isFinite(h.lng))path=[start,xy(b,h)];
  if(path)paths.push({id:h.id,sourceId:a.id,path,coll:'hoses',item:h,label:h.targetType==='vehicle'?'供水':(h.lineNo?'第'+h.lineNo+'線':h.port||'攻擊線')+' · '+(h.owner||h.unit||''),supply:h.targetType==='vehicle'});
 }
 const far=nodes.filter(n=>Math.hypot(n.x,n.y)>Math.max(150,b.widthM*3,b.heightM*3)&&n.coll!=='vehicles'),visible=options.all?nodes:nodes.filter(n=>!far.includes(n));
 const allowed=new Set(visible.map(n=>n.id));const lines=paths.filter(h=>allowed.has(h.sourceId));
 const points=[...corners,...visible];let minX=Math.min(...points.map(p=>p.x))-18,maxX=Math.max(...points.map(p=>p.x))+18,minY=Math.min(...points.map(p=>p.y))-18,maxY=Math.max(...points.map(p=>p.y))+18;
 const scale=options.scale||6,W=Math.max(900,(maxX-minX)*scale),H=Math.max(540,(maxY-minY)*scale);maxX=minX+W/scale;maxY=minY+H/scale;
 return {box:b,nodes:visible,allNodes:nodes,lines,far,notes:[...new Set(notes)],corners,entrances,roads:Object.values(c.deploymentRoads32||{}).map(r=>r.points.map(p=>xy(b,p))),bounds:{minX,maxX,minY,maxY},W,H,scale};
}
function svg(scene){
 const {W,H,scale,bounds}=scene,p=p=>({x:(p.x-bounds.minX)*scale,y:(bounds.maxY-p.y)*scale}),pairs=ps=>ps.map(q=>{const a=p(q);return a.x.toFixed(1)+','+a.y.toFixed(1)}).join(' ');
 const style='<style>.fc32 text{font-family:system-ui,"Noto Sans CJK TC",sans-serif;text-anchor:middle;fill:#163e52;font-size:15px;font-weight:650}.fc32 .halo{paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round}.fc32 .line{fill:none;stroke:#2563c8;stroke-width:3.5;stroke-linejoin:round}.fc32 .hit{stroke:transparent;stroke-width:18;fill:none;cursor:pointer}.fc32 .node{cursor:grab}.fc32 .tag{font-size:13px}.fc32 .symbol{fill:white;font-size:16px}.fc32 .linelabel{fill:#245cb0;font-size:13px}</style>';
 let out=`<svg xmlns="http://www.w3.org/2000/svg" class="fc32" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="現場戰術部署圖">${style}<rect width="100%" height="100%" fill="#f8fbfd"/>`;
 for(const road of scene.roads)out+=`<polyline points="${pairs(road)}" fill="none" stroke="#e3eaf0" stroke-width="46"/><polyline points="${pairs(road)}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="10 8"/>`;
 out+=`<polygon points="${pairs(scene.corners)}" fill="#f4f0e8" stroke="#6d6557" stroke-width="3" stroke-dasharray="9 5"/>`;
 const top=p(scene.corners[2]);const center=p({x:0,y:0});out+=`<text class="halo" x="${center.x}" y="${Math.min(...scene.corners.map(q=>p(q).y))+22}">火場建物</text>`;
 scene.entrances.forEach((q,i)=>{const a=p(q),dir=rotate({x:0,y:-1},i*90+scene.box.rotationDeg);out+=`<text class="halo" x="${a.x+dir.x*24}" y="${a.y-dir.y*24+5}">${faces[i]}</text>`;});
 const labelBoxes=[];const reserve=(x,y,w=95,h=23)=>{let yy=y;for(let n=0;n<12;n++){if(!labelBoxes.some(b=>Math.abs(x-b.x)<(w+b.w)/2&&Math.abs(yy-b.y)<(h+b.h)/2))break;yy-=25;}labelBoxes.push({x,y:yy,w,h});return yy;};
 for(const h of scene.lines){out+=`<g data-fc32-coll="hoses" data-fc32-id="${esc(h.id)}"><polyline class="hit" points="${pairs(h.path)}"/><polyline class="line" points="${pairs(h.path)}"/></g>`;const a=p(h.path[1]),first=p(h.path[0]),x=(first.x+a.x)/2,y=reserve(x,(first.y+a.y)/2-12,h.supply?45:130);out+=`<text class="halo linelabel" x="${x}" y="${y}">${esc(h.label)}</text>`;}
 for(const n of scene.nodes){const a=p(n),name=esc(n.label);if(n.type==='zone'){const y=reserve(a.x,a.y,100);out+=`<g data-fc32-coll="${n.coll}" data-fc32-id="${esc(n.id)}"><text class="halo" x="${a.x}" y="${y}">${name}</text><title>${esc(n.detail||n.label)}</title></g>`;continue;}
  const color=n.type==='crew'?'#177954':n.type==='ambulance'?'#177f88':'#b92924',symbol=n.type==='crew'?'人':n.type==='ambulance'?'救':'車';
  const labelY=reserve(a.x,a.y+33,Math.max(55,n.label.length*15));
  out+=`<g class="node" data-fc32-coll="${n.coll}" data-fc32-id="${esc(n.id)}"><title>${name}｜${esc(n.detail||n.item.task||'')}</title><circle cx="${a.x}" cy="${a.y}" r="17" fill="${color}" stroke="white" stroke-width="3"/><text class="symbol" x="${a.x}" y="${a.y+6}">${symbol}</text><text class="halo" x="${a.x}" y="${labelY}">${name}</text>${n.head?`<text class="halo tag" x="${a.x}" y="${a.y-26}">頭車</text>`:''}</g>`;
 }
 out+=`<path d="M24 ${H-30}v-6m0 6h${10*scale}m0 0v-6" stroke="#16445d" stroke-width="2"/><text x="${24+5*scale}" y="${H-40}" class="tag">10 m</text><text x="${W-42}" y="32">北 ↑</text></svg>`;return out;
}
root.FCScene32={build,svg,xy,ll,crewName,roadPoint,faceOf};if(typeof module!=='undefined')module.exports=root.FCScene32;
})(typeof window==='undefined'?globalThis:window);
