# 錄製 2 分鐘 Demo 備援影片（1280x800）：規劃熱點 → A/B/C → 行人前後 → 清潔隊告警與清運
import shutil,glob,os
from playwright.sync_api import sync_playwright
B='http://localhost:8765/';W=lambda pg,ms:pg.wait_for_timeout(ms)
with sync_playwright() as p:
  br=p.chromium.launch();c=br.new_context(viewport={'width':1280,'height':800},record_video_dir='/tmp/vid',record_video_size={'width':1280,'height':800},locale='zh-TW')
  pg=c.new_page()
  pg.goto(B+'index.html');pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_selector('#hot .card');W(pg,9000)
  pg.mouse.wheel(0,0);pg.locator('.panel').evaluate("e=>e.scrollTo({top:260,behavior:'smooth'})");W(pg,7000)
  pg.locator('#hot .card').first.click();W(pg,9000)
  for o in 'ABC': pg.click(f'[data-o="{o}"]');W(pg,10000)
  pg.locator('.panel').evaluate("e=>e.scrollTo({top:400,behavior:'smooth'})");W(pg,8000)
  pg.click('#adopt');W(pg,5000)
  pg.click('nav a[href="pedestrian.html"]');pg.wait_for_selector('#list .card');W(pg,8000)
  pg.click('#hotBtn');W(pg,5000);pg.click('[data-m=after]');W(pg,9000);pg.click('[data-m=before]');W(pg,5000);pg.click('[data-m=after]');W(pg,5000)
  pg.locator('#list .card').first.click();W(pg,4000);pg.click('[data-full]');W(pg,5000)
  pg.click('nav a[href="crew.html"]');pg.wait_for_selector('#alerts .card');W(pg,8000)
  pg.locator('#alerts [data-c]').first.click();W(pg,5000);pg.click('#all');W(pg,7000)
  v=pg.video.path();c.close();br.close()
shutil.copy(v,'/workspace/demo-backup.webm');print('saved',os.path.getsize('/workspace/demo-backup.webm'))
