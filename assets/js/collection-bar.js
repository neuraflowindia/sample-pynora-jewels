/* The Collection page's shop bar: the count, the filter chips with their panels, Sort, the filters in use, the
   floating capsule, and the "Filter & sort" panel on tablets and phones (#filters).
   - Pynora.collectionBar.mount(ctx) is called by collection-grid.js with the page's state; update(state, count)
     after every change. Choices go back through ctx.set(newState).
   - Laptops: a chip is a disclosure button (aria-expanded) for its panel, a labelled group of toggle buttons
     (aria-pressed), or a radio group for Price and Sort (role="radio", aria-checked). A choice that would show
     nothing stays reachable, greyed, with aria-disabled. Choices apply at once and the panel stays open with focus
     on the choice; ↓ ↑ move (wrapping), Home and End go to the ends, Esc closes and returns to the chip, a click
     outside or Tab away closes. Sort closes once chosen.
   - Facets show only when they split the collection; a filter that came with the address for a facet that is not
     shown keeps its removable tag.
   - The capsule: the bar sticks 10 px under the scrolled header (its height is measured, not assumed) and takes
     its paper at the very moment it sticks (a 1 px sentinel above it, watched with the bar's own sticky top;
     re-armed when the header or the window changes).
   - Tablets and phones: one "Filter & sort" button opens the drawer #filters (an overlay.js state: one history
     entry, closed with ×, Esc, the scrim, "Show N pieces" or Back). Its choices apply when it closes.
   A classic script, loaded with defer after overlay.js and collection-state.js, before collection-grid.js. */
