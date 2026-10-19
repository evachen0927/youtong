// 方案引擎：A 維持現況 / B 原位改善（模擬）/ C 同桶數挪一處。共用於規劃頁與行人頁。
const SC={};
SC.inArea=(la,lo)=>{const[[a,b],[c,d]]=CONFIG.demoArea.bounds;return la>=a&&la<=c&&lo>=b&&lo<=d};
SC.nearestDist=(p,bins)=>{let m=1e9,bi=null;for(const b of bins){const d=hav(p.la,p.lo,b.la,b.lo);if(d<m){m=d;bi=b}}return[m,bi]};
SC.median=a=>{const s=[...a].sort((x,y)=>x-y),n=s.length;return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):0};
// stations: [{t:'yb'|'bus',la,lo,act,routes,name}] in demo area; bins: [{id,la,lo}] street bins
SC.metrics=(stations,bins)=>{const ds=stations.map(s=>SC.nearestDist(s,bins)[0]);
  return{n:stations.length,over100:ds.filter(d=>d>100).length,over200:ds.filter(d=>d>200).length,median:SC.median(ds),ds,
    actServed100:stations.reduce((a,s,i)=>a+(ds[i]<=100?(s.act||0):0),0),routesServed100:stations.reduce((a,s,i)=>a+(ds[i]<=100?(s.routes||0):0),0)}};
SC.hotspots=(stations,bins)=>stations.filter(s=>s.t==='yb'&&s.act).map(s=>{const[d,b]=SC.nearestDist(s,bins);return{...s,nb:d,nbBin:b,gap:s.act*Math.max(0,d-CONFIG.hotspot.gapThresholdM)}})
  .filter(h=>h.nb>CONFIG.hotspot.gapThresholdM).sort((a,b)=>b.gap-a.gap);
SC.demandAround=(b,stations)=>stations.reduce((a,s)=>a+(s.t==='yb'&&hav(b.la,b.lo,s.la,s.lo)<=CONFIG.scenarioC.demandRadiusM?(s.act||0):0),0);
SC.pickDonor=(h,stations,bins)=>{const c=bins.filter(b=>SC.inArea(b.la,b.lo)).map(b=>({b,dem:SC.demandAround(b,stations)})).sort((x,y)=>x.dem-y.dem||hav(y.b.la,y.b.lo,h.la,h.lo)-hav(x.b.la,x.b.lo,h.la,h.lo));return c[0]||null};
SC.applyC=(h,bins,donor)=>bins.map(b=>b.id===donor.b.id?{...b,la:h.la+0.00008,lo:h.lo+0.00008,moved:true}:b);
// B：模擬滿溢 — 每桶每日產生量 ∝ 附近 YouBike 活動量；滿溢時數 = 每趟清運間隔 − 裝滿所需時數
SC.overflow=(bin,stations,capL,perDay,extra=0)=>{const P=CONFIG.scenarioB;const act=extra+stations.reduce((a,s)=>a+(s.t==='yb'&&hav(bin.la,bin.lo,s.la,s.lo)<=P.nearRadiusM?(s.act||0):0),0);
  const lpd=act/1000*P.litersPer1000Trips+5;const interval=24/perDay;const hFull=capL/(lpd/24);return{lpd,hFull,overflowH:Math.max(0,interval-hFull)*perDay}};
SC.evaluate=(h,stations,bins)=>{
  const A=SC.metrics(stations,bins);const P=CONFIG.scenarioB;
  const nb=[h.nbBin];const ex=hav(h.la,h.lo,h.nbBin.la,h.nbBin.lo)>P.nearRadiusM?h.act:0; // 熱點使用者走到最近桶
  const ovA=nb.map(b=>SC.overflow(b,stations,P.baseCapacityL,P.baseCollectionsPerDay,ex)),ovB=nb.map(b=>SC.overflow(b,stations,P.newCapacityL,P.newCollectionsPerDay,ex));
  const donor=SC.pickDonor(h,stations,bins);let C=null,binsC=null,lost=[];
  if(donor){binsC=SC.applyC(h,bins,donor);C=SC.metrics(stations,binsC);lost=stations.filter((s,i)=>A.ds[i]<=100&&C.ds[i]>100)}
  const rec=h.nb<=100?'B':(donor&&C&&C.over100<A.over100?'C':'A');
  return{A,B:{...A,bins:nb,ovA,ovB},C,binsC,donor,lost,rec}};
SC.load=()=>{try{return JSON.parse(localStorage.getItem(CONFIG.storageKeys.scenario))}catch(e){return null}};
SC.save=o=>localStorage.setItem(CONFIG.storageKeys.scenario,JSON.stringify(o));
