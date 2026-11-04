/* Pynora core: the one shared namespace, window.Pynora, used by every other script.
   - Pynora.cat is the catalogue (window.PYNORA_CATALOGUE) or null when it did not load.
   - Addresses are built from <html data-root="">, the page's path to the site root, so the same script
     works on every page, from disk and online alike.
   - Storage never throws: when the browser blocks it, values live in memory for the visit.
   - Events are private to the site (one EventTarget), never on window or document.
   A classic script (no imports), loaded with defer after the catalogue and before every other script. */
(function () {
  'use strict';

  var P = window.Pynora || {};
  window.Pynora = P;

  var doc = document;
  var root = doc.documentElement;

  /* ---------- Catalogue ---------- */
  var cat = window.PYNORA_CATALOGUE || null;
  var byId = {};
  var bySlug = {};
  if (cat) {
    (cat.products || []).forEach(function (p) { byId[p.id] = p; });
    (cat.collections || []).forEach(function (c) { bySlug[c.id] = c; });
  }
  P.cat = cat;

  /* A piece by its id, or null. */
  P.product = function (id) {
    return (id && Object.prototype.hasOwnProperty.call(byId, id)) ? byId[id] : null;
  };

  /* The pieces of a collection, in the collection's own order; unknown ids are skipped. */
  P.collection = function (slug) {
    var c = slug && Object.prototype.hasOwnProperty.call(bySlug, slug) ? bySlug[slug] : null;
    if (!c) return [];
    return (c.productIds || []).map(P.product).filter(Boolean);
  };

  /* The collection record itself (title, Hindi line, intro), or null. */
  P.collectionInfo = function (slug) {
    return slug && Object.prototype.hasOwnProperty.call(bySlug, slug) ? bySlug[slug] : null;
  };

  /* ---------- Rupees: "₹22,400" (Indian grouping, whole rupees) ---------- */
  var inrFormat = null;
  try { inrFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }); } catch (e) { inrFormat = null; }
  P.inr = function (n) {
    n = Number(n);
    if (!isFinite(n)) return '';
    n = Math.round(n);
    if (inrFormat) return '₹' + inrFormat.format(n);
    /* Indian grouping by hand: the last three figures, then pairs */
    var s = String(Math.abs(n));
    var last = s.slice(-3);
    var rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (n < 0 ? '-' : '') + '₹' + (rest ? rest + ',' : '') + last;
  };

  /* ---------- Addresses ---------- */
  var ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/i;
  P.url = function (path) {
    path = path == null ? '' : String(path);
    if (ABSOLUTE.test(path)) return path;
    var base = root.getAttribute('data-root') || '';
    return base + path.replace(/^\.\//, '');
  };

  /* ---------- Pictures ----------
     Pynora.pic(product, n): the picture record n of a piece (alt, focal, ratio, widths), or the first one.
     Pynora.img(product, n, width): its address at the smallest existing width that covers `width`
     (the largest when none does). `product` may be the record or its id. */
  function asProduct(p) { return typeof p === 'string' ? P.product(p) : (p || null); }

  P.pic = function (product, n) {
    var p = asProduct(product);
    if (!p || !p.images || !p.images.length) return null;
    n = Number(n) || 1;
    for (var i = 0; i < p.images.length; i++) if (p.images[i].n === n) return p.images[i];
    return p.images[0];
  };

  function widthsOf(pic) {
    return (pic.widths || []).slice().sort(function (a, b) { return a - b; });
  }

  function fileAt(p, pic, w) {
    var images = (cat && cat.images) || { base: 'assets/img/products/', ext: '.webp' };
    return P.url(images.base + p.id + '/' + pic.file + '-' + w + images.ext);
  }

  P.img = function (product, n, width) {
    var p = asProduct(product);
    var pic = P.pic(p, n);
    if (!pic) return '';
    var ws = widthsOf(pic);
    if (!ws.length) return '';
    var want = Number(width) || ws[ws.length - 1];
    var w = ws[ws.length - 1];
    for (var i = 0; i < ws.length; i++) { if (ws[i] >= want) { w = ws[i]; break; } }
    return fileAt(p, pic, w);
  };

  /* Every existing width of picture n as a srcset string ("… 480w, … 800w"). */
  P.srcset = function (product, n) {
    var p = asProduct(product);
    var pic = P.pic(p, n);
    if (!pic) return '';
    return widthsOf(pic).map(function (w) { return fileAt(p, pic, w) + ' ' + w + 'w'; }).join(', ');
  };

  /* ---------- WhatsApp ---------- */
  P.waNumber = (cat && cat.shop && cat.shop.whatsapp) || '919991263699';
  P.waLink = function (text) {
    var link = 'https://wa.me/' + P.waNumber;
    return text ? link + '?text=' + encodeURIComponent(String(text)) : link;
  };

  /* ---------- Safe storage ---------- */
  var memory = {};
  var lost = {};          /* keys whose last write failed: memory holds the true value */
  var ls = null;
  try {
    ls = window.localStorage;
    var probe = '__pynora__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
  } catch (e) { ls = null; }

  P.store = {
    available: !!ls,
    get: function (key, fallback) {
      if (ls && !lost[key]) {
        try {
          var raw = ls.getItem(key);
          if (raw == null) return fallback;
          return JSON.parse(raw);
        } catch (e) { /* unreadable: fall through to memory */ }
      }
      return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : fallback;
    },
    set: function (key, value) {
      memory[key] = value;
      if (!ls) return false;
      try {
        ls.setItem(key, JSON.stringify(value));
        delete lost[key];
        return true;
      } catch (e) {
        lost[key] = true;
        return false;
      }
    },
    remove: function (key) {
      delete memory[key];
      if (!ls) return;
      try { ls.removeItem(key); delete lost[key]; } catch (e) { lost[key] = true; }
    }
  };

  /* ---------- Events (private to the site) ----------
     Pynora.on(name, fn): fn(detail, event). Pynora.off(name, fn). Pynora.emit(name, detail). */
  var hub = typeof EventTarget === 'function' ? (function () {
    try { return new EventTarget(); } catch (e) { return doc.createDocumentFragment(); }
  })() : doc.createDocumentFragment();
  var wrapped = [];

  P.on = function (name, fn) {
    if (typeof fn !== 'function') return;
    var w = function (ev) { fn(ev.detail, ev); };
    wrapped.push([name, fn, w]);
    hub.addEventListener(name, w);
  };
  P.off = function (name, fn) {
    for (var i = wrapped.length - 1; i >= 0; i--) {
      if (wrapped[i][0] === name && wrapped[i][1] === fn) {
        hub.removeEventListener(name, wrapped[i][2]);
        wrapped.splice(i, 1);
      }
    }
  };
  P.emit = function (name, detail) {
    var ev;
    try { ev = new CustomEvent(name, { detail: detail }); }
    catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); }
    hub.dispatchEvent(ev);
  };

  /* ---------- Visitor settings (read live, so a change in the system applies at once) ---------- */
  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var fineMq = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
  P.reduced = function () { return !!(reduceMq && reduceMq.matches); };
  P.fine = function () { return !!(fineMq && fineMq.matches); };

  /* ---------- Ready: after the page is parsed and every deferred script has run ---------- */
  var queue = [];
  var isReady = doc.readyState === 'complete';
  function flush() {
    if (isReady && !queue.length) return;
    isReady = true;
    var list = queue;
    queue = [];
    list.forEach(function (fn) {
      try { fn(); } catch (e) { setTimeout(function () { throw e; }); }
    });
  }
  if (!isReady) {
    doc.addEventListener('DOMContentLoaded', flush);
    window.addEventListener('load', flush);
  }
  P.ready = function (fn) {
    if (typeof fn !== 'function') return;
    if (isReady) { setTimeout(fn, 0); return; }
    queue.push(fn);
  };

  /* ---------- Selectors ---------- */
  P.$ = function (sel, scope) { return (scope || doc).querySelector(sel); };
  P.$$ = function (sel, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(sel)); };
})();
