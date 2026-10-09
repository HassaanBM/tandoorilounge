/* Tandoori Lounge - main brand page (root index.html) behaviour.
   Needs the shared libraries from assets/vendor (GSAP, ScrollTrigger, Lenis),
   loaded with defer before this file. Moved out of the page unchanged. */
(function(){
"use strict";
var root=document.documentElement;
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
var NEWSLETTER_ENDPOINT=""; // Set to your form endpoint. Empty means demo mode: nothing is sent.
function $(s,c){return (c||document).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
var hasG=typeof gsap!=="undefined";
if(hasG&&typeof ScrollTrigger!=="undefined")gsap.registerPlugin(ScrollTrigger);

/* split text into masked words (keeps <em>) */
function split(el){
  var frag=document.createDocumentFragment();
  (function walk(node,parent){
    Array.prototype.forEach.call(node.childNodes,function(n){
      if(n.nodeType===3){
        n.textContent.split(/(\s+)/).forEach(function(t){
          if(!t)return;
          if(/^\s+$/.test(t)){parent.appendChild(document.createTextNode(" "));return}
          var w=document.createElement("span");w.className="w";
          var i=document.createElement("span");i.textContent=t;w.appendChild(i);parent.appendChild(w);
        });
      }else if(n.nodeType===1){var c=n.cloneNode(false);parent.appendChild(c);walk(n,c)}
    });
  })(el,frag);
  el.textContent="";el.appendChild(frag);
  return $$(".w>span",el);
}

/* smooth scroll */
var lenis=null;
if(typeof Lenis!=="undefined"&&!reduce){
  lenis=new Lenis({lerp:.1,smoothWheel:true});
  if(hasG&&window.ScrollTrigger){lenis.on("scroll",ScrollTrigger.update);gsap.ticker.add(function(t){lenis.raf(t*1000)});gsap.ticker.lagSmoothing(0)}
  else{(function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(0)}
}
$$('a[href^="#"]').forEach(function(a){
  a.addEventListener("click",function(e){
    var id=a.getAttribute("href");if(id.length<2)return;
    var t=$(id);if(!t)return;e.preventDefault();
    if(lenis)lenis.scrollTo(t,{offset:-68,duration:1.1});else t.scrollIntoView({behavior:reduce?"auto":"smooth"});
  });
});

/* hero entrance */
var heroDone=false;
function runHero(){
  if(heroDone)return;heroDone=true;
  if(!hasG||reduce)return;
  var h1=$(".hero h1"),words=split(h1);
  gsap.set(words,{yPercent:115});
  var tl=gsap.timeline({defaults:{ease:"power4.out"}});
  tl.from("[data-hero-art] img",{scale:1.08,duration:1.6,ease:"power3.out"},0)
    .to("[data-hero-art]",{clipPath:"inset(0% 0% 0% 0%)",duration:1,ease:"power4.inOut"},0)
    .to(words,{yPercent:0,duration:.8,stagger:.06},.15)
    .from($$("[data-h]"),{autoAlpha:0,y:18,duration:.7,stagger:.1,ease:"power3.out"},.3);
}
function prepHero(){
  if(!hasG||reduce)return;
  gsap.set("[data-hero-art]",{clipPath:"inset(0 0 100% 0)"});
}

/* preloader: same sequence as the main site */
var intro=$("#intro");
function endIntro(){
  root.classList.remove("is-intro");
  try{sessionStorage.setItem("tl_intro_seen","1")}catch(e){}
  if(lenis)lenis.start();
  if(window.ScrollTrigger)ScrollTrigger.refresh();
}
if(root.classList.contains("is-intro")){
  if(!intro||!hasG){endIntro();runHero()}
  else{
    var words=$$("[data-word]",intro),mark=$("[data-intro-mark]",intro),sub=$("[data-intro-sub]",intro),stage=$("[data-intro-stage]",intro);
    if(lenis)lenis.stop();
    window.scrollTo(0,0);
    prepHero();
    gsap.set(words,{yPercent:115,opacity:1});
    gsap.set([mark,sub],{autoAlpha:0,y:10});
    var HOLD=2.3;
    var itl=gsap.timeline({paused:true,onComplete:endIntro});
    itl.to(words,{yPercent:0,duration:.7,ease:"power4.out",stagger:.07},.1)
      .to(mark,{autoAlpha:1,y:0,duration:.5,ease:"sine.out"},.1)
      .to(sub,{autoAlpha:1,y:0,duration:.5,ease:"sine.out"},.8)
      .addPause(HOLD,function(){
        var go=function(){itl.play()};
        if(document.readyState==="complete")go();else{window.addEventListener("load",go,{once:true});setTimeout(go,4000)}
      })
      .add(runHero,HOLD)
      .to(stage,{yPercent:-12,autoAlpha:0,duration:.55,ease:"power2.in"},HOLD)
      .to(intro,{clipPath:"inset(0% 0% 100% 0%)",duration:.85,ease:"power4.inOut"},HOLD+.08);
    var started=false;
    var begin=function(){if(!started){started=true;itl.play()}};
    Promise.race([document.fonts.load('1em "Rowdies"'),new Promise(function(r){setTimeout(r,1200)})]).then(begin,begin);
    setTimeout(function(){if(root.classList.contains("is-intro")){itl.progress(1)}},9000);
  }
}else{prepHero();runHero()}

/* scroll reveals */
if(hasG&&window.ScrollTrigger&&!reduce){
  $$("[data-split]").forEach(function(el){
    if(el.closest(".hero"))return;
    var ws=split(el);gsap.set(ws,{yPercent:115});
    ScrollTrigger.create({trigger:el,start:"top 88%",once:true,onEnter:function(){gsap.to(ws,{yPercent:0,duration:.8,ease:"power4.out",stagger:.05})}});
  });
  var rev=$$("[data-reveal]");
  gsap.set(rev,{autoAlpha:0,y:24});
  ScrollTrigger.batch(rev,{start:"top 90%",once:true,onEnter:function(b){gsap.to(b,{autoAlpha:1,y:0,duration:.8,ease:"power3.out",stagger:.12,overwrite:true})},onLeave:function(b){gsap.to(b,{autoAlpha:1,y:0,duration:.3,overwrite:true})}});
  $$(".q").forEach(function(){});
  gsap.set(".q",{autoAlpha:0,y:24});
  ScrollTrigger.batch(".q",{start:"top 92%",once:true,onEnter:function(b){gsap.to(b,{autoAlpha:1,y:0,duration:.8,ease:"power3.out",stagger:.12})},onLeave:function(b){gsap.to(b,{autoAlpha:1,y:0,duration:.3,overwrite:true})}});
  gsap.set(".dish",{autoAlpha:0,y:24});
  ScrollTrigger.batch(".dish",{start:"top 95%",once:true,onEnter:function(b){gsap.to(b,{autoAlpha:1,y:0,duration:.8,ease:"power3.out",stagger:.1})},onLeave:function(b){gsap.to(b,{autoAlpha:1,y:0,duration:.3,overwrite:true})}});
}

/* sticky bar: shows after the first fold, marks the section in view */
(function(){
  var bar=$("#sbar"),hero=$("[data-hero]");if(!bar||!hero)return;
  function set(show){bar.setAttribute("data-hidden",show?"false":"true")}
  if("IntersectionObserver" in window){
    new IntersectionObserver(function(es){set(!es[0].isIntersecting||es[0].intersectionRatio<.25)},{threshold:[0,.25,.5]}).observe(hero);
  }else set(true);
  var links=$$("[data-sec]",bar),map={};
  links.forEach(function(l){map[l.getAttribute("data-sec")]=l});
  function mark(id){links.forEach(function(l){l.classList.toggle("on",l.getAttribute("data-sec")===id)})}
  if("IntersectionObserver" in window){
    var vis={};
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){vis[e.target.id]=e.isIntersecting?e.intersectionRatio:0});
      var best=null,bv=0;Object.keys(vis).forEach(function(k){if(vis[k]>bv){bv=vis[k];best=k}});
      mark(best);
    },{rootMargin:"-30% 0px -40% 0px",threshold:[0,.1,.5,1]});
    ["start","dishes","reviews","visit"].forEach(function(id){var s=document.getElementById(id);if(s)io.observe(s)});
  }
})();

