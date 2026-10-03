'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {app}=require('./app-harness.cjs'),Demo=require('../assets/preview-demo-v31'),Ops=require('../assets/operational-v31');
const run=(c,s)=>vm.runInContext(s,c),clone=x=>JSON.parse(JSON.stringify(x));
function setup(verified=true){const c=app();c.location=c.window.location;c.confirm=()=>true;run(c,`previewTargetVerifiedV31=${verified};enterApp=()=>{};show=()=>{};renderCases=()=>{};renderDetail=()=>{};renderBuildingOps=()=>{};renderArrivalStatusCards=()=>{};scheduleDerivedSummaryPersist=()=>{};clearIntake28=()=>{};switchCasePage=()=>{};updateMapUndoButton=()=>{};renderPendingDeploymentVehicles=()=>{};setAdminPendingBadge=()=>{};localState={profile:{id:'real-profile',brigade:'第一大隊',role:'observer',status:'pending',custom:'KEEP'},cases:[{id:'existing-third',brigade:'第三大隊',mode:'live',notes:'KEEP'}]};`);return c;}

test('server enables only exact authorized Preview branch, never client supplied env/query',async()=>{
 const {default:handler}=await import('../api/preview-mode.js');const oldEnv=process.env.VERCEL_ENV,oldRef=process.env.VERCEL_GIT_COMMIT_REF;
 try{for(const env of ['preview','production','development','PREVIEW','',undefined])for(const branch of ['feature/v34-2-field-revision-v3-1','main','master','another-branch',undefined]){
  if(env===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=env;
  if(branch===undefined)delete process.env.VERCEL_GIT_COMMIT_REF;else process.env.VERCEL_GIT_COMMIT_REF=branch;
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(s){this.code=s;return this;},json(data){this.data=data;return this;}};
  handler({method:'GET',query:{target:'preview',demoEnabled:'true'},headers:{'x-vercel-env':'preview'}},res);
  assert.equal(res.data.demoEnabled,env==='preview'&&branch==='feature/v34-2-field-revision-v3-1',`${env}/${branch}`);
  assert.deepEqual(Object.keys(res.data).sort(),['demoEnabled','target']);assert.equal(res.code,200);
  for(const name of ['Cache-Control','Vercel-CDN-Cache-Control','CDN-Cache-Control'])assert.match(res.headers[name],/no-store/);
 }
 const res={setHeader(){},status(n){this.code=n;return this;},json(data){this.data=data;}};handler({method:'POST'},res);assert.equal(res.code,405);assert.equal(res.data.demoEnabled,false);
 }finally{if(oldEnv===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=oldEnv;if(oldRef===undefined)delete process.env.VERCEL_GIT_COMMIT_REF;else process.env.VERCEL_GIT_COMMIT_REF=oldRef;}
});
test('client metadata failure, development, main-preview deny and Production aliases fail closed for demo',async()=>{
 for(const response of [null,{}, {target:'preview',demoEnabled:false},{target:'development',demoEnabled:true},{target:'production',demoEnabled:true},{target:'unknown',demoEnabled:true},{target:'preview',demoEnabled:'true'}]){
  const c=setup(false);c.fetch=async()=>{if(response===null)throw Error('offline');return {ok:true,json:async()=>response};};
  const before=run(c,'JSON.stringify(localState)');await c.initFirebase();c.loginDemo();
  assert.equal(run(c,'previewTargetVerifiedV31'),false,JSON.stringify(response));assert.equal(c.document.getElementById('demoLoginBtn').hidden,true);assert.equal(run(c,'JSON.stringify(localState)'),before);
 }
});
test('verified exact Preview response permits fixture-only entry and rechecks on reload',async()=>{
 const c=setup(false),requests=[];c.fetch=async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({target:'preview',demoEnabled:true})};};
 await c.initFirebase();assert.equal(c.document.getElementById('demoLoginBtn').hidden,false);assert.equal(run(c,'previewTargetVerifiedV31'),true);c.loginDemo();
 assert.equal(run(c,'currentCase.id'),Demo.IDS.live);assert.equal(requests[0].url,'/api/preview-mode');assert.equal(requests[0].options.cache,'no-store');
 c.fetch=async()=>({ok:false});await c.initFirebase();assert.equal(run(c,'previewTargetVerifiedV31'),false);assert.equal(c.document.getElementById('demoLoginBtn').hidden,true);
});
test('demo quick edit, full profile Save, logout and reentry preserve original profile and store names separately',async()=>{
 const c=setup(),before=run(c,'JSON.stringify(localState.profile)');c.loginDemo();
 run(c,`$('quickFireCallSign').value='DEMO EDIT';$('quickCallName').value='Edited Demo';`);await c.saveQuickProfile();
 assert.equal(run(c,'JSON.stringify(localState.profile)'),before);assert.deepEqual(clone(run(c,'localState.previewDemoProfile')),{callName:'Edited Demo',fireCallSign:'DEMO EDIT'});
 for(const [id,value]of Object.entries({profileRealName:'合成',profileCallName:'Full form demo',profileFireCallSign:'DEMO02',profileBrigade:'第三大隊',profileUnit:'淡水',profileTitle:'隊員',profileRole:'commander'}))c.document.getElementById(id).value=value;
 await c.saveProfile({preventDefault(){}});assert.equal(run(c,'JSON.stringify(localState.profile)'),before);
 await c.logout();assert.equal(run(c,'JSON.stringify(localState.profile)'),before);assert.equal(run(c,'localState.previewDemoSession.active'),false);
 c.loginDemo();assert.equal(run(c,'profile.callName'),'Full form demo');assert.equal(run(c,'profile.fireCallSign'),'DEMO02');assert.equal(run(c,'JSON.stringify(localState.profile)'),before);
 assert.equal(run(c,'profile.isSuperAdmin'),false);assert.deepEqual(Object.keys(run(c,'localState.previewDemoProfile')).sort(),['callName','fireCallSign']);
});
test('demo never lists or opens preexisting other-brigade/same-brigade cases; every persistence seam rejects nonfixture',async()=>{
 const c=setup();c.loginDemo();c.subscribeCases();assert.equal(run(c,"cases.some(row=>row.id==='existing-third')"),false);
 const active=run(c,'currentCaseId');c.openCase('existing-third');assert.equal(run(c,'currentCaseId'),active);
 assert.throws(()=>c.loadCaseLocal('existing-third'),/合成示範/);
 run(c,"currentCase=localState.cases.find(row=>row.id==='existing-third');currentCaseId=currentCase.id;");
 assert.throws(()=>c.saveLocalCase(),/合成示範/);assert.throws(()=>c.assertCaseEditor(),/合成示範/);
 await assert.rejects(c.patchCurrentCase({notes:'bad'}),/合成示範/);
 await assert.rejects(c.updateCaseSection('rev',()=>({notes:'bad'})),/合成示範/);
 await assert.rejects(c.addItem('vehicles',{name:'bad'}),/合成示範/);
 await assert.rejects(c.updateItem('vehicles','x',{name:'bad'}),/合成示範/);
 await assert.rejects(c.deleteMapRecordSilent('vehicles','x'),/合成示範/);
 assert.equal(run(c,"localState.cases.find(row=>row.id==='existing-third').notes"),'KEEP');
});
test('clinical-only editing preserves prior confirmed legacy transport and rejects ambiguous/negated text',async()=>{
 for(const note of ['已送醫','已送往測試醫院','尚未送醫','預計送醫','疑似已送醫','同戶另一人已送醫']){
  const c=app();run(c,`setPatientNow=()=>{};addLog=async()=>{};live.sitreps=[{id:'r1',eventAt:1,patient:{id:'p1',name:'合成人',gender:'男',foundAt:'4F',status:'輕傷',note:${JSON.stringify(note)}}}];$('patientRecordV31').value='id:p1';prefillPatientRecordV31();`);
  const expected=['已送醫','已送往測試醫院'].includes(note);assert.equal(c.document.getElementById('patientTransportV31').value,expected?'transported':'unknown');
  run(c,"$('patientStatus').value='重傷';");await c.addPatientSitrep();assert.equal(Ops.getPatientSummaries(clone(run(c,'live.sitreps'))).transported.people,expected?1:0);
 }
});
test('both prefilled modes exercise automatic address composition without repeating floor',()=>{
 for(const mode of ['live','practice'])for(const row of Demo.createCase(mode).buildingOps.floorActions[0].residents){assert.match(row.unitNo,/^[AB]戶$/);assert.equal(row.addressMode,'auto');assert.equal(row.address,Demo.ADDRESS+' '+row.unitNo+' 4F');}
});
test('demo cannot create unmarked cases or expose old cases through create/join paths',async()=>{
 const c=setup();c.loginDemo();c.subscribeCases();const before=run(c,'localState.cases.length');
 await c.createCase({preventDefault(){}});await c.createPracticeRoom();assert.equal(run(c,'localState.cases.length'),before);assert.equal(run(c,'currentCase.id'),Demo.IDS.practice);
 run(c,"cases.push(localState.cases.find(row=>row.id==='existing-third'));");
 await assert.rejects(c.joinPracticeCaseById('existing-third','現場指揮官'),/合成示範/);
 assert.equal(run(c,"localState.cases.find(row=>row.id==='existing-third').players"),undefined);assert.equal(run(c,"localState.cases.find(row=>row.id==='existing-third').notes"),'KEEP');
});
