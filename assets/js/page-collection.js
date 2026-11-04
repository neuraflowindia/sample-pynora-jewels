/* The collection page (collection.html?c=<id>[&price=<band>]), drawn from the catalogue.
   - Reads window.PYNORA_PAGE (page-early.js): the collection id, the price filter and whether the id is known.
   - Writes the breadcrumb, the Hindi line, the title, the intro, the count, the price chip, the grid's pieces,
     the empty result, "You may also like" (collections other than "all" showing four pieces or fewer) and marks the
     current collection in the collection buttons and in the header.
   - An unknown collection shows "This collection has wandered off." with the new pieces under it.
   - Without the catalogue the page keeps its own words and the grid says it could not be shown.
   - The card lists get their pieces while this script runs (cards.js fills them when the page is ready); each
     card's list item is then marked data-row for the scroll arrival.
   Then html.is-filled shows the words. A classic script, loaded with defer after cards.js and related.js. */
(function () {
  'use strict';

  var P = window.Pynora;
  var doc = document;
  var html = doc.documentElement;
  if (!P) { html.classList.add('is-filled'); return; }

  var page = window.PYNORA_PAGE || { kind: 'collection', id: 'all', price: null, band: null, ok: false };
  var NEW_TITLE = 'New in the studio';

  function $(s, r) { return (r || doc).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function icon(n) { return '<svg class="i" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function fill(name, markup) { var el = $('[data-fill="' + name + '"]'); if (el) el.innerHTML = markup; return el; }
  function columns() {
    if (!window.matchMedia) return 4;
    return matchMedia('(max-width: 760px)').matches ? 2 : matchMedia('(max-width: 1080px)').matches ? 3 : 4;
  }
  function collectionUrl(id) { return P.url('collection.html?c=' + encodeURIComponent(id)); }

  function crumbs(last) {
    return '<ol><li><a href="' + esc(P.url('index.html')) + '">Home</a></li><li><span aria-current="page">' + esc(last) + '</span></li></ol>';
  }
  function headingSet(title) {
    return '<div class="hs"><h2 class="t-sub line"><span class="line__in">' + esc(title) + '</span></h2>' +
      '<span class="orn-rule" aria-hidden="true"><span class="orn-fan"></span></span></div>';
  }
  /* a card list under a heading: "You may also like" (given ids) or "New in the studio" (the new pieces) */
  function showMore(title, ids, lead) {
    var more = $('.cv-grid .more');
    if (!more) return;
    more.innerHTML = headingSet(title) +
      '<ul class="card-grid more__cards" data-cards data-reveal="dissolve" data-eager="0" ' +
      (ids ? 'data-products="' + esc(ids.join(',')) + '"' : 'data-collection="new" data-limit="4"') + '></ul>';
    more.classList.toggle('more--lead', !!lead);
    more.classList.add('is-on');
  }

  /* the collection buttons: the current one marked, and scrolled into the middle when the row scrolls (the row
     centres itself in CSS when it fits) */
  function markTab(id) {
    P.$$('.cv-tab').forEach(function (a) {
      if (a.getAttribute('data-c') === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  function fitTabs() {
    var nav = $('.cv-tabs');
    var list = nav && $('.cv-tabs__list', nav);
    if (!list) return;
    var fits = list.scrollWidth <= list.clientWidth + 1;
    var cur = $('[aria-current="page"]', list);
    if (cur && !fits) list.scrollLeft = Math.max(0, cur.parentNode.offsetLeft - (list.clientWidth - cur.offsetWidth) / 2);
  }

  /* the header's link to this collection (the Jewellery button for necklaces and earrings) */
  function markHeader(id) {
    var href = collectionUrl(id);
    P.$$('.hdr a[href], .menu a[href]').forEach(function (a) {
      if (a.getAttribute('href') === href) a.setAttribute('aria-current', 'page');
    });
    if (id === 'necklaces-sets' || id === 'earrings') {
      var jewellery = $('.hdr [data-jewellery] > .hdr__link');
      if (jewellery) jewellery.classList.add('is-current');
    }
  }

  function notFound() {
    $('.cv-head .hs').outerHTML = '<div class="nf" data-bg-words>' +
      '<div class="hs"><h1 class="t-section line" id="cv-title"><span class="line__in">This collection has wandered off.</span></h1>' +
      '<span class="orn-rule" aria-hidden="true"><span class="orn-fan"></span></span>' +
      '<p class="t-lead line"><span class="line__in">It may have moved, or the address may be incomplete. Every piece is still right here.</span></p></div>' +
      '<div class="nf__acts"><a class="btn btn--main" href="' + esc(collectionUrl('all')) + '">Shop all pieces</a>' +
      '<a class="btn btn--second" href="' + esc(P.url('index.html')) + '">Back to home</a></div>' +
      '<p class="nf__search"><a class="tlink" href="#search">' + icon('search') + 'Search the shop</a></p></div>';
    fill('crumbs', crumbs('Collections'));
    markTab(null);
    $('.cv-bar').hidden = true;
    var grid = $('.cv-cards');
    grid.removeAttribute('data-cards');
    grid.hidden = true;
    showMore(NEW_TITLE, null, true);
  }

  function noCatalogue() {
    var hindi = $('[data-fill="hindi"]');
    if (hindi) hindi.remove();
    markTab(page.id);
    var bar = $('.cv-bar');
    bar.classList.add('is-centred');
    fill('count', '');
    bar.insertAdjacentHTML('afterbegin', '<p class="cv-note">Our pieces could not be shown just now. Please refresh the page, or ' +
      '<a class="tlink tlink--wa" href="' + esc(P.waLink('Hi Pynora, I’d like to see your pieces.')) + '" target="_blank" rel="noopener">ask us on WhatsApp</a>.</p>');
    /* one row of unseen card shapes keeps the grid's room */
    var grid = $('.cv-cards');
    grid.setAttribute('data-collection', 'all');
    grid.setAttribute('data-limit', String(columns()));
  }

  function draw() {
    var id = page.id;
    var col = P.collectionInfo(id);
    var band = page.band;
    var title = id === 'all' ? 'All pieces' : col.title;
    var name = id === 'all' ? 'our pieces' : col.title;
    var pieces = P.collection(id);
    var shown = band ? pieces.filter(function (p) { return p.price >= band.min && p.price <= band.max; }) : pieces;

    fill('crumbs', crumbs(title));
    var hindi = $('[data-fill="hindi"]');
    if (hindi) {
      if (col.hindi) $('.line__in', hindi).textContent = col.hindi;
      else hindi.remove();
    }
    $('[data-fill="title"]').textContent = title;
    $('[data-fill="intro"]').textContent = col.intro || '';
    markTab(id);
    markHeader(id);

    var bar = $('.cv-bar');
    var grid = $('.cv-cards');
    fill('count', shown.length ? '<b>' + plural(shown.length, 'piece', 'pieces') + '</b>' + (band ? ' ' + esc(band.words) : '') : '');
    if (band) {
      fill('filter', '<a class="cv-chip" href="' + esc(collectionUrl(id)) + '" aria-label="Remove the price filter: ' + esc(band.chip) + '">' +
        esc(band.chip) + icon('x') + '</a>');
    }

    if (shown.length) {
      grid.setAttribute('data-products', shown.map(function (p) { return p.id; }).join(','));
      grid.setAttribute('data-eager', String(columns()));
      grid.setAttribute('data-n', String(shown.length));
      bar.setAttribute('data-n', String(shown.length));
      grid.style.setProperty('--n', String(Math.min(shown.length, 4)));
    } else {
      bar.classList.add('is-centred');
      grid.removeAttribute('data-cards');
      grid.hidden = true;
      var empty = $('.cv-empty');
      var wa = 'Hi Pynora, I’m looking for something ' + band.words + '. What would you suggest?';
      empty.innerHTML = '<span class="cv-empty__ic">' + icon('sparkle') + '</span>' +
        '<h2>Nothing in ' + esc(name) + ' ' + esc(band.words) + ' just now.</h2>' +
        '<p>See every piece in ' + esc(name) + ', or tell us your budget on WhatsApp and we will suggest something.</p>' +
        '<div class="cv-empty__acts"><a class="btn btn--main btn--compact" href="' + esc(collectionUrl(id)) + '">See all of ' + esc(name) + '</a>' +
        '<a class="tlink tlink--wa" href="' + esc(P.waLink(wa)) + '" target="_blank" rel="noopener">' + icon('wa') + 'Ask us on WhatsApp</a></div>';
      empty.hidden = false;
    }

    if (id !== 'all' && shown.length <= 4 && P.related) {
      var ids = P.related(shown.length ? shown : pieces, { max: 4 });
      if (ids.length) showMore('You may also like', ids);
    }
  }

  try {
    if (!P.cat) noCatalogue();
    else if (!page.ok) notFound();
    else draw();
  } finally {
    /* the row of collection buttons is placed before it is shown, so it never jumps sideways */
    try { fitTabs(); } catch (e) { /* the row starts at its first button */ }
    html.classList.add('is-filled');
  }

  P.ready(function () {
    fitTabs();
    var t = 0;
    addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fitTabs, 120); });
    P.$$('main [data-cards] > li').forEach(function (li) { li.setAttribute('data-row', ''); });
    if (P.motion && typeof P.motion.refresh === 'function') { try { P.motion.refresh(doc.getElementById('main')); } catch (e) { /* the page stays still */ } }
  });
})();