/* newsletter accordion */
(function(){
  var b=$("#news-btn"),p=$("#news-panel");if(!b||!p)return;
  var open=false;
  b.addEventListener("click",function(){
    open=!open;b.setAttribute("aria-expanded",open?"true":"false");
    if(open){
      p.hidden=false;
      if(hasG&&!reduce){gsap.fromTo(p,{height:0},{height:"auto",duration:.5,ease:"power3.out",onComplete:function(){if(window.ScrollTrigger)ScrollTrigger.refresh()}})}
      setTimeout(function(){var i=$("#em");if(i)i.focus({preventScroll:true})},reduce?0:350);
    }else{
      if(hasG&&!reduce){gsap.to(p,{height:0,duration:.4,ease:"power3.inOut",onComplete:function(){p.hidden=true}})}
      else p.hidden=true;
    }
  });
})();

/* dish rail arrows */
(function(){
  var rail=$("[data-rail]");if(!rail)return;
  var prev=$("[data-prev]"),next=$("[data-next]");
  function step(){var d=$(".dish",rail);return d?d.getBoundingClientRect().width+20:300}
  function upd(){prev.disabled=rail.scrollLeft<4;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-4}
  prev.addEventListener("click",function(){rail.scrollBy({left:-step(),behavior:reduce?"auto":"smooth"})});
  next.addEventListener("click",function(){rail.scrollBy({left:step(),behavior:reduce?"auto":"smooth"})});
  rail.addEventListener("scroll",upd,{passive:true});addEventListener("resize",upd);upd();
  rail.addEventListener("keydown",function(e){
    if(e.key==="ArrowRight"){rail.scrollBy({left:step(),behavior:"smooth"});e.preventDefault()}
    if(e.key==="ArrowLeft"){rail.scrollBy({left:-step(),behavior:"smooth"});e.preventDefault()}
  });
})();

/* image fallback */
function chk(){$$("img").forEach(function(im){if(im.complete&&!im.naturalWidth)im.style.visibility="hidden"})}
$$("img").forEach(function(im){im.addEventListener("error",function(){im.style.visibility="hidden"},{once:true})});
chk();addEventListener("load",chk);

/* newsletter */
(function(){
  var f=$("#news");if(!f)return;
  var msg=$(".news .msg"),inp=$("#em");
  f.addEventListener("submit",function(e){
    e.preventDefault();
    var v=inp.value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){msg.textContent="Enter a valid email address.";inp.setAttribute("aria-invalid","true");inp.focus();return}
    inp.removeAttribute("aria-invalid");
    if(!NEWSLETTER_ENDPOINT){msg.textContent="Thank you. You are on the list.";f.reset();return}
    msg.textContent="Sending...";
    fetch(NEWSLETTER_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:v})})
      .then(function(r){if(!r.ok)throw 0;msg.textContent="Thank you. You are on the list.";f.reset()})
      .catch(function(){msg.textContent="We could not save your email. Please try again."});
  });
})();
})();
