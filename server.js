// SERVER.JS - Praveka Life Science backend (Express + JSON files).
const express=require("express"),fs=require("fs"),path=require("path"),crypto=require("crypto");
try{fs.readFileSync(path.join(__dirname,".env"),"utf8").split(/\r?\n/).forEach(l=>{const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m&&!(m[1] in process.env))process.env[m[1]]=m[2]})}catch(e){}
const PASS=process.env.ADMIN_PASSWORD||"",PORT=process.env.PORT||3000,HOST=process.env.HOST||"0.0.0.0";
if(PASS.length<8||PASS==="change-this-password"){console.error("\nFirst copy .env.example to .env and set ADMIN_PASSWORD to your own password (8+ characters).\n");process.exit(1)}
const SEED=path.join(__dirname,"data"),D=process.env.DATA_DIR?path.resolve(process.env.DATA_DIR):SEED;fs.mkdirSync(D,{recursive:true});
// If DATA_DIR points to a separate (persistent) disk, copy starter files from the repo's data/ folder the first time only.
if(D!==SEED){["products.json","reviews.json"].forEach(f=>{try{const dst=path.join(D,f);if(!fs.existsSync(dst)&&fs.existsSync(path.join(SEED,f)))fs.copyFileSync(path.join(SEED,f),dst)}catch(e){console.error("Seed copy failed for "+f,e.message)}})}
const rd=(n,d)=>{try{return JSON.parse(fs.readFileSync(path.join(D,n+".json"),"utf8"))}catch(e){return d}};
const wr=(n,v)=>{const f=path.join(D,n+".json");fs.writeFileSync(f+".tmp",JSON.stringify(v,null,2));fs.renameSync(f+".tmp",f)};
const s=(v,m)=>String(v==null?"":v).trim().slice(0,m);
const wrap=f=>(q,r)=>{try{f(q,r)}catch(e){r.status(400).json({error:typeof e==="string"?e:"Invalid request"})}};
const hits={};
const limit=(max,ms)=>(q,r,n)=>{const k=q.ip+q.path,t=Date.now();hits[k]=(hits[k]||[]).filter(x=>t-x<ms);if(hits[k].length>=max)return r.status(429).json({error:"Too many requests. Please try again later."});hits[k].push(t);n()};
const app=express();app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({limit:"1mb",verify:(q,r,buf)=>{q.rawBody=buf}}));
app.use((q,r,n)=>{r.set({"X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY","Referrer-Policy":"same-origin"});n()});

// ---- admin login ----
const tokens=new Map();
app.post("/api/admin/login",limit(10,15*60e3),wrap((q,r)=>{
  const pw=s(q.body.password,200);
  if(!pw)return r.status(401).json({error:"Password is required"});
  if(pw!==PASS)return r.status(401).json({error:"Incorrect password"});
  const token=crypto.randomBytes(32).toString("hex");
  tokens.set(token,{expires:Date.now()+12*60*60*1000,role:"manager"});
  r.json({ok:true,token,role:"manager"});}));
app.post("/api/contact",limit(10,3600e3),wrap((q,r)=>{
  const name=s(q.body.name,80),phone=s(q.body.phone,20),message=s(q.body.message,1000),qty=s(q.body.quantity,30);
  if(name.length<2)throw "Please enter your name";if(phone.replace(/\D/g,"").length<10)throw "Enter a valid phone number";
  const pr=rd("products",[]).find(x=>x.id===s(q.body.product,150));
  if(pr&&pr.hidden===true)throw "This product is temporarily unavailable.";
  const QTY=["1","2","3","4","5","10","15","20","25","50","100","More than 100"];
  const L=rd("messages",[]);L.unshift({date:new Date().toISOString(),name,phone,product:pr?pr.n:"",quantity:qty,message});wr("messages",L);r.json({ok:true})}));
const adminRole=(q)=>{const e=tokens.get(q.get("x-admin-token"));if(!e||e.expires<Date.now())return "";return e.role};
const auth=(q,r,n)=>{if(!adminRole(q))return r.status(401).json({error:"Please log in"});n()};
const managerOnly=(q,r,n)=>{if(adminRole(q)!=="manager")return r.status(403).json({error:"Manager access is required"});n()};
const staffOrManager=(q,r,n)=>{if(!adminRole(q))return r.status(401).json({error:"Please log in"});n()};

