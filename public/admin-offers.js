var ADMIN_OFFERS=[],EDITING_OFFER=null,OFFER_ROW_ID=0;
function offerMoney(n){return"Rs. "+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
async function loadAdminOffers(){
  var saveButton=$("saveSaleProducts");saveButton.disabled=true;
  $("adminSaleProducts").innerHTML='<p class="empty">Loading products…</p>';
  $("saleProductSummary").textContent="Loading…";
  try{
    var response=await Promise.all([api("GET","/api/admin/products"),api("GET","/api/admin/offers")]);
    PR=response[0];ADMIN_OFFERS=response[1];refreshOfferProductOptions();renderAdminSaleProducts();renderAdminOfferList();
  }finally{saveButton.disabled=false}
}
function renderAdminSaleProducts(){
  var products=PR.filter(function(p){return p.hidden!==true});
  $("adminSaleProducts").innerHTML=products.length?products.map(function(p){
    return'<label class="sale-admin-item"><input type="checkbox" data-sale-product="'+esc(p.id)+'"'+(p.sale?' checked':'')+'><span>'+esc(p.n)+' · '+esc(p.c)+'</span></label>';
  }).join(""):'<p class="empty">No visible products are available to select.</p>';
  updateAdminSaleProductList();
}
function updateAdminSaleProductList(){
  var term=$("saleProductSearch").value.trim().toLocaleLowerCase(),items=$$("#adminSaleProducts .sale-admin-item"),shown=0,selected=0,onSale=PR.filter(function(p){return p.hidden!==true&&p.sale===true}).length;
  items.forEach(function(item){
    item.hidden=term!==""&&item.textContent.toLocaleLowerCase().indexOf(term)===-1;
    if(!item.hidden)shown++;
    if(item.querySelector("[data-sale-product]").checked)selected++;
  });
  $("saleProductSummary").textContent=onSale+" product"+(onSale===1?"":"s")+" on sale · "+selected+" selected · "+shown+" shown";
}
function offerSourceOptions(selected){
  return'<option value="">Choose a catalog product</option>'+PR.map(function(p){
    var unavailable=p.hidden===true||p.deliverable===false;
    return'<option value="'+esc(p.id)+'"'+(p.id===selected?' selected':'')+(unavailable&&p.id!==selected?' disabled':'')+'>'+esc(p.n)+(unavailable?' · unavailable':'')+'</option>';
  }).join("")+'<option value="custom"'+(selected==="custom"?' selected':'')+'>Enter a custom product</option>';
}
function offerQuantityUnit(pack){
  return/[\d.]+\s*(?:ml|l|litre|liter)\b/i.test(String(pack||""))?"bottles":"packs";
}
function defaultOfferQuantity(product,pack){
  var minimum=String(product&&product.moq||"").toLowerCase().match(/([\d.]+)\s*(millilitres?|milliliters?|ml|litres?|liters?|l|kilograms?|kgs?|grams?|gms?|g|pieces?|pcs?|packs?|bottles?|units?|each|ea)\b/);
  if(!minimum)return 1;
  var amount=Number(minimum[1]),unit=minimum[2],pack=String(pack||"").toLowerCase().match(/([\d.]+)\s*(millilitres?|milliliters?|ml|litres?|liters?|l|kilograms?|kgs?|grams?|gms?|g)\b/);
  if(!Number.isFinite(amount)||amount<=0)return 1;
  if(unit==="pieces"||unit==="piece"||unit==="pcs"||unit==="pc"||unit==="packs"||unit==="pack"||unit==="bottles"||unit==="bottle"||unit==="units"||unit==="unit"||unit==="each"||unit==="ea")return Math.ceil(amount);
  if(!pack)return 1;
  var packAmount=Number(pack[1]),packUnit=pack[2];
  if(unit==="ml"||unit.startsWith("milliliter")||unit.startsWith("millilitre")){amount/=1000;unit="litre"}
  else if(unit==="g"||unit.startsWith("gram")||unit.startsWith("gm")){amount/=1000;unit="kg"}
  else if(unit==="kg"||unit.startsWith("kilogram"))unit="kg";
  else unit="litre";
  if(packUnit==="ml"||packUnit.startsWith("milliliter")||packUnit.startsWith("millilitre")){packAmount/=1000;packUnit="litre"}
  else if(packUnit==="g"||packUnit.startsWith("gram")||packUnit.startsWith("gm")){packAmount/=1000;packUnit="kg"}
  else if(packUnit==="kg"||packUnit.startsWith("kilogram"))packUnit="kg";
  else packUnit="litre";
  return packUnit===unit&&packAmount>0?Math.max(1,Math.ceil(amount/packAmount-1e-10)):1;
}
function offerRowHtml(item){
  item=item||{};var id=++OFFER_ROW_ID,selected=item.productId||"custom",custom=selected==="custom",options=offerSourceOptions(selected);
  var product=PR.find(function(p){return p.id===selected}),sizeIndex=Number(item.sizeIndex),sizes=product&&Array.isArray(product.sizes)?product.sizes:[];
  var pack=sizes[sizeIndex]&&sizes[sizeIndex][0]||item.pack||"",quantity=item.quantity||defaultOfferQuantity(product,pack);
  return'<div class="combo-admin-row" data-combo-row="'+id+'"><div class="combo-admin-row-head"><b>Combo product</b><button type="button" class="r" data-remove-combo-item="'+id+'">Remove</button></div><div class="combo-admin-row-grid"><div><label>Product source</label><select data-combo-source required>'+options+'</select></div><div data-catalog-pack'+(custom?' hidden':'')+'><label>Available pack size</label><select data-combo-pack required>'+sizes.map(function(size,index){return'<option value="'+index+'"'+(index===sizeIndex?' selected':'')+'>'+esc(size[0])+' · '+offerMoney(size[1])+'</option>'}).join("")+'</select></div><div data-custom-field'+(!custom?' hidden':'')+'><label>Custom product name</label><input data-custom-name maxlength="120" value="'+esc(item.name||'')+'"'+(custom?' required':'')+'></div><div data-custom-field'+(!custom?' hidden':'')+'><label>Custom pack size</label><input data-custom-pack maxlength="60" value="'+esc(item.pack||'')+'"'+(custom?' required':'')+'></div><div data-custom-field'+(!custom?' hidden':'')+'><label>Individual price (Rs.) per pack</label><input data-custom-price type="number" min="0.01" step="0.01" value="'+(item.unitPrice||item.price||'')+'"'+(custom?' required':'')+'></div><div><label>Quantity in combo</label><input data-combo-quantity type="number" min="1" max="1000" step="1" value="'+quantity+'" required><small class="role-note" data-combo-quantity-hint>Number of '+offerQuantityUnit(pack)+' of the selected pack size</small></div></div></div>';
}
function addOfferRow(item){$("comboItemsEditor").insertAdjacentHTML("beforeend",offerRowHtml(item));syncOfferRows()}
function syncOfferRows(){
  var rows=$$("#comboItemsEditor [data-combo-row]");
  rows.forEach(function(row){var select=row.querySelector("[data-combo-source]"),custom=select.value==="custom",product=PR.find(function(p){return p.id===select.value}),pack=row.querySelector("[data-combo-pack]"),catalog=row.querySelector("[data-catalog-pack]");
    catalog.hidden=custom;row.querySelectorAll("[data-custom-field]").forEach(function(field){field.hidden=!custom;var input=field.querySelector("input");input.required=custom});
    if(!custom){var current=pack.value,html=product?product.sizes.map(function(size,index){return'<option value="'+index+'">'+esc(size[0])+' · '+offerMoney(size[1])+'</option>'}).join(""):"";pack.innerHTML=html;if(current!==""&&Number(current)<pack.options.length)pack.value=current;pack.required=true}else pack.required=false;
    var quantity=row.querySelector("[data-combo-quantity]"),selectedPack=!custom&&product&&product.sizes[Number(pack.value)]?product.sizes[Number(pack.value)][0]:row.querySelector("[data-custom-pack]").value;
    var unit=offerQuantityUnit(selectedPack);
    quantity.setAttribute("aria-label","Quantity in combo: number of "+unit);
    row.querySelector("[data-combo-quantity-hint]").textContent="Number of "+unit+" of the selected pack size";
    row.querySelector("[data-remove-combo-item]").hidden=rows.length<=2;
  });
  $("addComboItem").disabled=rows.length>=6;
}
function refreshOfferProductOptions(){
  $$("#comboItemsEditor [data-combo-row]").forEach(function(row){
    var select=row.querySelector("[data-combo-source]"),selected=select.value;
    select.innerHTML=offerSourceOptions(selected);
    select.value=selected;
  });
  syncOfferRows();
}
function renderAdminOfferList(){
  $("adminComboList").innerHTML=ADMIN_OFFERS.length?ADMIN_OFFERS.map(function(offer){
    var items=offer.items.map(function(item){return esc(item.name)+" · "+esc(item.pack)+" · "+offerMoney(item.unitPrice)+(item.quantity>1?" × "+item.quantity+" "+(item.quantityUnit||"packs"):"")}).join("<br>");
    return'<article class="combo-admin-card"><div class="combo-admin-card-head"><b>'+esc(offer.title)+'</b><span class="status'+(offer.active===false?' off':'')+'">'+(offer.active===false?'Hidden':'Live')+'</span></div><p class="combo-admin-card-items">'+items+'</p><div class="combo-admin-total"><span>Individual total: <b>'+offerMoney(offer.individualTotal)+'</b></span><span>Combo price: <strong>'+offerMoney(offer.price)+'</strong></span></div><div class="toolbar" style="margin:10px 0 0"><button class="g" data-edit-combo="'+esc(offer.id)+'">Edit</button><button class="r" data-delete-combo="'+esc(offer.id)+'">Delete</button></div></article>';
  }).join(""):'<p class="empty">No combo offers yet. Create one above.</p>';
}
function resetComboForm(){
  EDITING_OFFER=null;$("comboForm").reset();$("comboFormTitle").textContent="Create a combo offer";$("saveComboOffer").textContent="Save combo offer";$("cancelComboEdit").hidden=true;$("comboFormMessage").textContent="";$("comboItemsEditor").innerHTML="";addOfferRow();addOfferRow();
}
function editComboOffer(offer){
  EDITING_OFFER=offer.id;$("comboForm").elements.title.value=offer.title;$("comboForm").elements.description.value=offer.description||"";$("comboForm").elements.price.value=offer.price;$("comboForm").elements.active.checked=offer.active!==false;
  $("comboFormTitle").textContent="Edit combo offer";$("saveComboOffer").textContent="Update combo offer";$("cancelComboEdit").hidden=false;$("comboFormMessage").textContent="";$("comboItemsEditor").innerHTML="";offer.items.forEach(addOfferRow);syncOfferRows();$("comboForm").scrollIntoView({behavior:"smooth",block:"start"});
}
function collectComboItems(){
  return Array.from($$("#comboItemsEditor [data-combo-row]")).map(function(row){
    var source=row.querySelector("[data-combo-source]").value,quantity=Number(row.querySelector("[data-combo-quantity]").value);
    if(source==="custom")return{name:row.querySelector("[data-custom-name]").value.trim(),pack:row.querySelector("[data-custom-pack]").value.trim(),price:Number(row.querySelector("[data-custom-price]").value),quantity:quantity};
    return{productId:source,sizeIndex:Number(row.querySelector("[data-combo-pack]").value),quantity:quantity};
  });
}
$$("header [data-t]").forEach(function(button){button.addEventListener("click",function(){if(button.dataset.t==="offers")loadAdminOffers().catch(function(error){$("saleProductsMessage").textContent=error.message;$("comboFormMessage").textContent=error.message})})});
$("addComboItem").onclick=function(){if($$("#comboItemsEditor [data-combo-row]").length<6)addOfferRow()};
$("comboItemsEditor").addEventListener("change",function(event){
  if(event.target.matches("[data-combo-source]")){
    var row=event.target.closest("[data-combo-row]"),quantity=row.querySelector("[data-combo-quantity]"),product=PR.find(function(p){return p.id===event.target.value}),pack=row.querySelector("[data-combo-pack]");
    quantity.value=product&&product.sizes[Number(pack.value)]?defaultOfferQuantity(product,product.sizes[Number(pack.value)][0]):1;
    syncOfferRows();
  }else if(event.target.matches("[data-combo-pack]")){
    var selectedProduct=PR.find(function(p){return p.id===event.target.closest("[data-combo-row]").querySelector("[data-combo-source]").value}),selectedSize=selectedProduct&&selectedProduct.sizes[Number(event.target.value)];
    if(selectedSize)event.target.closest("[data-combo-row]").querySelector("[data-combo-quantity]").value=defaultOfferQuantity(selectedProduct,selectedSize[0]);
    syncOfferRows();
  }else if(event.target.matches("[data-custom-pack]"))syncOfferRows();
});
$("comboItemsEditor").addEventListener("click",function(event){var button=event.target.closest("[data-remove-combo-item]");if(button&&$$("#comboItemsEditor [data-combo-row]").length>2){button.closest("[data-combo-row]").remove();syncOfferRows()}});
$("saveSaleProducts").onclick=async function(){
  var productIds=$$("#adminSaleProducts [data-sale-product]:checked").map(function(input){return input.dataset.saleProduct});
  var button=$("saveSaleProducts");button.disabled=true;$("saleProductsMessage").textContent="Saving sale products…";
  try{
    var result=await api("PUT","/api/admin/offers/sales",{productIds:productIds});
    await loadAdminOffers();
    var count=Number.isInteger(result.count)?result.count:PR.filter(function(p){return p.hidden!==true&&p.sale===true}).length;
    $("saleProductsMessage").textContent="Saved successfully. "+count+" product"+(count===1?"":"s")+" on sale.";
    try{localStorage.setItem("pls_sale_products_updated",String(Date.now()))}catch(error){$("saleProductsMessage").textContent+=" Refresh the storefront to see the update.";console.error(error)}
  }catch(error){$("saleProductsMessage").textContent=error.message}
  finally{button.disabled=false}
};
$("saleProductSearch").addEventListener("input",updateAdminSaleProductList);
$("adminSaleProducts").addEventListener("change",updateAdminSaleProductList);
$("selectVisibleSaleProducts").onclick=function(){
  $$("#adminSaleProducts .sale-admin-item:not([hidden]) [data-sale-product]").forEach(function(input){input.checked=true});
  updateAdminSaleProductList();
};
$("clearVisibleSaleProducts").onclick=function(){
  $$("#adminSaleProducts .sale-admin-item:not([hidden]) [data-sale-product]").forEach(function(input){input.checked=false});
  updateAdminSaleProductList();
};
$("comboForm").onsubmit=async function(event){
  event.preventDefault();var form=event.target,items=collectComboItems(),body={title:form.elements.title.value.trim(),description:form.elements.description.value.trim(),price:Number(form.elements.price.value),active:form.elements.active.checked,items:items};
  try{await api(EDITING_OFFER?"PUT":"POST",EDITING_OFFER?"/api/admin/offers/"+encodeURIComponent(EDITING_OFFER):"/api/admin/offers",body);await loadAdminOffers();resetComboForm()}catch(error){$("comboFormMessage").textContent=error.message}
};
$("cancelComboEdit").onclick=resetComboForm;
$("adminComboList").addEventListener("click",async function(event){
  var edit=event.target.closest("[data-edit-combo]"),remove=event.target.closest("[data-delete-combo]");
  if(edit){editComboOffer(ADMIN_OFFERS.find(function(offer){return offer.id===edit.dataset.editCombo}));return}
  if(remove&&confirm("Delete this combo offer?")){
    try{await api("DELETE","/api/admin/offers/"+encodeURIComponent(remove.dataset.deleteCombo));await loadAdminOffers()}catch(error){alert(error.message)}
  }
});
function $$(selector){return Array.from(document.querySelectorAll(selector))}
resetComboForm();
