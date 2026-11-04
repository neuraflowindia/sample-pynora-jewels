/* The product page (product.html?p=<id>[#reviews]).
   page-early.js has already read the address, set the title and <html data-view="ok | missing | nocat">, and kept the
   first gallery picture on window.PYNORA_PAGE.stage. This script draws the rest, in the order a jeweller would say it:
   - the breadcrumb (Home / the piece's collection / the piece);
   - the gallery, through Pynora.gallery.mount(el, piece, {colour}) (a single picture if the gallery is unavailable);
   - the panel: tag, name, hook, stars with the reviews link, price, colours, the status and stock note, the quantity
     and "Add to bag" (into the real bag, then the bag opens), "Ask on WhatsApp", the four promises, the
     specifications sheet, the pincode check and the four folds;
   - the reviews (Pynora.pdpReviews) and "You may also like" (Pynora.related, filled by cards.js when ready);
   - an unknown or missing piece: the "wandered off" message and the new pieces; no catalogue: the page's own words.
   The WhatsApp message always carries the shop's own address for the piece, read from the og:image address that
   the page carries, never from the browser's address. The buy buttons carry data-waf-hide, so the floating
   WhatsApp button can step aside while they are on screen. A classic script, loaded with defer. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var doc = document;
  var html = doc.documentElement;
  var C = P.cat;
  var PAGE = window.PYNORA_PAGE || null;
  var SHOP = 'Pynora Jewels & Decor';
  var NB = ' ';
  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var FULL_MESSAGE = 'Your bag already holds the most we can send of this piece.';

  /* ---------- small helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function icon(name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  }
  function $(sel, scope) { return (scope || doc).querySelector(sel); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function stars(value) {
    var five = '';
    for (var i = 0; i < 5; i++) five += icon('star', 'i--fill');
    var pct = Math.max(0, Math.min(100, value / 5 * 100));
    return '<span class="stars" aria-hidden="true">' + five + '<span class="stars__fill" style="width:' + pct.toFixed(1) + '%">' + five + '</span></span>';
  }
  function setWords(title, description) {
    doc.title = title + ' · ' + SHOP;
    var d = $('meta[name="description"]');
    if (d && description) d.setAttribute('content', description);
  }
  function filled() { html.classList.add('is-filled'); }

  /* ---------- which piece ---------- */
  var id = PAGE && typeof PAGE.id === 'string' ? PAGE.id : (function () {
    try { return new URLSearchParams(location.search).get('p') || ''; } catch (e) { return ''; }
  })();
  var p = C ? P.product(id) : null;
  var view = !C ? 'nocat' : p ? 'ok' : 'missing';
  html.setAttribute('data-view', view);

  var inner = $('.pdp__in');
  var galEl = $('[data-gal]');
  var panel = $('[data-fill="panel"]');
  var rvEl = $('[data-fill="reviews"]');
  var moreList = $('.pdp-more [data-cards]');

  if (view === 'nocat' || !inner) { filled(); return; }
  if (view === 'missing') { missing(); filled(); afterCards(); return; }

  /* ===================================================================== an unknown or missing piece */
  function missing() {
    setWords('Piece not found', '');
    inner.innerHTML = '<div class="nf" data-bg-words>' +
        '<div class="hs"><h1 class="t-section line" id="pdp-name"><span class="line__in">This piece has wandered off.</span></h1>' +
        '<span class="orn-rule" aria-hidden="true"><span class="orn-fan"></span></span>' +
        '<p class="t-lead line"><span class="line__in">It may have found a home already, or the link may be incomplete. Everything else is right here.</span></p></div>' +
        '<div class="nf__acts"><a class="btn btn--main" href="' + esc(P.url('collection.html?c=all')) + '">Shop all pieces</a>' +
        '<a class="btn btn--second" href="' + esc(P.url('index.html')) + '">Back to home</a></div>' +
        '<p class="nf__search"><a class="tlink" href="#search">' + icon('search') + 'Search the shop</a></p>' +
      '</div>' +
      '<div class="more pdp__new">' +
        '<div class="hs"><h2 class="t-sub line"><span class="line__in">New in the studio</span></h2><span class="orn-rule" aria-hidden="true"><span class="orn-fan"></span></span></div>' +
        '<ul class="card-grid" data-cards data-collection="new" data-limit="4" data-reveal="dissolve" data-heading="h3"></ul>' +
      '</div>';
    if (moreList) moreList.removeAttribute('data-cards');
  }

  /* ===================================================================== the piece */
  var ready = p.availability && p.availability.type === 'ready';
  var pv = { colour: 0, qty: 1, g: null };

  function colourObj() { return p.colours && p.colours.length ? p.colours[pv.colour] || p.colours[0] : null; }
  function colourId() { var c = colourObj(); return c ? c.id : null; }

  /* what the bag can still take for this piece in this colour (5, or the stock limit, less what it holds) */
  function room() {
    var bag = P.state && P.state.bag;
    if (!bag) return 0;
    return Math.max(0, bag.limit(p.id, colourId()) - bag.qty(p.id, colourId()));
  }

  /* the shop's own address, from the og:image address stamped in the page */
  function shopOrigin() {
    var m = $('meta[property="og:image"]');
    var content = m && m.getAttribute('content');
    if (!content) return '';
    try { return new URL(content).origin; } catch (e) { return ''; }
  }
  function waHref() {
    var c = colourObj();
    var origin = shopOrigin();
    var text = (C.blocks.whatsappMessage || 'Hi Pynora, I’d like to know more about the {name}{colour} – {link}')
      .replace('{name}', p.name)
      .replace('{colour}', c ? ' (' + c.name + ')' : '');
    text = origin
      ? text.replace('{link}', origin + '/product.html?p=' + encodeURIComponent(p.id))
      : text.replace(/\s*–\s*\{link\}\s*$/, '').replace('{link}', '');
    return P.waLink(text);
  }

  function statusText() {
    var st = C.blocks.status;
    return ready ? st.ready.long : st.mto.long.replace('{time}', p.availability.time);
  }
  function setList() { return (p.inTheSet || []).join(' · '); }

  /* ---------- the panel ---------- */
  function headHTML() {
    var tag = p.tag ? '<p class="pdp__tag"><span class="tag tag--' + esc(p.tag) + '">' + icon(p.tag === 'new' ? 'sparkle' : 'crown') +
      '<span>' + (p.tag === 'new' ? 'New' : 'Founder’s pick') + '</span></span></p>' : '';
    var R = p.reviews || { average: 0, count: 0 };
    return '<div class="pdp__head">' + tag +
      '<h1 class="pdp__name line" id="pdp-name"><span class="line__in">' + esc(p.name) + '</span></h1>' +
      '<p class="pdp__hook">' + esc(p.hook) + '</p>' +
      (R.count ? '<p class="pdp__rate">' + stars(R.average) + '<span class="vh">Rated </span><b>' + Number(R.average).toFixed(1) + '</b>' +
        '<span class="vh"> out of 5.</span><a href="#reviews">' + plural(R.count, 'review', 'reviews') + '</a></p>' : '') +
      '</div>';
  }
  function coloursHTML() {
    if (!p.colours || !p.colours.length) return '';
    return '<div class="cl" role="group" aria-labelledby="cl-label">' +
      '<p class="cl__label" id="cl-label">Colour: <b data-cl-name>' + esc(colourObj().name) + '</b></p>' +
      '<div class="cl__opts">' + p.colours.map(function (c, i) {
        return '<button class="cl__opt" type="button" data-cl="' + i + '" aria-pressed="' + (i === pv.colour) + '" style="--sw:' + esc(c.swatch) + '">' +
          '<i aria-hidden="true"></i>' + esc(c.name) + '</button>';
      }).join('') + '</div></div>';
  }
  function offerHTML() {
    return '<div class="pdp__offer">' +
      '<p class="pdp__price"><b>' + esc(P.inr(p.price)) + '</b><span>Inclusive of all taxes</span></p>' +
      coloursHTML() +
      '<div class="pdp__status"><span class="pill pill--' + (ready ? 'ready' : 'mto') + '">' + icon(ready ? 'truck' : 'spool') + '<span>' + esc(statusText()) + '</span></span>' +
        (p.stockLimit ? '<span class="pdp__stock">' + esc(C.blocks.stockNote.replace('{n}', p.stockLimit)) + '</span>' : '') + '</div>' +
      '<div class="buy" data-waf-hide>' +
        '<div class="qty" role="group" aria-label="Quantity">' +
          '<button class="qty__b" type="button" data-q="-1" aria-label="One fewer" aria-disabled="true">' + icon('minus') + '</button>' +
          '<output class="qty__n" aria-live="polite" aria-atomic="true">1</output>' +
          '<button class="qty__b" type="button" data-q="1" aria-label="One more" aria-disabled="false">' + icon('plus') + '</button>' +
        '</div>' +
        '<button class="btn btn--main pdp__add" type="button">' + icon('bag') + 'Add to bag</button>' +
        '<a class="btn btn--wa btn--full pdp__wa" href="' + esc(waHref()) + '" target="_blank" rel="noopener"><span class="btn__dot">' + icon('wa') + '</span>Ask on WhatsApp</a>' +
      '</div>' +
      '</div>';
  }
  function promisesHTML() {
    var list = C.blocks.promises[ready ? 'ready' : 'mto'] || [];
    return '<ul class="promise" aria-label="Our promises">' + list.map(function (x) {
      return '<li><span class="promise__ic">' + icon(x[0]) + '</span><span class="promise__t">' + esc(x[1]) + '</span></li>';
    }).join('') + '</ul>';
  }
  /* a range with its unit ("125–132 g") stays on one line */
  function keepRanges(text) { return text.replace(/(\d+(?:\.\d+)?–\d+(?:\.\d+)?\u00a0(?:g|cm|in)\b)/g, '<span class="spec__nw">$1</span>'); }
  function specHTML() {
    if (!Array.isArray(p.specs) || !p.specs.length) return '';
    return '<section class="spec" aria-labelledby="spec-title">' +
      '<div class="spec__head"><h2 class="spec__title" id="spec-title">Specifications</h2>' +
        '<span class="orn-rule spec__rule" aria-hidden="true"><span class="orn-fan"></span></span></div>' +
      '<dl class="spec__list">' + p.specs.map(function (r) {
        return '<div class="spec__row"><dt>' + esc(r[0]) + '</dt><dd>' + keepRanges(esc(r[1])) + '</dd></div>';
      }).join('') + '</dl>' +
      (p.code ? '<p class="spec__foot"><span>Piece no. <b>' + esc(p.code) + '</b></span> <span class="spec__dot" aria-hidden="true"></span> <span>Handcrafted in Karnal</span></p>' : '') +
      '</section>';
  }
  function pinHTML() {
    return '<form class="pin" novalidate>' +
      '<label class="vh" for="pin-in">Pincode</label>' +
      '<div class="pin__row">' + icon('pin') +
        '<input id="pin-in" name="pincode" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="6" placeholder="Check delivery to your pincode" aria-describedby="pin-ok">' +
        '<button type="submit">Check</button></div>' +
      '<p class="pin__ok" id="pin-ok" aria-live="polite"></p>' +
      '</form>';
  }
  function fold(title, body, open) {
    return '<details' + (open ? ' open' : '') + '><summary><span>' + title + '</span><span class="acc__ic">' + icon('down') + '</span></summary>' +
      '<div class="acc__body">' + body + '</div></details>';
  }
  function foldsHTML() {
    var a = p.availability;
    var box = p.inTheSet && p.inTheSet.length
      ? ['In the set', setList()]
      : ['In the box', p.name + (p.category === 'earrings' ? ', one pair' : '')];
    var care = C.blocks.care[p.care] || '';
    return '<div class="acc">' +
      fold('Decode the piece', '<p>' + esc(p.story) + '</p><p class="acc__wear"><b>' + esc(p.wearLabel) + ':</b> ' + esc(p.wearWith) + '</p>', true) +
      fold('In the box &amp; care', '<dl class="acc__dl"><div><dt>' + esc(box[0]) + '</dt><dd>' + esc(box[1]) + '</dd></div>' +
        (care ? '<div><dt>Care</dt><dd>' + esc(care) + '</dd></div>' : '') + '</dl>') +
      fold('Delivery &amp; exchange',
        '<p>' + esc(ready ? C.blocks.delivery.ready : C.blocks.delivery.mto.replace('{time}', a.time)) + '</p>' +
        '<p>' + esc(ready ? C.blocks.payment.ready : C.blocks.payment.mto) + ' ' + esc(ready ? C.blocks.exchange.ready : C.blocks.exchange.mto) + '</p>' +
        '<p>' + esc(C.blocks.packaging) + '</p>') +
      fold('Made by hand', '<p class="acc__hi t-hindi" lang="hi">' + esc(C.blocks.madeByHandHindi) + '</p><p>' + esc(C.blocks.madeByHand) + '</p>') +
      '</div>';
  }

  /* ---------- the gallery ---------- */
  function stillPicture() {
    var ims = p.images || [];
    var c = colourObj();
    var pic = ims[0];
    if (c && c.images && c.images.length) for (var i = 0; i < ims.length; i++) if (ims[i].n === c.images[0]) { pic = ims[i]; break; }
    if (!pic) return '';
    return '<div class="pdp__still"><img src="' + esc(P.img(p, pic.n, 1200)) + '" srcset="' + esc(P.srcset(p, pic.n)) + '"' +
      ' sizes="(max-width: 632px) calc(100vw - 32px), 600px" alt="' + esc(pic.alt) + '" style="object-position:' + esc(pic.focal || '50% 50%') + '"></div>';
  }
  function mountGallery() {
    if (!galEl) return null;
    if (P.gallery && typeof P.gallery.mount === 'function') {
      try { return P.gallery.mount(galEl, p, { colour: pv.colour }); } catch (e) { setTimeout(function () { throw e; }); }
    }
    galEl.innerHTML = stillPicture();
    return { go: function () {}, setColour: function () { galEl.innerHTML = stillPicture(); }, index: function () { return 0; } };
  }

  /* ---------- quantity ---------- */
  function syncQty() {
    var out = $('.qty__n', panel);
    if (!out) return;
    var r = room();
    pv.qty = Math.max(1, Math.min(Math.max(1, r), pv.qty));
    if (out.textContent !== String(pv.qty)) out.textContent = String(pv.qty);
    $('[data-q="-1"]', panel).setAttribute('aria-disabled', String(pv.qty <= 1));
    $('[data-q="1"]', panel).setAttribute('aria-disabled', String(pv.qty >= r));
  }

  /* ---------- pincode (working days are Monday to Saturday: no promised date is a Sunday) ---------- */
  function dayText(d) { return WEEKDAYS[d.getDay()] + ', ' + d.getDate() + NB + MONTHS[d.getMonth()]; }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d; }
  function workDay(d) { if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d; }
  function addWorkDays(n, from) { var d = new Date(from || Date.now()); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) n--; } return d; }
  var PLACES = { '132001': 'Karnal', '132103': 'Panipat', '136118': 'Kurukshetra' };
  var PREFIXES = { '110': 'Delhi', '122': 'Gurugram', '160': 'Chandigarh', '141': 'Ludhiana', '400': 'Mumbai', '302': 'Jaipur', '132': 'Haryana' };
  function pinAnswer(pin) {
    if (!/^\d{6}$/.test(pin)) return { err: true, text: 'Please enter a 6-digit pincode.' };
    var place = PLACES[pin] || PREFIXES[pin.slice(0, 3)] || 'your pincode';
    var a = p.availability;
    if (a.type === 'ready') return { text: 'Delivered to ' + place + ' by ' + dayText(addWorkDays(5)) };
    var days = a.unit === 'weeks' ? a.max * 7 : a.max;
    var done = workDay(addDays(days));
    return { text: 'Ready by ' + dayText(done) + ', delivered to ' + place + ' by ' + dayText(addWorkDays(4, done)) };
  }
  function checkPin() {
    var input = $('#pin-in', panel);
    var out = $('.pin__ok', panel);
    if (!input || !out) return;
    var a = pinAnswer(String(input.value || '').replace(/\s+/g, ''));
    out.className = 'pin__ok' + (a.err ? ' is-err' : '');
    out.innerHTML = icon(a.err ? 'alert' : 'circle-check') + '<span>' + esc(a.text) + '</span>';
    if (a.err) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  /* ---------- colours ---------- */
  function setColour(ci) {
    if (!p.colours || !p.colours[ci] || ci === pv.colour) return;
    pv.colour = ci;
    P.$$('.cl__opt', panel).forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-cl')) === ci)); });
    var name = $('[data-cl-name]', panel);
    if (name) name.textContent = colourObj().name;
    var wa = $('.pdp__wa', panel);
    if (wa) wa.setAttribute('href', waHref());
    if (pv.g && typeof pv.g.setColour === 'function') pv.g.setColour(ci);
    syncQty();
  }

  /* ---------- the header shows which part of the shop the piece belongs to (a mark only, not aria-current: this
     page is not that collection; the Jewellery button for necklaces and earrings) ---------- */
  function markHeader() {
    var href = P.url('collection.html?c=' + encodeURIComponent(p.category));
    P.$$('.hdr a.hdr__link[href]').forEach(function (a) { if (a.getAttribute('href') === href) a.classList.add('is-current'); });
    if (p.category === 'necklaces-sets' || p.category === 'earrings') {
      var jewellery = $('.hdr [data-jewellery] > .hdr__link');
      if (jewellery) jewellery.classList.add('is-current');
    }
  }

  /* ---------- draw ---------- */
  var cat = P.collectionInfo(p.category);
  var crumbs = $('[data-fill="crumbs"]');
  if (crumbs) crumbs.innerHTML = '<ol><li><a href="' + esc(P.url('index.html')) + '">Home</a></li>' +
    '<li><a href="' + esc(P.url('collection.html?c=' + p.category)) + '">' + esc(cat ? cat.title : 'Shop all') + '</a></li>' +
    '<li><span aria-current="page">' + esc(p.name) + '</span></li></ol>';
  setWords(p.name, p.hook);
  markHeader();
  panel.innerHTML = headHTML() + offerHTML() + promisesHTML() + specHTML() + pinHTML() + foldsHTML();
  pv.g = mountGallery();
  if (rvEl && P.pdpReviews) P.pdpReviews.render(rvEl, p, { all: false });
  if (moreList) {
    var ids = typeof P.related === 'function' ? P.related([p], { max: 4 }) : [];
    if (ids.length) moreList.setAttribute('data-products', ids.join(','));
    else { var band = $('.pdp-more'); if (band) band.hidden = true; }
  }
  syncQty();
  filled();
  cueSheet();

  /* ---------- events ---------- */
  panel.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    if (!t) return;
    var c = t.closest('.cl__opt');
    if (c) { setColour(Number(c.getAttribute('data-cl')) || 0); return; }
    var q = t.closest('[data-q]');
    if (q) {
      if (q.getAttribute('aria-disabled') === 'true') return;
      pv.qty += Number(q.getAttribute('data-q'));
      syncQty();
      return;
    }
    if (t.closest('.pdp__add')) {
      var r = room();
      if (r < 1) {
        if (P.toast) P.toast.show({ icon: 'bag', text: FULL_MESSAGE, action: { text: 'View', href: '#bag' } });
        return;
      }
      P.state.bag.add(p.id, colourId(), Math.min(pv.qty, r));
      pv.qty = 1;
      syncQty();
      if (P.overlay) P.overlay.open('bag');
    }
  });
  panel.addEventListener('submit', function (e) {
    if (!e.target.closest || !e.target.closest('.pin')) return;
    e.preventDefault();
    checkPin();
  });
  P.on('bag:change', syncQty);

  /* arriving with #reviews: the band is filled now, so line it up (the browser's own jump came before it had its
     height), and once more when everything has loaded, unless the visitor has scrolled since */
  if (location.hash === '#reviews') {
    var landedAt = null;
    var land = function () {
      var band = doc.getElementById('reviews');
      if (!band) return;
      band.scrollIntoView({ block: 'start' });
      landedAt = window.pageYOffset;
    };
    P.ready(function () { requestAnimationFrame(land); });
    window.addEventListener('load', function () {
      if (landedAt !== null && Math.abs(window.pageYOffset - landedAt) < 2) requestAnimationFrame(land);
    });
  }

  afterCards();

  /* phones, with motion: the specifications sheet rises as a panel on cue, unveiled from the top down (its words
     move with it and never fade). It sits in the page's first band, where the scroll system writes no progress, so
     it keeps its own cue: up when its top reaches 92% of the screen's height, down again only below 97% (the cue
     rule's gap). The look lives in pdp.css under html.motion-scroll on screens up to 760 px wide; laptops and
     visitors who ask for less motion keep the sheet still and whole. */
  function cueSheet() {
    var sheet = $('.spec', panel);
    if (!sheet) return;
    var up = null, raf = 0, rest = 0;
    function set(next, now) {
      if (next === up) return;
      up = next;
      clearTimeout(rest);
      if (now) sheet.classList.add('spec--now');
      sheet.classList.remove('is-whole');
      sheet.classList.toggle('is-up', up);
      if (up) rest = setTimeout(function () { if (up) sheet.classList.add('is-whole'); }, now ? 0 : 760);
      if (now) requestAnimationFrame(function () { requestAnimationFrame(function () { sheet.classList.remove('spec--now'); }); });
    }
    function measure(now) {
      raf = 0;
      var h = window.innerHeight || html.clientHeight;
      var top = sheet.getBoundingClientRect().top;
      if (up === null || now) set(top <= h * 0.92, true);
      else if (!up && top <= h * 0.92) set(true, false);
      else if (up && top > h * 0.97) set(false, false);
    }
    function later() { if (!raf) raf = requestAnimationFrame(function () { measure(false); }); }
    measure(true);
    sheet.setAttribute('data-cue', '');
    window.addEventListener('scroll', later, { passive: true });
    window.addEventListener('resize', function () { requestAnimationFrame(function () { measure(true); }); });
  }

  /* card lists are filled by cards.js when the page is ready: mark their rows for the motion system */
  function afterCards() {
    P.ready(function () {
      P.$$('main [data-cards] > li').forEach(function (li) { li.setAttribute('data-row', ''); });
      if (P.motion && typeof P.motion.refresh === 'function') { try { P.motion.refresh(); } catch (e) { /* the still page stands */ } }
    });
  }
})();
