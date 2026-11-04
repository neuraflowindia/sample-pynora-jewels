/* Home: the two slow loops, the jewel ribbon and the reviews row, and the ribbon's unroll.
   - Each list is copied twice (copies hidden from screen readers and from the keyboard), one period is measured
     as the distance from the first piece of the list to the first piece of its first copy, and the track glides
     left by a CSS animation: the ribbon at 32 px a second (24 on phones), the reviews at 22 (18 on phones).
   - A loop rests while the pointer is over it, while it holds the keyboard focus, for 4 s after the last touch
     or row arrow, while it is not fully on screen, while the page is hidden, and when the three-movers rule
     holds it. Its small pause button stops it until pressed again.
   - The glide and the row's own scroll position never fight: when a loop stops for focus, touch or the button,
     its offset is folded into the scroll position (the same picture stays on screen); when it starts again the
     scroll position is folded back into the glide. The reviews row has no snapping while it glides; stopped by
     the button, it first comes to rest on the nearest card, then snapping returns.
   - The ribbon unrolls from its centre once it is 60% on screen (never before 1.8 s after the page's arrival
     starts), and starts gliding 0.4 s later, once the opening has settled, the visitor has scrolled, or 12 s
     after the page began to load.
   - Visitors who ask for less motion get still rows they scroll by hand, and no pause buttons. */
