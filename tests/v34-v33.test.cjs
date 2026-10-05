const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const app=fs.readFileSync(require.resolve('../assets/app.js'),'utf8');
const O=require('../assets/operational-v32');

test('V3.3 resource and drawing headers share native inline details, no toolbar link or jump handler',()=>{
  for(const id of ['fieldCrewDetails','fieldVehicleDetails','deploymentMapDetails','buildingOpsDetails'])assert.match(html,new RegExp(`<details id="${id}" class="field-entry-bar`));
  assert.doesNotMatch(html,/id="fieldMapDetails"|id="openBuildingDrawing"|data-field-map-tool/);
  assert.doesNotMatch(app,/\$\('deploymentMapDetails'\)\.scrollIntoView|\$\('buildingOpsDetails'\)\.scrollIntoView/);
  assert.match(app,/bindExclusiveDetails\(\['deploymentMapDetails','buildingOpsDetails'\]\)/);
});
test('V3.3 summary grammar: aggregate first, then resident bullets without assuming unknown is zero',()=>{
  const detail=O.floorDetail({floor:4,residents:[{unitNo:'A戶',maleCount:2,femaleCount:3,status:'已疏散'},{unitNo:'B戶',maleCount:null,femaleCount:2,status:'已確認在場',note:'行動不便'}]});
  assert.match(detail.heading,/4F｜2戶｜已確認至少7人｜1戶人口未完整/);
  assert.equal(detail.residents.length,2);
  assert.match(detail.residents[0].population,/共5人/);
  assert.match(detail.residents[1].demographics,/男性人數待確認/);
  assert.match(detail.residents[1].population,/已確認至少2人/);
  assert.equal(detail.residents[1].note,'行動不便');
  assert.match(app,/floor-detail-v33[^]*?<ul>/);
  assert.doesNotMatch(app,/join\('；'\);return `<p><strong>\$\{floorLabel/);
  assert.equal(O.floorDetail({floor:3,residents:[]}).households,0);
});
test('V3.3 vehicle summary displays actual unplaced count only when needed',()=>{
  assert.match(app,/live\.vehicles\.filter\(v=>!v\.positionManual\)\.length/);
  assert.match(app,/已登錄 \$\{live\.vehicles\.length\} 台\$\{unplaced\?/);
});
