# 有桶｜找回消失的垃圾桶（debug松 議題 #2 MVP）

**有桶**：幫行人找到最近的垃圾桶，也幫規劃者找出「人多但沒桶」的缺口。

線上版：https://evachen0927.github.io/youtong/ ・程式碼：https://github.com/evachen0927/youtong

台北行人專用垃圾桶從近 3,000 組縮減到約 800 組。這個靜態網站把**街道清冊垃圾桶**、**YouBike 借還活動量**與**公車站位**放在同一張地圖上，讓規劃者在示範區（公館–大安）找出「人多但附近沒有垃圾桶」的缺口，並比較三種方案：

- **A 維持現況**：現有桶位與容量，作為比較基準。
- **B 原位改善**：桶位不動；熱點最近的桶加大容量、提高清運頻率。模擬參數：容量 80→120 公升、清運 2→3 次/日（滿溢時數為**模擬**）。
- **C 同桶數挪一處**：總桶數不變；只從熱點 1 公里內挑一個桶移到熱點旁。條件是不製造新缺口：原位置 600m 內不能有站點從「200m 內有桶」變成沒有。符合條件的桶中挑周邊 200m 活動量最低的；沒有符合的就標示「C 不可行」。

三方案的定義沿用研究團隊（taipei-waste-lab）「A 現況／B 原位改善／C 同桶數微調一處」的方向。

## 三個頁面
| 頁面 | 檔案 | 功能 |
|---|---|---|
| 規劃（主頁） | `index.html` | 開場數字（來自 `config.js`）、示範區缺口熱點、點熱點看 A/B/C 指標對照與地圖變化，「採用」後存入 localStorage |
| 行人 | `pedestrian.html` | 定位（拒絕時改用示範位置 興雅國中公車站（`config.js > fallbackLocation`），可點地圖手動設定）、最近 5 個垃圾桶＋Google Maps 步行導航、「調整前／調整後」距離比較、回報「滿了」 |
| 清潔隊 | `crew.html` | 單一頁面：依行政區產生清運順序，逐站回報收運量（空／半滿／滿／溢出）並標記已清運，可復原。舊網址 `crew-route.html` 會自動導向 `crew.html` |

## 怎麼執行
```bash
cd trash-mvp
python3 -m http.server 8765   # 開 http://localhost:8765/index.html
```
純靜態網站（HTML/CSS/原生 JS + Leaflet），沒有後端；所有路徑都是相對路徑，可直接放到 GitHub Pages（repo 根目錄），已附 `.nojekyll`。Leaflet 已放在 `vendor/`，不依賴 CDN；**地圖底圖仍需網路**（OpenStreetMap）。離線備援：`demo-backup.mp4` 示範影片。

開場數字、示範區範圍、行人頁示範位置與方案參數都在 **`config.js`**，改這個檔案即可。

### 檔案結構
| 檔案 | 用途 |
|---|---|
| `config.js` | 可編輯設定（開場數字、示範區、方案參數、假設） |
| `common.js` | 資料載入、距離、localStorage 事件、填充度（工程邏輯） |
| `scenario.js` | A/B/C 方案引擎 |
| `tokens.css` | 設計 token（顏色、間距、字級） |
| `ui.css` | 共用元件樣式（⋯ 選單、抽屜、圖例） |
| `ui.js` | 視覺層：滿度色階 `rampColor()`、去飽和底圖 `quietMap()`、圖例、抽屜 |
| `bin-category.js`、`bin-icons.js` | 垃圾桶類別與地圖圖示（行人頁） |
| `common.css` | 舊版共用樣式 |

### localStorage 事件格式
`{bin, kind:'full'|'level'|'clear', level, by:'行人'|'清潔隊', ts, amount, amountPct}`；清潔隊回報收運量時 `amount` 為 `empty|half|full|overflow`，`amountPct` 對應 0／50／100／120。

重建資料：`python3 aggregate_youbike_trips.py`（需先下載 2026-07 租借紀錄 ZIP 到 `/workspace/raw/`）→ `python3 prep.py`（需 shapely、pyproj）。測試：`python test_mvp.py`（Playwright，桌面 1280×800＋手機 390×844）。行人頁的熱點／調整前後在「⋯ 更多」面板（`#more` → `#hotBtn`、`[data-m=after]`，`#advClose` 關閉，`#doneBtn` → `[data-full]` 回報滿了）；清潔隊頁用 `#next [data-amt]` 回報收運量。

