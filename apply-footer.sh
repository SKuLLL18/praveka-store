#!/bin/bash
# Praveka footer (Option D) - run from the praveka-store folder:  bash apply-footer.sh
set -e
[ -f public/index.html ] && [ -f public/style.css ] || { echo "Run this inside the praveka-store folder."; exit 1; }
grep -q 'class="pf"' public/index.html && { echo "Footer already applied. Nothing to do."; exit 0; }

# 1. Backups
cp public/index.html public/index.html.bak
cp public/style.css  public/style.css.bak

# 2. New footer HTML
cat > /tmp/praveka-footer.html <<'FOOTER_HTML'
<footer class="pf">
<div class="pf-shelf" aria-hidden="true">
<p class="pf-h">All our products, <span>one trusted name</span></p>
<div class="pf-bottles">
<i style="--c:#e8912f;--h:100px"></i><i style="--c:#6a40b0;--h:112px"></i><i style="--c:#eef0eb;--cap:#4a7fd0;--h:140px"></i><i style="--c:#4f9f4a;--h:100px"></i><i style="--c:#efd648;--cap:#c4452d;--h:112px"></i><i style="--c:#b44d35;--h:130px"></i><i style="--c:#4a7fd0;--h:100px"></i><i style="--c:#c64779;--h:112px"></i><i style="--c:#44917d;--h:130px"></i><i style="--c:#e8912f;--h:100px"></i>
</div>
<div class="pf-board"></div>
</div>
<div class="wrap">
<div class="pf-grid">
<div class="pf-brand"><a class="logo" href="#home" style="color:inherit"><span class="mark"></span>Praveka Life Science</a><p class="pf-tag">Leaders in Innovation</p><p>To be the most trusted and ethical source of our products.</p></div>
<div><h3>Products</h3><ul class="pf-list">
<li><a href="#products" data-c="Insecticide"><i class="pf-dot" style="--c:#e8912f"></i>Insecticide</a></li>
<li><a href="#products" data-c="Fungicide"><i class="pf-dot" style="--c:#6a40b0"></i>Fungicide</a></li>
<li><a href="#products" data-c="Herbicide"><i class="pf-dot" style="--c:#4a7fd0"></i>Herbicide</a></li>
<li><a href="#products" data-c="PGR &amp; Nutrition"><i class="pf-dot" style="--c:#c64779"></i>PGR and nutrition</a></li>
<li><a href="#products" data-c="Fertilizer"><i class="pf-dot" style="--c:#44917d"></i>Fertilizer</a></li>
</ul></div>
<div><h3>Company</h3><ul class="pf-list"><li><a href="#home">Home</a></li><li><a href="#about">About us</a></li><li><a href="#crops">Crops</a></li><li><a href="#contact">Contact</a></li></ul></div>
<div><h3>Get in touch</h3><ul class="pf-list pf-contact">
<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg><a href="https://wa.me/916359414594" target="_blank" rel="noopener">+91 63594 14594</a></li>
<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg><a href="tel:+918401968996">+91 84019 68996</a></li>
<li><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><a href="mailto:pravekalifescience@gmail.com">pravekalifescience@gmail.com</a></li>
<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg><span>Dhebar Road, Rajkot 360022</span></li>
</ul></div>
</div>
<div class="pf-newsrow"><span>Get farming tips and offers by email.</span><form class="news" id="nf"><input name="email" type="email" required placeholder="Your email" aria-label="Email address"><button>Subscribe</button></form></div>
<div class="pf-bottom"><span>&copy; 2026 Praveka Life Science &middot; GSTIN 24ABGFP7301L1Z6</span><span>ISO 9001:2015 &middot; ISO 14001:2015 certified company</span><span><a href="#home">Privacy</a> &middot; <a href="#home">Terms</a></span></div>
</div>
</footer>
FOOTER_HTML

