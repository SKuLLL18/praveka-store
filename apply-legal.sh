#!/bin/bash
# Adds Privacy Policy, Terms & Conditions and Return & Refund Policy pages.
# Run from the praveka-store folder:  bash apply-legal.sh
set -e
[ -f public/index.html ] && [ -f public/script.js ] && [ -f public/home.css ] || { echo "Run this inside the praveka-store folder."; exit 1; }
grep -q 'data-p="privacy"' public/index.html && { echo "Legal pages already added. To edit the text, open public/index.html and search: data-p=\"privacy\""; exit 0; }
echo "Two business decisions are needed (your client should confirm them):"
read -r -p "Within how many DAYS of delivery must a customer report a damaged/wrong product?  [example: 7]: " RET
read -r -p "Within how many WORKING DAYS do you refund after approving a return?  [example: 7]: " REF
case "$RET$REF" in ''|*[!0-9]*) echo "Please type numbers only. Nothing changed."; exit 1;; esac
[ -n "$RET" ] && [ -n "$REF" ] || { echo "Both numbers are needed. Nothing changed."; exit 1; }
cp public/index.html public/index.html.bak-legal
cp public/script.js  public/script.js.bak-legal
cp public/home.css   public/home.css.bak-legal
RET="$RET" REF="$REF" node - <<'JS'
const fs=require('fs');
const RET=process.env.RET, REF=process.env.REF;
const d=new Date(), DATE=d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
const ADDR='Ground Floor, Plot No. 36, S.R. No-212, Karmabhumi Estate, Atlas Industrial Area, Dhebar Road, Kothariya Part, Nr. Gondal Road, Rajkot, Gujarat &ndash; 360022';
const CONTACT=`<p class="note"><b>Praveka Life Science</b><br>${ADDR}<br>WhatsApp: +91 63594 14594 &middot; Phone: +91 84019 68996<br>Email: <a href="mailto:pravekalifescience@gmail.com">pravekalifescience@gmail.com</a><br>GSTIN: 24ABGFP7301L1Z6</p>`;
const NAV=cur=>`<nav class="legal-nav" aria-label="Policies">`+[['privacy','Privacy Policy'],['terms','Terms &amp; Conditions'],['returns','Return &amp; Refund Policy']].map(([k,t])=>`<a href="#${k}"${k===cur?' aria-current="page"':''}>${t}</a>`).join('')+`</nav>`;
const wrap=(k,title,body)=>`<section class="wrap sec pg legal" data-p="${k}">${NAV(k)}<h1>${title}</h1><p class="upd">Last updated: ${DATE}</p>${body}</section>`;

const privacy=wrap('privacy','Privacy Policy',`
<p>This Privacy Policy explains how Praveka Life Science (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses and protects your personal information when you use this website, place an order or contact us.</p>
<h2>1. Information we collect</h2>
<ul>
<li><b>Enquiries:</b> your name, phone number, the product and quantity you ask about.</li>
<li><b>Orders:</b> your name, mobile number, delivery address, PIN code, the items you order and the payment method.</li>
<li><b>Mobile number updates:</b> your mobile number, if you subscribe to farming tips and offers.</li>
<li><b>On your device:</b> your shopping cart is saved in your browser&rsquo;s storage so it is not lost when you leave the page. It stays on your device.</li>
<li><b>Technical data:</b> our hosting provider may keep basic technical logs (such as IP address and browser type) for security and to keep the website working.</li>
</ul>
<h2>2. How we use your information</h2>
<ul>
<li>To confirm, pack, deliver and support your orders.</li>
<li>To call or message you back about your enquiry.</li>
<li>To send farming tips and offers, only if you subscribed. You can ask us to stop at any time.</li>
<li>To keep records we must keep under tax, accounting and pesticide-trade laws.</li>
<li>To prevent fraud and misuse of the website.</li>
</ul>
<h2>3. Who we share it with</h2>
<p>We do not sell your personal information. We share it only with people who help us serve you, and only what is needed: delivery and courier partners, payment providers (if online payment is offered), website hosting and IT service providers, and government authorities when the law requires it.</p>
<h2>4. Storage and security</h2>
<p>We use reasonable safeguards to protect your information. No website or storage method is completely secure, so we cannot promise absolute security. We keep your information for as long as needed to complete your order, answer your questions, and meet legal and tax record-keeping requirements.</p>
<h2>5. Cookies and tracking</h2>
<p>This website uses browser storage only to remember your cart. We do not use advertising trackers on this website.</p>
<h2>6. Your choices</h2>
<p>You may ask us to show, correct or delete the personal information we hold about you, or to stop sending you offers. Write to us at the email below or message us on WhatsApp. We will respond within a reasonable time. We may need to keep some records where the law requires.</p>
<h2>7. Children</h2>
<p>Our products are for adult farmers and growers. We do not knowingly collect information from anyone under 18.</p>
<h2>8. Links to other services</h2>
<p>Links such as WhatsApp or Google Maps open services run by other companies, which have their own privacy policies.</p>
<h2>9. Changes to this policy</h2>
<p>We may update this policy. The date at the top shows when it was last changed.</p>
<h2>10. Contact us</h2>${CONTACT}`);

