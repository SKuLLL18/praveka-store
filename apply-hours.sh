#!/bin/bash
# Adds a "Working hours" card to the Contact page.
# Run from the praveka-store folder:  bash apply-hours.sh
# It will ask you for the REAL opening hours (nothing is made up).
set -e
[ -f public/index.html ] && [ -f public/home.css ] || { echo "Run this inside the praveka-store folder."; exit 1; }
grep -q 'class="ct-card ct-wide ct-hours-card"' public/index.html && { echo "Working hours card already added. To change the times, edit them in public/index.html (search: ct-hr)."; exit 0; }

echo "Enter your working hours. Example answers are in brackets."
read -r -p "Row 1 days  [Monday - Saturday]: " D1
read -r -p "Row 1 time  [9:00 AM - 6:00 PM]: " T1
read -r -p "Row 2 days  [Sunday] (press Enter to skip): " D2
if [ -n "$D2" ]; then read -r -p "Row 2 time  [Closed]: " T2; fi
[ -n "$D1" ] && [ -n "$T1" ] || { echo "Row 1 needs days and time. Nothing changed."; exit 1; }

cp public/index.html public/index.html.bak-hours
cp public/home.css  public/home.css.bak-hours
D1="$D1" T1="$T1" D2="$D2" T2="$T2" node - <<'JS'
const fs=require('fs');
const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').trim();
let rows=`<span class="ct-hr"><span>${esc(process.env.D1)}</span><span>${esc(process.env.T1)}</span></span>`;
if(esc(process.env.D2)) rows+=`<span class="ct-hr"><span>${esc(process.env.D2)}</span><span>${esc(process.env.T2)}</span></span>`;
const card=`<div class="ct-card ct-wide ct-hours-card" style="--c:#e3a817"><span class="ct-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><span class="ct-tx"><small>Working hours</small><span class="ct-hours">${rows}</span></span></div>`;
let h=fs.readFileSync('public/index.html','utf8');
const re=/(<a class="ct-card ct-wide"[^>]*google\.com\/maps[\s\S]*?<\/a>)(\s*<\/div>\s*<\/div>\s*<div class="ct-form">)/;
if(!re.test(h)){console.error('Could not find the address card in the Contact section. Nothing changed.');process.exit(1)}
h=h.replace(re,(m,a,b)=>a+'\n'+card+b);
fs.writeFileSync('public/index.html',h);
fs.appendFileSync('public/home.css',`
/* ===== working hours card (contact page) ===== */
.ct-hours{display:grid;gap:0;width:100%;margin-top:6px}
.ct-hr{display:flex;justify-content:space-between;gap:18px;padding:8px 0;border-top:1px solid rgba(255,255,255,.12);font-size:17px}
.ct-hr:first-child{border-top:0}
.ct-hr span:last-child{font-weight:600;text-align:right}
.ct-hours-card .ct-tx{flex:1}
`);
console.log('Working hours card added.');
JS
echo "Done. Refresh the page with Cmd+Shift+R (restart not needed unless the server is stopped)."
