// SERVER.JS - Praveka Life Science backend (Express + JSON files).
const express=require("express"),fs=require("fs"),path=require("path"),crypto=require("crypto");
try{fs.readFileSync(path.join(__dirname,".env"),"utf8").split(/\r?\n/).forEach(l=>{const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m&&!(m[1] in process.env))process.env[m[1]]=m[2]})}catch(e){}
const PASS=process.env.ADMIN_PASSWORD||"",PORT=process.env.PORT||3000,HOST=process.env.HOST||"127.0.0.1";
if(PASS.length<8||PASS==="change-this-password"){console.error("\nFirst copy .env.example to .env and set ADMIN_PASSWORD to your own password (8+ characters).\n");process.exit(1)}
const D=path.join(__dirname,"data");fs.mkdirSync(D,{recursive:true});
const rd=(n,d)=>{try{return JSON.parse(fs.readFileSync(path.join(D,n+".json"),"utf8"))}catch(e){return d}};
const wr=(n,v)=>{const f=path.join(D,n+".json");fs.writeFileSync(f+".tmp",JSON.stringify(v,null,2));fs.renameSync(f+".tmp",f)};
const s=(v,m)=>String(v==null?"":v).trim().slice(0,m);
const wrap=f=>(q,r)=>{try{f(q,r)}catch(e){r.status(400).json({error:typeof e==="string"?e:"Invalid request"})}};
const hits={};
const limit=(max,ms)=>(q,r,n)=>{const k=q.ip+q.path,t=Date.now();hits[k]=(hits[k]||[]).filter(x=>t-x<ms);if(hits[k].length>=max)return r.status(429).json({error:"Too many requests. Please try again later."});hits[k].push(t);n()};
const app=express();app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({limit:"1mb"}));
app.use((q,r,n)=>{r.set({"X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY","Referrer-Policy":"same-origin"});n()});

// ---- admin login ----
const tokens=new Map();
app.post("/api/admin/login",wrap((q,r)=>{
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
  const sizes=(Array.isArray(b.sizes)?b.sizes:[]).slice(0,10).map(z=>[s(z[0],30),Number(z[1]),Number(z[2])]);
  if(!sizes.length||sizes.some(z=>!z[0]||!(z[1]>0)||!(z[2]>=z[1])))throw "Each pack size needs a label, a price above 0, and an MRP not below the price";
  const images=(Array.isArray(b.images)?b.images:[]).slice(0,4).map(img).filter(Boolean);
  return{n,c:s(b.c,40),brand:s(b.brand,80),head:s(b.head,200),t:s(b.t,200),ftype:s(b.ftype,100),form:s(b.form,100),conc:s(b.conc,200),apptype:s(b.apptype,100),phys:s(b.phys,100),ptype:s(b.ptype,100),dose:s(b.dose,300),moq:s(b.moq,60),
    desc:s(b.desc,2000),features:s(b.features,2500),mode:s(b.mode,600),pests:s(b.pests,500),crops:s(b.crops,500),sale:!!b.sale,deliverable:b.deliverable!==false,sizes,images,video:url(b.video),brochure:url(b.brochure)}}
app.get("/api/products",(q,r)=>r.json(rd("products",[])));
app.get("/api/products/:id/reviews",wrap((q,r)=>{
  const p=rd("products",[]).find(x=>x.id===q.params.id);
  if(!p)return r.status(404).json({error:"Product not found"});
  r.json(rd("reviews",[]).filter(x=>x.productId===p.id&&x.status==="published").map(function(x){
    return{id:x.id,name:x.name,rating:x.rating,comment:x.comment,date:x.date};
  }));
}));
app.post("/api/products/:id/reviews",limit(5,3600e3),wrap((q,r)=>{
  const p=rd("products",[]).find(x=>x.id===q.params.id);
  if(!p)return r.status(404).json({error:"Product not found"});
  const name=s(q.body.name,80),comment=s(q.body.comment,1000),rating=Number(q.body.rating);
  if(name.length<2)throw "Please enter your name";
  if(!Number.isInteger(rating)||rating<1||rating>5)throw "Choose a rating from 1 to 5 stars";
  if(comment.length<5)throw "Please write at least 5 characters about the product";
  const reviews=rd("reviews",[]);
  const review={id:"REV-"+Date.now().toString(36),productId:p.id,name,rating,comment,date:new Date().toISOString(),status:"published"};
  reviews.unshift(review);wr("reviews",reviews);
  r.status(201).json({ok:true,review:{id:review.id,name:review.name,rating:review.rating,comment:review.comment,date:review.date}});
}));
app.post("/api/admin/products",managerOnly,wrap((q,r)=>{const L=rd("products",[]),p=cleanProduct(q.body);
  let id=p.n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"product";while(L.some(x=>x.id===id))id+="-"+crypto.randomInt(10,99);
  L.push({id,...p});wr("products",L);r.json({ok:true,id})}));

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
    if(ex){Object.assign(ex,p);updated++}
    else{let id=p.n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"product";while(L.some(x=>x.id===id))id+="-"+crypto.randomInt(10,99);L.push({id,...p});added++}});
  wr("products",L);r.json({ok:true,added,updated})}));
app.put("/api/admin/products/:id",managerOnly,wrap((q,r)=>{const L=rd("products",[]),i=L.findIndex(x=>x.id===q.params.id);
  if(i<0)return r.status(404).json({error:"Product not found"});L[i]={id:L[i].id,...cleanProduct({...q.body,deliverable:q.body.deliverable===undefined?L[i].deliverable:q.body.deliverable})};wr("products",L);r.json({ok:true})}));
