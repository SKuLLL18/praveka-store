#!/bin/bash
# Contact page v2: full-screen slide + "Choose a product" + quantity that follows the product.
# Run from the praveka-store folder (after apply-contact.sh):  bash apply-contact2.sh
set -e
[ -f server.js ] && [ -f public/script.js ] && [ -f public/index.html ] || { echo "Run this inside the praveka-store folder."; exit 1; }
grep -q 'class="ct pg"' public/index.html || { echo "Apply the contact page first: bash apply-contact.sh"; exit 1; }
grep -q 'id="contactProduct"' public/index.html && { echo "Already applied. Nothing to do."; exit 0; }

for f in public/index.html public/style.css public/script.js server.js; do cp "$f" "$f.bak4"; done

cat > /tmp/praveka-contact2.html <<'PRAVEKA_HTML'
<div class="ct-form">
<h2>Enquire about a product</h2>
<p>Choose a product and quantity. Our team will call you back.</p>
<form id="contactForm">
<div class="ct-row"><label for="contactName">Name<input type="text" id="contactName" name="name" placeholder="Your name" required></label><label for="contactPhone">Phone number<input type="tel" id="contactPhone" name="phone" inputmode="numeric" placeholder="Your phone number" required></label></div>
<label for="contactProduct">Choose a product<select id="contactProduct" name="product" required><option value="">Select a product</option></select></label>
<label for="contactQty">Quantity<select id="contactQty" name="quantity" required disabled><option value="">Select a product first</option></select><small class="ct-hint" id="contactHint"></small></label>
<button type="submit" class="btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>Send Enquiry</button>
</form>
</div>
PRAVEKA_HTML

cat > /tmp/praveka-contact2.css <<'PRAVEKA_CSS'

/* ===== Contact page v2: product + quantity form, full-screen slide ===== */
.ct-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ct-form select{width:100%;padding:11px 36px 11px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239db0a2' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;color:var(--ink);font:inherit;font-weight:400;appearance:none;-webkit-appearance:none;text-overflow:ellipsis}
.ct-form select:disabled{opacity:.6;cursor:not-allowed}
.ct-hint{font-weight:400;font-size:13px;color:var(--mute);min-height:1.2em}
@media (max-width:520px){.ct-row{grid-template-columns:1fr}}
PRAVEKA_CSS

cat > /tmp/praveka-patch2.py <<'PRAVEKA_PY'
import re,sys
def rd(p): return open(p,encoding='utf-8').read()
def wr(p,s): open(p,'w',encoding='utf-8').write(s); print("updated",p)
def sub(s,old,new,path):
    if s.count(old)!=1: raise SystemExit("Could not find expected text in %s:\n  %s"%(path,old[:90]))
    return s.replace(old,new)

# ---- index.html: new form block
p='public/index.html'; s=rd(p)
a=s.index('<div class="ct-form">'); f=s.index('</form>',a); e=s.index('</div>',f)+len('</div>')
wr(p, s[:a]+rd('/tmp/praveka-contact2.html').strip()+s[e:])

# ---- style.css: full-screen slide + new rules
p='public/style.css'; s=rd(p)
s=sub(s,'.ct{background:var(--bg);padding:clamp(24px,5vh,52px) 0 clamp(28px,5vh,56px)}',
        '.ct{background:var(--bg);min-height:calc(100vh - var(--hh,64px));display:flex;align-items:center;padding:clamp(16px,3vh,32px) 0}',p)
s=sub(s,'@media (max-width:860px){.ct{padding:20px 0 28px}','@media (max-width:860px){.ct{min-height:0;display:block;padding:20px 0 28px}',p)
wr(p, s+rd('/tmp/praveka-contact2.css'))

# ---- script.js: product list, quantity logic, send product+quantity, "Get best quote" preselects product
p='public/script.js'; s=rd(p)
s=sub(s,'function start(list){setP(list);tiles();cats();grid();feat();route()}',
 'function start(list){setP(list);tiles();cats();grid();feat();cprod();route()}',p)
s=sub(s,'$("contactForm").onsubmit=function(e){e.preventDefault();var f=e.target,x=f.elements;post("/api/contact",{name:x.name.value,phone:x.phone.value,message:x.message.value}).then(function(){f.reset();toast("Thanks. We will contact you soon.")}).catch(errToast)};',
 '$("contactForm").onsubmit=function(e){e.preventDefault();var f=e.target,x=f.elements;post("/api/contact",{name:x.name.value,phone:x.phone.value,product:x.product.value,quantity:x.quantity.value,message:""}).then(function(){f.reset();cqty();toast("Thanks. We will contact you soon.")}).catch(errToast)};',p)
s=sub(s,'else if(b.id=="enq"){var ta=document.querySelector("#contactForm textarea");if(ta)ta.value="Hello, I am interested in "+p.rn+" ("+p.sizes[vi][0]+"). Please share the best price.";location.hash="contact"}',
 'else if(b.id=="enq"){var cs=$("contactProduct");if(cs){cs.value=p.id;cqty()}location.hash="contact"}',p)
s=s.rstrip('\n')+'''
/* contact form: product list and quantity that follows the chosen product */
function cunit(w){w=String(w).toLowerCase();if(/^(l|lt|ltr|litre|litres|liter|liters|ml)$/.test(w))return"Litre";if(/^(kg|kgs|kilo|g|gm|gms|gram|grams)$/.test(w))return"Kg";if(/^(pc|pcs|piece|pieces)$/.test(w))return"Piece";return w.charAt(0).toUpperCase()+w.slice(1)}
function cprod(){var s=$("contactProduct");if(!s)return;
s.innerHTML='<option value="">Select a product</option>'+CATS.map(function(c){var l=P.filter(function(p){return p.c==c[0]});return l.length?'<optgroup label="'+esc(c[0])+'">'+l.map(function(p){return'<option value="'+esc(p.id)+'">'+p.n+'</option>'}).join("")+'</optgroup>':""}).join("");
s.onchange=cqty;cqty()}
function cqty(){var s=$("contactProduct"),q=$("contactQty"),h=$("contactHint");if(!s||!q)return;var p=P.find(function(x){return x.id==s.value});
if(!p){q.innerHTML='<option value="">Select a product first</option>';q.disabled=true;h.textContent="";return}
var m=String(p.moq||"").match(/^\\s*(\\d+)\\s*([A-Za-z]+)/),z=String(p.sizes[0][0]).match(/[A-Za-z]+/),base=10,u="Kg";
if(m){base=+m[1];u=cunit(m[2])}else if(z)u=cunit(z[0]);
var o=[1,2,3,5,10,20,50].map(function(k){return(base*k).toLocaleString("en-IN")+" "+u});
q.innerHTML='<option value="">Select quantity</option>'+o.map(function(t){return'<option>'+t+'</option>'}).join("")+'<option>More than '+(base*50).toLocaleString("en-IN")+" "+u+'</option>';q.disabled=false;
h.innerHTML="Pack size: "+p.sizes.map(function(z){return z[0]}).join(", ")+(p.moq?" &middot; Minimum order: "+p.moq:"")}
'''
wr(p,s)

# ---- server.js: accept any quantity text (was limited to a fixed list of numbers)
p='server.js'; s=rd(p)
s=sub(s,'quantity:QTY.includes(qty)?qty:""','quantity:qty',p)
wr(p,s)
PRAVEKA_PY

python3 /tmp/praveka-patch2.py
echo "Done. Stop the server (Ctrl+C), run: npm start   then hard refresh (Cmd+Shift+R)."
