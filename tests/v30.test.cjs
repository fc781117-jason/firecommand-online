const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const S=require('../assets/intake-semantic'),{app}=require('./app-harness.cjs');
const roster=['淡水','竹圍','三芝'].map(unit=>({unit,brigade:'第三大隊'}));
const empty=()=>({crews:[],vehicles:[],hoses:[]});
const compile=(items,state=empty())=>S.compile(items.map(x=>({...x,selected:true,reviewed:true})),state,{},roster);
const row=(kind,patch)=>S.item(kind,{id:kind+Math.random(),...patch});
function setup(){const c=app();vm.runInContext(`currentCase.mode='live';intake28={caseId:'room',commandId:'batch',text:'現場回報',items:[]};captureBase29(intake28);syncIntakeCaseFields29=()=>{};renderArrivalStatusCards=()=>{};`,c);return c;}
const evalc=(c,s)=>vm.runInContext(s,c);
test('截圖四：target已選第一面，即使舊face殘留正面／錯誤字串也可畫線',()=>{
 for(const face of ['正面','正面進入','第1面','未知']){const p=compile([row('hose',{unit:'淡水',number:2,target:'第一面',face})]);assert.equal(p.issues.length,0);assert.equal(p.after.hoses.length,2);assert.equal(p.after.hoses[0].targetName,'第一面');}
});
test('正面、數字第一面與中文第一面一致；明確進入帶作業中',()=>{
 for(const label of ['正面','第1面','第一面']){const p=compile(S.local(`淡水分隊七人從${label}已進入`,roster).items);assert.equal(p.totalAfter,7);assert.equal(p.after.crews[0].face,'第一面');assert.equal(p.after.crews[0].status,'作業中');}
});
test('國字及無線電車號不混淆人數，1116拆11和16，111保留',()=>{
 assert.equal(S.normalize('淡水么么六，淡水幺拐，竹圍六洞，淡水1116，淡水111',roster).text,'淡水116,淡水17,竹圍60,淡水11、淡水16,淡水111');
 assert.equal(S.normalize('淡水七人、三芝三人',roster).text,'淡水7人、三芝3人');
});
test('未說人數的水線回報不額外建立未知人員卡',()=>{const d=S.local('淡水兩條水線從正面進入',roster);assert.equal(d.items.filter(x=>x.kind==='crew').length,0);assert.equal(d.items.filter(x=>x.kind==='hose').length,1);});
test('同隊跨句人數與部署合併；不同面向不一概指派第一面',()=>{
 const p=compile(S.local('淡水七人到場；淡水從正面進入；竹圍六人從第二面進入',roster).items);
 assert.equal(p.issues.length,0);assert.equal(p.after.crews.length,2);assert.equal(p.after.crews[0].face,'第一面');assert.equal(p.after.crews[1].face,'第二面');
});
test('否定與預定部署仍留情資，不執行人車動作',()=>{for(const text of ['淡水七人尚未從正面進入','淡水111準備從正面出兩線','竹圍六人不要進入']){const d=S.local(text,roster);const p=compile(d.items);assert.equal(p.after.crews.length,0);assert.equal(p.after.vehicles.length,0);assert.equal(p.after.hoses.length,0);}});
test('原句不完全一致只供展開查閱；原文沒有的數字仍提醒核對',()=>{
 let d=S.sanitize({correctedText:'淡水7人',items:[row('crew',{unit:'淡水',number:7,evidence:'淡水分隊有七人'})]},'淡水七人',roster);
 assert.equal(d.items[0].uncertainty,'');assert.equal(d.items[0].sourceEvidence,'淡水七人');
 d=S.sanitize({items:[row('crew',{unit:'淡水',number:8,evidence:''})]},'淡水七人',roster);assert.match(d.items[0].uncertainty,/核對數量/);
});
test('逐筆登錄：壞水線不擋住人員，修正後不需總勾選',async()=>{
 const c=setup();evalc(c,`intake28.items=[FCIntake29.item('crew',{id:'a',unit:'淡水',number:7,face:'第一面'}),FCIntake29.item('hose',{id:'b',unit:'淡水',number:1,target:'五樓'})];renderIntakePlan28();`);
 await evalc(c,"applyIntakeRow30('a')");assert.equal(evalc(c,'live.crews[0].count'),7);assert.equal(evalc(c,'intake28.items[1].committed'),undefined);
 await assert.rejects(evalc(c,"applyIntakeRow30('b')"),/面向/);
 evalc(c,"intake28.items[1].target='第一面'");await evalc(c,"applyIntakeRow30('b')");assert.equal(evalc(c,'live.hoses.length'),1);assert.equal(evalc(c,'live.intakeEvents.length'),2);
});
test('逐筆新增依更新後數據累計；同筆重點不重複增加',async()=>{
 const c=setup();evalc(c,`intake28.items=[FCIntake29.item('crew',{id:'a',unit:'淡水',number:7}),FCIntake29.item('crew',{id:'b',unit:'淡水',number:2,quantityMode:'add'})];renderIntakePlan28();`);
 await evalc(c,"applyIntakeRow30('a')");await evalc(c,"applyIntakeRow30('b')");await evalc(c,"applyIntakeRow30('b')");assert.equal(evalc(c,'live.crews[0].count'),9);assert.equal(evalc(c,'live.intakeEvents.length'),2);
});
test('水線單筆確認含可見依賴車輛；不用先跳另一卡',async()=>{
 const c=setup();evalc(c,`intake28.items=FCIntake29.local('淡水111正面出兩條水線',FCIntake.roster(UNIT_TREE)).items;renderIntakePlan28();`);
 assert.match(evalc(c,"$('intakeChanges28').innerHTML"),/同時登錄：淡水111/);
 await evalc(c,"applyIntakeRow30(intake28.items.find(x=>x.kind==='hose').id)");assert.equal(evalc(c,'live.vehicles.length'),1);assert.equal(evalc(c,'live.hoses.length'),2);assert.equal(evalc(c,'live.vehicles[0].face'),'第一面');
});
test('A串B串C產生兩個連結；沒有方向時保持流向未指定',()=>{
 const d=S.local('淡水16串淡水11串竹圍11',roster),p=compile(d.items);assert.equal(p.issues.length,0);assert.equal(p.after.hoses.length,2);assert.equal(p.after.hoses[0].task,'車輛串接（流向未指定）');assert.equal(S.connectedVehicles(p.after,p.after.vehicles[0].id).length,3);
});
test('供水車承接攻擊車面向，不影響其他獨立車',()=>{
 const p=compile([row('vehicle',{unit:'淡水',vehicle:'淡水111',face:'第一面'}),row('vehicle',{unit:'淡水',vehicle:'淡水16'}),row('vehicle',{unit:'竹圍',vehicle:'竹圍11',face:'第三面'}),row('hose',{unit:'淡水',vehicle:'淡水16',target:'淡水111',number:1})]);
 assert.equal(p.issues.length,0);assert.equal(p.after.vehicles.find(v=>v.name==='淡水16').face,'第一面');assert.equal(S.connectedVehicles(p.after,p.after.vehicles[0].id).length,2);assert.equal(p.after.vehicles[2].face,'第三面');
});
test('拖動車組維持相對距離和水線ID；回報文字更新面向，可整組復原',async()=>{
 const c=setup();evalc(c,`intake28.items=FCIntake29.local('淡水111正面出兩條水線；淡水16供水給淡水111',FCIntake.roster(UNIT_TREE)).items;renderIntakePlan28();`);
 for(const id of evalc(c,'intake28.items.map(x=>x.id)'))await evalc(c,`applyIntakeRow30(${JSON.stringify(id)})`);
 const old=evalc(c,'JSON.stringify(live.vehicles)'),hoses=evalc(c,'live.hoses.map(h=>h.id).join()');
 await evalc(c,"moveLinkedVehicles30(live.vehicles[0].id,{lat:25.001,lng:121},'移動')");assert.equal(evalc(c,'live.vehicles[1].lat-live.vehicles[0].lat'),JSON.parse(old)[1].lat-JSON.parse(old)[0].lat);assert.equal(evalc(c,'live.hoses.map(h=>h.id).join()'),hoses);assert.match(evalc(c,'deploymentMapSummary()'),/第三面/);
 await evalc(c,"undoIntake28(live.intakeEvents.at(-1).id)");assert.equal(evalc(c,'JSON.stringify(live.vehicles)'),old);
});
test('兩條進攻線圖面不同路徑，但起終點仍連同一車和建物',()=>{const c=setup();evalc(c,"live.hoses=[{id:'a',unit:'淡水',vehicleId:'v',targetType:'buildingFace',targetId:'face1'},{id:'b',unit:'淡水',vehicleId:'v',targetType:'buildingFace',targetId:'face1'}]");const a=evalc(c,"hosePath30(live.hoses[0],[25,121],[25.001,121])"),b=evalc(c,"hosePath30(live.hoses[1],[25,121],[25.001,121])");assert.notEqual(a[1].lng,b[1].lng);assert.equal(a[0].lat,b[0].lat);assert.equal(a[2].lat,b[2].lat);});
test('多人改資料需再核對；失敗保留原稿與未完成卡片',async()=>{const c=setup();evalc(c,"intake28.items=[FCIntake29.item('crew',{id:'a',unit:'淡水',number:7})];currentCase.resourceRevision=1;");await assert.rejects(evalc(c,"applyIntakeRow30('a')"),/更新/);assert.equal(evalc(c,'live.crews.length'),0);assert.equal(evalc(c,'intake28.items[0].number'),7);await evalc(c,"applyIntakeRow30('a')");assert.equal(evalc(c,'live.crews[0].count'),7);});
test('練習與實戰使用相同單筆流程；觀察員無法提交',async()=>{const c=setup();evalc(c,"currentCase.mode='practice';intake28.items=[FCIntake29.item('crew',{id:'a',unit:'淡水',number:7})]");await evalc(c,"applyIntakeRow30('a')");assert.equal(evalc(c,'live.crews[0].count'),7);evalc(c,"myTrainingRole=()=>'觀察員';intake28.items.push(FCIntake29.item('crew',{id:'b',unit:'竹圍',number:6}))");await assert.rejects(evalc(c,"applyIntakeRow30('b')"),/觀察員/);});
test('卡片總量受限且原句、設定與戰情表單預設收合',()=>{const c=setup();evalc(c,"intake28.items=Array.from({length:8},(_,n)=>FCIntake29.item('note',{id:'n'+n,text:'紀錄'+n}));renderIntakePlan28()");const html=evalc(c,"$('intakeChanges28').innerHTML");assert.equal((html.match(/data-item=/g)||[]).length,3);assert.match(html,/其餘 5 項/);assert.doesNotMatch(html,/review-editor30" open/);const page=fs.readFileSync(require.resolve('../index.html'),'utf8');assert.doesNotMatch(page,/id="sitrep(?:Fire|Patient)Details"[^>]*\bopen/);});
test('OpenAI GPT-5系列辨識套用low推理，4.1保留相容性',async()=>{const {runAI}=await import('../server/ai-router.js');for(const model of ['gpt-5.4-mini','gpt-4.1-mini']){let b;await runAI({prompt:'JSON',schema:{type:'object'}},{env:{OPENAI_API_KEY:'test',OPENAI_MODEL:model},fetch:async(u,o)=>{b=JSON.parse(o.body);return {ok:true,json:async()=>({output_text:'{}'})};}});assert.equal(b.reasoning?.effort,model==='gpt-5.4-mini'?'low':undefined);}});
test('後續語音移位也移動已連結車組，進攻水線終點保持原指定',()=>{
 let p=compile(S.local('淡水111正面出兩條水線；淡水16供水給淡水111',roster).items);assert.equal(p.issues.length,0);
 p=compile([row('vehicle',{unit:'淡水',vehicle:'淡水111',face:'第二面'})],p.after);assert.equal(p.after.vehicles.every(v=>v.face==='第二面'),true);assert.equal(p.after.hoses.filter(h=>h.targetType==='buildingFace').every(h=>h.targetName==='第一面'),true);
});
