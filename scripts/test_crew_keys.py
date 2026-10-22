# localStorage 鍵名：本機（非 /youtong-beta/）用正式站鍵名；模擬 /youtong-beta/ 路徑時用 beta 前綴；?reset=1 兩種都清。
# 用法：python3 scripts/test_crew_keys.py http://127.0.0.1:8765/
from playwright.sync_api import sync_playwright
import json,sys,re
B=sys.argv[1].rstrip('/')+'/'
def run(br,beta):
  c=br.new_context(viewport={'width':390,'height':844});c.add_init_script("window.FB_TEST={config:{}}")
  if beta:  # /youtong-beta/xxx → 本機 /xxx
    c.route(re.compile(r'.*/youtong-beta/.*'),lambda r:r.fulfill(response=c.request.get(r.request.url.replace('/youtong-beta/','/'))))
  base=B+('youtong-beta/' if beta else '')
  p=c.new_page();e=[];p.on('pageerror',lambda x:e.append(str(x)))
  p.goto(base+'crew.html');p.wait_for_selector('#startBtn',timeout=30000);p.wait_for_timeout(500);p.click('#startBtn');p.wait_for_timeout(300)
  p.evaluate("record(route[0].b.id,'full',100),0");p.wait_for_timeout(300)
  keys=p.evaluate("Object.keys(localStorage).filter(k=>/crew/.test(k)).sort()")
  p.goto(base+'crew.html?reset=1');p.wait_for_timeout(1500)
  after=p.evaluate("Object.keys(localStorage).filter(k=>/crewprog/.test(k))")
  c.close();return keys,after,e
with sync_playwright() as pw:
  br=pw.chromium.launch();R={}
  for beta in (False,True):R['beta' if beta else 'local']=run(br,beta)
  print(json.dumps(R,ensure_ascii=False))
  l,b=R['local'],R['beta'];day=r'\d{4}-\d{2}-\d{2}'
  ok=('有桶_crew_ui_v2' in l[0] and any(re.match(r'^有桶_crewprog_v1\|'+day+r'\|B',k) for k in l[0]) and not any('beta' in k for k in l[0])
      and '有桶beta_crew_ui_v2' in b[0] and any(re.match(r'^有桶beta_crewprog_v1\|'+day+r'\|B',k) for k in b[0]) and '有桶_crew_ui_v2' not in b[0]
      and not l[1] and not b[1] and not l[2] and not b[2])
  print('KEYS','PASS' if ok else 'FAIL');sys.exit(0 if ok else 1)
