'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'assets/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/firecommand-ui-shared-hero.css'),'utf8');

test('one shared case photo banner, not a deployment-only duplicate',()=>{
  assert.equal((html.match(/id="caseHero"/g)||[]).length,1);
  assert.ok(html.indexOf('id="caseHero"')<html.indexOf('id="caseInfo"'));
  assert.equal((html.match(/class="fc-ui-hero fc-ui-section-hero fc-ui-case-hero"/g)||[]).length,1);
  assert.match(html,/firecommand-ui-shared-hero\.css\?v=1/);
  assert.match(css,/#appScreen \.case-workspace\{grid-template-areas:'nav hero' 'nav content'\}/);
  assert.match(css,/body\.in-training #appScreen \.case-workspace\{grid-template-areas:'nav hero' 'nav practice' 'nav content'\}/);
});

test('each real case destination updates the same hero without changing navigation',()=>{
  const labels={caseInfo:'指揮總覽',arrivalSection:'SOP 流程',sitrepSection:'戰情回報',tacticalMapSection:'戰術部署',aiSection:'AI 輔助',dashboardSection:'資源總覽',reportSection:'進度報告',assessmentSection:'檢討評估'};
  for(const [id,title] of Object.entries(labels))assert.ok(app.includes(`${id}:['${title}'`),`${id} lacks shared hero copy`);
  assert.match(app,/\$\('caseHeroTitle'\)\.textContent = heroCopy\[next\]\[0\]/);
  assert.match(app,/\$\('caseHeroSubtitle'\)\.textContent = heroCopy\[next\]\[1\]/);
  assert.match(app,/panel\.hidden = panel\.dataset\.casePagePanel !== next/);
  assert.match(css,/#appScreen \.topbar\{/);
  assert.match(css,/#homePage \.fc-ui-home-hero/);
  assert.match(css,/\.auth-screen,\.approval-screen/);
  assert.match(css,/#appActionSheet \.app-action-head/);
  assert.doesNotMatch(css,/#tacticalCanvasV3|\.tactical-canvas-v3|#floorPlanCanvas/);
});
