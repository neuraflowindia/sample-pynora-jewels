/* Sideways rows: the row arrows, keeping the focused card in view, and (with motion) the slow circular glide.
   - Pynora.rows.init(root) sets up every .row inside root (and root itself when it is one); calling it again
     only refreshes. The page’s own rows are set up when it is ready.
   - The arrows ([data-row-prev], [data-row-next] inside the row) move by one card. Their holder (.ib-arrows)
     is shown only while the row can scroll (the stylesheet shows it on fine pointers only); an arrow that cannot
     move further is marked aria-disabled and keeps its focus.
   - Moving through the row with Tab brings the whole card into view, on a card’s edge, so the row’s snapping
     never pulls it back out.
   - Cards added later (lists filled by script) and changes of width are picked up by themselves.
   - Pynora.rows.step(row, 1 | -1) moves a row by one card.
   The glide is the second part of this file (see its own note below). */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var count = 0;

  function setup(row) {
    if (row._pyRow) { row._pyRow.update(); return row._pyRow; }
    var scroller = P.$('.row__scroller', row);
    var track = scroller && P.$('.track', scroller);
    if (!scroller || !track) return null;

    var prev = P.$('[data-row-prev]', row);
    var next = P.$('[data-row-next]', row);
    var holder = (prev || next) ? (prev || next).closest('.ib-arrows') : null;

    if (!scroller.id) scroller.id = 'row-' + (++count);
    [prev, next].forEach(function (b) { if (b) b.setAttribute('aria-controls', scroller.id); });

    function padStart() { return parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0; }
    function padEnd() { return parseFloat(getComputedStyle(scroller).scrollPaddingRight) || 0; }
    function maxX() { return Math.max(0, scroller.scrollWidth - scroller.clientWidth); }

    function items() {
      return Array.prototype.filter.call(track.children, function (n) { return n.getClientRects().length > 0; });
    }

    /* where a card starts and ends in the scroller’s own coordinates */
    function edges(item) {
      var s = scroller.getBoundingClientRect();
      var r = item.getBoundingClientRect();
      var left = r.left - s.left - scroller.clientLeft + scroller.scrollLeft;
      return { left: left, right: left + r.width };
    }

    /* the scroll positions at which each card rests on the row’s start */
    function stops() {
      var pad = padStart(), m = maxX();
      return items().map(function (it) { return Math.min(m, Math.max(0, edges(it).left - pad)); });
    }

    function go(x) {
      x = Math.min(maxX(), Math.max(0, Math.round(x)));
      if (Math.abs(x - scroller.scrollLeft) < 1) return;
      scroller.scrollTo({ left: x, behavior: P.reduced() ? 'auto' : 'smooth' });
    }

    function step(dir) {
      var x = scroller.scrollLeft;
      var list = stops();
      var target = null;
      if (dir > 0) {
        for (var i = 0; i < list.length; i++) if (list[i] > x + 2) { target = list[i]; break; }
        if (target == null) target = maxX();
      } else {
        for (var j = list.length - 1; j >= 0; j--) if (list[j] < x - 2) { target = list[j]; break; }
        if (target == null) target = 0;
      }
      go(target);
    }

    function setOff(b, off) {
      if (!b) return;
      if (off) b.setAttribute('aria-disabled', 'true');
      else b.removeAttribute('aria-disabled');
    }

    function update() {
      var m = maxX();
      var can = m > 1;
      row.classList.toggle('is-scrollable', can);
      if (holder) holder.hidden = !can;
      var x = scroller.scrollLeft;
      setOff(prev, !can || x <= 1);
      setOff(next, !can || x >= m - 1);
    }

    var queued = false;
    function queue() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }

    function onArrow(e) {
      var b = e.currentTarget;
      if (b.getAttribute('aria-disabled') === 'true') return;
      step(b === prev ? -1 : 1);
    }
    if (prev) prev.addEventListener('click', onArrow);
    if (next) next.addEventListener('click', onArrow);

    /* Tab: show the whole card that holds the focus */
    track.addEventListener('focusin', function (e) {
      var item = e.target;
      while (item && item.parentNode !== track) item = item.parentNode;
      if (!item) return;
      var x = scroller.scrollLeft;
      var view = scroller.clientWidth;
      var pad = padStart(), padR = padEnd();
      var ed = edges(item);
      if (ed.left - pad >= x - 1 && ed.right + padR <= x + view + 1) return;   /* already in full view */
      if (ed.left - pad < x) { go(ed.left - pad); return; }
      /* past the end: the first resting place from which the card shows whole */
      var need = ed.right + padR - view;
      var list = stops();
      var target = Math.min(maxX(), ed.left - pad);
      for (var i = 0; i < list.length; i++) if (list[i] >= need - 1) { target = Math.min(target, list[i]); break; }
      go(target);
    });

    scroller.addEventListener('scroll', queue, { passive: true });
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(queue);
      ro.observe(scroller);
      ro.observe(track);
    } else {
      window.addEventListener('resize', queue);
    }
    if (window.MutationObserver) new MutationObserver(queue).observe(track, { childList: true });

    row._pyRow = { update: update, step: step, scroller: scroller, track: track };
    update();
    return row._pyRow;
  }

  function init(root) {
    root = root || document;
    var rows = P.$$('.row', root);
    if (root.nodeType === 1 && root.classList.contains('row')) rows.unshift(root);
    rows.forEach(setup);
  }

  P.rows = {
    init: init,
    step: function (row, dir) { var r = setup(row); if (r) r.step(dir < 0 ? -1 : 1); }
  };

  P.ready(function () { init(document); });
})();

