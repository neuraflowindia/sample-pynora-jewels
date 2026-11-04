/* Header: switches the bar to its scrolled state once the strip has left the screen, opens the Jewellery panel,
   and writes each collection's count and "from" price from the catalogue into the page.
   - The switch watches the marker under the strip with an IntersectionObserver (no scroll listener). The bar
     arrives from above when it changes; with less motion it changes at once. Focus on a control that the change
     hides moves to its twin in the new bar, or to the new bar's logo when it has none.
   - The Jewellery panel is a disclosure (aria-expanded, aria-controls). Mouse: opens 120 ms after the pointer
     arrives, closes 250 ms after it leaves; a click keeps a hover-opened panel open, a second click closes it.
     Keys: Enter, Space or ↓ open it and move to its first link; ↓ ↑ move between its links; Esc closes it and
     returns to "Jewellery"; tabbing out of it closes it. It opens with a downward wipe (260 ms), never a fade.
   - [data-tally="<collection>"] labels get the collection's count ({pieces}, {n}) and lowest price ({from}) in
     the pattern of data-tally-fmt (default "{pieces}"); [data-price="<id>"] gets the piece's price. The page
     already holds the same words, so nothing changes size; without the catalogue they stay as written. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;
  var doc = document;
  var EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

  /* ---------- Counts and prices from the catalogue ---------- */
  function pieces(n) { return n + (n === 1 ? ' piece' : ' pieces'); }

  function fillTallies(scope) {
    if (!P.cat) return;
    P.$$('[data-tally]', scope).forEach(function (el) {
      var list = P.collection(el.getAttribute('data-tally'));
      if (!list.length) return;
      var from = Math.min.apply(null, list.map(function (p) { return Number(p.price) || Infinity; }));
      var fmt = el.getAttribute('data-tally-fmt') || '{pieces}';
      el.textContent = fmt
        .replace('{pieces}', pieces(list.length))
        .replace('{n}', String(list.length))
        .replace('{from}', isFinite(from) ? P.inr(from) : '');
    });
    P.$$('[data-price]', scope).forEach(function (el) {
      var p = P.product(el.getAttribute('data-price'));
      if (p && isFinite(Number(p.price))) el.textContent = P.inr(p.price);
    });
  }

  /* ---------- The scrolled state ---------- */
  function initSwitch(hdr) {
    var mark = doc.querySelector('[data-hdr-mark]');
    var bar = hdr.querySelector('.hdr__bar');
    var first = true;

    function hiddenNow(el) { return !el.getClientRects().length; }

    function set(scrolled) {
      if (hdr.classList.contains('is-scrolled') === scrolled) { first = false; return; }
      var active = doc.activeElement;
      hdr.classList.toggle('is-scrolled', scrolled);
      hdr.classList.remove('is-arriving');
      if (scrolled && !first && !P.reduced()) {
        void bar.offsetWidth;
        hdr.classList.add('is-arriving');
      }
      first = false;
      /* focus stays on the same control in the new arrangement */
      if (active && hdr.contains(active) && hiddenNow(active)) {
        var twin = active.getAttribute('data-twin');
        var shownOf = function (name) { return P.$$('[data-twin="' + name + '"]', hdr).filter(function (n) { return !hiddenNow(n); })[0]; };
        /* a control with no twin ("Visit us in Karnal") hands focus to the logo of the new bar */
        var next = (twin && shownOf(twin)) || shownOf('logo');
        if (next) { try { next.focus({ preventScroll: true }); } catch (e) { next.focus(); } }
      }
      P.emit('header:change', { scrolled: scrolled });
    }

    if (bar) bar.addEventListener('animationend', function () { hdr.classList.remove('is-arriving'); });

    if (mark && 'IntersectionObserver' in window) {
      var seen = function (entries) {
        var e = entries[entries.length - 1];
        set(!e.isIntersecting && e.boundingClientRect.top < 0);
      };
      /* the page's own window as the root, so it also works when the page is shown inside a frame */
      var io;
      try { io = new IntersectionObserver(seen, { root: doc, threshold: 0 }); }
      catch (err) { io = new IntersectionObserver(seen, { threshold: 0 }); }
      io.observe(mark);
    }
  }

  /* ---------- The Jewellery panel ---------- */
  function initPanel(hdr) {
    var item = hdr.querySelector('[data-jewellery]');
    if (!item) return;
    var btn = item.querySelector('[aria-controls]');
    var panel = btn && doc.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;

    var openedBy = null;         /* null | 'hover' | 'click' | 'key' */
    var tOpen = 0;
    var tClose = 0;

    function links() { return P.$$('a[href]', panel); }
    function focusEl(n) { if (n) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } } }

    function wipe() {
      if (P.reduced() || typeof panel.animate !== 'function') return;
      panel.animate([
        { clipPath: 'inset(-14px -56px 100% -56px)', transform: 'translateY(-8px)' },
        { clipPath: 'inset(-14px -56px -90px -56px)', transform: 'none' }
      ], { duration: 260, easing: EASE });
    }

    function open(by, focusFirst) {
      clearTimeout(tOpen);
      clearTimeout(tClose);
      if (!openedBy) {
        panel.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        wipe();
      }
      openedBy = by;
      if (focusFirst) focusEl(links()[0]);
    }

    function close(returnFocus) {
      clearTimeout(tOpen);
      clearTimeout(tClose);
      if (!openedBy) return;
      openedBy = null;
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) focusEl(btn);
    }

    /* mouse: hover after 120 ms, leave after 250 ms */
    item.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(tClose);
      if (!openedBy) tOpen = setTimeout(function () { open('hover'); }, 120);
    });
    item.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(tOpen);
      if (openedBy === 'hover') tClose = setTimeout(function () { close(false); }, 250);
    });

    /* click (and Enter or Space, which arrive as a click with no pointer) */
    btn.addEventListener('click', function (e) {
      var byKey = e.detail === 0;
      if (openedBy === 'hover') { openedBy = byKey ? 'key' : 'click'; if (byKey) focusEl(links()[0]); return; }
      if (openedBy) close(false);
      else open(byKey ? 'key' : 'click', byKey);
    });

    item.addEventListener('keydown', function (e) {
      var list = links();
      var i = list.indexOf(doc.activeElement);
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (!openedBy) return;
        e.preventDefault();
        close(true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (doc.activeElement === btn) open('key', true);
        else if (i >= 0 && i < list.length - 1) focusEl(list[i + 1]);
      } else if (e.key === 'ArrowUp') {
        if (i < 0) return;
        e.preventDefault();
        focusEl(i > 0 ? list[i - 1] : btn);
      }
    });

    /* focus from the keys inside keeps it open; focus that leaves for another control closes it */
    panel.addEventListener('focusin', function () { if (openedBy === 'hover') openedBy = 'key'; });
    item.addEventListener('focusout', function () {
      setTimeout(function () {
        var a = doc.activeElement;
        if (openedBy && a && a !== doc.body && !item.contains(a)) close(false);
      }, 0);
    });

    /* a press anywhere else closes it */
    doc.addEventListener('pointerdown', function (e) {
      if (openedBy && !item.contains(e.target)) close(false);
    });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && openedBy && !item.contains(doc.activeElement)) close(false);
    });
    P.on('overlay:open', function () { close(false); });

    /* the panel lives on laptops only */
    var narrow = window.matchMedia ? window.matchMedia('(max-width: 1079px)') : null;
    function onNarrow() { if (narrow.matches) close(false); }
    if (narrow) {
      if (narrow.addEventListener) narrow.addEventListener('change', onNarrow);
      else if (narrow.addListener) narrow.addListener(onNarrow);
    }
  }

  P.header = { fillTallies: fillTallies };

  P.ready(function () {
    fillTallies(doc);
    P.$$('[data-hdr]').forEach(function (hdr) {
      initSwitch(hdr);
      initPanel(hdr);
    });
  });
})();
