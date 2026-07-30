'use strict';

const $ = (id) => document.getElementById(id);
const LOCAL_KEY = 'firecommand_v16_local_state';
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
let live = { vehicles: [], crews: [], hoses: [], hazards: [], sitreps: [], logs: [] };
let unsubscribers = [];
let map = null;
let mapOverlays = [];
let incidentCircle = null;
let mapInfoWindow = null;
let mapLoadError = '';
let mapReady = false;
let pendingTool = null;
let buildingBoxCenterMarker = null;
let buildingBoxCornerMarker = null;
let googleMapsConfig = null;
let googleMapsPromise = null;
let googleMapsLibs = null;
let pendingIncidentLocation = null;
let pendingCasePlace = null;
let autocompleteSessionToken = null;
let addressSuggestTimer = null;
let gpsWatchId = null;
let deploymentMode = 'select';
let selectedMapResource = null;
let floorHistory = [];
let floorRedoStack = [];
let floorPlanLocked = false;
let floorSelectedId = null;
let suppressFloorHistory = false;
let reportOverlayHistoryActive = false;
let reportReturnState = null;
let lastMapDiagnostics = '';
let localState = loadLocalState();

function loadLocalState(){
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { profile:null, cases:[] }; }
  catch { return { profile:null, cases:[] }; }
}
function saveLocalState(){ try{ localStorage.setItem(LOCAL_KEY, JSON.stringify(localState)); }catch(err){ console.warn('本機暫存不可用',err); } }
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
function radioCallSign(){ return String(profile?.fireCallSign || profile?.callName || '現場指揮').trim(); }

function normalizeFloorValue(value){
  const raw=String(value??'').trim();
  if(!raw || raw==='未登錄' || raw==='未知' || raw==='尚未確認') return '';
  if(/^B\d+$/i.test(raw)) return raw.toUpperCase();
  if(/^\d+$/.test(raw)) return `${Number(raw)}樓`;
  if(/^\d+F$/i.test(raw)) return `${Number(raw.replace(/F/i,''))}樓`;
  if(/^\d+樓$/.test(raw)) return raw;
  return raw;
}
function floorText(value, fallback='未登錄'){
  return normalizeFloorValue(value) || fallback;
}
function fillRangeSelect(id,start,end,defaultValue=''){
  const sel=$(id); if(!sel) return;
  const keep=String(sel.value||defaultValue||'');
  sel.innerHTML=Array.from({length:end-start+1},(_,i)=>{const n=start+i;return `<option value="${n}">${n} 人</option>`;}).join('');
  sel.value=Array.from(sel.options).some(o=>o.value===keep)?keep:String(defaultValue||start);
}
function fillFloorCountSelect(id, value=''){
  const sel=$(id); if(!sel) return;
  const keep=String(value||sel.value||'');
  sel.innerHTML='<option value="">尚未確認</option>'+Array.from({length:50},(_,i)=>`<option value="${i+1}">${i+1} 樓</option>`).join('');
  sel.value=Array.from(sel.options).some(o=>o.value===keep)?keep:'';
}
function floorLocationOptions(maxFloor=50){
  const top=Math.max(1,Math.min(50,Number(maxFloor)||50));
  const values=['','B5','B4','B3','B2','B1',...Array.from({length:top},(_,i)=>`${i+1}樓`),'屋頂','夾層','外部','多樓層'];
  return values.map(v=>`<option value="${v}">${v||'尚未確認'}</option>`).join('');
}
function fillFloorLocationSelect(id,maxFloor=50,value=''){
  const sel=$(id); if(!sel) return;
  const normalized=normalizeFloorValue(value||sel.value||'');
  sel.innerHTML=floorLocationOptions(maxFloor);
  if(normalized && !Array.from(sel.options).some(o=>o.value===normalized)) sel.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(normalized)}">${escapeHtml(normalized)}</option>`);
  sel.value=normalized;
}
function splitObservedLocation(value){
  const raw=String(value||'').trim();
  const side=(raw.match(/(第一面|第二面|第三面|第四面|建物內部|屋頂)$/)||[])[1]||'';
  const floor=normalizeFloorValue(side?raw.slice(0,-side.length):raw);
  return {floor,side};
}
function syncFloorChoiceOptions(values={}){
  fillFloorCountSelect('caseFloors', values.caseFloors);
  fillFloorCountSelect('summaryFloors', values.summaryFloors);
  fillFloorCountSelect('detailFloors', values.detailFloors);
  fillFloorLocationSelect('caseFireFloor', values.caseFloors||$('caseFloors')?.value||50, values.caseFireFloor);
  fillFloorLocationSelect('summaryFireFloor', values.summaryFloors||$('summaryFloors')?.value||50, values.summaryFireFloor);
  fillFloorLocationSelect('detailFireFloor', values.detailFloors||$('detailFloors')?.value||50, values.detailFireFloor);
  fillFloorLocationSelect('fireObservedFloor', values.detailFloors||$('detailFloors')?.value||50, values.fireObservedFloor);
}
function initQuickChoiceSelects(){
  syncFloorChoiceOptions();
  fillRangeSelect('trappedCountArrival',1,21,'1');
  if($('trappedCountArrival')?.lastElementChild) $('trappedCountArrival').lastElementChild.textContent='21 人以上';
  fillRangeSelect('crewCount',1,20,'4');
}

function init(){
  fillUnitFlat('profileBrigade','profileUnit','第三大隊');
  fillUnitFlat('vehicleBrigade','vehicleUnit','第三大隊');
  fillUnitFlat('crewBrigade','crewUnit','第三大隊');
  fillUnitFlat('sitrepBrigade','sitrepUnit','第三大隊');
  fillTrappedSelect('summaryTrappedCountMode');
  fillTrappedSelect();
  initQuickChoiceSelects();
  bindEvents();
  injectKeyboardVoiceHelpers();
  updateOrientationHint();
  initFirebase();
}

function bindEvents(){
  $('googleLoginBtn').addEventListener('click', loginGoogle);
  $('demoLoginBtn')?.addEventListener('click', loginDemo);
  $('logoutBtn').addEventListener('click', logout);
  $('approvalLogoutBtn')?.addEventListener('click', logout);
  $('adminManageBtn')?.addEventListener('click', () => { if($('adminSection')) { $('adminSection').hidden = false; $('adminSection').scrollIntoView({behavior:'smooth'}); } loadUsersForAdmin(); });
  $('profileQuickEditBtn')?.addEventListener('click', openProfileQuickEdit);
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
  $('caseFloors')?.addEventListener('change',()=>fillFloorLocationSelect('caseFireFloor',$('caseFloors').value||50,$('caseFireFloor').value));
  $('summaryFloors')?.addEventListener('change',()=>fillFloorLocationSelect('summaryFireFloor',$('summaryFloors').value||50,$('summaryFireFloor').value));
  $('detailFloors')?.addEventListener('change',()=>{
    fillFloorLocationSelect('detailFireFloor',$('detailFloors').value||50,$('detailFireFloor').value);
    fillFloorLocationSelect('fireObservedFloor',$('detailFloors').value||50,$('fireObservedFloor').value);
  });
  $('copyCommandSpeechBtn').addEventListener('click', copyCommandSpeech);
  $('copyReportBtn')?.addEventListener('click', copyReportDraft);
  $('editReportBtn')?.addEventListener('click', enableReportEdit);
  $('confirmReportEditBtn')?.addEventListener('click', confirmReportEdit);
  $('printReportBtn')?.addEventListener('click', printReport);
  $('sameTabPrintBtn')?.addEventListener('click', printReportSameTab);
  $('runMapDiagnosticsBtn')?.addEventListener('click', runMapDiagnostics);
  $('copyMapDiagnosticsBtn')?.addEventListener('click', copyMapDiagnostics);
  $('retryGoogleMapBtn')?.addEventListener('click', retryGoogleMap);
  $('caseAddress')?.addEventListener('input', () => scheduleAddressSuggestions('case'));
  $('locationAddressInput')?.addEventListener('input', () => scheduleAddressSuggestions('location'));
  document.querySelectorAll('[data-deploy-mode]').forEach(btn => btn.addEventListener('click', () => setDeploymentMode(btn.dataset.deployMode)));
  $('floorUndoBtn')?.addEventListener('click', floorUndo);
  $('floorRedoBtn')?.addEventListener('click', floorRedo);
  $('floorEraserBtn')?.addEventListener('click', () => selectFloorTool('橡皮擦'));
  $('floorSelectBtn')?.addEventListener('click', () => selectFloorTool('選取'));
  $('copyPreviousFloorBtn')?.addEventListener('click', copyAdjacentFloor);
  $('lockFloorPlanBtn')?.addEventListener('click', toggleFloorPlanLock);
  $('clearFloorPlanBtn')?.addEventListener('click', clearActiveFloorPlan);
  $('dismissOrientationHintBtn')?.addEventListener('click', dismissOrientationHint);
  document.querySelectorAll('[data-close-action-sheet]').forEach(el => el.addEventListener('click', closeActionSheet));
  window.addEventListener('popstate', handlePopState);
  window.addEventListener('orientationchange', handleResponsiveBuildingLayout);
  window.addEventListener('resize', handleResponsiveBuildingLayout);
  window.addEventListener('afterprint', ensureReportOverlayUsable);
  window.addEventListener('pageshow', ensureReportOverlayUsable);
  $('googleAddressSearchBtn')?.addEventListener('click', searchGoogleAddress);
  $('useCurrentGpsBtn')?.addEventListener('click', useCurrentGps);
  $('setIncidentCenterBtn')?.addEventListener('click', beginManualIncidentCenter);
  $('confirmIncidentLocationBtn')?.addEventListener('click', confirmIncidentLocation);
  $('unlockIncidentLocationBtn')?.addEventListener('click', unlockIncidentLocation);
  document.querySelectorAll('[data-stage]').forEach(btn => btn.addEventListener('click', () => selectCommandStage(btn.dataset.stage)));
  document.querySelectorAll('[data-arrival-card]').forEach(btn => btn.addEventListener('click', () => toggleArrivalCard(btn.dataset.arrivalCard)));
  document.querySelectorAll('[data-case-page]').forEach(btn => btn.addEventListener('click', () => switchCasePage(btn.dataset.casePage)));
  document.querySelectorAll('[data-case-page-jump]').forEach(btn => btn.addEventListener('click', () => switchCasePage(btn.dataset.casePageJump)));
  document.addEventListener('click', handleGlobalActionClick);
  document.querySelectorAll('.support-grid input').forEach(ch => ch.addEventListener('change', () => { updateSupportStatus(); renderCommandGuide(); saveCaseInfo(false,false); }));
  $('fitMapBtn').addEventListener('click', fitMapToIncident);
  $('setBuildingBoxCenterBtn')?.addEventListener('click', () => { pendingTool={type:'buildingBoxCenter'}; toast('請在地圖點選建物中心框中心點'); });
  $('saveBuildingBoxBtn')?.addEventListener('click', saveBuildingBoxFromForm);
  $('lockBuildingBoxBtn')?.addEventListener('click', () => setBuildingBoxLock(true));
  $('unlockBuildingBoxBtn')?.addEventListener('click', () => setBuildingBoxLock(false));
  $('addVehicleBtn').addEventListener('click', addVehicle);
  $('addCrewBtn').addEventListener('click', addCrew);
  $('startHoseBtn').addEventListener('click', startHoseTool);
  $('hoseTargetType').addEventListener('change', renderToolOptions);
  document.querySelectorAll('.hazard-btn').forEach(btn => btn.addEventListener('click', () => startHazardTool(btn.dataset.hazard)));
  $('generateReportBtn')?.addEventListener('click', () => generateAIReport(true));
  $('saveExtraBtn')?.addEventListener('click', saveExtraNotes);
  $('addSitrepBtn')?.addEventListener('click', addSitrep);
  $('addPatientSitrepBtn')?.addEventListener('click', addPatientSitrep);
  $('sitrepNowBtn')?.addEventListener('click', setSitrepNow);
  $('generateAssessmentBtn')?.addEventListener('click', generateAssessmentReport);
  $('aiAssessmentBtn')?.addEventListener('click', requestAiAssessment);
  $('closeCaseBtn')?.addEventListener('click', closeCase);
  $('reopenCaseBtn')?.addEventListener('click', reopenCase);
  $('syncFloorsBtn')?.addEventListener('click', syncBuildingFloors);
  $('saveBuildingOpsBtn')?.addEventListener('click', saveBuildingOps);
  $('buildingVerticalTabBtn')?.addEventListener('click', () => setBuildingOpsView('vertical', true));
  $('buildingPlanTabBtn')?.addEventListener('click', () => setBuildingOpsView('plan', true));
  $('buildingSplitTabBtn')?.addEventListener('click', () => setBuildingOpsView('split', true));
  $('toggleBuildingFullscreenBtn')?.addEventListener('click', toggleBuildingFullscreen);
  $('addUpperFloorBtn')?.addEventListener('click', addUpperFloor);
  $('addBasementFloorBtn')?.addEventListener('click', addBasementFloor);
  $('floorPlanLevel')?.addEventListener('change', renderFloorPlan);
  $('floorPlanCanvas')?.addEventListener('click', addFloorMarkerFromClick);
  $('floorPlanCanvas')?.addEventListener('pointerdown', handleFloorPlanPointerDown);
  $('floorPlanCanvas')?.addEventListener('pointermove', handleFloorPlanPointerMove);
  $('floorPlanCanvas')?.addEventListener('pointerup', handleFloorPlanPointerUp);
  $('floorPlanCanvas')?.addEventListener('pointercancel', handleFloorPlanPointerCancel);
  $('floorPlanCanvas')?.addEventListener('dragover', ev => ev.preventDefault());
  $('floorPlanCanvas')?.addEventListener('drop', addFloorMarkerFromDrop);
  document.querySelectorAll('[data-floor-tool]').forEach(btn => { btn.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', btn.dataset.floorTool)); btn.addEventListener('click', () => selectFloorTool(btn.dataset.floorTool)); });
  $('aiAdviceBtn')?.addEventListener('click', requestAiAdvice);
  $('localRuleAdviceBtn')?.addEventListener('click', () => renderLocalTacticalAdvice(true));
  $('addContactBtn')?.addEventListener('click', () => { addContactRow(); renderArrivalStatusCards(); });
  document.querySelectorAll('.arrival-detail-input').forEach(el => el.addEventListener('change', () => { renderArrivalStatusCards(); renderCommandGuide(); saveCaseInfo(false,false); }));
  ['detailPurpose','detailFireStatus','detailNotes','buildingStructure','detailFloors','detailFireFloor','fireObservedFloor','fireObservedSide','fireSmokeColor','fireSmokeVolume','fireFlameState','fireObservation','trappedCountArrival','arrivalAddressInput','firstSideCustom'].forEach(id => $(id)?.addEventListener('change', () => { syncSopDerivedFields(); renderCommandGuide(); saveCaseInfo(false,false); }));
  bindExclusiveDetails(['deploymentMapDetails','buildingOpsDetails']);
  bindExclusiveDetails(['crewStatusDetails','vehicleStatusDetails']);
}

function bindExclusiveDetails(ids=[]){
  const nodes = ids.map(id=>$(id)).filter(Boolean);
  nodes.forEach(node => node.addEventListener('toggle', () => {
    if(!node.open) return;
    nodes.forEach(other => { if(other!==node) other.open=false; });
    if(node.id==='deploymentMapDetails') setTimeout(refreshMapSize,220);
    if(node.id==='buildingOpsDetails') setTimeout(handleResponsiveBuildingLayout,80);
  }));
}

async function handleGlobalActionClick(ev){
  const voice = ev.target.closest('[data-keyboard-voice-target]');
  if(voice){ ev.preventDefault(); focusKeyboardVoiceTarget(voice.dataset.keyboardVoiceTarget); return; }
  const resource = ev.target.closest('[data-resource-coll][data-resource-id]');
  if(resource && !ev.target.closest('[data-resource-action]')){ ev.preventDefault(); selectMapResource(resource.dataset.resourceColl, resource.dataset.resourceId); return; }
  const resourceAction = ev.target.closest('[data-resource-action]');
  if(resourceAction){ ev.preventDefault(); ev.stopPropagation(); handleResourceAction(resourceAction); return; }
  const btn = ev.target.closest('[data-map-action]');
  if(!btn) return;
  ev.preventDefault(); ev.stopPropagation();
  const action = btn.dataset.mapAction;
  const id = btn.dataset.id;
  if(action === 'editVehicle') return editVehicle(id);
  if(action === 'deleteVehicle') return deleteVehicle(id);
  if(action === 'editCrew') return editCrew(id);
  if(action === 'restCrew') return setCrewRest(id, btn.dataset.mode || '原地休息');
  if(action === 'deleteCrew') return deleteCrew(id);
  if(action === 'editHazard') return editHazard(id);
  if(action === 'deleteHazard') return deleteHazard(id);
  if(action === 'editHose') return editHoseFull(id);
  if(action === 'deleteHose') return deleteHose(id);
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
  firebaseEnabled = Boolean(
    typeof firebase !== 'undefined' &&
    window.FIRECOMMAND_FIREBASE_ENABLED === true &&
    window.FIRECOMMAND_FIREBASE_CONFIG &&
    window.FIRECOMMAND_FIREBASE_CONFIG.apiKey &&
    !String(window.FIRECOMMAND_FIREBASE_CONFIG.apiKey || '').includes('PASTE_')
  );
  const demoBtn = $('demoLoginBtn');
  if(demoBtn) demoBtn.hidden = true;
  if(!firebaseEnabled){
    const loginBtn = $('googleLoginBtn');
    if(loginBtn){
      loginBtn.disabled = true;
      loginBtn.textContent = '系統連線尚未完成，請聯絡管理員';
    }
    show('authScreen');
    return;
  }
  try {
    if(!firebase.apps.length) firebase.initializeApp(window.FIRECOMMAND_FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
  } catch (err) {
    console.error('Firebase 初始化失敗', err);
    firebaseEnabled = false;
    const loginBtn = $('googleLoginBtn');
    if(loginBtn){
      loginBtn.disabled = true;
      loginBtn.textContent = '系統連線尚未完成，請聯絡管理員';
    }
    show('authScreen');
    return;
  }
  auth.onAuthStateChanged(async (user) => {
    fbUser = user;
    if(!user){ show('authScreen'); return; }
    const adminEmail = isSuperAdminEmail(user.email);
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();

    // 最高管理員第一次登入時，不進入審核流程，直接自動建立 / 修正為 active admin。
    if(adminEmail){
      profile = snap.exists ? { id:user.uid, ...snap.data() } : makeSuperAdminProfile(user);
      await normalizeAdminProfile(true);
      enterApp();
      return;
    }

    if(!snap.exists){ prefillProfile(user); show('profileScreen'); return; }
    profile = { id:user.uid, ...snap.data() };
    if(!canEnterSystem()) { showApprovalScreen(); return; }
    enterApp();
  });
}

async function loginGoogle(){
  if(!firebaseEnabled){ toast('系統連線尚未完成，請確認 Firebase 設定檔已上傳。', 4000); return; }
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
  $('profileFireCallSign') && ($('profileFireCallSign').value = '');
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
  const isAdminEmail = isSuperAdminEmail(fbUser.email);
  profile = {
    id: fbUser.uid,
    email: fbUser.email || '',
    realName: $('profileRealName').value.trim(),
    callName: $('profileCallName').value.trim(),
    fireCallSign: $('profileFireCallSign')?.value.trim() || $('profileCallName').value.trim(),
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
  $('userLine').textContent = `${radioCallSign()}｜${profile.callName}｜${profile.brigade} / ${profile.unit}`;
  $('userLine').title = '點此修改火場／無線電代號與顯示稱呼';
  setWatermark();
  const admin = isSuperAdmin();
  $('adminManageBtn') && ($('adminManageBtn').hidden = !admin);
  $('adminSection') && ($('adminSection').hidden = true);
  $('vehicleBrigade').value = profile.brigade || '第三大隊'; $('vehicleBrigade').dispatchEvent(new Event('change'));
  if(profile.unit){ $('vehicleUnit').value = profile.unit; }
  $('crewBrigade').value = profile.brigade || '第三大隊'; $('crewBrigade').dispatchEvent(new Event('change'));
  if(profile.unit){ $('crewUnit').value = profile.unit; }
  $('sitrepBrigade') && ($('sitrepBrigade').value = profile.brigade || '第三大隊'); $('sitrepBrigade')?.dispatchEvent(new Event('change'));
  if(profile.unit && $('sitrepUnit')){ $('sitrepUnit').value = profile.unit; }
  setSitrepNow();
  $('createCaseDetails').open = false;
  subscribeCases();
  if(!profile.fireCallSign) setTimeout(()=>{toast('請先設定火場／無線電代號，回報稿將固定沿用。',4200);openProfileQuickEdit();},350);
}

function openProfileQuickEdit(){
  if(!profile) return;
  openActionSheet('個人資訊與火場代號', `<div class="notice compact">火場／無線電代號會用於到場回報稿、戰情與勤務紀錄。勤務代號變更時，請在這裡更新。</div>
    <div class="field"><label>火場／無線電代號</label><input id="quickFireCallSign" value="${escapeHtml(profile.fireCallSign||'')}" placeholder="例：淡水316" /></div>
    <div class="field"><label>顯示稱呼</label><input id="quickCallName" value="${escapeHtml(profile.callName||'')}" placeholder="例：Jason" /></div>
    <div class="readonly-card">${escapeHtml(profile.realName||'')}｜${escapeHtml(profile.brigade||'')}/${escapeHtml(profile.unit||'')}｜${escapeHtml(profile.title||'')}</div>
    <div class="button-row"><button id="saveQuickProfileBtn" type="button" class="btn primary full">儲存個人資訊</button></div>`);
  $('saveQuickProfileBtn')?.addEventListener('click', saveQuickProfile);
}
async function saveQuickProfile(){
  const fireCallSign=$('quickFireCallSign')?.value.trim()||'';
  const callName=$('quickCallName')?.value.trim()||'';
  if(!fireCallSign){ toast('請輸入火場／無線電代號'); return; }
  profile={...profile,fireCallSign,callName:callName||profile.callName||fireCallSign,updatedAt:Date.now()};
  if(firebaseEnabled) await db.collection('users').doc(profile.id).set({fireCallSign:profile.fireCallSign,callName:profile.callName,updatedAt:profile.updatedAt},{merge:true});
  else { localState.profile=profile;saveLocalState(); }
  $('userLine').textContent=`${radioCallSign()}｜${profile.callName}｜${profile.brigade} / ${profile.unit}`;
  closeActionSheet();renderCommandGuide();toast('已更新火場代號');
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
        <span class="tag">起火：${escapeHtml(floorText(c.fireFloor))}</span>
        <span class="tag ${c.trapped==='有'?'red':c.trapped==='無'?'green':'amber'}">受困：${escapeHtml(c.trapped==='有'?`有 ${c.trappedCount||0}人`:c.trapped==='無'?'無':'尚未確認')}</span>
      </div>
    </article>`).join('');
  wrap.querySelectorAll('.case-card').forEach(card => { card.style.cursor='pointer'; card.addEventListener('click', ev => { if(ev.target.closest('button')) return; openCase(card.querySelector('[data-open-case]')?.dataset.openCase); }); });
  wrap.querySelectorAll('[data-open-case]').forEach(btn => btn.addEventListener('click', ev => { ev.stopPropagation(); openCase(btn.dataset.openCase); }));
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
    fireFloor: normalizeFloorValue($('caseFireFloor').value),
    trapped: $('caseTrapped').value,
    trappedCount: getTrappedCount(),
    trappedCountMode: $('caseTrappedCountMode').value,
    victims: readVictims(),
    fireStatus: $('caseFireStatus').value,
    purpose: '住宅',
    arrived:false, commandTransfer:false, ritSet:false, hazardChecked:false,
    notes:'', extraNotes:'', lat:loc.lat, lng:loc.lng,
    locationMeta: { source:loc.source || 'fallback', formattedAddress:loc.formattedAddress || address, placeId:loc.placeId || '', accuracy:loc.accuracy || null, unverified:!!loc.unverified, locked:false, confirmed:false, updatedAt:Date.now(), updatedBy:profile?.callName || '' },
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
function googleMapsEnabled(){ return Boolean(googleMapsConfig?.key); }
async function fetchGoogleMapsConfig(){
  if(googleMapsConfig) return googleMapsConfig;
  try{
    const res = await fetch('/api/maps-config', {cache:'no-store'});
    if(!res.ok) throw new Error('maps config unavailable');
    googleMapsConfig = await res.json();
  }catch(err){
    googleMapsConfig = {enabled:false, key:''};
  }
  return googleMapsConfig;
}
async function loadGoogleMapsClient(force=false){
  if(force){
    googleMapsPromise = null;
    googleMapsLibs = null;
    mapLoadError = '';
    document.querySelector('script[data-google-maps-client]')?.remove();
    try{ delete window.__firecommandGoogleMapsReady; }catch{}
  }
  if(window.google?.maps?.Map && window.google?.maps?.Geocoder){
    googleMapsLibs = window.google.maps;
    return window.google.maps;
  }
  if(googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = (async()=>{
    const cfg = await fetchGoogleMapsConfig();
    if(!cfg?.key) throw new Error('GOOGLE_MAPS_BROWSER_KEY 尚未在 Vercel Production 設定');

    await new Promise((resolve,reject)=>{
      const previous = document.querySelector('script[data-google-maps-client]');
      if(previous) previous.remove();

      const callbackName='__firecommandGoogleMapsReady';
      let settled=false;
      const finish=(fn,value)=>{
        if(settled) return;
        settled=true;
        clearTimeout(timeout);
        fn(value);
      };

      window.gm_authFailure = () => {
        const message='Google Maps API 驗證失敗：請檢查 Billing、HTTP Referrer 網域限制與 API restrictions。';
        mapLoadError = message;
        showMapUnavailable(message);
        finish(reject,new Error(message));
      };

      window[callbackName]=()=>{
        // loading=async 時，Google 官方要求以 callback 判定 API 已可使用，
        // 不可用 script.onload 立即檢查核心類別。
        if(window.google?.maps?.Map && window.google?.maps?.Geocoder){
          finish(resolve);
        }else{
          finish(reject,new Error('Google Maps callback 已執行，但地圖核心仍未完成初始化'));
        }
      };

      const s=document.createElement('script');
      s.dataset.googleMapsClient='true';
      s.async=true;
      s.defer=true;
      s.referrerPolicy='origin';
      const params=new URLSearchParams({
        key:String(cfg.key).trim(),
        v:'weekly',
        language:'zh-TW',
        region:'TW',
        libraries:'places,geometry',
        loading:'async',
        callback:callbackName,
        auth_referrer_policy:'origin'
      });
      s.src=`https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      const timeout=setTimeout(()=>finish(reject,new Error('Google Maps 載入逾時：未收到 Google callback，請檢查 API Key、網域限制或網路連線')),20000);
      s.onerror=()=>finish(reject,new Error('Google Maps JavaScript 載入失敗，請確認 Maps JavaScript API、Billing 與 HTTP Referrer'));
      document.head.appendChild(s);
    });

    if(!window.google?.maps?.Map || !window.google?.maps?.Geocoder) throw new Error('Google Maps 核心元件未載入');
    googleMapsLibs = window.google.maps;
    return window.google.maps;
  })();
  try{
    const result=await googleMapsPromise;
    mapLoadError='';
    return result;
  }catch(err){
    googleMapsPromise=null;
    mapLoadError=err.message || String(err);
    throw err;
  }
}
function normalizeGoogleAddress(address=''){
  const normalized = normalizeAddress(address);
  if(!normalized) return '';
  if(!/台灣|臺灣/.test(normalized)) return `${normalized} 台灣`;
  return normalized;
}
async function googleGeocodeCandidates(address){
  const maps = await loadGoogleMapsClient();
  const geocoder = new maps.Geocoder();
  const query = normalizeGoogleAddress(address);
  const response = await geocoder.geocode({address:query, region:'TW', componentRestrictions:{country:'TW'}});
  const results = response?.results || [];
  return results.map(r=>({
    lat:r.geometry?.location?.lat?.(), lng:r.geometry?.location?.lng?.(),
    formattedAddress:r.formatted_address || query,
    placeId:r.place_id || '',
    types:r.types || [],
    source:'google-address'
  })).filter(x=>Number.isFinite(x.lat) && Number.isFinite(x.lng));
}
async function fetchPlaceSuggestions(input, context='location'){
  const value = normalizeAddress(input);
  if(value.length < 3) return [];
  await loadGoogleMapsClient();
  if(!google.maps.importLibrary) return googleGeocodeCandidates(value);
  try{
    const {AutocompleteSuggestion, AutocompleteSessionToken} = await google.maps.importLibrary('places');
    if(!autocompleteSessionToken) autocompleteSessionToken = new AutocompleteSessionToken();
    const center = currentCase ? {lat:Number(currentCase.lat||DEFAULT_CENTER.lat),lng:Number(currentCase.lng||DEFAULT_CENTER.lng)} : DEFAULT_CENTER;
    const request = {
      input:value,
      sessionToken:autocompleteSessionToken,
      language:'zh-TW',
      region:'tw',
      includedRegionCodes:['tw'],
      origin:center,
      locationBias:{center,radius:50000}
    };
    const {suggestions} = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
    return (suggestions||[]).map(s=>s.placePrediction).filter(Boolean).slice(0,6);
  }catch(err){
    console.warn('Places autocomplete unavailable', err);
    return [];
  }
}
async function placePredictionToCandidate(prediction){
  const place = prediction.toPlace();
  await place.fetchFields({fields:['displayName','formattedAddress','location','viewport','id']});
  const loc=place.location;
  if(!loc) throw new Error('Google Places 未回傳座標');
  return {
    lat:typeof loc.lat==='function'?loc.lat():loc.lat,
    lng:typeof loc.lng==='function'?loc.lng():loc.lng,
    formattedAddress:place.formattedAddress || prediction.text?.toString() || '',
    placeId:place.id || prediction.placeId || '',
    source:'google-address',
    viewport:place.viewport || null
  };
}
function scheduleAddressSuggestions(context='location'){
  clearTimeout(addressSuggestTimer);
  const input = context==='case' ? $('caseAddress') : $('locationAddressInput');
  const list = context==='case' ? $('caseAddressCandidateList') : $('locationCandidateList');
  if(!input || !list) return;
  if(context==='case') pendingCasePlace=null;
  const value=input.value.trim();
  if(value.length<3){ list.innerHTML=''; return; }
  addressSuggestTimer=setTimeout(()=>renderAddressSuggestions(context,value),350);
}
async function renderAddressSuggestions(context,inputValue){
  const input = context==='case' ? $('caseAddress') : $('locationAddressInput');
  const list = context==='case' ? $('caseAddressCandidateList') : $('locationCandidateList');
  if(!input || !list || input.value.trim()!==inputValue.trim()) return;
  list.innerHTML='<div class="location-loading">Google 地址候選搜尋中…</div>';
  try{
    const predictions=await fetchPlaceSuggestions(inputValue,context);
    if(input.value.trim()!==inputValue.trim()) return;
    if(!predictions.length){
      const geos=await googleGeocodeCandidates(inputValue);
      renderGeocodeCandidateButtons(context,geos);
      return;
    }
    list.innerHTML=predictions.map((p,i)=>`<button type="button" class="location-candidate" data-place-prediction="${i}"><b>${escapeHtml(p.text?.toString()||'Google 地址候選')}</b><span>Google Places</span></button>`).join('')+'<div class="powered-by-google-note">Powered by Google</div>';
    list.querySelectorAll('[data-place-prediction]').forEach(btn=>btn.addEventListener('click',async()=>{
      const candidate=await placePredictionToCandidate(predictions[Number(btn.dataset.placePrediction)]);
      autocompleteSessionToken=null;
      if(context==='case'){
        pendingCasePlace=candidate;
        $('caseAddress').value=candidate.formattedAddress;
        list.innerHTML='<div class="location-selected">已選定 Google 地址；建立案件後仍可用現場 GPS 校正。</div>';
      }else{
        $('locationAddressInput').value=candidate.formattedAddress;
        await setIncidentLocation(candidate,false);
        list.innerHTML='<div class="location-selected">已套用 Google 地址，請比對 GPS 或地圖後鎖定。</div>';
      }
    }));
  }catch(err){
    list.innerHTML=`<div class="location-error">地址候選載入失敗：${escapeHtml(err.message||String(err))}</div>`;
  }
}
function renderGeocodeCandidateButtons(context,candidates=[]){
  const list=context==='case'?$('caseAddressCandidateList'):$('locationCandidateList');
  if(!list) return;
  if(!candidates.length){ list.innerHTML='<div class="location-error">找不到 Google 地址候選，請執行定位診斷或改用現場 GPS。</div>'; return; }
  list.innerHTML=candidates.slice(0,5).map((c,i)=>`<button type="button" class="location-candidate" data-geocode-candidate="${i}"><b>${escapeHtml(c.formattedAddress)}</b><span>${Number(c.lat).toFixed(6)}, ${Number(c.lng).toFixed(6)}</span></button>`).join('');
  list.querySelectorAll('[data-geocode-candidate]').forEach(btn=>btn.addEventListener('click',async()=>{
    const c=candidates[Number(btn.dataset.geocodeCandidate)];
    if(context==='case'){
      pendingCasePlace=c; $('caseAddress').value=c.formattedAddress;
      list.innerHTML='<div class="location-selected">已選定 Google 地址；建立案件後仍可用 GPS 校正。</div>';
    }else{
      $('locationAddressInput').value=c.formattedAddress;
      await setIncidentLocation(c,false);
      list.innerHTML='<div class="location-selected">已套用 Google 地址，請確認後鎖定。</div>';
    }
  }));
}
function getLocationMeta(){ return currentCase?.locationMeta || {}; }
function locationSourceLabel(source=''){
  return ({'google-address':'Google 地址','gps':'現場 GPS','manual':'手動地圖','fallback':'備援中心','legacy':'既有資料'})[source] || '未確認';
}
function locationQualityLabel(meta={}){
  if(meta.locked) return '已確認並鎖定';
  if(meta.source==='google-address') return 'Google 地址待現場確認';
  if(meta.source==='gps') return `GPS 待確認${meta.accuracy?`（±${Math.round(meta.accuracy)}m）`:''}`;
  if(meta.source==='manual') return '手動地圖待確認';
  return '尚未確認';
}
async function geocodeAddress(address){
  const normalized = normalizeAddress(address);
  if(pendingCasePlace && normalizeAddress(pendingCasePlace.formattedAddress)===normalized) return pendingCasePlace;
  try{
    const candidates = await googleGeocodeCandidates(normalized);
    if(candidates.length===1) return candidates[0];
    if(candidates.length>1){
      const selected = await chooseLocationCandidate(candidates, normalized);
      if(selected) return selected;
    }
  }catch(err){
    console.warn('Google geocode unavailable', err);
    toast(`Google 地址定位失敗：${err.message||err}。案件仍可建立，請進入部署頁使用 GPS 或手動定位。`,5200);
  }
  return {...fallbackCenter(normalized), source:'fallback', formattedAddress:normalized, placeId:'', unverified:true};
}
function chooseLocationCandidate(candidates,address){
  return new Promise(resolve=>{
    const rows=candidates.slice(0,5).map((c,i)=>`<button type="button" class="action-option" data-location-choice="${i}"><b>${escapeHtml(c.formattedAddress)}</b><div class="diagnostic-detail">${Number(c.lat).toFixed(6)}, ${Number(c.lng).toFixed(6)}</div></button>`).join('');
    openActionSheet('請選擇正確門牌',`<div class="notice compact">Google 找到多個結果，請選擇正確地址；取消後會以未確認中心建立案件。</div><div class="action-grid">${rows}<button type="button" class="action-option danger" data-location-choice="cancel">暫不選擇，稍後以 GPS 校正</button></div>`);
    const body=$('appActionBody');
    body.querySelectorAll('[data-location-choice]').forEach(btn=>btn.addEventListener('click',()=>{
      const value=btn.dataset.locationChoice;
      closeActionSheet();
      resolve(value==='cancel'?null:candidates[Number(value)]);
    },{once:true}));
  });
}



