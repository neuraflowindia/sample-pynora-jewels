/* Pynora bag and wishlist.
   - The bag is a list of lines {id, colour, qty} (colour is a colour id or null), kept under "pynora.bag.v1";
     the wishlist is a list of piece ids under "pynora.wish.v1". Both go through Pynora.store, so they
     work when the browser blocks storage (kept for the visit only).
   - A line's quantity stops at the piece's stock limit (shared by all its colours), or at 5 for pieces
     without one.
   - Other open tabs stay in step through the storage event.
   - Events: "bag:change" and "wish:change", with {list, count, reason, id, colour} (the bag adds total).
   - Every [data-count="bag"] and [data-count="wish"] badge shows what its drawer can show (hidden at 0, and so
     hidden without the catalogue), and the button around it is named with the count ("Bag, 2 pieces";
     "Wishlist, 1 piece"). A button can carry its own name in data-label. On a change the badge swells 1 → 1.15 → 1 over 320 ms, never with less motion. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var BAG_KEY = 'pynora.bag.v1';
  var WISH_KEY = 'pynora.wish.v1';
  var MAX_LINE = 5;

  function known(id) { return !P.cat || !!P.product(id); }
  function colourOk(p, colour) {
    if (colour == null || !p) return colour == null ? null : colour;
    var list = p.colours || [];
    if (!list.length) return null;
    for (var i = 0; i < list.length; i++) if (list[i].id === colour) return colour;
    return null;
  }
  function norm(colour) { return colour == null || colour === '' ? null : String(colour); }
  function int(n, d) { n = parseInt(n, 10); return isFinite(n) ? n : d; }

  /* ---------- Bag ---------- */
  var lines = [];

  function stockOf(id) {
    var p = P.product(id);
    var s = p && p.stockLimit;
    return (typeof s === 'number' && s >= 0) ? s : null;
  }
  function find(id, colour) {
    for (var i = 0; i < lines.length; i++) if (lines[i].id === id && lines[i].colour === colour) return i;
    return -1;
  }
  function others(id, colour) {
    var n = 0;
    lines.forEach(function (l) { if (l.id === id && l.colour !== colour) n += l.qty; });
    return n;
  }
  /* The most a line may hold: the stock left after the piece's other colours, never above 5 */
  function lineLimit(id, colour) {
    var s = stockOf(id);
    if (s == null) return MAX_LINE;
    return Math.max(0, Math.min(MAX_LINE, s - others(id, colour)));
  }

  function clean(raw) {
    var out = [];
    (Array.isArray(raw) ? raw : []).forEach(function (l) {
      if (!l || typeof l.id !== 'string' || !known(l.id)) return;
      var colour = norm(l.colour);
      if (P.cat) colour = colourOk(P.product(l.id), colour);
      var qty = int(l.qty, 1);
      if (qty < 1) return;
      var hit = -1;
      for (var i = 0; i < out.length; i++) if (out[i].id === l.id && out[i].colour === colour) hit = i;
      if (hit >= 0) out[hit].qty += qty; else out.push({ id: l.id, colour: colour, qty: qty });
    });
    lines = out;
    /* apply the limits once every line is known */
    out.forEach(function (l) { l.qty = Math.min(l.qty, lineLimit(l.id, l.colour)); });
    lines = out.filter(function (l) { return l.qty > 0; });
  }

  function copyLines() { return lines.map(function (l) { return { id: l.id, colour: l.colour, qty: l.qty }; }); }

  function bagChanged(reason, id, colour, save) {
    if (save !== false) P.store.set(BAG_KEY, copyLines());
    P.emit('bag:change', { list: copyLines(), count: bag.count(), total: bag.total(), reason: reason, id: id || null, colour: colour == null ? null : colour });
  }

  var bag = {
    list: copyLines,
    count: function () { return lines.reduce(function (n, l) { return n + l.qty; }, 0); },
    total: function () {
      return lines.reduce(function (n, l) {
        var p = P.product(l.id);
        return n + (p && typeof p.price === 'number' ? p.price * l.qty : 0);
      }, 0);
    },
    /* limit(id): the piece's own limit (stock limit or 5); limit(id, colour): what that line may hold */
    limit: function (id, colour) {
      if (arguments.length > 1) return lineLimit(id, norm(colour));
      var s = stockOf(id);
      return s == null ? MAX_LINE : Math.min(MAX_LINE, s);
    },
    qty: function (id, colour) {
      var i = find(id, norm(colour));
      return i < 0 ? 0 : lines[i].qty;
    },
    /* add(id, colour, qty = 1): returns the line's new quantity (0 when nothing could be added) */
    add: function (id, colour, qty) {
      if (!id || !known(id)) return 0;
      colour = norm(colour);
      if (P.cat) colour = colourOk(P.product(id), colour);
      qty = Math.max(1, int(qty, 1));
      var i = find(id, colour);
      var cap = lineLimit(id, colour);
      var now = i < 0 ? 0 : lines[i].qty;
      var next = Math.min(cap, now + qty);
      if (next <= now) return now;
      if (i < 0) lines.push({ id: id, colour: colour, qty: next }); else lines[i].qty = next;
      bagChanged('add', id, colour);
      return next;
    },
    /* setQty(id, colour, qty): 0 or less removes the line; returns the quantity kept */
    setQty: function (id, colour, qty) {
      colour = norm(colour);
      var i = find(id, colour);
      if (i < 0) return 0;
      qty = int(qty, lines[i].qty);
      if (qty < 1) { bag.remove(id, colour); return 0; }
      var next = Math.min(qty, lineLimit(id, colour));
      if (next < 1) { bag.remove(id, colour); return 0; }
      if (next === lines[i].qty) return next;
      lines[i].qty = next;
      bagChanged('set', id, colour);
      return next;
    },
    /* remove(id, colour); remove(id) alone takes every colour of the piece */
    remove: function (id, colour) {
      var all = arguments.length < 2;
      colour = norm(colour);
      var before = lines.length;
      lines = lines.filter(function (l) { return !(l.id === id && (all || l.colour === colour)); });
      if (lines.length !== before) bagChanged('remove', id, all ? null : colour);
    },
    clear: function () {
      if (!lines.length) return;
      lines = [];
      bagChanged('clear');
    }
  };

  /* ---------- Wishlist ---------- */
  var wishes = [];

  function cleanWish(raw) {
    var seen = {};
    wishes = (Array.isArray(raw) ? raw : []).filter(function (id) {
      if (typeof id !== 'string' || seen[id] || !known(id)) return false;
      seen[id] = true;
      return true;
    });
  }

  function wishChanged(reason, id, on, save) {
    if (save !== false) P.store.set(WISH_KEY, wishes.slice());
    P.emit('wish:change', { list: wishes.slice(), count: wishes.length, reason: reason, id: id || null, on: !!on });
  }

  var wish = {
    list: function () { return wishes.slice(); },
    count: function () { return wishes.length; },
    has: function (id) { return wishes.indexOf(id) >= 0; },
    add: function (id) {
      if (!id || !known(id) || wish.has(id)) return false;
      wishes.push(id);
      wishChanged('add', id, true);
      return true;
    },
    remove: function (id) {
      var i = wishes.indexOf(id);
      if (i < 0) return false;
      wishes.splice(i, 1);
      wishChanged('remove', id, false);
      return true;
    },
    /* toggle(id): returns true when the piece is now saved */
    toggle: function (id) {
      if (wish.has(id)) { wish.remove(id); return false; }
      return wish.add(id);
    },
    clear: function () {
      if (!wishes.length) return;
      wishes = [];
      wishChanged('clear', null, false);
    }
  };

  P.state = { bag: bag, wish: wish };

  /* ---------- Load, and stay in step with other tabs ---------- */
  clean(P.store.get(BAG_KEY, []));
  cleanWish(P.store.get(WISH_KEY, []));

  window.addEventListener('storage', function (e) {
    if (e.key === BAG_KEY || e.key === null) {
      clean(P.store.get(BAG_KEY, []));
      bagChanged('sync', null, null, false);
    }
    if (e.key === WISH_KEY || e.key === null) {
      cleanWish(P.store.get(WISH_KEY, []));
      wishChanged('sync', null, false, false);
    }
  });

  /* ---------- Count badges and button names ---------- */
  var NAMES = { bag: 'Bag', wish: 'Wishlist' };
  var shown = { bag: null, wish: null };

  function bump(el) {
    if (P.reduced() || typeof el.animate !== 'function') return;
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }
    );
  }

  function paint(kind, n) {
    var changed = shown[kind] !== null && shown[kind] !== n;
    shown[kind] = n;
    P.$$('[data-count="' + kind + '"]').forEach(function (badge) {
      badge.textContent = n > 0 ? String(n) : '';
      badge.hidden = n < 1;
      badge.setAttribute('aria-hidden', 'true');
      if (changed && n > 0) bump(badge);
      var btn = badge.closest('a, button');
      if (!btn) return;
      var base = btn.getAttribute('data-label') || NAMES[kind];
      btn.setAttribute('aria-label', n > 0 ? base + ', ' + n + (n === 1 ? ' piece' : ' pieces') : base);
    });
  }

  /* the badges count only what the drawers can show: without the catalogue the kept lines stay stored for a
     later visit, but nothing is counted */
  function drawable(id) { return !!P.product(id); }
  function bagShown() { return lines.reduce(function (n, l) { return n + (drawable(l.id) ? l.qty : 0); }, 0); }
  function wishShown() { return wishes.filter(drawable).length; }
  function paintAll() {
    paint('bag', bagShown());
    paint('wish', wishShown());
  }

  P.on('bag:change', function () { paint('bag', bagShown()); });
  P.on('wish:change', function () { paint('wish', wishShown()); });
  P.ready(paintAll);
  /* the badges are already in the page when this deferred script runs */
  paintAll();
})();
