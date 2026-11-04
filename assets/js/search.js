/* Search (#search): finds pieces as you type and moves through them with the arrow keys.
   - From 2 letters, 120 ms after the last key. Matching ignores case and accents (décor = decor) and looks at each
     piece's name, caption, category and collection titles, colour families and colour names, its meaning when the
     catalogue has one, and a small word list (jhumka, haar, choker, moti, elephant…). Every word typed must match
     the start of a word there; "sets" also finds "set". Pieces whose name matches come first.
   - Before typing, the new pieces are shown. When nothing matches: "No pieces match “…”" with a WhatsApp link.
   - The count is announced in a polite live region ("3 pieces found").
   - ↓ from the field goes to the first piece, ↓ ↑ move between pieces, ↑ from the first returns to the field,
     Enter in the field goes to the first piece; Esc closes (overlay.js). A popular search fills the field. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;
  var doc = document;
  var MIN = 2;
  var PAUSE = 120;

  /* words people use for these pieces, and the words they should find */
  var WORDS = {
    jhumka: ['jhumka'],
    chandbali: ['chandbali'],
    haar: ['necklace'],
    choker: ['collar', 'hasli'],
    clutch: ['bag', 'potli'],
    potli: ['potli'],
    sindoor: ['sindoor'],
    box: ['box'],
    bee: ['bee', 'bhanwra'],
    deer: ['deer', 'hiran'],
    elephant: ['elephant', 'gaj'],
    polki: ['polki'],
    kundan: ['kundan'],
    pearl: ['pearl'],
    moti: ['pearl'],
    red: ['red'],
    green: ['green']
  };

  /* ---------- Matching ---------- */
  function fold(s) {
    s = String(s == null ? '' : s).toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function words(s) { var f = fold(s); return f ? f.split(' ') : []; }

  var index = null;
  function build() {
    index = [];
    var cat = P.cat;
    if (!cat || !cat.products) return;
    cat.products.forEach(function (p, i) {
      var more = [];
      function add(s) { more = more.concat(words(s)); }
      var c = P.collectionInfo(p.category);
      add(c ? c.title : p.category);
      (p.collections || []).forEach(function (id) { var x = P.collectionInfo(id); if (x) add(x.title); });
      (p.tones || []).forEach(add);
      (p.colours || []).forEach(function (col) { add(col.name); add(col.family); });
      if (p.meaning) add(p.meaning);
      index.push({ p: p, i: i, name: words(p.name), cap: words(p.caption), more: more });
    });
  }

  function forms(w) {
    var list = [w];
    if (w.length > 3 && /s$/.test(w)) list.push(w.slice(0, -1));
    if (w.length > 4 && /es$/.test(w)) list.push(w.slice(0, -2));
    Object.keys(WORDS).forEach(function (k) {
      if (k === w || (w.length >= 3 && k.indexOf(w) === 0)) list = list.concat(WORDS[k]);
    });
    return list;
  }
  function has(tokens, list) {
    for (var t = 0; t < tokens.length; t++) {
      for (var f = 0; f < list.length; f++) if (tokens[t].indexOf(list[f]) === 0) return true;
    }
    return false;
  }
  function find(q) {
    if (!index) build();
    var ws = words(q);
    if (!ws.length) return [];
    var wanted = ws.map(forms);
    var found = [];
    index.forEach(function (e) {
      var score = 0;
      for (var k = 0; k < wanted.length; k++) {
        var s = has(e.name, wanted[k]) ? 3 : has(e.cap, wanted[k]) ? 2 : has(e.more, wanted[k]) ? 1 : 0;
        if (!s) return;
        score += s;
      }
      found.push({ e: e, score: score });
    });
    found.sort(function (a, b) { return (b.score - a.score) || (a.e.i - b.e.i); });
    return found.map(function (x) { return x.e.p; });
  }

  /* ---------- The sheet ---------- */
  P.ready(function () {
    var el = P.$('[data-overlay="search"]');
    if (!el) return;
    var input = P.$('.search__input', el);
    var list = P.$('[data-search-results]', el);
    var label = P.$('.search__found .search__k', el);
    var none = P.$('[data-search-none]', el);
    var term = P.$('[data-search-term]', el);
    var status = P.$('[data-search-status]', el);
    if (!input || !list) return;

    var timer = 0;
    var shown = null;          /* the folded query last drawn ('' for the new pieces) */

    function piece(p) {
      var li = doc.createElement('li');
      var a = doc.createElement('a');
      a.className = 'search__hit';
      a.href = P.url('product.html?p=' + encodeURIComponent(p.id));
      var img = doc.createElement('img');
      img.src = P.img(p, 1, 160);
      img.alt = '';
      img.width = 56;
      img.height = 70;
      img.loading = 'lazy';
      img.decoding = 'async';
      var w = doc.createElement('span');
      var n = doc.createElement('span');
      n.className = 'search__name';
      n.textContent = p.name;
      var c = doc.createElement('span');
      c.className = 'search__cap';
      c.textContent = p.caption || '';
      w.appendChild(n);
      w.appendChild(c);
      var pr = doc.createElement('span');
      pr.className = 'search__price';
      pr.textContent = P.inr(p.price);
      a.appendChild(img);
      a.appendChild(w);
      a.appendChild(pr);
      li.appendChild(a);
      return li;
    }

    function draw(items) {
      list.textContent = '';
      var frag = doc.createDocumentFragment();
      items.forEach(function (p) { frag.appendChild(piece(p)); });
      list.appendChild(frag);
      list.hidden = !items.length;
    }

    function say(text) {
      if (!status) return;
      status.textContent = '';
      if (text) setTimeout(function () { status.textContent = text; }, 30);
    }

    function render(force) {
      var q = input.value;
      var f = fold(q);
      if (f.length < MIN) f = '';
      if (!force && f === shown) return;
      shown = f;
      if (!f) {
        var fresh = P.collection('new');
        if (label) { label.textContent = 'New pieces'; label.hidden = !fresh.length; }
        if (none) none.hidden = true;
        draw(fresh);
        say('');
        return;
      }
      var found = find(q);
      if (found.length) {
        var count = found.length + (found.length === 1 ? ' piece found' : ' pieces found');
        if (label) { label.textContent = count; label.hidden = false; }
        if (none) none.hidden = true;
        draw(found);
        say(count);
      } else {
        if (label) { label.textContent = 'No pieces found'; label.hidden = true; }
        if (term) term.textContent = q.trim();
        if (none) none.hidden = false;
        draw([]);
        say('No pieces found');
      }
    }

    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { render(false); }, PAUSE);
    });

    function hits() { return P.$$('.search__hit', list); }
    function focusEl(n) { if (n) { try { n.focus({ preventScroll: false }); } catch (e) { n.focus(); } } }

    el.addEventListener('keydown', function (e) {
      var t = e.target;
      var all = hits();
      if (t === input) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          clearTimeout(timer);
          render(false);
          all = hits();
          if (all.length) { e.preventDefault(); focusEl(all[0]); }
          else if (e.key === 'Enter') e.preventDefault();
        }
        return;
      }
      var i = all.indexOf(t);
      if (i < 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (i < all.length - 1) focusEl(all[i + 1]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusEl(i > 0 ? all[i - 1] : input);
      }
    });

    /* a popular search fills the field */
    P.$$('[data-term]', el).forEach(function (chip) {
      chip.addEventListener('click', function () {
        input.value = chip.getAttribute('data-term');
        clearTimeout(timer);
        render(false);
        focusEl(input);
      });
    });

    /* the hint in the empty field is shortened when the field is too narrow to show all of it (small phones) */
    var hints = [input.getAttribute('placeholder') || '', 'Search necklaces, earrings…', 'Search the shop…'];
    var ruler = null;
    function fitHint() {
      var room = input.clientWidth;
      if (!room || !hints[0]) return;
      if (!ruler) ruler = doc.createElement('canvas').getContext('2d');
      var cs = getComputedStyle(input);
      ruler.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      for (var i = 0; i < hints.length; i++) {
        if (ruler.measureText(hints[i]).width <= room - 2 || i === hints.length - 1) { input.setAttribute('placeholder', hints[i]); return; }
      }
    }
    window.addEventListener('resize', function () { if (P.overlay && P.overlay.isOpen && P.overlay.isOpen('search')) fitHint(); });

    /* the kept scroll-bar room beside the sheet shows the sheet's paper down to its foot (drawer.css) */
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        doc.documentElement.style.setProperty('--search-h', el.offsetHeight + 'px');
      }).observe(el);
    }

    if (P.overlay) {
      P.overlay.register('search', {
        initialFocus: function () { return input; },
        onOpen: function () {
          fitHint();
          render(true);
          if (input.value) { try { input.select(); } catch (e) { /* nothing to select */ } }
        },
        onClose: function () { clearTimeout(timer); say(''); }
      });
    }
    render(true);
  });

  P.search = { find: find };
})();
