#!/bin/bash
# Contact page: everything on one screen, footer right below, icons added.
# Run from the praveka-store folder:  bash apply-contact.sh
set -e
[ -f public/index.html ] && [ -f public/style.css ] || { echo "Run this inside the praveka-store folder."; exit 1; }
grep -q 'class="ct pg"' public/index.html && { echo "Contact page already applied. Nothing to do."; exit 0; }

cp public/index.html public/index.html.bak3
cp public/style.css  public/style.css.bak3

cat > /tmp/praveka-contact.html <<'CONTACT_HTML'
<section class="ct pg" data-p="contact">
<div class="wrap ct-in">
<div class="ct-left">
<div class="ct-head"><h1>Contact Us</h1><p>Talk to our team about products, orders or crop advice.</p></div>
<div class="ct-cards">
<a class="ct-card" style="--c:#25D366" href="https://wa.me/916359414594" target="_blank" rel="noopener"><span class="ct-ic"><svg class="f" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></span><span class="ct-tx"><small>WhatsApp</small><b>+91 63594 14594</b><em>Price &amp; availability</em></span></a>
<a class="ct-card" style="--c:#4a7fd0" href="tel:+918401968996"><span class="ct-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg></span><span class="ct-tx"><small>Call us</small><b>+91 84019 68996</b><em>Talk to an expert directly</em></span></a>
<a class="ct-card ct-wide" style="--c:#e8912f" href="mailto:pravekalifescience@gmail.com"><span class="ct-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><span class="ct-tx"><small>Email</small><b>pravekalifescience@gmail.com</b><em>Product information &amp; business enquiries</em></span></a>
<a class="ct-card ct-wide" style="--c:#44917d" href="https://www.google.com/maps/search/?api=1&amp;query=Praveka%20Life%20Science%20Rajkot%20Gujarat" target="_blank" rel="noopener"><span class="ct-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span class="ct-tx"><small>Our address</small><span class="ct-addr">Ground Floor, Plot No. 36, S.R. No-212, Karmabumi Estate, Atlas Industrial Area, Dhebar Road, Kothariya Part, Nr. Gondal Road, Rajkot, Gujarat &ndash; 360022.</span><em class="ct-link">View on Google Maps &rarr;</em></span></a>
</div>
</div>
<div class="ct-form">
<h2>Send us a Message</h2>
<p>Fill in your details and our team will get back to you.</p>
<form id="contactForm">
<label for="contactName">Name<input type="text" id="contactName" name="name" placeholder="Your name" required></label>
<label for="contactPhone">Phone number<input type="tel" id="contactPhone" name="phone" inputmode="numeric" placeholder="Your phone number" required></label>
<label for="contactMessage">Message<textarea id="contactMessage" name="message" rows="4" placeholder="How can we help you?" required></textarea></label>
<button type="submit" class="btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>Send Message</button>
</form>
</div>
</div>
</section>
CONTACT_HTML

python3 - <<'PY'
p='public/index.html'
s=open(p,encoding='utf-8').read()
try:
    a=s.index('<section class="phead pg" data-p="contact">')
    b=s.index('<section class="contact-page pg" data-p="contact">')
    e=s.index('</section>',b)+len('</section>')
except ValueError:
    raise SystemExit("Could not find the old contact sections in index.html")
new=open('/tmp/praveka-contact.html',encoding='utf-8').read().strip()
open(p,'w',encoding='utf-8').write(s[:a]+new+s[e:])
print("index.html updated")
PY

cat >> public/style.css <<'CONTACT_CSS'

/* ===== Contact page (one screen) - added at the END of style.css ===== */
.ct{background:var(--bg);padding:clamp(24px,5vh,52px) 0 clamp(28px,5vh,56px)}
.ct-in{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(20px,3vw,40px);align-items:center;width:100%}
.ct-head h1{font-size:clamp(28px,3.6vw,44px);font-weight:800}
.ct-head p{margin:8px 0 clamp(14px,2.6vh,24px);color:var(--mute)}
.ct-cards{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ct-card{display:flex;gap:14px;align-items:center;padding:16px;background:var(--card);border:1px solid var(--line);border-radius:14px;text-decoration:none;color:var(--ink);transition:transform .2s,border-color .2s}
.ct-card:hover{transform:translateY(-3px);border-color:var(--c)}
.ct-wide{grid-column:1/-1}
.ct-ic{flex:none;width:48px;height:48px;border-radius:50%;background:var(--c);display:grid;place-items:center}
.ct-ic svg{width:24px;height:24px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ct-ic svg.f{fill:#fff;stroke:none}
.ct-tx{min-width:0;display:grid;gap:2px}
.ct-tx small{color:var(--mute);font-weight:600;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase}
.ct-tx b{font-size:17px;overflow-wrap:anywhere}
.ct-tx em{font-style:normal;font-size:14px;color:var(--mute)}
.ct-addr{font-size:15px;line-height:1.45}
.ct-tx .ct-link{color:var(--c);font-weight:600}
.ct-form{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:clamp(18px,3vh,28px)}
.ct-form h2{font-size:24px;margin:0 0 4px}
.ct-form>p{margin:0 0 16px;color:var(--mute);font-size:15px}
.ct-form label{display:grid;gap:5px;font-weight:600;font-size:14px;margin-bottom:12px}
.ct-form input,.ct-form textarea{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit;font-weight:400}
.ct-form textarea{resize:vertical;min-height:90px}
.ct-form .btn{width:100%;display:flex;justify-content:center;align-items:center;gap:10px;margin-top:4px}
.ct-form .btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
/* no gap between the one-screen contact section and the footer */
body:has(.ct:not(.hide)) footer.pf{margin-top:0}
@media (max-width:860px){.ct{padding:20px 0 28px}.ct-in{grid-template-columns:1fr}.ct-cards{grid-template-columns:1fr}}
CONTACT_CSS

echo "style.css updated. Restart the server (Ctrl+C, then npm start) and hard refresh (Cmd+Shift+R)."
