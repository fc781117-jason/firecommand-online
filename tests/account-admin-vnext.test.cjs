const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const core=require('../assets/account-admin-core');
const tree={'第三大隊':{'淡水中隊':['淡水中隊','淡水','竹圍'],'三重中隊':['三重','重陽']},'第一大隊':{'海山中隊':['新板']}};
const users=[
  {id:'a',realName:'王小明',email:'wang@gmail.com',brigade:'第三大隊',unit:'淡水',title:'現場指揮官',role:'commander',status:'pending',createdAt:30},
  {id:'b',realName:'林小華',email:'lin@gmail.com',brigade:'第三大隊',unit:'竹圍',title:'分區指揮',role:'sector',status:'active',createdAt:20},
  {id:'c',realName:'江小祥',email:'jiang@gmail.com',brigade:'第一大隊',unit:'新板',title:'安全官',role:'safety',status:'suspended',createdAt:10}
];
test('帳號搜尋支援姓名、Email、大隊、中隊、分隊、職稱及不完整輸入',()=>{
  for(const [term,id] of [['王小','a'],['@gmail.com','a,b,c'],['第三大隊','a,b'],['淡水中隊','a,b'],['竹圍','b'],['分區指揮','b'],['  WANG  ','a']]){
    assert.deepEqual(core.filter(users,{search:term},tree).map(u=>u.id).sort().join(','),id,term);
  }
});
test('多條件組合與連動選項，依真實單位樹補出中隊',()=>{
  assert.equal(core.company(users[0],tree),'淡水中隊');
  assert.deepEqual(core.options(users,tree,'第三大隊','淡水中隊').units,['淡水','竹圍']);
  assert.deepEqual(core.filter(users,{status:'active',brigade:'第三大隊',company:'淡水中隊',unit:'竹圍',role:'分區指揮'},tree).map(u=>u.id),['b']);
  assert.deepEqual(core.filter(users,{status:'pending',role:'commander'},tree).map(u=>u.id),['a']);
  assert.deepEqual(core.filter(users,{sort:'newest'},tree).map(u=>u.id),['a','b','c']);
  assert.deepEqual(core.filter(users,{sort:'oldest'},tree).map(u=>u.id),['c','b','a']);
  assert.deepEqual(core.totals(users),{all:3,pending:1,active:1,suspended:1});
});
test('只允許狀態對應操作，固定最高管理員不得操作',()=>{
  assert.deepEqual(users.map(core.nextActions),[['active'],['suspended'],['active']]);
  assert.equal(core.allowedTransition(users[0],'suspended','admin@example.com'),false);
  assert.equal(core.allowedTransition(users[1],'pending','admin@example.com'),false);
  assert.equal(core.allowedTransition({...users[1],email:'FC781117@GMAIL.COM'},'suspended','fc781117@gmail.com'),false);
  assert.equal(core.allowedTransition(users[0],'active','fc781117@gmail.com'),true);
});
test('更新包頁面包含必要入口及不改動 Firestore Rules',()=>{
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  const js=fs.readFileSync(require.resolve('../assets/app.js'),'utf8');
  assert.match(html,/id="accountAdminDetails" class="accordion/);
  assert.match(html,/id="accountUnitDialog"/);
  assert.match(html,/id="accountConfirmDialog"/);
  assert.match(html,/account-admin-core\.js\?v=33/);
  assert.match(js,/db\.runTransaction\(async transaction/);
  assert.match(js,/if\(admin\)watchUsersForAdmin\(\)/);
  assert.doesNotMatch(js,/data-user-action="pending"/);
});
