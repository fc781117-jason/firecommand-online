const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const T=require('../assets/tactics31');
const Scene=require('../assets/scene32');

const app=fs.readFileSync(require.resolve('../assets/app.js'),'utf8');
const box={lat:25,lng:121,widthM:40,heightM:28,rotationDeg:0};

test('四面戰術慣例固定為第一面下、第二面左、第三面上、第四面右',()=>{
  const first=T.point(box,'第一面','vehicle',0);
  const second=T.point(box,'第二面','vehicle',0);
  const third=T.point(box,'第三面','vehicle',0);
  const fourth=T.point(box,'第四面','vehicle',0);
  assert.ok(first.lat<box.lat,'第一面應在建物正面／畫面下方');
  assert.ok(second.lng<box.lng,'第二面應在第一面左側');
  assert.ok(third.lat>box.lat,'第三面應在第一面正對面／畫面上方');
  assert.ok(fourth.lng>box.lng,'第四面應在第一面右側');
});

test('戰術場景的人員依已選面向自動靠近正確側，不再使用舊的左右顛倒慣例',()=>{
  const state={crews:[
    {id:'c2',unit:'二面組',face:'第二面',status:'作業中',task:'滅火攻擊',positionManual:false},
    {id:'c4',unit:'四面組',face:'第四面',status:'作業中',task:'滅火攻擊',positionManual:false}
  ]};
  const scene=Scene.build({lat:25,lng:121,buildingBox:box},state,{all:true});
  const c2=scene.nodes.find(n=>n.id==='c2'),c4=scene.nodes.find(n=>n.id==='c4');
  assert.ok(c2&&c2.x<0,'第二面人員應在建物左側');
  assert.ok(c4&&c4.x>0,'第四面人員應在建物右側');
});

test('人員表單變更面向時會重新套用面向位置並保持可後續手動拖曳',()=>{
  assert.match(app,/faceChanged=!!face&&face!==String\(existing\?\.face\|\|''\)/);
  assert.match(app,/window\.FCTactics31\?\.point\?window\.FCTactics31\.point\(getBuildingBox\(\),face,role,peerIndex\)/);
  assert.match(app,/positionManual:false/);
  assert.match(app,/p\.x<0\?'第二面':'第四面'/);
});

test('關係人、危險物關係人與住戶皆保留剛拍照片的即時縮圖並再同步私有 Storage',()=>{
  assert.match(app,/const localPhotoPreviewCache=new Map\(\)/);
  assert.match(app,/cacheLocalPhotoPreview\('contacts',key,file,savedCaseId\)/);
  assert.match(app,/cacheLocalPhotoPreview\('hazards','hazard',file,savedCaseId\)/);
  assert.match(app,/cacheLocalPhotoPreview\('residents',/);
  assert.match(app,/data-local-photo-key/);
  assert.match(app,/applyLocalPhotoPreviews/);
  assert.match(app,/function normalizeCasePhoto\(file\)/);
  assert.match(app,/canvas\.toBlob/);
  assert.match(app,/case-private\/\$\{caseId\}\/\$\{folder\}/);
});

test('iPhone 非 JPEG 原始圖片可先嘗試轉成 JPEG 後再送既有 Storage 規則',()=>{
  assert.match(app,/image\/jpeg','image\/png','image\/webp/);
  assert.match(app,/image\/jpeg',\.84/);
  assert.match(app,/contentType:upload\.type\|\|'image\/jpeg'/);
});

test('拍照選檔後立即產生本機縮圖，不必等待 Storage 上傳完成',async()=>{
  const vm=require('node:vm');
  const {app}=require('./app-harness.cjs');
  const c=app(),slot=c.document.getElementById('photoSlot');
  slot.appendChild=child=>{slot.child=child;};
  c.document.createElement=()=>({src:'',alt:'',isConnected:true});
  c.FileReader=class{
    readAsDataURL(){this.result='data:image/jpeg;base64,ZmFrZQ==';this.onload?.();}
  };
  vm.runInContext("showLocalPhotoPreview({type:'image/jpeg',size:128},document.getElementById('photoSlot'))",c);
  assert.equal(slot.child?.src,'data:image/jpeg;base64,ZmFrZQ==');

  const cached={dataset:{localPhotoKey:'room|contacts|c1'},innerHTML:'',isConnected:true,appendChild(child){this.child=child;}};
  await vm.runInContext("cacheLocalPhotoPreview('contacts','c1',{type:'image/jpeg',size:128},'room')",c);
  c.applyRoot={querySelectorAll(){return[cached];}};
  vm.runInContext('applyLocalPhotoPreviews(applyRoot)',c);
  assert.equal(cached.child?.src,'data:image/jpeg;base64,ZmFrZQ==');
});
