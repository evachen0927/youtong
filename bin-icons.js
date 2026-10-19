// ===== 有桶・垃圾桶標記（無外框、平面幾何；正面桶身＋桶蓋＋微笑投入口＋地面陰影）=====
// 依賴：BIN_CAT（bin-category.js）、fillColor（common.js）
const BIN_NEUTRAL='#0f9d76';
const BIN_ICON={fill:'bar'}; // 'bar'＝桶下滿度條；'inside'＝桶身內水位
function shadeHex(h,k){const n=parseInt(h.slice(1),16),c=[n>>16,n>>8&255,n&255].map(v=>Math.round(k<0?v*(1+k):v+(255-v)*k));return'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')}
let _binUid=0;
// 單一桶，局部座標 22×29（桶蓋把手 y0.6、桶蓋 y3–8、桶身 y8.5–29）
function binGlyph(color,kind,fill){
  const lid=shadeHex(color,-.22),body='M2 8.5H20L18.6 27Q18.4 29 16.4 29H5.6Q3.6 29 3.4 27Z';
  let inner='';
  if(fill>=0){const id='bc'+(++_binUid),h=(20.5*Math.max(6,fill)/100).toFixed(1);
    inner=`<clipPath id="${id}"><path d="${body}"/></clipPath><rect x="0" y="${(29-h).toFixed(1)}" width="22" height="${h}" fill="${color}" clip-path="url(#${id})"/>`}
  const bodyFill=fill>=0?shadeHex(color,.72):color;
  const mark=kind==='recycle'?`<path d="M11 17.4L14.8 24H7.2Z" fill="#fff"/><circle cx="11" cy="21.6" r="1.25" fill="${fill>=0?shadeHex(color,.72):color}"/>`:'';
  return `<rect x="8" y="0.6" width="6" height="3.6" rx="1.6" fill="${lid}"/><rect x="0" y="3" width="22" height="5.2" rx="2.4" fill="${lid}"/>`+
    `<path d="${body}" fill="${bodyFill}"/>${inner}<path d="M6.2 11.6Q11 15.8 15.8 11.6Q11 17.8 6.2 11.6Z" fill="#00000040"/>${mark}`;
}
// cat: 'general' | 'recycle' | 'both' | 'neutral'；fill: 0–100 或 -1（不顯示）；回傳 {html,w}
function binIconSVG(cat,fill=-1,style=BIN_ICON.fill){
  const inside=style==='inside'&&fill>=0?fill:-1;
  if(cat==='both'){const g=BIN_CAT.general.color,r=BIN_CAT.recycle.color,w=38;
    return{w,html:`<svg width="${w}" height="36" viewBox="0 0 ${w} 36" aria-hidden="true"><ellipse cx="19" cy="33" rx="15.5" ry="2.3" fill="#000" opacity=".13"/>`+
      `<g transform="translate(1.4 7.6) scale(.8)">${binGlyph(g,'general',inside)}</g><g transform="translate(19.2 7.6) scale(.8)">${binGlyph(r,'recycle',inside)}</g></svg>`}}
  const color=cat==='neutral'?BIN_NEUTRAL:BIN_CAT[cat].color,w=30;
  return{w,html:`<svg width="${w}" height="36" viewBox="0 0 ${w} 36" aria-hidden="true"><ellipse cx="15" cy="33" rx="10.5" ry="2.3" fill="#000" opacity=".13"/><g transform="translate(4 2)">${binGlyph(color,cat,inside)}</g></svg>`};
}
// 完整 marker 內容（含最近桶光圈、桶下滿度條）；錨點＝陰影中心（地面）
function binMarkerHTML(cat,fill,near,style=BIN_ICON.fill){
  const{w,html}=binIconSVG(cat,fill,style);
  const bar=style==='bar'&&fill>=0?`<div class="bar"><i style="width:${Math.max(8,fill)}%;background:${fillColor(fill)}"></i></div>`:'';
  return{w,html:`<div class="w" style="width:${w}px">${near?'<span class="halo"></span>':''}${html}${bar}</div>`};
}
