/* The address of a collection or product page, read while the page is still being parsed.
   Loaded right after data/catalogue.js, without defer, so the tab shows the right title at once and the
   product photograph starts downloading early. It needs nothing but the catalogue (window.Pynora comes later).

   - Which page: data-page="collection" | "product" on this script's own tag, else the file name in the address.
   - Collection (collection.html?c=<id>[&price=<band>]): no c means "all" (the address is rewritten to ?c=all);
     a price band it does not know is dropped from the address.
   - Product (product.html?p=<id>).
   - <html data-view="ok | missing | nocat">: the id is known; the id is missing or unknown; the catalogue did not load.
     <html data-hindi="none">: a known collection without a Hindi line (its reserved line takes no room).
     <html data-cop="bottom-left | top-right | pictured">: how the opening names the piece in its portrait.
     <html data-cv-room | data-cv-tags | data-cv-end>, --cv-r4 / --cv-r3 / --cv-r2 and --cv-b4 / --cv-b3 / --cv-b2: the
     room the collection's pieces will take with the address's filters (see reserve below).
   - document.title, the description and the link-preview words follow the collection or the piece.
   - window.PYNORA_PAGE = {
       kind:  "collection" | "product",
       id:    the collection id ("all" when the address has none) or the piece id, as given ("" when missing),
       price: the price filter key ("under-10000" | "10000-20000" | "above-20000") or null; collection pages only,
       band:  {min, max, chip, words} of that filter, or null,
       ok:    true when the id is known,
       stage: product pages with a known piece: the first gallery picture, computed once and used both for the
              preload link below and by the gallery's own <img>, so the browser asks for it exactly once:
              {src, srcset, sizes, n, alt, focal}; otherwise null,
       portrait: collection pages with a known collection: the opening's framed picture, computed the same way
              and used by page-collection.js: {src, srcset, sizes, alt, focal, focalPhone}; otherwise null,
       facts: collection pages with a known collection: the opening's three facts (markup), written early (see
              early below) and again by page-collection.js; otherwise "",
       pictured: the same for the "Pictured: …" line (collections whose piece fills the frame); otherwise ""
     }
   - The opening's words of a known collection are written before the first paint (see early below).
   - A safety timer shows the address-dependent words after 2.5 s whatever happens (html.is-filled). */
