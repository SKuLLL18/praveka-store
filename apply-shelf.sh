#!/bin/bash
# Praveka footer shelf: replace the coloured placeholder bottles with real product photos.
# Run from the praveka-store folder:  bash apply-shelf.sh
set -e
[ -f public/index.html ] && [ -f public/home.css ] || { echo "Run this inside the praveka-store folder."; exit 1; }
[ -d public/images/footer ] || { echo "Copy the images/footer folder into public/images first (see instructions)."; exit 1; }
grep -q 'class="pf-item"' public/index.html && { echo "Shelf already applied. Nothing to do."; exit 0; }
cp public/index.html public/index.html.bak-shelf
cp public/home.css  public/home.css.bak-shelf
node - <<'JS'
const fs=require('fs');
const P=JSON.parse(fs.readFileSync('data/products.json','utf8'));
const items=[['thander',150],['ozon',140],['pramukh-nutrizen',104],['no-one',150],['himalay',140],['npk-19',104],['foji-30',140],['tubex',116],['black-panther',130],['oxyzen',140]];
const file={'pramukh-nutrizen':'nutrizen','npk-19':'npk-19-19-19'};
const find=k=>P.find(p=>(p.images||[]).some(i=>i.replace(/^images\//,'').replace(/\.\w+$/,'')===(file[k]||k)));
let html='<div class="pf-bottles">\n';
for(const [k,h] of items){const p=find(k);if(!p){console.log('skip (not in catalogue):',k);continue}
 const name=p.n.replace(/"/g,'&quot;');
 html+=`<a class="pf-item" href="#p/${p.id}" style="--h:${h}px" data-n="${name}" aria-label="${name}"><img src="images/footer/${file[k]||k}.webp" alt="${name}" loading="lazy"></a>\n`;}
html+='</div>';
let h=fs.readFileSync('public/index.html','utf8');
const re=/<div class="pf-bottles">[\s\S]*?<\/div>/;
if(!re.test(h)){console.error('Could not find the old bottles block.');process.exit(1)}
h=h.replace(re,html).replace('<div class="pf-shelf" aria-hidden="true">','<div class="pf-shelf">');
fs.writeFileSync('public/index.html',h);
const css=`
/* ===== footer shelf with real products ===== */
.pf-item{position:relative;display:block;flex:none;height:calc(var(--h) * var(--s));filter:drop-shadow(0 10px 8px rgba(0,0,0,.45));transition:transform .25s}
.pf-item img{height:100%;width:auto;display:block}
.pf-item:hover,.pf-item:focus-visible{transform:translateY(-10px) scale(1.05);outline:none}
.pf-item::after{content:attr(data-n);position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%);width:max-content;max-width:210px;padding:6px 10px;border-radius:8px;background:#e3a817;color:#123420;font:600 13px/1.3 "Source Sans 3",system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s;z-index:5}
.pf-item:hover::after,.pf-item:focus-visible::after{opacity:1}
.pf-bottles{gap:clamp(8px,2.2vw,30px)}
@media (min-width:1000px){.pf-bottles{--s:1.22}}
@media (max-width:520px){.pf-item:nth-child(n+7){display:none}}
`;
fs.appendFileSync('public/home.css',css);
console.log('Shelf added with',(html.match(/pf-item"/g)||[]).length,'products.');
JS
echo "Done. Restart with:  npm start   then refresh with Cmd+Shift+R"
