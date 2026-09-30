(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FCFieldEntry=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  function parseCount(value){const raw=String(value??'').trim();if(!raw)return {valid:true,count:null};if(!/^(0|[1-9]\d*)$/.test(raw))return {valid:false,count:null};const count=Number(raw);return {valid:Number.isSafeInteger(count)&&count<=99,count};}
  function unknown(crew){return crew.countUnknown===true||crew.count===undefined||crew.count===null||crew.count==='';}
  function countLabel(crew){return unknown(crew)?'人數待補':`${crew.count} 人`;}
  function summary(crews){const entries=crews||[],pending=entries.filter(unknown).length;return {units:entries.length,known:entries.reduce((n,c)=>n+(unknown(c)?0:Number(c.count)||0),0),pending};}
  function validUnit(tree,brigade,unit){return !!unit&&Object.entries(tree[brigade]||{}).some(([company,list])=>company===unit||(list||[]).includes(unit));}
  function unitOptions(tree,brigade){return Object.entries(tree[brigade]||{}).map(([company,units])=>({company,units:[...new Set([company,...(units||[])])]}));}
  function identity(brigade,unit){return 'manual_unit_'+encodeURIComponent(brigade+'|'+unit);}
  function isolatedPreviewHost(host){const name=String(host||'').toLowerCase();return name.endsWith('.vercel.app')&&name!=='firecommand-online.vercel.app';}
  return {parseCount,unknown,countLabel,summary,validUnit,unitOptions,identity,isolatedPreviewHost};
});