const terms=wrap('terms','Terms &amp; Conditions',`
<p>By using this website or placing an order, you agree to these terms. Please read them with our <a href="#privacy">Privacy Policy</a> and <a href="#returns">Return &amp; Refund Policy</a>.</p>
<h2>1. Product information</h2>
<p>Product names, photos and descriptions on this website are for general information. Pack design, size and label details may change. <b>Always read and follow the label and leaflet on the pack.</b> Where the website and the label differ, the label is correct. This website is not a substitute for advice from a qualified agriculture expert.</p>
<h2>2. Legal compliance</h2>
<p>Crop-protection products (insecticides, fungicides, herbicides and similar) are sold in accordance with the Insecticides Act, 1968, the Insecticides Rules, 1971 and other applicable laws. We may ask for details needed to comply with the law, and we may refuse or cancel an order if it cannot be supplied lawfully or safely. You must use every product only for the purpose and in the way stated on its label.</p>
<h2>3. Orders</h2>
<p>Placing an order is a request to buy. An order is accepted only when we confirm it (for example by phone call, message or dispatch). We may decline or cancel an order, for example if stock is not available, a price is shown by mistake, or the law does not allow the sale. If we cancel a paid order, we will refund the amount.</p>
<h2>4. Prices and payment</h2>
<p>Prices are in Indian Rupees and may change without notice. The price confirmed when we accept your order applies. Products shown as &ldquo;Price on request&rdquo; are quoted when you enquire. Orders placed on this website are currently payable on delivery. If other payment options are added, they will be shown at checkout.</p>
<h2>5. Delivery</h2>
<p>Delivery times are estimates and may be affected by weather, transport and availability. Delivery charges, if any, will be told to you when we confirm your order. Please check the parcel when it arrives and tell us at once if anything is wrong (see the <a href="#returns">Return &amp; Refund Policy</a>).</p>
<h2>6. Safe storage and use</h2>
<p>After delivery you are responsible for storing, handling and using the product safely and as per its label: keep it in its original pack, away from children, animals, food and feed, and follow the safety instructions and pre-harvest intervals given on the label.</p>
<h2>7. Limits on our responsibility</h2>
<p>Crop results depend on many things we cannot control, such as weather, soil, pest pressure, water, mixing and how and when the product is applied. To the extent the law allows, we are not responsible for indirect or consequential loss, or for loss caused by use that is not as per the label. Our total responsibility for any product is limited to the price you paid for it. Nothing here limits any right you have under law that cannot be limited.</p>
<h2>8. Our content</h2>
<p>The name Praveka Life Science, our logo, and the text, photos and design of this website belong to us or our licensors. Please do not copy or reuse them without our written permission.</p>
<h2>9. Proper use of the website</h2>
<p>Please do not misuse the website, try to break its security, or give false information in forms or orders.</p>
<h2>10. Governing law</h2>
<p>These terms are governed by the laws of India. Courts in Rajkot, Gujarat will have jurisdiction over any dispute, unless the law says otherwise.</p>
<h2>11. Changes</h2>
<p>We may update these terms. The date at the top shows the latest version. Orders are covered by the terms that applied when you ordered.</p>
<h2>12. Contact us</h2>${CONTACT}`);

