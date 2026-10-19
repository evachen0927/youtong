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
  fallbackLocation:{name:'興雅國中公車站',latlng:[25.037232,121.568269]}, // 行人頁定位失敗時的示範位置
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
  // ===== 清潔隊「預測調度」（示範區）=====
  // 每桶每小時人流 = 200m 內 YouBike 站該小時「每日平均借＋還次數」的平均（2026-07 實際紀錄；人流由交通活動推估）
  // 每小時產生量(L) = 人流 × litersPerRide × 該桶校正係數；填充度 = 起始量 + 自上次清運起累積量 / capacityL
  // litersPerRide 用官方公開的每日清運頻率校準，仍是假設（calibrate_rate.py）：
  //   環保局：每箱約 120 公升、每日巡查清運約 3–6 次（聯合報 2025-08-17／經濟日報轉載）
  //   假設示範區人流前 10% 的桶在週末一天裝滿 6 次；取第 90 百分位門檻桶（前 10% 中人流最低者）的週末每日人流 617.0
  //   litersPerRide = 6 × 120 / 617.0 = 1.167
  forecast:{
    radiusM:200,
    litersPerRide:1.167,
    calibration:{fillsPerDay:6,capacityL:120,topShare:0.10,dayType:'we',basis:'第 90 百分位門檻桶的週末每日人流',refRidesPerDay:617.0,
      source:'https://money.udn.com/money/story/7307/8944421',label:'用官方公開的每日清運頻率校準，仍是假設'},
    capacityL:120,
    startFillMaxPct:30,          // 模擬：例行清運後殘留起始量 0–30%（依桶編號固定）
    emaAlpha:0.3,                // 校正：實際回報滿度 ÷ 預測滿度，指數移動平均
    shiftStart:'08:00', shiftEnd:'16:30',
    routineClears:['08:00','12:00','16:00'], // 假設：例行巡查清運 3 次（官方每日 3–6 次的下限）；預測從最近一次例行清運起累積
    depot:null,                  // 清潔隊出發點 [lat,lng]；null = 示範區中心
    threshold:70,
    demoTime:{day:'we',time:'19:00'} // 示範：週六傍晚
  },
  storageKeys:{scenario:'debug松_scenario_v2',events:'debug松_events_v1',forecast:'有桶_forecast_v1'}
};