/* Gliding rows: a sideways row that moves slowly leftwards by itself, as a circle with no end.
   - Which rows: every element marked data-loop, and every reviews row (.row--reviews, unless data-loop="off").
     data-loop="phone" (the default) glides on phones (up to 760 px) and touch tablets (up to 1,079 px);
     data-loop="always" glides at every width. A row glides only while it really scrolls sideways at that width
     and its pieces do not all fit; a reviews row needs four cards or more.
     data-loop-speed="24 22": px a second on wider screens, then on phones (reviews: 32 and 26).
     data-loop-label="Pause the gifts": its pause button's name (reviews: "Pause the reviews").
     The scroller is [data-loop-scroller] (else .row__scroller) inside the row, and the list its first element.
   - The list is copied as often as needed (copies are hidden from screen readers and from the keyboard, and
     still answer a finger); one period is the distance from the list's first piece to that of its first copy,
     a whole number of pixels, so the circle's join cannot be seen. The glide is a CSS animation (m-loop,
     rows.css); a finger, a sideways wheel or a row arrow folds it into the row's own scroll position, so the
     visitor scrolls natively, with momentum, either way without meeting an end (the resting row is kept in the
     middle of its copies). It glides again 1.5 s after the finger lifts and the scrolling has stopped, easing
     back up to speed over 0.6 s.
   - It rests while the mouse is over it, while the keyboard is inside it, while under 60% of it is on screen,
     while the page is hidden or a drawer or menu is open, and while its pause button is pressed (then it comes
     to rest on the nearest piece and snapping returns). It never snaps while it glides.
   - The three-movers rule never holds a gliding row the visitor is looking at (it counts, so others wait).
   - Visitors who ask for less motion get still rows they scroll by hand, and no pause buttons.
   Pynora.rows.loop(root, options) makes a loop by script (the jewel ribbon); Pynora.rows.loopOf(el) returns the
   loop holding el: { active(), state() 'off' | 'glide' | 'touch' | 'steer' | 'paused', nearest() {index, el},
   bring(index, ms), release(), root }. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P || !P.rows) return;
  var doc = document;
  var html = doc.documentElement;

  var REST = 1500;            /* ms after the finger lifts and the scrolling stops */
  var RAMP = 600;             /* ms back up to speed */
  var STEER = 4000;           /* ms a row rests on a piece brought to its middle */
  var IDLE = 160;             /* ms without a scroll event: the scrolling has stopped */
  var ROOM = 1000;            /* px of the circle kept on either side of a resting row */
  var EDGE = 300;             /* px: a row scrolled this near either end by the visitor is moved back to the middle */
  var SEEN = 0.6;             /* share of a row on screen before it glides */
  var REVIEWS = { mode: 'always', speed: [32, 26], label: 'Pause the reviews', min: 4, cls: 'row__pause rv__pause' };

  function mq(q) { return window.matchMedia ? window.matchMedia(q) : null; }
  var PHONE = mq('(max-width: 760px)');
  var TOUCH = mq('(max-width: 1079px) and (hover: none) and (pointer: coarse)');
  function phone() { return !!(PHONE && PHONE.matches); }
  function touchTablet() { return !!(TOUCH && TOUCH.matches); }
  function onChange(m, fn) { if (!m) return; if (m.addEventListener) m.addEventListener('change', fn); else if (m.addListener) m.addListener(fn); }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function shown(n) { return n.getClientRects().length > 0; }

  var GLYPHS = {
    pause: '<rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>',
    play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>'
  };
  function glyph(name) {
    return '<svg class="i mq-pause__' + name + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + GLYPHS[name] + '</svg>';
  }

  /* the list's current offset (px, positive leftwards) while it glides: its translate plus its transform */
  function offsetOf(track) {
    var cs = getComputedStyle(track);
    var x = 0;
    var tr = cs.translate;
    if (tr && tr !== 'none') x += parseFloat(tr) || 0;
    var t = cs.transform;
    if (t && t !== 'none') {
      var m = t.match(/matrix(3d)?\(([^)]+)\)/);
      if (m) { var v = m[2].split(',').map(parseFloat); x += (m[1] ? v[12] : v[4]) || 0; }
    }
    return -x;
  }

  /* a copy: hidden from screen readers and out of the keyboard's way; a finger may still tap it (the row shows
     copies about half the time, and they must work like the pieces they repeat) */
  var FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';
  function asCopy(n) {
    n.setAttribute('aria-hidden', 'true');
    n.setAttribute('data-copy', '');
    n.removeAttribute('id');
    if (n.matches(FOCUSABLE)) n.setAttribute('tabindex', '-1');
    P.$$(FOCUSABLE, n).forEach(function (f) { f.setAttribute('tabindex', '-1'); });
    P.$$('[id]', n).forEach(function (x) { x.removeAttribute('id'); });
    if (P.cards && typeof P.cards.wire === 'function') {
      P.$$('.card', n).forEach(function (c) { try { P.cards.wire(c); } catch (e) { /* the copy stays as it is */ } });
    }
    return n;
  }

  var count = 0;

  function Loop(root, o) {
    var scroller = o.scroller, track = o.track, watch = o.watch || root;
    var reasons = { off: true };
    if (o.wait) reasons.wait = true;
    var on = false, made = false, folded = true, offAll = false;
    var period = 0, speed = 0, sets = 1, mid = 1, n = 0;
    var btn = null, down = false, lastPress = -1e9, mover = null;
    var restTimer = 0, idleTimer = 0, steerTimer = 0, snapTimer = 0, rampRaf = 0, checkRaf = 0, refreshTimer = 0;
    var selfUntil = 0;

    function own() { return Array.prototype.filter.call(track.children, function (c) { return !c.hasAttribute('data-copy'); }); }
    function ready() {
      var list = own();
      return list.length >= o.min && !list.some(function (c) { return c.getAttribute('aria-hidden') === 'true'; });
    }
    function widthOK() { return o.mode === 'always' || phone() || touchTablet(); }
    function scrolls() { return /(auto|scroll)/.test(getComputedStyle(scroller).overflowX); }
    function overflows() {
      var list = own().filter(shown);
      if (!list.length) return false;
      var cs = getComputedStyle(track);
      var a = list[0].getBoundingClientRect(), b = list[list.length - 1].getBoundingClientRect();
      return b.right - a.left + (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) > scroller.clientWidth + 1;
    }
    function want() { return widthOK() && ready() && scrolls() && overflows(); }

    function norm(x) {
      if (!period) return x;
      x = x % period;
      return x < 0 ? x + period : x;
    }
    /* the row's own scroll position, set at once (never smoothly) */
    function setScroll(x) {
      selfUntil = now() + 150;
      var b = scroller.style.scrollBehavior;
      scroller.style.scrollBehavior = 'auto';
      scroller.scrollLeft = x;
      scroller.style.scrollBehavior = b;
    }
    function refreshMotion() {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(function () {
        if (P.motion && P.motion.on && typeof P.motion.refresh === 'function') P.motion.refresh();
      }, 0);
    }

    /* ---------- the copies ---------- */
    function addSet() {
      var frag = doc.createDocumentFragment();
      own().forEach(function (it, i) {
        var c = asCopy(it.cloneNode(true));
        if (i === 0) c.setAttribute('data-copy-first', '');
        frag.appendChild(c);
      });
      track.appendChild(frag);
      sets++;
    }
    function clearCopies() {
      Array.prototype.slice.call(track.children).forEach(function (c) { if (c.hasAttribute('data-copy')) track.removeChild(c); });
      sets = 1;
      made = false;
      period = 0;
    }
    /* each set of copies starts after the same empty space as the list's own side padding, rounded so that one
       period is a whole number of pixels: the frame one period on is pixel for pixel the frame at the start */
    function spacer() {
      var firsts = Array.prototype.filter.call(track.children, function (c) { return c.hasAttribute('data-copy-first'); });
      if (!firsts.length) return;
      var cs = getComputedStyle(track);
      var base = Math.max(0, (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.columnGap) || 0));
      firsts.forEach(function (c) { c.style.marginLeft = base.toFixed(3) + 'px'; });
      var raw = firsts[0].getBoundingClientRect().left - track.children[0].getBoundingClientRect().left;
      var m = (base + (Math.ceil(raw - 0.001) - raw)).toFixed(3) + 'px';
      firsts.forEach(function (c) { if (c.style.marginLeft !== m) c.style.marginLeft = m; });
    }
    function measure() {
      if (!on) return;
      n = own().length;
      var first = track.children[0], copy = track.children[n];
      if (!first || !copy) return;
      spacer();
      var p = copy.getBoundingClientRect().left - first.getBoundingClientRect().left;
      if (p < 1) return;
      var vw = scroller.clientWidth;
      var m = Math.max(1, Math.ceil(ROOM / p));
      var need = m + 1 + Math.ceil((ROOM + vw) / p);
      if (need > sets) {
        while (sets < need) addSet();
        spacer();
        refreshMotion();
      }
      mid = m;
      var s = phone() ? o.speed[1] : o.speed[0];
      if (Math.abs(p - period) < 0.01 && s === speed) return;
      var at = folded ? 0 : offsetOf(track);
      period = p;
      speed = s;
      track.style.setProperty('--loop-d', period.toFixed(3) + 'px');
      if (!folded) start(at, false);
    }

    /* ---------- the glide ---------- */
    function anim() {
      if (!track.getAnimations) return null;
      var l = track.getAnimations();
      for (var i = 0; i < l.length; i++) if (l[i].animationName === 'm-loop') return l[i];
      return null;
    }
    function rampUp() {
      cancelAnimationFrame(rampRaf);
      var a = anim();
      if (!a) return;
      var t0 = now();
      (function step() {
        var k = Math.min(1, (now() - t0) / RAMP);
        try { a.playbackRate = k >= 1 ? 1 : Math.max(0.01, k * k * (3 - 2 * k)); } catch (e) { return; }
        if (k < 1) rampRaf = requestAnimationFrame(step);
      })();
    }
    function start(at, ramp) {
      at = norm(at);
      cancelAnimationFrame(rampRaf);
      track.style.animation = 'none';
      void track.offsetWidth;
      track.style.animation = 'm-loop ' + (period / speed).toFixed(3) + 's linear ' + (-at / speed).toFixed(3) + 's infinite';
      track.style.animationPlayState = '';
      track.classList.add('is-gliding');
      if (ramp) rampUp();
    }
    function stopGlide() {
      cancelAnimationFrame(rampRaf);
      track.style.animation = '';
      track.style.animationPlayState = '';
      track.classList.remove('is-gliding');
    }
    /* glide -> scroll position (the same picture stays on screen): at the list itself (the keyboard, the pause
       button) or in the middle of the copies (a finger, so it may go far either way) */
    function foldToScroll(origin) {
      if (folded) return;
      var x = norm(scroller.scrollLeft + offsetOf(track));
      stopGlide();
      setScroll(x + (origin ? 0 : mid * period));
      folded = true;
    }
    /* scroll position -> glide */
    function foldToGlide() {
      if (!period) return;
      var at = norm(scroller.scrollLeft + (folded ? 0 : offsetOf(track)));
      setScroll(0);
      folded = false;
      start(at, true);
    }
    /* a row resting under a finger is moved back to the middle of its copies (the same picture: the move is a
       whole number of periods): when its scrolling stops, when the finger comes down again, and at once when a
       swipe or its momentum comes near either end (the momentum carries on from the new place) */
    function centreOK() { return on && folded && period && !reasons.focus && !reasons.user && !reasons['off-all']; }
    function recentre() {
      if (down || !centreOK()) return;
      var s = scroller.scrollLeft, t = norm(s) + mid * period;
      if (Math.abs(t - s) > 0.5) setScroll(t);
    }
    function nearEnd() {
      if (!centreOK() || !reasons.touch || reasons.steer) return;
      var s = scroller.scrollLeft, max = scroller.scrollWidth - scroller.clientWidth;
      if (s < EDGE || s > max - EDGE) setScroll(norm(s) + mid * period);
    }

    function apply() {
      if (!on || !period) { root.classList.toggle('is-stopped', !!reasons.user); return; }
      var any = false;
      for (var k in reasons) if (reasons[k]) { any = true; break; }
      var origin = reasons.focus || reasons.user || reasons['off-all'];
      if (origin || reasons.touch || reasons.steer) foldToScroll(origin);
      if (!any) {
        scroller.style.scrollSnapType = 'none';
        if (folded) foldToGlide();
        else if (track.style.animationPlayState === 'paused') { track.style.animationPlayState = ''; rampUp(); }
      } else if (!folded && track.style.animationPlayState !== 'paused') {
        cancelAnimationFrame(rampRaf);
        track.style.animationPlayState = 'paused';
      }
      root.classList.toggle('is-stopped', !!reasons.user);
    }
    function set(name, v) {
      v = !!v;
      if (!!reasons[name] === v) return;
      reasons[name] = v;
      /* while the keyboard is inside, a piece already on screen is "in view": no padding to bring it past */
      if (name === 'focus') scroller.style.scrollPaddingInline = v ? '0px' : '';
      apply();
    }

    /* ---------- the visitor's finger, wheel and arrows ---------- */
    function restAfter(ms) {
      clearTimeout(restTimer);
      restTimer = setTimeout(function () { if (!down) set('touch', false); }, ms);
    }
    function idleSoon() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(recentre, IDLE);
    }
    function press() {
      if (reasons.touch && !down) recentre();
      down = true;
      lastPress = now();
      clearTimeout(restTimer);
      set('touch', true);
    }
    function lift() {
      if (!down) return;
      down = false;
      restAfter(REST);
      idleSoon();
    }
    function nudged() {
      set('touch', true);
      restAfter(REST);
      idleSoon();
    }
    function onScroll(e) {
      if (e.target === scroller && now() < selfUntil) return;
      if (reasons.touch) { if (!down) restAfter(REST); idleSoon(); if (e.target === scroller) nearEnd(); }
      else if (reasons.steer) idleSoon();
    }

    /* the pause button: stopped, the row first comes to rest on the nearest piece, then snapping returns */
    function settleOnPiece() {
      var pad = parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0;
      var sr = scroller.getBoundingClientRect();
      var best = null, dist = Infinity;
      Array.prototype.forEach.call(track.children, function (it) {
        if (!shown(it)) return;
        var x = it.getBoundingClientRect().left - sr.left - scroller.clientLeft + scroller.scrollLeft - pad;
        var d = Math.abs(x - scroller.scrollLeft);
        if (d < dist) { dist = d; best = x; }
      });
      clearTimeout(snapTimer);
      if (best == null || dist < 1) { scroller.style.scrollSnapType = ''; return; }
      scroller.scrollTo({ left: Math.max(0, best), behavior: 'smooth' });
      var back = function () {
        clearTimeout(snapTimer);
        scroller.removeEventListener('scrollend', back);
        if (reasons.user) scroller.style.scrollSnapType = '';
      };
      scroller.addEventListener('scrollend', back);
      snapTimer = setTimeout(back, 900);
    }
    function makeButton() {
      btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'mq-pause ' + (o.cls || 'row__pause');
      btn.setAttribute('aria-label', o.label);
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = glyph('pause') + glyph('play');
      btn.addEventListener('click', function () {
        var stop = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', stop ? 'true' : 'false');
        if (stop) { set('user', true); settleOnPiece(); }
        else { clearTimeout(snapTimer); set('user', false); }
      });
      if (o.place) o.place(btn);
      else {
        var bar = P.$('.row__bar', root);
        (bar || root).appendChild(btn);
      }
    }

    /* keeps a focused piece fully in view inside the scroller (rows that rows.js does not keep, the ribbon) */
    function bringIntoView(el) {
      var item = el && el.closest ? (el.closest('a, button') || el) : null;
      if (!item || !track.contains(item)) return;
      var cs = getComputedStyle(scroller);
      var padL = parseFloat(cs.scrollPaddingLeft) || 0, padR = parseFloat(cs.scrollPaddingRight) || 0;
      var sr = scroller.getBoundingClientRect(), r = item.getBoundingClientRect();
      if (r.left < sr.left + padL) scroller.scrollLeft -= (sr.left + padL - r.left);
      else if (r.right > sr.right - padR) scroller.scrollLeft += (r.right - sr.right + padR);
    }

    function wire() {
      /* the mouse over the row */
      root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') set('hover', true); });
      root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') set('hover', false); });
      root.addEventListener('pointerdown', function () { lastPress = now(); }, true);
      /* the keyboard inside (focus that follows a press is the press's, not the keyboard's) */
      root.addEventListener('focusin', function (e) {
        if (btn && e.target === btn) return;
        if (now() - lastPress < 1000) return;
        set('focus', true);
        if (o.ownFocus) bringIntoView(e.target);
      }, true);
      root.addEventListener('focusout', function () {
        setTimeout(function () {
          var a = doc.activeElement;
          if (!a || !root.contains(a) || a === btn) set('focus', false);
        }, 0);
      }, true);
      /* a finger (or a pen): rests until 1.5 s after it lifts and the scrolling it caused has stopped */
      scroller.addEventListener('touchstart', press, { passive: true, capture: true });
      scroller.addEventListener('touchend', lift, { passive: true, capture: true });
      scroller.addEventListener('touchcancel', lift, { passive: true, capture: true });
      scroller.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') press(); }, true);
      scroller.addEventListener('pointerup', function (e) { if (e.pointerType === 'pen') lift(); }, true);
      scroller.addEventListener('pointercancel', function (e) { if (e.pointerType === 'pen') lift(); }, true);
      /* scrolling of the row, or of a card's own pictures inside it (capture: scroll events do not bubble) */
      root.addEventListener('scroll', onScroll, { passive: true, capture: true });
      /* a sideways wheel or trackpad, and the row arrows, stop it like a finger */
      scroller.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) nudged(); }, { passive: true });
      P.$$('[data-row-prev], [data-row-next]', root).forEach(function (b) { b.addEventListener('click', nudged, true); });

      /* on screen (sideways overflow ignored) */
      if ('IntersectionObserver' in window) {
        var steps = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99, 1];
        new IntersectionObserver(function (es) {
          var e = es[es.length - 1];
          var vh = e.rootBounds ? e.rootBounds.height : window.innerHeight;
          var h = Math.max(1, Math.min(e.boundingClientRect.height, vh));
          set('off', !(e.isIntersecting && e.intersectionRect.height >= o.need * h - 2));
        }, { rootMargin: '0px 400px 0px 400px', threshold: steps }).observe(watch);
      } else reasons.off = false;

      doc.addEventListener('visibilitychange', function () { set('hidden', doc.hidden); });
      /* a drawer, a menu or a panel open over the page */
      P.on('overlay:open', function () { set('overlay', true); });
      P.on('overlay:close', function (d) { if (!(d && d.switching)) set('overlay', false); });
      /* "less motion" chosen while the page is open: a still row to scroll by hand, no button */
      P.on('motion:off', function () { offAll = true; set('off-all', true); if (btn) btn.hidden = true; });
      P.on('motion:on', function () { offAll = false; if (btn) btn.hidden = !on; set('off-all', false); });

      if ('ResizeObserver' in window) new ResizeObserver(queue).observe(scroller);
      else window.addEventListener('resize', queue);
      onChange(PHONE, queue);
      onChange(TOUCH, queue);
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(queue);
      window.addEventListener('load', queue);
      /* the list filled (or filled again) by its own script */
      if (window.MutationObserver) {
        new MutationObserver(function (recs) {
          var real = function (nd) { return nd.nodeType === 1 && !nd.hasAttribute('data-copy'); };
          var changed = recs.some(function (r) { return [].some.call(r.addedNodes, real) || [].some.call(r.removedNodes, real); });
          if (!changed) return;
          if (made) {
            if (!folded) stopGlide();
            folded = true;
            clearCopies();
            setScroll(0);
          }
          queue();
        }).observe(track, { childList: true });
      }
    }

    function addMover() {
      if (mover || !P.motion || typeof P.motion.addMover !== 'function') return;
      try {
        /* forced: never held while on screen; it still counts, so the lowest of the others wait */
        mover = P.motion.addMover({
          id: o.name, el: watch, rank: 'marquee', need: 1, forced: true,
          wants: function () { return on && !reasons.user && !reasons.focus && P.motion.released !== false; },
          pause: function () { set('budget', true); },
          resume: function () { set('budget', false); }
        });
      } catch (e) { mover = null; }
    }

    function check() {
      checkRaf = 0;
      var w = want();
      if (w && !made) {
        made = true;
        n = own().length;
        addSet();
        addSet();
        refreshMotion();
      }
      if (w !== on) {
        on = w;
        root.classList.toggle('is-looping', on);
        if (on) {
          if (!btn) makeButton();
          addMover();
          scroller.style.scrollSnapType = reasons.user ? '' : 'none';
        } else {
          if (!folded) stopGlide();
          folded = true;
          setScroll(0);
          scroller.style.scrollSnapType = '';
        }
        if (btn) btn.hidden = !on || offAll;
      }
      if (on) measure();
      apply();
    }
    function queue() { if (!checkRaf) checkRaf = requestAnimationFrame(check); }

    var api = {
      root: root,
      active: function () { return on; },
      state: function () {
        if (!on) return 'off';
        if (reasons.user || reasons['off-all'] || reasons.focus) return 'paused';
        if (reasons.steer) return 'steer';
        if (reasons.touch) return 'touch';
        if (folded || track.style.animationPlayState === 'paused') return 'paused';
        return 'glide';
      },
      /* the piece (or copy) whose middle is nearest the row's middle; index: its place in the list */
      nearest: function () {
        var cnt = own().length;
        if (!cnt) return null;
        var sr = scroller.getBoundingClientRect(), c = sr.left + sr.width / 2;
        var kids = track.children, best = -1, d = Infinity;
        for (var i = 0; i < kids.length; i++) {
          if (!shown(kids[i])) continue;
          var r = kids[i].getBoundingClientRect();
          var dd = Math.abs(r.left + r.width / 2 - c);
          if (dd < d) { d = dd; best = i; }
        }
        return best < 0 ? null : { index: best % cnt, el: kids[best] };
      },
      /* brings the list's piece number index (from 0) to the row's middle, by the shortest way, and rests there */
      bring: function (index, ms) {
        if (!on || !period) return false;
        clearTimeout(steerTimer);
        set('steer', true);
        var cnt = own().length, sr = scroller.getBoundingClientRect(), c = sr.left + sr.width / 2, best = null, d = Infinity;
        var act = doc.activeElement;
        for (var k = 0; k < sets; k++) {
          var it = track.children[k * cnt + index];
          if (!it) continue;
          var r = it.getBoundingClientRect();
          if (act && it.contains(act)) { best = r; break; }   /* the keyboard's piece itself */
          var dd = Math.abs(r.left + r.width / 2 - c);
          if (dd < d) { d = dd; best = r; }
        }
        if (best) scroller.scrollTo({ left: scroller.scrollLeft + (best.left + best.width / 2 - c), behavior: 'smooth' });
        steerTimer = setTimeout(function () { set('steer', false); }, (ms || STEER) + 700);
        return true;
      },
      release: function () { set('wait', false); }
    };
    root._pyLoop = api;

    wire();
    queue();
    return api;
  }

  /* the options of a row marked in its HTML */
  function fromMarkup(root) {
    if (root._pyLoop || root.getAttribute('data-loop') === 'off') return null;
    var rv = root.classList.contains('row--reviews') ? REVIEWS : {};
    var sp = (root.getAttribute('data-loop-speed') || '').trim().split(/[\s,]+/).map(Number).filter(function (x) { return x > 0; });
    var scroller = P.$('[data-loop-scroller]', root) || P.$('.row__scroller', root);
    var track = scroller && (P.$('[data-loop-track]', scroller) || scroller.firstElementChild);
    if (!track) return null;
    return loop(root, {
      scroller: scroller,
      track: track,
      mode: root.getAttribute('data-loop') || rv.mode || 'phone',
      speed: sp.length ? [sp[0], sp[1] || sp[0]] : (rv.speed || [24, 22]),
      label: root.getAttribute('data-loop-label') || rv.label || 'Pause the row',
      min: parseInt(root.getAttribute('data-loop-min'), 10) || rv.min || 2,
      cls: rv.cls,
      ownFocus: !root.classList.contains('row')       /* rows.js keeps a .row's focused card in view itself */
    });
  }

  function armed() { return html.classList.contains('motion') && !P.reduced(); }

  /* Pynora.rows.loop(root, { scroller, track, mode, speed: [wide, phone], label, min, need, cls, place(button),
     wait (glides only after release()), ownFocus, watch, name }) */
  function loop(root, o) {
    if (!root || !armed()) return null;
    if (root._pyLoop) return root._pyLoop;
    o = o || {};
    if (!o.scroller || !o.track) return null;
    return Loop(root, {
      scroller: o.scroller,
      track: o.track,
      watch: o.watch,
      mode: o.mode === 'always' ? 'always' : 'phone',
      speed: o.speed || [24, 22],
      label: o.label || 'Pause the row',
      min: o.min || 2,
      need: typeof o.need === 'number' ? o.need : SEEN,
      cls: o.cls,
      place: o.place,
      wait: !!o.wait,
      ownFocus: !!o.ownFocus,
      name: o.name || root.id || ('row-loop-' + (++count))
    });
  }

  P.rows.loop = loop;
  P.rows.loopOf = function (el) {
    for (var x = el; x && x !== doc; x = x.parentNode) if (x._pyLoop) return x._pyLoop;
    return null;
  };

  P.ready(function () {
    if (!armed()) return;
    P.$$('[data-loop], .row--reviews').forEach(fromMarkup);
  });
})();
