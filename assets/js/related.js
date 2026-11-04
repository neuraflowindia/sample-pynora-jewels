/* Pieces to suggest after what the visitor is looking at ("You may also like").
   Pynora.related(products, {max, exclude}) returns up to `max` (default 4) piece ids:
     1. every given piece's completeTheLook, in order,
     2. then every given piece's related,
     3. then the new pieces, in the collection's order.
   Each piece appears once; the given pieces themselves and the ids in `exclude` never appear; unknown ids are
   skipped. `products` may hold piece records or ids. Without the catalogue the answer is an empty list.
   A classic script, loaded with defer after core.js. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  function asProduct(p) { return typeof p === 'string' ? P.product(p) : (p || null); }

  P.related = function (products, opts) {
    opts = opts || {};
    var max = opts.max > 0 ? Math.floor(opts.max) : 4;
    var out = [];
    if (!P.cat) return out;

    var given = (products || []).map(asProduct).filter(Boolean);
    var seen = {};
    given.forEach(function (p) { seen[p.id] = true; });
    (opts.exclude || []).forEach(function (id) {
      var p = asProduct(id);
      if (p) seen[p.id] = true;
    });

    function take(id) {
      if (out.length >= max || seen[id] || !P.product(id)) return;
      seen[id] = true;
      out.push(id);
    }

    given.forEach(function (p) { (p.completeTheLook || []).forEach(take); });
    given.forEach(function (p) { (p.related || []).forEach(take); });
    P.collection('new').forEach(function (p) { take(p.id); });
    return out;
  };
})();
