// ===== 有桶・垃圾桶標記：單一垃圾桶（無外框、平面幾何；正面桶身＋桶蓋＋地面陰影）=====
// 依賴：rampColor（ui.js）
// 滿度＝桶身內水位（tokens 色階），任何縮放都顯示；空的部分＝淺中性灰；桶蓋＝中性。
// state：'reported'（行人回報滿了、尚未清運）→ 整個桶實心紅；'overflow' → 整桶深紅。
const BIN_LID='#8d9397',BIN_EMPTY='#e3e6e7',BIN_REPORTED=REPORTED,BIN_OVER=RAMP.over;
const BIN_BODY='M2 8.5H20L18.6 27Q18.4 29 16.4 29H5.6Q3.6 29 3.4 27Z';
let _binUid=0;
function binGlyph(fill,state){ // 局部座標 22×29
  const solid=state==='reported'?BIN_REPORTED:state==='overflow'?BIN_OVER:null,lid=solid||BIN_LID;
  let body;
  if(solid)body=`<path d="${BIN_BODY}" fill="${solid}"/><rect x="7" y="13.4" width="8" height="2.4" rx="1.2" fill="#ffffffcc"/>`;
  else{const f=Math.max(0,Math.min(100,fill)),id='bc'+(++_binUid),h=(20.5*Math.max(f?10:0,f)/100).toFixed(1);
    body=`<path d="${BIN_BODY}" fill="${BIN_EMPTY}"/>`+(f>0?`<clipPath id="${id}"><path d="${BIN_BODY}"/></clipPath><rect x="0" y="${(29-h).toFixed(1)}" width="22" height="${h}" fill="${rampColor(f)}" clip-path="url(#${id})"/>`:'')}
  return `<rect x="8" y="0.6" width="6" height="3.6" rx="1.6" fill="${lid}"/><rect x="0" y="3" width="22" height="5.2" rx="2.4" fill="${lid}"/>${body}`;
}
// 回傳 {html,w,h}；28×34，錨點＝陰影中心 (14,31.4)
function binIconSVG(fill=0,state){const w=28;
  return{w,h:34,html:`<svg width="${w}" height="34" viewBox="0 0 ${w} 34" aria-hidden="true"><ellipse cx="14" cy="31.4" rx="10" ry="2.3" fill="#000" opacity=".13"/><g transform="translate(3 1.8)">${binGlyph(fill,state)}</g></svg>`}}
// Leaflet divIcon。near＝最近的桶：放大＋淡光圈；small＝低縮放時縮小以減少雜亂
function binDivIcon(fill,near,state,small){const{w,h,html}=binIconSVG(fill,state),k=near?1.2:small?.78:1;
  return L.divIcon({className:'binmk'+(near?' near':''),iconSize:[w*k,h*k],iconAnchor:[w*k/2,31.4*k],
    html:`<div class="w" style="width:${w}px;transform:scale(${k});transform-origin:0 0">${near?'<span class="halo"></span>':''}${html}</div>`})}
// 行人回報滿了且之後沒有清運 → 'reported'
function binState(id,ev){let s=null;for(const e of ev)if(e.bin===id){if(e.kind==='full')s='reported';else if(e.kind==='clear')s=null}return s}
const BIN_LEGEND=()=>[{html:binIconSVG(60).html.replace('width="28" height="34"','width="14" height="17"'),t:'垃圾桶（填色＝滿度）'},...RAMP_LEGEND.slice(0,3),{html:binIconSVG(0,'reported').html.replace('width="28" height="34"','width="14" height="17"'),t:'紅色＝已被回報滿了'}];
