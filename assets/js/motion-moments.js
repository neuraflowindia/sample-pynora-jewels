/* Small moments that happen once, each only where its part is on the page.
   - The gift box: its own progress (its centre from 90% to 50% of the screen's height, --gp on .gft__frame);
     when it first lands (0.98), one warm light passes over the foil; it can pass again only after the box has
     gone back below 0.2.
   - The stars above the reviews fill with gold from left to right once their heading is 40% arrived.
   - The heart: saving a piece, a dusty-rose heart grows inside it and one fine gold ring opens (is-bloom);
     taking it out, the fill shrinks (is-unbloom).
   - The footer settles into place when its top passes 85% of the screen's height, and back below 95%.
   The newsletter's check draws itself (motion-micro.css). With less motion nothing here runs. */
(function () {
  'use strict';

  var P = window.Pynora;
  var doc = document;
  var html = doc.documentElement;
  if (!P || !html.classList.contains('motion') || P.reduced()) return;

  function watch(el, fn) {
    if (P.motion && P.motion.on && typeof P.motion.watch === 'function') return P.motion.watch(el, fn);
    fn({ p: 1 });
    return function () {};
  }

  /* ---------- The gift box: its own progress, and the foil's light ----------
     The box arrives by its centre, from 90% of the screen's height to 50% (0.4 of a screen), written as --gp on
     .gft__frame inside the scroll system's one frame loop (Pynora.motion.tick), smoothed like every other value.
     When it first lands (0.98) one warm light passes over the foil; it may pass again once the box is back below 0.2. */
  function giftBox(frame) {
    var M = P.motion;
    if (!M || !M.on || typeof M.tick !== 'function') return;
    var holder = frame.parentElement || frame;
    var centre = 0, shown = -1, written = -1, lastY = -1, armed = true;
    function measure() {
      var y = 0;
      for (var n = holder; n; n = n.offsetParent) y += n.offsetTop;
      centre = y + frame.offsetHeight / 2;
      lastY = -1;
      M.kick();
    }
    function write(v) {
      if (Math.abs(v - written) <= 0.0005 && !(v !== written && (v === 0 || v === 1))) return;
      written = v;
      frame.style.setProperty('--gp', v.toFixed(4));
      if (armed && v >= 0.98) {
        armed = false;
        frame.classList.remove('is-foil');
        void frame.offsetWidth;
        frame.classList.add('is-foil');
      } else if (!armed && v < 0.2) {
        armed = true;
        frame.classList.remove('is-foil');
      }
    }
    M.tick(function (t, dt, y) {
      var H = M.H();
      var target = Math.max(0, Math.min(1, (0.9 * H - (centre - y)) / (0.4 * H)));
      var jump = shown < 0 || lastY < 0 || Math.abs(y - lastY) > 1.5 * H;
      lastY = y;
      if (jump) shown = target;
      else {
        shown += (target - shown) * (1 - Math.exp(-dt / 0.12));
        if (Math.abs(target - shown) < 0.0005) shown = target;
      }
      write(shown);
      return shown !== target;
    });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(frame.closest('[data-assemble]') || frame);
    measure();
  }

  /* ---------- The stars above the reviews: fill once, when their heading is 40% arrived ---------- */
  function stars(st) {
    var stop = null, done = false;
    st.classList.add('is-waiting');
    stop = watch(st, function (v) {
      if (done || v.p < 0.4) return;
      done = true;
      st.classList.add('is-filled');
      if (stop) setTimeout(stop, 0);
    });
  }

  /* ---------- The heart ---------- */
  doc.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.card__wish[data-wish]') : null;
    if (!b) return;
    /* cards.js has already saved or removed the piece: aria-pressed is the new state */
    var on = b.getAttribute('aria-pressed') === 'true';
    b.classList.remove('is-bloom', 'is-unbloom');
    void b.offsetWidth;
    b.classList.add(on ? 'is-bloom' : 'is-unbloom');
    clearTimeout(b._bloom);
    b._bloom = setTimeout(function () { b.classList.remove('is-bloom', 'is-unbloom'); }, on ? 640 : 240);
  });

  /* ---------- The footer settles in ---------- */
  function footer(ftr) {
    if (!('IntersectionObserver' in window)) return;
    var started = false;
    function up(on, instant) {
      if (instant) {
        ftr.classList.add('is-instant');
        requestAnimationFrame(function () { requestAnimationFrame(function () { ftr.classList.remove('is-instant'); }); });
      }
      ftr.classList.toggle('is-up', on);
    }
    /* up when its top passes 85% of the screen's height */
    new IntersectionObserver(function (es) {
      var e = es[es.length - 1];
      if (!started) {
        started = true;
        ftr.classList.add('is-cue');
        up(e.isIntersecting, true);
        return;
      }
      if (e.isIntersecting) up(true);
    }, { rootMargin: '0px 0px -15% 0px' }).observe(ftr);
    /* down when it goes back below 95% */
    new IntersectionObserver(function (es) {
      if (!started) return;
      if (!es[es.length - 1].isIntersecting) up(false);
    }, { rootMargin: '0px 0px -5% 0px' }).observe(ftr);
  }

  P.ready(function () {
    var frame = P.$('.gft__frame');
    if (frame) giftBox(frame);
    var st = P.$('.rv__stars');
    if (st) stars(st);
    var ftr = P.$('.ftr');
    if (ftr) footer(ftr);
  });
})();
