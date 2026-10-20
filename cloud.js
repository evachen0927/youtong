// 雲端同步層：Firebase Realtime Database（CDN 模組版 SDK，動態載入）
// - config.js 的 firebaseConfig 留空、SDK 載不到、或離線 → 什麼都不做，網站照常用 localStorage（＋分頁同步）
// - 寫入：common.js 的 addEvent／removeEvent／addNeed／setNeedReason／setNeedNote／removeNeed 先寫本機，再排進佇列由這裡上傳
// - 讀取：onValue 監聽 events、needs → 併回本機快取 → 通知各頁重畫（只重畫資料，不 fit 地圖）
// - 刪除＝寫 del:true（墓碑）；只有持有該筆 owner 密鑰的瀏覽器能刪／改（規則見 database.rules.json）
(function(){
const FBV='12.4.0',T=window.FB_TEST||{},cfg=T.config||((window.CONFIG&&CONFIG.firebaseConfig)||{});
const on=!!(cfg&&cfg.databaseURL&&(cfg.apiKey||T.emu));window.CLOUD_ON=on;
let st='local';const listeners=[];
const STATUS={live:'即時同步',local:'離線・本機',wait:'離線・本機'};
function setStatus(s){st=s;document.documentElement.dataset.sync=s;const el=document.getElementById('syncSt');if(el){el.dataset.s=s;el.querySelector('b').textContent=STATUS[s];el.title=s==='live'?'回報與清運會即時同步到其他裝置':'目前只存在這台裝置；恢復連線後會自動上傳'}listeners.forEach(f=>f(s))}
// 小小的狀態標示：放在地圖右下角版權列的最前面（不搶畫面、不擋操作）
function mountStatus(){if(document.getElementById('syncSt'))return;const m=typeof map!=='undefined'?map:null;const el=document.createElement('span');el.id='syncSt';el.setAttribute('role','status');el.innerHTML='<i></i><b></b>';
  const css=document.createElement('style');css.textContent='#syncSt{display:inline-flex;align-items:center;gap:4px;margin-right:6px;font:inherit;color:#5f6669;white-space:nowrap}#syncSt i{width:6px;height:6px;border-radius:50%;background:#9aa0a3}#syncSt[data-s=live] i{background:#2e9d5b}#syncSt b{font-weight:500}';document.head.appendChild(css);
  const ac=m&&m.attributionControl&&m.attributionControl.getContainer&&m.attributionControl.getContainer();if(ac)ac.insertBefore(el,ac.firstChild);else{el.style.cssText='position:fixed;right:6px;bottom:4px;z-index:500;font-size:10px;background:#ffffffc0;padding:1px 6px;border-radius:8px;pointer-events:none';document.body.appendChild(el)}setStatus(st)}
const own=()=>{try{return JSON.parse(localStorage.getItem(LS_OWN))||{}}catch(e){return{}}};
const setOwn=o=>{try{localStorage.setItem(LS_OWN,JSON.stringify(o))}catch(e){}};
function cid(){let c=localStorage.getItem('有桶_cid_v1');if(!c||!/^c[0-9a-z]{8,24}$/.test(c)){c='c'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);localStorage.setItem('有桶_cid_v1',c)}return c}
const rnd=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>(b%36).toString(36)).join('');
const EV_KEYS=['bin','kind','by','level','amount','amountPct','predPct','calib','fcDay','fcMin'],ND_KEYS=['la','lo','reason','note'];
const pick=(r,ks)=>{const o={};for(const k of ks)if(r[k]!=null&&r[k]!=='')o[k]=r[k];return o};
let api=null,db=null,busy=false,denied=false;const cloudIds={events:new Set(),needs:new Set()};
async function flush(){if(!api||busy||st!=='live'||denied)return;busy=true;try{
  for(;;){const q=cloudQ();if(!q.length)break;const it=q[0],O=own(),id=it.rec.id,up={};
    if(it.op==='put'){const sec=O[id]||(O[id]=rnd());setOwn(O);up[`${it.node}/${id}`]={...pick(it.rec,it.node==='events'?EV_KEYS:ND_KEYS),ts:api.serverTimestamp(),c:cid()};up[`owners/${id}`]=sec;up[`last/${cid()}`]=api.serverTimestamp()}
    else if(O[id]){up[`proof/${id}`]=O[id];if(it.op==='del')up[`${it.node}/${id}/del`]=true;else for(const k of ['reason','note'])if(k in it.rec)up[`${it.node}/${id}/${k}`]=it.rec[k]??null}
    let wait=0;if(Object.keys(up).length)try{await api.update(api.ref(db),up)}catch(e){const m=String(e&&e.message||e);if(/permission|PERMISSION/i.test(m)){if(it.op==='put'&&!it.retry){it.retry=1;wait=1700}else console.warn('[有桶] 雲端拒絕寫入，只保留在本機',it,m)}else{busy=false;return}} // 網路錯誤 → 留在佇列，下次連線再送
    const q2=cloudQ();if(wait){q2[0]=it;localStorage.setItem(LS_CQ,JSON.stringify(q2));await new Promise(r=>setTimeout(r,wait));continue}q2.shift();localStorage.setItem(LS_CQ,JSON.stringify(q2))}
}finally{busy=false}}
// 雲端快照 → 本機快取：雲端有的（未刪）＋本機還沒送出的；本機已送出但雲端沒有（被刪／被清空）就移除
function merge(node,val){const key=node==='events'?LS_EVENTS:LS_NEEDS,q=cloudQ(),pend=new Set(q.filter(x=>x.node===node&&x.op==='put').map(x=>x.rec.id)),dels=new Set(q.filter(x=>x.node===node&&x.op==='del').map(x=>x.rec.id));
  const cl=Object.entries(val||{}).filter(([id,r])=>r&&!r.del&&!dels.has(id)).map(([id,r])=>{const o={...r,id};delete o.c;return o});
  const local=node==='events'?getEvents():getNeeds(),ids=new Set(cl.map(r=>r.id));
  // 本機 upd 還沒送出 → 保留本機欄位
  const lm=new Map(local.map(r=>[r.id,r]));for(const r of cl){const l=lm.get(r.id);if(l&&q.some(x=>x.node===node&&x.op==='upd'&&x.rec.id===r.id)){r.reason=l.reason;r.note=l.note}if(node==='needs'){r.reason=r.reason??null}}
  const keep=local.filter(r=>!ids.has(r.id)&&pend.has(r.id));const out=[...cl,...keep].sort((a,b)=>a.ts-b.ts).slice(-500);
  const before=localStorage.getItem(key),s=JSON.stringify(out);if(s!==before){localStorage.setItem(key,s);appSyncNotify(key)}}
