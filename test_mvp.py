from playwright.sync_api import sync_playwright
VP={'desktop':dict(viewport={'width':1280,'height':800}),'mobile':dict(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)}
B='http://localhost:8765/'
with sync_playwright() as p:
  br=p.chromium.launch()
  for name,opt in VP.items():
    c=br.new_context(**opt,geolocation={'latitude':25.0418,'longitude':121.5080},permissions=['geolocation'],locale='zh-TW')
    pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    # 行人
    pg.goto(B+'index.html');pg.wait_for_selector('#list .card',timeout=20000)
    n=pg.locator('#list .card').count();pg.locator('#list .card').first.click();pg.wait_for_timeout(500)
    href=pg.locator('#list a.pri').get_attribute('href');pg.click('[data-full]');pg.wait_for_timeout(400)
    pg.check('#lyYb');pg.wait_for_timeout(600)
    print(name,'行人 cards',n,'where',pg.inner_text('#where'),'nav',href[:70])
    pg.screenshot(path=f'shot_pedestrian_{name}.png')
    # 清潔隊
    pg.goto(B+'crew.html');pg.wait_for_selector('#dist option',state='attached');pg.click('#gen');pg.wait_for_selector('#stops .card',timeout=10000)
    print(name,'清潔隊',pg.inner_text('#cnt'),'|',pg.inner_text('#sum').replace('\n',' '))
    pg.locator('#stops [data-lv="75"]').first.click();pg.locator('#stops [data-clear]').first.click();pg.wait_for_timeout(400)
    print(name,'hist',pg.inner_text('#hist').split('\n')[:2])
    pg.screenshot(path=f'shot_crew_{name}.png')
    # 規劃
    pg.goto(B+'planner.html');pg.wait_for_selector('#sug .card',timeout=30000)
    for v in ['100','300','200']:
      pg.eval_on_selector('#r',f"e=>{{e.value={v};e.dispatchEvent(new Event('input'))}}");pg.wait_for_timeout(300)
      print(name,'規劃 R',v,pg.inner_text('#unc').replace('\n',' '),'| #1',pg.locator('#sug .card').first.inner_text().replace('\n',' '))
    pg.screenshot(path=f'shot_planner_{name}.png')
    print(name,'ERRORS',errs);c.close()
  br.close()
