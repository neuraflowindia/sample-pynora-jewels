/* The Collection page's filters and sorting, as pure functions: window.Pynora.collectionState.
   Nothing here reads or writes the page; the bar and the grid call these with the catalogue's pieces.
   - The address: collection.html?c=<id>&ready=1&price=<band>&type=a,b&occ=a,b&tone=a,b&sort=<key>
     (featured is the default and is not written). Unknown values are dropped; other parameters are kept.
   - Within a facet the choices widen (or); between facets they narrow (and).
   - A facet shows only when one of its choices holds some but not all of the collection's pieces.
   - Option counts are counted with the other facets applied.
   - The studio note completes the last row: with n pieces in c columns it takes s = (c - n mod c) mod c places,
     or a whole row when that is 0 (after the first row, or at the end when there is only one row).
   A classic script, loaded with defer after core.js. */
(function () {
  'use strict';

  var P = window.Pynora = window.Pynora || {};

  var BANDS = [
    { v: 'under-10000', label: 'Under ₹10,000', words: 'under ₹10,000', min: 0, max: 9999 },
    { v: '10000-20000', label: '₹10,000–₹20,000', words: '₹10,000–₹20,000', min: 10000, max: 20000 },
    { v: 'above-20000', label: 'Above ₹20,000', words: 'above ₹20,000', min: 20001, max: Infinity }
  ];
  var TYPES = [
    { v: 'necklaces-sets', label: 'Necklaces & sets', words: 'necklaces and sets' },
    { v: 'earrings', label: 'Earrings', words: 'earrings' },
    { v: 'bags', label: 'Bags', words: 'bags' },
    { v: 'decor', label: 'Décor', words: 'décor' }
  ];
  var OCC = [
    { v: 'bridal', label: 'Bridal' }, { v: 'festive', label: 'Festive' }, { v: 'cocktail', label: 'Cocktail' },
    { v: 'everyday', label: 'Everyday' }, { v: 'gifting', label: 'Gifting' }, { v: 'home', label: 'For the home' }
  ];
  var TONES = [
    { v: 'green', label: 'Green', sw: '#2F6B4F' }, { v: 'red', label: 'Red', sw: '#9E1B2C' },
    { v: 'pearl', label: 'Pearl', sw: '#EFE6D6' }, { v: 'gold', label: 'Gold', sw: '#C9A15A' },
    { v: 'white', label: 'White', sw: '#F7F4EE' }, { v: 'black', label: 'Black', sw: '#1F1A1C' },
    { v: 'ivory', label: 'Ivory', sw: '#EDE3CC' }
  ];
  var SORTS = [
    { v: 'featured', label: 'Featured' }, { v: 'newest', label: 'Newest first' },
    { v: 'price-asc', label: 'Price: low to high' }, { v: 'price-desc', label: 'Price: high to low' },
    { v: 'loved', label: 'Most loved' }
  ];
  var LIST = { type: TYPES, occ: OCC, tone: TONES };
  var KEYS = ['ready', 'price', 'type', 'occ', 'tone', 'sort'];
  var LABEL = { ready: 'Ready to ship', price: 'Price', type: 'Type', occ: 'Occasion', tone: 'Colour', sort: 'Sort' };

  function find(list, v) {
    for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i];
    return null;
  }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /* ---------- State ---------- */
  function empty(c) { return { c: c || 'all', ready: false, price: '', type: [], occ: [], tone: [], sort: 'featured' }; }
  function clone(s) {
    return { c: s.c, ready: !!s.ready, price: s.price || '', type: s.type.slice(), occ: s.occ.slice(), tone: s.tone.slice(), sort: s.sort || 'featured' };
  }
  function cleared(s) { var n = empty(s.c); n.sort = s.sort; return n; }
  function same(a, b) {
    return a.c === b.c && a.ready === b.ready && a.price === b.price && a.sort === b.sort &&
      a.type.join(',') === b.type.join(',') && a.occ.join(',') === b.occ.join(',') && a.tone.join(',') === b.tone.join(',');
  }

  /* known values of a list parameter, each once, in the order given */
  function values(raw, list) {
    var out = [];
    String(raw || '').split(',').forEach(function (v) {
      v = v.trim().toLowerCase();
      if (v && find(list, v) && out.indexOf(v) < 0) out.push(v);
    });
    return out;
  }

  /* parse(search): the state in an address's query ("?c=earrings&occ=festive" or a URLSearchParams) */
  function parse(search) {
    var q;
    try { q = typeof search === 'string' || search == null ? new URLSearchParams(search || '') : search; } catch (e) { q = null; }
    var get = function (k) { return q ? q.get(k) : null; };
    var s = empty((get('c') || '').trim() || 'all');
    s.ready = get('ready') === '1';
    s.price = find(BANDS, get('price')) ? get('price') : '';
    s.type = values(get('type'), TYPES);
    s.occ = values(get('occ'), OCC);
    s.tone = values(get('tone'), TONES);
    s.sort = find(SORTS, get('sort')) ? get('sort') : 'featured';
    return s;
  }

  /* query(state, search): the address's query for the state ("c=gifting&price=under-10000"), keeping any other
     parameters of `search` after the page's own */
  function query(s, search) {
    var q = new URLSearchParams();
    q.set('c', s.c || 'all');
    if (s.ready) q.set('ready', '1');
    if (s.price) q.set('price', s.price);
    if (s.type.length) q.set('type', s.type.join(','));
    if (s.occ.length) q.set('occ', s.occ.join(','));
    if (s.tone.length) q.set('tone', s.tone.join(','));
    if (s.sort && s.sort !== 'featured') q.set('sort', s.sort);
    var rest;
    try { rest = new URLSearchParams(search || ''); } catch (e) { rest = null; }
    if (rest) rest.forEach(function (v, k) { if (k !== 'c' && KEYS.indexOf(k) < 0) q.append(k, v); });
    return q.toString().replace(/%2C/gi, ',');
  }

  /* ---------- Filtering and sorting ---------- */
  function band(v) { return find(BANDS, v); }
  function inBand(p, v) { var b = band(v); return !!b && p.price >= b.min && p.price <= b.max; }
  function test(kind, v) {
    if (kind === 'ready') return function (p) { return !!p.availability && p.availability.type === 'ready'; };
    if (kind === 'price') return function (p) { return inBand(p, v); };
    if (kind === 'type') return function (p) { return p.category === v; };
    if (kind === 'occ') return function (p) { return (p.occasions || []).indexOf(v) > -1; };
    return function (p) { return (p.tones || []).indexOf(v) > -1; };
  }
  function any(list, p, kind) {
    for (var i = 0; i < list.length; i++) if (test(kind, list[i])(p)) return true;
    return false;
  }

  /* matches(piece, state, skip): passes every facet in use (except `skip`, for option counts) */
  function matches(p, s, skip) {
    if (skip !== 'ready' && s.ready && !test('ready')(p)) return false;
    if (skip !== 'price' && s.price && !inBand(p, s.price)) return false;
    if (skip !== 'type' && s.type.length && !any(s.type, p, 'type')) return false;
    if (skip !== 'occ' && s.occ.length && !any(s.occ, p, 'occ')) return false;
    if (skip !== 'tone' && s.tone.length && !any(s.tone, p, 'tone')) return false;
    return true;
  }
  function filter(pieces, s) { return pieces.filter(function (p) { return matches(p, s); }); }

  function sort(pieces, key) {
    var a = pieces.map(function (p, i) { return { p: p, i: i }; });
    var by = {
      newest: function (x, y) { return String(y.p.addedOn || '').localeCompare(String(x.p.addedOn || '')); },
      'price-asc': function (x, y) { return x.p.price - y.p.price; },
      'price-desc': function (x, y) { return y.p.price - x.p.price; },
      loved: function (x, y) {
        var rx = x.p.reviews || {}, ry = y.p.reviews || {};
        return ((ry.average || 0) - (rx.average || 0)) || ((ry.count || 0) - (rx.count || 0));
      }
    }[key];
    /* ties keep the catalogue's order */
    if (by) a.sort(function (x, y) { return by(x, y) || x.i - y.i; });
    return a.map(function (x) { return x.p; });
  }

  /* shown(pieces, state): the pieces to show, filtered and sorted */
  function shown(pieces, s) { return sort(filter(pieces, s), s.sort); }

  /* ---------- Which facets and choices ---------- */
  function splits(pieces, t) {
    var n = 0;
    for (var i = 0; i < pieces.length; i++) if (t(pieces[i])) n++;
    return n > 0 && n < pieces.length;
  }
  function facets(pieces) {
    return {
      ready: splits(pieces, test('ready')),
      price: BANDS.some(function (b) { return splits(pieces, test('price', b.v)); }),
      type: TYPES.filter(function (t) { return splits(pieces, test('type', t.v)); }).length > 1,
      occ: OCC.some(function (o) { return splits(pieces, test('occ', o.v)); }),
      tone: TONES.some(function (t) { return splits(pieces, test('tone', t.v)); })
    };
  }

  function isOn(s, kind, v) {
    if (kind === 'ready') return !!s.ready;
    if (kind === 'price') return s.price === v;
    if (kind === 'sort') return s.sort === v;
    return s[kind].indexOf(v) > -1;
  }

  /* count(pieces, state, kind, v): how many pieces the choice would show, the other facets applied */
  function count(pieces, s, kind, v) {
    var t = test(kind, v);
    var n = 0;
    for (var i = 0; i < pieces.length; i++) if (matches(pieces[i], s, kind) && t(pieces[i])) n++;
    return n;
  }

  /* options(pieces, state, kind): the choices of a facet for this collection, [{v, label, n, on, sw}]; a choice
     shows when it splits the collection (Type: when the collection holds it), or when it is in use */
  function options(pieces, s, kind) {
    if (kind === 'sort') return SORTS.map(function (o) { return { v: o.v, label: o.label, n: null, on: s.sort === o.v }; });
    if (kind === 'ready') return [{ v: '1', label: LABEL.ready, n: count(pieces, s, 'ready'), on: !!s.ready }];
    var list = kind === 'price' ? BANDS : LIST[kind];
    var out = [];
    list.forEach(function (o) {
      var t = test(kind, o.v);
      var keep = kind === 'type' ? pieces.some(t) : splits(pieces, t);
      if (!keep && !isOn(s, kind, o.v)) return;
      out.push({ v: o.v, label: o.label, n: count(pieces, s, kind, o.v), on: isOn(s, kind, o.v), sw: o.sw || null });
    });
    return out;
  }

  /* ---------- Changing the state (each returns a new state) ---------- */
  function toggle(s, kind, v) {
    var n = clone(s);
    if (kind === 'ready') n.ready = !n.ready;
    else if (kind === 'price') n.price = n.price === v ? '' : v;
    else if (kind === 'sort') n.sort = find(SORTS, v) ? v : 'featured';
    else {
      var i = n[kind].indexOf(v);
      if (i > -1) n[kind].splice(i, 1);
      else if (find(LIST[kind], v)) n[kind].push(v);
    }
    return n;
  }
  function unset(s, kind, v) {
    var n = clone(s);
    if (kind === 'ready') n.ready = false;
    else if (kind === 'price') n.price = '';
    else if (LIST[kind]) n[kind] = n[kind].filter(function (x) { return x !== v; });
    return n;
  }

  /* ---------- Words ---------- */
  /* active(state): the filters in use, [{kind, v, label, words}], in the bar's order */
  function active(s) {
    var out = [];
    if (s.ready) out.push({ kind: 'ready', v: '1', label: LABEL.ready, words: 'ready to ship' });
    if (s.price) { var b = band(s.price); out.push({ kind: 'price', v: b.v, label: b.label, words: b.words }); }
    ['type', 'occ', 'tone'].forEach(function (k) {
      s[k].forEach(function (v) {
        var o = find(LIST[k], v);
        out.push({ kind: k, v: v, label: o.label, words: o.words || o.label.toLowerCase() });
      });
    });
    return out;
  }
  function activeCount(s) { return active(s).length; }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* countWords(shown, total): "3 pieces" or "3 pieces of 7" (never "3 of 3") */
  function countWords(n, total) {
    return n < total ? plural(n, 'piece', 'pieces') + ' of ' + total : plural(n, 'piece', 'pieces');
  }

  /* titleWords(title, state, shown, total): "Earrings, festive" (filter words only when they narrow the pieces) */
  function titleWords(title, s, n, total) {
    if (!(n < total)) return title;
    var w = active(s).map(function (a) { return a.words; });
    return w.length ? title + ', ' + w.join(', ') : title;
  }

  function sortLabel(v) { var o = find(SORTS, v); return o ? o.label : SORTS[0].label; }

  /* ---------- The studio note ---------- */
  function noteSpan(n, c) { var s = (c - n % c) % c; return s === 0 ? c : s; }
  function noteIndex(n, c, s) { return s === c ? (n > c ? c : n) : n; }
  function noteShape(s, c) { return s === c ? 'band' : s === 1 ? 'one' : s === 2 ? 'two' : 'three'; }

  P.collectionState = {
    BANDS: BANDS, TYPES: TYPES, OCC: OCC, TONES: TONES, SORTS: SORTS, LABEL: LABEL, KEYS: KEYS,
    empty: empty, clone: clone, cleared: cleared, same: same,
    parse: parse, query: query,
    matches: matches, filter: filter, sort: sort, shown: shown,
    facets: facets, options: options, count: count, isOn: isOn,
    toggle: toggle, unset: unset,
    active: active, activeCount: activeCount, countWords: countWords, titleWords: titleWords, sortLabel: sortLabel,
    noteSpan: noteSpan, noteIndex: noteIndex, noteShape: noteShape,
    has: own
  };
})();
