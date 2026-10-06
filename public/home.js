/* Praveka home page: slide mode + fade-in. Works with script.js unchanged. */
(function(){
var root=document.documentElement,io=null;
function hh(){var h=document.querySelector("header.top");if(h)root.style.setProperty("--hh",h.getBoundingClientRect().height+"px")}
function mode(){var home=!!document.querySelector(".hero:not(.hide)");root.classList.toggle("slides-on",home&&matchMedia("(min-width:861px)").matches)}
function reveal(){
 if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion:reduce)").matches)return;
 if(!io)io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.12});
 document.querySelectorAll(".sl .slw > *").forEach(function(el){if(!el.dataset.fx){el.dataset.fx="1";el.classList.add("fx");io.observe(el)}})}
function all(){hh();mode();reveal()}
addEventListener("resize",all);addEventListener("load",all);
/* switch snapping off BEFORE script.js changes the page (capture runs first) */
addEventListener("hashchange",function(){root.classList.remove("slides-on")},true);
addEventListener("hashchange",function(){setTimeout(all,0)});
all();
})();
