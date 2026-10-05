const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Demo=require('../assets/preview-demo-v31');
const Scene=require('../assets/scene32');
const Resident=require('../assets/v34-v3');
const Entry=require('../assets/field-entry-core');
const Training=require('../assets/training-core');

const deepFreeze=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);
    for(const child of Object.values(value))deepFreeze(child);
  }
  return value;
};
const profile={id:'must-not-copy-real-id',callName:'must-not-copy-real-name',email:'must-not-copy@example.test',brigade:'第三大隊'};
const floor4=c=>c.buildingOps.floorActions.find(row=>row.floor===4);
const normalize=value=>JSON.parse(JSON.stringify(value).replaceAll(Demo.IDS.live,'CASE').replaceAll(Demo.IDS.practice,'CASE'));

for(const mode of ['live','practice']){
  test(`${mode}: fixed synthetic case has complete collections and four floors`,()=>{
    const c=Demo.createCase(mode,profile);
    assert.equal(c.id,Demo.IDS[mode]);
    assert.ok(Demo.isDemoCase(c));
    assert.equal(c.synthetic,true);
    assert.equal(c.localOnly,true);
    assert.equal(c.address,Demo.ADDRESS);
    assert.match(c.address,/虛構.*非真實地址/);
    assert.equal(c.floors,4);
    assert.deepEqual(c.buildingOps.levels,[4,3,2,1]);
    assert.equal(c.vehicles.length,2);
    assert.equal(c.crews.length,2);
    for(const key of ['hoses','hazards','sitreps','logs','players','simulationEvents','practiceResponses','practiceMessages','hazardReferences','intakeEvents'])assert.ok(Array.isArray(c[key]),key);
    assert.doesNotMatch(JSON.stringify(c),/must-not-copy/);
    assert.equal(c.createdBy,'demo-user');
    assert.equal(c.createdAt,Demo.FIXED_AT);
    assert.equal(c.brigade,profile.brigade);
  });

  test(`${mode}: resident unknown count stays null and never becomes zero`,()=>{
    const rows=floor4(Demo.createCase(mode)).residents;
    assert.equal(rows.length,2);
    assert.notEqual(rows[0].id,rows[1].id);
    assert.equal(rows[0].maleCount,2);
    assert.equal(rows[0].femaleCount,3);
    assert.equal(rows[0].totalCount,5);
    assert.equal(rows[0].status,'已疏散');
    assert.equal(rows[1].maleCount,null);
    assert.equal(rows[1].femaleCount,2);
    assert.equal(rows[1].totalCount,null);
    assert.equal(Resident.residentTotal(rows[1].maleCount,rows[1].femaleCount),null);
    assert.deepEqual(Resident.floorResidentSummary(rows),{households:2,knownTotal:5,confirmedMinimum:7,pending:1});
  });

  test(`${mode}: fixture renders manual markers, SOP-derived command zone and valid hose`,()=>{
    const c=Demo.createCase(mode),s=Scene.build(c,c,{all:true});
    assert.equal(s.nodes.filter(n=>n.coll==='vehicles').length,2);
    assert.equal(s.nodes.filter(n=>n.coll==='crews').length,2);
    assert.equal(s.nodes.filter(n=>n.coll==='hazards').length,4);
    const command=s.nodes.find(n=>n.id==='zone32_command');
    assert.ok(command);
    assert.equal(command.item.derived,'SOP');
    assert.equal(command.item.face,'第一面');
    assert.equal(c.hazards.some(h=>['指揮站','前進指揮所'].includes(h.type)),false);
    assert.equal(s.lines.length,1);
    assert.equal(s.lines[0].sourceId,c.vehicles[1].id);
    assert.equal(s.lines[0].item.targetId,c.vehicles[0].id);
    assert.equal(s.far.length,0);
    assert.match(Scene.svg(s),/scene-fire/);
    assert.deepEqual(Entry.summary(c.crews),{units:2,known:4,pending:1});
  });

  test(`${mode}: confirmed patients have explicit, independent statuses`,()=>{
    const c=Demo.createCase(mode),patients=c.sitreps.filter(r=>r.patient);
    assert.equal(patients.length,2);
    assert.deepEqual(patients.map(r=>r.patient.status),['已救出','輕傷']);
    assert.ok(patients.every(r=>/虛構/.test(r.patient.name)));
    assert.ok(patients.every(r=>r.category==='傷/患者狀況回報'));
    assert.ok(patients.every(r=>r.eventAt===Demo.FIXED_AT&&r.submittedAt===Demo.FIXED_AT));
    assert.equal(patients.some(r=>/死亡|送醫/.test(r.patient.status)),false);
  });

  test(`${mode}: all seeded photos are marked local and strictly recognized synthetic vector placeholders`,()=>{
    const c=Demo.createCase(mode);
    const photos=[c.contacts[0],c.hazardRecord,c.hazardRecord.contactInfo,floor4(c).residents[0]];
    for(const item of photos){
      assert.equal(item.photoStatus,'local-demo');
      assert.ok(Demo.isDemoPhoto(item.photoPath));
      assert.match(item.photoPath,/^data:image\/svg\+xml;charset=utf-8,/);
      const svg=decodeURIComponent(item.photoPath.split(',')[1]);
      assert.match(svg,/SYNTHETIC DEMO/);
      assert.match(svg,/NOT A REAL PHOTO/);
      assert.doesNotMatch(svg,/<script|<image|<foreignObject|\bonload=|\bhref=/i);
    }
    assert.equal(Demo.isDemoPhoto('https://example.test/photo.png'),false);
    assert.equal(Demo.isDemoPhoto('data:image/svg+xml,<svg onload="bad()"/>'),false);
    assert.equal(Demo.isDemoPhoto('case-private/real-case/photo'),false);
  });
}

