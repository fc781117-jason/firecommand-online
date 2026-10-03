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
let live = { vehicles: [], crews: [], hoses: [], hazards: [], sitreps: [], logs: [], players: [], simulationEvents: [], practiceResponses: [], practiceMessages: [], hazardReferences: [] };
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
let buildingBoxRotationMarker = null;
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
let tacticalVehicleSelectionV3 = '';
let tacticalHoseSelectionV3 = '';
let tacticalSceneV3 = null;
let tacticalObjectSelectionV31 = null;
let tacticalPointerV31 = null;
let tacticalSuppressClickUntilV31 = 0;
let pendingDeploymentVehicles = [];
let mapUndoStack = [];
let derivedSummaryTimer = null;
let suppressMapUndo = false;
let floorHistory = [];
let floorRedoStack = [];
let floorPlanLocked = false;
let floorSelectedId = null;
let suppressFloorHistory = false;
let reportOverlayHistoryActive = false;
let reportReturnState = null;
let lastMapDiagnostics = '';
let homeMode = 'live';
let practiceSourceFile = null;
let practiceTickTimer = null;
let practiceReleaseBusy = false;
let deploymentTextSource = 'manual';
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
  fillRangeSelect('deploymentCrewCount',0,20,'4');
  if($('deploymentCrewCount')?.firstElementChild) $('deploymentCrewCount').firstElementChild.textContent='0 人／僅登錄車輛';
}

function init(){
  fillUnitFlat('profileBrigade','profileUnit','第三大隊');
  fillUnitFlat('deploymentBrigade','deploymentUnit','第三大隊');
  fillUnitFlat('sitrepBrigade','sitrepUnit','第三大隊');
  fillUnitFlat('patientBrigade','patientUnit','第三大隊');
  fillTrappedSelect('summaryTrappedCountMode');
  fillTrappedSelect();
  initQuickChoiceSelects();
  syncCasePurposeFromType();
  updatePracticeSourceFields();
  bindEvents();
  injectKeyboardVoiceHelpers();
  updateOrientationHint();
  initFirebase();
}

function bindEvents(){
  $('googleLoginBtn').addEventListener('click', loginGoogle);
  $('retryLoginBtn')?.addEventListener('click', loginGoogle);
  $('reloadAppBtn')?.addEventListener('click', () => location.reload());
  $('demoLoginBtn')?.addEventListener('click', loginDemo);
  $('previewDemoLiveV31')?.addEventListener('click',()=>openPreviewDemoV31('live'));
  $('previewDemoPracticeV31')?.addEventListener('click',()=>openPreviewDemoV31('practice'));
  $('previewDemoResetV31')?.addEventListener('click',resetPreviewDemoV31);
  $('patientRecordV31')?.addEventListener('change',prefillPatientRecordV31);
  $('logoutBtn').addEventListener('click', logout);
  $('approvalLogoutBtn')?.addEventListener('click', logout);
  $('adminManageBtn')?.addEventListener('click', () => { if(!isSuperAdmin())return; const section=$('adminSection'); if(section){section.hidden=false;section.scrollIntoView({behavior:'smooth'});} if(!adminUsersLoaded)loadUsersForAdmin(); });
  $('profileQuickEditBtn')?.addEventListener('click', openProfileQuickEdit);
  $('refreshUsersBtn')?.addEventListener('click', loadUsersForAdmin);
  bindAccountAdminControls();
  $('profileForm').addEventListener('submit', saveProfile);
  $('caseForm').addEventListener('submit', createCase);
  $('caseType')?.addEventListener('change', syncCasePurposeFromType);
  $('casePurpose')?.addEventListener('change',()=>{ $('casePurpose').dataset.autoValue=''; });
  $('addVictimBtn').addEventListener('click', () => addVictimRow());
  $('caseTrapped').addEventListener('change', syncVictimDetails);
  $('caseTrappedCountMode').addEventListener('change', syncVictimDetails);
  $('refreshBtn').addEventListener('click', renderCases);
  $('liveModeBtn')?.addEventListener('click', () => setHomeMode('live'));
  $('practiceModeBtn')?.addEventListener('click', () => setHomeMode('practice'));
  $('joinPracticeRoomBtn')?.addEventListener('click', joinPracticeRoom);
  $('practiceJoinCode')?.addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);});
  $('createPracticeRoomBtn')?.addEventListener('click', createPracticeRoom);
  $('practiceSourceFile')?.addEventListener('change', handlePracticeSourceFile);
  document.querySelectorAll('input[name="practiceSource"]').forEach(el=>el.addEventListener('change', updatePracticeSourceFields));
  $('backHomeBtn').addEventListener('click', backHome);
  $('saveCaseInfoBtn').addEventListener('click', () => saveCaseInfo(true,true,true));
  $('caseFloors')?.addEventListener('change',()=>fillFloorLocationSelect('caseFireFloor',$('caseFloors').value||50,$('caseFireFloor').value));
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
  window.addEventListener('pageshow', () => { ensureReportOverlayUsable(); recoverExistingAuth(); });
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
  document.querySelectorAll('.support-grid input').forEach(ch => ch.addEventListener('change', () => { updateSupportStatus(); fieldEntryStatus('supportSaveStatus','尚未儲存'); }));
  $('fitMapBtn')?.addEventListener('click', fitMapToIncident);
  $('mapUndoBtn')?.addEventListener('click', undoLastMapAction);
  $('cancelHoseSelection')?.addEventListener('click',()=>{pendingTool=null;selectedMapResource=null;clearTacticalSelectionV31();tacticalHoseSelectionV3='';setDeploymentMode('select');renderTacticalCanvasV3();toast('已取消選取');});
  $('mapBuildingUnlockBtn')?.addEventListener('click', () => setBuildingBoxLock(false));
  $('mapBuildingLockBtn')?.addEventListener('click', () => setBuildingBoxLock(true));
  $('deploymentVehicleCode')?.addEventListener('change', syncDeploymentVehicleManualField);
  $('addPendingVehicleBtn')?.addEventListener('click', addPendingDeploymentVehicle);
  $('addDeploymentGroupBtn')?.addEventListener('click', addDeploymentGroup);
  initFieldEntryControls();
  document.querySelectorAll('.hazard-btn').forEach(btn => btn.addEventListener('click', () => startHazardTool(btn.dataset.hazard)));
  $('generateReportBtn')?.addEventListener('click', () => generateAIReport(true));
  $('saveExtraBtn')?.addEventListener('click', saveExtraNotes);
  $('addSitrepBtn')?.addEventListener('click', addSitrep);
  $('addPatientSitrepBtn')?.addEventListener('click', addPatientSitrep);
  $('sitrepNowBtn')?.addEventListener('click', setSitrepNow);
  $('patientNowBtn')?.addEventListener('click', setPatientNow);
  $('togglePracticeRunBtn')?.addEventListener('click', safeRun27(togglePracticeRun));
  $('releaseNextPracticeEventBtn')?.addEventListener('click', safeRun27(releaseNextPracticeEvent));
  $('fillPracticeAiBtn')?.addEventListener('click', fillPracticeAiRoles);
  $('addPracticeCustomEventBtn')?.addEventListener('click', safeRun27(addPracticeCustomEvent));
  $('generateAssessmentBtn')?.addEventListener('click', generateAssessmentReport);
  $('aiAssessmentBtn')?.addEventListener('click', requestAiAssessment);
  $('closeCaseBtn')?.addEventListener('click', closeCase);
  $('reopenCaseBtn')?.addEventListener('click', reopenCase);
  $('syncFloorsBtn')?.addEventListener('click', syncBuildingFloors);
  $('saveBuildingOpsBtn')?.addEventListener('click', saveBuildingOps);
  $('saveDeploymentTextBtn')?.addEventListener('click', saveDeploymentTextRecord);
  $('checkDeploymentConsistencyBtn')?.addEventListener('click', confirmDeploymentConsistency);
  $('aiDeploymentSummaryBtn')?.addEventListener('click', generateAiDeploymentSummary);
  $('deploymentTextRecord')?.addEventListener('input', () => { deploymentTextSource='manual'; renderDeploymentTextReference(true); });
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
  $('addContactBtn')?.addEventListener('click', addContactRow);
  $('hazardSaveBtn')?.addEventListener('click', saveHazardRecord);
  $('hazardPhoto')?.addEventListener('change',event=>{showLocalPhotoPreview(event.target.files[0],$('hazardPhotoPreview'));fieldEntryStatus('hazardSaveStatus','尚未儲存');});
  ['hazardItems','hazardContact','hazardPhone','hazardAppearance'].forEach(id=>$(id)?.addEventListener('input',()=>fieldEntryStatus('hazardSaveStatus','尚未儲存')));
  $('supportSaveBtn')?.addEventListener('click',saveSupportRequests);
  $('supportDetails')?.addEventListener('input',()=>fieldEntryStatus('supportSaveStatus','尚未儲存'));
  document.querySelectorAll('[data-support-kind]').forEach(btn=>btn.addEventListener('click',()=>{$(btn.dataset.supportKind==='fire'?'fireSupportFields':'externalSupportFields').hidden=false;btn.classList.add('selected');}));
  $('addExternalSupportBtn')?.addEventListener('click',()=>addExternalSupportRow());
  $('ritSaveBtn')?.addEventListener('click',saveRitUnit);
  document.querySelectorAll('.arrival-detail-input').forEach(el => el.addEventListener('change', () => { renderArrivalStatusCards(); renderCommandGuide(); if(!['contactState','ritState','hazardState','supportState'].includes(el.name))saveCaseInfo(false,false); }));
  ['detailPurpose','detailFireStatus','detailNotes','buildingStructure','detailFloors','detailFireFloor','fireObservedFloor','fireObservedSide','fireSmokeColor','fireSmokeVolume','fireFlameState','fireObservation','trappedCountArrival','arrivalAddressInput','firstSideCustom'].forEach(id => $(id)?.addEventListener('change', () => { syncSopDerivedFields(); renderCommandGuide(); saveCaseInfo(false,false); }));
  bindExclusiveDetails(['crewStatusDetails','vehicleStatusDetails']);
  bindExclusiveDetails(['sitrepFireDetails','sitrepPatientDetails']);
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
  if(action === 'unlockBuildingBox') return setBuildingBoxLock(false);
  if(action === 'lockBuildingBox') return setBuildingBoxLock(true);
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