function backHome(){
  cleanupSubscriptions(); currentCaseId=null; currentCase=null;
  $('detailPage').hidden=true; $('homePage').hidden=false;
  subscribeCases();
}
function openCase(id){
  cleanupSubscriptions(); currentCaseId = id;
  $('homePage').hidden=true; $('detailPage').hidden=false;
  switchCasePage('caseInfo', false);
  if(firebaseEnabled){ subscribeCaseRemote(id); }
  else { loadCaseLocal(id); }
  setTimeout(()=>{ initMap(); renderMap(); }, 120);
}
function subscribeCaseRemote(id){
  const caseUnsub = db.collection('cases').doc(id).onSnapshot(doc => { currentCase = { id:doc.id, ...doc.data() }; renderDetail(); });
  unsubscribers.push(caseUnsub);
  ['vehicles','crews','hoses','hazards','sitreps','logs'].forEach(coll => {
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
  live.sitreps = currentCase.sitreps || [];
  live.logs = currentCase.logs || [];
  renderDetail(); renderLiveParts();
}
function saveLocalCase(){
  if(!currentCase) return;
  currentCase.vehicles = live.vehicles; currentCase.crews = live.crews; currentCase.hoses = live.hoses; currentCase.hazards = live.hazards; currentCase.sitreps = live.sitreps; currentCase.logs = live.logs;
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
  $('adminSection') && ($('adminSection').hidden = true);
  $('arrivedCheck').checked = !!currentCase.arrived;
  $('commandCheck').checked = !!currentCase.commandTransfer;
  setRadioValue('commandState', currentCase.commandState || (currentCase.commandTransfer ? 'transferred' : ''));
  $('ritCheck').checked = !!currentCase.ritSet;
  $('hazardCheck').checked = !!currentCase.hazardChecked;
  $('firstSideCheck').checked = !!currentCase.firstSideSet;
  setRadioValue('firstSideState', currentCase.firstSideState || (currentCase.firstSideSet ? 'set' : ''));
  $('parCheck').checked = !!currentCase.parRequested;
  $('supportCheck').checked = !!currentCase.supportNeeded || (currentCase.supports||[]).length>0;
  setRadioValue('supportState', currentCase.supportState || ((currentCase.supportNeeded || (currentCase.supports||[]).length) ? 'needed' : ''));
  $('addressConfirmCheck') && ($('addressConfirmCheck').checked = !!currentCase.addressConfirmed);
  $('arrivalAddressNote') && ($('arrivalAddressNote').value = currentCase.arrivalAddressNote || '');
  $('contactCheck') && ($('contactCheck').checked = !!currentCase.contactFound || currentCase.contactState==='notfound');
  $('contactFoundCheck') && ($('contactFoundCheck').checked = !!currentCase.contactFound);
  setRadioValue('contactState', currentCase.contactState || (currentCase.contactFound ? 'found' : ''));
  renderContactRows(currentCase.contacts || []);
  $('commandSituation') && ($('commandSituation').value = currentCase.commandSituation || '');
  setRadioValue('ritState', currentCase.ritState || (currentCase.ritSet ? 'assigned' : ''));
  $('ritUnit') && ($('ritUnit').value = currentCase.ritUnit || '');
  $('ritNote') && ($('ritNote').value = currentCase.ritNote || '');
  setRadioValue('hazardState', currentCase.hazardState || (currentCase.hazardChecked ? 'has' : ''));
  $('hazardItems') && ($('hazardItems').value = currentCase.hazardItems || '');
  $('hazardContact') && ($('hazardContact').value = currentCase.hazardContact || '');
  $('hazardPhone') && ($('hazardPhone').value = currentCase.hazardPhone || '');
  $('hazardAppearance') && ($('hazardAppearance').value = currentCase.hazardAppearance || '');
  $('firstSideName') && ($('firstSideName').value = currentCase.firstSideName || '第一面');
  $('firstSideNote') && ($('firstSideNote').value = currentCase.firstSideNote || '');
  $('parDetails') && ($('parDetails').value = currentCase.parDetails || '');
  $('supportDetails') && ($('supportDetails').value = currentCase.supportDetails || '');
  syncBuildingBoxForm();
  $('arrivalAddressDisplay') && ($('arrivalAddressDisplay').textContent = currentCase.address || '尚未登錄地址');
  $('arrivalAddressInput') && ($('arrivalAddressInput').value = currentCase.address || '');
  const observedLocation=splitObservedLocation(currentCase.fireObservedFloor || currentCase.fireFloor || '');
  syncFloorChoiceOptions({caseFloors:'',caseFireFloor:'',summaryFloors:currentCase.floors||'',summaryFireFloor:currentCase.fireFloor||'',detailFloors:currentCase.floors||'',detailFireFloor:currentCase.fireFloor||'',fireObservedFloor:observedLocation.floor||currentCase.fireFloor||''});
  $('detailPurpose').value = currentCase.purpose || '';
  $('buildingStructure') && ($('buildingStructure').value = currentCase.buildingStructure || '');
  $('detailFloors') && ($('detailFloors').value = currentCase.floors || '');
  $('detailFireFloor') && ($('detailFireFloor').value = normalizeFloorValue(currentCase.fireFloor || ''));
  $('fireObservedFloor') && ($('fireObservedFloor').value = observedLocation.floor || normalizeFloorValue(currentCase.fireFloor || ''));
  $('fireObservedSide') && ($('fireObservedSide').value = currentCase.fireObservedSide || observedLocation.side || '');
  $('fireSmokeColor') && ($('fireSmokeColor').value = currentCase.fireSmokeColor || '');
  $('fireSmokeVolume') && ($('fireSmokeVolume').value = currentCase.fireSmokeVolume || '');
  $('fireFlameState') && ($('fireFlameState').value = currentCase.fireFlameState || '');
  $('fireObservation') && ($('fireObservation').value = currentCase.fireObservation || '');
  $('detailFireStatus').value = currentCase.fireStatus || '';
  $('detailNotes').value = currentCase.notes || '';
  setRadioValue('trappedState', currentCase.trapped==='有'?'has':currentCase.trapped==='無'?'none':'unknown');
  $('trappedCountArrival') && ($('trappedCountArrival').value = currentCase.trappedCount || '');
  setRadioValue('firstSideMode', currentCase.firstSideMode || (currentCase.firstSideSet?'front':''));
  $('firstSideCustom') && ($('firstSideCustom').value = currentCase.firstSideCustom || '');
  if($('extraNotes')) $('extraNotes').value = currentCase.extraNotes || '';
  $('summaryFloors').value = currentCase.floors || '';
  $('summaryFireFloor').value = normalizeFloorValue(currentCase.fireFloor || '');
  $('summaryTrapped').value = currentCase.trapped || '未知';
  $('summaryTrappedCountMode').value = currentCase.trappedCountMode || String(currentCase.trappedCount || 0);
  if(!Array.from($('summaryTrappedCountMode').options).some(o=>o.value===$('summaryTrappedCountMode').value)) $('summaryTrappedCountMode').value = 'manual';
  $('summaryText').value = currentCase.summary || '';
  $('summaryVictimRows').innerHTML = '';
  (currentCase.victims || []).forEach(v => addVictimRow(v, 'summaryVictimRows'));
  syncSummaryVictimDetails();
  applySupportValues(currentCase.supports || []);
  $('breakDoorCheck') && ($('breakDoorCheck').checked = !!currentCase.breakDoor);
  setRadioValue('breakDoorState', currentCase.breakDoorState || (currentCase.breakDoor ? 'required' : ''));
  $('breakDoorCommanderReport') && ($('breakDoorCommanderReport').checked = !!currentCase.breakDoorCommanderReport);
  $('breakDoorCenterReport') && ($('breakDoorCenterReport').checked = !!currentCase.breakDoorCenterReport);
  $('breakDoorAt') && ($('breakDoorAt').value = currentCase.breakDoorAt ? toDatetimeLocalValue(currentCase.breakDoorAt) : '');
  $('breakDoorUnit') && ($('breakDoorUnit').value = currentCase.breakDoorUnit || '');
  $('breakDoorNote') && ($('breakDoorNote').value = currentCase.breakDoorNote || '');
  $('cordonCheck') && ($('cordonCheck').checked = !!currentCase.cordonSet);
  setRadioValue('cordonState', currentCase.cordonState || (currentCase.cordonSet ? 'set' : ''));
  $('cordonAssignedCheck') && ($('cordonAssignedCheck').checked = !!currentCase.cordonAssigned);
  $('cordonUnit') && ($('cordonUnit').value = currentCase.cordonUnit || '');
  $('cordonArea') && ($('cordonArea').value = currentCase.cordonArea || '');
  $('cordonNote') && ($('cordonNote').value = currentCase.cordonNote || '');
  updateArrivalConditionalPanels();
  renderLocationControl();
  renderSummaryCards(); renderArrivalStatusCards(); renderCommandGuide(); renderBuildingOps(); renderLocalTacticalAdvice(false); updateAiAdviceButton(); updateAssessmentAvailability(); renderLiveParts(); maybeAutoAiAdvice();
}
function renderSummaryCards(){
  const c=currentCase; const wrap=$('summaryCards'); if(!wrap)return;
  wrap.innerHTML = `
    <button type="button" class="mini-card summary-link-card" data-summary-page="arrivalSection" data-summary-stage="建"><div class="metric">${c.floors||'?'}</div><div class="metric-label">建物樓層</div><div class="subline">起火：${escapeHtml(floorText(c.fireFloor))}｜點選查看</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="arrivalSection" data-summary-stage="人"><div class="metric">${c.trapped==='有'?'有':c.trapped==='無'?'無':'?'}</div><div class="metric-label">受困狀況</div><div class="subline">${c.trapped==='有'?`${c.trappedCount||0} 人`:c.trapped==='無'?'確認無人受困':'尚未確認'}｜點選查看</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="dashboardSection"><div class="metric">${live.vehicles.length}</div><div class="metric-label">車輛</div><div class="subline">部署與任務細節</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="dashboardSection"><div class="metric">${sum(live.crews,'count')}</div><div class="metric-label">人員</div><div class="subline">作業／待命／休息</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="tacticalMapSection"><div class="metric">${live.hoses.length}</div><div class="metric-label">水線</div><div class="subline">連接與部署細節</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="sitrepSection"><div class="metric">${live.sitreps.length}</div><div class="metric-label">戰情</div><div class="subline">查看最新回報</div></button>`;
  wrap.querySelectorAll('[data-summary-page]').forEach(btn=>btn.addEventListener('click',()=>{switchCasePage(btn.dataset.summaryPage);if(btn.dataset.summaryStage)selectCommandStage(btn.dataset.summaryStage);}));
}
function renderLiveParts(){
  if(!currentCase) return;
  renderSummaryCards(); renderToolOptions(); renderDeploymentPalette(); renderMap(); renderLocationControl(); renderDashboard(); renderRules(); renderSitreps(); renderLogs(); renderCommandGuide(); renderBuildingOps(); renderLocalTacticalAdvice(false); updateAiAdviceButton(); updateAssessmentAvailability(); renderParCrewChecklist(); generateReport(false);
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
function setDeploymentMode(mode='select'){
  deploymentMode=mode;
  document.querySelectorAll('[data-deploy-mode]').forEach(btn=>{
    const active=btn.dataset.deployMode===mode;
    btn.classList.toggle('primary',active); btn.classList.toggle('ghost',!active);
  });
  selectedMapResource=null;
  if(mode!=='hose' && pendingTool?.type==='hoseConnect') pendingTool=null;
  const hint=$('deploymentActionHint');
  if(hint) hint.textContent=mode==='hose'?'水線模式：先點可接水線車輛，再點另一台車、人員編組或地圖位置。':mode==='hazard'?'危害模式：點下方危害圖示，再點地圖放置。':'選取模式：點資源後再點地圖，或直接拖曳地圖上的標示。';
  renderDeploymentPalette();
}
function renderDeploymentPalette(){
  const wrap=$('mapResourcePalette'); if(!wrap) return;
  const vehicleHtml=live.vehicles.map(v=>`<article class="resource-chip ${selectedMapResource?.coll==='vehicles'&&selectedMapResource?.id===v.id?'active':''}" draggable="true" data-resource-coll="vehicles" data-resource-id="${v.id}" data-resource-label="${escapeHtml(v.name)}"><b>${vehEmoji(v.type)} ${escapeHtml(v.name)}</b><span>${escapeHtml(v.unit)}｜${escapeHtml(v.task||v.status||'待命')}</span><div class="resource-chip-actions">${v.canHose?`<button type="button" data-resource-action="quickHose" data-resource-id="${v.id}">拉水線</button>`:''}<button type="button" data-map-action="editVehicle" data-id="${v.id}">修改</button></div></article>`).join('');
  const crewHtml=live.crews.map(c=>`<article class="resource-chip ${selectedMapResource?.coll==='crews'&&selectedMapResource?.id===c.id?'active':''}" draggable="true" data-resource-coll="crews" data-resource-id="${c.id}" data-resource-label="${escapeHtml(c.unit+c.leader)}"><b>👥 ${escapeHtml(c.unit)}${escapeHtml(c.leader)}</b><span>${c.count||0}人｜${escapeHtml(c.task||c.status||'待命')}</span><div class="resource-chip-actions"><button type="button" data-map-action="editCrew" data-id="${c.id}">修改</button><button type="button" data-map-action="restCrew" data-mode="原地休息" data-id="${c.id}">休息</button></div></article>`).join('');
  const hazards=['起火點','指揮站','前進指揮所','休息區','瓦斯','高壓電','危險物'].map(t=>`<button type="button" class="resource-chip quick-symbol" data-resource-action="newHazard" data-hazard-type="${t}"><b>${hazEmoji(t)} ${t}</b><span>點選後再點地圖</span></button>`).join('');
  wrap.innerHTML=(vehicleHtml+crewHtml+hazards)||'<div class="resource-empty">尚無人車資料；可先使用下方表單新增。</div>';
  wrap.querySelectorAll('[draggable="true"]').forEach(el=>el.addEventListener('dragstart',ev=>{
    ev.dataTransfer.setData('application/json',JSON.stringify({coll:el.dataset.resourceColl,id:el.dataset.resourceId,label:el.dataset.resourceLabel||''}));
  }));
}
function selectMapResource(coll,id){
  const item=(live[coll]||[]).find(x=>x.id===id); if(!item) return;
  if(deploymentMode==='hose' && coll==='vehicles'){
    if(!item.canHose){ toast('此車輛類型不可建立水線'); return; }
    beginQuickHose(id); return;
  }
  selectedMapResource={coll,id};
  pendingTool={type:'moveExisting',coll,id};
  toast(`已選擇 ${item.name||item.unit||'資源'}，請點地圖部署位置。`,3600);
  renderDeploymentPalette();
}
function handleResourceAction(btn){
  const action=btn.dataset.resourceAction;
  if(action==='quickHose') return beginQuickHose(btn.dataset.resourceId);
  if(action==='newHazard'){
    setDeploymentMode('hazard');
    startHazardTool(btn.dataset.hazardType||'危險物');
  }
}
function firstAvailableHosePort(vehicleId){
  const used=new Set(live.hoses.filter(h=>h.vehicleId===vehicleId).map(h=>String(h.port||'')));
  return ['1線','2線','3線','4線'].find(x=>!used.has(x))||'1線';
}
function beginQuickHose(vehicleId){
  const v=live.vehicles.find(x=>x.id===vehicleId); if(!v) return;
  if(!v.canHose){ toast('此車輛不可接水線'); return; }
  setDeploymentMode('hose');
  pendingTool={type:'hoseConnect',vehicleId:v.id,vehicleName:v.name,unit:v.unit,owner:v.unit||profile?.unit||'',port:firstAvailableHosePort(v.id),task:'水線作業',kind:'進攻水線',targetType:'map',targetId:''};
  selectedMapResource={coll:'vehicles',id:v.id};
  toast(`已選擇 ${v.name} ${pendingTool.port}；請點目標車輛、人員或地圖位置。`,4800);
  renderDeploymentPalette();
}
function completeQuickHoseTarget(targetType,item){
  if(!pendingTool || !['hoseConnect','hoseReconnect'].includes(pendingTool.type)) return false;
  if(targetType==='vehicle' && item.id===pendingTool.vehicleId){ toast('水線終點不能是同一台來源車輛'); return true; }
  const tool={...pendingTool,targetType,targetId:item.id};
  const reconnect=pendingTool.type==='hoseReconnect';
  pendingTool=null; selectedMapResource=null;
  if(reconnect){
    const targetName=targetType==='vehicle'?`${item.name}｜${item.unit}`:`${item.unit}${item.leader}｜${item.count}人`;
    updateItem('hoses',tool.hoseId,{targetType,targetId:item.id,targetName,lat:null,lng:null}).then(()=>addLog('hose',`重新指定水線終點：${targetName}`)).then(()=>{renderDeploymentPalette();renderMap();});
  }else addHoseToTarget(tool).then(()=>{ renderDeploymentPalette(); renderMap(); });
  return true;
}

async function saveCaseInfo(showToast=true, logChange=true){
  if(!currentCase) return;
  const supports = getRadioValue('supportState') === 'needed' ? readSupports() : [];
  const patch = {
    arrived:!!$('addressConfirmCheck')?.checked,
    commandState:getRadioValue('commandState') || '',
    commandTransfer:getRadioValue('commandState') === 'transferred',
    contactState: getRadioValue('contactState') || '',
    contactFound: getRadioValue('contactState') === 'found',
    contacts: getRadioValue('contactState') === 'found' ? readContacts() : [],
    ritState: getRadioValue('ritState') || '',
    ritSet:getRadioValue('ritState') === 'assigned',
    hazardState: getRadioValue('hazardState') || '',
    hazardChecked:getRadioValue('hazardState') === 'has' || getRadioValue('hazardState') === 'none',
    firstSideState:getRadioValue('firstSideState') || '',
    firstSideSet:getRadioValue('firstSideState') === 'set',
    parRequested:$('parCheck').checked,
    supportState:getRadioValue('supportState') || '',
    supportNeeded:getRadioValue('supportState') === 'needed',
    breakDoorState:getRadioValue('breakDoorState') || '',
    breakDoor:getRadioValue('breakDoorState') === 'required',
    breakDoorCommanderReport: $('breakDoorCommanderReport')?.checked || false,
    breakDoorCenterReport: $('breakDoorCenterReport')?.checked || false,
    breakDoorAt: datetimeLocalToMs($('breakDoorAt')?.value) || null,
    breakDoorUnit: $('breakDoorUnit')?.value || '',
    breakDoorNote: $('breakDoorNote')?.value || '',
    cordonState:getRadioValue('cordonState') || '',
    cordonSet:getRadioValue('cordonState') === 'set',
    cordonAssigned: $('cordonAssignedCheck')?.checked || false,
    cordonUnit: $('cordonUnit')?.value || '',
    cordonArea: $('cordonArea')?.value || '',
    cordonNote: $('cordonNote')?.value || '',
    addressConfirmed:$('addressConfirmCheck')?.checked || false,
    arrivalAddressNote:$('arrivalAddressNote')?.value || '',
    commandSituation:$('commandSituation')?.value || '',
    ritUnit:$('ritUnit')?.value || '',
    ritNote:$('ritNote')?.value || '',
    hazardItems:$('hazardItems')?.value || '',
    hazardContact:$('hazardContact')?.value || '',
    hazardPhone:$('hazardPhone')?.value || '',
    hazardAppearance:$('hazardAppearance')?.value || '',
    firstSideMode:getRadioValue('firstSideMode') || '',
    firstSideCustom:$('firstSideCustom')?.value || '',
    firstSideName:getRadioValue('firstSideMode')==='custom' ? ($('firstSideCustom')?.value || '第一面') : '建物正面',
    firstSideNote:$('firstSideNote')?.value || '',
    parDetails:$('parDetails')?.value || '',
    supportDetails:$('supportDetails')?.value || '',
    purpose:$('detailPurpose')?.value || '',
    buildingStructure:$('buildingStructure')?.value || '',
    floors:Number($('detailFloors')?.value)||Number(currentCase.floors)||0,
    fireFloor:normalizeFloorValue($('detailFireFloor')?.value) || normalizeFloorValue(currentCase.fireFloor) || '',
    fireObservedFloor:normalizeFloorValue($('fireObservedFloor')?.value) || '',
    fireObservedSide:$('fireObservedSide')?.value || '',
    fireSmokeColor:$('fireSmokeColor')?.value || '',
    fireSmokeVolume:$('fireSmokeVolume')?.value || '',
    fireFlameState:$('fireFlameState')?.value || '',
    fireObservation:$('fireObservation')?.value.trim() || '',
    fireStatus:buildFireStatusFromSop(),
    trapped:getRadioValue('trappedState')==='has'?'有':getRadioValue('trappedState')==='none'?'無':'未知',
    trappedCount:getRadioValue('trappedState')==='has' ? (Number($('trappedCountArrival')?.value)||0) : 0,
    supports,
    notes:$('detailNotes')?.value || '',
    updatedAt:Date.now()
  };
  const editedAddress=$('arrivalAddressInput')?.value.trim() || currentCase.address || '';
  if(editedAddress && editedAddress!==currentCase.address){
    patch.address=editedAddress;
    patch.addressConfirmed=!!$('addressConfirmCheck')?.checked;
    patch.locationMeta={...(currentCase.locationMeta||{}),queryAddress:editedAddress,formattedAddress:'',placeId:'',confirmed:false,locked:false,unverified:true,source:'address-edited',updatedAt:Date.now(),updatedBy:radioCallSign()};
  }
  Object.assign(currentCase, patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true});
  else { saveLocalCase(); renderDetail(); }
  if(logChange) await addLog('arrival','更新到場回報 / 到建火人支初資訊');
  if(!activeStage) activeStage='到';
  renderArrivalStatusCards(); renderCommandGuide();
  if(showToast) toast('已儲存到場回報');
}
async function saveSummaryInfo(){
  if(!currentCase) return;
  const patch = { floors:Number($('summaryFloors').value)||0, fireFloor:normalizeFloorValue($('summaryFireFloor').value), trapped:$('summaryTrapped').value, trappedCount:getSummaryTrappedCount(), trappedCountMode:$('summaryTrappedCountMode').value, victims:readVictims('#summaryVictimRows .victim-row'), summary:$('summaryText').value.trim(), updatedAt:Date.now() };
  Object.assign(currentCase, patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true});
  else { saveLocalCase(); renderDetail(); }
  await addLog('case','更新案件概要（開案資料）');
  renderSummaryCards(); renderCommandGuide(); generateReport(false);
  toast('已儲存案件概要');
}
function readSupports(){ return Array.from(document.querySelectorAll('.support-grid input:checked')).map(x=>x.value); }
function applySupportValues(values=[]){ document.querySelectorAll('.support-grid input').forEach(x=>{ x.checked = values.includes(x.value); }); }

function emptyContact(){ return {name:'', phone:'', appearance:'', note:''}; }
function renderContactRows(rows=[]){
  const wrap = $('contactRows'); if(!wrap) return;
  const list = (rows && rows.length ? rows : [emptyContact()]);
  wrap.innerHTML = list.map((r,i)=>`<div class="contact-row" data-contact-index="${i}">
    <div class="two-col compact-form"><div class="field"><label>姓名</label><input class="arrival-detail-input contact-name" value="${escapeHtml(r.name||'')}" placeholder="例：屋主王先生" /></div><div class="field"><label>電話</label><input class="arrival-detail-input contact-phone" value="${escapeHtml(r.phone||'')}" inputmode="tel" placeholder="09xx-xxx-xxx" /></div></div>
    <div class="field"><label>穿著 / 特徵</label><input class="arrival-detail-input contact-appearance" value="${escapeHtml(r.appearance||'')}" placeholder="例：紅色上衣、黑褲，位於第一面封鎖線外" /></div>
    <div class="field"><label>補充</label><input class="arrival-detail-input contact-note" value="${escapeHtml(r.note||'')}" placeholder="關係人說明、鑰匙、樓層、住戶資訊" /></div>
    <button type="button" class="btn small ghost" data-delete-contact="${i}">刪除此關係人</button>
  </div>`).join('');
  wrap.querySelectorAll('[data-delete-contact]').forEach(btn => btn.addEventListener('click', () => { const arr = readContacts(); arr.splice(Number(btn.dataset.deleteContact),1); renderContactRows(arr); saveCaseInfo(false,false); }));
  wrap.querySelectorAll('input').forEach(el => el.addEventListener('change', () => { $('contactCheck') && ($('contactCheck').checked = getRadioValue('contactState')==='found' || getRadioValue('contactState')==='notfound'); renderArrivalStatusCards(); renderCommandGuide(); saveCaseInfo(false,false); }));
}
function addContactRow(){ const arr = readContacts(); arr.push(emptyContact()); renderContactRows(arr); }
function readContacts(){
  return Array.from(document.querySelectorAll('#contactRows .contact-row')).map(row => ({
    name: row.querySelector('.contact-name')?.value.trim() || '',
    phone: row.querySelector('.contact-phone')?.value.trim() || '',
    appearance: row.querySelector('.contact-appearance')?.value.trim() || '',
    note: row.querySelector('.contact-note')?.value.trim() || ''
  })).filter(x => x.name || x.phone || x.appearance || x.note);
}

async function saveExtraNotes(){
  const el = $('extraNotes');
  if(!el || !currentCase) return;
  const patch = { extraNotes:el.value, updatedAt:Date.now() };
  Object.assign(currentCase, patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase();
  await addLog('case','更新案件補充資料'); toast('已儲存補充資料');
}

function renderLocationControl(){
  if(!currentCase) return;
  const meta = getLocationMeta();
  const input = $('locationAddressInput');
  if(input && document.activeElement !== input) input.value = meta.queryAddress || currentCase.address || '';
  const panel = $('locationStatusPanel');
  if(panel){
    const gps = meta.gpsLat && meta.gpsLng ? `${Number(meta.gpsLat).toFixed(6)}, ${Number(meta.gpsLng).toFixed(6)}${meta.gpsAccuracy?`（±${Math.round(meta.gpsAccuracy)}m）`:''}` : '尚未取得';
    const delta = Number(meta.addressGpsDistanceM);
    const deltaText = Number.isFinite(delta) ? `${Math.round(delta)}m` : '尚未比對';
    const tone = Number.isFinite(delta) ? (delta>300?'danger':delta>100?'warning':'good') : 'neutral';
    panel.innerHTML = `<div class="location-status-grid">
      <div><span>定位來源</span><b>${escapeHtml(locationSourceLabel(meta.source || 'legacy'))}</b></div>
      <div><span>案件中心</span><b>${Number(currentCase.lat||0).toFixed(6)}, ${Number(currentCase.lng||0).toFixed(6)}</b></div>
      <div><span>現場 GPS</span><b>${escapeHtml(gps)}</b></div>
      <div class="${tone}"><span>地址 / GPS 差距</span><b>${escapeHtml(deltaText)}</b></div>
      <div class="wide"><span>確認狀態</span><b>${escapeHtml(locationQualityLabel(meta))}${meta.formattedAddress?`｜${escapeHtml(meta.formattedAddress)}`:''}</b></div>
    </div>`;
  }
  const lockBtn=$('confirmIncidentLocationBtn'), unlockBtn=$('unlockIncidentLocationBtn');
  if(lockBtn) lockBtn.hidden = !!meta.locked;
  if(unlockBtn) unlockBtn.hidden = !meta.locked;
}
async function searchGoogleAddress(){
  const input=$('locationAddressInput');
  const address=normalizeAddress(input?.value || currentCase?.address || '');
  if(!address){ toast('請先輸入地址'); return; }
  const list=$('locationCandidateList');
  if(list) list.innerHTML='<div class="location-loading">Google 地址搜尋中…</div>';
  try{
    const candidates=await googleGeocodeCandidates(address);
    if(!candidates.length) throw new Error('沒有找到候選地址');
    if(list){
      list.innerHTML = candidates.slice(0,5).map((c,i)=>`<button type="button" class="location-candidate" data-location-candidate="${i}"><b>${escapeHtml(c.formattedAddress)}</b><span>${Number(c.lat).toFixed(6)}, ${Number(c.lng).toFixed(6)}</span></button>`).join('');
      list.querySelectorAll('[data-location-candidate]').forEach(btn=>btn.addEventListener('click', async()=>{
        const candidate=candidates[Number(btn.dataset.locationCandidate)];
        await setIncidentLocation(candidate, false);
        if(list) list.innerHTML='<div class="location-selected">已套用 Google 地址候選，請在地圖確認後鎖定案件中心。</div>';
      }));
    }
  }catch(err){
    if(list) list.innerHTML=`<div class="location-error">Google 地址搜尋失敗：${escapeHtml(err.message)}。請確認已在 Vercel 設定 GOOGLE_MAPS_BROWSER_KEY，並啟用 Maps JavaScript API、Places API（New）及 Geocoding API。</div>`;
  }
}
async function useCurrentGps(){
  if(!navigator.geolocation){ toast('此瀏覽器不支援 GPS 定位'); return; }
  if(gpsWatchId!==null){ navigator.geolocation.clearWatch(gpsWatchId); gpsWatchId=null; }
  const samples=[];
  const started=Date.now();
  const panel=$('locationStatusPanel');
  toast('正在連續取樣 GPS，將自動採用精度最佳的位置…',5000);
  const finish=async(reason='timeout')=>{
    if(gpsWatchId!==null){ navigator.geolocation.clearWatch(gpsWatchId); gpsWatchId=null; }
    if(!samples.length){ toast('尚未取得 GPS；請檢查定位權限、GPS 與網路。',4200); return; }
    samples.sort((a,b)=>a.accuracy-b.accuracy);
    const best=samples[0];
    const loc={lat:best.lat,lng:best.lng,source:'gps',formattedAddress:currentCase?.address||'',accuracy:best.accuracy,gpsLat:best.lat,gpsLng:best.lng,gpsAccuracy:best.accuracy,gpsSampleCount:samples.length,gpsSampleDurationMs:Date.now()-started};
    await setIncidentLocation(loc,false);
    const quality=best.accuracy<=30?'良好':best.accuracy<=80?'可用但需確認':'精度偏差，請手動校正';
    toast(`GPS 取樣完成：±${Math.round(best.accuracy)}m（${quality}），請確認後鎖定案件中心。`,4800);
  };
  const timer=setTimeout(()=>finish('timeout'),18000);
  gpsWatchId=navigator.geolocation.watchPosition(pos=>{
    const c=pos.coords;
    samples.push({lat:c.latitude,lng:c.longitude,accuracy:Number(c.accuracy||9999),ts:pos.timestamp||Date.now()});
    samples.sort((a,b)=>a.accuracy-b.accuracy);
    const best=samples[0];
    if(panel) panel.insertAdjacentHTML('afterbegin',`<div class="location-selected" data-gps-progress="1">GPS 取樣 ${samples.length} 筆｜目前最佳 ±${Math.round(best.accuracy)}m</div>`);
    panel?.querySelectorAll('[data-gps-progress]').forEach((x,i)=>{ if(i>0)x.remove(); });
    if(best.accuracy<=20 && samples.length>=2){ clearTimeout(timer); finish('good'); }
  },err=>{
    clearTimeout(timer);
    if(gpsWatchId!==null){ navigator.geolocation.clearWatch(gpsWatchId); gpsWatchId=null; }
    const msg=({1:'定位權限未允許，請在常見故障排除依 iOS / Android 步驟開啟。',2:'目前無法取得位置，請確認 GPS、網路與室外環境。',3:'定位逾時，請稍候再試或改用手動設定。'})[err.code]||'無法取得目前位置';
    toast(msg,4600);
  },{enableHighAccuracy:true,maximumAge:0,timeout:12000});
}
function beginManualIncidentCenter(){
  if(getLocationMeta().locked){ toast('案件中心已鎖定，請先解除鎖定後再調整。'); return; }
  pendingTool={type:'incidentCenter'};
  toast('請在地圖上點選正確火場中心 / 入口附近位置。', 3600);
}
async function setIncidentLocation(loc, confirmed=false){
  if(!currentCase) return;
  const currentMeta=getLocationMeta();
  if(currentMeta.locked && !confirmed){ toast('案件中心已鎖定，請先解除鎖定後再調整。'); return; }
  const source=loc.source || 'manual';
  const meta={...currentMeta,
    source, formattedAddress:loc.formattedAddress || currentMeta.formattedAddress || currentCase.address || '', placeId:loc.placeId || currentMeta.placeId || '',
    queryAddress:$('locationAddressInput')?.value || currentMeta.queryAddress || currentCase.address || '',
    accuracy:loc.accuracy ?? currentMeta.accuracy ?? null,
    gpsLat:loc.gpsLat ?? currentMeta.gpsLat ?? null, gpsLng:loc.gpsLng ?? currentMeta.gpsLng ?? null, gpsAccuracy:loc.gpsAccuracy ?? currentMeta.gpsAccuracy ?? null,
    unverified:source==='fallback', locked:confirmed ? true : false, confirmed:confirmed ? true : false,
    updatedAt:Date.now(), updatedBy:profile?.callName || ''};
  if(meta.gpsLat && meta.gpsLng && source==='google-address') meta.addressGpsDistanceM=distanceMeters({lat:loc.lat,lng:loc.lng},{lat:meta.gpsLat,lng:meta.gpsLng});
  if(source==='gps' && currentMeta.addressLat && currentMeta.addressLng) meta.addressGpsDistanceM=distanceMeters({lat:currentMeta.addressLat,lng:currentMeta.addressLng},{lat:loc.lat,lng:loc.lng});
  if(source==='google-address'){ meta.addressLat=loc.lat; meta.addressLng=loc.lng; }
  const patch={lat:Number(loc.lat),lng:Number(loc.lng),locationMeta:meta,updatedAt:Date.now()};
  Object.assign(currentCase,patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else { saveLocalCase(); renderDetail(); }
  await addLog('map', `更新案件中心：${locationSourceLabel(source)}${confirmed?'，並鎖定':''}`);
  if(map){ map.setCenter({lat:Number(loc.lat),lng:Number(loc.lng)}); if((map.getZoom()||0)<17) map.setZoom(17); }
  renderLocationControl(); renderMap();
}
async function confirmIncidentLocation(){
  if(!currentCase) return;
  const meta=getLocationMeta();
  await setIncidentLocation({lat:currentCase.lat,lng:currentCase.lng,source:meta.source||'manual',formattedAddress:meta.formattedAddress||currentCase.address,placeId:meta.placeId||'',accuracy:meta.accuracy||null}, true);
  toast('案件中心已確認並鎖定；後續部署將以此中心為基準。', 3600);
}
async function unlockIncidentLocation(){
  if(!currentCase) return;
  const meta={...getLocationMeta(),locked:false,confirmed:false,updatedAt:Date.now(),updatedBy:profile?.callName||''};
  const patch={locationMeta:meta,updatedAt:Date.now()}; Object.assign(currentCase,patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase();
  await addLog('map','解除案件中心鎖定');
  renderLocationControl(); renderMap(); toast('已解除案件中心鎖定，可重新定位或拖曳修正。');
}

async function runMapDiagnostics(){
  const panel=$('mapDiagnosticsPanel');
  if(panel) panel.innerHTML='<div class="location-loading">正在檢查 Google Maps、Places、GPS 與網域設定…</div>';
  const rows=[];
  const add=(name,status,detail='')=>rows.push({name,status,detail});
  try{
    googleMapsConfig=null;
    const cfg=await fetchGoogleMapsConfig();
    add('Vercel maps-config',cfg?.enabled?'good':'danger',cfg?.enabled?`已讀取瀏覽器金鑰；版本 ${cfg.version||'未知'}`:'GOOGLE_MAPS_BROWSER_KEY 未設定或目前部署讀不到');
    add('目前網站來源',location.protocol==='https:'?'good':'danger',location.origin);
    if(cfg?.enabled){
      try{
        await loadGoogleMapsClient();
        add('Maps JavaScript API','good','Google 地圖核心已載入');
      }catch(err){ add('Maps JavaScript API','danger',err.message||String(err)); }
      if(window.google?.maps?.Geocoder){
        try{
          const geocoder=new google.maps.Geocoder();
          const query=normalizeGoogleAddress(currentCase?.address||'新北市政府消防局');
          const resp=await geocoder.geocode({address:query,region:'TW',componentRestrictions:{country:'TW'}});
          add('Geocoding API',resp?.results?.length?'good':'warning',resp?.results?.length?`找到 ${resp.results.length} 筆結果`:'沒有回傳地址結果');
        }catch(err){ add('Geocoding API','danger',err.message||String(err)); }
      }else add('Geocoding API','danger','Geocoder 未載入');
      try{
        const places=await google.maps.importLibrary?.('places');
        add('Places API（New）',places?.AutocompleteSuggestion?'good':'warning',places?.AutocompleteSuggestion?'AutocompleteSuggestion 可用':'Places 已載入，但 AutocompleteSuggestion 不可用');
      }catch(err){ add('Places API（New）','danger',err.message||String(err)); }
    }
    if(!navigator.geolocation) add('手機 GPS','danger','瀏覽器不支援 Geolocation');
    else if(navigator.permissions?.query){
      try{ const perm=await navigator.permissions.query({name:'geolocation'}); add('手機 GPS 權限',perm.state==='denied'?'danger':perm.state==='prompt'?'warning':'good',perm.state); }
      catch{ add('手機 GPS 權限','warning','此瀏覽器無法預先查詢，請直接點「使用目前 GPS」'); }
    }else add('手機 GPS 權限','warning','iOS Safari 通常需在實際定位時確認權限');
    add('地圖底圖',mapReady?'good':mapLoadError?'danger':'warning',mapReady?'Google Maps 已顯示':mapLoadError||'尚未開啟部署頁或地圖尚未初始化');
  }catch(err){ add('定位診斷','danger',err.message||String(err)); }
  const label={good:'正常',warning:'注意',danger:'失敗'};
  lastMapDiagnostics=[`FireCommand v24 定位診斷｜${new Date().toLocaleString('zh-TW',{hour12:false})}`,...rows.map(r=>`${r.name}：${label[r.status]}｜${r.detail}`)].join('\n');
  if(panel) panel.innerHTML=rows.map(r=>`<div class="diagnostic-row ${r.status}"><span>${escapeHtml(r.name)}</span><b>${label[r.status]}</b><div class="diagnostic-detail">${escapeHtml(r.detail)}</div></div>`).join('');
  return rows;
}
function copyMapDiagnostics(){
  if(!lastMapDiagnostics){ runMapDiagnostics().then(copyMapDiagnostics); return; }
  navigator.clipboard?.writeText(lastMapDiagnostics);
  toast('已複製定位診斷結果；內容不包含完整 API Key。');
}

async function initMap(force=false){
  if(map && !force){ refreshMapSize(); renderMap(); return; }
  try{
    await loadGoogleMapsClient(force);
    const el=$('map');
    if(!el) return;
    clearMapOverlays();
    map = new google.maps.Map(el, {
      center:{lat:Number(currentCase?.lat||DEFAULT_CENTER.lat),lng:Number(currentCase?.lng||DEFAULT_CENTER.lng)},
      zoom:17,
      mapTypeId:'roadmap',
      mapTypeControl:true,
      streetViewControl:false,
      fullscreenControl:true,
      clickableIcons:false,
      gestureHandling:'greedy',
      zoomControl:true
    });
    mapInfoWindow = new google.maps.InfoWindow();
    map.addListener('click', handleMapClick);
    mapReady=true;
    hideMapUnavailable();
    bindMapDropTarget();
    renderMap();
    renderDeploymentPalette();
  }catch(err){
    mapReady=false;
    map=null;
    showMapUnavailable(err.message||String(err));
  }
}
function refreshMapSize(){
  if(!map || !window.google?.maps) return;
  const center=map.getCenter();
  google.maps.event.trigger(map,'resize');
  if(center) map.setCenter(center);
}
function showMapUnavailable(message){
  mapLoadError=message||mapLoadError||'Google 地圖無法載入';
  const panel=$('mapUnavailablePanel'), msg=$('mapUnavailableMessage');
  if(panel) panel.hidden=false;
  if(msg) msg.textContent=mapLoadError;
}
function hideMapUnavailable(){ const panel=$('mapUnavailablePanel'); if(panel) panel.hidden=true; }
async function retryGoogleMap(){
  googleMapsConfig=null;
  map=null;
  await initMap(true);
  await runMapDiagnostics();
}
function clearMapOverlays(){
  mapOverlays.forEach(o=>{ try{o.setMap(null);}catch{} });
  mapOverlays=[];
  incidentCircle=null;
  buildingBoxCenterMarker=null;
  buildingBoxCornerMarker=null;
}
function addMapOverlay(o){ if(o) mapOverlays.push(o); return o; }
function escapeXml(s=''){ return String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])); }
function googleMarkerStyle(className='hazard'){
  if(className.includes('water')) return {bg:'#b5281d',fg:'#fff'};
  if(className.includes('ladder')) return {bg:'#7c4d00',fg:'#fff'};
  if(className.includes('ambulance')) return {bg:'#0b7a4b',fg:'#fff'};
  if(className.includes('rescue')) return {bg:'#345b9f',fg:'#fff'};
  if(className.includes('person') && className.includes('rest')) return {bg:'#18784f',fg:'#fff'};
  if(className.includes('person') && className.includes('rit')) return {bg:'#d8a645',fg:'#1d1a17'};
  if(className.includes('person')) return {bg:'#111827',fg:'#fff'};
  if(className.includes('hose')) return {bg:'#245fc6',fg:'#fff'};
  if(className.includes('building-center')) return {bg:'#1d1a17',fg:'#fff'};
  if(className.includes('building-handle')) return {bg:'#a43a30',fg:'#fff'};
  if(className.includes('face')) return {bg:'#fffdf8',fg:'#1d1a17'};
  return {bg:'#fffdf8',fg:'#111827'};
}
function googleMarkerIcon(text,className='hazard'){
  const style=googleMarkerStyle(className);
  const clean=String(text||'標示').slice(0,24);
  const width=Math.min(260,Math.max(70,clean.length*15+26));
  const height=40;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect x="1" y="1" width="${width-2}" height="32" rx="16" fill="${style.bg}" stroke="#ffffff" stroke-width="2"/><path d="M ${width/2-6} 32 L ${width/2} 39 L ${width/2+6} 32 Z" fill="${style.bg}"/><text x="${width/2}" y="22" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Noto Sans TC,sans-serif" font-size="13" font-weight="800" fill="${style.fg}">${escapeXml(clean)}</text></svg>`;
  return {url:`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,scaledSize:new google.maps.Size(width,height),anchor:new google.maps.Point(width/2,height)};
}
function makeGoogleMarker({position,text,className='hazard',draggable=false,title='',onDragEnd=null,onClick=null,zIndex=null}){
  const marker=addMapOverlay(new google.maps.Marker({map,position,draggable,title:title||text,icon:googleMarkerIcon(text,className),zIndex:zIndex||undefined,optimized:false}));
  if(onDragEnd) marker.addListener('dragend',ev=>onDragEnd({lat:ev.latLng.lat(),lng:ev.latLng.lng()},marker));
  if(onClick) marker.addListener('click',()=>onClick(marker));
  return marker;
}
function openMapInfo(anchor,html){
  if(!mapInfoWindow) mapInfoWindow=new google.maps.InfoWindow();
  mapInfoWindow.setContent(`<div class="google-info-card">${html}</div>`);
  mapInfoWindow.open({map,anchor,shouldFocus:false});
}
function renderMap(){
  if(!map || !currentCase || !window.google?.maps) return;
  clearMapOverlays();
  const lat=Number(currentCase.lat||DEFAULT_CENTER.lat), lng=Number(currentCase.lng||DEFAULT_CENTER.lng);
  const center={lat,lng};
  if((map.getZoom()||0)<15){ map.setCenter(center); map.setZoom(17); }
  incidentCircle=addMapOverlay(new google.maps.Circle({map,center,radius:200,strokeColor:'#b5281d',strokeWeight:2,fillColor:'#b5281d',fillOpacity:.05,clickable:false}));
  const locationMeta=getLocationMeta();
  const fallbackLocation=locationMeta.source==='fallback' || locationMeta.unverified===true;
  const warning=$('mapLocationWarning'); if(warning) warning.hidden=!fallbackLocation;
  if(fallbackLocation && !locationMeta.locked && (map.getZoom()||0)>14) map.setZoom(13);
  const incidentMarker=makeGoogleMarker({position:center,text:locationMeta.locked?'📍 案件中心｜已鎖定':fallbackLocation?'⚠ 備援中心｜非火場位置':'📍 案件中心｜待確認',className:'hazard',draggable:!locationMeta.locked,zIndex:1000,
    onDragEnd:async ll=>setIncidentLocation({lat:ll.lat,lng:ll.lng,source:'manual',formattedAddress:currentCase.address},false),
    onClick:marker=>openMapInfo(marker,`<b>案件中心</b><div class="meta">來源：${escapeHtml(locationSourceLabel(locationMeta.source||'legacy'))}<br>狀態：${escapeHtml(locationQualityLabel(locationMeta))}</div>`)});
  renderBuildingBoxOnMap();

  live.hoses.forEach(h=>{
    const pts=getHosePoints(h), from=pts.from, to=pts.to;
    if(!from||!to) return;
    const path=[{lat:Number(from[0]),lng:Number(from[1])},{lat:Number(to[0]),lng:Number(to[1])}];
    const poly=addMapOverlay(new google.maps.Polyline({map,path,strokeColor:'#245fc6',strokeWeight:6,strokeOpacity:.88,clickable:true,zIndex:20}));
    const info=`<b>${escapeHtml(h.vehicleName||'水線來源')} ${escapeHtml(h.port||'')}</b><div class="meta">歸屬：${escapeHtml(h.owner||h.unit||'')}<br>目的地：${escapeHtml(h.targetName||'地圖點')}<br>性質：${escapeHtml(h.kind||'水線')}<br>任務：${escapeHtml(h.task||'')}</div><div class="popup-actions"><button data-map-action="editHose" data-id="${h.id}">修改</button><button data-map-action="deleteHose" data-id="${h.id}">刪除</button></div>`;
    poly.addListener('click',ev=>{ mapInfoWindow.setPosition(ev.latLng); mapInfoWindow.setContent(`<div class="google-info-card">${info}</div>`); mapInfoWindow.open({map,shouldFocus:false}); });
    const mid={lat:(path[0].lat+path[1].lat)/2,lng:(path[0].lng+path[1].lng)/2};
    makeGoogleMarker({position:mid,text:`💧 ${h.owner||h.unit||'水線'}｜${h.kind||''}`,className:'hose-label',onClick:m=>openMapInfo(m,info),zIndex:40});
    if(h.targetType==='map' && h.lat && h.lng){
      makeGoogleMarker({position:{lat:Number(h.lat),lng:Number(h.lng)},text:'💧 水線終點',className:'hose-label',draggable:true,zIndex:45,
        onDragEnd:async ll=>{ await updateItem('hoses',h.id,{lat:ll.lat,lng:ll.lng,targetName:'地圖點 / 手動調整'}); await addLog('hose',`移動水線終點：${h.owner||h.unit||''}`); },
        onClick:m=>openMapInfo(m,info)});
    }
  });
  live.vehicles.forEach(v=>{
    const marker=makeGoogleMarker({position:{lat:Number(v.lat),lng:Number(v.lng)},text:`${vehEmoji(v.type)} ${v.name}`,className:`veh ${vehClass(v.type)}`,draggable:true,zIndex:100,
      onDragEnd:async ll=>{ await updateItem('vehicles',v.id,{lat:ll.lat,lng:ll.lng}); await addLog('vehicle',`${v.name} 部署位置更新`); },
      onClick:m=>{
        if(completeQuickHoseTarget('vehicle',v)) return;
        openMapInfo(m,`<b>${escapeHtml(v.name)}</b><div class="meta">${escapeHtml(v.unit)}｜${escapeHtml(v.type)}<br>任務：${escapeHtml(v.task)}<br>${v.canHose?'水線接口：1～4線':'不可接水線'}</div><div class="popup-actions">${v.canHose?`<button data-resource-action="quickHose" data-resource-id="${v.id}">拉水線</button>`:''}<button data-map-action="editVehicle" data-id="${v.id}">修改</button><button data-map-action="deleteVehicle" data-id="${v.id}">刪除</button></div>`);
      }});
  });
  live.crews.forEach(p=>{
    makeGoogleMarker({position:{lat:Number(p.lat),lng:Number(p.lng)},text:`👥 ${p.unit}${p.leader}｜${p.count}人`,className:`person ${personClass(p.status)}`,draggable:true,zIndex:110,
      onDragEnd:async ll=>handleCrewDragEnd(p,ll),
      onClick:m=>{
        if(completeQuickHoseTarget('crew',p)) return;
        openMapInfo(m,`<b>${escapeHtml(p.unit)}${escapeHtml(p.leader)}</b><div class="meta">${p.count}人｜${escapeHtml(p.status)}<br>${escapeHtml(p.task)}</div><div class="popup-actions"><button data-map-action="editCrew" data-id="${p.id}">修改</button><button data-map-action="restCrew" data-mode="原地休息" data-id="${p.id}">原地休息</button><button data-map-action="restCrew" data-mode="移至休息區" data-id="${p.id}">移至休息區</button><button data-map-action="deleteCrew" data-id="${p.id}">刪除</button></div>`);
      }});
  });
  live.hazards.forEach(h=>{
    makeGoogleMarker({position:{lat:Number(h.lat),lng:Number(h.lng)},text:`${hazEmoji(h.type)} ${h.type}`,className:'hazard',draggable:true,zIndex:120,
      onDragEnd:async ll=>{ await updateItem('hazards',h.id,{lat:ll.lat,lng:ll.lng}); await addLog('hazard',`${h.type} 標示位置更新`); },
      onClick:m=>openMapInfo(m,`<b>${escapeHtml(h.type)}</b><div class="popup-actions"><button data-map-action="editHazard" data-id="${h.id}">修改</button><button data-map-action="deleteHazard" data-id="${h.id}">刪除</button></div>`)});
  });
  renderDeploymentPalette();
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
async function editHoseLabel(h){ return editHoseFull(h.id); }
function fitMapToIncident(){
  if(!map||!currentCase) return;
  if(incidentCircle?.getBounds) map.fitBounds(incidentCircle.getBounds());
  else { map.setCenter({lat:Number(currentCase.lat),lng:Number(currentCase.lng)}); map.setZoom(17); }
}
async function handleMapClick(e){
  const ll=e?.latLng?{lat:e.latLng.lat(),lng:e.latLng.lng()}:e;
  if(!ll || !pendingTool) return;
  if(pendingTool.type==='hazard') await addHazardAt(pendingTool.hazardType,ll.lat,ll.lng);
  else if(pendingTool.type==='hose' || pendingTool.type==='hoseConnect') await addHoseAt(pendingTool,ll.lat,ll.lng);
  else if(pendingTool.type==='hoseReconnect'){ await updateItem('hoses',pendingTool.hoseId,{targetType:'map',targetId:null,targetName:'地圖點 / 手動指定',lat:ll.lat,lng:ll.lng}); await addLog('hose','重新指定水線終點至地圖位置'); }
  else if(pendingTool.type==='buildingBoxCenter') await saveBuildingBox({lat:ll.lat,lng:ll.lng},'設定建物中心框中心點');
  else if(pendingTool.type==='incidentCenter') await setIncidentLocation({lat:ll.lat,lng:ll.lng,source:'manual',formattedAddress:currentCase?.address||''},false);
  else if(pendingTool.type==='moveExisting'){
    const item=(live[pendingTool.coll]||[]).find(x=>x.id===pendingTool.id);
    if(item){ await updateItem(pendingTool.coll,pendingTool.id,{lat:ll.lat,lng:ll.lng}); await addLog('map',`部署位置更新：${item.name||item.unit||item.type||''}`); toast('已更新部署位置'); }
  }
  pendingTool=null; selectedMapResource=null; renderDeploymentPalette();
}
function bindMapDropTarget(){
  const el=$('map'); if(!el || el.dataset.dropBound==='1') return;
  el.dataset.dropBound='1';
  el.addEventListener('dragover',ev=>ev.preventDefault());
  el.addEventListener('drop',async ev=>{
    ev.preventDefault();
    try{
      const data=JSON.parse(ev.dataTransfer.getData('application/json')||'{}');
      if(!data.coll||!data.id) return;
      const ll=await latLngFromMapClientPoint(ev.clientX,ev.clientY);
      await updateItem(data.coll,data.id,{lat:ll.lat,lng:ll.lng});
      await addLog('map',`拖放部署：${data.label||data.id}`);
    }catch(err){ console.warn('map drop failed',err); }
  });
}
function latLngFromMapClientPoint(clientX,clientY){
  return new Promise((resolve,reject)=>{
    if(!map) return reject(new Error('地圖尚未載入'));
    const rect=$('map').getBoundingClientRect();
    class ProjectionOverlay extends google.maps.OverlayView{
      onAdd(){}
      draw(){
        try{
          const projection=this.getProjection();
          const ll=projection.fromContainerPixelToLatLng(new google.maps.Point(clientX-rect.left,clientY-rect.top));
          resolve({lat:ll.lat(),lng:ll.lng()});
        }catch(err){ reject(err); }
        this.setMap(null);
      }
      onRemove(){}
    }
    new ProjectionOverlay().setMap(map);
  });
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
async function deleteItem(coll, id, label='資料'){
  if(firebaseEnabled){ await db.collection('cases').doc(currentCaseId).collection(coll).doc(id).delete(); }
  else { const arr=live[coll]; const idx=arr.findIndex(x=>x.id===id); if(idx>=0) arr.splice(idx,1); saveLocalCase(); renderLiveParts(); }
  await addLog(coll, `刪除${label}`);
}

function openActionSheet(title,html){
  const sheet=$('appActionSheet'); if(!sheet) return;
  $('appActionTitle').textContent=title||'快速操作';
  $('appActionBody').innerHTML=html||'';
  sheet.hidden=false;
  document.body.classList.add('action-sheet-open');
}
function closeActionSheet(){
  const sheet=$('appActionSheet'); if(sheet) sheet.hidden=true;
  document.body.classList.remove('action-sheet-open');
}
function bindQuickFillButtons(container){
  container?.querySelectorAll('[data-fill-target][data-fill-value]').forEach(btn=>btn.addEventListener('click',()=>{
    const input=$(btn.dataset.fillTarget)||container.querySelector(`#${CSS.escape(btn.dataset.fillTarget)}`);
    if(input){ input.value=btn.dataset.fillValue; input.dispatchEvent(new Event('change',{bubbles:true})); }
  }));
}
async function editVehicle(id){
  const v=live.vehicles.find(x=>x.id===id); if(!v) return;
  openActionSheet(`車輛｜${v.name}`,`<div class="field"><label>任務</label><input id="sheetVehicleTask" value="${escapeHtml(v.task||'')}" /></div><div class="choice-row"><button class="action-option" data-fill-target="sheetVehicleTask" data-fill-value="第一線攻擊">第一線攻擊</button><button class="action-option" data-fill-target="sheetVehicleTask" data-fill-value="佔據水源">佔據水源</button><button class="action-option" data-fill-target="sheetVehicleTask" data-fill-value="待命">待命</button><button class="action-option" data-fill-target="sheetVehicleTask" data-fill-value="救護區">救護區</button></div><div class="button-row"><button id="saveVehicleSheetBtn" class="btn primary">儲存</button><button id="deleteVehicleSheetBtn" class="btn ghost">刪除車輛</button></div>`);
  bindQuickFillButtons($('appActionBody'));
  $('saveVehicleSheetBtn').onclick=async()=>{ const task=$('sheetVehicleTask').value.trim()||v.task||'部署'; await updateItem('vehicles',id,{task}); await addLog('vehicle',`修改車輛任務：${v.name} → ${task}`); closeActionSheet(); };
  $('deleteVehicleSheetBtn').onclick=()=>{ closeActionSheet(); deleteVehicle(id); };
}
async function deleteVehicle(id){
  const v=live.vehicles.find(x=>x.id===id); if(!v) return;
  const linked=live.hoses.filter(h=>h.vehicleId===id||h.targetId===id).length;
  if(!confirm(`確認刪除 ${v.name}？${linked?`\n注意：相關水線 ${linked} 條也會刪除。`:''}`)) return;
  for(const h of live.hoses.filter(h=>h.vehicleId===id||h.targetId===id)) await deleteItem('hoses',h.id,`相關水線 ${h.port||''}`);
  await deleteItem('vehicles',id,v.name);
}
async function editCrew(id){
  const p=live.crews.find(x=>x.id===id); if(!p) return;
  const statuses=['作業中','待命','休息','RIT','撤出'].map(x=>`<option ${p.status===x?'selected':''}>${x}</option>`).join('');
  openActionSheet(`人員｜${p.unit}${p.leader}`,`<div class="field"><label>任務</label><input id="sheetCrewTask" value="${escapeHtml(p.task||'')}" /></div><div class="choice-row"><button class="action-option" data-fill-target="sheetCrewTask" data-fill-value="第一面內攻">第一面內攻</button><button class="action-option" data-fill-target="sheetCrewTask" data-fill-value="人命搜救">人命搜救</button><button class="action-option" data-fill-target="sheetCrewTask" data-fill-value="RIT待命">RIT待命</button><button class="action-option" data-fill-target="sheetCrewTask" data-fill-value="佔據水源">佔據水源</button></div><div class="two-col"><div class="field"><label>狀態</label><select id="sheetCrewStatus">${statuses}</select></div><div class="field"><label>人數</label><input id="sheetCrewCount" type="number" min="1" value="${Number(p.count)||4}" /></div></div><div class="button-row"><button id="saveCrewSheetBtn" class="btn primary">儲存</button><button id="deleteCrewSheetBtn" class="btn ghost">刪除編組</button></div>`);
  bindQuickFillButtons($('appActionBody'));
  $('saveCrewSheetBtn').onclick=async()=>{ const patch={task:$('sheetCrewTask').value.trim()||p.task,status:$('sheetCrewStatus').value,count:Number($('sheetCrewCount').value)||p.count}; await updateItem('crews',id,patch); await addLog('crew',`修改人員：${p.unit}${p.leader}｜${patch.status}｜${patch.task}`); closeActionSheet(); };
  $('deleteCrewSheetBtn').onclick=()=>{ closeActionSheet(); deleteCrew(id); };
}
async function deleteCrew(id){
  const p=live.crews.find(x=>x.id===id); if(!p) return;
  const linked=live.hoses.filter(h=>h.targetType==='crew'&&h.targetId===id).length;
  if(!confirm(`確認刪除 ${p.unit}${p.leader}？${linked?`\n相關水線 ${linked} 條會保留在原部署位置。`:''}`)) return;
  for(const h of live.hoses.filter(h=>h.targetType==='crew'&&h.targetId===id)) await updateItem('hoses',h.id,{targetType:'map',targetId:null,lat:p.lat,lng:p.lng,targetName:`${p.unit}${p.leader} 原部署位置`});
  await deleteItem('crews',id,`${p.unit}${p.leader}`);
}
async function editHazard(id){
  const h=live.hazards.find(x=>x.id===id); if(!h) return;
  const types=['起火點','瓦斯','高壓電','危險物','指揮站','前進指揮所','休息區','救護區','警戒區'];
  openActionSheet(`標示｜${h.type}`,`<div class="field"><label>標示類型</label><select id="sheetHazardType">${types.map(x=>`<option ${x===h.type?'selected':''}>${x}</option>`).join('')}<option ${types.includes(h.type)?'':'selected'}>其他</option></select></div><div class="field"><label>自訂名稱（選其他時使用）</label><input id="sheetHazardCustom" value="${types.includes(h.type)?'':escapeHtml(h.type||'')}" /></div><div class="button-row"><button id="saveHazardSheetBtn" class="btn primary">儲存</button><button id="deleteHazardSheetBtn" class="btn ghost">刪除標示</button></div>`);
  $('saveHazardSheetBtn').onclick=async()=>{ const type=$('sheetHazardType').value==='其他'?($('sheetHazardCustom').value.trim()||'其他'):$('sheetHazardType').value; await updateItem('hazards',id,{type}); await addLog('hazard',`修改地圖標示：${h.type} → ${type}`); closeActionSheet(); };
  $('deleteHazardSheetBtn').onclick=()=>{ closeActionSheet(); deleteHazard(id); };
}
async function deleteHazard(id){
  const h=live.hazards.find(x=>x.id===id); if(!h) return;
  if(!confirm(`確認刪除標示「${h.type}」？`)) return;
  await deleteItem('hazards',id,h.type);
}
async function editHoseFull(id){
  const h=live.hoses.find(x=>x.id===id); if(!h) return;
  const kinds=['進攻水線','供水線','防護水線','搜救掩護水線','中繼水線'].map(x=>`<option ${h.kind===x?'selected':''}>${x}</option>`).join('');
  openActionSheet(`水線｜${h.vehicleName||''} ${h.port||''}`,`<div class="field"><label>水線歸屬</label><input id="sheetHoseOwner" value="${escapeHtml(h.owner||h.unit||'')}" /></div><div class="field"><label>水線性質</label><select id="sheetHoseKind">${kinds}</select></div><div class="field"><label>任務</label><input id="sheetHoseTask" value="${escapeHtml(h.task||'')}" /></div><div class="button-row"><button id="saveHoseSheetBtn" class="btn primary">儲存</button><button id="reconnectHoseSheetBtn" class="btn ghost">重新指定終點</button><button id="deleteHoseSheetBtn" class="btn ghost">刪除水線</button></div>`);
  $('saveHoseSheetBtn').onclick=async()=>{ const patch={owner:$('sheetHoseOwner').value.trim()||h.owner||h.unit,kind:$('sheetHoseKind').value,task:$('sheetHoseTask').value.trim()||h.task}; await updateItem('hoses',id,patch); await addLog('hose',`修改水線：${h.vehicleName||''}${h.port||''}`); closeActionSheet(); };
  $('reconnectHoseSheetBtn').onclick=()=>{ closeActionSheet(); pendingTool={type:'hoseReconnect',hoseId:h.id,vehicleId:h.vehicleId,vehicleName:h.vehicleName,unit:h.unit,owner:h.owner,port:h.port,task:h.task,kind:h.kind}; setDeploymentMode('hose'); toast('請點新的車輛、人員或地圖位置，重新指定水線終點。',4800); };
  $('deleteHoseSheetBtn').onclick=()=>{ closeActionSheet(); deleteHose(id); };
}
async function deleteHose(id){
  const h=live.hoses.find(x=>x.id===id); if(!h) return;
  if(!confirm(`確認刪除水線「${h.vehicleName||''} ${h.port||''}」？`)) return;
  await deleteItem('hoses',id,`${h.vehicleName||''}${h.port||''}`);
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
function hazEmoji(t=''){ return {起火點:'🔥',瓦斯:'🔥',高壓電:'⚡',危險物:'☣️',指揮站:'🎙️',前進指揮所:'🚩',休息區:'🟢'}[t] || '⚠️'; }


function getBuildingBox(){
  const lat = Number(currentCase?.buildingBox?.lat || currentCase?.lat || DEFAULT_CENTER.lat);
  const lng = Number(currentCase?.buildingBox?.lng || currentCase?.lng || DEFAULT_CENTER.lng);
  return Object.assign({lat,lng,widthM:40,heightM:28,locked:false,firstSide:'第一面'}, currentCase?.buildingBox || {});
}
function metersToLatDelta(m){ return Number(m) / 111320; }
function metersToLngDelta(m, lat){ return Number(m) / (111320 * Math.max(.2, Math.cos(Number(lat) * Math.PI/180))); }
function boxBounds(box){
  const h = metersToLatDelta((box.heightM||28)/2);
  const w = metersToLngDelta((box.widthM||40)/2, box.lat);
  return [[box.lat-h, box.lng-w], [box.lat+h, box.lng+w]];
}
function buildingBoxSidePoints(box){
  const b = boxBounds(box); const south=b[0][0], west=b[0][1], north=b[1][0], east=b[1][1];
  return [{name:'第一面',lat:box.lat,lng:west},{name:'第二面',lat:north,lng:box.lng},{name:'第三面',lat:box.lat,lng:east},{name:'第四面',lat:south,lng:box.lng}];
}
function renderBuildingBoxOnMap(){
  if(!map || !currentCase || !window.google?.maps) return;
  const box=getBuildingBox();
  const boundsArr=boxBounds(box);
  const bounds={south:boundsArr[0][0],west:boundsArr[0][1],north:boundsArr[1][0],east:boundsArr[1][1]};
  const rect=addMapOverlay(new google.maps.Rectangle({map,bounds,strokeColor:box.locked?'#1d1a17':'#a43a30',strokeWeight:2,strokeOpacity:1,fillColor:'#b5281d',fillOpacity:.04,clickable:true,editable:false,draggable:false}));
  rect.addListener('click',ev=>{
    mapInfoWindow.setPosition(ev.latLng);
    mapInfoWindow.setContent(`<div class="google-info-card"><b>建物中心框</b><div class="meta">${Math.round(box.widthM)}m × ${Math.round(box.heightM)}m<br>${box.locked?'已鎖定':'未鎖定，可調整'}<br>第一面：${escapeHtml(box.firstSide||'第一面')}</div></div>`);
    mapInfoWindow.open({map,shouldFocus:false});
  });
  buildingBoxSidePoints(box).forEach(pt=>{
    makeGoogleMarker({position:{lat:pt.lat,lng:pt.lng},text:pt.name,className:pt.name===(box.firstSide||'第一面')?'face active':'face',zIndex:80});
  });
  if(!box.locked){
    buildingBoxCenterMarker=makeGoogleMarker({position:{lat:box.lat,lng:box.lng},text:'▣ 建物中心',className:'building-center',draggable:true,zIndex:90,onDragEnd:ll=>saveBuildingBox({lat:ll.lat,lng:ll.lng},'拖曳更新建物中心框')});
    buildingBoxCornerMarker=makeGoogleMarker({position:{lat:bounds.north,lng:bounds.east},text:'↘ 拉大小',className:'building-handle',draggable:true,zIndex:91,onDragEnd:ll=>{
      const widthM=Math.max(8,Math.abs(ll.lng-box.lng)*2*111320*Math.max(.2,Math.cos(box.lat*Math.PI/180)));
      const heightM=Math.max(8,Math.abs(ll.lat-box.lat)*2*111320);
      saveBuildingBox({widthM:Math.round(widthM),heightM:Math.round(heightM)},'拖曳調整建物中心框大小');
    }});
  }
}
function syncBuildingBoxForm(){
  const box = getBuildingBox();
  if($('boxWidthM')) $('boxWidthM').value = Math.round(box.widthM || 40);
  if($('boxHeightM')) $('boxHeightM').value = Math.round(box.heightM || 28);
  if($('boxFirstSide')) $('boxFirstSide').value = box.firstSide || '第一面';
  if($('buildingBoxStatus')) $('buildingBoxStatus').textContent = box.locked ? '已鎖定，案件中心框不會變動' : '未鎖定，可點地圖或拖曳調整';
}
async function saveBuildingBox(patch={}, message='更新建物中心框'){
  if(!currentCase) return;
  const next = Object.assign(getBuildingBox(), patch, {updatedAt:Date.now()});
  currentCase.buildingBox = next;
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set({buildingBox:next, updatedAt:Date.now()},{merge:true});
  else saveLocalCase();
  syncBuildingBoxForm(); renderMap(); renderCommandGuide();
  await addLog('map', message);
}
function saveBuildingBoxFromForm(){
  const widthM = Number($('boxWidthM')?.value)||40;
  const heightM = Number($('boxHeightM')?.value)||28;
  const firstSide = $('boxFirstSide')?.value || '第一面';
  saveBuildingBox({widthM, heightM, firstSide}, `更新建物中心框：${Math.round(widthM)}m × ${Math.round(heightM)}m，${firstSide}為第一面`);
}
function setBuildingBoxLock(locked){ saveBuildingBox({locked}, locked?'鎖定建物中心框':'解鎖建物中心框'); }
function distanceMeters(a,b){
  const R=6371000, p1=a.lat*Math.PI/180, p2=b.lat*Math.PI/180, dp=(b.lat-a.lat)*Math.PI/180, dl=(b.lng-a.lng)*Math.PI/180;
  const x=Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
async function handleCrewDragEnd(p, ll){
  const nearest = live.crews.filter(x=>x.id!==p.id && x.status==='作業中').map(x=>({item:x, d:distanceMeters({lat:ll.lat,lng:ll.lng},{lat:Number(x.lat),lng:Number(x.lng)})})).sort((a,b)=>a.d-b.d)[0];
  if(nearest && nearest.d < 18){
    const target = nearest.item;
    if(confirm(`是否由 ${p.unit}${p.leader} 接替 ${target.unit}${target.leader} 執行「${target.task||'作業任務'}」？`)){
      const oldTask = target.task || '作業任務';
      for(const h of live.hoses.filter(h=>h.targetType==='crew' && h.targetId===target.id)){
        await updateItem('hoses', h.id, {targetId:p.id, targetName:`${p.unit}${p.leader||''}｜${p.count||0}人`, owner:h.owner || `${p.unit}${p.leader||''}`});
      }
      await updateItem('crews', p.id, {lat:target.lat,lng:target.lng,status:'作業中',task:oldTask,startAt:Date.now(),dispatchCount:(p.dispatchCount||0)+1});
      await updateItem('crews', target.id, {lat:ll.lat,lng:ll.lng,status:'休息',task:'輪替休息',endAt:Date.now()});
      await addLog('crew', `${p.unit}${p.leader} 接替 ${target.unit}${target.leader} 執行「${oldTask}」，相關水線改由接替單位承接，${target.unit}${target.leader} 改為休息`);
      toast('已完成任務輪替');
      return;
    }
  }
  await updateItem('crews', p.id, {lat:ll.lat,lng:ll.lng});
  await addLog('crew', `${p.unit}${p.leader} 人員位置更新`);
}

function toDatetimeLocalValue(ts=Date.now()){
  const d = ts?.toDate ? ts.toDate() : new Date(ts || Date.now());
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function datetimeLocalToMs(value){
  if(!value) return Date.now();
  const d = new Date(value);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
}
function setSitrepNow(){ if($('sitrepEventAt')) $('sitrepEventAt').value = toDatetimeLocalValue(Date.now()); }
async function addSitrep(){
  if(!currentCase) return;
  const title = $('sitrepTitle')?.value.trim() || '';
  const detail = $('sitrepDetail')?.value.trim() || '';
  if(!title && !detail){ toast('請輸入戰情標題或內容'); return; }
  const eventAt = datetimeLocalToMs($('sitrepEventAt')?.value);
  const submittedAt = Date.now();
  const data = {
    brigade: $('sitrepBrigade')?.value || profile?.brigade || '',
    unit: $('sitrepUnit')?.value || profile?.unit || '',
    category: $('sitrepCategory')?.value || '火勢回報',
    title,
    detail,
    eventAt,
    submittedAt,
    createdAt: submittedAt,
    operator: profile?.callName || '',
    operatorId: profile?.id || '',
    isBackfill: Math.abs(submittedAt - eventAt) > 60000
  };
  await addItem('sitreps', data);
  await addLog('sitrep', `新增戰情回報：${data.unit}｜${data.category}｜${data.title || data.detail.slice(0,30)}`);
  $('sitrepTitle').value = '';
  $('sitrepDetail').value = '';
  setSitrepNow();
  toast('戰情回報已新增');
}

async function addPatientSitrep(){
  if(!currentCase) return;
  const name = $('patientName')?.value.trim() || '姓名未明';
  const gender = $('patientGender')?.value || '未知';
  const foundAt = $('patientFoundAt')?.value.trim() || '地點未明';
  const status = $('patientStatus')?.value || '待救援';
  const note = $('patientNote')?.value.trim() || '';
  const eventAt = datetimeLocalToMs($('sitrepEventAt')?.value) || Date.now();
  const data = {
    brigade: $('sitrepBrigade')?.value || profile?.brigade || '', unit: $('sitrepUnit')?.value || profile?.unit || '',
    category:'傷/患者狀況回報', title:`${status}｜${name}｜${foundAt}`,
    detail:`姓名：${name}；性別：${gender}；尋獲地點：${foundAt}；狀況：${status}${note?`；處置/補充：${note}`:''}`,
    patient:{name,gender,foundAt,status,note}, eventAt, submittedAt:Date.now(), isBackfill:Math.abs(Date.now()-eventAt)>60000,
    operator:profile?.callName||profile?.realName||'', operatorId:profile?.id||''
  };
  await addItem('sitreps', data);
  await addLog('sitrep', `新增傷/患者回報：${data.unit}｜${data.title}`);
  ['patientName','patientFoundAt','patientNote'].forEach(id=>$(id)&&($(id).value=''));
  if($('patientGender')) $('patientGender').value='未知';
  if($('patientStatus')) $('patientStatus').value='待救援';
  setSitrepNow(); toast('已送出傷/患者回報');
}

function renderSitreps(){
  const wrap = $('sitrepList');
  if(!wrap) return;
  const arr = live.sitreps.slice().sort((a,b)=>(b.eventAt||0)-(a.eventAt||0));
  wrap.innerHTML = arr.length ? arr.map(r => `<div class="sitrep-card">
    <div class="sitrep-meta">事件：${fmtTime(r.eventAt)}｜上傳：${fmtTime(r.submittedAt||r.createdAt)}｜${escapeHtml(r.unit||'')}｜${escapeHtml(r.operator||'')}</div>
    <div class="sitrep-title">${escapeHtml(r.category||'戰情')}｜${escapeHtml(r.title||'未命名戰情')}</div>
    <div class="sitrep-detail">${escapeHtml(r.detail||'')}</div>
    ${r.isBackfill?'<span class="tag amber">補述</span>':''}
  </div>`).join('') : '<div class="empty">尚無戰情回報。各單位可在此回報火勢、人車移動、部署、搜救、支援等進度。</div>';
}

function caseIsClosed(){ return currentCase?.status === 'closed' || currentCase?.closedAt; }
function updateAssessmentAvailability(){
  const btn=$('aiAssessmentBtn'); const draft=$('assessmentDraft');
  if(!btn) return;
  const closed=caseIsClosed(); btn.disabled = !closed;
  btn.textContent = closed ? '產生 AI 檢討評估' : '結案後才能產生 AI 檢討評估';
  if(draft && !closed) draft.placeholder = '本功能為結案後才能使用，避免火場進行中誤觸消耗 token。';
}
async function closeCase(){ if(!currentCase) return; if(!confirm('確認將本案標記為結案？結案後可產生 AI 檢討評估報告。')) return; const patch={status:'closed',closedAt:Date.now(),updatedAt:Date.now()}; Object.assign(currentCase,patch); if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase(); await addLog('case','案件標記結案'); updateAssessmentAvailability(); toast('已標記結案'); }
async function reopenCase(){ if(!currentCase) return; const patch={status:'active',closedAt:null,updatedAt:Date.now()}; Object.assign(currentCase,patch); if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase(); await addLog('case','案件重新開啟'); updateAssessmentAvailability(); toast('已重新開啟案件'); }
async function generateAssessmentReport(){
  const text = assessmentLocalText();
  if($('assessmentDraft')) $('assessmentDraft').value = text;
  const patch = { assessmentText: text, updatedAt:Date.now() };
  Object.assign(currentCase, patch);
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase();
  await addLog('assessment','產生本機檢討及評估優化報告');
  generateReport(false);
  toast('已產生檢討及評估優化報告');
}
async function requestAiAssessment(){
  if(!currentCase) return;
  if(!caseIsClosed()){ toast('本功能為結案後才能使用'); updateAssessmentAvailability(); return; }
  $('aiAdviceStatus') && ($('aiAdviceStatus').textContent = '正在呼叫 AI 產生檢討評估，請稍候…');
  try{
    const payload = { mode:'assessment', caseData: currentCase, vehicles: live.vehicles, crews: live.crews, hoses: live.hoses, hazards: live.hazards, sitreps: live.sitreps, logs: live.logs, buildingOps: getBuildingOps(), localRules: localTacticalAdviceText(), assessmentDraft: assessmentLocalText() };
    const res = await fetch('/api/ai-advice', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'AI 檢討評估呼叫失敗');
    const text = data.advice || '';
    $('assessmentDraft') && ($('assessmentDraft').value = text);
    $('aiAdviceStatus') && ($('aiAdviceStatus').textContent = `AI 檢討評估已更新：${fmtTime(Date.now())}${data.modelUsed ? '｜模型：' + data.modelUsed : ''}`);
    const patch = { assessmentText: text, assessmentAt: Date.now(), updatedAt:Date.now() };
    Object.assign(currentCase, patch);
    if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase();
    await addLog('assessment','產生 OpenAI 檢討及評估優化報告');
    generateReport(false);
  }catch(err){
    $('aiAdviceStatus') && ($('aiAdviceStatus').textContent = `AI 檢討評估失敗：${err.message}`);
    await generateAssessmentReport();
  }
}

function renderDashboard(){
  const vehicleTypes = countBy(live.vehicles,'type'); const crewStatus = countBy(live.crews,'status');
  $('statusCards').innerHTML = `
    <button type="button" class="mini-card stat-action" data-jump-panel="vehicle"><div class="metric">${live.vehicles.length}</div><div class="metric-label">車輛</div><div class="subline">${entriesText(vehicleTypes) || '尚無'}｜點選展開</div></button>
    <button type="button" class="mini-card stat-action" data-jump-panel="crew"><div class="metric">${sum(live.crews,'count')}</div><div class="metric-label">人員</div><div class="subline">${entriesText(crewStatus) || '尚無'}｜點選展開</div></button>
    <button type="button" class="mini-card stat-action" data-jump-panel="hose"><div class="metric">${live.hoses.length}</div><div class="metric-label">水線</div><div class="subline">進攻 / 供水 / 防護｜點選部署圖</div></button>
    <button type="button" class="mini-card stat-action" data-jump-panel="hazard"><div class="metric">${live.hazards.length}</div><div class="metric-label">標示</div><div class="subline">火點、危害、指揮站｜點選部署圖</div></button>`;
  $('crewCards').innerHTML = live.crews.length ? live.crews.map(p=>`<div class="mini-card wide"><span class="tag ${p.status==='RIT'?'amber':(p.status==='休息'||p.status==='待命')?'green':'red'}">${escapeHtml(p.status)}</span><h3>${escapeHtml(p.unit)}${escapeHtml(p.leader)}</h3><div class="metric">${p.count}</div><div class="metric-label">人員</div><div class="subline">任務：${escapeHtml(p.task)}<br>派遣：${p.dispatchCount||0}次｜作業：${Math.max(0,Math.round((Date.now()-(p.startAt||Date.now()))/60000))}分</div><div class="button-row compact-actions"><button class="btn small ghost" data-rest-crew="${p.id}" data-rest-mode="原地休息">原地休息</button><button class="btn small ghost" data-rest-crew="${p.id}" data-rest-mode="移至休息區">移至休息區</button><button class="btn small ghost" data-delete-crew="${p.id}">刪除</button></div></div>`).join('') : '<div class="empty">尚無人員資料。</div>';
  $('vehicleCards').innerHTML = live.vehicles.length ? live.vehicles.map(v=>`<div class="mini-card wide"><span class="tag blue">${escapeHtml(v.type)}</span><h3>${escapeHtml(v.name)}</h3><div class="metric-label">${escapeHtml(v.unit)}</div><div class="subline">任務：${escapeHtml(v.task)}<br>水線：${live.hoses.filter(h=>h.vehicleId===v.id).length}/${v.canHose?4:0}</div><button class="btn small ghost full" data-delete-vehicle="${v.id}">刪除車輛</button></div>`).join('') : '<div class="empty">尚無車輛資料。</div>';
  document.querySelectorAll('[data-jump-panel]').forEach(btn=>btn.onclick=()=>jumpFromStatus(btn.dataset.jumpPanel));
  document.querySelectorAll('[data-delete-crew]').forEach(btn=>btn.onclick=()=>{ const p=live.crews.find(x=>x.id===btn.dataset.deleteCrew); if(p && confirm(`確認刪除 ${p.unit}${p.leader}？`)) deleteItem('crews', p.id, `${p.unit}${p.leader}`); });
  document.querySelectorAll('[data-rest-crew]').forEach(btn=>btn.onclick=()=>setCrewRest(btn.dataset.restCrew, btn.dataset.restMode));
  document.querySelectorAll('[data-delete-vehicle]').forEach(btn=>btn.onclick=()=>{ const v=live.vehicles.find(x=>x.id===btn.dataset.deleteVehicle); if(v && confirm(`確認刪除 ${v.name}？`)) deleteItem('vehicles', v.id, v.name); });
}


async function setCrewRest(crewId, mode){
  const p = live.crews.find(x=>x.id===crewId); if(!p) return;
  if(!confirm(`確認將 ${p.unit}${p.leader} 設定為「${mode}」？`)) return;
  const original = {lat:p.lat, lng:p.lng};
  for(const h of live.hoses.filter(h=>h.targetType==='crew' && h.targetId===crewId)){
    await updateItem('hoses', h.id, {targetType:'map', targetId:null, lat:original.lat, lng:original.lng, targetName:`${p.unit}${p.leader} 原作業位置`, status:'留置'});
  }
  const patch = { status:'休息', task:mode, endAt:Date.now() };
  if(mode === '移至休息區'){
    const rest = live.hazards.find(h=>h.type==='休息區');
    if(rest){ patch.lat = rest.lat; patch.lng = rest.lng; }
    else toast('尚未標示休息區，先改為休息狀態並保留原位置');
  }
  await updateItem('crews', crewId, patch);
  await addLog('crew', `${p.unit}${p.leader} 設定為${mode}；原本連接該組人員之水線已留置於原部署位置`);
  toast('已更新人員休息狀態');
}
function jumpFromStatus(kind){
  if(kind==='vehicle' || kind==='crew'){
    switchCasePage('dashboardSection');
    const target = kind==='vehicle' ? $('vehicleCards') : $('crewCards');
    const acc = target?.closest('details'); if(acc) acc.open = true;
  } else {
    switchCasePage('tacticalMapSection');
    const acc = document.querySelector('#tacticalMapSection details.tool-accordion'); if(acc) acc.open = true;
    setTimeout(refreshMapSize,250);
  }
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
  const ruleEl = $('ruleAlerts'); if(ruleEl) ruleEl.innerHTML = (a.length?a:[['green','目前沒有重大未完成提示。']]).map(([cls,msg])=>`<div class="tag ${cls}">${escapeHtml(msg)}</div>`).join('');
  const aiEl = $('aiAdviceText'); if(aiEl && !currentCase?.aiLastAdvice) aiEl.value = localTacticalAdviceText();
}
function renderLogs(){ const el=$('logList'); if(!el) return; el.innerHTML = live.logs.length ? live.logs.slice().reverse().map(l=>`<div class="log"><div class="log-time">${fmtTime(l.createdAt)}｜${escapeHtml(l.type)}｜${escapeHtml(l.operator||'')}</div><div>${escapeHtml(l.message)}</div></div>`).join('') : '<div class="empty">尚無時間軸紀錄。</div>'; }
async function addLog(type, message){ if(firebaseEnabled) await addLogRemote(currentCaseId,type,message); else { live.logs.push({id:uid('log'),type,message,createdAt:Date.now(),operator:profile.callName}); saveLocalCase(); renderLogs(); } }
async function addLogRemote(caseId,type,message){ await db.collection('cases').doc(caseId).collection('logs').add({type,message,createdAt:Date.now(),operator:profile.callName,operatorId:profile.id}); }
function renderPhotos(){}
function formatDurationMinutes(mins){
  const m = Math.max(0, Math.round(Number(mins)||0));
  if(m < 60) return `${m}分`;
  return `${Math.floor(m/60)}小時${m%60}分`;
}
function crewWorkMinutes(p){ return Math.max(0, Math.round((Date.now() - (p.startAt || Date.now())) / 60000)); }
function deploymentStatsLines(){
  const vehicleTypes = countBy(live.vehicles,'type');
  const crewStatus = countBy(live.crews,'status');
  const hoseKinds = countBy(live.hoses,'kind');
  const unitPeople = live.crews.reduce((m,p)=>{ const k=p.unit||'未登錄'; m[k]=(m[k]||0)+(Number(p.count)||0); return m; },{});
  const workRows = live.crews.map(p=>`- ${p.unit}${p.leader}｜${p.count}人｜${p.status}｜${p.task||'未登錄'}｜作業 ${formatDurationMinutes(crewWorkMinutes(p))}`).join('\n') || '- 尚無人員作業資料';
  return [
    `車輛類型：${entriesText(vehicleTypes) || '尚無'}`,
    `人員狀態：${entriesText(crewStatus) || '尚無'}`,
    `單位人數：${entriesText(unitPeople) || '尚無'}`,
    `水線性質：${entriesText(hoseKinds) || '尚無'}`,
    `危害標示：${live.hazards.map(h=>h.type).join('、') || '尚無'}`,
    `人員作業時間：`,
    workRows
  ];
}
function sitrepLines(limit=null){
  const arr = live.sitreps.slice().sort((a,b)=>(a.eventAt||0)-(b.eventAt||0));
  const selected = limit ? arr.slice(-limit) : arr;
  return selected.length ? selected.map(r => `- 事件 ${fmtTime(r.eventAt)}｜回報 ${fmtTime(r.submittedAt||r.createdAt)}｜${r.unit||''}｜${r.category||'戰情'}｜${r.title||''}${r.detail?`：${r.detail}`:''}`).join('\n') : '- 尚無各單位戰情回報。';
}
function timelineLines(limit=null){
  const merged = [];
  live.logs.forEach(l => merged.push({kind:'操作', time:l.createdAt||Date.now(), submitted:l.createdAt||Date.now(), unit:l.operator||'', text:`${l.type||''}｜${l.message||''}`}));
  live.sitreps.forEach(r => merged.push({kind:'戰情', time:r.eventAt||r.submittedAt||r.createdAt||Date.now(), submitted:r.submittedAt||r.createdAt||Date.now(), unit:r.unit||'', text:`${r.category||'戰情'}｜${r.title||''}${r.detail?`：${r.detail}`:''}`}));
  merged.sort((a,b)=>(a.time||0)-(b.time||0) || (a.submitted||0)-(b.submitted||0));
  const selected = limit ? merged.slice(-limit) : merged;
  return selected.length ? selected.map(x => `- ${fmtTime(x.time)}｜${x.kind}｜${x.unit}｜${x.text}${x.submitted && Math.abs(x.submitted-x.time)>60000?`（補述上傳：${fmtTime(x.submitted)}）`:''}`).join('\n') : '- 尚無時間序列資料。';
}
function assessmentLocalText(){
  const risk = [];
  if(currentCase?.trapped==='有' || Number(currentCase?.trappedCount)>0) risk.push('有人員受困，應檢討搜救啟動時間、RIT 律定時間、救護區與水線掩護是否同步。');
  if(/黑煙|大量明火|延燒/.test(currentCase?.fireStatus||'')) risk.push('火煙強烈，應檢討通風排煙、水線優先序、撤退路線與氣量管制。');
  if(!currentCase?.ritSet) risk.push('RIT 未明確律定，應列入安全管制改善事項。');
  if(!live.hoses.length) risk.push('尚無水線紀錄，建議要求各水線建立時必填來源車輛、歸屬單位、性質與任務。');
  if(!live.sitreps.length) risk.push('尚無戰情回報，建議要求各單位每一重要變化即時回報，補述須標記事件時間。');
  return [
    '【FireCommand 檢討及評估優化報告】',
    `案件：${currentCase?.caseNo || ''}｜${currentCase?.address || ''}`,
    '',
    '一、資料完整性評估',
    `- 戰情回報：${live.sitreps.length} 筆；操作紀錄：${live.logs.length} 筆；車輛：${live.vehicles.length} 台；人員：${sum(live.crews,'count')} 人；水線：${live.hoses.length} 條。`,
    '- 建議檢查每一筆水線是否均有來源、歸屬、任務、目的地；每一組人員是否均有狀態、任務、作業起始時間。',
    '',
    '二、搶救部署與人車運用',
    ...deploymentStatsLines().map(x=>`- ${x}`),
    '',
    '三、主要風險與改善建議',
    ...(risk.length ? risk.map(x=>`- ${x}`) : ['- 目前未偵測到重大缺漏，但仍應依現場實際狀況檢討水源、進攻路線、搜救進度與安全管制。']),
    '',
    '四、時間序列摘要',
    timelineLines(15),
    '',
    '五、後續優化方向',
    '- 強化各單位戰情回報習慣，區分「事件時間」與「上傳時間」。',
    '- 報告產出時同步納入人員作業時間、任務輪替、車輛水線配置與火勢變化。',
    '- 後續可將歷史案件整理成案例庫，供 AI 檢索與檢討建議使用。'
  ].join('\n');
}
function keyOperationalSummaryLines(){
  const c=currentCase || {};
  const lines=[];
  const buildingParts=[];
  if(c.type) buildingParts.push(`案件類型為${c.type}`);
  if(c.purpose) buildingParts.push(`現場為${c.purpose}用途建物`);
  if(c.floors) buildingParts.push(`地上${c.floors}樓`);
  if(c.fireFloor) buildingParts.push(`起火樓層為${floorText(c.fireFloor)}`);
  lines.push(`本案地址為${c.address||'未登錄'}${buildingParts.length?`，${buildingParts.join('，')}`:''}。`);
  const situation=[];
  if(c.fireStatus) situation.push(`目前火煙狀況為${c.fireStatus.replace(/[。；]+$/,'')}`);
  if(c.trapped==='無') situation.push('已確認無人受困');
  else if(c.trapped==='有') situation.push(`已確認有${Number(c.trappedCount)||0}人受困`);
  if(situation.length) lines.push(`${situation.join('；')}。`);
  const arrival=[];
  if(c.arrived) arrival.push('已到達現場');
  if(c.commandTransfer) arrival.push('已完成指揮權轉移');
  if(c.firstSideSet) arrival.push(c.firstSideMode==='custom'?`已律定${c.firstSideCustom||'指定位置'}為火場第一面`:'已以建物正面為火場第一面');
  if(arrival.length) lines.push(`到場處置方面，${arrival.join('，')}。`);
  const firstSitrep=live.sitreps.slice().sort((a,b)=>(a.eventAt||0)-(b.eventAt||0))[0];
  const latestSitrep=live.sitreps.slice().sort((a,b)=>(b.eventAt||0)-(a.eventAt||0))[0];
  if(firstSitrep) lines.push(`初期戰情於${fmtTime(firstSitrep.eventAt)}由${firstSitrep.unit||'現場單位'}回報：${firstSitrep.title||firstSitrep.category||'戰情資料'}。`);
  if(latestSitrep && latestSitrep!==firstSitrep) lines.push(`最新戰情於${fmtTime(latestSitrep.eventAt)}由${latestSitrep.unit||'現場單位'}回報：${latestSitrep.title||latestSitrep.category||'戰情資料'}。`);
  return lines;
}
function sitrepSummaryLines(){
  if(!live.sitreps.length) return ['尚無各單位戰情回報。'];
  const byCat = countBy(live.sitreps,'category');
  const byUnit = countBy(live.sitreps,'unit');
  const latest = live.sitreps.slice().sort((a,b)=>(b.eventAt||0)-(a.eventAt||0)).slice(0,8);
  return [
    `戰情回報共 ${live.sitreps.length} 筆；類型統計：${entriesText(byCat) || '尚無'}。`,
    `回報單位統計：${entriesText(byUnit) || '尚無'}。`,
    '近期關鍵戰情：',
    ...latest.map(r=>`- ${fmtTime(r.eventAt)}｜${r.unit||''}｜${r.category||'戰情'}｜${r.title||''}${r.detail?`：${r.detail.slice(0,120)}`:''}${r.submittedAt && Math.abs((r.submittedAt||0)-(r.eventAt||0))>60000?`（補述上傳：${fmtTime(r.submittedAt)}）`:''}`)
  ];
}
function formalAdviceLines(){
  const source=String(currentCase?.aiLastAdvice || localTacticalAdviceText()).split('\n').map(x=>x.trim()).filter(Boolean).slice(0,18);
  const out=[];
  source.forEach(line=>{
    const m=line.match(/^【([^】]+)】\s*(.*)$/);
    if(m){ out.push(`（${m[1]}）`); if(m[2]) out.push(m[2].replace(/^[-*#\s]+/,'')); }
    else out.push(line.replace(/^[-*#\s]+/,''));
  });
  return out.length?out:['目前尚無新增注意事項；仍應依現場實況持續檢核人命搜救、水源水線、RIT、PAR及撤退路線。'];
}
function reportDraftBase(){
  const c=currentCase || {};
  const crews=sum(live.crews,'count');
  const deploymentLines=deploymentStatsLines();
  const sitrepLines=sitrepSummaryLines();
  return sanitizeReportText([
    `【FireCommand 火場進度報告】`,
    `案件編號：${c.caseNo || ''}`,
    `地址：${c.address || ''}`,
    `產出者：${profile?.realName || profile?.callName || ''}｜${profile?.brigade || ''}/${profile?.unit || ''}`,
    `產出時間：${fmtTime(Date.now())}`,
    `保密註記：本報告含勤務資訊，僅供勤務指揮、內部彙整與交接使用，禁止外流。`,
    '',
    '一、火場概要與目前發展',
    ...keyOperationalSummaryLines(),
    '',
    '二、目前部署與戰力概況',
    '（一）戰力統計',
    `現場目前登錄車輛${live.vehicles.length}台、人員${crews}人、水線${live.hoses.length}條及危害或區域標示${live.hazards.length}處。`,
    ...(deploymentLines.length?['（二）任務與部署概況',...deploymentLines]:[]),
    '',
    '三、各單位戰情及傷患者回報彙整',
    ...sitrepLines,
    '',
    '四、建物內部作戰圖與戰術部署摘要',
    ...buildingReportLines(),
    '',
    '五、目前注意事項與建議',
    ...formalAdviceLines()
  ].join('\n'));
}
function sanitizeReportText(text){
  const lines = String(text||'').split('\n');
  const out=[];
  let dropping=false;
  for(const raw of lines){
    const line = String(raw||'');
    if(/^六、/.test(line.trim())){ dropping=true; continue; }
    if(dropping){
      if(/^[一二三四五七八九十]+、/.test(line.trim())) dropping=false; else continue;
    }
    if(/^(四、時間序列摘要|五、後續優化方向)/.test(line.trim())) continue;
    out.push(line);
  }
  return out.join('\n')
    .replace(/\*\*/g,'')
    .replace(/^#{1,6}\s*/gm,'')
    .replace(/^\*\s+/gm,'- ')
    .replace(/\n{3,}/g,'\n\n').trim();
}
function generateReport(scroll=false){
  if(!currentCase) return '';
  const summary = sanitizeReportText(reportDraftBase());
  $('reportDraft').value = summary;
  $('reportDraft').readOnly = true;
  renderReportPreview(summary);
  if(scroll) $('reportDraft').scrollIntoView({behavior:'smooth',block:'center'});
  return summary;
}
async function generateAIReport(scroll=false){
  if(!currentCase) return '';
  const local = reportDraftBase();
  $('reportDraft').value = 'OpenAI 正在彙整並潤稿進度報告，請稍候...\n\n' + local;
  renderReportPreview($('reportDraft').value);
  try{
    const payload = { mode:'report', caseData: currentCase, vehicles: live.vehicles, crews: live.crews, hoses: live.hoses, hazards: live.hazards, sitreps: live.sitreps, buildingOps: getBuildingOps(), localRules: localTacticalAdviceText(), baseReport: local, reportInstruction:'請產出正式給長官檢閱的火場進度報告；僅保留一、火場概要與目前發展 二、目前部署與戰力概況 三、各單位戰情及傷患者回報彙整 四、建物內部作戰圖與戰術部署摘要 五、目前注意事項與建議。請使用正式標題、次標題與完整段落；必要時才使用一般條列。不得使用 Markdown 星號、井字號或粗體符號，不得把每一句包成獨立方框。第四節不得逐項列出入口、隔間、水線等繪圖工具紀錄，僅做整體說明，詳細位置由附圖呈現。不得列出操作歷程、時間軸清單、檢討與後續評估章節。' };
    const res = await fetch('/api/ai-advice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'AI 報告產生失敗');
    $('reportDraft').value = sanitizeReportText(data.advice || local);
    $('reportDraft').readOnly = true;
    renderReportPreview($('reportDraft').value);
    await saveReportDraft($('reportDraft').value, `OpenAI 產生進度報告（${data.modelUsed||'model'}）`);
    toast('AI 已完成進度報告撰寫');
  }catch(err){
    $('reportDraft').value = sanitizeReportText(local + `\n\n【AI 報告產生失敗，已改用本機彙整】\n${err.message}`);
    renderReportPreview($('reportDraft').value);
    await addLog('report', `AI 進度報告失敗：${err.message}`);
    toast('AI 產生失敗，已改用本機報告');
  }
  if(scroll) $('reportDraft').scrollIntoView({behavior:'smooth',block:'center'});
  return $('reportDraft').value;
}
function enableReportEdit(){ if(!$('reportDraft').value) generateReport(false); $('reportDraft').readOnly=false; $('reportDraft').focus(); toast('已開啟報告編輯模式'); }
async function confirmReportEdit(){ const text=sanitizeReportText($('reportDraft').value || generateReport(false)); $('reportDraft').value=text; $('reportDraft').readOnly=true; renderReportPreview(text); await saveReportDraft(text,'確認編輯進度報告'); toast('已確認報告內容並寫入紀錄'); }
async function saveReportDraft(text, message){
  if(!currentCase) return;
  currentCase.reportDraft = text; currentCase.reportUpdatedAt = Date.now();
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set({reportDraft:text, reportUpdatedAt:Date.now(), updatedAt:Date.now()},{merge:true});
  else saveLocalCase();
  await addLog('report', message || '更新進度報告草稿');
}
function buildFullSpeech(){
  const c=currentCase||{}; const commander=radioCallSign(); const lines=[];
  lines.push(`北海北海，${commander}回報：`);
  if(c.commandTransfer) lines.push('目前已完成指揮權轉移。');
  if(c.addressConfirmed && c.address){
    let text=`現場地址為${c.address}`;
    if(c.firstSideSet) text+=`，${c.firstSideMode==='custom'?`律定${c.firstSideCustom||c.firstSideName||'指定位置'}為火場第一面`:'以這個地址的正面為火場第一面'}`;
    if(c.firstSideNote) text+=`，指揮站設於${c.firstSideNote}`;
    lines.push(`一、到：${text}。`);
  }
  const building=[]; if(c.buildingStructure) building.push(c.buildingStructure); if(c.purpose) building.push(`${c.purpose}用途建物`); if(c.floors) building.push(`樓高${c.floors}樓`); if(c.fireFloor) building.push(`起火樓層為${floorText(c.fireFloor)}`);
  if(building.length) lines.push(`二、建：現場為${building.join('，')}。`);
  if(c.fireStatus) lines.push(`三、火：目前${c.fireStatus.replace(/[。；]+$/,'')}。`);
  const people=[];
  if(c.contactState==='found') people.push((c.contacts||[]).length?'已找到關係人':'已找到關係人');
  if(c.trapped==='無') people.push('確認無人受困'); else if(c.trapped==='有') people.push(`確認有${Number(c.trappedCount)||0}人受困`);
  if(c.hazardState==='none') people.push('建物內無危險物品'); else if(c.hazardState==='has') people.push(`現場有危險物品${c.hazardItems?`：${c.hazardItems}`:''}`);
  if(people.length) lines.push(`四、人：目前${people.join('，')}。`);
  if(c.supportState==='needed'){
    const supports=(c.supports||[]).join('、'); if(supports||c.supportDetails) lines.push(`五、支：目前需要${supports||'相關單位'}到場支援${c.supportDetails?`，${c.supportDetails}`:''}。`);
  }
  const deployment=[];
  if(live.crews.length) deployment.push(...live.crews.map(x=>`${x.face?`${x.face}由`:''}${x.unit||'人員'}${x.task?`執行${x.task}`:''}`));
  if(c.ritSet) deployment.push(`律定${c.ritUnit||'指定單位'}擔任RIT救援小組`);
  if(c.parRequested && c.parDetails) deployment.push(c.parDetails);
  if(deployment.length) lines.push(`六、初：${deployment.join('；')}。`);
  if(c.breakDoorState==='required' && c.breakDoor) lines.push(`七、破：${c.breakDoorAt?`已於${fmtTime(c.breakDoorAt)}，`:''}${c.breakDoorUnit?`由${c.breakDoorUnit}`:''}完成破門${c.breakDoorNote?`，${c.breakDoorNote}`:''}。`);
  if(c.cordonState==='set' && c.cordonSet) lines.push(`八、警：目前已完成火場警戒區劃設${c.cordonArea?`，範圍為${c.cordonArea}`:''}${c.cordonNote?`，${c.cordonNote}`:''}。`);
  return lines.join('\n\n');
}
function parseReportText(text){
  const meta = {};
  const sections = [];
  let current = null;
  for(const raw of String(text||'').split('\n')){
    const line = raw.trim();
    if(!line || /^【.*】$/.test(line)) continue;
    if(/^(案件編號|地址|產出者|產出時間|保密註記)：/.test(line)){
      const idx = line.indexOf('：');
      meta[line.slice(0,idx)] = line.slice(idx+1);
      continue;
    }
    if(/^[一二三四五六七八九十]+、/.test(line)){
      current = { title: line, items: [] };
      sections.push(current);
      continue;
    }
    if(!current){
      current = { title: '補充內容', items: [] };
      sections.push(current);
    }
    current.items.push(line);
  }
  return { meta, sections };
}
function structuredSectionHtml(section){
  const items=section.items||[];
  let html=''; let list=[];
  const flush=()=>{if(list.length){html+=`<ul class="report-bullets">${list.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`;list=[];}};
  items.forEach(item=>{
    const clean=String(item||'').trim(); if(!clean) return;
    if(/^[-•]\s*/.test(clean)){ list.push(clean.replace(/^[-•]\s*/,'')); return; }
    flush();
    if(/^（[^）]+）/.test(clean)) html+=`<h3 class="report-subheading">${escapeHtml(clean)}</h3>`;
    else html+=`<p class="report-paragraph">${escapeHtml(clean)}</p>`;
  });
  flush();
  return `<section class="report-section"><h2>${escapeHtml(section.title)}</h2><div class="report-body">${html||'<p class="report-paragraph">尚無資料。</p>'}</div></section>`;
}
function buildReportSummaryTable(){
  const c = currentCase || {}; const meta=c.locationMeta || {};
  return `<table class="report-plain-table"><tbody>
    <tr><th>案件類型</th><td>${escapeHtml(c.type||'未登錄')}</td><th>建物用途</th><td>${escapeHtml(c.purpose||'未登錄')}</td></tr>
    <tr><th>建物樓層</th><td>${escapeHtml(String(c.floors||'未登錄'))}</td><th>起火樓層</th><td>${escapeHtml(floorText(c.fireFloor))}</td></tr>
    <tr><th>受困狀況</th><td>${escapeHtml(c.trapped==='有'?`有 / ${c.trappedCount||0}人`:c.trapped==='無'?'確認無人受困':'尚未確認')}</td><th>火煙狀況</th><td>${escapeHtml(c.fireStatus||'尚未確認')}</td></tr>
    <tr><th>到場回報</th><td>${escapeHtml(c.arrived?'已到達':'未確認')}</td><th>指揮權</th><td>${escapeHtml(c.commandTransfer?'已轉移':'未確認')}</td></tr>
    <tr><th>案件中心定位</th><td>${escapeHtml(locationSourceLabel(meta.source||'legacy'))}｜${escapeHtml(locationQualityLabel(meta))}</td><th>案件中心座標</th><td>${Number(c.lat||0).toFixed(6)}, ${Number(c.lng||0).toFixed(6)}</td></tr>
  </tbody></table>`;
}
function deploymentSchematicHtml(){
  const c=currentCase || {};
  const points=[];
  const add=(lat,lng,kind,label,id='')=>{
    const a=Number(lat), b=Number(lng); if(Number.isFinite(a)&&Number.isFinite(b)) points.push({lat:a,lng:b,kind,label:String(label||''),id});
  };
  add(c.lat,c.lng,'incident','案件中心','incident');
  live.vehicles.forEach(v=>add(v.lat,v.lng,'vehicle',v.name||v.unit||'車輛',v.id));
  live.crews.forEach(x=>add(x.lat,x.lng,'crew',`${x.unit||''}${x.leader||''}`,x.id));
  live.hazards.forEach(h=>add(h.lat,h.lng,'hazard',h.type||'危害',h.id));
  live.hoses.forEach(h=>{ if(h.targetType==='map' && h.lat && h.lng) add(h.lat,h.lng,'hoseEnd',h.targetName||'水線終點',`hose_${h.id}`); });
  if(!points.length) return '<div class="report-list-item">尚無戰術部署圖資料。</div>';
  let minLat=Math.min(...points.map(x=>x.lat)), maxLat=Math.max(...points.map(x=>x.lat));
  let minLng=Math.min(...points.map(x=>x.lng)), maxLng=Math.max(...points.map(x=>x.lng));
  if(Math.abs(maxLat-minLat)<.0006){ minLat-=.0003; maxLat+=.0003; }
  if(Math.abs(maxLng-minLng)<.0006){ minLng-=.0003; maxLng+=.0003; }
  const pad=.12, W=900,H=520;
  const xy=(lat,lng)=>({
    x:(pad+(Number(lng)-minLng)/(maxLng-minLng)*(1-pad*2))*W,
    y:(pad+(maxLat-Number(lat))/(maxLat-minLat)*(1-pad*2))*H
  });
  const pointMap=new Map(points.map(x=>[x.id,{...x,...xy(x.lat,x.lng)}]));
  const hoseLines=live.hoses.map(h=>{
    const a=pointMap.get(h.vehicleId);
    let b=null;
    if(h.targetType==='vehicle'||h.targetType==='crew') b=pointMap.get(h.targetId);
    else b=pointMap.get(`hose_${h.id}`);
    if(!a||!b) return '';
    return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" class="scheme-hose"/><text x="${((a.x+b.x)/2).toFixed(1)}" y="${((a.y+b.y)/2-6).toFixed(1)}" class="scheme-hose-label">${escapeHtml(h.owner||h.kind||'水線')}</text>`;
  }).join('');
  const building=(()=>{
    const box=c.buildingBox; if(!box?.lat||!box?.lng) return '';
    const center=xy(box.lat,box.lng); const w=Math.max(85,Math.min(260,Number(box.widthM||40)*3.2)); const h=Math.max(60,Math.min(190,Number(box.heightM||28)*3.2));
    return `<rect x="${(center.x-w/2).toFixed(1)}" y="${(center.y-h/2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="10" class="scheme-building"/><text x="${center.x.toFixed(1)}" y="${(center.y+4).toFixed(1)}" class="scheme-building-label">建物／${escapeHtml(box.firstSide||'第一面')}</text>`;
  })();
  const nodes=points.map(p=>{
    const {x,y}=xy(p.lat,p.lng);
    const cls=`scheme-node ${p.kind}`;
    const icon=p.kind==='vehicle'?'🚒':p.kind==='crew'?'人':p.kind==='hazard'?'⚠':p.kind==='incident'?'指':'●';
    return `<g class="${cls}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.kind==='incident'?18:15}"/><text x="${x.toFixed(1)}" y="${(y+5).toFixed(1)}" class="scheme-icon">${escapeHtml(icon)}</text><text x="${x.toFixed(1)}" y="${(y+34).toFixed(1)}" class="scheme-label">${escapeHtml(p.label)}</text></g>`;
  }).join('');
  return `<div class="report-schematic-card"><div class="report-schematic-head"><strong>外部戰術部署示意圖</strong><span>非導航底圖，依系統座標相對呈現</span></div><svg class="report-schematic" viewBox="0 0 ${W} ${H}" role="img" aria-label="火場外部戰術部署示意圖"><rect width="${W}" height="${H}" class="scheme-bg"/><path d="M0 ${H*.5} H${W} M${W*.5} 0 V${H}" class="scheme-axis"/>${building}${hoseLines}${nodes}</svg></div>`;
}
function floorPlanSchematicHtml(){
  const ops=getBuildingOps();
  const levels=floorsArray();
  const selected=Number($('floorPlanLevel')?.value || levels[0] || 1);
  const markers=(ops.planMarkers||[]).filter(m=>Number(m.floor)===selected);
  if(!markers.length) return '';
  const W=900,H=480;
  const lineHtml=markers.filter(m=>m.x2!==undefined).map(m=>`<line x1="${(m.x/100*W).toFixed(1)}" y1="${(m.y/100*H).toFixed(1)}" x2="${(m.x2/100*W).toFixed(1)}" y2="${(m.y2/100*H).toFixed(1)}" class="floor-scheme-line ${markerClass(m.type)}"/><text x="${(((m.x+m.x2)/200)*W).toFixed(1)}" y="${((((m.y+m.y2)/200)*H)-5).toFixed(1)}" class="floor-scheme-label">${m.note?escapeHtml(m.note):''}</text>`).join('');
  const pointHtml=markers.filter(m=>m.x2===undefined).map(m=>`<g><circle cx="${(m.x/100*W).toFixed(1)}" cy="${(m.y/100*H).toFixed(1)}" r="18" class="floor-scheme-point ${markerClass(m.type)}"/><text x="${(m.x/100*W).toFixed(1)}" y="${(m.y/100*H+5).toFixed(1)}" class="floor-scheme-icon">${escapeHtml(markerIcon(m.type))}</text><text x="${(m.x/100*W).toFixed(1)}" y="${(m.y/100*H+39).toFixed(1)}" class="floor-scheme-label">${m.note?escapeHtml(m.note):''}</text></g>`).join('');
  return `<div class="report-schematic-card"><div class="report-schematic-head"><strong>${escapeHtml(floorLabel(selected))} 建物內部作戰示意圖</strong><span>依現場繪圖資料正式化呈現</span></div><svg class="report-schematic floor" viewBox="0 0 ${W} ${H}" role="img" aria-label="建物內部作戰示意圖"><rect width="${W}" height="${H}" class="scheme-bg"/><defs><pattern id="floorGrid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" class="scheme-grid"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#floorGrid)"/>${lineHtml}${pointHtml}</svg></div>`;
}
function reportHtmlFromText(text){
  const cleaned = sanitizeReportText(text);
  const {meta, sections} = parseReportText(cleaned);
  const chips = [`車輛 ${live.vehicles.length} 台`,`人員 ${sum(live.crews,'count')} 人`,`水線 ${live.hoses.length} 條`,`戰情 ${live.sitreps.length} 筆`].map(x=>`<span class="report-chip">${escapeHtml(x)}</span>`).join('');
  const metaTable = `<table class="report-meta-table"><tbody>
    <tr><th>案件編號</th><td>${escapeHtml(meta['案件編號']||currentCase?.caseNo||'')}</td><th>地址</th><td>${escapeHtml(meta['地址']||currentCase?.address||'')}</td></tr>
    <tr><th>產出者</th><td>${escapeHtml(meta['產出者']||`${profile?.realName||profile?.callName||''}｜${profile?.brigade||''}/${profile?.unit||''}`)}</td><th>產出時間</th><td>${escapeHtml(meta['產出時間']||fmtTime(Date.now()))}</td></tr>
  </tbody></table>`;
  const sectionHtml=sections.map(section=>{
    const base=structuredSectionHtml(section);
    if(/^四、/.test(section.title)) return base + deploymentSchematicHtml() + floorPlanSchematicHtml();
    return base;
  }).join('');
  return `<div class="report-cover">
      <div class="report-kicker">FireCommand｜火場指揮系統</div>
      <h1 class="report-case-title">火場進度報告</h1>
      <div class="report-subtitle">${escapeHtml(currentCase?.address||meta['地址']||'') || '案件資料彙整'}</div>
      <div class="report-chip-row">${chips}</div>
      ${metaTable}
      ${buildReportSummaryTable()}
      <div class="report-note">${escapeHtml(meta['保密註記']||'本報告僅供勤務指揮、內部彙整與交接使用，禁止外流。')}</div>
    </div>${sectionHtml}<div class="report-watermark-foot">${escapeHtml(watermarkText())}｜僅供勤務使用，禁止外流</div>`;
}
function renderReportPreview(text){
  const el=$('reportPreview'); if(!el) return;
  const cleaned = sanitizeReportText(text);
  el.innerHTML = `<div class="report-paper formal" data-watermark="${escapeHtml(watermarkRepeated())}">${reportHtmlFromText(cleaned)}</div>`;
}
function copyReportDraft(){ const text = ($('reportDraft')?.value || generateReport(false)); navigator.clipboard?.writeText(text); toast('已複製進度報告'); addLog('export','複製火場進度報告'); }
function copyCommandSpeech(){ const text = buildFullSpeech(); navigator.clipboard?.writeText(text); $('commandSpeech').value=text; toast('已複製續報稿'); addLog('export','複製到建火人支初續報稿'); }
function printReport(){ printReportSameTab(); }
function printReportSameTab(){
  const text = sanitizeReportText(($('reportDraft')?.value || generateReport(false)));
  let view=$('sameTabPrintOverlay');
  if(!view){
    view=document.createElement('section'); view.id='sameTabPrintOverlay'; view.className='same-tab-print-overlay'; view.hidden=true;
    $('appScreen')?.appendChild(view);
  }
  reportReturnState={scrollY:window.scrollY,casePage:activeCasePage};
  const shareButton=navigator.share ? '<button type="button" class="btn small ghost" id="shareSameTabReportBtn">分享</button>' : '';
  view.innerHTML=`<div class="same-tab-print-toolbar"><button type="button" class="btn small ghost" id="closeSameTabPrintBtn">← 返回系統</button><div class="same-tab-print-title">火場進度報告預覽</div>${shareButton}<button type="button" class="btn small primary" id="triggerSameTabPrintBtn">列印 / 存 PDF</button></div><div class="same-tab-print-help">此頁不會另開視窗。列印完成後仍可按「返回系統」，也可使用瀏覽器返回鍵。</div><div class="same-tab-print-paper" data-watermark="${escapeHtml(watermarkRepeated())}">${reportHtmlFromText(text)}</div>`;
  view.hidden=false;
  document.body.classList.add('same-tab-print-mode');
  if(!reportOverlayHistoryActive){ history.pushState({firecommandReport:true},'',location.href); reportOverlayHistoryActive=true; }
  $('closeSameTabPrintBtn')?.addEventListener('click',()=>closeReportOverlay());
  $('triggerSameTabPrintBtn')?.addEventListener('click',()=>{ ensureReportOverlayUsable(); window.print(); });
  $('shareSameTabReportBtn')?.addEventListener('click',async()=>{
    try{ await navigator.share({title:`${currentCase?.caseNo||'FireCommand'} 火場進度報告`,text:text.slice(0,2500)}); }
    catch(err){ if(err?.name!=='AbortError') toast('此裝置暫時無法分享，請改用列印 / 存 PDF'); }
  });
  view.scrollTop=0; window.scrollTo({top:0,left:0,behavior:'auto'});
  toast('已開啟同頁報告預覽；完成後可直接返回系統。',3000);
  addLog('export','開啟同頁進度報告預覽 / 列印模式');
}
function closeReportOverlay({fromPopState=false}={}){
  const view=$('sameTabPrintOverlay');
  if(view) view.hidden=true;
  document.body.classList.remove('same-tab-print-mode');
  const state=reportReturnState;
  reportReturnState=null;
  const shouldBack=reportOverlayHistoryActive && !fromPopState;
  reportOverlayHistoryActive=false;
  if(state){ switchCasePage(state.casePage||'reportSection',false); requestAnimationFrame(()=>window.scrollTo({top:state.scrollY||0,left:0,behavior:'auto'})); }
  if(shouldBack) history.back();
}
function handlePopState(){
  const view=$('sameTabPrintOverlay');
  if(view && !view.hidden) closeReportOverlay({fromPopState:true});
}
function ensureReportOverlayUsable(){
  const view=$('sameTabPrintOverlay');
  if(!view || view.hidden) return;
  document.body.classList.add('same-tab-print-mode');
  const toolbar=view.querySelector('.same-tab-print-toolbar'); if(toolbar) toolbar.style.display='flex';
}

function watermarkText(){ return `${profile?.realName || profile?.callName || '未具名'}｜${profile?.brigade || ''}/${profile?.unit || ''}｜${currentCase?.caseNo || 'FireCommand'}｜${new Date().toLocaleString('zh-TW',{hour12:false})}｜僅供勤務使用`; }
function watermarkRepeated(){ const t = watermarkText(); return Array.from({length:80},()=>t).join('     '); }
function setWatermark(){ document.body.dataset.watermark = watermarkRepeated(); }

let activeStage='到';
let activeArrivalCard='arrived';
let activeBuildingView = 'vertical';
let buildingViewManual = false;
let buildingFullscreen = false;
let activeCasePage = "caseInfo";
let selectedFloorTool = "起火點";
let floorDrawState = null;
let floorMarkerDrag = null;
const ARRIVAL_CARD_MAP = {
  arrived:'arrivedCheck', command:'commandCheck', contact:'contactCheck', rit:'ritCheck', hazard:'hazardCheck', firstSide:'firstSideCheck', par:'parCheck', support:'supportCheck', breakDoor:'breakDoorCheck', cordon:'cordonCheck'
};
const STAGE_CARD_MAP={到:['arrived','command','firstSide'],建:['building'],火:['fire'],人:['contact','trapped','hazard'],支:['support'],初:['deployment','rit','par'],破:['breakDoor'],警:['cordon']};
function selectCommandStage(stage){
  activeStage = stage || '到';
  document.querySelectorAll('[data-stage]').forEach(b=>b.classList.toggle('active', b.dataset.stage===activeStage));
  const allowed=STAGE_CARD_MAP[activeStage]||[];
  if(!allowed.includes(activeArrivalCard)) activeArrivalCard=allowed[0]||null;
  renderArrivalStatusCards();
  renderCommandGuide();
}
function toggleArrivalCard(key){
  const wasActive = activeArrivalCard === key;
  activeArrivalCard = wasActive ? null : key;
  renderArrivalStatusCards();
  renderCommandGuide();
}


function getRadioValue(name){
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}
function setRadioValue(name, value){
  const target = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if(target) target.checked = true;
  else document.querySelectorAll(`input[name="${name}"]`).forEach(x=>x.checked=false);
}
function updateArrivalConditionalPanels(){
  const commandState = getRadioValue('commandState');
  const contactState = getRadioValue('contactState');
  const ritState = getRadioValue('ritState');
  const hazardState = getRadioValue('hazardState');
  const firstSideState = getRadioValue('firstSideState');
  const supportState = getRadioValue('supportState');
  const breakDoorState = getRadioValue('breakDoorState');
  const cordonState = getRadioValue('cordonState');
  const trappedState = getRadioValue('trappedState');
  const firstSideMode = getRadioValue('firstSideMode');
  $('commandDetailFields') && ($('commandDetailFields').hidden = commandState !== 'transferred');
  $('contactDetailFields') && ($('contactDetailFields').hidden = contactState !== 'found');
  $('ritDetailFields') && ($('ritDetailFields').hidden = ritState !== 'assigned');
  $('hazardDetailFields') && ($('hazardDetailFields').hidden = hazardState !== 'has');
  $('firstSideDetailFields') && ($('firstSideDetailFields').hidden = firstSideState !== 'set');
  $('supportDetailFields') && ($('supportDetailFields').hidden = supportState !== 'needed');
  $('breakDoorDetailFields') && ($('breakDoorDetailFields').hidden = breakDoorState !== 'required');
  $('cordonDetailFields') && ($('cordonDetailFields').hidden = cordonState !== 'set');
  $('trappedDetailFields') && ($('trappedDetailFields').hidden = trappedState !== 'has');
  $('firstSideCustomFields') && ($('firstSideCustomFields').hidden = firstSideMode !== 'custom');
  $('arrivedCheck') && ($('arrivedCheck').checked = !!$('addressConfirmCheck')?.checked);
  if(supportState==='none') document.querySelectorAll('.support-grid input').forEach(x=>x.checked=false);
  $('commandCheck') && ($('commandCheck').checked = commandState === 'transferred');
  $('contactCheck') && ($('contactCheck').checked = !!contactState);
  $('ritCheck') && ($('ritCheck').checked = ritState === 'assigned');
  $('hazardCheck') && ($('hazardCheck').checked = !!hazardState);
  $('firstSideCheck') && ($('firstSideCheck').checked = firstSideState === 'set');
  $('supportCheck') && ($('supportCheck').checked = supportState === 'needed');
  $('breakDoorCheck') && ($('breakDoorCheck').checked = breakDoorState === 'required');
  $('cordonCheck') && ($('cordonCheck').checked = cordonState === 'set');
}
function switchCasePage(targetId='caseInfo', resetScroll=true){
  const allowed = ['caseInfo','arrivalSection','sitrepSection','tacticalMapSection','aiSection','dashboardSection','reportSection','assessmentSection'];
  const next = allowed.includes(targetId) ? targetId : 'caseInfo';
  activeCasePage = next;
  document.querySelectorAll('[data-case-page-panel]').forEach(panel => {
    panel.hidden = panel.dataset.casePagePanel !== next;
  });
  document.querySelectorAll('[data-case-page]').forEach(btn => {
    const active = btn.dataset.casePage === next;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  const section = $(next);
  if(section){
    const firstDetails = Array.from(section.children || []).find(node => node.matches?.('details.accordion')) || section.querySelector('details.accordion');
    if(firstDetails) firstDetails.open = true;
  }
  if(next==='tacticalMapSection'){
    const mapDetails = $('deploymentMapDetails') || section?.querySelector('details.tool-accordion');
    const buildingDetails = $('buildingOpsDetails');
    if(buildingDetails) buildingDetails.open = false;
    if(mapDetails) mapDetails.open = true;
    setTimeout(refreshMapSize,240);
  }
  if(next==='dashboardSection'){
    const first = section?.querySelector('details.accordion'); if(first) first.open = true;
  }
  if(resetScroll){
    const header = document.querySelector('#detailPage .detail-header');
    requestAnimationFrame(()=>header?.scrollIntoView({block:'start',behavior:'auto'}));
  }
}
function openQuickNavSection(targetId){ switchCasePage(targetId); }
function isWideBuildingViewport(){ return window.innerWidth>=900 || (window.innerWidth>=700 && window.innerWidth>window.innerHeight); }
function setBuildingOpsView(view='vertical', manual=false){
  if(!['vertical','plan','split'].includes(view)) view='vertical';
  if(view==='split' && !isWideBuildingViewport()) view='plan';
  activeBuildingView=view; if(manual) buildingViewManual=true;
  const workspace=$('buildingWorkspace'); if(workspace) workspace.dataset.buildingView=view;
  const vertical=$('verticalBuildingPanel'), plan=$('planBuildingPanel');
  if(vertical) vertical.hidden=view==='plan';
  if(plan) plan.hidden=view==='vertical';
  [['buildingVerticalTabBtn','vertical'],['buildingPlanTabBtn','plan'],['buildingSplitTabBtn','split']].forEach(([id,key])=>{
    const btn=$(id);if(!btn)return;const active=key===view;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false');
  });
  if(plan && !plan.hidden) requestAnimationFrame(()=>renderFloorPlan());
  updateOrientationHint();
}
function handleResponsiveBuildingLayout(){
  updateOrientationHint();
  const details=$('buildingOpsDetails'); if(!details?.open) return;
  if(!buildingViewManual) setBuildingOpsView(isWideBuildingViewport()?'split':'vertical',false);
  else if(activeBuildingView==='split' && !isWideBuildingViewport()) setBuildingOpsView('plan',false);
}
function toggleBuildingFullscreen(){
  const details=$('buildingOpsDetails'); if(!details)return;
  buildingFullscreen=!buildingFullscreen;
  details.classList.toggle('building-fullscreen',buildingFullscreen);
  document.body.classList.toggle('building-fullscreen-open',buildingFullscreen);
  const btn=$('toggleBuildingFullscreenBtn'); if(btn) btn.textContent=buildingFullscreen?'退出全幅':'全幅繪圖';
  if(buildingFullscreen) setBuildingOpsView('plan',true);
  requestAnimationFrame(()=>renderFloorPlan());
}
function renderParCrewChecklist(){
  const wrap = $('parCrewChecklist'); if(!wrap) return;
  const checked = currentCase?.parCrewChecked || {};
  wrap.innerHTML = live.crews.length ? live.crews.map(p=>`<label class="check slim par-row"><input type="checkbox" data-par-crew="${p.id}" ${checked[p.id]?'checked':''} /> ${escapeHtml(p.unit)}${escapeHtml(p.leader||'')}｜${p.count||0}人｜${escapeHtml(p.task||p.status||'')}</label>`).join('') : '<div class="empty">尚無登錄分隊。請先在人員部署新增各分隊。</div>';
  wrap.querySelectorAll('[data-par-crew]').forEach(ch => ch.addEventListener('change', async () => {
    currentCase.parCrewChecked = currentCase.parCrewChecked || {}; currentCase.parCrewChecked[ch.dataset.parCrew] = ch.checked;
    $('parCheck') && ($('parCheck').checked = Object.values(currentCase.parCrewChecked).some(Boolean));
    const names = live.crews.filter(p=>currentCase.parCrewChecked[p.id]).map(p=>`${p.unit}${p.leader||''}`).join('、');
    $('parDetails') && ($('parDetails').value = names ? `已完成 PAR：${names}` : '');
    if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set({parCrewChecked:currentCase.parCrewChecked, parDetails:$('parDetails')?.value||'', parRequested:$('parCheck')?.checked||false, updatedAt:Date.now()},{merge:true}); else saveLocalCase();
    renderArrivalStatusCards(); renderCommandGuide();
  }));
}
function renderArrivalStatusCards(){
  const commandState = getRadioValue('commandState') || currentCase?.commandState || '';
  const contactState = getRadioValue('contactState') || currentCase?.contactState || '';
  const ritState = getRadioValue('ritState') || currentCase?.ritState || '';
  const hazardState = getRadioValue('hazardState') || currentCase?.hazardState || '';
  const firstSideState = getRadioValue('firstSideState') || currentCase?.firstSideState || '';
  const supportState = getRadioValue('supportState') || currentCase?.supportState || '';
  const breakDoorState = getRadioValue('breakDoorState') || currentCase?.breakDoorState || '';
  const cordonState = getRadioValue('cordonState') || currentCase?.cordonState || '';
  const contacts = readContacts();
  const buildingDone=!!($('detailPurpose')?.value && $('detailFloors')?.value && $('detailFireFloor')?.value);
  const fireDone=!!($('fireObservedFloor')?.value && ($('fireObservation')?.value || $('fireSmokeColor')?.value || $('fireFlameState')?.value));
  const trappedState=getRadioValue('trappedState');
  const mapping = {
    arrived: [$('arrivedCheck'), $('addressConfirmCheck')?.checked ? '地址已確認' : '待確認地址'],
    building: [null, buildingDone ? `${$('detailPurpose').value}｜${$('detailFloors').value}樓｜${floorText($('detailFireFloor').value)}` : '尚缺必要資料'],
    fire: [null, fireDone ? buildFireStatusFromSop() : '尚缺火煙資料'],
    trapped: [null, trappedState==='none'?'確認無人受困':trappedState==='has'?`受困 ${Number($('trappedCountArrival')?.value)||0} 人`:'尚未確認'],
    deployment: [null, (live.crews.length||live.vehicles.length||live.hoses.length)?`${live.vehicles.length}車｜${sum(live.crews,'count')}人｜${live.hoses.length}線`:'尚未部署'],
    command: [$('commandCheck'), commandState==='transferred' ? '已完成轉移' : (commandState==='pending' ? '尚未完成' : '未確認')],
    contact: [$('contactCheck'), contactState==='found' ? (contacts.length ? `已找到 ${contacts.length} 位` : '已找到，待補資料') : (contactState==='notfound' ? '尚未找到' : '未確認')],
    rit: [$('ritCheck'), ritState==='assigned' ? ($('ritUnit')?.value || '已指派') : (ritState==='unassigned' ? '尚未指派' : '未確認')],
    hazard: [$('hazardCheck'), hazardState==='none' ? '確認無危險物' : (hazardState==='has' ? ($('hazardItems')?.value || '有危險物') : '未確認')],
    firstSide: [$('firstSideCheck'), firstSideState==='set' ? (firstSidePhrase() + (($('firstSideNote')?.value||'') ? `｜${$('firstSideNote').value}` : '')) : (firstSideState==='unset' ? '尚未律定' : '未確認')],
    par: [$('parCheck'), $('parCheck')?.checked ? ($('parDetails')?.value || '已要求') : '未要求'],
    support: [$('supportCheck'), supportState==='needed' ? (readSupports().join('、') || '需要支援') : (supportState==='none' ? '暫無需求' : '未確認')],
    breakDoor: [$('breakDoorCheck'), breakDoorState==='required' ? '需要 / 已執行' : (breakDoorState==='none' ? '不需要' : '未確認')],
    cordon: [$('cordonCheck'), cordonState==='set' ? ($('cordonArea')?.value || '已劃設') : (cordonState==='pending' ? '尚未劃設' : '未確認')]
  };
  Object.entries(mapping).forEach(([key,[input,text]])=>{
    const card = document.querySelector(`[data-arrival-card="${key}"]`);
    const status = $(`${key}StatusText`);
    const selected = key==='building' ? buildingDone : key==='fire' ? fireDone : key==='trapped' ? trappedState!=='unknown' && !!trappedState : key==='deployment' ? !!(live.crews.length||live.vehicles.length||live.hoses.length) : key==='command' ? commandState==='transferred' : key==='contact' ? !!contactState : key==='rit' ? ritState==='assigned' : key==='hazard' ? (hazardState==='none'||hazardState==='has') : key==='firstSide' ? firstSideState==='set' : key==='support' ? (supportState==='none'||supportState==='needed') : key==='breakDoor' ? (breakDoorState==='none'||breakDoorState==='required') : key==='cordon' ? cordonState==='set' : !!input?.checked;
    if(card){ card.classList.toggle('selected', selected); card.classList.toggle('expanded', activeArrivalCard===key); card.classList.toggle('required-missing', !selected); }
    if(status) status.textContent = text;
  });
  const allowed=STAGE_CARD_MAP[activeStage||'到']||[];
  document.querySelectorAll('[data-arrival-card]').forEach(card=>{card.hidden=!allowed.includes(card.dataset.arrivalCard);});
  document.querySelectorAll('[data-arrival-panel]').forEach(panel => { panel.hidden = panel.dataset.arrivalPanel !== activeArrivalCard || !allowed.includes(panel.dataset.arrivalPanel); });
  $('stageChecklistTitle') && ($('stageChecklistTitle').textContent=`${activeStage||'到'}｜專屬確認事項`);
  document.querySelectorAll('[data-stage]').forEach(btn=>btn.classList.toggle('active',btn.dataset.stage===(activeStage||'到')));
  renderDeploymentSopSummary();
  updateStageCompletion();
  $('arrivalAddressDisplay') && ($('arrivalAddressDisplay').textContent = currentCase?.address || '尚未登錄地址');
  updateArrivalConditionalPanels();
  document.querySelectorAll('.choice-chip').forEach(label => label.classList.toggle('checked', !!label.querySelector('input:checked')));
  document.querySelectorAll('.support-grid label').forEach(label => label.classList.toggle('checked', !!label.querySelector('input:checked')));
  updateCommandAutoHint();
  renderParCrewChecklist();
}
function updateSupportStatus(){ if(readSupports().length){ setRadioValue('supportState','needed'); $('supportCheck') && ($('supportCheck').checked = true); } renderArrivalStatusCards(); }
function updateCommandAutoHint(){
  const el = $('commandAutoHint'); if(!el) return;
  const crewText = live.crews.length ? live.crews.map(p=>`${p.unit}${p.leader||''}：${p.task||p.status||'任務未填'}${p.face?`（${p.face}）`:''}`).join('；') : '尚無人員編組資料。';
  const hoseText = live.hoses.length ? live.hoses.map(h=>`${h.label||h.owner||'水線'}：${h.type||'水線'} / ${h.mission||'任務未填'}`).join('；') : '尚無水線紀錄。';
  el.textContent = `目前人員任務：${crewText}｜水線：${hoseText}`;
}

function renderCommandGuide(){
  if(!currentCase || !$('commandAdvice')) return;
  if(!activeStage){
    $('commandAdvice').classList.add('collapsed');
    $('commandAdvice').innerHTML = '';
    $('commandSpeech').value = buildFullSpeech();
    return;
  }
  const c=currentCase; const stage=activeStage;
  const blocks = commandBlocks(stage, c);
  $('commandAdvice').classList.remove('collapsed');
  $('commandAdvice').innerHTML = `<div class="advice-grid"><div class="advice-box"><h4>${escapeHtml(stage)}｜必須確認</h4><ol>${blocks.confirm.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol></div><div class="advice-box"><h4>${escapeHtml(stage)}｜應執行事項</h4><ol>${blocks.action.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol></div></div>`;
  $('commandSpeech').value = buildFullSpeech();
}
function commandBlocks(stage,c){
  const contactLine = (c.contacts||[]).map(x=>`${x.name||'未具名'}${x.phone?`（${x.phone}）`:''}`).join('、') || '尚未登錄關係人';
  const common = {
    '到': {
      confirm:['是否已抵達正確地址與入口','是否完成現場安全觀察','是否宣告到達並建立初步指揮位置'],
      action:['確認地址、入口與第一面','向指揮中心回報已到達','請後續單位至指定位置報到'],
      speech:`北海北海，${radioCallSign()}抵達現場，開始進行指揮權轉移，稍後再向北海續報。`
    },
    '建': {
      confirm:['建物用途、樓高、起火樓層','樓梯、出入口、鐵窗、陽台、消防設備',`關係人：${contactLine}`],
      action:['詢問關係人或管理員','必要時調閱搶救圖或平面圖','將建物資訊納入部署與回報'],
      speech:`現場為${c.purpose||'未登錄'}用途建物，樓高${c.floors||'未登錄'}樓，起火樓層為${floorText(c.fireFloor)}。`
    },
    '火': {
      confirm:['火煙位置、顏色與強度','是否延燒或有飛火風險','四面 360 查看狀況'],
      action:['回報火煙與延燒風險','標示起火點與延燒方向','必要時調整水線與通風排煙'],
      speech:c.fireStatus?`目前${c.fireStatus}。`:'尚未完成火煙狀況確認。'
    },
    '人': {
      confirm:['是否有人受困、受困人數與位置','搜救小組是否已派遣','RIT 與 PAR 是否已落實'],
      action:['優先人命搜救並以水線掩護','更新傷患者狀況回報','持續追蹤搜救進度與救護交接'],
      speech:`目前人員受困狀況為${c.trapped||'未知'}，受困人數${c.trappedCount||0}人，${c.ritSet?'已律定RIT':'尚未律定RIT，請儘速指派'}。`
    },
    '支': {
      confirm:['現有人車水線是否足夠','是否需要台電、瓦斯、警察、台水、毒災等外單位','是否需要雲梯、水庫、排煙、照明或大隊支援'],
      action:['依不足項目請求支援','明確指定支援報到位置','更新支援清單與戰情回報'],
      speech:`現場目前支援需求為${(c.supports||readSupports()||[]).join('、')||'持續評估中'}。${c.supportDetails||''}`
    },
    '初': {
      confirm:['初期指揮官交接資訊','各分隊在第幾面執行任務','水源、雲梯、內攻、搜救、RIT 等部署'],
      action:['整理初期人車部署','確認指揮權轉移後任務是否延續或調整','將部署摘要納入進度報告'],
      speech:`請問初期指揮官：火煙狀況、場所特性、受困人員、出勤人車、是否有雲梯車及是否指派RIT。`
    },
    '破': {
      confirm:['是否確需破門進入','破門前是否回報現場指揮官','是否同步回報指揮中心並記錄破門時間'],
      action:['確認破門位置、目的與安全風險','記錄破門時間、單位與原因','破門後回報火煙、人員與搜救進展'],
      speech:`破門資訊：${c.breakDoorAt?fmtTime(c.breakDoorAt):'時間未登錄'}，${c.breakDoorUnit||'執行單位未登錄'}，${c.breakDoorNote||'位置與原因待補述'}。`
    },
    '警': {
      confirm:['是否已劃設火場警戒區','是否指派人員或警察協助管制','封鎖線是否涵蓋水線、作業區與危險區'],
      action:['指定警戒範圍與管制點','協調警察疏導交通與疏散民眾','將警戒區位置標示於戰術地圖'],
      speech:`警戒區：${c.cordonArea||'範圍未登錄'}，${c.cordonAssigned?'已指派':'尚未確認指派'}${c.cordonUnit?` ${c.cordonUnit}`:''}。`
    }
  };
  return common[stage] || common['到'];
}
function countBy(arr,key){ return arr.reduce((m,x)=>{ const k=x[key]||'未分類'; m[k]=(m[k]||0)+1; return m; },{}); }
function sum(arr,key){ return arr.reduce((s,x)=>s+(Number(x[key])||0),0); }
function entriesText(obj){ return Object.entries(obj).map(([k,v])=>`${k}${v}`).join('、'); }


// ===== v9/v14: account approval, building interior operations, and AI advice =====
function isSuperAdminEmail(email){ return String(email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL; }
function isSuperAdmin(){ return isSuperAdminEmail(profile?.email || fbUser?.email); }
function makeSuperAdminProfile(user){
  const displayName = user.displayName || '最高管理員';
  return {
    id: user.uid,
    email: user.email || SUPER_ADMIN_EMAIL,
    realName: displayName,
    callName: displayName,
    brigade: '第三大隊',
    unit: '大隊部',
    title: '最高管理員',
    role: 'admin',
    status: 'active',
    isSuperAdmin: true,
    approvedBy: SUPER_ADMIN_EMAIL,
    approvedAt: Date.now(),
    updatedAt: Date.now(),
    createdAt: Date.now()
  };
}
function isApproved(){ return isSuperAdmin() || profile?.status === 'active'; }
function canEnterSystem(){ return isSuperAdmin() || (isApproved() && profile?.status !== 'suspended'); }
async function normalizeAdminProfile(force=false){
  if(!fbUser || !isSuperAdminEmail(fbUser.email)) return;
  const now = Date.now();
  profile = {
    ...makeSuperAdminProfile(fbUser),
    ...(profile || {}),
    email: fbUser.email || SUPER_ADMIN_EMAIL,
    role: 'admin',
    status: 'active',
    isSuperAdmin: true,
    approvedBy: SUPER_ADMIN_EMAIL,
    approvedAt: profile?.approvedAt || now,
    updatedAt: now
  };
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
  const users = snap.docs.map(d=>({id:d.id, ...d.data()})).filter(u => !isSuperAdminEmail(u.email)).sort((a,b)=>String(a.status||'').localeCompare(String(b.status||'')) || String(a.brigade||'').localeCompare(String(b.brigade||'')));
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
  const ref = db.collection('users').doc(userId);
  const snap = await ref.get();
  const userData = snap.exists ? snap.data() : {};
  if(isSuperAdminEmail(userData.email)){
    toast('最高管理員帳號為系統固定帳號，不能停權、待審或刪除。');
    return;
  }
  await ref.set({status, approvedBy:profile.email, approvedAt:Date.now(), updatedAt:Date.now(), lastAdminAction:{action:'status-update',status,operator:profile.email,at:Date.now()}},{merge:true});
  console.info('FireCommand admin status update', {userId,status,operator:profile.email});
  toast(`已更新帳號狀態：${status}`); loadUsersForAdmin();
}

function defaultBuildingOps(){ return { floorActions: [], planMarkers: [], levels:[3,2,1] }; }
function getBuildingOps(){
  currentCase.buildingOps = Object.assign(defaultBuildingOps(), currentCase?.buildingOps || {});
  if(!Array.isArray(currentCase.buildingOps.levels) || !currentCase.buildingOps.levels.length) currentCase.buildingOps.levels = [3,2,1];
  return currentCase.buildingOps;
}
function setActionChoice(ids, activeId){ ids.forEach(id=>$(id)?.classList.toggle('active-choice', id===activeId)); }
function floorLabel(f){ return Number(f) > 0 ? `${Number(f)}F` : `B${Math.abs(Number(f))}`; }
function floorsArray(){ return (getBuildingOps().levels || [3,2,1]).map(Number).sort((a,b)=>b-a); }
function addUpperFloor(){
  recordFloorHistory();
  const ops = getBuildingOps();
  const positives = (ops.levels||[]).filter(f=>Number(f)>0).map(Number);
  const next = (positives.length ? Math.max(...positives) : 0) + 1;
  if(!ops.levels.includes(next)) ops.levels.unshift(next);
  ops.levels = ops.levels.map(Number).sort((a,b)=>b-a);
  renderBuildingOps();
  toast(`已新增 ${floorLabel(next)}`);
}
function addBasementFloor(){
  recordFloorHistory();
  const ops = getBuildingOps();
  const negatives = (ops.levels||[]).filter(f=>Number(f)<0).map(Number);
  const next = negatives.length ? Math.min(...negatives) - 1 : -1;
  if(!ops.levels.includes(next)) ops.levels.push(next);
  ops.levels = ops.levels.map(Number).sort((a,b)=>b-a);
  renderBuildingOps();
  toast(`已新增 ${floorLabel(next)}`);
}
function syncBuildingFloors(){
  if(!currentCase) return;
  const ops = getBuildingOps();
  if(!ops.levels || !ops.levels.length) ops.levels = [3,2,1];
  currentCase.buildingOps = ops;
  renderBuildingOps();
  toast('已同步樓層');
}
function renderBuildingOps(){
  if(!$('verticalSection') || !currentCase) return;
  const ops = getBuildingOps();
  const levels = floorsArray();
  const fireFloorNum = parseInt(String(currentCase.fireFloor||'').match(/B(\d+)|(-?\d+)/i)?.[1] ? '-' + String(currentCase.fireFloor).match(/B(\d+)/i)[1] : String(currentCase.fireFloor||'').match(/-?\d+/)?.[0] || levels[0] || 1, 10);
  const select = $('floorPlanLevel');
  if(select){
    const prev = select.value || String(fireFloorNum);
    select.innerHTML = levels.map(f=>`<option value="${f}">${floorLabel(f)}</option>`).join('');
    select.value = levels.includes(Number(prev)) ? prev : String(levels.includes(fireFloorNum) ? fireFloorNum : levels[0]);
  }
  $('verticalSection').innerHTML = levels.map(f => {
    const a = ops.floorActions?.find(x=>Number(x.floor)===f) || {floor:f, action:'未標示', note:''};
    return `<div class="floor-row ${f===fireFloorNum?'fire-floor':''}" data-floor="${f}">
      <div class="floor-label">${floorLabel(f)}</div>
      <select class="floor-action" data-floor-action="${f}"><option ${a.action==='滅火攻擊'?'selected':''}>滅火攻擊</option><option ${a.action==='阻隔延燒'?'selected':''}>阻隔延燒</option><option ${a.action==='就地避難'?'selected':''}>就地避難</option><option ${a.action==='疏散離開'?'selected':''}>疏散離開</option><option ${a.action==='搜索救援'?'selected':''}>搜索救援</option><option ${a.action==='未標示'?'selected':''}>未標示</option></select>
      <input class="floor-note" data-floor-note="${f}" placeholder="補述" value="${escapeHtml(a.note||'')}" />
    </div>`;
  }).join('');
  document.querySelectorAll('[data-floor-action],[data-floor-note]').forEach(el => el.addEventListener('change', collectBuildingOpsFromUI));
  renderFloorPlan();
  setBuildingOpsView(activeBuildingView || (isWideBuildingViewport()?'split':'vertical'));
  selectFloorTool(selectedFloorTool || '起火點', false);
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
function cloneBuildingOps(value=getBuildingOps()){ return JSON.parse(JSON.stringify(value || defaultBuildingOps())); }
function recordFloorHistory(){
  if(suppressFloorHistory || !currentCase) return;
  floorHistory.push(cloneBuildingOps());
  if(floorHistory.length>40) floorHistory.shift();
  floorRedoStack=[];
  updateFloorCommandState();
}
function restoreFloorSnapshot(snapshot){
  if(!currentCase||!snapshot) return;
  suppressFloorHistory=true;
  currentCase.buildingOps=cloneBuildingOps(snapshot);
  suppressFloorHistory=false;
  floorSelectedId=null;
  renderBuildingOps();
  updateFloorCommandState();
}
function floorUndo(){
  if(!floorHistory.length){ toast('目前沒有可復原的動作'); return; }
  floorRedoStack.push(cloneBuildingOps());
  restoreFloorSnapshot(floorHistory.pop());
  toast('已復原上一個繪圖動作');
}
function floorRedo(){
  if(!floorRedoStack.length){ toast('目前沒有可重做的動作'); return; }
  floorHistory.push(cloneBuildingOps());
  restoreFloorSnapshot(floorRedoStack.pop());
  toast('已重做繪圖動作');
}
function updateFloorCommandState(){
  $('floorUndoBtn') && ($('floorUndoBtn').disabled=!floorHistory.length);
  $('floorRedoBtn') && ($('floorRedoBtn').disabled=!floorRedoStack.length);
  $('lockFloorPlanBtn') && ($('lockFloorPlanBtn').textContent=floorPlanLocked?'🔒 圖面已鎖定':'🔓 鎖定圖面');
  $('floorPlanCanvas')?.classList.toggle('locked',floorPlanLocked);
}
function selectFloorTool(tool, show=true){
  if(floorPlanLocked && tool!=='選取'){ toast('圖面已鎖定，請先解除鎖定'); return; }
  selectedFloorTool = tool || selectedFloorTool || '起火點';
  document.querySelectorAll('[data-floor-tool]').forEach(btn => btn.classList.toggle('active-choice', btn.dataset.floorTool===selectedFloorTool));
  $('floorEraserBtn')?.classList.toggle('active-choice', selectedFloorTool==='橡皮擦');
  $('floorSelectBtn')?.classList.toggle('active-choice', selectedFloorTool==='選取');
  const hint = $('floorToolHint');
  if(hint){
    if(selectedFloorTool==='隔間' || selectedFloorTool==='水線') hint.textContent=`目前工具：${selectedFloorTool}。手指拖曳即可畫線，系統會吸附到水平、垂直或45度；點選線條可移動、調整端點或刪除。`;
    else if(selectedFloorTool==='橡皮擦') hint.textContent='目前工具：橡皮擦。點一下圖示或線條即可刪除。';
    else if(selectedFloorTool==='選取') hint.textContent='目前工具：選取。點選物件後可直接拖動；線條可拖動整條或調整兩端。';
    else hint.textContent=`目前工具：${selectedFloorTool}。點一下放置標示；長按或使用選取工具拖動，點選可修改或刪除。`;
  }
  if(show) toast(`已選擇：${selectedFloorTool}`);
}
function renderFloorPlan(){
  const canvas = $('floorPlanCanvas'); if(!canvas || !currentCase) return;
  collectBuildingOpsFromUI();
  const level = Number($('floorPlanLevel')?.value || 1);
  floorPlanLocked=!!getBuildingOps().locked;
  const markers = (getBuildingOps().planMarkers || []).filter(m=>Number(m.floor)===level);
  canvas.innerHTML = `<div class="floor-plan-grid"></div>` + markers.map(m => {
    const selected=floorSelectedId===m.id?' selected':'';
    if(m.x2 !== undefined && m.y2 !== undefined){
      const dx = Number(m.x2)-Number(m.x), dy = Number(m.y2)-Number(m.y);
      const len = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const handles=selected&&!floorPlanLocked?`<button type="button" class="floor-line-handle start" style="left:${m.x}%;top:${m.y}%" data-line-endpoint="start" data-marker-id="${m.id}" aria-label="調整線段起點"></button><button type="button" class="floor-line-handle end" style="left:${m.x2}%;top:${m.y2}%" data-line-endpoint="end" data-marker-id="${m.id}" aria-label="調整線段終點"></button>`:'';
      return `<button type="button" class="floor-line ${markerClass(m.type)}${selected}" style="left:${m.x}%;top:${m.y}%;width:${len}%;transform:rotate(${angle}deg)" data-marker-id="${m.id}" title="${m.note?escapeHtml(m.note):''}"><span>${m.note?escapeHtml(m.note):''}</span></button>${handles}`;
    }
    return `<button type="button" class="floor-marker ${markerClass(m.type)}${selected}" style="left:${m.x}%;top:${m.y}%" data-marker-id="${m.id}" title="${m.note?escapeHtml(m.note):''}">${markerIcon(m.type)}<span>${escapeHtml(m.label||m.type)}</span></button>`;
  }).join('');
  canvas.querySelectorAll('[data-marker-id]:not([data-line-endpoint])').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const id=btn.dataset.markerId;
      if(floorMarkerDrag?.moved) return;
      if(selectedFloorTool==='橡皮擦'){ deleteFloorMarker(id); return; }
      if(selectedFloorTool==='選取'){ floorSelectedId=id; renderFloorPlan(); return; }
      editFloorMarker(id);
    });
    btn.addEventListener('pointerdown', ev => startFloorMarkerDrag(ev, btn.dataset.markerId));
  });
  canvas.querySelectorAll('[data-line-endpoint]').forEach(handle=>handle.addEventListener('pointerdown',ev=>startLineEndpointDrag(ev,handle.dataset.markerId,handle.dataset.lineEndpoint)));
  updateFloorCommandState();
}
function markerIcon(t){ return {'起火點':'🔥','待救者':'🟢','死亡者':'🔴','入口':'🚪','水線':'💧','隔間':'▦','危害物':'☣️'}[t] || '•'; }
function markerClass(t){ return {'起火點':'fire','待救者':'rescue','死亡者':'fatal','入口':'entry','水線':'hose','隔間':'wall','危害物':'hazard'}[t] || ''; }
function floorPointFromEvent(ev){
  const rect = $('floorPlanCanvas').getBoundingClientRect();
  return { x:Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)), y:Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100)) };
}
function snapFloorEnd(start,end){
  const dx=end.x-start.x,dy=end.y-start.y; const len=Math.hypot(dx,dy); if(len<1) return end;
  const step=Math.PI/4; const angle=Math.round(Math.atan2(dy,dx)/step)*step;
  return {x:Math.max(0,Math.min(100,start.x+Math.cos(angle)*len)),y:Math.max(0,Math.min(100,start.y+Math.sin(angle)*len))};
}
function activeFloor(){ return Number($('floorPlanLevel')?.value || 1); }
function addFloorMarkerFromClick(ev){ /* pointer handler manages touch/click placement */ }
function handleFloorPlanPointerDown(ev){
  if(!currentCase || ev.target.closest('[data-marker-id]')) return;
  if(floorPlanLocked){ toast('圖面已鎖定，請先解除鎖定'); return; }
  ev.preventDefault();
  if(selectedFloorTool==='選取'){ floorSelectedId=null; renderFloorPlan(); return; }
  if(selectedFloorTool==='橡皮擦') return;
  const pt = floorPointFromEvent(ev);
  const tool = selectedFloorTool || '起火點';
  if(tool==='隔間' || tool==='水線'){
    recordFloorHistory();
    floorDrawState = {type:tool, start:pt, current:pt, pointerId:ev.pointerId};
    $('floorPlanCanvas').setPointerCapture?.(ev.pointerId);
    renderFloorPreviewLine(pt, pt, tool);
  } else {
    recordFloorHistory(); addFloorMarkerAtPoint(pt, tool, '');
  }
}
function handleFloorPlanPointerMove(ev){
  if(floorMarkerDrag?.active){
    const pt = floorPointFromEvent(ev); const drag=floorMarkerDrag; const m=drag.marker;
    if(drag.mode==='endpoint'){
      const fixed=drag.endpoint==='start'?{x:m.x2,y:m.y2}:{x:m.x,y:m.y}; const snapped=snapFloorEnd(fixed,pt);
      if(drag.endpoint==='start'){m.x=snapped.x;m.y=snapped.y;}else{m.x2=snapped.x;m.y2=snapped.y;}
    }else if(m.x2!==undefined){
      const dx=pt.x-drag.startPointer.x,dy=pt.y-drag.startPointer.y;
      m.x=Math.max(0,Math.min(100,drag.origin.x+dx));m.y=Math.max(0,Math.min(100,drag.origin.y+dy));
      m.x2=Math.max(0,Math.min(100,drag.origin.x2+dx));m.y2=Math.max(0,Math.min(100,drag.origin.y2+dy));
    }else{m.x=Math.round(pt.x*10)/10;m.y=Math.round(pt.y*10)/10;}
    drag.moved=true; renderFloorPlan(); return;
  }
  if(!floorDrawState) return;
  const pt = snapFloorEnd(floorDrawState.start,floorPointFromEvent(ev));
  floorDrawState.current = pt;
  renderFloorPreviewLine(floorDrawState.start, pt, floorDrawState.type);
}
function handleFloorPlanPointerUp(ev){
  if(floorMarkerDrag?.active){
    floorMarkerDrag.active=false; currentCase.buildingOps=getBuildingOps();
    const moved=floorMarkerDrag.moved; setTimeout(()=>{ if(floorMarkerDrag) floorMarkerDrag.moved=false; },250);
    if(moved) renderFloorPlan(); return;
  }
  if(!floorDrawState) return;
  const start=floorDrawState.start,end=snapFloorEnd(start,floorDrawState.current||floorPointFromEvent(ev)),type=floorDrawState.type;
  const dist=Math.hypot(end.x-start.x,end.y-start.y); removeFloorPreviewLine();
  if(dist>2) addFloorLine(start,end,type); else floorHistory.pop();
  floorDrawState=null; updateFloorCommandState();
}
function handleFloorPlanPointerCancel(){ floorDrawState=null; floorMarkerDrag=null; removeFloorPreviewLine(); }
function renderFloorPreviewLine(a,b,type){
  const canvas=$('floorPlanCanvas'); if(!canvas) return; removeFloorPreviewLine();
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.sqrt(dx*dx+dy*dy),angle=Math.atan2(dy,dx)*180/Math.PI;
  const div=document.createElement('div'); div.className=`floor-line preview ${type==='水線'?'hose':'wall'}`; div.dataset.preview='1'; div.style.left=a.x+'%'; div.style.top=a.y+'%'; div.style.width=len+'%'; div.style.transform=`rotate(${angle}deg)`; canvas.appendChild(div);
}
function removeFloorPreviewLine(){ document.querySelectorAll('#floorPlanCanvas [data-preview="1"]').forEach(x=>x.remove()); }
function addFloorMarkerAtPoint(pt,type,note=''){
  const ops=getBuildingOps(); ops.planMarkers=ops.planMarkers||[];
  ops.planMarkers.push({id:uid('marker'),floor:activeFloor(),type,x:Math.round(pt.x*10)/10,y:Math.round(pt.y*10)/10,label:type,note});
  currentCase.buildingOps=ops; renderFloorPlan();
}
function addFloorLine(a,b,type){
  const ops=getBuildingOps(); ops.planMarkers=ops.planMarkers||[];
  ops.planMarkers.push({id:uid('marker'),floor:activeFloor(),type,x:Math.round(a.x*10)/10,y:Math.round(a.y*10)/10,x2:Math.round(b.x*10)/10,y2:Math.round(b.y*10)/10,label:type,note:''});
  currentCase.buildingOps=ops; renderFloorPlan();
}
function addFloorMarkerFromDrop(ev){
  ev.preventDefault(); if(floorPlanLocked) return;
  const type=ev.dataTransfer?.getData('text/plain')||selectedFloorTool||'起火點'; const pt=floorPointFromEvent(ev); recordFloorHistory();
  if(type==='隔間'||type==='水線') addFloorLine({x:Math.max(0,pt.x-10),y:pt.y},{x:Math.min(100,pt.x+10),y:pt.y},type); else addFloorMarkerAtPoint(pt,type,'');
}
function addFloorMarkerAtEvent(ev,type){ const pt=floorPointFromEvent(ev); recordFloorHistory(); if(type==='隔間'||type==='水線') addFloorLine({x:Math.max(0,pt.x-10),y:pt.y},{x:Math.min(100,pt.x+10),y:pt.y},type); else addFloorMarkerAtPoint(pt,type,''); }
function startFloorMarkerDrag(ev,markerId){
  if(floorPlanLocked||selectedFloorTool==='橡皮擦') return;
  const ops=getBuildingOps(),m=ops.planMarkers?.find(x=>x.id===markerId); if(!m) return;
  const begin=()=>{ recordFloorHistory(); floorSelectedId=markerId; floorMarkerDrag={marker:m,active:true,moved:false,mode:'move',startPointer:floorPointFromEvent(ev),origin:{x:m.x,y:m.y,x2:m.x2,y2:m.y2}}; ev.target.setPointerCapture?.(ev.pointerId); toast('可拖曳移動標示'); };
  if(selectedFloorTool==='選取'){ ev.preventDefault();begin();return; }
  const timer=setTimeout(begin,350); const clear=()=>{clearTimeout(timer);ev.target.removeEventListener('pointerup',clear);ev.target.removeEventListener('pointercancel',clear);}; ev.target.addEventListener('pointerup',clear);ev.target.addEventListener('pointercancel',clear);
}
function startLineEndpointDrag(ev,markerId,endpoint){
  if(floorPlanLocked) return; ev.preventDefault();ev.stopPropagation();
  const m=getBuildingOps().planMarkers?.find(x=>x.id===markerId);if(!m)return;recordFloorHistory();floorSelectedId=markerId;
  floorMarkerDrag={marker:m,active:true,moved:false,mode:'endpoint',endpoint,startPointer:floorPointFromEvent(ev),origin:{x:m.x,y:m.y,x2:m.x2,y2:m.y2}};ev.target.setPointerCapture?.(ev.pointerId);
}
function deleteFloorMarker(markerId){
  const ops=getBuildingOps(),m=ops.planMarkers?.find(x=>x.id===markerId);if(!m)return;
  recordFloorHistory();ops.planMarkers=ops.planMarkers.filter(x=>x.id!==markerId);floorSelectedId=null;currentCase.buildingOps=ops;renderFloorPlan();toast('已刪除標示');
}
function editFloorMarker(markerId){
  const ops=getBuildingOps(),m=ops.planMarkers?.find(x=>x.id===markerId);if(!m)return;
  floorSelectedId=markerId;
  openActionSheet(`${floorLabel(m.floor)}｜${m.type}`,`<div class="field"><label>標示／線條備註</label><input id="floorMarkerNoteInput" value="${escapeHtml(m.note||'')}" placeholder="可留空，非必要不輸入文字" /></div><div class="quick-choice-row"><button type="button" class="btn small primary" id="saveFloorMarkerEditBtn">儲存</button><button type="button" class="btn small ghost" id="selectFloorMarkerMoveBtn">選取並移動</button><button type="button" class="btn small danger" id="deleteFloorMarkerBtn">刪除</button></div>`);
  $('saveFloorMarkerEditBtn')?.addEventListener('click',()=>{recordFloorHistory();m.note=$('floorMarkerNoteInput')?.value.trim()||'';currentCase.buildingOps=ops;closeActionSheet();renderFloorPlan();});
  $('selectFloorMarkerMoveBtn')?.addEventListener('click',()=>{selectedFloorTool='選取';closeActionSheet();selectFloorTool('選取',false);renderFloorPlan();toast('請直接拖曳選取的物件');});
  $('deleteFloorMarkerBtn')?.addEventListener('click',()=>{closeActionSheet();deleteFloorMarker(markerId);});
}
function copyAdjacentFloor(){
  if(!currentCase||floorPlanLocked)return;
  const target=activeFloor(),levels=floorsArray(),source=levels.filter(x=>x!==target).sort((a,b)=>Math.abs(a-target)-Math.abs(b-target))[0];
  if(source===undefined){toast('沒有其他樓層可複製');return;}
  const ops=getBuildingOps(),sourceMarkers=(ops.planMarkers||[]).filter(m=>Number(m.floor)===source);
  if(!sourceMarkers.length){toast(`${floorLabel(source)} 尚無圖面資料`);return;}
  if(!confirm(`確認將 ${floorLabel(source)} 的平面配置複製到 ${floorLabel(target)}？目前樓層標示會被取代。`))return;
  recordFloorHistory();ops.planMarkers=(ops.planMarkers||[]).filter(m=>Number(m.floor)!==target).concat(sourceMarkers.map(m=>({...cloneBuildingOps(m),id:uid('marker'),floor:target})));currentCase.buildingOps=ops;renderFloorPlan();toast('已複製相鄰樓層配置');
}
function toggleFloorPlanLock(){
  if(!currentCase)return;const ops=getBuildingOps();ops.locked=!ops.locked;floorPlanLocked=ops.locked;currentCase.buildingOps=ops;floorSelectedId=null;renderFloorPlan();toast(floorPlanLocked?'圖面已鎖定，可避免誤觸':'已解除圖面鎖定');
}
function clearActiveFloorPlan(){
  if(!currentCase||floorPlanLocked){toast('請先解除圖面鎖定');return;}const level=activeFloor();if(!confirm(`確認清除 ${floorLabel(level)} 的所有圖示與線條？`))return;
  recordFloorHistory();const ops=getBuildingOps();ops.planMarkers=(ops.planMarkers||[]).filter(m=>Number(m.floor)!==level);currentCase.buildingOps=ops;floorSelectedId=null;renderFloorPlan();toast('已清除本樓層圖面');
}
function updateOrientationHint(){
  const el=$('orientationHint');if(!el)return;const portrait=window.matchMedia?.('(orientation: portrait)').matches ?? window.innerHeight>window.innerWidth;
  let dismissed=false;try{dismissed=sessionStorage.getItem('firecommand_orientation_hint')==='1';}catch{}el.hidden=!portrait||dismissed||!$('buildingOpsDetails')?.open;
}
function dismissOrientationHint(){try{sessionStorage.setItem('firecommand_orientation_hint','1');}catch{}$('orientationHint')&&($('orientationHint').hidden=true);}
function injectKeyboardVoiceHelpers(){
  const ids=['sitrepDetail','patientNote','detailNotes','supportDetails','commandSituation','arrivalAddressNote','breakDoorNote','cordonNote'];
  ids.forEach(id=>{const input=$(id);if(!input||document.querySelector(`[data-keyboard-voice-target="${id}"]`))return;const helper=document.createElement('button');helper.type='button';helper.className='keyboard-voice-helper';helper.dataset.keyboardVoiceTarget=id;helper.textContent='🎙 使用手機鍵盤語音輸入';input.insertAdjacentElement('afterend',helper);});
}
function focusKeyboardVoiceTarget(id){
  const input=$(id);if(!input)return;input.focus({preventScroll:false});input.scrollIntoView({behavior:'smooth',block:'center'});toast('已開啟文字欄位；請點手機鍵盤上的麥克風進行語音轉文字。',4200);
}

function buildFireStatusFromSop(){
  const floor=normalizeFloorValue($('fireObservedFloor')?.value);
  const side=$('fireObservedSide')?.value || '';
  const location=`${floor}${side}`;
  const color=$('fireSmokeColor')?.value || '';
  const volume=$('fireSmokeVolume')?.value || '';
  const flame=$('fireFlameState')?.value || '';
  const custom=$('fireObservation')?.value.trim() || '';
  const clauses=[];
  if(color==='無明顯煙') clauses.push(`${location||'現場'}未見明顯煙`);
  else if(color || volume) clauses.push(`${location||'現場'}有${volume}${color||'煙霧'}竄出`);
  else if(location && flame) clauses.push(location);
  if(flame==='未見火舌') clauses.push('未見火舌');
  else if(flame==='可見火舌') clauses.push('並且可見火舌');
  else if(flame==='大量明火') clauses.push('可見大量明火');
  else if(flame==='全面燃燒') clauses.push('目前呈全面燃燒');
  let text=clauses.join('，');
  if(custom) text += `${text?'；':''}${custom.replace(/[。；]+$/,'')}`;
  return text;
}
function firstSidePhrase(){
  const mode=getRadioValue('firstSideMode');
  return mode==='custom' ? `律定${$('firstSideCustom')?.value.trim()||'指定位置'}為火場第一面` : '以建物正面為火場第一面';
}
function syncSopDerivedFields(){
  if($('detailFireStatus')) $('detailFireStatus').value=buildFireStatusFromSop();
  updateArrivalConditionalPanels();renderArrivalStatusCards();
}
function renderDeploymentSopSummary(){
  const el=$('deploymentSopSummary');if(!el)return;
  const crew=live.crews.length?live.crews.map(x=>`<div class="deployment-sop-row"><b>${escapeHtml(x.face||'未分面')}｜${escapeHtml(x.unit||'人員')}</b><span>${escapeHtml(x.task||x.status||'任務未填')}｜${Number(x.count)||0}人</span></div>`).join(''):'<div class="empty">尚無人員部署。</div>';
  const vehicles=live.vehicles.length?live.vehicles.map(x=>`<div class="deployment-sop-row"><b>${escapeHtml(x.name||x.unit||'車輛')}</b><span>${escapeHtml(x.task||'任務未填')}</span></div>`).join(''):'<div class="empty">尚無車輛部署。</div>';
  const hoses=live.hoses.length?`<div class="deployment-sop-row"><b>水線</b><span>${live.hoses.length} 條</span></div>`:'';
  el.innerHTML=`<div class="deployment-sop-group"><h4>人員</h4>${crew}</div><div class="deployment-sop-group"><h4>車輛／水線</h4>${vehicles}${hoses}</div>`;
}
function stageCompletion(stage){
  const c=currentCase||{}; const states={
    到:[!!c.addressConfirmed,!!c.commandTransfer,!!c.firstSideSet],
    建:[!!c.purpose,!!c.floors,!!c.fireFloor],
    火:[!!(c.fireObservation||c.fireStatus)],
    人:[c.contactState==='found'||c.contactState==='notfound',c.trapped==='有'||c.trapped==='無',c.hazardState==='none'||c.hazardState==='has'],
    支:[c.supportState==='none'||c.supportState==='needed'],
    初:[!!(live.crews.length||live.vehicles.length),!!c.ritSet,!!c.parRequested],
    破:[c.breakDoorState==='none'||c.breakDoorState==='required'],
    警:[c.cordonState==='set']
  }[stage]||[]; return {done:states.filter(Boolean).length,total:states.length};
}
function updateStageCompletion(){
  document.querySelectorAll('[data-stage]').forEach(btn=>{const st=stageCompletion(btn.dataset.stage);btn.classList.toggle('stage-complete',st.total>0&&st.done===st.total);btn.classList.toggle('stage-partial',st.done>0&&st.done<st.total);btn.classList.toggle('stage-missing',st.done===0);btn.dataset.progress=`${st.done}/${st.total}`;});
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
  const ops=getBuildingOps();
  const hasFloor=(ops.floorActions||[]).some(x=>x.action && x.action!=='未標示');
  const hasPlan=(ops.planMarkers||[]).length>0;
  const hasExternal=live.vehicles.length||live.crews.length||live.hoses.length||live.hazards.length;
  if(!hasFloor && !hasPlan && !hasExternal) return ['目前尚未建立建物內部作戰圖或外部戰術部署圖。'];
  const parts=[];
  if(hasExternal) parts.push(`外部戰術部署已登錄車輛${live.vehicles.length}台、人員${sum(live.crews,'count')}人、水線${live.hoses.length}條及危害標示${live.hazards.length}處`);
  if(hasFloor||hasPlan) parts.push('建物縱向剖面與水平俯視圖已依現場紀錄完成彙整');
  return [`${parts.join('；')}。詳細位置與圖示以本節附圖為準。`];
}
function localTacticalAdviceText(){
  if(!currentCase) return '';
  const c = currentCase;
  const tips = [];
  tips.push(`【態勢摘要】${c.floors||'?'}樓${c.purpose||''}建物，起火樓層：${floorText(c.fireFloor,'未明')}，火煙：${c.fireStatus||'未明'}，受困：${c.trapped||'未知'} ${c.trappedCount||0}人。`);
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
  $('aiAdviceStatus') && ($('aiAdviceStatus').textContent = '已依目前資料產生注意事項建議。');
  if(showToast) toast('已產生本機規則建議');
  return text;
}
async function requestAiAdvice(options={}){
  if(!currentCase) return;
  const last = Number(currentCase.aiLastAt || 0);
  if(!isSuperAdmin() && Date.now() - last < AI_COOLDOWN_MS){
    const min = Math.ceil((AI_COOLDOWN_MS - (Date.now()-last))/60000);
    updateAiAdviceButton(); if(!options.silent) toast(`AI 建議每 15 分鐘最多一次，請 ${min} 分鐘後再試`); return;
  }
  $('aiAdviceStatus') && ($('aiAdviceStatus').textContent = '正在呼叫 AI，請稍候…');
  try{
    const payload = { mode:'advice', caseData: currentCase, vehicles: live.vehicles, crews: live.crews, hoses: live.hoses, hazards: live.hazards, sitreps: live.sitreps, logs: live.logs, buildingOps: getBuildingOps(), localRules: localTacticalAdviceText() };
    const res = await fetch('/api/ai-advice', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'AI 呼叫失敗');
    $('aiAdviceText').value = data.advice || '';
    $('aiAdviceStatus').textContent = `AI 建議已更新：${fmtTime(Date.now())}`; updateAiAdviceButton();
    const patch = { aiLastAt: Date.now(), aiLastAdvice: data.advice || '', updatedAt:Date.now() };
    Object.assign(currentCase, patch);
    if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase();
    await addLog('ai','產生 OpenAI 戰術建議');
  }catch(err){
    $('aiAdviceStatus').textContent = `已依目前資料產生注意事項建議；AI 暫時無法更新。`;
    renderLocalTacticalAdvice(false);
    updateAiAdviceButton();
    if(!options.silent) toast('已先顯示注意事項建議');
  }
}


function updateAiAdviceButton(){
  const btn = $('aiAdviceBtn'); if(!btn) return;
  if(isSuperAdmin()){ btn.textContent = '產生 / 更新 AI 建議（最高管理員不限次數）'; btn.disabled = false; return; }
  const last = Number(currentCase?.aiLastAt || 0);
  const remain = Math.max(0, AI_COOLDOWN_MS - (Date.now()-last));
  if(remain>0){ const min=Math.ceil(remain/60000); btn.textContent = `產生 / 更新 AI 建議（${min}分後可更新）`; btn.disabled = true; }
  else { btn.textContent = '產生 / 更新 AI 建議'; btn.disabled = false; }
}
function maybeAutoAiAdvice(){
  if(!currentCase || currentCase._autoAiChecked) return;
  currentCase._autoAiChecked = true;
  if(currentCase.aiLastAdvice){ $('aiAdviceText') && ($('aiAdviceText').value = currentCase.aiLastAdvice); updateAiAdviceButton(); return; }
  renderLocalTacticalAdvice(false);
  requestAiAdvice({silent:true});
}
setInterval(updateAiAdviceButton, 30000);
init();