(function () {
  'use strict';

  var doc = document;
  var html = doc.documentElement;
  var cat = window.PYNORA_CATALOGUE || null;
  var SHOP = 'Pynora Jewels & Decor';

  var BANDS = {
    'under-10000': { min: 0, max: 9999, chip: 'Under ₹10,000', words: 'under ₹10,000' },
    '10000-20000': { min: 10000, max: 20000, chip: '₹10,000–₹20,000', words: 'from ₹10,000 to ₹20,000' },
    'above-20000': { min: 20001, max: Infinity, chip: 'Above ₹20,000', words: 'above ₹20,000' }
  };

  /* the gallery's stage (4:5): up to 600 px wide on laptops, a little less on short laptop screens, the column on
     phones. A photograph wider than 4:5 fills the stage by its height, so it is shown wider than the stage by
     ratio × 1.25: the slots grow by that factor, so the picture stays sharp at 2× */
  function stageSizes(ratio) {
    var f = Math.max(1, (Number(ratio) || 0.8) * 1.25);
    var px = function (n) { return Math.ceil(n * f) + 'px'; };
    var phone = f === 1 ? 'calc(100vw - 32px)' : 'calc(' + Math.ceil(100 * f) + 'vw - ' + Math.ceil(32 * f) + 'px)';
    return '(max-width: 632px) ' + phone + ', (max-width: 960px) ' + px(600) + ', (max-height: 820px) ' + px(500) + ', ' + px(600);
  }
  var STAGE_WIDTH = 1200;

  /* The collection's framed portrait (4:5): at most 380 px tall (304 px wide) on laptops, 440 px tall (352 px wide)
     from 1,800 px, 140 px wide on phones. A picture wider than 4:5 fills the frame by its height, so its slot grows
     by ratio × 1.25 */
  function portraitSizes(ratio) {
    var f = Math.max(1, (Number(ratio) || 0.8) * 1.25);
    return '(max-width: 760px) ' + Math.ceil(140 * f) + 'px, (min-width: 1800px) ' + Math.ceil(352 * f) + 'px, ' + Math.ceil(304 * f) + 'px';
  }
  var PORTRAIT_WIDTH = 800;

  var me = doc.currentScript;
  var kind = (me && me.getAttribute('data-page')) || (/product\.html$/i.test(location.pathname) ? 'product' : 'collection');

  var params;
  try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
  function param(name) { return params ? params.get(name) : null; }

  function find(list, id) {
    if (!list || !id) return null;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function setMeta(selector, value) {
    var el = doc.querySelector(selector);
    if (el && value) el.setAttribute('content', value);
  }
  function setWords(title, description) {
    doc.title = title + ' · ' + SHOP;
    setMeta('meta[property="og:title"]', doc.title);
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:description"]', description);
  }

  function rewrite() {
    if (!params || !window.history || !history.replaceState) return;
    var q = params.toString();
    try { history.replaceState(history.state, '', (q ? '?' + q : location.pathname) + location.hash); } catch (e) { /* the address stays as it is */ }
  }

  /* the address of picture `pic` of piece `p` at width w, built exactly as Pynora.img builds it */
  function fileAt(p, pic, w) {
    var images = (cat && cat.images) || { base: 'assets/img/products/', ext: '.webp' };
    return (html.getAttribute('data-root') || '') + images.base + p.id + '/' + pic.file + '-' + w + images.ext;
  }
  function stageOf(p) {
    var ims = p.images || [];
    if (!ims.length) return null;
    var pic = ims[0];
    var cols = p.colours || [];
    if (cols.length && cols[0].images && cols[0].images.length) {
      for (var i = 0; i < ims.length; i++) if (ims[i].n === cols[0].images[0]) { pic = ims[i]; break; }
    }
    var ws = (pic.widths || []).slice().sort(function (a, b) { return a - b; });
    if (!ws.length) return null;
    var w = ws[ws.length - 1];
    for (var k = 0; k < ws.length; k++) if (ws[k] >= STAGE_WIDTH) { w = ws[k]; break; }
    return {
      src: fileAt(p, pic, w),
      srcset: ws.map(function (x) { return fileAt(p, pic, x) + ' ' + x + 'w'; }).join(', '),
      sizes: stageSizes(pic.ratio),
      n: pic.n,
      alt: pic.alt || '',
      focal: pic.focal || '50% 50%'
    };
  }
  function portraitOf(col) {
    var pt = col && col.portrait;
    if (!pt) return null;
    var root = html.getAttribute('data-root') || '';
    if (pt.home) {
      var hw = (pt.widths || []).slice().sort(function (a, b) { return a - b; });
      if (!hw.length) return null;
      var at = function (w) { return root + 'assets/img/home/' + pt.home + '-' + w + '.webp'; };
      var hsrc = hw[hw.length - 1];
      for (var j = 0; j < hw.length; j++) if (hw[j] >= PORTRAIT_WIDTH) { hsrc = hw[j]; break; }
      return { src: at(hsrc), srcset: hw.map(function (w) { return at(w) + ' ' + w + 'w'; }).join(', '), sizes: portraitSizes(pt.ratio),
        alt: pt.alt || '', focal: pt.focal || '50% 50%', focalPhone: pt.focalPhone || pt.focal || '50% 50%' };
    }
    var p = find(cat.products, pt.product);
    var pic = null, ims = (p && p.images) || [];
    for (var i = 0; i < ims.length; i++) if (ims[i].n === pt.n) { pic = ims[i]; break; }
    if (!pic) return null;
    var ws = (pic.widths || []).slice().sort(function (a, b) { return a - b; });
    if (!ws.length) return null;
    var w = ws[ws.length - 1];
    for (var k = 0; k < ws.length; k++) if (ws[k] >= PORTRAIT_WIDTH) { w = ws[k]; break; }
    var focal = pt.focal || pic.focal || '50% 50%';
    return { src: fileAt(p, pic, w), srcset: ws.map(function (x) { return fileAt(p, pic, x) + ' ' + x + 'w'; }).join(', '),
      sizes: portraitSizes(pic.ratio), alt: pt.alt || pic.alt || '', focal: focal, focalPhone: pt.focalPhone || focal };
  }
  function preload(stage) {
    var link = doc.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = stage.src;
    link.setAttribute('imagesrcset', stage.srcset);
    link.setAttribute('imagesizes', stage.sizes);
    link.setAttribute('fetchpriority', 'high');
    doc.head.appendChild(link);
  }

  /* The address's other filters, read as collection-state.js reads them (known values only; within a facet the
     choices widen, between facets they narrow), so the reserved room holds exactly the pieces the grid will show */
  var FACETS = {
    type: ['necklaces-sets', 'earrings', 'bags', 'decor'],
    occ: ['bridal', 'festive', 'cocktail', 'everyday', 'gifting', 'home'],
    tone: ['green', 'red', 'pearl', 'gold', 'white', 'black', 'ivory']
  };
  function facet(name) {
    var out = [];
    String(param(name) || '').split(',').forEach(function (v) {
      v = v.trim().toLowerCase();
      if (v && FACETS[name].indexOf(v) > -1 && out.indexOf(v) < 0) out.push(v);
    });
    return out;
  }
  function filters() {
    return { ready: param('ready') === '1', type: facet('type'), occ: facet('occ'), tone: facet('tone') };
  }
  function overlaps(list, chosen) {
    if (!chosen.length) return true;
    for (var i = 0; i < chosen.length; i++) if ((list || []).indexOf(chosen[i]) > -1) return true;
    return false;
  }
  function shows(p, f) {
    if (page.band && !(p.price >= page.band.min && p.price <= page.band.max)) return false;
    if (f.ready && !(p.availability && p.availability.type === 'ready')) return false;
    if (f.type.length && f.type.indexOf(p.category) < 0) return false;
    return overlaps(p.occasions, f.occ) && overlaps(p.tones, f.tone);
  }

  /* The room the collection's pieces will take, for the grid band's reserved room (collection-grid.css):
     --cv-r4 / --cv-r3 / --cv-r2 the rows of cards at 4, 3 and 2 across; --cv-b4 / --cv-b3 / --cv-b2 1 when the
     studio note then takes a whole row of its own (the pieces fill their last row), else 0.
     <html data-cv-room>: "grid"; "empty" when the address's filters hold nothing; "lead" for an unknown
     collection (the four new pieces under their heading); without the catalogue one row.
     <html data-cv-tags>: the address has filters in use (the bar shows them in a row beneath it).
     <html data-cv-end="one">: the end line has no "See all" link beneath it (Shop all). */
  function reserve(col) {
    var n = 4, room = 'grid';
    var f = filters();
    if (col) {
      var ids = col.productIds || [];
      n = 0;
      for (var i = 0; i < ids.length; i++) {
        var p = find(cat.products, ids[i]);
        if (p && shows(p, f)) n++;
      }
      if (!n) room = 'empty';
    } else if (cat) {
      var nw = find(cat.collections, 'new');
      n = nw ? Math.min(4, (nw.productIds || []).length) : 4;
      room = 'lead';
    }
    html.setAttribute('data-cv-room', room);
    if (page.band || f.ready || f.type.length || f.occ.length || f.tone.length) html.setAttribute('data-cv-tags', '');
    if (page.id === 'all') html.setAttribute('data-cv-end', 'one');
    [4, 3, 2].forEach(function (c) {
      html.style.setProperty('--cv-r' + c, String(Math.ceil(n / c)));
      html.style.setProperty('--cv-b' + c, n && n % c === 0 ? '1' : '0');
    });
  }

  /* ---------- The opening's words, written as the opening is parsed ----------
     The page's own markup holds Shop all's words. For another collection the title, the Hindi line, the intro, the
     breadcrumb, the three facts and the "Pictured" line are written here as soon as the parser has passed them (the frame's box, the
     opening's last part, has arrived), before the first paint, so the opening is never drawn at Shop all's height
     and then grows. page-collection.js writes the same words again and uses page.facts and page.pictured. */
  function rupees(n) {                   /* as Pynora.inr: "₹22,400" */
    n = Math.round(Number(n));
    if (!isFinite(n)) return '';
    try { return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n); } catch (e) { /* by hand */ }
    var s = String(Math.abs(n)), last = s.slice(-3), rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (n < 0 ? '-' : '') + '₹' + (rest ? rest + ',' : '') + last;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function icon(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  /* the three facts of the collection's pieces: how many, the lowest price, the review-weighted rating */
  function factsHTML(col) {
    var pieces = (col.productIds || []).map(function (id) { return find(cat.products, id); }).filter(Boolean);
    if (!pieces.length) return '';
    var from = Infinity, count = 0, sum = 0;
    pieces.forEach(function (p) {
      from = Math.min(from, Number(p.price) || Infinity);
      var r = p.reviews || {};
      count += r.count || 0;
      sum += (r.average || 0) * (r.count || 0);
    });
    return '<li class="cop__fact">' + icon('sparkle') + '<span><b>' + pieces.length + '</b> ' + (pieces.length === 1 ? 'piece' : 'pieces') + '</span></li>' +
      '<li class="cop__fact">' + icon('banknote') + '<span>From <b>' + esc(rupees(from)) + '</b></span></li>' +
      (count ? '<li class="cop__fact"><a class="cop__rate" href="#reviews">' + icon('star', 'i--fill') +
        '<span><span class="vh">Rated </span><b>' + (sum / count).toFixed(1) + '</b> · ' + count + ' ' + (count === 1 ? 'review' : 'reviews') + '</span></a></li>' : '');
  }
  /* where the piece fills the frame: "Pictured: <name> in <colour> · <price>" under the facts (laptops) */
  function picturedHTML(col) {
    var ch = col.chip || {};
    if (ch.mode !== 'pictured' || !page.portrait) return '';
    var p = ch.product ? find(cat.products, ch.product) : null;
    var root = html.getAttribute('data-root') || '';
    var to = ch.href || 'index.html';      /* a text chip's own address, as Pynora.url builds it */
    var href = p ? root + 'product.html?p=' + encodeURIComponent(p.id)
      : /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(to) ? to : root + to.replace(/^\.\//, '');
    var name = p ? p.name : ch.text || '';
    var price = p ? rupees(p.price) : '';
    return '<span class="line__in">Pictured: <a href="' + esc(href) + '">' + esc(name) + '</a>' +
      (p && ch.colour ? ' in ' + esc(ch.colour) : '') + (price ? ' · <b>' + esc(price) + '</b>' : '') + icon('arrow') + '</span>';
  }
  function writeOpening(col) {
    var q = function (s) { return doc.querySelector(s); };
    var title = col.id === 'all' ? 'All pieces' : col.title;
    var set = function (el, words) { if (el && el.textContent !== words) el.textContent = words; };
    set(q('.cop__crumbs [aria-current="page"]'), title);
    if (col.hindi) set(q('[data-fill="hindi"] .line__in'), col.hindi);
    set(q('[data-fill="title"]'), title);
    set(q('[data-fill="intro"]'), col.intro || '');
    var facts = q('[data-fill="facts"]');
    if (facts && !facts.firstChild) facts.innerHTML = page.facts;
    var pictured = q('[data-fill="pictured"]');
    if (pictured && page.pictured && !pictured.firstChild) { pictured.innerHTML = page.pictured; pictured.hidden = false; }
  }
  function early(col) {
    page.facts = factsHTML(col);
    page.pictured = picturedHTML(col);
    var done = false;
    var go = function () {
      if (done || !doc.querySelector('[data-fill="pics"]')) return false;
      done = true;
      writeOpening(col);
      return true;
    };
    if (go()) return;
    var mo = null;
    if (window.MutationObserver) {
      mo = new MutationObserver(function () { if (go()) mo.disconnect(); });
      mo.observe(html, { childList: true, subtree: true });
    }
    doc.addEventListener('DOMContentLoaded', function () { if (mo) mo.disconnect(); go(); });
  }

  var page = { kind: kind, id: '', price: null, band: null, ok: false, stage: null, portrait: null, facts: '', pictured: '' };

  if (kind === 'product') {
    page.id = param('p') || '';
    var piece = cat ? find(cat.products, page.id) : null;
    page.ok = !!piece;
    if (piece) {
      setWords(piece.name, piece.hook);
      page.stage = stageOf(piece);
      if (page.stage) preload(page.stage);
    } else if (cat) {
      setWords('Piece not found', '');
    }
  } else {
    var c = param('c');
    var fix = false;
    if (!c) { c = 'all'; if (params) params.set('c', 'all'); fix = true; }
    var price = param('price');
    if (price != null) {
      if (Object.prototype.hasOwnProperty.call(BANDS, price)) { page.price = price; page.band = BANDS[price]; }
      else { if (params) params.delete('price'); fix = true; }
    }
    if (fix) rewrite();
    page.id = c;
    var col = cat ? find(cat.collections, c) : null;
    page.ok = !!col;
    if (col) {
      if (!col.hindi) html.setAttribute('data-hindi', 'none');
      if (col.chip && col.chip.mode) html.setAttribute('data-cop', col.chip.mode);
      page.portrait = portraitOf(col);
      if (page.portrait) preload(page.portrait);
      var title = c === 'all' ? 'All pieces' : col.title;
      setWords(page.band ? title + ' ' + page.band.words : title, col.intro);
      early(col);
    } else if (cat) {
      setWords('Collection not found', '');
    }
    reserve(col);
  }

  html.setAttribute('data-view', !cat ? 'nocat' : page.ok ? 'ok' : 'missing');
  window.PYNORA_PAGE = page;

  setTimeout(function () { html.classList.add('is-filled'); }, 2500);
})();
