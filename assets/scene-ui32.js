/* Shared scene controls. Loaded before app.js; installed at app initialization. */
let sceneView32={all:false,scale:6,fit:true},roadDraft32=null,roadClicks32=null;
function currentScene32(){return FCScene32.build(currentCase||{},live,sceneView32);}
function deploymentSchematic32(){const s=currentScene32();return `<div class="scene32-card"><div class="scene32-tools"><b>戰術部署圖</b><button type="button" data-scene32="close">10m近距離</button><button type="button" data-scene32="fit">部署全景</button><button type="button" data-scene32="all">${sceneView32.all?'聚焦火場':'顯示遠處資料'}${s.far.length?'（'+s.far.length+'）':''}</button></div>${s.far.length&&!sceneView32.all?`<p class="scene32-note">畫面外：${s.far.map(n=>escapeHtml(n.label)).join('、')}；資料仍保留。</p>`:''}<p class="scene32-note">自動排列為示意位置；10 m 比例尺依設定座標計算，可依底圖校正。</p><div class="scene32-scroll ${sceneView32.fit?'scene32-fit':''}">${FCScene32.svg(s)}</div>${s.notes.length?`<p class="scene32-note">${s.notes.map(escapeHtml).join('；')}</p>`:''}</div>`;}
function bindScene32(host){
 if(!host)return;host.querySelectorAll('[data-scene32]').forEach(b=>b.onclick=()=>{if(b.dataset.scene32==='all')sceneView32.all=!sceneView32.all;else {sceneView32.scale=b.dataset.scene32==='close'?8:6;sceneView32.fit=b.dataset.scene32!=='close';}renderOverviewContent();renderDeployment32();});
 const svg=host.querySelector('.fc32');if(!svg)return;
 svg.querySelectorAll('[data-fc32-id]').forEach(el=>{
  let start=null,moved=false;el.addEventListener('pointerdown',e=>{if(!['vehicles','crews'].includes(el.dataset.fc32Coll))return;start={x:e.clientX,y:e.clientY};moved=false;el.setPointerCapture?.(e.pointerId);e.stopPropagation();});
  el.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>5){moved=true;el.style.transform=`translate(${dx}px,${dy}px)`;}});
  el.addEventListener('pointercancel',()=>{start=null;el.style.transform='';});
  el.addEventListener('pointerup',async e=>{if(!start)return;const delta={x:e.clientX-start.x,y:e.clientY-start.y};start=null;el.style.transform='';if(!moved)return;const scene=currentScene32(),n=scene.allNodes.find(n=>n.id===el.dataset.fc32Id),rect=svg.getBoundingClientRect(),factor=scene.W/rect.width;if(!n)return;const pos=FCScene32.ll(scene.box,{x:n.x+delta.x*factor/scene.scale,y:n.y-delta.y*factor/scene.scale});try{await moveSceneItem32(n.coll,n.id,{...pos,positionManual:true},'示意圖移位');}catch(err){toast(err.message);} });
  el.addEventListener('click',()=>{if(moved){moved=false;return;}const coll=el.dataset.fc32Coll,id=el.dataset.fc32Id;if(coll==='crews')editCrew(id);else if(coll==='vehicles')editVehicle(id);else if(coll==='hoses')editHoseFull(id);else if(coll==='hazards')editHazard(id);else {const n=currentScene32().allNodes.find(n=>n.id===id);if(n)openActionSheet(n.label,`<p>${escapeHtml(n.detail||'依已確認資料顯示')}</p>`);}});
 });
}
async function moveSceneItem32(coll,id,patch,label){
 if(coll!=='vehicles'||FCIntake29.connectedVehicles(intakeSnapshot28(),id).length<2)return updateMapItemWithUndo(coll,id,patch,label);
 const scene=currentScene32(),anchor=scene.allNodes.find(n=>n.id===id);if(!anchor)return;
 const target=FCScene32.xy(scene.box,patch),dx=target.x-anchor.x,dy=target.y-anchor.y,eventId=uid('move32'),face=mapFace30(patch.lat,patch.lng);
 const group=FCIntake29.connectedVehicles(intakeSnapshot28(),id),writes=stampWrites28(group.map(v=>{const n=scene.allNodes.find(n=>n.id===v.id),pos=FCScene32.ll(scene.box,{x:n.x+dx,y:n.y+dy});return {coll:'vehicles',id:v.id,before:v,after:{...v,...pos,face,positionManual:true,heading31:n.heading,staged:false}};}),eventId);
 const event={id:eventId,caseId:currentCaseId,kind:'apply',raw:'車組移位',corrected:'車組移位',writes,caseChanges:[],createdAt:Date.now(),authorUid:profile.id,operator:radioCallSign(),summary:label};
 const result=await commitIntake28(event,intakeRevision28());if(event.caseId!==currentCaseId)return;
 if(firebaseEnabled){for(const w of writes)Object.assign(live.vehicles.find(v=>v.id===w.id),w.after);currentCase.resourceRevision=result.revision;if(!live.intakeEvents.some(e=>e.id===event.id))live.intakeEvents.push(event);}
 pushMapUndo('復原'+label,()=>undoIntake28(eventId));renderLiveParts();
}
function renderDeployment32(){const h=$('deploymentScene32');if(h){h.innerHTML=deploymentSchematic32();bindScene32(h);}}
function mapFocus32(){if(!map)return;const b=getBuildingBox();map.setCenter({lat:b.lat,lng:b.lng});map.setZoom(20);}
function marker32(n){
 const color=n.type==='crew'?'#177954':n.type==='ambulance'?'#177f88':n.type==='zone'?'#126080':'#b92924',symbol=n.type==='crew'?'人':n.type==='ambulance'?'救':n.type==='zone'?'站':'車';
 const width=Math.max(74,n.label.length*14+12),text=escapeXml(n.label),svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="64"><circle cx="${width/2}" cy="20" r="16" fill="${color}" stroke="white" stroke-width="2"/><text x="${width/2}" y="26" text-anchor="middle" font-family="sans-serif" font-size="16" fill="white">${symbol}</text><text x="${width/2}" y="55" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#163e52" stroke="white" stroke-width="3" paint-order="stroke">${text}</text></svg>`;
 return {url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg),scaledSize:new google.maps.Size(width,64),anchor:new google.maps.Point(width/2,20)};
}
function renderGoogle32(){
 renderDeployment32();if(!map||!currentCase||!window.google?.maps)return;
 clearMapOverlays();renderBuildingBoxOnMap();const scene=currentScene32();
 for(const h of scene.lines){const path=h.path.map(p=>FCScene32.ll(scene.box,p));const line=addMapOverlay(new google.maps.Polyline({map,path,strokeColor:'#2563c8',strokeWeight:3.5,zIndex:30}));line.addListener('click',()=>editHoseFull(h.id));}
 for(const n of scene.nodes){const position=FCScene32.ll(scene.box,n),draggable=['vehicles','crews','hazards'].includes(n.coll),marker=addMapOverlay(new google.maps.Marker({map,position,icon:marker32(n),title:n.label+' '+(n.detail||''),draggable,zIndex:n.type==='crew'?110:90}));
  if(draggable)marker.addListener('dragend',async e=>{try{await moveSceneItem32(n.coll,n.id,{lat:e.latLng.lat(),lng:e.latLng.lng(),positionManual:true},'底圖移位');}catch(err){toast(err.message);renderGoogle32();}});
  marker.addListener('click',()=>{if(['vehicles','crews'].includes(n.coll)&&completeQuickHoseTarget(n.coll==='vehicles'?'vehicle':'crew',n.item))return;if(n.coll==='vehicles')editVehicle(n.id);else if(n.coll==='crews')editCrew(n.id);else if(n.coll==='hazards')editHazard(n.id);else openMapInfo(marker,`<b>${escapeHtml(n.label)}</b><p>${escapeHtml(n.detail||'')}</p>`);});
 }
 if(roadDraft32?.points?.length)addMapOverlay(new google.maps.Polyline({map,path:roadDraft32.points,strokeColor:'#e4a10e',strokeWeight:6,zIndex:150}));
}
function roadMessage32(text){const h=$('roadMessage32');if(h)h.textContent=text;}
function roadFace32(){return $('roadFace32')?.value||'第一面';}
async function suggestRoad32(){
 const id=currentCaseId,b=getBuildingBox(),f=roadFace32(),index=FCIntake.faces.indexOf(f),start=FCIntake29.tactics.point(b,f,'vehicle',0),end=FCIntake29.tactics.point(b,f,'vehicle',6);
 roadMessage32('正在比對鄰近道路…');
 try{const res=await authenticatedAI('/api/road-layout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({points:[start,end]})});const d=await res.json();if(id!==currentCaseId)return;if(!res.ok)throw Error(d.error||'道路辨識未完成');roadDraft32={caseId:id,face:f,points:d.points,source:'google-roads',sideOffsetM:0};await openRoadMap32();$('applyRoad32').disabled=false;roadMessage32('黃色線是道路候選。確認停車側及車流方向後套用；可反轉或改為手動點選。');renderGoogle32();}
 catch(e){roadMessage32(e.message+'；可使用「在底圖點兩點」。');}
}
async function openRoadMap32(){$('deploymentMapDetails').open=true;if(!map)await initMap();mapFocus32();renderGoogle32();}
function beginRoad32(){roadClicks32={caseId:currentCaseId,face:roadFace32(),points:[]};openRoadMap32();roadMessage32('先點頭車位置，再點車隊後方。兩點都選在實際停車的同一側。');}
function acceptRoadClick32(ll){if(!roadClicks32)return false;if(roadClicks32.caseId!==currentCaseId){roadClicks32=null;return false;}roadClicks32.points.push(ll);if(roadClicks32.points.length===2){const a=roadClicks32.points[0],b=roadClicks32.points[1];if(Math.hypot((a.lat-b.lat)*111320,(a.lng-b.lng)*100000)<5){roadClicks32.points.pop();roadMessage32('兩點距離過近，請再點較遠的車隊後方。');return true;}roadDraft32={...roadClicks32,source:'manual',sideOffsetM:0};roadClicks32=null;$('applyRoad32').disabled=false;roadMessage32('道路方向已選好；第一點為頭車，第二點為車隊後方。');renderGoogle32();}else roadMessage32('再點車隊後方，車輛會沿兩點方向排成單列。');return true;}
async function applyRoad32(){
 if(!roadDraft32||roadDraft32.caseId!==currentCaseId)return;const before=currentCase.deploymentRoads32||null,after={...(before||{}),[roadDraft32.face]:roadDraft32};
 const scene=FCScene32.build({...currentCase,deploymentRoads32:after},live),writes=scene.allNodes.filter(n=>n.coll==='vehicles'&&(n.item.face||'第一面')===roadDraft32.face&&!n.item.positionManual).map(n=>({coll:n.coll,id:n.id,before:live.vehicles.find(v=>v.id===n.id),after:{...n.item,...FCScene32.ll(scene.box,n),heading31:n.heading,layout31:true}}));
 const eventId=uid('road32');const event={id:eventId,caseId:currentCaseId,kind:'apply',raw:'道路對齊',corrected:'道路對齊',writes:stampWrites28(writes,eventId),caseChanges:[{key:'deploymentRoads32',before,after}],createdAt:Date.now(),authorUid:profile.id,operator:radioCallSign(),summary:'依道路排列'+roadDraft32.face+'車隊'};
 const result=await commitIntake28(event,intakeRevision28());if(currentCaseId!==event.caseId)return;
 if(firebaseEnabled){const saved=result.event||event;for(const w of saved.writes){live[w.coll]=live[w.coll].filter(x=>x.id!==w.id);if(w.after)live[w.coll].push(w.after);}for(const c of saved.caseChanges||[])currentCase[c.key]=c.after;if(result.revision!==undefined)currentCase.resourceRevision=result.revision;if(!live.intakeEvents.some(e=>e.id===saved.id))live.intakeEvents.push(saved);}

 roadDraft32=null;$('applyRoad32').disabled=true;renderLiveParts();roadMessage32('車隊已沿指定道路排列，總覽與部署圖已同步。');
}
function installScene32(){
 deploymentSchematicHtml=deploymentSchematic32;renderMap=renderGoogle32;fitMapToIncident=mapFocus32;
 const base=renderOverviewContent;renderOverviewContent=function(){base();const host=$('overviewDeploymentSnapshot');if(host&&currentCase)host.innerHTML=deploymentSchematic32();bindScene32(host);renderDeployment32();};
 $('fitMapBtn').textContent='10m近距離';$('fitMapBtn').onclick=()=>{sceneView32.scale=8;sceneView32.fit=false;renderDeployment32();mapFocus32();};
 $('suggestRoad32').onclick=()=>suggestRoad32();$('drawRoad32').onclick=()=>beginRoad32();$('applyRoad32').onclick=()=>applyRoad32().catch(e=>roadMessage32(e.message));
 $('reverseRoad32').onclick=()=>{if(roadDraft32){roadDraft32.points.reverse();renderGoogle32();roadMessage32('已反轉，第一點為頭車；請確認後套用。');}};
}