async function start(){
  try{const base=`https://www.gstatic.com/firebasejs/${FBV}/`;const [A,D]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-database.js')]);
    const app=A.initializeApp(cfg,'youtong');db=D.getDatabase(app,cfg.databaseURL);if(T.emu){const [h,p]=T.emu.split(':');D.connectDatabaseEmulator(db,h,+p)}api=D;
    // 雲端拒絕讀取（例如規則還沒部署、資料庫在鎖定模式）→ 維持「離線・本機」，動作留在佇列，規則上線後重新整理即上傳
    let conn=false;const upd=()=>{setStatus(conn&&!denied?'live':'local');if(conn&&!denied)flush()};
    D.onValue(D.ref(db,'.info/connected'),s=>{conn=!!s.val();upd()});
    for(const node of ['events','needs'])D.onValue(D.query(D.ref(db,node),D.orderByChild('ts'),D.limitToLast(500)),s=>merge(node,s.val()),e=>{denied=true;console.warn('[有桶] 雲端讀取被拒，改用本機',e&&e.code||e);upd()});
  }catch(e){console.warn('[有桶] 雲端同步無法啟動，改用本機',e);setStatus('local')}}
window.Cloud={_off:()=>api&&api.goOffline(db),_on:()=>api&&api.goOnline(db),flush,status:()=>st,onStatus:f=>listeners.push(f),on};
addEventListener('online',()=>flush());
const boot=()=>{mountStatus();if(on)start()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else setTimeout(boot,0);
})();
