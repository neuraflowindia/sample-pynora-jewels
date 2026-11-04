/* Product cards: builds the framed jewel card from the catalogue and fills the lists that ask for it.
   - Pynora.cards.render(product, {variant, eager, sizes, heading, reveal}) returns the card element (or null for
     an unknown piece). variant: "grid" (the default), "row" (a card in a sideways row: it never swipes its own
     pictures; on touch screens its dots step through them) or "narrow" (the 186 px gifts card: the short
     made-to-order pill). eager: load the first picture at once. sizes: the pictures' sizes attribute.
     hover: one of HOVERS below, to give this card that way of showing its worn picture (rarely needed).
   - How the worn picture (held in span.card__veil) appears on hover with a mouse: five ways, "veil", "dissolve",
     "curtain", "iris" and "sweep" (class card--hv-<way>, drawn by card.css). Each card of a list takes way
     (its place in the list + the list's own offset) mod 5, the offset coming from the list's name, so neighbours
     never share a way, rows do not all begin alike and a card shows the same way on every visit. Lists are given
     their ways when filled; cards placed by other scripts get theirs straight after (or on the first hover).
     data-hover="<way>" on a list, or on any element round it, gives the whole list that one way. (data-reveal,
     which once chose between two ways, no longer changes anything.)
   - Pynora.cards.fill(root): fills root from data-products="id,id,…" (in that order) or data-collection="slug"
     (the collection’s order), with data-variant, data-eager="4" (the first n pictures load at once) and
     data-sizes. A root that is a list gets one <li> per card (class "row__item" inside a row’s .track). A root
     with neither attribute fills every [data-cards] inside it. Unknown pieces are skipped. Every [data-cards]
     list of the page is filled when the page is ready.
   - The heart saves the piece to the wishlist ("Saved to your wishlist · View"); pressed again it takes it out
     ("Removed from your wishlist · Undo"). Every heart of the same piece stays in step.
   - Colour dots swap the card’s pictures to that colour (hover on laptops, tap on touch screens).
   - Without the catalogue nothing is drawn: the lists keep their size and the page’s words stay. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var doc = document;
  var SIZES = {
    grid: '(max-width: 760px) 46vw, (max-width: 1080px) 31vw, 290px',
    row: '(max-width: 760px) 260px, 280px',
    narrow: '(max-width: 760px) 200px, 186px'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function icon(name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  }
  function asProduct(p) { return typeof p === 'string' ? P.product(p) : (p || null); }
  function blocks() { return (P.cat && P.cat.blocks) || {}; }

  /* The pictures a card shows: those of the chosen colour, else the piece’s own order; at most three */
  function picsOf(p, ci) {
    var all = p.images || [];
    var cols = p.colours || [];
    if (!cols.length) return all.slice(0, 3);
    var c = cols[ci || 0] || cols[0];
    var ns = c.images || [];
    return all.filter(function (im) { return ns.indexOf(im.n) > -1; }).slice(0, 3);
  }
  function src(p, im, w) { return P.img(p, im.n, w); }

  /* ---------- Small parts (also used by the bag and the wishlist) ---------- */
  function statusPill(p, short) {
    var st = blocks().status || {};
    var ready = p.availability && p.availability.type === 'ready';
    var words = ready ? (st.ready && st.ready.short) || '' : (st.mto && st.mto.short) || '';
    var more = (!ready && !short && p.availability && p.availability.timeShort)
      ? '<span class="pill__more"> · ' + esc(p.availability.timeShort) + '</span>' : '';
    return '<span class="pill pill--' + (ready ? 'ready' : 'mto') + ' card__status">' + icon(ready ? 'truck' : 'spool') +
      '<span>' + esc(words) + more + '</span></span>';
  }
  function tagPill(p) {
    if (!p.tag) return '';
    var nw = p.tag === 'new';
    var word = nw ? 'New' : 'Founder’s pick';
    return '<span class="tag tag--' + esc(p.tag) + ' tag--icon-on-phone card__tag" title="' + word + '">' + icon(nw ? 'sparkle' : 'crown') + '<span class="tag__word">' + word + '</span></span>';
  }
  function starsAvg(p) {
    var r = p.reviews;
    if (!r || !r.count) return '';
    var avg = Number(r.average).toFixed(1);
    return '<span class="stars-avg" role="img" aria-label="Rated ' + avg + ' out of 5 from ' + r.count + ' reviews">' +
      icon('star', 'i--fill') + avg + '<span class="stars-avg__n">(' + r.count + ')</span></span>';
  }
  function colourDots(p) {
    var cols = p.colours || [];
    if (!cols.length) return '';
    return '<span class="cdots" role="group" aria-label="Colours of ' + esc(p.name) + '">' + cols.map(function (c, i) {
      return '<button class="cdot" type="button" style="--cdot:' + esc(c.swatch) + '" data-c="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="' + esc(c.name) + '" title="' + esc(c.name) + '"></button>';
    }).join('') + '</span>';
  }
  /* one fixed name; aria-pressed says whether the piece is saved (a toggle button never changes its name) */
  function heart(p, cls) {
    var on = P.state ? P.state.wish.has(p.id) : false;
    return '<button class="' + (cls || 'card__wish') + '" type="button" data-wish="' + esc(p.id) + '" aria-pressed="' + on + '" aria-label="' + esc('Save ' + p.name + ' to your wishlist') + '">' + icon('heart') + '</button>';
  }
  function link(p) { return P.url('product.html?p=' + encodeURIComponent(p.id)); }

  function media(p, variant, eager, sizes) {
    var ims = picsOf(p, 0);
    var imgs = ims.map(function (im, i) {
      var cls = i === 0 ? '' : i === 1 ? ' card__img--alt' : ' card__img--more';
      if (i === 0) cls += ' is-on';
      /* the third picture (and, in a sideways row, the second too) waits until it is asked for */
      var later = i === 2 || (variant === 'row' && i === 1 && !P.fine());
      var set = 'src="' + esc(src(p, im, 800)) + '" srcset="' + esc(P.srcset(p, im.n)) + '"';
      var load = later ? set.replace('src="', 'data-src="').replace('srcset="', 'data-srcset="') : set;
      var tag = '<img class="card__img' + cls + '" ' + load + ' sizes="' + esc(sizes) + '" alt="' + (i === 0 ? esc(im.alt) : '') +
        '" style="object-position:' + esc(im.focal || '50% 50%') + '" loading="' + (eager && i === 0 ? 'eager' : 'lazy') + '" decoding="async" data-k="' + im.n + '">';
      /* the worn picture comes into view inside its veil (the veil changes nothing on touch screens) */
      return i === 1 ? '<span class="card__veil">' + tag + '</span>' : tag;
    }).join('');
    var dots = ims.map(function (_, i) { return '<i' + (i === 0 ? ' class="on"' : '') + '></i>'; }).join('');
    var dotsEl = ims.length < 2 ? '' : variant === 'row'
      ? '<button class="card__dots" type="button" aria-label="Next picture of ' + esc(p.name) + '"><span class="card__dots-in">' + dots + '</span></button>'
      : '<span class="card__dots" aria-hidden="true">' + dots + '</span>';
    return '<div class="card__media"><a class="card__pic" href="' + esc(link(p)) + '" tabindex="-1" aria-hidden="true"><span class="card__track">' + imgs + '</span></a>' + dotsEl + '</div>';
  }

  /* ---------- How the worn picture appears on hover: five ways, never the same for neighbours ---------- */
  var HOVERS = ['veil', 'dissolve', 'curtain', 'iris', 'sweep'];
  var HV = /(^|\s)card--hv-/;

  function setHover(card, way) {
    HOVERS.forEach(function (w) { card.classList.remove('card--hv-' + w); });
    card.classList.add('card--hv-' + way);
  }
  /* a list's own offset, from its name, so that rows on one page do not all begin with the same way */
  function listOffset(list) {
    var key = list.getAttribute('aria-label') || list.getAttribute('data-collection') ||
      list.getAttribute('data-products') || list.id || list.className || '';
    var h = 0;
    for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
    return h % HOVERS.length;
  }
  function wayFor(list, n, off) {
    var forced = list.closest ? list.closest('[data-hover]') : null;
    var w = forced ? forced.getAttribute('data-hover') : '';
    return HOVERS.indexOf(w) > -1 ? w : HOVERS[(n + off) % HOVERS.length];
  }
  function listOf(card) {
    var up = card.parentElement;
    return up && up.tagName === 'LI' ? up.parentElement : up;
  }
  function cardsOf(list) {
    return Array.prototype.map.call(list.children, function (ch) {
      return ch.classList.contains('card') ? ch : ch.tagName === 'LI' ? ch.querySelector(':scope > .card') : null;
    }).filter(function (c) { return c && !c.classList.contains('card--slot'); });
  }
  /* gives a way to every card on the page that has none yet (cards placed by other scripts) */
  function assignAll() {
    P.$$('.card:not(.card--slot)').forEach(function (card) {
      if (HV.test(card.className)) return;
      var list = listOf(card);
      if (!list) return;
      var off = listOffset(list);
      cardsOf(list).forEach(function (c, n) { if (!HV.test(c.className)) setHover(c, wayFor(list, n, off)); });
    });
  }
  var assignTimer = 0;
  function assignSoon() {
    if (assignTimer) return;
    assignTimer = setTimeout(function () { assignTimer = 0; assignAll(); }, 0);
  }

  /* ---------- The card ---------- */
  function render(product, opts) {
    var p = asProduct(product);
    if (!p) return null;
    opts = opts || {};
    var variant = opts.variant === 'row' || opts.variant === 'narrow' ? opts.variant : 'grid';
    var sizes = opts.sizes || SIZES[variant];
    var h = opts.heading || 'h3';
    var el = doc.createElement('article');
    el.className = 'card' + (variant === 'grid' ? '' : ' card--' + variant);
    el.setAttribute('data-id', p.id);
    if (HOVERS.indexOf(opts.hover) > -1) setHover(el, opts.hover);
    else assignSoon();
    el.innerHTML = media(p, variant, !!opts.eager, sizes) + tagPill(p) + heart(p) +
      '<' + h + ' class="card__name"><a href="' + esc(link(p)) + '">' + esc(p.name) + '</a></' + h + '>' +
      '<p class="card__cap">' + esc(p.caption) + '</p>' +
      '<div class="card__meta"><span class="card__price">' + esc(P.inr(p.price)) + '</span>' + colourDots(p) + starsAvg(p) + '</div>' +
      statusPill(p, variant === 'narrow');
    wire(el);
    return el;
  }

  /* ---------- Filling a list ---------- */
  function fill(root) {
    if (!root || root.nodeType !== 1) return root;
    var ids = root.getAttribute('data-products');
    var slug = root.getAttribute('data-collection');
    if (ids == null && slug == null) {
      P.$$('[data-cards]', root).forEach(fill);
      return root;
    }
    if (!P.cat) return reserve(root, ids);
    var list = ids != null
      ? ids.split(',').map(function (s) { return P.product(s.trim()); }).filter(Boolean)
      : P.collection(slug);
    var max = parseInt(root.getAttribute('data-limit'), 10);
    if (max > 0) list = list.slice(0, max);
    var eager = parseInt(root.getAttribute('data-eager'), 10) || 0;
    var opts = {
      variant: root.getAttribute('data-variant') || root.getAttribute('data-cards') || 'grid',
      sizes: root.getAttribute('data-sizes') || ''
    };
    var isList = /^(UL|OL)$/.test(root.tagName);
    var itemClass = root.getAttribute('data-item-class') || (root.classList.contains('track') ? 'row__item' : '');
    var frag = doc.createDocumentFragment();
    var off = listOffset(root);
    list.forEach(function (p, n) {
      var card = render(p, { variant: opts.variant, sizes: opts.sizes || undefined, eager: n < eager, heading: root.getAttribute('data-heading') || 'h3', hover: wayFor(root, n, off) });
      if (!card) return;
      if (isList) {
        var li = doc.createElement('li');
        if (itemClass) li.className = itemClass;
        li.appendChild(card);
        frag.appendChild(li);
      } else frag.appendChild(card);
    });
    root.textContent = '';
    root.appendChild(frag);
    root.setAttribute('data-filled', '');
    if (P.rows && root.closest && root.closest('.row')) { try { P.rows.init(root.closest('.row')); } catch (e) { /* the row sets itself up */ } }
    return root;
  }

  /* Without the catalogue a list keeps the room of its cards, empty: unseen card shapes hold its size, so nothing
     below it moves and nothing half-made shows (a collection's count is unknown then: one row, or data-limit). */
  function reserve(root, ids) {
    if (root.hasAttribute('data-reserved')) return root;
    var max = parseInt(root.getAttribute('data-limit'), 10);
    var n = ids != null ? ids.split(',').filter(function (s) { return s.trim(); }).length : (max > 0 ? max : 4);
    if (max > 0) n = Math.min(n, max);
    var v = root.getAttribute('data-variant') || root.getAttribute('data-cards') || 'grid';
    var variant = v === 'row' || v === 'narrow' ? v : 'grid';
    var isList = /^(UL|OL)$/.test(root.tagName);
    var itemClass = root.getAttribute('data-item-class') || (root.classList.contains('track') ? 'row__item' : '');
    var shape = '<div class="card__media"></div><p class="card__name">&#160;</p><p class="card__cap">&#160;</p>' +
      '<div class="card__meta"><span class="card__price">&#160;</span></div><span class="pill pill--ready card__status">&#160;</span>';
    var frag = doc.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var el = doc.createElement('div');
      el.className = 'card card--slot' + (variant === 'grid' ? '' : ' card--' + variant);
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = shape;
      if (isList) {
        var li = doc.createElement('li');
        if (itemClass) li.className = itemClass;
        li.setAttribute('aria-hidden', 'true');
        li.appendChild(el);
        frag.appendChild(li);
      } else frag.appendChild(el);
    }
    root.appendChild(frag);
    root.setAttribute('data-reserved', '');
    return root;
  }

  /* ---------- Behaviour ---------- */
  function loadLater(card) {
    P.$$('img[data-src]', card).forEach(function (img) {
      img.srcset = img.getAttribute('data-srcset') || '';
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    });
  }
  function setDots(card, i, n) {
    P.$$('.card__dots i', card).forEach(function (d, k) {
      d.style.display = k < n ? '' : 'none';
      d.classList.toggle('on', k === i);
    });
  }
  function shownCount(card) {
    return P.$$('.card__img', card).filter(function (img) { return !img.classList.contains('is-out'); }).length;
  }

  function setColour(card, ci) {
    var p = P.product(card.getAttribute('data-id'));
    if (!p) return;
    var ims = picsOf(p, ci);
    P.$$('.cdot', card).forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === ci)); });
    var fade = P.reduced() ? 0 : 140;
    P.$$('.card__img', card).forEach(function (img, i) {
      var im = ims[i];
      if (!im) { img.classList.add('is-out'); img.classList.remove('is-on'); return; }
      img.classList.remove('is-out');
      img.classList.toggle('is-on', i === 0);
      if (img.getAttribute('data-k') === String(im.n)) return;
      img.setAttribute('data-k', String(im.n));
      img.style.opacity = '0';
      var swap = function () {
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        img.srcset = P.srcset(p, im.n);
        img.src = src(p, im, 800);
        img.alt = i === 0 ? (im.alt || '') : '';
        img.style.objectPosition = im.focal || '50% 50%';
        img.style.opacity = '';
      };
      if (fade) setTimeout(swap, fade); else swap();
    });
    setDots(card, 0, Math.min(ims.length, 3));
    var dots = P.$('.card__dots', card);
    if (dots) dots.hidden = ims.length < 2;
    var t = P.$('.card__track', card);
    if (t && t.scrollLeft) t.scrollLeft = 0;
  }

  /* a card in a sideways row, on touch screens: the dots step to the next picture */
  function stepRow(card) {
    loadLater(card);
    var imgs = P.$$('.card__img', card).filter(function (img) { return !img.classList.contains('is-out'); });
    if (imgs.length < 2) return;
    var at = 0;
    imgs.forEach(function (img, i) { if (img.classList.contains('is-on')) at = i; });
    var next = (at + 1) % imgs.length;
    imgs.forEach(function (img, i) { img.classList.toggle('is-on', i === next); });
    setDots(card, next, imgs.length);
  }

  function wire(card) {
    var track = P.$('.card__track', card);
    if (track && !card.classList.contains('card--row')) {
      track.addEventListener('scroll', function () {
        loadLater(card);
        var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        setDots(card, i, shownCount(card));
      }, { passive: true });
    }
  }

  function syncHearts(id) {
    if (!P.product(id)) return;
    var on = P.state.wish.has(id);
    P.$$('[data-wish="' + id + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function toggleWish(id) {
    var p = P.product(id);
    if (!p || !P.state) return;
    var list = P.state.wish.list();
    var at = list.indexOf(id);
    var on = P.state.wish.toggle(id);
    if (!P.toast) return;
    if (on) {
      P.toast.show({ icon: 'heart', text: 'Saved to your wishlist', action: { text: 'View', href: '#wishlist' } });
    } else {
      P.toast.show({ icon: 'heart', text: 'Removed from your wishlist', action: { text: 'Undo', onClick: function () { restoreWish(id, at); } } });
    }
  }
  /* puts a piece back in the wishlist where it was */
  function restoreWish(id, at) {
    var w = P.state.wish;
    if (w.has(id)) return;
    var list = w.list();
    if (at < 0 || at >= list.length) { w.add(id); return; }
    list.splice(at, 0, id);
    w.clear();
    list.forEach(function (x) { w.add(x); });
  }

  doc.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    if (!t) return;
    var w = t.closest('.card__wish[data-wish]');
    if (w) { e.preventDefault(); toggleWish(w.getAttribute('data-wish')); return; }
    var c = t.closest('.card .cdot');
    if (c) { e.preventDefault(); setColour(c.closest('.card'), parseInt(c.getAttribute('data-c'), 10) || 0); return; }
    var d = t.closest('button.card__dots');
    if (d) { e.preventDefault(); stepRow(d.closest('.card')); }
  });
  doc.addEventListener('mouseover', function (e) {
    if (!P.fine()) return;
    var k = e.target.closest && e.target.closest('.card');
    if (k && !HV.test(k.className) && !k.classList.contains('card--slot')) assignAll();
    var c = e.target.closest && e.target.closest('.card .cdot');
    if (!c) return;
    var card = c.closest('.card');
    card.classList.add('is-picking');
    if (c.getAttribute('aria-pressed') !== 'true') setColour(card, parseInt(c.getAttribute('data-c'), 10) || 0);
  });
  doc.addEventListener('mouseout', function (e) {
    var g = e.target.closest && e.target.closest('.card .cdots');
    if (g && !g.contains(e.relatedTarget)) g.closest('.card').classList.remove('is-picking');
  });

  P.on('wish:change', function (d) {
    if (d && d.id) syncHearts(d.id);
    else P.$$('[data-wish]').forEach(function (b) { syncHearts(b.getAttribute('data-wish')); });
  });

  P.cards = {
    render: render,
    fill: fill,
    /* parts shared with the bag and the wishlist */
    statusPill: statusPill,
    heart: heart,
    toggleWish: toggleWish,
    restoreWish: restoreWish
  };

  P.ready(function () {
    P.$$('[data-cards]').forEach(function (el) { if (!el.hasAttribute('data-filled')) fill(el); });
  });
})();
