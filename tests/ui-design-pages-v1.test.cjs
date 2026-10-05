'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/firecommand-ui-pages.css'),'utf8');

test('approved token layer precedes the page skin, and all four actual case entries remain',()=>{
  const tokens=html.indexOf('firecommand-ui-tokens.css');
  const components=html.indexOf('firecommand-ui-components.css');
  const pages=html.indexOf('firecommand-ui-pages.css');
  assert.ok(tokens>=0&&tokens<components&&components<pages);
  assert.equal((html.match(/firecommand-ui-pages\.css/g)||[]).length,1);
  for(const id of ['caseInfo','arrivalSection','sitrepSection','aiSection','dashboardSection','assessmentSection','reportSection']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
    assert.ok(css.includes(`#${id}`),`${id} has no skin`);
  }
  for(const page of ['arrivalSection','sitrepSection','caseInfo','tacticalMapSection']){
    assert.match(html,new RegExp(`data-case-page="${page}"`));
  }
  assert.match(html,/id="moreNavBtn"/);
});

test('page skin keeps real SOP, situation, overview, and More controls and shared token values',()=>{
  for(const id of ['commandStageCards','arrivalStatusCards','sitrepFireDetails','sitrepPatientDetails','overviewDeploymentSnapshot','appActionSheet','appActionBody']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
  }
  for(const token of ['--fc-ui-brand-blue','--fc-ui-brand-navy','--fc-ui-border','--fc-ui-touch-min','--fc-ui-touch-primary'])assert.ok(css.includes(`var(${token})`));
  assert.ok(fs.statSync(path.join(root,'assets/ui-section-mark.svg')).size>100);
  assert.match(css,/url\('\.\/ui-section-mark\.svg'\)/);
  assert.doesNotMatch(css,/url\('https?:/);
  assert.doesNotMatch(css,/#tacticalMapSection\s+\.tactical-canvas/);
});
