/* Moorvio public-site motion: no network, cookies, tracking, or customer data. */
(()=> {
  "use strict";
  if(!window.matchMedia || !document.body) return;
  const preference=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(preference.matches)return;
  document.body.classList.add("motion-ready");
  let observer=null;
  if("IntersectionObserver" in window) {
    const items=document.querySelectorAll("main > section:not(.v2-hero):not(.resource-hero), .v2-feature-list article, .v2-steps li, .resource-section");
    observer=new IntersectionObserver((entries,obs)=>{
      for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add("mv-visible");obs.unobserve(entry.target)}
    },{threshold:0.06,rootMargin:"0px 0px -7% 0px"});
    let position=0;
    for(const el of items) {
      if(el.closest("[hidden]") || el.getBoundingClientRect().top < innerHeight*.85)continue;
      el.style.setProperty("--mv-stagger",((position++%3)*65)+"ms");
      el.classList.add("mv-reveal");
      observer.observe(el);
    }
  }
  const bar=document.createElement("div");bar.className="mv-progress";bar.setAttribute("aria-hidden","true");document.body.appendChild(bar);
  let scheduled=false;
  function draw(){
    scheduled=false;
    const range=document.documentElement.scrollHeight-innerHeight;
    const ratio=range>0?Math.min(1,Math.max(0,scrollY/range)):0;
    bar.style.transform="scaleX("+ratio.toFixed(4)+")";
  }
  function measure(){if(!scheduled){scheduled=true;requestAnimationFrame(draw)}}
  addEventListener("scroll",measure,{passive:true});
  addEventListener("resize",measure,{passive:true});
  measure();
  function disable(){
    document.body.classList.remove("motion-ready");
    if(observer)observer.disconnect();
    document.querySelectorAll(".mv-reveal").forEach(el=>{el.classList.remove("mv-reveal");el.classList.add("mv-visible")});
    bar.remove();
    removeEventListener("scroll",measure);removeEventListener("resize",measure);
  }
  if(preference.addEventListener)preference.addEventListener("change",event=>{if(event.matches)disable()});
})();
