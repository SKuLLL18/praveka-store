/* SCRIPT.JS - the website's behaviour (search, filters, cart, product page).
   You normally do NOT need to edit this file. Products live in products.js. */

var CC={};CATS.forEach(function(c){CC[c[0]]=c[1]});
var cat="All",term="",productSort="az",$=function(i){return document.getElementById(i)};
var P=[],OFFERS=[],OFFERS_READY=false;
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function setP(list){P=list.filter(function(p){return p.hidden!==true}).map(function(p){var q=JSON.parse(JSON.stringify(p));q.rn=q.n||"";["n","t","desc","mode","features","crops","pests","dose","brand","head","ftype","form","conc","apptype","phys","ptype","moq","video","brochure"].forEach(function(k){q[k]=esc(q[k]||"")});q.images=(q.images||[]).map(esc);q.sizes=q.sizes.map(function(z){return[esc(z[0]),z[1],z[2]]});q.col=CC[q.c]||"#3f8a4c";return q})}
function updateRangeCounts(){document.querySelectorAll("[data-range-count]").forEach(function(el){var category=el.dataset.rangeCount;el.textContent=P.filter(function(p){return p.c===category}).length})}
function rs(n){return "Rs. "+Math.round(n).toLocaleString("en-IN")}
function isLiquidProduct(p){return p&&p.sizes.some(function(z){var m=packMeasure(z[0]);return m&&m.unit==="litre"})}
function formatPackLabel(label){return String(label).replace(/\b(litre|litres|liter|liters)\b/ig,"L")}
function liquidPackOptions(p){return p.sizes.map(function(z,i){var m=packMeasure(z[0]);return m&&m.unit==="litre"?{i:i,label:formatPackLabel(z[0]),litres:m.amount,price:Number(z[1]),mrp:Number(z[2])}:null}).filter(Boolean)}
function packsForAmount(amount,packAmount){return Math.ceil(amount/packAmount)}
function actualLitres(label,qty){var m=packMeasure(label);return m&&m.unit==="litre"?m.amount*qty:null}
function quantityLabel(amount,unit){return amount.toLocaleString("en-IN")+" "+(unit==="litre"?"L":unit==="kg"?"kg":amount===1?"piece":"pieces")}
function parseMinimumOrder(value){var measure=packMeasure(value);if(measure)return measure;var count=String(value||"").toLowerCase().match(/([\d.]+)\s*(?:pieces?|pcs?|packs?|bottles?|units?|each|ea)\b/);return count?{amount:Number(count[1]),unit:"piece"}:null}
function minimumPackCount(p,sizeIndex){var size=p&&p.sizes[sizeIndex],measure=size&&packMeasure(size[0]),rule=orderRule(p);if(!rule)return 1;if(rule.unit==="piece")return Math.max(1,Math.ceil(rule.amount));return measure&&measure.unit===rule.unit?Math.max(1,packsForAmount(rule.amount,measure.amount)):0}
function normalizePackQuantity(p,sizeIndex,qty){var step=minimumPackCount(p,sizeIndex);return step?Math.max(step,Math.ceil(qty/step)*step):Math.max(1,qty)}
function productOrderRule(p){return orderRule(p)}
function moneyMarkup(price,mrp){return rs(price)+(Number(mrp)>0?' <s>'+rs(mrp)+'</s>':"")}
function packPrices(p){return liquidPackOptions(p).map(function(x){return '<span>'+x.label+' · '+moneyMarkup(x.price,x.mrp)+'</span>'}).join("")}
function cardPrice(p){if(isLiquidProduct(p))return '<span class="price pack-price-list">'+packPrices(p)+'</span>';var s=p.sizes[0];return '<span class="price">From '+moneyMarkup(s[1],s[2])+'</span>'}
function stockNotice(p){return p&&p.deliverable===false?'<span class="stock-out">Out of stock · <a href="#contact">Contact us for details</a></span>':""}
function returnsNotice(linked){return '<span class="returns-note">No returns or refunds after purchase'+(linked?', except where required by law or if we cannot fulfil your order. <a href="#refund">Policy details</a>':'.')+'</span>'}
function deliveryChargeNotice(prominent){return prominent?'<div class="delivery-charge-note delivery-charge-prominent"><b>Delivery charge is additional</b><span>We will contact you before dispatch and share the delivery-charge receipt. Pay this charge to the courier at your doorstep. <a href="#shipping">Shipping policy</a></span></div>':'<span class="delivery-charge-note">Delivery charge extra · receipt shared before dispatch · pay courier at doorstep</span>'}
function bottleSelectionError(p){var sizes=liquidPackOptions(p).map(function(x){return x.label});var list=sizes.length>1?sizes.slice(0,-1).join(", ")+" or "+sizes[sizes.length-1]:sizes[0]||"available pack";return"Please select a bottle size ("+list+") first."}
function bottle(c){return '<div class="pic" style="--tint:'+c+'"><div class="bottle"><i></i></div></div>'}
function tiles(){$("tiles").innerHTML=CATS.map(function(c){var s=c[0].toLowerCase().replace(/[^a-z]+/g,"-").replace(/-$/,""),slug=c[0]==="PGR & Nutrition"?"pgr-and-nutrition":s;return '<a class="tile" href="/category/'+slug+'" data-c="'+c[0]+'"><i style="--tint:'+c[1]+'"><img src="images/category-'+s+'.svg" alt="'+esc(c[0])+'" loading="lazy" width="72" height="72"></i>'+c[0]+'</a>'}).join("")}
function cats(){var a=["All"].concat(CATS.map(function(c){return c[0]}));
$("cats").innerHTML=a.map(function(x){return '<button class="chip" aria-pressed="'+(x==cat)+'" data-c="'+x+'">'+x+'</button>'}).join("")}
function grid(){var l=P.filter(function(p){return (cat=="All"||p.c==cat)&&(!term||(p.n+p.t+p.c).toLowerCase().indexOf(term)>-1)});l.sort(function(a,b){var order=(a.rn||a.n).localeCompare(b.rn||b.n,"en",{sensitivity:"base"});return productSort==="za"?-order:order});
$("grid").innerHTML=l.length?l.map(function(p){return '<a class="card'+(p.deliverable===false?" card-out":"")+'" href="/products/'+encodeURIComponent(p.id)+'">'+(p.sale?'<span class="tag">Sale</span>':'')+pic(p)+'<div class="cb"><h3>'+p.n+'</h3><div class="tech">'+p.c+'</div>'+stockNotice(p)+cardPrice(p)+returnsNotice()+deliveryChargeNotice(false)+'</div></a>'}).join(""):'<p class="ph">No products found.</p>'}
function pic(p,i){var u=p.images&&p.images[i||0];return u?'<div class="pic"><img src="'+u+'" alt="'+p.n+'" loading="lazy" width="500" height="375"></div>':bottle(p.col)}
function specRows(p){var R=[["Formulation Type",p.ftype],["Form",p.form],["Concentration",p.conc],["Application Type",p.apptype],["Physical Form",p.phys],["Packaging Size",p.sizes.map(function(z){return z[0]}).join(", ")],["Brand",p.brand],["Dosage",p.dose],["Packaging Type",p.ptype],["Technical Name",p.t]];
return R.filter(function(r){return r[1]}).map(function(r){return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td></tr>'}).join("")}
function detailBody(p){var sp=specRows(p),h="";
if(sp)h+='<table>'+sp+'</table>';
if(p.head)h+='<h3 style="margin:14px 0 8px">'+p.head+'</h3>';
if(p.desc)h+='<p style="max-width:75ch">'+p.desc+'</p>';
var L=(p.features||"").split("\n").filter(function(x){return x.trim()});
if(p.mode)L.push("Mode of Action: "+p.mode);if(p.pests)L.push("Targets: "+p.pests);if(p.crops)L.push("Ideal for crops like: "+p.crops);
if(L.length)h+='<h3 style="margin:14px 0 6px">Key features</h3><ul class="kf">'+L.map(function(x){var m=x.match(/^([^:]{2,40}):\s*(.+)$/);return '<li>'+(m?'<b>'+m[1]+':</b> '+m[2]:x)+'</li>'}).join("")+'</ul>';
if(!p.head&&!p.desc&&!L.length&&(sp.match(/<tr>/g)||[]).length<=1)h+='<p class="ph">Product details will appear here. Add them in the admin page, or import a CSV file.</p>';return h}
function detailAside(p){return '<div class="detail-aside"><span class="eyebrow">QUICK VIEW</span><h3>Plan with the product details</h3>'+(p.deliverable===false?'<div class="bulk-highlight stock-panel"><b>Out of stock</b><span>This product is currently unavailable. <a href="#contact">Contact us for more details.</a></span></div>':'')+'<div><b>Category</b><span>'+p.c+'</span></div><div><b>Technical name</b><span>'+p.t+'</span></div><div><b>Suitable crops</b><span>'+(p.crops||"Check the product label for approved crops.")+'</span></div><div><b>Available packs</b><span>'+p.sizes.map(function(z){return formatPackLabel(z[0])}).join(" · ")+'</span></div><p>Always read and follow the product label before use. Ask our team if you need help comparing options.</p><a class="btn w" href="#contact">Ask about this product</a></div>'}
function detail(id){var p=P.find(function(x){return x.id==id});if(!p){location.hash="products";return}
var liquid=isLiquidProduct(p),rule=orderRule(p),usesBottlePicker=liquid&&p.sizes.every(function(size){var measure=packMeasure(size[0]);return measure&&measure.unit==="litre"}),vi=usesBottlePicker?-1:0,q=1,im=0,pin="";
function draw(){var selected=vi>=0,size=selected?p.sizes[vi]:null,measure=size&&packMeasure(size[0]),rule=orderRule(p),productRule=productOrderRule(p),step=selected?minimumPackCount(p,vi):0,packQty=selected?(rule?(step||1)*q:q):q,pr=selected?p.sizes[vi][1]*packQty:null,mp=selected?p.sizes[vi][2]*packQty:null;
var th=(p.images||[]).length>1?p.images.map(function(u,i){return '<button class="th" data-i="'+i+'" aria-pressed="'+(i==im)+'" aria-label="Image '+(i+1)+' of '+p.n+'"><img src="'+u+'" alt="'+p.n+' product image '+(i+1)+'" loading="lazy" width="64" height="64"></button>'}).join(""):"";
var sim=P.filter(function(x){return x.id!=p.id&&x.c==p.c}).concat(P.filter(function(x){return x.c!=p.c})).slice(0,4);
var quantityInfo=rule&&rule.unit==="piece"?quantityLabel(packQty,"piece")+" · "+packQty+" packs":measure?quantityLabel(measure.amount*packQty,measure.unit)+" · "+packQty+(measure.unit==="litre"?" bottles":" packs"):packQty+" packs";
var pricePanel=usesBottlePicker?(selected?'<div class="price liquid-total" style="font-size:26px;margin-top:8px">'+moneyMarkup(pr,mp)+(mp>pr?'<span class="off">Saving '+rs(mp-pr)+'</span>':'')+'</div><p class="liquid-summary">'+quantityInfo+' total'+(rule?' (minimum order '+quantityLabel(rule.amount,rule.unit)+')':'')+'</p>':'<p class="pack-prompt">'+bottleSelectionError(p)+'</p>'):'<div class="price" style="font-size:26px;margin-top:8px">'+moneyMarkup(pr,mp)+(mp>pr?'<span class="off">Saving '+rs(mp-pr)+'</span>':'')+'</div>'+(rule?'<p class="liquid-summary">'+quantityInfo+' total (minimum order '+quantityLabel(rule.amount,rule.unit)+')</p>':"");
 $("detailView").innerHTML='<a href="#products">Back to products</a><div class="detail"><div class="detail-side">'+pic(p,im)+(th?'<div class="thumbs">'+th+'</div>':'')+(p.video?'<p><a href="'+p.video+'" target="_blank" rel="noopener">Watch product video</a></p>':'')+detailAside(p)+'</div><div><h1>'+p.n+'</h1>'+(p.brand?'<div class="tech">Brand: '+p.brand+'</div>':'')+pricePanel+returnsNotice(true)+deliveryChargeNotice(true)+(usesBottlePicker?'<h3 class="pack-step">Step 1: Choose bottle size</h3><div class="vars pack-options" role="group" aria-label="Bottle size">'+liquidPackOptions(p).map(function(v){return '<button class="var pack-option" data-v="'+v.i+'" aria-pressed="'+(v.i===vi)+'"><b>'+v.label+'</b><span>'+moneyMarkup(v.price,v.mrp)+'</span></button>'}).join("")+'</div>':'<div class="vars" role="group" aria-label="Pack size">'+p.sizes.map(function(v,i){return '<button class="var" data-v="'+i+'" aria-pressed="'+(i==vi)+'">'+v[0]+'</button>'}).join("")+'</div>')+(step===0&&selected&&rule?'<p class="cart-minimum" role="alert">Minimum order quantity ('+quantityLabel(rule.amount,rule.unit)+') does not match this pack size ('+formatPackLabel(size[0])+'). Choose a compatible pack size or contact us.</p>':'')+(productRule||p.moq?'<p style="margin:4px 0">Minimum order quantity: <b>'+(productRule?quantityLabel(productRule.amount,productRule.unit):p.moq)+'</b></p>':'')+(p.brochure?'<p style="margin:4px 0"><a href="'+p.brochure+'" target="_blank" rel="noopener">Product brochure (PDF)</a></p>':'')+(usesBottlePicker&&selected?'<h3 class="pack-step">Step 2: Choose quantity</h3>':'')+(usesBottlePicker&&!selected?'':'<div class="row"><span class="qty"><button data-q="-1" aria-label="Less">-</button><span>'+q+'</span><button data-q="1" aria-label="More">+</button></span><button class="btn" id="add"'+(step===0&&selected&&rule?' disabled':'')+'>Add to cart</button></div><button class="btn alt w" id="buy"'+(step===0&&selected&&rule?' disabled':'')+'>Buy now</button>')+'<div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><a class="btn alt" href="tel:+916359414594">Call +91 63594 14594</a><a class="btn alt" href="tel:+918487888667">Call +91 84878 88667</a></div><div class="box"><b>Need bulk quantity?</b>Contact us for bulk order pricing. <a href="#contact">Contact us</a></div><div class="box"><b>Check delivery</b>Enter an Indian 6-digit PIN code to check delivery.<div class="pin"><input id="pc" inputmode="numeric" maxlength="6" placeholder="e.g. 360004" value="'+pin+'" aria-label="Indian PIN code"><button id="chk">Check</button></div><div id="pm" style="margin-top:6px"></div></div></div></div>'+
(p.deliverable===false?'<div class="stock-cta"><b>Out of stock</b><span>Contact us for availability and more details.</span><a class="btn" href="#contact">Contact us</a></div>':'')+'<div class="detail-lower"><section class="detail-copy"><h2 style="font-size:24px">Product details</h2>'+detailBody(p)+'</section><section class="detail-feedback"><h2 style="font-size:24px;margin:0 0 10px">Customer reviews</h2><div id="reviewList" class="rv">Loading reviews…</div><form id="reviewForm" class="review-form"><h3>Share your experience</h3><p class="tech">Bought this product? Tell other growers how it worked for you.</p><label>Your name<input name="name" required maxlength="80"></label><label>Mobile number<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" minlength="10" pattern="[6-9][0-9]{9}" required title="Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9" placeholder="10-digit mobile number"></label><p class="tech">Your mobile number will not be shown with your review.</p><label>Rating<select name="rating" required><option value="">Choose stars</option><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Very good</option><option value="3">★★★ Good</option><option value="2">★★ Needs improvement</option><option value="1">★ Poor</option></select></label><label>Your review<textarea name="comment" rows="3" maxlength="1000" required placeholder="Share useful details about your experience"></textarea></label><p id="reviewMessage" class="tech"></p><button class="btn">Submit review</button></form></section></div>'+
'<h2 style="font-size:24px;margin:26px 0 10px">You may also like</h2><div class="grid">'+sim.map(function(s){return '<button class="card" data-id="'+s.id+'">'+pic(s)+'<div class="cb"><h3>'+s.n+'</h3><div class="tech">'+s.c+'</div>'+cardPrice(s)+returnsNotice(false)+deliveryChargeNotice(false)+'</div></button>'}).join("")+'</div>';
var qtyLabel=$("detailView").querySelector(".qty span");if(qtyLabel)qtyLabel.textContent=rule?quantityInfo:q;
$("detailView").onclick=function(e){var b=e.target.closest("button");if(!b)return;
if(b.dataset.v!=null){vi=+b.dataset.v;q=1;draw()}else if(b.dataset.i!=null){im=+b.dataset.i;draw()}else if(b.dataset.q){q=Math.max(1,q+ +b.dataset.q);draw()}
else if(b.id=="add"){if(usesBottlePicker&&vi<0)return toast(bottleSelectionError(p));if(p.deliverable===false)return toast("This product is out of stock. Contact us for more details.");addCart(p.id,vi,packQty);toast((quantityInfo||q+" pack")+" of "+p.n+" added to cart")}
else if(b.id=="buy"){if(usesBottlePicker&&vi<0)return toast(bottleSelectionError(p));if(p.deliverable===false)return;addCart(p.id,vi,packQty);location.hash="cart"}
else if(b.id=="chk"){pin=$("pc").value;lookupPincode(pin,$("pm"))}
else if(b.dataset.id){location.hash="p/"+b.dataset.id}}
bindReviews();loadReviews()}
function bindReviews(){var reviewForm=$("reviewForm");if(!reviewForm)return;
var phoneField=reviewForm.elements.phone;phoneField.addEventListener("input",function(){var clean=phoneField.value.replace(/\D/g,"").slice(0,10);if(phoneField.value!==clean)phoneField.value=clean});
reviewForm.onsubmit=function(e){e.preventDefault();var f=e.target,button=f.querySelector("button"),message=$("reviewMessage");button.disabled=true;message.textContent="Submitting…";post("/api/products/"+encodeURIComponent(p.id)+"/reviews",{name:f.name.value,phone:f.phone.value,rating:f.rating.value,comment:f.comment.value}).then(function(){f.reset();message.textContent="Thank you. Your review is now visible.";loadReviews()}).catch(function(er){message.textContent=er.message}).finally(function(){button.disabled=false})}}
function loadReviews(){fetch("/api/products/"+encodeURIComponent(p.id)+"/reviews").then(function(r){if(!r.ok)throw new Error("Could not load reviews");return r.json()}).then(function(reviews){var list=$("reviewList");if(!reviews.length){list.textContent="No reviews yet. Be the first to share your experience.";return}list.innerHTML=reviews.map(function(r){return '<article class="review"><div><b>'+esc(r.name)+'</b><span class="stars" aria-label="'+r.rating+' out of 5 stars">'+("★".repeat(r.rating))+'</span></div><p>'+esc(r.comment)+'</p></article>'}).join("")}).catch(function(){$("reviewList").textContent="Reviews are temporarily unavailable."})}
draw()}
function toast(m){var t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("on")},2200)}

/* ---------- CROP DIRECTORY ---------- */
var CROP_FILTERS=["All","Kharif","Rabi","Zaid","Vegetables","Fruits","Pulses","Oilseeds","Spices","Commercial"];
var CROPS=[],CROPS_READY=false;
var cropQuery="",cropFilter="All";
var CUSTOM_CROP_ICONS={"rice":true,"chickpea":true,"okra":true,"cumin":true,"coriander":true,"pomegranate":true,"cotton":true,"sesame":true,"green-gram":true,"black-gram":true};
function cropIcon(c){return CUSTOM_CROP_ICONS[c.slug]?'<img src="images/crops/'+c.slug+'.svg" alt="'+esc(c.name)+' crop icon">':esc(c.icon)}
function cropMatchesProducts(c){
 var words=(c.match+" "+c.name).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
 return P.filter(function(p){var s=((p.crops||"")+" "+(p.n||"")+" "+(p.t||"")).toLowerCase();return words.some(function(w){return w.length>3&&s.indexOf(w)>-1})}).slice(0,6);
}
function renderCropFilters(){
 var el=$("cropFilters");if(!el)return;
 el.innerHTML=CROP_FILTERS.map(function(x){return '<button class="crop-chip" data-crop-filter="'+x+'" aria-pressed="'+(x==cropFilter)+'">'+x+'</button>'}).join("");
}
function renderCrops(){
 var el=$("cropGrid");if(!el)return;
 var list=CROPS.filter(function(c){return (cropFilter=="All"||c.season==cropFilter||c.types.indexOf(cropFilter)>-1)&&(!cropQuery||(c.name+" "+c.local+" "+c.match).toLowerCase().indexOf(cropQuery)>-1)});
 el.innerHTML=list.length?list.map(function(c){return '<a class="crop-card" href="/crops/'+encodeURIComponent(c.slug)+'"><span class="crop-icon">'+cropIcon(c)+'</span><span class="crop-card-main"><b>'+esc(c.name)+'</b><small>'+esc(c.local)+'</small><em>'+esc(c.season)+' · '+esc(c.duration)+'</em></span><span class="crop-arrow">→</span></a>'}).join(""):'<div class="crop-empty">No crops found. Try another crop name.</div>';
}
function renderCropDetail(slug){
 var c=CROPS.find(function(x){return x.slug==slug});if(!c){if(CROPS_READY)location.hash="crops";return}
 var rec=cropMatchesProducts(c);
 $("cropDetailView").innerHTML='<a class="crop-back" href="#crops">← Back to all crops</a>'+
 '<div class="crop-detail-hero"><div class="crop-detail-icon">'+cropIcon(c)+'</div><div><span class="eyebrow">FIELD NOTE</span><h1>'+esc(c.name)+'</h1><p>'+esc(c.local)+'</p><div class="crop-meta"><span>'+esc(c.season)+'</span><span>'+esc(c.duration)+'</span></div></div></div>'+
 '<div class="crop-layout"><main><section class="crop-info-card"><h2>Start with the basics</h2><p>'+esc(c.grow)+'</p><h3>Best fit for this crop</h3><p>'+esc(c.soil)+'</p><h3>Planting window</h3><p>'+esc(c.sowing)+'</p></section>'+
 '<section class="crop-info-card"><h2>Care through the season</h2><p>'+esc(c.maintain)+'</p></section>'+
 '<section class="crop-info-card"><h2>Know when to harvest</h2><p>'+esc(c.harvest)+'</p></section></main>'+
 '<aside><div class="crop-side-card"><h3>Explore Praveka support</h3><p>These catalogue products share a crop or use-case match. Confirm the label, dose and local recommendation before application.</p>'+
 (rec.length?'<div class="crop-products">'+rec.map(function(p){return '<a class="mini-product" href="/products/'+encodeURIComponent(p.id)+'">'+pic(p)+'<span><b>'+p.n+'</b><small>'+p.c+'</small></span><i>→</i></a>'}).join("")+'</div>':'<p class="crop-empty">No matching products yet. Contact us for crop-specific recommendations.</p>')+
 '<a class="btn w" href="#contact">Ask Praveka for advice</a></div><div class="crop-side-card crop-warning"><b>Important</b><p>Use only products approved for the crop and target pest/disease in your region. Always follow the product label, dose, waiting period and local agricultural guidance.</p></div></aside></div>';
}
function initCrops(){
 var count=$("cropCount");
 fetch("/api/crops").then(function(response){if(!response.ok)throw new Error("Could not load crop guides");return response.json()}).then(function(crops){
  if(!Array.isArray(crops))throw new Error("Crop guide data is invalid");
  CROPS=crops;CROPS_READY=true;if(count)count.textContent=CROPS.length;renderCropFilters();renderCrops();
  var match=location.hash.match(/^#crop\/(.+)/);if(match)renderCropDetail(match[1]);
 }).catch(function(error){console.error(error.message);var grid=$("cropGrid");if(grid)grid.innerHTML='<div class="crop-empty">Crop guides are temporarily unavailable.</div>'});
 renderCropFilters();renderCrops();
 var s=$("cropSearch");if(s)s.oninput=function(){cropQuery=s.value.trim().toLowerCase();renderCrops()};
 var f=$("cropFilters");if(f)f.onclick=function(e){var b=e.target.closest("[data-crop-filter]");if(!b)return;cropFilter=b.dataset.cropFilter;renderCropFilters();renderCrops()};
 var d=$("cropDetailView");if(d)d.onclick=function(e){var b=e.target.closest("button[data-id]");if(b)location.hash="p/"+b.dataset.id};
}

var PAGES=["home","about","crops","products","offers","contact","cart","privacy","terms","refund","shipping"];
var FARMER_REACH=[
 ["Andhra Pradesh",210000],["Arunachal Pradesh",51500],["Assam",135000],["Bihar",280000],["Chandigarh",56000],["Chhattisgarh",160000],["Dadra and Nagar Haveli",50500],["Daman and Diu",53500],["Delhi",57500],["Goa",54000],["Gujarat",340000],["Haryana",130000],["Himachal Pradesh",77500],["Jammu and Kashmir",90000],["Jharkhand",120000],["Karnataka",270000],["Kerala",87500],["Lakshadweep",50250],["Madhya Pradesh",345000],["Maharashtra",390000],["Manipur",53500],["Meghalaya",55000],["Mizoram",51750],["Nagaland",52250],["Odisha",192500],["Puducherry",51000],["Punjab",155000],["Rajasthan",315000],["Sikkim",50500],["Tamil Nadu",255000],["Telangana",202500],["Tripura",52750],["Uttar Pradesh",475000],["Uttarakhand",72500],["West Bengal",245000]
];
var FARMER_STATE_CODES={"Andhra Pradesh":"AP","Arunachal Pradesh":"AR","Assam":"AS","Bihar":"BR","Chandigarh":"CH","Chhattisgarh":"CG","Dadra and Nagar Haveli":"DNH","Daman and Diu":"DD","Delhi":"DL","Goa":"GA","Gujarat":"GJ","Haryana":"HR","Himachal Pradesh":"HP","Jammu and Kashmir":"JK","Jharkhand":"JH","Karnataka":"KA","Kerala":"KL","Lakshadweep":"LD","Madhya Pradesh":"MP","Maharashtra":"MH","Manipur":"MN","Meghalaya":"ML","Mizoram":"MZ","Nagaland":"NL","Odisha":"OD","Puducherry":"PY","Punjab":"PB","Rajasthan":"RJ","Sikkim":"SK","Tamil Nadu":"TN","Telangana":"TS","Tripura":"TR","Uttar Pradesh":"UP","Uttarakhand":"UK","West Bengal":"WB"};
var REDUCED_REACH_CODES=["GA","DD","DL","SK"];
var HIDDEN_MAP_CODES=["LD","PY"];
function showFarmerReach(path){
 var name=path.dataset.state||path.getAttribute("aria-label"),item=FARMER_REACH.filter(function(state){return state[0]===name})[0];
 if(!item)return;
 var heading=$("reachStateName");heading.textContent=item[0];heading.style.fontSize="";
 var headingSize=parseFloat(getComputedStyle(heading).fontSize);
 while(heading.scrollWidth>heading.clientWidth&&headingSize>14){headingSize-=1;heading.style.fontSize=headingSize+"px"}
 var count=item[1]/(REDUCED_REACH_CODES.indexOf(FARMER_STATE_CODES[item[0]])>-1?4:1);
 $("reachStateCount").textContent=count.toLocaleString("en-IN")+"+ farmers using our products";
}
function stateLabelPoint(region,svg){
 var box=region.getBBox(),length=region.getTotalLength(),samples=Math.max(32,Math.min(96,Math.ceil(length/8))),edge=[],point=svg.createSVGPoint();
 for(var i=0;i<samples;i++)edge.push(region.getPointAtLength(length*i/samples));
 var best=null;
 function consider(x,y){
  point.x=x;point.y=y;if(!region.isPointInFill(point))return;
  var distance=Infinity;
  for(var j=0;j<edge.length;j++){var dx=edge[j].x-x,dy=edge[j].y-y,d=dx*dx+dy*dy;if(d<distance)distance=d}
  if(!best||distance>best.distance)best={x:x,y:y,distance:distance};
 }
 var stepsX=Math.max(16,Math.min(36,Math.ceil(box.width/4))),stepsY=Math.max(16,Math.min(36,Math.ceil(box.height/4)));
 for(var row=0;row<stepsY;row++)for(var col=0;col<stepsX;col++)consider(box.x+box.width*(col+.5)/stepsX,box.y+box.height*(row+.5)/stepsY);
 if(best){
  var stepX=box.width/stepsX,stepY=box.height/stepsY;
  for(var round=0;round<2;round++){
   var centerX=best.x,centerY=best.y;
   for(var oy=-2;oy<=2;oy++)for(var ox=-2;ox<=2;ox++)consider(centerX+ox*stepX,centerY+oy*stepY);
   stepX/=2;stepY/=2;
  }
  return best;
 }
 return region.getPointAtLength(length/2);
}
function initIndiaMap(){
 var mount=$("indiaMap");if(!mount)return;
 fetch("images/india-states-map.svg").then(function(response){if(!response.ok)throw new Error("Could not load India map");return response.text()}).then(function(source){
  var parsed=new DOMParser().parseFromString(source,"image/svg+xml"),map=parsed.documentElement;
  if(parsed.querySelector("parsererror")||map.localName!=="svg")throw new Error("India map data is invalid");
  map.setAttribute("role","group");map.setAttribute("aria-label","Interactive map of India's state and territory regions");map.setAttribute("focusable","false");
  var andamanRegion=map.querySelector("#an");if(andamanRegion)andamanRegion.remove();
  var colors=["#3978d4","#8664c8","#e0a52f","#dc6d61","#5268b7","#b45c91"];
  Array.prototype.forEach.call(map.querySelectorAll("path[aria-label]"),function(region,index){
   region.classList.add("india-map-region");region.setAttribute("tabindex","0");region.setAttribute("role","button");
   region.style.setProperty("--region-color",colors[index%colors.length]);
   var estimate=FARMER_REACH.filter(function(state){return state[0]===region.getAttribute("aria-label")})[0];
   if(estimate){var count=estimate[1]/(REDUCED_REACH_CODES.indexOf(FARMER_STATE_CODES[estimate[0]])>-1?4:1);region.setAttribute("aria-label",estimate[0]+": "+count.toLocaleString("en-IN")+"+ farmers using our products");region.dataset.state=estimate[0];}
  });
  var svg=document.importNode(map,true);mount.replaceChildren(svg);
  var labels=document.createElementNS("http://www.w3.org/2000/svg","g");labels.setAttribute("class","india-map-labels");labels.setAttribute("aria-hidden","true");
  Array.prototype.forEach.call(svg.querySelectorAll("path[data-state]"),function(region){
   var code=FARMER_STATE_CODES[region.dataset.state];if(HIDDEN_MAP_CODES.indexOf(code)>-1)return;
   var box=region.getBBox(),center=stateLabelPoint(region,svg),centerX=center.x,centerY=center.y,label=document.createElementNS("http://www.w3.org/2000/svg","text"),fontSize=Math.max(4,Math.min(14,box.width*.09,box.height*.1));
   label.setAttribute("x",centerX);label.setAttribute("y",centerY);label.setAttribute("text-anchor","middle");label.setAttribute("dominant-baseline","central");label.setAttribute("font-size",fontSize);label.textContent=code;
   labels.appendChild(label);
  });
  var north=document.createElementNS("http://www.w3.org/2000/svg","g");north.setAttribute("class","india-map-north");
  var northText=document.createElementNS("http://www.w3.org/2000/svg","text");northText.setAttribute("x","585");northText.setAttribute("y","65");northText.setAttribute("text-anchor","middle");northText.textContent="N";
  var northArrow=document.createElementNS("http://www.w3.org/2000/svg","path");northArrow.setAttribute("d","M579 84L585 71L591 84Z");
  north.appendChild(northText);north.appendChild(northArrow);labels.appendChild(north);
  svg.appendChild(labels);mount.setAttribute("aria-busy","false");
  mount.addEventListener("pointerover",function(event){var region=event.target.closest(".india-map-region");if(region)showFarmerReach(region)});
  mount.addEventListener("focusin",function(event){var region=event.target.closest(".india-map-region");if(region)showFarmerReach(region)});
  mount.addEventListener("click",function(event){var region=event.target.closest(".india-map-region");if(region)showFarmerReach(region)});
 }).catch(function(error){mount.setAttribute("aria-busy","false");mount.textContent="The India map is temporarily unavailable.";console.error(error.message)});
}
function initVisitorCounter(){
 var el=$("visitorCount");if(!el)return;
 fetch("/api/visits",{cache:"no-store"}).then(function(response){if(!response.ok)throw new Error("Could not update website visit count");return response.json()}).then(function(result){
  if(!Number.isSafeInteger(result.count)||result.count<50001)throw new Error("Website visit count response is invalid");
  el.textContent=result.count.toLocaleString("en-IN");
 }).catch(function(error){el.textContent="Unavailable";console.error(error.message)});
}
function initAboutMetrics(){initIndiaMap();initVisitorCounter()}
function closeMobileNav(){var nav=document.querySelector(".links"),button=$("bg");nav.classList.remove("open");button.setAttribute("aria-expanded","false");button.setAttribute("aria-label","Open navigation menu")}
function route(){var h=location.hash.slice(1),m=h.match(/^p\/(.+)/),cm=h.match(/^crop\/(.+)/),pg=(m?"products":(cm?"crops":(PAGES.indexOf(h)>-1?h:"home"))),key=m?"detail":(cm?"cropdetail":pg);
document.querySelectorAll(".pg").forEach(function(e){e.classList.toggle("hide",e.dataset.p.split(" ").indexOf(key)<0)});
if(m)detail(m[1]);if(cm)renderCropDetail(cm[1]);
document.querySelectorAll(".links a").forEach(function(a){a.removeAttribute("aria-current");if(a.getAttribute("href")=="#"+pg)a.setAttribute("aria-current","page")});
closeMobileNav();scrollTo(0,0);
if(pg=="cart")renderCart();if(pg=="offers"){renderOffers();refreshStoreProducts()}}
document.addEventListener("click",function(e){
var season=e.target.closest("[data-season]");
if(season){cropFilter=season.dataset.season;cropQuery="";renderCropFilters();renderCrops();setTimeout(function(){var d=$("cropDirectory");if(d)d.scrollIntoView({behavior:"smooth",block:"start"})},0);return}
var c=e.target.closest("[data-c]");if(c){cat=c.dataset.c;term="";$("q").value="";cats();grid();return}
var combo=e.target.closest("[data-offer-add]");if(combo){addComboCart(combo.dataset.offerAdd);return}
var k=e.target.closest("#grid .card,#fgrid .card,.offer-card,.combo-product");if(k&&k.tagName==="BUTTON")location.hash="p/"+k.dataset.id});
function offerCard(p){return '<button class="card offer-card'+(p.deliverable===false?" card-out":"")+'" data-id="'+p.id+'">'+(p.sale?'<span class="tag">Sale</span>':'')+pic(p)+'<div class="cb"><h3>'+p.n+'</h3><div class="tech">'+p.c+'</div>'+stockNotice(p)+cardPrice(p)+returnsNotice(false)+deliveryChargeNotice(false)+'</div></button>'}
function comboCard(offer,i){var items=offer.items.map(function(item){var p=item.productId&&P.find(function(product){return product.id===item.productId}),quantity=item.quantity||1,quantityText=quantity>1?" × "+quantity+" "+(item.quantityUnit||"packs"):"";return p?'<button class="combo-product" data-id="'+p.id+'">'+pic(p)+'<span>'+esc(item.name)+'</span><small>'+esc(item.pack)+quantityText+' · '+rs(item.unitPrice*quantity)+'</small></button>':'<div class="combo-product combo-custom"><span class="combo-custom-mark" aria-hidden="true">＋</span><b>'+esc(item.name)+'</b><small>'+esc(item.pack)+quantityText+' · '+rs(item.unitPrice*quantity)+'</small></div>'}).join('<span class="plus" aria-hidden="true">+</span>'),description=offer.description?esc(offer.description):"Choose a complete product combination at the offer price.",savings=Number(offer.individualTotal)-Number(offer.price),many=offer.items.length>2?" combo-products-many":"";return '<article class="combo-card"><div class="combo-products'+many+'">'+items+'</div><div class="combo-copy"><span class="eyebrow">COMBO '+String(i+1).padStart(2,"0")+'</span><h3>'+esc(offer.title)+'</h3><p>'+description+'</p><div class="combo-price-breakdown"><span>Buy separately <s>'+rs(offer.individualTotal)+'</s></span><strong>Combo price '+rs(offer.price)+'</strong>'+(savings>0?'<small>You save '+rs(savings)+'</small>':'')+'</div><button class="btn" data-offer-add="'+esc(offer.id)+'">Add combo to cart</button></div></article>'}
function homeOfferCard(p){return '<button class="card offer-card home-single-offer'+(p.deliverable===false?" card-out":"")+'" data-id="'+p.id+'">'+(p.sale?'<span class="tag">Sale</span>':'')+pic(p)+'<div class="cb"><span class="home-offer-category">'+p.c+'</span><h3>'+p.n+'</h3>'+stockNotice(p)+cardPrice(p)+'<span class="home-offer-view">View offer <span aria-hidden="true">→</span></span></div></button>'}
function renderHomeOffers(){var sales=P.filter(function(p){return p.sale}).slice(0,3),sg=$("homeSaleGrid"),sc=$("homeSaleCount"),cg=$("homeComboGrid");if(sg)sg.innerHTML=sales.length?sales.map(homeOfferCard).join(""):'<p class="home-offers-empty">There are no products currently on sale.</p>';if(sc)sc.textContent=sales.length?sales.length+" offer"+(sales.length===1?"":"s"):"";if(cg)cg.innerHTML=OFFERS.length?OFFERS.slice(0,2).map(comboCard).join(""):'<p class="home-offers-empty">There are no combo offers currently available.</p>'}
function renderOffers(){var sales=P.filter(function(p){return p.sale}).slice(0,8),sg=$("saleGrid"),sc=$("saleCount");if(sg)sg.innerHTML=sales.length?sales.map(offerCard).join(""):'<p class="offer-empty-state">There are no products currently on sale.</p>';if(sc)sc.textContent=sales.length?sales.length+" available now":"";var cg=$("comboGrid");if(cg)cg.innerHTML=OFFERS.length?OFFERS.map(comboCard).join(""):'<p class="offer-empty-state">There are no combo offers currently available.</p>'}
$("sf").onsubmit=function(e){e.preventDefault();term=$("q").value.trim().toLowerCase();cat="All";cats();grid()};
if($("productSort"))$("productSort").onchange=function(e){productSort=e.target.value;grid()};
$("cartBtn").onclick=function(){location.hash="cart"};
$("nf").onsubmit=function(e){e.preventDefault();var f=e.target;post("/api/subscribe",{phone:f.elements.phone.value}).then(function(){f.reset();toast("Thanks for subscribing")}).catch(errToast)};
window.addEventListener("hashchange",route);
function feat(){var CK=["Insecticide","Fungicide","Herbicide","Fertilizer","PGR & Nutrition"];var L=CK.map(function(c){var l=P.filter(function(p){return p.c==c}),preferred=c==="Insecticide"&&P.find(function(p){return p.id==="torrento-tolfenpyrad-15-ec-insecticide"});return preferred||l.filter(function(p){return p.images&&p.images.length}).concat(l)[0]}).filter(Boolean);$("fgrid").innerHTML=L.map(function(p){return '<a class="card'+(p.deliverable===false?" card-out":"")+'" href="/products/'+encodeURIComponent(p.id)+'">'+(p.sale?'<span class="tag">Sale</span>':'')+pic(p)+'<div class="cb"><h3>'+p.n+'</h3><div class="tech">'+p.c+'</div>'+stockNotice(p)+cardPrice(p)+returnsNotice(false)+deliveryChargeNotice(false)+'</div></a>'}).join("")}
$("bg").onclick=function(){var open=document.querySelector(".links").classList.toggle("open");$("bg").setAttribute("aria-expanded",String(open));$("bg").setAttribute("aria-label",open?"Close navigation menu":"Open navigation menu")};
document.querySelector(".links").addEventListener("click",function(event){if(event.target.closest("a"))closeMobileNav()});
$("contactForm").onsubmit=function(e){e.preventDefault();var f=e.target,x=f.elements;post("/api/contact",{name:x.name.value,phone:x.phone.value,product:x.product.value,quantity:x.quantity.value,message:""}).then(function(){f.reset();cqty();toast("Thanks. We will contact you soon.")}).catch(errToast)};
var CART=[],PAYMENT_ENABLED=false;try{CART=JSON.parse(localStorage.getItem("pls_cart")||"[]")}catch(e){CART=[]}
function cleanCart(){if(!P.length)return;CART=CART.filter(function(i){if(i.kind==="combo")return !OFFERS_READY||OFFERS.some(function(o){return o.id===i.id});var p=P.find(function(x){return x.id===i.id}),q=Number(i.q),s=Number(i.s);return p&&p.deliverable!==false&&Number.isInteger(s)&&s>=0&&s<p.sizes.length&&Number.isInteger(q)&&q>0}).map(function(i){if(i.kind==="combo")return{id:i.id,kind:"combo",q:Math.max(1,Number(i.q)||1)};var s=Number(i.s),p=P.find(function(x){return x.id===i.id});return{id:i.id,s:s,q:normalizePackQuantity(p,s,Number(i.q))}})}
function updateCnt(){cleanCart();if(P.length){try{localStorage.setItem("pls_cart",JSON.stringify(CART))}catch(e){}}$("cnt").textContent=CART.reduce(function(a,i){return a+i.q},0)}
function saveCart(){try{localStorage.setItem("pls_cart",JSON.stringify(CART))}catch(e){}updateCnt()}
function addCart(id,vi,q){var p=P.find(function(x){return x.id===id});if(p&&p.deliverable===false)return toast("This product is out of stock. Contact us for more details.");var f=CART.find(function(i){return i.id==id&&i.s==vi});if(f)f.q=normalizePackQuantity(p,vi,f.q+q);else CART.push({id:id,s:vi,q:normalizePackQuantity(p,vi,q)});saveCart()}
function addComboCart(id){var offer=OFFERS.find(function(o){return o.id===id});if(!offer)return toast("This combo offer is no longer available.");var item=CART.find(function(i){return i.kind==="combo"&&i.id===id});if(item)item.q++;else CART.push({id:id,kind:"combo",q:1});saveCart();toast("Combo added to cart")}
function orderRule(p){return parseMinimumOrder(p&&p.moq)}
function packMeasure(label){var m=String(label||"").toLowerCase().match(/([\d.]+)\s*(millilitres?|milliliters?|ml|litres?|liters?|l|kilograms?|kgs?|grams?|gms?|g)\b/);if(!m)return null;var amount=Number(m[1]),unit=m[2];if(!Number.isFinite(amount)||amount<=0)return null;if(unit==="ml"||unit.indexOf("milliliter")===0||unit.indexOf("millilitre")===0)return{amount:amount/1000,unit:"litre"};if(unit==="g"||unit.indexOf("gram")===0||unit.indexOf("gm")===0)return{amount:amount/1000,unit:"kg"};if(unit==="kg"||unit.indexOf("kilogram")===0)return{amount:amount,unit:"kg"};return{amount:amount,unit:"litre"}}
function cartMinimumMessage(){var missing=[];CART.forEach(function(i){if(i.kind==="combo")return;var p=P.find(function(x){return x.id===i.id}),step=minimumPackCount(p,i.s),rule=orderRule(p);if(rule&&step===0)missing.push(p.n+" minimum order unit does not match the selected pack size");else if(rule&&i.q<step)missing.push(p.n+" requires at least "+quantityLabel(rule.amount,rule.unit))});return missing.length?"Minimum order: "+missing.join(" · "):""}
function post(u,b){return fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Something went wrong");return j})})}
function errToast(er){toast(er instanceof TypeError?"Could not reach the server. Start the backend and open the site from it.":er.message)}
function indianPincode(v){return /^[1-8]\d{5}$/.test(String(v).trim())}
function lookupPincode(pin,el){
  if(!indianPincode(pin)){el.textContent="Enter a valid Indian 6-digit PIN code.";return}
  el.textContent="Checking delivery availability…";
  fetch("https://api.postalpincode.in/pincode/"+encodeURIComponent(pin)).then(function(r){if(!r.ok)throw new Error("PIN lookup failed");return r.json()}).then(function(data){
    var offices=data&&data[0]&&data[0].Status==="Success"?data[0].PostOffice||[]:[];
    var deliverable=offices.filter(function(o){return o.DeliveryStatus==="Delivery"});
    if(!deliverable.length){el.textContent="This Indian PIN code is not currently serviceable for delivery.";return}
    var first=deliverable[0],names=deliverable.slice(0,3).map(function(o){return o.Name}).join(", ");
    el.textContent=names+" · "+first.District+", "+first.State+" — product is deliverable at your PIN code.";
  }).catch(function(){el.textContent="We could not verify this PIN right now. Please check the code and try again."});
}
function orderSummaryLines(){return CART.map(function(i){if(i.kind==="combo"){var offer=OFFERS.find(function(o){return o.id===i.id});return offer?"<li>"+esc(offer.title)+" · "+i.q+" combo"+(i.q===1?"":"s")+" · "+rs(offer.price*i.q)+"<br>"+offer.items.map(function(item){return esc(item.name)+" · "+esc(item.pack)+(item.quantity>1?" × "+item.quantity+" "+(item.quantityUnit||"packs"):"")}).join("<br>")+"</li>":""}var p=P.find(function(x){return x.id===i.id}),z=p&&p.sizes[i.s],measure=z&&packMeasure(z[0]),rule=orderRule(p);if(!z)return"";var quantity=rule&&rule.unit==="piece"?quantityLabel(i.q,"piece")+" ("+i.q+" packs)":measure?quantityLabel(measure.amount*i.q,measure.unit)+" ("+i.q+" "+(measure.unit==="litre"?"bottles":"packs")+")":i.q+" packs";return"<li>"+p.n+" · "+formatPackLabel(z[0])+" · "+quantity+" · "+rs(z[1]*i.q)+"</li>"}).join("")}
function renderCart(){var el=$("cartView"),rows=[];
CART.forEach(function(i,k){if(i.kind==="combo"){var offer=OFFERS.find(function(o){return o.id===i.id});if(offer){var first=offer.items.find(function(item){return item.productId}),imageProduct=first&&P.find(function(product){return product.id===first.productId}),product=imageProduct?Object.assign({},imageProduct,{n:offer.title,c:"Combo offer"}):{n:offer.title,c:"Combo offer",col:"#3f8a4c"},contents=offer.items.map(function(item){return item.name+" · "+item.pack}).join(" + ");rows.push({k:k,combo:offer,p:product,z:[contents+" · individual total "+rs(offer.individualTotal),offer.price],q:i.q})}return}var p=P.find(function(x){return x.id==i.id}),z=p&&p.sizes[i.s],measure=z&&packMeasure(z[0]),rule=orderRule(p);if(z)rows.push({k:k,p:p,z:z,q:i.q,measure:measure,rule:rule,litres:actualLitres(z[0],i.q)})});
if(!rows.length){el.innerHTML='<div class="cart-empty"><span class="cart-empty-mark" aria-hidden="true">✦</span><span class="cart-kicker">YOUR FARMING ESSENTIALS</span><h1>Your cart is ready to grow</h1><p>Explore crop-care products selected for growers like you.</p><a class="btn" href="#products">Explore products <span aria-hidden="true">→</span></a></div>';return}
var tot=rows.reduce(function(a,r){return a+(r.combo?r.combo.price:r.z[1])*r.q},0),minimumMessage=cartMinimumMessage();
var itemCount=rows.reduce(function(a,r){return a+(r.combo?r.q*r.combo.items.length:r.q)},0);
el.innerHTML='<div class="cart-heading"><div><span class="cart-kicker">GOOD CHOICES FOR YOUR FARM</span><h1>Your cart</h1><p>Review your products and quantities before checkout.</p></div><span class="cart-count"><span class="cart-count-mark" aria-hidden="true">✓</span>'+rows.length+' '+(rows.length===1?'product':'products')+'</span></div><div class="cartgrid"><div class="cart-list">'+rows.map(function(r){var liquid=r.measure&&r.measure.unit==="litre",quantityInfo=r.combo?r.q+" combos":r.rule&&r.rule.unit==="piece"?quantityLabel(r.q,"piece")+" · "+r.q+" packs":r.measure?quantityLabel(r.measure.amount*r.q,r.measure.unit)+" · "+r.q+(liquid?" bottles":" packs"):r.q+" packs";var productLink=r.combo?"":' href="#p/'+r.p.id+'"';return '<article class="crow"><'+(r.combo?'div':'a class="cart-product-image cart-product-link"')+productLink+'>'+pic(r.p)+'</'+(r.combo?'div':'a')+'><div class="cart-product-info"><span class="cart-product-category">'+r.p.c+'</span><h2>'+(r.combo?r.p.n:'<a class="cart-product-name" href="#p/'+r.p.id+'">'+r.p.n+'</a>')+'</h2><p class="cart-pack">'+formatPackLabel(r.z[0])+' <span aria-hidden="true">·</span> '+rs(r.z[1])+' / '+(r.combo?'combo':liquid?'bottle':'pack')+'</p><span class="cart-quantity-summary">'+quantityInfo+'</span></div><div class="cart-item-actions"><span class="cart-line-total">'+rs(r.z[1]*r.q)+'</span><span class="qty cart-qty"><button type="button" data-k="'+r.k+'" data-d="-1" aria-label="Decrease '+r.p.n+' by one minimum-order step">−</button><span>'+quantityInfo+'</span><button type="button" data-k="'+r.k+'" data-d="1" aria-label="Increase '+r.p.n+' by one minimum-order step">+</button></span><button type="button" class="cart-remove" data-k="'+r.k+'" data-d="0">Remove item</button></div></article>'}).join("")+'<a class="cart-continue" href="#products"><span aria-hidden="true">←</span> Continue shopping</a><div class="cart-summary"><div class="cart-summary-top"><span>Order summary</span><span>'+itemCount.toLocaleString("en-IN")+' units</span></div><div class="cart-total-row"><span>Subtotal</span><strong>'+rs(tot)+'</strong></div><p>Delivery charges are additional. We will confirm the charge with you before dispatch.</p>'+(minimumMessage?'<p class="cart-minimum" role="alert">'+minimumMessage+'</p>':'')+'</div></div><form class="cform cart-checkout" id="co"><div class="cart-steps" aria-label="Checkout progress"><span class="cart-step is-complete"><i aria-hidden="true">✓</i><b>Cart</b></span><span class="cart-step-line is-complete" aria-hidden="true"></span><span class="cart-step is-current" aria-current="step"><i aria-hidden="true">2</i><b>Delivery</b></span><span class="cart-step-line" aria-hidden="true"></span><span class="cart-step"><i aria-hidden="true">3</i><b>Payment</b></span></div><div class="checkout-heading"><div><span class="cart-kicker">ALMOST THERE</span><h2>Delivery details</h2><p>Where should we send your order?</p></div></div><label>Full name<input name="name" autocomplete="name" placeholder="Enter your full name" required></label><label>Mobile number<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile number" required></label><label>Full address<textarea name="address" rows="3" autocomplete="street-address" placeholder="House / street, area, city" required></textarea></label><label>PIN code<input name="pincode" inputmode="numeric" autocomplete="postal-code" maxlength="6" placeholder="e.g. 360004" required></label><div class="cart-payment-note"><span class="payment-icon" aria-hidden="true">✓</span><span><b>Online payment only</b><small>Delivery charge is collected separately by the courier.</small></span></div>'+(PAYMENT_ENABLED?'<button class="btn cart-pay" type="submit">Continue to payment <span aria-hidden="true">→</span></button>':'<p class="cart-minimum" role="alert">Online payments are currently unavailable. Please try again later.</p><button class="btn cart-pay" type="submit" disabled>Online payment unavailable</button>')+'<p class="checkout-caption">You’ll review the order in the secure payment window.</p></form></div>';
rows.forEach(function(row,index){if(!row.combo)return;var card=el.querySelectorAll(".crow")[index];if(card){card.querySelector(".cart-pack").innerHTML=esc(row.combo.items.map(function(item){return item.name+" · "+item.pack+(item.quantity>1?" × "+item.quantity+" "+(item.quantityUnit||"packs"):"")}).join(" + "))+" · Individual total "+rs(row.combo.individualTotal);card.querySelectorAll(".cart-qty button").forEach(function(button){button.setAttribute("aria-label",(button.dataset.d==="1"?"Increase ":"Decrease ")+row.combo.title+" by one combo")})}});
el.onclick=function(e){var b=e.target.closest("button[data-k]");if(!b)return;var k=+b.dataset.k,d=+b.dataset.d;if(d===0)CART.splice(k,1);else{var item=CART[k],product=P.find(function(p){return p.id===item.id}),step=minimumPackCount(product,item.s)||1;item.q=Math.max(step,item.q+d*step)}saveCart();renderCart()};
el.onsubmit=function(e){e.preventDefault();var f=e.target.elements;if(cartMinimumMessage())return toast(cartMinimumMessage());if(!indianPincode(f.pincode.value))return toast("Enter a valid Indian 6-digit PIN code.");startPayment(e.target)}}
function refreshStoreProducts(){return fetch("/api/products",{cache:"no-store"}).then(function(response){if(!response.ok)throw new Error("Could not refresh products");return response.json()}).then(function(products){setP(products);updateRangeCounts();updateCnt();grid();feat();renderHomeOffers();if(location.hash==="#offers")renderOffers();var detailMatch=location.hash.match(/^#p\/(.+)/);if(detailMatch)detail(detailMatch[1]);if(location.hash==="#cart")renderCart()}).catch(function(error){console.error(error.message)})}
window.addEventListener("storage",function(event){if(event.key==="pls_sale_products_updated")refreshStoreProducts()});
function loadStoreOffers(){fetch("/api/offers").then(function(response){if(!response.ok)throw new Error("Could not load combo offers");return response.json()}).then(function(offers){OFFERS=offers;OFFERS_READY=true;renderHomeOffers();if(location.hash==="#offers")renderOffers();updateCnt();if(location.hash==="#cart")renderCart()}).catch(function(error){OFFERS_READY=true;OFFERS=[];renderHomeOffers();updateCnt();if(location.hash==="#cart")renderCart();console.error(error.message)})}
function start(list){setP(list);updateRangeCounts();updateCnt();tiles();cats();grid();feat();renderHomeOffers();cprod();initCrops();initAboutMetrics();route();loadStoreOffers()}
function showOrderConfirmation(id,summary){$("cartView").innerHTML='<section class="order-success" aria-live="polite"><div class="order-success-mark" aria-hidden="true">✓</div><span class="cart-kicker">PAYMENT CONFIRMED</span><h1>Your order is placed!</h1><p class="order-success-lead">Thank you for choosing Praveka Life Science. Your online payment has been received, and our team will contact you soon to confirm your order and coordinate dispatch.</p><div class="order-number-card"><span>YOUR ORDER NUMBER</span><strong>'+id+'</strong><small>Please keep this number for any order-related query.</small></div><div class="order-next"><h2>What happens next?</h2><p>We’ll call you to confirm the package, delivery details and expected delivery time. Delivery charges are additional and will be shared with you before dispatch.</p><p>If you have any questions about your order, package or delivery, we’re happy to help.</p><div class="order-contact-actions"><a class="btn" href="tel:+916359414594">Call +91 63594 14594</a><a class="btn" href="tel:+918487888667">Call +91 84878 88667</a><a class="btn order-whatsapp" href="https://wa.me/916359414594" target="_blank" rel="noopener">WhatsApp us</a></div></div><div class="order-summary-confirm"><h2>Order summary</h2><ul>'+summary+'</ul></div><a class="order-continue" href="#products">Continue shopping <span aria-hidden="true">→</span></a></section>'}
function startPayment(form){if(cartMinimumMessage())return toast(cartMinimumMessage());if(!PAYMENT_ENABLED)return toast("Online payments are currently unavailable. Please try again later.");if(typeof Razorpay==="undefined")return toast("Online payment is unavailable. Please try again later.");
var f=form.elements;post("/api/payment/order",{name:f.name.value,phone:f.phone.value,address:f.address.value,pincode:f.pincode.value,items:CART.filter(function(i){return i.kind!=="combo"}).map(function(i){return{id:i.id,s:i.s,q:i.q}}),combos:CART.filter(function(i){return i.kind==="combo"}).map(function(i){return{id:i.id,q:i.q}})}).then(function(o){var r=new Razorpay({key:o.keyId,amount:o.amount,currency:o.currency,name:"Praveka Life Science",description:"Crop-care products",order_id:o.orderId,handler:function(p){post("/api/payment/verify",p).then(function(j){var summary=orderSummaryLines();CART=[];saveCart();showOrderConfirmation(j.id,summary);scrollTo(0,0)}).catch(errToast)},prefill:{name:f.name.value,contact:f.phone.value},theme:{color:"#2f6b45"}});r.on("payment.failed",function(){toast("Payment was not completed. Your cart is unchanged.")});r.open()}).catch(errToast)}
updateCnt();
fetch("/api/products").then(function(r){if(!r.ok)throw 0;return r.json()}).then(start).catch(function(){start(PRODUCTS)});
fetch("/api/payment/config").then(function(r){return r.json()}).then(function(c){PAYMENT_ENABLED=!!c.enabled;if(location.hash==="#cart")renderCart()}).catch(function(){});
/* contact form: product list and quantity that follows the chosen product */
function cunit(w){w=String(w).toLowerCase();if(/^(l|lt|ltr|litre|litres|liter|liters|ml)$/.test(w))return"Litre";if(/^(kg|kgs|kilo|g|gm|gms|gram|grams)$/.test(w))return"Kg";if(/^(pc|pcs|piece|pieces)$/.test(w))return"Piece";return w.charAt(0).toUpperCase()+w.slice(1)}
function cprod(){var s=$("contactProduct");if(!s)return;
s.innerHTML='<option value="">Select a product</option>'+CATS.map(function(c){var l=P.filter(function(p){return p.c==c[0]});return l.length?'<optgroup label="'+esc(c[0])+'">'+l.map(function(p){return'<option value="'+esc(p.id)+'">'+p.n+'</option>'}).join("")+'</optgroup>':""}).join("");
s.onchange=cqty;cqty()}
function cqty(){var s=$("contactProduct"),q=$("contactQty"),h=$("contactHint");if(!s||!q)return;var p=P.find(function(x){return x.id==s.value});
if(!p){q.innerHTML='<option value="">Select a product first</option>';q.disabled=true;h.textContent="";return}
var m=String(p.moq||"").match(/^\s*(\d+)\s*([A-Za-z]+)/),z=String(p.sizes[0][0]).match(/[A-Za-z]+/),base=10,u="Kg";
if(m){base=+m[1];u=cunit(m[2])}else if(z)u=cunit(z[0]);
var o=[1,2,3,5,10,20,50].map(function(k){return(base*k).toLocaleString("en-IN")+" "+u});
q.innerHTML='<option value="">Select quantity</option>'+o.map(function(t){return'<option>'+t+'</option>'}).join("")+'<option>More than '+(base*50).toLocaleString("en-IN")+" "+u+'</option>';q.disabled=false;
h.innerHTML="Pack size: "+p.sizes.map(function(z){return z[0]}).join(", ")+(p.moq?" &middot; Minimum order: "+p.moq:"")}
