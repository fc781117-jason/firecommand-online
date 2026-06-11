'use strict';

const $ = (id) => document.getElementById(id);
const LOCAL_KEY = 'firecommand_v10_local_state';
const DEFAULT_CENTER = { lat: 25.085, lng: 121.48 };
const SUPER_ADMIN_EMAIL = 'fc781117@gmail.com';
const AI_COOLDOWN_MS = 15 * 60 * 1000;
const UNIT_TREE = {
  '第一大隊': {
    '大隊部': [
      '大隊部'
    ],
    '海山中隊': [
      '海山中隊',
      '海山',
      '民生',
      '莒光',
      '大觀',
      '溪崑',
      '新板'
    ],
    '板橋中隊': [
      '板橋中隊',
      '板橋'
    ]
  },
  '第二大隊': {
    '大隊部': [
      '大隊部'
    ],
    '新莊中隊': [
      '新莊中隊',
      '新莊',
      '福營',
      '中港',
      '頭前'
    ],
    '泰林中隊': [
      '泰林中隊',
      '裕民',
      '泰山',
      '林口',
      '文化'
    ],
    '五股中隊': [
      '五股中隊',
      '五工',
      '五股',
      '更寮'
    ]
  },
  '第三大隊': {
    '大隊部': [
      '大隊部'
    ],
    '三重中隊': [
      '三重中隊',
      '三重',
      '重陽',
      '二重'
    ],
    '蘆洲中隊': [
      '蘆洲中隊',
      '鷺江',
      '蘆洲'
    ],
    '淡水中隊': [
      '淡水中隊',
      '龍源',
      '八里',
      '淡水',
      '竹圍',
      '三芝',
      '滬尾'
    ]
  },
  '第四大隊': {
    '大隊部': [
      '大隊部'
    ],
    '新店中隊': [
      '新店中隊',
      '新店',
      '安康',
      '安和',
      '直潭'
    ],
    '文山中隊': [
      '文山中隊',
      '深坑',
      '石碇',
      '坪林',
      '雪山',
      '烏來'
    ],
    '安康安檢': [
      '安康安檢'
    ]
  },
  '第五大隊': {
    '大隊部': [
      '大隊部'
    ],
    '土城中隊': [
      '土城中隊',
      '土城',
      '清水',
      '頂埔'
    ],
    '三鶯中隊': [
      '三鶯中隊',
      '三峽',
      '隆恩',
      '鶯歌',
      '鳳鳴'
    ],
    '樹林中隊': [
      '樹林中隊',
      '樹林',
      '樹潭',
      '柑園'
    ],
    '安檢小組': [
      '安檢小組'
    ]
  },
  '第六大隊': {
    '大隊部': [
      '大隊部'
    ],
    '瑞芳中隊': [
      '瑞芳中隊',
      '瑞芳',
      '瑞亭',
      '九份',
      '雙溪',
      '貢寮',
      '平溪'
    ],
    '金山中隊': [
      '金山中隊',
      '金山',
      '萬里',
      '石門'
    ],
    '汐止中隊': [
      '汐止中隊',
      '汐止',
      '社后',
      '橫科',
      '長青',
      '保長'
    ]
  },
  '第七大隊': {
    '大隊部': [
      '大隊部'
    ],
    '中和中隊': [
      '中和中隊',
      '中和',
      '南勢',
      '員山',
      '國光',
      '秀山'
    ],
    '永和中隊': [
      '永和中隊',
      '永平',
      '永和',
      '永利'
    ]
  },
  '特搜大隊': {
    '大隊部': [
      '大隊部'
    ],
    '特搜單位': [
      '南雅',
      '德音',
      '慈福',
      '大埔',
      '秀峰'
    ]
  }
};
const DISTRICT_FALLBACK = {
  '淡水': {lat:25.171, lng:121.443}, '三芝': {lat:25.258, lng:121.501}, '八里': {lat:25.146, lng:121.400},
  '五股': {lat:25.084, lng:121.438}, '三重': {lat:25.061, lng:121.488}, '蘆洲': {lat:25.085, lng:121.474},
  '板橋': {lat:25.013, lng:121.462}, '新莊': {lat:25.037, lng:121.453}, '土城': {lat:24.972, lng:121.442},
  '中和': {lat:24.999, lng:121.499}, '永和': {lat:25.010, lng:121.514}, '新店': {lat:24.967, lng:121.542},
  '汐止': {lat:25.064, lng:121.658}, '瑞芳': {lat:25.108, lng:121.805}, '金山': {lat:25.220, lng:121.640}
};


let firebaseEnabled = false;
let auth = null;
let db = null;
let fbUser = null;
let profile = null;
let cases = [];
let currentCaseId = null;
let currentCase = null;
let live = { vehicles: [], crews: [], hoses: [], hazards: [], logs: [] };
let unsubscribers = [];
let map = null;
let mapLayers = null;
let incidentCircle = null;
let pendingTool = null;
let localState = loadLocalState();

function loadLocalState(){
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { profile:null, cases:[] }; }
  catch { return { profile:null, cases:[] }; }
}
function saveLocalState(){ localStorage.setItem(LOCAL_KEY, JSON.stringify(localState)); }
function uid(prefix='id'){ return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`; }
function todayKey(){ const d = new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`; }
function fmtTime(ts){ const d = ts?.toDate ? ts.toDate() : new Date(ts || Date.now()); return d.toLocaleString('zh-TW',{hour12:false}); }
function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function toast(msg, ms=2400){ const el=$('toast'); el.textContent=msg; el.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>el.hidden=true,ms); }
function show(id){
  ['authScreen','profileScreen','approvalScreen','appScreen'].forEach(x => { const el=$(x); if(el) el.hidden = x !== id; });
  document.body.dataset.view = id;
  requestAnimationFrame(() => window.scrollTo({top:0,left:0,behavior:'instant'}));
}
function roleLabel(role){ return ({battalion:'大隊指揮/管理',commander:'現場指揮官',sector:'分區指揮/中隊幕僚',safety:'安全官',recorder:'紀錄官',unit:'單位帶隊官',viewer:'檢視者',admin:'最高管理員'})[role] || role || '未設定'; }

function init(){
  fillUnitFlat('profileBrigade','profileUnit','第三大隊');
  fillUnitFlat('vehicleBrigade','vehicleUnit','第三大隊');
  fillUnitFlat('crewBrigade','crewUnit','第三大隊');
  fillTrappedSelect('summaryTrappedCountMode');
  fillTrappedSelect();
  bindEvents();
  initFirebase();
}

function bindEvents(){
  $('googleLoginBtn').addEventListener('click', loginGoogle);
  $('demoLoginBtn').addEventListener('click', loginDemo);
  $('logoutBtn').addEventListener('click', logout);
  $('approvalLogoutBtn')?.addEventListener('click', logout);
  $('adminManageBtn')?.addEventListener('click', () => { $('adminSection').hidden = false; $('adminSection').scrollIntoView({behavior:'smooth'}); loadUsersForAdmin(); });
  $('refreshUsersBtn')?.addEventListener('click', loadUsersForAdmin);
  $('profileForm').addEventListener('submit', saveProfile);
  $('caseForm').addEventListener('submit', createCase);
  $('addVictimBtn').addEventListener('click', () => addVictimRow());
  $('caseTrapped').addEventListener('change', syncVictimDetails);
  $('caseTrappedCountMode').addEventListener('change', syncVictimDetails);
  $('refreshBtn').addEventListener('click', renderCases);
  $('backHomeBtn').addEventListener('click', backHome);
  $('saveCaseInfoBtn').addEventListener('click', saveCaseInfo);
  $('saveSummaryInfoBtn').addEventListener('click', saveSummaryInfo);
  $('summaryAddVictimBtn').addEventListener('click', () => addVictimRow({}, 'summaryVictimRows'));
  $('summaryTrapped').addEventListener('change', syncSummaryVictimDetails);
  $('summaryTrappedCountMode').addEventListener('change', syncSummaryVictimDetails);
  $('copyCommandSpeechBtn').addEventListener('click', copyCommandSpeech);
  $('copyReportBtn').addEventListener('click', copyReportDraft);
  $('printReportBtn').addEventListener('click', printReport);
  document.querySelectorAll('[data-stage]').forEach(btn => btn.addEventListener('click', () => selectCommandStage(btn.dataset.stage)));
  document.querySelectorAll('.support-grid input').forEach(ch => ch.addEventListener('change', () => { renderCommandGuide(); saveCaseInfo(false); }));
  $('fitMapBtn').addEventListener('click', fitMapToIncident);
  $('addVehicleBtn').addEventListener('click', addVehicle);
  $('addCrewBtn').addEventListener('click', addCrew);
  $('startHoseBtn').addEventListener('click', startHoseTool);
  $('hoseTargetType').addEventListener('change', renderToolOptions);
  document.querySelectorAll('.hazard-btn').forEach(btn => btn.addEventListener('click', () => startHazardTool(btn.dataset.hazard)));
  $('generateReportBtn').addEventListener('click', () => generateReport(true));
  $('saveExtraBtn').addEventListener('click', saveExtraNotes);
  $('syncFloorsBtn')?.addEventListener('click', syncBuildingFloors);
  $('saveBuildingOpsBtn')?.addEventListener('click', saveBuildingOps);
  $('floorPlanLevel')?.addEventListener('change', renderFloorPlan);
  $('floorPlanCanvas')?.addEventListener('click', addFloorMarkerFromClick);
  $('aiAdviceBtn')?.addEventListener('click', requestAiAdvice);
  $('localRuleAdviceBtn')?.addEventListener('click', () => renderLocalTacticalAdvice(true));
  ['arrivedCheck','commandCheck','ritCheck','hazardCheck','firstSideCheck','parCheck'].forEach(id => $(id)?.addEventListener('change', () => { renderCommandGuide(); saveCaseInfo(false); }));
  ['detailPurpose','detailFireStatus','detailNotes'].forEach(id => $(id)?.addEventListener('change', renderCommandGuide));
}