app.delete("/api/admin/products/:id",managerOnly,wrap((q,r)=>{wr("products",rd("products",[]).filter(x=>x.id!==q.params.id));r.json({ok:true})}));
app.patch("/api/admin/products/:id/delivery",staffOrManager,wrap((q,r)=>{
  const L=rd("products",[]),p=L.find(x=>x.id===q.params.id);
  if(!p)return r.status(404).json({error:"Product not found"});
  if(typeof q.body.deliverable!=="boolean")throw "Delivery status must be true or false";
  p.deliverable=q.body.deliverable;wr("products",L);r.json({ok:true,deliverable:p.deliverable});
}));

// ---- orders and online payments (prices are always taken from the server) ----
const https=require("https"),RAZORPAY_KEY_ID=process.env.RAZORPAY_KEY_ID||"",RAZORPAY_KEY_SECRET=process.env.RAZORPAY_KEY_SECRET||"",pendingPayments=new Map();
function validateOrder(b){
  const name=s(b.name,80),address=s(b.address,300),pincode=s(b.pincode,6);let phone=s(b.phone,20).replace(/\D/g,"");
  if(phone.length===12&&phone.startsWith("91"))phone=phone.slice(2);
  if(name.length<2)throw "Please enter your name";if(!/^[6-9]\d{9}$/.test(phone))throw "Enter a valid 10-digit mobile number";
  if(address.length<10)throw "Please enter your full address";if(!/^[1-8]\d{5}$/.test(pincode))throw "Enter a valid Indian 6-digit PIN code";
  if(!Array.isArray(b.items)||!b.items.length||b.items.length>50)throw "Your cart is empty";
  const P=rd("products",[]),items=b.items.map(i=>{const p=P.find(x=>x.id===i.id),z=p&&p.sizes[Number(i.s)],qty=Number(i.q);
    if(!z||!Number.isInteger(qty)||qty<1||qty>100)throw "A product in your cart is no longer available. Please refresh and try again.";
    return{id:p.id,name:p.n,size:z[0],qty,price:z[1]}});
  return {name,phone,address,pincode,items,total:items.reduce((a,i)=>a+i.price*i.qty,0)};
}
function razorpayRequest(path,body){return new Promise((resolve,reject)=>{const req=https.request({hostname:"api.razorpay.com",path,method:"POST",auth:RAZORPAY_KEY_ID+":"+RAZORPAY_KEY_SECRET,headers:{"Content-Type":"application/json"}},res=>{let out="";res.on("data",c=>out+=c);res.on("end",()=>{let data;try{data=JSON.parse(out)}catch(e){return reject(new Error("Invalid payment provider response"))}if(res.statusCode<200||res.statusCode>=300)return reject(new Error(data.error?.description||"Payment provider request failed"));resolve(data)})});req.on("error",reject);req.write(JSON.stringify(body));req.end()})}
app.get("/api/payment/config",(q,r)=>r.json({enabled:!!(RAZORPAY_KEY_ID&&RAZORPAY_KEY_SECRET),keyId:RAZORPAY_KEY_ID||null}));
app.post("/api/payment/order",limit(20,3600e3),async(q,r)=>{try{if(!RAZORPAY_KEY_ID||!RAZORPAY_KEY_SECRET)return r.status(503).json({error:"Online payments are not configured yet."});
  const order=validateOrder(q.body),rp=await razorpayRequest("/v1/orders",{amount:Math.round(order.total*100),currency:"INR",receipt:"pls_"+Date.now().toString(36),notes:{customer:order.name}});
  pendingPayments.set(rp.id,{order,expires:Date.now()+15*60e3});r.json({keyId:RAZORPAY_KEY_ID,orderId:rp.id,amount:rp.amount,currency:rp.currency});
}catch(e){r.status(400).json({error:e.message||String(e)})}});
app.post("/api/payment/verify",limit(20,3600e3),wrap((q,r)=>{
  if(!RAZORPAY_KEY_SECRET)return r.status(503).json({error:"Online payments are not configured yet."});
  const sig=String(q.body.razorpay_signature||""),expected=crypto.createHmac("sha256",RAZORPAY_KEY_SECRET).update(q.body.razorpay_order_id+"|"+q.body.razorpay_payment_id).digest("hex");
  if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))return r.status(400).json({error:"Payment verification failed"});
  const pending=pendingPayments.get(q.body.razorpay_order_id);if(!pending||pending.expires<Date.now())return r.status(400).json({error:"Payment session expired. Please try again."});
  const o=pending.order,L=rd("orders",[]),id="PLS-"+Date.now().toString(36).toUpperCase();L.unshift({id,date:new Date().toISOString(),status:"Confirmed",payment:"Razorpay",paymentId:s(q.body.razorpay_payment_id,100),customer:{name:o.name,phone:o.phone,address:o.address,pincode:o.pincode},items:o.items,total:o.total});wr("orders",L);pendingPayments.delete(q.body.razorpay_order_id);r.json({ok:true,id})}));
app.post("/api/orders",limit(20,3600e3),wrap((q,r)=>{const o=validateOrder(q.body),L=rd("orders",[]),id="PLS-"+Date.now().toString(36).toUpperCase();L.unshift({id,date:new Date().toISOString(),status:"New",payment:"Cash on delivery",customer:{name:o.name,phone:o.phone,address:o.address,pincode:o.pincode},items:o.items,total:o.total});wr("orders",L);r.json({ok:true,id,total:o.total})}));
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

app.use(express.static(path.join(__dirname,"public")));
app.get("/admin",(q,r)=>r.sendFile(path.join(__dirname,"public","admin.html")));
app.use((e,q,r,n)=>r.status(400).json({error:"Invalid request"}));
app.listen(PORT,HOST,()=>console.log(`\nPraveka store running:\n  Website: http://localhost:${PORT}\n  Admin:   http://localhost:${PORT}/admin\n`));
