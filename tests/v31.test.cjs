const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const S=require('../assets/intake-semantic'),{app}=require('./app-harness.cjs');
const roster=['淡水','竹圍','滬尾','三重','三芝'].map(unit=>({unit,brigade:'第三大隊'}));
const empty=()=>({crews:[],vehicles:[],hoses:[]});
const config={lat:25,lng:121,buildingBox:{lat:25,lng:121,widthM:40,heightM:28,rotationDeg:0}};
const options={vehicleType:name=>({label:/9\d$/.test(name)?'救護車':'水車',canHose:! /9\d$/.test(name)})};
const compile=(items,state=empty(),c=config)=>S.compile(items.map(i=>({...i,selected:true,reviewed:true})),state,c,roster,options);
const example='我正面布兩線進入，第一線由淡水，第二線由竹圍布線進入，然後由淡水111出水，後續各車依序為淡水16，竹圍16，竹圍61，滬尾61，三重11。第二面成立救護車集結區，現場有三重91、三重92。指揮站設在正面第一面';
test('選分隊後輸入11、完整或重複前綴車號均正規化；111保留且不接受別隊衝突',()=>{
 for(const v of ['11','淡水11','淡水淡水11','１１','么么']){const p=compile([S.item('vehicle',{unit:'淡水',vehicle:v})]);assert.equal(p.issues.length,0);assert.equal(p.after.vehicles[0].name,'淡水11');}
 assert.equal(compile([S.item('vehicle',{unit:'淡水',vehicle:'111'})]).after.vehicles[0].name,'淡水111');
 assert.equal(compile([S.item('vehicle',{unit:'淡水',vehicle:'竹圍11'})]).issues.length,1);
});
test('完整使用者例句：8車、兩個入室編組、5條車間線與2條攻擊線，皆同頭車',()=>{
 const p=compile(S.local(example,roster).items);assert.deepEqual(p.issues,[]);assert.equal(p.after.vehicles.length,8);assert.equal(p.after.crews.length,2);
 assert.equal(p.after.hoses.filter(h=>h.targetType==='vehicle').length,5);
 const attack=p.after.hoses.filter(h=>h.targetType==='buildingFace');assert.equal(attack.length,2);assert.deepEqual(attack.map(h=>h.owner),['淡水','竹圍']);assert.ok(attack.every(h=>h.vehicleName==='淡水111'&&h.targetName==='第一面'));
 assert.ok(p.after.crews.every(c=>c.interior&&c.status==='作業中'&&c.countUnknown));assert.equal(p.totalAfter,0);
});
test('列隊依原始次序、第一面右側、安全留白、同向單列，不是繞建物排列',()=>{
 const p=compile(S.local(example,roster).items),vs=p.after.vehicles.filter(v=>v.queueOrder!==undefined);
 assert.deepEqual(vs.map(v=>v.name),['淡水111','淡水16','竹圍16','竹圍61','滬尾61','三重11']);
 assert.equal(new Set(vs.map(v=>v.lat)).size,1);assert.ok(vs[0].lng>config.lng);assert.ok(vs[0].lat<config.lat-14/111320);
 assert.ok(vs.every((v,i)=>i===0||v.lng>vs[i-1].lng));assert.ok(vs.every(v=>v.heading31===270));
 for(let i=1;i<vs.length;i++)assert.equal(p.after.hoses.filter(h=>h.vehicleId===vs[i].id&&h.targetId===vs[i-1].id).length,1);
});
test('第二面另設頭車形成独立車隊，後續回報不搬移第一面',()=>{
 const a=compile(S.local('正面淡水111出水，後續各車依序為淡水16',roster).items);
 const b=compile(S.local('第二面由竹圍11出水，後續各車依序為竹圍61',roster).items,a.after);
 assert.deepEqual(b.issues,[]);assert.ok(b.after.vehicles.filter(v=>v.unit==='淡水').every(v=>v.face==='第一面'));
 const second=b.after.vehicles.filter(v=>v.unit==='竹圍');assert.ok(second.every(v=>v.face==='第二面'));assert.equal(second[0].lng,second[1].lng);assert.ok(second[1].lat>second[0].lat);
});
test('樓層只作位置資訊：在建物內，點選與水線路徑可讀同一筆人員',()=>{
 const c=app();vm.runInContext(`currentCase.buildingBox={lat:25,lng:121,widthM:40,heightM:28};intake28={caseId:'room',commandId:'t',text:''};captureBase29(intake28);intake28.items=FCIntake29.local('淡水七人從正面進入三樓；淡水111正面出兩線',FCIntake.roster(UNIT_TREE)).items;const p31=buildPlan29();Object.assign(live,p31.after);`,c);
 assert.equal(vm.runInContext('live.crews[0].floor',c),'三樓');const pt=vm.runInContext('latLngToLocalPoint(getBuildingBox(),live.crews[0].lat,live.crews[0].lng)',c);assert.ok(Math.abs(pt.x)<20&&Math.abs(pt.y)<14);
 const path=vm.runInContext('hosePath30(live.hoses[0],getHosePoints(live.hoses[0]).from,getHosePoints(live.hoses[0]).to)',c);
 assert.equal(path.at(-1).lat,vm.runInContext('live.crews[0].lat',c));
 assert.match(vm.runInContext('deploymentSchematicHtml()',c),/三樓/);
});
test('救護車在第二面集結且不進供水車隊；未部署人員在指揮站附近待命',()=>{
 const p=compile(S.local(example+'；三芝五人報到',roster).items),zones=p.caseChanges.find(x=>x.key==='tacticalZones').after;
 assert.equal(zones.ambulance.face,'第二面');assert.equal(zones.command.face,'第一面');
 assert.ok(p.after.vehicles.filter(v=>/9\d$/.test(v.name)).every(v=>v.type==='救護車'&&!v.canHose&&v.face==='第二面'));
 const standby=p.after.crews.find(c=>c.unit==='三芝');assert.equal(standby.status,'待命');assert.ok(standby.staged);assert.ok(Math.abs(standby.lat-zones.command.lat)*111320<30);
});
test('已確認人數後回報進入不歸零，重複語句不新增人車水線',()=>{
 const first=compile(S.local('淡水七人報到；竹圍六人報到',roster).items);
 const next=compile(S.local(example,roster).items,first.after);assert.equal(next.totalAfter,13);assert.ok(next.after.crews.every(c=>!c.countUnknown));
 const c={...config,...Object.fromEntries(next.caseChanges.map(x=>[x.key,x.after]))};
 const again=compile(S.local(example,roster).items,next.after,c);assert.deepEqual(again.issues,[]);assert.equal(again.after.hoses.length,7);assert.equal(again.totalAfter,13);
});
test('手動拖動位置在無關的新回報之後保持，復原邏輯仍可使用',()=>{
 const a=compile(S.local(example,roster).items);const v=a.after.vehicles[0];Object.assign(v,{positionManual:true,lat:25.003,lng:121.005});
 const b=compile(S.local('三芝五人報到',roster).items,a.after);assert.equal(b.after.vehicles[0].lat,25.003);assert.equal(b.after.vehicles[0].lng,121.005);
});
test('AI回傳再正規化仍與本機拓樸相同，不重複水線，不把來源車單位當執行分隊',()=>{
 const draft=S.local(example,roster),twice=S.sanitize(draft,example,roster),p=compile(twice.items);
 assert.deepEqual(p.issues,[]);assert.equal(p.after.hoses.length,7);assert.deepEqual(p.after.hoses.filter(h=>h.targetType==='buildingFace').map(h=>h.owner),['淡水','竹圍']);
});
test('否定或預定的頭車、入室與集結區不能改成既成事實',()=>{
 for(const text of ['第二面準備成立救護車集結區','指揮站不要設在第二面','淡水111預計出水','如果正面布兩線進入']){const p=compile(S.local(text,roster).items);assert.equal(p.after.vehicles.length,0);assert.equal(p.after.crews.length,0);assert.equal(p.after.hoses.length,0);assert.ok(!p.caseChanges.some(x=>x.key==='tacticalZones'));}
});
test('先報兩線後報出水頭車，同面唯一頭車可接續水線',()=>{
 const a=compile(S.local('正面布兩線進入，第一線由淡水，第二線由竹圍布線進入',roster).items);
 assert.equal(a.after.hoses.length,2);assert.ok(a.after.hoses.every(h=>h.supplyUnconfirmed));
 const b=compile(S.local('正面由淡水111出水',roster).items,a.after);assert.deepEqual(b.issues,[]);assert.ok(b.after.hoses.every(h=>!h.supplyUnconfirmed&&h.vehicleName==='淡水111'));
});
test('逐筆確認完整例句：每筆有依賴時同時登錄，不殘留未接頭車的線',async()=>{
 const c=app();c.raw31=example;vm.runInContext(`currentCase.mode='live';intake28={caseId:'room',commandId:'v31',text:raw31};captureBase29(intake28);intake28.items=FCIntake29.local(raw31,FCIntake.roster(UNIT_TREE)).items;syncIntakeCaseFields29=()=>{};renderArrivalStatusCards=()=>{};`,c);
 const ids=vm.runInContext('intake28.items.map(i=>i.id)',c);
 for(const id of ids)await vm.runInContext(`applyIntakeRow30(${JSON.stringify(id)})`,c);
 assert.equal(vm.runInContext('live.vehicles.length',c),8);assert.equal(vm.runInContext('live.crews.length',c),2);assert.equal(vm.runInContext('live.hoses.length',c),7);assert.equal(vm.runInContext('currentCase.tacticalZones.command.face',c),'第一面');
});
test('先說供水車、後說攻擊車，也依供水拓樸把供水車放頭車後方',()=>{
 const p=compile(S.local('淡水16供水給淡水111；淡水111正面出兩線',roster).items);assert.deepEqual(p.issues,[]);
 const head=p.after.vehicles.find(v=>v.name==='淡水111'),rear=p.after.vehicles.find(v=>v.name==='淡水16');assert.equal(head.queueOrder,0);assert.equal(rear.queueOrder,1);assert.equal(head.lat,rear.lat);assert.ok(rear.lng>head.lng);
});
