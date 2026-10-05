const test=require('node:test'),assert=require('node:assert/strict'),A=require('../assets/assignment-v32');
const transition=(c,patch,at)=>({...c,...A.transition(c,patch,{id:'t'+at,crewId:'crew',at,operator:'test'})});
test('V3.2 actual shared manual updater records segments and rejects closed mutations',async()=>{
 const {app}=require('./app-harness.cjs'),vm=require('node:vm'),c=app();
 vm.runInContext("currentCase.mode='live';live.crews=[{id:'c',unit:'板橋',status:'待命'}];",c);
 await c.updateItem('crews','c',{status:'作業中',task:'滅火攻擊'});
 await c.updateItem('crews','c',{status:'休息',task:'REHAB'});
 await c.updateItem('crews','c',{status:'作業中',task:'搜索'});
 assert.equal(vm.runInContext('live.crews[0].taskSegments.length',c),3);
 await c.updateItem('crews','c',{count:3});assert.equal(vm.runInContext('live.crews[0].taskSegments.length',c),3);
 vm.runInContext("currentCase.status='closed'",c);await assert.rejects(c.updateItem('crews','c',{status:'休息'}),/案件未開啟/);
});
test('V3.2 work → REHAB → search creates contiguous immutable history',()=>{
 let c=transition({unit:'板橋'},{status:'作業中',task:'滅火攻擊'},1000);
 c=transition(c,{status:'休息'},601000);c=transition(c,{status:'作業中',task:'搜索',floor:'2F'},1321000);
 assert.equal(c.taskSegments.length,3);assert.equal(c.taskSegments[0].endedAt,601000);assert.equal(c.taskSegments[1].endedAt,1321000);assert.equal(c.dispatchCount,2);
 const t=A.totals(c,1921000);assert.equal(t.workMs,1200000);assert.equal(t.rehabMs,720000);
});
test('V3.2 same assignment and count/position updates do not restart timer',()=>{
 const c=transition({},{status:'作業中',task:'攻擊'},1000);const next=A.transition(c,{count:3},{at:2000});assert.equal(next.count,3);assert.deepEqual(next.taskSegments,c.taskSegments);assert.deepEqual(A.transition(c,{task:'攻擊'},{at:2000}).taskSegments,c.taskSegments);
});
test('V3.2 closure stops active segments and report clock',()=>{
 let c=transition({},{status:'作業中',task:'搜索'},1000);c.taskSegments=A.closeSegments(c,601000);assert.equal(c.taskSegments[0].closureReason,'case_closed');assert.equal(A.totals(c,99999999).workMs,600000);
});
test('V3.2 unknown legacy start is not invented; real start is marked partial',()=>{
 let c=transition({task:'攻擊',status:'作業中'},{status:'休息'},1000);assert.equal(c.taskSegments.length,1);
 c=transition({task:'攻擊',status:'作業中',startAt:500},{status:'休息'},1000);assert.equal(c.taskSegments[0].legacyPartial,true);assert.equal(c.taskSegments[0].endedAt,1000);
});
