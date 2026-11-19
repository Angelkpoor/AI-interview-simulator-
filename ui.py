import asyncio, sys
from playwright.async_api import async_playwright
URL='file:///home/claude/interview-ai/index.html'
ANS=["Hi, I am a final year student and I built a project using python and a small web app. My skills include python and javascript, I learn quickly, and I am excited about this role because my goal is to build real products. For example I used git in college.",
"First, an index is a data structure like a b-tree that makes read queries faster because it avoids a full table scan. However it makes writes slower and uses storage, so I check the query plan before adding an index on a column.",
"I would keep the service stateless and scale horizontally behind a load balancer, and cache hot reads with redis. We also use read replicas, rate limit and a queue for slow work, and monitor latency.",
"um I think maybe it is like basically a transaction, you know",
"A transaction groups operations so they commit or roll back together, which gives atomicity and isolation. For example concurrent updates can cause a race condition or a deadlock, so I use locks and keep them short.",
"Situation: once our deploy failed. My task was to fix it. I decided to roll back, I fixed the config, and the result was zero downtime. I learned to add checks and told the team."]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'])
        pg=await b.new_page(viewport={'width':1360,'height':900})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto(URL); await pg.wait_for_timeout(1800)
        await pg.fill('#nameIn','Alex'); await pg.click('[data-role="be"]'); await pg.click('[data-level="2"]')
        await pg.wait_for_timeout(300); await pg.screenshot(path='shots/1_setup.png',full_page=True)
        await pg.click('[data-count="7"]'); await pg.click('[data-act=start]'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='shots/2_interview.png',full_page=True)
        n=int(await pg.evaluate("IAI.UI.state.session.questions.length"))
        for i in range(n):
            await pg.wait_for_selector('#typeIn'); await pg.wait_for_timeout(300)
            await pg.fill('#typeIn',ANS[i%len(ANS)]); await pg.press('#typeIn','Enter'); await pg.wait_for_timeout(900)
            if i==1: await pg.screenshot(path='shots/3_after_answer.png',full_page=True)
            await pg.wait_for_selector('[data-iv=next]'); await pg.click('[data-iv=next]'); await pg.wait_for_timeout(400)
        await pg.wait_for_timeout(800)
        await pg.screenshot(path='shots/4_report.png',full_page=True)
        for t in ['answers','delivery','ann']:
            await pg.click(f'[data-tab={t}]'); await pg.wait_for_timeout(300); await pg.screenshot(path=f'shots/5_{t}.png',full_page=True)
        await pg.click('[data-r=history]'); await pg.wait_for_timeout(300); await pg.screenshot(path='shots/6_history.png',full_page=True)
        await pg.click('[data-nav=ann]'); await pg.wait_for_timeout(300); await pg.screenshot(path='shots/7_lab.png',full_page=True)
        await pg.click('[data-nav=settings]'); await pg.wait_for_timeout(300); await pg.screenshot(path='shots/8_settings.png',full_page=True)
        print('ERRORS:',errs)
        await b.close()
asyncio.run(main())
