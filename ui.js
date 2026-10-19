// ===== 有桶・設計共用（design-owned；common.js 由工程維護，這裡只做視覺層）=====
// 滿度色階：一條固定冷→暖色階，三個角色頁面共用（值見 tokens.css）
const RAMP={low:'#8aa3a3',mid:'#e2a33b',high:'#d9731f',over:'#a8501a'};
const REPORTED='#e2574c'; // 只用於「被回報滿了」
// 地圖不再有「溢出」狀態：<70% low、70–99% mid、≥100% high；over 參數保留相容但忽略。RAMP.over 只給收運量按鈕等非地圖用途。
const rampColor=(f,over)=>f>=100?RAMP.high:f>=70?RAMP.mid:RAMP.low;
const rampLabel=(f,over)=>f>=100?'已滿':f>=70?'將滿':'尚有空間';
// 安靜底圖：OSM 圖磚＋CSS 去飽和（CARTO 需 API key）
function quietMap(center,zoom,opt={}){
  const m=L.map('map',{zoomControl:false,preferCanvas:true,...opt}).setView(center,zoom);
  m.attributionControl.setPrefix(false);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);
  document.getElementById('map').classList.add('quiet');return m}
// 精簡圖例：items=[{c:顏色,t:文字,shape:'dot'|'line'|'ring'|'diamond'|'html',html}]
function legend(map,items,pos='bottomleft'){
  const C=L.control({position:pos});C.onAdd=()=>{const d=L.DomUtil.create('div','lgd');
    d.innerHTML=items.map(i=>`<span>${i.html||`<i class="${i.shape||'dot'}" style="--c:${i.c}"></i>`}${i.t}</span>`).join('');
    L.DomEvent.disableClickPropagation(d);return d};C.addTo(map);return C}
// 底部抽屜（sheet）：開/關；點背景關閉
function sheetOpen(id){const s=document.getElementById(id);s.hidden=false;s.onclick=e=>{if(e.target===s)s.hidden=true};s.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>s.hidden=true)}
const RAMP_LEGEND=[{c:RAMP.low,t:'<70%'},{c:RAMP.mid,t:'70–99%'},{c:RAMP.high,t:'≥100%'}];
const REPORTED_LEGEND={c:REPORTED,t:'紅色＝已被回報滿了'};
// 角色切換（示範導覽）：常駐分段控制「行人｜清潔隊｜規劃」；host 給定時放進該容器，否則固定在左上
const ROLES=[['pedestrian.html','行人'],['crew.html','清潔隊'],['index.html','規劃']];
function roleSwitch(active,host){const n=document.createElement('nav');n.className='roles'+(host?'':' fixed');n.setAttribute('aria-label','切換角色（示範導覽）');
  n.innerHTML='<span class="wm">有桶</span><span class="seg3">'+ROLES.map(r=>`<a href="${r[0]}"${r[0]===active?' class="on" aria-current="page"':''}>${r[1]}</a>`).join('')+'</span>';
  host?host.prepend(n):document.body.appendChild(n);return n}
// 圖例：完整版放在「資料說明」抽屜頂端；地圖上只留一行提示
const legendHTML=items=>`<div class="lgd static">${items.map(i=>`<span>${i.html||`<i class="${i.shape||'dot'}" style="--c:${i.c}"></i>`}${i.t}</span>`).join('')}</div>`;
function legendIntoSheet(sheetId,items){const sh=document.querySelector('#'+sheetId+' .sh'),hd=sh&&sh.querySelector('.hd');if(!hd)return;
  const d=document.createElement('div');d.innerHTML='<h3>圖例</h3>'+legendHTML(items);hd.after(...d.childNodes)}
const REPORTED_HINT=()=>[{html:binIconSVG(0,'reported').html.replace('width="28" height="34"','width="12" height="15"'),t:'紅色＝有人回報滿了'}];
// 上方浮動 UI 的底部位置（地圖 padding 用，確保最近的桶與光圈不被遮住）
function topUIBottom(){let b=0;document.querySelectorAll('.roles,.top>*,.infochip,.leaflet-top .lgd,.prog,.tchip').forEach(e=>{const r=e.getBoundingClientRect();if(r.height&&r.bottom<innerHeight/2)b=Math.max(b,r.bottom)});return b}
