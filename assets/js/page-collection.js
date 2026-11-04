/* The collection page (collection.html?c=<id>): everything except the shop bar, the grid and the studio note
   (collection-bar.js, collection-grid.js), drawn from the catalogue.
   - Reads window.PYNORA_PAGE (page-early.js): the collection id, whether it is known, and the portrait it has
     already asked the browser for.
   - The opening: breadcrumb, Hindi line, title, intro, the three facts (pieces · from price · rating, a link to
     the reviews), the framed portrait with its price card (bottom left or top right), or, where the piece fills
     the frame, a "Pictured: …" line under the facts; on phones a small paper plaque under the portrait.
   - Loved by our clients: the reviews of this collection's pieces (newest first, up to ten, 34 words or fewer,
     without the one the studio note quotes) and the line above them.
   - See it before you decide: the WhatsApp words of "Ask for a video call".
   - Explore the house: every collection as a round framed picture; the current one is marked "You are here".
   - The header's link to this collection is marked as the current page.
   - An unknown collection: "This collection has wandered off." in the opening, the shop bar and grid put away and
     "New in the studio" in their place; the reviews of the whole shop; no collection marked.
   - The portrait breathes slowly (a counted mover) and, with a mouse, leans towards it with its price card.
   Then html.is-filled shows the words. A classic script, loaded with defer after cards.js and reviews.js. */
