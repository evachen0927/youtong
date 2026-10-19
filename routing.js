// ===== 有桶・離線路網路徑（OSM 預先下載，前端 Dijkstra；展示時不呼叫任何路徑 API）=====
// 依賴：hav（common.js）。RT.load('walk'|'drive') → Promise；RT.dist / RT.from / RT.path
const RT={g:{},WALK_M_PER_MIN:75,SNAP_MAX_M:150};
RT.load=kind=>RT.g[kind]?Promise.resolve(RT.g[kind]):fetch(`roads_${kind}.json`).then(r=>r.json()).then(j=>{
  const n=j.nodes.length,adj=Array.from({length:n},()=>[]);
  j.adj.forEach((es,a)=>es.forEach(([b,l])=>{adj[a].push(b,l);if(j.undirected)adj[b].push(a,l)}));
  const grid=new Map(),cell=0.002,key=(la,lo)=>Math.floor(la/cell)+','+Math.floor(lo/cell);
  j.nodes.forEach(([la,lo],i)=>{const k=key(la,lo);(grid.get(k)||grid.set(k,[]).get(k)).push(i)});
  const g={kind,nodes:j.nodes,adj,geom:j.geom||{},grid,cell,key,bbox:j.bbox,date:j.date,cache:new Map(),snapC:new Map()};return RT.g[kind]=g});
// 最近節點（格網搜尋）→ [node, 直線偏移 m]；超過 SNAP_MAX_M 或在路網範圍外 → null
RT.snap=(g,la,lo)=>{const ck=la.toFixed(6)+','+lo.toFixed(6);if(g.snapC.has(ck))return g.snapC.get(ck);let best=null,bd=1e9;
  const[w,s,e,n]=g.bbox;if(lo>=w&&lo<=e&&la>=s&&la<=n){const ci=Math.floor(la/g.cell),cj=Math.floor(lo/g.cell);
    for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++)for(const i of g.grid.get((ci+di)+','+(cj+dj))||[]){const d=hav(la,lo,g.nodes[i][0],g.nodes[i][1]);if(d<bd){bd=d;best=i}}}
  const r=best!=null&&bd<=RT.SNAP_MAX_M?[best,bd]:null;g.snapC.set(ck,r);return r};
// 單源 Dijkstra（二元堆積），結果快取；limit=最大搜尋距離 m
RT.from=(g,src,limit=1e9)=>{const ck=src+'|'+limit;if(g.cache.has(ck))return g.cache.get(ck);
  const n=g.nodes.length,dist=new Float64Array(n).fill(Infinity),prev=new Int32Array(n).fill(-1),H=[];dist[src]=0;H.push([0,src]);
  const push=x=>{H.push(x);let i=H.length-1;while(i){const p=(i-1)>>1;if(H[p][0]<=H[i][0])break;[H[p],H[i]]=[H[i],H[p]];i=p}};
  const pop=()=>{const t=H[0],l=H.pop();if(H.length){H[0]=l;let i=0;for(;;){const a=2*i+1,b=a+1;let m=i;if(a<H.length&&H[a][0]<H[m][0])m=a;if(b<H.length&&H[b][0]<H[m][0])m=b;if(m===i)break;[H[m],H[i]]=[H[i],H[m]];i=m}}return t};
  while(H.length){const[d,u]=pop();if(d>dist[u])continue;if(d>limit)break;const A=g.adj[u];for(let k=0;k<A.length;k+=2){const v=A[k],nd=d+A[k+1];if(nd<dist[v]){dist[v]=nd;prev[v]=u;push([nd,v])}}}
  const r={dist,prev};g.cache.set(ck,r);return r};
// 兩點路網距離（含兩端直線接駁）；任一端不在路網 → null
RT.dist=(g,a,b,limit)=>{const sa=RT.snap(g,a[0],a[1]),sb=RT.snap(g,b[0],b[1]);if(!sa||!sb)return null;const d=RT.from(g,sa[0],limit).dist[sb[0]];return isFinite(d)?d+sa[1]+sb[1]:null};
// 路徑座標（含路段幾何）
RT.path=(g,a,b)=>{const sa=RT.snap(g,a[0],a[1]),sb=RT.snap(g,b[0],b[1]);if(!sa||!sb)return[a,b];const{prev,dist}=RT.from(g,sa[0]);if(!isFinite(dist[sb[0]]))return[a,b];
  const ns=[];for(let v=sb[0];v!==-1;v=prev[v])ns.push(v);ns.reverse();const out=[a];
  ns.forEach((v,i)=>{if(i){const gm=g.geom[ns[i-1]+','+v];if(gm)out.push(...gm)}out.push(g.nodes[v])});out.push(b);return out};
RT.walkMin=m=>Math.max(1,Math.round(m/RT.WALK_M_PER_MIN));
