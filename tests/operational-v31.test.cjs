const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Ops=require('../assets/operational-v31');
const sitrep=(patient,extra={})=>({patient,...extra});
const known=(id,status,extra={})=>sitrep({id,name:'測試患者',gender:'男',foundAt:'4F',status,...extra});
const building=(residents,action='未標示')=>({buildingOps:{floorActions:[{floor:4,action,residents}]}});
const lines=(c={},sitreps=[])=>Ops.buildSituationLines(c,{sitreps});

// These are runtime assertions of complete expected results, not source/regex checks.
test('D2 known mild/severe patients and legacy confirmed transport all appear without households',()=>{
  assert.deepEqual(lines({},[known('p1','輕傷'),known('p2','重傷',{note:'已送醫'})]),[
    '患者回報：輕傷 1 人。','患者回報：重傷 1 人。','患者回報：已送醫 1 人（與患者狀況可能重疊，不另加總）。'
  ]);
});
test('D2 rescued patient alone produces a nonempty situation summary',()=>{
  assert.deepEqual(lines({},[known('p1','已救出')]),['患者回報：已救出 1 人。']);
});
test('D2 each supported patient status has a grounded count',()=>{
  assert.deepEqual(lines({},['已救出','輕傷','重傷','OHCA','死亡','待救援','已疏散'].map((status,i)=>known(`p${i}`,status))),[
    '患者回報：已救出 1 人。','患者回報：輕傷 1 人。','患者回報：重傷 1 人。','患者回報：OHCA 1 人。','患者回報：死亡 1 人。','患者回報：待救援 1 人。','患者回報：已疏散 1 人。'
  ]);
});
test('D2 an explicitly transported patient with no clinical status is represented',()=>{
  assert.deepEqual(lines({},[known('p1','送醫')]),['患者回報：已送醫 1 人（與患者狀況可能重疊，不另加總）。']);
});
test('D2 conflicting historical transport-only status and explicit unknown never hides the patient',()=>{
  assert.deepEqual(lines({},[known('p1','送醫',{transportStatus:'unknown'})]),['患者回報：狀況待確認 1 人。']);
});
test('D2 transport status enum is authoritative, including unknown and negative choices',()=>{
  for(const transportStatus of ['unknown','not-transported','planned','未送醫','待送醫','預計送醫','',null]){
    assert.deepEqual(lines({},[known('p1','輕傷',{transportStatus,note:'已送醫'})]),['患者回報：輕傷 1 人。'],String(transportStatus));
  }
  for(const transportStatus of ['transported','已送醫']){
    assert.deepEqual(lines({},[known('p1','輕傷',{transportStatus,note:'尚未更新備註'})]),['患者回報：輕傷 1 人。','患者回報：已送醫 1 人（與患者狀況可能重疊，不另加總）。']);
  }
});
test('D2 legacy affirmative transport clauses are narrowly accepted',()=>{
  for(const note of ['已送醫','已送醫。','已送醫，生命徵象穩定','患者已送醫','傷患：已送醫']){
    assert.equal(Ops.legacyTransportConfirmed(note),true,note);
    assert.deepEqual(Ops.getPatientSummaries([known('p','重傷',{note})]).transported,{people:1,reports:0},note);
  }
});
for(const note of ['未送醫','尚未送醫','尚未確認是否已送醫','預計送醫','预計已送醫','預計已送醫','預定已送醫','疑似已送醫','可能已送醫','待確認已送醫','已送醫？','已送醫待確認','並非已送醫','不是已送醫','未證實已送醫','將已送醫','無法送醫','計畫已送醫','家屬已送醫','他人已送醫','一人已送醫','送醫','送往醫院','已送醫院？','「已送醫」','原報已送醫；更正未送醫','已送醫；尚未確認','已送醫但尚未出發']){
  test(`D2 legacy transport must not confirm: ${note}`,()=>{
    assert.deepEqual(lines({},[known('p','輕傷',{note})]),['患者回報：輕傷 1 人。']);
  });
}
test('D2 unconfirmed status text is not turned into a confirmed diagnosis or rescue',()=>{
  for(const status of ['疑似輕傷','預計已救出','可能OHCA','未死亡','尚未送醫','疑似有人受困'])assert.deepEqual(lines({},[known('p',status)]),['患者回報：狀況待確認 1 人。'],status);
});
test('D2 stable patient id or patientId deduplicates repeated reports',()=>{
  const reports=[known('p','輕傷'),sitrep({patientId:'p',status:'輕傷'})];
  assert.deepEqual(lines({},reports),['患者回報：輕傷 1 人。']);
  assert.equal(Ops.getLatestPatients(reports).length,1);
});
test('D2 latest event wins over later-uploaded backfills and uses submittedAt to break event ties',()=>{
  const reports=[
    {...known('p','已救出'),id:'r1',eventAt:100,submittedAt:400},
    {...known('p','重傷',{transportStatus:'planned'}),id:'r2',eventAt:300,submittedAt:301},
    {...known('p','OHCA',{transportStatus:'transported'}),id:'r3',eventAt:300,submittedAt:350},
    {...known('p','輕傷'),id:'r4',eventAt:200,submittedAt:999}
  ];
  assert.deepEqual(lines({},reports),['患者回報：OHCA 1 人。','患者回報：已送醫 1 人（與患者狀況可能重疊，不另加總）。']);
  assert.deepEqual(Ops.getLatestPatients(reports),[{key:'id:p',patient:{id:'p',name:'測試患者',gender:'男',foundAt:'4F',status:'OHCA',transportStatus:'transported'},identityKind:'id',eventAt:300,submittedAt:350,sourceId:'r3'}]);
  assert.deepEqual(lines({},reports.slice().reverse()),lines({},reports));
});
test('D2 status transitions retain only latest outcome and explicit transport choice',()=>{
  assert.deepEqual(lines({},[
    {...known('p','輕傷',{note:'已送醫'}),eventAt:1},
    {...known('p','死亡',{transportStatus:'not-transported'}),eventAt:2}
  ]),['患者回報：死亡 1 人。']);
});
test('D2 timestamps support submitted-only, Firestore, Date, and ISO input',()=>{
  assert.equal(Ops.getLatestPatients([
    {...known('p','輕傷'),submittedAt:100},
    {...known('p','重傷'),eventAt:{seconds:1,nanoseconds:1},submittedAt:1100},
    {...known('p','OHCA'),eventAt:new Date(2000)},
    {...known('p','死亡'),eventAt:'1970-01-01T00:00:03.000Z'}
  ])[0].patient.status,'死亡');
  assert.equal(Ops.getLatestPatients([{...known('p','重傷'),eventAt:{toMillis:()=>5000}}, {...known('p','輕傷'),eventAt:4000}])[0].patient.status,'重傷');
});
test('D2 safe legacy name/gender/location repeats deduplicate and later explicit ID joins',()=>{
  const patient={name:'王小明',gender:'男',foundAt:'4F後房'};
  const reports=[sitrep({...patient,status:'輕傷'},{eventAt:1}),sitrep({...patient,status:'重傷'},{eventAt:2})];
  assert.deepEqual(lines({},reports),['患者回報：重傷 1 人。']);
  assert.equal(Ops.getLatestPatients(reports)[0].identityKind,'legacy');
  reports.push(sitrep({...patient,id:'p1',status:'死亡'},{eventAt:3}));
  assert.deepEqual(lines({},reports),['患者回報：死亡 1 人。']);
});
test('D2 two explicit IDs never merge because a name/gender/location happens to match',()=>{
  const patient={name:'王小明',gender:'男',foundAt:'4F後房',status:'輕傷'};
  const reports=[sitrep({...patient,id:'p1'}),sitrep({...patient,id:'p2'}),sitrep(patient,{id:'legacy'})];
  assert.deepEqual(lines({},reports),['患者回報：輕傷 2 人；另有 1 筆身分待核對回報。','患者身分待核對：1 筆回報；尚無法確認不重複人數。']);
});
test('D2 unknown names, gender, location, and generic honorifics stay report counts',()=>{
  for(const patient of [
    {name:'姓名未明',gender:'男',foundAt:'4F'},
    {name:'王小明',gender:'未知',foundAt:'4F'},
    {name:'王小明',gender:'男',foundAt:'地點未明'},
    {name:'王先生',gender:'男',foundAt:'4F'},
    {name:'王小明',gender:'男',foundAt:'疑似4F'},
    {name:'姓名待補',gender:'男',foundAt:'4F'},
    {name:'無',gender:'男',foundAt:'4F'},
    {name:'王小明',gender:'男',foundAt:'未提供'},
    {}
  ])assert.deepEqual(lines({},[sitrep({...patient,status:'輕傷'},{id:'a'}),sitrep({...patient,status:'輕傷'},{id:'b'})]),['患者回報：輕傷 2 筆身分待核對回報。','患者身分待核對：2 筆回報；尚無法確認不重複人數。']);
});
test('D2 duplicate delivery of one unresolved sitrep ID remains one report, not one person',()=>{
  const report=sitrep({status:'OHCA'},{id:'r1'});
  assert.deepEqual(lines({},[report,report]),['患者回報：OHCA 1 筆身分待核對回報。','患者身分待核對：1 筆回報；尚無法確認不重複人數。']);
});
test('D2 selected legacy patient key remains stable after name or location edits',()=>{
  const old=sitrep({name:'王小明',gender:'男',foundAt:'4F',status:'輕傷'},{eventAt:1,id:'r1'});
  const key=Ops.getLatestPatients([old])[0].key;
  const updated=sitrep({id:key,name:'王大明',gender:'男',foundAt:'3F',status:'重傷'},{eventAt:2,id:'r2'});
  assert.deepEqual(lines({},[old,updated]),['患者回報：重傷 1 人。']);
  assert.equal(Ops.getLatestPatients([old,updated])[0].key,key);
});
test('D2 selecting one unresolved report promotes only its stable report key',()=>{
  const old=sitrep({name:'姓名未明',status:'輕傷'},{eventAt:1,id:'r1'});
  const other=sitrep({name:'姓名未明',status:'輕傷'},{eventAt:1,id:'r2'});
  const key=Ops.getLatestPatients([old])[0].key;
  assert.deepEqual(lines({},[old,other,sitrep({id:key,status:'重傷'},{eventAt:2,id:'r3'})]),['患者回報：輕傷 1 筆身分待核對回報。','患者回報：重傷 1 人。','患者身分待核對：1 筆回報；尚無法確認不重複人數。']);
});
test('D2 evacuated household retains both known people and household count',()=>{
  assert.deepEqual(lines(building([{id:'h1',maleCount:2,femaleCount:3,status:'已疏散'}])),[
    '住戶紀錄：已疏散 5 人（1 戶）。','建物住戶已記錄 1 戶；已確認 5 人。','4F：已記錄 1 戶，已確認 5 人。'
  ]);
});
test('D2 unknown male with two females is a lower bound, never a complete total',()=>{
  assert.deepEqual(lines(building([{id:'h1',maleCount:null,femaleCount:2,status:'已救出'}])),[
    '住戶紀錄：已救出 至少 2 人（1 戶；1 戶人數未完整）。','建物住戶已記錄 1 戶；已確認至少 2 人，1 戶人數待確認。','4F：已記錄 1 戶，已確認至少 2 人，1 戶人數待確認。'
  ]);
});
test('D2 unknown household population is not reported as zero',()=>{
  assert.deepEqual(lines(building([{id:'h1',maleCount:null,femaleCount:null,status:'已疏散',totalCount:0}])),[
    '住戶紀錄：已疏散 人數待確認（1 戶；1 戶人數未完整）。','建物住戶已記錄 1 戶；1 戶人數待確認。','4F：已記錄 1 戶，1 戶人數待確認。'
  ]);
});
test('D2 explicit zero is valid; null overrides stale legacy male/female fields',()=>{
  assert.deepEqual(lines(building([{id:'h1',maleCount:0,femaleCount:0}])),['建物住戶已記錄 1 戶；已確認 0 人。','4F：已記錄 1 戶，已確認 0 人。']);
  assert.deepEqual(lines(building([{id:'h1',maleCount:null,male:9,femaleCount:2}])),['建物住戶已記錄 1 戶；已確認至少 2 人，1 戶人數待確認。','4F：已記錄 1 戶，已確認至少 2 人，1 戶人數待確認。']);
});
test('D2 invalid/whitespace/boolean counts remain unknown, and legacy count fields still work',()=>{
  for(const maleCount of [' ',false,-1,1.5,'未知',{},Infinity])assert.deepEqual(lines(building([{maleCount,femaleCount:2}])),['建物住戶已記錄 1 戶；已確認至少 2 人，1 戶人數待確認。','4F：已記錄 1 戶，已確認至少 2 人，1 戶人數待確認。']);
  assert.deepEqual(lines(building([{male:2,female:3}])),['建物住戶已記錄 1 戶；已確認 5 人。','4F：已記錄 1 戶，已確認 5 人。']);
});
test('D2 repeated household IDs use latest values once, even across floors',()=>{
  const caseRecord={buildingOps:{floorActions:[
    {floor:3,residents:[{id:'h1',maleCount:2,femaleCount:3,status:'已疏散',updatedAt:1}]},
    {floor:4,residents:[{householdId:'h1',maleCount:1,femaleCount:1,status:'已救出',updatedAt:2}]}
  ]}};
  assert.deepEqual(lines(caseRecord),['住戶紀錄：已救出 2 人（1 戶）。','建物住戶已記錄 1 戶；已確認 2 人。','4F：已記錄 1 戶，已確認 2 人。']);
});
test('D2 household and patient reports are explicitly separated, never summed',()=>{
  assert.deepEqual(lines(building([{id:'h1',maleCount:2,femaleCount:3,status:'已疏散'}]),[known('p1','已疏散')]),[
    '住戶與患者為不同來源回報，可能指向同一人；以下分列，不合併人數。',
    '住戶紀錄：已疏散 5 人（1 戶）。','患者回報：已疏散 1 人。','建物住戶已記錄 1 戶；已確認 5 人。','4F：已記錄 1 戶，已確認 5 人。'
  ]);
});
test('D2 household transport/death disposition does not imply all household members share it',()=>{
  assert.deepEqual(lines(building([{id:'h1',maleCount:2,femaleCount:3,status:'送醫'},{id:'h2',maleCount:1,femaleCount:2,status:'死亡'}])),[
    '住戶紀錄：送醫 1 戶（送醫人數待確認）。','住戶紀錄：死亡 1 戶（死亡人數待確認）。','建物住戶已記錄 2 戶；已確認 8 人。','4F：已記錄 2 戶，已確認 8 人。'
  ]);
});
test('D2 floor searches without residents produce an appropriate nonempty summary',()=>{
  assert.deepEqual(lines({buildingOps:{floorActions:[{floor:3,action:'搜索中',residents:[]},{floor:-1,action:'搜索救援'}]}}),[
    '3F：樓層作戰狀態為搜索中；尚未登錄住戶資料。','B1：樓層作戰狀態為搜索救援；尚未登錄住戶資料。'
  ]);
});
test('D2 floor evacuation state never infers household or person evacuation completion',()=>{
  assert.deepEqual(lines(building([{id:'h1',maleCount:1,femaleCount:2}],'疏散離開')),['建物住戶已記錄 1 戶；已確認 3 人。','4F：已記錄 1 戶，已確認 3 人；樓層作戰狀態：疏散離開。']);
});
test('D2 floor status duplicates use the latest entry without repeated summaries',()=>{
  assert.deepEqual(lines({buildingOps:{floorActions:[{floor:3,action:'搜索完成',updatedAt:2},{floor:3,action:'搜索中',updatedAt:1}]}}),['3F：樓層作戰狀態為搜索完成；尚未登錄住戶資料。']);
});
test('D2 no operational data returns no lines, including free notes and malformed arrays',()=>{
  for(const caseRecord of [{},null,{buildingOps:{floorActions:[]}},{buildingOps:{floorActions:[{floor:4,action:'未標示',residents:[],note:'電話0912345678'}]}},{buildingOps:{floorActions:'bad'}}])assert.deepEqual(lines(caseRecord),[]);
  assert.deepEqual(Ops.buildSituationLines({},null),[]);
  assert.deepEqual(Ops.buildSituationLines({}, {sitreps:[null,{}, {patient:null},{patient:[]}]}),[]);
});
test('D2 trapped uncertainty is not converted into a known count',()=>{
  assert.deepEqual(lines({trapped:'有',trappedCount:null}),['已確認有人受困，人數待確認。']);
  assert.deepEqual(lines({trapped:'有',trappedCount:2}),['已確認受困 2 人。']);
  assert.deepEqual(lines({trapped:'疑似',trappedCount:1}),[]);
  assert.deepEqual(lines({trapped:'無'}),['目前確認無人受困。']);
});
test('D2 overview does not echo phones, photos, names, addresses, full notes, or arbitrary actions',()=>{
  const caseRecord=building([{id:'h1',contact:'PRIVATE_NAME',phone:'0912345678',address:'PRIVATE_ADDRESS',photoPath:'private/photo.jpg',note:'PRIVATE_RESIDENT_NOTE',maleCount:2,femaleCount:3}], 'PRIVATE_ACTION_PHONE_0912345678');
  caseRecord.buildingOps.floorActions[0].note='PRIVATE_FLOOR_NOTE_0987654321';
  const patient=known('p1','輕傷',{name:'PRIVATE_PATIENT',phone:'0900000000',photo:'private/patient.jpg',note:'已送醫；PRIVATE_PATIENT_NOTE'});
  assert.deepEqual(lines(caseRecord,[patient]),[
    '住戶與患者為不同來源回報，可能指向同一人；以下分列，不合併人數。','患者回報：輕傷 1 人。','患者回報：已送醫 1 人（與患者狀況可能重疊，不另加總）。','建物住戶已記錄 1 戶；已確認 5 人。','4F：已記錄 1 戶，已確認 5 人。'
  ]);
});
test('N1 same synthetic inputs produce identical live and practice summaries without mutation',()=>{
  const data=building([{id:'h1',maleCount:null,femaleCount:2,status:'已救出'}],'搜索救援');
  const live={sitreps:[known('p1','重傷',{transportStatus:'transported'}),sitrep({status:'OHCA'},{id:'r2'})]};
  const snapshot=JSON.stringify({data,live});
  assert.deepEqual(Ops.buildSituationLines({...data,mode:'live'},live),Ops.buildSituationLines({...data,mode:'practice'},live));
  assert.equal(JSON.stringify({data,live}),snapshot);
});
test('D2 browser global and CommonJS expose the same pure API and output',()=>{
  const context=vm.createContext({window:{}});
  vm.runInContext(fs.readFileSync(require.resolve('../assets/operational-v31'),'utf8'),context);
  assert.deepEqual(Object.keys(context.window.FCOperationalV31),Object.keys(Ops));
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.FCOperationalV31.buildSituationLines({}, {sitreps:[known('p','輕傷')]}))),['患者回報：輕傷 1 人。']);
});
