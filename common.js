// 共用：導覽列、資料、localStorage、距離、填充度
const TPE_MAIN=(window.CONFIG&&CONFIG.fallbackLocation.latlng)||[25.013993,121.535185];
const TPE_NAME=(window.CONFIG&&CONFIG.fallbackLocation.name)||'捷運公館站公車站';
const LS_EVENTS=(window.CONFIG&&CONFIG.storageKeys.events)||'debug松_events_v1';
function sheet(){ // 手機底部面板：點把手切換大小
  const p=document.querySelector('.panel'),h=p.querySelector('.handle');if(!h)return;
  h.onclick=()=>{if(p.classList.contains('exp')){p.classList.remove('exp');p.classList.add('min')}else if(p.classList.contains('min'))p.classList.remove('min');else p.classList.add('exp')};
}
function baseMap(center,zoom){ // 優先使用 ui.js 的去飽和底圖
  if(typeof quietMap==='function'){const m=quietMap(center,zoom);L.control.zoom({position:'topright'}).addTo(m);return m}
  const m=L.map('map',{preferCanvas:true,zoomControl:false}).setView(center,zoom);
  L.control.zoom({position:'topright'}).addTo(m);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);
  return m;
}
const loadJSON=n=>fetch(n).then(r=>{if(!r.ok)throw new Error(n+' '+r.status);return r.json()});
function hav(a,b,c,d){const R=6371000,r=x=>x*Math.PI/180;return 2*R*Math.asin(Math.sqrt(Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2))}
const ll=f=>[f.geometry.coordinates[1],f.geometry.coordinates[0]];
const fmtM=m=>m<1000?Math.round(m)+' 公尺':(m/1000).toFixed(1)+' 公里';
const walkMin=m=>Math.max(1,Math.round(m*1.3/80)); // 直線×1.3 繞行係數，步速 80m/分
const gmapWalk=(la,lo)=>`https://www.google.com/maps/dir/?api=1&destination=${la},${lo}&travelmode=walking`;
function toast(t){let e=document.querySelector('.toast');if(!e){e=document.createElement('div');e.className='toast';document.body.appendChild(e)}e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2200)}
// 事件：{bin, kind:'full'|'level'|'clear', level(0-100), by:'行人'|'清潔隊', ts}
const getEvents=()=>{try{const v=JSON.parse(localStorage.getItem(LS_EVENTS));return Array.isArray(v)?v.filter(e=>e&&typeof e==='object'&&typeof e.bin==='string'):[]}catch(e){return[]}}; // 舊版／壞掉的存檔不會讓頁面掛掉
// 「這裡需要垃圾桶」民眾回報：只存在這台裝置（localStorage，有桶_ 前綴 → 重設／?reset=1 會清除），沒有預設資料
const LS_NEEDS='有桶_needs_v1',NEED_DEDUP_M=50;
// 原因存穩定的 key；顯示文字另查。舊資料（存顯示文字）讀取時遷移：飲料杯／外帶餐盒／household（家用垃圾）→ general，其他 → other，無法辨識 → null（未選）
const NEED_REASON={general:'一般垃圾',other:'其他'},NEED_REASON_KEYS=Object.keys(NEED_REASON);
const NEED_LEGACY={'飲料杯':'general','外帶餐盒':'general','其他':'other','一般垃圾':'general','家用垃圾':'general',household:'general'};
const migrateReason=r=>r==null?null:NEED_REASON[r]?r:(NEED_LEGACY[r]||null);
const getNeeds=()=>{try{const v=JSON.parse(localStorage.getItem(LS_NEEDS));if(!Array.isArray(v))return[];let ch=false;
  const a=v.filter(n=>n&&typeof n.la==='number'&&typeof n.lo==='number').map(n=>{const r=migrateReason(n.reason??null);if(r!==(n.reason??null)){ch=true;return{...n,reason:r}}return n});
  if(ch)try{localStorage.setItem(LS_NEEDS,JSON.stringify(a))}catch(e){}return a}catch(e){return[]}};
// 200 m 內等統計：總數＋各類（含「未選」），只列 ≥1 的類別
const needBreakdown=A=>{const c={};for(const n of A){const k=n.reason||'none';c[k]=(c[k]||0)+1}return[...NEED_REASON_KEYS,'none'].filter(k=>c[k]).map(k=>[k,k==='none'?'未選':NEED_REASON[k],c[k]])};
// 50 m 內已有回報 → 不重複計數，回傳既有那筆
function addNeed(la,lo){const a=getNeeds(),d=a.find(n=>hav(la,lo,n.la,n.lo)<=NEED_DEDUP_M);if(d)return{rec:d,dup:true};
  const rec={id:'N'+Date.now().toString(36),la,lo,ts:Date.now(),reason:null};a.push(rec);localStorage.setItem(LS_NEEDS,JSON.stringify(a.slice(-500)));return{rec,dup:false}}
