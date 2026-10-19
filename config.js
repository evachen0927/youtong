// ===== 可編輯設定檔：開場數字、示範區、方案參數 =====
// 開場數字（headline）計數定義待與資料工程師對齊，改這裡即可，頁面不寫死數字。
window.CONFIG={
  headline:{
    title:'台北行人垃圾桶：從近 3,000 組到約 800 組',
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
  scenarioB:{ // 原位改善（模擬）
    baseCapacityL:80, newCapacityL:120,            // 容量（公升）
    baseCollectionsPerDay:2, newCollectionsPerDay:3,
    litersPer1000Trips:5, nearRadiusM:150        // 模擬：每 1000 次借還端點/月 → 每日產生公升數（假設值）
  },
  scenarioC:{demandRadiusM:200}, // 從示範區內挑「周邊 200m YouBike 活動量最低」的一個桶移到缺口最大的站旁
  storageKeys:{scenario:'debug松_scenario_v2',events:'debug松_events_v1'},
  features:{crewRouting:false}                      // 清潔隊動態路線（隱藏；網址加 ?route=1 也可開）
};
