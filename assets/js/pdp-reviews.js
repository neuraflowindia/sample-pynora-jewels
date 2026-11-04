/* The reviews block of the product page: what clients say about one piece.
   Pynora.pdpReviews.render(el, product, {all}) fills el (a .rvb panel) with:
     - the average (Tiro), five stars filled to it and "N reviews", beside a bar for each star (5★ to 1★);
     - the reviews, newest first: stars, name, "City · 1 Nov 2026", "Verified buyer", an optional title, the words
       and Team Pynora's reply in a champagne panel; five are shown unless {all: true};
     - "Show all N reviews" when there are more than five: pressed, the rest appear in place and focus moves to the
       sixth review.
   Returns el. A piece without reviews leaves el empty. A classic script, loaded with defer after core.js. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var SHOWN = 5;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function icon(name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  }
  function stars(value) {
    var five = '';
    for (var i = 0; i < 5; i++) five += icon('star', 'i--fill');
    var pct = Math.max(0, Math.min(100, value / 5 * 100));
    return '<span class="stars" aria-hidden="true">' + five + '<span class="stars__fill" style="width:' + pct.toFixed(1) + '%">' + five + '</span></span>';
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  /* "2026-11-01" → "1 Nov 2026" (from the written date, so no time zone can move it a day) */
  function dateText(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return '';
    return Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1];
  }
  function newestFirst(items) {
    return items.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }

  function itemHTML(r) {
    var when = [r.city, dateText(r.date)].filter(Boolean).join(' · ');
    return '<li class="rvb__item">' +
      '<div class="rvb__who">' + stars(r.rating) + '<span class="vh">Rated ' + r.rating + ' out of 5. </span>' +
        '<b class="rvb__name">' + esc(r.name) + '</b>' +
        '<span class="rvb__when">' + esc(when) + '</span>' +
        (r.verified ? '<span class="rvb__ver">' + icon('badge') + 'Verified buyer</span>' : '') +
      '</div>' +
      (r.title ? '<h3 class="rvb__title">' + esc(r.title) + '</h3>' : '') +
      '<p class="rvb__text">' + esc(r.text) + '</p>' +
      (r.reply ? '<p class="rvb__reply"><b>Team Pynora:</b> ' + esc(r.reply) + '</p>' : '') +
      '</li>';
  }

  function topHTML(R, items) {
    var bars = [5, 4, 3, 2, 1].map(function (s) {
      var n = items.filter(function (x) { return x.rating === s; }).length;
      var pct = items.length ? n / items.length * 100 : 0;
      /* the spaces keep the words apart when the row is read as text; the grid ignores them */
      return '<li class="rvb__bar"><span class="vh">' + plural(s, 'star', 'stars') + ': ' + plural(n, 'review', 'reviews') + '</span> ' +
        '<span class="rvb__bar-k" aria-hidden="true">' + s + icon('star', 'i--fill') + '</span> ' +
        '<span class="rvb__bar-t" aria-hidden="true"><i style="width:' + pct.toFixed(1) + '%"></i></span> ' +
        '<span class="rvb__bar-n" aria-hidden="true">' + n + '</span></li>';
    }).join('');
    return '<div class="rvb__top">' +
      '<div class="rvb__avg"><p class="rvb__avg-n"><span class="vh">Rated </span>' + Number(R.average).toFixed(1) + '<span class="vh"> out of 5</span></p>' +
        stars(R.average) + '<p class="rvb__avg-c">' + plural(R.count, 'review', 'reviews') + '</p></div>' +
      '<ul class="rvb__bars" aria-label="Reviews by stars">' + bars + '</ul>' +
      '</div>';
  }

  function render(el, product, opts) {
    if (!el) return el;
    var R = product && product.reviews;
    var items = R && Array.isArray(R.items) ? newestFirst(R.items) : [];
    if (!items.length) { el.innerHTML = ''; return el; }
    var all = !!(opts && opts.all) || items.length <= SHOWN;
    var list = all ? items : items.slice(0, SHOWN);
    el.innerHTML = topHTML(R, items) +
      '<ul class="rvb__list">' + list.map(itemHTML).join('') + '</ul>' +
      (all ? '' : '<div class="rvb__more"><button class="btn btn--second btn--compact" type="button" data-rvb-all>Show all ' + items.length + ' reviews</button></div>');
    el.setAttribute('data-filled', '');
    if (!el.hasAttribute('data-rvb')) {
      el.setAttribute('data-rvb', '');
      el.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-rvb-all]') : null;
        if (!b || !el.contains(b)) return;
        render(el, el.__rvbProduct, { all: true });
        var next = el.querySelectorAll('.rvb__item')[SHOWN];
        if (next) {
          next.setAttribute('tabindex', '-1');
          next.focus();
        }
        if (P.motion && typeof P.motion.refresh === 'function') { try { P.motion.refresh(); } catch (err) { /* the list is shown either way */ } }
      });
    }
    el.__rvbProduct = product;
    return el;
  }

  P.pdpReviews = { render: render };
})();
