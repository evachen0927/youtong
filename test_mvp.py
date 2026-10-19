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
    pg.goto(B+'crew.html');pg.wait_for_selector('#next [data-amt]',timeout=20000)
    a0=pg.inner_text('#prog');pg.click('#next [data-amt=half]');pg.wait_for_timeout(300);a1=pg.inner_text('#prog')
    amt=pg.evaluate("getEvents().filter(e=>e.kind==='clear'&&e.amount).length")
    pg.click('#undoBtn');pg.wait_for_timeout(300);a2=pg.inner_text('#prog')
    pg.screenshot(path=f'shot_crew_{name}.png')
    pg.click('#menu');pg.once('dialog',lambda d:d.accept());pg.click('#allClear');pg.wait_for_timeout(300)
    print(name,'清潔隊',a0.replace('\n',' '),'→',a1.replace('\n',' '),'→ 復原',a2.replace('\n',' '),'| 收運量事件',amt,'| 全部清運後完成卡',pg.locator('#next .done').count()>0)
    pg.goto(B+'crew-route.html');pg.wait_for_selector('#next',timeout=20000);print(name,'舊路線網址導向',pg.url.endswith('crew.html'))
    print(name,'ERRORS',errs);ok&=not errs;c.close()
  br.close()
print('PASS' if ok else 'FAIL')
