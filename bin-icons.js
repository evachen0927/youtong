// ===== 有桶・垃圾桶標記（無外框、平面幾何；正面桶身＋桶蓋＋地面陰影）=====
// 依賴：BIN_CAT（bin-category.js）、rampColor（ui.js）
// 滿度＝桶身內的水位（固定冷→暖色階）；桶蓋＝類別色；未顯示滿度時桶身為實色。
const BIN_NEUTRAL='#5d6468';
function shadeHex(h,k){const n=parseInt(h.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>Math.round(k<0?v*(1+k):v+(255-v)*k));return'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')}
let _binUid=0;
// 單一桶，局部座標 22×29（把手 y0.6、桶蓋 y3–8.2、桶身 y8.5–29）
function binGlyph(color,kind,fill){
  const lid=shadeHex(color,-.18),body='M2 8.5H20L18.6 27Q18.4 29 16.4 29H5.6Q3.6 29 3.4 27Z',show=fill>=0;
  let inner='';
  if(show){const id='bc'+(++_binUid),h=(20.5*Math.max(8,Math.min(100,fill))/100).toFixed(1);
    inner=`<clipPath id="${id}"><path d="${body}"/></clipPath><rect x="0" y="${(29-h).toFixed(1)}" width="22" height="${h}" fill="${rampColor(fill)}" clip-path="url(#${id})"/>`}
  const bodyFill=show?shadeHex(color,.8):color,markC=show?shadeHex(color,.35):'#fff';
  const mark=kind==='recycle'?`<path d="M11 13.2L14.6 19.4H7.4Z" fill="${markC}"/>`:`<rect x="7.5" y="13.6" width="7" height="2.2" rx="1.1" fill="${markC}"/>`;
  return `<rect x="8" y="0.6" width="6" height="3.6" rx="1.6" fill="${lid}"/><rect x="0" y="3" width="22" height="5.2" rx="2.4" fill="${lid}"/>`+
    `<path d="${body}" fill="${bodyFill}"/>${inner}${mark}`+(fill>100?`<circle cx="4.5" cy="2.2" r="2.4" fill="${rampColor(fill)}"/><circle cx="18" cy="1.6" r="1.8" fill="${rampColor(fill)}"/>`:'');
}
// cat: 'general' | 'recycle' | 'both' | 'neutral'；fill: 0–100 或 -1（不顯示）；回傳 {html,w,h}
function binIconSVG(cat,fill=-1){
  if(cat==='both'){const g=BIN_CAT.general.color,r=BIN_CAT.recycle.color,w=36;
    return{w,h:34,html:`<svg width="${w}" height="34" viewBox="0 0 ${w} 34" aria-hidden="true"><ellipse cx="18" cy="31.4" rx="15" ry="2.3" fill="#000" opacity=".13"/>`+
      `<g transform="translate(1.2 6.8) scale(.82)">${binGlyph(g,'general',fill)}</g><g transform="translate(16.8 6.8) scale(.82)">${binGlyph(r,'recycle',fill)}</g></svg>`}}
  const color=cat==='neutral'?BIN_NEUTRAL:BIN_CAT[cat].color,w=28;
  return{w,h:34,html:`<svg width="${w}" height="34" viewBox="0 0 ${w} 34" aria-hidden="true"><ellipse cx="14" cy="31.4" rx="10" ry="2.3" fill="#000" opacity=".13"/><g transform="translate(3 1.8)">${binGlyph(color,cat==='neutral'?'general':cat,fill)}</g></svg>`};
}
// Leaflet divIcon；錨點＝陰影中心（地面）。near＝最近的桶：放大＋淡光圈
function binDivIcon(cat,fill,near){const{w,h,html}=binIconSVG(cat,fill),k=near?1.18:1;
  return L.divIcon({className:'binmk'+(near?' near':''),iconSize:[w*k,h*k],iconAnchor:[w*k/2,31.4*k],
    html:`<div class="w" style="width:${w}px;transform:scale(${k});transform-origin:0 0">${near?'<span class="halo"></span>':''}${html}</div>`})}