// ---- products ----
const url=v=>{v=s(v,300);if(!v)return"";if(!/^https:\/\/[^\s"'<>]+$/i.test(v))throw "Links must start with https://";return v};
const img=v=>{v=s(v,300);if(!v)return"";if(/^https:\/\/[^\s"'<>]+$/i.test(v))return v;
  if(/^(images\/)?[\w][\w\-. ]{0,100}\.(jpe?g|png|webp|gif)$/i.test(v))return v.startsWith("images/")?v:"images/"+v;
  throw "Image must be a https link or a file name such as no-one.jpg (put the file in public/images)"};
function cleanProduct(b){
  const n=s(b.n,120);if(n.length<2)throw "Product name is required";
  if(b.hidden!==undefined&&typeof b.hidden!=="boolean")throw "Visibility must be true or false";
  const sizes=(Array.isArray(b.sizes)?b.sizes:[]).slice(0,10).map(z=>[s(z[0],30),Number(z[1]),Number(z[2])]);
  if(!sizes.length||sizes.some(z=>!z[0]||!(z[1]>0)||!(z[2]>=z[1])))throw "Each pack size needs a label, a price above 0, and an MRP not below the price";
  const images=(Array.isArray(b.images)?b.images:[]).slice(0,4).map(img).filter(Boolean);
  return{n,c:s(b.c,40),brand:s(b.brand,80),head:s(b.head,200),t:s(b.t,200),ftype:s(b.ftype,100),form:s(b.form,100),conc:s(b.conc,200),apptype:s(b.apptype,100),phys:s(b.phys,100),ptype:s(b.ptype,100),dose:s(b.dose,300),moq:s(b.moq,60),
    desc:s(b.desc,2000),features:s(b.features,2500),mode:s(b.mode,600),pests:s(b.pests,500),crops:s(b.crops,500),deliverable:b.deliverable!==false,hidden:b.hidden===true,sizes,images,video:url(b.video),brochure:url(b.brochure)}}
app.get("/api/products",(q,r)=>r.json(rd("products",[]).filter(p=>p.hidden!==true)));
app.get("/api/admin/products",staffOrManager,(q,r)=>r.json(rd("products",[])));
app.get("/api/products/:id/reviews",wrap((q,r)=>{
  const p=rd("products",[]).find(x=>x.id===q.params.id);
  if(!p||p.hidden===true)return r.status(404).json({error:"Product not found"});
  r.json(rd("reviews",[]).filter(x=>x.productId===p.id&&x.status==="published").map(function(x){
    return{id:x.id,name:x.name,rating:x.rating,comment:x.comment,date:x.date};
  }));
}));
app.post("/api/products/:id/reviews",limit(5,3600e3),wrap((q,r)=>{
  const p=rd("products",[]).find(x=>x.id===q.params.id);
  if(!p||p.hidden===true)return r.status(404).json({error:"Product not found"});
  const name=s(q.body.name,80),comment=s(q.body.comment,1000),rating=Number(q.body.rating);
  const phone=s(q.body.phone,20);
  if(name.length<2)throw "Please enter your name";
  if(!/^[6-9]\d{9}$/.test(phone))throw "Enter a valid 10-digit Indian mobile number using digits only";
  if(!Number.isInteger(rating)||rating<1||rating>5)throw "Choose a rating from 1 to 5 stars";
  if(comment.length<5)throw "Please write at least 5 characters about the product";
  const reviews=rd("reviews",[]);
  const review={id:"REV-"+Date.now().toString(36),productId:p.id,name,phone,rating,comment,date:new Date().toISOString(),status:"published"};
  reviews.unshift(review);wr("reviews",reviews);
  r.status(201).json({ok:true,review:{id:review.id,name:review.name,rating:review.rating,comment:review.comment,date:review.date}});
}));
app.get("/api/admin/reviews",managerOnly,(q,r)=>{
  const products=rd("products",[]),reviews=rd("reviews",[]);
  let changed=false;
  reviews.forEach(function(review,index){if(!review.id){review.id="REV-legacy-"+index+"-"+Date.now().toString(36);changed=true}});
  if(changed)wr("reviews",reviews);
  r.json(reviews.map(function(review){
    const product=products.find(x=>x.id===review.productId);
    return{id:review.id,productId:review.productId,productName:product?product.n:"Deleted product",name:review.name,phone:review.phone||"",rating:review.rating,comment:review.comment,date:review.date};
  }));
});
app.delete("/api/admin/reviews/:id",managerOnly,wrap((q,r)=>{
  const reviews=rd("reviews",[]),remaining=reviews.filter(x=>x.id!==q.params.id);
  if(remaining.length===reviews.length)return r.status(404).json({error:"Review not found"});
  wr("reviews",remaining);r.json({ok:true});
}));
app.post("/api/admin/products",managerOnly,wrap((q,r)=>{const L=rd("products",[]),p=cleanProduct(q.body);
  let id=p.n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"product";while(L.some(x=>x.id===id))id+="-"+crypto.randomInt(10,99);
  L.push({id,...p,sale:false});wr("products",L);r.json({ok:true,id})}));

// ---- bulk import from CSV (all rows are checked first; nothing is saved if any row is wrong) ----
const CATS=["Insecticide","Fungicide","Herbicide","Fertilizer","PGR & Nutrition"];
app.post("/api/admin/products/import",managerOnly,wrap((q,r)=>{
  const inc=q.body.products;if(!Array.isArray(inc)||!inc.length||inc.length>500)throw "The file has no products (or has more than 500)";
  const L=rd("products",[]),seen=new Set();let added=0,updated=0;
  inc.forEach((b,i)=>{const row="Row "+(i+2)+": ";
    const cat=CATS.find(c=>c.toLowerCase()===s(b.c,40).toLowerCase());
    if(!cat)throw row+"category must be one of: "+CATS.join(", ");
    let p;try{p=cleanProduct({...b,c:cat})}catch(e){throw row+(typeof e==="string"?e:"invalid row")}
    const key=p.n.toLowerCase();if(seen.has(key))throw row+"this product name appears twice in the file";seen.add(key);
    const id0=s(b.id,80),ex=(id0&&L.find(x=>x.id===id0))||L.find(x=>x.n.toLowerCase()===key);
    if(ex){Object.assign(ex,p,{hidden:ex.hidden===true,sale:ex.sale===true});updated++}
    else{let id=p.n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"product";while(L.some(x=>x.id===id))id+="-"+crypto.randomInt(10,99);L.push({id,...p,sale:false});added++}});
  wr("products",L);r.json({ok:true,added,updated})}));
app.put("/api/admin/products/:id",managerOnly,wrap((q,r)=>{const L=rd("products",[]),i=L.findIndex(x=>x.id===q.params.id);
  if(i<0)return r.status(404).json({error:"Product not found"});L[i]={id:L[i].id,...cleanProduct({...q.body,deliverable:q.body.deliverable===undefined?L[i].deliverable:q.body.deliverable,hidden:q.body.hidden===undefined?L[i].hidden:q.body.hidden}),sale:L[i].sale===true};wr("products",L);r.json({ok:true})}));
app.delete("/api/admin/products/:id",managerOnly,wrap((q,r)=>{wr("products",rd("products",[]).filter(x=>x.id!==q.params.id));r.json({ok:true})}));
app.patch("/api/admin/products/:id/delivery",staffOrManager,wrap((q,r)=>{
  const L=rd("products",[]),p=L.find(x=>x.id===q.params.id);
  if(!p)return r.status(404).json({error:"Product not found"});
  if(typeof q.body.deliverable!=="boolean")throw "Delivery status must be true or false";
  p.deliverable=q.body.deliverable;wr("products",L);r.json({ok:true,deliverable:p.deliverable});
}));
app.patch("/api/admin/products/:id/visibility",managerOnly,wrap((q,r)=>{
  const L=rd("products",[]),p=L.find(x=>x.id===q.params.id);
  if(!p)return r.status(404).json({error:"Product not found"});
  if(typeof q.body.hidden!=="boolean")throw "Visibility must be true or false";
  p.hidden=q.body.hidden;wr("products",L);r.json({ok:true,hidden:p.hidden});
}));

function productPackQuantity(product,size){
  const match=String(size||"").toLowerCase().match(/([\d.]+)\s*(millilitres?|milliliters?|ml|litres?|liters?|l|kilograms?|kgs?|grams?|gms?|g)\b/);
  if(!match)return 1;
  let amount=Number(match[1]),unit=match[2];
  if(unit==="ml"||unit.startsWith("milliliter")||unit.startsWith("millilitre")){amount/=1000;unit="litre"}
  else if(unit==="g"||unit.startsWith("gram")||unit.startsWith("gm")){amount/=1000;unit="kg"}
  else if(unit==="kg"||unit.startsWith("kilogram"))unit="kg";
  else if(unit==="l"||unit.startsWith("litre")||unit.startsWith("liter"))unit="litre";
  const minimum=unit==="litre"?10:unit==="kg"?100:0;
  return minimum&&amount>0?Math.ceil(minimum/amount):1;
}
function productPackUnit(size){
  const match=String(size||"").toLowerCase().match(/([\d.]+)\s*(millilitres?|milliliters?|ml|litres?|liters?|l|kilograms?|kgs?|grams?|gms?|g)\b/);
  if(!match)return"packs";
  const unit=match[2];
  return unit==="ml"||unit==="l"||unit.startsWith("milliliter")||unit.startsWith("millilitre")||unit.startsWith("litre")||unit.startsWith("liter")?"bottles":"packs";
}
function cleanOffer(body,products){
  const title=s(body.title,100),description=s(body.description,500),items=body.items;
  const price=Number(body.price);
  if(title.length<2)throw "Enter a combo offer name";
  if(!Array.isArray(items)||items.length<2||items.length>6)throw "A combo must have 2 to 6 products";
  if(!Number.isFinite(price)||price<=0)throw "Enter a combo price greater than zero";
  if(body.active!==undefined&&typeof body.active!=="boolean")throw "Combo visibility must be true or false";
  const cleaned=items.map((item,index)=>{
    if(!item||typeof item!=="object")throw "Choose a product or enter product details for combo item "+(index+1);
    if(item.productId){
      const product=products.find(p=>p.id===s(item.productId,100));
      if(item.sizeIndex===undefined||item.sizeIndex===null||String(item.sizeIndex).trim()==="")throw "Choose a pack size for combo product "+(index+1);
      const sizeIndex=Number(item.sizeIndex);
      if(!product||product.hidden===true||product.deliverable===false)throw "Combo product "+(index+1)+" is unavailable; choose an available product";
      if(!Number.isInteger(sizeIndex)||sizeIndex<0||sizeIndex>=product.sizes.length)throw "Choose a pack size for combo product "+(index+1);
      const quantity=item.quantity===undefined?productPackQuantity(product,product.sizes[sizeIndex][0]):Number(item.quantity);
      if(!Number.isInteger(quantity)||quantity<1||quantity>1000)throw "Enter a whole-number quantity from 1 to 1000 for combo product "+(index+1);
      return{productId:product.id,sizeIndex,quantity};
    }
    const name=s(item.name,120),pack=s(item.pack,60),unitPrice=Number(item.price),quantity=item.quantity===undefined?1:Number(item.quantity);
    if(name.length<2||!pack||!Number.isFinite(unitPrice)||unitPrice<=0)throw "Enter a name, pack size and price for custom product "+(index+1);
    if(!Number.isInteger(quantity)||quantity<1||quantity>1000)throw "Enter a whole-number quantity from 1 to 1000 for custom product "+(index+1);
    return{name,pack,unitPrice,quantity};
  });
  return{title,description,price,items:cleaned,active:body.active!==false};
}
function presentOffer(offer,products){
  const items=offer.items.map(item=>{
    if(!item.productId)return{...item,quantity:Number.isInteger(item.quantity)&&item.quantity>0?item.quantity:1,quantityUnit:productPackUnit(item.pack)};
    const product=products.find(p=>p.id===item.productId),size=product&&product.sizes[item.sizeIndex];
    return{productId:item.productId,sizeIndex:item.sizeIndex,name:product?product.n:item.name||"Unavailable product",pack:size?size[0]:item.pack||"",unitPrice:size?Number(size[1]):Number(item.unitPrice)||0,quantity:Number.isInteger(item.quantity)&&item.quantity>0?item.quantity:size?productPackQuantity(product,size[0]):1,quantityUnit:productPackUnit(size&&size[0])};
  });
  return{...offer,items,individualTotal:items.reduce((sum,item)=>sum+item.unitPrice*item.quantity,0)};
}
app.get("/api/offers",(q,r)=>{
  const products=rd("products",[]);
  const offers=rd("offers",[]).filter(offer=>offer.active!==false&&offer.items.every(item=>!item.productId||products.some(p=>p.id===item.productId&&p.hidden!==true&&p.deliverable!==false&&Array.isArray(p.sizes)&&p.sizes[item.sizeIndex]))).map(offer=>presentOffer(offer,products));
  r.json(offers);
});
app.get("/api/admin/offers",staffOrManager,(q,r)=>{
  const products=rd("products",[]);
  r.json(rd("offers",[]).map(offer=>presentOffer(offer,products)));
});
app.put("/api/admin/offers/sales",managerOnly,wrap((q,r)=>{
  if(!Array.isArray(q.body.productIds))throw "Choose the products to put on sale";
  const L=rd("products",[]),ids=new Set(q.body.productIds.map(id=>s(id,100)));
  if(Array.from(ids).some(id=>!L.some(p=>p.id===id)))throw "A selected product no longer exists";
  L.forEach(product=>{product.sale=product.hidden!==true&&ids.has(product.id)});
  wr("products",L);r.json({ok:true,count:L.filter(product=>product.hidden!==true&&product.sale===true).length});
}));
app.post("/api/admin/offers",managerOnly,wrap((q,r)=>{
  const offers=rd("offers",[]),offer=cleanOffer(q.body,rd("products",[]));
  let id="combo-"+crypto.randomBytes(6).toString("hex");
  while(offers.some(existing=>existing.id===id))id="combo-"+crypto.randomBytes(6).toString("hex");
  offers.push({id,...offer});wr("offers",offers);r.status(201).json({ok:true,id});
}));
app.put("/api/admin/offers/:id",managerOnly,wrap((q,r)=>{
  const offers=rd("offers",[]),index=offers.findIndex(offer=>offer.id===q.params.id);
  if(index<0)return r.status(404).json({error:"Combo offer not found"});
  offers[index]={id:offers[index].id,...cleanOffer(q.body,rd("products",[]))};wr("offers",offers);r.json({ok:true});
}));
app.delete("/api/admin/offers/:id",managerOnly,wrap((q,r)=>{
  const offers=rd("offers",[]),remaining=offers.filter(offer=>offer.id!==q.params.id);
  if(remaining.length===offers.length)return r.status(404).json({error:"Combo offer not found"});
  wr("offers",remaining);r.json({ok:true});
}));

// ---- orders and online payments (prices are always taken from the server) ----
const https=require("https"),RAZORPAY_KEY_ID=process.env.RAZORPAY_KEY_ID||"",RAZORPAY_KEY_SECRET=process.env.RAZORPAY_KEY_SECRET||"",RAZORPAY_WEBHOOK_SECRET=process.env.RAZORPAY_WEBHOOK_SECRET||"";
// Pending payments are stored on disk (data/pending.json) so a restart cannot lose them.
const PENDING_TTL=3*24*3600e3;
const getPending=()=>{const P=rd("pending",{}),now=Date.now();let ch=false;for(const k of Object.keys(P))if(P[k].expires<now){delete P[k];ch=true}if(ch)wr("pending",P);return P};
function finalizeOrder(rpOrderId,paymentId){
  // Safe to call many times (verify + webhook): the same Razorpay order never creates two orders.
  const L=rd("orders",[]),dup=L.find(x=>x.razorpayOrderId===rpOrderId||(paymentId&&x.paymentId===paymentId));
  if(dup)return{id:dup.id,existing:true};
  const P=getPending(),pending=P[rpOrderId];if(!pending)return null;
  const o=pending.order;let id;do{id="PLS-"+Date.now().toString(36).toUpperCase()+crypto.randomBytes(1).toString("hex").toUpperCase()}while(L.some(x=>x.id===id));
  L.unshift({id,date:new Date().toISOString(),status:"Confirmed",payment:"Razorpay",paymentId:s(paymentId,100),razorpayOrderId:rpOrderId,customer:{name:o.name,phone:o.phone,address:o.address,pincode:o.pincode},items:o.items,total:o.total});
  wr("orders",L);delete P[rpOrderId];wr("pending",P);return{id,existing:false};
}
function validateOrder(b){
  const name=s(b.name,80),address=s(b.address,300),pincode=s(b.pincode,6);let phone=s(b.phone,20).replace(/\D/g,"");
  if(phone.length===12&&phone.startsWith("91"))phone=phone.slice(2);
  if(name.length<2)throw "Please enter your name";if(!/^[6-9]\d{9}$/.test(phone))throw "Enter a valid 10-digit mobile number";
  if(address.length<10)throw "Please enter your full address";if(!/^[1-8]\d{5}$/.test(pincode))throw "Enter a valid Indian 6-digit PIN code";
  const productItems=Array.isArray(b.items)?b.items:[],comboItems=Array.isArray(b.combos)?b.combos:[];
  if(!productItems.length&&!comboItems.length||productItems.length>50||comboItems.length>20)throw "Your cart is empty";
  const P=rd("products",[]);
  const items=productItems.map(i=>{const p=P.find(x=>x.id===i.id),index=Number(i.s),hasSizeSelection=i.s!==undefined&&i.s!==null&&String(i.s).trim()!==""&&Number.isInteger(index)&&index>=0,z=p&&hasSizeSelection&&p.sizes[index],qty=Number(i.q);
    const sizes=p&&Array.isArray(p.sizes)?p.sizes:[];
    const isLiquid=sizes.some(x=>/[\d.]+\s*(?:ml|l|litre|liter)\b/i.test(String(x[0])));
    if(p&&isLiquid&&!hasSizeSelection){const labels=sizes.filter(x=>/[\d.]+\s*(?:ml|l|litre|liter)\b/i.test(String(x[0]))).map(x=>String(x[0]).replace(/\b(litre|litres|liter|liters)\b/ig,"L"));const last=labels.pop(),list=labels.length?labels.join(", ")+" or "+last:last||"available pack";throw "Please select a bottle size ("+list+") first."}
    if(!p||p.hidden===true||p.deliverable===false||!z||!Number.isInteger(qty)||qty<1||qty>1000)throw "A product in your cart is no longer available. Please refresh and try again.";
    const match=String(z[0]).toLowerCase().match(/([\d.]+)\s*(millilitres?|milliliters?|ml|litres?|liters?|l|kilograms?|kgs?|grams?|gms?|g)\b/);
    let amount=match?Number(match[1]):0,unit=match?match[2]:"";
    if(unit==="ml"||unit.startsWith("milliliter")||unit.startsWith("millilitre")){amount/=1000;unit="litre"}else if(unit==="g"||unit.startsWith("gram")||unit.startsWith("gm")){amount/=1000;unit="kg"}else if(unit==="kg"||unit.startsWith("kilogram"))unit="kg";else if(unit==="l"||unit.startsWith("litre")||unit.startsWith("liter"))unit="litre";
    const minimum=unit==="litre"?10:unit==="kg"?100:0;
    if(minimum&&amount*qty<minimum)throw p.n+" requires a minimum order of "+minimum+(unit==="litre"?" L.":" kg.");
    const actualVolume=unit==="litre"?Math.round(amount*qty*10000)/10000:null;
    const actualWeight=unit==="kg"?Math.round(amount*qty*10000)/10000:null;
    return{id:p.id,name:p.n,size:z[0],qty,price:z[1],quantityUnit:unit==="litre"?"bottles":"packs",...(actualVolume!==null?{litres:actualVolume}:{}),...(actualWeight!==null?{kilograms:actualWeight}:{})}});
  const offers=rd("offers",[]);
  comboItems.forEach(entry=>{
    const offer=offers.find(item=>item.id===entry.id&&item.active!==false),quantity=Number(entry.q);
    if(!offer||!Number.isInteger(quantity)||quantity<1||quantity>100)throw "A combo offer in your cart is no longer available. Please refresh and try again.";
    const bundle=presentOffer(offer,P),bundleItems=bundle.items.map(item=>{
      const product=item.productId&&P.find(p=>p.id===item.productId);
      if(item.productId&&(!product||product.hidden===true||product.deliverable===false||!product.sizes[item.sizeIndex]))throw "A product in this combo is no longer available. Please refresh and try again.";
      return{productId:item.productId||"",category:product?product.c:"Combo products",name:item.name,size:item.pack,qty:item.quantity,quantityUnit:item.quantityUnit,price:item.unitPrice};
    });
    items.push({id:"COMBO-"+offer.id,name:offer.title,size:"Combo offer",qty:quantity,price:offer.price,quantityUnit:"combos",comboItems:bundleItems});
  });
  const total=items.reduce((sum,item)=>sum+item.price*item.qty,0);
  return {name,phone,address,pincode,items,total};
}
function razorpayRequest(path,body){return new Promise((resolve,reject)=>{const req=https.request({hostname:"api.razorpay.com",path,method:"POST",auth:RAZORPAY_KEY_ID+":"+RAZORPAY_KEY_SECRET,headers:{"Content-Type":"application/json"}},res=>{let out="";res.on("data",c=>out+=c);res.on("end",()=>{let data;try{data=JSON.parse(out)}catch(e){return reject(new Error("Invalid payment provider response"))}if(res.statusCode<200||res.statusCode>=300)return reject(new Error(data.error?.description||"Payment provider request failed"));resolve(data)})});req.on("error",reject);req.write(JSON.stringify(body));req.end()})}
app.get("/api/payment/config",(q,r)=>r.json({enabled:!!(RAZORPAY_KEY_ID&&RAZORPAY_KEY_SECRET),keyId:RAZORPAY_KEY_ID||null}));
app.post("/api/payment/order",limit(20,3600e3),async(q,r)=>{try{if(!RAZORPAY_KEY_ID||!RAZORPAY_KEY_SECRET)return r.status(503).json({error:"Online payments are not configured yet."});
  const order=validateOrder(q.body),rp=await razorpayRequest("/v1/orders",{amount:Math.round(order.total*100),currency:"INR",receipt:"pls_"+Date.now().toString(36),notes:{customer:order.name}});
  {const P=getPending();P[rp.id]={order,expires:Date.now()+PENDING_TTL};wr("pending",P)}r.json({keyId:RAZORPAY_KEY_ID,orderId:rp.id,amount:rp.amount,currency:rp.currency});
}catch(e){r.status(400).json({error:e.message||String(e)})}});
app.post("/api/payment/verify",limit(20,3600e3),wrap((q,r)=>{
  if(!RAZORPAY_KEY_SECRET)return r.status(503).json({error:"Online payments are not configured yet."});
  const sig=String(q.body.razorpay_signature||""),expected=crypto.createHmac("sha256",RAZORPAY_KEY_SECRET).update(q.body.razorpay_order_id+"|"+q.body.razorpay_payment_id).digest("hex");
  if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))return r.status(400).json({error:"Payment verification failed"});
  const res=finalizeOrder(s(q.body.razorpay_order_id,100),s(q.body.razorpay_payment_id,100));
  if(!res)return r.status(400).json({error:"We received your payment but could not find the order details. Please contact us with your payment ID: "+s(q.body.razorpay_payment_id,100)});
  r.json({ok:true,id:res.id})}));
// Razorpay webhook: Razorpay tells us directly when a payment succeeds, even if the customer closed the page.
app.post("/api/payment/webhook",(q,r)=>{
  if(!RAZORPAY_WEBHOOK_SECRET||!q.rawBody)return r.status(503).end();
  const sig=String(q.get("x-razorpay-signature")||""),expected=crypto.createHmac("sha256",RAZORPAY_WEBHOOK_SECRET).update(q.rawBody).digest("hex");
  if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig))){console.warn("Webhook rejected: signature does not match RAZORPAY_WEBHOOK_SECRET");return r.status(400).end()}
  console.log("Webhook received:",q.body&&q.body.event);
  try{
    const ev=q.body&&q.body.event;
    if(ev==="payment.captured"||ev==="order.paid"){
      const pay=q.body.payload&&q.body.payload.payment&&q.body.payload.payment.entity,rpOrder=pay&&pay.order_id,payId=pay&&pay.id;
      if(rpOrder&&payId){
        const res=finalizeOrder(rpOrder,payId);console.log("Webhook payment",payId,res?(res.existing?"-> order already saved":"-> order created from webhook"):"-> no pending order found");
        if(!res){const U=rd("unmatched-payments",[]);if(!U.some(x=>x.paymentId===payId)){U.unshift({date:new Date().toISOString(),paymentId:payId,razorpayOrderId:rpOrder,amount:(pay.amount||0)/100});wr("unmatched-payments",U);console.error("Payment received but no pending order found:",payId)}}
      }
    }
  }catch(e){console.error("Webhook error",e.message);return r.status(500).end()}
  r.status(200).json({ok:true});
});
app.post("/api/orders",(q,r)=>r.status(410).json({error:"Cash on delivery is no longer accepted. Please complete payment online."}));
const ST=["New","Confirmed","Shipped","Delivered","Cancelled"];
app.get("/api/admin/orders",managerOnly,(q,r)=>r.json(rd("orders",[])));
app.patch("/api/admin/orders/:id",managerOnly,wrap((q,r)=>{const L=rd("orders",[]),o=L.find(x=>x.id===q.params.id);
  if(!o)return r.status(404).json({error:"Order not found"});if(!ST.includes(q.body.status))throw "Invalid status";o.status=q.body.status;wr("orders",L);r.json({ok:true})}));

