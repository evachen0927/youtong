// ===== 有桶・設計共用（design-owned；common.js 由工程維護，這裡只做視覺層）=====
// 滿度色階：一條固定冷→暖色階，三個角色頁面共用（值見 tokens.css）
const RAMP={low:'#8aa3a3',mid:'#e2a33b',high:'#e2574c',over:'#a8231c'};
const rampColor=(f,over)=>over||f>100?RAMP.over:f>=80?RAMP.high:f>=50?RAMP.mid:RAMP.low;
const rampLabel=(f,over)=>over||f>100?'溢出':f>=80?'將滿':f>=50?'半滿':'尚有空間';
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
const RAMP_LEGEND=[{c:RAMP.low,t:'<50%'},{c:RAMP.mid,t:'50–79%'},{c:RAMP.high,t:'≥80%'},{c:RAMP.over,t:'溢出'}];
