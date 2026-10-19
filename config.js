// ===== 可編輯設定檔：開場數字、示範區、方案參數 =====
// 開場數字（headline）計數定義待與資料工程師對齊，改這裡即可，頁面不寫死數字。
window.CONFIG={
  brand:'有桶',
  headline:{
    title:'有桶｜台北行人垃圾桶：從近 3,000 組到約 800 組',
    items:[
      {value:'681',label:'街道清冊列數（2026-09-30）',note:'資料：臺北市行人專用清潔箱主檔'},
      {value:'130',label:'景點商圈場域線索（另列，不可相加）',note:'2026-08-18'},
      {value:'1,458',label:'YouBike 站 100m 內無清冊垃圾桶',note:'共 1,821 站；直線距離'},
      {value:'2,887',label:'公車站 100m 內無清冊垃圾桶',note:'共 3,460 站位（臺北市）'}
    ],
    caveat:'清冊不等於現場完整現況；北投 0 列、南港 4 列為資料缺漏。'
  },
  demoArea:{name:'公館–大安',bounds:[[25.0075,121.5240],[25.0400,121.5560]],center:[25.0215,121.5380],zoom:15},
  fallbackLocation:{name:'台北市政府',latlng:[25.0375,121.5637]},
  hotspot:{gapThresholdM:100, maxList:8},          // 缺口：最近清冊垃圾桶 > 100m
  scenarioB:{ // B 原位改善：模擬參數（假設，可調整）
    baseCapacityL:80, newCapacityL:120,            // 容量（公升）
    baseCollectionsPerDay:2, newCollectionsPerDay:3,
    litersPer1000Trips:5, nearRadiusM:150        // 假設：每月每 1,000 次借還 → 每日產生 5 公升（假設，可調整）
  },
  scenarioC:{donorRadiusM:1000, demandRadiusM:200, noNewGapM:200, checkRadiusM:600},
  // C：只從熱點 1km 內挑桶；移走後原位置附近（600m 內）不得有站點新增「200m 內無桶」；符合者中挑周邊 200m 活動量最低者
  suggestion:{bIfBinWithinM:100, cMinReduction100:1}, // 建議規則（假設，可調整）：熱點 ≤100m 有桶→B；C 可行且減少 ≥1 個 100m 無桶站→C；否則 A
  compare:[{name:'捷運公館站(2號出口)',label:'人流最高'},{name:'捷運大安站(4號出口)',label:'缺口最大'}], // 「人流高 ≠ 缺口大」比較卡
  storageKeys:{scenario:'debug松_scenario_v2',events:'debug松_events_v1'},
  features:{crewRouting:false}                      // 清潔隊動態路線（隱藏；網址加 ?route=1 也可開）
};
