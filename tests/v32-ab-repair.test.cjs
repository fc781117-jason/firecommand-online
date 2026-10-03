'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {app}=require('./app-harness.cjs'),A=require('../assets/assignment-v32'),O=require('../assets/operational-v32'),S=require('../assets/intake-semantic');
const read=c=>JSON.parse(vm.runInContext('JSON.stringify(live.crews)',c));
function harness(mode='live'){
  const c=app();c.clock=1000;c.Date=class extends Date{static now(){return c.clock;}};c.confirm=()=>true;c.FCV34V3=c.window.FCV34V3;
  c.mode=mode;vm.runInContext('currentCase.mode=mode;live.intakeEvents=[];',c);return c;
}
function crew(id,unit,status,task,face='第一面',floor='3F'){
  const base={id,unit,brigade:'第三大隊',leader:'',lat:25,lng:121,count:4,updatedAt:1000};
  return {...base,...A.transition(base,{status,task,face,floor},{id:'initial-'+id,crewId:id,at:1000})};
}
function seed(c,rows){c.rows=rows;vm.runInContext('live.crews=rows;',c);}
function field(c,row,task){
  c.expected={id:row.id,updatedAt:row.updatedAt};vm.runInContext('fieldCrewExpected=expected;',c);
  for(const [id,value]of Object.entries({fieldCrewBrigade:'第三大隊',fieldCrewUnit:row.unit,fieldCrewCount:'4',fieldCrewTask:task,fieldCrewFace:'第一面'}))c.document.getElementById(id).value=value;
}
for(const mode of ['live','practice']){
  test(`V3.2 ${mode}: personnel task switch creates search segment; count-only save retains it`,async()=>{
    const c=harness(mode),original=crew('c','淡水','作業中','滅火攻擊');seed(c,[original]);field(c,original,'人命搜救');
    c.clock=601000;await c.saveFieldCrew();let saved=read(c)[0];
    assert.equal(saved.status,'作業中');assert.equal(saved.taskSegments.length,2);assert.equal(saved.taskSegments[0].endedAt,601000);assert.equal(saved.taskSegments[1].task,'人命搜救');assert.equal(saved.taskSegments[1].startedAt,601000);
    assert.equal(saved.dispatchCount,1);c.clock=1201000;c.document.getElementById('fieldCrewCount').value='5';await c.saveFieldCrew();saved=read(c)[0];
    assert.equal(saved.count,5);assert.equal(saved.taskSegments.length,2);assert.equal(A.totals(saved,c.clock).workMs,1200000);
  });
  test(`V3.2 ${mode}: confirmed intake work → rest → search preserves ten-minute intervals`,async()=>{
    const c=harness(mode);seed(c,[crew('c','淡水','作業中','滅火攻擊')]);
    async function intake(task,id){
      const plan=S.compile([S.item('crew',{id,unit:'淡水',brigade:'第三大隊',number:null,task,reviewed:true})],{crews:read(c),vehicles:[],hoses:[]},{},[{unit:'淡水',brigade:'第三大隊'}]);
      assert.deepEqual(plan.issues,[]);c.event={id,caseId:'room',kind:'apply',authorUid:'owner',writes:plan.writes,createdAt:c.clock,summary:'合成任務回報'};
      await vm.runInContext('commitIntake28(event,intakeRevision28())',c);
    }
    c.clock=601000;await intake('休息','rest');let saved=read(c)[0];
    assert.equal(saved.status,'休息');assert.equal(saved.taskSegments.at(-1).source,'confirmed-intake');
    assert.equal(A.totals(saved,1201000).workMs,600000);assert.equal(A.totals(saved,1201000).rehabMs,600000);
    c.clock=1201000;await intake('人命搜救','search');saved=read(c)[0];
    assert.equal(saved.status,'作業中');assert.equal(saved.taskSegments.length,3);assert.equal(saved.dispatchCount,2);
    assert.equal(A.totals(saved,1801000).workMs,1200000);assert.equal(A.totals(saved,1801000).rehabMs,600000);
    const before=JSON.stringify(saved);await vm.runInContext('commitIntake28(event,intakeRevision28())',c);assert.equal(JSON.stringify(read(c)[0]),before);
  });
  test(`V3.2 ${mode}: rotation copies assignment and undo appends history without overwriting later count edits`,async()=>{
    const c=harness(mode),initial=[crew('a','淡水','待命','待命','第二面','1F'),crew('b','竹圍','作業中','滅火攻擊')];seed(c,initial);
    vm.runInContext("live.hoses=[{id:'h',targetType:'crew',targetId:'b',targetName:'竹圍',owner:'竹圍'}]",c);
    let undo;c.pushMapUndo=(label,fn)=>undo=fn;c.clock=601000;await c.handleCrewDragEnd(initial[0],{lat:25,lng:121});
    let rows=read(c);assert.equal(rows[0].face,'第一面');assert.equal(rows[0].floor,'3F');assert.equal(rows[0].taskSegments.at(-1).face,'第一面');assert.equal(rows[0].taskSegments.at(-1).floor,'3F');
    assert.equal(rows[1].status,'休息');assert.equal(vm.runInContext('live.hoses[0].targetId',c),'a');
    c.clock=901000;await c.updateItem('crews','a',{count:7,note:'保留此補充'});
    c.clock=1201000;await undo();rows=read(c);
    assert.equal(rows[0].count,7);assert.equal(rows[0].note,'保留此補充');assert.equal(rows[0].face,'第二面');assert.equal(rows[0].floor,'1F');assert.equal(rows[0].status,'待命');assert.equal(rows[1].status,'作業中');
    for(const row of rows){assert.equal(row.taskSegments.length,3);assert.equal(row.taskSegments[0].endedAt,601000);assert.equal(row.taskSegments[1].endedAt,1201000);assert.equal(row.taskSegments[2].startedAt,1201000);assert.equal(row.taskSegments[2].source,'rotation-undo');assert.equal(row.assignmentRevision,3);}
    assert.equal(A.totals(rows[1],1801000).workMs,1200000);assert.equal(A.totals(rows[1],1801000).rehabMs,600000);assert.equal(rows[1].dispatchCount,2);
    assert.equal(vm.runInContext('live.hoses[0].targetId',c),'b');
    assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(localState.cases[0].crews)',c)),rows);
    const final=JSON.stringify(rows);await assert.rejects(undo(),/已更新/);assert.equal(JSON.stringify(read(c)),final);
  });
}
test('V3.2 task-only updates share known statuses, without treating an unfamiliar task as confirmed work',()=>{
  for(const task of ['休息','REHAB','輪替休息','原地休息','移至休息區'])assert.equal(A.statusForTask(task),'休息');
  assert.equal(A.statusForTask('待命'),'待命');assert.equal(A.statusForTask('RIT待命'),'RIT');assert.equal(A.statusForTask('自訂觀察任務'),undefined);
  const initial=crew('c','淡水','作業中','滅火攻擊');const rest={...initial,...A.transition(initial,{task:'休息'},{at:601000,id:'rest'})};
  assert.equal(rest.status,'休息');assert.equal(A.totals(rest,1201000).rehabMs,600000);
  assert.equal(A.transition(initial,{task:'未知自訂任務'},{at:601000,id:'unknown'}).taskSegments.at(-1).status,'作業中');
});
test('V3.2 personnel sheet preserves empty, unspecified and custom status on count-only edit',async()=>{
  for(const status of ['',undefined,'未指定','自訂待確認']){
    const c=harness();seed(c,[{id:'c',unit:'淡水',count:null,task:'未指定',status}]);let html='';c.openActionSheet=(title,body)=>{html=body;};c.bindQuickFillButtons=()=>{};c.closeActionSheet=()=>{};
    await c.editCrew('c');
    const selected=html.match(/<option value="([^"]*)" selected>/);assert.ok(selected,html);assert.equal(selected[1],status||'');
    for(const [id,value]of Object.entries({sheetCrewStatus:selected[1],sheetCrewTask:'未指定',sheetCrewFloor31:'',sheetCrewCount:'2'}))c.document.getElementById(id).value=value;
    c.clock=601000;await c.document.getElementById('saveCrewSheetBtn').onclick();const saved=read(c)[0];
    assert.equal(saved.count,2);assert.equal(saved.status,status||'');assert.equal(saved.taskSegments,undefined);assert.equal(saved.dispatchCount,undefined);
  }
});
test('V3.2 rotation undo refuses stale assignments, changed case and closed/observer access atomically',async()=>{
  const c=harness(),initial=[crew('a','淡水','待命','待命'),crew('b','竹圍','作業中','滅火攻擊')];seed(c,initial);let undo;c.pushMapUndo=(label,fn)=>undo=fn;
  c.clock=601000;await c.handleCrewDragEnd(initial[0],{lat:25,lng:121});c.clock=901000;await c.updateItem('crews','b',{task:'新任務',status:'待命'});
  const after=JSON.stringify(read(c));c.clock=1201000;await assert.rejects(undo(),/已更新/);assert.equal(JSON.stringify(read(c)),after);
  vm.runInContext("currentCaseId='other'",c);await assert.rejects(undo(),/案件已切換/);
  vm.runInContext("currentCaseId='room';currentCase.status='closed'",c);await assert.rejects(undo(),/案件未開啟/);
  vm.runInContext("currentCase.status='active';currentCase.mode='practice';live.players[0].role='觀察員'",c);await assert.rejects(undo(),/觀察員/);
});
test('V3.2 rotation local persistence failure changes no crews or hose records',async()=>{
  const c=harness(),initial=[crew('a','淡水','待命','待命'),crew('b','竹圍','作業中','滅火攻擊')];seed(c,initial);
  const before=JSON.stringify(read(c));c.localStorage.setItem=()=>{throw Error('quota');};c.clock=601000;
  await assert.rejects(c.handleCrewDragEnd(initial[0],{lat:25,lng:121}),/quota/);assert.equal(JSON.stringify(read(c)),before);
});
function firebaseMock(c,initial){
  const clone=x=>JSON.parse(JSON.stringify(x));
  const records=new Map([['cases/room',{status:'active',resourceRevision:0}],...initial.map(x=>['cases/room/crews/'+x.id,clone(x)]),['cases/room/hoses/h',{id:'h',targetType:'crew',targetId:'b',targetName:'竹圍',owner:'竹圍'}]]);
  const ref=path=>({path,collection:name=>({doc:id=>ref(path+'/'+name+'/'+id)})});let writes=0;
  c.mockDb={collection:name=>({doc:id=>ref(name+'/'+id)}),runTransaction:async fn=>{
    const pending=[];const tx={get:async r=>({exists:records.has(r.path),data:()=>clone(records.get(r.path))}),update:(r,p)=>pending.push([r.path,clone(p)])};
    const result=await fn(tx);for(const [path,patch]of pending)records.set(path,{...records.get(path),...patch});writes+=pending.length;return result;
  }};
  vm.runInContext('db=mockDb;firebaseEnabled=true;addLog=async()=>{};',c);
  return {records,writes:()=>writes};
}
test('V3.2 mocked Firebase rotation/undo preserves server history and unrelated edits in one transaction',async()=>{
  const c=harness(),initial=[crew('a','淡水','待命','待命','第二面','1F'),crew('b','竹圍','作業中','滅火攻擊')];seed(c,initial);
  vm.runInContext("live.hoses=[{id:'h',targetType:'crew',targetId:'b',targetName:'竹圍',owner:'竹圍'}]",c);
  const {records,writes}=firebaseMock(c,initial);let undo;c.pushMapUndo=(label,fn)=>undo=fn;
  c.clock=601000;await c.handleCrewDragEnd(initial[0],{lat:25,lng:121});
  assert.equal(writes(),4);let replacement=records.get('cases/room/crews/a');assert.equal(replacement.floor,'3F');assert.equal(replacement.taskSegments.length,2);
  records.set('cases/room/crews/a',{...replacement,count:8,note:'雲端後續補充'});
  c.clock=1201000;await undo();replacement=records.get('cases/room/crews/a');const target=records.get('cases/room/crews/b');
  assert.equal(writes(),8);assert.equal(replacement.count,8);assert.equal(replacement.note,'雲端後續補充');assert.equal(replacement.floor,'1F');
  assert.equal(target.taskSegments.length,3);assert.equal(A.totals(target,1801000).workMs,1200000);assert.equal(A.totals(target,1801000).rehabMs,600000);
  assert.equal(records.get('cases/room/hoses/h').targetId,'b');assert.equal(records.get('cases/room').resourceRevision,2);
});
test('V3.2 mocked Firebase rotation rejects a stale hose or remotely closed case before writing any record',async()=>{
  for(const change of ['hose','closed']){
    const c=harness(),initial=[crew('a','淡水','待命','待命'),crew('b','竹圍','作業中','滅火攻擊')];seed(c,initial);
    vm.runInContext("live.hoses=[{id:'h',targetType:'crew',targetId:'b',targetName:'竹圍',owner:'竹圍'}]",c);
    const {records,writes}=firebaseMock(c,initial);
    if(change==='hose')records.get('cases/room/hoses/h').targetId='different';else records.get('cases/room').status='closed';
    const before=JSON.stringify([...records]);c.clock=601000;
    await assert.rejects(c.handleCrewDragEnd(initial[0],{lat:25,lng:121}),change==='hose'?/已更新/:/已結案/);
    assert.equal(writes(),0);assert.equal(JSON.stringify([...records]),before);
  }
});
test('V3.2 legacy resident population and household hospital/death outcomes stay visible without inferred patient totals',()=>{
  const s=O.buildOperationalSummary({buildingOps:{floorActions:[{floor:3,residents:[{id:'a',male:2,female:3,status:'死亡'},{id:'b',maleCount:1,femaleCount:null,female:9,status:'已送醫'}]}]}},{sitreps:[{id:'p',patient:{id:'patient',status:'死亡'}}]});
  assert.equal(s.floors[0].minimum,6);assert.equal(s.floors[0].pending,1);
  const text=s.lifeSafety.join('\n');assert.match(text,/男 3｜女 3/);assert.match(text,/住戶紀錄：死亡 1 戶（死亡人數待確認）/);assert.match(text,/住戶紀錄：送醫 1 戶（送醫人數待確認）/);
  assert.match(text,/患者回報：死亡 1 人/);assert.match(text,/不另行加總/);assert.doesNotMatch(text,/死亡 5 人|送醫 1 人|總人數/);
});
test('V3.2 current situation excludes superseded patient titles and preserves ordinary situation reports',()=>{
  const s=O.buildOperationalSummary({}, {sitreps:[{id:'p1',eventAt:1000,title:'患者舊輕傷',patient:{id:'p',status:'輕傷'}},{id:'p2',eventAt:2000,title:'患者新重傷',patient:{id:'p',status:'重傷'}},{id:'later-upload',eventAt:500,submittedAt:3000,title:'更早輕傷回補',patient:{id:'p',status:'輕傷'}},{id:'fire',eventAt:1500,title:'第三面仍有明火'}]});
  assert.deepEqual(s.situation,['第三面仍有明火']);assert.match(s.lifeSafety.join('\n'),/重傷 1 人/);assert.doesNotMatch(s.lifeSafety.join('\n'),/輕傷/);
});
test('V3.2 floor summary chooses newest operation while retaining latest household records',()=>{
  const c={buildingOps:{floorActions:[{floor:3,updatedAt:2000,action:'搜索完成',residents:[]},{floor:'3',updatedAt:1000,action:'搜索中',residents:[{id:'a',male:2,female:3}]}]}};
  const s=O.buildOperationalSummary(c,{});assert.equal(s.floors.length,1);assert.ok(s.floors[0].lines.includes('樓層作戰狀態：搜索完成'));assert.equal(s.floors[0].minimum,5);
  c.buildingOps.floorActions.reverse();assert.ok(O.buildOperationalSummary(c,{}).floors[0].lines.includes('樓層作戰狀態：搜索完成'));
});
for(const mode of ['live','practice'])test(`V3.2 ${mode}: overview, report, radio and table share unknown/absent/known trapped counts`,()=>{
  const c=harness(mode);
  const cases=[
    ...[undefined,null,'',0,'0',-1].map(trappedCount=>({trapped:'有',trappedCount})),
    {trapped:'有',trappedCount:2},{trapped:'有',trappedCount:'2'},
    {trapped:'無',trappedCount:0},{trapped:'無',trappedCount:null},
    {trapped:'',trappedCount:0},{trapped:undefined,trappedCount:undefined}
  ];
  for(const value of cases){
    c.value=value;vm.runInContext('currentCase.trapped=value.trapped;currentCase.trappedCount=value.trappedCount;',c);
    const expected=O.trappedSummary(value);
    const outputs=[c.buildExecutiveSummaryText(),c.keyOperationalSummaryLines().join('\n'),c.buildFullSpeech(),c.buildReportSummaryTable(),c.localTacticalAdviceText(),c.commandBlocks('人',value).speech];
    outputs.forEach(output=>{
      assert.doesNotMatch(output,/(?:受困\s*(?:人數)?\s*0\s*人|有\s*(?:\/\s*)?0\s*人.*受困|0\s*人受困)/,output);
      if(expected.state!=='unknown')assert.ok(output.includes(expected.line),output);
      else assert.doesNotMatch(output,/確認無人受困|確認有.*受困/,output);
    });
    if(value.trapped==='無'){assert.equal(expected.count,0);assert.equal(expected.state,'absent');}
    else if(value.trapped==='有'&&Number(value.trappedCount)>0)assert.equal(expected.count,2);
    else assert.equal(expected.count,null);
  }
});
for(const mode of ['live','practice'])test(`V3.2 ${mode}: parsed interior hint cannot override the actual reviewed task dropdown`,async()=>{
  for(const [task,status]of [['休息','休息'],['REHAB','休息'],['待命','待命'],['撤出','撤出'],['RIT','RIT'],['內攻','作業中']]){
    const c=harness(mode);seed(c,[crew('c','淡水','作業中','滅火攻擊')]);
    const choice={value:'內攻'},otherInput={tagName:'INPUT',dataset:{field:'task'},value:'',focus(){}},other={hidden:true,querySelector:()=>otherInput},controls={};
    for(const selector of ['[data-commit]','[data-remove]','[data-error]','.review-title30'])controls[selector]={textContent:''};
    controls['[data-task-choice]']=choice;controls['[data-task-other]']=other;
    c.card={dataset:{item:'item0'},querySelector:s=>controls[s]||null,querySelectorAll:s=>s==='[data-field]'?[otherInput]:[]};
    vm.runInContext(`intake28={caseId:'room',commandId:'parsed',text:'',items:[],plan:null};
      $('intakeChanges28').querySelectorAll=s=>s==='[data-item]'?[card]:[];
      $('intakeText28').value='淡水3人從第一面進入';syncIntakeCaseFields29=()=>{};renderArrivalStatusCards=()=>{};`,c);
    await c.parseIntake28(true);assert.equal(vm.runInContext('intake28.items[0].interior',c),true);assert.equal(read(c)[0].task,'滅火攻擊');
    choice.value=['REHAB','撤出'].includes(task)?'其他':task;choice.onchange();
    if(choice.value==='其他'){otherInput.value=task;otherInput.oninput();}
    assert.equal(vm.runInContext('intake28.items[0].task',c),task);
    assert.equal(vm.runInContext('intake28.items[0].interior',c),true,'retain source location evidence in the draft');
    c.clock=601000;await controls['[data-commit]'].onclick();const saved=read(c)[0];
    assert.equal(saved.task,task);assert.equal(saved.status,status);assert.equal(saved.face,'第一面');assert.equal(saved.floor,'3F');assert.equal(saved.taskSegments.length,2);
    assert.equal(saved.taskSegments[1].status,status);assert.equal(saved.taskSegments[1].floor,'3F');
    const total=A.totals(saved,1201000);assert.equal(total.workMs,status==='作業中'?1200000:600000);assert.equal(total.rehabMs,status==='休息'?600000:0);
    if(task==='內攻')assert.equal(saved.interior,true,'unchanged confirmed entry still places the crew inside');
  }
});
