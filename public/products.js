/* PRODUCTS.JS  -  this is the ONLY file you edit to add or change products.

   How to add a product: copy one block { ... }, paste it below, change the text.
   id      : short unique name, no spaces (example: "kavach")
   n       : product name shown to customers
   c       : category, must match a name in CATS exactly
   t       : technical name (example: "Chlorpyriphos 50% EC")
   desc    : short description         mode : mode of action
   features: key features and benefits crops: target crops
   pests   : target pests or issues    dose : dose per acre
   sale    : true shows a "Sale" tag, false hides it
   sizes   : [ ["pack size", selling price, MRP], ... ]  prices in rupees
   Leave a text field as "" to show the grey placeholder text.
*/

var CATS=[
  ["Insecticide","#c4552d"],
  ["Fungicide","#2f6f9f"],
  ["Herbicide","#7a5c2e"],
  ["Fertilizer","#6b8f2a"],
  ["PGR & Nutrition","#3f8a4c"]
];

var PRODUCTS=[
  {id:"product-1", n:"Product Name 1", c:"Insecticide", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:true,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]},
  {id:"product-2", n:"Product Name 2", c:"Insecticide", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:false,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]},
  {id:"product-3", n:"Product Name 3", c:"Fungicide", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:true,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]},
  {id:"product-4", n:"Product Name 4", c:"Fungicide", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:false,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]},
  {id:"product-5", n:"Product Name 5", c:"Herbicide", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:true,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]},
  {id:"product-6", n:"Product Name 6", c:"Herbicide", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:false,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]},
  {id:"product-7", n:"Product Name 7", c:"Fertilizer", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:true,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]},
  {id:"product-8", n:"Product Name 8", c:"Fertilizer", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:false,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]},
  {id:"product-9", n:"Product Name 9", c:"PGR & Nutrition", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:true,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]},
  {id:"product-10", n:"Product Name 10", c:"PGR & Nutrition", t:"Add technical name here",
   desc:"", mode:"", features:"", crops:"", pests:"", dose:"", sale:false,
   sizes:[["100 ml",199,250],["250 ml",349,430],["500 ml",599,750]]}
];
