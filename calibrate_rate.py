# 用官方公開清運頻率校準「每次借還產生公升數」
# 來源：環保局資料（聯合報 2025-08-17，經濟日報轉載 https://money.udn.com/money/story/7307/8944421）
#   每個清潔箱約 120 公升；清潔隊每日巡查清運約 3–6 次。
# 假設：示範區人流前 10% 的桶，在週末一天會裝滿 6 次（取官方上限 6 次）。
# 取「第 90 百分位門檻桶」（前 10% 中人流最低者）的週末每日人流 F90：
#   litersPerRide = 6 × 120 / F90  → 人流 ≥ F90 的桶（前 10%）週末一天至少裝滿 6 次。
import json,math,re
def hav(a,b,c,d):
    R=6371000;r=math.radians;return 2*R*math.asin(math.sqrt(math.sin(r(c-a)/2)**2+math.cos(r(a))*math.cos(r(c))*math.sin(r(d-b)/2)**2))
cfg=open('config.js',encoding='utf-8').read()
a,b,c,d=map(float,re.search(r"bounds:\[\[([\d.]+),([\d.]+)\],\[([\d.]+),([\d.]+)\]\]",cfg).groups())
H=json.load(open('footfall_hourly.json'));S=list(H['stations'].values())
bins=[f for f in json.load(open('bins.geojson'))['features'] if f['properties']['source'].startswith('main')]
F=[]
for f in bins:
    lo,la=f['geometry']['coordinates']
    if not(a<=la<=c and b<=lo<=d):continue
    ys=[s for s in S if hav(la,lo,s['la'],s['lo'])<=200]
    F.append(sum(sum(s['we']) for s in ys)/len(ys) if ys else 0)
F.sort(reverse=True);n=len(F);k=max(1,math.ceil(n*0.1));F90=F[k-1];top=F[:k]
lpr=6*120/F90
print(f"bins in demo area {n}; no YouBike within 200m {sum(1 for x in F if x==0)}; top10% = {k} bins; F90 (threshold bin weekend daily rides) {F90:.1f}; mean of top10% {sum(top)/k:.1f}")
print(f"litersPerRide = 6*120/{F90:.1f} = {lpr:.4f}  (alt using mean of top10%: {6*120/(sum(top)/k):.4f})")
