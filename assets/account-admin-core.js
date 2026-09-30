(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FCAccountAdmin=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const statuses=['pending','active','suspended'];
  const normalize=value=>String(value??'').normalize('NFKC').trim().toLocaleLowerCase();
  const status=user=>statuses.includes(normalize(user.status))?normalize(user.status):'pending';
  function company(user,tree){
    if(user.company||user.battalion)return user.company||user.battalion;
    const units=tree?.[user.brigade]||{};
    return Object.keys(units).find(name=>(units[name]||[]).includes(user.unit||user.station))||'';
  }
  function options(users,tree,brigade='',companyName=''){
    const matches=users.filter(u=>!brigade||u.brigade===brigade);
    const brigades=[...new Set(users.map(u=>u.brigade).filter(Boolean))].sort();
    const companies=[...new Set(matches.map(u=>company(u,tree)).filter(Boolean))].sort();
    const units=[...new Set(matches.filter(u=>!companyName||company(u,tree)===companyName).map(u=>u.unit||u.station).filter(Boolean))].sort();
    const roles=[...new Set(users.flatMap(u=>[u.role,u.title]).filter(Boolean))].sort();
    return {brigades,companies,units,roles};
  }
  function filter(users,query,tree){
    const text=normalize(query.search), tokens=text.split(/\s+/).filter(Boolean);
    const matched=users.filter(u=>{
      if(query.status&&status(u)!==query.status)return false;
      if(query.brigade&&u.brigade!==query.brigade)return false;
      if(query.company&&company(u,tree)!==query.company)return false;
      if(query.unit&&(u.unit||u.station)!==query.unit)return false;
      if(query.role&&u.role!==query.role&&u.title!==query.role)return false;
      const hay=normalize([u.realName,u.displayName,u.callName,u.email,u.brigade,company(u,tree),u.unit,u.station,u.title,u.role,query.roleLabels?.[u.role]].join(' '));
      return tokens.every(token=>hay.includes(token));
    });
    const time=u=>u.createdAt?.toMillis?.()??(typeof u.createdAt==='number'?u.createdAt:Date.parse(u.createdAt||'')||0);
    const sort=query.sort||'newest';
    matched.sort((a,b)=>{
      if(sort==='oldest')return time(a)-time(b)||String(a.id).localeCompare(String(b.id));
      if(sort==='name'||sort==='brigade'||sort==='unit'||sort==='title')return String(a[sort==='name'?'realName':sort]||'').localeCompare(String(b[sort==='name'?'realName':sort]||''),'zh-TW')||String(a.id).localeCompare(String(b.id));
      return time(b)-time(a)||String(a.id).localeCompare(String(b.id));
    });
    return matched;
  }
  const nextActions=user=>({pending:['active'],active:['suspended'],suspended:['active']})[status(user)]||[];
  function allowedTransition(user,next,protectedEmail){
    return normalize(user.email)!==normalize(protectedEmail)&&nextActions(user).includes(next);
  }
  function totals(users){return {all:users.length,pending:users.filter(u=>status(u)==='pending').length,active:users.filter(u=>status(u)==='active').length,suspended:users.filter(u=>status(u)==='suspended').length};}
  return {normalize,status,company,options,filter,nextActions,allowedTransition,totals};
});
