(function () {
  "use strict";
  var CFG = window.TL_CONFIG || {};
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return "$" + n.toFixed(2); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var ICON = {
    plus: '<svg class="ico" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>',
    minus: '<svg class="ico" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"/></svg>'
  };

  /* ---------- Theme: light by default, dark on request ---------- */
  function applyTheme(t) {
    if (t === "dark") root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
    $$("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
    var m = $('meta[name="theme-color"]'); if (m) m.setAttribute("content", t === "dark" ? "#14110F" : "#F2EFE9");
  }
  function currentTheme() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  applyTheme(currentTheme());
  $$("[data-theme-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next); store.set("tl_theme", next); store.set("tl_theme_asked", "1"); hidePrompt();
    });
  });
  var prompt = $("#theme-prompt");
  function hidePrompt() { if (!prompt) return; prompt.classList.remove("show"); setTimeout(function () { prompt.hidden = true; }, 500); }
  function showThemePrompt() {
    if (!prompt || store.get("tl_theme_asked") || currentTheme() === "dark") return;
    setTimeout(function () { prompt.hidden = false; requestAnimationFrame(function () { prompt.classList.add("show"); }); }, 1400);
  }
  if (prompt) {
    $("[data-theme-yes]", prompt).addEventListener("click", function () { applyTheme("dark"); store.set("tl_theme", "dark"); store.set("tl_theme_asked", "1"); hidePrompt(); });
    $("[data-theme-no]", prompt).addEventListener("click", function () { store.set("tl_theme_asked", "1"); hidePrompt(); });
    prompt.addEventListener("keydown", function (e) { if (e.key === "Escape") { store.set("tl_theme_asked", "1"); hidePrompt(); } });
  }

  /* ---------- Smooth scroll (Lenis) and GSAP: both optional ---------- */
  var hasGsap = !!(window.gsap && window.ScrollTrigger) && !reduce;
  var lenis = null;
  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); root.classList.add("gsap-on"); }
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var tick = function (t) { lenis.raf(t); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      var t = id && id !== "main" ? document.getElementById(id) : null;
      if (!t) return;
      e.preventDefault();
      var h = ($(".head") || { offsetHeight: 0 }).offsetHeight + ($(".chips") || { offsetHeight: 0 }).offsetHeight;
      lenis.scrollTo(t, { offset: -(h + 8) });
      try { history.replaceState(null, "", "#" + id); } catch (x) {}
    });
  }

  /* ---------- Curtain menu (GSAP timeline, plays forward to open and reverses to close) ---------- */
  var mb = $(".menu-btn"), dr = $("#drawer");
  var menuTl = null;
  if (mb && dr) {
    var veil = $(".drawer__veil", dr), panel = $(".drawer__panel", dr), links = $$("a", panel);
    if (hasGsap) {
      menuTl = gsap.timeline({ paused: true, onReverseComplete: function () { dr.classList.remove("open"); } });
      menuTl.fromTo(veil, { yPercent: -100 }, { yPercent: 0, duration: 0.6, ease: "power4.inOut" }, 0)
        .fromTo(panel, { yPercent: -100 }, { yPercent: 0, duration: 0.65, ease: "power4.inOut" }, 0.1)
        .fromTo(links, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out", stagger: 0.04 }, 0.4);
    }
    dr.setAttribute("inert", "");
    var setDrawer = function (open) {
      mb.setAttribute("aria-expanded", open ? "true" : "false");
      mb.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      dr.toggleAttribute("inert", !open);
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
      root.classList.toggle("lock", open);
      if (open) { dr.classList.add("open"); if (menuTl) menuTl.timeScale(1).play(); }
      else if (menuTl) menuTl.timeScale(1.3).reverse();
      else dr.classList.remove("open");
    };
    mb.addEventListener("click", function () { setDrawer(mb.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && mb.getAttribute("aria-expanded") === "true") { setDrawer(false); mb.focus(); } });
    links.forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });
    matchMedia("(min-width:1100px)").addEventListener("change", function (e) { if (e.matches && mb.getAttribute("aria-expanded") === "true") setDrawer(false); });
  }

  /* ---------- Hero entrance and plate parallax ---------- */
  var heroDone = false;
  function runHero() {
    if (heroDone) return; heroDone = true;
    if (!hasGsap) return;
    var tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    var hc = $$(".hero__copy > *");
    if (hc.length) tl.from(hc, { y: 22, opacity: 0, duration: 0.9, stagger: 0.09 }, 0);
    var arch = $(".hero__art .arch");
    if (arch) tl.from(arch, { yPercent: 6, opacity: 0, duration: 1 }, 0.05);
    var plates = $$(".hero__art .plate");
    if (plates.length) {
      tl.from(plates, { scale: 0.7, opacity: 0, duration: 1, stagger: 0.12, ease: "back.out(1.3)" }, 0.2);
      var shift = [-8, 6, -14];
      plates.forEach(function (el, i) {
        gsap.to(el, { yPercent: shift[i] || 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      });
    }
  }

  /* ---------- Intro preloader: words rise through masks, then the screen lifts like a curtain ---------- */
  var intro = $("#intro");
  function endIntro() {
    root.classList.remove("is-intro");
    try { sessionStorage.setItem("tl_intro_seen", "1"); } catch (e) {}
    if (lenis) lenis.start();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    showThemePrompt();
  }
  if (root.classList.contains("is-intro")) {
    if (!intro || !hasGsap) { endIntro(); runHero(); }
    else {
      var words = $$("[data-word]", intro), mark = $("[data-intro-mark]", intro), sub = $("[data-intro-sub]", intro), stage = $("[data-intro-stage]", intro);
      if (lenis) lenis.stop();
      window.scrollTo(0, 0);
      gsap.set(words, { yPercent: 115, opacity: 1 });
      gsap.set([mark, sub], { autoAlpha: 0, y: 10 });
      var HOLD = 2.3;
      var itl = gsap.timeline({ paused: true, onComplete: endIntro });
      itl.to(words, { yPercent: 0, duration: 0.7, ease: "power4.out", stagger: 0.07 }, 0.1)
        .to(mark, { autoAlpha: 1, y: 0, duration: 0.5, ease: "sine.out" }, 0.1)
        .to(sub, { autoAlpha: 1, y: 0, duration: 0.5, ease: "sine.out" }, 0.8)
        .addPause(HOLD, function () {
          var go = function () { itl.play(); };
          if (document.readyState === "complete") go(); else { window.addEventListener("load", go, { once: true }); setTimeout(go, 4000); }
        })
        .add(runHero, HOLD)
        .to(stage, { yPercent: -12, autoAlpha: 0, duration: 0.55, ease: "power2.in" }, HOLD)
        .to(intro, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.85, ease: "power4.inOut" }, HOLD + 0.08);
      var started = false;
      var begin = function () { if (!started) { started = true; itl.play(); } };
      Promise.race([document.fonts.load('1em "Rowdies"'), new Promise(function (r) { setTimeout(r, 1200); })]).then(begin, begin);
      setTimeout(function () { if (root.classList.contains("is-intro")) { itl.progress(1); } }, 9000);
    }
  } else {
    runHero();
    showThemePrompt();
  }

  /* ---------- Reveal on scroll ---------- */
  var rev = $$("[data-reveal]");
  if (hasGsap) {
    gsap.set(rev, { opacity: 0, y: 24 });
    ScrollTrigger.batch(rev, {
      start: "top 90%", once: true,
      onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.8, ease: "power4.out", stagger: 0.08, overwrite: true, clearProps: "transform" }); }
    });
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  } else if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    rev.forEach(function (el, i) { el.style.setProperty("--i", i % 4); io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- Dish rail: arrows, mouse drag, no visible scrollbar ---------- */
  $$(".rail").forEach(function (rail) {
    var prev = $("[data-rail-prev]"), next = $("[data-rail-next]");
    var step = function () { var c = rail.children[0]; return c ? c.getBoundingClientRect().width + 14 : 320; };
    if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }); });
    if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }); });
    if ("IntersectionObserver" in window && rail.children.length) {
      var edge = function (el, btn) {
        if (!btn) return;
        new IntersectionObserver(function (es) { btn.disabled = es[0].intersectionRatio > 0.95; }, { root: rail, threshold: [0, 0.95, 1] }).observe(el);
      };
      edge(rail.children[0], prev); edge(rail.children[rail.children.length - 1], next);
    }
    rail.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { rail.scrollBy({ left: step(), behavior: "smooth" }); e.preventDefault(); }
      if (e.key === "ArrowLeft") { rail.scrollBy({ left: -step(), behavior: "smooth" }); e.preventDefault(); }
    });
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest("button,a")) return;
      down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; rail.classList.add("dragging"); }
      if (moved) rail.scrollLeft = sl - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return; down = false;
      rail.classList.remove("dragging");
      var st = step(), idx = Math.round(rail.scrollLeft / st);
      if (moved) rail.scrollTo({ left: idx * st, behavior: "smooth" });
    });
    rail.addEventListener("click", function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    $$("img", rail).forEach(function (i) { i.draggable = false; });
  });

  /* ---------- Cart ---------- */
  var KEY = "tl_cart_v1";
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cart = {}; }
  function save() { store.set(KEY, JSON.stringify(cart)); }
  function count() { return Object.keys(cart).reduce(function (n, k) { return n + cart[k].q; }, 0); }
  function subtotal() { return Object.keys(cart).reduce(function (n, k) { return n + cart[k].q * cart[k].p; }, 0); }
  function setQty(id, name, price, q, spice) {
    if (q <= 0) delete cart[id];
    else if (cart[id]) cart[id].q = Math.min(q, 30);
    else cart[id] = { n: name, p: price, q: 1, s: !!spice, sp: spice ? "Medium" : "", nt: "" };
    save(); renderAll();
  }
  function actHTML(el) {
    var id = el.dataset.id, q = cart[id] ? cart[id].q : 0, nm = el.dataset.name, block = el.dataset.variant === "block";
    if (!q) {
      return block
        ? '<button type="button" class="btn" data-add aria-label="Add ' + nm + ' to order">' + ICON.plus + "Add to order</button>"
        : '<button type="button" class="add" data-add aria-label="Add ' + nm + ' to order">' + ICON.plus + "</button>";
    }
    return '<div class="step" role="group" aria-label="' + nm + ' quantity"><button type="button" data-dec aria-label="Remove one ' + nm + '">' + ICON.minus + '</button><output aria-live="polite">' + q + '</output><button type="button" data-inc aria-label="Add one ' + nm + '">' + ICON.plus + "</button></div>";
  }
  function renderActs() { $$("[data-id]").forEach(function (el) { var slot = $(".act", el); if (slot) slot.innerHTML = actHTML(el); }); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add],[data-inc],[data-dec]"); if (!b) return;
    var el = b.closest("[data-id]"); if (!el || el.closest("#cp-list")) return;
    var id = el.dataset.id, cur = cart[id] ? cart[id].q : 0, p = parseFloat(el.dataset.price);
    var next = b.hasAttribute("data-dec") ? cur - 1 : cur + 1;
    setQty(id, el.dataset.name, p, next, el.hasAttribute("data-spice"));
    if (next > 0 && !b.hasAttribute("data-dec")) { var inc = $("[data-inc]", el); if (inc) inc.focus(); }
  });


  /* ---------- Dropdown (touch and keyboard) ---------- */
  $$("[data-dd]").forEach(function (dd) {
    var btn = $(".dd__btn", dd);
    function set(o) { dd.classList.toggle("open", o); btn.setAttribute("aria-expanded", o ? "true" : "false"); }
    btn.addEventListener("click", function () { set(!dd.classList.contains("open")); });
    document.addEventListener("click", function (e) { if (!dd.contains(e.target)) set(false); });
    dd.addEventListener("keydown", function (e) { if (e.key === "Escape") { set(false); btn.focus(); } });
  });


  /* ---------- Header shrinks after scroll (observer, no scroll listener) ---------- */
  (function () {
    var head = $(".head"), sen = $("[data-head-sentinel]");
    if (!head || !sen || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (es) { head.classList.toggle("is-small", !es[0].isIntersecting); }, { threshold: 0 }).observe(sen);
  })();

  /* ---------- Video: tap to play ---------- */
  $$("[data-vid]").forEach(function (box) {
    var v = $("video", box), b = $("[data-vid-play]", box);
    if (!v || !b) return;
    b.addEventListener("click", function () {
      v.controls = true; box.classList.add("playing");
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () { box.classList.remove("playing"); v.controls = false; });
      v.focus();
    });
    v.addEventListener("ended", function () { v.controls = false; box.classList.remove("playing"); v.load(); });
  });

  /* ---------- Lightbox ---------- */
  (function () {
    var lb = $("#lightbox"); if (!lb) return;
    var groups = $$("[data-lightbox]"); if (!groups.length) return;
    var stage = $("[data-lb-stage]", lb), fig = $(".lb__fig", lb), img = $("img", fig), cap = $("figcaption", fig), cnt = $(".lb__count", lb);
    var items = [], idx = 0, opener = null, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function srcOf(el) { var i = $("img", el); return { src: i.currentSrc || i.src, alt: i.alt }; }
    function full(u) { return u.replace(/\/(small|medium)(\?.*)?$/, "/full"); }
    function show(n, dir) {
      idx = (n + items.length) % items.length;
      var it = items[idx];
      function swap() {
        img.src = full(it.src); img.alt = it.alt; cap.textContent = it.alt; cnt.textContent = (idx + 1) + " of " + items.length;
        fig.style.transition = "none"; fig.style.transform = "translateX(" + (dir ? dir * 60 : 0) + "px)"; fig.style.opacity = dir ? "0" : "1";
        requestAnimationFrame(function () { requestAnimationFrame(function () { fig.style.transition = ""; fig.style.transform = ""; fig.style.opacity = "1"; }); });
        [idx + 1, idx - 1].forEach(function (k) { var o = items[(k + items.length) % items.length]; if (o) { var p = new Image(); p.src = full(o.src); } });
      }
      if (dir && !reduce) { fig.style.opacity = "0"; fig.style.transform = "translateX(" + (-dir * 60) + "px)"; setTimeout(swap, 160); } else swap();
    }
    function open(group, n, from) {
      items = $$(".lb-open", group).map(srcOf); opener = from;
      lb.hidden = false; root.classList.add("lock"); if (lenis) lenis.stop();
      show(n, 0); requestAnimationFrame(function () { lb.classList.add("show"); });
      $("[data-lb-close]", lb).focus();
    }
    function close() {
      lb.classList.remove("show"); root.classList.remove("lock"); if (lenis) lenis.start();
      setTimeout(function () { lb.hidden = true; img.removeAttribute("src"); }, reduce ? 0 : 300);
      if (opener && opener.focus) opener.focus();
    }
    groups.forEach(function (g) {
      g.addEventListener("click", function (e) {
        var b = e.target.closest(".lb-open"); if (!b) return;
        var all = $$(".lb-open", g); open(g, all.indexOf(b), b);
      });
    });
    $$("[data-lb-close]", lb).forEach(function (b) { b.addEventListener("click", close); });
    $("[data-lb-prev]", lb).addEventListener("click", function () { show(idx - 1, -1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { show(idx + 1, 1); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1, -1);
      else if (e.key === "ArrowRight") show(idx + 1, 1);
      else if (e.key === "Tab") {
        var f = $$("button", lb).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    // Drag or swipe to change photo. Tap outside the photo to close.
    var sx = 0, dx = 0, drag = false, moved = false;
    stage.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return;
      drag = true; moved = false; sx = e.clientX; dx = 0;
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag) return;
      dx = e.clientX - sx;
      if (Math.abs(dx) > 8) { moved = true; fig.style.transition = "none"; fig.style.transform = "translateX(" + dx + "px)"; }
    });
    function end() {
      if (!drag) return; drag = false;
      fig.style.transition = "";
      if (moved && Math.abs(dx) > 60) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      else fig.style.transform = "";
    }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    stage.addEventListener("click", function (e) {
      if (moved) { moved = false; return; }
      if (!e.target.closest(".lb__fig img")) close();
    });
  })();

  /* ---------- Dish details window (menu page) ---------- */
  (function () {
    var dm = $("#dish-modal"); if (!dm) return;
    var card = $(".dm__card", dm), media = $(".dm__media", dm), tagsEl = $(".dm__tags", dm), reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var opener = null, heatNames = ["", "Mild", "Medium", "Hot"];
    function fill(li) {
      var d = {}; try { d = JSON.parse(li.dataset.info); } catch (e) {}
      var name = li.dataset.name;
      $("#dm-t", dm).textContent = name; $(".dm__cat", dm).textContent = d.cat || "";
      $(".dm__desc", dm).textContent = d.d || "";
      $(".dm__desc", dm).hidden = !d.d;
      var idx = $$(".item").indexOf(li) % 3;
      media.className = "dm__media" + (idx === 1 ? " b" : idx === 2 ? " c" : "");
      media.innerHTML = d.img ? '<img src="' + d.img + '" alt="' + esc(d.alt || name) + '">' : '<span class="dm__ph" aria-hidden="true"></span><span class="dm__soon">Photo coming soon</span>';
      if (!d.img) { var src = $(".tile .ico", li); if (src) $(".dm__ph", media).appendChild(src.cloneNode(true)); $(".dm__ph .ico", media) && ($(".dm__ph .ico", media).setAttribute("class", "ico")); }
      var tg = [];
      if (d.alcohol) tg.push('<li class="hl"><span class="age">21+</span>Ages 21 and over</li>');
      else if (!d.diet) tg.push('<li><span class="diet diet--veg"></span>No alcohol</li>');
      else tg.push('<li>' + (d.diet === "veg" ? '<span class="diet diet--veg"></span>Vegetarian' : d.diet === "egg" ? '<span class="diet diet--egg"></span>Contains egg' : '<span class="diet diet--nonveg"></span>Non-vegetarian') + "</li>");
      if (d.heat) tg.push("<li>Usually " + heatNames[d.heat].toLowerCase() + "</li>");
      (d.tags || []).forEach(function (t) { if (t === "Ages 21 and over" || t === "No alcohol") return; tg.push('<li' + (/first timers|favorite/i.test(t) ? ' class="hl"' : "") + ">" + esc(t) + "</li>"); });
      tagsEl.innerHTML = tg.join("");
      $(".dm__note span", dm).textContent = d.alcohol ? "Alcohol is for guests aged 21 and over. Bring a valid photo ID. Drink responsibly." : d.diet === "" ? "Allergies or diet needs? Tell your server." : "Allergies or diet needs? Tell your server. Vegan and gluten-free options are available on request.";
      $(".dm__heatn", dm).textContent = d.diet === "" ? "Ask your server about the heat." : "You can ask for mild, medium or hot.";
      var h = $(".dm__heat", dm); h.hidden = !d.heat;
      if (d.heat) { $$(".heat span", h).forEach(function (s, i) { s.className = i < d.heat ? "on" : ""; }); $(".dm__heatl", h).textContent = heatNames[d.heat]; }
      var ig = $(".dm__ing", dm); ig.hidden = !(d.ing && d.ing.length);
      if (d.ing) $("ul", ig).innerHTML = d.ing.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
      $(".dm__price", dm).textContent = money(parseFloat(li.dataset.price));
      var add = $(".dm__add", dm);
      add.dataset.id = li.dataset.id; add.dataset.name = name; add.dataset.price = li.dataset.price;
      if (li.hasAttribute("data-spice")) add.setAttribute("data-spice", ""); else add.removeAttribute("data-spice");
      renderActs();
    }
    function open(li) {
      opener = document.activeElement; fill(li);
      dm.hidden = false; root.classList.add("lock"); if (lenis) lenis.stop();
      requestAnimationFrame(function () { dm.classList.add("show"); });
      $(".dm__x", dm).focus(); card.scrollTop = 0;
    }
    function close() {
      dm.classList.remove("show"); root.classList.remove("lock"); if (lenis) lenis.start();
      setTimeout(function () { dm.hidden = true; }, reduce ? 0 : 420);
      if (opener && opener.focus) opener.focus();
    }
    document.addEventListener("click", function (e) {
      if (dm.hidden) {
        var li = e.target.closest(".item"); if (!li || e.target.closest(".item__act")) return;
        open(li);
      } else if (e.target.closest("[data-dm-close]")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (dm.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "Tab") {
        var f = $$("button,a[href]", card).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
  })();

  /* ---------- 404: spin the plate ---------- */
  (function () {
    var nf = $("[data-nf]"); if (!nf) return;
    var dishes = []; try { dishes = JSON.parse(nf.dataset.nf); } catch (e) {}
    if (!dishes.length) return;
    var i = 0, plate = $(".nf__plate", nf), img = $("img", plate), add = $("[data-nf-add]", nf), busy = false;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function apply(d) {
      img.src = d.img; img.alt = d.alt;
      $("[data-nf-name]", nf).textContent = d.n; $("[data-nf-price]", nf).textContent = money(d.p);
      add.dataset.id = d.id; add.dataset.name = d.n; add.dataset.price = d.p;
      if (d.sp) add.setAttribute("data-spice", ""); else add.removeAttribute("data-spice");
      renderActs();
    }
    function spin() {
      if (busy) return;
      i = (i + 1) % dishes.length;
      if (!hasGsap || reduce) { apply(dishes[i]); return; }
      busy = true;
      gsap.timeline({ onComplete: function () { busy = false; } })
        .to(plate, { rotation: "+=360", scale: 0.86, duration: 0.55, ease: "power3.in" })
        .add(function () { apply(dishes[i]); })
        .to(plate, { rotation: "+=360", scale: 1, duration: 0.75, ease: "back.out(1.4)" });
    }
    $$("[data-nf-spin]", nf).forEach(function (b) { b.addEventListener("click", spin); });
    if (hasGsap && !reduce) {
      gsap.from(".nf__n", { y: 40, autoAlpha: 0, duration: 0.8, ease: "power4.out", stagger: 0.12, delay: 0.1 });
      gsap.from(plate, { scale: 0, rotation: -200, duration: 1, ease: "back.out(1.5)", delay: 0.25 });
      gsap.from(".nf > *:not(.nf__stage)", { y: 18, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, delay: 0.5 });
      if (window.matchMedia("(hover:hover)").matches) {
        var stage = $(".nf__stage", nf);
        stage.addEventListener("pointermove", function (e) {
          var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5;
          if (!busy) gsap.to(plate, { x: x * 18, duration: 0.6, ease: "power3.out", overwrite: "auto" });
        });
        stage.addEventListener("pointerleave", function () { if (!busy) gsap.to(plate, { x: 0, duration: 0.6, ease: "power3.out" }); });
      }
    }
  })();
  /* ---------- Cart panel (header) ---------- */
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function modsText(c) {
    var t = []; if (c.s && c.sp) t.push("Spice: " + c.sp); if (c.nt) t.push("Note: " + esc(c.nt));
    return t.length ? '<p class="mods-txt">' + t.join(". ") + "</p>" : "";
  }
  var panel = $("#cart-panel"), scrim = $(".scrim"), pList = $("#cp-list");
  var openers = $$("[data-cart-open]"), lastOpener = null;
  function renderPanel() {
    var n = count();
    $$("[data-cart-badge]").forEach(function (b) { b.textContent = n; b.hidden = !n; });
    openers.forEach(function (o) { o.setAttribute("aria-label", "Open order, " + n + (n === 1 ? " item" : " items")); });
    if (!panel || !pList) return;
    if (panel.contains(document.activeElement) && document.activeElement.matches("input")) return; // do not rebuild while typing
    var ids = Object.keys(cart);
    $("#cp-empty").hidden = ids.length > 0; $("#cp-foot").hidden = ids.length === 0;
    $("#cp-sum").textContent = money(subtotal());
    pList.innerHTML = ids.map(function (id) {
      var c = cart[id], nm = esc(c.n);
      var mods = (c.s ? '<label>Spice level<select data-mod="sp" aria-label="Spice level for ' + nm + '">' + ["Mild", "Medium", "Hot"].map(function (o) { return "<option" + (c.sp === o ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select></label>" : "") +
        '<label>Note for the kitchen<input type="text" data-mod="nt" maxlength="120" value="' + esc(c.nt || "") + '" placeholder="Optional" aria-label="Note for ' + nm + '"></label>';
      return '<li data-id="' + id + '" data-name="' + nm + '" data-price="' + c.p + '"><span class="nm">' + nm + '</span><span class="lp">' + money(c.p * c.q) + '</span><div class="cartp__mods">' + mods + '</div><div class="cartp__row"><div class="step" role="group" aria-label="' + nm + ' quantity"><button type="button" data-pdec aria-label="Remove one ' + nm + '">' + ICON.minus + '</button><output>' + c.q + '</output><button type="button" data-pinc aria-label="Add one ' + nm + '">' + ICON.plus + '</button></div><button type="button" class="cartp__rm" data-prm>Remove</button></div></li>';
    }).join("");
  }
  function setPanel(open) {
    if (!panel) return;
    if (open) {
      lastOpener = document.activeElement; panel.hidden = false; scrim.hidden = false;
      renderPanel();
      requestAnimationFrame(function () { panel.classList.add("show"); scrim.classList.add("show"); });
      root.classList.add("lock"); if (lenis) lenis.stop();
      var x = $("[data-cart-close]", panel); if (x) x.focus();
    } else {
      panel.classList.remove("show"); scrim.classList.remove("show");
      root.classList.remove("lock"); if (lenis) lenis.start();
      setTimeout(function () { panel.hidden = true; scrim.hidden = true; }, 420);
      if (lastOpener && lastOpener.focus) lastOpener.focus();
    }
  }
  openers.forEach(function (o) { o.addEventListener("click", function () { setPanel(true); }); });
  $$("[data-cart-close]").forEach(function (c) { c.addEventListener("click", function () { setPanel(false); }); });
  document.addEventListener("keydown", function (e) {
    if (!panel || panel.hidden) return;
    if (e.key === "Escape") { setPanel(false); return; }
    if (e.key === "Tab") {
      var f = $$("a[href],button,select,input", panel).filter(function (n) { return !n.closest("[hidden]"); });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  if (pList) {
    pList.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pinc],[data-pdec],[data-prm]"); if (!b) return;
      var li = b.closest("li"), id = li.dataset.id, c = cart[id]; if (!c) return;
      if (b.hasAttribute("data-prm")) delete cart[id]; else c.q = Math.max(0, Math.min(30, c.q + (b.hasAttribute("data-pinc") ? 1 : -1)));
      if (c.q <= 0) delete cart[id];
      save(); renderAll();
      var again = $('li[data-id="' + id + '"] ' + (b.hasAttribute("data-pinc") ? "[data-pinc]" : "[data-pdec]"), pList);
      if (again) again.focus(); else { var x = $("[data-cart-close]", panel); if (x) x.focus(); }
    });
    pList.addEventListener("change", function (e) {
      var m = e.target.closest("[data-mod]"); if (!m) return;
      var c = cart[m.closest("li").dataset.id]; if (!c) return;
      c[m.dataset.mod] = m.value; save(); renderCart();
    });
    pList.addEventListener("input", function (e) {
      var m = e.target.closest('[data-mod="nt"]'); if (!m) return;
      var c = cart[m.closest("li").dataset.id]; if (c) { c.nt = m.value; save(); renderCart(); }
    });
  }

  /* ---------- Bars ---------- */
  var barDef = $("#bar-default"), barCart = $("#bar-cart"), hero = $("[data-hero]");
  var hasMenu = !!$("[data-menu]"), noBar = document.body.hasAttribute("data-nobar");
  var heroGone = !hero;
  function renderBars() {
    if (noBar) return;
    var n = count();
    if (barCart) {
      $("#bar-count").textContent = n;
      $("#bar-sum").textContent = money(subtotal());
      var showCart = hasMenu && n > 0;
      barCart.hidden = !showCart;
      barCart.classList.toggle("show", showCart);
      if (barDef) { barDef.hidden = showCart; barDef.classList.toggle("show", !showCart && heroGone); }
    }
    document.body.classList.add("has-bar");
  }
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { heroGone = !es[0].isIntersecting; renderBars(); }, { threshold: 0.05 }).observe(hero);
  }

  /* ---------- Order page ---------- */
  var list = $("#cart-list");
  function renderCart() {
    if (!list) return;
    var ids = Object.keys(cart), empty = $("#cart-empty"), full = $("#cart-full");
    var dn = $("#order-form-done"), placed = !!dn && !dn.hidden;
    if (empty) empty.hidden = ids.length > 0 || placed;
    if (full) full.hidden = ids.length === 0;
    var side = $("#order-side"); if (side) side.hidden = ids.length === 0 && !placed;
    list.innerHTML = ids.map(function (id) {
      var c = cart[id];
      return '<li data-id="' + id + '" data-name="' + c.n.replace(/"/g, "&quot;") + '" data-price="' + c.p + '"><span class="nm">' + c.n + '</span><span class="lp">' + money(c.p * c.q) + '</span>' + modsText(c) + '<span class="act"></span></li>';
    }).join("");
    var t = $("#cart-total"); if (t) t.textContent = money(subtotal());
  }
  function renderAll() { renderCart(); renderActs(); renderBars(); renderPanel(); }

  /* ---------- Time slots and dates ---------- */
  function fmt(d) { return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  var pick = $("#pickup_time");
  if (pick) {
    var t0 = new Date(Date.now() + 30 * 60000); t0.setSeconds(0, 0);
    t0.setMinutes(Math.ceil(t0.getMinutes() / 30) * 30);
    var out = [];
    for (var i = 0; i < 48 && out.length < 24; i++) {
      var m = t0.getHours() * 60 + t0.getMinutes(), open = m >= 690 || m <= 170;
      if (open) out.push(fmt(t0)); else if (out.length) break;
      t0 = new Date(t0.getTime() + 30 * 60000);
    }
    out.forEach(function (s) { var o = document.createElement("option"); o.value = s; o.textContent = s; pick.appendChild(o); });
  }
  var dt = $('input[type="date"]');
  if (dt) { var n0 = new Date(); dt.min = n0.getFullYear() + "-" + String(n0.getMonth() + 1).padStart(2, "0") + "-" + String(n0.getDate()).padStart(2, "0"); }

  /* ---------- Menu chips follow scroll ---------- */
  var chips = $$(".chip");
  if (chips.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        chips.forEach(function (c) {
          var on = c.getAttribute("href") === "#" + e.target.id;
          c.classList.toggle("on", on);
          if (on) c.setAttribute("aria-current", "true"); else c.removeAttribute("aria-current");
          if (on && c.scrollIntoView) c.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
        });
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    $$(".mcat").forEach(function (s) { cio.observe(s); });
  }

  /* ---------- Forms ---------- */
  $$(".demo-notice").forEach(function (n) { n.hidden = !CFG.DEMO_MODE; });
  $$("[data-live]").forEach(function (n) { n.hidden = !!CFG.DEMO_MODE; });
  $$("[data-demo-msg]").forEach(function (n) { n.hidden = !CFG.DEMO_MODE; });
  function fieldErr(f, msg) {
    var box = $("#" + f.name + "-err"); f.setAttribute("aria-invalid", msg ? "true" : "false");
    if (box) box.textContent = msg || "";
  }
  $$("form[data-form]").forEach(function (form) {
    form.noValidate = true;
    form.addEventListener("input", function (e) { if (e.target.name) fieldErr(e.target, ""); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      $$("input,select,textarea", form).forEach(function (f) {
        if (!f.name || f.type === "hidden") return;
        var ok = f.checkValidity();
        fieldErr(f, ok ? "" : (f.dataset.msg || f.validationMessage));
        if (!ok && !bad) bad = f;
      });
      if (bad) { bad.focus(); return; }
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (form.dataset.form === "order") {
        if (!count()) { var ce = $("#cart-err"); if (ce) ce.textContent = "Add at least one dish to your order."; return; }
        data.items = Object.keys(cart).map(function (id) { var c = cart[id]; return { id: id, name: c.n, price: c.p, qty: c.q, spice_level: c.sp || "", note: c.nt || "" }; });
        data.subtotal = subtotal().toFixed(2);
      }
      var btn = $('button[type="submit"]', form); btn.disabled = true;
      var fail = $(".form-err", form); if (fail) fail.textContent = "";
      function ok() {
        form.hidden = true;
        var d = $("#" + form.dataset.done); if (d) { d.hidden = false; d.setAttribute("tabindex", "-1"); d.focus(); }
        if (form.dataset.form === "order") { cart = {}; save(); renderAll(); }
      }
      if (CFG.API_BASE) {
        fetch(CFG.API_BASE + form.dataset.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); ok(); })
          .catch(function () { btn.disabled = false; if (fail) fail.textContent = "We could not send this. Please try again or call " + (CFG.PHONE || "us") + "."; });
      } else {
        try { var log = JSON.parse(store.get("tl_demo_submissions") || "[]"); log.push({ form: form.dataset.form, at: new Date().toISOString(), data: data }); store.set("tl_demo_submissions", JSON.stringify(log)); } catch (x) {}
        ok();
      }
    });
  });

  renderAll();
})();
