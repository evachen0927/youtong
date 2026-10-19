# 找回消失的垃圾桶｜debug松 議題 #2 MVP

台北行人專用垃圾桶從近 3,000 組縮減到約 800 組。這個靜態網站把**街道清冊垃圾桶**、**YouBike 借還活動量**與**公車站位**放在同一張地圖上，讓規劃者在示範區（公館–大安）找出「人多但附近沒有垃圾桶」的缺口，並比較三種方案：

- **A 維持現況**：現有桶位與容量，作為比較基準。
- **B 原位改善**：桶位不動；熱點最近的桶加大容量、提高清運頻率（滿溢時數為**模擬**）。
- **C 同桶數挪一處**：總桶數不變；把示範區內「周邊活動量最低」的一個桶，移到缺口最大的站旁。

三方案的定義沿用研究團隊（taipei-waste-lab）「A 現況／B 原位改善／C 同桶數微調一處」的方向。

## 三個頁面
| 頁面 | 檔案 | 功能 |
|---|---|---|
| 規劃（主頁） | `planner.html` | 開場數字（來自 `config.js`）、示範區缺口熱點、點熱點看 A/B/C 指標對照與地圖變化，「採用」後存入 localStorage |
| 行人 | `index.html` | 定位（拒絕時改用台北市政府，可點地圖手動設定）、最近 5 個垃圾桶＋Google Maps 步行導航、「調整前／調整後」距離比較、回報「滿了」 |
| 清潔隊 | `crew.html` | 模擬滿溢告警清單、單筆或一鍵回報已清運（動態路線保留在 `crew-route.html`，預設隱藏；`config.js` 的 `features.crewRouting` 或 `crew.html?route=1` 開啟） |

## 怎麼執行
```bash
cd trash-mvp
python3 -m http.server 8765   # 開 http://localhost:8765/planner.html
```
純靜態網站（HTML/CSS/原生 JS + Leaflet），沒有後端；所有路徑都是相對路徑，可直接放到 GitHub Pages（repo 根目錄），已附 `.nojekyll`。Leaflet 已放在 `vendor/`，不依賴 CDN；**地圖底圖仍需網路**（OpenStreetMap）。離線備援：`demo-backup.mp4` 示範影片。

開場數字、示範區範圍與方案參數都在 **`config.js`**，改這個檔案即可。

重建資料：`python3 aggregate_youbike_trips.py`（需先下載 2026-07 租借紀錄 ZIP 到 `/workspace/raw/`）→ `python3 prep.py`（需 shapely、pyproj）。測試：`python test_mvp.py`（Playwright）。

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
| YouBike 借＋還次數 | **真實**紀錄的彙總，但當作人流時是**推估** |
| 公車每站停靠路線數 | **推估**（路線數不是上下車人數） |
| **交通活動量是人流的推估，不等於垃圾量** | — |
| 垃圾桶填充度、滿溢告警 | **模擬**（依桶編號固定產生；行人回報會覆蓋） |
| B 方案滿溢時數（容量、清運頻率、每千次借還產生公升數） | **模擬**，參數在 `config.js` |
| C 方案移桶、行人頁「調整後」 | **情境模擬**，不是實際設置 |
| 距離 | 直線距離，不是步行距離 |

已知資料缺漏：北投區街道清冊 0 列、南港區 4 列 →**資料缺漏，非實際覆蓋率**。

## 熱點與方案的計算方式
- 示範區：公館–大安矩形（`config.js > demoArea`），YouBike 站＋公車站位。
- 缺口熱點：YouBike 站最近街道清冊垃圾桶 > 100m，依「缺口指數＝活動量 ×（距離−100m）」排序。研究團隊的錨點則是每區活動量前 3（間隔 ≥300m），兩者並列參考（`anchors.csv`）。
- 指標（三方案相同）：示範區內 100m／200m 內無桶站數、站點到最近桶中位數、100m 內有桶的 YouBike 活動量與公車停靠路線數，以及熱點旁桶每日滿溢時數（模擬）。C 方案另列「原服務區損失」。
- 工具建議規則：熱點 100m 內有桶→B；C 能減少無桶站數→C；否則 A。仍需現勘、步行路徑、權責與清運確認。

## 使用的開源與 AI 工具
Leaflet 1.9.4（BSD-2）、OpenStreetMap、Python 3（shapely、pyproj）、Playwright（測試與錄影）、ffmpeg、AI 程式助理（協助撰寫程式與資料處理）。

## 授權
程式碼 MIT（見 `LICENSE`）。資料依各來源授權。
