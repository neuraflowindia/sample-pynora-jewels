/* Pynora floating WhatsApp button (.waf).
   It appears once 60% of the page's opening (.op) has scrolled away, or after 400 px of scrolling on a page
   without one, and hides while a drawer or search is open. It also stays away while any element marked
   data-waf-hide is on screen (the product page's buy buttons, the footer), so it never covers them. While it shows, <html>
   carries .has-waf, so the toast on phones sits above it. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var doc = document;
  var html = doc.documentElement;
  var btn = doc.querySelector('.waf');
  if (!btn) return;

  var SHARE = 0.6;
  var PLAIN_PAGE = 400;
  var opening = doc.querySelector('.op');
  var past = false;
  var raf = 0;
  var held = typeof Set === 'function' ? new Set() : null;   /* marked elements now on screen */

  function measure() {
    raf = 0;
    if (opening) {
      var r = opening.getBoundingClientRect();
      past = r.height > 0 ? -r.top >= r.height * SHARE : (window.pageYOffset || html.scrollTop) > PLAIN_PAGE;
    } else {
      past = (window.pageYOffset || html.scrollTop) > PLAIN_PAGE;
    }
    paint();
  }

  function paint() {
    var on = past && !html.hasAttribute('data-overlay-open') && !(held && held.size);
    btn.classList.toggle('is-shown', on);
    html.classList.toggle('has-waf', on);
    if (on) btn.removeAttribute('tabindex'); else btn.setAttribute('tabindex', '-1');
  }

  function later() { if (!raf) raf = requestAnimationFrame(measure); }

  /* while a state is open the page is still, so only the overlay events matter */
  window.addEventListener('scroll', function () { if (!html.classList.contains('is-locked')) later(); }, { passive: true });
  window.addEventListener('resize', later);
  P.on('overlay:open', paint);
  P.on('overlay:close', function () { paint(); later(); });
  measure();

  /* marked elements may be drawn by a page script, so they are looked for once the page is ready */
  P.ready(function () {
    var marks = doc.querySelectorAll('[data-waf-hide]');
    if (!marks.length || !held || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.target.isConnected) held.add(en.target); else held.delete(en.target);
      });
      paint();
    });
    Array.prototype.forEach.call(marks, function (m) { io.observe(m); });
  });
})();