// ---- contact form and newsletter ----
app.post("/api/contact",limit(10,3600e3),wrap((q,r)=>{
  const name=s(q.body.name,80),phone=s(q.body.phone,20),message=s(q.body.message,1000);
  if(name.length<2)throw "Please enter your name";if(phone.replace(/\D/g,"").length<10)throw "Enter a valid phone number";
  const L=rd("messages",[]);L.unshift({id:"MSG-"+Date.now().toString(36),date:new Date().toISOString(),name,phone,message,status:"open"});wr("messages",L);r.json({ok:true})}));
app.post("/api/subscribe",limit(10,3600e3),wrap((q,r)=>{
  let phone=s(q.body.phone,20).replace(/\D/g,"");if(phone.length===12&&phone.startsWith("91"))phone=phone.slice(2);if(!/^[6-9]\d{9}$/.test(phone))throw "Enter a valid 10-digit mobile number";
  const L=rd("subscribers",[]);if(!L.some(x=>x.phone===phone)){L.unshift({date:new Date().toISOString(),phone});wr("subscribers",L)}r.json({ok:true})}));
app.get("/api/admin/messages",staffOrManager,(q,r)=>{
  const L=rd("messages",[]);let changed=false;
  L.forEach((m,i)=>{if(!m.id){m.id="MSG-"+i+"-"+new Date(m.date||0).getTime().toString(36);changed=true}if(!m.status)m.status="open"});
  if(changed)wr("messages",L);
  r.json({messages:L,subscribers:rd("subscribers",[])});
});
app.patch("/api/admin/messages/:id/status",staffOrManager,wrap((q,r)=>{
  const L=rd("messages",[]),m=L.find(x=>x.id===q.params.id);
  if(!m)return r.status(404).json({error:"Message not found"});
  if(!["open","handled"].includes(q.body.status))throw "Invalid message status";
  m.status=q.body.status;m.handledAt=q.body.status==="handled"?new Date().toISOString():undefined;
  if(m.handledAt===undefined)delete m.handledAt;
  wr("messages",L);r.json({ok:true});
}));

