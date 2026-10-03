const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const V3=require('../assets/v34-v3');
const Scene=require('../assets/scene32');

const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const app=fs.readFileSync(require.resolve('../assets/app.js'),'utf8');
const intakeUi=fs.readFileSync(require.resolve('../assets/intake-ui.js'),'utf8');
const css=fs.readFileSync(require.resolve('../assets/v34-v3.css'),'utf8');

test('V3 任務使用既有選單，其他任務才切自由輸入',()=>{
  assert.deepEqual(V3.taskChoice('內攻'),{choice:'內攻',other:''});
  assert.deepEqual(V3.taskChoice('破壞器材搬運'),{choice:'其他',other:'破壞器材搬運'});
  assert.match(html,/id="fieldCrewTask"[^]*?<option value="其他">其他/);
  assert.match(html,/id="fieldCrewTaskOtherWrap" hidden/);
});

test('V3 續報只保留有指揮價值的部署，面向、任務、RIT、待命排序',()=>{
  const speech=V3.deploymentSpeech([
    {unit:'板橋',face:'第一面',task:'內攻',count:null},
    {unit:'新板',face:'第一面',task:'人命搜救'},
    {unit:'頭前',face:'第二面',task:''},
    {unit:'海山',status:'RIT',task:'RIT'},
    {unit:'二重',status:'待命',task:'待命'},
    {unit:'三重',status:'待命',task:'待命'}
  ]);
  assert.equal(speech,'第一面由板橋分隊執行內攻，新板分隊執行人命搜救；海山分隊擔任 RIT；二重、三重分隊待命。');
  assert.doesNotMatch(speech,/人數待補|任務未指定|頭前/);
});

test('V3 人口未知與零不同，男女皆已知才計算總數',()=>{
  assert.equal(V3.residentTotal(null,3),null);
  assert.equal(V3.residentTotal(0,0),0);
  assert.equal(V3.residentTotal(2,3),5);
  assert.deepEqual(V3.floorResidentSummary([{maleCount:2,femaleCount:1},{maleCount:null,femaleCount:2},{maleCount:0,femaleCount:0}]),{households:3,knownTotal:3,confirmedMinimum:5,pending:1});
  assert.equal(V3.residentPopulationLabel(null,2),'至少 2 人／人數未完整');
});

test('V3 部署首頁只有人員、車輛、圖面三個逐層入口，戰術畫布不是 Google Map',()=>{
  for(const id of ['fieldCrewDetails','fieldVehicleDetails','fieldMapDetails','tacticalCanvasV3'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/id="deploymentMapDetails" class="tactical-workspace-v3"/);
  assert.doesNotMatch(html,/id="deploymentMapDetails"[^]*?id="map"/);
  assert.match(html,/class="deployment-text-capture" hidden/);
});

test('V3.1 物件 Selected State + Same Target Tap 與 A 到 B 建線均在正式畫布',()=>{
  assert.match(app,/tacticalObjectSelectionV31=\{coll,id\}/);
  assert.match(app,/previous\.coll===coll&&previous\.id===id[^]*?openTacticalObjectV31/);
  assert.match(app,/source&&destination[^]*?addTacticalHoseV31/);
  assert.match(css,/\.tactical-selected-v3 circle/);
});

test('V3 水線可選取、移除並進入既有 Undo 堆疊',()=>{
  assert.match(app,/openTacticalHoseSheetV3/);
  assert.match(app,/removeTacticalHoseV3/);
  assert.match(app,/pushMapUndo\(`復原刪除水線/);
});

test('V3 戰術圖示採同一套 SVG，起火點不依賴 Emoji fallback',()=>{
  for(const id of ['fc-icon-fire','fc-icon-gas','fc-icon-electric','fc-icon-hazard','fc-icon-command','fc-icon-rehab','fc-icon-ems'])assert.match(html,new RegExp(`id="${id}"`));
  const scene=Scene.build({lat:25,lng:121,buildingBox:{lat:25,lng:121,widthM:40,heightM:28}},{hazards:[{id:'f',type:'起火點',lat:25,lng:121}]},{all:true});
  const svg=Scene.svg(scene);assert.match(svg,/href="#scene-fire"/);assert.doesNotMatch(svg,/🔥|讚|>站</);
});

test('V3 關係人與危險物關係人共用卡片，照片走案件私有 Storage 路徑',()=>{
  assert.match(app,/contactCardHtml\(person/);
  assert.match(app,/case-private\/\$\{currentCaseId\}/);
  assert.match(app,/photoStatus:'pending'/);
  assert.match(html,/id="hazardPhotoPreview"/);
});

test('V3 疏散樓層可新增多戶，住戶有男女、總數、照片與修改入口',()=>{
  for(const token of ['data-add-resident','residentUnitNoV3','residentContactV3','residentMaleV3','residentFemaleV3','residentTotalV3','residentPhotoV3','data-edit-resident'])assert.match(app,new RegExp(token));
  assert.match(app,/residents:\[\]/);
  assert.match(app,/buildingOpsRevision/);
});

test('V3 Preview 示範帳號只在隔離且無 Firebase 時略過人工審核',()=>{
  assert.match(app,/const isIsolatedPreviewDemo = previewTargetVerifiedV31 && !firebaseEnabled/);
  assert.match(app,/FCFieldEntry\.isolatedPreviewHost\(location\.hostname\)/);
  assert.match(app,/fbUser\.uid === 'demo-user'/);
  assert.match(app,/status: isImmediatelyActive \? 'active' : 'pending'/);
});

test('V3 SOP 手動新增人員預設允許未知人數直接登錄',()=>{
  assert.match(intakeUi,/allowUnknown:kind==='crew'/);
});
