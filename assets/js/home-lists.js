/* Home: the lists of pieces that cards.js does not build.
   - The jewel ribbon ([data-rib-list]): every piece in catalogue order, each with its card picture in a small
     circle, its short name and what the name means, linking to its product page. Filled once; without the
     catalogue the strip stays empty at its height.
   - "Just arrived": once cards.js has filled the list, each card's list item is marked as its own layer
     (data-layer="card") so the cards can be set in place one by one. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- The jewel ribbon ---------- */
  function ribbonItem(p) {
    var pic = P.pic(p, 1) || {};
    var href = P.url('product.html?p=' + encodeURIComponent(p.id));
    return '<li class="rib__li">' +
      '<a class="rib__it" href="' + esc(href) + '">' +
        '<span class="rib__th"><img src="' + esc(P.img(p, 1, 88)) + '" alt="" width="44" height="44" decoding="async" style="object-position:' + esc(pic.focal || '50% 50%') + '"></span>' +
        '<span class="line"><span class="line__in rib__nm">' + esc(p.shortName || p.name) + '</span></span>' +
        '<span class="vh">, </span>' +
        '<span class="line"><span class="line__in rib__mn">' + esc(p.meaning) + '</span></span>' +
      '</a>' +
      '<span class="orn-flower rib__sep" aria-hidden="true"></span>' +
    '</li>';
  }

  function fillRibbon(list) {
    if (!list || list.hasAttribute('data-filled') || !P.cat || !P.cat.products) return;
    var html = P.cat.products.filter(function (p) { return p && p.id && p.meaning; }).map(ribbonItem).join('');
    if (!html) return;
    list.innerHTML = html;
    list.setAttribute('data-filled', '');
  }

  /* ---------- "Just arrived": each card its own layer ---------- */
  function markCards(list) {
    P.$$('.new__item', list).forEach(function (li) {
      if (!li.hasAttribute('data-layer')) li.setAttribute('data-layer', 'card');
    });
  }

  function watchCards(list) {
    markCards(list);
    if (window.MutationObserver) new MutationObserver(function () { markCards(list); }).observe(list, { childList: true });
  }

  P.ready(function () {
    P.$$('[data-rib-list]').forEach(fillRibbon);
    P.$$('.new__list').forEach(watchCards);
  });
})();