test('live and practice share the same operational schema and content',()=>{
  const [live,practice]=Demo.createCases(profile);
  for(const key of ['address','floors','buildingOps','vehicles','crews','hoses','hazards','sitreps','contacts','hazardRecord','firstSideNote','tacticalZones']){
    assert.deepEqual(normalize(live[key]),normalize(practice[key]),key);
  }
  assert.deepEqual(practice.training,Training.initial());
  assert.equal(practice.practiceStatus,'waiting');
  assert.equal(practice.hostUid,Demo.DEMO_UID);
  assert.equal(practice.instructorMode,'ai');
  assert.equal(practice.players[0].role,'現場指揮官');
  assert.ok(practice.simulationEvents.every(e=>e.released===false));
  assert.ok(Training.transition(practice.training,{type:'start'},practice.simulationEvents,Demo.FIXED_AT));
});

test('fixtures are deterministic and each call returns independent mutable records',()=>{
  const a=Demo.createCases(profile),b=Demo.createCases(profile);
  assert.deepEqual(a,b);
  assert.notEqual(a[0],b[0]);
  a[0].crews[0].count=99;
  floor4(a[0]).residents[0].maleCount=99;
  assert.equal(b[0].crews[0].count,4);
  assert.equal(floor4(b[0]).residents[0].maleCount,2);
  assert.equal(floor4(a[1]).residents[0].maleCount,2);
  for(const c of b){
    const records=[...c.vehicles,...c.crews,...c.hoses,...c.hazards,...c.sitreps,...c.contacts,...c.buildingOps.planMarkers,...floor4(c).residents,...c.players,...c.simulationEvents,...c.logs];
    assert.equal(new Set(records.map(r=>r.id)).size,records.length);
    assert.ok(records.every(r=>r.id.startsWith(c.id+'_')));
  }
});

test('seed is non-mutating and idempotent, preserving unrelated state and edited fixtures',()=>{
  const ordinary={id:'keep-real-case',notes:'unchanged',crews:[{id:'keep-crew'}]},state=deepFreeze({profile:{name:'original'},cases:[ordinary],settings:{zoom:12},futureSchema:{keep:true}});
  const next=Demo.seed(state,profile);
  assert.notEqual(next,state);
  assert.equal(state.cases.length,1);
  assert.equal(next.profile,state.profile);
  assert.equal(next.settings,state.settings);
  assert.equal(next.futureSchema,state.futureSchema);
  assert.equal(next.cases[0],ordinary);
  assert.equal(next.cases.length,3);
  next.cases[1].notes='user edited demo';
  const again=Demo.seed(deepFreeze(next),profile);
  assert.equal(again.cases.length,3);
  assert.equal(again.cases[1],next.cases[1]);
  assert.equal(again.cases[1].notes,'user edited demo');
});

