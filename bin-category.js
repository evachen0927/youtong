// ===== 垃圾桶收受類別（有桶・行人頁） =====
// 官方清冊（臺北市行人專用清潔箱）沒有「一般垃圾／資源回收」欄位。
// 在拿到真實欄位前，這裡依桶 id 以固定雜湊產生「示意」類別（每次載入結果相同）。
// 之後若資料有真實欄位：在 loadCore() 把它放進 bin.category（'general' | 'recycle' | 'both'），
// 這個函式就會直接使用，並回傳 simulated:false；頁面上的「類別為示意資料」標籤也會自動消失。
const BIN_CAT={
  general:{label:'一般垃圾',short:'一般',color:'#3b3734'},
  recycle:{label:'資源回收',short:'回收',color:'#2f6fde'},
  both:{label:'一般＋回收',short:'一般＋回收',color:null}
};
function binCategory(bin){
  if(bin&&BIN_CAT[bin.category])return{cat:bin.category,simulated:false};
  // 示意分配：台北街道行人清潔箱多為一般＋回收成對設置 → 約 60% 成對、25% 只有一般、15% 只有回收
  let h=2166136261;for(const c of 'cat:'+String(bin&&bin.id)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
  const r=(h>>>0)%100;
  return{cat:r<60?'both':r<85?'general':'recycle',simulated:true};
}
// 篩選：'all' | 'general' | 'recycle'；成對桶兩種篩選都會出現
const binAccepts=(bin,filter)=>{if(filter==='all')return true;const c=binCategory(bin).cat;return c==='both'||c===filter};
