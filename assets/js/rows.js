/* Sideways rows: the row arrows and keeping the focused card in view.
   - Pynora.rows.init(root) sets up every .row inside root (and root itself when it is one); calling it again
     only refreshes. The page’s own rows are set up when it is ready.
   - The arrows ([data-row-prev], [data-row-next] inside the row) move by one card. Their holder (.ib-arrows)
     is shown only while the row can scroll (the stylesheet shows it on fine pointers only); an arrow that cannot
     move further is marked aria-disabled and keeps its focus.
   - Moving through the row with Tab brings the whole card into view, on a card’s edge, so the row’s snapping
     never pulls it back out.
   - Cards added later (lists filled by script) and changes of width are picked up by themselves.
   - Pynora.rows.step(row, 1 | -1) moves a row by one card. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var count = 0;

  function setup(row) {
    if (row._pyRow) { row._pyRow.update(); return row._pyRow; }
    var scroller = P.$('.row__scroller', row);
    var track = scroller && P.$('.track', scroller);
    if (!scroller || !track) return null;

    var prev = P.$('[data-row-prev]', row);
    var next = P.$('[data-row-next]', row);
    var holder = (prev || next) ? (prev || next).closest('.ib-arrows') : null;

    if (!scroller.id) scroller.id = 'row-' + (++count);
    [prev, next].forEach(function (b) { if (b) b.setAttribute('aria-controls', scroller.id); });

    function padStart() { return parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0; }
    function padEnd() { return parseFloat(getComputedStyle(scroller).scrollPaddingRight) || 0; }
    function maxX() { return Math.max(0, scroller.scrollWidth - scroller.clientWidth); }

    function items() {
      return Array.prototype.filter.call(track.children, function (n) { return n.getClientRects().length > 0; });
    }

    /* where a card starts and ends in the scroller’s own coordinates */
    function edges(item) {
      var s = scroller.getBoundingClientRect();
      var r = item.getBoundingClientRect();
      var left = r.left - s.left - scroller.clientLeft + scroller.scrollLeft;
      return { left: left, right: left + r.width };
    }

    /* the scroll positions at which each card rests on the row’s start */
    function stops() {
      var pad = padStart(), m = maxX();
      return items().map(function (it) { return Math.min(m, Math.max(0, edges(it).left - pad)); });
    }

    function go(x) {
      x = Math.min(maxX(), Math.max(0, Math.round(x)));
      if (Math.abs(x - scroller.scrollLeft) < 1) return;
      scroller.scrollTo({ left: x, behavior: P.reduced() ? 'auto' : 'smooth' });
    }

    function step(dir) {
      var x = scroller.scrollLeft;
      var list = stops();
      var target = null;
      if (dir > 0) {
        for (var i = 0; i < list.length; i++) if (list[i] > x + 2) { target = list[i]; break; }
        if (target == null) target = maxX();
      } else {
        for (var j = list.length - 1; j >= 0; j--) if (list[j] < x - 2) { target = list[j]; break; }
        if (target == null) target = 0;
      }
      go(target);
    }

    function setOff(b, off) {
      if (!b) return;
      if (off) b.setAttribute('aria-disabled', 'true');
      else b.removeAttribute('aria-disabled');
    }

    function update() {
      var m = maxX();
      var can = m > 1;
      row.classList.toggle('is-scrollable', can);
      if (holder) holder.hidden = !can;
      var x = scroller.scrollLeft;
      setOff(prev, !can || x <= 1);
      setOff(next, !can || x >= m - 1);
    }

    var queued = false;
    function queue() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }

    function onArrow(e) {
      var b = e.currentTarget;
      if (b.getAttribute('aria-disabled') === 'true') return;
      step(b === prev ? -1 : 1);
    }
    if (prev) prev.addEventListener('click', onArrow);
    if (next) next.addEventListener('click', onArrow);

    /* Tab: show the whole card that holds the focus */
    track.addEventListener('focusin', function (e) {
      var item = e.target;
      while (item && item.parentNode !== track) item = item.parentNode;
      if (!item) return;
      var x = scroller.scrollLeft;
      var view = scroller.clientWidth;
      var pad = padStart(), padR = padEnd();
      var ed = edges(item);
      if (ed.left - pad >= x - 1 && ed.right + padR <= x + view + 1) return;   /* already in full view */
      if (ed.left - pad < x) { go(ed.left - pad); return; }
      /* past the end: the first resting place from which the card shows whole */
      var need = ed.right + padR - view;
      var list = stops();
      var target = Math.min(maxX(), ed.left - pad);
      for (var i = 0; i < list.length; i++) if (list[i] >= need - 1) { target = Math.min(target, list[i]); break; }
      go(target);
    });

    scroller.addEventListener('scroll', queue, { passive: true });
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(queue);
      ro.observe(scroller);
      ro.observe(track);
    } else {
      window.addEventListener('resize', queue);
    }
    if (window.MutationObserver) new MutationObserver(queue).observe(track, { childList: true });

    row._pyRow = { update: update, step: step, scroller: scroller, track: track };
    update();
    return row._pyRow;
  }

  function init(root) {
    root = root || document;
    var rows = P.$$('.row', root);
    if (root.nodeType === 1 && root.classList.contains('row')) rows.unshift(root);
    rows.forEach(setup);
  }

  P.rows = {
    init: init,
    step: function (row, dir) { var r = setup(row); if (r) r.step(dir < 0 ? -1 : 1); }
  };

  P.ready(function () { init(document); });
})();
