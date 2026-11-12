import json, os, pathlib, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "browser-audit"
OUT.mkdir(parents=True, exist_ok=True)
server = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
results = []
try:
    for _ in range(40):
        try:
            urllib.request.urlopen("http://127.0.0.1:8765/", timeout=1)
            break
        except Exception:
            time.sleep(.25)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        for label, width, height in [("iphone",390,844),("ipad-portrait",820,1180),("ipad-landscape",1180,820),("android",412,915),("desktop",1440,900)]:
            page = browser.new_page(viewport={"width":width,"height":height}, device_scale_factor=2, is_mobile=label in ("iphone","android"), has_touch=True)
            errors=[]
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto("http://127.0.0.1:8765/",wait_until="domcontentloaded",timeout=30000)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(OUT / f"{label}.png"),full_page=True)
            data=page.evaluate("""() => ({
                horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
                undersized: [...document.querySelectorAll('button, a, [role="button"], input[type="checkbox"], input[type="radio"]')]
                  .filter(el => {const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&(r.width<44||r.height<44)})
                  .slice(0,40).map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,id:el.id,classes:el.className,text:(el.textContent||'').trim().slice(0,70),width:Math.round(r.width),height:Math.round(r.height)}}),
                cards: [...document.querySelectorAll('.venue-card')].slice(0,9).map(el=>{const r=el.getBoundingClientRect();return {width:Math.round(r.width),height:Math.round(r.height),x:Math.round(r.x),y:Math.round(r.y)}})
            })""")
            data.update({"device":label,"consoleErrors":errors})
            results.append(data)
            page.close()
        browser.close()
finally:
    server.terminate()
(OUT / "results.json").write_text(json.dumps(results,indent=2))
for r in results:
    print(r["device"],"overflow",r["horizontalOverflow"],"undersized",len(r["undersized"]),"errors",r["consoleErrors"][:3])
    for e in r["undersized"][:5]:print("  ",e)
if any(r["horizontalOverflow"] or r["undersized"] or r["consoleErrors"] for r in results):
    sys.exit(1)
