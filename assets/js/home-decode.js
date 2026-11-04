/* Home: moves the lens between the numbered details of the decoded piece.
   - Fine pointers: the lens follows the pointer over the picture; leaving the picture takes it back to the
     chosen detail, or hides it.
   - A press on a numbered point or on a fact chooses that detail: the point turns maroon, the fact is pressed
     and the lens rests on the point. Pressing the chosen fact again lets it go. ← → (and Home, End) move
     between the facts and move the lens with them.
   - Phones: tapping a point shows the lens there and brings its fact card into view; swiping the fact cards
     chooses the card that comes to rest at the start of the row.
   - The 2,400 px picture behind the lens starts loading when the section is one screen away.
   Pynora.decode.show(n, { glide: true }) moves the lens to detail n (1-5), gliding from where it is;
   Pynora.decode.hide() lets the detail go. Events: decode:show { n, from }, decode:hide, decode:press
   { n, how } when the visitor chooses (how: fact, key, point, swipe), decode:pointer when the lens follows
   the pointer. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var ZOOM = 2.2;            /* the lens shows the picture at 2.2 x */
  var EDGE = 6;              /* px the lens keeps from the screen's sides */
  var GLIDE = 900;           /* ms, a glide asked for by Pynora.decode.show */
  var STEP = 360;            /* ms, from one chosen detail to the next */
  var EASE = 'cubic-bezier(0.45, 0.05, 0.55, 0.95)';

  function setup(root) {
    var pic = P.$('.dec__pic', root);
    var lens = P.$('.dec__lens', root);
    var dots = P.$$('.dec__dot', root);
    var facts = P.$$('.dec__fbtn', root);
    var row = P.$('.dec__facts', root);
    if (!pic || !lens || !facts.length) return null;

    var count = facts.length;
    var points = facts.map(function (f, i) {
      var d = dots[i];
      return d ? [parseFloat(d.style.left) || 50, parseFloat(d.style.top) || 50] : [50, 50];
    });

    /* the catalogue holds the points; the page's own copy is only for the first paint */
    var piece = P.product(root.getAttribute('data-product'));
    if (piece && piece.decode && piece.decode.facts) {
      piece.decode.facts.forEach(function (f, i) {
        if (!f || !f.dot || i >= count) return;
        points[i] = [Number(f.dot[0]), Number(f.dot[1])];
        if (dots[i]) { dots[i].style.left = points[i][0] + '%'; dots[i].style.top = points[i][1] + '%'; }
      });
    }

    var lensImg = null;
    var chosen = 0;          /* the chosen detail, 1-5; 0 when none */
    var showing = false;
    var focus = null;        /* [x, y] in px of the picture: what the lens magnifies */
    var size = { w: 0, h: 0, r: 0, roomL: 0, roomR: 0 };
    var anims = [];

    /* ---------- the 2,400 px picture ---------- */
    function load() {
      if (lensImg || !lens.getAttribute('data-src')) return;
      lensImg = document.createElement('img');
      lensImg.className = 'dec__lens-img';
      lensImg.alt = '';
      lensImg.decoding = 'async';
      lensImg.src = lens.getAttribute('data-src');
      lens.appendChild(lensImg);
      measure();
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { load(); io.disconnect(); }
      }, { rootMargin: '100% 0px 100% 0px' });
      io.observe(root);
    } else {
      load();
    }

    /* ---------- where the lens sits ---------- */
    function measure() {
      size.w = pic.clientWidth;
      size.h = pic.clientHeight;
      size.r = lens.offsetWidth / 2;
      var box = pic.getBoundingClientRect();
      var vw = document.documentElement.clientWidth;
      size.roomL = Math.max(0, box.left - EDGE);
      size.roomR = Math.max(0, vw - box.right - EDGE);
      if (lensImg) {
        lensImg.style.width = (size.w * ZOOM).toFixed(1) + 'px';
        lensImg.style.height = (size.h * ZOOM).toFixed(1) + 'px';
      }
      /* a chosen detail keeps its point when the picture changes size (a turned phone, a resized window) */
      if (chosen && !following && size.w) focus = pointAt(chosen);
      if (focus) place(focus[0], focus[1], 0);
    }

    /* The lens is centred on the point it magnifies; near the screen's sides it slides inwards and keeps
       magnifying around that same point, so the numbered point always sits on its own detail. */
    function poses(x, y) {
      var r = size.r;
      var lo = r - Math.min(r, size.roomL);
      var hi = size.w - r + Math.min(r, size.roomR);
      var cx = hi < lo ? x : Math.min(hi, Math.max(lo, x));
      var lx = cx - r, ly = y - r;
      var ix = x - lx - x * ZOOM, iy = y - ly - y * ZOOM;
      return {
        lens: 'translate(' + lx.toFixed(1) + 'px, ' + ly.toFixed(1) + 'px)',
        img: 'translate(' + ix.toFixed(1) + 'px, ' + iy.toFixed(1) + 'px)'
      };
    }

    function stopAnims() {
      anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* already gone */ } });
      anims = [];
    }

    function place(x, y, ms) {
      var to = poses(x, y);
      var glide = ms > 0 && showing && focus && !P.reduced() && typeof lens.animate === 'function';
      var fromLens = glide ? getComputedStyle(lens).transform : null;
      var fromImg = glide && lensImg ? getComputedStyle(lensImg).transform : null;
      stopAnims();
      lens.style.transform = to.lens;
      if (lensImg) lensImg.style.transform = to.img;
      if (glide && fromLens && fromLens !== 'none') {
        anims.push(lens.animate([{ transform: fromLens }, { transform: to.lens }], { duration: ms, easing: EASE }));
        if (lensImg && fromImg && fromImg !== 'none') anims.push(lensImg.animate([{ transform: fromImg }, { transform: to.img }], { duration: ms, easing: EASE }));
      }
      focus = [x, y];
    }

    function reveal() {
      load();
      if (!showing) { lens.classList.add('is-on'); showing = true; }
    }
    function conceal() {
      stopAnims();
      lens.classList.remove('is-on');
      showing = false;
    }

    function pointAt(n) {
      var pt = points[n - 1];
      return [pt[0] / 100 * size.w, pt[1] / 100 * size.h];
    }

    /* ---------- the chosen detail ---------- */
    function mark(n) {
      chosen = n;
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i + 1 === n); });
      facts.forEach(function (f, i) { f.setAttribute('aria-pressed', i + 1 === n ? 'true' : 'false'); });
    }

    /* where fact card n starts, in the row's own scroll coordinates */
    function cardStart(n) {
      var card = facts[n - 1].closest('li') || facts[n - 1];
      return card.getBoundingClientRect().left - row.getBoundingClientRect().left - row.clientLeft + row.scrollLeft;
    }

    var steering = false, steerTimer = 0;
    function bringCard(n) {
      if (!row || row.scrollWidth <= row.clientWidth + 1) return;
      var pad = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0;
      var max = row.scrollWidth - row.clientWidth;
      var left = Math.min(max, Math.max(0, cardStart(n) - pad));
      if (Math.abs(left - row.scrollLeft) < 2) return;
      steering = true;
      clearTimeout(steerTimer);
      steerTimer = setTimeout(function () { steering = false; }, P.reduced() ? 120 : 900);
      row.scrollTo({ left: left, behavior: P.reduced() ? 'auto' : 'smooth' });
    }

    function show(n, opts) {
      n = Math.round(Number(n));
      if (!(n >= 1 && n <= count)) return;
      opts = opts || {};
      if (!size.w) measure();
      var was = showing;
      mark(n);
      reveal();
      var at = pointAt(n);
      place(at[0], at[1], was ? (opts.glide ? GLIDE : (opts.step === false ? 0 : STEP)) : 0);
      if (opts.card !== false) bringCard(n);
      P.emit('decode:show', { n: n, from: opts.from || 'page' });
    }

    function hide() {
      mark(0);
      conceal();
      P.emit('decode:hide', {});
    }

    function choose(n, how) {
      P.emit('decode:press', { n: n, how: how });
      show(n, { from: how, card: how !== 'swipe' });
    }

    /* ---------- facts: press, and ← → between them ---------- */
    facts.forEach(function (f, i) {
      f.addEventListener('click', function () {
        if (chosen === i + 1) { P.emit('decode:press', { n: 0, how: 'fact' }); hide(); return; }
        choose(i + 1, 'fact');
      });
      f.addEventListener('keydown', function (e) {
        var to = null;
        if (e.key === 'ArrowRight') to = Math.min(count, i + 2);
        else if (e.key === 'ArrowLeft') to = Math.max(1, i);
        else if (e.key === 'Home') to = 1;
        else if (e.key === 'End') to = count;
        if (to == null || e.altKey || e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        facts[to - 1].focus();
        choose(to, 'key');
      });
    });

    /* ---------- the numbered points (pointers and touch only) ---------- */
    dots.forEach(function (d, i) {
      d.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') e.preventDefault(); });
      d.addEventListener('click', function (e) {
        e.preventDefault();
        choose(i + 1, 'point');
      });
    });

    /* ---------- the lens follows a fine pointer ---------- */
    var following = false;
    function follow(e) {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      if (!P.fine()) return;
      var b = pic.getBoundingClientRect();
      var x = Math.min(size.w, Math.max(0, e.clientX - b.left));
      var y = Math.min(size.h, Math.max(0, e.clientY - b.top));
      if (!following) { following = true; P.emit('decode:pointer', {}); }
      reveal();
      place(x, y, 0);
    }
    pic.addEventListener('pointerenter', function (e) { if (!size.w) measure(); follow(e); });
    pic.addEventListener('pointermove', follow);
    pic.addEventListener('pointerleave', function (e) {
      if (!following) return;
      following = false;
      if (chosen) { var at = pointAt(chosen); place(at[0], at[1], STEP); }
      else conceal();
    });

    /* ---------- phones: swiping the fact cards ---------- */
    if (row) {
      var settle = 0;
      var settled = function () {
        if (steering) return;
        if (row.scrollWidth <= row.clientWidth + 1) return;
        var max = row.scrollWidth - row.clientWidth;
        var pad = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0;
        var n = count;
        if (row.scrollLeft < max - 2) {
          var best = Infinity;
          facts.forEach(function (f, i) {
            var d = Math.abs(cardStart(i + 1) - pad - row.scrollLeft);
            if (d < best) { best = d; n = i + 1; }
          });
        }
        if (n !== chosen) choose(n, 'swipe');
      };
      row.addEventListener('scroll', function () {
        clearTimeout(settle);
        settle = setTimeout(settled, 140);
      }, { passive: true });
      row.addEventListener('scrollend', function () {
        if (steering) { steering = false; clearTimeout(steerTimer); return; }
        clearTimeout(settle);
        settled();
      });
    }

    /* ---------- sizes ---------- */
    if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); }).observe(pic);
    window.addEventListener('resize', measure);
    measure();

    return {
      show: function (n, opts) { show(n, Object.assign({ from: 'api' }, opts || {})); },
      hide: hide,
      current: function () { return chosen; },
      count: count,
      points: function () { return points.map(function (p) { return p.slice(); }); }
    };
  }

  P.ready(function () {
    var root = P.$('.dec');
    var api = root && setup(root);
    if (api) P.decode = api;
  });
})();