# 3. Replace the old <footer>...</footer> block in index.html
python3 - <<'PY'
import re
p='public/index.html'
s=open(p,encoding='utf-8').read()
new=open('/tmp/praveka-footer.html',encoding='utf-8').read().strip()
s,n=re.subn(r'<footer>.*?</footer>',lambda m:new,s,count=1,flags=re.S)
if n!=1: raise SystemExit("Could not find the old <footer> block")
open(p,'w',encoding='utf-8').write(s)
print("index.html updated")
PY

# 4. Footer CSS appended to the END of style.css
cat >> public/style.css <<'FOOTER_CSS'

/* ===== Footer (Option D) - added at the END of style.css ===== */
footer.pf{--f1:#1f3829;--f2:#12241a;--fin:#f3f6ef;--fmute:#a9bcae;--fsun:#e3a817;background:var(--f2);color:var(--fin);margin-top:40px;padding:0;font-size:15px}
footer.pf a{display:inline;opacity:1;margin:0;text-decoration:none;color:var(--fin)}
footer.pf a:hover{color:var(--fsun)}
footer.pf .logo{display:inline-flex;align-items:center;gap:10px;font-size:20px;color:var(--fin)}
.pf-shelf{background:var(--f1);padding:28px 20px 0;text-align:center}
.pf-h{font:800 clamp(22px,3vw,32px)/1.2 "Bricolage Grotesque",system-ui,sans-serif;margin:0 0 22px}
.pf-h span{color:var(--fsun)}
.pf-bottles{--s:1;display:flex;justify-content:center;align-items:flex-end;gap:clamp(12px,3vw,38px);max-width:1120px;margin:0 auto}
.pf-bottles i{position:relative;display:block;flex:none;width:clamp(26px,5.4vw,62px);height:calc(var(--h) * var(--s));margin-top:14px;background:var(--c);border-radius:10px 10px 6px 6px}
.pf-bottles i::before{content:"";position:absolute;left:50%;top:-14px;width:46%;height:14px;transform:translateX(-50%);background:var(--cap,#fff);border-radius:3px 3px 0 0}
.pf-bottles i::after{content:"";position:absolute;left:18%;right:18%;top:30%;height:38%;background:#f3f6ef;border-radius:4px}
.pf-board{height:18px;max-width:1120px;margin:0 auto;background:linear-gradient(#b08a57 0 65%,#7d5a32 65%)}
.pf-grid{display:grid;grid-template-columns:1.3fr 1fr 1fr 1.5fr;gap:32px;padding:34px 0 22px}
.pf h3{font-size:19px;margin:0 0 14px}
.pf-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.pf-dot{display:inline-block;width:12px;height:12px;border-radius:50%;background:var(--c);margin-right:12px;vertical-align:-1px}
.pf-brand .pf-tag{color:var(--fsun);font:800 20px "Bricolage Grotesque",system-ui,sans-serif;margin:16px 0 6px}
.pf-brand p{margin:0}.pf-brand p:last-child{color:var(--fmute)}
.pf-contact li{display:flex;gap:12px;align-items:flex-start}
.pf-contact svg{flex:none;width:18px;height:18px;margin-top:4px;stroke:var(--fsun);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pf-newsrow{display:flex;align-items:center;gap:8px 20px;flex-wrap:wrap;padding:16px 0;border-top:1px solid rgba(255,255,255,.14);color:var(--fmute)}
.pf-newsrow .news{margin:0;flex:0 1 380px}
.pf-bottom{display:flex;justify-content:space-between;gap:8px 24px;flex-wrap:wrap;padding:16px 0 22px;border-top:1px solid rgba(255,255,255,.14);color:var(--fmute);font-size:14px}
.pf-bottom a{color:var(--fmute)}
@media (max-width:860px){.pf-grid{grid-template-columns:1fr 1fr}}
@media (max-width:520px){.pf-grid{grid-template-columns:1fr}.pf-bottles{--s:.62}.pf-bottles i:nth-child(n+7){display:none}}
FOOTER_CSS

echo "style.css updated. Now run: npm start  and open http://localhost:3000 (hard refresh: Cmd+Shift+R)"
