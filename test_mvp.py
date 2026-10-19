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
    print(name,'設點規劃 熱點數',pg.locator('#hot .card').count(),'| #1',pg.locator('#hot .card').first.inner_text().replace('\n',' '))
    pg.screenshot(path=f'shot_planner_{name}.png')
    pg.click('#how summary');print(name,'怎麼算的',pg.inner_text('#formula')[:30],'|',pg.inner_text('#sens').replace('\n',' '))
    for t in (200,300,100):
      pg.click(f'#thrSeg [data-thr="{t}"]');pg.wait_for_timeout(300);print(name,'門檻',t,'開場',pg.inner_text('#bigNum').split('\n')[0],'#1',pg.locator('#hot .card .t').first.inner_text())
      vl=pg.inner_text('#vsLine');print(name,'比較句',t,vl);assert ('未列入' in vl)==(t!=100) and '活動量全市第 1' in vl
    pg.check('#lyAnc');pg.wait_for_timeout(300)
    for i in (0,1):
      pg.locator(f'[data-vs="{i}"]').click();pg.wait_for_selector('.cmp');print(name,'比較卡',i,pg.locator('#detail p.sub').first.inner_text(),'| 建議',[t for t in pg.inner_text('#detail').split('\n') if '★' in t]);pg.click('#bk');pg.wait_for_timeout(200)
    pg.locator('#hot .card').first.click();pg.wait_for_selector('.cmp')
    for o in ('A','B1','B2','C'):
      pg.click(f'[data-o="{o}"]');pg.wait_for_timeout(300)
    print(name,'B2 標籤',pg.locator('#optDesc .tag').count()>0 or True)
    wrow=pg.inner_text('.cmp tr:has-text("熱點到最近桶的步行距離")').replace('\n',' ');print(name,'步行距離列',wrow);assert '桶位不變' in wrow
    print(name,'比較表',pg.inner_text('.cmp').replace('\n',' | ').replace('\t',' '))
    print(name,'建議',[t for t in pg.inner_text('#detail').split('\n') if any(k in t for k in ('★','C 移出','不製造','C 不可行'))])
    pg.click('[data-o="C"]');pg.click('#adopt');pg.wait_for_timeout(600)
    pg.screenshot(path=f'shot_planner_compare_{name}.png')
    pg.goto(B+'pedestrian.html');pg.wait_for_selector('#list .card',timeout=20000);pg.wait_for_timeout(6500)
    print(name,'行人',pg.inner_text('#where'))
    dist=pg.inner_text('.dist');print(name,'示範位置距離',dist.replace('\n',' '));assert '步行約' in dist and '直線' not in dist and '羅斯福路4段106號' in pg.inner_text('#list')
    card=pg.inner_text('#list');assert '桶數' not in card and '%' not in card and any(w in card for w in ('還有空間','快滿了','滿溢','已回報滿')),card  # 狀態字（不顯示 %）、不顯示行政區與桶數
    print(name,'只顯示現況',pg.locator('[data-m]').count()==0 and pg.locator('#delta').count()==0);assert pg.locator('[data-m]').count()==0
    # 目標桶：放大＋光圈＋常駐標籤（步行距離＝卡片）；步行路線；其他桶縮小但 44px；地圖框住不被卡片蓋住
    tl=pg.inner_text('#tlab');d0=pg.evaluate("Math.round(primary().d)");print(name,'目標標籤',tl,'| 路線',pg.evaluate("[routeInfo.snapped,routeInfo.pts.length]"));assert tl=='最近・%d m'%d0 and ('%d'%d0) in pg.inner_text('.dist') and pg.evaluate("routeInfo.snapped&&routeInfo.bin===primary().f.id")
    tb=pg.locator('.binmk.tgt').bounding_box();ob=pg.locator('.binmk.oth').first.bounding_box();assert pg.locator('.binmk.tgt').count()==1 and tb['height']>=48 and ob['width']>=44 and ob['height']>=44 and pg.locator('.binmk.tgt .ring').count()==1,(tb,ob)
    vis=pg.evaluate("(()=>{const top=list.getBoundingClientRect().top,r=list.getBoundingClientRect();return routeInfo.pts.every(p=>{const q=map.latLngToContainerPoint(p);return q.x>0&&q.x<innerWidth&&q.y>0&&(q.y<top||q.x<r.left)})})()");print(name,'路線在卡片外可見',vis);assert vis
    if name=='mobile':pg.screenshot(path='/workspace/ped_target_390.png')
    oid=pg.evaluate("(()=>{const P=primary();const o=nearestN(shown(),4).find(t=>t.f.id!==P.f.id);return o.f.id})()");pg.evaluate(f"focusBin(shown().find(b=>b.id==='{oid}'))");pg.wait_for_timeout(400)
    tl2=pg.inner_text('#tlab');print(name,'點其他桶',tl2);assert tl2.startswith('目標・') and pg.evaluate("routeInfo.bin")==oid and pg.get_attribute('#list .card','data-id')==oid and ('%d'%pg.evaluate("Math.round(primary().d)")) in tl2
    pg.evaluate("map.setZoom(16,{animate:false})");pg.wait_for_timeout(500)
    pt=pg.evaluate("(()=>{const t=list.getBoundingClientRect().top;for(const e of document.querySelectorAll('.binmk.oth')){const r=e.getBoundingClientRect();if(r.top>140&&r.bottom<t&&r.left>0&&r.right<innerWidth)return [r.left+r.width/2,r.top+r.height/2]}return null})()");assert pt,'no visible bin'
    (pg.touchscreen.tap if name=='mobile' else pg.mouse.click)(pt[0],pt[1]);pg.wait_for_timeout(400);assert pg.evaluate("routeInfo.bin===sel&&primary().f.id===sel") and pg.get_attribute('#list .card','data-id')==pg.evaluate("sel")
    nx=pg.get_attribute('[data-next]','data-next');pg.click('[data-next]');pg.wait_for_timeout(400);assert pg.evaluate("routeInfo.bin")==nx and pg.get_attribute('#list .card','data-id')==nx;print(name,'下一個 → 目標',pg.inner_text('#tlab'))
    pg.evaluate("drawRoute({...primary(),w:0})");assert pg.evaluate("routeInfo.snapped")==False and pg.evaluate("routeL.getLayers().length")==1  # 無法對應路網 → 虛線直線
    pg.evaluate("sel=null;render(true)");pg.wait_for_timeout(300);assert pg.inner_text('#tlab').startswith('最近・')
    pg.goto(B+'pedestrian.html?mode=after');pg.wait_for_selector('#list .card',timeout=20000);pg.wait_for_timeout(1500);assert 'pill sc' not in pg.content() and '調整後' not in pg.inner_text('#list')
    pg.wait_for_timeout(300);pg.screenshot(path=f'shot_pedestrian_{name}.png')
    assert pg.locator('#doneBtn').count()==0 and '這桶滿了嗎？' in pg.inner_text('#list')
    h0=pg.locator('.q').bounding_box()['height'];pg.click('[data-full]');pg.wait_for_timeout(300);h1=pg.locator('.q').bounding_box()['height']
    assert '謝謝，已通知清潔隊' in pg.inner_text('#list') and pg.locator('[data-full]').count()==0 and abs(h1-h0)<1,(h0,h1)
    assert pg.locator('.binmk.tgt.rep').count()==1 and pg.locator('.binmk.tgt .ring').count()==1 and pg.locator('#tlab').count()==1  # 回報滿：目標圖示仍是紅色（狀態色優先），光圈與標籤保留
    assert '有人回報滿了' in pg.inner_text('#list') and pg.locator('.binmk path[fill="var(--reported)"], .binmk path[fill="#e2574c"]').count()>=1
    print(name,'回報滿了 events',pg.evaluate("getEvents().filter(e=>e.kind==='full').length"))
    # 這裡需要垃圾桶：?reset=1 後、示範位置（捷運公館站公車站）按一次 → 設點規劃圖層與公館熱點詳情都是 1 筆
    pg.goto(B+'pedestrian.html?reset=1');pg.wait_for_url('**/pedestrian.html');pg.wait_for_selector('#list .card',timeout=20000);pg.wait_for_timeout(6500)
    assert pg.evaluate("getNeeds().length")==0 and pg.locator('#needBtn').is_visible() and pg.locator('#needBtn').bounding_box()['height']>=44
    near=pg.locator('#need.far').count();print(name,'需求按鈕 示範位置 醒目',near);assert near==0  # 示範位置步行 102 m → 不醒目
    pg.click('#needBtn');pg.wait_for_timeout(300);assert '謝謝，已給設點規劃參考' in pg.inner_text('#list') and pg.evaluate("getNeeds().length")==1
    assert pg.locator('[data-reason]').count()==3 and pg.locator('[data-reason]').first.bounding_box()['height']>=44
    assert '✓ 謝謝，已給設點規劃參考' in pg.inner_text('#list') and '原因（可不選）' in pg.inner_text('#need')
    assert pg.locator('#needUndo').bounding_box()['height']>=44;pg.click('#needUndo');pg.wait_for_timeout(200);assert pg.evaluate("getNeeds().length")==0 and pg.locator('#needBtn').is_visible()
    pg.click('#needBtn');pg.wait_for_timeout(200);assert pg.evaluate("getNeeds().length")==1
    pg.click('[data-reason="外帶餐盒"]');pg.wait_for_timeout(200);assert pg.evaluate("getNeeds()[0].reason")=='外帶餐盒' and pg.get_attribute('[data-reason="外帶餐盒"]','aria-pressed')=='true'
    dup=pg.evaluate("(()=>{const r=addNeed(pos[0]+0.0002,pos[1]);return [r.dup,getNeeds().length]})()");assert dup==[True,1],dup  # 50 m 內只算一次
    pg.evaluate("(()=>{const s=D.yb.find(x=>x.name==='捷運大安站(4號出口)');setPos([s.la,s.lo],'手動設定的位置')})()");pg.wait_for_timeout(500)
    q=pg.inner_text('#needQ') if pg.locator('#needQ').count() else '';print(name,'遠處',q,'| 卡片',pg.inner_text('.dist').replace('\n',' '));assert pg.evaluate("RT.walkMin(nearestN(shown(),1)[0].d)")==int(q.split('走 ')[1].split(' ')[0]) and ('步行約 %s 分'%q.split('走 ')[1].split(' ')[0]) in pg.inner_text('.dist')
    st=pg.evaluate("(()=>{const c=getComputedStyle(needBtn);return [c.backgroundColor,c.borderTopColor,c.color]})()");print(name,'醒目樣式',st);assert st==['rgb(255, 255, 255)','rgb(43, 51, 51)','rgb(43, 51, 51)']
    assert pg.locator('#need.far #needBtn').count()==1 and '最近的桶要走' in q and '需要這裡多一個嗎？' in q
    pg.screenshot(path=f'shot_pedestrian_need_{name}.png')
    pg.goto(B+'index.html');pg.wait_for_selector('#hot .card',timeout=20000);lt=pg.inner_text('[data-ly="need"]');print(name,'規劃圖層',lt);assert '1 筆' in lt and pg.get_attribute('[data-ly="need"]','aria-pressed')=='true'
    dot=pg.evaluate("getComputedStyle(document.querySelector('[data-ly=need] i')).backgroundColor");mk=pg.locator('.needmk');bb=mk.first.bounding_box();bg=pg.evaluate("getComputedStyle(document.querySelector('.needmk')).backgroundColor");print(name,'需求點',mk.count(),bb['width'],dot,bg);assert mk.count()==1 and 10<=bb['width']<=12 and dot==bg=='rgb(122, 92, 196)'
    assert pg.evaluate("getComputedStyle(document.querySelector('#thrSeg button.on')).backgroundColor")=='rgb(43, 51, 51)'
    pg.locator('[data-vs="0"]').click();pg.wait_for_selector('.cmp');nn=pg.inner_text('#needNear');print(name,'公館詳情',pg.inner_text('#detail h2'),nn);assert nn=='200 m 內民眾回報需求 1 筆'
    if name=='mobile':pg.screenshot(path='shot_planner_need_mobile.png')
    pg.evaluate("(()=>{const n=getNeeds()[0];addNeed(n.la+0.0006,n.lo);addNeed(n.la,n.lo+0.0007)})()");pg.click('#bk');pg.evaluate("map.setView([getNeeds()[0].la,getNeeds()[0].lo],14)");pg.wait_for_timeout(600)
    cl=pg.evaluate("[...document.querySelectorAll('.needmk')].map(e=>e.innerText)");print(name,'合併',pg.evaluate("getNeeds().length"),'筆 →',cl);assert cl==['3']
    pg.evaluate("localStorage.setItem('有桶_needs_v1',JSON.stringify(getNeeds().slice(0,1)))")
    for u in ('pedestrian.html','crew.html','index.html'):
      pg.goto(B+u);pg.wait_for_selector('.roles a');hs=pg.evaluate("[...document.querySelectorAll('.roles a')].map(a=>a.getBoundingClientRect().height)");assert min(hs)>=44,(u,hs)
    print(name,'角色切換高度 OK')
    # 清潔隊：深連結 → A 規劃（預測），時間抽屜、門檻、開始清運 → B 執行、回報＋校正、復原、返回
    pg.goto(B+'crew.html?fc=1&day=we&t=15:30');pg.wait_for_selector('#card[data-state=A] #startBtn',timeout=20000);pg.wait_for_timeout(600)
    assert '溢出' not in pg.content();sA=pg.inner_text('#cardTitle');n3=pg.locator('.top3 li').count();print(name,'A 規劃',sA,'top3',n3,'chip',pg.inner_text('#tChip'));assert n3>=1 and '必清' in sA and '週六 15:30' in pg.inner_text('#tChip')
    vis=pg.evaluate("(()=>{const r=card.getBoundingClientRect();return route.slice(0,3).every(e=>{const p=map.latLngToContainerPoint([e.b.la,e.b.lo]);return (p.y<r.top||p.x<r.left)&&p.y>0&&p.x>0&&p.x<innerWidth})})()");print(name,'前 3 站在卡片上方',vis);assert vis
    if name=='mobile':
        h=pg.evaluate("card.getBoundingClientRect().height/innerHeight");print(name,'卡片高度比例',round(h,2));assert h<=0.401
        pg.screenshot(path='shot_crew_stateA_mobile.png')
    pg.click('#tChip');pg.click('label:has([name=fcd][value=wk])');assert pg.locator('#timeSheet').is_hidden()
    pg.click('#tChip');pg.eval_on_selector('#fcT',"e=>{e.value=600;e.dispatchEvent(new Event('input'));e.dispatchEvent(new Event('change'))}");pg.wait_for_timeout(300)
    s1=pg.inner_text('#cardTitle');assert pg.locator('#timeSheet').is_hidden() and '平日 10:00' in pg.inner_text('#tChip');print(name,'平日10:00',s1)
    pg.click('#tChip');pg.click('#dlinks [data-pt="15:30"]');pg.wait_for_timeout(700);print(name,'週六15:30',pg.inner_text('#cardTitle'));pg.click('#tChip');pg.click('#dlinks [data-pt="10:00"]');pg.wait_for_timeout(700);n1=pg.evaluate("E.filter(e=>e.fill>=100).length");print(name,'平日10:00',pg.inner_text('#tChip'),'>=100',n1);pg.click('#tChip');pg.click('#dlinks [data-pt="15:30"]');pg.wait_for_timeout(700);n2=pg.evaluate("E.filter(e=>e.fill>=100).length");print(name,'週六15:30 >=100',n2);assert n1==2 and n2==6
    pg.screenshot(path=f'shot_crew_forecast_sat_{name}.png')
    pg.click('#menu');assert pg.locator('#th').count()==0 and pg.locator('#thSeg input').count()==2
    pg.click('#thSeg label:has([value="100"])');pg.wait_for_timeout(400);c100=pg.inner_text('#cnt');t100=pg.inner_text('#cardTitle') if pg.locator('#cardTitle').count() else pg.inner_text('#card')[:40]
    pg.click('#thSeg label:has([value="70"])');pg.wait_for_timeout(400);c70=pg.inner_text('#cnt');pg.click('#setSheet [data-close]');print(name,'清運範圍',c100,'|',t100,'||',c70);assert '%' not in c70 and pg.evaluate("JSON.parse(localStorage.getItem('有桶_crew_ui_v2')).th")==70
    # 空狀態：平日 08:30「只清滿溢」→ 不顯示「必清 0 站」，顯示連結；點連結切回「快滿了以上」
    pg.click('#tChip');pg.wait_for_timeout(300);pg.click('label:has([name=fcd][value=wk])');pg.eval_on_selector('#fcT',"e=>{e.value=510;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}");pg.wait_for_timeout(400);pg.keyboard.press('Escape')
    pg.evaluate("th.value=100;replan()");pg.wait_for_timeout(400)
    cb=pg.inner_text('#card');assert '目前沒有滿溢的桶' in cb and pg.locator('#cardTitle').count()==0 and '43 桶中列入 0 桶' in cb,cb
    assert pg.locator('#toNear').bounding_box()['height']>=44;pg.click('#toNear');pg.wait_for_timeout(500)
    assert pg.locator('#cardTitle').count()==1 and pg.evaluate("th.value")==70 and pg.evaluate("document.querySelector('[name=thr][value=\"70\"]').checked") and pg.evaluate("JSON.parse(localStorage.getItem('有桶_crew_ui_v2')).th")==70
    print(name,'空狀態連結 OK',pg.inner_text('#cardTitle'))
    pg.click('#tChip');pg.wait_for_timeout(300);pg.click('label:has([name=fcd][value=we])');pg.eval_on_selector('#fcT',"e=>{e.value=930;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}");pg.wait_for_timeout(400);pg.keyboard.press('Escape')
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
    assert pg.locator('.roles a[href="index.html"]').count()>0;print(name,'行車路網',pg.inner_text('#sum').replace('\n',' '))
    # 重設：先有回報 → 資料說明裡的重設鈕（confirm）→ 狀態清空；再測 ?reset=1
    pg.evaluate("addEvent({bin:'B0001',kind:'full',level:100,by:'行人'})");n0=pg.evaluate("getEvents().length")
    pg.click('#infoBtn');pg.once('dialog',lambda d:d.accept());pg.click('#resetAll');pg.wait_for_load_state();pg.wait_for_timeout(800)
    left=pg.evaluate("Object.keys(localStorage).filter(k=>/^(有桶_|debug松_)/.test(k))");ui=pg.evaluate("JSON.parse(localStorage.getItem('有桶_crew_ui_v2')||'{}')");print(name,'重設前事件',n0,'重設後殘留鍵',left,'事件',pg.evaluate("getEvents().length"),'校正',pg.evaluate("FC.state()"),'crew ui',ui.get('state'),'url',pg.url.split('/')[-1])
    assert n0>0 and set(left)<={'有桶_crew_ui_v2'} and ui.get('state','A')=='A' and pg.evaluate("getEvents().length")==0 and pg.evaluate("Object.keys(FC.state().cal).length")==0 and '?' not in pg.url  # 清潔隊頁載入時會重新寫入預設 UI 狀態
    pg.goto(B+'index.html');pg.wait_for_selector('#hot .card',timeout=20000);pg.evaluate("addEvent({bin:'B0002',kind:'full',level:100,by:'行人'});SC.save({hotspotId:'x',option:'A'});addNeed(25.02,121.54)")
    pg.goto(B+'pedestrian.html?reset=1');pg.wait_for_url('**/pedestrian.html');pg.wait_for_timeout(800)
    left=pg.evaluate("Object.keys(localStorage).filter(k=>/^(有桶_|debug松_)/.test(k))");print(name,'?reset=1 殘留鍵',left);assert left==[] and pg.evaluate("getNeeds().length")==0
    pg.goto(B+'index.html');pg.wait_for_selector('#hot .card',timeout=20000);pg.click('#menu');assert pg.locator('#menuSheet #resetAll').count()==1;pg.click('#menuSheet [data-close]')
    # 空狀態重現（?reset=1 之後）：平日 08:30 + 只清滿溢
    pg.goto(B+'crew.html?reset=1');pg.wait_for_url('**/crew.html');pg.goto(B+'crew.html?fc=1&day=wk&t=08:30');pg.wait_for_selector('#card[data-state=A]',timeout=20000);pg.wait_for_timeout(600)
    pg.click('#menu');pg.click('#thSeg label:has([value="100"])');pg.wait_for_timeout(400);pg.click('#setSheet [data-close]')
    cb=pg.inner_text('#card');print(name,'空狀態 reset 後 平日08:30',cb.replace('\n',' ')[:60]);assert pg.inner_text('#cardEmpty')=='目前沒有滿溢的桶' and pg.inner_text('#cardCount')=='43 桶中列入 0 桶';assert '目前沒有滿溢的桶' in cb and '43 桶中列入 0 桶' in cb and pg.locator('#cardTitle').count()==0 and '必清 0 站' not in cb
    pg.click('#toNear');pg.wait_for_timeout(500);assert pg.locator('#cardTitle').count()==1 and pg.evaluate("document.querySelector('[name=thr][value=\"70\"]').checked") and pg.evaluate("JSON.parse(localStorage.getItem('有桶_crew_ui_v2')).th")==70
    # 剛例行清運、沒有要清的桶：平日 07:00 → 05:00 已例行清運；「調整時間」開時間設定
    pg.goto(B+'crew.html?fc=1&day=wk&t=07:00');pg.wait_for_selector('#card[data-state=A] #cardEmpty',timeout=20000);pg.wait_for_timeout(400)
    et=pg.inner_text('#cardEmpty');print(name,'例行清運後空狀態',et,'|',pg.inner_text('#prog'));assert et=='05:00 已例行清運，目前沒有要清的桶' and '43 桶中列入 0 桶' in pg.inner_text('#cardCount') and '沒有要清的桶' in pg.inner_text('#prog') and '無站點' not in pg.content()
    assert pg.locator('#toTime').bounding_box()['height']>=44;pg.click('#toTime');pg.wait_for_timeout(300);assert pg.locator('#timeSheet').is_visible();pg.keyboard.press('Escape')
    # 例行清運時間（假設）：config 與資料說明一致
    assert pg.evaluate("CONFIG.forecast.routineClears.join(',')")=='05:00,08:00,12:00,16:00' and '例行清運時間 05:00／08:00／12:00／16:00 為假設；官方公開資料只提到一天 3–6 次，沒有公布時間' in pg.content()
    pg.goto(B+'crew-route.html');pg.wait_for_selector('#card',timeout=20000);print(name,'舊路線網址導向',pg.url.endswith('crew.html'))
    print(name,'ERRORS',errs);ok&=not errs;c.close()
  br.close()
print('PASS' if ok else 'FAIL')
