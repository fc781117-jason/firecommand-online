const test=require('node:test'),assert=require('node:assert/strict');
const O=require('../assets/operational-v32');
const demo=require('../assets/preview-demo-v31');
test('V3.2 source model preserves unknown and does not add patients to residents',()=>{
 const c={buildingOps:{floorActions:[{floor:4,action:'疏散離開',residents:[{id:'a',maleCount:2,femaleCount:3},{id:'b',maleCount:null,femaleCount:2}]}]}};
 const s=O.buildOperationalSummary(c,{sitreps:[{id:'s',patient:{id:'p',status:'輕傷'}}]});
 assert.equal(s.floors[0].minimum,7);assert.equal(s.floors[0].pending,1);assert.match(s.lifeSafety.join(' '),/至少 7 人/);assert.match(s.lifeSafety.join(' '),/不另行加總/);assert.match(s.lifeSafety[0],/待確認/);assert.doesNotMatch(O.summaryText(s),/總人數.?8/);
});
test('V3.2 zero and unknown household counts remain different',()=>{
 assert.equal(O.count(''),null);assert.equal(O.count(0),0);assert.equal(O.count(-1),null);
 const s=O.residentsSummary([{resident:{maleCount:0,femaleCount:0}},{resident:{maleCount:null,femaleCount:null}}]);assert.equal(s.pending,1);
});
test('V3.2 household title omits repeated road but preserves unit label',()=>{
 assert.equal(O.shortUnit({unitNo:'31號4樓之2'}),'31號4樓之2');assert.equal(O.shortUnit({unitNo:'A戶'}),'A戶');assert.equal(O.shortUnit({address:'新北市淡水區測試路31號4樓'}),'31號4樓');
});
test('V3.2 hose diagram is not reported as confirmed supply',()=>{
 const s=O.buildOperationalSummary({}, {hoses:[{sourceName:'A11',targetName:'B16',status:'規劃'}]});assert.match(s.deployment[0],/規劃/);assert.doesNotMatch(s.deployment[0],/已供水/);
});
test('V3.2 zoom clamp and anchor invariant',()=>{
 const v={x:0,y:0,w:100,h:100,zoom:1},p={x:25,y:30};const n=O.viewportPoint(v,p,{w:100,h:100},9);assert.equal(n.zoom,2.5);assert.equal((p.x-n.x)/n.w,.25);assert.equal((p.y-n.y)/n.h,.3);assert.equal(O.viewportPoint(v,p,{w:100,h:100},.1).zoom,.6);
});
test('V3.2 registered households never silently become total building households',()=>{
 const s=O.buildOperationalSummary({totalHouseholds:12,totalHouseholdsConfirmed:false},{});assert.match(s.lifeSafety[0],/待確認/);
 assert.match(O.buildOperationalSummary({totalHouseholds:12,totalHouseholdsConfirmed:true},{}).lifeSafety[0],/12 戶/);
});
