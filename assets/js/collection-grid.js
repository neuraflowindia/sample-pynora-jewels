/* The Collection page's pieces: the grid of cards, "From the studio" (the note that completes the last row), the
   end line and the empty result. It also keeps the page's filter state and hands it to the shop bar.
   - Starts by itself when the page has [data-collection-grid] and the address names a known collection
     (?c= missing means "all"); an unknown collection is left to the page script's not-found state. Without the
     catalogue the grid keeps one row of room and says the pieces could not be shown.
   - The state lives in the address (Pynora.collectionState), written with replaceState, so Back leaves the page
     and a refresh keeps the choices. While the phone panel's state (#filters) is still in the address, the write
     waits until the panel has closed and taken its state away.
   - The note takes the places left in the last row (one, two or three), or a whole row after the first row; the
     first row is always pieces. Its shape follows the columns (4, 3, 2) and every filter result.
   - A change of filters or sort: the cards that stay glide to their new places (480 ms), new cards rise behind a
     top-down unveiling, 30 ms apart, the cards that go sink behind a bottom-up wipe (280 ms) and the note re-forms:
     the old shape wipes out and the new one wipes in, never stretched. With less motion everything is at once.
   - After every change: document "collection:change" {state, count, total}, the document title, and
     Pynora.motion.refresh().
   A classic script, loaded with defer after cards.js, collection-state.js and collection-bar.js. */
