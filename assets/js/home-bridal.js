/* The Bridal Edit and the Vantara trio: their small rows of pieces, filled from the catalogue.
   - The edit card: every <ul class="brd__rows" data-collection="…"> gets one row per piece of that collection
     (a small picture, the name and the price, linking to the piece). On phones the same rows are drawn as a
     sideways row of small cards (home-bridal.css).
   - The Vantara trio: <ul class="bento__trio" data-collection="vantara" data-pictures="3,6,2"
     data-captions="The bee|The deer|The elephant"> gets the pieces of the collection in order, each with the
     picture named in data-pictures and the label from data-captions under it.
   Lists keep their size before they are filled; without the catalogue they stay empty at that size. A piece
   the catalogue does not know is left out. Each list is filled once (data-filled). */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function productLink(p) {
    return P.url('product.html?p=' + encodeURIComponent(p.id));
  }

  /* the piece's card picture (role "card"), else its first */
  function cardNumber(p) {
    for (var i = 0; i < (p.images || []).length; i++) if (p.images[i].role === 'card') return p.images[i].n;
    return 1;
  }

  /* srcset of the picture's small files only (up to `max` px wide) */
  function smallSet(p, n, max) {
    var pic = P.pic(p, n);
    if (!pic) return '';
    return (pic.widths || []).filter(function (w) { return w <= max; }).sort(function (a, b) { return a - b; })
      .map(function (w) { return P.img(p, n, w) + ' ' + w + 'w'; }).join(', ');
  }

  /* ---------- The edit card ---------- */
  function editRow(p) {
    var n = cardNumber(p);
    var li = make('li');
    var a = make('a', 'brd__row');
    a.href = productLink(p);
    var img = make('img', 'brd__thumb');
    img.src = P.img(p, n, 160);
    var set = smallSet(p, n, 320);
    if (set) { img.srcset = set; img.sizes = '(max-width: 760px) 50px, 60px'; }
    img.width = 48;
    img.height = 60;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    a.appendChild(img);
    a.appendChild(make('span', 'brd__name', p.name));
    a.appendChild(make('span', 'brd__price', P.inr(p.price)));
    li.appendChild(a);
    return li;
  }

  function fillEdit(list) {
    if (list.hasAttribute('data-filled')) return;
    var pieces = P.collection(list.getAttribute('data-collection'));
    if (!pieces.length) return;
    var frag = document.createDocumentFragment();
    pieces.forEach(function (p) { frag.appendChild(editRow(p)); });
    list.textContent = '';
    list.appendChild(frag);
    list.setAttribute('data-filled', '');
  }

  /* ---------- The Vantara trio ---------- */
  /* how much wider than its 4:5 frame a picture is drawn (a square picture fills the frame by its height) */
  function widthFactor(pic) {
    var r = Number(pic && pic.ratio) || 0.8;
    return Math.max(1, Math.round(r * 1.25 * 100) / 100);
  }

  function trioItem(p, n, caption) {
    var pic = P.pic(p, n);
    var f = widthFactor(pic);
    var li = make('li', 'bento__v');
    var a = make('a', 'bento__vitem');
    a.href = productLink(p);
    var frame = make('span', 'bento__vpic');
    frame.setAttribute('data-layer', 'pic');
    var img = make('img');
    img.src = P.img(p, n, 320);
    var set = P.srcset(p, n);
    if (set) {
      img.srcset = set;
      img.sizes = '(max-width: 760px) calc((100vw - 84px) / 3 * ' + f + '), (max-width: 1079px) calc(clamp(118px, 15vw, 150px) * ' + f + '), calc(clamp(120px, 11vw, 160px) * ' + f + ')';
    }
    img.width = 160;
    img.height = 200;
    img.alt = p.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    if (pic && pic.focal) img.style.objectPosition = pic.focal;
    frame.appendChild(img);
    a.appendChild(frame);
    if (caption) a.appendChild(make('span', 'bento__vcap', caption));
    li.appendChild(a);
    return li;
  }

  function fillTrio(list) {
    if (list.hasAttribute('data-filled')) return;
    var pieces = P.collection(list.getAttribute('data-collection'));
    if (!pieces.length) return;
    var nums = (list.getAttribute('data-pictures') || '').split(',').map(function (s) { return Number(s) || 1; });
    var caps = (list.getAttribute('data-captions') || '').split('|');
    var frag = document.createDocumentFragment();
    pieces.forEach(function (p, i) { frag.appendChild(trioItem(p, nums[i] || 1, (caps[i] || '').trim())); });
    list.textContent = '';
    list.appendChild(frag);
    list.setAttribute('data-filled', '');
  }

  P.ready(function () {
    if (!P.cat) return;
    P.$$('.brd__rows[data-collection]').forEach(fillEdit);
    P.$$('.bento__trio[data-collection]').forEach(fillTrio);
  });
})();
