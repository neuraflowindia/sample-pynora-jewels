/* The header's glide, and the rows that settle into the panels and drawers.
   - When the header folds into its paper bar (header:change), her logo, the icons and the collections glide from
     where they stood in "the house" to their places in the bar, while the bar itself comes down from above
     (420 ms, the same easing, so the two movements add up to one glide). At the very top the bar unfolds and
     they glide back. Positions are kept relative to the bar, measured while each state is showing.
   - Drawers, the phone menu and search (overlay:open): their first six rows rise into place one after another,
     unveiled from the top down; search's results do the same when they first appear after a pause in typing.
   - A line removed from the bag or the wishlist: the lines below glide up into its place instead of jumping.
   With less motion nothing here runs (the header and drawers change at once). */
(function () {
  'use strict';

  var P = window.Pynora;
  var doc = document;
  var html = doc.documentElement;
  if (!P || !html.classList.contains('motion') || P.reduced()) return;

  var EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  var FOLD = 420;
  function anim(el, frames, opts) {
    if (!el || typeof el.animate !== 'function') return null;
    try { return el.animate(frames, opts); } catch (e) { return null; }
  }

  /* ---------- The header's fold and unfold ---------- */
  function header(hdr) {
    var bar = P.$('.hdr__bar', hdr);
    if (!bar) return;
    /* the parts that travel: [shown in the house, shown in the bar] */
    var parts = [
      ['.hdr__top .hdr__logo img', '.hdr__logo--bar img', '.hdr__top .hdr__logo img'],
      ['.hdr__top .hdr__tools', '.hdr__tools--bar', '.hdr__top .hdr__tools'],
      ['.hdr__top .hdr__start', null, '.hdr__top .hdr__start'],
      ['.hdr__nav', '.hdr__nav', null]
    ];
    var house = {}, shop = {};
    var running = [];

    function shown(el) { return el && el.getClientRects().length > 0; }
    function box(el) {
      var b = bar.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
    }
    /* on laptops the house and the bar use different elements (twins); below 1,080 px the same row stays */
    function pick(i, scrolled) {
      var el = null;
      if (!scrolled) el = P.$(parts[i][0], hdr);
      else {
        el = parts[i][1] ? P.$(parts[i][1], hdr) : null;
        if (!shown(el)) el = parts[i][2] ? P.$(parts[i][2], hdr) : null;
      }
      return shown(el) ? el : null;
    }
    function measure(scrolled) {
      var into = scrolled ? shop : house;
      for (var i = 0; i < parts.length; i++) {
        var el = pick(i, scrolled);
        into[i] = el ? box(el) : null;
      }
    }
    function stop() {
      running.forEach(function (a) { try { a.cancel(); } catch (e) { /* gone */ } });
      running = [];
    }

    function glide(scrolled) {
      stop();
      var from = scrolled ? house : shop;
      measure(scrolled);
      var to = scrolled ? shop : house;
      /* folding, the bar arrives from one bar-height above: each part starts that much lower inside it */
      var lift = scrolled && hdr.classList.contains('is-arriving') ? bar.offsetHeight : 0;
      for (var i = 0; i < parts.length; i++) {
        var a = from[i], b = to[i];
        var el = pick(i, scrolled);
        if (!a || !b || !el) continue;
        var dx = (a.x + a.w / 2) - (b.x + b.w / 2);
        var dy = (a.y + a.h / 2) - (b.y + b.h / 2) + lift;
        var s = b.h > 0 && i === 0 ? a.h / b.h : 1;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(s - 1) < 0.005) continue;
        var an = anim(el, [
          { translate: dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px', scale: s.toFixed(4) },
          { translate: '0px 0px', scale: '1' }
        ], { duration: FOLD, easing: EASE });
        if (an) running.push(an);
      }
    }

    var lastScrolled = hdr.classList.contains('is-scrolled');
    measure(lastScrolled);
    P.on('header:change', function (d) {
      var scrolled = !!(d && d.scrolled);
      var real = scrolled ? hdr.classList.contains('is-arriving') : true;   /* the first state on load is not a change */
      if (real && scrolled !== lastScrolled) glide(scrolled);
      else { stop(); measure(scrolled); }
      lastScrolled = scrolled;
    });
    var remeasure = function () { if (!running.length) measure(hdr.classList.contains('is-scrolled')); };
    window.addEventListener('resize', remeasure);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(remeasure);
    window.addEventListener('load', remeasure);
  }

  /* ---------- Rows settling into panels and drawers ---------- */
  var ROWS = {
    menu: { sel: '.menu__rows > li', step: 35, from: 140, rise: 12 },
    bag: { sel: '.bag__lines > li', step: 30, from: 160, rise: 12 },
    wishlist: { sel: '.wish__grid > li', step: 30, from: 160, rise: 12 },
    care: { sel: '.care__panel:not([hidden]) > *', step: 30, from: 160, rise: 12 },
    search: { sel: '[data-search-results] > li', step: 25, from: 160, rise: 8 }
  };
  function settle(items, cfg) {
    items.slice(0, 6).forEach(function (el, i) {
      anim(el, [
        { transform: 'translateY(' + cfg.rise + 'px)', clipPath: 'inset(0 -30px 100% -30px)' },
        { transform: 'none', clipPath: 'inset(-30px -30px -30px -30px)' }
      ], { duration: 420, delay: cfg.from + cfg.step * i, easing: EASE, fill: 'backwards' });
    });
  }
  P.on('overlay:open', function (d) {
    if (!d || d.again) return;
    var cfg = ROWS[d.name];
    var el = cfg && P.$('[data-overlay="' + d.name + '"]');
    if (!el) return;
    settle(P.$$(cfg.sel, el), cfg);
    if (d.name === 'bag' || d.name === 'wishlist') keep(d.name);
  });

  /* search: the first results after a pause in typing */
  var res = P.$('[data-search-results]');
  if (res && window.MutationObserver) {
    var lastDraw = 0;
    new MutationObserver(function () {
      var t = Date.now();
      var fresh = t - lastDraw > 1200;
      lastDraw = t;
      if (fresh && !res.hidden) settle(P.$$(':scope > li', res), ROWS.search);
    }).observe(res, { childList: true });
  }

  /* the jewellery panel: its rows rise in (CSS); the founder's pick settles (CSS) — nothing to do here */

  /* ---------- Bag and wishlist: the lines below a removed line glide up ---------- */
  var LISTS = {
    bag: { list: '.bag__lines', item: '.bag__lines > li', key: 'data-key', ev: 'bag:change' },
    wishlist: { list: '.wish__grid', item: '.wish__grid > li', key: 'data-id', ev: 'wish:change' }
  };
  var spots = { bag: {}, wishlist: {} };
  function where(name) {
    var c = LISTS[name];
    var list = P.$(c.list);
    var out = {};
    if (!list) return out;
    /* layout positions (transforms of rows still settling in do not count) */
    P.$$(c.item).forEach(function (li) {
      out[li.getAttribute(c.key)] = { x: li.offsetLeft, y: li.offsetTop };
    });
    return out;
  }
  function keep(name) { spots[name] = where(name); }
  function open(name) {
    var o = P.$('[data-overlay="' + name + '"]');
    return !!(o && o.classList.contains('is-open'));
  }
  Object.keys(LISTS).forEach(function (name) {
    var c = LISTS[name];
    P.on(c.ev, function () {
      if (!open(name)) { spots[name] = {}; return; }
      /* the list redraws itself on the same event: measure once it has, before the next paint */
      requestAnimationFrame(function () { glideUp(name, c); });
    });
  });
  function glideUp(name, c) {
    var before = spots[name];
    var after = where(name);
    var gone = Object.keys(before).some(function (k) { return !after[k]; });
    if (gone) {
      P.$$(c.item).forEach(function (li) {
        var k = li.getAttribute(c.key), a = before[k], b = after[k];
        if (!a || !b) return;
        var dx = a.x - b.x, dy = a.y - b.y;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        anim(li, [{ translate: dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px' }, { translate: '0px 0px' }], { duration: 280, easing: EASE });
      });
    }
    spots[name] = after;
  }

  P.ready(function () {
    P.$$('[data-hdr]').forEach(header);
  });
})();
