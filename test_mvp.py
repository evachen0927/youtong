# Playwright 測試：桌面 1280x800、手機 390x844；三頁主要互動 + 截圖
import sys
from playwright.sync_api import sync_playwright
VP={'desktop':dict(viewport={'width':1280,'height':800}),'mobile':dict(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)}
B=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/'
ok=True
with sync_playwright() as p:
  br=p.chromium.launch()
  for name,opt in VP.items():
    c=br.new_context(**opt,locale='zh-TW')  # 不給定位權限 → 測試 fallback 台北市政府
    pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    pg.goto(B+'index.html');pg.wait_for_selector('#hot .card',timeout=20000)
    print(name,'規劃 熱點數',pg.locator('#hot .card').count(),'| #1',pg.locator('#hot .card').first.inner_text().replace('\n',' '))
    pg.screenshot(path=f'shot_planner_{name}.png')
    pg.check('#lyAnc');pg.wait_for_timeout(300)
    for i in (0,1):
      pg.locator(f'[data-vs="{i}"]').click();pg.wait_for_selector('.cmp');print(name,'比較卡',i,pg.locator('#detail p.sub').first.inner_text(),'| 建議',[t for t in pg.inner_text('#detail').split('\n') if '★' in t]);pg.click('#bk');pg.wait_for_timeout(200)
    pg.locator('#hot .card').first.click();pg.wait_for_selector('.cmp')
    for o in 'ABC':
      pg.click(f'[data-o="{o}"]');pg.wait_for_timeout(300)
    print(name,'比較表',pg.inner_text('.cmp').replace('\n',' | ').replace('\t',' '))
    print(name,'建議',[t for t in pg.inner_text('#detail').split('\n') if any(k in t for k in ('★','C 移出','不製造','C 不可行'))])
    pg.click('[data-o="C"]');pg.click('#adopt');pg.wait_for_timeout(600)
    pg.screenshot(path=f'shot_planner_compare_{name}.png')
    pg.goto(B+'pedestrian.html');pg.wait_for_selector('#list .card',timeout=20000);pg.wait_for_timeout(6500)
    print(name,'行人',pg.inner_text('#where'))
    pg.click('#more');pg.click('#hotBtn');pg.wait_for_timeout(500);pg.click('#more');pg.click('[data-m=after]');pg.wait_for_timeout(600)
    print(name,'調整後',pg.inner_text('#delta').replace('\n',' '))
    pg.click('#advClose');pg.wait_for_timeout(300);pg.screenshot(path=f'shot_pedestrian_{name}.png')
    pg.click('#doneBtn');pg.wait_for_timeout(300);pg.click('[data-full]');pg.wait_for_timeout(300)
    print(name,'回報滿了 events',pg.evaluate("getEvents().filter(e=>e.kind==='full').length"))
    # 清潔隊：深連結 → A 規劃（預測），時間抽屜、門檻、開始清運 → B 執行、回報＋校正、復原、返回
    pg.goto(B+'crew.html?fc=1&day=we&t=19:00');pg.wait_for_selector('#card[data-state=A] #startBtn',timeout=20000);pg.wait_for_timeout(600)
    sA=pg.inner_text('#cardTitle');n3=pg.locator('.top3 li').count();print(name,'A 規劃',sA,'top3',n3,'chip',pg.inner_text('#tChip'));assert n3==3 and '週六 19:00' in sA
    vis=pg.evaluate("(()=>{const r=card.getBoundingClientRect();return route.slice(0,3).every(e=>{const p=map.latLngToContainerPoint([e.b.la,e.b.lo]);return p.y<r.top&&p.y>0&&p.x>0&&p.x<innerWidth})})()");print(name,'前 3 站在卡片上方',vis);assert vis
    if name=='mobile':
        h=pg.evaluate("card.getBoundingClientRect().height/innerHeight");print(name,'卡片高度比例',round(h,2));assert h<=0.401
        pg.screenshot(path='shot_crew_stateA_mobile.png')
    pg.click('#tChip');pg.click('label:has([name=fcd][value=wk])');assert pg.locator('#timeSheet').is_hidden()
    pg.click('#tChip');pg.eval_on_selector('#fcT',"e=>{e.value=600;e.dispatchEvent(new Event('input'));e.dispatchEvent(new Event('change'))}");pg.wait_for_timeout(300)
    s1=pg.inner_text('#cardTitle');assert pg.locator('#timeSheet').is_hidden() and s1!=sA;print(name,'平日10:00',s1)
    pg.click('#tChip');pg.click('label:has([name=fcd][value=we])');pg.click('#tChip');pg.eval_on_selector('#fcT',"e=>{e.value=1140;e.dispatchEvent(new Event('change'))}");pg.wait_for_timeout(300)
    pg.screenshot(path=f'shot_crew_forecast_sat_{name}.png')
    pg.click('#menu');pg.eval_on_selector('#th',"e=>{e.value=90;e.dispatchEvent(new Event('input'))}");c90=pg.inner_text('#cnt');pg.eval_on_selector('#th',"e=>{e.value=70;e.dispatchEvent(new Event('input'))}");c70=pg.inner_text('#cnt');pg.click('#setSheet [data-close]');print(name,'門檻',c90,c70)
    first=pg.evaluate("route[0].b.id");pg.click('#startBtn');pg.wait_for_selector('#card[data-state=B] [data-amt]');print(name,'B 執行',pg.inner_text('#orderNote'))
    if name=='mobile':pg.wait_for_timeout(500);pg.screenshot(path='shot_crew_stateB_mobile.png')
    a0=pg.inner_text('#prog');pg.click('#card [data-amt=half]');pg.wait_for_timeout(300);a1=pg.inner_text('#prog')
    cal=pg.evaluate(f"FC.state().cal['{first}']");ev=pg.evaluate("getEvents().slice(-1)[0]");flag=pg.locator(f'[data-calid="{first}"]').count()
    print(name,'校正',first,cal,'event',{k:ev.get(k) for k in ('kind','amount','amountPct','predPct','calib')},'已校正標記',flag);assert cal and cal['n']==1 and ev['predPct'] is not None and flag==1
    pg.click('.undo button');pg.wait_for_timeout(300);a2=pg.inner_text('#prog');assert not pg.evaluate(f"FC.state().cal['{first}']")
    pg.screenshot(path=f'shot_crew_{name}.png')
    pg.click('#menu');pg.once('dialog',lambda d:d.accept());pg.click('#allClear');pg.wait_for_timeout(300)
    print(name,'清潔隊',a0.replace('\n',' '),'→',a1.replace('\n',' '),'→ 復原',a2.replace('\n',' '),'| 完成卡',pg.locator('#card .done').count()>0)
    pg.click('#backBtn');pg.wait_for_selector('#card[data-state=A]');print(name,'返回 A',pg.inner_text('#cardTitle'))
    pg.goto(B+'crew-route.html');pg.wait_for_selector('#card',timeout=20000);print(name,'舊路線網址導向',pg.url.endswith('crew.html'))
    print(name,'ERRORS',errs);ok&=not errs;c.close()
  br.close()
print('PASS' if ok else 'FAIL')