(function () {
  'use strict';

  var P = window.Pynora;
  var doc = document;
  var html = doc.documentElement;
  if (!P || !P.collectionState) return;
  var S = P.collectionState;

  var FACETS = ['price', 'type', 'occ', 'tone'];
  var ctx = null, box = null, stick = null, bar = null, sentinel = null;
  var countEl = null, fbtn = null, activeEl = null;
  var sheet = null, sheetGo = null, sheetLive = null;
  var shows = null;                      /* which facets this collection shows */
  var rows = {};                         /* facet -> its choices (values), fixed for the page */
  var openPop = null;                    /* {kind, btn, pop} */
  var draft = null;                      /* the phone panel's choices while it is open */
  var lastCount = '';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function icon(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function shown(el) { return !!el && !!el.getClientRects().length; }
  function focus(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  function pieces(n) { return n === 1 ? ' piece' : ' pieces'; }

  function labelOf(kind, v) {
    var list = kind === 'price' ? S.BANDS : kind === 'type' ? S.TYPES : kind === 'occ' ? S.OCC : kind === 'tone' ? S.TONES : S.SORTS;
    for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i];
    return { v: v, label: v };
  }

  /* ---------- Markup ---------- */
  function optHTML(kind, o, cls) {
    var single = kind === 'price' || kind === 'sort';
    var mark = o.sw ? '<span class="cbar__sw" style="--sw:' + esc(o.sw) + '"></span>' : '<span class="cbar__box' + (single ? ' is-round' : '') + '">' + icon('check') + '</span>';
    return '<button class="' + cls + '" type="button" ' + (single ? 'role="radio" aria-checked="false"' : 'aria-pressed="false"') +
      ' data-k="' + kind + '" data-v="' + esc(o.v) + '">' + mark + '<span class="cbar__opt-l">' + esc(o.label) + '</span>' +
      (kind === 'sort' ? '' : '<small class="cbar__opt-n"></small>') + '</button>';
  }
  function chipsHTML() {
    var h = '';
    if (shows.ready) {
      h += '<button class="cbar__chip cbar__ready cbar__cue" type="button" aria-pressed="false" data-k="ready" data-v="1">' + icon('truck') +
        '<span>Ready to ship</span><small class="cbar__n"></small></button>';
    }
    FACETS.forEach(function (k) {
      if (!shows[k]) return;
      h += '<div class="cbar__f" data-facet="' + k + '">' +
        '<button class="cbar__chip cbar__cue" type="button" id="cbar-chip-' + k + '" aria-expanded="false" aria-controls="cbar-pop-' + k + '" data-pop="' + k + '">' +
        '<span>' + S.LABEL[k] + '</span><small class="cbar__n" hidden></small>' + icon('down', 'cbar__chev') + '</button>' +
        '<div class="cbar__pop" id="cbar-pop-' + k + '" role="' + (k === 'price' ? 'radiogroup' : 'group') + '" aria-label="' + S.LABEL[k] + '" hidden>' +
        rows[k].map(function (v) { return optHTML(k, labelOf(k, v), 'cbar__opt'); }).join('') + '</div></div>';
    });
    return h;
  }
  function sortHTML() {
    return '<button class="cbar__chip cbar__sortbtn cbar__cue" type="button" id="cbar-chip-sort" aria-expanded="false" aria-controls="cbar-pop-sort" data-pop="sort">' +
      icon('arrow-up-down') + '<span class="cbar__sort-k">Sort:</span> <b class="cbar__sort-v">Featured</b>' + icon('down', 'cbar__chev') + '</button>' +
      '<div class="cbar__pop cbar__pop--end" id="cbar-pop-sort" role="radiogroup" aria-label="Sort" hidden>' +
      S.SORTS.map(function (o) { return optHTML('sort', o, 'cbar__opt'); }).join('') + '</div>';
  }
  function groupHTML(kind, title, opts) {
    var single = kind === 'price' || kind === 'sort';
    return '<div class="cbar-fs" role="' + (single ? 'radiogroup' : 'group') + '" aria-labelledby="cbar-fs-' + kind + '">' +
      '<h3 class="cbar-fs__t" id="cbar-fs-' + kind + '">' + title + '</h3><div class="cbar-fs__pills">' +
      opts.map(function (o) { return optHTML(kind, o, 'cbar__pill'); }).join('') + '</div></div>';
  }
  function sheetHTML() {
    var h = groupHTML('sort', 'Sort', S.SORTS);
    if (shows.ready) h += groupHTML('ready', 'Availability', [{ v: '1', label: 'Ready to ship' }]);
    FACETS.forEach(function (k) {
      if (shows[k]) h += groupHTML(k, S.LABEL[k], rows[k].map(function (v) { return labelOf(k, v); }));
    });
    return h;
  }

  /* ---------- Showing a state ---------- */
  /* one choice (a panel option, a sheet pill or the ready chip) for state s */
  function paintOpt(btn, s) {
    var k = btn.getAttribute('data-k'), v = btn.getAttribute('data-v');
    var on = S.isOn(s, k, v);
    btn.setAttribute(btn.getAttribute('role') === 'radio' ? 'aria-checked' : 'aria-pressed', String(on));
    if (k === 'sort') return;
    var n = S.count(ctx.pieces, s, k, v);
    var small = btn.querySelector('.cbar__opt-n, .cbar__n');
    if (small) small.innerHTML = n + '<span class="vh">' + pieces(n) + '</span>';
    if (n === 0 && !on) btn.setAttribute('aria-disabled', 'true');
    else btn.removeAttribute('aria-disabled');
    btn.classList.toggle('is-on', on);
  }

  function rollCount(markup, animate) {
    var clip = countEl;
    var old = clip.querySelector('.cbar__count-in:not(.is-out)');
    var nu = doc.createElement('span');
    nu.className = 'cbar__count-in';
    nu.innerHTML = markup;
    if (!old || !animate || P.reduced() || typeof nu.animate !== 'function') {
      clip.textContent = '';
      clip.appendChild(nu);
      return;
    }
    old.classList.add('is-out');
    old.setAttribute('aria-hidden', 'true');
    clip.appendChild(nu);
    var opts = { duration: 320, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' };
    try {
      old.animate([{ transform: 'none' }, { transform: 'translateY(-100%)' }], opts).onfinish = function () { old.remove(); };
      nu.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], opts);
    } catch (e) { old.remove(); }
    setTimeout(function () { if (old.isConnected) old.remove(); }, 700);
  }

  function update(s, n, animate) {
    if (!bar) return;
    var total = ctx.total;
    var words = S.countWords(n, total);
    var markup = '<b>' + n + '</b>' + words.slice(String(n).length);
    if (markup !== lastCount) { rollCount(markup, animate && lastCount !== ''); lastCount = markup; }

    $$('.cbar__ready, .cbar__opt', bar).forEach(function (b) { paintOpt(b, s); });
    FACETS.forEach(function (k) {
      var chip = bar.querySelector('#cbar-chip-' + k);
      if (!chip) return;
      var on = k === 'price' ? (s.price ? 1 : 0) : s[k].length;
      chip.classList.toggle('is-on', !!on);
      var small = chip.querySelector('.cbar__n');
      small.hidden = !on;
      small.innerHTML = on ? on + '<span class="vh"> chosen</span>' : '';
    });
    var sv = bar.querySelector('.cbar__sort-v');
    if (sv) sv.textContent = S.sortLabel(s.sort);
    var sortChip = bar.querySelector('#cbar-chip-sort');
    if (sortChip) sortChip.classList.toggle('is-on', s.sort !== 'featured');

    var a = S.activeCount(s);
    var badge = fbtn.querySelector('.cbar__fbtn-n');
    badge.hidden = !a;
    badge.innerHTML = a ? a + '<span class="vh"> in use</span>' : '';

    /* the filters in use, under the bar (also those for a facet that is not shown) */
    var tags = S.active(s);
    activeEl.hidden = !tags.length;
    activeEl.innerHTML = tags.length ? tags.map(function (t) {
      return '<button class="cbar__tag" type="button" data-unset="' + t.kind + '" data-v="' + esc(t.v) + '" aria-label="Remove ' + esc(t.label) + '">' +
        '<span>' + esc(t.label) + '</span>' + icon('x') + '</button>';
    }).join('') + '<button class="tlink cbar__clear" type="button" data-clear>Clear all</button>' : '';

    if (draft) paintSheet(false);
  }

  /* ---------- Panels (laptops) ---------- */
  function closePop(back) {
    if (!openPop) return;
    var o = openPop;
    openPop = null;
    o.pop.hidden = true;
    o.pop.classList.remove('is-end');
    o.btn.setAttribute('aria-expanded', 'false');
    if (back) focus(o.btn);
  }
  function openPanel(kind, btn) {
    closePop(false);
    var pop = bar.querySelector('#cbar-pop-' + kind);
    if (!pop) return;
    pop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    openPop = { kind: kind, btn: btn, pop: pop };
    /* a panel that would leave the bar's right edge opens to the left of its chip */
    var r = pop.getBoundingClientRect(), edge = bar.getBoundingClientRect().right;
    if (kind !== 'sort' && r.right > Math.min(edge + 24, doc.documentElement.clientWidth - 12)) pop.classList.add('is-end');
    if (!P.reduced() && typeof pop.animate === 'function') {
      try {
        pop.animate([{ transform: 'translateY(-8px)', clipPath: 'inset(-20px -40px calc(100% + 20px) -40px round 16px)' },
          { transform: 'none', clipPath: 'inset(-20px -40px -72px -40px round 16px)' }], { duration: 300, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' });
      } catch (e) { /* it simply shows */ }
    }
    var opts = $$('.cbar__opt', pop);
    var first = opts.filter(function (b) { return b.getAttribute('aria-checked') === 'true' || b.getAttribute('aria-pressed') === 'true'; })[0] ||
      opts.filter(function (b) { return b.getAttribute('aria-disabled') !== 'true'; })[0] || opts[0];
    focus(first);
  }

  function choose(btn) {
    if (btn.getAttribute('aria-disabled') === 'true') return;   /* greyed: announced, never applied */
    var k = btn.getAttribute('data-k'), v = btn.getAttribute('data-v');
    ctx.set(S.toggle(ctx.state(), k, v), { animate: true });
    if (k === 'sort') closePop(true);
  }

  /* after a tag is removed: the next tag, else Clear all's place, else the chips */
  function focusAfterTag(i, kind) {
    var tags = $$('.cbar__tag', activeEl);
    if (tags.length) { focus(tags[Math.min(i, tags.length - 1)]); return; }
    focusStart(kind);
  }
  function focusStart(kind) {
    var c = [kind && bar.querySelector('#cbar-chip-' + kind), bar.querySelector('.cbar__chip'), fbtn].filter(shown)[0];
    focus(c);
  }

  /* ---------- The phone and tablet panel (#filters) ---------- */
  function paintSheet(announce) {
    if (!sheet || !draft) return;
    $$('.cbar__pill', sheet).forEach(function (b) { paintOpt(b, draft); });
    var n = S.filter(ctx.pieces, draft).length;
    var words = 'Show ' + n + pieces(n);
    sheetGo.textContent = words;
    if (announce) sheetLive.textContent = words;
  }
  function openSheet() {
    closePop(false);
    draft = ctx.state();
    sheetLive.textContent = '';
    paintSheet(false);
  }
  /* the choices apply once the panel's own history step has landed and #filters has left the address (the
     browser may put the scroll position back as it lands), so the grid re-forms once, from where it is seen */
  function closeSheet() {
    var next = draft;
    draft = null;
    if (!next || S.same(next, ctx.state())) return;
    var tries = 0;
    (function go() {
      if (location.hash === '#filters' && ++tries < 40) { setTimeout(go, 50); return; }
      requestAnimationFrame(function () { ctx.set(next, { animate: true }); });
    })();
  }

  function buildSheet() {
    sheet = doc.createElement('aside');
    sheet.className = 'drawer cbar-sheet';
    sheet.id = 'cbar-filters';
    sheet.setAttribute('data-overlay', 'filters');
    sheet.setAttribute('aria-labelledby', 'cbar-sheet-title');
    sheet.hidden = true;
    sheet.innerHTML = '<header class="drawer__head"><h2 class="drawer__title" id="cbar-sheet-title">Filter &amp; sort</h2>' +
      '<button class="drawer__close" type="button" data-close aria-label="Close filter and sort">' + icon('x') + '</button></header>' +
      '<div class="drawer__body cbar-sheet__body">' + sheetHTML() + '</div>' +
      '<footer class="drawer__foot cbar-sheet__foot"><button class="tlink cbar-sheet__clear" type="button" data-sheet-clear>Clear all</button>' +
      '<button class="btn btn--main cbar-sheet__go" type="button" data-close data-sheet-go>Show pieces</button>' +
      '<span class="vh" aria-live="polite" data-sheet-live></span></footer>';
    doc.body.appendChild(sheet);
    sheetGo = sheet.querySelector('[data-sheet-go]');
    sheetLive = sheet.querySelector('[data-sheet-live]');

    sheet.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !draft) return;
      if (t.hasAttribute('data-sheet-clear')) { draft = S.cleared(draft); paintSheet(true); return; }
      if (!t.classList.contains('cbar__pill') || t.getAttribute('aria-disabled') === 'true') return;
      draft = S.toggle(draft, t.getAttribute('data-k'), t.getAttribute('data-v'));
      paintSheet(true);
    });
    /* the radio groups (Sort, Price): arrow keys move between their choices */
    sheet.addEventListener('keydown', function (e) {
      if (!/^(ArrowDown|ArrowUp|ArrowLeft|ArrowRight)$/.test(e.key)) return;
      var group = e.target.closest && e.target.closest('[role="radiogroup"]');
      if (!group) return;
      var opts = $$('.cbar__pill', group), i = opts.indexOf(e.target);
      if (i < 0) return;
      var step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      focus(opts[(i + step + opts.length) % opts.length]);
      e.preventDefault();
    });
    /* the panel belongs to tablets and phones: a #filters address opened on a laptop shows the page as it is */
    if (location.hash === '#filters' && window.matchMedia && window.matchMedia('(min-width: 1081px)').matches) {
      try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* keeps the hash */ }
    }
    if (P.overlay && P.overlay.register) P.overlay.register('filters', { el: sheet, onOpen: openSheet, onClose: closeSheet });
  }

  /* ---------- The capsule ---------- */
  var io = null, hdrH = 0, topNow = 0;
  function headerHeight() {
    var hdr = doc.querySelector('[data-hdr]');
    var hb = hdr && hdr.querySelector('.hdr__bar');
    if (hb && hdr.classList.contains('is-scrolled')) {
      var h = Math.round(hb.getBoundingClientRect().height);
      if (h > 20) hdrH = h;
    }
    return hdrH || (window.innerWidth >= 1920 ? 68 : window.innerWidth >= 1080 ? 64 : 56);   /* until it is first measured */
  }
  function arm() {
    var top = headerHeight() + 10;
    if (top === topNow && io) return;
    topNow = top;
    stick.style.setProperty('--cbar-top', top + 'px');
    if (!('IntersectionObserver' in window)) return;
    if (io) io.disconnect();
    io = new IntersectionObserver(function (en) {
      var e = en[en.length - 1];
      stick.classList.toggle('is-stuck', !e.isIntersecting && e.boundingClientRect.top < top + 1);
    }, { rootMargin: '-' + (top + 1) + 'px 0px 0px 0px' });
    io.observe(sentinel);
  }

  /* ---------- The chips arrive (with the page's motion only) ---------- */
  function arrival() {
    if (!html.classList.contains('motion') || P.reduced() || !('IntersectionObserver' in window)) { bar.classList.add('is-in'); return; }
    $$('.cbar__cue', bar).forEach(function (c, i) { c.style.setProperty('--ci', i); });
    var seen = new IntersectionObserver(function (en) {
      if (!en[en.length - 1].isIntersecting) return;
      seen.disconnect();
      var tries = 0;
      (function go() {
        if (html.classList.contains('motion-go') || !html.classList.contains('motion') || ++tries > 30) {
          /* in the first screen: after the opening's lines have begun to rise */
          if (window.performance && performance.now() < 3000) bar.classList.add('is-load');
          bar.classList.add('is-in');
        } else setTimeout(go, 60);
      })();
    });
    seen.observe(bar);
  }

  /* ---------- Mount ---------- */
  function mount(c) {
    ctx = c;
    box = doc.querySelector('[data-collection-bar]');
    if (!box || bar) return;
    var s = ctx.state();
    shows = S.facets(ctx.pieces);
    FACETS.forEach(function (k) { if (shows[k]) rows[k] = S.options(ctx.pieces, s, k).map(function (o) { return o.v; }); });

    box.innerHTML = '<div class="cbar-sentinel" aria-hidden="true"></div>' +
      '<div class="cbar-stick"><div class="cbar" role="region" aria-label="Filter and sort the pieces">' +
      '<p class="cbar__count" aria-live="polite"></p>' +
      '<div class="cbar__chips">' + chipsHTML() + '</div>' +
      '<div class="cbar__f cbar__sort">' + sortHTML() + '</div>' +
      '<button class="cbar__fbtn cbar__cue" type="button" data-open="filters" aria-haspopup="dialog" aria-controls="cbar-filters">' + icon('sliders') +
      '<span>Filter &amp; sort</span><b class="cbar__fbtn-n" hidden></b></button>' +
      '</div></div>' +
      '<div class="cbar-active" hidden></div>';
    sentinel = box.querySelector('.cbar-sentinel');
    stick = box.querySelector('.cbar-stick');
    bar = box.querySelector('.cbar');
    countEl = box.querySelector('.cbar__count');
    fbtn = box.querySelector('.cbar__fbtn');
    activeEl = box.querySelector('.cbar-active');
    if (!bar.querySelector('.cbar__chips > *')) bar.classList.add('is-bare');
    buildSheet();
    update(s, ctx.count(), false);

    bar.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !bar.contains(t)) return;
      if (t.hasAttribute('data-pop')) {
        var k = t.getAttribute('data-pop');
        if (openPop && openPop.btn === t) closePop(false);
        else openPanel(k, t);
        return;
      }
      if (t.classList.contains('cbar__opt') || t.classList.contains('cbar__ready')) choose(t);
    });
    activeEl.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t) return;
      if (t.hasAttribute('data-clear')) {
        ctx.set(S.cleared(ctx.state()), { animate: true });
        focusStart();
        return;
      }
      if (!t.hasAttribute('data-unset')) return;
      var i = $$('.cbar__tag', activeEl).indexOf(t), kind = t.getAttribute('data-unset');
      ctx.set(S.unset(ctx.state(), kind, t.getAttribute('data-v')), { animate: true });
      focusAfterTag(i, kind);
    });

    /* a click elsewhere closes the open panel */
    doc.addEventListener('click', function (e) {
      if (openPop && !openPop.btn.parentElement.contains(e.target)) closePop(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (!openPop) return;
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); closePop(true); return; }
      if (!openPop.pop.contains(doc.activeElement) || !/^(ArrowDown|ArrowUp|Home|End)$/.test(e.key)) return;
      var opts = $$('.cbar__opt', openPop.pop), i = opts.indexOf(doc.activeElement);
      var j = e.key === 'Home' ? 0 : e.key === 'End' ? opts.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
      focus(opts[j]);
      e.preventDefault();
    });
    /* Tab away from a chip and its panel closes the panel */
    bar.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!openPop) return;
        var a = doc.activeElement;
        if (a && a !== doc.body && !openPop.btn.parentElement.contains(a)) closePop(false);
      }, 0);
    });

    arm();
    arrival();
    if (P.on) P.on('header:change', function () { arm(); });
    var rt = 0;
    addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { hdrH = 0; arm(); if (openPop && !shown(openPop.btn)) closePop(false); }, 150);
    });
  }

  /* anchor(): while the bar is held as the capsule, the scroll position at which it has just stuck (the start of
     the pieces), so a new result can be shown from its start; null when the visitor is above that */
  function anchor() {
    if (!stick || !stick.classList.contains('is-stuck')) return null;
    var y = Math.round(sentinel.getBoundingClientRect().top + pageYOffset - (topNow - 1));
    return pageYOffset > y + 1 ? y : null;
  }

  P.collectionBar = { mount: mount, update: update, anchor: anchor, focusStart: function () { if (bar) focusStart(); } };
})();
