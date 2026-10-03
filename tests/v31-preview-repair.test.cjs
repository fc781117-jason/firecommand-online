'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {app}=require('./app-harness.cjs'),V3=require('../assets/v34-v3'),Scene=require('../assets/scene32'),Demo=require('../assets/preview-demo-v31');
const run=(c,s)=>vm.runInContext(s,c),clone=x=>JSON.parse(JSON.stringify(x));
function setup(){const c=app();run(c,`renderArrivalStatusCards=()=>{};scheduleDerivedSummaryPersist=()=>{};renderBuildingOps=()=>{};renderTacticalCanvasV3=()=>{};renderContactRows=()=>{};setRadioValue=()=>{};fieldEntryStatus=()=>{};collectBuildingOpsFromUI=()=>{};`);return c;}

test('address compose preserves confirmed priority, irregular unit and manual/legacy overrides',()=>{
  assert.equal(V3.composeResidentAddress('正確地址','A戶','4F'),'正確地址 A戶 4F');
  assert.equal(V3.composeResidentAddress('正確地址','1號之2','4F'),'正確地址 1號之2 4F');
  assert.deepEqual(V3.residentAddressDraft({address:'人工自由格式',addressMode:'manual'},'改地址','B戶','4F'),{address:'人工自由格式',mode:'manual'});
  assert.equal(V3.residentAddressDraft({address:'舊資料自訂地址'},'新地址','A戶','4F').address,'舊資料自訂地址');
  assert.equal(V3.residentAddressDraft({address:'正確地址 A戶 4F',addressMode:'auto'},'正確地址','A戶','4F').address,'正確地址 A戶 4F');
});
test('actual resident editor uses correct address order and stops composing after manual input',()=>{
 const c=setup();run(c,`currentCase.buildingOps={floorActions:[]};currentCase.confirmedAddress='confirmed';currentCase.correctedAddress='corrected';currentCase.reportedAddress='reported';currentCase.address='base';openActionSheet=(title,html)=>{globalThis.sheet={title,html};const m=html.match(/data-address-mode="([^"]+)" value="([^"]*)"/);$('residentAddressV31').dataset.addressMode=m[1];$('residentAddressV31').value=m[2];};openResidentEditorV3(4);`);
 assert.match(c.sheet.html,/confirmed 4F/);assert.doesNotMatch(c.sheet.html,/<select[^>]+floor/i);
 run(c,`$('residentUnitNoV3').value='A戶';$('residentUnitNoV3').oninput();`);assert.equal(c.document.getElementById('residentAddressV31').value,'confirmed A戶 4F');
 run(c,`$('residentAddressV31').value='自訂1號之2';$('residentAddressV31').oninput();$('residentUnitNoV3').value='B戶';$('residentUnitNoV3').oninput();`);assert.equal(c.document.getElementById('residentAddressV31').value,'自訂1號之2');
 run(c,`delete currentCase.confirmedAddress;openResidentEditorV3(4);`);assert.match(c.sheet.html,/corrected 4F/);
 run(c,`delete currentCase.correctedAddress;openResidentEditorV3(4);`);assert.match(c.sheet.html,/reported 4F/);
});
test('actual upload contract uses authorized existing four-segment private folders and exact size bound',async()=>{
 const c=setup(),paths=[];c.firebase={storage:()=>({ref:path=>({put:async(file,meta)=>paths.push({path,meta})})})};run(c,`firebaseEnabled=true;`);
 const file={type:'image/jpeg',size:100};
 const a=await c.uploadCasePhoto('contacts','resident-4-one',file),b=await c.uploadCasePhoto('contacts','contact-one',file),d=await c.uploadCasePhoto('hazards','hazard',file);
 for(const path of [a,b,d]){assert.equal(path.split('/').length,4);assert.match(path,/^case-private\/room\/(contacts|hazards)\//);}
 assert.equal(paths[0].meta.customMetadata.caseId,'room');
 await assert.rejects(c.uploadCasePhoto('residents/4','x',file),/不支援/);
 await assert.rejects(c.uploadCasePhoto('contacts','x',{...file,size:5*1024*1024}),/5 MB/);
 await assert.rejects(c.uploadCasePhoto('contacts','x',{type:'image/svg+xml',size:100}),/JPG/);
 assert.equal(fs.readFileSync(require.resolve('../firebase/storage.rules'),'utf8'),require('node:child_process').execFileSync('git',['show','HEAD:firebase/storage.rules'],{encoding:'utf8'}));
});
test('live and practice resident save/update preserve multiple households and failed replacement photos',async()=>{
 for(const mode of ['live','practice']){
  const c=setup();run(c,`currentCase.mode='${mode}';currentCase.buildingOps={levels:[4],floorActions:[{floor:4,action:'疏散離開',residents:[{id:'old',unitNo:'原戶',photoPath:'existing-private-photo',photoStatus:'ready'}]}]};`);
  const fields={residentAddressV31:'虛構地址 A戶 4F',residentUnitNoV3:'A戶',residentContactV3:'測試',residentPhoneV31:'',residentMaleV3:'2',residentFemaleV3:'3',residentStatusV31:'已疏散',residentNoteV3:'測試'};
  for(const [id,value]of Object.entries(fields))c.document.getElementById(id).value=value;
  c.document.getElementById('residentAddressV31').dataset.addressMode='auto';
  await c.saveResidentV3(4,'new',{});
  assert.equal(run(c,'currentCase.buildingOps.floorActions[0].residents.length'),2);
  assert.equal(run(c,"currentCase.buildingOps.floorActions[0].residents.find(r=>r.id==='new').totalCount"),5);
  c.document.getElementById('residentPhotoV3').files=[{type:'image/jpeg',size:100}];
  await c.saveResidentV3(4,'old',{id:'old',photoPath:'existing-private-photo',photoStatus:'ready'});
  const saved=clone(run(c,"currentCase.buildingOps.floorActions[0].residents.find(r=>r.id==='old')"));
  assert.equal(saved.photoPath,'existing-private-photo');assert.equal(saved.photoStatus,'pending');assert.equal(saved.unitNo,'A戶');
  assert.equal(run(c,'currentCase.buildingOps.floorActions[0].residents.length'),2);
 }
});
test('derived zone opens editable controls directly, persists same object, and supports delete/undo',async()=>{
 const c=setup();run(c,`currentCase={id:'room',mode:'live',lat:25,lng:121,firstSideNote:'第一面設置指揮站'};localState.cases=[currentCase];tacticalSceneV3=FCScene32.build(currentCase,live,{all:true});openActionSheet=(title,html)=>{globalThis.sheet={title,html};};globalThis.undos=[];pushMapUndo=(label,fn)=>undos.push(fn);`);
 c.openTacticalObjectV31('zones','zone32_command');assert.match(c.sheet.html,/zoneLabelV31/);assert.match(c.sheet.html,/zoneNoteV31/);
 await c.patchTacticalZoneV31('zone32_command',{label:'修訂指揮所',note:'位置說明'},'修改');
 let scene=Scene.build(clone(run(c,'currentCase')),clone(run(c,'live')),{all:true});
 assert.equal(scene.allNodes.filter(n=>n.coll==='zones').length,1);assert.equal(scene.allNodes[0].label,'修訂指揮所');
 assert.equal(run(c,'live.hazards.length'),0);
 await c.updateTacticalPositionV31('zones','zone32_command',{lat:25.0002,lng:121.0001},'移動');
 assert.equal(run(c,'currentCase.tacticalZones.command.lat'),25.0002);
 await c.patchTacticalZoneV31('zone32_command',{hidden:true},'刪除');
 assert.equal(Scene.build(clone(run(c,'currentCase')),clone(run(c,'live')),{all:true}).allNodes.length,0);
 await c.undos.at(-1)();assert.equal(Scene.build(clone(run(c,'currentCase')),clone(run(c,'live')),{all:true}).allNodes.length,1);
 assert.equal(c.tacticalEndpointV31('zones','zone32_command'),null);
});
test('legacy converted zone stays single after renaming its replacement hazard',()=>{
 const scene=Scene.build({lat:25,lng:121,firstSideNote:'第一面設置指揮站'},{vehicles:[],crews:[],hoses:[],hazards:[{id:'h',sourceZoneId:'zone32_command',type:'自訂名稱',lat:25,lng:121}]},{all:true});
 assert.equal(scene.allNodes.length,1);assert.equal(scene.allNodes[0].coll,'hazards');
});
test('observer cannot use repaired resident, zone, or tactical line/position mutation paths',async()=>{
 const c=setup();run(c,`live.players=[{userId:'owner',role:'觀察員'}];`);
 await assert.rejects(c.patchTacticalZoneV31('zone32_command',{label:'x'},'x'),/觀察員/);
 await assert.rejects(c.updateTacticalPositionV31('vehicles','v',{lat:1,lng:2},'x'),/觀察員/);
 await assert.rejects(c.addTacticalHoseV31({},{}),/觀察員/);
 await assert.rejects(c.uploadCasePhoto('contacts','x',{type:'image/jpeg',size:1}),/觀察員/);
});
test('demo login enters prefilled case, is idempotent, and cannot run on production or Firebase',()=>{
 const c=setup();run(c,`previewTargetVerifiedV31=true;enterApp=()=>{};openCase=id=>{globalThis.opened=id;};localState={profile:{id:'real-profile'},cases:[{id:'unrelated'}]};loginDemo();`);
 assert.equal(c.opened,Demo.IDS.live);assert.equal(run(c,'profile.id'),'demo-user');assert.equal(run(c,'localState.profile.id'),'real-profile');assert.equal(run(c,'localState.cases.length'),3);
 run(c,'loginDemo();');assert.equal(run(c,'localState.cases.length'),3);
 run(c,"window.location.hostname='firecommand-online.vercel.app';globalThis.opened=null;fbUser=null;loginDemo();");assert.equal(c.opened,null);assert.equal(run(c,'fbUser'),null);
 run(c,"window.location.hostname='candidate.vercel.app';firebaseEnabled=true;loginDemo();");assert.equal(run(c,'fbUser'),null);
});
test('demo photos use a strict built-in fixture allowlist only',()=>{
 assert.equal(Demo.isDemoPhoto(Demo.PHOTOS.resident),true);assert.equal(Demo.isDemoPhoto('data:image/svg+xml,<svg/>'),false);
});
test('patient form keeps identity on updates and rapid repeat submit creates one report',async()=>{
 const c=setup();let release,submitted=[];c.releaseSubmit=new Promise(resolve=>release=resolve);c.capture=record=>submitted.push(record);
 run(c,`live.sitreps=[];addItem=async(coll,record)=>{capture(record);await releaseSubmit;live.sitreps.push({id:'report-'+live.sitreps.length,...record});return 'report';};addLog=async()=>{};setPatientNow=()=>{};$('patientName').value='合成人甲';$('patientGender').value='男';$('patientFoundAt').value='4F';$('patientStatus').value='重傷';$('patientTransportV31').value='transported';`);
 const pending=c.addPatientSitrep();await c.addPatientSitrep();assert.equal(submitted.length,1);release();await pending;
 const identity=submitted[0].patient.id;assert.equal(submitted[0].patient.transportStatus,'transported');assert.match(submitted[0].detail,/已確認送醫/);
 run(c,`$('patientRecordV31').value=window.FCOperationalV31.getLatestPatients(live.sitreps)[0].key;$('patientStatus').value='已救出';`);
 await c.addPatientSitrep();assert.equal(submitted.length,2);assert.equal(submitted[1].patient.id,identity);assert.equal(run(c,'window.FCOperationalV31.getLatestPatients(live.sitreps).length'),1);
});
test('first derived-zone edit/move/delete Undo restores SOP label and provenance with no empty override',async()=>{
 for(const mode of ['live','practice'])for(const patch of [{label:'QA 指揮所',note:'合成測試'},{lat:25.0002,lng:121.0001,positionManual:true},{hidden:true}]){
  const c=setup();run(c,`currentCase={id:'room',mode:'${mode}',hostUid:'owner',lat:25,lng:121,firstSideNote:'第一面已設立指揮站',tacticalZones:{}};localState.cases=[currentCase];tacticalSceneV3=FCScene32.build(currentCase,live,{all:true});globalThis.undos=[];pushMapUndo=(label,fn)=>undos.push(fn);`);
  const original=clone(run(c,"tacticalSceneV3.allNodes.find(n=>n.id==='zone32_command')"));
  assert.equal(original.label,'前進指揮所');assert.equal(original.detail,'第一面｜SOP');
  await c.patchTacticalZoneV31('zone32_command',patch,'修改標示');
  await c.undos.at(-1)();
  assert.equal(run(c,"Object.hasOwn(currentCase.tacticalZones,'command')"),false);
  const scene=Scene.build(clone(run(c,'currentCase')),clone(run(c,'live')),{all:true});
  const restored=scene.allNodes.find(n=>n.id==='zone32_command');
  assert.equal(restored.label,original.label);assert.equal(restored.detail,original.detail);
  assert.equal(restored.x,original.x);assert.equal(restored.y,original.y);
  assert.equal(scene.allNodes.filter(n=>n.id==='zone32_command').length,1);
 }
});
test('zone Undo keeps unrelated overrides and restores an existing manual override exactly',async()=>{
 const c=setup();run(c,`currentCase={id:'room',mode:'live',lat:25,lng:121,firstSideNote:'第一面設立指揮站',tacticalZones:{command:{label:'既有指揮所',face:'第二面',note:'既有補述',lat:25.0001,lng:121.0001}}};localState.cases=[currentCase];tacticalSceneV3=FCScene32.build(currentCase,live,{all:true});globalThis.undos=[];pushMapUndo=(label,fn)=>undos.push(fn);`);
 const before=clone(run(c,'currentCase.tacticalZones.command'));
 await c.patchTacticalZoneV31('zone32_command',{label:'新名稱'},'修改標示');
 run(c,"currentCase.tacticalZones.rehab={label:'休息區',face:'第三面'};");await c.undos.at(-1)();
 assert.deepEqual(clone(run(c,'currentCase.tacticalZones.command')),before);
 assert.equal(run(c,'currentCase.tacticalZones.rehab.label'),'休息區');
});
test('live/practice initial, select, hose and cancel paths render one shared tactical hint; icon placement stays specific',()=>{
 const c=app(),expected=run(c,'TACTICAL_INTERACTION_HINT_V31');
 for(const mode of ['live','practice']){
  run(c,`currentCase.mode='${mode}';deploymentMode='select';`);c.document.getElementById('deploymentActionHint').textContent='stale initial copy';
  c.renderTacticalCanvasV3();assert.equal(c.document.getElementById('deploymentActionHint').textContent,expected);
  for(const interaction of ['select','hose']){c.setDeploymentMode(interaction);assert.equal(c.document.getElementById('deploymentActionHint').textContent,expected);}
  c.setDeploymentMode('hazard');assert.match(c.document.getElementById('deploymentActionHint').textContent,/選擇戰術圖示，再點畫布放置/);
  c.setDeploymentMode('select');c.renderTacticalCanvasV3();assert.equal(c.document.getElementById('deploymentActionHint').textContent,expected);
 }
 for(const text of ['單點選取','再點同一物件','長按','車輛→人員','人員→車輛','圖示不可接線'])assert.ok(expected.includes(text),text);
 const html=fs.readFileSync(require.resolve('../index.html'),'utf8');assert.match(html,/<p id="deploymentActionHint"><\/p>/);assert.doesNotMatch(html,/點第一台車選取；再點第二台車/);
});
