/* Pynora motion, the shared scroll system: window.Pynora.motion.
   Runs only when the head's arming script armed the page (html.motion); otherwise Pynora.motion is a harmless stand-in.

   What it measures (positions are cached; the frame loop reads only the scroll position):
   - H, the screen height used: set on load, changed only when the width changes or the height changes by more than
     20% (a phone turning), so a phone's address bar never shifts a section.
   - Sections: every [data-assemble] and the footer (.ftr). Arrival --p (0 -> 1) starts when the section's top
     crosses 92% of H and completes after 0.6 x H (0.8 x H for the bento and gifts); on laptops (1,080 px and wider)
     never less than 560 / 720 px. Near the page's foot the span shortens so every section completes at the bottom.
   - Rows ([data-row]): below 1,080 px every row leads with its own --p (0.45 x H); on laptops a row leads only when
     its section is taller than 1.2 x H and the row starts lower than the section's span (the bento's bottom row).
     A row may say --m-lead: 1 or 0 in CSS.
   - Leaving --x (laptops): the bento and gifts as their bottom goes from 55% to 5% of H; the opening over 0.7 x H
     from the top of the page. Pass --v (0 -> 1, parallax zero at .5): the Bridal Edit and the store.
   - Every shown value follows its target with a 120 ms time constant; a jump of more than 1.5 x H in one frame
     (anchors, Home/End, find-in-page, a restored scroll) sets everything at once.
   - Load hold: on a page with an opening (.op) every section is held at 0 until the opening has arrived
     (Pynora.motion.release(), called by motion-load.js; at the latest 4.6 s after the page began to load).
   - Cues: every .line__in inside a section and the word layers listed in CUES go up (class is-up) when their
     section's (or leading row's) shown progress reaches --d + 0.02 and down when it falls to --d - 0.03. --d is read
     from CSS. A line's bottom room (its padding, or more under an inline box) is written as --line-room so it starts
     fully out of sight.
   - is-moving while a section's values change (for will-change), is-done one second after it is complete.
   - The three-movers budget: counted movers (each band's moving light, the opening, the strip, the marquees, the
     Decode tour, movers added with addMover) qualify while they are on screen enough; the strip cannot be held;
     beyond three, the lowest in rank waits. A band covering under a quarter of the screen rests (class is-held).
   - Hidden tabs sleep; a change to "less motion" returns the page to its still state at once.

   Pynora.motion: refresh(), addMover({ id, el, rank, need, wants, pause, resume }) -> remove(), watch(el, fn) ->
   unwatch(), progress(el), tick(fn) -> untick(), kick(), jump(), release(), hold(), released, settled, loadBand, H().
   Events (Pynora.on): motion:release (the strip and the ribbon may start), motion:jump, motion:off, motion:on. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var win = window;
  var P = win.Pynora = win.Pynora || {};

  function noop() {}
  function stub() {
    return {
      on: false, released: true, settled: true, loadBand: null,
      refresh: noop, kick: noop, jump: noop, release: noop, hold: noop,
      addMover: function () { return noop; }, watch: function () { return noop; }, tick: function () { return noop; },
      progress: function () { return { p: 1, x: 0, v: 0.5 }; }, H: function () { return win.innerHeight; }
    };
  }
  if (!root.classList.contains('motion') || typeof Map !== 'function') { P.motion = stub(); return; }

  /* ---------- Numbers ---------- */
  var START = 0.92;            /* a section starts when its top crosses this share of H */
  var SPAN = 0.6, SPAN_SIG = 0.8, FLOOR = 560, FLOOR_SIG = 720;
  var ROW_SPAN = 0.45;
  var LAPTOP = 1080;
  var TALL = 1.2;              /* sections taller than this many screens may have leading rows on laptops */
  var LEAVE_FROM = 0.55, LEAVE_SPAN = 0.5, OP_OUT = 0.7;
  var TAU = 0.12, TAU_SOFT = 0.45, SOFT_FOR = 1600;
  var JUMP = 1.5;
  var UP = 0.02, DOWN = 0.03;
  var EPS = 0.0005;
  var DONE_AFTER = 1000, MOVING_FOR = 400;
  var HOLD_MAX = 4600;         /* ms after the page began to load */
  var RELEASE_MAX = 12000;
  var MOVERS_MAX = 3;

  /* Section kinds by their first class (the HTML has no other hook). Values may be overridden in CSS with
     --m-span (share of H), --m-leave (1/0) and --m-pass (1/0) on the section. */
  var KIND = {
    bento: { span: SPAN_SIG, leave: 1 },
    gft: { span: SPAN_SIG, leave: 1 },
    brd: { pass: 1 },
    visit: { pass: 1 }
  };
  var CUES = ['.gft__foot', '.rv__foot', '.bento__plate', '.bento__vwords', '.bento__rtitle', '.bento__rline',
    '.dec__fact', '.dec__piece', '.brd__edit', '.visit__card', '.card__tag'];
  var RANK = { tour: 60, 'push-in': 50, jaali: 40, scene: 40, marquee: 30, strip: 20, band: 10 };
  var NEED = { tour: 0.6, marquee: 1 };       /* share of the mover on screen before it counts (else .5) */

  /* ---------- State ---------- */
  var M = {
    on: true, released: false, settled: false, loadBand: null,
    H: function () { return H; }
  };
  P.motion = M;

  var H = win.innerHeight, W = root.clientWidth || win.innerWidth;
  var maxScroll = 0;
  var sections = [], rows = [], cues = [];
  var byEl = new Map();                 /* section or row element -> its record */
  var watchers = new Map();
  var ticks = [];
  var movers = [];
  var extraCues = [];
  var raf = 0, last = 0, lastY = -1, lastBudget = 0;
  var first = true, forceJump = false, cueJump = false, jumpClass = false;
  var hidden = !!doc.hidden;
  var holdUntil = 0, softUntil = 0;
  var navStart = 0;
  var off = false;

  function now() { return win.performance && performance.now ? performance.now() : Date.now(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function scrollY() { return win.scrollY || win.pageYOffset || 0; }
  function laptop() { return W >= LAPTOP; }
  function absTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function emit(name, detail) { if (typeof P.emit === 'function') P.emit(name, detail || {}); }
  function on(name, fn) { if (typeof P.on === 'function') P.on(name, fn); }

  /* a share written in CSS as a number or a simple calc() of numbers: "0.25", "calc(.06 + .25)" */
  function num(s, fallback) {
    s = String(s || '').trim();
    if (!s) return fallback;
    var n = Number(s);
    if (isFinite(n)) return n;
    var src = s.replace(/calc/g, '');
    if (!/^[0-9.+\-*/()\s]+$/.test(src)) return fallback;
    var i = 0;
    function ws() { while (src[i] === ' ') i++; }
    function atom() {
      ws();
      if (src[i] === '(') { i++; var v = sum(); ws(); i++; return v; }
      if (src[i] === '-') { i++; return -atom(); }
      var m = /^[0-9]*\.?[0-9]+/.exec(src.slice(i));
      if (!m) throw 0;
      i += m[0].length;
      return Number(m[0]);
    }
    function prod() { var v = atom(); for (;;) { ws(); var c = src[i]; if (c === '*') { i++; v *= atom(); } else if (c === '/') { i++; v /= atom(); } else return v; } }
    function sum() { var v = prod(); for (;;) { ws(); var c = src[i]; if (c === '+') { i++; v += prod(); } else if (c === '-') { i++; v -= prod(); } else return v; } }
    try { var r = sum(); return isFinite(r) ? r : fallback; } catch (e) { return fallback; }
  }

  var KINDS = ['op', 'new', 'bento', 'brd', 'dec', 'gft', 'visit', 'rv', 'ftr'];
  function kindOf(el) {
    for (var i = 0; i < KINDS.length; i++) if (el.classList.contains(KINDS[i])) return KINDS[i];
    return el.getAttribute('data-assemble') || '';
  }

  /* ---------- The band that rises on load (the opening, or a page's first band) ---------- */
  function findLoadBand() {
    var op = doc.querySelector('.op');
    if (op) return op;
    var main = doc.querySelector('main');
    return main ? main.querySelector('.bg, section') : null;
  }

  /* ---------- Finding sections, rows and cues ---------- */
  function scan() {
    var lb = findLoadBand();
    M.loadBand = lb;
    if (lb) lb.classList.add('m-load');

    var oldSec = sections, oldRow = rows;
    var keep = new Map();
    oldSec.concat(oldRow).forEach(function (r) { keep.set(r.el, r); });

    sections = [];
    rows = [];
    byEl = new Map();
    var els = Array.prototype.slice.call(doc.querySelectorAll('[data-assemble]'));
    Array.prototype.forEach.call(doc.querySelectorAll('.ftr'), function (f) { if (els.indexOf(f) < 0) els.push(f); });
    els.forEach(function (el) {
      var k = kindOf(el);
      var s = keep.get(el) || {
        el: el, key: k, isLoad: false, top: 0, h: 0, span: 0, spanEff: 1,
        sig: false, leave: false, pass: false,
        p: 0, x: 0, v: 0.5, wp: null, wx: null, wv: null,
        rows: [], changedAt: 0, doneSince: 0, done: false, moving: false
      };
      s.isLoad = el === lb;
      s.rows = [];
      sections.push(s);
      byEl.set(el, s);
    });
    Array.prototype.forEach.call(doc.querySelectorAll('[data-row]'), function (el) {
      var secEl = el.parentElement && el.parentElement.closest('[data-assemble], .ftr');
      var s = secEl && byEl.get(secEl);
      if (!s || s.isLoad) return;
      var r = keep.get(el) || { el: el, top: 0, h: 0, spanEff: 1, lead: false, p: 0, wp: null };
      r.sec = s;
      rows.push(r);
      s.rows.push(r);
      byEl.set(el, r);
    });
    oldRow.forEach(function (r) { if (!byEl.has(r.el) && r.el.style) r.el.style.removeProperty('--p'); });

    /* cues */
    var known = new Map();
    cues.forEach(function (c) { known.set(c.el, c); });
    var list = [];
    var sel = ['.line__in'].concat(CUES, extraCues).join(',');
    sections.forEach(function (s) {
      if (s.isLoad) return;
      Array.prototype.forEach.call(s.el.querySelectorAll(sel), function (el) {
        if (lb && lb.contains(el)) return;
        var c = known.get(el);
        if (!c) { c = { el: el, d: 0, up: false, fresh: true, gov: s }; }
        c.sec = s;
        list.push(c);
      });
    });
    var stillThere = new Map();
    list.forEach(function (c) { stillThere.set(c.el, true); });
    cues.forEach(function (c) { if (!stillThere.has(c.el)) c.el.classList.remove('is-up'); });
    cues = list;
    if (list.some(function (c) { return c.fresh; })) cueJump = true;
  }

  /* ---------- Measuring (layout reads happen only here) ---------- */
  function measure() {
    if (off) return;
    W = root.clientWidth || win.innerWidth;
    maxScroll = Math.max(0, (doc.scrollingElement || root).scrollHeight - win.innerHeight);
    var lap = laptop();

    sections.forEach(function (s) {
      var cs = win.getComputedStyle(s.el);
      var k = KIND[s.key] || {};
      var share = num(cs.getPropertyValue('--m-span'), k.span || SPAN);
      s.sig = share >= SPAN_SIG;
      s.leave = !!num(cs.getPropertyValue('--m-leave'), k.leave || 0) || s.isLoad && s.key === 'op';
      s.pass = !!num(cs.getPropertyValue('--m-pass'), k.pass || 0);
      s.top = absTop(s.el);
      s.h = s.el.offsetHeight;
      s.span = share * H;
      if (lap) s.span = Math.max(s.span, s.sig ? FLOOR_SIG : FLOOR);
      s.spanEff = endClamp(s.top, s.span);
    });
    rows.forEach(function (r) {
      r.top = absTop(r.el);
      r.h = r.el.offsetHeight;
      var s = r.sec;
      var force = num(win.getComputedStyle(r.el).getPropertyValue('--m-lead'), -1);
      if (force === 0 || force === 1) r.lead = force === 1;
      else if (!lap) r.lead = true;
      else r.lead = s.h > TALL * H && (r.top - s.top) > s.span;
      r.spanEff = endClamp(r.top, ROW_SPAN * H);
      if (!r.lead && r.wp !== null) { r.el.style.removeProperty('--p'); r.wp = null; }
    });
    var rooms = [];
    cues.forEach(function (c) {
      c.d = num(win.getComputedStyle(c.el).getPropertyValue('--d'), 0);
      var g = c.el, gov = null;
      while (g && g !== c.sec.el) {
        var r = byEl.get(g);
        if (r && r.lead) { gov = r; break; }
        g = g.parentElement;
      }
      c.gov = gov || c.sec;
      if (c.el.classList.contains('line__in') && c.el.parentElement) {
        var line = c.el.parentElement;
        var room = roomOf(line, c.el).toFixed(1) + 'px';
        if (line.style.getPropertyValue('--line-room') !== room) rooms.push([line, room]);
      }
    });
    rooms.forEach(function (r) { r[0].style.setProperty('--line-room', r[1]); });   /* written after every read */
    movers.forEach(function (m) {
      if (!m.el || !m.el.isConnected) return;
      m.top = absTop(m.el);
      m.h = m.el.offsetHeight;
    });
    if (!root.classList.contains('motion-scroll')) root.classList.add('motion-scroll');
    kick();
  }

  /* the room under a line's inner part inside its wrapper: the padding, or more where the inner part is an inline box
     shorter than its line (layout positions, so a transform in progress never counts) */
  function roomOf(line, inner) {
    var pb = parseFloat(win.getComputedStyle(line).paddingBottom) || 0;
    var r = inner.offsetParent === line
      ? line.clientHeight - inner.offsetTop - inner.offsetHeight
      : line.offsetTop + line.clientTop + line.clientHeight - inner.offsetTop - inner.offsetHeight;
    return Math.max(pb, isFinite(r) ? r : 0);
  }
  M.roomOf = roomOf;

  /* a section or row near the page's foot completes at the maximum scroll */
  function endClamp(top, span) {
    var start = top - START * H;
    var room = maxScroll - start;
    return room < span ? Math.max(1, room) : span;
  }

  function refresh() {
    if (off) return;
    scan();
    measure();
  }

  /* ---------- Targets ---------- */
  function targetP(s, y, held) {
    if (s.isLoad) return 1;
    if (held) return 0;
    return clamp((START * H - (s.top - y)) / s.spanEff, 0, 1);
  }
  function targetRow(r, y, held) {
    if (held) return 0;
    return clamp((START * H - (r.top - y)) / r.spanEff, 0, 1);
  }
  function targetX(s, y) {
    if (!s.leave || !laptop()) return 0;
    if (s.isLoad) return clamp(y / (OP_OUT * H), 0, 1);
    return clamp((LEAVE_FROM * H - (s.top + s.h - y)) / (LEAVE_SPAN * H), 0, 1);
  }
  function targetV(s, y) {
    if (!s.pass) return 0.5;
    return clamp((H - (s.top - y)) / (H + s.h), 0, 1);
  }
  function follow(cur, tgt, k) {
    var v = cur + (tgt - cur) * k;
    return Math.abs(tgt - v) < EPS ? tgt : v;
  }
  function write(el, name, v, was) {
    if (was !== null && Math.abs(v - was) <= EPS && !(v !== was && (v === 0 || v === 1))) return was;
    el.style.setProperty(name, v.toFixed(4));
    return v;
  }

  /* ---------- The one frame loop ---------- */
  function frame(t) {
    raf = 0;
    if (hidden || off) return;
    var dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / 60;
    last = t;
    var y = scrollY();
    var jump = first || forceJump || (lastY >= 0 && Math.abs(y - lastY) > JUMP * H);
    var scrolled = y !== lastY;
    lastY = y;
    first = false;
    forceJump = false;
    var nowMs = now();
    var held = holdUntil > nowMs;
    var k = jump ? 1 : 1 - Math.exp(-dt / (nowMs < softUntil ? TAU_SOFT : TAU));
    var again = false;
    var lap = laptop();

    if (jumpClass) { root.classList.remove('motion-jump'); jumpClass = false; }
    if (jump || cueJump) { root.classList.add('motion-jump'); jumpClass = true; again = true; }
    if (jump && !held) emit('motion:jump', { y: y });

    sections.forEach(function (s) {
      var changed = false;
      var tp = targetP(s, y, held), tx = targetX(s, y), tv = targetV(s, y);
      var np = follow(s.p, tp, k), nx = follow(s.x, tx, k), nv = follow(s.v, tv, k);
      if (np !== s.p || nx !== s.x || nv !== s.v) changed = true;
      s.p = np; s.x = nx; s.v = nv;
      if (!s.isLoad) s.wp = write(s.el, '--p', s.p, s.wp);
      if (s.leave && (lap || s.wx !== null)) s.wx = write(s.el, '--x', lap ? s.x : 0, s.wx);
      if (s.pass) s.wv = write(s.el, '--v', s.v, s.wv);
      var allIn = s.p === 1 && s.x === 0;
      s.rows.forEach(function (r) {
        if (!r.lead) return;
        var rp = follow(r.p, targetRow(r, y, held), k);
        if (rp !== r.p) { changed = true; r.p = rp; notify(r); }
        r.wp = write(r.el, '--p', r.p, r.wp);
        if (r.p !== 1) allIn = false;
      });
      if (changed) { s.changedAt = nowMs; notify(s); }
      var moving = nowMs - s.changedAt < MOVING_FOR;
      if (moving !== s.moving) { s.moving = moving; s.el.classList.toggle('is-moving', moving); }
      if (moving) again = true;
      if (allIn) {
        if (!s.doneSince) s.doneSince = nowMs;
        if (!s.done && nowMs - s.doneSince >= DONE_AFTER) { s.done = true; s.el.classList.add('is-done'); }
        if (!s.done) again = true;
      } else {
        s.doneSince = 0;
        if (s.done) { s.done = false; s.el.classList.remove('is-done'); }
      }
      if (Math.abs(tp - s.p) > 0 || Math.abs(tx - s.x) > 0 || Math.abs(tv - s.v) > 0) again = true;
    });
    rows.forEach(function (r) { if (r.lead && Math.abs(targetRow(r, y, held) - r.p) > 0) again = true; });

    cues.forEach(function (c) {
      var g = c.gov.p;
      var up = c.up ? g > c.d - DOWN : g >= Math.min(c.d + UP, 1);
      if (c.fresh || up !== c.up) {
        c.up = up;
        c.fresh = false;
        c.el.classList.toggle('is-up', up);
      }
    });
    cueJump = false;

    for (var i = 0; i < ticks.length; i++) {
      try { if (ticks[i](t, dt, y)) again = true; } catch (e) { setTimeout(function () { throw e; }); }
    }
    if (scrolled || nowMs - lastBudget > 400) budget(y);
    if (held) again = true;
    if (again) kick();
  }

  function kick() { if (!raf && !hidden && !off) raf = win.requestAnimationFrame(frame); }

  /* ---------- Watching a section's or row's values (for one-off moments) ---------- */
  function governing(el) {
    for (var g = el; g && g !== root; g = g.parentElement) {
      var r = byEl.get(g);
      if (r && (r.sec ? r.lead : true)) return r;
    }
    return null;
  }
  function valuesOf(r) {
    if (!r) return { p: 1, x: 0, v: 0.5 };
    var s = r.sec || r;
    return { p: r.p, x: s.x, v: s.v, done: !!s.done, el: r.el };
  }
  function notify(r) {
    var list = watchers.get(r.el);
    if (!list) return;
    var v = valuesOf(r);
    list.slice().forEach(function (fn) { try { fn(v); } catch (e) { setTimeout(function () { throw e; }); } });
  }
  M.progress = function (el) { return valuesOf(governing(el)); };
  M.watch = function (el, fn) {
    var r = governing(el);
    if (!r || typeof fn !== 'function') return noop;
    var key = r.el;
    if (!watchers.has(key)) watchers.set(key, []);
    watchers.get(key).push(fn);
    try { fn(valuesOf(r)); } catch (e) { setTimeout(function () { throw e; }); }
    return function () {
      var l = watchers.get(key);
      if (l) { var i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }
    };
  };
  M.tick = function (fn) {
    if (typeof fn !== 'function') return noop;
    ticks.push(fn);
    kick();
    return function () { var i = ticks.indexOf(fn); if (i >= 0) ticks.splice(i, 1); };
  };
  M.kick = kick;
  M.jump = function () { forceJump = true; kick(); };
  M.refresh = function () { refresh(); };
  M.addCues = function (selector) {
    if (selector && extraCues.indexOf(selector) < 0) { extraCues.push(selector); refresh(); }
  };

  /* ---------- Load hold ---------- */
  M.hold = function () { holdUntil = Infinity; kick(); };
  M.release = function () {
    if (holdUntil === 0) return;
    holdUntil = 0;
    softUntil = now() + SOFT_FOR;
    kick();
  };

  /* ---------- Release of the strip and the ribbon: the opening settled, the first scroll, or 12 s ---------- */
  function releaseMovers(why) {
    if (M.released) return;
    M.released = true;
    root.classList.add('motion-released');
    emit('motion:release', { why: why });
    budget(scrollY());
  }
  on('opening:settled', function () {
    M.settled = true;
    root.classList.add('motion-settled');
    releaseMovers('settled');
  });
  win.addEventListener('scroll', function first() {
    if (M.loadBand && !root.classList.contains('motion-go')) return;    /* scroll restoration before the arrival */
    win.removeEventListener('scroll', first);
    releaseMovers('scroll');
  }, { passive: true });

  /* ---------- The three-movers budget ---------- */
  function visibleOf(m, y) {
    var top = m.top - y, bottom = top + m.h;
    return Math.max(0, Math.min(bottom, H) - Math.max(top, 0));
  }
  function setHeld(m, held) {
    if (m.held === held) return;
    m.held = held;
    try { if (held) m.pause(); else m.resume(); } catch (e) { setTimeout(function () { throw e; }); }
  }
  function budget(y) {
    lastBudget = now();
    if (off) return;
    var q = [];
    var forced = 0;
    movers.forEach(function (m) {
      if (!m.el || !m.el.isConnected) return;
      var wants = !m.wants || m.wants();
      if (!wants) { m.counted = false; if (m.band) setHeld(m, false); return; }
      var vis = visibleOf(m, y);
      var ok, share;
      if (m.band) { share = vis / H; ok = share >= 0.25; }
      else { share = vis / Math.max(1, Math.min(m.h, H)); ok = share >= m.need - 0.001; }
      m.share = share;
      m.counted = ok;
      if (!ok) { if (!m.forced) setHeld(m, true); return; }
      if (m.forced) { forced++; return; }
      q.push(m);
    });
    q.sort(function (a, b) { return b.rank - a.rank || b.share - a.share; });
    var slots = Math.max(0, MOVERS_MAX - forced);
    q.forEach(function (m, i) { setHeld(m, i >= slots); });
  }
  M.addMover = function (o) {
    if (!o || !o.el) return noop;
    var m = {
      id: o.id || 'mover', el: o.el,
      rank: typeof o.rank === 'number' ? o.rank : (RANK[o.rank] || RANK.band),
      need: typeof o.need === 'number' ? o.need : (NEED[o.rank] || 0.5),
      /* a marquee waits for the release unless it says otherwise */
      wants: typeof o.wants === 'function' ? o.wants : o.rank === 'marquee' ? function () { return M.released; } : null,
      pause: typeof o.pause === 'function' ? o.pause : noop,
      resume: typeof o.resume === 'function' ? o.resume : noop,
      band: !!o.band, forced: !!o.forced,
      top: 0, h: 0, held: false, counted: false, share: 0
    };
    if (o.el.isConnected) { m.top = absTop(o.el); m.h = o.el.offsetHeight; }
    movers.push(m);
    budget(scrollY());
    return function () {
      var i = movers.indexOf(m);
      if (i >= 0) movers.splice(i, 1);
      budget(scrollY());
    };
  };
  M.movers = function () {
    return movers.map(function (m) { return { id: m.id, rank: m.rank, counted: !!m.counted, held: !!m.held, running: !!m.counted && !m.held }; });
  };

  /* each band's moving light (the quiet sandstone has none) and the strip, which cannot be held */
  function addOwnMovers() {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-bg]'), function (b, i) {
      if (b.classList.contains('bg--quiet')) return;
      M.addMover({
        id: 'band-' + i, el: b, rank: 'band', band: true,
        pause: function () { b.classList.add('is-held'); },
        resume: function () { b.classList.remove('is-held'); }
      });
    });
    var strip = doc.querySelector('[data-strip]');
    if (strip) M.addMover({ id: 'strip', el: strip, rank: 'strip', forced: true, need: 0.01, wants: function () { return M.released; } });
  }

  /* ---------- Screen size, hidden tabs, pictures, fonts ---------- */
  var roTimer = 0;
  function onResize() {
    var w = root.clientWidth || win.innerWidth, h = win.innerHeight;
    if (w !== W || Math.abs(h - H) > 0.2 * H) { H = h; W = w; refresh(); forceJump = true; kick(); }
    else measure();
  }
  win.addEventListener('resize', onResize);
  win.addEventListener('scroll', kick, { passive: true });
  if ('ResizeObserver' in win) {
    var ro = new ResizeObserver(function () {
      if (roTimer) return;
      roTimer = setTimeout(function () { roTimer = 0; refresh(); }, 100);
    });
    var observed = [];
    var observe = function () {
      sections.forEach(function (s) { if (observed.indexOf(s.el) < 0) { observed.push(s.el); ro.observe(s.el); } });
    };
  }
  doc.addEventListener('visibilitychange', function () {
    hidden = !!doc.hidden;
    last = 0;
    if (!hidden) { forceJump = true; kick(); }
  });
  win.addEventListener('pageshow', function (e) { if (e.persisted) { forceJump = true; refresh(); } });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { measure(); });
  win.addEventListener('load', function () { refresh(); if (observe) observe(); });

  /* ---------- Less motion, chosen while the page is open ---------- */
  var reduceMq = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function onReduce() {
    if (reduceMq.matches && !off) {
      off = true;
      root.classList.remove('motion', 'motion-go', 'motion-scroll', 'motion-jump');
      sections.concat(rows).forEach(function (r) { ['--p', '--x', '--v'].forEach(function (n) { r.el.style.removeProperty(n); }); r.wp = r.wx = r.wv = null; });
      movers.forEach(function (m) { setHeld(m, false); });
      emit('motion:off');
    } else if (!reduceMq.matches && off) {
      off = false;
      root.classList.add('motion', 'motion-go');
      first = true;
      refresh();
      emit('motion:on');
    }
  }
  if (reduceMq) {
    if (reduceMq.addEventListener) reduceMq.addEventListener('change', onReduce);
    else if (reduceMq.addListener) reduceMq.addListener(onReduce);
  }

  /* ---------- Start ---------- */
  navStart = 0;
  if (doc.querySelector('.op')) {
    holdUntil = Infinity;
    setTimeout(M.release, Math.max(0, HOLD_MAX - now()));
  }
  setTimeout(function () { releaseMovers('time'); }, Math.max(0, RELEASE_MAX - now()));
  scan();
  measure();
  addOwnMovers();
  if (observe) observe();
  if (typeof P.ready === 'function') P.ready(function () { setTimeout(refresh, 0); });
  setInterval(function () { if (!hidden && !off) budget(scrollY()); }, 500);
})();