function getCompanies(brigade){ return Object.keys(UNIT_TREE[brigade] || UNIT_TREE['第三大隊']); }
function getUnits(brigade, company){
  const tree = UNIT_TREE[brigade] || UNIT_TREE['第三大隊'];
  return tree[company] || tree[getCompanies(brigade)[0]] || ['大隊部'];
}
function fillUnitCascade(brigadeId, companyId, unitId, defaultBrigade='第三大隊'){
  const b=$(brigadeId), c=$(companyId), u=$(unitId); if(!b || !c || !u) return;
  const previousBrigade = b.value || defaultBrigade;
  b.innerHTML = Object.keys(UNIT_TREE).map(x=>`<option>${x}</option>`).join('');
  b.value = UNIT_TREE[previousBrigade] ? previousBrigade : defaultBrigade;
  const updateCompany = () => {
    const prevCompany = c.value;
    const companies = getCompanies(b.value);
    c.innerHTML = companies.map(x=>`<option>${x}</option>`).join('');
    c.value = companies.includes(prevCompany) ? prevCompany : companies[0];
    updateUnit();
  };
  const updateUnit = () => {
    const prevUnit = u.value;
    const units = getUnits(b.value, c.value);
    u.innerHTML = units.map(x=>`<option>${x}</option>`).join('');
    u.value = units.includes(prevUnit) ? prevUnit : units[0];
  };
  b.onchange = updateCompany; c.onchange = updateUnit; updateCompany();
}

function flatUnits(brigade){
  const tree = UNIT_TREE[brigade] || UNIT_TREE['第三大隊'];
  const units = [];
  Object.entries(tree).forEach(([company, members]) => {
    if(!units.includes(company)) units.push(company);
    (members||[]).forEach(u => { if(!units.includes(u)) units.push(u); });
  });
  return units;
}
function fillUnitFlat(brigadeId, unitId, defaultBrigade='第三大隊'){
  const b=$(brigadeId), u=$(unitId); if(!b || !u) return;
  const previousBrigade = b.value || defaultBrigade;
  b.innerHTML = Object.keys(UNIT_TREE).map(x=>`<option>${x}</option>`).join('');
  b.value = UNIT_TREE[previousBrigade] ? previousBrigade : defaultBrigade;
  const updateUnit = () => {
    const prevUnit = u.value;
    const units = flatUnits(b.value);
    u.innerHTML = units.map(x=>`<option>${x}</option>`).join('');
    u.value = units.includes(prevUnit) ? prevUnit : units[0];
  };
  b.onchange = updateUnit; updateUnit();
}
function fillTrappedSelect(id='caseTrappedCountMode'){
  const sel = $(id); if(!sel) return;
  sel.innerHTML = Array.from({length:21},(_,i)=>`<option value="${i}">${i} 人</option>`).join('') + '<option value="manual">21 人以上 / 詳細填寫</option>';
  sel.value = '0';
}
function syncVictimDetails(){
  const trapped = $('caseTrapped')?.value === '有';
  const manual = $('caseTrappedCountMode')?.value === 'manual';
  const open = trapped && (manual || Number($('caseTrappedCountMode')?.value || 0) > 0);
  $('victimDetails').open = !!open;
  if(open && !$('victimRows').children.length) addVictimRow();
}

function syncSummaryVictimDetails(){
  const trapped = $('summaryTrapped')?.value === '有';
  const manual = $('summaryTrappedCountMode')?.value === 'manual';
  const open = trapped && (manual || Number($('summaryTrappedCountMode')?.value || 0) > 0);
  $('summaryVictimDetails').open = !!open;
  if(open && !$('summaryVictimRows').children.length) addVictimRow({}, 'summaryVictimRows');
}
function getSummaryTrappedCount(){
  if($('summaryTrapped')?.value !== '有') return 0;
  const mode = $('summaryTrappedCountMode')?.value || '0';
  if(mode === 'manual') return Math.max(21, readVictims('#summaryVictimRows .victim-row').length);
  return Number(mode) || 0;
}
function addVictimRow(data={}, wrapId='victimRows'){
  const wrap = $(wrapId); if(!wrap) return;
  const row = document.createElement('div');
  row.className = 'victim-row';
  row.innerHTML = `
    <select class="victim-sex"><option ${data.sex==='男'?'selected':''}>男</option><option ${data.sex==='女'?'selected':''}>女</option><option ${data.sex==='未知'?'selected':''}>未知</option></select>
    <select class="victim-age">${Array.from({length:101},(_,i)=>`<option value="${i}" ${String(data.age||'')===String(i)?'selected':''}>${i}歲</option>`).join('')}<option value="未知" ${data.age==='未知'?'selected':''}>年齡未知</option></select>
    <input class="victim-note" placeholder="備註：父、子、意識狀況、位置" value="${escapeHtml(data.note||'')}" />
    <button type="button" class="btn small ghost remove-victim">刪除</button>`;
  row.querySelector('.remove-victim').addEventListener('click', () => row.remove());
  wrap.appendChild(row);
}
function readVictims(selector='#victimRows .victim-row'){
  return Array.from(document.querySelectorAll(selector)).map(row => ({
    sex: row.querySelector('.victim-sex')?.value || '',
    age: row.querySelector('.victim-age')?.value || '',
    note: row.querySelector('.victim-note')?.value.trim() || ''
  })).filter(v => v.sex || v.age || v.note);
}
function getTrappedCount(){
  if($('caseTrapped')?.value !== '有') return 0;
  const mode = $('caseTrappedCountMode')?.value || '0';
  if(mode === 'manual') return Math.max(21, readVictims().length);
  return Number(mode) || 0;
}

function initFirebase(){
  firebaseEnabled = Boolean(window.FIRECOMMAND_FIREBASE_ENABLED && window.FIRECOMMAND_FIREBASE_CONFIG && !String(window.FIRECOMMAND_FIREBASE_CONFIG.apiKey||'').includes('PASTE_'));
  $('demoLoginBtn').style.display = firebaseEnabled ? 'none' : 'block';
  if(!firebaseEnabled){
    show('authScreen');
    return;
  }
  firebase.initializeApp(window.FIRECOMMAND_FIREBASE_CONFIG);
  auth = firebase.auth(); db = firebase.firestore();
  auth.onAuthStateChanged(async (user) => {
    fbUser = user;
    if(!user){ show('authScreen'); return; }
    const snap = await db.collection('users').doc(user.uid).get();
    if(!snap.exists){ prefillProfile(user); show('profileScreen'); return; }
    profile = { id:user.uid, ...snap.data() };
    await normalizeAdminProfile();
    if(!canEnterSystem()) { showApprovalScreen(); return; }
    enterApp();
  });
}

