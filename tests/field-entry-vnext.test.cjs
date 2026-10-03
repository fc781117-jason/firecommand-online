const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const F=require('../assets/field-entry-core'),{app}=require('./app-harness.cjs');
const Semantic=require('../assets/intake-semantic');
const tree={'第三大隊':{'淡水中隊':['淡水','竹圍'],'三重中隊':['三重','二重']},'第二大隊':{'新莊中隊':['頭前']}};
test('空白／0／正整數分別保留；負數、小數及文字拒絕',()=>{
  assert.deepEqual(F.parseCount(''),{valid:true,count:null});
  assert.deepEqual(F.parseCount('0'),{valid:true,count:0});
  assert.deepEqual(F.parseCount('3'),{valid:true,count:3});
  for(const value of ['-1','1.5','四','100','01'])assert.equal(F.parseCount(value).valid,false,value);
  assert.equal(F.countLabel({}), '人數待補');
  assert.equal(F.countLabel({count:0}), '0 人');
  assert.equal(F.countLabel({count:0,countUnknown:true}), '人數待補');
});
test('四筆紀錄僅回報已知小計和待補筆數；大隊和中隊／分隊不可猜配',()=>{
  assert.deepEqual(F.summary([{count:3},{count:4},{count:null},{count:0,countUnknown:true}]),{units:4,known:7,pending:2});
  assert.equal(F.validUnit(tree,'第三大隊','淡水中隊'),true);
  assert.equal(F.validUnit(tree,'第三大隊','淡水'),true);
  assert.equal(F.validUnit(tree,'第三大隊','頭前'),false);
  assert.deepEqual(F.unitOptions(tree,'第三大隊')[0],{company:'淡水中隊',units:['淡水中隊','淡水','竹圍']});
  assert.notEqual(F.identity('第三大隊','淡水'),F.identity('第三大隊','竹圍'));
});
test('Preview 的 vercel.app 子網域不得連正式 Firebase；固定正式網址不受影響',()=>{
  assert.equal(F.isolatedPreviewHost('firecommand-online.vercel.app'),false);
  assert.equal(F.isolatedPreviewHost('firecommand-online-git-feature-team.vercel.app'),true);
  assert.equal(F.isolatedPreviewHost('firecommand-online.firebaseapp.com'),false);
});
test('人員空白寫入後補3人更新同筆；失敗不清空草稿',async()=>{
  const c=app(),node=id=>c.document.getElementById(id),records=new Map();
  vm.runInContext(`currentCase={id:'case1',mode:'live',resourceRevision:0};currentCaseId='case1';profile={id:'admin',brigade:'第三大隊',email:'admin@example.com'};fbUser={uid:'admin'};firebaseEnabled=true;stagingPosition=()=>({lat:25,lng:121});renderLiveParts=()=>{};`,c);
  c.db={collection:()=>({doc:id=>({id,collection:()=>({doc:key=>({id:key})})})}),runTransaction:async(fn)=>{const tx={get:async ref=>({exists:ref.id==='case1'||records.has(ref.id),data:()=>ref.id==='case1'?{status:'active'}:records.get(ref.id)}),set:(ref,data)=>records.set(ref.id,{...data}),update:(ref,data)=>{if(records.has(ref.id))records.set(ref.id,{...records.get(ref.id),...data});}};await fn(tx);}};
  vm.runInContext('db=globalThis.db;firebase={firestore:{FieldValue:{increment:()=>1}}}',c);
  node('fieldCrewBrigade').value='第三大隊';node('fieldCrewUnit').value='淡水';node('fieldCrewCount').value='';node('fieldCrewTask').value='';
  await vm.runInContext('saveFieldCrew()',c);
  const key=F.identity('第三大隊','淡水');assert.equal(records.size,1,node('fieldCrewSaveStatus').textContent);assert.equal(records.get(key).count,null);assert.equal(records.get(key).countUnknown,true);assert.equal(node('fieldCrewSaveStatus').textContent,'已同步儲存');
  c.testCrew={id:key,...records.get(key)};vm.runInContext('live.crews=[testCrew]',c);
  node('fieldCrewCount').value='3';await vm.runInContext('saveFieldCrew()',c);
  assert.equal(records.size,1);assert.equal(records.get(key).count,3);
  node('fieldCrewCount').value='-1';await vm.runInContext('saveFieldCrew()',c);
  assert.equal(records.get(key).count,3);assert.equal(node('fieldCrewCount').value,'-1');
});
test('V2 三個外層入口、獨立欄位及資料規則存在；舊資料沒有 count 不會強制遷移',()=>{
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8'),rules=fs.readFileSync(require.resolve('../firebase/firestore.rules'),'utf8');
  for(const id of ['fieldCrewDetails','fieldVehicleDetails','fieldMapDetails','fieldCrewCount','fieldVehicleCode','hazardPaletteV2'])assert.ok(html.includes(`id="${id}"`));
  assert.doesNotMatch(html,/data-field-map-tool="hazard"/);assert.doesNotMatch(html,/data-field-map-tool="hose"/);
  assert.match(rules,/function validCrewCount\(\)/);assert.match(rules,/request\.resource\.data\.count == null/);
});
test('連續分隊口述拆筆且無人數不虛構；否定與建議不登錄',()=>{
  const roster=['頭前','泰山','重陽','三重','二重','慈福','竹圍','淡水'].map(unit=>({unit,brigade:'第三大隊'}));
  const first=Semantic.local('頭前泰山重陽三重二重',roster).items;
  assert.deepEqual(first.map(i=>i.unit),['頭前','泰山','重陽','三重','二重']);assert.ok(first.every(i=>i.number===null&&i.allowUnknown));
  assert.deepEqual(Semantic.local('慈福四人竹圍三人淡水六人',roster).items.map(i=>i.number),[4,3,6]);
  assert.deepEqual(Semantic.local('三重三人二重兩人',roster).items.map(i=>i.number),[3,2]);
  assert.ok(Semantic.local('竹圍到場，人數還沒確認',roster).items.some(i=>i.unit==='竹圍'&&i.allowUnknown));
  for(const line of ['重陽還沒到','建議竹圍上四樓'])assert.ok(Semantic.local(line,roster).items.every(i=>i.kind!=='crew'));
});
