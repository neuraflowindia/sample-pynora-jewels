/* Pynora motion, the page's arrival.
   - html.motion-go when the fonts are ready and, on Home, the opening picture is decoded (on a Product page the first
     stage picture, window.PYNORA_PAGE.stage), at the latest 1.2 s after the page began to load.
   - Before that, the first band's lines are numbered by their visual rows (--i), worked out from the measured
     layout, so lines that share a row rise together (the opening numbers them itself as it is parsed; this checks
     them again with the fonts ready, unless the head's safety net has already started the arrival).
   - The arrival plays only when the page opens near the top; otherwise everything is set at once.
   - Home: the scroll system's load hold is released when the opening has arrived; "opening:settled" is emitted when
     the push-in ends; the push-in, the window light and later the opening scene (the breathing picture and the light
     together) are counted movers; with a mouse the picture and the price chip lean towards it.
   - Other pages: "opening:settled" is emitted when the first band's lines are in place. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var win = window;
  var P = win.Pynora = win.Pynora || {};
  var M = P.motion;
  if (!M || !M.on || !root.classList.contains('motion')) return;

  var CAP = 1200;
  var RISE = 1000, RISE_LEAD = 900, FIRST = 150, STAGGER = 90;
  var CHIP_END = 1800;
  var PUSH_END = 7700;          /* 1,700 ms delay + 6,000 ms push-in */
  var LEAN_TIME = 0.45, HOVER_TIME = 0.1;
  var LEAN_PIC = 5, LEAN_CHIP = 14, HOVER_LIFT = -2;

  var band = M.loadBand;
  var op = band && band.classList.contains('op') ? band : null;
  var img = op ? op.querySelector('.op__img') : null;
  var light = op ? op.querySelector('.op__light') : null;
  var pic = op ? op.querySelector('.op__pic') : null;
  var chip = op ? op.querySelector('.op__chip') : null;
  var started = false, settledOnce = false;
  var t0 = 0;

  function now() { return win.performance && performance.now ? performance.now() : Date.now(); }
  function emit(n, d) { if (typeof P.emit === 'function') P.emit(n, d || {}); }

  /* ---------- Visual rows of the first band's lines ---------- */
  function shown(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function number(setRows) {
    if (!band) return { rows: 0, end: 0 };
    var lines = Array.prototype.filter.call(band.querySelectorAll('.line'), function (l) {
      return l.querySelector(':scope > .line__in') && shown(l);
    });
    var tops = lines.map(function (l) { return { l: l, top: l.getBoundingClientRect().top }; });
    tops.sort(function (a, b) { return a.top - b.top; });
    var row = -1, at = -Infinity, end = 0;
    tops.forEach(function (o) {
      if (o.top - at > 6) { row++; at = o.top; }
      var inner = o.l.querySelector(':scope > .line__in');
      if (setRows) inner.style.setProperty('--i', row);
      /* only ever more room than the stylesheet gives, so a line held at its start never moves before its turn */
      if (typeof M.roomOf === 'function') {
        var room = M.roomOf(o.l, inner);
        var css = parseFloat(win.getComputedStyle(o.l).getPropertyValue('--line-room')) || 0;
        if (room > css + 0.5) o.l.style.setProperty('--line-room', room.toFixed(1) + 'px');
      }
      var dur = op && o.l.closest('.op__lead') ? RISE_LEAD : RISE;
      end = Math.max(end, FIRST + row * STAGGER + dur);
    });
    return { rows: row + 1, end: end };
  }

  /* ---------- The animations by name (pseudo-elements included) ---------- */
  function anims(names) {
    if (!doc.getAnimations) return [];
    return doc.getAnimations().filter(function (a) {
      var t = a.effect && a.effect.target;
      return a.animationName && names.indexOf(a.animationName) >= 0 && t && op && op.contains(t);
    });
  }
  function pause(names) { anims(names).forEach(function (a) { if (a.playState === 'running') a.pause(); }); }
  function play(names) { anims(names).forEach(function (a) { if (a.playState === 'paused') a.play(); }); }

  /* ---------- Movers on the first screen ---------- */
  var LIGHT = ['m-light-drift', 'm-light-fall', 'm-light-breathe'];
  var SCENE = ['m-light-drift', 'm-light-fall', 'm-light-breathe', 'm-op-breathe'];
  var offPush = null, offLight = null, offScene = null;
  function addMovers() {
    if (!op || !pic || typeof M.addMover !== 'function') return;
    offPush = M.addMover({
      id: 'push-in', el: pic, rank: 'push-in', need: 0.5,
      wants: function () { return started && !settledOnce; },
      pause: function () { pause(['m-op-push']); }, resume: function () { play(['m-op-push']); }
    });
    offLight = M.addMover({
      id: 'jaali', el: pic, rank: 'jaali', need: 0.5,
      wants: function () { return started && !settledOnce; },
      pause: function () { pause(LIGHT); }, resume: function () { play(LIGHT); }
    });
  }
  function sceneMover() {
    if (!op || !pic || typeof M.addMover !== 'function') return;
    if (offPush) { offPush(); offPush = null; }
    if (offLight) { offLight(); offLight = null; }
    play(LIGHT);
    offScene = M.addMover({
      id: 'opening-scene', el: pic, rank: 'scene', need: 0.5,
      pause: function () { pause(SCENE); }, resume: function () { play(SCENE); }
    });
  }

  /* ---------- Settled ---------- */
  function settle() {
    if (settledOnce) return;
    settledOnce = true;
    sceneMover();
    emit('opening:settled', {});
  }

  /* ---------- Go ---------- */
  function skip() {
    if (band) band.classList.add('m-skip');
    root.classList.add('motion-go');
    M.release();
    started = true;
    settle();
  }
  function go() {
    if (started) return;
    var already = root.classList.contains('motion-go');      /* the head's safety net may have started it */
    var info = number(!already);                             /* rows are never renumbered once lines are rising */
    var y = win.scrollY || win.pageYOffset || 0;
    if (y > 0.5 * win.innerHeight) { skip(); return; }
    root.classList.add('motion-go');
    started = true;
    t0 = now();
    if (already && doc.getAnimations) {                     /* the safety net started it: read how far it is */
      var a = doc.getAnimations().filter(function (x) { return x.animationName === 'm-rise'; })[0];
      if (a && a.currentTime) t0 = now() - a.currentTime;
    }
    var arrive = op ? Math.max(info.end, CHIP_END) : info.end;
    arriveEnd = t0 + arrive;
    setTimeout(M.release, Math.max(0, arriveEnd - now()));
    if (op && img) {
      img.addEventListener('animationend', function (e) { if (e.animationName === 'm-op-push') settle(); });
      setTimeout(settle, Math.max(0, t0 + PUSH_END + 4000 - now()));     /* if the end is never reported */
    } else {
      setTimeout(settle, Math.max(0, t0 + info.end - now()));
    }
  }

  /* a big jump while the words are still arriving (a restored scroll position) finishes the opening at once */
  var arriveEnd = 0;
  if (typeof P.on === 'function') P.on('motion:jump', function (d) {
    if (!started || settledOnce || !band) return;
    if (d && d.y > 0.5 * win.innerHeight && now() < arriveEnd) {
      band.classList.add('m-skip');
      M.release();
      settle();
    }
  });

  /* a Product page's first stage picture: the page describes it ({ src, ... }); the gallery draws it as an img */
  function stagePicture() {
    try {
      var page = win.PYNORA_PAGE;
      var st = page && page.stage;
      if (!st) return null;
      var el = doc.querySelector('.gal__stage img[src]');
      if (el) return el;
      if (typeof st.src === 'string') {
        var all = doc.images;
        for (var i = 0; i < all.length; i++) if (all[i].getAttribute('src') === st.src) return all[i];
      }
    } catch (e) { /* no stage picture: fonts only */ }
    return null;
  }

  function ready() {
    var waits = [];
    if (doc.fonts && doc.fonts.ready) waits.push(doc.fonts.ready);
    var first = img || stagePicture();
    if (first && typeof first.decode === 'function') {
      try { waits.push(first.decode().catch(function () {})); } catch (e) { /* the cap still applies */ }
    }
    var cap = new Promise(function (r) { setTimeout(r, Math.max(0, CAP - now())); });
    Promise.race([Promise.all(waits), cap]).then(go, go);
  }

  /* ---------- Lean (a mouse only): the picture (with its light) and the chip lean towards it at two depths ---------- */
  function lean() {
    if (!op || !pic || typeof M.tick !== 'function' || typeof P.fine !== 'function') return;
    var tx = 0, ty = 0, lx = 0, ly = 0, hov = 0, hovT = 0;
    var w = { pic: '', chip: '' };
    var active = false;
    op.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !P.fine() || !root.classList.contains('motion')) return;
      var r = op.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      if (!active) { active = true; op.classList.add('m-lean'); }
      M.kick();
    }, { passive: true });
    op.addEventListener('pointerleave', function () { tx = ty = 0; M.kick(); }, { passive: true });
    if (chip) {
      chip.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovT = HOVER_LIFT; M.kick(); } });
      chip.addEventListener('pointerleave', function () { hovT = 0; M.kick(); });
    }
    function put(el, key, val) {
      if (w[key] === val) return;
      w[key] = val;
      el.style.translate = val;
    }
    if (typeof P.on === 'function') P.on('motion:off', function () {   /* less motion chosen: back to the still opening */
      active = false;
      tx = ty = lx = ly = hov = hovT = 0;
      w.pic = w.chip = '';
      op.classList.remove('m-lean');
      pic.style.translate = '';
      if (chip) chip.style.translate = '';
    });
    M.tick(function (t, dt) {
      if (!active || !root.classList.contains('motion')) return false;
      var k = 1 - Math.exp(-dt / LEAN_TIME), kh = 1 - Math.exp(-dt / HOVER_TIME);
      lx += (tx - lx) * k; ly += (ty - ly) * k; hov += (hovT - hov) * kh;
      var still = Math.abs(tx - lx) < 0.002 && Math.abs(ty - ly) < 0.002 && Math.abs(hovT - hov) < 0.01;
      if (still) { lx = tx; ly = ty; hov = hovT; }
      put(pic, 'pic', (lx * LEAN_PIC).toFixed(2) + 'px ' + (ly * LEAN_PIC).toFixed(2) + 'px');
      /* below 1,280 px the picture is narrower and the chip sits close to the cord: there it leans with its picture */
      var lc = win.innerWidth < 1280 ? LEAN_PIC : LEAN_CHIP;
      if (chip) put(chip, 'chip', (lx * lc).toFixed(2) + 'px ' + (ly * lc + hov).toFixed(2) + 'px');
      return !still;
    });
  }

  addMovers();
  lean();
  ready();
})();
