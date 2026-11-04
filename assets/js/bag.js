/* Bag: draws the bag drawer, changes quantities and builds the WhatsApp order.
   - The drawer is [data-overlay="bag"] (partial "bag"); it opens from any link to #bag.
   - Each line: thumbnail, name, colour, status pill, a quantity stepper (minus off at 1, plus off at the
     piece’s stock limit, or 5; at the stock limit a line under it says “Only 2 left”), the line’s price and "Remove" (with "Undo" in the message that follows).
   - The foot: subtotal, "Taxes included." and, only with a made-to-order piece, the 50% advance line; the main
     button opens WhatsApp with the whole order written out, as the shop sells today:
       Hi Pynora, I’d like to order:
       1 × Mehtab Pearl Chandbalis – ₹8,600
       1 × Vantara Hiran Nano Bag (Sindoori) – ₹6,600
       Total ₹15,200
     and the gift note, when one is written.
   - The gift note lives for the visit (it is never stored). */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P || !P.state) return;

  var doc = document;
  var bag = P.state.bag;
  var NOTE_MAX = 120;
  var el = null;
  var ui = {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function icon(name) { return '<svg class="i" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; }
  function colourOf(p, id) {
    var cols = (p && p.colours) || [];
    for (var i = 0; i < cols.length; i++) if (cols[i].id === id) return cols[i];
    return null;
  }
  /* the line’s picture: the chosen colour’s first picture, else the piece’s first */
  function picOf(p, colour) {
    var c = colourOf(p, colour);
    return c && c.images && c.images.length ? c.images[0] : 1;
  }
  function keyOf(l) { return l.id + '|' + (l.colour || ''); }
  function lines() { return bag.list().filter(function (l) { return !!P.product(l.id); }); }
  function isMto(p) { return !!(p && p.availability && p.availability.type !== 'ready'); }
  function nameLine(p, colour) {
    var c = colourOf(p, colour);
    return p.name + (c ? ' (' + c.name + ')' : '');
  }

  /* ---------- The WhatsApp order ---------- */
  function orderText() {
    var ls = lines();
    if (!ls.length) return '';
    var out = ['Hi Pynora, I’d like to order:'];
    ls.forEach(function (l) {
      var p = P.product(l.id);
      out.push(l.qty + ' × ' + nameLine(p, l.colour) + ' – ' + P.inr(p.price * l.qty));
    });
    out.push('Total ' + P.inr(bag.total()));
    var note = giftNote();
    if (note) out.push('Gift note: “' + note + '”');
    return out.join('\n');
  }
  function giftNote() {
    if (!ui.tick || !ui.tick.checked || !ui.note) return '';
    return ui.note.value.replace(/\s+/g, ' ').trim();
  }
  function updateOrder() {
    if (ui.order) ui.order.href = P.waLink(orderText());
  }

  /* ---------- Drawing ---------- */
  /* "Only 2 left" once a line holds all the stock there is (the shop's stock note); none at the cap of 5 */
  function stockNote(p, l, lim) {
    var s = p && p.stockLimit;
    if (typeof s !== 'number' || s < 1 || s > 5 || l.qty < lim) return '';
    return 'Only ' + s + ' left';
  }

  function lineHtml(l, i) {
    var p = P.product(l.id);
    var c = colourOf(p, l.colour);
    var n = picOf(p, l.colour);
    var pic = P.pic(p, n) || {};
    var href = P.url('product.html?p=' + encodeURIComponent(p.id));
    var lim = bag.limit(l.id, l.colour);
    var key = esc(keyOf(l));
    var label = nameLine(p, l.colour);
    var pill = P.cards ? P.cards.statusPill(p) : '';
    var note = stockNote(p, l, lim);
    var noteId = 'bag-stock-' + i;
    return '<li class="bag__line" data-key="' + key + '">' +
      '<a class="bag__thumb" href="' + esc(href) + '" tabindex="-1" aria-hidden="true"><img src="' + esc(P.img(p, n, 160)) + '" srcset="' + esc(P.srcset(p, n)) + '" sizes="76px" alt="" width="76" height="95" style="object-position:' + esc(pic.focal || '50% 50%') + '" loading="lazy" decoding="async"></a>' +
      '<div class="bag__info">' +
        '<h3 class="bag__name"><a href="' + esc(href) + '">' + esc(p.name) + '</a></h3>' +
        (c ? '<p class="bag__colour">Colour: ' + esc(c.name) + '</p>' : '') +
        pill +
        '<div><span class="bag__qty" role="group" aria-label="' + esc('Quantity of ' + label) + '">' +
          '<button class="bag__step" type="button" data-step="-1" data-focus="minus" aria-label="One fewer"' + (l.qty <= 1 ? ' aria-disabled="true"' : '') + '>' + icon('minus') + '</button>' +
          '<output aria-label="Quantity">' + l.qty + '</output>' +
          '<button class="bag__step" type="button" data-step="1" data-focus="plus" aria-label="One more"' + (l.qty >= lim ? ' aria-disabled="true"' : '') + (note ? ' aria-describedby="' + noteId + '"' : '') + '>' + icon('plus') + '</button>' +
        '</span></div>' +
        (note ? '<p class="bag__stock" id="' + noteId + '">' + esc(note) + '</p>' : '') +
      '</div>' +
      '<div class="bag__end"><span class="bag__price">' + esc(P.inr(p.price * l.qty)) + '</span>' +
        '<button class="bag__remove" type="button" data-remove data-focus="remove" aria-label="' + esc('Remove ' + label) + '">Remove</button></div>' +
      '</li>';
  }

  function draw() {
    if (!el) return;
    var ls = lines();
    var count = ls.reduce(function (n, l) { return n + l.qty; }, 0);
    var filled = ls.length > 0;

    /* remember where focus was, so a redraw never drops it */
    var active = doc.activeElement;
    var keep = null;
    if (active && ui.lines && ui.lines.contains(active)) {
      var li = active.closest('.bag__line');
      keep = li ? { key: li.getAttribute('data-key'), part: active.getAttribute('data-focus') || 'name' } : null;
    }

    ui.count.hidden = !filled;
    ui.count.textContent = filled ? '(' + count + ')' : '';
    ui.filled.hidden = !filled;
    ui.empty.hidden = filled;
    ui.foot.hidden = !filled;
    ui.lines.innerHTML = ls.map(lineHtml).join('');
    ui.total.textContent = P.inr(bag.total());
    ui.mto.hidden = !ls.some(function (l) { return isMto(P.product(l.id)); });
    updateOrder();

    if (keep) {
      var row = ui.lines.querySelector('[data-key="' + cssEsc(keep.key) + '"]');
      var target = row && (keep.part === 'name' ? row.querySelector('.bag__name a') : row.querySelector('[data-focus="' + keep.part + '"]'));
      if (target) focus(target);
    }
  }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }
  function focus(n) { try { n.focus({ preventScroll: false }); } catch (e) { n.focus(); } }
  function say(text) {
    if (!ui.live) return;
    ui.live.textContent = '';
    setTimeout(function () { ui.live.textContent = text; }, 30);
  }

  /* ---------- Actions ---------- */
  function lineFrom(node) {
    var li = node.closest('.bag__line');
    if (!li) return null;
    var key = li.getAttribute('data-key') || '';
    var cut = key.indexOf('|');
    var id = key.slice(0, cut);
    var colour = key.slice(cut + 1) || null;
    return { li: li, id: id, colour: colour, qty: bag.qty(id, colour) };
  }

  function step(btn) {
    if (btn.getAttribute('aria-disabled') === 'true') return;
    var l = lineFrom(btn);
    if (!l) return;
    var want = l.qty + (btn.getAttribute('data-step') === '-1' ? -1 : 1);
    if (want < 1) return;
    var kept = bag.setQty(l.id, l.colour, want);
    var note = stockNote(P.product(l.id), { qty: kept }, bag.limit(l.id, l.colour));
    say('Quantity ' + kept + (note ? '. ' + note : ''));
  }

  function remove(btn) {
    var l = lineFrom(btn);
    if (!l) return;
    var p = P.product(l.id);
    var all = lines();
    var at = -1;
    all.forEach(function (x, i) { if (keyOf(x) === l.id + '|' + (l.colour || '')) at = i; });
    var neighbour = all[at + 1] || all[at - 1] || null;
    var was = { id: l.id, colour: l.colour, qty: l.qty, at: at, list: bag.list() };
    bag.remove(l.id, l.colour);
    /* focus moves to the next line's Remove, or into the empty bag */
    var target = neighbour && ui.lines.querySelector('[data-key="' + cssEsc(keyOf(neighbour)) + '"] [data-remove]');
    focus(target || ui.empty.querySelector('a') || el.querySelector('[data-close]'));
    say(nameLine(p, l.colour) + ' removed');
    if (P.toast) {
      P.toast.show({ icon: 'bag', text: 'Removed from your bag', action: { text: 'Undo', onClick: function () {
        restore(was);
        /* focus goes to the line that came back */
        return ui.lines.querySelector('[data-key="' + cssEsc(keyOf(was)) + '"] [data-remove]');
      } } });
    }
  }
  /* puts a removed line back where it was */
  function restore(was) {
    if (bag.qty(was.id, was.colour)) return;
    var now = bag.list();
    if (was.at < 0 || was.at >= now.length) { bag.add(was.id, was.colour, was.qty); return; }
    now.splice(was.at, 0, { id: was.id, colour: was.colour, qty: was.qty });
    bag.clear();
    now.forEach(function (l) { bag.add(l.id, l.colour, l.qty); });
  }

  function noteCount() {
    var n = ui.note.value.length;
    ui.noteCount.textContent = n + ' / ' + NOTE_MAX;
  }

  function setup() {
    el = P.$('[data-overlay="bag"]');
    if (!el) return;
    ui = {
      count: P.$('[data-bag-count]', el),
      filled: P.$('[data-bag-filled]', el),
      empty: P.$('[data-bag-empty]', el),
      lines: P.$('[data-bag-lines]', el),
      foot: P.$('[data-bag-foot]', el),
      total: P.$('[data-bag-total]', el),
      mto: P.$('[data-bag-mto]', el),
      order: P.$('[data-bag-order]', el),
      live: P.$('[data-bag-live]', el),
      tick: P.$('[data-gift]', el),
      field: P.$('[data-gift-field]', el),
      note: P.$('[data-gift-note]', el),
      noteCount: P.$('[data-gift-count]', el)
    };
    if (!ui.lines || !ui.count) { el = null; return; }

    el.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : e.target.parentElement;
      if (!t) return;
      var s = t.closest('.bag__step');
      if (s) { e.preventDefault(); step(s); return; }
      var r = t.closest('[data-remove]');
      if (r) { e.preventDefault(); remove(r); }
    });
    if (ui.tick && ui.field) {
      ui.tick.addEventListener('change', function () {
        ui.field.hidden = !ui.tick.checked;
        if (ui.tick.checked && ui.note) focus(ui.note);
        updateOrder();
      });
    }
    if (ui.note) {
      ui.note.setAttribute('maxlength', String(NOTE_MAX));
      ui.note.addEventListener('input', function () {
        if (ui.note.value.length > NOTE_MAX) ui.note.value = ui.note.value.slice(0, NOTE_MAX);
        noteCount();
        updateOrder();
      });
      noteCount();
    }
    /* the order link is written afresh at the moment it is pressed, so it always carries the latest note */
    if (ui.order) {
      ui.order.addEventListener('click', updateOrder);
      ui.order.addEventListener('pointerdown', updateOrder);
    }

    P.overlay && P.overlay.register('bag', { initialFocus: '[data-close]', onOpen: draw });
    P.on('bag:change', draw);
    draw();
  }

  P.bagOrder = orderText;   /* the order's words, as they would be sent */
  P.ready(setup);
})();
