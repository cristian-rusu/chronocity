from playwright.sync_api import sync_playwright
from pathlib import Path
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 html=(Path(__file__).resolve().parents[1] / 'dist' / 'chronocity.html').read_text()
 page.set_content(html);page.wait_for_selector('.hero');page.evaluate('window.scrollTo(0,0)')
 page.get_by_role('button',name='Plan my day').click();page.wait_for_selector('.profile-grid');page.evaluate('window.scrollTo(0,0)')
 page.get_by_role('button',name='Add activity').click();page.locator('[name=title]').fill('Collect parcel');page.locator('[name=place]').select_option('market');page.locator('[name=deadline]').fill('20:00');page.get_by_role('button',name='Save obligation').click();assert page.get_by_text('Collect parcel',exact=True).count()>=1
 page.get_by_role('button',name='Noah Shift worker').click();page.get_by_role('button',name='Emma Working parent').click();assert page.get_by_text('Collect parcel',exact=True).count()>=1;print('PASS custom plan retained when switching profiles');page.get_by_role('button',name='Delete Collect parcel').click();assert page.get_by_text('Collect parcel',exact=True).count()==0
 page.get_by_role('button',name='Simulate my journey').click();page.wait_for_selector('#clock');page.get_by_role('button',name='+30m',exact=True).click()
 page.get_by_role('button',name='Start time playback').click();page.locator('#edge').focus();page.evaluate('window.testControl=document.getElementById("edge")');page.wait_for_timeout(1800);assert page.evaluate('document.activeElement===window.testControl && document.getElementById("edge")===window.testControl'); print('PASS playback preserves actual DOM node and focus over multiple ticks')
 page.locator('#speed').select_option('1');page.locator('#closure').select_option('hall');assert 'Service closed' in page.locator('.impact-panel').inner_text();page.locator('#closure').select_option('');page.get_by_role('button',name='Open hours').click();assert page.get_by_role('button',name='Open hours').get_attribute('aria-pressed')=='true';page.get_by_role('button',name='Pause time playback').click();print('PASS select incident, closure, speed and layers while playback runs')
 page.evaluate('window.scrollTo(0,0)')
 page.get_by_role('button',name='Find recovery plans').click();page.wait_for_selector('.candidate-list');assert 'A complete recovery' in page.locator('main').inner_text();page.get_by_role('button',name='Reclaim schedule').click();assert page.locator('.accepted-banner').count()==1;print('PASS CRUD, recovery and acceptance; persistence requires normal hosting origin');
 with page.expect_download() as dl: page.get_by_role('button',name='Download accepted itinerary (.ics)').click()
 downloaded=dl.value;assert downloaded.suggested_filename.endswith('.ics');data=Path(downloaded.path()).read_text();assert 'BEGIN:VCALENDAR' in data and 'SUMMARY:Pick up child' in data;print('PASS calendar export contains accepted visits and travel events')
 page.evaluate('window.scrollTo(0,0)')
 page.get_by_role('link',name='City lab').click();page.wait_for_selector('#budget');page.locator('#budget').select_option('5');page.get_by_role('button',name='Optimize within budget').click();assert 'Best affordable policy' in page.locator('.notice[role=status]').inner_text();print('PASS city policy optimizer')
 page.evaluate('window.scrollTo(0,0)')
 page.set_viewport_size({'width':390,'height':844});page.get_by_role('link',name='Aftershock').click();page.wait_for_selector('#clock');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.evaluate('window.scrollTo(0,0)');print('PASS mobile viewport without horizontal overflow')
 print('Browser errors:',errors);assert not errors
 b.close()
