'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'assets/firecommand-ui-full.css'),'utf8');
const app=fs.readFileSync(path.join(base,'assets/app.js'),'utf8');

test('every case navigation item uses a unique shared SVG symbol with a visible text label',()=>{
  const routes=[['arrivalSection','fc-ui-clipboard','流程'],['sitrepSection','fc-ui-pulse','戰情'],['caseInfo','fc-ui-overview','概要'],['tacticalMapSection','fc-ui-layers','部署']];
  for(const [route,icon,label] of routes){
    assert.match(html,new RegExp(`data-case-page="${route}"[^>]*><span class="case-nav-icon"><svg aria-hidden="true"><use href="#${icon}"\\/><\\/svg><\\/span><span>${label}<\\/span>`));
  }
  assert.match(html,/id="moreNavBtn"[^>]*><span class="case-nav-icon"><svg aria-hidden="true"><use href="#fc-ui-more"\/>/);
  for(const icon of ['flame','clipboard','pulse','overview','layers','more','person','pin','spark','report','people','exit','shield','door','drop','wall','hazard']){
    assert.equal((html.match(new RegExp(`id="fc-ui-${icon}"`,'g'))||[]).length,1);
  }
});

test('approved full skin covers actual home, account, and case pages without rewriting tactical canvas',()=>{
  assert.match(html,/firecommand-ui-components\.css\?v=1[\s\S]*firecommand-ui-pages\.css\?v=1[\s\S]*firecommand-ui-full\.css\?v=1/);
  assert.match(html,/id="homePage"[\s\S]*class="fc-ui-home-hero fc-ui-section-hero"/);
  assert.match(css,/#appScreen \.case-nav-icon svg/);
  assert.match(css,/#appScreen #accountAdminDetails/);
  assert.match(css,/\.auth-screen,\.profile-screen,\.approval-screen/);
  assert.match(css,/body:has\(#appScreen:not\(\[hidden\]\)\) #appActionSheet \.more-grid/);
  assert.doesNotMatch(css,/\.tactical-canvas-v3|#floorPlanCanvas|\.floor-plan-canvas/);
  assert.match(app,/data-more-page="\$\{id\}"/);
  for(const id of ['aiSection','dashboardSection','reportSection','assessmentSection'])assert.ok(app.includes(`'${id}'`));
  assert.ok(css.includes("url('./firecommand-hero-v1.webp')"));
});

test('building palette and both saved floor renderers share stable SVG icons instead of emoji',()=>{
  for(const name of ['起火點','待救者','死亡者','入口','水線','隔間','危害物']){
    assert.match(html,new RegExp(`data-floor-tool="${name}"><svg aria-hidden="true">`));
    assert.ok(app.includes(`'${name}':'<`),`${name} has no vector path`);
  }
  assert.match(app,/class="fc-floor-icon"/);
  assert.match(app,/class="floor-scheme-svg"/);
  assert.doesNotMatch(app,/function markerIcon\(t\)/);
});
