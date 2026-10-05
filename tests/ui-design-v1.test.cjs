const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const tokens=JSON.parse(fs.readFileSync(path.join(root,'design/design_tokens.json'),'utf8'));
const css=fs.readFileSync(path.join(root,'assets/firecommand-ui-tokens.css'),'utf8');
const components=fs.readFileSync(path.join(root,'assets/firecommand-ui-components.css'),'utf8');

test('deployment visual tokens use the approved contract and its hero is a local asset',()=>{
  for(const [name,value] of Object.entries(tokens.colors)){
    const cssName=name.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`);
    assert.ok(css.includes(`--fc-ui-${cssName}:${value}`),`${name} token differs from approved design`);
  }
  assert.ok(html.includes('firecommand-ui-tokens.css'));
  assert.ok(html.includes('firecommand-ui-components.css'));
  assert.ok(fs.statSync(path.join(root,'assets/firecommand-hero-v1.webp')).size>1000);
  assert.match(components,/url\('\.\/firecommand-hero-v1\.webp'\)/);
  assert.doesNotMatch(components,/https?:\/\//);
});

test('UI skin preserves existing deployment selectors, controls and native inline accordions',()=>{
  for(const id of ['fieldCrewDetails','fieldVehicleDetails','deploymentMapDetails','buildingOpsDetails','fieldCrewSaveBtn','fieldVehicleSaveBtn','tacticalCanvasV3','verticalSection','floorPlanCanvas']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`${id} missing or duplicated`);
  }
  assert.match(html,/id="fieldCrewDetails" class="field-entry-bar fc-ui-action-card/);
  assert.match(html,/id="fieldVehicleDetails" class="field-entry-bar fc-ui-action-card/);
  assert.match(html,/id="deploymentMapDetails" class="field-entry-bar drawing-accordion fc-ui-action-card/);
  assert.match(html,/id="buildingOpsDetails" class="field-entry-bar drawing-accordion fc-ui-action-card/);
  assert.match(components,/#tacticalMapSection \.fc-ui-action-card>summary/);
  assert.match(components,/body:has\(#tacticalMapSection:not\(\[hidden\]\)\) \.case-nav-item\.active/);
  assert.doesNotMatch(html,/id="fieldMapDetails"/);
});
