const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Scene=require('../assets/scene32');

const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const app=fs.readFileSync(require.resolve('../assets/app.js'),'utf8');
const sceneUi=fs.readFileSync(require.resolve('../assets/scene-ui32.js'),'utf8');

test('V3.1 車輛與人員皆可成為水線端點，圖示不可成為端點',()=>{
  assert.match(app,/\['vehicles','crews'\]\.includes\(coll\)/);
  assert.match(app,/sourceType:source\.type,sourceId:source\.id/);
  assert.match(app,/targetType:destination\.type,targetId:destination\.id/);
  assert.match(app,/此圖示無法連接水線/);
  const scene=Scene.build({lat:25,lng:121,buildingBox:{lat:25,lng:121,widthM:40,heightM:28}},{
    vehicles:[{id:'v1',name:'淡水11',unit:'淡水',lat:25,lng:121,canHose:true}],
    crews:[{id:'c1',unit:'竹圍',leader:'攻擊組',lat:25.0001,lng:121.0001,task:'滅火攻擊'}],
    hoses:[{id:'h1',sourceType:'crew',sourceId:'c1',sourceName:'竹圍攻擊組',targetType:'vehicle',targetId:'v1',targetName:'淡水11'}]
  },{all:true});
  assert.equal(scene.lines.length,1);
  assert.equal(scene.lines[0].sourceId,'c1');
});

test('V3.1 長按拖動只在放開時提交單一物件最終座標',()=>{
  assert.match(app,/setTimeout\([^]*?,360\)/);
  assert.match(app,/updateTacticalPositionV31\(state\.coll,state\.id/);
  const moveBody=app.slice(app.indexOf('function moveTacticalPointerV31'),app.indexOf('async function finishTacticalPointerV31'));
  assert.doesNotMatch(moveBody,/updateItem\(|updateTacticalPositionV31\(/);
  assert.match(app,/\['vehicles','crews','hazards','zones'\]\.includes\(coll\)/);
  assert.match(app,/coll==='zones'[^]*?addItem\('hazards'/);
});

test('V3.1 建物內部移除錯置圖面摘要，概要沒有部署修改按鈕與三個畫面模式',()=>{
  assert.doesNotMatch(html,/id="deploymentDrawingReference"/);
  assert.doesNotMatch(html,/前往部署修改|前往建物圖修改/);
  assert.match(html,/如需調整人員、車輛、水線或戰術圖示，請至「部署」功能進行修改/);
  assert.doesNotMatch(sceneUi,/>10m近距離<|>部署全景<|顯示遠處資料/);
  assert.doesNotMatch(sceneUi,/bindScene32\(host\);renderDeployment32\(\)/);
});

test('V3.1 每層均可新增住戶，地址電話狀態與詳細摘要均存在',()=>{
  for(const token of ['residentAddressV31','residentPhoneV31','residentStatusV31','buildingResidentDetailsV31','renderBuildingResidentDetailsV31'])assert.match(app+html,new RegExp(token));
  assert.match(app,/confirmedAddress\|\|currentCase\.correctedAddress\|\|currentCase\.reportedAddress\|\|currentCase\.address/);
  assert.match(app,/const residentSection=`/);
  assert.doesNotMatch(app,/const residentSection=\(a\.action==='疏散離開'/);
  assert.match(app,/entry=index>=0\?\{\.\.\.actions\[index\]\}:\{floor:Number\(floor\),action:'未標示'/);
});

test('V3.1 概要只呈現已確認資料，建物資料不存在時隱藏卡片',()=>{
  assert.match(html,/id="overviewSituationCardV31"[^>]*hidden/);
  assert.match(html,/id="overviewBuildingCardV31"[^>]*hidden/);
  assert.match(app,/buildingCard\.hidden=!hasBuildingOperationalDataV31\(\)/);
  assert.match(app,/row\.status==='已疏散'/);
});
