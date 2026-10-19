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
    pg.goto(B+'planner.html');pg.wait_for_selector('#hot .card',timeout=20000)
    print(name,'規劃 熱點數',pg.locator('#hot .card').count(),'| #1',pg.locator('#hot .card').first.inner_text().replace('\n',' '))
    pg.screenshot(path=f'shot_planner_{name}.png')
    pg.locator('#hot .card').first.click();pg.wait_for_selector('.cmp')
    for o in 'ABC':
      pg.click(f'[data-o="{o}"]');pg.wait_for_timeout(300)
    print(name,'比較表',pg.inner_text('.cmp').replace('\n',' | ').replace('\t',' '))
    print(name,'建議',[t for t in pg.inner_text('#detail').split('\n') if '★ 本工具' in t or 'C 移出' in t])
    pg.click('[data-o="C"]');pg.click('#adopt');pg.wait_for_timeout(600)
    pg.screenshot(path=f'shot_planner_compare_{name}.png')
    pg.goto(B+'index.html');pg.wait_for_selector('#list .card',timeout=20000);pg.wait_for_timeout(6500)
    print(name,'行人',pg.inner_text('#where'))
    pg.click('#hotBtn');pg.wait_for_timeout(500);pg.click('[data-m=after]');pg.wait_for_timeout(600)
    print(name,'調整後',pg.inner_text('#delta').replace('\n',' '))
    pg.locator('#list .card').first.click();pg.wait_for_timeout(300);pg.click('[data-full]');pg.wait_for_timeout(300)
    pg.screenshot(path=f'shot_pedestrian_{name}.png')
    pg.goto(B+'crew.html');pg.wait_for_selector('#alerts .card',timeout=20000)
    a0=pg.inner_text('#cnt');pg.locator('#alerts [data-c]').first.click();pg.wait_for_timeout(300);a1=pg.inner_text('#cnt')
    pg.screenshot(path=f'shot_crew_{name}.png')
    pg.click('#all');pg.wait_for_timeout(300);print(name,'清潔隊',a0,'→',a1,'→',pg.inner_text('#cnt'),'| 路線連結隱藏',pg.locator('#routeLink').is_hidden())
    pg.goto(B+'crew-route.html');pg.wait_for_selector('#dist option',state='attached');pg.click('#gen');pg.wait_for_timeout(1500);print(name,'隱藏路線頁仍可用',pg.locator('#stops .card').count()>0)
    print(name,'ERRORS',errs);ok&=not errs;c.close()
  br.close()
print('PASS' if ok else 'FAIL')
