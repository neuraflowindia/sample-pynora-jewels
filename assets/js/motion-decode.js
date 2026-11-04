/* Home: Decode the piece comes alive.
   - The numbered points open once, one after another, when the section is at least half on screen and its
     picture has settled (its progress 0.98 or more): each opens from its centre, then one fine ring spreads
     from it and fades.
   - Then, if nobody scrolls or moves the pointer for 1.5 s while the section is at least 60% on screen, the lens
     tours the five details: it appears on the first, rests 3 s, glides to the next, and so on to the fifth,
     then back to the first, where it stays. The tour stops for good at the visitor's first touch, press, key
     or pointer in the section; it waits while the section is under 60% on screen and goes on from where it
     was; it is never repeated in the same visit.
   - Phones, where the fact cards glide as a circle (rows.js): the glide is the tour (the card nearest the row's
     middle is the chosen detail, home-decode.js), so no timed tour runs there.
   - The lens grows from 0.85 to its full size whenever it appears.
   Uses Pynora.decode (home-decode.js) and its events; with less motion nothing here runs. */
(function () {
  'use strict';

  var P = window.Pynora;
  var doc = document;
  var html = doc.documentElement;
  if (!P || !html.classList.contains('motion') || P.reduced()) return;

  var DOT_START = 200, DOT_STEP = 160, DOT_OPEN = 420;
  var QUIET = 1500;          /* ms without scrolling or pointer movement before the tour starts */
  var HOLD = 3000;           /* ms the lens rests on each detail */
  var GLIDE = 900;           /* ms between details */
  var LENS_GROW = 450;
  var EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function setup(sec) {
    var pic = P.$('.dec__pic', sec);
    var lens = P.$('.dec__lens', sec);
    var dots = P.$$('.dec__dot', sec);
    if (!pic || !lens) return;

    dots.forEach(function (d, i) { d.style.setProperty('--i', String(i)); });
    sec.classList.add('is-dots-waiting');

    /* ---------- how much of the section is on screen (of itself, or of the screen if it is taller) ---------- */
    var share = 0;
    var near = false;
    /* the picture's own progress (its row's, on phones; otherwise the section's), as the motion core writes it */
    function picProgress() {
      var M = P.motion;
      if (M && M.on && typeof M.progress === 'function') return M.progress(pic).p;
      return 1;
    }

    /* ---------- the points ---------- */
    var dotsAt = 0;
    function openDots() {
      dotsAt = now();
      sec.classList.add('is-dots');
      var last = DOT_START + DOT_STEP * Math.max(0, dots.length - 1) + DOT_OPEN;
      setTimeout(function () { sec.classList.add('is-dots-done'); }, last + 40);
    }

    /* ---------- the tour ---------- */
    var stopped = false, touring = false, finished = false, paused = false;
    var step = 0;              /* the detail the lens is on (1-5); 0 before the tour */
    var leg = 0;               /* 0 … count: the next move */
    var timer = 0, legEnds = 0, left = 0;
    var lastStir = now();
    var count = (P.decode && P.decode.count) || dots.length || 5;
    var order = [];
    for (var n = 1; n <= count; n++) order.push(n);
    order.push(1);
    var mover = null;

    function stopForGood() {
      if (stopped) return;
      stopped = true;
      touring = false;
      clearTimeout(timer);
      if (mover) { try { mover(); } catch (e) { /* already gone */ } mover = null; }
    }
    function next() {
      if (stopped || paused) return;
      if (leg >= order.length) { finished = true; touring = false; if (mover) { mover(); mover = null; } return; }
      var to = order[leg];
      var glide = leg > 0;
      leg += 1;
      step = to;
      P.decode.show(to, { glide: glide, from: 'tour' });
      var wait = (glide ? GLIDE : 0) + (leg < order.length ? HOLD : 0);
      legEnds = now() + wait;
      clearTimeout(timer);
      timer = setTimeout(next, wait);
    }
    function pauseTour() {
      if (!touring || paused) return;
      paused = true;
      left = Math.max(0, legEnds - now());
      clearTimeout(timer);
    }
    function resumeTour() {
      if (!touring || !paused || stopped) return;
      paused = false;
      legEnds = now() + left;
      timer = setTimeout(next, left);
    }
    /* the fact cards glide (phones): the glide shows the points in turn instead */
    function gliding() {
      var sc = P.$('.dec__facts-sc', sec) || P.$('.dec__facts', sec);
      var l = sc && P.rows && P.rows.loopOf ? P.rows.loopOf(sc) : null;
      return !!(l && l.active());
    }
    function startTour() {
      if (touring || stopped || finished || !P.decode || gliding()) return;
      touring = true;
      if (P.motion && typeof P.motion.addMover === 'function') {
        try {
          mover = P.motion.addMover({ id: 'decode-tour', el: sec, rank: 'tour', need: 0.6, pause: function () { held = true; check(); }, resume: function () { held = false; check(); } });
        } catch (e) { mover = null; }
      }
      next();
    }
    var held = false;

    /* the visitor takes over */
    P.on('decode:pointer', stopForGood);
    P.on('motion:off', stopForGood);
    P.on('decode:press', stopForGood);
    sec.addEventListener('keydown', stopForGood);
    sec.addEventListener('pointerdown', stopForGood);
    function stir() { lastStir = now(); }
    window.addEventListener('scroll', stir, { passive: true });
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') stir(); }, { passive: true });

    /* ---------- the watch: a light check while the section is near the screen ---------- */
    var tick = 0;
    function check() {
      if (!near) return;
      if (!dotsAt && share >= 0.5 && picProgress() >= 0.98) openDots();
      if (stopped || finished) return;
      if (touring) {
        if (gliding()) { stopForGood(); return; }
        if (share < 0.6 || held || doc.hidden) pauseTour();
        else resumeTour();
        return;
      }
      var doneDots = dotsAt && now() >= dotsAt + DOT_START + DOT_STEP * Math.max(0, dots.length - 1) + DOT_OPEN;
      if (doneDots && share >= 0.6 && !doc.hidden && now() - Math.max(lastStir, dotsAt) >= QUIET) startTour();
    }
    function run() {
      clearInterval(tick);
      if (near) tick = setInterval(check, 120);
    }
    if ('IntersectionObserver' in window) {
      var steps = [];
      for (var k = 0; k <= 40; k++) steps.push(k / 40);
      new IntersectionObserver(function (es) {
        var e = es[es.length - 1];
        var vh = e.rootBounds ? e.rootBounds.height : (window.innerHeight || html.clientHeight);
        near = e.isIntersecting;
        share = near ? e.intersectionRect.height / Math.max(1, Math.min(e.boundingClientRect.height, vh)) : 0;
        run();
        check();
      }, { threshold: steps }).observe(sec);
    } else { near = true; share = 1; run(); }
    doc.addEventListener('visibilitychange', check);

    /* ---------- the lens grows as it appears (centred on itself, whatever its position) ---------- */
    if (window.MutationObserver && typeof lens.animate === 'function') {
      var was = lens.classList.contains('is-on');
      new MutationObserver(function () {
        var on = lens.classList.contains('is-on');
        if (on && !was) {
          requestAnimationFrame(function () {
            var m = (lens.style.transform || '').match(/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px/);
            var r = lens.offsetWidth / 2;
            if (m) lens.style.transformOrigin = (parseFloat(m[1]) + r).toFixed(1) + 'px ' + (parseFloat(m[2]) + r).toFixed(1) + 'px';
            lens.animate([{ scale: '0.85' }, { scale: '1' }], { duration: LENS_GROW, easing: EASE });
          });
        }
        was = on;
      }).observe(lens, { attributes: true, attributeFilter: ['class'] });
    }
  }

  P.ready(function () {
    var sec = P.$('.dec[data-assemble]');
    if (sec) setup(sec);
  });
})();
