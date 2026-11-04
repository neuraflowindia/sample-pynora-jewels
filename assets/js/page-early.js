/* The address of a collection or product page, read while the page is still being parsed.
   Loaded right after data/catalogue.js, without defer, so the tab shows the right title at once and the
   product photograph starts downloading early. It needs nothing but the catalogue (window.Pynora comes later).

   - Which page: data-page="collection" | "product" on this script's own tag, else the file name in the address.
   - Collection (collection.html?c=<id>[&price=<band>]): no c means "all" (the address is rewritten to ?c=all);
     a price band it does not know is dropped from the address.
   - Product (product.html?p=<id>).
   - <html data-view="ok | missing | nocat">: the id is known; the id is missing or unknown; the catalogue did not load.
     <html data-hindi="none">: a known collection without a Hindi line (its reserved line takes no room).
     <html data-cv-room> and --cv-r4 / --cv-r3 / --cv-r2: the room the pieces will take (see reserve below).
   - document.title, the description and the link-preview words follow the collection or the piece.
   - window.PYNORA_PAGE = {
       kind:  "collection" | "product",
       id:    the collection id ("all" when the address has none) or the piece id, as given ("" when missing),
       price: the price filter key ("under-10000" | "10000-20000" | "above-20000") or null; collection pages only,
       band:  {min, max, chip, words} of that filter, or null,
       ok:    true when the id is known,
       stage: product pages with a known piece: the first gallery picture, computed once and used both for the
              preload link below and by the gallery's own <img>, so the browser asks for it exactly once:
              {src, srcset, sizes, n, alt, focal}; otherwise null
     }
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

  /* The room the collection's pieces will take, so nothing moves when the cards arrive: the number of card rows
     at 4, 3 and 2 across (--cv-r4, --cv-r3, --cv-r2), read by pages.css. An empty filter result reserves the
     empty panel (data-cv-room="empty"); an unknown collection the four new pieces under their heading
     (data-cv-room="lead"); without the catalogue one row. data-cv-more: "You may also like" will follow. */
  function reserve(col) {
    var n = 4, room = 'grid';
    if (col) {
      var ids = col.productIds || [];
      n = 0;
      for (var i = 0; i < ids.length; i++) {
        var p = find(cat.products, ids[i]);
        if (p && (!page.band || (p.price >= page.band.min && p.price <= page.band.max))) n++;
      }
      if (!n) room = 'empty';
      /* "You may also like" follows collections other than "all" showing four pieces or fewer */
      if (col.id !== 'all' && n <= 4) html.setAttribute('data-cv-more', '');
    } else if (cat) {
      var nw = find(cat.collections, 'new');
      n = nw ? Math.min(4, (nw.productIds || []).length) : 4;
      room = 'lead';
    }
    html.setAttribute('data-cv-room', room);
    html.style.setProperty('--cv-r4', String(Math.ceil(n / 4)));
    html.style.setProperty('--cv-r3', String(Math.ceil(n / 3)));
    html.style.setProperty('--cv-r2', String(Math.ceil(n / 2)));
  }

  var page = { kind: kind, id: '', price: null, band: null, ok: false, stage: null };

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
      var title = c === 'all' ? 'All pieces' : col.title;
      setWords(page.band ? title + ' ' + page.band.words : title, col.intro);
    } else if (cat) {
      setWords('Collection not found', '');
    }
    reserve(col);
  }

  html.setAttribute('data-view', !cat ? 'nocat' : page.ok ? 'ok' : 'missing');
  window.PYNORA_PAGE = page;

  setTimeout(function () { html.classList.add('is-filled'); }, 2500);
})();
