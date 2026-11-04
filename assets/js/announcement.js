/* Announcement strip: its three lines take turns, each sliding up into the clipped line (560 ms), never fading.
   - The first change waits until the opening has settled (the "opening:settled" event), the visitor first
     scrolls, or 12 s have passed since the page began to load, whichever comes first; then every 4.5 s.
   - It pauses while the mouse is over the strip and while one of its links has focus from the Tab key. A link in a
     hidden line that takes focus brings its line into view, and the line stays while focus is there.
   - All three lines stay in the page as a list (aria-live="off"), so screen readers can read every one.
   - With less motion the first line stays still (a focused link still shows its own line, at once). */
(function () {
  'use strict';

  var P = window.Pynora || {};
  var doc = document;
  var EVERY = 4500;
  var FIRST = 12000;

  function reduced() {
    if (typeof P.reduced === 'function') return P.reduced();
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function init(strip) {
    var lines = Array.prototype.slice.call(strip.querySelectorAll('.strip__line'));
    if (lines.length < 2) return;

    var at = 0;
    var timer = 0;
    var started = false;
    var hover = false;
    var focus = false;

    strip.classList.add('is-live');
    lines.forEach(function (l, i) { l.classList.toggle('is-on', i === 0); l.classList.remove('is-out'); });

    function still() { strip.classList.toggle('is-still', reduced()); }

    function go(i) {
      if (i === at) return;
      still();
      var next = lines[i];
      /* a line that has just left upwards first returns, unseen, to its place below */
      if (next.classList.contains('is-out')) {
        next.classList.remove('is-out');
        void next.offsetWidth;
      }
      lines.forEach(function (l) { if (l !== next) l.classList.remove('is-out'); });
      lines[at].classList.remove('is-on');
      lines[at].classList.add('is-out');
      next.classList.add('is-on');
      at = i;
    }

    function schedule() {
      clearTimeout(timer);
      if (!started || hover || focus || reduced()) return;
      timer = setTimeout(function () {
        if (hover || focus || reduced()) return;
        go((at + 1) % lines.length);
        schedule();
      }, EVERY);
    }

    function start() {
      if (started) return;
      started = true;
      clearTimeout(firstTimer);
      window.removeEventListener('scroll', start);
      if (typeof P.off === 'function') P.off('opening:settled', start);
      if (!hover && !focus && !reduced()) go((at + 1) % lines.length);
      schedule();
    }

    var since = (window.performance && performance.now) ? performance.now() : 0;
    var firstTimer = setTimeout(start, Math.max(0, FIRST - since));
    window.addEventListener('scroll', start, { passive: true, once: true });
    if (typeof P.on === 'function') P.on('opening:settled', start);

    strip.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      hover = true;
      clearTimeout(timer);
    });
    strip.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      hover = false;
      schedule();
    });
    strip.addEventListener('focusin', function (e) {
      focus = true;
      clearTimeout(timer);
      strip.scrollTop = 0;             /* older browsers scroll the clipped strip to the focused link */
      strip.scrollLeft = 0;
      var line = e.target.closest ? e.target.closest('.strip__line') : null;
      var i = lines.indexOf(line);
      if (i >= 0) go(i);
    });
    strip.addEventListener('focusout', function (e) {
      if (e.relatedTarget && strip.contains(e.relatedTarget)) return;
      focus = false;
      schedule();
    });
  }

  function boot() { Array.prototype.forEach.call(doc.querySelectorAll('[data-strip]'), init); }
  if (typeof P.ready === 'function') P.ready(boot);
  else if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
