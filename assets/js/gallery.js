/* The product gallery: Pynora.gallery.mount(el, product, {colour}) draws the framed picture and its thumbnails
   into el and returns {go(i), setColour(ci), index(), destroy()}. `colour` is the colour's place in the piece's
   list (or its id); without colours every picture is shown.
   - A thumbnail, the arrows, or ← → ↑ ↓ (Home, End) on the gallery choose a picture. On laptops the picture turns
     over like a gilded card: a later picture one way, an earlier one back; it rises as it turns, its gilt edge
     catches the light at the half-way point and one soft glint crosses the new picture as it lands; the heart,
     counter, arrows and dots turn with it, and the counter changes when the new face appears. Presses
     during a turn keep only the last choice. On tablets and phones the picture is a swipe strip: a swipe moves
     it; a tapped thumbnail turns it to its edge, jumps, and turns it back.
   - Pynora.emit('gallery:change', {index, n, colour, id}) whenever the chosen picture changes.
   - The first picture is built from window.PYNORA_PAGE.stage, the same address the page asked for while it was
     being read, so the browser fetches it once. Once the page has loaded, laptops quietly fetch the other
     pictures of the chosen colour; phones fetch only the next one. A picture not ready 300 ms after the press
     turns in anyway and appears on the sand ground as soon as it arrives.
   - After a turn the picture slowly pushes in and pans (laptops), resting under the pointer, off screen, in a hidden
     tab and whenever the page's motion budget (Pynora.motion.addMover, when the page has it) asks it to.
   - The loupe (laptops with a fine pointer): over the picture a round, gilt-rimmed lens follows the pointer and shows
     the detail under it at twice the size, from a sharper file; it steps aside over the buttons and during a turn.
     A small pill on the picture says so until the loupe is first used.
   - Less motion: the picture changes at once; no rise, edge, glint or drift; the loupe appears without growing.
   A classic script (no imports), loaded with defer after cards.js and before the page's own script. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var doc = document;
  var EASE = 'cubic-bezier(.22,.61,.36,1)';
  var EASE_IO = 'cubic-bezier(.45,.05,.55,.95)';
  var HALF_IN = 'cubic-bezier(.45,0,.75,.5)';      /* the first half of the in-and-out curve */
  var HALF_OUT = 'cubic-bezier(.25,.5,.55,1)';     /* and its second half */
  var RISE = 1.035;                                /* how far the card rises at its edge, and the drift's reach */
  var WAIT = 300;                                  /* a picture not ready by then turns in anyway */
  var GLINT = 420;
  var GLINT_LEAD = 160;                            /* the glint starts this long before the card lands */
  var RING = 260;
  var STEPS = 12;                                 /* keyframes per turn, so the rise follows a smooth curve */
  var AFTER_EDGE = 0.500001;                      /* a second half starts on the far side of the edge */
  var DRIFT = 10000;
  var PUSH = 'translate(-0.9%, -0.6%) scale(1.06)';  /* where the slow push-in and pan reaches (from rest) */
  var ZOOM = 2;                                    /* the loupe's magnification */
  /* a thumbnail's picture, filled by a square photograph (the prints grow on wide, tall screens: gallery.css) */
  var THUMB_SIZES = '(max-width: 960px) 62px, (min-width: 2200px) and (min-height: 1300px) 120px, (min-width: 1680px) and (min-height: 1000px) 105px, 90px';

  function media(q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; }
  var smallMq = media('(max-width: 960px)');
  var reduceMq = media('(prefers-reduced-motion: reduce)');
  var fineMq = media('(hover: hover) and (pointer: fine)');
  function listen(m, fn) { if (m.addEventListener) m.addEventListener('change', fn); else if (m.addListener) m.addListener(fn); }
  function unlisten(m, fn) { if (m.removeEventListener) m.removeEventListener('change', fn); else if (m.removeListener) m.removeListener(fn); }
  function small() { return !!smallMq.matches; }
  var canMove = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  function still() { return !canMove || P.reduced(); }
  function noop() {}

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function icon(n) { return '<svg class="i" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function toMs(v, fallback) {
    v = String(v || '').trim();
    var x = parseFloat(v);
    if (!isFinite(x)) return fallback;
    return /ms$/i.test(v) ? x : /s$/i.test(v) ? x * 1000 : x;
  }
  function cssVar(el, name) { try { return getComputedStyle(el).getPropertyValue(name); } catch (e) { return ''; } }

  /* ---------- pictures ---------- */
  function ready(img) { return !!(img && img.complete && img.naturalWidth > 0); }
  /* resolves true once the picture is decoded, false if it cannot be */
  function decoded(img) {
    return new Promise(function (res) {
      if (!img || (!img.getAttribute('src') && !img.getAttribute('srcset'))) { res(false); return; }
      if (img.decode) { img.decode().then(function () { res(true); }, function () { res(ready(img)); }); return; }
      if (ready(img)) { res(true); return; }
      img.addEventListener('load', function () { res(true); }, { once: true });
      img.addEventListener('error', function () { res(false); }, { once: true });
    });
  }
  function within(promise, t) {
    return Promise.race([promise, new Promise(function (res) { setTimeout(function () { res(false); }, t); })]);
  }
  /* fn once this picture has arrived (at once if it already has); a later picture in the same img cancels it */
  function whenLoaded(img, fn) {
    if (ready(img)) { fn(); return; }
    var want = img.getAttribute('data-n');
    function on() {
      img.removeEventListener('load', on);
      if (img.getAttribute('data-n') === want) fn();
    }
    img.addEventListener('load', on);
  }
  /* a late picture shows the sand ground, then fades in when it arrives */
  function waitFor(img) {
    if (ready(img)) { img.classList.remove('is-wait'); return; }
    img.classList.add('is-wait');
    whenLoaded(img, function () { img.classList.remove('is-wait'); });
  }

  function picsOf(p, ci) {
    var all = p.images || [];
    var c = p.colours && p.colours[ci];
    if (!c || !c.images || !c.images.length) return all.slice();
    return all.filter(function (im) { return c.images.indexOf(im.n) > -1; });
  }
  function colourIndex(p, c) {
    var list = p.colours || [];
    if (!list.length) return 0;
    if (typeof c === 'string') {
      for (var i = 0; i < list.length; i++) if (list[i].id === c) return i;
    }
    c = Math.round(Number(c) || 0);
    return Math.max(0, Math.min(list.length - 1, c));
  }
  /* the first picture exactly as the page asked for it while it was being read */
  function pageStage(p) {
    var pg = window.PYNORA_PAGE;
    var st = pg && pg.stage;
    return st && st.src && pg.id === p.id ? st : null;
  }
  /* the width a picture is shown at: the well's width, or more when a wider picture fills the well's height */
  function sizesFor(g, pic) {
    var r = g.stage.getBoundingClientRect();
    var k = parseFloat(cssVar(g.el, '--gal-in')) || (small() ? 6 : 7);
    var w = r.width - 2 * k;
    var h = r.height - 2 * k;
    if (w < 40 || h < 40) return g.first ? g.first.sizes : '(max-width: 632px) calc(100vw - 32px), 600px';
    var ratio = pic.ratio || 1;
    return Math.ceil(ratio > w / h ? h * ratio : w) + 'px';
  }
  function source(g, pic) {
    if (g.first && g.first.n === pic.n) return { src: g.first.src, srcset: g.first.srcset, sizes: g.first.sizes };
    return { src: P.img(g.p, pic.n, 1200), srcset: P.srcset(g.p, pic.n), sizes: sizesFor(g, pic) };
  }
  function setPic(g, img, pic, alt) {
    img.style.objectPosition = pic.focal || '50% 50%';
    img.alt = alt || '';
    if (img.getAttribute('data-n') === String(pic.n) && img.getAttribute('src')) return;
    var s = source(g, pic);
    img.setAttribute('data-n', String(pic.n));
    img.sizes = s.sizes;
    img.srcset = s.srcset;
    img.src = s.src;
  }

  /* ---------- keyframes: everything follows one turn, from 0 (flat) through 0.5 (edge-on) to 1 (landed) ---------- */
  function hump(t) { return Math.sin(Math.PI * t); }
  function alongTurn(fn, a, b) {
    var out = [];
    for (var k = 0; k <= STEPS; k++) {
      var f = fn(a + (b - a) * (k / STEPS));
      f.offset = k / STEPS;
      out.push(f);
    }
    return out;
  }
  /* the card: s is the side it turns to; a strip turns back over its own face after the edge */
  function cardAt(s, sameFace) {
    return function (t) {
      var deg = s * 180 * t;
      if (sameFace && t > 0.5) deg -= s * 180;
      return { transform: 'rotateY(' + deg.toFixed(2) + 'deg) scale(' + (1 + (RISE - 1) * hump(t)).toFixed(4) + ')' };
    };
  }
  /* its shadow on the counter: as narrow as the card at its edge, softer and lower as it rises */
  /* the overlays turn with the picture they sit on: out with the old face to its edge, back in with the new one */
  function overAt(s) { return cardAt(s, true); }
  function overFrames(s, a, b) {
    var f = alongTurn(overAt(s), a, b);
    if (a < 0.5 && b > 0.5) {
      var k = Math.round(STEPS * (0.5 - a) / (b - a));
      var again = overAt(s)(AFTER_EDGE);
      again.offset = f[k].offset;
      f.splice(k + 1, 0, again);
    }
    return f;
  }
  function groundAt(t) {
    var h = hump(t);
    var sx = 0.34 + 0.66 * Math.abs(Math.cos(Math.PI * t));
    return { opacity: (0.9 * h).toFixed(3), transform: 'translateY(' + (10 * h).toFixed(2) + 'px) scale(' + sx.toFixed(3) + ',' + (1 + 0.3 * h).toFixed(3) + ')' };
  }
  function sharpAt(t) { return { opacity: (1 - 0.7 * hump(t)).toFixed(3) }; }
  function softAt(t) {
    var h = hump(t);
    return { opacity: (1 - 0.3 * h).toFixed(3), transform: 'scale(' + (1 + 0.05 * h).toFixed(4) + ')' };
  }

  /* ---------- markup ---------- */
  function skeleton(g) {
    var p = g.p;
    var heart = P.cards && P.cards.heart ? P.cards.heart(p, 'card__wish gal__wish') : '';
    function face(front) {
      return '<div class="gal__face gal__face--' + (front ? 'front' : 'back') + '"' + (front ? '' : ' aria-hidden="true"') + '>' +
        '<span class="gal__sh gal__sh--sharp"></span><span class="gal__sh gal__sh--soft"></span>' +
        '<div class="gal__well"><img class="gal__img" alt="" decoding="async" draggable="false">' +
          (front ? '<span class="gal__lens" aria-hidden="true"><span class="gal__glass"><img alt="" decoding="async" draggable="false"></span></span>' : '') +
        '</div>' +
        (front ? '<div class="gal__strip"></div>' : '') +
        '<span class="gal__fans" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
        '</div>';
    }
    return '<ul class="gal__rail" aria-label="Pictures of ' + esc(p.name) + '"></ul>' +
      '<div class="gal__stage" tabindex="0" role="group" aria-roledescription="gallery">' +
        '<span class="gal__ground" aria-hidden="true"></span>' +
        '<div class="gal__card">' + face(true) + face(false) +
          '<span class="gal__edge gal__edge--l" aria-hidden="true"></span><span class="gal__edge gal__edge--r" aria-hidden="true"></span>' +
        '</div>' +
        '<span class="gal__glint" aria-hidden="true"><i></i></span>' +
        '<div class="gal__over">' + heart +
          '<span class="gal__hint" aria-hidden="true">' + icon('zoom-in') + 'Hover to look closer</span>' +
          '<span class="gal__dots" aria-hidden="true"></span>' +
          '<span class="gal__nav">' +
            '<button type="button" data-step="-1" aria-label="Previous picture">' + icon('left') + '</button>' +
            '<span class="gal__count" aria-hidden="true"></span>' +
            '<button type="button" data-step="1" aria-label="Next picture">' + icon('right') + '</button>' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<p class="vh" aria-live="polite" data-gal-live></p>';
  }
  function drawRail(g, rise) {
    var n = g.ims.length;
    g.rail.style.setProperty('--n', String(n));
    g.rail.innerHTML = g.ims.map(function (im, i) {
      return '<li><button class="gal__thumb" type="button" data-i="' + i + '" aria-label="Picture ' + (i + 1) + ' of ' + n + '"' +
        (i === g.index ? ' aria-current="true"' : '') + '>' +
        '<img src="' + esc(P.img(g.p, im.n, 160)) + '" srcset="' + esc(P.srcset(g.p, im.n)) + '" sizes="' + THUMB_SIZES + '" alt="" decoding="async" fetchpriority="low" draggable="false" style="object-position:' + esc(im.focal || '50% 50%') + '">' +
        '</button></li>';
    }).join('');
    g.thumbs = P.$$('.gal__thumb', g.rail);
    g.el.classList.toggle('is-single', n < 2);
    /* the new colour's prints rise into place one after another */
    if (rise && !still()) {
      g.thumbs.forEach(function (t, k) {
        t.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: k * 40, easing: EASE, fill: 'backwards' });
      });
    }
  }
  function drawStrip(g) {
    g.strip.innerHTML = g.ims.map(function (im) {
      return '<img alt="" decoding="async" draggable="false" style="object-position:' + esc(im.focal || '50% 50%') + '">';
    }).join('');
    g.stripImgs = P.$$('img', g.strip);
    g.stripColour = g.colour;
    g.strip.scrollLeft = 0;
  }
  /* each dot knows its place (--k) and the row its length (--n); gallery.css moves them by transform alone */
  function drawDots(g) {
    g.dots.style.setProperty('--n', String(g.ims.length));
    g.dots.style.setProperty('--on', String(g.index || 0));
    g.dots.innerHTML = g.ims.map(function (im, k) { return '<i style="--k:' + k + '"' + (k === g.index ? ' class="on"' : '') + '></i>'; }).join('');
    g.dotEls = P.$$('i', g.dots);
  }
  /* a strip picture gets its address only when it is about to be seen */
  function loadStrip(g, i) {
    var img = g.stripImgs[i];
    var pic = g.ims[i];
    if (!img || !pic) return img || null;
    if (img.getAttribute('src')) return img;
    var first = g.first && g.first.n === pic.n;
    if (first) img.setAttribute('fetchpriority', 'high');
    setPic(g, img, pic, pic.alt);
    if (!first) waitFor(img);
    return img;
  }

  /* ---------- the chosen picture ---------- */
  /* the counter and dots on the picture: they change with the picture, at the turn's half-way point */
  function setFace(g, i) {
    g.dots.style.setProperty('--on', String(i));
    g.dotEls.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    g.count.textContent = (i + 1) + ' / ' + g.ims.length;
  }
  /* the chosen picture: thumbnail, name and announcement at once; the counter and dots now, or when it turns in */
  function mark(g, i, say, turning) {
    var n = g.ims.length;
    g.index = i;
    g.thumbs.forEach(function (t, k) {
      if (k === i) t.setAttribute('aria-current', 'true');
      else { t.removeAttribute('aria-current'); t.classList.remove('is-ring'); }
    });
    if (!turning) setFace(g, i);
    g.stage.setAttribute('aria-label', g.p.name + ', picture ' + (i + 1) + ' of ' + n);
    if (say) g.live.textContent = 'Picture ' + (i + 1) + ' of ' + n;
    if (small()) showThumb(g, i);
    P.emit('gallery:change', { index: i, n: g.ims[i] ? g.ims[i].n : null, colour: g.colour, id: g.p.id });
  }
  /* the chosen print's ring draws in as its picture lands */
  function ringIn(g, i, delay) {
    clearTimeout(g.ringTimer);
    var t = g.thumbs[i];
    if (!t) return;
    if (!delay || still()) { t.classList.add('is-ring'); return; }
    g.ringTimer = setTimeout(function () { if (g.index === i && g.thumbs[i] === t) t.classList.add('is-ring'); }, delay);
  }
  /* phones: the tapped or swiped-to thumbnail comes fully into view inside its row (never by moving the page) */
  function showThumb(g, i) {
    var t = g.thumbs[i];
    var row = g.rail;
    if (!t || row.scrollWidth <= row.clientWidth + 1) return;
    var r = row.getBoundingClientRect();
    var b = t.getBoundingClientRect();
    var room = 12;
    var d = 0;
    if (b.left < r.left + room) d = b.left - r.left - room;
    else if (b.right > r.right - room) d = b.right - r.right + room;
    if (!d) return;
    if (row.scrollTo) row.scrollTo({ left: row.scrollLeft + d, behavior: still() ? 'auto' : 'smooth' });
    else row.scrollLeft += d;
  }

  function go(g, i, dir, say) {
    var n = g.ims.length;
    if (!n) return;
    i = ((Math.round(i) % n) + n) % n;
    lensOff(g);
    if (g.busy) {
      g.queued = i === g.target ? null : { i: i, dir: dir || 0 };
      if (i !== g.index) mark(g, i, say, true);
      return;
    }
    if (i === g.shown) {
      if (i !== g.index) mark(g, i, say);
      ringIn(g, i, 0);
      return;
    }
    dir = dir || (i > g.shown ? 1 : -1);
    mark(g, i, say, !still());
    if (still()) show(g, i);
    else if (small()) turnStrip(g, i, dir, null);
    else turnCard(g, i, dir);
  }

  /* no turn: the picture simply changes (less motion, or a change of layout) */
  function show(g, i) {
    var pic = g.ims[i];
    if (small()) {
      loadStrip(g, i);
      g.strip.scrollLeft = i * g.strip.clientWidth;
      loadStrip(g, i + 1);
    } else {
      setPic(g, g.front, pic, pic.alt);
      waitFor(g.front);
    }
    g.shown = i;
    ringIn(g, i, 0);
    restartDrift(g);
  }

  /* fn in the first frame at which the animation has reached `at` ms (its own clock, so a late start or a pause
     never puts the change on a face that can be seen) */
  function atHalf(g, anim, at, token, fn) {
    function tick() {
      if (token !== g.token) return;
      var t = anim.currentTime;
      if ((t != null && t >= at) || anim.playState === 'finished') { fn(); return; }
      if (anim.playState === 'idle') return;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function stopAnims(g) {
    g.anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* already gone */ } });
    g.anims = [];
  }
  function stopGlint(g) {
    if (g.glintAnim) { try { g.glintAnim.cancel(); } catch (e) { /* already gone */ } }
    g.glintAnim = null;
    g.el.classList.remove('is-glint');
  }
  function glint(g, dir, delay) {
    stopGlint(g);
    var from = dir > 0 ? '390%' : '-160%';
    var to = dir > 0 ? '-160%' : '390%';
    g.el.classList.add('is-glint');
    var a = g.glintBand.animate([{ transform: 'translateX(' + from + ') skewX(-14deg)' }, { transform: 'translateX(' + to + ') skewX(-14deg)' }],
      { duration: GLINT, delay: Math.max(0, delay), easing: EASE, fill: 'backwards' });
    g.glintAnim = a;
    a.finished.then(function () { if (g.glintAnim === a) stopGlint(g); }, noop);
  }

  /* laptops: the card turns over, the new picture on its back */
  function turnCard(g, i, dir) {
    var pic = g.ims[i];
    var back = g.back;
    var token = ++g.token;
    g.busy = true;
    g.target = i;
    holdDrift(g, 'turn', true);
    back.classList.remove('is-wait');
    setPic(g, back, pic, '');
    within(decoded(back), WAIT).then(function () {
      if (token !== g.token) return;
      waitFor(back);
      playCard(g, i, dir, token);
    });
  }
  function playCard(g, i, dir, token) {
    var D = g.turn;
    var s = dir > 0 ? -1 : 1;
    var pic = g.ims[i];
    var a = [];
    g.el.classList.add('is-turning');
    a.push(g.card.animate(alongTurn(cardAt(s, false), 0, 1), { duration: D, easing: EASE_IO, fill: 'forwards' }));
    a.push(g.over.animate(overFrames(s, 0, 1), { duration: D, easing: EASE_IO }));
    a.push(g.ground.animate(alongTurn(groundAt, 0, 1), { duration: D, easing: EASE_IO }));
    g.sharp.forEach(function (el) { a.push(el.animate(alongTurn(sharpAt, 0, 1), { duration: D, easing: EASE_IO })); });
    g.soft.forEach(function (el) { a.push(el.animate(alongTurn(softAt, 0, 1), { duration: D, easing: EASE_IO })); });
    /* the gilt edge: by the clock, for about 130 ms around the half-way point */
    g.edges.forEach(function (el) {
      a.push(el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.42 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.58 }, { opacity: 0 }], { duration: D, easing: 'linear' }));
    });
    g.anims = a;
    glint(g, dir, D - GLINT_LEAD);
    /* timed from the moment the turn really starts */
    a[0].ready.then(function () { if (token === g.token) ringIn(g, i, D - RING); }, noop);
    /* at the half-way point the new face shows: the counter changes with it, and the front face, now turned
       away, takes the new picture so the card can come back flat unseen */
    atHalf(g, a[0], D / 2, token, function () {
      setFace(g, i);
      setPic(g, g.front, pic, pic.alt);
      if (ready(g.back)) g.front.classList.remove('is-wait'); else waitFor(g.front);
    });
    a[0].finished.then(function () { land(g, i, token); }, noop);
  }
  function land(g, i, token) {
    if (token !== g.token) return;
    function settle() {
      if (token !== g.token) return;
      if (!ready(g.front)) waitFor(g.front);
      stopAnims(g);
      g.el.classList.remove('is-turning');
      g.shown = i;
      restartDrift(g);
      holdDrift(g, 'turn', false);
      done(g);
    }
    if (ready(g.back)) within(decoded(g.front), 160).then(settle);
    else settle();
  }

  /* tablets and phones: the strip turns to its edge, jumps, and turns back */
  function turnStrip(g, i, dir, swap) {
    var token = ++g.token;
    g.busy = true;
    g.target = i;
    var wait = swap ? swap.ready : within(decoded(loadStrip(g, i)), WAIT);
    wait.then(function () {
      if (token !== g.token) return;
      var H = g.half;
      var s = dir > 0 ? -1 : 1;
      g.el.classList.add('is-turning');
      var one = [
        g.card.animate(alongTurn(cardAt(s, true), 0, 0.5), { duration: H, easing: HALF_IN, fill: 'forwards' }),
        g.ground.animate(alongTurn(groundAt, 0, 0.5), { duration: H, easing: HALF_IN, fill: 'forwards' }),
        g.sharp[0].animate(alongTurn(sharpAt, 0, 0.5), { duration: H, easing: HALF_IN, fill: 'forwards' }),
        g.soft[0].animate(alongTurn(softAt, 0, 0.5), { duration: H, easing: HALF_IN, fill: 'forwards' }),
        g.over.animate(overFrames(s, 0, 0.5), { duration: H, easing: HALF_IN, fill: 'forwards' })
      ];
      g.edges.forEach(function (el) {
        one.push(el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.84 }, { opacity: 1 }], { duration: H, easing: 'linear', fill: 'forwards' }));
      });
      g.anims = one;
      one[0].ready.then(function () { if (token === g.token) ringIn(g, i, 2 * H - RING); }, noop);
      one[0].finished.then(function () {
        if (token !== g.token) return;
        if (swap) swap.run();
        loadStrip(g, i);
        g.strip.scrollLeft = i * g.strip.clientWidth;
        setFace(g, i);
        var two = [
          g.card.animate(alongTurn(cardAt(s, true), AFTER_EDGE, 1), { duration: H, easing: HALF_OUT }),
          g.ground.animate(alongTurn(groundAt, 0.5, 1), { duration: H, easing: HALF_OUT }),
          g.sharp[0].animate(alongTurn(sharpAt, 0.5, 1), { duration: H, easing: HALF_OUT }),
          g.soft[0].animate(alongTurn(softAt, 0.5, 1), { duration: H, easing: HALF_OUT }),
          g.over.animate(overFrames(s, AFTER_EDGE, 1), { duration: H, easing: HALF_OUT })
        ];
        g.edges.forEach(function (el) {
          two.push(el.animate([{ opacity: 1 }, { opacity: 0, offset: 0.16 }, { opacity: 0 }], { duration: H, easing: 'linear' }));
        });
        one.forEach(function (x) { x.cancel(); });
        g.anims = two;
        glint(g, dir, H - GLINT_LEAD);
        two[0].finished.then(function () {
          if (token !== g.token) return;
          stopAnims(g);
          g.el.classList.remove('is-turning');
          g.shown = i;
          loadStrip(g, i + 1);
          done(g);
        }, noop);
      }, noop);
    });
  }

  function done(g) {
    g.busy = false;
    g.target = -1;
    if (g.queuedColour != null) {
      var c = g.queuedColour;
      g.queuedColour = null;
      g.queued = null;
      setColour(g, c);
      return;
    }
    var q = g.queued;
    g.queued = null;
    if (q && q.i !== g.shown) { go(g, q.i, q.dir, false); return; }
    setFace(g, g.shown);
    if (g.index === g.shown) ringIn(g, g.index, 0);
  }

  /* a running turn jumps to its end (a change of layout, or of the visitor's motion setting) */
  function finishNow(g) {
    if (!g.busy) return;
    g.token++;
    stopAnims(g);
    stopGlint(g);
    g.el.classList.remove('is-turning');
    g.busy = false;
    g.target = -1;
    g.queued = null;
    if (g.queuedColour != null) {
      g.colour = g.queuedColour;
      g.queuedColour = null;
      g.ims = picsOf(g.p, g.colour);
      g.index = 0;
      drawRail(g, false);
      drawDots(g);
    }
    if (g.stripColour !== g.colour) drawStrip(g);
    g.shown = -1;
    mark(g, Math.min(g.index, g.ims.length - 1), false);
    show(g, g.index);
    holdDrift(g, 'turn', false);
  }

  function setColour(g, ci) {
    if (!g.p.colours || !g.p.colours.length) return;
    ci = colourIndex(g.p, ci);
    lensOff(g);
    if (g.busy) { g.queuedColour = ci === g.colour ? null : ci; g.queued = null; return; }
    if (ci === g.colour) return;
    var dir = ci > g.colour ? 1 : -1;
    g.colour = ci;
    g.ims = picsOf(g.p, ci);
    g.index = 0;
    g.shown = -1;
    var pic = g.ims[0];
    if (still()) {
      drawRail(g, false);
      drawStrip(g);
      drawDots(g);
      mark(g, 0, false);
      show(g, 0);
    } else if (small()) {
      /* the row changes now; the strip changes while it is edge-on */
      drawRail(g, true);
      mark(g, 0, false, true);
      var pre = new Image();
      var s = source(g, pic);
      pre.sizes = s.sizes;
      pre.srcset = s.srcset;
      pre.src = s.src;
      turnStrip(g, 0, dir, { ready: within(decoded(pre), WAIT), run: function () { drawStrip(g); drawDots(g); } });
    } else {
      drawRail(g, true);
      drawStrip(g);
      drawDots(g);
      mark(g, 0, false, true);
      turnCard(g, 0, dir);
    }
    warmLater(g);
  }

  /* ---------- quiet downloads ---------- */
  function whenIdle(fn) {
    function run() {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 });
      else setTimeout(fn, 200);
    }
    if (doc.readyState === 'complete') run();
    else window.addEventListener('load', run, { once: true });
  }
  function warmLater(g) { whenIdle(function () { warm(g); }); }
  /* laptops: every picture of the chosen colour, at low priority; phones: only the next one */
  function warm(g) {
    if (!g.alive) return;
    if (small()) { loadStrip(g, g.index + 1); return; }
    g.ims.forEach(function (pic) {
      if (g.first && g.first.n === pic.n) return;
      var s = source(g, pic);
      var key = s.src + ' ' + s.sizes;
      if (g.warmed[key]) return;
      var im = new Image();
      try { im.fetchPriority = 'low'; } catch (e) { /* older browsers: normal priority */ }
      im.decoding = 'async';
      im.sizes = s.sizes;
      im.srcset = s.srcset;
      im.src = s.src;
      g.warmed[key] = im;
    });
  }

  /* ---------- the slow push-in and pan (laptops): from rest, so a landed picture never jumps ---------- */
  function startDrift(g) {
    if (g.drift || still()) return;
    g.drift = g.front.animate([{ transform: 'none' }, { transform: PUSH }],
      { duration: DRIFT, delay: 1000, iterations: Infinity, direction: 'alternate', easing: EASE_IO });
    holdDrift(g);
    budget(g);
  }
  function stopDrift(g) {
    unbudget(g);
    if (g.drift) { try { g.drift.cancel(); } catch (e) { /* already gone */ } }
    g.drift = null;
  }
  function restartDrift(g) { if (g.drift) g.drift.currentTime = 0; }
  function holdDrift(g, why, on) {
    if (why) g.hold[why] = !!on;
    if (!g.drift) return;
    var held = small();
    for (var k in g.hold) if (g.hold[k]) held = true;
    if (held && g.drift.playState !== 'paused') g.drift.pause();
    else if (!held && g.drift.playState === 'paused') g.drift.play();
  }
  /* the page's motion budget counts the drift as one of the things moving on their own */
  function budget(g) {
    if (g.unbudget || !g.drift || small()) return;
    var M = P.motion;
    if (!M || typeof M.addMover !== 'function') return;
    try {
      var off = M.addMover({
        id: 'gallery-drift',
        el: g.stage,
        rank: 'push-in',
        pause: function () { holdDrift(g, 'budget', true); },
        resume: function () { holdDrift(g, 'budget', false); }
      });
      g.unbudget = typeof off === 'function' ? off : noop;
    } catch (e) { g.unbudget = null; }
  }
  function unbudget(g) {
    if (typeof g.unbudget === 'function') { try { g.unbudget(); } catch (e) { /* already removed */ } }
    g.unbudget = null;
    g.hold.budget = false;
  }

  /* ---------- the loupe (laptops with a fine pointer) ---------- */
  function lensOff(g) {
    if (g.lensRaf) { cancelAnimationFrame(g.lensRaf); g.lensRaf = 0; }
    g.lensEv = null;
    if (!g.lensOn) return;
    g.lensOn = false;
    g.el.classList.remove('is-loupe');
  }
  function pct(v, fallback) { var x = parseFloat(v); return isFinite(x) ? x / 100 : fallback; }
  /* where the picture is drawn on screen: object-fit cover at its focal point, inside the (pushed-in) img */
  function drawn(img) {
    var r = img.getBoundingClientRect();
    var nw = img.naturalWidth;
    var nh = img.naturalHeight;
    if (!nw || !nh || !r.width || !r.height) return null;
    var s = Math.max(r.width / nw, r.height / nh);
    var w = nw * s;
    var h = nh * s;
    var pos = String(img.style.objectPosition || '50% 50%').split(/\s+/);
    var px = pct(pos[0], 0.5);
    var py = pct(pos.length > 1 ? pos[1] : pos[0], 0.5);
    return { left: r.left + (r.width - w) * px, top: r.top + (r.height - h) * py, w: w, h: h };
  }
  /* the lens shows the picture already on screen at once, then a file sharp enough for twice the size */
  function lensSource(g, d) {
    var pic = g.ims[g.shown];
    if (!pic) return;
    var url = P.img(g.p, pic.n, Math.ceil(d.w * ZOOM * (window.devicePixelRatio || 1)));
    var img = g.lensImg;
    img.style.width = (d.w * ZOOM).toFixed(1) + 'px';
    img.style.height = (d.h * ZOOM).toFixed(1) + 'px';
    if (img.getAttribute('data-src') === url) return;
    img.setAttribute('data-src', url);
    img.src = g.front.currentSrc || g.front.src;
    var big = new Image();
    big.decoding = 'async';
    big.onload = function () { if (img.getAttribute('data-src') === url) img.src = url; };
    big.src = url;
  }
  function lensMove(g, ev) {
    var t = ev.t;
    var over = !g.busy && !small() && fineMq.matches && t && g.well.contains(t) && ready(g.front) && g.lens.offsetWidth > 0;
    if (!over) { lensOff(g); return; }
    var d = drawn(g.front);
    if (!d) { lensOff(g); return; }
    if (!g.lensOn) {
      lensSource(g, d);
      g.lensOn = true;
      g.el.classList.add('is-loupe', 'is-looked');
    }
    var wr = g.well.getBoundingClientRect();
    var D = g.lens.offsetWidth;
    var fx = (ev.x - d.left) / d.w;
    var fy = (ev.y - d.top) / d.h;
    g.lens.style.transform = 'translate3d(' + (ev.x - wr.left - D / 2).toFixed(1) + 'px,' + (ev.y - wr.top - D / 2).toFixed(1) + 'px,0)';
    g.lensImg.style.transform = 'translate3d(' + (D / 2 - fx * d.w * ZOOM).toFixed(1) + 'px,' + (D / 2 - fy * d.h * ZOOM).toFixed(1) + 'px,0)';
  }
  /* one measure per frame, whatever the pointer's rate */
  function lensQueue(g, e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    g.lensEv = { x: e.clientX, y: e.clientY, t: e.target };
    if (!g.lensRaf) g.lensRaf = requestAnimationFrame(function () { g.lensRaf = 0; if (g.lensEv) lensMove(g, g.lensEv); });
  }

  /* ---------- the visitor ---------- */
  function onClick(g, e) {
    var t = e.target && e.target.closest ? e.target.closest('.gal__thumb, [data-step]') : null;
    if (!t || !g.el.contains(t)) return;
    if (t.classList.contains('gal__thumb')) {
      go(g, parseInt(t.getAttribute('data-i'), 10) || 0, 0, true);
    } else {
      var st = parseInt(t.getAttribute('data-step'), 10) || 1;
      go(g, g.index + st, st, true);
    }
  }
  function onKey(g, e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var n = g.ims.length;
    var k = e.key;
    var to = null;
    var dir = 0;
    if (k === 'ArrowRight' || k === 'ArrowDown') { to = g.index + 1; dir = 1; }
    else if (k === 'ArrowLeft' || k === 'ArrowUp') { to = g.index - 1; dir = -1; }
    else if (k === 'Home') to = 0;
    else if (k === 'End') to = n - 1;
    if (to === null || n < 2) return;
    e.preventDefault();
    var onThumb = e.target && e.target.classList && e.target.classList.contains('gal__thumb');
    go(g, to, dir, true);
    if (onThumb && g.thumbs[g.index]) g.thumbs[g.index].focus({ preventScroll: true });
  }
  function onStrip(g) {
    if (g.busy || !small()) return;
    var w = g.strip.clientWidth || 1;
    var i = Math.round(g.strip.scrollLeft / w);
    if (i < 0 || i >= g.ims.length) return;
    loadStrip(g, i);
    loadStrip(g, i + 1);
    if (i !== g.index) { mark(g, i, false); g.shown = i; ringIn(g, i, 0); }
  }
  function relayout(g) {
    lensOff(g);
    finishNow(g);
    var i = g.index;
    if (small()) {
      unbudget(g);
      if (g.stripColour !== g.colour) drawStrip(g);
      loadStrip(g, i);
      g.strip.scrollLeft = i * g.strip.clientWidth;
      loadStrip(g, i + 1);
      showThumb(g, i);
    } else {
      setPic(g, g.front, g.ims[i], g.ims[i].alt);
      waitFor(g.front);
      budget(g);
      warmLater(g);
    }
    g.shown = i;
    holdDrift(g);
  }
  function onMotionSetting(g) {
    finishNow(g);
    if (still()) stopDrift(g); else startDrift(g);
  }

  function mount(el, product, opts) {
    if (!el || !product) return null;
    if (el.__gallery) el.__gallery.destroy();
    opts = opts || {};
    var g = {
      el: el,
      p: product,
      colour: colourIndex(product, opts.colour),
      index: 0,
      shown: 0,
      target: -1,
      busy: false,
      queued: null,
      queuedColour: null,
      token: 0,
      anims: [],
      hold: {},
      warmed: {},
      first: pageStage(product),
      alive: true
    };
    g.ims = picsOf(product, g.colour);
    if (!g.ims.length) return null;

    el.classList.add('gal');
    el.innerHTML = skeleton(g);
    g.rail = el.querySelector('.gal__rail');
    g.stage = el.querySelector('.gal__stage');
    g.card = el.querySelector('.gal__card');
    g.ground = el.querySelector('.gal__ground');
    g.front = el.querySelector('.gal__face--front .gal__img');
    g.back = el.querySelector('.gal__face--back .gal__img');
    g.strip = el.querySelector('.gal__strip');
    g.sharp = P.$$('.gal__sh--sharp', el);
    g.soft = P.$$('.gal__sh--soft', el);
    g.edges = P.$$('.gal__edge', el);
    g.glintBand = el.querySelector('.gal__glint i');
    g.over = el.querySelector('.gal__over');
    g.well = el.querySelector('.gal__face--front .gal__well');
    g.lens = el.querySelector('.gal__lens');
    g.lensImg = el.querySelector('.gal__glass img');
    g.count = el.querySelector('.gal__count');
    g.dots = el.querySelector('.gal__dots');
    g.live = el.querySelector('[data-gal-live]');
    g.turn = toMs(cssVar(el, '--gal-turn'), 840);
    g.half = toMs(cssVar(el, '--gal-turn-half'), 400);

    drawRail(g, false);
    drawStrip(g);
    drawDots(g);
    /* only the layout on screen asks for the first picture; the other takes it when the layout changes */
    if (small()) loadStrip(g, 0);
    else {
      if (g.first && g.first.n === g.ims[0].n) g.front.setAttribute('fetchpriority', 'high');
      setPic(g, g.front, g.ims[0], g.ims[0].alt);
    }
    mark(g, 0, false);
    ringIn(g, 0, 0);

    var on = {
      click: function (e) { onClick(g, e); },
      key: function (e) { onKey(g, e); },
      enter: function (e) { if (e.pointerType === 'mouse') holdDrift(g, 'hover', true); },
      leave: function () { holdDrift(g, 'hover', false); lensOff(g); },
      move: function (e) { lensQueue(g, e); },
      strip: function () { onStrip(g); },
      hidden: function () { holdDrift(g, 'hidden', doc.hidden); },
      layout: function () { relayout(g); },
      motion: function () { onMotionSetting(g); }
    };
    el.addEventListener('click', on.click);
    el.addEventListener('keydown', on.key);
    g.stage.addEventListener('pointerenter', on.enter);
    g.stage.addEventListener('pointerleave', on.leave);
    g.stage.addEventListener('pointermove', on.move);
    g.strip.addEventListener('scroll', on.strip, { passive: true });
    doc.addEventListener('visibilitychange', on.hidden);
    listen(smallMq, on.layout);
    listen(reduceMq, on.motion);
    if ('IntersectionObserver' in window) {
      g.io = new IntersectionObserver(function (es) { holdDrift(g, 'off', !es[es.length - 1].isIntersecting); });
      g.io.observe(g.stage);
    }
    g.hold.hidden = !!doc.hidden;
    startDrift(g);
    /* the motion budget's scripts load after this one */
    P.ready(function () { if (g.alive) budget(g); });
    warmLater(g);

    var api = {
      go: function (i) { go(g, Number(i) || 0, 0, false); },
      setColour: function (ci) { setColour(g, ci); },
      index: function () { return g.index; },
      destroy: function () {
        if (!g.alive) return;
        g.alive = false;
        lensOff(g);
        finishNow(g);
        clearTimeout(g.ringTimer);
        stopDrift(g);
        if (g.io) g.io.disconnect();
        el.removeEventListener('click', on.click);
        el.removeEventListener('keydown', on.key);
        doc.removeEventListener('visibilitychange', on.hidden);
        unlisten(smallMq, on.layout);
        unlisten(reduceMq, on.motion);
        if (el.__gallery === api) el.__gallery = null;
      }
    };
    el.__gallery = api;
    return api;
  }

  P.gallery = { mount: mount };
})();