// ---- backups ----
const BK=path.join(D,"backups");
function runBackup(){try{
  const day=new Date().toISOString().slice(0,10),dir=path.join(BK,day);fs.mkdirSync(dir,{recursive:true});
  fs.readdirSync(D).filter(f=>f.endsWith(".json")).forEach(f=>fs.copyFileSync(path.join(D,f),path.join(dir,f)));
  fs.readdirSync(BK).filter(f=>/^\d{4}-\d{2}-\d{2}$/.test(f)).sort().slice(0,-14).forEach(f=>fs.rmSync(path.join(BK,f),{recursive:true,force:true}));
}catch(e){console.error("Backup failed:",e.message)}}
runBackup();setInterval(runBackup,6*3600e3).unref();
app.get("/api/admin/backup",managerOnly,(q,r)=>{
  const out={exportedAt:new Date().toISOString()};fs.readdirSync(D).filter(f=>f.endsWith(".json")).forEach(f=>{out[f.replace(/\.json$/,"")]=rd(f.replace(/\.json$/,""),null)});
  r.set("Content-Disposition",'attachment; filename="praveka-backup-'+out.exportedAt.slice(0,10)+'.json"');r.json(out)});

app.use(express.static(path.join(__dirname,"public")));
app.get("/admin",(q,r)=>r.sendFile(path.join(__dirname,"public","admin.html")));
app.use((e,q,r,n)=>r.status(400).json({error:"Invalid request"}));
app.listen(PORT,HOST,()=>console.log(`\nPraveka store running:\n  Website: http://localhost:${PORT}\n  Admin:   http://localhost:${PORT}/admin\n`));