## 資料來源（真實開放資料）
| 資料 | 來源 | 授權 | 用法 |
|---|---|---|---|
| 臺北市行人專用清潔箱（街道主檔 681 列，2026-09-30；景點商圈場域 130 點，2026-08-18） | https://data.taipei/dataset/detail?id=a835f3ba-7f50-4b0d-91a6-9df128632d1c ／ https://data.gov.tw/dataset/121355 | 政府資料開放授權條款-第1版 | 街道主檔＝垃圾桶；130 點只當「場域線索」，不計入桶數 |
| YouBike2.0 臺北市即時資訊（站點快照 2026-10-19） | https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json | 政府資料開放授權條款-第1版 | 站點位置 |
| 臺北市公共自行車2.0租借紀錄 2026-07 | https://data.taipei/dataset/detail?id=c5924c17-25db-4f1e-99c4-f8ada40f2445 | 政府資料開放授權條款-第1版 | 每站借＋還次數（排除 7/10、7/11 資料缺口），只發布彙總檔 `youbike_activity_202607.csv` |
| 臺北市公車站位（GetStop） | https://tcgbusfs.blob.core.windows.net/blobbus/GetStop.gz | 政府資料開放授權條款-第1版 | 站位位置、每站停靠路線數 |
| 鄉鎮市區界（內政部，經 taiwan-atlas 2021.9.20 TopoJSON） | https://cdn.jsdelivr.net/npm/taiwan-atlas/towns-10t.json | 政府資料開放授權條款-第1版（原始資料） | 判定是否在臺北市、各區面積 |
| 底圖 | © OpenStreetMap contributors | ODbL | 地圖 |

TDX 公車 API 需申請金鑰（未使用）。

## 哪些是真的、哪些是推估或模擬
| 項目 | 性質 |
|---|---|
| 垃圾桶、YouBike、公車站的位置 | **真實**開放資料（清冊不等於現場完整現況） |
| 垃圾桶類別（一般垃圾＋資源回收） | **真實（全市一致說明）**：清冊沒有逐桶類別欄位；依環保局全市說明「每組包含一般垃圾箱與資源回收箱各 1 個」（中時 2025-08-17、聯合報報導），行人頁每桶都標一般＋回收，`bin-category.js` 的 `binCategory()` 回傳 `simulated:false`。若日後有逐桶欄位會自動改用 |
| YouBike 借＋還次數 | **真實**紀錄的彙總，但當作人流時是**推估** |
| 公車每站停靠路線數 | **推估**（路線數不是上下車人數） |
| **交通活動量是人流的推估，不等於垃圾量** | — |
| 垃圾桶填充度、滿溢告警 | **模擬**（依桶編號固定產生；行人與清潔隊回報會覆蓋）——目前唯一的模擬資料欄位 |
| B 方案模擬參數與滿溢假設（容量、清運頻率、每千次借還產生公升數） | **模擬／假設**，參數在 `config.js` |
| C 方案移桶、行人頁「調整後」 | **情境模擬**，不是實際設置 |
| 距離 | 直線距離，不是步行距離 |

已知資料缺漏：北投區街道清冊 0 列、南港區 4 列 →**資料缺漏，非實際覆蓋率**。

## 熱點與方案的計算方式
- 示範區：公館–大安矩形（`config.js > demoArea`），YouBike 站＋公車站位。
- 缺口熱點：YouBike 站最近街道清冊垃圾桶 > 100m，依「缺口指數＝活動量 ×（距離−100m）」排序。研究團隊的錨點則是每區活動量前 3（間隔 ≥300m），兩者並列參考（`anchors.csv`）。
- 指標（三方案相同）：示範區內 100m／200m 內無桶站數、站點到最近桶中位數、100m 內有桶的 YouBike 活動量與公車停靠路線數，以及熱點旁桶每日滿溢時數（模擬）。C 方案另列「原服務區損失」。
- 工具建議規則（**假設，可調整**，`config.js > suggestion`）：熱點 100m 內有桶→B；C 可行且至少減少 1 個「100m 內無桶」站→C；否則 A。仍需現勘、步行路徑、權責與清運確認。
- 滿溢模擬假設（**假設，可調整**，`config.js > scenarioB`）：每月每 1,000 次借還 → 每日產生 5 公升垃圾（另加基本量 5 公升/日）；桶容量 ÷ 每小時產生量 = 裝滿時數，與清運間隔比較得出每日滿溢時數。
- 「人流高 ≠ 缺口大」：捷運公館站(2號出口) 活動量最高，但 41m 內已有桶；捷運大安站(4號出口) 最近桶 799m，是缺口指數第 1。兩站可在規劃頁一鍵前往（`config.js > compare`）。
- 研究團隊 39 處觀察錨點（每區活動量前 3＋臺大校區 3 處，`anchors.json`）可在規劃頁開啟圖層；錨點是觀察點，不是新設桶位。

## 使用的開源與 AI 工具
Leaflet 1.9.4（BSD-2）、OpenStreetMap、Python 3（shapely、pyproj）、Playwright（測試與錄影）、ffmpeg、AI 程式助理（協助撰寫程式與資料處理）。

## 授權
程式碼 MIT（見 `LICENSE`）。資料依各來源授權。