test('reset restores only owned fixture cases and preserves current observer role and room ownership',()=>{
  const untouched={id:'another-case',previewDemo:Demo.MARKER,nested:{value:7}},state=Demo.seed({cases:[untouched],profile:{id:'do-not-touch'},extra:42});
  const live=state.cases.find(c=>c.id===Demo.IDS.live),practice=state.cases.find(c=>c.id===Demo.IDS.practice);
  live.crews=[];
  floor4(live).residents=[];
  practice.players[0].role='觀察員';
  practice.hostUid='different-host';
  practice.instructorUid='different-instructor';
  practice.instructorMode='human';
  const reset=Demo.reset(deepFreeze(state));
  assert.equal(reset.cases[0],untouched);
  assert.equal(reset.profile,state.profile);
  assert.equal(reset.extra,42);
  const freshLive=reset.cases.find(c=>c.id===Demo.IDS.live),freshPractice=reset.cases.find(c=>c.id===Demo.IDS.practice);
  assert.equal(freshLive.crews.length,2);
  assert.equal(floor4(freshLive).residents.length,2);
  assert.equal(live.crews.length,0);
  assert.deepEqual(freshPractice.players,practice.players);
  assert.notEqual(freshPractice.players,practice.players);
  assert.equal(freshPractice.players[0].role,'觀察員');
  assert.equal(freshPractice.hostUid,'different-host');
  assert.equal(freshPractice.instructorUid,'different-instructor');
  assert.equal(freshPractice.instructorMode,'human');
});

test('missing demo cases are recreated but matching unmarked IDs are never overwritten',()=>{
  assert.equal(Demo.seed({profile:null}).cases.length,2);
  assert.equal(Demo.reset({cases:[]}).cases.length,2);
  for(const action of [Demo.seed,Demo.reset])for(const previewDemo of [undefined,'other-marker']){
    const protectedCase={id:Demo.IDS.live,previewDemo,secret:'preserve'},state=deepFreeze({cases:[protectedCase]});
    assert.throws(()=>action(state),/ID.*衝突/);
    assert.equal(state.cases[0],protectedCase);
  }
  assert.equal(Demo.isDemoCase({id:Demo.IDS.live}),false);
  assert.equal(Demo.isDemoCase({id:'unrelated',previewDemo:Demo.MARKER}),false);
});

test('invalid input fails without silently discarding malformed stored data',()=>{
  for(const invalid of [null,undefined,[],false])assert.throws(()=>Demo.seed(invalid),TypeError);
  for(const invalid of [null,{},'broken'])assert.throws(()=>Demo.reset({cases:invalid}),TypeError);
  for(const mode of ['production','',null,'__proto__'])assert.throws(()=>Demo.createCase(mode),TypeError);
});

test('browser module loads without storage, DOM, Firebase, network, clocks or randomness',()=>{
  const fail=()=>{throw Error('Unexpected side effect');};
  const context=vm.createContext({window:{},localStorage:{getItem:fail,setItem:fail},document:new Proxy({},{get:fail}),fetch:fail,firebase:new Proxy({},{get:fail}),Date:new Proxy({},{get:fail}),Math:Object.assign(Object.create(Math),{random:fail})});
  vm.runInContext(fs.readFileSync(require.resolve('../assets/preview-demo-v31.js'),'utf8'),context);
  assert.ok(context.window.FCPreviewDemoV31);
  const result=context.window.FCPreviewDemoV31.seed({cases:[]});
  assert.equal(result.cases.length,2);
  assert.equal(result.cases[0].createdAt,Demo.FIXED_AT);
});

test('only case brigade follows visibility scope; sample resource units keep their valid brigade',()=>{
  const c=Demo.createCase('live',{brigade:'第一大隊'});
  assert.equal(c.brigade,'第一大隊');
  assert.ok([...c.vehicles,...c.crews,...c.sitreps].every(r=>r.brigade==='第三大隊'));
});
