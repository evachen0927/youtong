// 共用：導覽列、資料、localStorage、距離、填充度
const TPE_MAIN=(window.CONFIG&&CONFIG.fallbackLocation.latlng)||[25.0375,121.5637];
const TPE_NAME=(window.CONFIG&&CONFIG.fallbackLocation.name)||'台北市政府';
const LS_EVENTS=(window.CONFIG&&CONFIG.storageKeys.events)||'debug松_events_v1';
function nav(active){
  const tabs=[['planner.html','📊','規劃'],['index.html','🚶','行人'],['crew.html','🧹','清潔隊']];
  document.querySelector('header').innerHTML='<div class="brand">debug<span>松</span>・垃圾桶地圖</div><nav class="tabs">'+tabs.map(t=>`<a href="${t[0]}" class="${t[0]===active?'on':''}"><span>${t[1]}</span>${t[2]}</a>`).join('')+'</nav>';
}
function sheet(){ // 手機底部面板：點把手切換大小
  const p=document.querySelector('.panel'),h=p.querySelector('.handle');if(!h)return;
  h.onclick=()=>{if(p.classList.contains('exp')){p.classList.remove('exp');p.classList.add('min')}else if(p.classList.contains('min'))p.classList.remove('min');else p.classList.add('exp')};
}
function baseMap(center,zoom){
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
const getEvents=()=>{try{return JSON.parse(localStorage.getItem(LS_EVENTS))||[]}catch(e){return[]}};
function addEvent(e){const a=getEvents();a.push({...e,ts:Date.now()});localStorage.setItem(LS_EVENTS,JSON.stringify(a.slice(-500)))}
function seedFill(id){let h=2166136261;for(const c of id){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0)%101} // 模擬：依 id 固定
function fillOf(id,ev=getEvents()){let f=seedFill(id);for(const e of ev)if(e.bin===id){f=e.kind==='full'?100:e.kind==='clear'?0:e.level}return f}
const fillColor=f=>f>=80?'#e5484d':f>=50?'#e8a317':'#0f9d76';
const fillPill=f=>`<span class="pill ${f>=80?'full':f>=50?'mid':'ok'}">${f}%</span>`;
const timeStr=ts=>new Date(ts).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});

// 示範資料：街道清冊垃圾桶（不含場域線索）、示範區站點
async function loadCore(){const [b,y,s]=await Promise.all(['bins.geojson','youbike.geojson','busstops_taipei.geojson'].map(loadJSON));
  const street=b.features.filter(f=>f.properties.source.startsWith('main')).map(f=>({id:f.properties.id,la:ll(f)[0],lo:ll(f)[1],addr:f.properties.address,d:f.properties.district}));
  const venue=b.features.filter(f=>f.properties.source==='scenic130').map(f=>({id:f.properties.id,la:ll(f)[0],lo:ll(f)[1],addr:f.properties.address,d:f.properties.district,count:f.properties.count}));
  const yb=y.features.map(f=>({t:'yb',id:f.properties.id,name:f.properties.name,la:ll(f)[0],lo:ll(f)[1],act:f.properties.act,dock:f.properties.total,d:f.properties.district,addr:f.properties.address}));
  const bus=s.features.map(f=>({t:'bus',id:f.properties.id,name:f.properties.name,la:ll(f)[0],lo:ll(f)[1],routes:f.properties.routes,d:f.properties.district,addr:f.properties.address}));
  return{raw:b,street,venue,yb,bus}}
const OPT_NAME={A:'A 維持現況',B:'B 原位改善',C:'C 同桶數挪一處'};