const returns=wrap('returns','Return &amp; Refund Policy',`
<p class="note"><b>Please note:</b> Crop-protection products are regulated and can be hazardous, so for safety we cannot take back a product once its seal is broken or it has been used.</p>
<h2>1. When we will replace or refund</h2>
<p>Tell us within <b>${RET} days</b> of delivery if:</p>
<ul>
<li>you received a different product, size or quantity from what you ordered;</li>
<li>the pack was damaged or leaking, or the seal was already broken or tampered with, when it arrived;</li>
<li>the product was past its expiry date when delivered;</li>
<li>you believe there is a quality or manufacturing problem (we may need to check the batch).</li>
</ul>
<h2>2. What we cannot accept</h2>
<ul>
<li>Products that have been opened, used or partly used, unless the problem is a verified quality issue.</li>
<li>Products damaged by wrong storage, spillage or mishandling after delivery.</li>
<li>Products without the original pack, label or batch number.</li>
<li>Requests made after ${RET} days from delivery.</li>
<li>Returns because of a change of mind.</li>
</ul>
<h2>3. How to tell us</h2>
<p>Message us on WhatsApp (+91 63594 14594) or email <a href="mailto:pravekalifescience@gmail.com">pravekalifescience@gmail.com</a> with:</p>
<ul>
<li>your name, phone number and order number;</li>
<li>clear photos of the pack, the label and the batch number;</li>
<li>a short description of the problem.</li>
</ul>
<p>Please keep the product and its packaging and do not use or throw it away until we reply. A short video of opening the parcel helps us settle damage claims quickly.</p>
<h2>4. What happens next</h2>
<p>We will check your request and may arrange to collect the product. If your request is approved, we will either send a replacement or refund the amount you paid. When the mistake or damage is ours, we bear the cost of collecting the product.</p>
<h2>5. Refunds</h2>
<p>Approved refunds are made within <b>${REF} working days</b>, to the original payment method. For cash-on-delivery orders, we will refund by bank transfer or UPI to the details you give us. Your bank may take extra time to show the refund.</p>
<h2>6. Cancelling an order</h2>
<p>You can cancel an order before we dispatch it by calling or messaging us. After dispatch, this Return &amp; Refund Policy applies.</p>
<h2>7. Contact us</h2>${CONTACT}`);

let h=fs.readFileSync('public/index.html','utf8');
const sections=privacy+'\n'+terms+'\n'+returns+'\n';
const m=h.search(/<footer\b/);
if(m<0){console.error('Could not find the footer. Nothing changed.');process.exit(1)}
h=h.slice(0,m)+sections+h.slice(m);
const fl=/<a href="#home">Privacy<\/a> &middot; <a href="#home">Terms<\/a>/;
if(fl.test(h)) h=h.replace(fl,'<a href="#privacy">Privacy</a> &middot; <a href="#terms">Terms</a> &middot; <a href="#returns">Returns</a>'); else console.log('Note: footer Privacy/Terms links not found - add links manually.');
const had=h.includes('Karmabumi'); h=h.split('Karmabumi').join('Karmabhumi'); if(had) console.log('Fixed spelling: Karmabumi -> Karmabhumi');
fs.writeFileSync('public/index.html',h);
let s=fs.readFileSync('public/script.js','utf8');
const pr=/var PAGES=\[([^\]]*)\]/;
if(!pr.test(s)){console.error('PAGES list not found in script.js. Restore backups.');process.exit(1)}
s=s.replace(pr,(x,a)=>'var PAGES=['+a+',"privacy","terms","returns"]');
fs.writeFileSync('public/script.js',s);
fs.appendFileSync('public/home.css',`
/* ===== legal pages ===== */
.legal{max-width:820px!important;padding-top:34px!important;padding-bottom:56px!important}
.legal h1{font-size:clamp(28px,4vw,40px);margin:8px 0 6px}
.legal .upd{opacity:.7;font-size:14px;margin:0 0 22px}
.legal h2{font-size:clamp(19px,2.2vw,23px);margin:30px 0 8px}
.legal p,.legal li{font-size:17px;line-height:1.7}
.legal ul{padding-left:22px;margin:8px 0}
.legal li{margin:5px 0}
.legal .note{border-left:4px solid #e3a817;background:var(--card);padding:14px 18px;border-radius:8px}
.legal-nav{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.legal-nav a{text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:7px 16px;font-size:14px;font-weight:600}
.legal-nav a[aria-current="page"]{background:#e3a817;border-color:#e3a817;color:#123420}
`);
console.log('Added: Privacy Policy, Terms & Conditions, Return & Refund Policy');
JS
echo "Done. Restart the server (Ctrl+C, then npm start) and refresh with Cmd+Shift+R."
