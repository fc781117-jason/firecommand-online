const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {app}=require('./app-harness.cjs');

const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const appCode=fs.readFileSync(require.resolve('../assets/app.js'),'utf8');

test('V3.3 SOP 六個真實入口與同層圖面均在案件頁，沒有預選111',()=>{
  for(const id of ['contactRows','addContactBtn','hazardSavedCard','hazardPhoto','supportDetailFields','ritBrigade','ritUnitSelect','fieldCrewDetails','fieldVehicleDetails','deploymentMapDetails','buildingOpsDetails','hazardPaletteV2','cancelHoseSelection'])assert.match(html,new RegExp(`id="${id}"`));
  assert.doesNotMatch(html,/id="fieldMapDetails"/);
  assert.match(html,/data-support-kind="fire"/);assert.match(html,/data-support-kind="external"/);
  assert.match(html,/id="fieldVehicleCode"[^]*?value="custom">＋新增車號/);
  assert.doesNotMatch(html,/id="fieldVehicleCode"[^]*?value="111">111/);
  assert.doesNotMatch(html,/data-field-map-tool="(?:hose|hazard)"/);
});

test('辨識卡資料與任務兩組 2×2，未知與零不同，無上方修改或稍後',()=>{
  const c=app();vm.runInContext(`currentCase.mode='live';intake28={caseId:'room',commandId:'v2',text:'竹圍到場',items:[FCIntake29.item('crew',{id:'crew-v2',unit:'竹圍',number:null,allowUnknown:true})]};captureBase29(intake28);renderIntakePlan28();`,c);
  const markup=c.document.getElementById('intakeChanges28').innerHTML;
  const order=['資料類型','大隊','出勤總人數','分隊','面向及任務','面向','任務'];
  let at=0;for(const label of order){const next=markup.indexOf(label,at);assert.ok(next>=at,`順序缺少 ${label}`);at=next+label.length;}
  assert.match(markup,/<option value="" selected>未知<\/option>/);assert.match(markup,/<option value="0" >0<\/option>/);
  assert.match(markup,/data-commit/);assert.match(markup,/data-remove/);
  assert.doesNotMatch(markup,/data-edit-toggle|data-defer|本次變更|review-preview29/);
});

test('單筆區塊更新後端有 revision 防衝突；失敗不改本機資料',async()=>{
  const c=app();vm.runInContext(`currentCase={id:'room',mode:'live',contactsRevision:0,contacts:[]};currentCaseId='room';firebaseEnabled=true;renderArrivalStatusCards=()=>{};renderCommandGuide=()=>{};`,c);
  const stored={contactsRevision:0,contacts:[]};
  c.db={collection:()=>({doc:()=>({})}),runTransaction:async fn=>fn({get:async()=>({exists:true,data:()=>stored}),update:(_,patch)=>Object.assign(stored,patch)})};
  vm.runInContext('db=globalThis.db',c);
  await vm.runInContext(`updateCaseSection('contactsRevision',data=>({contacts:[...data.contacts,{id:'a',name:'測試'}]}))`,c);
  assert.equal(stored.contacts.length,1);assert.equal(stored.contactsRevision,1);
  stored.contactsRevision=2;
  await assert.rejects(vm.runInContext(`updateCaseSection('contactsRevision',()=>({contacts:[]}))`,c),/版本衝突/);
  assert.equal(vm.runInContext('currentCase.contacts.length',c),1);
});

test('危險物與關係人欄位不再被整份到場回報自動覆蓋',()=>{
  const section=appCode.slice(appCode.indexOf('async function saveCaseInfo('),appCode.indexOf('async function saveSummaryInfo('));
  for(const key of ['contacts:','hazardItems:','hazardContact:','hazardPhone:','hazardAppearance:','supportDetails:','supports,'])assert.doesNotMatch(section,new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(appCode,/async function updateCaseSection\(/);
  assert.match(appCode,/photoPath/);
  assert.match(appCode,/status:'requested'/);
});

test('特殊車號由單位組合且不猜測車種，重點不新增重複紀錄',async()=>{
  const c=app(),field=id=>c.document.getElementById(id);
  vm.runInContext(`currentCase={id:'room',mode:'live',resourceRevision:0};currentCaseId='room';profile={id:'owner',brigade:'第三大隊'};firebaseEnabled=false;saveLocalCase=()=>{};renderLiveParts=()=>{};stagingPosition=()=>({lat:25,lng:121});`,c);
  field('fieldVehicleBrigade').value='第三大隊';field('fieldVehicleUnit').value='淡水';field('fieldVehicleCode').value='custom';field('fieldVehicleCustomCode').value='借用11';
  await vm.runInContext('saveFieldVehicle()',c);
  assert.equal(vm.runInContext('live.vehicles.length',c),1);
  assert.equal(vm.runInContext('live.vehicles[0].name',c),'淡水借用11');
  assert.equal(vm.runInContext('live.vehicles[0].canHose',c),false);
  field('fieldVehicleCode').value='custom';field('fieldVehicleCustomCode').value='借用11';
  await vm.runInContext('saveFieldVehicle()',c);
  assert.equal(vm.runInContext('live.vehicles.length',c),1);
});
