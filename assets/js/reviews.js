/* Review cards: one customer review with its stars, words, who wrote it and the piece it is about.
   - Pynora.reviews.card(review, product) returns an <article class="rcard"> (review: a record from a piece’s
     reviews.items; product: the piece’s record or its id). Words go in as text, never as markup.
   - Pynora.reviews.find(productId, name) returns that piece’s review by that name, or null.
   - Pynora.reviews.fill(root) fills every [data-reviews="piece-id:Name,piece-id:Name"] inside root (a list gets
     one <li class="row__item"> per card). Pieces or names that are missing are skipped and listed in
     data-reviews-missing. Each list is filled once; the page’s own lists are filled when it is ready. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var doc = document;
  var SVG = 'http://www.w3.org/2000/svg';

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function icon(name, extra) {
    var s = doc.createElementNS(SVG, 'svg');
    s.setAttribute('class', 'i' + (extra ? ' ' + extra : ''));
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    var u = doc.createElementNS(SVG, 'use');
    u.setAttribute('href', '#i-' + name);
    s.appendChild(u);
    return s;
  }

  function fiveStars(into) {
    for (var i = 0; i < 5; i++) into.appendChild(icon('star', 'i--fill'));
    return into;
  }

  function asProduct(p) { return typeof p === 'string' ? P.product(p) : (p || null); }

  /* the picture a card shows: the piece’s card picture, else its first */
  function cardPicture(p) {
    var list = p.images || [];
    for (var i = 0; i < list.length; i++) if (list[i].role === 'card') return list[i].n;
    return 1;
  }

  function card(review, product) {
    var p = asProduct(product);
    if (!review || !p) return null;
    var rating = Math.max(0, Math.min(5, Number(review.rating) || 0));

    var art = el('article', 'rcard');

    /* stars and the verified mark */
    var top = el('div', 'rcard__top');
    var stars = fiveStars(el('span', 'stars'));
    stars.setAttribute('aria-hidden', 'true');
    var fill = fiveStars(el('span', 'stars__fill'));
    fill.style.width = (rating / 5 * 100) + '%';
    stars.appendChild(fill);
    top.appendChild(stars);
    top.appendChild(el('span', 'vh', 'Rated ' + rating + ' out of 5.'));
    if (review.verified !== false) {
      var ver = el('span', 'rcard__ver');
      ver.appendChild(icon('badge'));
      ver.appendChild(doc.createTextNode('Verified buyer'));
      top.appendChild(ver);
    }
    art.appendChild(top);

    /* the review */
    var quote = el('blockquote', 'rcard__text');
    quote.appendChild(el('p', null, review.text || ''));
    art.appendChild(quote);

    /* who wrote it and the piece */
    var by = el('footer', 'rcard__by');
    var src = P.img(p, cardPicture(p), 80);
    var img = el('img', 'rcard__pic');
    img.alt = '';
    img.width = 40;
    img.height = 40;
    img.loading = 'lazy';
    img.decoding = 'async';
    if (src) img.src = src;
    by.appendChild(img);

    var who = el('div', 'rcard__who');
    var name = el('p', 'rcard__name', review.name || '');
    if (review.city) name.appendChild(el('span', 'rcard__city', ' · ' + review.city));
    who.appendChild(name);
    var link = el('a', 'rcard__piece', p.name);
    link.href = P.url('product.html?p=' + encodeURIComponent(p.id) + '#reviews');
    who.appendChild(link);
    by.appendChild(who);
    art.appendChild(by);

    return art;
  }

  function find(productId, name) {
    var p = asProduct(productId);
    var items = (p && p.reviews && p.reviews.items) || [];
    for (var i = 0; i < items.length; i++) if (items[i].name === name) return items[i];
    return null;
  }

  function fillOne(box) {
    if (box.hasAttribute('data-reviews-filled')) return;
    var list = /^(UL|OL)$/.test(box.tagName);
    var missing = [];
    var frag = doc.createDocumentFragment();
    (box.getAttribute('data-reviews') || '').split(',').forEach(function (pair) {
      pair = pair.trim();
      if (!pair) return;
      var at = pair.indexOf(':');
      var id = (at < 0 ? pair : pair.slice(0, at)).trim();
      var who = at < 0 ? '' : pair.slice(at + 1).trim();
      var p = P.product(id);
      var r = p && find(p, who);
      var c = r && card(r, p);
      if (!c) { missing.push(pair); return; }
      if (list) {
        var li = el('li', 'row__item');
        li.appendChild(c);
        frag.appendChild(li);
      } else {
        frag.appendChild(c);
      }
    });
    box.appendChild(frag);
    box.setAttribute('data-reviews-filled', '');
    if (missing.length) box.setAttribute('data-reviews-missing', missing.join(','));
    else box.removeAttribute('data-reviews-missing');
  }

  /* Without the catalogue a list keeps the room of its cards, empty: unseen card shapes hold its size */
  function reserve(box) {
    if (box.hasAttribute('data-reviews-filled') || box.hasAttribute('data-reserved')) return;
    var list = /^(UL|OL)$/.test(box.tagName);
    var n = (box.getAttribute('data-reviews') || '').split(',').filter(function (s) { return s.trim(); }).length;
    for (var i = 0; i < n; i++) {
      var c = el('article', 'rcard rcard--slot');
      c.setAttribute('aria-hidden', 'true');
      if (list) {
        var li = el('li', 'row__item');
        li.setAttribute('aria-hidden', 'true');
        li.appendChild(c);
        box.appendChild(li);
      } else box.appendChild(c);
    }
    box.setAttribute('data-reserved', '');
  }

  function fill(root) {
    root = root || doc;
    var boxes = P.$$('[data-reviews]', root);
    if (root.nodeType === 1 && root.hasAttribute('data-reviews')) boxes.unshift(root);
    if (!P.cat) { boxes.forEach(reserve); return; }
    boxes.forEach(fillOne);
  }

  P.reviews = { card: card, find: find, fill: fill };

  P.ready(function () { fill(doc); });
})();