function removeNeed(id){localStorage.setItem(LS_NEEDS,JSON.stringify(getNeeds().filter(x=>x.id!==id)))}
const NEED_NOTE_MAX=40;function setNeedNote(id,t){const a=getNeeds(),n=a.find(x=>x.id===id);if(!n)return;n.note=String(t||'').trim().slice(0,NEED_NOTE_MAX)||null;localStorage.setItem(LS_NEEDS,JSON.stringify(a))} // 「其他」的說明文字：只存 localStorage，存檔前裁到 40 字
function setNeedReason(id,reason){if(!NEED_REASON[reason])return;const a=getNeeds(),n=a.find(x=>x.id===id);if(!n)return;n.reason=reason;localStorage.setItem(LS_NEEDS,JSON.stringify(a))}
function addEvent(e){const a=getEvents(),r={...e,id:e.id||('ev'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),ts:Date.now()};a.push(r);localStorage.setItem(LS_EVENTS,JSON.stringify(a.slice(-500)));return r}
// 依 id 撤回一筆事件（行人「取消」自己剛送出的回報）
function removeEvent(id){localStorage.setItem(LS_EVENTS,JSON.stringify(getEvents().filter(e=>e.id!==id)))}
function seedFill(id){let h=2166136261;for(const c of id){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0)%101} // 模擬：依 id 固定
function fillOf(id,ev=getEvents()){let f=seedFill(id);for(const e of ev)if(e.bin===id){f=e.kind==='full'?100:e.kind==='clear'?0:e.level}return f}
const fillColor=f=>typeof rampColor==='function'?rampColor(f):(f>=100?'#d9731f':f>=70?'#e8b931':'#8cc9a8'); // 色階定義在 ui.js
const fillPill=f=>`<span class="pill ${f>=100?'full':f>=70?'mid':'ok'}">${typeof rampState==='function'?rampState(f).t:f>=100?'滿溢':f>=70?'快滿了':'還有空間'}</span>`;
const timeStr=ts=>new Date(ts).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});

// 示範資料：街道清冊垃圾桶（不含場域線索）、示範區站點
async function loadCore(){const [b,y,s]=await Promise.all(['bins.geojson','youbike.geojson','busstops_taipei.geojson'].map(loadJSON));
  const street=b.features.filter(f=>f.properties.source.startsWith('main')).map(f=>({id:f.properties.id,la:ll(f)[0],lo:ll(f)[1],addr:f.properties.address,d:f.properties.district,c:f.properties.colocated||1}));
  const venue=b.features.filter(f=>f.properties.source==='scenic130').map(f=>({id:f.properties.id,la:ll(f)[0],lo:ll(f)[1],addr:f.properties.address,d:f.properties.district,count:f.properties.count}));
  const yb=y.features.map(f=>({t:'yb',id:f.properties.id,name:f.properties.name,la:ll(f)[0],lo:ll(f)[1],act:f.properties.act,dock:f.properties.total,d:f.properties.district,addr:f.properties.address}));
  const bus=s.features.map(f=>({t:'bus',id:f.properties.id,name:f.properties.name,la:ll(f)[0],lo:ll(f)[1],routes:f.properties.routes,d:f.properties.district,addr:f.properties.address}));
  return{raw:b,street,venue,yb,bus}}
const OPT_NAME={A:'A 維持現況',B1:'B1 原位改善指引',B2:'B2 容量／頻率（模擬）',B:'B1 原位改善指引',C:'C 同桶數挪一處'}; // B＝舊存檔相容

// 手機底部面板會蓋住地圖下半部：把焦點往上偏移
const isMobile=()=>matchMedia('(max-width:760px)').matches;
function sheetH(){const p=document.querySelector('.panel');return isMobile()&&p?p.getBoundingClientRect().height:0}
function focusAt(map,latlng,zoom){map.setView(latlng,zoom,{animate:false});const h=sheetH();if(h)map.panBy([0,h/2],{animate:false})}
function fitTo(map,pts,maxZoom){map.fitBounds(pts,{paddingTopLeft:[40,40],paddingBottomRight:[40,40+sheetH()],maxZoom})}
// ===== 重設成原始狀態：清除本站寫入的所有 localStorage／sessionStorage =====
// 明確列表（config.storageKeys＋清潔隊頁 UI 狀態），另外清掉所有「有桶_」「debug松_」開頭的鍵（含舊版）
const APP_KEYS=[...Object.values((window.CONFIG&&CONFIG.storageKeys)||{}),'有桶_crew_ui_v2','有桶_fc_ui'];
const APP_PREFIXES=['有桶_','debug松_'];
function resetAppState(){for(const S of [localStorage,sessionStorage]){const ks=[];for(let i=0;i<S.length;i++)ks.push(S.key(i));
  for(const k of ks)if(APP_KEYS.includes(k)||APP_PREFIXES.some(p=>k.startsWith(p)))S.removeItem(k)}}
const resetToDefault=()=>{resetAppState();location.replace(location.pathname)}; // 回到不帶參數的預設網址
if(new URLSearchParams(location.search).get('reset')==='1')resetToDefault(); // ?reset=1：不跳確認，直接清除（示範前用）
document.addEventListener('DOMContentLoaded',()=>{const sh=document.querySelector('#infoSheet .sh, #menuSheet .sh');if(!sh||sh.querySelector('#resetAll'))return;
  const b=document.createElement('button');b.id='resetAll';b.type='button';b.textContent='重設成原始狀態';
  b.style.cssText='display:block;width:100%;min-height:var(--touch);margin:16px 0 4px;border:0;border-radius:var(--r-sm);background:var(--gray-1);color:var(--ink);font:600 15px var(--font);cursor:pointer';
  b.onclick=()=>{if(confirm('會清除所有回報與紀錄，確定？'))resetToDefault()};
  const p=document.createElement('p');p.textContent='清除本機所有回報、校正與方案紀錄，回到預設畫面。';p.style.cssText='margin:0 0 8px;font:400 12px var(--font);color:var(--mute)';
  sh.append(b,p)});
