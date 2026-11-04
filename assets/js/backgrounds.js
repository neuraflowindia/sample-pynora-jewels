/* Pynora backgrounds: the moving parts of the bands styled in backgrounds.css.
   - .is-near when a band is within 1.5 screens (its textures load), .is-live while it is on screen (its loops run);
     everything pauses when the band leaves the screen or the tab is hidden. Until the page's load event only the
     bands on the first screen load their textures, so the first screen's pictures come first.
   - .is-held (set by the motion scripts when more than three things would move on their own) pauses a band's loops
     and stops its lamp wandering; a mouse still leads the lamp.
   - The photographed surface drifts a little with scrolling (at most 36 px); the rose wall's drawing drifts more
     (0.3 x the scroll, at most 90 px).
   - With a mouse, each band's light leans towards the pointer (up to 8% of the band, smoothed over about 0.45 s).
   - The lamp on the maroon band and the footer follows the mouse (0.18 s) or wanders by itself. Its gold thread
     stays out of the clear zone; its warm light is never cut, it only eases down to --lamp-near over the words.
     The footer's flowers slide sideways (backgrounds.css); the lamp's gold reads their place every frame, so it
     stays in register with them.
   - The quiet sandstone gets its gliding light (.bg__sheen) from here.
   - Gold lines catch the light now and then: a narrow gleam runs along one divider or one gilt frame's mount line
     at a time (never two at once on the page, at least 3 s apart), each line every 7-11 s, only while it is wholly
     arrived on screen. The gleam is one short Web Animation of a transform (ornament.css styles it).
   - The clear zone behind the words is measured from elements marked data-bg-words.
   - When the visitor asks for less motion: no drift, no lean, no gleam, the lamp rests. Only transforms change
     here. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var nodes = doc.querySelectorAll('[data-bg]');
  if (!nodes.length) return;

  var bands = [];
  var byEl = typeof Map === 'function' ? new Map() : null;
  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var fineMq = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
  var reduce = !!(reduceMq && reduceMq.matches);
  var hidden = !!doc.hidden;
  var raf = 0;
  var last = 0;

  var TEX_DRIFT = 36;      /* px, the surface */
  var DRAW_RATE = 0.3;     /* the rose wall drawing, as a share of the scroll */
  var DRAW_MAX = 90;       /* px */
  var LEAN_TIME = 0.45;    /* s */
  var LAMP_TIME = 0.18;    /* s, following the mouse */
  var LAMP_RETURN = 1.1;   /* s, gliding back to its own path after the mouse leaves */
  /* The lamp's own path when no mouse leads it: x = .5 + .34 sin(2πt / 22 s), y = .45 + .26 sin(2πt / 15 s + 1.3) */
  var WORDS_PAD = 24;      /* px around the words that stays fully clear */
  var GLOW_REACH = 0.25;   /* the lamp's light is at full strength once its centre is this share of the lamp away
                              from the words; closer, it eases down to --lamp-near */
  var GLOW_TIME = 0.3;     /* s, so a quick sweep of the mouse never makes the light flicker */

  function px(n) { return n.toFixed(1) + 'px'; }
  function smooth(e) { e = Math.max(0, Math.min(1, e)); return e * e * (3 - 2 * e); }
  function make(cls) { var i = doc.createElement('i'); i.className = cls; i.setAttribute('aria-hidden', 'true'); return i; }

  /* ---------- Set up each band ---------- */
  Array.prototype.forEach.call(nodes, function (el, i) {
    var cls = el.classList;
    var b = {
      el: el,
      index: i,
      live: false,
      w: 0,
      h: 0,
      tex: el.querySelector('.bg__tex'),
      draw: null,
      words: el.querySelectorAll('[data-bg-words]'),
      box: null,
      lean: null,
      lamp: null,
      pat: null,
      slide: null,
      slideAmp: 1,
      mx: 0.5,
      my: 0.5,
      hover: false,
      clock: (window.performance && performance.now ? performance.now() : 0) / 1000
    };
    var leanEl = cls.contains('bg--silk') ? el.querySelector('.bg__b') : el.querySelector('.bg__a');
    if (!cls.contains('bg--lattice') && !cls.contains('bg--quiet') && leanEl) {
      b.lean = { el: leanEl, max: 0.08, x: 0, y: 0 };
    }
    /* moving parts get their own element, so moving them never repaints anything */
    var drawHost = cls.contains('bg--rose') ? el.querySelector('.bg__b') : null;
    if (drawHost) b.draw = drawHost.querySelector('.bg__drift') || drawHost.appendChild(make('bg__drift'));
    if (cls.contains('bg--quiet') && b.tex && !el.querySelector('.bg__sheen')) {
      b.tex.parentNode.insertBefore(make('bg__sheen'), b.tex.nextSibling);
    }
    var lampEl = el.querySelector('.bg__lamp');
    if (lampEl) {
      var gold = lampEl.querySelector('.bg__lamp-gold') || lampEl.appendChild(make('bg__lamp-gold'));
      var host = lampEl.parentNode;                            /* .bg__b, which the clear zone masks */
      var glow = el.querySelector('.bg__glow') || host.parentNode.insertBefore(make('bg__glow'), host);
      b.lamp = { el: lampEl, gold: gold, glow: glow, x: 0.24, y: 0.36, fx: 0.24, fy: 0.36, w: 0, size: 900, tile: 132, near: 0.45, fade: -1, shown: -1, dx: 0 };
      /* the footer's flowers slide sideways: the lamp's gold follows their place */
      if (cls.contains('bg--footer')) b.pat = el.querySelector('.bg__a');
    }
    bands.push(b);
    if (byEl) byEl.set(el, b); else el._bg = b;

    if (fineMq) {
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        if (!fineMq.matches) return;
        var r = el.getBoundingClientRect();
        b.mx = (e.clientX - r.left) / r.width;
        b.my = (e.clientY - r.top) / r.height;
        b.hover = true;
        kick();
      }, { passive: true });
      el.addEventListener('pointerleave', function () { b.hover = false; kick(); }, { passive: true });
    }
  });

  function bandOf(el) { return byEl ? byEl.get(el) : el._bg; }

  /* ---------- Sizes, the clear zone, the lamp's measurements ---------- */
  function measure(b) {
    var r = b.el.getBoundingClientRect();
    b.w = r.width;
    b.h = r.height;
    b.box = null;
    if (b.words.length) {
      var l = Infinity, t = Infinity, rr = -Infinity, bb = -Infinity;
      Array.prototype.forEach.call(b.words, function (w) {
        var q = w.getBoundingClientRect();
        if (!q.width && !q.height) return;
        l = Math.min(l, q.left); t = Math.min(t, q.top);
        rr = Math.max(rr, q.right); bb = Math.max(bb, q.bottom);
      });
      if (l < Infinity) {
        var s = b.el.style;
        b.box = { l: l - r.left - WORDS_PAD, r: rr - r.left + WORDS_PAD, t: t - r.top - WORDS_PAD, b: bb - r.top + WORDS_PAD };
        s.setProperty('--clear-l', px(b.box.l));
        s.setProperty('--clear-r', px(b.box.r));
        s.setProperty('--clear-t', px(b.box.t));
        s.setProperty('--clear-b', px(b.box.b));
      }
    }
    if (b.lamp) {
      var cs = window.getComputedStyle(b.el);
      var near = parseFloat(cs.getPropertyValue('--lamp-near'));
      b.lamp.size = parseFloat(cs.getPropertyValue('--lamp')) || b.lamp.el.offsetWidth || 900;
      b.lamp.tile = parseFloat(cs.getPropertyValue('--lattice')) || 132;
      b.lamp.near = near >= 0 && near <= 1 ? near : 0.45;
      placeLamp(b);
    }
  }
  function measureAll() { bands.forEach(measure); if (gleams) fitGleams(); kick(); }

  /* The lamp's resting place in CSS is 24% / 36%; the script moves it from there, keeps the gold pattern
     inside it in register with the pattern on the wall, and eases its light down as it nears the words
     (over GLOW_TIME while running; at once when measuring or resting, dt left out). */
  function placeLamp(b, dt) {
    var L = b.lamp;
    var dx = (L.x - 0.24) * b.w;
    var dy = (L.y - 0.36) * b.h;
    var left = 0.24 * b.w - L.size / 2 + dx;
    var top = 0.36 * b.h - L.size / 2 + dy;
    var t = L.tile;
    var gx = left - L.dx;                                      /* the wall's flowers start L.dx along (0 or less) */
    var move = px(dx) + ' ' + px(dy);
    L.el.style.translate = move;
    L.glow.style.translate = move;
    L.gold.style.translate = px(-(((gx % t) + t) % t)) + ' ' + px(-(((top % t) + t) % t));
    var fade = 1;
    if (b.box) {
      var cx = L.x * b.w, cy = L.y * b.h, q = b.box;
      var ox = Math.max(q.l - cx, 0, cx - q.r);
      var oy = Math.max(q.t - cy, 0, cy - q.b);
      fade = L.near + (1 - L.near) * smooth(Math.sqrt(ox * ox + oy * oy) / (L.size * GLOW_REACH));
    }
    L.fade = dt && L.fade >= 0 ? L.fade + (fade - L.fade) * (1 - Math.exp(-dt / GLOW_TIME)) : fade;
    if (Math.abs(L.fade - L.shown) > 0.002) { L.shown = L.fade; L.glow.style.opacity = L.fade.toFixed(3); }
  }

  /* ---------- Near and live ---------- */
  function setLive(b, on) {
    b.live = on;
    b.el.classList.toggle('is-live', on && !hidden);
  }
  if ('IntersectionObserver' in window) {
    var near = function (io) {
      return function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-near');
            io().unobserve(en.target);
          }
        });
      };
    };
    var firstIO = null, nearIO = null;
    var watchNear = function () {
      if (firstIO) { firstIO.disconnect(); firstIO = null; }
      if (nearIO) return;
      nearIO = new IntersectionObserver(near(function () { return nearIO; }), { rootMargin: '150% 0px' });
      bands.forEach(function (b) { if (!b.el.classList.contains('is-near')) nearIO.observe(b.el); });
    };
    if (doc.readyState === 'complete') watchNear();
    else {
      firstIO = new IntersectionObserver(near(function () { return firstIO; }), { rootMargin: '0px' });
      bands.forEach(function (b) { firstIO.observe(b.el); });
      window.addEventListener('load', watchNear);
    }
    var liveIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { setLive(bandOf(en.target), en.isIntersecting); });
      kick();
    }, { rootMargin: '10% 0px' });
    bands.forEach(function (b) { liveIO.observe(b.el); });
  } else {
    bands.forEach(function (b) { b.el.classList.add('is-near'); setLive(b, true); });
  }

  doc.addEventListener('visibilitychange', function () {
    hidden = !!doc.hidden;
    root.classList.toggle('bg-asleep', hidden);
    bands.forEach(function (b) { setLive(b, b.live); });
    last = 0;
    if (!hidden) { kick(); gleamStart(); } else gleamStop();
  });

  /* ---------- Less motion: everything rests ---------- */
  function rest() {
    bands.forEach(function (b) {
      if (b.tex) b.tex.style.translate = '';
      if (b.draw) b.draw.style.translate = '';
      if (b.lean) { b.lean.x = b.lean.y = 0; b.lean.el.style.translate = ''; }
      if (b.lamp) { b.lamp.x = 0.24; b.lamp.y = 0.36; b.lamp.w = 0; b.lamp.dx = 0; placeLamp(b); }
    });
    gleamStop();
  }
  function onReduceChange() {
    reduce = reduceMq.matches;
    if (reduce) rest(); else { kick(); gleamStart(); }
  }

  /* where the footer's sliding flowers are now (0 or less). Read from the slide's own clock (linear, one tile per
     run), so no frame has to work out styles; when the slide cannot be found, from the layer's computed transform. */
  function shiftOf(b) {
    var a = b.slide;
    if (!a || a.playState === 'idle') {
      a = b.slide = null;
      var list = b.pat.getAnimations ? b.pat.getAnimations() : [];
      for (var i = 0; i < list.length; i++) if (list[i].animationName === 'bg-lattice-slide') a = b.slide = list[i];
      if (a) b.slideAmp = parseFloat(window.getComputedStyle(b.pat).getPropertyValue('--motion-amp')) === 0 ? 0 : 1;
    }
    if (a) {
      var d = Number(a.effect && a.effect.getTiming().duration);
      var t = Number(a.currentTime);
      return d > 0 && isFinite(t) ? -b.lamp.tile * b.slideAmp * ((t % d) / d) : 0;
    }
    var m = /^matrix\(([^)]+)\)/.exec(window.getComputedStyle(b.pat).transform || '');
    var v = m ? parseFloat(m[1].split(',')[4]) : 0;
    return isFinite(v) ? v : 0;
  }
  if (reduceMq) {
    if (reduceMq.addEventListener) reduceMq.addEventListener('change', onReduceChange);
    else if (reduceMq.addListener) reduceMq.addListener(onReduceChange);
  }

  /* ---------- One frame: read everything first, then write ---------- */
  function frame(now) {
    raf = 0;
    if (hidden || reduce) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    var t = now / 1000;
    var vh = window.innerHeight;
    var again = false;
    var work = [];

    bands.forEach(function (b) {
      if (!b.live) return;
      var r = b.el.getBoundingClientRect();
      work.push({ b: b, top: r.top, h: r.height, dx: b.pat ? shiftOf(b) : 0 });
    });

    work.forEach(function (o) {
      var b = o.b;
      var off = o.top + o.h / 2 - vh / 2;                     /* the band's centre against the screen's centre */
      var p = Math.max(-1, Math.min(1, off / (vh / 2 + o.h / 2)));
      if (b.tex) b.tex.style.translate = '0 ' + px(-p * TEX_DRIFT);
      if (b.draw) b.draw.style.translate = '0 ' + px(Math.max(-DRAW_MAX, Math.min(DRAW_MAX, -off * DRAW_RATE)));

      if (b.lean) {
        var L = b.lean;
        var on = b.hover && fineMq && fineMq.matches;
        var tx = on ? (b.mx - 0.5) * 2 * L.max * b.w : 0;
        var ty = on ? (b.my - 0.5) * 2 * L.max * b.h : 0;
        var k = 1 - Math.exp(-dt / LEAN_TIME);
        L.x += (tx - L.x) * k;
        L.y += (ty - L.y) * k;
        if (Math.abs(tx - L.x) > 0.2 || Math.abs(ty - L.y) > 0.2) again = true;
        L.el.style.translate = px(L.x) + ' ' + px(L.y);
      }

      if (b.lamp) {
        var M = b.lamp;
        var held = b.el.classList.contains('is-held');
        if (!held) b.clock += dt;                              /* a held lamp stops wandering where it is */
        var tt = b.clock + b.index * 7.3;                      /* each lamp on its own path */
        var wx = 0.5 + 0.34 * Math.sin(2 * Math.PI * tt / 22);
        var wy = 0.45 + 0.26 * Math.sin(2 * Math.PI * tt / 15 + 1.3);
        var follow = b.hover && fineMq && fineMq.matches;
        if (follow && M.w < 0.01) { M.fx = M.x; M.fy = M.y; }  /* start following from where the lamp is */
        var kf = 1 - Math.exp(-dt / LAMP_TIME);
        M.fx += (b.mx - M.fx) * kf;
        M.fy += (b.my - M.fy) * kf;
        M.w += ((follow ? 1 : 0) - M.w) * (1 - Math.exp(-dt / (follow ? LAMP_TIME * 1.5 : LAMP_RETURN)));
        M.x = wx + (M.fx - wx) * M.w;
        M.y = wy + (M.fy - wy) * M.w;
        M.dx = o.dx;
        placeLamp(b, dt);
        if (!held || follow || M.w > 0.005) again = true;
      }
    });

    if (again) kick();
  }
  function kick() {
    if (!raf && !hidden && !reduce) raf = window.requestAnimationFrame(frame);
  }

  /* ---------- Gold lines catch the light now and then ----------
     Each divider inside a band gets <i class="orn-gleam"><i></i></i>; each gilt frame gets two, thin strips on
     the top and bottom edges of its mount line (thin, so a pass costs the screen almost nothing). Every GLEAM_TICK
     the most overdue line that is wholly arrived on screen gets one pass, if the last pass on the page began at
     least GLEAM_GAP ago (so two never run together). A line then waits 7-11 s before its next pass. */
  var GLEAM_TICK = 500;
  var GLEAM_GAP = 3000;           /* ms between the starts of any two passes on the page (each pass is shorter) */
  var GLEAM_WAIT = 7000;          /* ms, plus up to GLEAM_SPREAD more, between two passes of one line */
  var GLEAM_SPREAD = 4000;
  var GLEAM_SETTLE = 1200;        /* ms a line must have been in full view (its arrival done) before it gleams */
  var GLEAM_STILL = 400;          /* ms without scrolling before lines are looked at: a gleam is for a resting
                                     screen, and no check ever makes a scrolling frame work out styles */
  var GLEAM_RULE = { ms: 1800, from: '-60%', to: '60%' };   /* along a divider's lines */
  var GLEAM_EDGE = { ms: 1800, from: '-60%', to: '60%', lag: 420 };   /* a frame: the top edge, then the bottom
                                                                     a moment later, as a slanted light crosses */
  var FRAMES = '.op__pic, .dec__pic, .brd__portrait, .visit__frame';
  var gleams = [];
  var gleamTimer = 0;
  var gleamLast = -1e9;
  var scrolledAt = -1e9;
  function clock() { return window.performance && performance.now ? performance.now() : Date.now(); }

  function strip(host, cls) {
    var el = make(cls);
    el.appendChild(doc.createElement('i'));
    return host.appendChild(el);
  }
  function addGleam(host, ring) {
    if (host.querySelector(':scope > .orn-gleam')) return;
    var els = ring ? [strip(host, 'orn-gleam orn-gleam--edge'), strip(host, 'orn-gleam orn-gleam--edge')] : [strip(host, 'orn-gleam')];
    gleams.push({ els: els, host: host, ring: ring, band: host.closest('[data-bg]'), last: clock(), wait: 1500 + Math.random() * 3000, seen: -1, anims: [] });
  }
  /* a frame's two strips sit exactly on its own mount line (its ::after), between the rounded corners, at every
     size: 2 px tall, centred on the 1 px line */
  function fitRing(g) {
    var cs = window.getComputedStyle(g.host, '::after');
    if (!cs || cs.content === 'none' || cs.position !== 'absolute') return;
    var rad = parseFloat(cs.borderTopLeftRadius) || 0;
    var l = (parseFloat(cs.left) + rad) + 'px', r = (parseFloat(cs.right) + rad) + 'px';
    var top = g.els[0].style, bot = g.els[1].style;
    top.left = bot.left = l;
    top.right = bot.right = r;
    top.top = (parseFloat(cs.top) - 0.5) + 'px';
    bot.bottom = (parseFloat(cs.bottom) - 0.5) + 'px';
  }
  if (Element.prototype.animate && Element.prototype.closest) {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-bg] .orn-rule'), function (r) { addGleam(r, false); });
    Array.prototype.forEach.call(doc.querySelectorAll(FRAMES), function (f) { if (f.closest('[data-bg]')) addGleam(f, true); });
  }
  function fitGleams() { gleams.forEach(function (g) { if (g.ring) fitRing(g); }); }

  /* wholly arrived on screen: its band live, most of it in view, nothing of it still rising, scaling or fading in */
  function gleamReady(g, vh, t) {
    var bb = g.band ? bandOf(g.band) : null;
    var ok = !g.band || (bb && bb.live);
    if (ok) {
      var r = g.host.getBoundingClientRect();
      var inView = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      ok = r.width > 0 && inView >= Math.min(0.85 * r.height, 0.6 * vh);
    }
    if (ok) {
      if (g.ring) ok = parseFloat(window.getComputedStyle(g.host).opacity) > 0.99;
      else {
        var line = window.getComputedStyle(g.host, '::after');
        var m = /^matrix\(([^)]+)\)/.exec(line.transform || '');
        ok = line.display !== 'none' && (!m || parseFloat(m[1].split(',')[0]) > 0.99);
      }
    }
    if (!ok) { g.seen = -1; return false; }
    if (g.seen < 0) g.seen = t;
    return t - g.seen >= GLEAM_SETTLE;
  }
  function gleamCancel(g) { g.anims.forEach(function (a) { a.cancel(); }); g.anims = []; }
  function gleamPass(g, t) {
    var k = g.ring ? GLEAM_EDGE : GLEAM_RULE;
    g.last = t;
    g.wait = GLEAM_WAIT + Math.random() * GLEAM_SPREAD;
    gleamLast = t;
    gleamCancel(g);
    g.els.forEach(function (el, i) {
      g.anims.push(el.firstChild.animate([{ transform: 'translateX(' + k.from + ')' }, { transform: 'translateX(' + k.to + ')' }],
        { duration: k.ms, delay: i * (k.lag || 0), easing: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)' }));
    });
    g.anims[g.anims.length - 1].onfinish = function () { g.anims = []; };
  }
  /* looked at at the start of a frame, while the page rests */
  function gleamLook() {
    if (hidden || reduce) return;
    var t = clock();
    if (t - scrolledAt < GLEAM_STILL) return;
    var vh = window.innerHeight;
    var best = null, most = 0;
    gleams.forEach(function (g) {
      if (!gleamReady(g, vh, t)) return;
      var over = t - g.last - g.wait;
      if (over >= 0 && (!best || over > most)) { best = g; most = over; }
    });
    if (best && t - gleamLast >= GLEAM_GAP) gleamPass(best, t);
  }
  function gleamTick() {
    gleamTimer = 0;
    if (hidden || reduce || !gleams.length) return;
    if (clock() - scrolledAt >= GLEAM_STILL) window.requestAnimationFrame(gleamLook);
    else gleams.forEach(function (g) { g.seen = -1; });     /* scrolling: each line settles again once it rests */
    gleamTimer = window.setTimeout(gleamTick, GLEAM_TICK);
  }
  function gleamStart() {
    if (!gleamTimer && gleams.length && !hidden && !reduce) gleamTimer = window.setTimeout(gleamTick, GLEAM_TICK);
  }
  function gleamStop() {
    if (gleamTimer) { window.clearTimeout(gleamTimer); gleamTimer = 0; }
    gleams.forEach(function (g) { gleamCancel(g); g.seen = -1; });
  }

  /* a band released from .is-held starts its lamp again */
  if ('MutationObserver' in window) {
    var heldMO = new MutationObserver(function () { kick(); });
    bands.forEach(function (b) { heldMO.observe(b.el, { attributes: true, attributeFilter: ['class'] }); });
  }

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('scroll', function () { scrolledAt = clock(); }, { passive: true });
  window.addEventListener('resize', measureAll);
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (en) { var b = bandOf(en.target); if (b) measure(b); });
      kick();
    });
    bands.forEach(function (b) { ro.observe(b.el); });
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measureAll);
  window.addEventListener('load', measureAll);

  measureAll();
  if (reduce) rest(); else gleamStart();
})();
