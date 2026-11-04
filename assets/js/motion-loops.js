/* Home: the jewel ribbon unrolls, then glides.
   - The glide itself is the shared gliding row of rows.js (Pynora.rows.loop): the list copied, one period a whole
     number of pixels, 32 px a second (24 on phones), resting under the mouse, with the keyboard inside, after a
     finger, off screen, while the page is hidden; its pause button at the right end. Every other sideways row
     (Home's reviews and card rows, and those of other pages) glides by its own markup (data-loop, rows.js).
   - The ribbon unrolls from its centre once it is 60% on screen (never before 1.8 s after the page's arrival
     starts), and starts gliding 0.4 s later, once the opening has settled, the visitor has scrolled, or 12 s
     after the page began to load.
   - Visitors who ask for less motion get a still ribbon they scroll by hand, and no pause button. */
(function () {
  'use strict';

  var P = window.Pynora;
  var doc = document;
  var html = doc.documentElement;
  if (!P || !html.classList.contains('motion') || P.reduced()) return;

  var UNROLL_AFTER = 1800;   /* ms after the arrival starts, at the earliest */
  var UNROLL = 900;          /* ms, the unroll itself */
  var GLIDE_AFTER = 400;     /* ms after the unroll */
  var FIRST = 12000;         /* ms after the page began to load: the ribbon is released at the latest */

  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  /* waits until a list has been filled by its own script */
  function whenFilled(list, attr, fn) {
    if (list.hasAttribute(attr) && list.children.length) { fn(); return; }
    if (!window.MutationObserver) return;
    var mo = new MutationObserver(function () {
      if (list.hasAttribute(attr) && list.children.length) { mo.disconnect(); fn(); }
    });
    mo.observe(list, { attributes: true, childList: true });
  }

  /* ---------- The ribbon: unroll, then glide ---------- */
  function ribbon() {
    var rib = P.$('[data-ribbon]');
    var scroller = rib && P.$('.rib__scroller', rib);
    var track = scroller && P.$('.rib__track', scroller);
    if (!track) return;
    rib.classList.add('is-waiting');      /* the script now opens the ribbon itself (the stylesheet's late safety opening is off) */

    var loop = P.rows && P.rows.loop ? P.rows.loop(rib, {
      scroller: scroller, track: track, watch: rib, mode: 'always', speed: [32, 24], min: 1, need: 1,
      label: 'Pause the ribbon', cls: 'rib__pause', ownFocus: true, wait: true, name: 'ribbon',
      place: function (b) { rib.appendChild(b); }
    }) : null;

    var unrolledAt = 0, released = false, seen = false, goAt = 0, timer = 0;
    function goTime() {
      if (goAt) return goAt;
      if (html.classList.contains('motion-go')) goAt = now();
      return goAt;
    }
    function tryUnroll() {
      if (unrolledAt || !seen || !goTime()) return;
      var wait = goAt + UNROLL_AFTER - now();
      if (wait > 0) { clearTimeout(timer); timer = setTimeout(tryUnroll, wait + 10); return; }
      unrolledAt = now();
      P.$$('.rib__li', track).forEach(function (li, i) { li.style.setProperty('--i', String(Math.min(i, 6))); });
      rib.classList.add('is-open');
      setTimeout(function () { rib.classList.add('is-unrolled'); tryGlide(); }, UNROLL + GLIDE_AFTER);
    }
    function tryGlide() {
      if (!released || !unrolledAt || now() < unrolledAt + UNROLL + GLIDE_AFTER - 20) return;
      if (loop) loop.release();
    }
    function release() {
      if (released) return;
      released = true;
      window.removeEventListener('scroll', release);
      if (P.off) { P.off('opening:settled', release); P.off('motion:release', release); }
      tryGlide();
    }

    /* the arrival's start, from the class motion-load adds to the page */
    if (!goTime() && window.MutationObserver) {
      var mo = new MutationObserver(function () { if (goTime()) { mo.disconnect(); tryUnroll(); } });
      mo.observe(html, { attributes: true, attributeFilter: ['class'] });
    }
    /* 60% on screen: worked out from its cached place (an observer would see nothing while it is still rolled up) */
    var ribTop = 0, looking = 0;
    function place() { var y = 0; for (var n = rib; n; n = n.offsetParent) y += n.offsetTop; ribTop = y; }
    function look() {
      looking = 0;
      if (seen) return;
      var vh = window.innerHeight || html.clientHeight;
      var top = ribTop - (window.pageYOffset || 0), h = rib.offsetHeight || 1;
      var shown = Math.max(0, Math.min(top + h, vh) - Math.max(top, 0)) / h;
      if (shown >= 0.6) {
        seen = true;
        window.removeEventListener('scroll', onLook);
        window.removeEventListener('resize', onResize);
        tryUnroll();
      }
    }
    function onLook() { if (!looking) looking = requestAnimationFrame(look); }
    function onResize() { place(); onLook(); }
    window.addEventListener('scroll', onLook, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', onResize);
    place();
    look();

    /* released with the strip (motion-core.js: the opening settles, the first scroll, or 12 s after the page began
       to load); without the scroll system, on the same moments here */
    var M = P.motion;
    if (M && M.on) {
      if (M.released) release();
      else P.on('motion:release', release);
    } else {
      P.on('opening:settled', release);
      window.addEventListener('scroll', release, { passive: true });
      setTimeout(release, Math.max(0, FIRST - now()));
    }

    whenFilled(track, 'data-filled', tryUnroll);
  }

  P.ready(function () {
    /* Home's section dividers draw on their title's cue (their shares are set in motion-home.css) */
    if (P.motion && P.motion.on && typeof P.motion.addCues === 'function') P.motion.addCues('.hs > .orn-rule');
    ribbon();
  });
})();