let previewTargetVerifiedV31=false;
async function previewDeploymentModeV31(){
  try{const response=await fetch('/api/preview-mode',{cache:'no-store',credentials:'same-origin'});if(!response.ok)return null;const result=await response.json();return ['preview','production','development'].includes(result?.target)&&typeof result.demoEnabled==='boolean'?result:null;}catch{return null;}
}
async function initFirebase(){
  previewTargetVerifiedV31=false;
  const candidateHost=FCFieldEntry.isolatedPreviewHost(window.location?.hostname);
  const mode=candidateHost?await previewDeploymentModeV31():null;
  const isolatedPreview=previewTargetVerifiedV31=!!(candidateHost&&mode?.target==='preview'&&mode.demoEnabled===true);
  if(candidateHost&&!isolatedPreview&&mode?.target!=='production'){
    firebaseEnabled=false;if($('demoLoginBtn'))$('demoLoginBtn').hidden=true;
    if($('googleLoginBtn')){$('googleLoginBtn').disabled=true;$('googleLoginBtn').textContent='無法確認此部署為授權 Preview，請由最新 Preview 連結進入';}
    show('authScreen');return;
  }
  firebaseEnabled = Boolean(
    !isolatedPreview &&
    typeof firebase !== 'undefined' &&
    window.FIRECOMMAND_FIREBASE_ENABLED === true &&
    window.FIRECOMMAND_FIREBASE_CONFIG &&
    window.FIRECOMMAND_FIREBASE_CONFIG.apiKey &&
    !String(window.FIRECOMMAND_FIREBASE_CONFIG.apiKey || '').includes('PASTE_')
  );
  const demoBtn = $('demoLoginBtn');
  if(demoBtn) demoBtn.hidden = !isolatedPreview;
  if(!firebaseEnabled){
    const loginBtn = $('googleLoginBtn');
    if(loginBtn){
      loginBtn.disabled = true;
      loginBtn.textContent = isolatedPreview?'Preview 隔離模式：請使用示範進入':'系統連線尚未完成，請聯絡管理員';
    }
    if(isolatedPreview&&localState.previewDemoSession?.active){loginDemo();return;}
    show('authScreen');
    return;
  }
  try {
    if(!firebase.apps.length) firebase.initializeApp(window.FIRECOMMAND_FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    auth.useDeviceLanguage?.();
    const persistence=await setAuthPersistence28(auth,firebase.auth.Auth.Persistence);
    if(persistence!=='LOCAL')$('authMethod28').textContent='此瀏覽器無法保留長期登入，關閉後可能需要重新登入。';
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
  setupIdentity28();
  auth.onAuthStateChanged(async user => {
    fbUser = user;
    if(!user){ show('authScreen'); return; }
    await handleAuthenticatedUser(user);
  });
}

async function loginGoogle(){
  if(!firebaseEnabled){ toast('系統連線尚未完成，請確認 Firebase 設定檔已上傳。', 4000); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  try{
    $('googleLoginBtn') && ($('googleLoginBtn').disabled=true);
    await auth.signInWithPopup(provider);
  }catch(err){
    const message=authErrorMessage28(err);
    showAuthRecovery(message);
  }finally{
    $('googleLoginBtn') && ($('googleLoginBtn').disabled=false);
  }
}
async function handleAuthenticatedUser(user){
  if(!user || !db) return;
  fbUser=user;
  try{
    const adminEmail = isSuperAdminEmail(user.email);
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
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
  }catch(err){
    console.error('登入後資料讀取失敗',err);
    showAuthRecovery('帳號已登入，但目前無法讀取使用者資料。請確認網路後重新載入，不需要重建案件。');
  }
}
function isEmbeddedIosBrowser(){
  const ua=navigator.userAgent||'';
  const ios=/iPhone|iPad|iPod/i.test(ua);
  const safari=/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  const standalone=window.navigator.standalone===true;
  return ios && (!safari || (!standalone && /ChatGPT|FBAN|FBAV|Instagram|Line\//i.test(ua)));
}
function showAuthRecovery(message='登入狀態已失效，請重新登入。'){
  const card=$('authRecoveryCard'), msg=$('authRecoveryMessage');
  if(msg) msg.textContent=message;
  if(card) card.hidden=false;
  if(!auth?.currentUser) show('authScreen');
}
async function recoverExistingAuth(){
  if(auth?.currentUser && (!profile || document.body.dataset.view==='authScreen')) await handleAuthenticatedUser(auth.currentUser);
}
function isPreviewDemoV31(){return previewTargetVerifiedV31&&!firebaseEnabled&&FCFieldEntry.isolatedPreviewHost(window.location?.hostname)&&fbUser?.uid==='demo-user';}
function loginDemo(){
  if(!previewTargetVerifiedV31||firebaseEnabled||!FCFieldEntry.isolatedPreviewHost(window.location?.hostname))return;
  fbUser={uid:'demo-user',email:'demo@local.test',displayName:'合成示範使用者'};
  profile={id:'demo-user',email:'demo@local.test',realName:'合成示範使用者',callName:'示範指揮官',fireCallSign:'示範01',brigade:'第三大隊',unit:'淡水',title:'隊員',role:'commander',status:'active',approvedBy:'preview-isolated-demo',isSuperAdmin:false};
  const saved=localState.previewDemoProfile||{};for(const field of ['callName','fireCallSign'])if(typeof saved[field]==='string'&&saved[field].trim())profile[field]=saved[field].trim();
  localState=window.FCPreviewDemoV31.seed(localState,profile);
  const remembered=localState.previewDemoSession?.caseId;
  localState.previewDemoSession={active:true,caseId:remembered||window.FCPreviewDemoV31.IDS.live};saveLocalState();
  enterApp();renderPreviewDemoControlsV31();
  const id=localState.cases.some(c=>c.id===remembered&&window.FCPreviewDemoV31.isDemoCase(c))?remembered:window.FCPreviewDemoV31.IDS.live;
  openCase(id);
}
function assertDemoCaseAccessV31(record=currentCase){
  if(isPreviewDemoV31()&&!window.FCPreviewDemoV31.isDemoCase(record))throw Error('隔離示範僅可操作指定的合成示範案件');
}
function saveLocalProfileV31(){
  if(isPreviewDemoV31())localState.previewDemoProfile={callName:profile.callName,fireCallSign:profile.fireCallSign};
  else localState.profile=profile;
  saveLocalState();
}
function renderPreviewDemoControlsV31(){
  const demo=isPreviewDemoV31(),panel=$('previewDemoControlsV31');if(panel)panel.hidden=!demo;
  for(const id of ['createCaseDetails','practiceCreateDetails'])if($(id))$(id).hidden=demo;
}
function openPreviewDemoV31(mode='live'){
  if(!isPreviewDemoV31())return;localState=window.FCPreviewDemoV31.seed(localState,profile);saveLocalState();
  openCase(window.FCPreviewDemoV31.IDS[mode==='practice'?'practice':'live']);
}
function resetPreviewDemoV31(){
  if(!isPreviewDemoV31()||!confirm('重設本機的兩個合成示範案件？只清除示範案件中的測試修改，不影響其他案件。'))return;
  const mode=currentCase?.mode==='practice'?'practice':'live';
  localState=window.FCPreviewDemoV31.reset(localState,profile);saveLocalState();openPreviewDemoV31(mode);toast('合成示範資料已重設');
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
  clearIntake28();window.google?.accounts?.id?.disableAutoSelect();
  cleanupSubscriptions(); currentCaseId=null; currentCase=null;
  adminUsers=[];adminUsersLoaded=false;setAdminPendingBadge(0);
  if(firebaseEnabled) await auth.signOut();
  else { if(isPreviewDemoV31()){localState.previewDemoSession={active:false};saveLocalState();}fbUser=null; profile=null;renderPreviewDemoControlsV31();show('authScreen'); }
}
async function saveProfile(e){
  e.preventDefault();
  const isAdminEmail = isSuperAdminEmail(fbUser.email);
  // Isolated Preview hosts intentionally run without Firebase. Let the local-only
  // demo identity enter the app so the real SOP/deployment routes can be verified,
  // while keeping every Firebase-backed account on the normal approval path.
  const isIsolatedPreviewDemo = previewTargetVerifiedV31 && !firebaseEnabled
    && FCFieldEntry.isolatedPreviewHost(location.hostname)
    && fbUser.uid === 'demo-user';
  const isImmediatelyActive = isAdminEmail || isIsolatedPreviewDemo;
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
    status: isImmediatelyActive ? 'active' : 'pending',
    approvedBy: isAdminEmail ? SUPER_ADMIN_EMAIL : (isIsolatedPreviewDemo ? 'preview-isolated-demo' : ''),
    approvedAt: isImmediatelyActive ? Date.now() : null,
    isSuperAdmin: isAdminEmail,
    updatedAt: Date.now(),
    createdAt: profile?.createdAt || Date.now()
  };
  if(firebaseEnabled) await db.collection('users').doc(fbUser.uid).set(profile,{merge:true});
  else { saveLocalProfileV31(); }
  if(!canEnterSystem()){ showApprovalScreen(); return; }
  enterApp();
}
function enterApp(){
  show('appScreen'); $('homePage').hidden=false; $('detailPage').hidden=true;
  $('authRecoveryCard') && ($('authRecoveryCard').hidden=true);
  $('userLine').textContent = `${radioCallSign()}｜${profile.callName}｜${profile.brigade} / ${profile.unit}`;
  $('userLine').title = '點此修改火場／無線電代號與顯示稱呼';
  setWatermark();
  const admin = isSuperAdmin();
  $('adminManageBtn') && ($('adminManageBtn').hidden = !admin);
  $('adminSection') && ($('adminSection').hidden = true);
  if($('accountAdminDetails'))$('accountAdminDetails').open=false;
  if($('deploymentBrigade')){
    $('deploymentBrigade').value = profile.brigade || '第三大隊';
    $('deploymentBrigade').dispatchEvent(new Event('change'));
    if(profile.unit && $('deploymentUnit')) $('deploymentUnit').value = profile.unit;
  }
  syncDeploymentVehicleManualField();
  renderPendingDeploymentVehicles();
  $('sitrepBrigade') && ($('sitrepBrigade').value = profile.brigade || '第三大隊'); $('sitrepBrigade')?.dispatchEvent(new Event('change'));
  if(profile.unit && $('sitrepUnit')){ $('sitrepUnit').value = profile.unit; }
  $('patientBrigade') && ($('patientBrigade').value = profile.brigade || '第三大隊'); $('patientBrigade')?.dispatchEvent(new Event('change'));
  if(profile.unit && $('patientUnit')){ $('patientUnit').value = profile.unit; }
  setSitrepNow(); setPatientNow(); setHomeMode(homeMode,false);
  $('createCaseDetails').open = false;
  subscribeCases();
  if(admin)watchUsersForAdmin();
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
  else { saveLocalProfileV31(); }
  $('userLine').textContent=`${radioCallSign()}｜${profile.callName}｜${profile.brigade} / ${profile.unit}`;
  closeActionSheet();renderCommandGuide();toast('已更新火場代號');
}
function cleanupSubscriptions(){ unsubscribers.forEach(fn => { try{fn()}catch{} }); unsubscribers=[]; stopPracticeTicker(); }
function subscribeCases(){
  cleanupSubscriptions();
  if(firebaseEnabled){
    const unsub = db.collection('cases').where('brigade','==',profile.brigade).onSnapshot(snap => {
      cases = snap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      renderCases();
    }, err => toast(`案件讀取失敗：${err.message}`));
    unsubscribers.push(unsub);
  } else {
    cases = localState.cases.filter(c => (!profile?.brigade || c.brigade === profile.brigade)&&(!isPreviewDemoV31()||window.FCPreviewDemoV31.isDemoCase(c)));
    renderCases();
  }
}
function renderCases(){
  const wrap = $('caseList');
  const liveCases=cases.filter(c=>c.mode!=='practice');
  if(!liveCases.length) wrap.innerHTML='<div class="empty">目前尚無實戰案件。請展開「新增案件 / 貼上派遣令」建立第一筆案件。</div>';
  else wrap.innerHTML = liveCases.map(c => `
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
  renderPracticeRooms();
}
function setHomeMode(mode='live', scroll=true){
  homeMode=mode==='practice'?'practice':'live';
  $('liveHomePanel') && ($('liveHomePanel').hidden=homeMode!=='live');
  $('practiceHomePanel') && ($('practiceHomePanel').hidden=homeMode!=='practice');
  [['liveModeBtn','live'],['practiceModeBtn','practice']].forEach(([id,key])=>{
    const btn=$(id); if(!btn)return; const active=homeMode===key;
    btn.classList.toggle('active',active); btn.setAttribute('aria-selected',active?'true':'false');
  });
  if(homeMode==='practice') renderPracticeRooms(); else renderCases();
  if(scroll) document.querySelector('.home-mode-switch')?.scrollIntoView({block:'start',behavior:'smooth'});
}
function renderPracticeRooms(){
  const wrap=$('practiceRoomList'); if(!wrap)return;
  const rooms=cases.filter(c=>c.mode==='practice' && c.practiceStatus!=='closed');
  wrap.innerHTML=rooms.length?rooms.map(c=>`<article class="case-card practice-room-card">
    <div class="case-card-head"><span class="case-no">練習房號｜${escapeHtml(c.roomCode||'------')}</span><button class="btn small danger" data-join-practice="${c.id}">加入／繼續</button></div>
    <div class="case-address">${escapeHtml(c.scenarioTitle||c.summary||'未命名虛擬火場')}</div>
    <div class="case-summary">${escapeHtml(c.scenarioBrief||c.initialSummary||'等待房主設定情境')}</div>
    <div class="tag-row"><span class="tag amber">練習模式</span><span class="tag">${escapeHtml(practiceDifficultyLabel(c.practiceDifficulty))}</span><span class="tag ${c.practiceStatus==='running'?'red':'green'}">${escapeHtml(practiceStatusLabel(c.practiceStatus))}</span></div>
  </article>`).join(''):'<div class="empty">目前沒有可加入的練習房間；你可以先建立一間。</div>';
  wrap.querySelectorAll('[data-join-practice]').forEach(btn=>btn.addEventListener('click',()=>joinPracticeCaseById(btn.dataset.joinPractice,$('practiceJoinRole')?.value||'觀察員')));
}

function practiceDifficultyLabel(value='standard'){ return ({basic:'基礎',standard:'標準',advanced:'進階'})[value]||'標準'; }
function practiceStatusLabel(value='waiting'){ return ({waiting:'等待開始',running:'演練進行中',paused:'演練暫停',completed:'演練完成',closed:'已關閉'})[value]||'等待開始'; }
function selectedPracticeSource(){ return document.querySelector('input[name="practiceSource"]:checked')?.value||'manual'; }
function updatePracticeSourceFields(){
  const source=selectedPracticeSource();
  $('practiceManualFields') && ($('practiceManualFields').hidden=source!=='manual');
  $('practiceAiFields') && ($('practiceAiFields').hidden=source!=='ai');
  $('practiceFileFields') && ($('practiceFileFields').hidden=source!=='file');
}
function fileAsDataUrl(file){
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(reader.error||new Error('檔案讀取失敗'));reader.readAsDataURL(file);});
}
async function handlePracticeSourceFile(event){
  const file=event.target.files?.[0]; practiceSourceFile=null;
  if(!file){$('practiceFileStatus') && ($('practiceFileStatus').textContent='尚未選擇檔案。');return;}
  if(file.size>3*1024*1024){event.target.value='';toast('案例檔案請控制在 3MB 以內');return;}
  try{
    const text=/^(text\/|application\/(json|csv))/.test(file.type)||/\.(txt|md|json|csv)$/i.test(file.name)?await file.text():'';
    const dataUrl=text?'':await fileAsDataUrl(file);
    practiceSourceFile={name:file.name,type:file.type||'application/octet-stream',size:file.size,text:text.slice(0,24000),dataUrl};
    $('practiceFileStatus') && ($('practiceFileStatus').textContent=`已選擇：${file.name}（${Math.ceil(file.size/1024)} KB）`);
  }catch(err){toast(`檔案讀取失敗：${err.message}`);}
}
function generatePracticeRoomCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for(let attempt=0;attempt<20;attempt++){
    let code='';for(let i=0;i<6;i++)code+=alphabet[Math.floor(Math.random()*alphabet.length)];
    if(!cases.some(c=>c.roomCode===code)) return code;
  }
  return String(Date.now()).slice(-6);
}
function localPracticeScenario({title='',brief='',difficulty='standard',focus='',sourceText=''}){
  const scenarioBrief=brief||sourceText.slice(0,420)||`${practiceDifficultyLabel(difficulty)}住宅火警演練：三樓第二面冒出濃煙，關係人表示可能有人受困，巷道及水源狀況尚待確認。`;
  const scenarioTitle=title||'住宅火警動態指揮演練';
  const events=[
    {severity:'info',title:'初期偵察更新',detail:'第一到達單位回報第二面三樓有濃煙，請完成建物、火煙與人命風險判讀。'},
    {severity:'warning',title:'火勢發展',detail:'風向改變，第三面上層窗戶開始出煙，請判斷延燒路徑並調整水線與分區部署。'},
    {severity:'critical',title:'人命資訊更新',detail:'關係人補充屋內可能有一名行動不便長者，最後位置在起火樓層後側房間。'},
    {severity:'warning',title:'戰力與水源變化',detail:'主攻水線壓力下降，鄰近單位正在尋找替代水源；請維持備援水線與人員安全。'},
    {severity:difficulty==='advanced'?'critical':'warning',title:'安全事件',detail:difficulty==='advanced'?'內攻小組回報一名隊員失聯，請啟動 RIT、PAR 與緊急回報程序。':'建物內部溫度快速上升，請重新確認內攻條件、撤退路線與 RIT。'}
  ];
  if(focus) events.splice(2,0,{severity:'warning',title:'教官指定重點',detail:focus});
  return {title:scenarioTitle,brief:scenarioBrief,purpose:'住宅',buildingStructure:'RC',floors:5,fireFloor:'3樓',fireStatus:'3樓第二面有大量濃黑煙竄出',trapped:'有',trappedCount:1,events};
}
function parseScenarioResult(value){
  if(value && typeof value==='object') return value;
  const clean=String(value||'').replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  try{return JSON.parse(clean);}catch{return null;}
}
async function requestPracticeScenario(payload){
  const response=await authenticatedAI('/api/ai-advice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'simulation_setup',practice:payload,sourceFile:practiceSourceFile})});
  const data=await response.json(); if(!response.ok) throw new Error(data.error||'AI 情境產生失敗');
  return parseScenarioResult(data.scenario||data.advice);
}
function normalizePracticeScenario(raw,fallback){
  const value=raw&&typeof raw==='object'?raw:fallback;
  const provided=Array.isArray(value.events)?value.events:[];
  const combined=[...provided,...fallback.events].filter((item,index,all)=>all.findIndex(other=>String(other?.title||'')===String(item?.title||'')&&String(other?.detail||other?.content||'')===String(item?.detail||item?.content||''))===index);
  const events=combined.slice(0,Math.max(5,Math.min(8,provided.length||fallback.events.length)));
  return {
    title:String(value.title||fallback.title).slice(0,80),brief:String(value.brief||fallback.brief).slice(0,1600),
    purpose:String(value.purpose||fallback.purpose||'住宅'),buildingStructure:String(value.buildingStructure||fallback.buildingStructure||'RC'),
    floors:Math.max(1,Math.min(50,Number(value.floors)||fallback.floors||3)),fireFloor:normalizeFloorValue(value.fireFloor||fallback.fireFloor||'1樓'),
    fireStatus:String(value.fireStatus||fallback.fireStatus||''),trapped:['有','無','未知'].includes(value.trapped)?value.trapped:fallback.trapped,
    trappedCount:Math.max(0,Number(value.trappedCount)||0),events:events.map((x,i)=>({order:i+1,title:String(x.title||`情境更新 ${i+1}`).slice(0,100),detail:String(x.detail||x.content||'現場狀況更新').slice(0,1200),severity:['info','warning','critical'].includes(x.severity)?x.severity:'warning',timeLimitSec:Math.max(30,Math.min(900,Number(x.timeLimitSec)||[180,180,120,300,30][i%5]))}))
  };
}
async function createPracticeRoom(){
  if(isPreviewDemoV31()){openPreviewDemoV31('practice');toast('隔離示範使用固定練習案件，可隨時重設');return;}
  if(!profile) return;
  const source=selectedPracticeSource();
  if(source==='file'&&!practiceSourceFile){toast('請先選擇案例檔案');return;}
  const title=$('practiceScenarioTitle')?.value.trim()||'';
  const difficulty=$('practiceDifficulty')?.value||'standard';
  const brief=$('practiceScenarioBrief')?.value.trim()||'';
  const focus=$('practiceAiPrompt')?.value.trim()||'';
  const fallback=localPracticeScenario({title,brief,difficulty,focus,sourceText:practiceSourceFile?.text||''});
  const btn=$('createPracticeRoomBtn'); if(btn){btn.disabled=true;btn.textContent=source==='manual'?'建立中…':'AI 分析並建立中…';}
  let scenario=fallback;
  if(source!=='manual'){
    try{scenario=normalizePracticeScenario(await requestPracticeScenario({title,difficulty,brief,focus,source,fileName:practiceSourceFile?.name||'',sourceText:practiceSourceFile?.text||''}),fallback);}
    catch(err){console.warn('practice scenario fallback',err);toast('AI 暫時無法產生情境，已建立可立即使用的本機演練腳本',4600);}
  }
  scenario=normalizePracticeScenario(scenario,fallback);
  const roomCode=generatePracticeRoomCode(); const instructorMode=$('practiceInstructorMode').value; const hostRole=instructorMode==='human'?'教官':($('practiceHostRole')?.value||'現場指揮官');
  const createdAt=Date.now();
  const newCase={mode:'practice',schemaVersion:27,caseNo:`SIM-${todayKey()}-${roomCode}`,roomCode,scenarioTitle:scenario.title,scenarioBrief:scenario.brief,scenarioSource:source,practiceDifficulty:difficulty,learningMode:$('practiceLearningMode').value,traineeUid:instructorMode==='ai'?profile.id:null,instructorMode,instructorUid:instructorMode==='human'?profile.id:null,training:FCTraining.initial(),practiceStatus:'waiting',practiceEventIntervalMs:difficulty==='advanced'?30000:difficulty==='basic'?60000:45000,hostUid:profile.id,hostName:radioCallSign(),address:`虛擬情境｜${scenario.title}`,type:'模擬火場',summary:scenario.brief,initialSummary:scenario.brief,purpose:scenario.purpose,buildingStructure:scenario.buildingStructure,floors:scenario.floors,fireFloor:scenario.fireFloor,fireObservedFloor:scenario.fireFloor,fireObservation:scenario.fireStatus,fireStatus:scenario.fireStatus,trapped:scenario.trapped,trappedCount:scenario.trappedCount,brigade:profile.brigade,unit:profile.unit||'',createdBy:profile.id,createdByName:profile.callName,lat:DEFAULT_CENTER.lat,lng:DEFAULT_CENTER.lng,createdAt,updatedAt:createdAt};
  const player={name:radioCallSign(),role:hostRole,ai:false,userId:profile.id,joinedAt:createdAt,createdAt};
  let id;
  try{
    if(firebaseEnabled){
      const ref=await db.collection('cases').add(newCase);id=ref.id;
      await ref.collection('players').doc(profile.id).set(player);
      for(const event of scenario.events) await ref.collection('simulationEvents').add({...event,released:false,createdAt:createdAt+event.order});
      await addLogRemote(id,'practice',`建立練習房間 ${roomCode}｜${scenario.title}`);
    }else{
      id=uid('case');
      localState.cases.unshift({id,...newCase,vehicles:[],crews:[],hoses:[],hazards:[],sitreps:[],logs:[{id:uid('log'),type:'practice',message:`建立練習房間 ${roomCode}｜${scenario.title}`,createdAt,operator:radioCallSign()}],players:[{id:profile.id,...player}],simulationEvents:scenario.events.map(x=>({id:uid('event'),...x,released:false,createdAt:createdAt+x.order}))});
      saveLocalState();cases=localState.cases.filter(c=>c.brigade===profile.brigade);
    }
    $('practiceCreateDetails') && ($('practiceCreateDetails').open=false); openCase(id);
  }catch(err){toast(`練習房間建立失敗：${err.message}`,5000);}
  finally{if(btn){btn.disabled=false;btn.textContent='建立虛擬練習案件';}}
}
async function joinPracticeRoom(){
  const code=String($('practiceJoinCode')?.value||'').trim().toUpperCase();
  if(code.length!==6){toast('請輸入 6 碼房間代碼');return;}
  const room=cases.find(c=>c.mode==='practice'&&String(c.roomCode||'').toUpperCase()===code&&c.practiceStatus!=='closed');
  if(!room){toast('找不到此練習房間，請確認房號與大隊範圍');return;}
  await joinPracticeCaseById(room.id,$('practiceJoinRole')?.value||'觀察員');
}
async function joinPracticeCaseById(id,role='觀察員'){
  const room=cases.find(c=>c.id===id);if(!room)return;assertDemoCaseAccessV31(room);
  if(room.instructorUid===profile.id)role='教官';
  const player={name:radioCallSign(),role,ai:false,userId:profile.id,joinedAt:Date.now(),createdAt:Date.now()};
  if(firebaseEnabled) await db.collection('cases').doc(id).collection('players').doc(profile.id).set(player,{merge:true});
  else{
    room.players=room.players||[];const existing=room.players.find(x=>x.id===profile.id||x.userId===profile.id);
    if(existing)Object.assign(existing,player);else room.players.push({id:profile.id,...player});saveLocalState();
  }
  openCase(id);
}
function isPracticeHost(){ return !!(currentCase?.mode==='practice'&&profile?.id&&currentCase.hostUid===profile.id); }
function severityLabel(value='info'){return ({info:'一般',warning:'警示',critical:'緊急'})[value]||'一般';}
const TRAINING_ROLES={
 '現場指揮官':{focus:'建立指揮、任務分派與整體安全',actions:['到場偵察','部署命令','要求回報'],template:'指示【單位】於【位置】執行【任務】，並於【時間】回報【項目】。'},
 '初期指揮官':{focus:'初報、第一面與指揮移交',actions:['到場初報','建立指揮','移交情報'],template:'現場【建物／火煙／人命】，第一面設於【位置】，已建立【指揮點】，請支援【需求】。'},
 '安全官':{focus:'風險辨識、人員清查與撤退條件',actions:['安全巡查','要求 PAR','提出撤退評估'],template:'於【位置】觀察到【風險】，影響【單位】，建議【措施】並確認【安全條件】。'},
 '紀錄官':{focus:'時序紀錄、情報核對與追蹤',actions:['彙整情報','核對缺項','追蹤回報'],template:'【時間】【單位】回報【資訊】，與【既有情報】比對為【一致／待確認】，待追蹤【事項】。'},
 '分區指揮官':{focus:'分區部署、進度與資源需求',actions:['分區回報','調整任務','請求資源'],template:'【分區】現有【人車水線】，正在【任務】，進度【狀況】，需要【資源】，下次【時間】回報。'},
 '單位帶隊官':{focus:'小組位置、任務、進退與人員狀態',actions:['任務回報','回報障礙','確認人員'],template:'【單位】【人數】人位於【位置】，執行【任務】，目前【進度／障礙】，人員【狀態】。'}
};
let trainingRenderKey='', trainingWork=false, trainingSend=false;
function trainingSteps(){return (live.simulationEvents||[]).slice().sort((a,b)=>(a.order||0)-(b.order||0)||(a.createdAt||0)-(b.createdAt||0)).map(FCTraining.normalizeStep);}
function trainingState(){return currentCase?.training||FCTraining.initial();}
function myTrainingRole(){return currentCase?.instructorUid===profile?.id?'教官':(live.players||[]).find(x=>!x.ai&&x.userId===profile?.id)?.role||'觀察員';}
function isHumanInstructor(){return isPracticeHost()&&currentCase.instructorMode==='human';}
function isAiInstructor(){return currentCase?.instructorMode!=='human';}
function canControlTraining(){return isPracticeHost();}
function activeTrainingStep(){return trainingSteps()[trainingState().index];}
function formatDuration(ms){const n=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
function renderPracticeSession(){
 const panel=$('practiceSessionPanel');if(!panel)return;
 const active=currentCase?.mode==='practice';panel.hidden=!active;
 document.body.classList.toggle('in-training',active);
 if(!active){stopPracticeTicker();return;}
 const state=trainingState(),steps=trainingSteps(),step=steps[state.index],role=myTrainingRole(),config=TRAINING_ROLES[role];
 $('practiceSessionTitle').textContent=currentCase.scenarioTitle||'虛擬火場';$('practiceRoomCode').textContent=currentCase.roomCode||'------';
 $('practiceRoleStatus').textContent=`我的角色：${role}${config?' · '+config.focus:role==='觀察員'?' · 僅供觀察與回放':''}`;
 $('instructorBadge').textContent=isAiInstructor()?'AI 教官':'真人教官';
 $('practiceProgress').textContent=`${practiceStatusLabel(state.phase)} · ${Math.min(steps.length,state.index+1)}／${steps.length} 情境`;
 $('practiceHostControls').hidden=!isHumanInstructor();
 const toggle=$('togglePracticeRunBtn');toggle.hidden=!canControlTraining()||state.phase==='completed';toggle.disabled=state.phase==='waiting'&&!steps.length;toggle.textContent=state.phase==='running'?'暫停':state.phase==='paused'?'繼續':'開始練習';
 $('practiceResponsePanel').hidden=!config||state.phase==='completed';
 $('submitPracticeResponse').disabled=state.phase!=='running'||trainingSend;
 $('practiceResponseText').disabled=state.phase!=='running';
 $('fillPracticeAiBtn').hidden=!isPracticeHost();
 $('releaseNextPracticeEventBtn').disabled=state.phase!=='running';
 $('endPracticeBtn').disabled=!['running','paused'].includes(state.phase);
 const renderKey=[currentCase.id,state.revision,step?.id,role,currentCase.learningMode].join('|');
 if(renderKey!==trainingRenderKey){
  trainingRenderKey=renderKey;
  $('practiceLatestEvent').innerHTML=step&&state.phase!=='completed'?`<span class="practice-event-severity ${escapeHtml(step.severity||'info')}">${severityLabel(step.severity)}</span><div><b>${escapeHtml(step.title)}</b><p>${escapeHtml(step.detail)}</p><small>本情境反應時間 ${step.timeLimitSec} 秒（訓練設定）</small></div>`:`<div><b>${state.phase==='completed'?'演練結束':'準備開始'}</b><p>${escapeHtml(state.phase==='completed'?state.reason:currentCase.scenarioBrief||'請選擇角色並開始練習。')}</p></div>`;
  const guided=currentCase.learningMode!=='assessment';
  $('practiceRoleActions').innerHTML=config&&guided?config.actions.map(x=>`<button class="btn small ghost" type="button" data-role-template="1">${x}</button>`).join(''):'';
  $('practiceRoleActions').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!$('practiceResponseText').value.trim())$('practiceResponseText').value=({
'到場偵察':'到場觀察【建物／火煙／人命】，第一面為【位置】，尚待確認【事項】。',
'部署命令':'指示【單位】於【位置】執行【任務】，以【安全條件】為前提，於【時間】回報。',
'要求回報':'請【單位】回報【位置、人數、任務進度與風險】，回報時限為【時間】。',
'到場初報':'【單位】到達【位置】，現場【建物、火煙、人命】，目前採取【措施】。',
'建立指揮':'由【呼號】建立現場指揮，指揮點位於【位置】，第一面設於【方向】。',
'移交情報':'向【接任指揮官】移交【火勢、人命、部署、水源、風險及待追蹤事項】。',
'安全巡查':'於【位置】發現【風險】，影響【單位】，請採取【措施】並回報【確認結果】。',
'要求 PAR':'請【單位／分區】進行人員清查，回報【人數、位置、任務與狀態】，時限【時間】。',
'提出撤退評估':'因【風險與依據】，建議評估【單位／區域】撤退，確認【路線、集合點與清查】。',
'彙整情報':'截至【時間】，已確認【情報】，尚未確認【事項】，來源【單位】。',
'核對缺項':'目前缺少【項目】，請【單位】查明並於【時間】回報。',
'追蹤回報':'【時間】已要求【單位】回報【內容】，目前【進度】，下一次追蹤【時間】。',
'分區回報':'【分區】現有【人車水線】，執行【任務】，目前【進度與風險】。',
'調整任務':'請【單位】由【原任務】調整至【新任務與位置】，確認【安全與資源條件】。',
'請求資源':'【分區】因【原因】需要【資源與數量】，請至【位置】支援【任務】。',
'任務回報':'【單位】【人數】人位於【位置】，任務【內容】，目前【進度與安全狀態】。',
'回報障礙':'【單位】於【位置】遇到【障礙】，影響【任務】，請求【措施／支援】。',
'確認人員':'【單位】應到【人數】、實到【人數】，位置【位置】，狀態【狀態】。'
})[b.textContent]||config.template;$('practiceResponseText').focus();});
  const suggestions=['主攻單位回報水壓下降，原因尚待確認。','關係人補充受困位置，與初報有落差。','分區回報煙流方向改變，請重新評估。'];
  $('practiceSuggestions').innerHTML=suggestions.map((x,i)=>`<button type="button" class="btn small ghost" data-suggestion="${i}">${['水源變化','情報落差','煙流變化'][i]}</button>`).join('');
  $('practiceSuggestions').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('practiceCustomEvent').value=suggestions[Number(b.dataset.suggestion)];});
 }
 const players=(live.players||[]).filter(p=>!p.ai||!(live.players||[]).some(h=>!h.ai&&(h.role===p.role||(h.role==='初期指揮官'&&p.role==='現場指揮官'))));
 $('practicePlayerList').innerHTML=players.map(p=>`<div class="practice-player"><span>${p.ai?'AI':'真人'}</span><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.role)}</small></div>`).join('');
 const messages=[...(live.practiceMessages||[]),...(live.practiceResponses||[]).map(x=>({...x,text:x.text,name:x.name||x.role,kind:'回應'})),...(live.logs||[]).filter(x=>!['practice'].includes(x.type)).slice(-15).map(x=>({...x,text:x.message,name:x.operator,kind:'操作'}))].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,40);
 $('practiceMessageCount').textContent=`${messages.length} 則`;
 const messageHtml=messages.length?messages.map(x=>`<article class="training-message"><div><b>${escapeHtml(x.name||x.role||'協作回報')}</b><small>${escapeHtml(x.kind||'情報')} · ${fmtTime(x.createdAt)}</small></div><p>${escapeHtml(x.text||'')}</p></article>`).join(''):'<p class="empty">開始後顯示角色回報與操作紀錄。</p>';
 if($('practiceMessages').innerHTML!==messageHtml)$('practiceMessages').innerHTML=messageHtml;
 const outcomes=state.outcomes||[];
 $('practiceEventList').innerHTML=outcomes.map((o,i)=>`<article class="practice-event-item"><b>${i+1}. ${escapeHtml(o.title)}</b><p>${({respond:'已回應',timeout:'逾時',skip:'教官跳過'})[o.result]} · 用時 ${formatDuration(o.elapsedMs)}${o.late?' · 逾時回應':''}</p>${o.responseText?`<p>${escapeHtml(o.role)}：${escapeHtml(o.responseText)}</p>`:''}</article>`).join('')||'<p class="empty">尚無完成階段。</p>';
 $('practiceEngineNote').textContent=isAiInstructor()?'AI 教官以本房間腳本與回應規則推進；房主頁面須保持開啟。離開頁面不會暫停，回來後先記錄當前階段逾時。':'由真人教官控制開始、暫停、下一階段與結束。';
 renderTrainingReview();updateTrainingClock();startPracticeTicker();
}
function updateTrainingClock(){if(!currentCase||currentCase.mode!=='practice')return;const s=trainingState();$('practiceCountdown').textContent=['running','paused'].includes(s.phase)?formatDuration(FCTraining.remaining(s,Date.now())):'--:--';$('practiceCountdown').classList.toggle('urgent',s.phase==='running'&&FCTraining.remaining(s,Date.now())<=30000);$('practiceClockLabel').textContent=s.phase==='paused'?'已暫停（記錄中）':'本階段剩餘';}
function startPracticeTicker(){if(practiceTickTimer)return;practiceTickTimer=setInterval(()=>{updateTrainingClock();if(isPracticeHost()&&isAiInstructor())processTraining().catch(err=>toast(`演練同步失敗：${err.message}`));if(isPracticeHost())processTrainingAssistance().catch(err=>console.warn('角色回報失敗',err));},1000);}
function stopPracticeTicker(){if(practiceTickTimer){clearInterval(practiceTickTimer);practiceTickTimer=null;}trainingRenderKey='';}
async function trainingCommit(action){
 if(!isPracticeHost())return false;
 const id=currentCaseId,steps=trainingSteps(),before=trainingState(),now=Date.now();let next;
 if(firebaseEnabled){const ref=db.collection('cases').doc(id);await db.runTransaction(async tx=>{const doc=await tx.get(ref);next=null;const old=doc.data().training||FCTraining.initial();if(old.revision!==before.revision)return;next=FCTraining.transition(old,action,steps,now);if(next){tx.update(ref,{training:next,practiceStatus:next.phase,updatedAt:now});if(next.index!==old.index&&steps[next.index])tx.update(ref.collection('simulationEvents').doc(steps[next.index].id),{released:true,releasedAt:now,releasedBy:isAiInstructor()?'AI 教官':radioCallSign()});}});}
 else{next=FCTraining.transition(before,action,steps,now);if(next){currentCase.training=next;currentCase.practiceStatus=next.phase;saveLocalCase();}}
 if(!next||currentCaseId!==id)return false;
 currentCase.training=next;currentCase.practiceStatus=next.phase;
 if(next.index!==before.index&&steps[next.index]){
  const step=steps[next.index];if(!firebaseEnabled)await updateItem('simulationEvents',step.id,{released:true,releasedAt:now,releasedBy:isAiInstructor()?'AI 教官':radioCallSign()});
  await emitTrainingSupport(step,next.index);
 }
 await addLog('practice',`${({start:'開始演練',pause:'暫停演練',resume:'繼續演練',respond:'採納回應',timeout:'逾時推進',skip:'教官跳過',finish:'結束演練'})[action.type]}｜階段 ${Math.min(next.index+1,steps.length)}`);
 renderPracticeSession();updateAssessmentAvailability();return true;
}
async function emitTrainingSupport(step,index){
 const humans=new Set((live.players||[]).filter(x=>!x.ai).map(x=>x.role));if(humans.has('初期指揮官'))humans.add('現場指揮官');
 const ai=(live.players||[]).filter(x=>x.ai&&!humans.has(x.role));
 // One context-aware scripted role transmission per stage. No invented completed field operation.
 const preferred=['單位帶隊官','分區指揮官','紀錄官','安全官','現場指揮官'][index%5];const p=ai.find(x=>x.role===preferred)||ai[0];if(!p)return;
 const text=currentCase.learningMode==='assessment'?`【模擬回報】已收到「${step.title}」資訊，等待任務指示。`:`【模擬協作】針對「${step.title}」，請確認負責單位、作業位置與下一次回報條件。尚未回報的進度維持待確認。`;
 const data={name:p.name,role:p.role,kind:'AI 腳本',text,eventId:step.id,createdAt:Date.now(),authorUid:profile.id};
 if(firebaseEnabled)await db.collection('cases').doc(currentCaseId).collection('practiceMessages').doc(`support_${step.id}`).set(data);
 else if(!(live.practiceMessages||[]).some(x=>x.eventId===step.id))await addItem('practiceMessages',data);
}
async function processTraining(){
 if(trainingWork||!isPracticeHost()||trainingState().phase!=='running')return;
 trainingWork=true;
 try{const s=trainingState(),step=activeTrainingStep();if(!step)return;const eligible=(live.practiceResponses||[]).filter(x=>x.eventId===step.id&&x.createdAt>=s.stepStartedAt&&x.createdAt<=s.deadline).sort((a,b)=>a.createdAt-b.createdAt);
  // In a team, only the designated trainee's response advances the shared scenario.
  const response=eligible.find(x=>x.authorUid===currentCase.traineeUid);
  if(response)await trainingCommit({type:'respond',eventId:step.id,response});
  else if(Date.now()>=s.deadline)await trainingCommit({type:'timeout',eventId:step.id});
 }finally{trainingWork=false;}
}
async function togglePracticeRun(){
 if(!isPracticeHost()||trainingWork)return;trainingWork=true;
 try{const s=trainingState();if(s.phase==='waiting')await fillPracticeAiRoles(true);await trainingCommit({type:s.phase==='waiting'?'start':s.phase==='running'?'pause':'resume'});}finally{trainingWork=false;}
}
async function releaseNextPracticeEvent(){
 if(!isHumanInstructor()||trainingWork||trainingState().phase!=='running')return;
 const step=activeTrainingStep();if(!step)return;
 const response=(live.practiceResponses||[]).filter(x=>x.eventId===step.id).sort((a,b)=>b.createdAt-a.createdAt)[0];
 trainingWork=true;try{await trainingCommit({type:response?'respond':'skip',eventId:step.id,response});}finally{trainingWork=false;}
}
async function fillPracticeAiRoles(silent=false){
 if(!isPracticeHost())return;
 const occupied=new Set((live.players||[]).map(x=>x.role));if(occupied.has('初期指揮官'))occupied.add('現場指揮官');
 const missing=['現場指揮官','安全官','紀錄官','分區指揮官','單位帶隊官'].filter(x=>!occupied.has(x));
 for(const role of missing){const data={name:`AI ${role}`,role,ai:true,userId:`ai-${role}`,joinedAt:Date.now(),createdAt:Date.now()};if(firebaseEnabled)await db.collection('cases').doc(currentCaseId).collection('players').doc(`ai_${role}`).set(data);else await addItem('players',data);}
 if(!silent)toast(missing.length?`AI 已補齊 ${missing.length} 個角色`:'角色已齊全');
}
async function addPracticeCustomEvent(){
 if(!isHumanInstructor())return;
 const detail=$('practiceCustomEvent').value.trim();if(!detail)return toast('請輸入情境');
 if(trainingState().phase==='completed')return toast('演練已結束，請建立新房間');
 await addItem('simulationEvents',{title:'教官追加情境',detail:detail.slice(0,1200),severity:$('practiceEventSeverity').value,timeLimitSec:Math.max(30,Math.min(900,Number($('practiceCustomTime').value)||180)),order:Math.max(0,...trainingSteps().map(x=>x.order))+1,released:false});
 $('practiceCustomEvent').value='';toast('情境已加入本次演練佇列');
}
async function submitTrainingResponse(){
 const role=myTrainingRole(),text=$('practiceResponseText').value.trim(),step=activeTrainingStep();
 if(!TRAINING_ROLES[role]||trainingState().phase!=='running'||!step||trainingSend)return;
 if(text.length<8||/【|】/.test(text))return toast('請填入實際判斷與處置；範本中的【】必須完成或移除');
 trainingSend=true;const id=currentCaseId;
 try{await addItem('practiceResponses',{authorUid:profile.id,name:radioCallSign(),role,text:text.slice(0,3000),eventId:step.id,createdAt:Date.now()});if(currentCaseId!==id)return;$('practiceResponseText').value='';$('practiceResponseStatus').textContent=isAiInstructor()?'已記錄；主受測者回應後推進。':'已記錄，等待教官採納。';if(isAiInstructor())await processTraining();}finally{trainingSend=false;renderPracticeSession();}
}
function renderTrainingReview(){
 const el=$('practiceReview'),s=trainingState();el.hidden=s.phase!=='completed';if(el.hidden)return;
 const q=FCTraining.summary(s,trainingSteps());
 el.innerHTML=`<div class="stream-title">本次演練檢討</div><div class="review-metrics"><div><strong>${q.responded}/${q.total}</strong><span>已回應情境</span></div><div><strong>${q.timingScore}</strong><span>時效參考分</span></div><div><strong>${q.timeouts}</strong><span>逾時情境</span></div><div><strong>${q.pauseCount}</strong><span>暫停 ${formatDuration(q.pauseMs)}</span></div></div><p>時效參考分＝準時回應情境／全部情境 × 100。暫停時間排除於反應時間之外，另列紀錄；本分數不表示戰術正確或訓練合格。</p><p>${q.timeouts?'建議重練逾時階段，先確認受影響單位，再說明措施與回報條件。':'已完成的回應可按「風險辨識、資訊依據、任務分派、回報條件」逐項檢討。'}${q.skipped?' 教官跳過的階段保留於時間軸，未算作完成。':''}</p><div class="button-row"><button id="copyTrainingReview" class="btn small ghost">複製檢討與時間軸</button><button id="openTrainingAssessment" class="btn small primary">完整檢討與 AI 分析</button></div>`;
 $('openTrainingAssessment').onclick=()=>switchCasePage('assessmentSection');
 $('copyTrainingReview').onclick=async()=>{await navigator.clipboard.writeText(`${currentCase.scenarioTitle}\n${el.innerText}\n${$('practiceEventList').innerText}`);toast('已複製演練紀錄');};
}


function inferPurposeFromCaseType(type=''){
  if(/住宅/.test(type)) return '住宅';
  if(/工廠/.test(type)) return '工廠';
  if(/倉庫/.test(type)) return '倉庫';
  return '';
}
function resolvedCasePurpose(c={}){
  const inferred=inferPurposeFromCaseType(c.type||'');
  if(!c.purpose) return inferred;
  if(Number(c.schemaVersion||0)<26 && inferred && inferred!=='住宅' && c.purpose==='住宅') return inferred;
  return c.purpose;
}
function structuredFireFromInitial(status='',volume=''){
  const value=String(status||'');
  return {
    fireSmokeColor:value==='白煙'?'白煙':value==='灰煙'?'灰煙':value==='黑煙'?'濃黑煙':value==='未見明顯火煙'?'無明顯煙':'',
    fireSmokeVolume:volume || (/大量明火|黑煙/.test(value)?'大量':''),
    fireFlameState:value==='大量明火'?'大量明火':value==='未見明顯火煙'?'未見火舌':'',
    fireObservation:value==='延燒中'?'現場火勢延燒中':''
  };
}
function syncCasePurposeFromType(){
  const suggested=inferPurposeFromCaseType($('caseType')?.value||'');
  if(suggested && (!$('casePurpose')?.value || $('casePurpose').dataset.autoValue)){
    $('casePurpose').value=suggested; $('casePurpose').dataset.autoValue=suggested;
  }
}
async function createCase(e){
  if(isPreviewDemoV31()){e?.preventDefault();openPreviewDemoV31('live');toast('隔離示範使用固定案件，可隨時重設');return;}
  e.preventDefault();
  let address = normalizeAddress($('caseAddress').value.trim() || extractAddress($('dispatchText').value) || '新北市蘆洲區長榮路792號');
  toast('定位中，請稍候…', 1800);
  const loc = await geocodeAddress(address);
  const initialFire=structuredFireFromInitial($('caseFireStatus').value,$('caseSmokeVolume')?.value||'');
  const initialPurpose=$('casePurpose')?.value || inferPurposeFromCaseType($('caseType').value);
  const newCase = {
    mode:'live',
    schemaVersion:27,
    caseNo: nextCaseNo(),
    address,
    type: $('caseType').value,
    initialSummary: $('caseSummary').value.trim(),
    summary: $('caseSummary').value.trim() || `${$('caseFloors').value||'?'}樓建築，${$('caseFireFloor').value||'起火樓層未明'}，受困狀況${$('caseTrapped').value}`,
    floors: Number($('caseFloors').value)||0,
    fireFloor: normalizeFloorValue($('caseFireFloor').value),
    trapped: $('caseTrapped').value,
    trappedCount: getTrappedCount(),
    trappedCountMode: $('caseTrappedCountMode').value,
    victims: readVictims(),
    fireStatus: $('caseFireStatus').value==='未知'?'':$('caseFireStatus').value,
    fireObservedFloor: normalizeFloorValue($('caseFireFloor').value),
    fireObservedSide: $('caseObservedSide')?.value || '',
    fireSmokeColor: initialFire.fireSmokeColor,
    fireSmokeVolume: initialFire.fireSmokeVolume,
    fireFlameState: initialFire.fireFlameState,
    fireObservation: initialFire.fireObservation,
    purpose: initialPurpose,
    buildingStructure:$('caseBuildingStructure')?.value || '',
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
  $('caseForm').reset(); $('caseTrappedCountMode').value='0'; $('victimRows').innerHTML=''; $('victimDetails').open=false; $('createCaseDetails').open=false; syncCasePurposeFromType();
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
  clearIntake28();resourceReady28.clear();
  cleanupSubscriptions(); stopPracticeTicker(); document.body.classList.remove('in-training'); currentCaseId=null; currentCase=null; pendingDeploymentVehicles=[]; tacticalVehicleSelectionV3=''; tacticalHoseSelectionV3=''; tacticalObjectSelectionV31=null; tacticalSceneV3=null; mapUndoStack=[]; updateMapUndoButton();
  $('detailPage').hidden=true; $('homePage').hidden=false;
  subscribeCases();
}
function openCase(id){
  if(isPreviewDemoV31()&&!localState.cases.some(c=>c.id===id&&window.FCPreviewDemoV31.isDemoCase(c))){toast('隔離示範僅可開啟指定的合成示範案件');return;}
  if(isPreviewDemoV31()&&localState.cases.some(c=>c.id===id&&window.FCPreviewDemoV31.isDemoCase(c))){localState.previewDemoSession={active:true,caseId:id};saveLocalState();}
  clearIntake28();resourceReady28.clear();currentCase=null;
  deploymentDraft27=null;selectedSds27=null;if($('deploymentDraftPreview'))$('deploymentDraftPreview').hidden=true;
  if($('practiceResponseText'))$('practiceResponseText').value='';
  document.querySelectorAll('#sdsKnowledgePanel input,#sdsKnowledgePanel textarea').forEach(el=>{if(el.type==='checkbox')el.checked=false;else el.value='';});
  cleanupSubscriptions(); stopPracticeTicker(); currentCaseId = id; pendingDeploymentVehicles=[]; tacticalVehicleSelectionV3=''; tacticalHoseSelectionV3=''; tacticalObjectSelectionV31=null; tacticalSceneV3=null; mapUndoStack=[]; updateMapUndoButton(); renderPendingDeploymentVehicles();
  live={vehicles:[],crews:[],hoses:[],hazards:[],sitreps:[],logs:[],players:[],simulationEvents:[],practiceResponses:[],practiceMessages:[],hazardReferences:[],intakeEvents:[]};
  $('homePage').hidden=true; $('detailPage').hidden=false;
  switchCasePage('caseInfo', false);
  if(firebaseEnabled){ subscribeCaseRemote(id); }
  else { loadCaseLocal(id); }
  setTimeout(()=>{ initMap(); renderMap(); }, 120);
}
function subscribeCaseRemote(id){
  const caseUnsub = db.collection('cases').doc(id).onSnapshot(doc => {
    if(currentCaseId!==id)return;
    if(!doc.exists){ toast('此案件已不存在'); backHome(); return; }
    currentCase = { id:doc.id, ...doc.data() }; renderDetail();
  });
  unsubscribers.push(caseUnsub);
  ['vehicles','crews','hoses','hazards','sitreps','logs','players','simulationEvents','practiceResponses','practiceMessages','hazardReferences','intakeEvents'].forEach(coll => {
    const unsub = db.collection('cases').doc(id).collection(coll).onSnapshot(snap => {
      if(currentCaseId!==id)return;
      if(['crews','vehicles','hoses'].includes(coll))resourceReady28.add(coll);
      live[coll] = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
      renderLiveParts();
    });
    unsubscribers.push(unsub);
  });
}
function loadCaseLocal(id){
  const record=localState.cases.find(c=>c.id===id);assertDemoCaseAccessV31(record);if(!record)return;currentCase=record;
  live.intakeEvents=currentCase.intakeEvents||[];
  live.vehicles = currentCase.vehicles || [];
  live.crews = currentCase.crews || [];
  live.hoses = currentCase.hoses || [];
  live.hazards = currentCase.hazards || [];
  live.sitreps = currentCase.sitreps || [];
  live.logs = currentCase.logs || [];
  live.players = currentCase.players || [];
  live.simulationEvents = currentCase.simulationEvents || []; live.practiceResponses=currentCase.practiceResponses||[]; live.practiceMessages=currentCase.practiceMessages||[]; live.hazardReferences=currentCase.hazardReferences||[];
  renderDetail(); renderLiveParts();
}
function saveLocalCase(){
  if(!currentCase) return;assertDemoCaseAccessV31();
  currentCase.intakeEvents=live.intakeEvents||[];
  currentCase.vehicles = live.vehicles; currentCase.crews = live.crews; currentCase.hoses = live.hoses; currentCase.hazards = live.hazards; currentCase.sitreps = live.sitreps; currentCase.logs = live.logs; currentCase.players=live.players; currentCase.simulationEvents=live.simulationEvents; currentCase.practiceResponses=live.practiceResponses||[]; currentCase.practiceMessages=live.practiceMessages||[]; currentCase.hazardReferences=live.hazardReferences||[];
  const idx = localState.cases.findIndex(c=>c.id===currentCase.id); if(idx>=0) localState.cases[idx] = currentCase;
  saveLocalState();
}
async function patchCurrentCase(patch={}, render=false){
  assertDemoCaseAccessV31();
  if(currentCase?.mode==='practice'&&myTrainingRole()==='觀察員'&&!isPracticeHost())throw Error('觀察員僅可閱覽');
  if(!currentCase||!currentCaseId)return;
  const id=currentCaseId,data={...patch,updatedAt:patch.updatedAt||Date.now()};
  if(firebaseEnabled)await db.collection('cases').doc(id).set(data,{merge:true});
  if(currentCaseId!==id)return;
  Object.assign(currentCase,data);
  if(!firebaseEnabled)saveLocalCase();if(render)renderLiveParts();
}
function renderDetail(){
  if(!currentCase) return;
  currentCase.purpose=resolvedCasePurpose(currentCase);
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
  renderHazardRecord();renderSupportRequests();renderRitUnit();
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
  const initialFire=structuredFireFromInitial(currentCase.fireStatus||'',currentCase.fireSmokeVolume||'');
  $('detailPurpose').value = resolvedCasePurpose(currentCase);
  $('buildingStructure') && ($('buildingStructure').value = currentCase.buildingStructure || '');
  $('detailFloors') && ($('detailFloors').value = currentCase.floors || '');
  $('detailFireFloor') && ($('detailFireFloor').value = normalizeFloorValue(currentCase.fireFloor || ''));
  $('fireObservedFloor') && ($('fireObservedFloor').value = observedLocation.floor || normalizeFloorValue(currentCase.fireFloor || ''));
  $('fireObservedSide') && ($('fireObservedSide').value = currentCase.fireObservedSide || observedLocation.side || '');
  $('fireSmokeColor') && ($('fireSmokeColor').value = currentCase.fireSmokeColor || initialFire.fireSmokeColor || '');
  $('fireSmokeVolume') && ($('fireSmokeVolume').value = currentCase.fireSmokeVolume || initialFire.fireSmokeVolume || '');
  $('fireFlameState') && ($('fireFlameState').value = currentCase.fireFlameState || initialFire.fireFlameState || '');
  $('fireObservation') && ($('fireObservation').value = currentCase.fireObservation || initialFire.fireObservation || '');
  $('detailFireStatus').value = currentCase.fireStatus || '';
  $('detailNotes').value = currentCase.notes || '';
  setRadioValue('trappedState', currentCase.trapped==='有'?'has':currentCase.trapped==='無'?'none':'unknown');
  $('trappedCountArrival') && ($('trappedCountArrival').value = currentCase.trappedCount || '');
  setRadioValue('firstSideMode', currentCase.firstSideMode || (currentCase.firstSideSet?'front':''));
  $('firstSideCustom') && ($('firstSideCustom').value = currentCase.firstSideCustom || '');
  if($('extraNotes')) $('extraNotes').value = currentCase.extraNotes || '';
  renderOverviewContent();
  applySupportValues(currentCase.supports || []);
  $('breakDoorCheck') && ($('breakDoorCheck').checked = !!currentCase.breakDoor);
  setRadioValue('breakDoorState', currentCase.breakDoorState || (currentCase.breakDoor ? 'required' : ''));
  $('breakDoorCommanderReport') && ($('breakDoorCommanderReport').checked = !!currentCase.breakDoorCommanderReport);
  $('breakDoorCenterReport') && ($('breakDoorCenterReport').checked = !!currentCase.breakDoorCenterReport);
  $('breakDoorAt') && ($('breakDoorAt').value = currentCase.breakDoorAt ? toDatetimeLocalValue(currentCase.breakDoorAt) : '');
  $('breakDoorCompletedAt') && ($('breakDoorCompletedAt').value = currentCase.breakDoorCompletedAt ? toDatetimeLocalValue(currentCase.breakDoorCompletedAt) : '');
  $('breakDoorUnit') && ($('breakDoorUnit').value = currentCase.breakDoorUnit || '');
  $('breakDoorNote') && ($('breakDoorNote').value = currentCase.breakDoorNote || '');
  $('cordonCheck') && ($('cordonCheck').checked = !!currentCase.cordonSet);
  setRadioValue('cordonState', currentCase.cordonState || (currentCase.cordonSet ? 'set' : ''));
  $('cordonAssignedCheck') && ($('cordonAssignedCheck').checked = !!currentCase.cordonAssigned);
  $('cordonUnit') && ($('cordonUnit').value = currentCase.cordonUnit || '');
  $('cordonArea') && ($('cordonArea').value = currentCase.cordonArea || '');
  $('cordonNote') && ($('cordonNote').value = currentCase.cordonNote || '');
  if($('deploymentTextRecord')&&document.activeElement!==$('deploymentTextRecord')) $('deploymentTextRecord').value=currentCase.deploymentTextRecord||'';
  if(document.activeElement!==$('deploymentTextRecord')) deploymentTextSource=currentCase.deploymentTextSource||'manual';
  updateArrivalConditionalPanels();
  renderLocationControl(); renderDeploymentTextReference(); renderPracticeSession();
  renderSummaryCards(); renderArrivalStatusCards(); renderCommandGuide(); renderBuildingOps(); renderLocalTacticalAdvice(false); updateAiAdviceButton(); updateAssessmentAvailability(); renderLiveParts(); maybeAutoAiAdvice();
}

function timestampMs(value){
  if(value?.toMillis) return value.toMillis();
  if(value?.toDate) return value.toDate().getTime();
  const n=Number(value||0); return Number.isFinite(n)?n:0;
}
function latestOperationalTimestamp(){
  const times=[timestampMs(currentCase?.updatedAt),timestampMs(currentCase?.createdAt),timestampMs(currentCase?.summaryUpdatedAt)];
  ['vehicles','crews','hoses','hazards','sitreps'].forEach(coll=>(live[coll]||[]).forEach(x=>times.push(timestampMs(x.updatedAt||x.createdAt||x.submittedAt||x.eventAt))));
  const valid=times.filter(x=>Number.isFinite(x)&&x>0);
  return valid.length?Math.max(...valid):Date.now();
}
function buildExecutiveSummaryText(c=currentCase){
  if(!c) return '尚無案件資料。';
  const first=[];
  if(c.address) first.push(`本案位於${c.address}`);
  if(c.type) first.push(`案件類型為${c.type}`);
  const building=[];
  if(c.buildingStructure) building.push(c.buildingStructure);
  if(c.purpose) building.push(`${c.purpose}用途`);
  if(c.floors) building.push(`地上${c.floors}樓`);
  if(c.fireFloor) building.push(`起火樓層為${floorText(c.fireFloor)}`);
  if(building.length) first.push(`現場為${building.join('、')}建物`);
  const sentences=[];
  if(first.length) sentences.push(`${first.join('，')}。`);
  const situation=[];
  if(c.fireStatus && !/未知|未明|尚未確認/.test(c.fireStatus)) situation.push(c.fireStatus.replace(/[。；]+$/,''));
  if(c.trapped==='無') situation.push('目前確認無人受困');
  else if(c.trapped==='有') situation.push(Number(c.trappedCount)>0?`目前確認有${Number(c.trappedCount)}人受困`:'目前確認有人受困，人數待確認');
  if(c.hazardState==='none') situation.push('已確認無危險物品');
  else if(c.hazardState==='has' && c.hazardItems) situation.push(`現場危險物品為${c.hazardItems}`);
  if(situation.length) sentences.push(`${situation.join('；')}。`);
  const command=[];
  if(c.arrived) command.push('已到達現場');
  if(c.commandTransfer) command.push('已完成指揮權轉移');
  if(c.firstSideSet) command.push(c.firstSideMode==='custom'?`已律定${c.firstSideCustom||'指定位置'}為火場第一面`:'已以建物正面為火場第一面');
  if(c.firstSideNote) command.push(`指揮站設於${c.firstSideNote}`);
  if(command.length) sentences.push(`${command.join('，')}。`);
  if(live.vehicles.length || live.crews.length || live.hoses.length){
    const tasks=[...new Set(live.crews.map(x=>x.task).filter(Boolean))].slice(0,4);
    sentences.push(`現場已登錄車輛${live.vehicles.length}台、${crewSummaryText()}及水線${live.hoses.length}條${tasks.length?`，主要任務包含${tasks.join('、')}`:''}。`);
  }else if(effectiveDeploymentSummary()){
    sentences.push(`目前部署紀錄：${effectiveDeploymentSummary().replace(/[。；]+$/,'')}。`);
  }
  if(c.ritSet) sentences.push(`已律定${c.ritUnit||'指定單位'}擔任RIT救援小組。`);
  const latest=live.sitreps.slice().sort((a,b)=>(b.eventAt||b.submittedAt||0)-(a.eventAt||a.submittedAt||0))[0];
  if(latest) sentences.push(`最新戰情：${latest.title||latest.category||'現場狀況更新'}${latest.detail?`，${latest.detail.slice(0,150)}`:''}。`);
  return sentences.join('') || c.initialSummary || c.summary || '案件已建立，現場資料持續更新中。';
}
function renderOverviewContent(){
  if(!currentCase) return;
  const text=buildExecutiveSummaryText(currentCase);
  const executive=$('overviewExecutiveText'); if(executive) executive.textContent=text;
  const meta=$('overviewUpdatedMeta'); if(meta) meta.textContent=`最後彙整：${fmtTime(latestOperationalTimestamp())}`;
  const deploy=$('overviewDeploymentSnapshot');
  if(deploy){
    if(live.vehicles.length||live.crews.length||live.hoses.length||live.hazards.length||currentCase.buildingBox) deploy.innerHTML=deploymentSchematicHtml();
    else if(effectiveDeploymentSummary()) deploy.innerHTML=`<div class="overview-empty overview-deployment-text"><b>第一時間部署文字</b><p>${escapeHtml(effectiveDeploymentSummary())}</p></div>`;
    else deploy.innerHTML='<div class="overview-empty">尚未建立外部部署；請至「部署」新增人車、水線與危害標示。</div>';
  }
  const building=$('overviewBuildingSnapshot');
  if(building){
    const html=floorPlanSchematicHtml();
    building.innerHTML=html||overviewBuildingOperationalSummaryHtmlV31()||'<div class="overview-empty">尚未建立建物內部作戰圖；請至「部署」開啟建物作戰圖繪製。</div>';
  }
  renderOverviewSituationV31();
}
function buildingResidentEntriesV31(){return (currentCase?.buildingOps?.floorActions||[]).flatMap(entry=>(entry.residents||[]).map(row=>({floor:Number(entry.floor),floorAction:entry.action||'未標示',...row})));}
function confirmedPatientEntriesV31(){return window.FCOperationalV31.getLatestPatients(live.sitreps||[]).map(row=>row.patient);}
function hasBuildingOperationalDataV31(){const ops=currentCase?.buildingOps||{};return (ops.floorActions||[]).some(entry=>(entry.action&&entry.action!=='未標示')||(entry.residents||[]).length)||(ops.planMarkers||[]).length>0;}
function overviewBuildingOperationalSummaryHtmlV31(){
  const entries=(currentCase?.buildingOps?.floorActions||[]).filter(entry=>(entry.action&&entry.action!=='未標示')||(entry.residents||[]).length);
  if(!entries.length)return '';
  return `<div class="overview-building-operational-v31">${entries.map(entry=>{const rows=entry.residents||[],summary=window.FCV34V3?.floorResidentSummary(rows)||{households:rows.length,confirmedMinimum:0,pending:rows.length},status=entry.action&&entry.action!=='未標示'?`｜${entry.action}`:'',population=rows.length?(summary.pending?`${summary.confirmedMinimum>0?`｜已確認至少 ${summary.confirmedMinimum} 人`:''}｜${summary.pending} 戶人數待確認`:`｜已確認 ${summary.confirmedMinimum} 人`):'';return `<p><strong>${floorLabel(entry.floor)}${escapeHtml(status)}</strong>${rows.length?`｜${summary.households} 戶${escapeHtml(population)}`:''}</p>`;}).join('')}</div>`;
}
function overviewSituationLinesV31(){return window.FCOperationalV31.buildSituationLines(currentCase||{},live);}
function renderOverviewSituationV31(){
  const card=$('overviewSituationCardV31'),slot=$('overviewSituationSummaryV31'),buildingCard=$('overviewBuildingCardV31');if(!card||!slot)return;
  const lines=overviewSituationLinesV31();card.hidden=!lines.length;slot.innerHTML=lines.length?`<ul>${lines.map(line=>`<li>${escapeHtml(line)}</li>`).join('')}</ul>`:'';
  if(buildingCard)buildingCard.hidden=!hasBuildingOperationalDataV31();
}
function scheduleDerivedSummaryPersist(){
  if(currentCase?.mode==='practice'&&myTrainingRole()==='觀察員')return;
  if(!currentCase) return;
  clearTimeout(derivedSummaryTimer);
  derivedSummaryTimer=setTimeout(persistDerivedSummary,650);
}
async function persistDerivedSummary(){
  if(!currentCase) return;
  const summary=buildExecutiveSummaryText(currentCase);
  if(!summary || summary===currentCase.summary) return;
  currentCase.summary=summary;
  currentCase.summaryUpdatedAt=Date.now();
  if(firebaseEnabled){
    try{ await db.collection('cases').doc(currentCaseId).set({summary,summaryUpdatedAt:Date.now()},{merge:true}); }
    catch(err){ console.warn('derived summary persist failed',err); }
  }else saveLocalCase();
}
function renderSummaryCards(){
  const c=currentCase; const wrap=$('summaryCards'); if(!wrap)return;
  wrap.innerHTML = `
    <button type="button" class="mini-card summary-link-card" data-summary-page="arrivalSection" data-summary-stage="建"><div class="metric">${c.floors||'?'}</div><div class="metric-label">建物樓層</div><div class="subline">起火：${escapeHtml(floorText(c.fireFloor))}｜點選查看</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="arrivalSection" data-summary-stage="人"><div class="metric">${c.trapped==='有'?'有':c.trapped==='無'?'無':'?'}</div><div class="metric-label">受困狀況</div><div class="subline">${c.trapped==='有'?(Number(c.trappedCount)>0?`${Number(c.trappedCount)} 人`:'人數待確認'):c.trapped==='無'?'確認無人受困':'尚未確認'}｜點選查看</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="dashboardSection"><div class="metric">${live.vehicles.length}</div><div class="metric-label">車輛</div><div class="subline">部署與任務細節</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="dashboardSection"><div class="metric">${FCFieldEntry.summary(live.crews).known}${FCFieldEntry.summary(live.crews).pending?'+?':''}</div><div class="metric-label">已確認人數小計</div><div class="subline">${FCFieldEntry.summary(live.crews).pending} 筆待補｜點選查看</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="tacticalMapSection"><div class="metric">${live.hoses.length}</div><div class="metric-label">水線</div><div class="subline">連接與部署細節</div></button>
    <button type="button" class="mini-card summary-link-card" data-summary-page="sitrepSection"><div class="metric">${live.sitreps.length}</div><div class="metric-label">戰情</div><div class="subline">查看最新回報</div></button>`;
  wrap.querySelectorAll('[data-summary-page]').forEach(btn=>btn.addEventListener('click',()=>{switchCasePage(btn.dataset.summaryPage);if(btn.dataset.summaryStage)selectCommandStage(btn.dataset.summaryStage);}));
  renderOverviewContent();
}
function renderLiveParts(){
  renderIntakeHistory28();
  renderSds27();
  if(!currentCase) return;
  renderSummaryCards(); renderToolOptions(); renderFieldEntries(); renderDeploymentPalette(); renderTacticalCanvasV3(); renderDeploymentTextReference(); scheduleDerivedSummaryPersist(); renderMap(); renderLocationControl(); renderDashboard(); renderRules(); renderSitreps(); renderLogs(); renderCommandGuide(); renderBuildingOps(); renderPracticeSession(); renderLocalTacticalAdvice(false); updateAiAdviceButton(); updateAssessmentAvailability(); renderParCrewChecklist(); generateReport(false);
}
function renderToolOptions(){
  renderPendingDeploymentVehicles();
  updateMapUndoButton();
  syncBuildingBoxForm();
}
const TACTICAL_INTERACTION_HINT_V31='單點選取人員、車輛或圖示；再點同一物件開啟設定；長按可拖動。依序點車輛→車輛、車輛→人員或人員→車輛建立水線；圖示不可接線。';
function renderDeploymentActionHintV31(){
  const hint=$('deploymentActionHint');if(!hint)return;
  hint.textContent=deploymentMode==='hazard'?'圖示放置模式：選擇戰術圖示，再點畫布放置；圖示不可連接水線。':TACTICAL_INTERACTION_HINT_V31;
}
function setDeploymentMode(mode='select'){
  deploymentMode=mode;
  document.querySelectorAll('[data-deploy-mode]').forEach(btn=>{
    const active=btn.dataset.deployMode===mode;
    btn.classList.toggle('primary',active); btn.classList.toggle('ghost',!active);
  });
  selectedMapResource=null;
  if(mode!=='hose' && pendingTool?.type==='hoseConnect') pendingTool=null;
  renderDeploymentActionHintV31();
  renderDeploymentPalette();
}
function renderDeploymentPalette(){
  const wrap=$('mapResourcePalette'); if(!wrap) return;
  const vehicleHtml=live.vehicles.map(v=>`<article class="resource-chip ${selectedMapResource?.coll==='vehicles'&&selectedMapResource?.id===v.id?'active':''}" draggable="true" data-resource-coll="vehicles" data-resource-id="${v.id}" data-resource-label="${escapeHtml(v.name)}"><b>${vehEmoji(v.type)} ${escapeHtml(vehicleDisplayName(v))}</b><span>${v.staged?'右側待命｜':''}${escapeHtml(v.unit)}｜${escapeHtml(v.task||v.status||'待命')}</span><div class="resource-chip-actions">${v.canHose?`<button type="button" data-resource-action="quickHose" data-resource-id="${v.id}">拉水線</button>`:''}<button type="button" data-map-action="editVehicle" data-id="${v.id}">修改</button></div></article>`).join('');
  const crewHtml=live.crews.map(c=>`<article class="resource-chip ${selectedMapResource?.coll==='crews'&&selectedMapResource?.id===c.id?'active':''}" draggable="true" data-resource-coll="crews" data-resource-id="${c.id}" data-resource-label="${escapeHtml(c.unit+c.leader)}"><b>👥 ${escapeHtml(c.unit)}${escapeHtml(c.leader)}</b><span>${crewCount31(c)}｜${escapeHtml(c.task||c.status||'待命')}</span><div class="resource-chip-actions"><button type="button" data-map-action="editCrew" data-id="${c.id}">修改</button><button type="button" data-map-action="restCrew" data-mode="原地休息" data-id="${c.id}">休息</button></div></article>`).join('');
  const hazards=['起火點','指揮站','前進指揮所','休息區','瓦斯','高壓電','危險物'].map(t=>`<button type="button" class="resource-chip quick-symbol" data-resource-action="newHazard" data-hazard-type="${t}"><b>${hazEmoji(t)} ${t}</b><span>點選後再點地圖</span></button>`).join('');
  wrap.innerHTML=(vehicleHtml+crewHtml+hazards)||'<div class="resource-empty">尚無人車資料；可先使用下方表單新增。</div>';
  wrap.querySelectorAll('[draggable="true"]').forEach(el=>el.addEventListener('dragstart',ev=>{
    ev.dataTransfer.setData('application/json',JSON.stringify({coll:el.dataset.resourceColl,id:el.dataset.resourceId,label:el.dataset.resourceLabel||''}));
  }));
}
function tacticalStatusV3(message){const el=$('tacticalCanvasStatusV3');if(el)el.textContent=message;}
function tacticalCollectionItemV31(coll,id){return (live[coll]||[]).find(item=>item.id===id)||null;}
function tacticalSceneNodeV31(coll,id){return tacticalSceneV3?.allNodes?.find(node=>node.coll===coll&&node.id===id)||null;}
function tacticalObjectLabelV31(coll,id){const node=tacticalSceneNodeV31(coll,id),item=tacticalCollectionItemV31(coll,id);return node?.label||item?.name||item?.unit||item?.type||'戰術物件';}
function tacticalEndpointV31(coll,id){const item=tacticalCollectionItemV31(coll,id);if(!item||!['vehicles','crews'].includes(coll))return null;if(coll==='vehicles'&&item.canHose===false)return null;return {coll,id,item,type:coll==='vehicles'?'vehicle':'crew',name:tacticalObjectLabelV31(coll,id)};}
function clearTacticalSelectionV31(){tacticalObjectSelectionV31=null;tacticalVehicleSelectionV3='';}
function selectTacticalObjectV31(coll,id){tacticalObjectSelectionV31={coll,id};tacticalVehicleSelectionV3=coll==='vehicles'?id:'';}
function openTacticalObjectV31(coll,id){if(coll==='vehicles')editVehicle(id);else if(coll==='crews')editCrew(id);else if(coll==='hazards')editHazard(id);else if(coll==='zones')editTacticalZoneV31(id);}
function tacticalZoneKeyV31(id){return id==='standby32'?'standby':String(id).replace(/^zone32_/, '');}
async function patchTacticalZoneV31(id,patch,label){
  assertCaseEditor();const key=tacticalZoneKeyV31(id),node=tacticalSceneNodeV31('zones',id),before=currentCase.tacticalZones?.[key]==null?null:clonePlain(currentCase.tacticalZones[key]);
  await updateCaseSection('tacticalZonesRevision',c=>({tacticalZones:{...(c.tacticalZones||{}),[key]:{...(node?.item||{}),...(c.tacticalZones?.[key]||{}),...patch}}}));
  pushMapUndo(`復原${label}`,async()=>{assertCaseEditor();await updateCaseSection('tacticalZonesRevision',c=>{const zones={...(c.tacticalZones||{})};if(before===null)delete zones[key];else zones[key]=before;return {tacticalZones:zones};});renderTacticalCanvasV3();});
  renderTacticalCanvasV3();
}
function editTacticalZoneV31(id){
  const node=tacticalSceneNodeV31('zones',id);if(!node)return;
  openActionSheet(`標示｜${node.label}`,`<div class="field"><label>標示名稱<input id="zoneLabelV31" value="${escapeHtml(node.label)}" /></label></div><div class="field"><label>位置<select id="zoneFaceV31">${['第一面','第二面','第三面','第四面'].map(face=>`<option ${face===node.item.face?'selected':''}>${face}</option>`).join('')}</select></label></div><div class="field"><label>補充文字<textarea id="zoneNoteV31">${escapeHtml(node.item.note||'')}</textarea></label></div><div class="hint">此設施不能作為水線端點。可長按拖動；刪除後可復原。</div><div id="zoneStatusV31" role="status"></div><div class="button-row"><button id="saveZoneV31" type="button" class="btn primary">儲存</button><button id="deleteZoneV31" type="button" class="btn danger">刪除標示</button><button id="cancelZoneV31" type="button" class="btn ghost">取消</button></div>`);
  $('cancelZoneV31').onclick=closeActionSheet;
  $('saveZoneV31').onclick=async()=>{const button=$('saveZoneV31');button.disabled=true;try{const label=$('zoneLabelV31').value.trim();if(!label)throw Error('請填寫標示名稱');await patchTacticalZoneV31(id,{label,face:$('zoneFaceV31').value,note:$('zoneNoteV31').value.trim()},'修改標示');closeActionSheet();toast('標示已儲存');}catch(error){$('zoneStatusV31').textContent=error.message;button.disabled=false;}};
  $('deleteZoneV31').onclick=async()=>{if(!confirm(`確認刪除標示「${node.label}」？`))return;try{await patchTacticalZoneV31(id,{hidden:true},'刪除標示');closeActionSheet();toast('標示已刪除，可復原');}catch(error){$('zoneStatusV31').textContent=error.message;}};
}
function renderTacticalCanvasV3(){
  renderDeploymentActionHintV31();
  const canvas=$('tacticalCanvasV3');if(!canvas||!currentCase||!window.FCScene32)return;
  tacticalSceneV3=FCScene32.build(currentCase,{vehicles:live.vehicles,crews:live.crews,hoses:live.hoses,hazards:live.hazards,sitreps:live.sitreps},{all:true});
  canvas.innerHTML=FCScene32.svg(tacticalSceneV3);
  if(tacticalObjectSelectionV31&&!tacticalSceneV31HasObject(tacticalObjectSelectionV31))clearTacticalSelectionV31();
  if(tacticalHoseSelectionV3&&!live.hoses.some(h=>h.id===tacticalHoseSelectionV3))tacticalHoseSelectionV3='';
  if(tacticalObjectSelectionV31)canvas.querySelector(`[data-fc32-coll="${CSS.escape(tacticalObjectSelectionV31.coll)}"][data-fc32-id="${CSS.escape(tacticalObjectSelectionV31.id)}"]`)?.classList.add('tactical-selected-v3');
  canvas.querySelector(`[data-fc32-coll="hoses"][data-fc32-id="${CSS.escape(tacticalHoseSelectionV3)}"]`)?.classList.add('tactical-selected-v3');
  if(pendingTool?.type==='hazard')tacticalStatusV3(`圖示放置模式｜請在畫布點選「${pendingTool.hazardType}」位置`);
  else if(tacticalObjectSelectionV31){const s=tacticalObjectSelectionV31,label=tacticalObjectLabelV31(s.coll,s.id),endpoint=tacticalEndpointV31(s.coll,s.id);tacticalStatusV3(endpoint?`已選取 ${label}｜點另一台車或人員建立水線；再點本物件開啟詳細操作`:`已選取 ${label}｜再點本物件開啟詳細操作`);}
  else if(tacticalHoseSelectionV3)tacticalStatusV3('已選取水線｜可移除連線，完成後可短時間復原');
  else tacticalStatusV3('查看模式｜單點選取；再點同一物件開啟設定；長按可拖動');
  canvas.onclick=handleTacticalCanvasClickV3;
  bindTacticalPointerV31(canvas);
}
function tacticalSceneV31HasObject(selection){return !!tacticalSceneV3?.allNodes?.some(node=>node.coll===selection.coll&&node.id===selection.id);}
function tacticalPointV3(event){
  const svg=$('tacticalCanvasV3')?.querySelector('svg'),scene=tacticalSceneV3;if(!svg||!scene)return null;
  const rect=svg.getBoundingClientRect();if(!rect.width||!rect.height)return null;
  const vx=(event.clientX-rect.left)/rect.width*scene.W,vy=(event.clientY-rect.top)/rect.height*scene.H;
  return FCScene32.ll(scene.box,{x:scene.bounds.minX+vx/scene.scale,y:scene.bounds.maxY-vy/scene.scale});
}
async function handleTacticalCanvasClickV3(event){
  if(Date.now()<tacticalSuppressClickUntilV31)return;
  const target=event.target.closest('[data-fc32-coll]');
  if(target){
    const coll=target.dataset.fc32Coll,id=target.dataset.fc32Id;
    if(coll==='hoses'){clearTacticalSelectionV31();tacticalHoseSelectionV3=id;renderTacticalCanvasV3();openTacticalHoseSheetV3(id);return;}
    tacticalHoseSelectionV3='';
    const previous=tacticalObjectSelectionV31;
    if(!previous){selectTacticalObjectV31(coll,id);renderTacticalCanvasV3();return;}
    if(previous.coll===coll&&previous.id===id){clearTacticalSelectionV31();renderTacticalCanvasV3();openTacticalObjectV31(coll,id);return;}
    const source=tacticalEndpointV31(previous.coll,previous.id),destination=tacticalEndpointV31(coll,id);
    if(source&&destination){clearTacticalSelectionV31();await addTacticalHoseV31(source,destination);renderTacticalCanvasV3();return;}
    if(source||destination)toast('此圖示無法連接水線',2600);
    selectTacticalObjectV31(coll,id);renderTacticalCanvasV3();return;
  }
  if(pendingTool?.type==='hazard'){
    const tool={...pendingTool},ll=tacticalPointV3(event);pendingTool=null;
    if(ll){await addHazardAt(tool.hazardType,ll.lat,ll.lng);$('tacticalIconPaletteV3')&&($('tacticalIconPaletteV3').open=false);renderTacticalCanvasV3();}
    return;
  }
  clearTacticalSelectionV31();tacticalHoseSelectionV3='';renderTacticalCanvasV3();
}
async function addTacticalHoseV31(source,destination){
  assertCaseEditor();
  if(source.coll===destination.coll&&source.id===destination.id){toast('水線起點與終點不能相同');return;}
  const duplicate=live.hoses.some(h=>(h.sourceId||h.vehicleId)===source.id&&h.targetId===destination.id);
  if(duplicate){toast('此起點與終點已有水線；如需平行雙線請使用水線詳細工具');return;}
  const port=source.type==='vehicle'?firstAvailableHosePort(source.id):'攻擊線';
  const record={sourceType:source.type,sourceId:source.id,sourceName:source.name,vehicleId:source.type==='vehicle'?source.id:'',vehicleName:source.type==='vehicle'?source.name:'',unit:source.item.unit||'',owner:source.item.unit||profile?.unit||'',port,task:'水線作業',kind:destination.type==='vehicle'?'供水線':'進攻水線',status:'規劃',targetType:destination.type,targetId:destination.id,targetName:destination.name,from:Number.isFinite(source.item.lat)&&Number.isFinite(source.item.lng)?[source.item.lat,source.item.lng]:null};
  const hoseId=await addItem('hoses',record);pushMapUndo(`復原建立水線 ${source.name} → ${destination.name}`,async()=>deleteMapRecordSilent('hoses',hoseId));await addLog('hose',`建立連結水線：${source.name} → ${destination.name}`);toast(`已建立 ${source.name} → ${destination.name} 水線`);
}

function bindTacticalPointerV31(canvas){
  const svg=canvas.querySelector('svg');if(!svg)return;
  svg.querySelectorAll('[data-fc32-coll]').forEach(node=>{
    const coll=node.dataset.fc32Coll,id=node.dataset.fc32Id;if(!['vehicles','crews','hazards','zones'].includes(coll))return;
    node.addEventListener('pointerdown',event=>beginTacticalPointerV31(event,node,canvas,svg,coll,id));
  });
}
function beginTacticalPointerV31(event,node,canvas,svg,coll,id){
  if(!event.isPrimary||event.button>0)return;
  cancelTacticalPointerV31();
  const point={x:event.clientX,y:event.clientY},state={pointerId:event.pointerId,node,canvas,svg,coll,id,start:point,last:point,active:false,timer:null};
  state.timer=setTimeout(()=>{if(tacticalPointerV31!==state)return;state.active=true;selectTacticalObjectV31(coll,id);node.classList.add('tactical-dragging-v31','tactical-selected-v3');canvas.classList.add('tactical-drag-active-v31');node.setPointerCapture?.(state.pointerId);tacticalStatusV3(`正在移動 ${tacticalObjectLabelV31(coll,id)}｜放開後儲存位置`);},360);
  tacticalPointerV31=state;
  const move=e=>moveTacticalPointerV31(e,state),up=e=>finishTacticalPointerV31(e,state),cancel=()=>cancelTacticalPointerV31(state);
  state.listeners={move,up,cancel};node.addEventListener('pointermove',move);node.addEventListener('pointerup',up,{once:true});node.addEventListener('pointercancel',cancel,{once:true});
}
function moveTacticalPointerV31(event,state){
  if(tacticalPointerV31!==state||event.pointerId!==state.pointerId)return;state.last={x:event.clientX,y:event.clientY};const dx=state.last.x-state.start.x,dy=state.last.y-state.start.y;
  if(!state.active){if(Math.hypot(dx,dy)>10)cancelTacticalPointerV31(state);return;}
  event.preventDefault();event.stopPropagation();state.node.style.transform=`translate(${dx}px,${dy}px)`;
}
async function finishTacticalPointerV31(event,state){
  if(tacticalPointerV31!==state)return;clearTimeout(state.timer);detachTacticalPointerV31(state);
  if(!state.active){tacticalPointerV31=null;return;}
  event.preventDefault();event.stopPropagation();const dx=event.clientX-state.start.x,dy=event.clientY-state.start.y,scene=tacticalSceneV3,source=scene?.allNodes?.find(n=>n.coll===state.coll&&n.id===state.id),rect=state.svg.getBoundingClientRect();
  state.node.style.transform='';state.node.classList.remove('tactical-dragging-v31');state.canvas.classList.remove('tactical-drag-active-v31');tacticalPointerV31=null;tacticalSuppressClickUntilV31=Date.now()+500;
  if(!source||!rect.width)return renderTacticalCanvasV3();
  const factor=scene.W/rect.width,pos=FCScene32.ll(scene.box,{x:source.x+dx*factor/scene.scale,y:source.y-dy*factor/scene.scale});
  try{await updateTacticalPositionV31(state.coll,state.id,{...pos,positionManual:true,staged:false},`移動${tacticalObjectLabelV31(state.coll,state.id)}`);toast('位置已同步儲存');}catch(error){toast(`位置儲存失敗：${error.message}`,4600);}finally{renderTacticalCanvasV3();}
}
async function updateTacticalPositionV31(coll,id,patch,label){
  assertCaseEditor();
  if(coll==='zones'){
    const node=tacticalSceneNodeV31(coll,id);if(!node)return;await patchTacticalZoneV31(id,{lat:patch.lat,lng:patch.lng,positionManual:true},label);return;
  }
  const item=tacticalCollectionItemV31(coll,id);if(!item)return;const finalPatch={...patch};
  if(['vehicles','crews'].includes(coll)&&Number.isFinite(finalPatch.lat)&&Number.isFinite(finalPatch.lng))finalPatch.face=mapFace30(finalPatch.lat,finalPatch.lng);
  const before={};Object.keys(finalPatch).forEach(key=>before[key]=item[key]);await updateItem(coll,id,finalPatch);pushMapUndo(`復原${label}`,()=>updateItem(coll,id,before));
}
function detachTacticalPointerV31(state){if(!state?.listeners)return;state.node.removeEventListener('pointermove',state.listeners.move);state.node.removeEventListener('pointerup',state.listeners.up);state.node.removeEventListener('pointercancel',state.listeners.cancel);}
function cancelTacticalPointerV31(state=tacticalPointerV31){if(!state)return;clearTimeout(state.timer);detachTacticalPointerV31(state);state.node.style.transform='';state.node.classList.remove('tactical-dragging-v31');state.canvas.classList.remove('tactical-drag-active-v31');if(tacticalPointerV31===state)tacticalPointerV31=null;}
function openTacticalHoseSheetV3(id){
  const hose=live.hoses.find(h=>h.id===id);if(!hose)return;
  const target=escapeHtml(hose.targetName||'終點待確認'),source=escapeHtml(hose.sourceName||hose.vehicleName||hose.unit||'水線起點');
  openActionSheet('水線操作',`<div class="readonly-card"><b>${source} → ${target}</b><br>${escapeHtml(hose.kind||'水線')}｜${escapeHtml(hose.port||'')}</div><div class="button-row"><button id="removeTacticalHoseV3" class="btn danger" type="button">移除水線</button><button id="cancelTacticalHoseV3" class="btn ghost" type="button">取消</button></div>`);
  $('cancelTacticalHoseV3').onclick=()=>{tacticalHoseSelectionV3='';closeActionSheet();renderTacticalCanvasV3();};
  $('removeTacticalHoseV3').onclick=async()=>{closeActionSheet();await deleteHose(id);tacticalHoseSelectionV3='';renderTacticalCanvasV3();};
}
function selectMapResource(coll,id){
  const item=(live[coll]||[]).find(x=>x.id===id); if(!item) return;
  if(deploymentMode==='hose' && coll==='vehicles'){
    if(pendingTool?.type==='hoseConnect'){completeQuickHoseTarget('vehicle',item);return;}
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
  toast(`已選擇 ${vehicleDisplayName(v)} ${pendingTool.port}；請點另一台車、人員編組，或建物第一、二、三、四面。`,4800);
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
    updateMapItemWithUndo('hoses',tool.hoseId,{targetType,targetId:item.id,targetName,lat:null,lng:null},`重新指定水線終點至 ${targetName}`).then(()=>addLog('hose',`重新指定水線終點：${targetName}`)).then(()=>{renderDeploymentPalette();renderMap();renderTacticalCanvasV3();});
  }else addHoseToTarget(tool).then(()=>{ renderDeploymentPalette(); renderMap(); renderTacticalCanvasV3(); });
  return true;
}
function completeQuickHoseFace(face){
  if(!face || !pendingTool || !['hoseConnect','hoseReconnect'].includes(pendingTool.type)) return false;
  const tool={...pendingTool,targetType:'buildingFace',targetId:face.id,targetName:face.name};
  const reconnect=pendingTool.type==='hoseReconnect';
  pendingTool=null; selectedMapResource=null;
  if(reconnect){
    updateMapItemWithUndo('hoses',tool.hoseId,{targetType:'buildingFace',targetId:face.id,targetName:face.name,lat:null,lng:null},`重新指定水線終點至 ${face.name}`)
      .then(()=>addLog('hose',`重新指定水線終點：${face.name}`)).then(()=>{renderDeploymentPalette();renderMap();renderTacticalCanvasV3();});
  }else addHoseToTarget(tool).then(()=>{renderDeploymentPalette();renderMap();renderTacticalCanvasV3();});
  return true;
}
async function movePendingResourceTo(ll,label='指定位置'){
  if(!pendingTool || pendingTool.type!=='moveExisting') return false;
  const tool={...pendingTool};
  const item=(live[tool.coll]||[]).find(x=>x.id===tool.id);
  pendingTool=null; selectedMapResource=null;
  if(!item) return false;
  const before={lat:item.lat,lng:item.lng};
  await updateMapItemWithUndo(tool.coll,tool.id,{lat:Number(ll.lat),lng:Number(ll.lng),staged:false},'移動部署');
  pushMapUndo(`復原移動：${item.name||item.unit||item.type||''}`,async()=>updateItem(tool.coll,tool.id,before));
  await addLog('map',`部署至${label}：${item.name||item.unit||item.type||''}`);
  toast(`已部署至${label}`);
  renderDeploymentPalette(); renderMap();
  return true;
}


async function saveCaseInfo(showToast=true, logChange=true, commitSectionStates=false){
  if(!currentCase) return;
  const patch = {
    arrived:!!$('addressConfirmCheck')?.checked,
    commandState:getRadioValue('commandState') || '',
    commandTransfer:getRadioValue('commandState') === 'transferred',
    contactState: commitSectionStates ? getRadioValue('contactState') : currentCase.contactState||'',
    contactFound: commitSectionStates ? getRadioValue('contactState')==='found' : !!currentCase.contactFound,
    ritState: commitSectionStates ? getRadioValue('ritState') : currentCase.ritState||'',
    ritSet:commitSectionStates ? getRadioValue('ritState')==='assigned' : !!currentCase.ritSet,
    hazardState: commitSectionStates ? getRadioValue('hazardState') : currentCase.hazardState||'',
    hazardChecked:commitSectionStates ? ['has','none'].includes(getRadioValue('hazardState')) : !!currentCase.hazardChecked,
    firstSideState:getRadioValue('firstSideState') || '',
    firstSideSet:getRadioValue('firstSideState') === 'set',
    parRequested:$('parCheck').checked,
    supportState:commitSectionStates ? getRadioValue('supportState') : currentCase.supportState||'',
    supportNeeded:commitSectionStates ? getRadioValue('supportState')==='needed' : !!currentCase.supportNeeded,
    breakDoorState:getRadioValue('breakDoorState') || '',
    breakDoor:getRadioValue('breakDoorState') === 'required',
    breakDoorCommanderReport: $('breakDoorCommanderReport')?.checked || false,
    breakDoorCenterReport: $('breakDoorCenterReport')?.checked || false,
    breakDoorAt: $('breakDoorAt')?.value ? datetimeLocalToMs($('breakDoorAt').value) : null,
    breakDoorCompletedAt: $('breakDoorCompletedAt')?.value ? datetimeLocalToMs($('breakDoorCompletedAt').value) : null,
    breakDoorCompleted: !!$('breakDoorCompletedAt')?.value,
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
    firstSideMode:getRadioValue('firstSideMode') || '',
    firstSideCustom:$('firstSideCustom')?.value || '',
    firstSideName:getRadioValue('firstSideMode')==='custom' ? ($('firstSideCustom')?.value || '第一面') : '建物正面',
    firstSideNote:$('firstSideNote')?.value || '',
    parDetails:$('parDetails')?.value || '',
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
  patch.summary=buildExecutiveSummaryText(currentCase);
  patch.summaryUpdatedAt=Date.now();
  currentCase.summary=patch.summary;
  if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true});
  else { saveLocalCase(); renderDetail(); }
  if(logChange) await addLog('arrival','更新到場回報 / 到建火人支初資訊');
  if(!activeStage) activeStage='到';
  renderArrivalStatusCards(); renderCommandGuide();
  if(showToast) toast('已儲存到場回報');
}
async function saveSummaryInfo(){ toast('案件概要由流程 SOP、戰情與部署資料自動更新，請至對應功能頁修改。',4200); }
function readSupports(){ return Array.from(document.querySelectorAll('.support-grid input:checked')).map(x=>x.value); }
function applySupportValues(values=[]){ document.querySelectorAll('.support-grid input').forEach(x=>{ x.checked = values.includes(x.value); }); }

let contactEdit=null;
function readContacts(){return currentCase?.contacts||[];}
function contactKey(row,index){return row.id||`legacy_${index}`;}
function contactDetail(row={}){return String(row.detail||[row.appearance,row.note].filter(Boolean).join('／')||'').trim();}
function contactCardHtml(row={},actions=''){
 const pending=row.photoStatus==='pending';
 return `<div class="contact-card-body"><div class="contact-card-copy"><strong>${escapeHtml(row.name||'姓名待補')}</strong><p>${escapeHtml(row.phone||'電話待補')}</p><p>${escapeHtml(contactDetail(row)||'穿著／特徵／補充待補')}</p>${pending?'<p class="photo-pending">照片待重新上傳</p>':row.photoStatus==='local-demo'?'<p>合成照片｜本機示範，非雲端上傳</p>':''}<div class="record-actions">${actions}</div></div><div class="private-photo" data-photo-path="${escapeHtml(row.photoPath||'')}">${pending&&!row.photoPath?'照片待補':''}</div></div>`;
}
function renderContactRows(rows=[]){
  const wrap=$('contactRows');if(!wrap)return;
  if(contactEdit?.caseId!==currentCaseId)contactEdit=null;
  wrap.innerHTML=rows.map((r,index)=>`<article class="contact-row saved-record" data-contact-index="${index}">${contactCardHtml(r,`<button type="button" class="btn small ghost" data-edit-contact="${index}">修改</button><button type="button" class="btn small danger" data-delete-contact="${index}">刪除</button>`)}</article>`).join('');
  if(contactEdit){const r=contactEdit.data;wrap.insertAdjacentHTML('beforeend',`<div class="contact-row contact-editor"><div class="two-col compact-form"><div class="field"><label>姓名<input data-contact-field="name" value="${escapeHtml(r.name||'')}" /></label></div><div class="field"><label>電話<input data-contact-field="phone" inputmode="tel" value="${escapeHtml(r.phone||'')}" /></label></div></div><div class="field"><label>穿著／特徵／補充<textarea data-contact-field="detail" rows="3">${escapeHtml(contactDetail(r))}</textarea></label></div><label class="photo-input">拍照／更換照片<input id="contactPhotoInput" type="file" accept="image/*" capture="environment" /></label><div id="contactPhotoPreview" class="local-photo-preview"></div><div id="contactSaveStatus" class="hint" role="status">尚未儲存</div><div class="record-actions"><button type="button" class="btn small ghost" id="cancelContactEdit">取消</button><button type="button" class="btn primary" id="saveContactBtn">確認儲存</button></div></div>`);}
  wrap.querySelectorAll('[data-edit-contact]').forEach(btn=>btn.onclick=()=>{const index=Number(btn.dataset.editContact);contactEdit={caseId:currentCaseId,key:contactKey(rows[index],index),data:{...rows[index]}};renderContactRows(rows);});
  wrap.querySelectorAll('[data-delete-contact]').forEach(btn=>btn.onclick=()=>deleteContact(Number(btn.dataset.deleteContact)));
  wrap.querySelectorAll('[data-contact-field]').forEach(input=>input.oninput=()=>{contactEdit.data[input.dataset.contactField]=input.value;fieldEntryStatus('contactSaveStatus','尚未儲存');});
  $('contactPhotoInput')?.addEventListener('change',e=>{showLocalPhotoPreview(e.target.files[0],$('contactPhotoPreview'));fieldEntryStatus('contactSaveStatus','尚未儲存');});
  if($('cancelContactEdit'))$('cancelContactEdit').onclick=()=>{contactEdit=null;renderContactRows(currentCase.contacts||[]);};
  if($('saveContactBtn'))$('saveContactBtn').onclick=saveContactRecord;
  loadPrivatePhotos(wrap);
}
function addContactRow(){contactEdit={caseId:currentCaseId,key:null,data:{name:'',phone:'',detail:''}};renderContactRows(currentCase?.contacts||[]);}
async function updateCaseSection(revisionKey,derive){
  assertDemoCaseAccessV31();
  if(!currentCase)return;const caseId=currentCaseId,expected=Number(currentCase[revisionKey]||0);let patch;
  if(firebaseEnabled){const ref=db.collection('cases').doc(caseId);await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists||Number(snap.data()[revisionKey]||0)!==expected)throw Error('版本衝突待處理：請重新載入並核對資料');patch=derive(snap.data());tx.update(ref,{...patch,[revisionKey]:expected+1,updatedAt:Date.now()});});}
  else patch=derive(currentCase);
  if(caseId!==currentCaseId)return;
  Object.assign(currentCase,patch,{[revisionKey]:expected+1});
  if(!firebaseEnabled)saveLocalCase();
  renderArrivalStatusCards();renderCommandGuide();renderOverviewContent();scheduleDerivedSummaryPersist();
}
function assertCaseEditor(){assertDemoCaseAccessV31();if(!currentCase||currentCase.status==='closed')throw Error('案件未開啟');if(currentCase.mode==='practice'&&myTrainingRole()==='觀察員')throw Error('觀察員僅可閱覽');}
async function saveContactRecord(){const savedCaseId=currentCaseId;const edit=contactEdit;if(!edit)return;const button=$('saveContactBtn'),file=$('contactPhotoInput')?.files[0];button.disabled=true;fieldEntryStatus('contactSaveStatus','儲存中');
 try{assertCaseEditor();const data={name:String(edit.data.name||'').trim(),phone:String(edit.data.phone||'').trim(),detail:contactDetail(edit.data),appearance:contactDetail(edit.data),note:''};if(![data.name,data.phone,data.detail].some(Boolean))throw Error('請至少填一項關係人資訊');const key=edit.key||uid('contact');
  await updateCaseSection('contactsRevision',c=>{const rows=[...(c.contacts||[])],index=rows.findIndex((r,n)=>contactKey(r,n)===key);if(edit.key&&index<0)throw Error('版本衝突待處理：此關係人已被移除');const row={...(index>=0?rows[index]:{}),...data,...(file?{photoStatus:'pending'}:{}),id:index>=0?(rows[index].id||key):key};if(index<0)rows.push(row);else rows[index]=row;return {contacts:rows,contactFound:true,contactState:'found'};});contactEdit=null;renderContactRows(currentCase.contacts||[]);
  if(file){try{if(currentCaseId!==savedCaseId)return;const photoPath=await uploadCasePhoto('contacts',key,file);if(currentCaseId!==savedCaseId)return;await updateCaseSection('contactsRevision',c=>({contacts:(c.contacts||[]).map((r,n)=>contactKey(r,n)===key?{...r,photoPath,photoStatus:'ready'}:r)}));renderContactRows(currentCase.contacts||[]);toast('關係人與照片已同步儲存');}catch(err){if(currentCaseId!==savedCaseId)return;await updateCaseSection('contactsRevision',c=>({contacts:(c.contacts||[]).map((r,n)=>contactKey(r,n)===key?{...r,photoStatus:'pending'}:r)}));toast(`文字已儲存；照片未完成：${err.message}。請修改後重試。`,6500);contactEdit={caseId:currentCaseId,key,data};renderContactRows(currentCase.contacts||[]);fieldEntryStatus('contactSaveStatus','文字已同步儲存；照片待重新上傳');return;}}
  else toast('關係人已同步儲存');setRadioValue('contactState','found');
 }catch(err){fieldEntryStatus('contactSaveStatus',`儲存失敗：${err.message}`);}finally{if(button.isConnected)button.disabled=false;}}
async function deleteContact(index){const row=currentCase?.contacts?.[index];if(!row||!confirm(`確認刪除關係人「${row.name||'未命名'}」？`))return;const key=contactKey(row,index);try{assertCaseEditor();await updateCaseSection('contactsRevision',c=>({contacts:(c.contacts||[]).filter((r,n)=>contactKey(r,n)!==key)}));contactEdit=null;renderContactRows(currentCase.contacts||[]);try{await removeCasePhoto(row.photoPath);}catch{toast('關係人已刪除；舊照片清理失敗，請交由管理員檢查');return;}toast('已刪除關係人');}catch(err){toast(`刪除失敗：${err.message}`);}}
async function removeCasePhoto(path){if(path&&firebaseEnabled&&path.startsWith(`case-private/${currentCaseId}/`))await firebase.storage().ref(path).delete();}
function showLocalPhotoPreview(file,slot){if(!file||!slot)return;const url=URL.createObjectURL(file);slot.innerHTML='';const img=document.createElement('img');img.src=url;img.alt='尚未儲存的照片預覽';img.onload=()=>URL.revokeObjectURL(url);slot.appendChild(img);}
async function uploadCasePhoto(folder,key,file){
 assertCaseEditor();
 if(!['contacts','hazards'].includes(folder))throw Error('不支援的案件照片分類');
 if(!firebaseEnabled||!firebase.storage)throw Error('照片需在已連線且具有案件權限的環境上傳；此示範只保留文字並標示照片待重試');
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>=5*1024*1024)throw Error('請使用 5 MB 以下的 JPG、PNG 或 WebP');
 const caseId=currentCaseId,path=`case-private/${caseId}/${folder}/${encodeURIComponent(key)}-${uid('photo')}`;
 await firebase.storage().ref(path).put(file,{contentType:file.type,customMetadata:{caseId}});
 if(caseId!==currentCaseId)throw Error('案件已切換，請返回原案件重新確認照片');
 return path;
}
async function loadPrivatePhotos(root){
 if(isPreviewDemoV31()&&window.FCPreviewDemoV31.isDemoCase(currentCase)){for(const slot of root.querySelectorAll('[data-photo-path]')){const path=slot.dataset.photoPath;if(!window.FCPreviewDemoV31.isDemoPhoto(path))continue;const image=document.createElement('img');image.src=path;image.alt='合成示範照片，僅本機保存，未驗證雲端上傳';slot.appendChild(image);}}
 if(!firebaseEnabled||!fbUser||!window.FIRECOMMAND_FIREBASE_CONFIG?.storageBucket)return;
 const caseId=currentCaseId,bucket=window.FIRECOMMAND_FIREBASE_CONFIG.storageBucket;
 for(const slot of root.querySelectorAll('[data-photo-path]')){
  const path=slot.dataset.photoPath;if(!path||!path.startsWith(`case-private/${caseId}/`))continue;
  try{const token=await fbUser.getIdToken();const response=await fetch(`https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}?alt=media`,{headers:{Authorization:`Firebase ${token}`}});
   if(!response.ok)throw Error(String(response.status));const url=URL.createObjectURL(await response.blob());if(caseId!==currentCaseId||!slot.isConnected){URL.revokeObjectURL(url);continue;}
   const img=document.createElement('img');img.src=url;img.alt='案件附件照片，點擊可放大';img.onload=()=>{};img.onclick=()=>{const viewer=window.open();if(viewer){viewer.document.title='案件照片';const full=viewer.document.createElement('img');full.src=url;full.alt='案件照片';full.style.maxWidth='100%';viewer.document.body.appendChild(full);}};slot.appendChild(img);
  }catch{slot.textContent='照片暫無法載入，請確認案件權限與 Storage CORS 設定';}
 }
}
function renderHazardRecord(){
 const el=$('hazardSavedCard');if(!el||!currentCase)return;
 const r=currentCase.hazardRecord||((currentCase.hazardItems||currentCase.hazardContact)?{items:currentCase.hazardItems,contact:currentCase.hazardContact,phone:currentCase.hazardPhone,appearance:currentCase.hazardAppearance}:null);
 const person=r?{name:r.contactInfo?.name||r.contact||'',phone:r.contactInfo?.phone||r.phone||'',detail:r.contactInfo?.detail||r.appearance||'',photoPath:r.contactInfo?.photoPath||r.photoPath||'',photoStatus:r.contactInfo?.photoStatus||r.photoStatus||''}:null;
 el.innerHTML=r?`<article class="contact-row saved-record hazard-contact-card"><div class="hazard-record-title"><b>危險物／危害資訊</b><p>${escapeHtml(r.items||'待補')}</p></div>${contactCardHtml(person,`<button class="btn small ghost" id="editHazardBtn" type="button">修改</button><button class="btn small danger" id="deleteHazardBtn" type="button">刪除</button>`)}</article>`:'';
 $('editHazardBtn')?.addEventListener('click',()=>{$('hazardEditFields').hidden=false;$('hazardItems').focus();});
 $('deleteHazardBtn')?.addEventListener('click',async()=>{if(!confirm('確認刪除這筆危險物品資訊？'))return;try{assertCaseEditor();await updateCaseSection('hazardRevision',()=>({hazardRecord:null,hazardItems:'',hazardContact:'',hazardPhone:'',hazardAppearance:'',hazardState:'',hazardChecked:false}));['hazardItems','hazardContact','hazardPhone','hazardAppearance'].forEach(id=>$(id).value='');renderHazardRecord();try{await removeCasePhoto(r.contactInfo?.photoPath||r.photoPath);}catch{toast('危險物品紀錄已刪；舊照片清理失敗，請交由管理員檢查');return;}toast('已刪除危險物品資訊');}catch(e){toast(`刪除失敗：${e.message}`);}});
 $('hazardEditFields').hidden=!!r&&person?.photoStatus!=='pending';$('hazardPhoto')&&($('hazardPhoto').value='');if($('hazardPhotoPreview'))$('hazardPhotoPreview').innerHTML='';if(person?.photoStatus==='pending')fieldEntryStatus('hazardSaveStatus','文字已同步儲存；照片待重新上傳');loadPrivatePhotos(el);
}
async function saveHazardRecord(){const savedCaseId=currentCaseId;const button=$('hazardSaveBtn'),file=$('hazardPhoto')?.files[0];button.disabled=true;fieldEntryStatus('hazardSaveStatus','儲存中');try{assertCaseEditor();const data={items:$('hazardItems').value.trim(),contact:$('hazardContact').value.trim(),phone:$('hazardPhone').value.trim(),appearance:$('hazardAppearance').value.trim()};if(!Object.values(data).some(Boolean))throw Error('請先填寫危險物品資訊');const contactInfo={name:data.contact,phone:data.phone,detail:data.appearance};await updateCaseSection('hazardRevision',c=>({hazardRecord:{...(c.hazardRecord||{}),...data,...(file?{photoStatus:'pending'}:{}),contactInfo:{...(c.hazardRecord?.contactInfo||{}),...contactInfo,...(file?{photoStatus:'pending'}:{})}},hazardItems:data.items,hazardContact:data.contact,hazardPhone:data.phone,hazardAppearance:data.appearance,hazardState:'has',hazardChecked:true}));
 if(file){try{if(currentCaseId!==savedCaseId)return;const path=await uploadCasePhoto('hazards','hazard',file);if(currentCaseId!==savedCaseId)return;await updateCaseSection('hazardRevision',c=>({hazardRecord:{...(c.hazardRecord||{}),photoPath:path,photoStatus:'ready',contactInfo:{...(c.hazardRecord?.contactInfo||{}),photoPath:path,photoStatus:'ready'}}}));toast('危險物品與照片已同步儲存');}catch(e){if(currentCaseId!==savedCaseId)return;await updateCaseSection('hazardRevision',c=>({hazardRecord:{...(c.hazardRecord||{}),photoStatus:'pending',contactInfo:{...(c.hazardRecord?.contactInfo||{}),photoStatus:'pending'}}}));toast(`文字已儲存；照片未完成：${e.message}`,6500);renderHazardRecord();$('hazardEditFields').hidden=false;fieldEntryStatus('hazardSaveStatus','文字已同步儲存；照片待重新上傳');return;}}else toast('危險物品已同步儲存');setRadioValue('hazardState','has');renderHazardRecord();
 }catch(e){fieldEntryStatus('hazardSaveStatus',`儲存失敗：${e.message}`);}finally{button.disabled=false;}}
const externalSupportOptions={'台電':['斷電','其他'],'瓦斯單位':['斷瓦斯','其他'],'警察':['交通管制','其他'],'台水':['斷水','其他'],'毒災應變隊':['其他'],'其他單位':['其他']};
function addExternalSupportRow(record={}){const wrap=$('externalSupportRows');if(!wrap)return;const div=document.createElement('div');div.className='external-support-row';div.innerHTML=`<select aria-label="外單位">${Object.keys(externalSupportOptions).map(v=>`<option ${v===record.unit?'selected':''}>${v}</option>`).join('')}</select><select aria-label="支援事項"></select><input aria-label="其他支援事項" placeholder="其他需求補充" value="${escapeHtml(record.detail||'')}" hidden /><button type="button" class="btn small ghost">移除</button>`;
 const [unit,task,detail,remove]=div.children;const update=()=>{const values=externalSupportOptions[unit.value];task.innerHTML=values.map(v=>`<option ${v===record.task?'selected':''}>${v}</option>`).join('');detail.hidden=task.value!=='其他';};unit.onchange=()=>{record.task='';update();fieldEntryStatus('supportSaveStatus','尚未儲存');};task.onchange=()=>{detail.hidden=task.value!=='其他';fieldEntryStatus('supportSaveStatus','尚未儲存');};detail.oninput=()=>fieldEntryStatus('supportSaveStatus','尚未儲存');remove.onclick=()=>{div.remove();fieldEntryStatus('supportSaveStatus','尚未儲存');};update();wrap.appendChild(div);}
function renderSupportRequests(){if(!$('externalSupportRows')||!currentCase)return;const legacy=(currentCase.supports||[]).filter(x=>!['水車','水庫車','雲梯車','救護車','排煙車','照明車','大隊支援'].includes(x)).map(x=>({kind:'external',unit:x==='瓦斯'?'瓦斯單位':x,task:'其他',detail:''}));const rows=currentCase.supportRequests||legacy;$('externalSupportRows').innerHTML='';rows.filter(r=>r.kind==='external').forEach(addExternalSupportRow);$('externalSupportFields').hidden=!rows.some(r=>r.kind==='external');}
async function saveSupportRequests(){const btn=$('supportSaveBtn');btn.disabled=true;fieldEntryStatus('supportSaveStatus','儲存中');try{assertCaseEditor();const fire=readSupports(),external=[...document.querySelectorAll('.external-support-row')].map(row=>{const [unit,task,detail]=row.children;return {kind:'external',unit:unit.value,task:task.value,detail:task.value==='其他'?detail.value.trim():'',status:'requested'};});const requests=[...fire.map(unit=>({kind:'fire',unit,status:'requested'})),...external];const details=$('supportDetails').value.trim();await updateCaseSection('supportRevision',()=>({supports:[...fire,...external.map(r=>r.unit)],supportRequests:requests,supportDetails:details,supportState:requests.length||details?'needed':'none',supportNeeded:!!(requests.length||details)}));fieldEntryStatus('supportSaveStatus',firebaseEnabled?'已同步儲存':'已存本機（示範模式，未同步）');toast('支援需求已儲存；尚未標記聯絡或完成');}catch(e){fieldEntryStatus('supportSaveStatus',`儲存失敗：${e.message}`);}finally{btn.disabled=false;}}
function renderRitUnit(){if(!$('ritBrigade')||!currentCase)return;const brigade=$('ritBrigade'),unit=$('ritUnitSelect');const name=currentCase.ritUnit||'';const match=Object.keys(UNIT_TREE).find(b=>FCFieldEntry.validUnit(UNIT_TREE,b,name));brigade.innerHTML=Object.keys(UNIT_TREE).map(b=>`<option ${b===(currentCase.ritBrigade||match)?'selected':''}>${escapeHtml(b)}</option>`).join('');const fill=()=>{unit.innerHTML=`<option value="">請選擇分隊／單位</option>`+FCFieldEntry.unitOptions(UNIT_TREE,brigade.value).flatMap(x=>x.units).map(x=>`<option ${x===name?'selected':''}>${escapeHtml(x)}</option>`).join('');if(name&&!match){unit.add(new Option(`${name}（歷史資料，請核對）`,name));unit.value=name;}};fill();brigade.onchange=()=>{unit.value='';fill();fieldEntryStatus('ritSaveStatus','尚未儲存');};unit.onchange=()=>fieldEntryStatus('ritSaveStatus','尚未儲存');$('ritNote').oninput=()=>fieldEntryStatus('ritSaveStatus','尚未儲存');}
async function saveRitUnit(){const btn=$('ritSaveBtn'),brigade=$('ritBrigade').value,unit=$('ritUnitSelect').value;btn.disabled=true;fieldEntryStatus('ritSaveStatus','儲存中');try{assertCaseEditor();if(!FCFieldEntry.validUnit(UNIT_TREE,brigade,unit))throw Error('請選正確大隊及分隊');const note=$('ritNote').value.trim();await updateCaseSection('ritRevision',()=>({ritBrigade:brigade,ritUnit:unit,ritNote:note,ritState:'assigned',ritSet:true}));$('ritUnit').value=unit;fieldEntryStatus('ritSaveStatus',firebaseEnabled?'已同步儲存':'已存本機（示範模式，未同步）');toast('RIT 單位已儲存；補充說明不代表裝備已確認');}catch(e){fieldEntryStatus('ritSaveStatus',`儲存失敗：${e.message}`);}finally{btn.disabled=false;}}

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
  lastMapDiagnostics=[`FireCommand v26 定位診斷｜${new Date().toLocaleString('zh-TW',{hour12:false})}`,...rows.map(r=>`${r.name}：${label[r.status]}｜${r.detail}`)].join('\n');
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
      zoom:20,
      mapTypeId:'roadmap',
      mapTypeControl:false,
      scaleControl:true,
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
  buildingBoxRotationMarker=null;
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
  if(className.includes('building-rotate')) return {bg:'#245fc6',fg:'#fff'};
  if(className.includes('building-handle')) return {bg:'#a43a30',fg:'#fff'};
  if(className.includes('face')) return {bg:'#fffdf8',fg:'#1d1a17'};
  return {bg:'#fffdf8',fg:'#111827'};
}
function googleMarkerIcon(text,className='hazard'){
  const style=googleMarkerStyle(className);
  const clean=String(text||'標示').slice(0,24);
  const car=className.startsWith('veh ')?clean.match(/([\u4e00-\u9fff]{2,4})(\d{2,3})/):null;
  if(car){
    const w=70,h=66,dir=(clean.match(/[←→↑↓↗↘↙↖]/)||[''])[0];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="2" y="2" width="66" height="58" rx="9" fill="${style.bg}" stroke="white" stroke-width="2"/><text x="35" y="20" text-anchor="middle" font-family="sans-serif" font-size="14" fill="white">${escapeXml(car[1])}</text><text x="35" y="39" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="white">${escapeXml(car[2])}</text><text x="35" y="55" text-anchor="middle" font-family="sans-serif" font-size="12" fill="white">${dir}${clean.includes('頭車')?' 頭車':''}</text></svg>`;
    return {url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg),scaledSize:new google.maps.Size(w,h),anchor:new google.maps.Point(w/2,h/2)};
  }
  const width=Math.min(260,Math.max(70,clean.length*15+26));
  const height=40;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect x="1" y="1" width="${width-2}" height="32" rx="16" fill="${style.bg}" stroke="#ffffff" stroke-width="2"/><path d="M ${width/2-6} 32 L ${width/2} 39 L ${width/2+6} 32 Z" fill="${style.bg}"/><text x="${width/2}" y="22" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Noto Sans TC,sans-serif" font-size="13" font-weight="800" fill="${style.fg}">${escapeXml(clean)}</text></svg>`;
  return {url:`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,scaledSize:new google.maps.Size(width,height),anchor:new google.maps.Point(width/2,height)};
}
function hosePath30(h,from,to){
 const a={lat:Number(from[0]),lng:Number(from[1])},b={lat:Number(to[0]),lng:Number(to[1])};
 const entryCrew=h.targetType==='buildingFace'?live.crews.find(p=>p.interior&&p.unit===(h.owner||h.unit)&&p.face===h.targetName):null;
 const append=path=>entryCrew?[...path,{lat:Number(entryCrew.lat),lng:Number(entryCrew.lng)}]:path;
 const peers=live.hoses.filter(x=>x.vehicleId===h.vehicleId&&x.unit===h.unit&&x.targetType===h.targetType&&x.targetId===h.targetId).sort((x,y)=>x.id.localeCompare(y.id));
 if(peers.length<2)return append([a,b]);
 const index=peers.findIndex(x=>x.id===h.id),offset=(index-(peers.length-1)/2)*4;
 const mean=(a.lat+b.lat)/2,dx=(b.lng-a.lng)*111320*Math.cos(mean*Math.PI/180),dy=(b.lat-a.lat)*111320,length=Math.hypot(dx,dy)||1;
 return append([a,{lat:(a.lat+b.lat)/2+metersToLatDelta(dx/length*offset),lng:(a.lng+b.lng)/2+metersToLngDelta(-dy/length*offset,mean)},b]);
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
    onClick:marker=>{
      if(pendingTool?.type==='moveExisting'){ movePendingResourceTo(center,'案件中心'); return; }
      openMapInfo(marker,`<b>案件中心</b><div class="meta">來源：${escapeHtml(locationSourceLabel(locationMeta.source||'legacy'))}<br>狀態：${escapeHtml(locationQualityLabel(locationMeta))}<br>人車可直接部署至此位置；水線請優先連接建物四面。</div>`);
    }});
  renderBuildingBoxOnMap();

  live.hoses.forEach(h=>{
    const pts=getHosePoints(h), from=pts.from, to=pts.to;
    if(!from||!to) return;
    const path=hosePath30(h,from,to);
    const poly=addMapOverlay(new google.maps.Polyline({map,path,strokeColor:h.supplyUnconfirmed?'#b7791f':'#245fc6',strokeWeight:6,strokeOpacity:h.supplyUnconfirmed?0:.88,...(h.supplyUnconfirmed?{icons:[{icon:{path:'M 0,-1 0,1',strokeOpacity:1,scale:3},offset:'0',repeat:'14px'}]}:{}),clickable:true,zIndex:20}));
    const hoseSourceName=h.supplyUnconfirmed?`${h.unit}（供水起點待確認）`:vehicleDisplayName({name:h.vehicleName,vehicleName:h.vehicleName,unit:h.unit});
    const info=`<b>${escapeHtml(hoseSourceName)} ${escapeHtml(h.port||'')}</b><div class="meta">歸屬：${escapeHtml(h.owner||h.unit||'')}<br>目的地：${escapeHtml(h.targetName||'地圖點')}<br>性質：${escapeHtml(h.kind||'水線')}<br>任務：${escapeHtml(h.task||'')}</div><div class="popup-actions"><button data-map-action="editHose" data-id="${h.id}">修改</button><button data-map-action="deleteHose" data-id="${h.id}">刪除</button></div>`;
    poly.addListener('click',ev=>{ mapInfoWindow.setPosition(ev.latLng); mapInfoWindow.setContent(`<div class="google-info-card">${info}</div>`); mapInfoWindow.open({map,shouldFocus:false}); });
    const mid=path.length===3?path[1]:{lat:(path[0].lat+path[1].lat)/2,lng:(path[0].lng+path[1].lng)/2};
    makeGoogleMarker({position:mid,text:`💧 ${h.port||''}｜${h.owner||hoseSourceName}`,className:'hose-label',onClick:m=>openMapInfo(m,info),zIndex:40});
    if(h.targetType==='map' && h.lat && h.lng){
      makeGoogleMarker({position:{lat:Number(h.lat),lng:Number(h.lng)},text:'💧 水線終點',className:'hose-label',draggable:true,zIndex:45,
        onDragEnd:async ll=>{ await updateMapItemWithUndo('hoses',h.id,{lat:ll.lat,lng:ll.lng,targetName:'地圖點 / 手動調整'},`水線終點：${hoseSourceName}`); await addLog('hose',`移動水線終點：${hoseSourceName}`); },
        onClick:m=>openMapInfo(m,info)});
    }
  });
  tacticalZones31().forEach(z=>makeGoogleMarker({position:{lat:z.lat,lng:z.lng},text:z.label+'｜'+z.face,className:'zone31',zIndex:80,onClick:m=>openMapInfo(m,`<b>${escapeHtml(z.label)}</b><div>${escapeHtml(z.face)}｜依回報配置</div>`)}));
  live.vehicles.forEach(v=>{
    const marker=makeGoogleMarker({position:{lat:Number(v.lat),lng:Number(v.lng)},text:`${vehEmoji(v.type)} ${vehicleDisplayName(v)}${Number.isFinite(v.heading31)?' '+(['↑','↗','→','↘','↓','↙','←','↖'][Math.round(v.heading31/45)%8]):''}${v.queueOrder===0?' 頭車':''}`,className:`veh ${vehClass(v.type)}`,draggable:true,zIndex:100,
      onDragEnd:async ll=>{ await updateMapItemWithUndo('vehicles',v.id,{lat:ll.lat,lng:ll.lng,staged:false},`移動${vehicleDisplayName(v)}`); await addLog('vehicle',`${vehicleDisplayName(v)} 部署位置更新`); },
      onClick:m=>{
        if(completeQuickHoseTarget('vehicle',v)) return;
        openMapInfo(m,`<b>${escapeHtml(vehicleDisplayName(v))}</b><div class="meta">${escapeHtml(v.unit)}｜${escapeHtml(v.type)}<br>任務：${escapeHtml(v.task)}<br>${v.canHose?'水線接口：1～4線':'不可接水線'}</div><div class="popup-actions">${v.canHose?`<button data-resource-action="quickHose" data-resource-id="${v.id}">拉水線</button>`:''}<button data-map-action="editVehicle" data-id="${v.id}">修改</button><button data-map-action="deleteVehicle" data-id="${v.id}">刪除</button></div>`);
      }});
  });
  live.crews.forEach(p=>{
    makeGoogleMarker({position:{lat:Number(p.lat),lng:Number(p.lng)},text:`👥 ${p.unit}${p.leader||''}｜${crewCount31(p)}${p.interior?' · 建物內':''}`,className:`person ${personClass(p.status)}`,draggable:true,zIndex:110,
      onDragEnd:async ll=>handleCrewDragEnd(p,ll),
      onClick:m=>{
        if(completeQuickHoseTarget('crew',p)) return;
        openMapInfo(m,`<b>${escapeHtml(p.unit)}${escapeHtml(p.leader)}</b><div class="meta">${crewCount31(p)}｜${escapeHtml(p.status)}<br>${escapeHtml(p.task)}${p.interior?'<br>建物內':''}${p.floor?'<br>樓層：'+escapeHtml(p.floor):''}</div><div class="popup-actions"><button data-map-action="editCrew" data-id="${p.id}">修改</button><button data-map-action="restCrew" data-mode="原地休息" data-id="${p.id}">原地休息</button><button data-map-action="restCrew" data-mode="移至休息區" data-id="${p.id}">移至休息區</button><button data-map-action="deleteCrew" data-id="${p.id}">刪除</button></div>`);
      }});
  });
  live.hazards.forEach(h=>{
    makeGoogleMarker({position:{lat:Number(h.lat),lng:Number(h.lng)},text:`${hazEmoji(h.type)} ${h.type}`,className:'hazard',draggable:true,zIndex:120,
      onDragEnd:async ll=>{ await updateMapItemWithUndo('hazards',h.id,{lat:ll.lat,lng:ll.lng},`移動${h.type}`); await addLog('hazard',`${h.type} 標示位置更新`); },
      onClick:m=>openMapInfo(m,`<b>${escapeHtml(h.type)}</b><div class="popup-actions"><button data-map-action="editHazard" data-id="${h.id}">修改</button><button data-map-action="deleteHazard" data-id="${h.id}">刪除</button></div>`)});
  });
  renderDeploymentPalette();
}
function tacticalZones31(){
 const zones=currentCase?.tacticalZones||{},result=Object.entries(zones).map(([id,z])=>({id:'zone31_'+id,...z}));
 if(live.crews.some(p=>p.status==='待命')){const pt=tacticalPosition31(zones.command?.face||'第一面','standby',0);result.push({id:'zone31_standby',label:'待命區',face:zones.command?.face||'第一面',lat:pt.lat+metersToLatDelta(4),lng:pt.lng});}
 return result;
}
function crewCount31(p){return FCFieldEntry.countLabel(p);}
function getHosePoints(h){
  const v = live.vehicles.find(x=>x.id===h.vehicleId);
  const schematic=h.supplyUnconfirmed?intakePosition28(h.sourceFace||h.targetName,live.hoses.indexOf(h)):null;
  const from = v ? [Number(v.lat), Number(v.lng)] : schematic?[schematic.lat,schematic.lng]:h.from;
  let target = null;
  if(h.targetType === 'vehicle') target = live.vehicles.find(x=>x.id===h.targetId);
  if(h.targetType === 'crew') target = live.crews.find(x=>x.id===h.targetId);
  if(h.targetType === 'buildingFace') target = buildingFaceById(h.targetId);
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
  if(ll&&typeof acceptRoadClick32==='function'&&acceptRoadClick32(ll))return;
  if(!ll || !pendingTool) return;
  if(pendingTool.type==='hazard') await addHazardAt(pendingTool.hazardType,ll.lat,ll.lng);
  else if(pendingTool.type==='hose' || pendingTool.type==='hoseConnect'){
    toast('請直接點選另一台車、人員編組，或建物第一、二、三、四面作為水線終點。',4800);
    return;
  }
  else if(pendingTool.type==='hoseReconnect'){
    toast('請直接點選新的車輛、人員編組，或建物第一、二、三、四面。',4800);
    return;
  }
  else if(pendingTool.type==='buildingBoxCenter') await saveBuildingBox({lat:ll.lat,lng:ll.lng},'設定建物中心框中心點');
  else if(pendingTool.type==='incidentCenter') await setIncidentLocation({lat:ll.lat,lng:ll.lng,source:'manual',formattedAddress:currentCase?.address||''},false);
  else if(pendingTool.type==='moveExisting'){
    await movePendingResourceTo(ll,'地圖指定位置');
    return;
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
      const item=(live[data.coll]||[]).find(x=>x.id===data.id);
      if(!item) return;
      await updateMapItemWithUndo(data.coll,data.id,{lat:ll.lat,lng:ll.lng,staged:false},`拖放部署 ${data.label||data.id}`);
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

function updateMapUndoButton(){
  const btn=$('mapUndoBtn'); if(!btn) return;
  const last=mapUndoStack[mapUndoStack.length-1];
  btn.disabled=!last;
  btn.textContent=last?`↶ ${last.label}`:'↶ 回復上一步';
}
function pushMapUndo(label,undo){
  if(suppressMapUndo || typeof undo!=='function') return;
  mapUndoStack.push({label:String(label||'回復上一步'),undo});
  if(mapUndoStack.length>20) mapUndoStack.shift();
  updateMapUndoButton();
}
async function undoLastMapAction(){
  const action=mapUndoStack.pop(); updateMapUndoButton();
  if(!action){ toast('目前沒有可回復的地圖操作'); return; }
  try{
    suppressMapUndo=true;
    await action.undo();
    await addLog('map',action.label);
    toast(action.label,3200);
  }catch(err){
    console.error('map undo failed',err);
    toast(`回復失敗：${err.message||err}`,4200);
  }finally{
    suppressMapUndo=false;
    renderMap(); renderDeploymentPalette(); renderTacticalCanvasV3(); renderOverviewContent();
  }
}
function clonePlain(value){ return JSON.parse(JSON.stringify(value||{})); }
async function restoreMapRecords(records=[]){
  for(const record of records){
    if(!record?.coll||!record?.id) continue;
    const data=clonePlain(record.data);
    if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).collection(record.coll).doc(record.id).set(data);
    else{
      const arr=live[record.coll]||[];
      const idx=arr.findIndex(x=>x.id===record.id);
      if(idx>=0) arr[idx]={id:record.id,...data}; else arr.push({id:record.id,...data});
    }
  }
  if(!firebaseEnabled){ saveLocalCase(); renderLiveParts(); }
}
function mapFace30(lat,lng){const b=getBuildingBox(),p=latLngToLocalPoint(b,lat,lng);return Math.abs(p.x)/(b.widthM||40)>Math.abs(p.y)/(b.heightM||28)?(p.x>0?'第二面':'第四面'):(p.y<0?'第一面':'第三面');}
async function moveLinkedVehicles30(id,patch,label){
 const state=intakeSnapshot28(),anchor=state.vehicles.find(v=>v.id===id);if(!anchor)return;
 const group=FCIntake29.connectedVehicles(state,id),dlat=Number(patch.lat)-Number(anchor.lat),dlng=Number(patch.lng)-Number(anchor.lng),commandId=uid('chain');
 const face=mapFace30(patch.lat,patch.lng);
 const writes=stampWrites28(group.map(v=>({coll:'vehicles',id:v.id,before:v,after:{...v,...patch,positionManual:true,lat:Number(v.lat)+dlat,lng:Number(v.lng)+dlng,face,anchorBuilding:true,staged:false}})),commandId);
 const caseId=currentCaseId,event={id:commandId,caseId,kind:'apply',raw:'',corrected:'',corrections:[],writes,caseChanges:[],createdAt:Date.now(),authorUid:profile.id,operator:radioCallSign(),summary:`移動供水車組：${group.map(v=>v.name).join('、')}，${face}`};
 const result=await commitIntake28(event,intakeRevision28());
 if(caseId!==currentCaseId)return;
 if(firebaseEnabled){for(const w of writes){const v=live.vehicles.find(v=>v.id===w.id);if(v)Object.assign(v,w.after);}currentCase.resourceRevision=result.revision;currentCase.deploymentTextSource='intake';if(!live.intakeEvents.some(e=>e.id===event.id))live.intakeEvents.push(event);}
 pushMapUndo(`復原${label||'車組移動'}`,()=>undoIntake28(commandId));renderLiveParts();
}

async function updateMapItemWithUndo(coll,id,patch,label){
  if(coll==='vehicles'&&Number.isFinite(patch?.lat)&&Number.isFinite(patch?.lng)&&FCIntake29.connectedVehicles(intakeSnapshot28(),id).length>1)return moveLinkedVehicles30(id,patch,label);
  if(['vehicles','crews'].includes(coll)&&Number.isFinite(patch?.lat)&&Number.isFinite(patch?.lng))patch={...patch,positionManual:true,face:mapFace30(patch.lat,patch.lng)};
  const item=(live[coll]||[]).find(x=>x.id===id); if(!item) return;
  const before={}; Object.keys(patch||{}).forEach(k=>before[k]=item[k]);
  await updateItem(coll,id,patch);
  pushMapUndo(`復原${label||'地圖操作'}`,async()=>updateItem(coll,id,before));
}
async function addItem(coll, data){
  assertDemoCaseAccessV31();
  if(currentCase?.mode==='practice'&&myTrainingRole()==='觀察員'&&!isPracticeHost())throw Error('觀察員僅可閱覽，請以受測角色加入');
  data.createdAt = data.createdAt || Date.now();
  if(currentCase?.mode==='practice'&&!['simulationEvents','players','practiceMessages'].includes(coll))data.authorUid=profile.id;
  if(firebaseEnabled){
    const parent=db.collection('cases').doc(currentCaseId),ref=parent.collection(coll).doc();
    const batch=db.batch();batch.set(ref,data);
    if(FCIntake.collections.includes(coll))batch.update(parent,{resourceRevision:firebase.firestore.FieldValue.increment(1)});
    await batch.commit();return ref.id;
  }
  const id=uid(coll);
  live[coll]=live[coll]||[];
  live[coll].push({ id, ...data });
  if(FCIntake.collections.includes(coll))currentCase.resourceRevision=(currentCase.resourceRevision||0)+1;
  saveLocalCase(); renderLiveParts();
  return id;
}
async function deleteMapRecordSilent(coll,id){
  assertDemoCaseAccessV31();
  if(firebaseEnabled){const parent=db.collection('cases').doc(currentCaseId),batch=db.batch();batch.delete(parent.collection(coll).doc(id));if(FCIntake.collections.includes(coll))batch.update(parent,{resourceRevision:firebase.firestore.FieldValue.increment(1)});await batch.commit();}
  else{
    const arr=live[coll]||[]; const idx=arr.findIndex(x=>x.id===id); if(idx>=0) arr.splice(idx,1);if(FCIntake.collections.includes(coll))currentCase.resourceRevision=(currentCase.resourceRevision||0)+1;
    saveLocalCase(); renderLiveParts();
  }
}
async function updateItem(coll, id, patch){
  assertDemoCaseAccessV31();
  if(currentCase?.mode==='practice'&&myTrainingRole()==='觀察員'&&!isPracticeHost())throw Error('觀察員僅可閱覽');
  patch.updatedAt = Date.now();
  if(['vehicles','crews'].includes(coll)&&('lat' in patch||'lng' in patch))patch.anchorBuilding=false;
  if(firebaseEnabled){const parent=db.collection('cases').doc(currentCaseId),batch=db.batch();batch.set(parent.collection(coll).doc(id),patch,{merge:true});if(FCIntake.collections.includes(coll))batch.update(parent,{resourceRevision:firebase.firestore.FieldValue.increment(1)});await batch.commit();}
  else { const arr=live[coll]||[]; const item=arr.find(x=>x.id===id); if(item) Object.assign(item,patch);if(FCIntake.collections.includes(coll))currentCase.resourceRevision=(currentCase.resourceRevision||0)+1; saveLocalCase(); renderLiveParts(); }
}
async function deleteItem(coll,id,label='資料'){await deleteMapRecordSilent(coll,id);await addLog(coll,`刪除${label}`);}

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
  const ambulance=/救護/.test(v.type||'')||/^9/.test(String(v.vehicleCode||v.name||'').replace(/\D/g,''));
  const choices=ambulance?['救護區','救護集結區','傷患後送','待命']:['第一線攻擊','佔據水源','供水','待命'];
  openActionSheet(`車輛｜${vehicleDisplayName(v)}`,`<div class="field"><label>任務</label><input id="sheetVehicleTask" value="${escapeHtml(v.task||'')}" /></div><div class="choice-row">${choices.map(task=>`<button class="action-option" data-fill-target="sheetVehicleTask" data-fill-value="${task}">${task}</button>`).join('')}</div><div class="button-row"><button id="saveVehicleSheetBtn" class="btn primary">儲存</button><button id="deleteVehicleSheetBtn" class="btn ghost">刪除車輛</button></div>`);
  bindQuickFillButtons($('appActionBody'));
  $('saveVehicleSheetBtn').onclick=async()=>{ const task=$('sheetVehicleTask').value.trim()||v.task||'部署'; await updateItem('vehicles',id,{task}); await addLog('vehicle',`修改車輛任務：${v.name} → ${task}`); closeActionSheet(); };
  $('deleteVehicleSheetBtn').onclick=()=>{ closeActionSheet(); deleteVehicle(id); };
}
async function deleteVehicle(id){
  const v=live.vehicles.find(x=>x.id===id); if(!v) return;
  const linked=live.hoses.filter(h=>h.vehicleId===id||h.targetId===id);
  const name=vehicleDisplayName(v);
  if(!confirm(`確認刪除 ${name}？${linked.length?`
注意：相關水線 ${linked.length} 條也會刪除。`:''}`)) return;
  const records=[{coll:'vehicles',id:v.id,data:clonePlain(v)},...linked.map(h=>({coll:'hoses',id:h.id,data:clonePlain(h)}))];
  for(const h of linked) await deleteItem('hoses',h.id,`相關水線 ${h.port||''}`);
  await deleteItem('vehicles',id,name);
  pushMapUndo(`復原刪除 ${name}`,async()=>restoreMapRecords(records));
}
async function editCrew(id){
  const p=live.crews.find(x=>x.id===id); if(!p) return;
  const statuses=['作業中','待命','休息','RIT','撤出'].map(x=>`<option ${p.status===x?'selected':''}>${x}</option>`).join('');
  openActionSheet(`人員｜${p.unit}${p.leader}`,`<div class="field"><label>任務</label><input id="sheetCrewTask" value="${escapeHtml(p.task||'')}" /></div><div class="choice-row"><button class="action-option" data-fill-target="sheetCrewTask" data-fill-value="第一面內攻">第一面內攻</button><button class="action-option" data-fill-target="sheetCrewTask" data-fill-value="人命搜救">人命搜救</button><button class="action-option" data-fill-target="sheetCrewTask" data-fill-value="RIT待命">RIT待命</button><button class="action-option" data-fill-target="sheetCrewTask" data-fill-value="佔據水源">佔據水源</button></div><div class="field"><label>樓層／位置</label><input id="sheetCrewFloor31" value="${escapeHtml(p.floor||'')}" placeholder="例如3樓；俯視圖位置不變" /></div><div class="two-col"><div class="field"><label>狀態</label><select id="sheetCrewStatus">${statuses}</select></div><div class="field"><label>人數</label><input id="sheetCrewCount" type="number" min="0" step="1" placeholder="人數待補" value="${FCFieldEntry.unknown(p)?'':escapeHtml(p.count)}" /></div></div><div class="button-row"><button id="saveCrewSheetBtn" class="btn primary">儲存</button><button id="deleteCrewSheetBtn" class="btn ghost">刪除編組</button></div>`);
  bindQuickFillButtons($('appActionBody'));
  $('saveCrewSheetBtn').onclick=async()=>{const parsed=FCFieldEntry.parseCount($('sheetCrewCount').value);if(!parsed.valid){toast('人數只接受空白或 0–99 整數');return;}const patch={floor:$('sheetCrewFloor31').value.trim(),task:$('sheetCrewTask').value.trim()||p.task,status:$('sheetCrewStatus').value,count:parsed.count,countUnknown:parsed.count===null};await updateItem('crews',id,patch);await addLog('crew',`修改人員：${p.unit}${p.leader}｜${patch.status}｜${patch.task}`);closeActionSheet();};
  $('deleteCrewSheetBtn').onclick=()=>{ closeActionSheet(); deleteCrew(id); };
}
async function deleteCrew(id){
  const p=live.crews.find(x=>x.id===id); if(!p) return;
  const linked=live.hoses.filter(h=>h.targetType==='crew'&&h.targetId===id);
  if(!confirm(`確認刪除 ${p.unit}${p.leader}？${linked.length?`
相關水線 ${linked.length} 條會保留在原部署位置。`:''}`)) return;
  const records=[{coll:'crews',id:p.id,data:clonePlain(p)},...linked.map(h=>({coll:'hoses',id:h.id,data:clonePlain(h)}))];
  for(const h of linked) await updateItem('hoses',h.id,{targetType:'map',targetId:null,lat:p.lat,lng:p.lng,targetName:`${p.unit}${p.leader} 原部署位置`});
  await deleteItem('crews',id,`${p.unit}${p.leader}`);
  pushMapUndo(`復原刪除 ${p.unit}${p.leader}`,async()=>restoreMapRecords(records));
}
async function editHazard(id){
  const h=live.hazards.find(x=>x.id===id); if(!h) return;
  const types=['起火點','瓦斯','高壓電','危險物','前進指揮所','休息區','救護區','警戒區'];
  openActionSheet(`標示｜${h.type}`,`<div class="field"><label>標示類型</label><select id="sheetHazardType">${types.map(x=>`<option ${x===h.type?'selected':''}>${x}</option>`).join('')}<option ${types.includes(h.type)?'':'selected'}>其他</option></select></div><div class="field"><label>自訂名稱（選其他時使用）</label><input id="sheetHazardCustom" value="${types.includes(h.type)?'':escapeHtml(h.type||'')}" /></div><div class="button-row"><button id="saveHazardSheetBtn" class="btn primary">儲存</button><button id="deleteHazardSheetBtn" class="btn ghost">刪除標示</button></div>`);
  $('saveHazardSheetBtn').onclick=async()=>{ const type=$('sheetHazardType').value==='其他'?($('sheetHazardCustom').value.trim()||'其他'):$('sheetHazardType').value; await updateItem('hazards',id,{type}); await addLog('hazard',`修改地圖標示：${h.type} → ${type}`); closeActionSheet(); };
  $('deleteHazardSheetBtn').onclick=()=>{ closeActionSheet(); deleteHazard(id); };
}
async function deleteHazard(id){
  const h=live.hazards.find(x=>x.id===id); if(!h) return;
  if(!confirm(`確認刪除標示「${h.type}」？`)) return;
  const record={coll:'hazards',id:h.id,data:clonePlain(h)};
  await deleteItem('hazards',id,h.type);
  pushMapUndo(`復原刪除標示 ${h.type}`,async()=>restoreMapRecords([record]));
}
async function editHoseFull(id){
  const h=live.hoses.find(x=>x.id===id); if(!h) return;
  const kinds=['進攻水線','供水線','防護水線','搜救掩護水線','中繼水線'].map(x=>`<option ${h.kind===x?'selected':''}>${x}</option>`).join('');
  openActionSheet(`水線｜${h.vehicleName||''} ${h.port||''}`,`<div class="field"><label>來源車輛<select id="sheetHoseSource29"><option value="">${h.supplyUnconfirmed?'供水起點待確認':'保留現有來源'}</option>${live.vehicles.filter(v=>v.canHose).map(v=>`<option value="${escapeHtml(v.id)}" ${v.id===h.vehicleId?'selected':''}>${escapeHtml(v.name)}</option>`).join('')}</select></label></div><div class="field"><label>水線歸屬</label><input id="sheetHoseOwner" value="${escapeHtml(h.owner||h.unit||'')}" /></div><div class="field"><label>水線性質</label><select id="sheetHoseKind">${kinds}</select></div><div class="field"><label>任務</label><input id="sheetHoseTask" value="${escapeHtml(h.task||'')}" /></div><div class="button-row"><button id="saveHoseSheetBtn" class="btn primary">儲存</button><button id="reconnectHoseSheetBtn" class="btn ghost">重新指定終點</button><button id="deleteHoseSheetBtn" class="btn ghost">刪除水線</button></div>`);
  $('saveHoseSheetBtn').onclick=async()=>{ const patch={owner:$('sheetHoseOwner').value.trim()||h.owner||h.unit,kind:$('sheetHoseKind').value,task:$('sheetHoseTask').value.trim()||h.task}; const source=live.vehicles.find(v=>v.id===$('sheetHoseSource29').value);if(source)Object.assign(patch,{vehicleId:source.id,vehicleName:source.name,supplyUnconfirmed:false,status:'使用中'}); await updateItem('hoses',id,patch); await addLog('hose',`修改水線：${h.vehicleName||''}${h.port||''}`); closeActionSheet(); };
  $('reconnectHoseSheetBtn').onclick=()=>{ closeActionSheet(); pendingTool={type:'hoseReconnect',hoseId:h.id,vehicleId:h.vehicleId,vehicleName:h.vehicleName,unit:h.unit,owner:h.owner,port:h.port,task:h.task,kind:h.kind}; setDeploymentMode('hose'); toast('請點新的車輛、人員編組，或建物第一、二、三、四面，重新指定水線終點。',4800); };
  $('deleteHoseSheetBtn').onclick=()=>{ closeActionSheet(); deleteHose(id); };
}
async function deleteHose(id){
  const h=live.hoses.find(x=>x.id===id); if(!h) return;
  const label=`${vehicleDisplayName({name:h.vehicleName,unit:h.unit})} ${h.port||''}`.trim();
  if(!confirm(`確認刪除水線「${label}」？`)) return;
  const record={coll:'hoses',id:h.id,data:clonePlain(h)};
  await deleteItem('hoses',id,label);
  pushMapUndo(`復原刪除水線 ${label}`,async()=>restoreMapRecords([record]));
}

function syncDeploymentVehicleManualField(){
  const manual=$('deploymentVehicleCode')?.value==='manual';
  const field=$('deploymentVehicleManualField'); if(field) field.hidden=!manual;
  if(manual) $('deploymentVehicleManual')?.focus();
}
function normalizeVehicleCodeValue(value=''){
  return String(value||'').trim().replace(/\s+/g,'');
}
function vehicleDisplayName(item={}){
  const canonical=FCIntake29.tactics.vehicleName(item.unit,item.name||item.vehicleName);if(canonical)return canonical;
  const name=String(item.name||item.vehicleName||'').trim();
  const unit=String(item.unit||'').trim();
  if(!name) return unit||'未命名車輛';
  if(unit && /^\d/.test(name)) return `${unit}${name}`;
  if(unit && !name.includes(unit) && /^\D*\d{1,3}$/.test(name)) return `${unit}${name.replace(/^\D*/, '')}`;
  return name;
}
function formatUnitVehicleName(unit,code){
  const canonical=FCIntake29.tactics.vehicleName(unit,code);if(canonical)return canonical;
  const clean=normalizeVehicleCodeValue(code);
  if(!clean) return '';
  if(unit && clean.startsWith(unit)) return clean;
  if(/^\d/.test(clean)) return `${unit}${clean}`;
  if(unit && !clean.includes(unit)) return `${unit}${clean}`;
  return clean;
}
function renderPendingDeploymentVehicles(){
  const wrap=$('pendingDeploymentVehicles'); if(!wrap) return;
  if(!pendingDeploymentVehicles.length){ wrap.innerHTML='<div class="empty">尚未加入車輛；可只登錄人員編組。</div>'; return; }
  wrap.innerHTML=pendingDeploymentVehicles.map((v,i)=>`<div class="pending-vehicle-chip"><span>${escapeHtml(v.code)}｜${escapeHtml(vehicleType(v.code).label)}</span><button type="button" data-remove-pending-vehicle="${i}" aria-label="移除車輛">×</button></div>`).join('');
  wrap.querySelectorAll('[data-remove-pending-vehicle]').forEach(btn=>btn.addEventListener('click',()=>{ pendingDeploymentVehicles.splice(Number(btn.dataset.removePendingVehicle),1); renderPendingDeploymentVehicles(); }));
}
function addPendingDeploymentVehicle(){
  const sel=$('deploymentVehicleCode'); if(!sel) return;
  const code=sel.value==='manual'?normalizeVehicleCodeValue($('deploymentVehicleManual')?.value):sel.value;
  if(!code){ toast('請輸入借用或臨時車輛代號'); return; }
  if(pendingDeploymentVehicles.some(v=>v.code===code)){ toast('此車輛代號已加入'); return; }
  pendingDeploymentVehicles.push({code});
  if($('deploymentVehicleManual')) $('deploymentVehicleManual').value='';
  renderPendingDeploymentVehicles();
  toast(`已加入車輛代號 ${code}`);
}
function stagingPosition(index=0,column=0){
 return tacticalPosition31(column?(currentCase?.tacticalZones?.command?.face||'第一面'):'第一面',column?'standby':'vehicle',index);
}
let fieldCrewExpected=null,fieldCrewDirty=false;
function fieldEntryStatus(id,message){const el=$(id);if(el)el.textContent=message;}
function fillFieldUnitOptions(brigadeId,unitId){
  const brigade=$(brigadeId),unit=$(unitId);if(!brigade||!unit)return;
  const previous=brigade.value||profile?.brigade||'第三大隊';
  brigade.innerHTML=Object.keys(UNIT_TREE).map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
  brigade.value=UNIT_TREE[previous]?previous:'第三大隊';
  const update=()=>{
    const old=unit.value,groups=FCFieldEntry.unitOptions(UNIT_TREE,brigade.value);
    unit.innerHTML=groups.map(({company,units})=>`<optgroup label="${escapeHtml(company)}">${units.map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</optgroup>`).join('');
    if(FCFieldEntry.validUnit(UNIT_TREE,brigade.value,old))unit.value=old;
    if(unitId==='fieldCrewUnit')loadSelectedCrew();
  };
  brigade.addEventListener('change',()=>{unit.value='';update();fieldEntryStatus(unitId==='fieldCrewUnit'?'fieldCrewSaveStatus':'fieldVehicleSaveStatus','尚未儲存');});
  unit.addEventListener('change',()=>{if(unitId==='fieldCrewUnit')loadSelectedCrew();});
  update();
}
function selectedFieldCrew(){
  const brigade=$('fieldCrewBrigade')?.value,unit=$('fieldCrewUnit')?.value;
  return live.crews.filter(c=>c.brigade===brigade&&c.unit===unit&&!c.voiceGroup&&!c.leader);
}
function loadSelectedCrew(){
  const matches=selectedFieldCrew(),crew=matches.length===1?matches[0]:null;
  fieldCrewExpected=crew?{id:crew.id,updatedAt:crew.updatedAt||null}:null;
  fieldCrewDirty=false;
  if($('fieldCrewCount')){const input=$('fieldCrewCount'),value=crew&&!FCFieldEntry.unknown(crew)?String(crew.count):'';input.innerHTML=`<option value="">未知</option>`+Array.from({length:16},(_,n)=>`<option value="${n}">${n}</option>`).join('')+(value&&Number(value)>15?`<option value="${escapeHtml(value)}">${escapeHtml(value)}（既有資料）</option>`:'');input.value=value;}
  if($('fieldCrewFace')){const face=$('fieldCrewFace');if(crew?.face&&![...face.options].some(o=>o.value===crew.face))face.add(new Option(`${crew.face}（既有資料）`,crew.face));face.value=crew?.face||'';}
  if($('fieldCrewTask')){const parsed=FCV34V3.taskChoice(crew?.task||'');$('fieldCrewTask').value=parsed.choice;$('fieldCrewTaskOtherWrap').hidden=parsed.choice!=='其他';$('fieldCrewTaskOther').value=parsed.other;}
  fieldEntryStatus('fieldCrewSaveStatus',crew?'目前顯示已存資料；修改後請確認儲存':'尚未儲存');
}
function initFieldEntryControls(){
  fillFieldUnitOptions('fieldCrewBrigade','fieldCrewUnit');
  fillFieldUnitOptions('fieldVehicleBrigade','fieldVehicleUnit');
  $('fieldCrewSaveBtn')?.addEventListener('click',saveFieldCrew);
  $('fieldVehicleSaveBtn')?.addEventListener('click',saveFieldVehicle);
  for(const id of ['fieldCrewCount','fieldCrewFace','fieldCrewTask'])$(id)?.addEventListener('change',()=>{fieldCrewDirty=true;if(id==='fieldCrewTask'){$('fieldCrewTaskOtherWrap').hidden=$('fieldCrewTask').value!=='其他';if(!$('fieldCrewTaskOtherWrap').hidden)$('fieldCrewTaskOther').focus();}fieldEntryStatus('fieldCrewSaveStatus','尚未儲存');});
  $('fieldCrewTaskOther')?.addEventListener('input',()=>{fieldCrewDirty=true;fieldEntryStatus('fieldCrewSaveStatus','尚未儲存');});
  $('fieldCrewDetails')?.addEventListener('toggle',()=>{if($('fieldCrewDetails').open&&!fieldCrewDirty)loadSelectedCrew();});
  $('fieldVehicleCode')?.addEventListener('change',()=>fieldEntryStatus('fieldVehicleSaveStatus','尚未儲存'));
  $('fieldVehicleCode')?.addEventListener('change',()=>{$('fieldVehicleCustomWrap').hidden=$('fieldVehicleCode').value!=='custom';if(!$('fieldVehicleCustomWrap').hidden)$('fieldVehicleCustomCode').focus();});
  $('fieldVehicleCustomCode')?.addEventListener('input',()=>fieldEntryStatus('fieldVehicleSaveStatus','尚未儲存'));
  $('openBuildingDrawing')?.addEventListener('click',()=>{$('buildingOpsDetails').open=true;$('buildingOpsDetails').scrollIntoView({behavior:'smooth'});});
  document.querySelectorAll('[data-field-map-tool]').forEach(button=>button.addEventListener('click',()=>{
    setDeploymentMode(button.dataset.fieldMapTool);renderTacticalCanvasV3();
    $('deploymentMapDetails').scrollIntoView({behavior:'smooth'});
  }));
  $('fieldCrewList')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-field-crew]');if(!button)return;
    const crew=live.crews.find(c=>c.id===button.dataset.fieldCrew);if(!crew)return;
    if(UNIT_TREE[crew.brigade]){$('fieldCrewBrigade').value=crew.brigade;$('fieldCrewBrigade').dispatchEvent(new Event('change'));}
    if(FCFieldEntry.validUnit(UNIT_TREE,crew.brigade,crew.unit))$('fieldCrewUnit').value=crew.unit;
    loadSelectedCrew();$('fieldCrewDetails').open=true;$('fieldCrewCount').focus();
  });
}
function renderFieldEntries(){
  if(!currentCase||!$('fieldCrewSummary'))return;
  if(!fieldCrewDirty&&!fieldCrewExpected&&selectedFieldCrew().length===1)loadSelectedCrew();
  const s=FCFieldEntry.summary(live.crews);
  $('fieldCrewSummary').textContent=`${s.units} 筆｜已確認小計 ${s.known} 人${s.pending?`｜${s.pending} 筆人數待補`:''}`;
  $('fieldVehicleSummary').textContent=`${live.vehicles.length} 台｜新車先列待定位`;
  $('fieldCrewList').innerHTML=live.crews.map(c=>`<button type="button" data-field-crew="${escapeHtml(c.id)}">${escapeHtml(c.unit||'未辨識單位')}｜${FCFieldEntry.countLabel(c)}｜${escapeHtml(c.task||'未指定')}${c.leader?'｜編組 '+escapeHtml(c.leader):''}</button>`).join('')||'<span class="hint">尚無人員／單位紀錄</span>';
  $('fieldVehicleList').innerHTML=live.vehicles.map(v=>`<span class="readonly-card">${escapeHtml(vehicleDisplayName(v))}｜${v.positionManual?'已人工定位':'待定位'}</span>`).join('')||'<span class="hint">尚無車輛紀錄</span>';
}
async function saveFieldCrew(){
  if(!currentCase)return;
  if(currentCase.mode==='practice'&&myTrainingRole()==='觀察員'&&!isPracticeHost()){fieldEntryStatus('fieldCrewSaveStatus','儲存失敗：觀察員僅可閱覽');return;}
  const button=$('fieldCrewSaveBtn'),brigade=$('fieldCrewBrigade')?.value,unit=$('fieldCrewUnit')?.value;
  if(!FCFieldEntry.validUnit(UNIT_TREE,brigade,unit)){fieldEntryStatus('fieldCrewSaveStatus','儲存失敗：請先選有效單位');return;}
  const parsed=FCFieldEntry.parseCount($('fieldCrewCount')?.value);
  if(!parsed.valid){fieldEntryStatus('fieldCrewSaveStatus','儲存失敗：人數請選未知或有效整數');return;}
  const matches=selectedFieldCrew();if(matches.length>1){fieldEntryStatus('fieldCrewSaveStatus','版本衝突待處理：此單位有多筆編組，請從既有明細選定');return;}
  const existing=matches[0],id=existing?.id||FCFieldEntry.identity(brigade,unit),expected=fieldCrewExpected;
  if((existing&&expected?.id!==existing.id)||(!existing&&expected&&expected.id!==id)){fieldEntryStatus('fieldCrewSaveStatus','版本衝突待處理：單位資料已更新，請重新選擇');return;}
  const now=Date.now(),task=$('fieldCrewTask')?.value==='其他'?$('fieldCrewTaskOther')?.value.trim()||'':$('fieldCrewTask')?.value||'',face=$('fieldCrewFace')?.value||'',count=parsed.count;
  if($('fieldCrewTask')?.value==='其他'&&!task){fieldEntryStatus('fieldCrewSaveStatus','儲存失敗：請輸入其他任務');return;}
  const patch={count,countUnknown:count===null,task,face,status:task==='休息'?'休息':task==='待命'?'待命':'未指定',updatedAt:now};
  button.disabled=true;fieldEntryStatus('fieldCrewSaveStatus','儲存中');
  try{
    if(firebaseEnabled){
      const parent=db.collection('cases').doc(currentCaseId),ref=parent.collection('crews').doc(id);
      await db.runTransaction(async tx=>{
        const snap=await tx.get(ref);
        if((!snap.exists&&expected)||(snap.exists&&(!expected||expected.id!==id||Number(snap.data().updatedAt||0)!==Number(expected.updatedAt||0))))throw Error('版本衝突待處理：他人已修改這筆資料');
        if(snap.exists)tx.update(ref,patch);
        else {const pos=stagingPosition(live.crews.length,1);tx.set(ref,{brigade,unit,leader:'',...patch,createdAt:now,authorUid:profile?.id||fbUser?.uid,staged:true,layout31:true,lat:pos.lat,lng:pos.lng});}
        tx.update(parent,{resourceRevision:firebase.firestore.FieldValue.increment(1)});
      });
    }else{
      if(existing){if(Number(existing.updatedAt||0)!==Number(expected?.updatedAt||0))throw Error('版本衝突待處理');Object.assign(existing,patch);}
      else {const pos=stagingPosition(live.crews.length,1);live.crews.push({id,brigade,unit,leader:'',...patch,createdAt:now,staged:true,layout31:true,lat:pos.lat,lng:pos.lng});}
      currentCase.resourceRevision=(currentCase.resourceRevision||0)+1;saveLocalCase();renderLiveParts();
    }
    fieldCrewExpected={id,updatedAt:now};fieldCrewDirty=false;fieldEntryStatus('fieldCrewSaveStatus',firebaseEnabled?'已同步儲存':'已存本機（示範模式，未同步）');toast(`${unit}已儲存${count===null?'，人數待補':`，${count} 人`}`);
  }catch(err){fieldEntryStatus('fieldCrewSaveStatus',/版本衝突/.test(err.message)?'版本衝突待處理':`儲存失敗：${err.message}`);}
  finally{button.disabled=false;}
}
async function saveFieldVehicle(){
  if(!currentCase)return;
  if(currentCase.mode==='practice'&&myTrainingRole()==='觀察員'&&!isPracticeHost()){fieldEntryStatus('fieldVehicleSaveStatus','儲存失敗：觀察員僅可閱覽');return;}
  const brigade=$('fieldVehicleBrigade')?.value,unit=$('fieldVehicleUnit')?.value,selectedCode=$('fieldVehicleCode')?.value,code=selectedCode==='custom'?$('fieldVehicleCustomCode')?.value.trim():selectedCode,button=$('fieldVehicleSaveBtn');
  if(!FCFieldEntry.validUnit(UNIT_TREE,brigade,unit)||!code||!/^[\p{L}\p{N}-]{1,40}$/u.test(code)){fieldEntryStatus('fieldVehicleSaveStatus','儲存失敗：請選大隊、單位及有效車號');return;}
  const name=formatUnitVehicleName(unit,code),id='manual_vehicle_'+encodeURIComponent(brigade+'|'+name);
  button.disabled=true;fieldEntryStatus('fieldVehicleSaveStatus','儲存中');
  try{
    if(live.vehicles.some(v=>vehicleDisplayName(v)===name&&v.brigade===brigade)){fieldEntryStatus('fieldVehicleSaveStatus','已同步儲存：這部車已登錄');return;}
    const type=selectedCode==='custom'?{label:'車種待確認',canHose:false}:vehicleType(code),now=Date.now(),pos=stagingPosition(live.vehicles.length,0);
    const data={brigade,unit,name,vehicleCode:code,type:type.label,canHose:type.canHose,task:'',status:'待定位',lat:pos.lat,lng:pos.lng,layout31:true,staged:true,createdAt:now};
    if(firebaseEnabled){const parent=db.collection('cases').doc(currentCaseId),ref=parent.collection('vehicles').doc(id);await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(snap.exists)return;tx.set(ref,data);tx.update(parent,{resourceRevision:firebase.firestore.FieldValue.increment(1)});});}
    else {if(!live.vehicles.some(v=>v.id===id))live.vehicles.push({id,...data});currentCase.resourceRevision=(currentCase.resourceRevision||0)+1;saveLocalCase();renderLiveParts();}
    fieldEntryStatus('fieldVehicleSaveStatus',firebaseEnabled?'已同步儲存':'已存本機（示範模式，未同步）');toast(`${name}已登錄，圖面待定位`);$('fieldVehicleCode').value='';$('fieldVehicleCustomCode').value='';$('fieldVehicleCustomWrap').hidden=true;
  }catch(err){fieldEntryStatus('fieldVehicleSaveStatus',`儲存失敗：${err.message}`);}
  finally{button.disabled=false;}
}
async function addDeploymentGroup(){
  if(!currentCase) return;
  const brigade=$('deploymentBrigade')?.value||profile?.brigade||'第三大隊';
  const unit=$('deploymentUnit')?.value||profile?.unit||'現場';
  const leader=$('deploymentLeader')?.value||'6';
  const count=Number($('deploymentCrewCount')?.value||0);
  const status=$('deploymentStatus')?.value||'待命';
  const task=$('deploymentTask')?.value.trim()||status;
  if(count<=0 && !pendingDeploymentVehicles.length){ toast('請至少登錄人員或一台車輛'); return; }
  const groupId=uid('group');
  const baseIndex=live.vehicles.length;
  const createdRecords=[];
  if(count>0){
    const pos=stagingPosition(baseIndex,1);
    const crewId=await addItem('crews',{brigade,unit,leader,count,status,task,groupId,dispatchCount:status==='作業中'?1:0,startAt:Date.now(),lat:pos.lat,lng:pos.lng,staged:true,layout31:true});
    createdRecords.push({coll:'crews',id:crewId});
  }
  for(let i=0;i<pendingDeploymentVehicles.length;i++){
    const code=pendingDeploymentVehicles[i].code;
    const name=formatUnitVehicleName(unit,code);
    const type=vehicleType(code);
    const pos=stagingPosition(baseIndex+i,0);
    const vehicleId=await addItem('vehicles',{brigade,unit,name,vehicleCode:code,type:type.label,canHose:type.canHose,task,status:'待命',groupId,lat:pos.lat,lng:pos.lng,staged:true,layout31:true});
    createdRecords.push({coll:'vehicles',id:vehicleId});
  }
  if(createdRecords.length){
    pushMapUndo(`復原新增 ${unit} 人車`,async()=>{ for(const r of createdRecords.slice().reverse()) await deleteMapRecordSilent(r.coll,r.id); });
  }
  await addLog('deployment',`新增分隊／人車：${unit}${count>0?`${leader}｜${count}人｜${task}`:''}${pendingDeploymentVehicles.length?`｜車輛${pendingDeploymentVehicles.map(v=>formatUnitVehicleName(unit,v.code)).join('、')}`:''}`);
  pendingDeploymentVehicles=[];
  renderPendingDeploymentVehicles();
  if($('deploymentTask')) $('deploymentTask').value='';
  toast(`${unit}人員與車輛已加入部署圖；人員待命位置與指揮站連動`,3800);
}
async function addVehicle(){
  if(!currentCase) return;
  const brigade = $('vehicleBrigade').value, unit = $('vehicleUnit').value;
  const name = FCIntake29.tactics.vehicleName(unit,$('vehicleName').value.trim());if(!name){toast('請填車輛編號，例如11、111');return;}
  const type = vehicleType(name);
  const pos=stagingPosition(live.vehicles.length,0);
  await addItem('vehicles', { brigade, unit, name, type:type.label, canHose:type.canHose, task:$('vehicleTask').value.trim()||'待命', status:'部署', lat:pos.lat,lng:pos.lng,layout31:true });
  await addLog('vehicle', `新增車輛：${unit} ${name}｜${type.label}`);
  $('vehicleName').value=''; $('vehicleTask').value=''; toast('車輛已加入地圖');
}
async function addCrew(){
  if(!currentCase) return;
  const pos=stagingPosition(live.crews.length,1);
  const brigade = $('crewBrigade').value, unit = $('crewUnit').value, leader = $('crewLeader').value, count = Number($('crewCount').value)||4, status=$('crewStatus').value;
  await addItem('crews', { brigade, unit, leader, count, status, task:$('crewTask').value.trim()||status, dispatchCount: status==='作業中'?1:0, startAt:Date.now(), lat:pos.lat,lng:pos.lng,layout31:true,staged:true });
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
  if(tool.targetType==='vehicle'&&tool.targetId===tool.vehicleId){toast('水線終點不能是來源車輛');return;}
  const duplicate=live.hoses.some(h=>h.vehicleId===tool.vehicleId&&h.targetType===tool.targetType&&h.targetId===tool.targetId);
  if(duplicate&&!confirm('此起點與終點已有水線，確定新增另一條平行線？'))return;
  let target=null,targetName='';
  if(tool.targetType==='vehicle'){
    target=live.vehicles.find(x=>x.id===tool.targetId);
    targetName=target?`${vehicleDisplayName(target)}｜${target.unit}`:'';
  }else if(tool.targetType==='crew'){
    target=live.crews.find(x=>x.id===tool.targetId);
    targetName=target?`${target.unit}${target.leader}｜${target.count}人`:'';
  }else if(tool.targetType==='buildingFace'){
    target=buildingFaceById(tool.targetId);
    targetName=target?.name||tool.targetName||'火場建物';
  }
  if(!target){ toast('請先選擇水線目的地'); return; }
  const hoseId=await addItem('hoses',{vehicleId:tool.vehicleId,vehicleName:vehicleDisplayName(v||tool),unit:v?.unit||tool.unit,owner:tool.owner||v?.unit||'',port:tool.port,task:tool.task,kind:tool.kind||'進攻水線',status:'規劃',targetType:tool.targetType,targetId:tool.targetId,targetName,from:v?[v.lat,v.lng]:null});
  pushMapUndo(`復原建立水線 ${vehicleDisplayName(v||tool)} ${tool.port||''}`,async()=>deleteMapRecordSilent('hoses',hoseId));
  await addLog('hose',`建立連結水線：${vehicleDisplayName(v||tool)} ${tool.port||''} → ${targetName}`);
  toast(`水線已連接至${targetName}`);
}
function startHazardTool(type){ pendingTool = { type:'hazard', hazardType:type }; clearTacticalSelectionV31();tacticalHoseSelectionV3='';renderTacticalCanvasV3();toast(`請在戰術畫布點選「${type}」位置`); }
async function addHazardAt(type, lat, lng){ const id=await addItem('hazards', { type, lat, lng }); pushMapUndo(`復原新增標示 ${type}`,async()=>deleteMapRecordSilent('hazards',id)); await addLog('hazard', `新增標示：${type}`); toast(`${type} 已標示`); }
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
  return Object.assign({lat,lng,widthM:40,heightM:28,locked:false,rotationDeg:0}, currentCase?.buildingBox || {});
}
function metersToLatDelta(m){ return Number(m) / 111320; }
function metersToLngDelta(m, lat){ return Number(m) / (111320 * Math.max(.2, Math.cos(Number(lat) * Math.PI/180))); }
function normalizeRotationDeg(value=0){ const n=Number(value)||0; return ((n%360)+360)%360; }
function rotateLocalPoint(x,y,deg=0){
  const r=normalizeRotationDeg(deg)*Math.PI/180,c=Math.cos(r),sn=Math.sin(r);
  return {x:x*c-y*sn,y:x*sn+y*c};
}
function localPointToLatLng(box,x,y){
  const pt=rotateLocalPoint(x,y,box.rotationDeg||0);
  return {lat:Number(box.lat)+metersToLatDelta(pt.y),lng:Number(box.lng)+metersToLngDelta(pt.x,box.lat)};
}
function latLngToLocalPoint(box,lat,lng){
  const x=(Number(lng)-Number(box.lng))*111320*Math.max(.2,Math.cos(Number(box.lat)*Math.PI/180));
  const y=(Number(lat)-Number(box.lat))*111320;
  const r=-normalizeRotationDeg(box.rotationDeg||0)*Math.PI/180,c=Math.cos(r),sn=Math.sin(r);
  return {x:x*c-y*sn,y:x*sn+y*c};
}
function buildingBoxCorners(box){
  const w=(Number(box.widthM)||40)/2,h=(Number(box.heightM)||28)/2;
  return [localPointToLatLng(box,-w,h),localPointToLatLng(box,w,h),localPointToLatLng(box,w,-h),localPointToLatLng(box,-w,-h)];
}
function buildingBoxSidePoints(box){
  const w=(Number(box.widthM)||40)/2,h=(Number(box.heightM)||28)/2;
  const defs=[
    {id:'face1',name:'第一面',x:0,y:-h},
    {id:'face2',name:'第二面',x:w,y:0},
    {id:'face3',name:'第三面',x:0,y:h},
    {id:'face4',name:'第四面',x:-w,y:0}
  ];
  return defs.map(d=>({...d,...localPointToLatLng(box,d.x,d.y)}));
}
function buildingFaceById(id){ return buildingBoxSidePoints(getBuildingBox()).find(x=>x.id===id); }
function renderBuildingBoxOnMap(){
  if(!map || !currentCase || !window.google?.maps) return;
  const box=getBuildingBox();
  const corners=buildingBoxCorners(box);
  const polygon=addMapOverlay(new google.maps.Polygon({map,paths:corners,strokeColor:box.locked?'#1d1a17':'#a43a30',strokeWeight:3,strokeOpacity:1,fillColor:'#b5281d',fillOpacity:.05,clickable:true,editable:false,draggable:false,zIndex:12}));
  polygon.addListener('click',ev=>{
    if(pendingTool?.type==='moveExisting'){
      movePendingResourceTo({lat:Number(box.lat),lng:Number(box.lng)},'建物中心');
      return;
    }
    mapInfoWindow.setPosition(ev.latLng);
    mapInfoWindow.setContent(`<div class="google-info-card"><b>建物中心框</b><div class="meta">${Math.round(box.widthM)}m × ${Math.round(box.heightM)}m<br>旋轉：${Math.round(normalizeRotationDeg(box.rotationDeg))}°<br>${box.locked?'已鎖定':'未鎖定，可拖曳中心、大小與旋轉控制點'}</div><div class="popup-actions"><button data-map-action="${box.locked?'unlockBuildingBox':'lockBuildingBox'}">${box.locked?'解除鎖定':'鎖定建物框'}</button></div></div>`);
    mapInfoWindow.open({map,shouldFocus:false});
  });
  buildingBoxSidePoints(box).forEach(pt=>{
    makeGoogleMarker({position:{lat:pt.lat,lng:pt.lng},text:pt.name,className:'face active',zIndex:80,onClick:m=>{
      if(completeQuickHoseFace(pt)) return;
      if(pendingTool?.type==='moveExisting'){ movePendingResourceTo({lat:pt.lat,lng:pt.lng},pt.name); return; }
      openMapInfo(m,`<b>${pt.name}</b><div class="meta">可作為水線終點或人車部署基準。</div>`);
    }});
  });
  if(!box.locked){
    buildingBoxCenterMarker=makeGoogleMarker({position:{lat:box.lat,lng:box.lng},text:'▣ 建物中心',className:'building-center',draggable:true,zIndex:90,onDragEnd:ll=>saveBuildingBox({lat:ll.lat,lng:ll.lng},'拖曳更新建物中心框')});
    const corner=corners[1];
    buildingBoxCornerMarker=makeGoogleMarker({position:corner,text:'↘ 拉大小',className:'building-handle',draggable:true,zIndex:91,onDragEnd:ll=>{
      const local=latLngToLocalPoint(box,ll.lat,ll.lng);
      saveBuildingBox({widthM:Math.max(8,Math.round(Math.abs(local.x)*2)),heightM:Math.max(8,Math.round(Math.abs(local.y)*2))},'拖曳調整建物中心框大小');
    }});
    const rotateHandle=localPointToLatLng(box,0,-((Number(box.heightM)||28)/2+22));
    buildingBoxRotationMarker=makeGoogleMarker({position:rotateHandle,text:'⟳ 旋轉',className:'building-rotate',draggable:true,zIndex:92,onDragEnd:ll=>{
      const dx=(Number(ll.lng)-Number(box.lng))*111320*Math.max(.2,Math.cos(Number(box.lat)*Math.PI/180));
      const dy=(Number(ll.lat)-Number(box.lat))*111320;
      const deg=normalizeRotationDeg(Math.atan2(dx,-dy)*180/Math.PI);
      saveBuildingBox({rotationDeg:Math.round(deg)},`旋轉建物中心框至 ${Math.round(deg)}°`);
    }});
  }
}
function syncBuildingBoxForm(){
  const box = getBuildingBox();
  if($('buildingBoxStatus')) $('buildingBoxStatus').textContent = box.locked ? '已鎖定，案件中心框不會變動' : `未鎖定，可拖曳中心、大小與旋轉控制點（${Math.round(normalizeRotationDeg(box.rotationDeg))}°）`;
  const unlock=$('mapBuildingUnlockBtn'), lock=$('mapBuildingLockBtn');
  if(unlock) unlock.hidden=!box.locked;
  if(lock) lock.hidden=!!box.locked;
}
async function saveBuildingBox(patch={}, message='更新建物中心框',options={}){
  if(!currentCase)return;
  const before={...getBuildingBox()},next={...before,...patch,rotationDeg:normalizeRotationDeg(patch.rotationDeg??before.rotationDeg),updatedAt:Date.now()};
  const updates=[];
  if(next.rotationDeg!==before.rotationDeg||next.lat!==before.lat||next.lng!==before.lng){
    for(const coll of ['vehicles','crews'])for(const item of live[coll].filter(x=>x.anchorBuilding)){
      const pt=latLngToLocalPoint(before,item.lat,item.lng),moved=localPointToLatLng(next,pt.x,pt.y);updates.push({coll,id:item.id,patch:moved});
    }
  }
  if(firebaseEnabled){const batch=db.batch(),ref=db.collection('cases').doc(currentCaseId);batch.update(ref,{buildingBox:next,resourceRevision:firebase.firestore.FieldValue.increment(1),updatedAt:Date.now()});for(const x of updates)batch.update(ref.collection(x.coll).doc(x.id),x.patch);await batch.commit();}
  else{for(const x of updates)Object.assign(live[x.coll].find(v=>v.id===x.id),x.patch);}
  currentCase.buildingBox=next;if(!firebaseEnabled){currentCase.resourceRevision=(currentCase.resourceRevision||0)+1;saveLocalCase();}
  if(!options.skipUndo&&!suppressMapUndo)pushMapUndo(`復原：${message}`,()=>saveBuildingBox(before,'復原建物框',{skipUndo:true}));
  syncBuildingBoxForm();renderMap();renderCommandGuide();renderOverviewContent();await addLog('map',message);
}
function saveBuildingBoxFromForm(){ toast('請直接在地圖拖曳建物框中心、大小或旋轉控制點。',3600); }
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
      const records=[
        {coll:'crews',id:p.id,data:clonePlain(p)},
        {coll:'crews',id:target.id,data:clonePlain(target)},
        ...live.hoses.filter(h=>h.targetType==='crew' && h.targetId===target.id).map(h=>({coll:'hoses',id:h.id,data:clonePlain(h)}))
      ];
      for(const h of live.hoses.filter(h=>h.targetType==='crew' && h.targetId===target.id)){
        await updateItem('hoses', h.id, {targetId:p.id, targetName:`${p.unit}${p.leader||''}｜${p.count||0}人`, owner:h.owner || `${p.unit}${p.leader||''}`});
      }
      await updateItem('crews', p.id, {lat:target.lat,lng:target.lng,status:'作業中',task:oldTask,startAt:Date.now(),dispatchCount:(p.dispatchCount||0)+1,staged:false});
      await updateItem('crews', target.id, {lat:ll.lat,lng:ll.lng,status:'休息',task:'輪替休息',endAt:Date.now(),staged:false});
      pushMapUndo(`復原 ${p.unit}${p.leader} 接替任務`,async()=>restoreMapRecords(records));
      await addLog('crew', `${p.unit}${p.leader} 接替 ${target.unit}${target.leader} 執行「${oldTask}」，相關水線改由接替單位承接，${target.unit}${target.leader} 改為休息`);
      toast('已完成任務輪替');
      return;
    }
  }
  await updateMapItemWithUndo('crews',p.id,{lat:ll.lat,lng:ll.lng,staged:false},`移動 ${p.unit}${p.leader}`);
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
function setPatientNow(){ if($('patientEventAt')) $('patientEventAt').value = toDatetimeLocalValue(Date.now()); }
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
  if($('sitrepFireDetails')) $('sitrepFireDetails').open=false;
  toast('戰情回報已新增');
}

let patientSaveBusyV31=false;
async function addPatientSitrep(){
  if(!currentCase||patientSaveBusyV31)return;
  const button=$('addPatientSitrepBtn'),savedCaseId=currentCaseId;patientSaveBusyV31=true;if(button)button.disabled=true;
  try{assertCaseEditor();
  const selected=window.FCOperationalV31.getLatestPatients(live.sitreps||[]).find(row=>row.key===$('patientRecordV31')?.value);
  const patientId=selected?(selected.patient.id||selected.patient.patientId||selected.key):uid('patient');
  const transportStatus=$('patientTransportV31')?.value||'unknown';
  const name = $('patientName')?.value.trim() || '姓名未明';
  const gender = $('patientGender')?.value || '未知';
  const foundAt = $('patientFoundAt')?.value.trim() || '地點未明';
  const status = $('patientStatus')?.value || '待救援';
  const note = $('patientNote')?.value.trim() || '';
  const eventAt = $('patientEventAt')?.value ? datetimeLocalToMs($('patientEventAt').value) : Date.now();
  const submittedAt = Date.now();
  const data = {
    brigade: $('patientBrigade')?.value || profile?.brigade || '', unit: $('patientUnit')?.value || profile?.unit || '',
    category:'傷/患者狀況回報', title:`${status}｜${name}｜${foundAt}`,
    detail:`姓名：${name}；性別：${gender}；尋獲地點：${foundAt}；狀況：${status}；送醫：${({'transported':'已確認送醫','planned':'預計送醫','not-transported':'尚未送醫','unknown':'尚未確認'})[transportStatus]||'尚未確認'}${note?`；處置/補充：${note}`:''}`,
    patient:{id:patientId,name,gender,foundAt,status,note,transportStatus}, eventAt, submittedAt, isBackfill:Math.abs(submittedAt-eventAt)>60000,
    operator:profile?.callName||profile?.realName||'', operatorId:profile?.id||''
  };
  await addItem('sitreps', data);
  if(currentCaseId!==savedCaseId)return;
  try{await addLog('sitrep', `新增傷/患者回報：${data.unit}｜${data.title}`);}catch(error){console.warn('患者已儲存，操作紀錄未同步',error);}
  ['patientName','patientFoundAt','patientNote'].forEach(id=>$(id)&&($(id).value=''));
  if($('patientGender')) $('patientGender').value='未知';
  if($('patientStatus')) $('patientStatus').value='待救援';
  if($('patientRecordV31'))$('patientRecordV31').value='';
  if($('patientTransportV31'))$('patientTransportV31').value='unknown';
  setPatientNow();
  if($('sitrepPatientDetails')) $('sitrepPatientDetails').open=false;
  toast('已送出傷/患者回報');
  }catch(error){toast(`傷/患者回報未完成：${error.message}`,4600);}finally{patientSaveBusyV31=false;if(button)button.disabled=false;}
}

function renderPatientRecordsV31(){
  const select=$('patientRecordV31');if(!select)return;const selected=select.value;
  select.innerHTML='<option value="">新增患者（同一患者請選既有紀錄）</option>'+window.FCOperationalV31.getLatestPatients(live.sitreps||[]).map(row=>`<option value="${escapeHtml(row.key)}">${escapeHtml([row.patient.name||'姓名未明',row.patient.foundAt||'地點未明',row.patient.status].filter(Boolean).join('｜'))}</option>`).join('');
  if(Array.from(select.options||[]).some(option=>option.value===selected))select.value=selected;
}
function prefillPatientRecordV31(){
  const row=window.FCOperationalV31.getLatestPatients(live.sitreps||[]).find(item=>item.key===$('patientRecordV31')?.value);if(!row)return;
  const patient=row.patient;for(const [id,key] of [['patientName','name'],['patientGender','gender'],['patientFoundAt','foundAt'],['patientStatus','status'],['patientNote','note']])if($(id))$(id).value=patient[key]||'';
  $('patientTransportV31').value=patient.transportStatus||(window.FCOperationalV31.isTransported(patient)?'transported':'unknown');setPatientNow();
}
function renderSitreps(){
  renderPatientRecordsV31();
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

function caseIsClosed(){ if(currentCase?.mode==='practice'&&trainingState().phase==='completed')return true; return currentCase?.status === 'closed' || currentCase?.closedAt; }
function updateAssessmentAvailability(){
  const btn=$('aiAssessmentBtn'); const draft=$('assessmentDraft');
  if(!btn) return;
  const closed=caseIsClosed(); btn.disabled = !closed;
  btn.textContent = closed ? '產生 AI 檢討評估' : '結案後才能產生 AI 檢討評估';
  if(draft && !closed) draft.placeholder = '本功能為結案後才能使用，避免火場進行中誤觸消耗 token。';
}
async function closeCase(){ if(!currentCase) return; if(currentCase.mode==='practice'){if(!isPracticeHost())return toast('由教官或房主關閉房間');if(trainingState().phase!=='completed'){if(!isHumanInstructor())return toast('AI 演練請先完成情境；需要休息時可暫停');await trainingCommit({type:'finish',reason:'真人教官結束演練'});}} if(!confirm(currentCase.mode==='practice'?'確認結束並關閉這個練習房間？':'確認將本案標記為結案？結案後可產生 AI 檢討評估報告。')) return; const patch={status:'closed',closedAt:Date.now(),updatedAt:Date.now(),...(currentCase.mode==='practice'?{practiceStatus:'closed',nextPracticeEventAt:null}:{})}; Object.assign(currentCase,patch); if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase(); await addLog('case',currentCase.mode==='practice'?'練習房間已結束':'案件標記結案'); updateAssessmentAvailability(); renderPracticeSession(); toast(currentCase.mode==='practice'?'已結束練習房間':'已標記結案'); }
async function reopenCase(){ if(!currentCase) return; if(currentCase.mode==='practice')return toast('請建立新練習房間，保留本次評估紀錄'); const patch={status:'active',closedAt:null,updatedAt:Date.now(),...(currentCase.mode==='practice'?{practiceStatus:'waiting'}:{})}; Object.assign(currentCase,patch); if(firebaseEnabled) await db.collection('cases').doc(currentCaseId).set(patch,{merge:true}); else saveLocalCase(); await addLog('case',currentCase.mode==='practice'?'練習房間重新開啟':'案件重新開啟'); updateAssessmentAvailability(); renderPracticeSession(); toast(currentCase.mode==='practice'?'已重新開啟練習房間':'已重新開啟案件'); }
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
    const payload = { mode:'assessment', caseData: currentCase, vehicles: live.vehicles, crews: live.crews, hoses: live.hoses, hazards: live.hazards, sitreps: live.sitreps, logs: live.logs, players:live.players, simulationEvents:live.simulationEvents.filter(x=>x.released), buildingOps: getBuildingOps(), localRules: localTacticalAdviceText(), assessmentDraft: assessmentLocalText() };
    const res = await authenticatedAI('/api/ai-advice', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
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
    <button type="button" class="mini-card stat-action" data-jump-panel="crew"><div class="metric">${FCFieldEntry.summary(live.crews).known}${FCFieldEntry.summary(live.crews).pending?'+?':''}</div><div class="metric-label">已確認人數小計</div><div class="subline">${FCFieldEntry.summary(live.crews).pending} 筆待補｜點選展開</div></button>
    <button type="button" class="mini-card stat-action" data-jump-panel="hose"><div class="metric">${live.hoses.length}</div><div class="metric-label">水線</div><div class="subline">進攻 / 供水 / 防護｜點選部署圖</div></button>
    <button type="button" class="mini-card stat-action" data-jump-panel="hazard"><div class="metric">${live.hazards.length}</div><div class="metric-label">標示</div><div class="subline">火點、危害、指揮站｜點選部署圖</div></button>`;
  $('crewCards').innerHTML = live.crews.length ? live.crews.map(p=>`<div class="mini-card wide"><span class="tag ${p.status==='RIT'?'amber':(p.status==='休息'||p.status==='待命')?'green':'red'}">${escapeHtml(p.status||'未指定')}</span><h3>${escapeHtml(p.unit)}${escapeHtml(p.leader||'')}</h3><div class="metric">${FCFieldEntry.unknown(p)?'待補':p.count}</div><div class="metric-label">人員</div><div class="subline">任務：${escapeHtml(p.task||'未指定')}<br>派遣：${p.dispatchCount||0}次｜作業：${Math.max(0,Math.round((Date.now()-(p.startAt||Date.now()))/60000))}分</div><div class="button-row compact-actions"><button class="btn small ghost" data-rest-crew="${p.id}" data-rest-mode="原地休息">原地休息</button><button class="btn small ghost" data-rest-crew="${p.id}" data-rest-mode="移至休息區">移至休息區</button><button class="btn small ghost" data-delete-crew="${p.id}">刪除</button></div></div>`).join('') : '<div class="empty">尚無人員資料。</div>';
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
  if(!live.hazards.some(h=>h.type==='指揮站')&&!currentCase?.tacticalZones?.command) a.push(['blue','尚未在地圖標示指揮站位置。']);
  if(live.hazards.some(h=>h.type==='瓦斯')) a.push(['red','已標示瓦斯危害，請確認瓦斯單位與管線關閉。']);
  const ruleEl = $('ruleAlerts'); if(ruleEl) ruleEl.innerHTML = (a.length?a:[['green','目前沒有重大未完成提示。']]).map(([cls,msg])=>`<div class="tag ${cls}">${escapeHtml(msg)}</div>`).join('');
  if(!currentCase?.aiLastAdvice) setAiAdviceText(localTacticalAdviceText());
}
function renderLogs(){ const el=$('logList'); if(!el) return; el.innerHTML = live.logs.length ? live.logs.slice().reverse().map(l=>`<div class="log"><div class="log-time">${fmtTime(l.createdAt)}｜${escapeHtml(l.type)}｜${escapeHtml(l.operator||'')}</div><div>${escapeHtml(l.message)}</div></div>`).join('') : '<div class="empty">尚無時間軸紀錄。</div>'; }
async function addLog(type, message){ if(firebaseEnabled) await addLogRemote(currentCaseId,type,message); else { live.logs.push({id:uid('log'),type,message,createdAt:Date.now(),operator:profile.callName}); saveLocalCase(); renderLogs(); if(currentCase?.mode==='practice')renderPracticeSession(); } }
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
  const unitPeople=[...new Set(live.crews.map(p=>p.unit||'未登錄'))].map(unit=>{const s=FCFieldEntry.summary(live.crews.filter(p=>(p.unit||'未登錄')===unit));return `${unit}已確認小計${s.known}人${s.pending?`、${s.pending}筆待補`:''}`;}).join('、');
  const workRows = live.crews.map(p=>`- ${p.unit}${p.leader||''}｜${crewCount31(p)}｜${p.status||'未指定'}｜${p.task||'未指定'}｜${p.status==='作業中'?`作業 ${formatDurationMinutes(crewWorkMinutes(p))}`:'尚未確認投入'}`).join('\n') || '- 尚無人員作業資料';
  return [
    ...(effectiveDeploymentSummary()?[`部署文字／圖面摘要：${effectiveDeploymentSummary()}`]:[]),
    `車輛類型：${entriesText(vehicleTypes) || '尚無'}`,
    `人員狀態：${entriesText(crewStatus) || '尚無'}`,
    `單位人數：${unitPeople || '尚無'}`,
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
  live.simulationEvents.filter(x=>x.released).forEach(x=>merged.push({kind:'演練',time:x.releasedAt||x.createdAt||Date.now(),submitted:x.releasedAt||x.createdAt||Date.now(),unit:x.releasedBy||'教官',text:`${x.title||'情境更新'}｜${x.detail||''}`}));
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
    `- 戰情回報：${live.sitreps.length} 筆；操作紀錄：${live.logs.length} 筆；車輛：${live.vehicles.length} 台；${crewSummaryText()}；水線：${live.hoses.length} 條。`,
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
  if(c.mode==='practice') lines.push(`本案為練習模式，情境「${c.scenarioTitle||'未命名'}」目前狀態為${practiceStatusLabel(c.practiceStatus)}，房號${c.roomCode||'未設定'}。`);
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
  const latestPractice=live.simulationEvents.filter(x=>x.released).sort((a,b)=>(b.releasedAt||0)-(a.releasedAt||0))[0];
  if(c.mode==='practice'&&latestPractice) lines.push(`最新演練情境：${latestPractice.title||'情境更新'}，${String(latestPractice.detail||'').replace(/[。；]+$/,'')}。`);
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
  const crews=crewSummaryText();
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
    `現場目前登錄車輛${live.vehicles.length}台、${crews}、水線${live.hoses.length}條及危害或區域標示${live.hazards.length}處。`,
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
    const payload = { mode:'report', caseData: currentCase, vehicles: live.vehicles, crews: live.crews, hoses: live.hoses, hazards: live.hazards, sitreps: live.sitreps, players:live.players, simulationEvents:live.simulationEvents.filter(x=>x.released), buildingOps: getBuildingOps(), localRules: localTacticalAdviceText(), baseReport: local, reportInstruction:'請產出正式給長官檢閱的火場進度報告；僅保留一、火場概要與目前發展 二、目前部署與戰力概況 三、各單位戰情及傷患者回報彙整 四、建物內部作戰圖與戰術部署摘要 五、目前注意事項與建議。請使用正式標題、次標題與完整段落；必要時才使用一般條列。不得使用 Markdown 星號、井字號或粗體符號，不得把每一句包成獨立方框。第四節不得逐項列出入口、隔間、水線等繪圖工具紀錄，僅做整體說明，詳細位置由附圖呈現。不得列出操作歷程、時間軸清單、檢討與後續評估章節。' };
    const res = await authenticatedAI('/api/ai-advice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
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
  const structuredDeployment=FCV34V3.deploymentSpeech(live.crews,c).replace(/[。]+$/,'');
  const authoredDeployment=FCV34V3.stripIncomplete(effectiveDeploymentSummary());
  if(structuredDeployment)deployment.push(structuredDeployment);
  else if(authoredDeployment)deployment.push(authoredDeployment);
  if(c.parRequested && c.parDetails) deployment.push(c.parDetails);
  if(deployment.length) lines.push(`六、初：${deployment.join('；')}。`);
  if(c.breakDoorState==='required' && c.breakDoor){
    const timeline=[];
    timeline.push(c.breakDoorAt?`${fmtTime(c.breakDoorAt)}準備破門`:'準備破門時間未登錄');
    timeline.push(c.breakDoorCompletedAt?`${fmtTime(c.breakDoorCompletedAt)}破門完成`:'破門尚未完成');
    lines.push(`七、破：${timeline.join('，')}${c.breakDoorUnit?`，執行單位為${c.breakDoorUnit}`:''}${c.breakDoorNote?`，${c.breakDoorNote}`:''}。`);
  }
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
  tacticalZones31().forEach(z=>add(z.lat,z.lng,'zone',z.label,z.id));
  live.vehicles.forEach(v=>add(v.lat,v.lng,'vehicle',vehicleDisplayName(v),v.id));
  live.crews.forEach(x=>add(x.lat,x.lng,'crew',`${x.unit||''}${x.leader||''}${x.floor?' · '+x.floor:''}`,x.id));
  live.hazards.forEach(h=>add(h.lat,h.lng,'hazard',h.type||'危害',h.id));
  live.hoses.forEach(h=>{ if(h.targetType==='map' && h.lat && h.lng) add(h.lat,h.lng,'hoseEnd',h.targetName||'水線終點',`hose_${h.id}`); });
  const box=getBuildingBox();
  const corners=box?buildingBoxCorners(box):[];
  const faces=box?buildingBoxSidePoints(box):[];
  corners.forEach((pt,i)=>add(pt.lat,pt.lng,'hidden','',`box_corner_${i}`));
  faces.forEach(pt=>add(pt.lat,pt.lng,'buildingFace',pt.name,pt.id));
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
    if(h.targetType==='vehicle'||h.targetType==='crew'||h.targetType==='buildingFace') b=pointMap.get(h.targetId);
    else b=pointMap.get(`hose_${h.id}`);
    if(!a||!b) return '';
    const source=vehicleDisplayName({name:h.vehicleName,unit:h.unit});
    const label=h.targetType==='vehicle'?'供水':`${h.port||'進攻線'} · ${h.owner||h.unit||''}`;
    const path=hosePath30(h,[a.lat,a.lng],[b.lat,b.lng]).map(p=>xy(p.lat,p.lng));return `<polyline points="${path.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ')}" fill="none" class="scheme-hose"/><text x="${((a.x+b.x)/2).toFixed(1)}" y="${((a.y+b.y)/2-8-(h.lineNo||0)*12).toFixed(1)}" class="scheme-hose-label">${escapeHtml(label)}</text>`;
  }).join('');
  const building=(()=>{
    if(!box||!corners.length) return '';
    const polygon=corners.map(pt=>{const p=xy(pt.lat,pt.lng);return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;}).join(' ');
    const center=xy(box.lat,box.lng);
    const labels=faces.map(face=>{const p=xy(face.lat,face.lng);return `<text x="${p.x.toFixed(1)}" y="${(p.y+(face.id==='face1'?22:-8)).toFixed(1)}" class="scheme-face-label">${escapeHtml(face.name)}</text>`;}).join('');
    return `<polygon points="${polygon}" class="scheme-building"/><text x="${center.x.toFixed(1)}" y="${(center.y-15).toFixed(1)}" class="scheme-building-label">火場建物</text>${labels}`;
  })();
  const nodes=points.filter(p=>!['hidden','buildingFace',...(box?['incident']:[])].includes(p.kind)).map(p=>{
    const {x,y}=xy(p.lat,p.lng);
    const cls=`scheme-node ${p.kind}`;
    if(p.kind==='zone')return `<text x="${x.toFixed(1)}" y="${(y-16).toFixed(1)}" class="scheme-zone-label31">${escapeHtml(p.label)}</text>`;
    const icon=p.kind==='vehicle'?(live.vehicles.find(v=>v.id===p.id)?.type.includes('救護')?'救':'車'):p.kind==='crew'?'人':p.kind==='hazard'?'⚠':p.kind==='incident'?'火':p.kind==='zone'?'區':'●';
    const head=live.vehicles.find(v=>v.id===p.id),isHead=p.kind==='vehicle'&&head?.queueOrder===0;const headArrow=['↑','↗','→','↘','↓','↙','←','↖'][Math.round((head?.heading31||0)/45)%8];return `<g class="${cls}">${isHead?`<text x="${x.toFixed(1)}" y="${(y-22).toFixed(1)}" class="scheme-label">${headArrow} 頭車</text>`:''}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.kind==='incident'?18:15}"/><text x="${x.toFixed(1)}" y="${(y+5).toFixed(1)}" class="scheme-icon">${escapeHtml(icon)}</text><text x="${x.toFixed(1)}" y="${(y+34).toFixed(1)}" class="scheme-label">${escapeHtml(p.label)}</text></g>`;
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
  const chips = [`車輛 ${live.vehicles.length} 台`,crewSummaryText(),`水線 ${live.hoses.length} 條`,`戰情 ${live.sitreps.length} 筆`].map(x=>`<span class="report-chip">${escapeHtml(x)}</span>`).join('');
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
  if(!allowed.includes(activeArrivalCard)) activeArrivalCard=activeStage==='初'?null:(allowed[0]||null);
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
    const buildingDetails = $('buildingOpsDetails');
    if(buildingDetails) buildingDetails.open = false;
    renderTacticalCanvasV3();
  }
  if(next==='dashboardSection'){
    const first = section?.querySelector('details.accordion'); if(first) first.open = true;
  }
  if(next==='sitrepSection'){
    if($('sitrepFireDetails')) $('sitrepFireDetails').open=false;
    if($('sitrepPatientDetails')) $('sitrepPatientDetails').open=false;
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
  wrap.innerHTML = live.crews.length ? live.crews.map(p=>`<label class="check slim par-row"><input type="checkbox" data-par-crew="${p.id}" ${checked[p.id]?'checked':''} /> ${escapeHtml(p.unit)}${escapeHtml(p.leader||'')}｜${crewCount31(p)}｜${escapeHtml(p.task||p.status||'')}</label>`).join('') : '<div class="empty">尚無登錄分隊。請先在人員部署新增各分隊。</div>';
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
  const fireDone=!!($('fireObservedFloor')?.value && ($('fireObservation')?.value || $('fireSmokeColor')?.value || $('fireSmokeVolume')?.value || $('fireFlameState')?.value));
  const deploymentDone=!!(live.crews.length||live.vehicles.length||live.hoses.length||effectiveDeploymentSummary());
  const trappedState=getRadioValue('trappedState');
  const mapping = {
    arrived: [$('arrivedCheck'), $('addressConfirmCheck')?.checked ? '地址已確認' : '待確認地址'],
    building: [null, buildingDone ? `${$('detailPurpose').value}${$('buildingStructure')?.value?`／${$('buildingStructure').value}`:''}｜${$('detailFloors').value}樓｜${floorText($('detailFireFloor').value)}` : '尚缺必要資料'],
    fire: [null, fireDone ? buildFireStatusFromSop() : '尚缺火煙資料'],
    trapped: [null, trappedState==='none'?'確認無人受困':trappedState==='has'?`受困 ${Number($('trappedCountArrival')?.value)||0} 人`:'尚未確認'],
    deployment: [null, deploymentDone?(live.crews.length||live.vehicles.length||live.hoses.length?`${live.vehicles.length}車｜${crewSummaryText()}｜${live.hoses.length}線`:'已有文字部署紀錄'):'尚未部署'],
    command: [$('commandCheck'), commandState==='transferred' ? '已完成轉移' : (commandState==='pending' ? '尚未完成' : '未確認')],
    contact: [$('contactCheck'), contactState==='found' ? (contacts.length ? `已找到 ${contacts.length} 位` : '已找到，待補資料') : (contactState==='notfound' ? '尚未找到' : '未確認')],
    rit: [$('ritCheck'), ritState==='assigned' ? ($('ritUnit')?.value || '已指派') : (ritState==='unassigned' ? '尚未指派' : '未確認')],
    hazard: [$('hazardCheck'), hazardState==='none' ? '確認無危險物' : (hazardState==='has' ? ($('hazardItems')?.value || '有危險物') : '未確認')],
    firstSide: [$('firstSideCheck'), firstSideState==='set' ? (firstSidePhrase() + (($('firstSideNote')?.value||'') ? `｜${$('firstSideNote').value}` : '')) : (firstSideState==='unset' ? '尚未律定' : '未確認')],
    par: [$('parCheck'), $('parCheck')?.checked ? ($('parDetails')?.value || '已要求') : '未要求'],
    support: [$('supportCheck'), supportState==='needed' ? (readSupports().join('、') || '需要支援') : (supportState==='none' ? '暫無需求' : '未確認')],
    breakDoor: [$('breakDoorCheck'), breakDoorState==='required'
      ? ($('breakDoorCompletedAt')?.value ? `已完成｜${fmtTime(datetimeLocalToMs($('breakDoorCompletedAt').value))}` : '準備破門／尚未完成')
      : (breakDoorState==='none' ? '不需要' : '未確認')],
    cordon: [$('cordonCheck'), cordonState==='set' ? ($('cordonArea')?.value || '已劃設') : (cordonState==='pending' ? '尚未劃設' : '未確認')]
  };
  Object.entries(mapping).forEach(([key,[input,text]])=>{
    const card = document.querySelector(`[data-arrival-card="${key}"]`);
    const status = $(`${key}StatusText`);
    const selected = key==='building' ? buildingDone : key==='fire' ? fireDone : key==='trapped' ? trappedState!=='unknown' && !!trappedState : key==='deployment' ? deploymentDone : key==='command' ? commandState==='transferred' : key==='contact' ? !!contactState : key==='rit' ? ritState==='assigned' : key==='hazard' ? (hazardState==='none'||hazardState==='has') : key==='firstSide' ? firstSideState==='set' : key==='support' ? (supportState==='none'||supportState==='needed') : key==='breakDoor' ? (breakDoorState==='none'||breakDoorState==='required') : key==='cordon' ? cordonState==='set' : !!input?.checked;
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
      confirm:['是否確需破門進入','破門前是否回報現場指揮官','是否同步回報指揮中心','是否分別記錄準備破門與破門完成時間'],
      action:['確認破門位置、目的與安全風險','記錄準備時間、完成時間、單位與原因','破門後回報火煙、人員與搜救進展'],
      speech:`破門資訊：準備時間${c.breakDoorAt?fmtTime(c.breakDoorAt):'未登錄'}；完成時間${c.breakDoorCompletedAt?fmtTime(c.breakDoorCompletedAt):'尚未完成'}；${c.breakDoorUnit||'執行單位未登錄'}，${c.breakDoorNote||'位置與原因待補述'}。`
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
function crewSummaryText(){const s=FCFieldEntry.summary(live.crews);return `單位／編組${s.units}筆、已確認人數小計${s.known}人${s.pending?`、${s.pending}筆人數待補`:''}`;}
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
  if(!firebaseEnabled || !isSuperAdmin()){toast('只有最高管理員可以管理帳號');return;}
  const refreshing=$('refreshUsersBtn');if(refreshing)refreshing.disabled=true;
  try{
    const snap=await db.collection('users').get();
    if(!isSuperAdmin())return;
    acceptAdminUsers(snap);
  }catch(err){toast(`帳號讀取失敗：${err.message}`);}
  finally{if(refreshing)refreshing.disabled=false;}
}
let adminUsers=[],adminUsersLoaded=false;
const accountQuery={search:'',status:'',brigade:'',company:'',unit:'',role:'',sort:'newest'};
const ACCOUNT_STATUSES={pending:'待審核',active:'已啟用',suspended:'已停權'};
function setAdminPendingBadge(count){
  for(const id of ['adminPendingBadge','adminManageBadge']){const badge=$(id);if(badge){badge.hidden=!count;badge.textContent=count?`待審 ${count}`:'';}}
}
function acceptAdminUsers(snap){
  adminUsers=snap.docs.map(d=>({id:d.id,...d.data()})).filter(u=>!isSuperAdminEmail(u.email));
  adminUsersLoaded=true;setAdminPendingBadge(FCAccountAdmin.totals(adminUsers).pending);
  renderAdminUsers();
}
function watchUsersForAdmin(){
  if(!firebaseEnabled||!isSuperAdmin())return;
  const unsub=db.collection('users').onSnapshot(acceptAdminUsers,err=>{console.warn('帳號即時更新不可用',err);toast('帳號即時更新中斷，請按重新整理重試');});
  unsubscribers.push(unsub);
}
function adminOptionHtml(values,current,placeholder){return `<option value="">${placeholder}</option>`+values.map(value=>`<option value="${escapeHtml(value)}" ${value===current?'selected':''}>${escapeHtml(value)}</option>`).join('');}
function updateAccountFilterChoices(){
  const opts=FCAccountAdmin.options(adminUsers,UNIT_TREE,accountQuery.brigade,accountQuery.company);
  const set=(id,values,current,placeholder)=>{const el=$(id);if(el)el.innerHTML=adminOptionHtml(values,current,placeholder);};
  set('accountBrigadeFilter',opts.brigades,accountQuery.brigade,'全部大隊');
  set('accountCompanyFilter',opts.companies,accountQuery.company,'全部中隊');
  set('accountStationFilter',opts.units,accountQuery.unit,'全部分隊');
  const role=$('accountRoleFilter');if(role)role.innerHTML='<option value="">全部職稱／角色</option>'+opts.roles.map(value=>`<option value="${escapeHtml(value)}" ${value===accountQuery.role?'selected':''}>${escapeHtml(roleLabel(value))}</option>`).join('');
}
function renderAdminUsers(){
  const wrap=$('userAdminList');if(!wrap||!isSuperAdmin())return;
  const totals=FCAccountAdmin.totals(adminUsers);
  const labels={all:'全部',...ACCOUNT_STATUSES};
  const summary=$('accountSummary');if(summary)summary.innerHTML=['pending','active','suspended','all'].map(key=>`<button type="button" data-account-status="${key==='all'?'':key}" aria-pressed="${accountQuery.status===(key==='all'?'':key)}"><span>${labels[key]}</span><b>${totals[key]}</b></button>`).join('');
  const chips=$('accountStatusFilters');if(chips)chips.innerHTML=['all','pending','active','suspended'].map(key=>`<button type="button" data-account-status="${key==='all'?'':key}" aria-pressed="${accountQuery.status===(key==='all'?'':key)}">${labels[key]}${key==='pending'?` ${totals.pending}`:''}</button>`).join('');
  const filters=$('accountActiveFilters');if(filters){const active=[['status',ACCOUNT_STATUSES[accountQuery.status]],['brigade',accountQuery.brigade],['company',accountQuery.company],['unit',accountQuery.unit],['role',accountQuery.role&&roleLabel(accountQuery.role)]];filters.innerHTML=active.filter(([,v])=>v).map(([key,value])=>`<button type="button" data-account-clear="${key}" aria-label="清除 ${escapeHtml(value)} 篩選">${escapeHtml(value)} ×</button>`).join('')+(active.some(([,v])=>v)?'<button type="button" data-account-clear="all">清除全部</button>':'');}
  $('accountUnitFilterBtn')?.classList.toggle('filter-active',!!(accountQuery.brigade||accountQuery.company||accountQuery.unit));
  const roles=Object.fromEntries([...new Set(adminUsers.map(u=>u.role))].map(r=>[r,roleLabel(r)]));
  const users=FCAccountAdmin.filter(adminUsers,{...accountQuery,roleLabels:roles},UNIT_TREE);
  const counter=$('accountResultCount');if(counter)counter.textContent=`顯示 ${users.length}／${adminUsers.length} 個帳號`;
  wrap.innerHTML=users.map(u=>{
    const state=FCAccountAdmin.status(u),name=escapeHtml(u.realName||u.callName||u.email||'未具名'),id=escapeHtml(u.id),company=FCAccountAdmin.company(u,UNIT_TREE);
    const action=state==='pending'?'<button class="btn small primary" data-user-action="active" data-user-id="'+id+'">核准啟用</button>':state==='active'?'<button class="btn small danger" data-user-action="suspended" data-user-id="'+id+'">停權</button>':'<button class="btn small primary" data-user-action="active" data-user-id="'+id+'">恢復啟用</button>';
    return `<article class="user-admin-card ${state}"><div><div class="account-card-heading"><b>${name}</b><span class="account-status-label">${state==='pending'?'◉':state==='active'?'✓':'⊘'} ${ACCOUNT_STATUSES[state]}</span></div><div class="account-card-meta"><p>${escapeHtml([u.brigade,company,u.unit||u.station].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' / ')||'未填單位')}</p><p>${escapeHtml(u.title||roleLabel(u.role))}｜${escapeHtml(roleLabel(u.role))}</p><p>${escapeHtml(u.email||'未填 Email')}</p>${state==='pending'?`<p>申請時間：${escapeHtml(u.createdAt?fmtTime(u.createdAt):'未記錄')}</p>`:''}</div></div><div class="button-row compact-actions"><button class="btn small ghost" data-user-detail="${id}" type="button">查看詳細</button>${action}</div></article>`;
  }).join('')||`<div class="empty">${adminUsers.length?'找不到符合條件的帳號。請調整搜尋或清除篩選。':'尚無使用者資料。'} ${adminUsers.length?'<button type="button" class="btn small ghost" data-account-clear="all">清除條件</button>':''}</div>`;
  updateAccountFilterChoices();
}
function bindAccountAdminControls(){
  $('accountSearch')?.addEventListener('input',e=>{accountQuery.search=e.target.value;renderAdminUsers();});
  $('accountSort')?.addEventListener('change',e=>{accountQuery.sort=e.target.value;renderAdminUsers();});
  $('accountRoleFilter')?.addEventListener('change',e=>{accountQuery.role=e.target.value;renderAdminUsers();});
  for(const id of ['accountSummary','accountStatusFilters','accountActiveFilters','userAdminList'])$(id)?.addEventListener('click',e=>{
    const status=e.target.closest('[data-account-status]');if(status){accountQuery.status=status.dataset.accountStatus;renderAdminUsers();return;}
    const clear=e.target.closest('[data-account-clear]');if(clear){const key=clear.dataset.accountClear;if(key==='all'){for(const part of ['search','status','brigade','company','unit','role'])accountQuery[part]='';if($('accountSearch'))$('accountSearch').value='';}else{accountQuery[key]='';if(key==='brigade'){accountQuery.company='';accountQuery.unit='';}if(key==='company')accountQuery.unit='';}renderAdminUsers();return;}
    const detail=e.target.closest('[data-user-detail]');if(detail){showAccountDetail(detail.dataset.userDetail);return;}
    const action=e.target.closest('[data-user-action]');if(action)requestUserStatusUpdate(action.dataset.userId,action.dataset.userAction);
  });
  $('accountUnitFilterBtn')?.addEventListener('click',()=>{updateAccountFilterChoices();$('accountUnitDialog')?.showModal();});
  $('accountBrigadeFilter')?.addEventListener('change',()=>{
    const opts=FCAccountAdmin.options(adminUsers,UNIT_TREE,$('accountBrigadeFilter').value);
    $('accountCompanyFilter').innerHTML=adminOptionHtml(opts.companies,'','全部中隊');
    $('accountStationFilter').innerHTML=adminOptionHtml(opts.units,'','全部分隊');
  });
  $('accountCompanyFilter')?.addEventListener('change',()=>{
    const opts=FCAccountAdmin.options(adminUsers,UNIT_TREE,$('accountBrigadeFilter').value,$('accountCompanyFilter').value);
    $('accountStationFilter').innerHTML=adminOptionHtml(opts.units,'','全部分隊');
  });
  $('accountClearUnit')?.addEventListener('click',()=>{for(const id of ['accountBrigadeFilter','accountCompanyFilter','accountStationFilter'])$(id).value='';});
  $('accountUnitDialog')?.addEventListener('close',e=>{if(e.target.returnValue!=='apply')return;accountQuery.brigade=$('accountBrigadeFilter').value;accountQuery.company=$('accountCompanyFilter').value;accountQuery.unit=$('accountStationFilter').value;renderAdminUsers();});
}
function showAccountDetail(id){
  const u=adminUsers.find(item=>item.id===id);if(!u)return;
  const lines=[['姓名',u.realName||u.callName],['Email',u.email],['大隊',u.brigade],['中隊',FCAccountAdmin.company(u,UNIT_TREE)],['分隊／單位',u.unit||u.station],['職稱',u.title],['角色',roleLabel(u.role)],['狀態',ACCOUNT_STATUSES[FCAccountAdmin.status(u)]],['建立日期',u.createdAt&&fmtTime(u.createdAt)],['核准日期',u.approvedAt&&fmtTime(u.approvedAt)],['核准人',u.approvedBy],['最後修改',u.updatedAt&&fmtTime(u.updatedAt)]];
  openActionSheet('帳號詳細資料',lines.map(([key,value])=>`<div class="readonly-card"><b>${key}</b><br>${escapeHtml(value||'未記錄')}</div>`).join(''));
}
function confirmAccountUpdate(user,next){
  const dialog=$('accountConfirmDialog');if(!dialog)return Promise.resolve(false);
  const verb=next==='suspended'?'停權':FCAccountAdmin.status(user)==='pending'?'核准':'恢復啟用';
  $('accountConfirmTitle').textContent=`確認${verb}帳號？`;
  $('accountConfirmBody').textContent=`${user.realName||user.callName||user.email||'未具名'}｜${user.brigade||''} / ${user.unit||''}｜${roleLabel(user.role)}。${next==='suspended'?'停權後此帳號將無法使用 FireCommand。':'請先核對單位、職稱與角色。'}`;
  $('accountConfirmSubmit').textContent=`確認${verb}`;
  return new Promise(resolve=>{
    const done=()=>{resolve(dialog.returnValue==='confirm');dialog.removeEventListener('close',done);};
    dialog.addEventListener('close',done);$('accountConfirmCancel').onclick=()=>dialog.close('cancel');$('accountConfirmSubmit').onclick=()=>dialog.close('confirm');dialog.showModal();
  });
}
async function requestUserStatusUpdate(userId,next){
  if(!firebaseEnabled||!isSuperAdmin())return;
  const user=adminUsers.find(u=>u.id===userId);
  if(!user||user.id===fbUser?.uid||!FCAccountAdmin.allowedTransition(user,next,SUPER_ADMIN_EMAIL)){toast('此帳號目前不允許這項操作');return;}
  if(!await confirmAccountUpdate(user,next))return;
  await updateUserStatus(userId,next);
}
async function updateUserStatus(userId,status){
  if(!firebaseEnabled||!isSuperAdmin())return;
  const ref=db.collection('users').doc(userId),operator=profile.email;
  try{
    await db.runTransaction(async transaction=>{
      const snap=await transaction.get(ref);
      if(!snap.exists||userId===fbUser?.uid||!FCAccountAdmin.allowedTransition(snap.data(),status,SUPER_ADMIN_EMAIL))throw Error('帳號狀態已變更，請重新整理後再操作');
      const before=FCAccountAdmin.status(snap.data()),now=Date.now();
      const patch={status,updatedAt:now,lastAdminAction:{action:'status-update',before,status,operator,at:now}};
      if(before==='pending'&&status==='active'){patch.approvedAt=now;patch.approvedBy=operator;}
      if(status==='suspended'){patch.suspendedAt=now;patch.suspendedBy=operator;}
      transaction.update(ref,patch);
    });
    toast(`已更新帳號：${status==='suspended'?'停權':'啟用'}`);
    if(!adminUsersLoaded)loadUsersForAdmin();
  }catch(err){toast(`帳號操作未完成：${err.message}`,5000);}
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
    const residents=Array.isArray(a.residents)?a.residents:[],summary=window.FCV34V3?.floorResidentSummary(residents)||{households:residents.length,knownTotal:0,confirmedMinimum:0,pending:0};
    const populationText=summary.pending?`${summary.confirmedMinimum>0?`已確認至少 ${summary.confirmedMinimum} 人｜`:''}${summary.pending} 戶人數未完整`:`已確認 ${summary.knownTotal} 人`;
    const residentSection=`<div class="floor-residents-v3"><div class="floor-resident-summary-v3"><span>住戶｜已記錄 ${summary.households} 戶｜${populationText}</span><button type="button" class="btn small primary" data-add-resident="${f}">＋新增住戶</button></div>${residents.map(r=>residentCardHtmlV3(f,r)).join('')||'<div class="hint">尚未新增本樓住戶紀錄</div>'}</div>`;
    return `<div class="floor-row ${f===fireFloorNum?'fire-floor':''}" data-floor="${f}">
      <div class="floor-label">${floorLabel(f)}</div>
      <select class="floor-action" data-floor-action="${f}"><option ${a.action==='滅火攻擊'?'selected':''}>滅火攻擊</option><option ${a.action==='阻隔延燒'?'selected':''}>阻隔延燒</option><option ${a.action==='就地避難'?'selected':''}>就地避難</option><option ${a.action==='疏散離開'?'selected':''}>疏散離開</option><option ${a.action==='搜索救援'?'selected':''}>搜索救援</option><option ${a.action==='未標示'?'selected':''}>未標示</option></select>
      <input class="floor-note" data-floor-note="${f}" placeholder="補述" value="${escapeHtml(a.note||'')}" />
      ${residentSection}
    </div>`;
  }).join('');
  document.querySelectorAll('[data-floor-action]').forEach(el=>el.addEventListener('change',()=>{collectBuildingOpsFromUI();renderBuildingOps();}));
  document.querySelectorAll('[data-floor-note]').forEach(el => el.addEventListener('change', collectBuildingOpsFromUI));
  document.querySelectorAll('[data-add-resident]').forEach(btn=>btn.onclick=()=>openResidentEditorV3(Number(btn.dataset.addResident)));
  document.querySelectorAll('[data-edit-resident]').forEach(btn=>btn.onclick=()=>openResidentEditorV3(Number(btn.dataset.residentFloor),btn.dataset.editResident));
  document.querySelectorAll('[data-delete-resident]').forEach(btn=>btn.onclick=()=>deleteResidentV3(Number(btn.dataset.residentFloor),btn.dataset.deleteResident));
  loadPrivatePhotos($('verticalSection'));
  renderBuildingResidentDetailsV31();
  renderFloorPlan();
  setBuildingOpsView(activeBuildingView || (isWideBuildingViewport()?'split':'vertical'));
  selectFloorTool(selectedFloorTool || '起火點', false);
}
function collectBuildingOpsFromUI(){
  if(!currentCase) return;
  const ops = getBuildingOps();
  ops.floorActions = Array.from(document.querySelectorAll('.floor-row')).map(row => {
    const floor = Number(row.dataset.floor);
    const previous=(ops.floorActions||[]).find(item=>Number(item.floor)===floor)||{};
    return { ...previous, floor, action: row.querySelector('.floor-action')?.value || '未標示', note: row.querySelector('.floor-note')?.value || '', residents:Array.isArray(previous.residents)?previous.residents:[] };
  });
  currentCase.buildingOps = ops;
}
function residentTotalLabelV3(row={}){
  return window.FCV34V3?.residentPopulationLabel(row.maleCount,row.femaleCount)||'人數未完整';
}
function residentCardHtmlV3(floor,row={}){
  const id=escapeHtml(row.id||''),counts=`男 ${row.maleCount==null?'未知':row.maleCount}｜女 ${row.femaleCount==null?'未知':row.femaleCount}｜${residentTotalLabelV3(row)}`;
  return `<article class="resident-card-v3"><div><strong>${escapeHtml(row.unitNo||'門牌／戶號待補')}</strong>${row.address?`<p>${escapeHtml(row.address)}</p>`:''}<p>${escapeHtml(row.contact||'聯絡人待補')}</p>${row.phone?`<p>${escapeHtml(row.phone)}</p>`:''}<p>${escapeHtml(counts)}</p>${row.status?`<p>狀態：${escapeHtml(row.status)}</p>`:''}${row.note?`<p>${escapeHtml(row.note)}</p>`:''}${row.photoStatus==='pending'?'<p class="photo-pending">照片待重新上傳</p>':row.photoStatus==='local-demo'?'<p>合成照片｜本機示範，非雲端上傳</p>':''}<div class="resident-actions-v3"><button type="button" class="btn small ghost" data-edit-resident="${id}" data-resident-floor="${floor}">修改</button><button type="button" class="btn small danger" data-delete-resident="${id}" data-resident-floor="${floor}">刪除</button></div></div><div class="private-photo" data-photo-path="${escapeHtml(row.photoPath||'')}">${row.photoStatus==='pending'&&!row.photoPath?'照片待補':''}</div></article>`;
}
function residentCountOptionsV3(value){
  const current=value==null?'':String(value),values=['',...Array.from({length:16},(_,i)=>String(i))];if(current&&!values.includes(current))values.push(current);
  return values.map(v=>`<option value="${v}" ${v===current?'selected':''}>${v===''?'未知':v}</option>`).join('');
}
function residentDraftFromSheetV3(existing={}){
  const male=$('residentMaleV3').value===''?null:Number($('residentMaleV3').value),female=$('residentFemaleV3').value===''?null:Number($('residentFemaleV3').value);
  return {...existing,address:$('residentAddressV31').value.trim(),addressMode:$('residentAddressV31').dataset.addressMode||'manual',unitNo:$('residentUnitNoV3').value.trim(),contact:$('residentContactV3').value.trim(),phone:$('residentPhoneV31').value.trim(),maleCount:male,femaleCount:female,totalCount:window.FCV34V3?.residentTotal(male,female)??null,status:$('residentStatusV31').value,note:$('residentNoteV3').value.trim(),updatedAt:Date.now()};
}
function updateResidentTotalV3(){const slot=$('residentTotalV3');if(!slot)return;const male=$('residentMaleV3').value===''?null:Number($('residentMaleV3').value),female=$('residentFemaleV3').value===''?null:Number($('residentFemaleV3').value);slot.textContent=`總人數：${window.FCV34V3?.residentPopulationLabel(male,female)||'未完整'}`;}
function openResidentEditorV3(floor,id=''){
  collectBuildingOpsFromUI();const action=getBuildingOps().floorActions.find(x=>Number(x.floor)===Number(floor))||{residents:[]},existing=(action.residents||[]).find(r=>r.id===id)||{};
  const address=String(currentCase.confirmedAddress||currentCase.correctedAddress||currentCase.reportedAddress||currentCase.address||'').trim();
  const composed=window.FCV34V3.residentAddressDraft(existing,address,existing.unitNo||'',floorLabel(floor));
  const statusOptions=['','已確認在場','已疏散','已救出','送醫','死亡'].map(value=>`<option value="${value}" ${existing.status===value?'selected':''}>${value||'尚未確認'}</option>`).join('');
  openActionSheet(`${floorLabel(floor)}｜${id?'修改住戶':'新增住戶'}`,`<div class="field"><label>地址（已帶入案件地址，可修改）<input id="residentAddressV31" data-address-mode="${composed.mode}" value="${escapeHtml(composed.address)}" /></label></div><div class="resident-editor-grid-v3"><div class="field"><label>門牌／戶號<input id="residentUnitNoV3" value="${escapeHtml(existing.unitNo||'')}" placeholder="例：2號／A戶／1號之2" /></label></div><div class="field"><label>聯絡人姓名<input id="residentContactV3" value="${escapeHtml(existing.contact||'')}" /></label></div><div class="field"><label>電話<input id="residentPhoneV31" inputmode="tel" value="${escapeHtml(existing.phone||'')}" /></label></div><div class="field"><label>人員狀態<select id="residentStatusV31">${statusOptions}</select></label></div></div><div class="resident-population-v3"><label>男性人數<select id="residentMaleV3">${residentCountOptionsV3(existing.maleCount)}</select></label><label>女性人數<select id="residentFemaleV3">${residentCountOptionsV3(existing.femaleCount)}</select></label><div id="residentTotalV3" class="resident-total-v3"></div></div><div class="field"><label>穿著／特徵／補充<textarea id="residentNoteV3" rows="3">${escapeHtml(existing.note||'')}</textarea></label></div><label class="photo-input">照片（選填）<input id="residentPhotoV3" type="file" accept="image/*" capture="environment" /></label><div id="residentPhotoPreviewV3" class="local-photo-preview"></div><div id="residentSaveStatusV3" class="hint" role="status">尚未儲存</div><div class="button-row"><button id="saveResidentV3" class="btn primary" type="button">確認儲存</button><button id="cancelResidentV3" class="btn ghost" type="button">取消</button></div>`);
  $('residentAddressV31').oninput=()=>{$('residentAddressV31').dataset.addressMode='manual';};
  $('residentUnitNoV3').oninput=()=>{if($('residentAddressV31').dataset.addressMode==='auto')$('residentAddressV31').value=window.FCV34V3.composeResidentAddress(address,$('residentUnitNoV3').value,floorLabel(floor));};
  $('residentMaleV3').onchange=updateResidentTotalV3;$('residentFemaleV3').onchange=updateResidentTotalV3;updateResidentTotalV3();
  $('residentPhotoV3').onchange=e=>showLocalPhotoPreview(e.target.files[0],$('residentPhotoPreviewV3'));
  $('cancelResidentV3').onclick=closeActionSheet;
  $('saveResidentV3').onclick=()=>saveResidentV3(floor,id,existing);
}
async function saveResidentV3(floor,id,existing={}){const savedCaseId=currentCaseId;
  const button=$('saveResidentV3'),file=$('residentPhotoV3')?.files[0],key=id||uid('resident');button.disabled=true;fieldEntryStatus('residentSaveStatusV3','儲存中');
  try{assertCaseEditor();const draft=residentDraftFromSheetV3(existing);if(file)draft.photoStatus='pending';if(!draft.unitNo&&!draft.contact&&!draft.phone&&draft.maleCount===null&&draft.femaleCount===null&&!draft.note)throw Error('請至少填寫一項住戶資料');
    await updateCaseSection('buildingOpsRevision',c=>{const ops=cloneBuildingOps(c.buildingOps),actions=Array.isArray(ops.floorActions)?ops.floorActions:[],index=actions.findIndex(x=>Number(x.floor)===Number(floor)),entry=index>=0?{...actions[index]}:{floor:Number(floor),action:'未標示',note:'',residents:[]},rows=Array.isArray(entry.residents)?[...entry.residents]:[],ri=rows.findIndex(r=>r.id===key);const row={...(ri>=0?rows[ri]:{}),...draft,id:key};if(ri>=0)rows[ri]=row;else rows.push(row);entry.residents=rows;if(index>=0)actions[index]=entry;else actions.push(entry);ops.floorActions=actions;return {buildingOps:ops};});
    closeActionSheet();renderBuildingOps();
    if(file){try{if(currentCaseId!==savedCaseId)return;const path=await uploadCasePhoto('contacts',`resident-${floor}-${key}`,file);if(currentCaseId!==savedCaseId)return;await updateCaseSection('buildingOpsRevision',c=>{const ops=cloneBuildingOps(c.buildingOps);for(const entry of ops.floorActions||[])if(Number(entry.floor)===Number(floor))entry.residents=(entry.residents||[]).map(r=>r.id===key?{...r,photoPath:path,photoStatus:'ready'}:r);return {buildingOps:ops};});toast('住戶與照片已同步儲存');}catch(error){if(currentCaseId!==savedCaseId)return;await updateCaseSection('buildingOpsRevision',c=>{const ops=cloneBuildingOps(c.buildingOps);for(const entry of ops.floorActions||[])if(Number(entry.floor)===Number(floor))entry.residents=(entry.residents||[]).map(r=>r.id===key?{...r,photoStatus:'pending'}:r);return {buildingOps:ops};});toast(`住戶文字已儲存；照片待重新上傳：${error.message}`,6500);}}
    else toast('住戶已同步儲存');renderBuildingOps();
  }catch(error){fieldEntryStatus('residentSaveStatusV3',`儲存失敗：${error.message}`);button.disabled=false;}
}
function renderBuildingResidentDetailsV31(){
  const slot=$('buildingResidentDetailsV31');if(!slot)return;const entries=currentCase?.buildingOps?.floorActions||[],withRows=entries.filter(entry=>(entry.residents||[]).length);
  slot.hidden=!withRows.length;if(!withRows.length){slot.innerHTML='';return;}
  slot.innerHTML=`<div class="panel-title">樓層詳細資料</div>${withRows.map(entry=>{const rows=entry.residents||[],summary=window.FCV34V3?.floorResidentSummary(rows),details=rows.map(row=>{const pop=window.FCV34V3?.residentPopulationLabel(row.maleCount,row.femaleCount)||'人數未完整';return `${row.unitNo||'戶號待補'}${row.contact?row.contact:''}，${pop}${row.status?`，${row.status}`:''}`;}).join('；');return `<p><strong>${floorLabel(entry.floor)}：</strong>共記錄 ${summary.households} 戶。${escapeHtml(details)}。</p>`;}).join('')}`;
}
async function deleteResidentV3(floor,id){
  const entry=getBuildingOps().floorActions.find(x=>Number(x.floor)===Number(floor)),row=(entry?.residents||[]).find(r=>r.id===id);if(!row||!confirm(`確認刪除 ${floorLabel(floor)}「${row.unitNo||'未命名住戶'}」？`))return;
  try{assertCaseEditor();await updateCaseSection('buildingOpsRevision',c=>{const ops=cloneBuildingOps(c.buildingOps);for(const item of ops.floorActions||[])if(Number(item.floor)===Number(floor))item.residents=(item.residents||[]).filter(r=>r.id!==id);return {buildingOps:ops};});try{await removeCasePhoto(row.photoPath);}catch{toast('住戶紀錄已刪除；照片清理失敗，請交由管理員檢查');}renderBuildingOps();toast('住戶紀錄已刪除');}catch(error){toast(`刪除失敗：${error.message}`);}
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
  const ids=['deploymentTextRecord','practiceScenarioBrief','practiceAiPrompt','sitrepDetail','patientNote','detailNotes','supportDetails','commandSituation','arrivalAddressNote','breakDoorNote','cordonNote'];
  ids.forEach(id=>{const input=$(id);if(!input||document.querySelector(`[data-keyboard-hint="${id}"]`))return;const hint=document.createElement('p');hint.className='hint';hint.dataset.keyboardHint=id;hint.textContent='可使用手機鍵盤的語音轉文字輸入。';input.insertAdjacentElement('afterend',hint);});
}
function focusKeyboardVoiceTarget(id){$(id)?.focus();}

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
function hasDeploymentDrawing(){
  const ops=currentCase?.buildingOps||{};
  return !!(live.vehicles.length || live.crews.length || live.hoses.length || live.hazards.length || (ops.planMarkers||[]).length || (ops.floorActions||[]).some(x=>x.action && x.action!=='未標示'));
}
function deploymentMapSummary(){
  const lines=[];
  if(live.crews.length){
    lines.push(...live.crews.map(x=>`${x.face?`${x.face}由`:''}${x.unit||'未具名單位'}${x.leader?`${x.leader}`:''}（${crewCount31(x).replace(' 人','人')}）${x.task?`指派${x.task}`:x.status&&x.status!=='未指定'?`為${x.status}`:'任務未指定'}`));
  }
  if(live.vehicles.length){
    lines.push(...live.vehicles.map(x=>`${vehicleDisplayName(x)}${x.face?'於'+x.face:''}${x.task?`執行${x.task}`:x.status?`為${x.status}`:''}`));
  }
  if(live.hoses.length){
    lines.push(...live.hoses.map((x,i)=>`${x.sourceName||x.vehicleName||x.label||x.owner||`第${i+1}線`}${x.targetName?(x.task==='車輛串接（流向未指定）'?`與${x.targetName}串接（流向未指定）`:`接至${x.targetName}`):''}${(x.mission||x.task)&&x.task!=='車輛串接（流向未指定）'?`執行${x.mission||x.task}`:''}${x.supplyUnconfirmed?'（供水起點待確認）':''}`));
  }
  if(live.hazards.length){
    const names=[...new Set(live.hazards.map(x=>x.type||x.name||x.label).filter(Boolean))];
    if(names.length) lines.push(`危害標示：${names.join('、')}`);
  }
  const ops=currentCase?.buildingOps||{};
  const floorActions=(ops.floorActions||[]).filter(x=>x.action && x.action!=='未標示');
  if(floorActions.length) lines.push(`建物內部：${floorActions.map(x=>`${floorLabel(x.floor)}${x.action}${x.note?`（${x.note}）`:''}`).join('、')}`);
  const markerCounts=(ops.planMarkers||[]).reduce((acc,x)=>{acc[x.type||'標示']=(acc[x.type||'標示']||0)+1;return acc;},{});
  const markers=Object.entries(markerCounts).map(([key,value])=>`${key}${value}處`);
  if(markers.length) lines.push(`平面圖已標示${markers.join('、')}`);
  if(currentCase?.intakeNotes)lines.push('情資：'+currentCase.intakeNotes);
  return lines.join('；').replace(/；+/g,'；').replace(/[；。]+$/,'');
}
function deploymentMapSignature(){
  const keep=(arr,keys)=>arr.map(x=>Object.fromEntries(keys.map(k=>[k,x?.[k]??'']))).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const ops=currentCase?.buildingOps||{};
  const raw=JSON.stringify({
    vehicles:keep(live.vehicles,['name','unit','task','status','lat','lng']),
    crews:keep(live.crews,['unit','leader','face','task','status','count','lat','lng']),
    hoses:keep(live.hoses,['id','sourceType','sourceId','sourceName','vehicleId','vehicleName','targetType','targetId','label','owner','targetName','mission','type']),
    hazards:keep(live.hazards,['type','name','label','lat','lng']),
    floorActions:keep(ops.floorActions||[],['floor','action','note']),
    planMarkers:keep(ops.planMarkers||[],['floor','type','label','note','x','y','x2','y2'])
  });
  let hash=2166136261;
  for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `v1-${(hash>>>0).toString(16)}-${raw.length}`;
}
function deploymentKeyTerms(){
  const terms=[];
  live.crews.forEach(x=>terms.push(x.face,x.unit,x.leader,x.task));
  live.vehicles.forEach(x=>terms.push(x.name,x.unit,x.task));
  live.hoses.forEach(x=>terms.push(x.label,x.owner,x.targetName,x.mission));
  live.hazards.forEach(x=>terms.push(x.type,x.name,x.label));
  (currentCase?.buildingOps?.floorActions||[]).forEach(x=>{if(x.action&&x.action!=='未標示')terms.push(floorLabel(x.floor),x.action,x.note);});
  return [...new Set(terms.map(x=>String(x||'').replace(/\s+/g,'').trim()).filter(x=>x.length>=2 && !/^(部署|作業中|待命|未填)$/.test(x)))];
}
function deploymentRecordsConflict(text=$('deploymentTextRecord')?.value||currentCase?.deploymentTextRecord||''){
  if(!String(text||'').trim() || !hasDeploymentDrawing()) return false;
  const compact=String(text).replace(/[\s，。；、／/｜|：:（）()\-]/g,'').toLowerCase();
  const terms=deploymentKeyTerms();
  if(!terms.length) return false;
  const matched=terms.filter(term=>compact.includes(term.replace(/\s+/g,'').toLowerCase()));
  const threshold=terms.length<=2?1:Math.ceil(terms.length*0.45);
  return matched.length<threshold;
}
function effectiveDeploymentSummary(){
  if(currentCase?.deploymentTextSource==='intake')return deploymentMapSummary();
  const draft=$('deploymentTextRecord')?.value?.trim();
  if(draft) return draft;
  if(currentCase?.deploymentTextRecord) return String(currentCase.deploymentTextRecord).trim();
  const liveMap=deploymentMapSummary();
  const storedStillMatches=currentCase?.deploymentMapSignature===deploymentMapSignature();
  if(currentCase?.deploymentTextSource==='map-generated'&&storedStillMatches&&currentCase?.deploymentMapSummary) return String(currentCase.deploymentMapSummary).trim();
  return String(liveMap||currentCase?.deploymentMapSummary||'').trim();
}
function renderDeploymentTextReference(dirty=false){
  if(!currentCase) return;
  const textarea=$('deploymentTextRecord');
  if(textarea && !dirty && document.activeElement!==textarea) textarea.value=currentCase.deploymentTextRecord||'';
  const manual=deploymentTextSource==='intake'?'':(textarea?.value.trim()||currentCase.deploymentTextRecord||'');
  const mapText=deploymentMapSummary();
  const storedStillMatches=currentCase.deploymentMapSignature===deploymentMapSignature();
  const text=manual||((deploymentTextSource==='map-generated'&&storedStillMatches)?currentCase.deploymentMapSummary:'')||mapText||currentCase.deploymentMapSummary||'';
  const conflict=!!manual && deploymentTextSource==='manual' && deploymentRecordsConflict(manual);
  const status=$('deploymentTextStatus');
  if(status){
    status.textContent=conflict?'文字與圖面待核對':manual?'文字先行':mapText?'以圖面為主':'尚未紀錄';
    status.className=`tag ${conflict?'red':manual?'amber':mapText?'green':'amber'}`;
  }
  const html=text?`<b>${manual?'現場文字紀錄':'圖面整理摘要'}</b><p>${escapeHtml(text)}</p>${conflict?'<div class="deployment-conflict-hint">圖面新增或調整後與文字關鍵資料不同，儲存時會要求確認。</div>':''}`:'';
  ['deploymentTextReference'].forEach(id=>{const el=$(id);if(!el)return;el.hidden=!text;el.innerHTML=html;});
  renderDeploymentSopSummary();
}
function openDeploymentConflictSheet(onConfirm){
  const text=$('deploymentTextRecord')?.value.trim()||currentCase?.deploymentTextRecord||'';
  const mapText=deploymentMapSummary()||'目前圖面已有部署標示。';
  openActionSheet('圖面與紀錄不符',`<div class="notice danger compact"><b>圖面與紀錄不符</b><br>請先核對現場部署。若確認圖面是最新狀態，系統會清除文字部署，後續以圖面為主。</div><div class="deployment-compare"><section><b>文字紀錄</b><p>${escapeHtml(text||'無')}</p></section><section><b>圖面整理</b><p>${escapeHtml(mapText)}</p></section></div><div class="button-row"><button id="confirmMapAuthorityBtn" type="button" class="btn danger full">我已經確認，以圖面為主</button><button id="returnDeploymentEditBtn" type="button" class="btn ghost full">返回修改</button></div>`);
  $('returnDeploymentEditBtn')?.addEventListener('click',closeActionSheet,{once:true});
  $('confirmMapAuthorityBtn')?.addEventListener('click',async()=>{
    const summary=deploymentMapSummary();
    if($('deploymentTextRecord')) $('deploymentTextRecord').value='';
    deploymentTextSource='map';
    await patchCurrentCase({deploymentTextRecord:'',deploymentTextSource:'map',deploymentMapSummary:summary,deploymentMapSignature:deploymentMapSignature(),deploymentMapConfirmedAt:Date.now()});
    await addLog('deployment','圖面與文字紀錄不符，使用者已確認以圖面為主並清除文字紀錄');
    closeActionSheet(); renderDeploymentTextReference(); renderArrivalStatusCards(); renderCommandGuide();
    if(typeof onConfirm==='function') await onConfirm();
  },{once:true});
}
async function saveDeploymentTextRecord(){
  if(!currentCase) return;
  const text=$('deploymentTextRecord')?.value.trim()||'';
  deploymentTextSource=text?'manual':'map';
  if(text && deploymentRecordsConflict(text)){ openDeploymentConflictSheet(); return; }
  const mapSummary=deploymentMapSummary();
  await patchCurrentCase({deploymentTextRecord:text,deploymentTextSource,deploymentMapSummary:mapSummary,deploymentMapSignature:deploymentMapSignature(),deploymentTextUpdatedAt:Date.now()});
  await addLog('deployment',text?'更新第一時間部署文字紀錄':'清除部署文字紀錄，改以圖面為主');
  renderDeploymentTextReference(); renderArrivalStatusCards(); renderCommandGuide();
  toast(text?'已儲存部署文字並加入確認資料':'已清除文字部署');
}
async function confirmDeploymentConsistency(){
  if(!currentCase)return;
  const text=$('deploymentTextRecord')?.value.trim()||currentCase.deploymentTextRecord||'';
  if(text&&deploymentRecordsConflict(text)){openDeploymentConflictSheet();return;}
  const mapSummary=deploymentMapSummary();
  await patchCurrentCase({deploymentTextRecord:text,deploymentTextSource:text?'manual':'map',deploymentMapSummary:mapSummary,deploymentMapSignature:deploymentMapSignature(),deploymentConsistencyCheckedAt:Date.now()});
  await addLog('deployment','完成部署資料一致性檢查');renderDeploymentTextReference();renderArrivalStatusCards();renderCommandGuide();toast('部署文字與圖面已完成檢查');
}
async function generateAiDeploymentSummary(){
  if(!currentCase || !hasDeploymentDrawing()){ toast('目前尚無可整理的部署圖面'); return; }
  const fallback=deploymentMapSummary();
  const btn=$('aiDeploymentSummaryBtn'); if(btn){btn.disabled=true;btn.textContent='AI 整理中…';}
  let summary=fallback;
  try{
    const response=await authenticatedAI('/api/ai-advice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'deployment',caseData:currentCase,vehicles:live.vehicles,crews:live.crews,hoses:live.hoses,hazards:live.hazards,buildingOps:currentCase.buildingOps})});
    const data=await response.json(); if(!response.ok) throw new Error(data.error||'AI 整理失敗');
    summary=sanitizeAdviceText(data.advice||fallback).replace(/\n+/g,'；');
  }catch(err){
    console.warn('deployment AI summary fallback',err); toast('AI 暫時無法使用，已改用圖面結構化摘要',4200);
  }finally{ if(btn){btn.disabled=false;btn.textContent='AI 依圖面整理部署摘要';} }
  if($('deploymentTextRecord')) $('deploymentTextRecord').value='';
  deploymentTextSource='map-generated';
  await patchCurrentCase({deploymentTextRecord:'',deploymentTextSource,deploymentMapSummary:summary,deploymentMapSignature:deploymentMapSignature(),deploymentTextUpdatedAt:Date.now()});
  await addLog('deployment','依部署圖面產生部署狀況摘要');
  renderDeploymentTextReference(); renderArrivalStatusCards(); renderCommandGuide(); toast('已依圖面整理並儲存部署摘要');
}
function renderDeploymentSopSummary(){
  const el=$('deploymentSopSummary');if(!el)return;
  const crew=live.crews.length?live.crews.map(x=>`<div class="deployment-sop-row"><b>${escapeHtml(x.face||'未分面')}｜${escapeHtml(x.unit||'人員')}</b><span>${escapeHtml(x.task||x.status||'任務未填')}｜${crewCount31(x)}</span></div>`).join(''):'<div class="empty">尚無人員部署。</div>';
  const vehicles=live.vehicles.length?live.vehicles.map(x=>`<div class="deployment-sop-row"><b>${escapeHtml(x.name||x.unit||'車輛')}</b><span>${escapeHtml(x.task||'任務未填')}</span></div>`).join(''):'<div class="empty">尚無車輛部署。</div>';
  const hoses=live.hoses.length?`<div class="deployment-sop-row"><b>水線</b><span>${live.hoses.length} 條</span></div>`:'';
  const text=effectiveDeploymentSummary();
  const textGroup=text?`<div class="deployment-sop-group deployment-sop-text"><h4>部署文字／圖面摘要</h4><p>${escapeHtml(text)}</p></div>`:'';
  const opened=new Set([...el.querySelectorAll('details[open]')].map(x=>x.dataset.summary));
  el.innerHTML=`<p class="deployment-count29">${crewSummaryText()} · ${live.vehicles.length} 車 · ${live.hoses.length} 條水線</p><details data-summary="text" ${opened.has('text')?'open':''}><summary>目前部署與情資摘要</summary>${textGroup||'<p class="hint">尚未登錄</p>'}</details><details data-summary="crews" ${opened.has('crews')?'open':''}><summary>人員明細</summary>${crew}</details><details data-summary="vehicles" ${opened.has('vehicles')?'open':''}><summary>車輛／水線明細</summary>${vehicles}${hoses}</details>`;

}
function stageCompletion(stage){
  const c=currentCase||{}; const states={
    到:[!!c.addressConfirmed,!!c.commandTransfer,!!c.firstSideSet],
    建:[!!c.purpose,!!c.floors,!!c.fireFloor],
    火:[!!(c.fireObservation||c.fireStatus)],
    人:[c.contactState==='found'||c.contactState==='notfound',c.trapped==='有'||c.trapped==='無',c.hazardState==='none'||c.hazardState==='has'],
    支:[c.supportState==='none'||c.supportState==='needed'],
    初:[!!(live.crews.length||live.vehicles.length||c.deploymentTextRecord||c.deploymentMapSummary),!!c.ritSet,!!c.parRequested],
    破:[c.breakDoorState==='none'||c.breakDoorState==='required'],
    警:[c.cordonState==='set']
  }[stage]||[]; return {done:states.filter(Boolean).length,total:states.length};
}
function updateStageCompletion(){
  document.querySelectorAll('[data-stage]').forEach(btn=>{const st=stageCompletion(btn.dataset.stage);btn.classList.toggle('stage-complete',st.total>0&&st.done===st.total);btn.classList.toggle('stage-partial',st.done>0&&st.done<st.total);btn.classList.toggle('stage-missing',st.done===0);btn.dataset.progress=`${st.done}/${st.total}`;});
}
async function saveBuildingOps(options={}){
  if(!currentCase) return;
  collectBuildingOpsFromUI();
  const manual=$('deploymentTextRecord')?.value.trim()||currentCase.deploymentTextRecord||'';
  if(!options.skipConflict && manual && deploymentTextSource==='manual' && deploymentRecordsConflict(manual)){
    openDeploymentConflictSheet(()=>saveBuildingOps({skipConflict:true}));
    return;
  }
  const patch = { buildingOps: getBuildingOps(), deploymentMapSummary:deploymentMapSummary(), deploymentMapSignature:deploymentMapSignature(), updatedAt:Date.now() };
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
  const text=effectiveDeploymentSummary();
  if(!hasFloor && !hasPlan && !hasExternal && !text) return ['目前尚未建立建物內部作戰圖、外部戰術部署圖或文字部署紀錄。'];
  const parts=[];
  if(text) parts.push(`部署紀錄：${text.replace(/[。；]+$/,'')}`);
  if(hasExternal) parts.push(`外部戰術部署已登錄車輛${live.vehicles.length}台、${crewSummaryText()}、水線${live.hoses.length}條及危害標示${live.hazards.length}處`);
  if(hasFloor||hasPlan) parts.push('建物縱向剖面與水平俯視圖已依現場紀錄完成彙整');
  return [`${parts.join('；')}。詳細位置與圖示以本節附圖為準。`];
}

function sanitizeAdviceText(text=''){
  return String(text||'')
    .replace(/```[\s\S]*?```/g,'')
    .replace(/\*\*/g,'')
    .replace(/^#{1,6}\s*/gm,'')
    .replace(/^\*\s+/gm,'- ')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}
function adviceHtml(text=''){
  const lines=sanitizeAdviceText(text).split('\n').map(x=>x.trim()).filter(Boolean);
  if(!lines.length) return '<p class="advice-paragraph">目前尚無建議。</p>';
  let html='', list=[];
  const flush=()=>{ if(list.length){ html+=`<ul class="advice-list">${list.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`; list=[]; } };
  lines.forEach(line=>{
    const bracket=line.match(/^【([^】]+)】\s*(.*)$/);
    const numbered=line.match(/^(?:\d+[、.．]|[一二三四五六七八九十]+、)\s*(.+)$/);
    if(bracket){ flush(); html+=`<section class="advice-section"><h3>${escapeHtml(bracket[1])}</h3>${bracket[2]?`<p>${escapeHtml(bracket[2])}</p>`:''}</section>`; return; }
    if(numbered){ flush(); html+=`<h3 class="advice-heading">${escapeHtml(numbered[1])}</h3>`; return; }
    if(/^[-•]\s*/.test(line)){ list.push(line.replace(/^[-•]\s*/,'')); return; }
    flush(); html+=`<p class="advice-paragraph">${escapeHtml(line)}</p>`;
  });
  flush();
  return html;
}
function setAiAdviceText(text=''){
  const clean=sanitizeAdviceText(text);
  if($('aiAdviceText')) $('aiAdviceText').value=clean;
  if($('aiAdviceDisplay')) $('aiAdviceDisplay').innerHTML=adviceHtml(clean);
  return clean;
}
function localTacticalAdviceText(){
  if(!currentCase) return '';
  const c = currentCase;
  const sections=[];
  const situation=[];
  const building=[c.floors?`${c.floors}樓`:null,c.purpose?`${c.purpose}用途`:null].filter(Boolean).join('');
  if(building) situation.push(`現場為${building}建物。`);
  if(c.fireFloor) situation.push(`起火樓層為${floorText(c.fireFloor)}。`);
  if(c.fireStatus && !/未知|未明/.test(c.fireStatus)) situation.push(`目前火煙狀況：${c.fireStatus.replace(/[。；]+$/,'')}。`);
  if(c.trapped==='有') situation.push(`已確認有${Number(c.trappedCount)||0}人受困。`);
  else if(c.trapped==='無') situation.push('已確認無人受困。');
  sections.push(`【態勢摘要】${situation.join('')||'現場資料持續確認中。'}`);
  const immediate=[];
  if(!c.hazardChecked) immediate.push('儘速由關係人或場所管理人確認瓦斯、化學品、電力、太陽能板及其他危害。');
  if(!c.ritSet) immediate.push('律定RIT救援小組、待命位置、裝備與聯絡頻道。');
  if(!live.hoses.length) immediate.push('確認進攻水線、供水線與防護水線是否已建立。');
  sections.push(`【立即確認】${immediate.join('')||'持續監控火勢、人員與部署變化。'}`);
  const safety=[];
  if(/黑煙|大量|火舌|明火|延燒/.test(c.fireStatus||'')) safety.push('火煙條件強烈，內攻前應確認溫度、氣量、退路、通風及建物結構變化。');
  safety.push('持續執行PAR與個人責任回報，並維持無線電分流。');
  sections.push(`【安全風險】${safety.join('')}`);
  const rescue=c.trapped==='有'?'以人命搜救為優先，確認受困位置、搜救路徑與水線掩護。':'持續由關係人與各面偵查確認是否有人受困。';
  sections.push(`【人命搜救】${rescue}`);
  sections.push(`【水源水線】目前登錄水線${live.hoses.length}條；應確認來源車輛、供水穩定、接口、任務及終點均清楚可追溯。`);
  sections.push(`【支援與回報】現場已登錄車輛${live.vehicles.length}台、${crewSummaryText()}；重要變化應立即向北海回報，並同步更新戰情與部署圖。`);
  return sections.join('\n\n');
}
function renderLocalTacticalAdvice(showToast=false){
  const text = localTacticalAdviceText();
  setAiAdviceText(text);
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
    const res = await authenticatedAI('/api/ai-advice', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'AI 呼叫失敗');
    const cleanedAdvice=setAiAdviceText(data.advice || '');
    $('aiAdviceStatus').textContent = `AI 建議已更新：${fmtTime(Date.now())}`; updateAiAdviceButton();
    const patch = { aiLastAt: Date.now(), aiLastAdvice: cleanedAdvice, updatedAt:Date.now() };
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
  if(currentCase.aiLastAdvice){ setAiAdviceText(currentCase.aiLastAdvice); updateAiAdviceButton(); return; }
  renderLocalTacticalAdvice(false);
  requestAiAdvice({silent:true});
}
setInterval(updateAiAdviceButton, 30000);
let deploymentDraft27=null,deploymentApplyBusy=false;
function safeRun27(fn){return async(...args)=>{try{return await fn(...args);}catch(err){console.error(err);toast(err.message||'操作失敗，請重試',5000);}};}
async function authenticatedAI(url,options={}){
 if(options.body){const body=JSON.parse(options.body);if(!body.aiProvider)body.aiProvider=aiPreference29; if(body.aiFallback===undefined)body.aiFallback=aiFallback29;if(body.caseData)body.caseData=Object.fromEntries(Object.entries(body.caseData).filter(([k])=>!['vehicles','crews','hoses','hazards','logs','sitreps','players','simulationEvents','practiceResponses','practiceMessages','hazardReferences','intakeEvents'].includes(k)));if(['advice','report','assessment'].includes(body.mode||'advice'))body.hazardReferences=(live.hazardReferences||[]).map(r=>({productName:r.productName,supplier:r.supplier,cas:r.cas,un:r.un,concentration:r.concentration,revision:r.revision,sourceUrl:r.sourceUrl,sourceName:r.sourceFile?.name||'',sha256:r.sourceFile?.sha256||'',reviewedBy:r.reviewedBy,reviewedAt:r.reviewedAt,sections:r.sections}));options={...options,body:JSON.stringify(body)};}
 const token=firebaseEnabled&&firebase.auth().currentUser?await firebase.auth().currentUser.getIdToken():'';
 return fetch(url,{...options,headers:{...(options.headers||{}),...(token?{Authorization:`Bearer ${token}`}:{})},signal:options.signal||AbortSignal.timeout(75000)});
}
function initV27(){
 $('practiceInstructorMode').onchange=()=>{const human=$('practiceInstructorMode').value==='human';$('practiceHostRole').disabled=human;};
 $('moreNavBtn').onclick=()=>{openActionSheet('更多功能',`<div class="more-grid">${[['aiSection','AI 建議與化災資料'],['dashboardSection','人員與車輛'],['reportSection','進度報告'],['assessmentSection','檢討評估']].map(([id,label])=>`<button type="button" class="btn ghost" data-more-page="${id}">${label}</button>`).join('')}</div>`);$('appActionBody').querySelectorAll('[data-more-page]').forEach(b=>b.onclick=()=>{switchCasePage(b.dataset.morePage);closeActionSheet();});};
 $('submitPracticeResponse').onclick=safeRun27(submitTrainingResponse);
 $('endPracticeBtn').onclick=safeRun27(async()=>{if(isHumanInstructor())await trainingCommit({type:'finish',reason:'真人教官判定演練結束'});});
 $('parseDeploymentBtn').onclick=safeRun27(parseDeployment27);
 $('rotateDeploymentBtn').onclick=safeRun27(()=>saveBuildingBox({rotationDeg:getBuildingBox().rotationDeg+90},'旋轉建物 90°，保留連結'));
 installSds27();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateTrainingClock();if(isAiInstructor())safeRun27(processTraining)();}});
}


async function parseDeployment27(){openIntake28($('deploymentTextRecord').value.trim());}
const SDS_SECTIONS=['化學品與廠商資料','危害辨識','成分辨識','急救措施','滅火措施','洩漏處理','安全處置與儲存','暴露預防與防護','物理及化學性質','安定性與反應性','毒性資料','生態資料','廢棄處置','運送資料','法規資料','其他資料與版本'];
let selectedSds27=null;
function installSds27(){
 const card=document.createElement('details');card.className='accordion sds-card';card.id='sdsKnowledgePanel';
 card.innerHTML=`<summary><span>化災資料與 SDS</span><span class="chevron">›</span></summary><div class="accordion-body"><p>安全資料表（SDS，舊稱 MSDS）記錄產品成分、危害與應變資訊。先核對產品、製造商及濃度，再使用對應版本。</p><div class="source-links"><a href="https://ghs.osha.gov.tw/cht/intro/search.aspx" target="_blank" rel="noopener noreferrer">職安署危害資料</a><a href="https://toxicdms.moenv.gov.tw/Chm" target="_blank" rel="noopener noreferrer">環境部毒化物查詢</a><a href="https://www.phmsa.dot.gov/training/hazmat/erg/emergency-response-guidebook-erg" target="_blank" rel="noopener noreferrer">ERG 運輸事故初期指引</a></div><p class="hint">官方查詢入口於 2026-09-07 核對；目前提供外部查詢及上傳資料整理，不宣稱已連接即時 SDS 搜尋。一般物質資料不能直接取代現場產品 SDS。</p><div class="field"><label for="sdsFilter27">搜尋本案件資料（品名／CAS／UN）</label><input id="sdsFilter27" placeholder="輸入名稱或編號" /></div><div id="sdsSavedList27"></div><details class="sub-accordion"><summary>新增 SDS 或危害資料</summary><div class="field"><label for="sdsFile27">原始資料（PDF／圖片／文字，400 KB 內）</label><input id="sdsFile27" type="file" accept=".pdf,.txt,.md,image/*" /><p class="hint">原檔與摘錄會儲存在此案件；較大文件可填官方或製造商原文連結，再貼上摘錄。</p></div><div class="two-col"><div class="field"><label>產品名稱</label><input id="sdsProduct27" /></div><div class="field"><label>製造商／資料單位</label><input id="sdsSupplier27" /></div><div class="field"><label>CAS 號碼</label><input id="sdsCas27" /></div><div class="field"><label>UN 編號</label><input id="sdsUn27" /></div><div class="field"><label>濃度／混合物</label><input id="sdsConcentration27" /></div><div class="field"><label>修訂日期（原文未載填未知）</label><input id="sdsRevision27" placeholder="例：2025-03-10／未知" /></div></div><div class="field"><label>原文連結</label><input id="sdsUrl27" type="url" placeholder="https://" /></div><div class="field"><label>原文摘錄（可直接貼上）</label><textarea id="sdsText27" rows="4" placeholder="依原文整理；不知道的欄位維持未知"></textarea></div><button id="sdsExtract27" type="button" class="btn small ghost">AI 整理原文</button><p id="sdsExtractStatus27" class="hint" aria-live="polite"></p><details class="sub-accordion"><summary>核對 16 項內容</summary><div class="sds-sections">${SDS_SECTIONS.map((x,i)=>`<div class="field"><label for="sdsSection${i+1}">${i+1}. ${x}</label><textarea id="sdsSection${i+1}" rows="2" placeholder="原文未提供"></textarea></div>`).join('')}</div></details><label class="check"><input id="sdsConfirmed27" type="checkbox" />我已對照原始文件核對產品與摘錄</label><button id="sdsSave27" type="button" class="btn primary full">儲存本案件參考資料</button></details></div>`;
 $('aiSection').prepend(card);
 $('sdsFilter27').oninput=renderSds27;
 $('sdsFile27').onchange=safeRun27(async e=>{const f=e.target.files[0];selectedSds27=null;if(!f)return;if(f.size>400*1024){e.target.value='';throw Error('原檔超過 400 KB；請改填原文連結與摘錄');}const buffer=await f.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))].map(x=>x.toString(16).padStart(2,'0')).join('');const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(f);});selectedSds27={name:f.name,type:f.type||'text/plain',dataUrl,sha256:hash};if(/text|json/.test(f.type)||/\.(txt|md)$/i.test(f.name))$('sdsText27').value=await f.text();$('sdsConfirmed27').checked=false;});
 $('sdsExtract27').onclick=safeRun27(extractSds27);$('sdsSave27').onclick=safeRun27(saveSds27);
 card.addEventListener('input',e=>{if(e.target.id!=='sdsConfirmed27')$('sdsConfirmed27').checked=false;});
}
async function extractSds27(){
 if(!selectedSds27&&!$('sdsText27').value.trim())throw Error('請先上傳資料或貼上原文');const caseId=currentCaseId;const btn=$('sdsExtract27');btn.disabled=true;$('sdsExtractStatus27').textContent='正在依原文整理…';
 try{const res=await authenticatedAI('/api/ai-advice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'sds_extract',text:$('sdsText27').value.slice(0,22000),sourceFile:selectedSds27})});const data=await res.json();if(!res.ok)throw Error(data.error||'整理失敗');if(currentCaseId!==caseId)return;const s=data.sds;for(const [key,id]of Object.entries({productName:'sdsProduct27',supplier:'sdsSupplier27',cas:'sdsCas27',un:'sdsUn27',concentration:'sdsConcentration27',revision:'sdsRevision27'}))if(s[key])$(id).value=String(s[key]);for(let i=1;i<=16;i++)$('sdsSection'+i).value=String(s.sections?.[i]||'原文未提供');$('sdsConfirmed27').checked=false;$('sdsExtractStatus27').textContent='AI 摘錄完成，尚未核對；請對照原始文件後儲存。';}
 catch(err){$('sdsExtractStatus27').textContent='AI 未完成，原文仍保留，可手動整理後儲存。';throw err;}finally{btn.disabled=false;}
}
async function saveSds27(){
 if(!$('sdsConfirmed27').checked)throw Error('請先核對原始資料並勾選確認');const productName=$('sdsProduct27').value.trim(),sourceUrl=$('sdsUrl27').value.trim();if(!productName)throw Error('請填產品名稱');if(!selectedSds27&&!sourceUrl)throw Error('請附原檔或原文連結，以便查證');if(sourceUrl){const u=new URL(sourceUrl);if(!['https:','http:'].includes(u.protocol))throw Error('原文連結需為 HTTPS 或 HTTP');}
 const record={productName,supplier:$('sdsSupplier27').value.trim()||'未知',cas:$('sdsCas27').value.trim()||'未知',un:$('sdsUn27').value.trim()||'未知',concentration:$('sdsConcentration27').value.trim()||'未知',revision:$('sdsRevision27').value.trim()||'未知',sourceUrl,sourceFile:selectedSds27||null,excerpt:$('sdsText27').value.slice(0,22000),sections:Object.fromEntries(SDS_SECTIONS.map((x,i)=>[String(i+1),$('sdsSection'+(i+1)).value.slice(0,3000)||'原文未提供'])),reviewedBy:radioCallSign(),authorUid:profile.id,reviewedAt:Date.now()};
 await addItem('hazardReferences',record);$('sdsConfirmed27').checked=false;await addLog('hazard',`已核對並新增 SDS 參考：${productName}｜版本 ${record.revision}`);renderSds27();toast('原文與參考內容已儲存');
}
function renderSds27(){
 const el=$('sdsSavedList27');if(!el)return;const q=($('sdsFilter27').value||'').toLowerCase();const records=(live.hazardReferences||[]).filter(x=>[x.productName,x.cas,x.un].join(' ').toLowerCase().includes(q));
 const html=records.map(r=>`<details class="sub-accordion"><summary>${escapeHtml(r.productName)} · 版本 ${escapeHtml(r.revision)}</summary><p>${escapeHtml(r.supplier)}｜CAS ${escapeHtml(r.cas)}｜UN ${escapeHtml(r.un)}｜濃度 ${escapeHtml(r.concentration)}</p><p class="hint">${escapeHtml(r.reviewedBy)} 於 ${new Date(r.reviewedAt).toLocaleString('zh-TW')} 核對；來源版本未必為最新。</p>${r.sourceUrl&&/^https?:\/\//i.test(r.sourceUrl)?`<a href="${escapeHtml(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">開啟原文</a>`:''}${r.sourceFile?.dataUrl?`<button class="btn small ghost" data-sds-download="${escapeHtml(r.id)}">下載原始資料</button>`:''}<div class="sds-summary-grid">${[2,4,5,6,8,10,14].map(i=>`<section><b>${i}. ${SDS_SECTIONS[i-1]}</b><p>${escapeHtml(r.sections?.[i]||'原文未提供')}</p></section>`).join('')}</div><details><summary>完整 16 項與原文摘錄</summary>${SDS_SECTIONS.map((label,i)=>`<p><b>${i+1}. ${label}</b><br>${escapeHtml(r.sections?.[i+1]||'原文未提供')}</p>`).join('')}<pre>${escapeHtml(r.excerpt||'')}</pre></details></details>`).join('')||'<p class="empty">尚無符合的已核對資料。</p>';
 if(el.innerHTML===html)return;el.innerHTML=html;
 el.querySelectorAll('[data-sds-download]').forEach(b=>b.onclick=()=>{const r=records.find(x=>x.id===b.dataset.sdsDownload);const link=document.createElement('a');link.href=r.sourceFile.dataUrl;link.download=r.sourceFile.name;link.click();});
}

let trainingAssistBusy=false;
async function processTrainingAssistance(){
 if(trainingAssistBusy||!isPracticeHost()||!['running','paused'].includes(trainingState().phase))return;
 const responses=(live.practiceResponses||[]).slice().sort((a,b)=>a.createdAt-b.createdAt);
 const response=responses.find(r=>!(live.practiceMessages||[]).some(m=>m.responseId===r.id));if(!response)return;
 const humanRoles=new Set(live.players.filter(p=>!p.ai).map(p=>p.role));if(humanRoles.has('初期指揮官'))humanRoles.add('現場指揮官');
 const actors=live.players.filter(p=>p.ai&&!humanRoles.has(p.role));
 const actor=actors.find(p=>p.role==='單位帶隊官')||actors.find(p=>p.role==='現場指揮官')||actors[0];if(!actor)return;
 trainingAssistBusy=true;const roomId=currentCaseId;let kind='AI 腳本',text=`【模擬回應】已收到${response.role}回報：「${response.text.slice(0,160)}」。尚未確認的作業結果維持待回報。`;
 try{
  try{const res=await authenticatedAI('/api/ai-advice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'simulation_role',role:actor.role,response:{text:response.text,role:response.role},event:trainingSteps().find(e=>e.id===response.eventId)})});const data=await res.json();if(res.ok&&data.message?.text){text='【模擬回應】'+String(data.message.text).slice(0,600);kind='AI 角色';}}catch{}
  if(currentCaseId!==roomId)return;
  const record={name:actor.name,role:actor.role,kind,text,responseId:response.id,eventId:response.eventId,authorUid:profile.id,createdAt:Date.now()};
  if(firebaseEnabled)await db.collection('cases').doc(roomId).collection('practiceMessages').doc('reply_'+response.id).set(record);
  else await addItem('practiceMessages',record);
 }finally{trainingAssistBusy=false;}
}
installScene32();
init();
initV27();
initV28();
