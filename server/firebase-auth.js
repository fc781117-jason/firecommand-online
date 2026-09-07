// Firebase Auth REST verifies the ID token against the configured Firebase project.
export async function requireActiveUser(req) {
 const token=String(req.headers.authorization||'').match(/^Bearer (.+)$/)?.[1];
 if(!token)throw Object.assign(Error('請先登入有效的消防帳號再使用 AI'),{status:401});
 const apiKey=process.env.FIREBASE_WEB_API_KEY||'AIzaSyBbhrtHh5JCeukTlx1_6_nuF0hcgpJwUsw';
 const project=process.env.FIREBASE_PROJECT_ID||'firecommand-online';
 const res=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token}),signal:AbortSignal.timeout(10000)});
 const data=await res.json();const user=data.users?.[0];if(!res.ok||!user||user.disabled)throw Object.assign(Error('登入已失效，請重新登入'),{status:401});
 const profile=await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/users/${encodeURIComponent(user.localId)}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
 const record=await profile.json();if(!profile.ok||record.fields?.status?.stringValue!=='active')throw Object.assign(Error('此帳號尚未啟用'),{status:403});
 return user.localId;
}