(function () {
  'use strict';

  var P = window.Pynora;
  var doc = document;
  if (!P || !P.collectionState) return;
  var S = P.collectionState;

  var box = doc.querySelector('[data-collection-grid]');
  if (!box) return;
  var endBox = doc.querySelector('[data-collection-end]');
  var barBox = doc.querySelector('[data-collection-bar]');

  var SHOP = 'Pynora Jewels & Decor';
  var EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  var EASE_OUT = 'cubic-bezier(0.55, 0.06, 0.68, 0.19)';
  var CLIP_OPEN = 'inset(-30px -30px -60px -30px round 22px)';
  /* the cards' pictures: a picture's frame is a quarter of the column (three on tablets, two on phones) less the
     gaps and the card's own frame; the column grows with wide screens (--wrap: 1,394 px at 1,920, 1,600 px from
     2,560). A square photograph fills the 4:5 frame by its height, so it is drawn 1.25 times the frame's width:
     every step is that drawn width, so the browser picks a file that stays sharp */
  var SIZES = '(max-width: 760px) 50vw, (max-width: 1080px) 32vw, ' +
    '(min-width: 1441px) calc(((min(1600px, 1240px + (100vw - 1440px) * 0.3214) - 84px) / 4 - 20px) * 1.25), 335px';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function icon(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function mq(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }
  function columns() { return mq('(max-width: 760px)') ? 2 : mq('(max-width: 1080px)') ? 3 : 4; }

  /* ---------- Without the catalogue: the words stay, one row of room is kept ---------- */
  if (!P.cat) {
    if (barBox) barBox.hidden = true;
    box.innerHTML = '<p class="cgr-none">Our pieces could not be shown just now. Please refresh the page, or ' +
      '<a class="tlink tlink--wa" href="' + esc(P.waLink('Hi Pynora, I’d like to see your pieces.')) + '" target="_blank" rel="noopener">ask us on WhatsApp</a>.</p>' +
      '<ul class="card-grid cgr-grid" data-cards data-collection="all" data-limit="' + columns() + '" aria-hidden="true"></ul>';
    return;
  }

  var start = S.parse(location.search);
  var id = start.c;
  var col = P.collectionInfo(id);
  if (!col) return;                      /* the page script shows "This collection has wandered off." */

  var pieces = P.collection(id);
  var total = pieces.length;
  var allCount = P.collection('all').length;
  var title = id === 'all' ? 'All pieces' : col.title;
  var state = start;
  var list = [];
  var cols = columns();
  var items = {};                        /* key (piece id, or "note:shape:span") -> its <li> */
  var firstDraw = true;

  /* ---------- The address and the title ---------- */
  var waitTimer = 0;
  function writeAddress() {
    clearTimeout(waitTimer);
    if (location.hash === '#filters') {  /* the phone panel is closing: write once its state has left the address */
      var tries = 0;
      var again = function () { waitTimer = setTimeout(function () { if (location.hash === '#filters' && ++tries < 40) again(); else if (location.hash !== '#filters') writeAddress(); }, 50); };
      again();
      return;
    }
    var q = '?' + S.query(state, location.search);
    if (q === location.search) return;
    try { history.replaceState(history.state, '', location.pathname + q + location.hash); } catch (e) { /* the address stays */ }
  }
  addEventListener('popstate', function () { if (waitTimer && location.hash !== '#filters') writeAddress(); });

  function setTitle() { doc.title = S.titleWords(title, state, list.length, total) + ' · ' + SHOP; }

  function emit(initial) {
    var detail = { state: S.clone(state), count: list.length, total: total, initial: !!initial };
    var ev;
    try { ev = new CustomEvent('collection:change', { detail: detail }); }
    catch (e) { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent('collection:change', false, false, detail); }
    doc.dispatchEvent(ev);
    if (P.motion && typeof P.motion.refresh === 'function') { try { P.motion.refresh(ul); } catch (e2) { /* the page stays still */ } }
  }

  /* ---------- The studio note ---------- */
  function quoteOf() {
    var q = col.quote, p = q && P.product(q.product);
    var r = p && ((p.reviews && p.reviews.items) || []).filter(function (x) { return x.name === q.name && x.rating === 5; })[0];
    if (r) return { r: r, p: p };
    /* the newest five-star review of the collection's pieces, in 30 words or fewer */
    var all = [];
    pieces.forEach(function (pc) { ((pc.reviews && pc.reviews.items) || []).forEach(function (x) { all.push({ r: x, p: pc }); }); });
    all = all.filter(function (x) { return x.r.rating === 5 && String(x.r.text).split(/\s+/).length <= 30; });
    all.sort(function (a, b) { return String(b.r.date).localeCompare(String(a.r.date)); });
    return all[0] || null;
  }
  var quote = quoteOf();
  var note = col.note || { title: 'Made in our Karnal studio', text: '' };
  var waHelp = P.waLink(col.ask ? 'Hi Pynora, I’d like some help choosing from your ' + col.ask + '.' : 'Hi Pynora, I’d like some help choosing a piece.');

  function stars5() {
    var five = '';
    for (var i = 0; i < 5; i++) five += icon('star', 'i--fill');
    return '<span class="stars cgr-note__stars" role="img" aria-label="Rated 5 out of 5">' + five + '<span class="stars__fill" style="width:100%">' + five + '</span></span>';
  }
  function noteHTML(shape) {
    var link = '<a class="tlink tlink--wa cgr-note__link" href="' + esc(waHelp) + '" target="_blank" rel="noopener">' + icon('wa') + 'Ask us on WhatsApp</a>';
    var mark = '<span class="cgr-note__mark" aria-hidden="true"><span class="orn-fan"></span></span>';
    var label = '<p class="cgr-note__label">From the studio</p>';
    var words = '<h3 class="cgr-note__title">' + esc(note.title) + '</h3><p class="cgr-note__text">' + esc(note.text) + '</p>';
    if (shape === 'one') return mark + label + words + link;
    var q = quote ? '<figure class="cgr-note__quote">' + stars5() + '<blockquote>“' + esc(quote.r.text) + '”</blockquote>' +
      '<figcaption><b>' + esc(quote.r.name) + '</b>, ' + esc(quote.r.city) + ', on the <a href="' + esc(P.url('product.html?p=' + encodeURIComponent(quote.p.id) + '#reviews')) + '">' + esc(quote.p.name) + '</a></figcaption></figure>' : '';
    var care = '<ul class="cgr-note__care" aria-label="How we look after you">' +
      '<li><span class="cgr-note__ic">' + icon('truck') + '</span><span><b>Free shipping</b> across India</span></li>' +
      '<li><span class="cgr-note__ic">' + icon('gift') + '</span><span><b>Our crimson box</b> with a free handwritten note</span></li>' +
      '<li><span class="cgr-note__ic">' + icon('circle-check') + '</span><span><b>Set by hand</b> and checked in Karnal</span></li></ul>';
    var rule = '<span class="cgr-note__rule" aria-hidden="true"></span>';
    var head = '<div class="cgr-note__part cgr-note__main"><div class="cgr-note__head">' + mark + label + '</div>' + words + link + '</div>';
    if (shape === 'two') return head + rule + '<div class="cgr-note__part">' + q + '</div>';
    if (shape === 'three') return head + rule + '<div class="cgr-note__part">' + q + '</div><div class="cgr-note__part cgr-note__base">' + care + '</div>';
    return head + rule + '<div class="cgr-note__part">' + q + '</div>' + rule + '<div class="cgr-note__part cgr-note__end">' + care + '</div>';
  }

  /* ---------- The list ---------- */
  box.innerHTML = '<ul class="card-grid cgr-grid" data-cards data-filled aria-label="' + esc(id === 'all' ? 'All pieces' : 'Pieces in ' + col.title) + '"></ul>' +
    '<div class="cgr-empty" hidden></div>';
  var ul = box.querySelector('.cgr-grid');
  var emptyBox = box.querySelector('.cgr-empty');

  function make(key, i) {
    var li = doc.createElement('li');
    li.setAttribute('data-key', key);
    li.setAttribute('data-row', '');
    if (key.indexOf('note:') === 0) {
      var parts = key.split(':'), shape = parts[1], span = parts[2];
      li.className = 'cgr-note-li' + (shape === 'band' ? ' is-band' : '');
      li.style.setProperty('--span', span);
      li.innerHTML = '<div class="cgr-note" role="note" aria-label="From the studio" data-shape="' + shape + '">' + noteHTML(shape) + '</div>';
    } else {
      var card = P.cards.render(P.product(key), { eager: firstDraw && i < cols, sizes: SIZES });
      if (card) li.appendChild(card);
    }
    items[key] = li;
    return li;
  }

  function om() {
    var v = parseFloat(getComputedStyle(doc.documentElement).getPropertyValue('--om'));
    return isFinite(v) && v > 0 ? v : 1;
  }
  function play(el, frames, opts, done) {
    var a = null;
    try { a = el.animate(frames, opts); } catch (e) { a = null; }
    if (!done) return a;
    var called = false;
    var finish = function () { if (!called) { called = true; done(); } };
    if (a) a.onfinish = finish;
    setTimeout(finish, (opts.duration || 0) + (opts.delay || 0) + 400);
    return a;
  }

  /* a card or note that leaves: held where it was (out of the flow) while it sinks behind a bottom-up wipe */
  function leave(li, b, g, isNote) {
    li.removeAttribute('data-row');
    li.setAttribute('aria-hidden', 'true');
    li.inert = true;
    li.classList.add('cgr-leaving');
    li.style.left = (b.left - g.left) + 'px';
    li.style.top = (b.top - g.top) + 'px';
    li.style.width = b.width + 'px';
    li.style.height = b.height + 'px';
    var frames = isNote
      ? [{ clipPath: CLIP_OPEN }, { clipPath: 'inset(-30px calc(100% + 30px) -60px -30px round 22px)' }]
      : [{ transform: 'none', clipPath: CLIP_OPEN }, { transform: 'translateY(' + (16 * om()) + 'px)', clipPath: 'inset(-30px -30px calc(100% + 60px) -30px round 22px)' }];
    play(li, frames, { duration: 280, easing: EASE_OUT, fill: 'forwards' }, function () { li.remove(); });
  }
  /* a card that stays: from its old place to its new one (added to the scroll arrival's own transform) */
  function glide(li, dx, dy) {
    var frames = [{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'translate(0, 0)' }];
    var a = null;
    try { a = li.animate(frames, { duration: 480, easing: EASE, composite: 'add' }); } catch (e) { a = null; }
    if (!a) play(li, frames, { duration: 480, easing: EASE });
  }
  /* a new card rises 24 px behind a top-down unveiling; a new note shape wipes in from its leading edge */
  function arrive(li, isNote, n) {
    if (isNote) {
      play(li, [{ clipPath: 'inset(-30px calc(100% + 30px) -60px -30px round 22px)' }, { clipPath: CLIP_OPEN }],
        { duration: 620, delay: 240, easing: EASE, fill: 'backwards' });
      return;
    }
    li.classList.add('cgr-new');
    play(li, [{ transform: 'translateY(' + (24 * om()) + 'px)', clipPath: 'inset(-30px -30px calc(100% + 30px) -30px round 22px)' },
      { transform: 'none', clipPath: CLIP_OPEN }], { duration: 560, delay: 90 + n * 30, easing: EASE, fill: 'backwards' });
  }

  /* where every card and the note are on screen now (before a change) */
  function snapshot() {
    var before = {};
    Object.keys(items).forEach(function (k) { before[k] = items[k].getBoundingClientRect(); });
    return { before: before, end: endBox && !endBox.hidden ? endBox.getBoundingClientRect() : null };
  }
  function onScreen(r, H) { return !!r && r.width > 0 && r.bottom > 0 && r.top < H; }

  /* draw(snap): place the list; with a snapshot taken before the change, animate from it */
  function draw(snap) {
    cols = columns();
    var motion = !!snap && !P.reduced() && typeof ul.animate === 'function';
    var keys = list.map(function (p) { return p.id; });
    if (list.length) {
      var s = S.noteSpan(list.length, cols);
      keys.splice(S.noteIndex(list.length, cols, s), 0, 'note:' + S.noteShape(s, cols) + ':' + s);
    }
    var before = motion ? snap.before : {};
    var H = innerHeight;
    var focused = ul.contains(doc.activeElement) ? doc.activeElement : null;

    /* the ones that go: out of the flow at once, placed where they were once the rest has settled */
    var going = [];
    Object.keys(items).forEach(function (k) {
      if (keys.indexOf(k) > -1) return;
      var li = items[k];
      delete items[k];
      if (motion && onScreen(before[k], H)) { going.push({ li: li, b: before[k], note: k.indexOf('note:') === 0 }); li.classList.add('cgr-leaving'); }
      else li.remove();
    });
    /* order: the leaving ones first (painted under the rest), then the list */
    var order = going.map(function (x) { return x.li; }).concat(keys.map(function (k, i) { return items[k] || make(k, i); }));
    order.forEach(function (li, i) {
      var at = ul.children[i];
      if (at !== li) ul.insertBefore(li, at || null);
    });
    while (ul.children.length > order.length) ul.removeChild(ul.lastElementChild);
    if (focused && !focused.isConnected) focused = null;
    if (focused && doc.activeElement !== focused) { try { focused.focus({ preventScroll: true }); } catch (e) { /* focus stays where it is */ } }

    /* a visitor deep in the grid (the bar held as the capsule) is brought back to the start of the new result */
    if (snap && P.collectionBar && P.collectionBar.anchor) {
      var y = P.collectionBar.anchor();
      if (y != null) { try { window.scrollTo({ top: y, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); } }
    }

    if (motion) {
      var g = ul.getBoundingClientRect(), n = 0;
      going.forEach(function (x) { leave(x.li, x.b, g, x.note); });
      keys.forEach(function (k) {
        var li = items[k], b = before[k];
        var a = li.getBoundingClientRect();
        if (!onScreen(a, H)) return;
        if (onScreen(b, H)) {
          var dx = Math.round(b.left - a.left), dy = Math.round(b.top - a.top);
          if (dx || dy) glide(li, dx, dy);
        } else {
          arrive(li, k.indexOf('note:') === 0, n++);   /* new, or coming from out of sight: it arrives */
        }
      });
    }

    /* the empty result: only an address can lead here (a choice that would show nothing is greyed) */
    if (!list.length) {
      emptyBox.innerHTML = '<span class="cgr-empty__ic">' + icon('sparkle') + '</span>' +
        '<h3 class="cgr-empty__title">' + esc(id === 'all' ? 'Nothing in the shop with these choices just now.' : 'Nothing in ' + col.title + ' with these choices just now.') + '</h3>' +
        '<p class="cgr-empty__text">Take one filter away, or tell us what you are looking for on WhatsApp and we will suggest something.</p>' +
        '<div class="cgr-empty__acts"><button class="btn btn--main btn--compact" type="button" data-cgr-clear>Clear all filters</button>' +
        '<a class="tlink tlink--wa" href="' + esc(P.waLink(col.ask ? 'Hi Pynora, I’m looking for something in your ' + col.ask + '. What would you suggest?' : 'Hi Pynora, I’m looking for a piece. What would you suggest?')) + '" target="_blank" rel="noopener">' + icon('wa') + 'Ask us on WhatsApp</a></div>';
      emptyBox.hidden = false;
      ul.hidden = true;
    } else if (!emptyBox.hidden) {
      emptyBox.hidden = true;
      emptyBox.textContent = '';
      ul.hidden = false;
    }

    /* the end line */
    if (endBox) {
      var whole = list.length === total;
      endBox.hidden = !list.length;
      endBox.innerHTML = list.length ? '<span class="orn-rule cgr-end__rule" aria-hidden="true"><span class="orn-fan"></span></span>' +
        '<p class="cgr-end__line">You’ve seen ' + (whole ? 'all ' + plural(total, 'piece', 'pieces') : list.length + ' of ' + total + ' pieces') +
        (id === 'all' ? '' : ' in ' + esc(title)) + '.</p>' +
        (id === 'all' ? '' : '<a class="tlink cgr-end__all" href="' + esc(P.url('collection.html?c=all')) + '">See all ' + allCount + ' pieces' + icon('arrow') + '</a>') : '';
      /* it follows the grid to its new length instead of jumping there */
      if (motion && snap.end && !endBox.hidden) {
        var e = endBox.getBoundingClientRect(), edy = Math.round(snap.end.top - e.top);
        if (edy && onScreen(e, H)) play(endBox, [{ transform: 'translateY(' + edy + 'px)' }, { transform: 'none' }], { duration: 480, easing: EASE });
      }
    }
    firstDraw = false;
  }

  /* ---------- Applying a state (the bar and the empty result call this) ---------- */
  function apply(next, opts) {
    opts = opts || {};
    if (S.same(next, state) && !opts.force) return;
    var animate = opts.animate !== false;
    var snap = animate ? snapshot() : null;
    state = S.clone(next);
    list = S.shown(pieces, state);
    writeAddress();
    setTitle();
    /* the bar first (its row of tags may change height), then the grid, so the cards glide to where they end up */
    if (P.collectionBar) P.collectionBar.update(state, list.length, animate);
    draw(snap);
    emit(false);
  }

  box.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-cgr-clear]') : null;
    if (!t) return;
    apply(S.cleared(state), { animate: true });
    if (P.collectionBar && P.collectionBar.focusStart) P.collectionBar.focusStart();
  });

  var ctx = {
    id: id, collection: col, title: title, pieces: pieces, total: total, grid: ul,
    state: function () { return S.clone(state); },
    count: function () { return list.length; },
    set: function (next, opts) { apply(next, opts); }
  };

  /* ---------- Start ---------- */
  list = S.shown(pieces, state);
  writeAddress();                        /* unknown values leave the address */
  setTitle();
  draw(null);
  if (P.collectionBar) P.collectionBar.mount(ctx);
  P.collectionGrid = ctx;

  /* a new number of columns: the note takes its new shape and place at once */
  var rt = 0;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (columns() === cols) return;
      draw(null);
      if (P.motion && typeof P.motion.refresh === 'function') { try { P.motion.refresh(ul); } catch (e) { /* the page stays still */ } }
    }, 120);
  });
  P.ready(function () { emit(true); });
})();
