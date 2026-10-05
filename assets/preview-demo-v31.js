/* Explicitly synthetic local Preview fixtures. No I/O, credentials or cloud writes.
 * The caller must gate use with isolatedPreview && demo-user && !firebaseEnabled.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FCPreviewDemoV31=api;
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const MARKER='firecommand-preview-demo-v31';
  const IDS=Object.freeze({live:'preview_demo_v31_live',practice:'preview_demo_v31_practice'});
  const FIXED_AT=1791000000000;
  const ADDRESS='虛構示範市演練區示範路31號（非真實地址）';
  const CENTER=Object.freeze({lat:25.085,lng:121.48});
  const DEMO_UID='demo-user';
  const LABEL='完全虛構示範資料｜僅供隔離 Preview 本機驗收';

  function placeholder(label){
    // Fixed vector art, not a person or scene photograph. No external references.
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">'+
      '<rect width="480" height="320" fill="#102a43"/><rect x="30" y="30" width="420" height="260" rx="16" fill="#d9e2ec"/>'+
      '<path d="M190 158V98h100v60M205 158v-35h20v35m20 0v-35h20v35" fill="none" stroke="#486581" stroke-width="8"/>'+
      '<text x="240" y="201" text-anchor="middle" font-family="sans-serif" font-size="23" fill="#102a43">SYNTHETIC DEMO</text>'+
      '<text x="240" y="231" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#334e68">'+label+'</text>'+
      '<text x="240" y="259" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#334e68">LOCAL ONLY - NOT A REAL PHOTO</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  const PHOTOS=Object.freeze({contact:placeholder('CONTACT PLACEHOLDER'),hazard:placeholder('HAZARD PLACEHOLDER'),resident:placeholder('RESIDENT PLACEHOLDER')});
  function isDemoPhoto(path){return Object.values(PHOTOS).includes(path);}
  function isDemoCase(value){return !!value&&value.previewDemo===MARKER&&Object.values(IDS).includes(value.id);}
  function point(x,y){return {lat:CENTER.lat+y/111320,lng:CENTER.lng+x/(111320*Math.cos(CENTER.lat*Math.PI/180))};}
  function initialTraining(){return {revision:0,phase:'waiting',index:-1,deadline:0,remainingMs:0,pausedAt:0,pauseCount:0,pauseMs:0,outcomes:[],reason:''};}

  function createCase(mode='live',profile={}){
    if(!Object.prototype.hasOwnProperty.call(IDS,mode))throw new TypeError('示範模式必須是 live 或 practice');
    const caseId=IDS[mode],id=kind=>caseId+'_'+kind;
    // Only the non-personal brigade scope is copied so the case remains visible.
    // All names, identities, contact details and case facts below are synthetic.
    const brigade=typeof profile?.brigade==='string'&&profile.brigade?profile.brigade:'第三大隊';
    const resourceBrigade='第三大隊'; // The fixed sample units belong to this brigade.
    const base={previewDemo:MARKER,synthetic:true,localOnly:true};
    const row=(kind,data)=>({id:id(kind),...data,createdAt:FIXED_AT,updatedAt:FIXED_AT});
    const contact={name:'示範關係人甲（虛構）',phone:'',detail:'完全虛構資料；藍色示範背心。此圖為本機合成佔位圖，未上傳 Storage。',photoPath:PHOTOS.contact,photoStatus:'local-demo'};
    const hazardContact={name:'示範危害聯絡人（虛構）',phone:'',detail:'虛構危害資料聯絡人；未提供真實電話。',photoPath:PHOTOS.hazard,photoStatus:'local-demo'};
    const c={
      id:caseId,...base,mode,schemaVersion:27,caseNo:mode==='practice'?'SIM-DEMO-V31':'DEMO-V31-LIVE',
      address:ADDRESS,reportedAddress:ADDRESS,confirmedAddress:ADDRESS,addressConfirmed:true,arrivalAddressNote:LABEL,
      type:'住宅火警',initialSummary:LABEL+'；四層 RC 住宅，3樓第二面火煙，4樓住戶分戶確認。',
      summary:LABEL+'；四層 RC 住宅，3樓第二面火煙，4樓住戶分戶確認。',
      purpose:'住宅',buildingStructure:'RC',floors:4,fireFloor:'3樓',fireObservedFloor:'3樓',fireObservedSide:'第二面',
      fireSmokeColor:'濃黑煙',fireSmokeVolume:'大量',fireFlameState:'大量明火',fireObservation:'3樓第二面有大量黑煙及明火（虛構）',fireStatus:'大量明火',
      trapped:'有',trappedCount:1,trappedCountMode:'1',victims:[],
      arrived:true,commandState:'transferred',commandTransfer:true,commandSituation:'示範指揮官已完成現場指揮交接（虛構）',
      firstSideState:'set',firstSideSet:true,firstSideMode:'front',firstSideName:'建物正面',firstSideNote:'第一面已設立指揮站（虛構示範）',
      ritState:'assigned',ritSet:true,ritUnit:'竹圍',parRequested:false,
      contactState:'found',contactFound:true,contacts:[row('contact_01',contact)],contactsRevision:1,
      hazardState:'has',hazardChecked:true,hazardItems:'第二面瓦斯與高壓電示範標示；非真實危害',
      hazardContact:hazardContact.name,hazardPhone:'',hazardAppearance:hazardContact.detail,hazardRevision:1,
      hazardRecord:{items:'第二面瓦斯與高壓電示範標示；非真實危害',contact:hazardContact.name,phone:'',appearance:hazardContact.detail,contactInfo:hazardContact,photoPath:PHOTOS.hazard,photoStatus:'local-demo'},
      supportState:'none',supportNeeded:false,supportRequests:[],breakDoorState:'none',breakDoor:false,
      cordonState:'set',cordonSet:true,cordonArea:'示範建物周邊（虛構）',cordonNote:LABEL,
      notes:LABEL,extraNotes:'所有姓名、住戶、患者、位置與處置均為固定測試資料；不可作為真實勤務依據。',
      ...CENTER,locationMeta:{source:'synthetic-preview',formattedAddress:ADDRESS,placeId:'',accuracy:null,unverified:true,locked:true,confirmed:false,updatedAt:FIXED_AT,updatedBy:'示範系統'},
      buildingBox:{...CENTER,widthM:40,heightM:28,rotationDeg:0},
      // FCScene32 derives zone32_command from firstSideNote, exercising the SOP path.
      tacticalZones:{},resourceRevision:0,buildingOpsRevision:1,
      buildingOps:{levels:[4,3,2,1],locked:false,floorActions:[
        {floor:4,action:'疏散離開',note:'兩戶分開記錄；第二戶男性人數仍未知（虛構）',residents:[
          row('resident_4f_a',{address:ADDRESS+' A戶 4F',addressMode:'auto',unitNo:'A戶',contact:'示範住戶甲（虛構）',phone:'',maleCount:2,femaleCount:3,totalCount:5,status:'已疏散',note:'5人已疏散；本機合成佔位圖，非真實住戶照片。',photoPath:PHOTOS.resident,photoStatus:'local-demo'}),
          row('resident_4f_b',{address:ADDRESS+' B戶 4F',addressMode:'auto',unitNo:'B戶',contact:'示範住戶乙（虛構）',phone:'',maleCount:null,femaleCount:2,totalCount:null,status:'已確認在場',note:'男性人數未知，已確認女性2人；不可將未知視為0。',photoPath:'',photoStatus:''})
        ]},
        {floor:3,action:'滅火攻擊',note:'第一面進入，第二面起火點（虛構）',residents:[]},
        {floor:2,action:'搜索救援',note:'搜索示範樓層；未宣告全層清空',residents:[]},
        {floor:1,action:'未標示',note:'示範入口與樓梯',residents:[]}
      ],planMarkers:[
        {id:id('marker_3f_fire'),floor:3,type:'起火點',x:76,y:35,label:'起火點',note:'完全虛構起火點'},
        {id:id('marker_3f_entry'),floor:3,type:'入口',x:50,y:90,label:'入口',note:'示範第一面入口'},
        {id:id('marker_3f_hose'),floor:3,type:'水線',x:50,y:88,x2:76,y2:40,label:'水線',note:'本機示範水線'}
      ]},
      vehicles:[
        row('vehicle_11',{brigade:resourceBrigade,vehicleCode:'11',unit:'淡水',name:'淡水11',type:'水車',canHose:true,face:'第一面',task:'滅火攻擊',status:'作業中',staged:false,headVehicle:'淡水11',queueOrder:0,positionManual:true,...point(-15,-32)}),
        row('vehicle_16',{brigade:resourceBrigade,vehicleCode:'16',unit:'淡水',name:'淡水16',type:'水車',canHose:true,face:'第一面',task:'供水',status:'作業中',staged:false,queueOrder:1,positionManual:true,...point(-32,-32)})
      ],
      crews:[
        row('crew_attack',{brigade:resourceBrigade,unit:'淡水',leader:'示範攻擊組',count:4,countUnknown:false,status:'作業中',task:'滅火攻擊',face:'第一面',floor:'3樓',interior:true,staged:false,positionManual:true,...point(-6,-6)}),
        row('crew_rit',{brigade:resourceBrigade,unit:'竹圍',leader:'示範救援組',count:null,countUnknown:true,status:'RIT',task:'RIT',face:'第一面',floor:'1樓',interior:false,staged:false,positionManual:true,...point(24,-32)})
      ],
      hoses:[row('hose_supply',{sourceType:'vehicle',sourceId:id('vehicle_16'),sourceName:'淡水16',vehicleId:id('vehicle_16'),vehicleName:'淡水16',targetType:'vehicle',targetId:id('vehicle_11'),targetName:'淡水11',unit:'淡水',owner:'淡水',lineNo:1,port:'供水'})],
      hazards:[
        row('hazard_fire',{type:'起火點',positionManual:true,note:'完全虛構，手動起火點',...point(14,7)}),
        row('hazard_gas',{type:'瓦斯',positionManual:true,note:'完全虛構，手動瓦斯標示',...point(33,7)}),
        row('hazard_electric',{type:'高壓電',positionManual:true,note:'完全虛構，手動高壓電標示',...point(33,22)}),
        row('hazard_rehab',{type:'休息區',positionManual:true,note:'完全虛構，手動休息區',...point(-32,24)})
      ],
      sitreps:[
        row('patient_rescued',{brigade:resourceBrigade,unit:'淡水',category:'傷/患者狀況回報',title:'已救出｜示範患者甲（虛構）｜3樓',detail:'完全虛構：已由3樓救出1名男性；未宣告送醫。',patient:{name:'示範患者甲（虛構）',gender:'男',foundAt:'3樓',status:'已救出',note:'固定合成驗收資料；未宣告送醫。'},eventAt:FIXED_AT,submittedAt:FIXED_AT,isBackfill:false,operator:'示範紀錄員',operatorId:DEMO_UID}),
        row('patient_minor',{brigade:resourceBrigade,unit:'竹圍',category:'傷/患者狀況回報',title:'輕傷｜示範患者乙（虛構）｜1樓',detail:'完全虛構：1樓確認1名女性輕傷，與4樓住戶為不同示範對象。',patient:{name:'示範患者乙（虛構）',gender:'女',foundAt:'1樓',status:'輕傷',note:'固定合成驗收資料；不同於4樓住戶，未宣告死亡。'},eventAt:FIXED_AT,submittedAt:FIXED_AT,isBackfill:false,operator:'示範紀錄員',operatorId:DEMO_UID})
      ],
      logs:[row('log_seed',{type:'case',message:LABEL+'；照片僅為合成佔位圖，未上傳 Storage。',operator:'示範系統'})],
      players:[],simulationEvents:[],practiceResponses:[],practiceMessages:[],hazardReferences:[],intakeEvents:[],
      brigade,unit:'淡水',createdBy:DEMO_UID,createdByName:'示範使用者',createdAt:FIXED_AT,updatedAt:FIXED_AT
    };
    if(mode==='practice')Object.assign(c,{
      roomCode:'DEMO31',scenarioTitle:'四層住宅共同功能示範（完全虛構）',scenarioBrief:LABEL,
      scenarioSource:'manual',practiceDifficulty:'standard',learningMode:'guided',instructorMode:'ai',
      hostUid:DEMO_UID,hostName:'示範使用者',traineeUid:DEMO_UID,instructorUid:null,
      training:initialTraining(),practiceStatus:'waiting',practiceEventIntervalMs:45000,
      players:[row('player_commander',{userId:DEMO_UID,name:'示範使用者',role:'現場指揮官',ai:false,joinedAt:FIXED_AT})],
      simulationEvents:[
        row('event_arrival',{order:1,title:'到場確認（虛構）',detail:'確認示範地址、第一面與指揮位置，核對兩台車及兩組人員。',severity:'info',timeLimitSec:180,released:false}),
        row('event_residents',{order:2,title:'分戶核對（虛構）',detail:'4樓A戶男2女3已疏散；B戶男性未知、女性2人。請分戶回報，不將未知數當0。',severity:'warning',timeLimitSec:180,released:false})
      ]
    });
    return c;
  }

  function createCases(profile={}){return [createCase('live',profile),createCase('practice',profile)];}
  function apply(localState,profile,replace){
    if(!localState||typeof localState!=='object'||Array.isArray(localState))throw new TypeError('本機資料必須是物件');
    if(localState.cases!==undefined&&!Array.isArray(localState.cases))throw new TypeError('本機案件資料格式不正確');
    const previous=localState.cases||[];
    // A coincidental ID alone never authorizes replacing somebody else's case.
    if(previous.some(c=>c&&Object.values(IDS).includes(c.id)&&!isDemoCase(c)))throw new Error('示範案件 ID 與既有資料衝突；未變更任何資料');
    const fixtures=createCases(profile),seen=new Set();
    const cases=previous.map(c=>{
      if(!isDemoCase(c))return c;
      seen.add(c.id);
      if(!replace)return c;
      const fresh=fixtures.find(f=>f.id===c.id);
      if(fresh.mode==='practice'){
        // Reset operational test records without elevating an observer or changing
        // existing room ownership. The UI continues enforcing its normal roles.
        for(const key of ['players','hostUid','hostName','instructorUid','instructorMode','traineeUid']){
          if(Object.prototype.hasOwnProperty.call(c,key))fresh[key]=key==='players'&&Array.isArray(c[key])?c[key].map(player=>({...player})):c[key];
        }
      }
      return fresh;
    });
    for(const fresh of fixtures)if(!seen.has(fresh.id))cases.push(fresh);
    return {...localState,cases};
  }
  function seed(localState,profile={}){return apply(localState,profile,false);}
  function reset(localState,profile={}){return apply(localState,profile,true);}
  return Object.freeze({MARKER,IDS,FIXED_AT,ADDRESS,DEMO_UID,PHOTOS,createCase,createCases,isDemoCase,isDemoPhoto,seed,reset});
});
