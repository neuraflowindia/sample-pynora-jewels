/* Wishlist: draws the wishlist drawer, two columns of small cards.
   - The drawer is [data-overlay="wishlist"] (partial "wishlist"); it opens from any link to #wishlist.
   - Each small card: the picture, the name (a link to the piece), the price and a filled heart that takes the
     piece out again ("Removed from your wishlist · Undo"). Focus then moves to the next heart, or into the
     empty state ("Nothing saved yet").
   - Hearts on cards anywhere on the page add to it (cards.js); the drawer redraws on every change. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P || !P.state) return;

  var doc = document;
  var wish = P.state.wish;
  var el = null;
  var ui = {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function icon(name) { return '<svg class="i" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; }
  function ids() { return wish.list().filter(function (id) { return !!P.product(id); }); }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }
  function focus(n) { if (!n) return; try { n.focus({ preventScroll: false }); } catch (e) { n.focus(); } }

  function cardHtml(id) {
    var p = P.product(id);
    var n = (p.colours && p.colours.length && p.colours[0].images && p.colours[0].images[0]) || 1;
    var pic = P.pic(p, n) || {};
    var href = P.url('product.html?p=' + encodeURIComponent(p.id));
    return '<li class="wish__card" data-id="' + esc(p.id) + '">' +
      '<a class="wish__pic" href="' + esc(href) + '" tabindex="-1" aria-hidden="true"><img src="' + esc(P.img(p, n, 480)) + '" srcset="' + esc(P.srcset(p, n)) + '" sizes="(max-width: 760px) 44vw, 186px" alt="" style="object-position:' + esc(pic.focal || '50% 50%') + '" loading="lazy" decoding="async"></a>' +
      '<button class="card__wish" type="button" data-wish-remove="' + esc(p.id) + '" aria-label="' + esc('Remove ' + p.name + ' from your wishlist') + '">' + icon('heart') + '</button>' +
      '<h3 class="wish__name"><a href="' + esc(href) + '">' + esc(p.name) + '</a></h3>' +
      '<span class="wish__price">' + esc(P.inr(p.price)) + '</span>' +
      '</li>';
  }

  function draw() {
    if (!el) return;
    var list = ids();
    var filled = list.length > 0;
    var active = doc.activeElement;
    var keep = null;
    if (active && ui.list.contains(active)) {
      var li = active.closest('.wish__card');
      keep = li ? { id: li.getAttribute('data-id'), heart: active.hasAttribute('data-wish-remove') } : null;
    }
    ui.count.hidden = !filled;
    ui.count.textContent = filled ? '(' + list.length + ')' : '';
    ui.list.hidden = !filled;
    ui.empty.hidden = filled;
    ui.list.innerHTML = list.map(cardHtml).join('');
    if (keep) {
      var row = ui.list.querySelector('[data-id="' + cssEsc(keep.id) + '"]');
      if (row) focus(row.querySelector(keep.heart ? '[data-wish-remove]' : '.wish__name a'));
    }
  }

  function remove(btn) {
    var id = btn.getAttribute('data-wish-remove');
    var list = ids();
    var at = list.indexOf(id);
    var next = list[at + 1] || list[at - 1] || null;
    var full = wish.list().indexOf(id);
    wish.remove(id);
    var target = next && ui.list.querySelector('[data-id="' + cssEsc(next) + '"] [data-wish-remove]');
    focus(target || ui.empty.querySelector('a') || el.querySelector('[data-close]'));
    if (P.toast) {
      P.toast.show({
        icon: 'heart',
        text: 'Removed from your wishlist',
        action: { text: 'Undo', onClick: function () {
          if (P.cards) P.cards.restoreWish(id, full); else wish.add(id);
          /* focus goes to the heart of the piece that came back */
          return ui.list.querySelector('[data-id="' + cssEsc(id) + '"] [data-wish-remove]');
        } }
      });
    }
  }

  function setup() {
    el = P.$('[data-overlay="wishlist"]');
    if (!el) return;
    ui = {
      count: P.$('[data-wish-count]', el),
      list: P.$('[data-wish-list]', el),
      empty: P.$('[data-wish-empty]', el)
    };
    if (!ui.count || !ui.list || !ui.empty) { el = null; return; }
    el.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : e.target.parentElement;
      var b = t && t.closest('[data-wish-remove]');
      if (b) { e.preventDefault(); remove(b); }
    });
    if (P.overlay) P.overlay.register('wishlist', { initialFocus: '[data-close]', onOpen: draw });
    P.on('wish:change', draw);
    draw();
  }

  P.ready(setup);
})();
