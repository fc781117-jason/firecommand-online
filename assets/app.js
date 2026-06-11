'use strict';

const $ = (id) => document.getElementById(id);
const LOCAL_KEY = 'firecommand_v6_local_state';
const DEFAULT_CENTER = { lat: 25.085, lng: 121.48 };
const UNIT_DIR = {
  '第一大隊': ['大隊部', '莒光', '新板', '板橋', '大觀', '海山', '民生', '溪崑'],
  '第二大隊': ['大隊部', '五工', '裕民', '福營', '新莊', '中港', '頭前', '五股', '更寮', '泰山', '林口', '文化'],
  '第三大隊': ['大隊部', '三重', '鷺江', '蘆洲', '重陽', '二重', '八里', '龍源', '淡水', '竹圍', '三芝', '滬尾'],
  '第四大隊': ['大隊部', '深坑', '新店', '直潭', '安康', '安和', '石碇', '坪林', '雪山', '烏來'],
  '第五大隊': ['大隊部', '三峽', '隆恩', '土城', '清水', '頂埔', '樹林', '樹潭', '柑園', '鶯歌', '鳳鳴'],
  '第六大隊': ['大隊部', '社后', '汐止', '長青', '橫科', '瑞芳', '瑞亭', '九份', '金山', '石門', '萬里', '雙溪', '貢寮', '平溪', '保長'],
  '第七大隊': ['大隊部', '永和', '永利', '永平', '中和', '員山', '南勢', '國光', '秀山'],
  '特搜大隊': ['大隊部', '南雅', '慈福', '德音', '秀峰', '大埔']
};

let firebaseEnabled = false;
let auth = null;
let db = null;
let storage = null;
let fbUser = null;
let profile = null;
let cases = [];
let currentCaseId = null;
let currentCase = null;
let live = { vehicles: [], crews: [], hoses: [], hazards: [], logs: [], photos: [] };
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
function show(id){ ['authScreen','profileScreen','appScreen'].forEach(x => $(x).hidden = x !== id); }
function roleLabel(role){ return ({battalion:'大隊指揮/管理',commander:'現場指揮官',sector:'分區指揮/中隊幕僚',safety:'安全官',recorder:'紀錄官',unit:'單位帶隊官',viewer:'檢視者'})[role] || role || '未設定'; }

function init(){
  fillBrigadeSelect('profileBrigade','profileUnit');
  fillBrigadeSelect('vehicleBrigade','vehicleUnit');
  fillUnitOnlySelect('crewUnit', '第三大隊');
  bindEvents();
  initFirebase();
}

function bindEvents(){
  $('googleLoginBtn').addEventListener('click', loginGoogle);
  $('demoLoginBtn').addEventListener('click', loginDemo);
  $('logoutBtn').addEventListener('click', logout);
  $('profileForm').addEventListener('submit', saveProfile);
  $('caseForm').addEventListener('submit', createCase);
  $('refreshBtn').addEventListener('click', renderCases);
  $('backHomeBtn').addEventListener('click', backHome);
  $('saveCaseInfoBtn').addEventListener('click', saveCaseInfo);
  $('fitMapBtn').addEventListener('click', fitMapToIncident);
  $('addVehicleBtn').addEventListener('click', addVehicle);
  $('addCrewBtn').addEventListener('click', addCrew);
  $('startHoseBtn').addEventListener('click', startHoseTool);
  document.querySelectorAll('.hazard-btn').forEach(btn => btn.addEventListener('click', () => startHazardTool(btn.dataset.hazard)));
  $('generateReportBtn').addEventListener('click', () => generateReport(true));
  $('saveExtraBtn').addEventListener('click', saveExtraNotes);
  $('uploadPhotosBtn').addEventListener('click', uploadPhotos);
  ['arrivedCheck','commandCheck','ritCheck','hazardCheck'].forEach(id => $(id).addEventListener('change', saveCaseInfo));
}

