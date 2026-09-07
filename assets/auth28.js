'use strict';
let identityReady28=false,identityBusy28=false;
async function setAuthPersistence28(authInstance,persistence){
 for(const kind of ['LOCAL','SESSION','NONE']){try{await authInstance.setPersistence(persistence[kind]);return kind;}catch(err){if(kind==='NONE')throw err;}}
}
async function setupIdentity28(){
 let clientId=window.FIRECOMMAND_GOOGLE_CLIENT_ID||'';
 try{const res=await fetch('/api/auth-config',{cache:'no-store'});if(res.ok){const c=await res.json();clientId=clientId||c.googleClientId||'';}}catch{}
 if(!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(clientId))return;
 try{
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=resolve;script.onerror=reject;document.head.append(script);});
  google.accounts.id.initialize({client_id:clientId,callback:handleIdentityCredential28,auto_select:false,ux_mode:'popup'});
  google.accounts.id.renderButton($('identityButton28'),{type:'standard',theme:'filled_blue',size:'large',text:'signin_with',shape:'rectangular',locale:'zh_TW',width:280});
  identityReady28=true;$('identityButton28').hidden=false;$('googleLoginBtn').hidden=true;
  $('authMethod28').textContent='使用 Google 驗證身分後返回本系統。';
  $('retryLoginBtn').onclick=()=>{$('authRecoveryCard').hidden=true;$('identityButton28').scrollIntoView({block:'center'});};
 }catch{$('authMethod28').textContent='Google 快速登入元件未載入，可使用下方備援登入。';}
}
async function handleIdentityCredential28(response){
 if(identityBusy28||!response?.credential)return;identityBusy28=true;
 try{
  const credential=firebase.auth.GoogleAuthProvider.credential(response.credential);
  await auth.signInWithCredential(credential);
 }catch(err){showAuthRecovery(authErrorMessage28(err));}finally{identityBusy28=false;}
}
function authErrorMessage28(err){
 const code=err?.code||'',detail=err?.message||'';
 if(/popup-blocked/.test(code))return '登入視窗被阻擋。請允許彈出視窗，或用 Safari／Chrome 開啟正式系統網址。';
 if(/popup-closed|cancelled-popup/.test(code))return '登入尚未完成。請從此頁的 Google 登入按鈕重新開始。';
 if(/unauthorized-domain|invalid-oauth-client/.test(code))return '此網址尚未加入 Google／Firebase 登入設定，請管理員依 v28 部署說明補上正式網域。';
 if(/network-request-failed/.test(code))return '連線中斷，請確認網路後從本頁重試。';
 if(/missing.*initial.*state|sessionStorage|redirect/.test(detail))return '登入中繼頁的暫存狀態已失效。請關閉該分頁，重新開啟正式系統首頁，再按 Google 登入；不要重整 firebaseapp.com 的舊登入分頁。';
 return 'Google 登入未完成，請由正式系統首頁重新開始。'+(code?'（'+code+'）':'');
}