(function () {
  'use strict';

  var P = window.Pynora;
  var doc = document;
  var html = doc.documentElement;
  if (!P || !html.classList.contains('motion') || P.reduced()) return;

  var PHONE = window.matchMedia ? window.matchMedia('(max-width: 760px)') : null;
  var TOUCH_REST = 4000;     /* ms a loop waits after the last touch or row arrow */
  var UNROLL_AFTER = 1800;   /* ms after the arrival starts, at the earliest */
  var UNROLL = 900;          /* ms, the unroll itself */
  var GLIDE_AFTER = 400;     /* ms after the unroll */
  var FIRST = 12000;         /* ms after the page began to load: the ribbon is released at the latest */

  var GLYPHS = {
    pause: '<rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>',
    play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>'
  };
  function glyph(name) {
    return '<svg class="i mq-pause__' + name + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + GLYPHS[name] + '</svg>';
  }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function phone() { return !!(PHONE && PHONE.matches); }

  /* the track's current offset (px, positive leftwards) while its glide runs: its translate plus its transform */
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

  /* ---------- One loop ---------- */
  function Loop(o) {
    var root = o.root, scroller = o.scroller, track = o.track;
    var reasons = { wait: true };
    var folded = true;           /* true while the picture is held by the scroll position, not the glide */
    var period = 0;
    var speed = 0;
    var touchTimer = 0;
    var snapTimer = 0;
    var btn = null;
    var done = false;

    /* the copies */
    function cloneSets() {
      var items = Array.prototype.slice.call(track.children);
      if (!items.length) return false;
      for (var k = 0; k < 2; k++) {
        var frag = doc.createDocumentFragment();
        items.forEach(function (li) {
          var c = li.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          c.setAttribute('inert', '');
          c.setAttribute('data-copy', '');
          P.$$('[id]', c).forEach(function (n) { n.removeAttribute('id'); });
          frag.appendChild(c);
        });
        track.appendChild(frag);
      }
      o.first = items[0];
      o.copy = track.children[items.length];
      o.copy2 = track.children[2 * items.length];
      return true;
    }

    /* Each copy starts after the same empty space as the track's own side padding (the first copy of each set is
       pushed right by the padding less the row's own gap), so the frame one period on is the same as the frame
       at the start: the loop's wrap cannot be seen, and its first frame is the still page. */
    function norm(x) {
      if (!period) return x;
      x = x % period;
      return x < 0 ? x + period : x;
    }
    /* the space is rounded so that one period is a whole number of pixels: the copies then fall on exactly the
       same pixels as the list itself, and the wrap is pixel for pixel the same frame */
    function spacer() {
      var cs = getComputedStyle(track);
      var pad = parseFloat(cs.paddingLeft) || 0;
      var gap = parseFloat(cs.columnGap) || 0;
      var base = Math.max(0, pad - gap);
      [o.copy, o.copy2].forEach(function (li) { if (li) li.style.marginLeft = base.toFixed(3) + 'px'; });
      var raw = o.copy.getBoundingClientRect().left - o.first.getBoundingClientRect().left;
      var m = (base + (Math.ceil(raw - 0.001) - raw)).toFixed(3) + 'px';
      [o.copy, o.copy2].forEach(function (li) { if (li && li.style.marginLeft !== m) li.style.marginLeft = m; });
    }
    function measure() {
      if (!o.first || !o.copy) return;
      spacer();
      var a = o.first.getBoundingClientRect(), b = o.copy.getBoundingClientRect();
      var p = b.left - a.left;
      var s = phone() ? o.speed[1] : o.speed[0];
      if (p < 1) return;
      if (Math.abs(p - period) < 0.01 && s === speed) return;
      var at = folded ? 0 : offsetOf(track);
      period = p;
      speed = s;
      track.style.setProperty('--loop-d', period.toFixed(3) + 'px');
      if (!folded) start(at);
    }

    function start(at) {
      at = norm(at);
      track.style.animation = 'none';
      void track.offsetWidth;
      track.style.animation = 'm-loop ' + (period / speed).toFixed(3) + 's linear ' + (-at / speed).toFixed(3) + 's infinite';
      track.style.animationPlayState = '';
      track.classList.add('is-gliding');
    }
    function stopGlide() {
      track.style.animation = '';
      track.style.animationPlayState = '';
      track.classList.remove('is-gliding');
    }

    /* glide -> scroll position (the same picture stays on screen) */
    function foldToScroll() {
      if (folded) return;
      var x = norm(scroller.scrollLeft + offsetOf(track));
      stopGlide();
      scroller.scrollLeft = x;
      folded = true;
    }
    /* scroll position -> glide */
    function foldToGlide() {
      if (!period) return;
      var at = norm(scroller.scrollLeft + (folded ? 0 : offsetOf(track)));
      scroller.scrollLeft = 0;
      folded = false;
      start(at);
    }

    function apply() {
      if (!period) return;
      var any = false, fold = reasons.focus || reasons.touch || reasons.user || reasons['off-all'];
      for (var k in reasons) if (reasons[k]) { any = true; break; }
      if (fold) foldToScroll();
      if (!any) {
        if (o.snap) scroller.style.scrollSnapType = 'none';
        if (folded) foldToGlide();
        else track.style.animationPlayState = '';
      } else if (!folded) {
        track.style.animationPlayState = 'paused';
      }
      root.classList.toggle('is-stopped', !!reasons.user);
    }
    function set(name, on) {
      on = !!on;
      if (!!reasons[name] === on) return;
      reasons[name] = on;
      /* while the keyboard is inside, a piece already on screen is "in view": no padding to bring it past */
      if (name === 'focus') scroller.style.scrollPaddingInline = on ? '0px' : '';
      apply();
    }

    /* the reviews: after the button stops the row, it comes to rest on the nearest card, then snapping returns */
    function settleOnCard() {
      if (!o.snap) return;
      var items = P.$$('.row__item', track);
      var pad = parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0;
      var sr = scroller.getBoundingClientRect();
      var best = null, dist = Infinity;
      items.forEach(function (it) {
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

    /* the pause button */
    function makeButton() {
      btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'mq-pause ' + o.btnClass;
      btn.setAttribute('aria-label', o.label);
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = glyph('pause') + glyph('play');
      btn.addEventListener('click', function () {
        var stop = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', stop ? 'true' : 'false');
        if (stop) { set('user', true); settleOnCard(); }
        else {
          clearTimeout(snapTimer);
          set('user', false);
        }
      });
      o.place(btn);
    }

    /* keeps a focused piece fully in view inside the scroller (the ribbon; the reviews row does this itself) */
    function bringIntoView(el) {
      /* the focused piece itself (its flower and spacing after it may stay past the edge) */
      var item = el && el.closest ? (el.closest('a, button') || el) : null;
      if (!item || !track.contains(item)) return;
      var cs = getComputedStyle(scroller);
      var padL = parseFloat(cs.scrollPaddingLeft) || 0, padR = parseFloat(cs.scrollPaddingRight) || 0;
      var sr = scroller.getBoundingClientRect(), r = item.getBoundingClientRect();
      if (r.left < sr.left + padL) scroller.scrollLeft -= (sr.left + padL - r.left);
      else if (r.right > sr.right - padR) scroller.scrollLeft += (r.right - sr.right + padR);
    }

    function touched() {
      set('touch', true);
      clearTimeout(touchTimer);
      touchTimer = setTimeout(function () { set('touch', false); }, TOUCH_REST);
    }

    function wire() {
      /* pointer over the row (mouse only) */
      root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') set('hover', true); });
      root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') set('hover', false); });
      /* keyboard focus: fold first (capture), so the focused piece is placed by real scrolling */
      root.addEventListener('focusin', function (e) {
        if (btn && e.target === btn) return;
        set('focus', true);
        if (o.ownFocus) bringIntoView(e.target);
      }, true);
      root.addEventListener('focusout', function () {
        setTimeout(function () {
          var a = doc.activeElement;
          if (!a || !root.contains(a) || a === btn) set('focus', false);
        }, 0);
      }, true);
      /* touch: rests until 4 s after the last touch and the last movement it caused */
      scroller.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') touched(); }, true);
      scroller.addEventListener('touchstart', touched, { passive: true, capture: true });
      scroller.addEventListener('touchend', touched, { passive: true });
      scroller.addEventListener('scroll', function () { if (reasons.touch) touched(); }, { passive: true });
      /* the row arrows stop it like a touch (capture: the row is folded before it steps) */
      P.$$('[data-row-prev], [data-row-next]', root).forEach(function (b) { b.addEventListener('click', touched, true); });

      /* fully on screen (sideways overflow ignored) */
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          var e = es[es.length - 1];
          var full = e.isIntersecting && e.intersectionRect.height >= e.boundingClientRect.height - 2;
          set('off', !full);
        }, { rootMargin: '0px 400px 0px 400px', threshold: [0, 0.5, 0.9, 0.95, 0.98, 0.99, 1] });
        io.observe(o.watch);
      }
      reasons.off = true;

      doc.addEventListener('visibilitychange', function () { set('hidden', doc.hidden); });
      /* "less motion" chosen while the page is open: a still row to scroll by hand, no button */
      P.on('motion:off', function () { set('off-all', true); if (btn) btn.hidden = true; });
      P.on('motion:on', function () { if (btn) btn.hidden = false; set('off-all', false); });

      if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); }).observe(scroller);
      else window.addEventListener('resize', measure);
      if (PHONE) {
        var re = function () { measure(); };
        if (PHONE.addEventListener) PHONE.addEventListener('change', re);
        else if (PHONE.addListener) PHONE.addListener(re);
      }
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measure);
      window.addEventListener('load', measure);

      /* the three-movers rule */
      if (P.motion && typeof P.motion.addMover === 'function') {
        try {
          P.motion.addMover({
            id: o.name,
            el: o.watch,
            rank: 'marquee',
            need: 1,
            pause: function () { set('budget', true); },
            resume: function () { set('budget', false); }
          });
        } catch (e) { /* the loop still keeps its own rules */ }
      }
    }

    function init() {
      if (done) return true;
      if (!cloneSets()) return false;
      done = true;
      root.classList.add('is-looping');
      makeButton();
      wire();
      measure();
      apply();
      return true;
    }

    return {
      init: init,
      release: function () { set('wait', false); },
      root: root
    };
  }

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

    var loop = Loop({
      name: 'ribbon', root: rib, scroller: scroller, track: track, watch: rib,
      speed: [32, 24], label: 'Pause the ribbon', btnClass: 'rib__pause', ownFocus: true, snap: false,
      place: function (b) { rib.appendChild(b); }
    });

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
      loop.release();
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

    whenFilled(track, 'data-filled', function () { loop.init(); tryUnroll(); });
  }

  /* ---------- The reviews row ---------- */
  function reviews() {
    var row = P.$('.rv .row--reviews');
    var scroller = row && P.$('.row__scroller', row);
    var track = scroller && P.$('.track', scroller);
    if (!track) return;
    var loop = Loop({
      name: 'reviews', root: row, scroller: scroller, track: track, watch: row,
      speed: [22, 18], label: 'Pause the reviews', btnClass: 'rv__pause', ownFocus: false, snap: true,
      place: function (b) {
        var bar = P.$('.row__bar', row);
        (bar || row).appendChild(b);
      }
    });
    whenFilled(track, 'data-reviews-filled', function () {
      if (loop.init()) loop.release();
    });
  }

  P.ready(function () {
    /* Home's section dividers draw on their title's cue (their shares are set in motion-home.css) */
    if (P.motion && P.motion.on && typeof P.motion.addCues === 'function') P.motion.addCues('.hs > .orn-rule');
    ribbon();
    reviews();
  });
})();