(function () {
  'use strict';

  var P = window.Pynora;
  var doc = document;
  var html = doc.documentElement;
  if (!P) { html.classList.add('is-filled'); return; }

  var page = window.PYNORA_PAGE || { kind: 'collection', id: 'all', ok: false, portrait: null };
  var MAX_REVIEWS = 10, MAX_WORDS = 34;

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function icon(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function fill(name, markup) { var el = $('[data-fill="' + name + '"]'); if (el) el.innerHTML = markup; return el; }
  function words(t) { return String(t || '').trim().split(/\s+/).filter(Boolean).length; }
  function collectionUrl(id) { return P.url('collection.html?c=' + encodeURIComponent(id)); }
  function productUrl(id, hash) { return P.url('product.html?p=' + encodeURIComponent(id) + (hash || '')); }

  function crumbs(last) {
    return '<ol><li><a href="' + esc(P.url('index.html')) + '">Home</a></li><li><span aria-current="page">' + esc(last) + '</span></li></ol>';
  }
  function stars(avg) {
    var five = '';
    for (var i = 0; i < 5; i++) five += icon('star', 'i--fill');
    var w = Math.max(0, Math.min(100, avg / 5 * 100));
    return '<span class="stars rv__stars" aria-hidden="true">' + five + '<span class="stars__fill" style="width:' + w.toFixed(1) + '%">' + five + '</span></span>';
  }
  /* the review-weighted average and total of a list of pieces */
  function tally(pieces) {
    var count = 0, sum = 0;
    pieces.forEach(function (p) { var r = p.reviews || {}; count += r.count || 0; sum += (r.average || 0) * (r.count || 0); });
    return { count: count, avg: count ? sum / count : 0 };
  }

  /* ---------- The opening ---------- */
  function facts(pieces, t) {
    var from = Math.min.apply(null, pieces.map(function (p) { return Number(p.price) || Infinity; }));
    return '<li class="cop__fact">' + icon('sparkle') + '<span><b>' + pieces.length + '</b> ' + (pieces.length === 1 ? 'piece' : 'pieces') + '</span></li>' +
      '<li class="cop__fact">' + icon('banknote') + '<span>From <b>' + esc(P.inr(from)) + '</b></span></li>' +
      (t.count ? '<li class="cop__fact"><a class="cop__rate" href="#reviews">' + icon('star', 'i--fill') +
        '<span><span class="vh">Rated </span><b>' + t.avg.toFixed(1) + '</b> · ' + plural(t.count, 'review', 'reviews') + '</span></a></li>' : '');
  }

  function portraitImg(pt) {
    return '<img class="cop__img" src="' + esc(pt.src) + '" srcset="' + esc(pt.srcset) + '" sizes="' + esc(pt.sizes) + '" alt="' + esc(pt.alt) + '"' +
      ' style="--focal:' + esc(pt.focal) + ';--focal-phone:' + esc(pt.focalPhone) + '" fetchpriority="high" decoding="async">';
  }

  /* what the chip, the plaque and the "Pictured" line say about the piece in the portrait */
  function chipParts(ch) {
    var p = ch.product ? P.product(ch.product) : null;
    if (p) {
      return { href: productUrl(p.id), name: p.name, short: p.shortName || p.name, price: P.inr(p.price), line: ch.line || '', colour: ch.colour || '', text: false };
    }
    return { href: /^#/.test(ch.href || '') ? ch.href : P.url(ch.href || 'index.html'), name: ch.text || '', short: ch.short || ch.text || '', price: '', line: ch.line || '', colour: '', text: true };
  }
  function chipHTML(ch, c) {
    var line = (c.price ? '<b>' + esc(c.price) + '</b>' : '') + (c.price && c.line ? ' · ' : '') + esc(c.line);
    /* the short name first, the rest of the name after it, so a card too narrow for the whole name can drop the rest */
    var name = !c.text && c.short !== c.name && c.name.indexOf(c.short) === 0
      ? '<span class="cop__chip-short">' + esc(c.short) + '</span><span class="cop__chip-rest">' + esc(c.name.slice(c.short.length)) + '</span>'
      : esc(c.name);
    return '<a class="cop__chip ' + (ch.mode === 'top-right' ? 'is-tr' : 'is-bl') + (c.text ? ' is-text' : '') + '" href="' + esc(c.href) + '">' +
      '<span class="cop__chip-ic">' + icon(ch.icon || 'sparkle') + '</span>' +
      '<span class="cop__chip-words"><span class="cop__chip-name">' + name + '</span><span class="cop__chip-line">' + line + '</span></span>' +
      icon('arrow', 'cop__chip-go') + '</a>';
  }
  function plaqueHTML(c) {
    return '<p class="cop__plaque"><a href="' + esc(c.href) + '">' + esc(c.short) + '</a>' + (c.price ? ' · <b>' + esc(c.price) + '</b>' : '') + '</p>';
  }

  function opening(col, pieces, t) {
    var title = col.id === 'all' ? 'All pieces' : col.title;
    fill('crumbs', crumbs(title));
    var hindi = $('[data-fill="hindi"]');
    if (hindi) {
      if (col.hindi) $('.line__in', hindi).textContent = col.hindi;
      else hindi.remove();
    }
    $('[data-fill="title"]').textContent = title;
    $('[data-fill="intro"]').textContent = col.intro || '';
    fill('facts', facts(pieces, t));

    var pt = page.portrait;
    var ch = col.chip || {};
    var c = chipParts(ch);
    var pics = $('[data-fill="pics"]');
    if (pt && pics) {
      pics.innerHTML = '<div class="cop__pic"><div class="cop__frame"><div class="cop__clip">' + portraitImg(pt) + '</div></div>' +
        (ch.mode === 'pictured' ? '' : chipHTML(ch, c)) + '</div>' + plaqueHTML(c);
    }
    var pictured = $('[data-fill="pictured"]');
    if (pictured) {
      if (ch.mode === 'pictured' && pt) {
        pictured.innerHTML = '<span class="line__in">Pictured: <a href="' + esc(c.href) + '">' + esc(c.name) + '</a>' +
          (c.colour ? ' in ' + esc(c.colour) : '') + (c.price ? ' · <b>' + esc(c.price) + '</b>' : '') + icon('arrow') + '</span>';
        pictured.hidden = false;
      } else pictured.remove();
    }
  }

  /* a name too long for the card's room shows its short form (the full name is still read out) */
  function fitChip() {
    var chip = $('.cop__chip');
    if (!chip) return;
    chip.classList.remove('is-short');
    var name = $('.cop__chip-name', chip);
    if (name && name.scrollWidth > name.clientWidth + 0.5) chip.classList.add('is-short');
  }

  /* ---------- An unknown collection ---------- */
  function notFound() {
    fill('crumbs', crumbs('Collections'));
    var box = $('.cop__in');
    if (box) {
      box.classList.add('is-missing');
      $$('.cop__hs, .cop__lead, .cop__factsline, .cop__pictured, .cop__pics', box).forEach(function (el) { el.remove(); });
      box.insertAdjacentHTML('beforeend', '<div class="nf cop__nf" data-bg-words>' +
        '<div class="hs"><h1 class="t-section line" id="cop-title"><span class="line__in">This collection has wandered off.</span></h1>' +
        '<span class="orn-rule" aria-hidden="true"><span class="orn-fan"></span></span>' +
        '<p class="t-lead line"><span class="line__in">It may have moved, or the address may be incomplete. Every piece is still right here.</span></p></div>' +
        '<div class="nf__acts"><a class="btn btn--main" href="' + esc(collectionUrl('all')) + '">Shop all pieces</a>' +
        '<a class="btn btn--second" href="' + esc(P.url('index.html')) + '">Back to home</a></div>' +
        '<p class="nf__search"><a class="tlink" href="#search">' + icon('search') + 'Search the shop</a></p></div>');
    }
    /* the shop bar, grid and end line are put away; the new pieces take their place */
    var band = $('.cgr-band .wrap');
    $$('[data-collection-bar], [data-collection-grid], [data-collection-end]').forEach(function (el) { el.hidden = true; });
    if (band) {
      band.insertAdjacentHTML('beforeend', '<div class="more more--lead is-on cop-new" data-row>' +
        '<div class="hs"><h2 class="t-sub line"><span class="line__in">New in the studio</span></h2>' +
        '<span class="orn-rule" aria-hidden="true"><span class="orn-fan"></span></span></div>' +
        '<ul class="card-grid more__cards" data-cards data-collection="new" data-limit="4" data-reveal="dissolve" data-eager="0"></ul></div>');
    }
    doc.title = 'Collection not found · ' + ((P.cat && P.cat.shop && P.cat.shop.name) || 'Pynora Jewels & Decor');
  }

  /* ---------- Loved by our clients ---------- */
  function reviews(col, pieces) {
    var t = tally(pieces);
    var q = col && col.quote;
    var list = [];
    pieces.forEach(function (p) {
      ((p.reviews && p.reviews.items) || []).forEach(function (r) {
        if (q && q.product === p.id && q.name === r.name) return;        /* the note quotes it already */
        if (words(r.text) > MAX_WORDS) return;
        list.push({ p: p, r: r });
      });
    });
    list.sort(function (a, b) { return String(b.r.date).localeCompare(String(a.r.date)); });
    list = list.slice(0, MAX_REVIEWS);
    var of = col && col.reviewsOf ? ' ' + col.reviewsOf : '';
    fill('rvavg', stars(t.avg) + '<span class="vh">Rated </span><b class="rv__n">' + t.avg.toFixed(1) + '</b> from ' + plural(t.count, 'review', 'reviews') + esc(of));
    var track = $('[data-fill="rvlist"]');
    if (track) {
      track.setAttribute('data-reviews', list.map(function (x) { return x.p.id + ':' + x.r.name; }).join(','));
      track.setAttribute('data-n', String(list.length));
    }
  }

  /* ---------- See it before you decide ---------- */
  function askWords(col) {
    var a = $('.cask [data-fill="askwa"]');
    if (!a) return;
    var words = col && col.ask ? 'Hi Pynora, I’d like to see a piece from your ' + col.ask + ' on a video call.' : 'Hi Pynora, I’d like to see a piece on a video call.';
    a.href = P.waLink(words);
  }

  /* ---------- Explore the house ---------- */
  function exploreList(current) {
    var list = $('[data-fill="explore"]');
    if (!list || !P.cat) return;
    var n = 0;
    list.innerHTML = (P.cat.collections || []).map(function (c) {
      var pieces = P.collection(c.id);
      var md = c.medal || {};
      var mp = P.product(md.product) || pieces[0];
      var pic = mp ? P.pic(mp, md.n || 1) : null;
      var img = pic ? '<img src="' + esc(P.img(mp, pic.n, 320)) + '" alt="" width="120" height="120" loading="lazy" decoding="async" style="object-position:' + esc(pic.focal || '50% 50%') + '">' : '';
      /* the count line, as the menu says it ("3 pieces · made to order", "4 this season") */
      var tallyEl = $('.menu [data-tally="' + c.id + '"]');
      var fmt = (tallyEl && tallyEl.getAttribute('data-tally-fmt')) || '{pieces}';
      var long = fmt.replace('{pieces}', plural(pieces.length, 'piece', 'pieces')).replace('{n}', String(pieces.length)).replace('{from}', '');
      var here = c.id === current;
      var meta = here ? '<span class="cex__meta is-here">You are here</span>'
        : '<span class="cex__meta"><span class="cex__long">' + esc(long) + '</span><span class="cex__short">' + esc(plural(pieces.length, 'piece', 'pieces')) + '</span></span>';
      var inner = '<span class="cex__pic">' + img + '</span><span class="cex__name">' + esc(c.title) + '</span>' + meta;
      return '<li class="cex__li" style="--k:' + (n++) + '">' + (here
        ? '<span class="cex__item" aria-current="page">' + inner + '</span>'
        : '<a class="cex__item" href="' + esc(collectionUrl(c.id)) + '">' + inner + '</a>') + '</li>';
    }).join('');
  }

  /* ---------- The header's link to this collection (the Jewellery button for necklaces and earrings) ---------- */
  function markHeader(id) {
    var href = collectionUrl(id);
    $$('.hdr a[href], .menu a[href]').forEach(function (a) {
      if (a.getAttribute('href') === href) a.setAttribute('aria-current', 'page');
    });
    if (id === 'necklaces-sets' || id === 'earrings') {
      var jewellery = $('.hdr [data-jewellery] > .hdr__link');
      if (jewellery) jewellery.classList.add('is-current');
    }
  }

  /* ---------- Without the catalogue: the page keeps its own words ---------- */
  function noCatalogue() {
    var hindi = $('[data-fill="hindi"]');
    if (hindi) hindi.remove();
    $$('.cop__factsline, .cop__pictured').forEach(function (el) { el.remove(); });
    P.ready(function () {
      var grid = $('[data-collection-grid]');
      if (grid && !grid.children.length) {
        grid.innerHTML = '<p class="cop-nocat">Our pieces could not be shown just now. Please refresh the page, or ' +
          '<a class="tlink tlink--wa" href="' + esc(P.waLink('Hi Pynora, I’d like to see your pieces.')) + '" target="_blank" rel="noopener">ask us on WhatsApp</a>.</p>';
      }
    });
  }

  function draw() {
    var col = P.collectionInfo(page.id);
    var pieces = P.collection(page.id);
    var t = tally(pieces);
    opening(col, pieces, t);
    reviews(col, pieces);
    askWords(col);
    exploreList(col.id);
    markHeader(col.id);
  }

  try {
    if (!P.cat) noCatalogue();
    else if (!page.ok) {
      notFound();
      reviews(null, (P.cat.products || []).slice());
      askWords(null);
      exploreList(null);
    } else draw();
  } finally {
    html.classList.add('is-filled');
  }

  /* ---------- Motion: the portrait breathes (a counted mover) and leans towards a mouse with its chip ---------- */
  /* the card leans 1 px further than its picture, so at full lean it still keeps 20 px from the mount line */
  var LEAN_PIC = 5, LEAN_CHIP = 6, LEAN_TIME = 0.45;
  function portraitMotion() {
    var M = P.motion;
    var op = $('.cop');
    var pic = op && $('.cop__pic', op);
    if (!pic || !M || !M.on || !html.classList.contains('motion')) return;
    var frame = $('.cop__frame', pic), chip = $('.cop__chip', pic);
    if (typeof M.addMover === 'function') {
      M.addMover({
        id: 'portrait', el: pic, rank: 'push-in', need: 0.5,
        pause: function () { pic.classList.add('is-held'); },
        resume: function () { pic.classList.remove('is-held'); }
      });
    }
    /* under the pointer the picture holds still, so the visitor can look at it */
    pic.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pic.classList.add('is-looked'); });
    pic.addEventListener('pointerleave', function () { pic.classList.remove('is-looked'); });

    if (typeof M.tick !== 'function' || typeof P.fine !== 'function') return;
    var tx = 0, ty = 0, lx = 0, ly = 0, active = false, last = { f: '', c: '' };
    function put(el, key, v) { if (el && last[key] !== v) { last[key] = v; el.style.translate = v; } }
    op.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !P.fine() || !html.classList.contains('motion') || innerWidth < 1081) return;
      var r = op.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      active = true;
      M.kick();
    }, { passive: true });
    op.addEventListener('pointerleave', function () { tx = ty = 0; M.kick(); }, { passive: true });
    if (typeof P.on === 'function') P.on('motion:off', function () {
      active = false; tx = ty = lx = ly = 0; last.f = last.c = '';
      if (frame) frame.style.translate = '';
      if (chip) chip.style.translate = '';
    });
    M.tick(function (t, dt) {
      if (!active || !html.classList.contains('motion')) return false;
      var k = 1 - Math.exp(-dt / LEAN_TIME);
      lx += (tx - lx) * k; ly += (ty - ly) * k;
      var still = Math.abs(tx - lx) < 0.002 && Math.abs(ty - ly) < 0.002;
      if (still) { lx = tx; ly = ty; }
      put(frame, 'f', (lx * LEAN_PIC).toFixed(2) + 'px ' + (ly * LEAN_PIC).toFixed(2) + 'px');
      put(chip, 'c', (lx * LEAN_CHIP).toFixed(2) + 'px ' + (ly * LEAN_CHIP).toFixed(2) + 'px');
      return !still;
    });
  }

  /* measured again once the shop's fonts have arrived (they may start loading only after this script) */
  fitChip();
  if (doc.fonts) {
    if (doc.fonts.ready) doc.fonts.ready.then(fitChip);
    if (doc.fonts.addEventListener) doc.fonts.addEventListener('loadingdone', fitChip);
  }
  addEventListener('load', fitChip);
  var fitT = 0;
  addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fitChip, 120); });

  P.ready(function () {
    P.$$('main [data-cards] > li').forEach(function (li) { li.setAttribute('data-row', ''); });
    var M = P.motion;
    if (M && M.on) {
      try {
        /* the emerald card's rows, the explore circles and the lower bands' fan dividers arrive on their own cue */
        if (typeof M.addCues === 'function') M.addCues('.cask__row, .cex__li, .hs > .orn-rule');
        portraitMotion();
        M.refresh();
      } catch (e) { /* the page stays still */ }
    }
  });
})();