function fillBrigadeSelect(brigadeId, unitId){
  const b=$(brigadeId), u=$(unitId); if(!b || !u) return;
  b.innerHTML = Object.keys(UNIT_DIR).map(x=>`<option>${x}</option>`).join('');
  b.value = b.value || '第三大隊';
  const update = () => { u.innerHTML = UNIT_DIR[b.value].map(x=>`<option>${x}</option>`).join(''); };
  b.addEventListener('change', update); update();
}
function fillUnitOnlySelect(unitId, brigade){
  const u=$(unitId); if(!u) return;
  const b = brigade || profile?.brigade || '第三大隊';
  u.innerHTML = (UNIT_DIR[b] || UNIT_DIR['第三大隊']).map(x=>`<option>${x}</option>`).join('');
}

function initFirebase(){
  firebaseEnabled = Boolean(window.FIRECOMMAND_FIREBASE_ENABLED && window.FIRECOMMAND_FIREBASE_CONFIG && !String(window.FIRECOMMAND_FIREBASE_CONFIG.apiKey||'').includes('PASTE_'));
  $('demoLoginBtn').style.display = firebaseEnabled ? 'none' : 'block';
  if(!firebaseEnabled){
    show('authScreen');
    return;
  }
  firebase.initializeApp(window.FIRECOMMAND_FIREBASE_CONFIG);
  auth = firebase.auth(); db = firebase.firestore(); storage = firebase.storage();
  auth.onAuthStateChanged(async (user) => {
    fbUser = user;
    if(!user){ show('authScreen'); return; }
    const snap = await db.collection('users').doc(user.uid).get();
    if(!snap.exists){ prefillProfile(user); show('profileScreen'); return; }
    profile = { id:user.uid, ...snap.data() };
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
}
async function logout(){
  cleanupSubscriptions(); currentCaseId=null; currentCase=null;
  if(firebaseEnabled) await auth.signOut();
  else { fbUser=null; profile=null; show('authScreen'); }
}
async function saveProfile(e){
  e.preventDefault();
  let photoURL = profile?.photoURL || '';
  const file = $('profilePhoto').files[0];
  if(file && firebaseEnabled){
    const ref = storage.ref(`user-photos/${fbUser.uid}/${Date.now()}_${file.name}`);
    await ref.put(file); photoURL = await ref.getDownloadURL();
  } else if(file){
    photoURL = await readFileAsDataURL(file);
  }
  profile = {
    id: fbUser.uid,
    email: fbUser.email || '',
    realName: $('profileRealName').value.trim(),
    callName: $('profileCallName').value.trim(),
    brigade: $('profileBrigade').value,
    unit: $('profileUnit').value,
    title: $('profileTitle').value,
    role: $('profileRole').value,
    photoURL,
    updatedAt: Date.now()
  };
  if(firebaseEnabled) await db.collection('users').doc(fbUser.uid).set(profile,{merge:true});
  else { localState.profile = profile; saveLocalState(); }
  enterApp();
}
function enterApp(){
  show('appScreen'); $('homePage').hidden=false; $('detailPage').hidden=true;
  $('userLine').textContent = `${profile.callName}｜${profile.brigade} / ${profile.unit}｜${roleLabel(profile.role)}`;
  $('vehicleBrigade').value = profile.brigade || '第三大隊'; $('vehicleBrigade').dispatchEvent(new Event('change'));
  fillUnitOnlySelect('crewUnit', profile.brigade);
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
  let address = $('caseAddress').value.trim() || extractAddress($('dispatchText').value) || '新北市蘆洲區長榮路792號';
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
    trappedCount: Number($('caseTrappedCount').value)||0,
    fireStatus: $('caseFireStatus').value,
    purpose: '住宅',
    arrived:false, commandTransfer:false, ritSet:false, hazardChecked:false,
    notes:'', extraNotes:'', lat:loc.lat, lng:loc.lng,
    brigade: profile.brigade, createdBy: profile.id, createdByName: profile.callName,
    createdAt: Date.now(), updatedAt: Date.now()
  };
  let id;
  if(firebaseEnabled){
    const ref = await db.collection('cases').add(newCase); id = ref.id;
    await addLogRemote(id, 'case', `建立案件：${newCase.address}`);
  } else {
    id = uid('case'); localState.cases.unshift({ id, ...newCase, vehicles:[], crews:[], hoses:[], hazards:[], logs:[{id:uid('log'),type:'case',message:`建立案件：${newCase.address}`,createdAt:Date.now(),operator:profile.callName}], photos:[] }); saveLocalState(); cases = localState.cases.filter(c=>c.brigade===profile.brigade);
  }
  $('caseForm').reset(); $('createCaseDetails').open=false;
  openCase(id);
}
function nextCaseNo(){
  const prefix = `FC-${todayKey()}`;
  const count = cases.filter(c => String(c.caseNo||'').startsWith(prefix)).length + 1;
  return `${prefix}-${String(count).padStart(3,'0')}`;
}
function extractAddress(text=''){
  const m = text.match(/新北市[\u4e00-\u9fa5]{1,4}區[^，,\n\r]{2,40}(路|街|巷|弄|號)[^，,\n\r]*/);
  return m ? m[0] : '';
}
async function geocodeAddress(address){
  try{
    const q = encodeURIComponent(`${address}, Taiwan`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
    const data = await res.json();
    if(data && data[0]) return { lat:Number(data[0].lat), lng:Number(data[0].lon) };
  }catch(err){ console.warn(err); }
  return DEFAULT_CENTER;
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
  ['vehicles','crews','hoses','hazards','logs','photos'].forEach(coll => {
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
  live.photos = currentCase.photos || [];
  renderDetail(); renderLiveParts();
}
function saveLocalCase(){
  if(!currentCase) return;
  currentCase.vehicles = live.vehicles; currentCase.crews = live.crews; currentCase.hoses = live.hoses; currentCase.hazards = live.hazards; currentCase.logs = live.logs; currentCase.photos = live.photos;
  const idx = localState.cases.findIndex(c=>c.id===currentCase.id); if(idx>=0) localState.cases[idx] = currentCase;
  saveLocalState();
}
function renderDetail(){
  if(!currentCase) return;
  $('detailCaseNo').textContent = currentCase.caseNo || '';
  $('detailAddress').textContent = currentCase.address || '未登錄地址';
  $('arrivedCheck').checked = !!currentCase.arrived;
  $('commandCheck').checked = !!currentCase.commandTransfer;
  $('ritCheck').checked = !!currentCase.ritSet;
  $('hazardCheck').checked = !!currentCase.hazardChecked;
  $('detailPurpose').value = currentCase.purpose || '住宅';
  $('detailFireStatus').value = currentCase.fireStatus || '未知';
  $('detailNotes').value = currentCase.notes || '';
  $('extraNotes').value = currentCase.extraNotes || '';
  renderSummaryCards(); renderLiveParts();
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
  renderSummaryCards(); renderToolOptions(); renderMap(); renderDashboard(); renderRules(); renderLogs(); renderPhotos(); generateReport(false);
}
function renderToolOptions(){
  fillUnitOnlySelect('crewUnit', profile?.brigade || '第三大隊');
  const canHose = live.vehicles.filter(v => v.canHose);
  $('hoseVehicle').innerHTML = canHose.length ? canHose.map(v=>`<option value="${v.id}">${escapeHtml(v.name)}｜${escapeHtml(v.unit)}</option>`).join('') : '<option value="">尚無可接水線車輛</option>';
}
async function saveCaseInfo(){
  if(!currentCase) return;
  const patch = { arrived:$('arrivedCheck').checked, commandTransfer:$('commandCheck').checked, ritSet:$('ritCheck').checked, hazardChecked:$('hazardCheck').checked, purpose:$('detailPurpose').value, fireStatus:$('detailFireStatus').value, notes:$('detailNotes').value, updatedAt:Date.now() };
  Object.assign(currentCase, patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true});
  else { saveLocalCase(); renderDetail(); }
  await addLog('case','更新案件概要 / 到場回報資訊');
}
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
    const v = live.vehicles.find(x=>x.id===h.vehicleId);
    const from = v ? [v.lat, v.lng] : h.from;
    const to = [h.lat, h.lng];
    if(from && to[0]){
      L.polyline([from,to], { color:'#245fc6', weight:5, opacity:.85 }).addTo(mapLayers).bindPopup(`${escapeHtml(h.vehicleName)} ${escapeHtml(h.port)}<br>${escapeHtml(h.task)}`);
      L.marker([(from[0]+to[0])/2,(from[1]+to[1])/2], {icon:labelIcon(`${h.unit}${h.port}｜${h.task}`,'hose-label')}).addTo(mapLayers);
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
  const unit = $('crewUnit').value, leader = $('crewLeader').value, count = Number($('crewCount').value)||4, status=$('crewStatus').value;
  await addItem('crews', { brigade:profile.brigade, unit, leader, count, status, task:$('crewTask').value.trim()||status, dispatchCount: status==='作業中'?1:0, startAt:Date.now(), lat:Number(currentCase.lat)-offset, lng:Number(currentCase.lng)+offset });
  await addLog('crew', `新增人員：${unit}${leader}｜${count}人｜${status}`);
  $('crewTask').value=''; toast('人員已加入地圖');
}
function startHoseTool(){
  const vehicleId = $('hoseVehicle').value;
  if(!vehicleId){ toast('目前沒有可接水線的車輛'); return; }
  const v = live.vehicles.find(x=>x.id===vehicleId);
  pendingTool = { type:'hose', vehicleId, vehicleName:v?.name||'', unit:v?.unit||'', port:$('hosePort').value, task:$('hoseTask').value.trim()||'水線作業' };
  toast('請在地圖上點選水線目的地');
}
async function addHoseAt(tool, lat, lng){
  const v = live.vehicles.find(x=>x.id===tool.vehicleId);
  await addItem('hoses', { vehicleId:tool.vehicleId, vehicleName:v?.name||tool.vehicleName, unit:v?.unit||tool.unit, port:tool.port, task:tool.task, status:'使用中', from:v?[v.lat,v.lng]:null, lat, lng });
  await addLog('hose', `建立水線：${tool.vehicleName} ${tool.port}｜${tool.task}`);
  toast('水線已建立');
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
async function uploadPhotos(){
  const files = Array.from($('casePhotoInput').files || []); if(!files.length){ toast('請先選擇照片'); return; }
  for(const file of files){
    let url='';
    if(firebaseEnabled){ const ref=storage.ref(`case-photos/${currentCaseId}/${Date.now()}_${file.name}`); await ref.put(file); url=await ref.getDownloadURL(); }
    else url = await readFileAsDataURL(file);
    await addItem('photos', { url, name:file.name, uploadedBy:profile.callName });
  }
  $('casePhotoInput').value=''; await addLog('photo', `上傳照片 ${files.length} 張`); toast('照片已加入');
}
function renderPhotos(){ $('photoGrid').innerHTML = live.photos.length ? live.photos.map(p=>`<div class="photo"><img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.name||'photo')}"></div>`).join('') : '<div class="empty">尚無照片。</div>'; }
function generateReport(scroll=false){
  if(!currentCase) return;
  const crews = sum(live.crews,'count');
  const draft = `北海北海，${profile?.callName||'現場指揮'}回報：\n`+
    `1、現場地址為 ${currentCase.address}，案件類型為 ${currentCase.type}。\n`+
    `2、建物約 ${currentCase.floors||'未登錄'} 樓，起火樓層 ${currentCase.fireFloor||'未登錄'}，用途為 ${currentCase.purpose||'未登錄'}。\n`+
    `3、火煙狀況：${currentCase.fireStatus||'未登錄'}，概要：${currentCase.summary||'無'}。\n`+
    `4、人員受困狀況：${currentCase.trapped||'未知'}，人數 ${currentCase.trappedCount||0} 人。\n`+
    `5、目前部署車輛 ${live.vehicles.length} 台、水線 ${live.hoses.length} 條、人員 ${crews} 人。\n`+
    `6、RIT：${currentCase.ritSet?'已律定':'尚未律定'}；危險物詢問：${currentCase.hazardChecked?'已確認':'尚未確認'}。\n`+
    `後續持續回報現場部署與各面火煙狀況。`;
  $('reportDraft').value=draft; if(scroll) $('reportDraft').scrollIntoView({behavior:'smooth',block:'center'});
}
function countBy(arr,key){ return arr.reduce((m,x)=>{ const k=x[key]||'未分類'; m[k]=(m[k]||0)+1; return m; },{}); }
function sum(arr,key){ return arr.reduce((s,x)=>s+(Number(x[key])||0),0); }
function entriesText(obj){ return Object.entries(obj).map(([k,v])=>`${k}${v}`).join('、'); }
function readFileAsDataURL(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); }); }

init();