async function loginGoogle(){
  if(!firebaseEnabled){ loginDemo(); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
}
function loginDemo(){
  fbUser = { uid:'demo-user', email:'demo@local.test', displayName:'Demo 使用者' };
  if(localState.profile){ profile = localState.profile; enterApp(); }
  else { prefillProfile(fbUser); show('profileScreen'); }
}
function prefillProfile(user){
  $('profileRealName').value = user.displayName || '';
  $('profileCallName').value = user.displayName || '';
  $('profileBrigade').value = '第三大隊';
  $('profileBrigade').dispatchEvent(new Event('change'));
  $('profileUnit').value = '淡水';
}
async function logout(){
  cleanupSubscriptions(); currentCaseId=null; currentCase=null;
  if(firebaseEnabled) await auth.signOut();
  else { fbUser=null; profile=null; show('authScreen'); }
}
async function saveProfile(e){
  e.preventDefault();
  const isAdminEmail = (fbUser.email || '').toLowerCase() === SUPER_ADMIN_EMAIL;
  profile = {
    id: fbUser.uid,
    email: fbUser.email || '',
    realName: $('profileRealName').value.trim(),
    callName: $('profileCallName').value.trim(),
    brigade: $('profileBrigade').value,
    unit: $('profileUnit').value,
    title: $('profileTitle').value,
    role: isAdminEmail ? 'admin' : $('profileRole').value,
    status: isAdminEmail ? 'active' : 'pending',
    approvedBy: isAdminEmail ? SUPER_ADMIN_EMAIL : '',
    approvedAt: isAdminEmail ? Date.now() : null,
    isSuperAdmin: isAdminEmail,
    updatedAt: Date.now(),
    createdAt: profile?.createdAt || Date.now()
  };
  if(firebaseEnabled) await db.collection('users').doc(fbUser.uid).set(profile,{merge:true});
  else { localState.profile = profile; saveLocalState(); }
  if(!canEnterSystem()){ showApprovalScreen(); return; }
  enterApp();
}
function enterApp(){
  show('appScreen'); $('homePage').hidden=false; $('detailPage').hidden=true;
  $('userLine').textContent = `${profile.callName}｜${profile.brigade} / ${profile.unit}｜${roleLabel(profile.role)}`;
  setWatermark();
  const admin = isSuperAdmin();
  $('adminManageBtn') && ($('adminManageBtn').hidden = !admin);
  $('adminSection') && ($('adminSection').hidden = !admin);
  $('vehicleBrigade').value = profile.brigade || '第三大隊'; $('vehicleBrigade').dispatchEvent(new Event('change'));
  if(profile.unit){ $('vehicleUnit').value = profile.unit; }
  $('crewBrigade').value = profile.brigade || '第三大隊'; $('crewBrigade').dispatchEvent(new Event('change'));
  if(profile.unit){ $('crewUnit').value = profile.unit; }
  $('createCaseDetails').open = false;
  subscribeCases();
}

function cleanupSubscriptions(){ unsubscribers.forEach(fn => { try{fn()}catch{} }); unsubscribers=[]; }
function subscribeCases(){
  cleanupSubscriptions();
  if(firebaseEnabled){
    const unsub = db.collection('cases').where('brigade','==',profile.brigade).onSnapshot(snap => {
      cases = snap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      renderCases();
    }, err => toast(`案件讀取失敗：${err.message}`));
    unsubscribers.push(unsub);
  } else {
    cases = localState.cases.filter(c => !profile?.brigade || c.brigade === profile.brigade);
    renderCases();
  }
}
function renderCases(){
  const wrap = $('caseList');
  if(!cases.length){ wrap.innerHTML='<div class="empty">目前尚無案件。請展開「新增案件 / 貼上派遣令」建立第一筆案件。</div>'; return; }
  wrap.innerHTML = cases.map(c => `
    <article class="case-card">
      <div class="case-card-head"><span class="case-no">${escapeHtml(c.caseNo||'未編號')}</span><button class="btn small primary" data-open-case="${c.id}">進入</button></div>
      <div class="case-address">${escapeHtml(c.address||'未登錄地址')}</div>
      <div class="case-summary">${escapeHtml(c.summary||'尚無概要')}</div>
      <div class="tag-row">
        <span class="tag blue">${escapeHtml(c.type||'火警')}</span>
        <span class="tag">${escapeHtml(c.floors||'?')}樓建築</span>
        <span class="tag">起火：${escapeHtml(c.fireFloor||'未登錄')}</span>
        <span class="tag ${c.trapped==='有'?'red':'green'}">受困：${escapeHtml(c.trapped||'未知')} ${c.trappedCount||0}人</span>
      </div>
    </article>`).join('');
  wrap.querySelectorAll('[data-open-case]').forEach(btn => btn.addEventListener('click', () => openCase(btn.dataset.openCase)));
}

async function createCase(e){
  e.preventDefault();
  let address = normalizeAddress($('caseAddress').value.trim() || extractAddress($('dispatchText').value) || '新北市蘆洲區長榮路792號');
  toast('定位中，請稍候…', 1800);
  const loc = await geocodeAddress(address);
  const newCase = {
    caseNo: nextCaseNo(),
    address,
    type: $('caseType').value,
    summary: $('caseSummary').value.trim() || `${$('caseFloors').value||'?'}樓建築，${$('caseFireFloor').value||'起火樓層未明'}，受困狀況${$('caseTrapped').value}`,
    floors: Number($('caseFloors').value)||0,
    fireFloor: $('caseFireFloor').value.trim(),
    trapped: $('caseTrapped').value,
    trappedCount: getTrappedCount(),
    trappedCountMode: $('caseTrappedCountMode').value,
    victims: readVictims(),
    fireStatus: $('caseFireStatus').value,
    purpose: '住宅',
    arrived:false, commandTransfer:false, ritSet:false, hazardChecked:false,
    notes:'', extraNotes:'', lat:loc.lat, lng:loc.lng,
    brigade: profile.brigade, unit: profile.unit || '', createdBy: profile.id, createdByName: profile.callName,
    createdAt: Date.now(), updatedAt: Date.now()
  };
  let id;
  if(firebaseEnabled){
    const ref = await db.collection('cases').add(newCase); id = ref.id;
    await addLogRemote(id, 'case', `建立案件：${newCase.address}`);
  } else {
    id = uid('case'); localState.cases.unshift({ id, ...newCase, vehicles:[], crews:[], hoses:[], hazards:[], logs:[{id:uid('log'),type:'case',message:`建立案件：${newCase.address}`,createdAt:Date.now(),operator:profile.callName}] }); saveLocalState(); cases = localState.cases.filter(c=>c.brigade===profile.brigade);
  }
  $('caseForm').reset(); $('caseTrappedCountMode').value='0'; $('victimRows').innerHTML=''; $('victimDetails').open=false; $('createCaseDetails').open=false;
  openCase(id);
}
function nextCaseNo(){
  const prefix = `FC-${todayKey()}`;
  const count = cases.filter(c => String(c.caseNo||'').startsWith(prefix)).length + 1;
  return `${prefix}-${String(count).padStart(3,'0')}`;
}
function normalizeAddress(address=''){
  let a = String(address || '').trim().replace(/臺/g,'台');
  if(!a) return '';
  if(!/^台灣|^新北市|^臺北市|^台北市/.test(a) && /區/.test(a)) a = '新北市' + a;
  return a;
}
function extractAddress(text=''){
  const normalized = String(text||'').replace(/臺/g,'台');
  const m = normalized.match(/(?:新北市)?[\u4e00-\u9fa5]{1,4}區[^，,\n\r]{2,50}(?:路|街|巷|弄|號)[^，,\n\r]*/);
  return m ? normalizeAddress(m[0]) : '';
}
function fallbackCenter(address=''){
  for(const [key, val] of Object.entries(DISTRICT_FALLBACK)){
    if(String(address).includes(key)) return val;
  }
  return DEFAULT_CENTER;
}
function isNewTaipeiResult(item){
  const name = `${item.display_name||''} ${item.address?.city||''} ${item.address?.county||''} ${item.address?.state||''}`;
  return /新北|New Taipei|Taipei County/.test(name);
}
async function geocodeAddress(address){
  const normalized = normalizeAddress(address);
  const candidates = [normalized, `${normalized} 台灣`, `${normalized} New Taipei City Taiwan`];
  for(const qRaw of candidates){
    try{
      const q = encodeURIComponent(qRaw);
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=tw&accept-language=zh-TW&viewbox=121.30,25.33,121.90,24.80&bounded=1&q=${q}`;
      const res = await fetch(url);
      const data = await res.json();
      if(Array.isArray(data) && data.length){
        const preferred = data.find(isNewTaipeiResult) || data[0];
        return { lat:Number(preferred.lat), lng:Number(preferred.lon) };
      }
    }catch(err){ console.warn(err); }
  }
  toast('地址定位未找到精準點，先使用行政區中心點，進入後可拖曳標記修正。', 4200);
  return fallbackCenter(normalized);
}


function backHome(){
  cleanupSubscriptions(); currentCaseId=null; currentCase=null;
  $('detailPage').hidden=true; $('homePage').hidden=false;
  subscribeCases();
}
function openCase(id){
  cleanupSubscriptions(); currentCaseId = id;
  $('homePage').hidden=true; $('detailPage').hidden=false;
  if(firebaseEnabled){ subscribeCaseRemote(id); }
  else { loadCaseLocal(id); }
  setTimeout(()=>{ initMap(); renderMap(); }, 120);
}
function subscribeCaseRemote(id){
  const caseUnsub = db.collection('cases').doc(id).onSnapshot(doc => { currentCase = { id:doc.id, ...doc.data() }; renderDetail(); });
  unsubscribers.push(caseUnsub);
  ['vehicles','crews','hoses','hazards','logs'].forEach(coll => {
    const unsub = db.collection('cases').doc(id).collection(coll).onSnapshot(snap => {
      live[coll] = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
      renderLiveParts();
    });
    unsubscribers.push(unsub);
  });
}
function loadCaseLocal(id){
  currentCase = localState.cases.find(c=>c.id===id);
  live.vehicles = currentCase.vehicles || [];
  live.crews = currentCase.crews || [];
  live.hoses = currentCase.hoses || [];
  live.hazards = currentCase.hazards || [];
  live.logs = currentCase.logs || [];
  renderDetail(); renderLiveParts();
}
function saveLocalCase(){
  if(!currentCase) return;
  currentCase.vehicles = live.vehicles; currentCase.crews = live.crews; currentCase.hoses = live.hoses; currentCase.hazards = live.hazards; currentCase.logs = live.logs;
  const idx = localState.cases.findIndex(c=>c.id===currentCase.id); if(idx>=0) localState.cases[idx] = currentCase;
  saveLocalState();
}
function renderDetail(){
  if(!currentCase) return;
  $('detailCaseNo').textContent = currentCase.caseNo || '';
  $('detailAddress').textContent = currentCase.address || '未登錄地址';
  setWatermark();
  const admin = isSuperAdmin();
  $('adminManageBtn') && ($('adminManageBtn').hidden = !admin);
  $('adminSection') && ($('adminSection').hidden = !admin);
  $('arrivedCheck').checked = !!currentCase.arrived;
  $('commandCheck').checked = !!currentCase.commandTransfer;
  $('ritCheck').checked = !!currentCase.ritSet;
  $('hazardCheck').checked = !!currentCase.hazardChecked;
  $('firstSideCheck').checked = !!currentCase.firstSideSet;
  $('parCheck').checked = !!currentCase.parRequested;
  $('detailPurpose').value = currentCase.purpose || '住宅';
  $('detailFireStatus').value = currentCase.fireStatus || '未知';
  $('detailNotes').value = currentCase.notes || '';
  $('extraNotes').value = currentCase.extraNotes || '';
  $('summaryFloors').value = currentCase.floors || '';
  $('summaryFireFloor').value = currentCase.fireFloor || '';
  $('summaryTrapped').value = currentCase.trapped || '未知';
  $('summaryTrappedCountMode').value = currentCase.trappedCountMode || String(currentCase.trappedCount || 0);
  if(!Array.from($('summaryTrappedCountMode').options).some(o=>o.value===$('summaryTrappedCountMode').value)) $('summaryTrappedCountMode').value = 'manual';
  $('summaryText').value = currentCase.summary || '';
  $('summaryVictimRows').innerHTML = '';
  (currentCase.victims || []).forEach(v => addVictimRow(v, 'summaryVictimRows'));
  syncSummaryVictimDetails();
  applySupportValues(currentCase.supports || []);
  renderSummaryCards(); renderCommandGuide(); renderBuildingOps(); renderLocalTacticalAdvice(false); renderLiveParts();
}
function renderSummaryCards(){
  const c=currentCase;
  $('summaryCards').innerHTML = `
    <div class="mini-card"><div class="metric">${c.floors||'?'}</div><div class="metric-label">建物樓層</div><div class="subline">起火：${escapeHtml(c.fireFloor||'未登錄')}</div></div>
    <div class="mini-card"><div class="metric">${c.trapped==='有'?'有':'?'}</div><div class="metric-label">受困狀況</div><div class="subline">${c.trappedCount||0} 人</div></div>
    <div class="mini-card"><div class="metric">${live.vehicles.length}</div><div class="metric-label">車輛</div><div class="subline">目前部署</div></div>
    <div class="mini-card"><div class="metric">${sum(live.crews,'count')}</div><div class="metric-label">人員</div><div class="subline">作業/待命/休息/RIT</div></div>`;
}
function renderLiveParts(){
  if(!currentCase) return;
  renderSummaryCards(); renderToolOptions(); renderMap(); renderDashboard(); renderRules(); renderLogs(); renderCommandGuide(); renderBuildingOps(); renderLocalTacticalAdvice(false); generateReport(false);
}
function renderToolOptions(){
  const canHose = live.vehicles.filter(v => v.canHose);
  $('hoseVehicle').innerHTML = canHose.length ? canHose.map(v=>`<option value="${v.id}">${escapeHtml(v.name)}｜${escapeHtml(v.unit)}</option>`).join('') : '<option value="">尚無可接水線車輛</option>';
  const crewOwners = live.crews.map(p=>`<option value="${escapeHtml(p.unit + p.leader)}">${escapeHtml(p.unit)}${escapeHtml(p.leader)}｜${p.count}人</option>`).join('');
  const unitOwners = flatUnits(profile?.brigade || '第三大隊').map(u=>`<option value="${escapeHtml(u)}">${escapeHtml(u)}｜單位/分隊</option>`).join('');
  $('hoseOwner').innerHTML = (crewOwners + unitOwners) || `<option value="${escapeHtml(profile?.unit||'現場') }">${escapeHtml(profile?.unit||'現場')}</option>`;
  const targetType = $('hoseTargetType')?.value || 'map';
  if(targetType === 'vehicle'){
    $('hoseTarget').disabled = false;
    $('hoseTarget').innerHTML = live.vehicles.map(v=>`<option value="${v.id}">${escapeHtml(v.name)}｜${escapeHtml(v.unit)}</option>`).join('') || '<option value="">尚無車輛</option>';
  } else if(targetType === 'crew'){
    $('hoseTarget').disabled = false;
    $('hoseTarget').innerHTML = live.crews.map(p=>`<option value="${p.id}">${escapeHtml(p.unit)}${escapeHtml(p.leader)}｜${p.count}人</option>`).join('') || '<option value="">尚無人員編組</option>';
  } else {
    $('hoseTarget').disabled = true;
    $('hoseTarget').innerHTML = '<option value="">請點地圖目的地</option>';
  }
}
async function saveCaseInfo(showToast=true){
  if(!currentCase) return;
  const supports = readSupports();
  const patch = { arrived:$('arrivedCheck').checked, commandTransfer:$('commandCheck').checked, ritSet:$('ritCheck').checked, hazardChecked:$('hazardCheck').checked, firstSideSet:$('firstSideCheck').checked, parRequested:$('parCheck').checked, purpose:$('detailPurpose').value, fireStatus:$('detailFireStatus').value, supports, notes:$('detailNotes').value, updatedAt:Date.now() };
  Object.assign(currentCase, patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true});
  else { saveLocalCase(); renderDetail(); }
  await addLog('arrival','更新到場回報 / 到建火人支初資訊');
  renderCommandGuide();
  if(showToast) toast('已儲存到場回報');
}
async function saveSummaryInfo(){
  if(!currentCase) return;
  const patch = { floors:Number($('summaryFloors').value)||0, fireFloor:$('summaryFireFloor').value.trim(), trapped:$('summaryTrapped').value, trappedCount:getSummaryTrappedCount(), trappedCountMode:$('summaryTrappedCountMode').value, victims:readVictims('#summaryVictimRows .victim-row'), summary:$('summaryText').value.trim(), updatedAt:Date.now() };
  Object.assign(currentCase, patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true});
  else { saveLocalCase(); renderDetail(); }
  await addLog('case','更新案件概要（開案資料）');
  renderSummaryCards(); renderCommandGuide(); generateReport(false);
  toast('已儲存案件概要');
}
function readSupports(){ return Array.from(document.querySelectorAll('.support-grid input:checked')).map(x=>x.value); }
function applySupportValues(values=[]){ document.querySelectorAll('.support-grid input').forEach(x=>{ x.checked = values.includes(x.value); }); }
async function saveExtraNotes(){
  const patch = { extraNotes:$('extraNotes').value, updatedAt:Date.now() };
  Object.assign(currentCase, patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase();
  await addLog('case','更新案件補充資料'); toast('已儲存補充資料');
}

function initMap(){
  if(map) { setTimeout(()=> map.invalidateSize(), 100); return; }
  map = L.map('map', { zoomControl:true }).setView([currentCase?.lat || DEFAULT_CENTER.lat, currentCase?.lng || DEFAULT_CENTER.lng], 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  mapLayers = L.layerGroup().addTo(map);
  map.on('click', handleMapClick);
  setTimeout(()=> map.invalidateSize(), 200);
}
function renderMap(){
  if(!map || !currentCase || !mapLayers) return;
  mapLayers.clearLayers();
  const lat = Number(currentCase.lat || DEFAULT_CENTER.lat), lng = Number(currentCase.lng || DEFAULT_CENTER.lng);
  if(!incidentCircle){ incidentCircle = L.circle([lat,lng], {radius:200,color:'#b5281d',weight:2,fillColor:'#b5281d',fillOpacity:.05}).addTo(map); }
  else incidentCircle.setLatLng([lat,lng]);
  if(map.getZoom() < 15) map.setView([lat,lng],17);
  L.marker([lat,lng], {icon:labelIcon('📍 案件中心','hazard')}).addTo(mapLayers).bindPopup('案件中心');

  live.hoses.forEach(h => {
    const pts = getHosePoints(h);
    const from = pts.from, to = pts.to;
    if(from && to){
      const label = `${h.owner || h.unit || ''}${h.port || ''}｜${h.kind || '水線'}｜${h.task || ''}`;
      const poly = L.polyline([from,to], { color:'#245fc6', weight:5, opacity:.85 }).addTo(mapLayers);
      poly.bindPopup(`${escapeHtml(h.vehicleName)} ${escapeHtml(h.port)}<br>歸屬：${escapeHtml(h.owner||h.unit||'')}<br>目的地：${escapeHtml(h.targetName||'地圖點')}<br>性質：${escapeHtml(h.kind||'水線')}<br>${escapeHtml(h.task||'')}`);
      poly.on('click', () => editHoseLabel(h));
      L.marker([(from[0]+to[0])/2,(from[1]+to[1])/2], {icon:labelIcon(label,'hose-label')}).addTo(mapLayers);
    }
  });
  live.vehicles.forEach(v => {
    const m = L.marker([v.lat,v.lng], { draggable:true, icon:labelIcon(`${vehEmoji(v.type)} ${escapeHtml(v.name)}`, `veh ${vehClass(v.type)}`) }).addTo(mapLayers);
    m.bindPopup(`<b>${escapeHtml(v.name)}</b><br>${escapeHtml(v.unit)}｜${escapeHtml(v.type)}<br>任務：${escapeHtml(v.task)}<br>${v.canHose?'水線接口：1～4線':'不可接水線'}`);
    m.on('dragend', async ev => { const ll=ev.target.getLatLng(); await updateItem('vehicles', v.id, {lat:ll.lat,lng:ll.lng}); await addLog('vehicle', `${v.name} 部署位置更新`); });
  });
  live.crews.forEach(p => {
    const m = L.marker([p.lat,p.lng], { draggable:true, icon:labelIcon(`👥 ${escapeHtml(p.unit)}${escapeHtml(p.leader)}｜${p.count}人`, `person ${personClass(p.status)}`) }).addTo(mapLayers);
    m.bindPopup(`<b>${escapeHtml(p.unit)}${escapeHtml(p.leader)}</b><br>${p.count}人｜${escapeHtml(p.status)}<br>${escapeHtml(p.task)}`);
    m.on('dragend', async ev => { const ll=ev.target.getLatLng(); await updateItem('crews', p.id, {lat:ll.lat,lng:ll.lng}); await addLog('crew', `${p.unit}${p.leader} 人員位置更新`); });
  });
  live.hazards.forEach(h => {
    const m = L.marker([h.lat,h.lng], { draggable:true, icon:labelIcon(`${hazEmoji(h.type)} ${escapeHtml(h.type)}`,'hazard') }).addTo(mapLayers);
    m.bindPopup(escapeHtml(h.type));
    m.on('dragend', async ev => { const ll=ev.target.getLatLng(); await updateItem('hazards', h.id, {lat:ll.lat,lng:ll.lng}); await addLog('hazard', `${h.type} 標示位置更新`); });
  });
}
function getHosePoints(h){
  const v = live.vehicles.find(x=>x.id===h.vehicleId);
  const from = v ? [Number(v.lat), Number(v.lng)] : h.from;
  let target = null;
  if(h.targetType === 'vehicle') target = live.vehicles.find(x=>x.id===h.targetId);
  if(h.targetType === 'crew') target = live.crews.find(x=>x.id===h.targetId);
  const to = target ? [Number(target.lat), Number(target.lng)] : (h.lat && h.lng ? [Number(h.lat), Number(h.lng)] : null);
  return { from, to };
}
async function editHoseLabel(h){
  const next = prompt('請輸入水線歸屬 / 標籤', h.owner || h.unit || '');
  if(next === null) return;
  await updateItem('hoses', h.id, { owner: next.trim() || h.owner || h.unit || '' });
  await addLog('hose', `更新水線標籤：${h.vehicleName || ''} ${h.port || ''}`);
}
function labelIcon(text, className){ return L.divIcon({ html:`<div class="map-label ${className}">${text}</div>`, className:'leaflet-div-icon', iconSize:[1,1], iconAnchor:[0,0] }); }
function fitMapToIncident(){ if(!map || !currentCase) return; map.fitBounds(L.circle([currentCase.lat,currentCase.lng],{radius:200}).getBounds()); }
function handleMapClick(e){
  if(!pendingTool) return;
  if(pendingTool.type === 'hazard') addHazardAt(pendingTool.hazardType, e.latlng.lat, e.latlng.lng);
  if(pendingTool.type === 'hose') addHoseAt(pendingTool, e.latlng.lat, e.latlng.lng);
  pendingTool = null;
}

async function addItem(coll, data){
  data.createdAt = data.createdAt || Date.now();
  if(firebaseEnabled){ await db.collection('cases').doc(currentCaseId).collection(coll).add(data); }
  else { live[coll].push({ id:uid(coll), ...data }); saveLocalCase(); renderLiveParts(); }
}
async function updateItem(coll, id, patch){
  patch.updatedAt = Date.now();
  if(firebaseEnabled){ await db.collection('cases').doc(currentCaseId).collection(coll).doc(id).set(patch,{merge:true}); }
  else { const arr=live[coll]; const item=arr.find(x=>x.id===id); if(item) Object.assign(item,patch); saveLocalCase(); renderLiveParts(); }
}
async function addVehicle(){
  if(!currentCase) return;
  const brigade = $('vehicleBrigade').value, unit = $('vehicleUnit').value;
  const name = $('vehicleName').value.trim() || `${unit}11`;
  const type = vehicleType(name);
  const offset = (live.vehicles.length + 1) * 0.00016;
  await addItem('vehicles', { brigade, unit, name, type:type.label, canHose:type.canHose, task:$('vehicleTask').value.trim()||'待命', status:'部署', lat:Number(currentCase.lat)+offset, lng:Number(currentCase.lng)+offset*1.1 });
  await addLog('vehicle', `新增車輛：${unit} ${name}｜${type.label}`);
  $('vehicleName').value=''; $('vehicleTask').value=''; toast('車輛已加入地圖');
}
async function addCrew(){
  if(!currentCase) return;
  const offset = (live.crews.length + 1) * 0.00016;
  const brigade = $('crewBrigade').value, unit = $('crewUnit').value, leader = $('crewLeader').value, count = Number($('crewCount').value)||4, status=$('crewStatus').value;
  await addItem('crews', { brigade, unit, leader, count, status, task:$('crewTask').value.trim()||status, dispatchCount: status==='作業中'?1:0, startAt:Date.now(), lat:Number(currentCase.lat)-offset, lng:Number(currentCase.lng)+offset });
  await addLog('crew', `新增人員：${unit}${leader}｜${count}人｜${status}`);
  $('crewTask').value=''; toast('人員已加入地圖');
}
function startHoseTool(){
  const vehicleId = $('hoseVehicle').value;
  if(!vehicleId){ toast('目前沒有可接水線的車輛'); return; }
  const v = live.vehicles.find(x=>x.id===vehicleId);
  const tool = {
    type:'hose',
    vehicleId,
    vehicleName:v?.name||'',
    unit:v?.unit||'',
    owner:$('hoseOwner').value || v?.unit || '',
    port:$('hosePort').value,
    task:$('hoseTask').value.trim()||'水線作業',
    kind:$('hoseKind')?.value || '進攻水線',
    targetType:$('hoseTargetType').value,
    targetId:$('hoseTarget').value
  };
  if(tool.targetType === 'map'){
    pendingTool = tool;
    toast('請在地圖上點選水線目的地，可拉到建築物內或消防栓位置');
  } else {
    addHoseToTarget(tool);
  }
}
async function addHoseAt(tool, lat, lng){
  const v = live.vehicles.find(x=>x.id===tool.vehicleId);
  await addItem('hoses', { vehicleId:tool.vehicleId, vehicleName:v?.name||tool.vehicleName, unit:v?.unit||tool.unit, owner:tool.owner, port:tool.port, task:tool.task, kind:tool.kind || '進攻水線', status:'使用中', targetType:'map', targetName:'地圖點 / 建築物', from:v?[v.lat,v.lng]:null, lat, lng });
  await addLog('hose', `建立水線：${tool.owner || tool.unit}｜${tool.vehicleName} ${tool.port}｜${tool.task}`);
  toast('水線已建立');
}
async function addHoseToTarget(tool){
  const v = live.vehicles.find(x=>x.id===tool.vehicleId);
  const target = tool.targetType === 'vehicle' ? live.vehicles.find(x=>x.id===tool.targetId) : live.crews.find(x=>x.id===tool.targetId);
  if(!target){ toast('請先選擇水線目的地'); return; }
  const targetName = tool.targetType === 'vehicle' ? `${target.name}｜${target.unit}` : `${target.unit}${target.leader}｜${target.count}人`;
  await addItem('hoses', { vehicleId:tool.vehicleId, vehicleName:v?.name||tool.vehicleName, unit:v?.unit||tool.unit, owner:tool.owner, port:tool.port, task:tool.task, kind:tool.kind || '進攻水線', status:'使用中', targetType:tool.targetType, targetId:target.id, targetName, from:v?[v.lat,v.lng]:null });
  await addLog('hose', `建立連結水線：${tool.owner || tool.unit}｜${tool.vehicleName} → ${targetName}`);
  toast('水線 / 連結已建立');
}
function startHazardTool(type){ pendingTool = { type:'hazard', hazardType:type }; toast(`請在地圖點選「${type}」位置`); }
async function addHazardAt(type, lat, lng){ await addItem('hazards', { type, lat, lng }); await addLog('hazard', `新增標示：${type}`); toast(`${type} 已標示`); }
function vehicleType(name){
  const n=(String(name).match(/\d/)||['1'])[0];
  const map={1:['水車',true],2:['直線雲梯車',false],3:['曲折雲梯車',false],4:['指揮/後勤車',false],5:['化學車',true],6:['水庫車',true],7:['救助車',false],8:['照明/排煙車',false],9:['救護車',false]};
  const r=map[n]||['其他',false]; return {label:r[0], canHose:r[1]};
}
function vehEmoji(t=''){ if(t.includes('救護'))return'🚑'; if(t.includes('雲梯'))return'🪜'; if(t.includes('救助'))return'🛠️'; if(t.includes('指揮'))return'🎙️'; return'🚒'; }
function vehClass(t=''){ if(t.includes('救護'))return'ambulance'; if(t.includes('雲梯'))return'ladder'; if(t.includes('救助'))return'rescue'; return'water'; }
function personClass(s=''){ return s==='休息'?'rest':s==='RIT'?'rit':s==='待命'?'standby':''; }
function hazEmoji(t=''){ return {起火點:'🔥',瓦斯:'🔥',高壓電:'⚡',危險物:'☣️',指揮站:'🎙️',休息區:'🟢'}[t] || '⚠️'; }

function renderDashboard(){
  const vehicleTypes = countBy(live.vehicles,'type'); const crewStatus = countBy(live.crews,'status');
  $('statusCards').innerHTML = `
    <div class="mini-card"><div class="metric">${live.vehicles.length}</div><div class="metric-label">車輛</div><div class="subline">${entriesText(vehicleTypes) || '尚無'}</div></div>
    <div class="mini-card"><div class="metric">${sum(live.crews,'count')}</div><div class="metric-label">人員</div><div class="subline">${entriesText(crewStatus) || '尚無'}</div></div>
    <div class="mini-card"><div class="metric">${live.hoses.length}</div><div class="metric-label">水線</div><div class="subline">使用中 / 待撤收</div></div>
    <div class="mini-card"><div class="metric">${live.hazards.length}</div><div class="metric-label">標示</div><div class="subline">火點、危害、指揮站</div></div>`;
  $('crewCards').innerHTML = live.crews.length ? live.crews.map(p=>`<div class="mini-card wide"><span class="tag ${p.status==='RIT'?'red':p.status==='休息'?'green':p.status==='待命'?'blue':'amber'}">${escapeHtml(p.status)}</span><h3>${escapeHtml(p.unit)}${escapeHtml(p.leader)}</h3><div class="metric">${p.count}</div><div class="metric-label">人員</div><div class="subline">任務：${escapeHtml(p.task)}<br>派遣：${p.dispatchCount||0}次｜作業：${Math.max(0,Math.round((Date.now()-(p.startAt||Date.now()))/60000))}分</div></div>`).join('') : '<div class="empty">尚無人員資料。</div>';
  $('vehicleCards').innerHTML = live.vehicles.length ? live.vehicles.map(v=>`<div class="mini-card wide"><span class="tag blue">${escapeHtml(v.type)}</span><h3>${escapeHtml(v.name)}</h3><div class="metric-label">${escapeHtml(v.unit)}</div><div class="subline">任務：${escapeHtml(v.task)}<br>水線：${live.hoses.filter(h=>h.vehicleId===v.id).length}/${v.canHose?4:0}</div></div>`).join('') : '<div class="empty">尚無車輛資料。</div>';
}
function renderRules(){
  const c=currentCase; if(!c) return; const a=[];
  if(!c.arrived) a.push(['amber','尚未標記到達，抵達後請完成到場回報。']);
  if(!c.commandTransfer) a.push(['amber','尚未完成指揮權轉移確認。']);
  if((c.trapped==='有'||c.trappedCount>0)&&!c.ritSet) a.push(['red','已登錄受困資訊，請確認搜救任務、RIT 與 PAR。']);
  if(/工廠|倉庫/.test((c.type||'')+(c.purpose||''))&&!c.hazardChecked) a.push(['red','工廠/倉庫火災，請詢問危險物品並考慮台電、瓦斯、毒災應變隊。']);
  if(c.fireStatus==='黑煙') a.push(['amber','黑煙可能代表高熱或高可燃物負荷，請注意內攻安全與氣量。']);
  if(!live.hazards.some(h=>h.type==='指揮站')) a.push(['blue','尚未在地圖標示指揮站位置。']);
  if(live.hazards.some(h=>h.type==='瓦斯')) a.push(['red','已標示瓦斯危害，請確認瓦斯單位與管線關閉。']);
  $('ruleAlerts').innerHTML = (a.length?a:[['green','目前沒有重大未完成提示。']]).map(([cls,msg])=>`<div class="tag ${cls}">${escapeHtml(msg)}</div>`).join('');
}
function renderLogs(){ $('logList').innerHTML = live.logs.length ? live.logs.slice().reverse().map(l=>`<div class="log"><div class="log-time">${fmtTime(l.createdAt)}｜${escapeHtml(l.type)}｜${escapeHtml(l.operator||'')}</div><div>${escapeHtml(l.message)}</div></div>`).join('') : '<div class="empty">尚無時間軸紀錄。</div>'; }
async function addLog(type, message){ if(firebaseEnabled) await addLogRemote(currentCaseId,type,message); else { live.logs.push({id:uid('log'),type,message,createdAt:Date.now(),operator:profile.callName}); saveLocalCase(); renderLogs(); } }
async function addLogRemote(caseId,type,message){ await db.collection('cases').doc(caseId).collection('logs').add({type,message,createdAt:Date.now(),operator:profile.callName,operatorId:profile.id}); }
function renderPhotos(){}
function generateReport(scroll=false){
  if(!currentCase) return '';
  const speech = buildFullSpeech();
  const crews = sum(live.crews,'count');
  const summary = [
    `【FireCommand 火場進度報告】`,
    `案件：${currentCase.caseNo || ''}`,
    `地址：${currentCase.address || ''}`,
    `產出者：${profile?.callName || ''}｜${profile?.brigade || ''}/${profile?.unit || ''}`,
    ``,
    speech,
    ``,
    `【人車水線狀態】`,
    `車輛：${live.vehicles.length} 台；人員：${crews} 人；水線：${live.hoses.length} 條；危害標示：${live.hazards.length} 處。`,
    ``,
    `【建物內部作戰圖】`,
    ...buildingReportLines(),
    ``,
    `【AI / 規則建議】`,
    (currentCase.aiLastAdvice || localTacticalAdviceText()),
    ``,
    `【操作進度與最近紀錄】`,
    ...live.logs.slice(-10).map(l => `- ${fmtTime(l.createdAt)} ${l.operator||''}：${l.message}`)
  ].join('\n');
  $('reportDraft').value = summary;
  $('commandSpeech').value = speech;
  renderReportPreview(summary);
  if(scroll) $('reportDraft').scrollIntoView({behavior:'smooth',block:'center'});
  return summary;
}
function buildFullSpeech(){
  const c=currentCase || {}; const supports = (c.supports || readSupports() || []).join('、') || '現場暫無新增支援';
  const commander = profile?.callName || '現場指揮官';
  const firstSide = c.firstSideSet ? '已設定第一面並成立指揮站及人員裝備集結區' : '第一面及指揮站位置確認中';
  const deployed = live.crews.length ? live.crews.map(p=>`${p.unit}${p.leader}執行${p.task||p.status}`).join('、') : '初期部署資料持續登錄中';
  const vehicles = live.vehicles.length ? live.vehicles.map(v=>`${v.name}${v.task?`執行${v.task}`:''}`).join('、') : '出勤人車持續確認中';
  return `北海北海，${commander}回報：\n`+
    `一、到：現場${c.arrived?'已到達':'到達確認中'}，指揮權${c.commandTransfer?'已轉移接掌':'尚未完成轉移'}，${firstSide}，${c.parRequested?'已要求各單位進行PAR安全回報':'PAR尚未完成要求'}。\n`+
    `二、建：現場為${c.purpose||'未登錄'}用途建物，樓高${c.floors||'未登錄'}樓，起火樓層為${c.fireFloor||'未登錄'}。\n`+
    `三、火：目前火煙狀況為${c.fireStatus||'未登錄'}，${c.summary||'現場狀況持續確認中'}，後續將回報第一、二、三、四面360查看狀況。\n`+
    `四、人：人員受困狀況為${c.trapped||'未知'}，受困人數${c.trappedCount||0}人，${c.ritSet?'已律定RIT小組':'尚未律定RIT小組，請儘速指派'}。\n`+
    `五、支：目前支援需求：${supports}。${c.hazardChecked?'已詢問危險物狀況':'尚未完成危險物詢問，請中隊幕僚尋找關係人確認'}。\n`+
    `六、初：初期人員部署為${deployed}；車輛部署為${vehicles}。後續持續回報水源、雲梯、RIT與各面火煙狀況。`;
}
function renderReportPreview(text){
  const el=$('reportPreview'); if(!el) return;
  el.innerHTML = `<div class="report-paper" data-watermark="${escapeHtml(watermarkText())}"><pre>${escapeHtml(text)}</pre></div>`;
}
function copyReportDraft(){ const text = generateReport(false); navigator.clipboard?.writeText(text); toast('已複製進度報告'); addLog('export','複製火場進度報告'); }
function copyCommandSpeech(){ const text = buildFullSpeech(); navigator.clipboard?.writeText(text); $('commandSpeech').value=text; toast('已複製回報稿'); addLog('export','複製到建火人支初回報稿'); }
function printReport(){
  const text = generateReport(false);
  const wm = watermarkText();
  const win = window.open('', '_blank');
  if(!win){ toast('瀏覽器阻擋彈出視窗，請允許彈出後再試'); return; }
  win.document.write(`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>${escapeHtml(currentCase.caseNo||'FireCommand進度報告')}</title><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Noto Sans TC',sans-serif;margin:32px;color:#1d1a17;line-height:1.7}.page{position:relative;min-height:100vh}.page:before{content:attr(data-watermark);position:fixed;inset:0;display:block;white-space:pre-wrap;font-size:28px;font-weight:800;color:rgba(150,40,30,.10);transform:rotate(-22deg);line-height:3;z-index:-1}h1{margin:0 0 12px}.meta{color:#6f6860;border-bottom:1px solid #ddd;padding-bottom:10px;margin-bottom:18px}pre{white-space:pre-wrap;font-size:16px}.footer{position:fixed;bottom:18px;left:32px;right:32px;color:#8a8176;font-size:12px;border-top:1px solid #ddd;padding-top:8px}@media print{button{display:none}}
  </style></head><body><div class="page" data-watermark="${escapeHtml(wm)}"><h1>FireCommand 火場進度報告</h1><div class="meta">案件：${escapeHtml(currentCase.caseNo||'')}｜地址：${escapeHtml(currentCase.address||'')}｜產出：${escapeHtml(wm)}</div><pre>${escapeHtml(text)}</pre><div class="footer">${escapeHtml(wm)}｜僅供勤務使用，禁止外流</div></div><script>setTimeout(()=>window.print(),400)<\/script></body></html>`);
  win.document.close();
  addLog('export','開啟進度報告列印 / PDF');
}
function watermarkText(){ return `${profile?.realName || profile?.callName || '未具名'}｜${profile?.brigade || ''}/${profile?.unit || ''}｜${currentCase?.caseNo || 'FireCommand'}｜${new Date().toLocaleString('zh-TW',{hour12:false})}｜僅供勤務使用`; }
function setWatermark(){ document.body.dataset.watermark = watermarkText(); }
let activeStage='到';
function selectCommandStage(stage){ activeStage = stage; document.querySelectorAll('[data-stage]').forEach(b=>b.classList.toggle('active', b.dataset.stage===stage)); renderCommandGuide(); }
function renderCommandGuide(){
  if(!currentCase || !$('commandAdvice')) return;
  const c=currentCase; const stage=activeStage;
  const blocks = commandBlocks(stage, c);
  $('commandAdvice').innerHTML = `<div class="advice-grid"><div class="advice-box"><h4>必須確認</h4><ol>${blocks.confirm.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol></div><div class="advice-box"><h4>應執行事項</h4><ol>${blocks.action.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol></div></div>`;
  $('commandSpeech').value = blocks.speech + '\n\n' + buildFullSpeech();
}
function commandBlocks(stage,c){
  const common = {
    '到': {
      confirm:['是否已抵達現場','是否完成指揮權轉移','第一面、指揮站、人員裝備集結區位置','後續到達單位報到位置','是否要求PAR安全回報'],
      action:['抵達後通報指揮中心','完成指揮權轉移','宣布第一面並建立指揮站','要求各單位帶隊官PAR回報'],
      speech:`北海北海，${profile?.callName||'現場指揮'}抵達現場，開始進行指揮權轉移，稍後再向北海續報。現場指揮權轉移後，請各單位帶隊官進行PAR人數清點安全回報。`
    },
    '建': {
      confirm:['建物用途與場所特性','樓高與地下樓層','起火樓層','是否鐵皮、工廠、倉庫或特殊場所','是否需要詢問關係人'],
      action:['確認建物用途、樓高與起火樓層','提醒同仁注意場所特殊事項','必要時請幕僚尋找關係人'],
      speech:`現場為${c.purpose||'未登錄'}用途建物，樓高${c.floors||'未登錄'}樓，起火樓層為${c.fireFloor||'未登錄'}，場所特性與危險物狀況持續確認。`
    },
    '火': {
      confirm:['火勢樓層、位置與面向','煙色與火勢大小','有無延燒之虞','燃燒面積估計','第一至第四面360查看狀況'],
      action:['回報目前火煙狀況','完成360查看後續報各面狀況','若雲梯受煙熱影響需提醒降梯移位'],
      speech:`目前${c.fireFloor||'起火樓層未明'}火煙狀況為${c.fireStatus||'未登錄'}，有無延燒與燃燒面積持續確認，後續進行第一、二、三、四面360查看後再向北海回報。`
    },
    '人': {
      confirm:['是否有人受困','受困人數、位置、性別與年齡','是否已派遣搜救任務','是否已律定RIT','是否建立救護區並啟動PAR'],
      action:['優先確認受困位置','派遣搜救任務','律定RIT待命','必要時要求PAR與加派救護支援'],
      speech:`目前人員受困狀況為${c.trapped||'未知'}，受困人數${c.trappedCount||0}人，${c.ritSet?'已律定RIT':'尚未律定RIT，請儘速指派'}，搜救與救護需求持續確認。`
    },
    '支': {
      confirm:['是否需要水車、水庫車、雲梯、救護支援','是否通知台電斷電','是否通知瓦斯關閉','是否需要警察交通管制','是否需要毒災應變隊或台水'],
      action:['依需求向指揮中心請求加派','危險物或化學品應請環保局毒災應變隊','同步確認台電、瓦斯、警察支援進度'],
      speech:`現場目前支援需求為${(c.supports||readSupports()||[]).join('、')||'持續評估中'}，必要時請台電、瓦斯、台水、警察及環保局毒災應變隊到場支援。`
    },
    '初': {
      confirm:['初期指揮官掌握的火煙、場所、人員受困、出勤人車','是否已有雲梯車與RIT','出勤部署與目前任務','是否已佔據水源','目前各分隊執行任務狀況'],
      action:['向初期指揮官確認五項資訊','確認水源與出勤部署','請中隊幕僚安全管制','整合初期人車任務並續報'],
      speech:`請問初期指揮官：火煙狀況、場所特性、受困人員、出勤人車、是否有雲梯車及是否指派RIT。初期部署與水源佔據狀況確認後續報。`
    }
  };
  return common[stage] || common['到'];
}
function countBy(arr,key){ return arr.reduce((m,x)=>{ const k=x[key]||'未分類'; m[k]=(m[k]||0)+1; return m; },{}); }
function sum(arr,key){ return arr.reduce((s,x)=>s+(Number(x[key])||0),0); }
function entriesText(obj){ return Object.entries(obj).map(([k,v])=>`${k}${v}`).join('、'); }


// ===== v9: account approval, building interior operations, and AI advice =====
function isSuperAdmin(){ return (profile?.email || fbUser?.email || '').toLowerCase() === SUPER_ADMIN_EMAIL; }
function isApproved(){ return isSuperAdmin() || profile?.status === 'active'; }
function canEnterSystem(){ return isApproved() && profile?.status !== 'suspended'; }
async function normalizeAdminProfile(){
  if(!profile || !isSuperAdmin() || profile.status === 'active') return;
  profile.status = 'active'; profile.role = 'admin'; profile.isSuperAdmin = true; profile.approvedBy = SUPER_ADMIN_EMAIL; profile.approvedAt = Date.now();
  if(firebaseEnabled) await db.collection('users').doc(fbUser.uid).set(profile,{merge:true});
}
function showApprovalScreen(){
  const msg = profile?.status === 'suspended'
    ? '你的帳號目前已被停權，請洽最高管理員。'
    : `你的帳號已建立，狀態為「${profile?.status || 'pending'}」，請等待最高管理員 ${SUPER_ADMIN_EMAIL} 審核啟用。`;
  $('approvalMessage') && ($('approvalMessage').textContent = msg);
  show('approvalScreen');
}
async function loadUsersForAdmin(){
  if(!firebaseEnabled || !isSuperAdmin()){ toast('只有最高管理員可以管理帳號'); return; }
  const snap = await db.collection('users').get();
  const users = snap.docs.map(d=>({id:d.id, ...d.data()})).sort((a,b)=>String(a.status||'').localeCompare(String(b.status||'')) || String(a.brigade||'').localeCompare(String(b.brigade||'')));
  const wrap = $('userAdminList'); if(!wrap) return;
  wrap.innerHTML = users.map(u => `<div class="user-admin-card ${u.status||'pending'}">
    <div><b>${escapeHtml(u.realName||u.callName||u.email||'未具名')}</b><div class="hint">${escapeHtml(u.email||'')}｜${escapeHtml(u.brigade||'')}/${escapeHtml(u.unit||'')}｜${roleLabel(u.role)}｜狀態：${escapeHtml(u.status||'pending')}</div></div>
    <div class="button-row compact-actions">
      <button class="btn small primary" data-user-action="active" data-user-id="${u.id}" ${u.email===SUPER_ADMIN_EMAIL?'disabled':''}>啟用</button>
      <button class="btn small danger" data-user-action="suspended" data-user-id="${u.id}" ${u.email===SUPER_ADMIN_EMAIL?'disabled':''}>停權</button>
      <button class="btn small ghost" data-user-action="pending" data-user-id="${u.id}" ${u.email===SUPER_ADMIN_EMAIL?'disabled':''}>待審</button>
    </div>
  </div>`).join('') || '<div class="empty">尚無使用者資料。</div>';
  wrap.querySelectorAll('[data-user-action]').forEach(btn => btn.addEventListener('click', () => updateUserStatus(btn.dataset.userId, btn.dataset.userAction)));
}
async function updateUserStatus(userId, status){
  if(!firebaseEnabled || !isSuperAdmin()) return;
  await db.collection('users').doc(userId).set({status, approvedBy:profile.email, approvedAt:Date.now(), updatedAt:Date.now()},{merge:true});
  await addLog('admin', `帳號狀態更新：${userId} → ${status}`);
  toast(`已更新帳號狀態：${status}`); loadUsersForAdmin();
}

function defaultBuildingOps(){ return { floorActions: [], planMarkers: [] }; }
function getBuildingOps(){ return currentCase?.buildingOps || defaultBuildingOps(); }
function floorsArray(){
  const floors = Math.max(Number(currentCase?.floors)||1, 1);
  return Array.from({length:floors}, (_,i)=>floors-i);
}
function syncBuildingFloors(){
  if(!currentCase) return;
  currentCase.buildingOps = getBuildingOps();
  renderBuildingOps();
  toast('已同步樓層');
}
function renderBuildingOps(){
  if(!$('verticalSection') || !currentCase) return;
  const ops = getBuildingOps();
  const levels = floorsArray();
  const fireFloorNum = parseInt(String(currentCase.fireFloor||'').match(/\d+/)?.[0] || currentCase.floors || levels[0], 10);
  const select = $('floorPlanLevel');
  if(select){
    const prev = select.value || String(fireFloorNum);
    select.innerHTML = levels.map(f=>`<option value="${f}">${f}樓</option>`).join('');
    select.value = levels.includes(Number(prev)) ? prev : String(fireFloorNum);
  }
  $('verticalSection').innerHTML = levels.map(f => {
    const a = ops.floorActions?.find(x=>Number(x.floor)===f) || {floor:f, action:'未標示', note:''};
    return `<div class="floor-row ${f===fireFloorNum?'fire-floor':''}" data-floor="${f}">
      <div class="floor-label">${f}F</div>
      <select class="floor-action" data-floor-action="${f}"><option ${a.action==='滅火攻擊'?'selected':''}>滅火攻擊</option><option ${a.action==='阻隔延燒'?'selected':''}>阻隔延燒</option><option ${a.action==='就地避難'?'selected':''}>就地避難</option><option ${a.action==='疏散離開'?'selected':''}>疏散離開</option><option ${a.action==='搜索救援'?'selected':''}>搜索救援</option><option ${a.action==='未標示'?'selected':''}>未標示</option></select>
      <input class="floor-note" data-floor-note="${f}" placeholder="補述" value="${escapeHtml(a.note||'')}" />
    </div>`;
  }).join('');
  document.querySelectorAll('[data-floor-action],[data-floor-note]').forEach(el => el.addEventListener('change', collectBuildingOpsFromUI));
  renderFloorPlan();
}
function collectBuildingOpsFromUI(){
  if(!currentCase) return;
  const ops = getBuildingOps();
  ops.floorActions = Array.from(document.querySelectorAll('.floor-row')).map(row => {
    const floor = Number(row.dataset.floor);
    return { floor, action: row.querySelector('.floor-action')?.value || '未標示', note: row.querySelector('.floor-note')?.value || '' };
  });
  currentCase.buildingOps = ops;
}
function renderFloorPlan(){
  const canvas = $('floorPlanCanvas'); if(!canvas || !currentCase) return;
  collectBuildingOpsFromUI();
  const level = Number($('floorPlanLevel')?.value || parseInt(String(currentCase.fireFloor||'1').match(/\d+/)?.[0] || '1',10));
  const markers = (getBuildingOps().planMarkers || []).filter(m=>Number(m.floor)===level);
  canvas.innerHTML = `<div class="floor-plan-grid"></div>` + markers.map(m => `<button class="floor-marker ${markerClass(m.type)}" style="left:${m.x}%;top:${m.y}%" data-marker-id="${m.id}" title="${escapeHtml(m.note||m.type)}">${markerIcon(m.type)}<span>${escapeHtml(m.label||m.type)}</span></button>`).join('');
  canvas.querySelectorAll('[data-marker-id]').forEach(btn => btn.addEventListener('click', ev => { ev.stopPropagation(); editFloorMarker(btn.dataset.markerId); }));
}
function markerIcon(t){ return {'起火點':'🔥','待救者':'🟢','死亡者':'🔴','入口':'🚪','水線':'💧','隔間':'▦','危害物':'☣️'}[t] || '•'; }
function markerClass(t){ return {'起火點':'fire','待救者':'rescue','死亡者':'fatal','入口':'entry','水線':'hose','隔間':'wall','危害物':'hazard'}[t] || ''; }
function addFloorMarkerFromClick(ev){
  if(!currentCase || ev.target.closest('[data-marker-id]')) return;
  const rect = ev.currentTarget.getBoundingClientRect();
  const x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
  const y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
  const type = $('floorPlanTool')?.value || '起火點';
  const floor = Number($('floorPlanLevel')?.value || 1);
  const note = prompt(`新增 ${floor}樓 ${type} 標示，請輸入備註`, '') || '';
  const ops = getBuildingOps();
  ops.planMarkers = ops.planMarkers || [];
  ops.planMarkers.push({ id:uid('marker'), floor, type, x:Math.round(x*10)/10, y:Math.round(y*10)/10, label:type, note });
  currentCase.buildingOps = ops;
  renderFloorPlan();
}
function editFloorMarker(markerId){
  const ops = getBuildingOps();
  const m = ops.planMarkers?.find(x=>x.id===markerId); if(!m) return;
  const next = prompt('修改標示備註；輸入 DELETE 可刪除', m.note || m.label || m.type);
  if(next === null) return;
  if(next.trim().toUpperCase()==='DELETE') ops.planMarkers = ops.planMarkers.filter(x=>x.id!==markerId);
  else m.note = next.trim();
  currentCase.buildingOps = ops; renderFloorPlan();
}
async function saveBuildingOps(){
  if(!currentCase) return;
  collectBuildingOpsFromUI();
  const patch = { buildingOps: getBuildingOps(), updatedAt:Date.now() };
  Object.assign(currentCase, patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase();
  await addLog('building','更新建物內部作戰圖 / 縱向剖面與水平俯視標示');
  toast('已儲存建物作戰圖');
}

function buildingReportLines(){
  const ops = getBuildingOps();
  const floors = (ops.floorActions||[]).filter(x=>x.action && x.action !== '未標示').map(x=>`- ${x.floor}F：${x.action}${x.note?`｜${x.note}`:''}`);
  const markers = (ops.planMarkers||[]).map(m=>`- ${m.floor}F ${m.type}：${m.note||m.label||''}`);
  return floors.concat(markers).length ? floors.concat(markers) : ['尚無建物內部作戰圖標示。'];
}

function localTacticalAdviceText(){
  if(!currentCase) return '';
  const c = currentCase;
  const tips = [];
  tips.push(`【態勢摘要】${c.floors||'?'}樓${c.purpose||''}建物，起火樓層：${c.fireFloor||'未明'}，火煙：${c.fireStatus||'未明'}，受困：${c.trapped||'未知'} ${c.trappedCount||0}人。`);
  if(c.trapped==='有' || Number(c.trappedCount)>0) tips.push('【人命優先】優先確認受困位置，派遣二人以上搜救小組，並以水線掩護搜救任務。');
  if(!c.ritSet) tips.push('【RIT】尚未律定 RIT，請指定待命位置、裝備與聯絡頻道。');
  if(/黑煙|大量明火|延燒/.test(c.fireStatus||'')) tips.push('【安全】火煙強烈，內攻前請確認通風、溫度、氣量與退路，必要時先行防護與降溫。');
  if(!live.hoses.length) tips.push('【水線】尚無水線紀錄；請確認進攻水線、供水線與防護水線歸屬。');
  if(!c.hazardChecked) tips.push('【危害】尚未完成危險物詢問，請幕僚尋找關係人確認瓦斯、化學品、電力、太陽能板等。');
  tips.push(`【目前戰力】車輛 ${live.vehicles.length} 台；人員 ${sum(live.crews,'count')} 人；水線 ${live.hoses.length} 條；標示 ${live.hazards.length} 處。`);
  return tips.join('\n');
}
function renderLocalTacticalAdvice(showToast=false){
  const text = localTacticalAdviceText();
  $('aiAdviceText') && ($('aiAdviceText').value = text);
  $('aiAdviceStatus') && ($('aiAdviceStatus').textContent = '已產生本機規則建議，未消耗 OpenAI token。');
  if(showToast) toast('已產生本機規則建議');
  return text;
}
async function requestAiAdvice(){
  if(!currentCase) return;
  const last = Number(currentCase.aiLastAt || 0);
  if(Date.now() - last < AI_COOLDOWN_MS){
    const min = Math.ceil((AI_COOLDOWN_MS - (Date.now()-last))/60000);
    toast(`AI 建議每 15 分鐘最多一次，請 ${min} 分鐘後再試`); return;
  }
  $('aiAdviceStatus') && ($('aiAdviceStatus').textContent = '正在呼叫 AI，請稍候…');
  try{
    const payload = { caseData: currentCase, vehicles: live.vehicles, crews: live.crews, hoses: live.hoses, hazards: live.hazards, buildingOps: getBuildingOps(), localRules: localTacticalAdviceText() };
    const res = await fetch('/api/ai-advice', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'AI 呼叫失敗');
    $('aiAdviceText').value = data.advice || '';
    $('aiAdviceStatus').textContent = `AI 建議已更新：${fmtTime(Date.now())}${data.modelUsed ? '｜模型：' + data.modelUsed : ''}`;
    const patch = { aiLastAt: Date.now(), aiLastAdvice: data.advice || '', updatedAt:Date.now() };
    Object.assign(currentCase, patch);
    if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase();
    await addLog('ai','產生 OpenAI 戰術建議');
  }catch(err){
    $('aiAdviceStatus').textContent = `AI 尚未啟用或呼叫失敗：${err.message}`;
    renderLocalTacticalAdvice(false);
    toast('AI 尚未啟用，已改用本機規則建議', 3500);
  }
}

init();
