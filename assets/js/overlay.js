/* Pynora overlays: the drawers (bag, wishlist, menu, client care), search, and the states kept in the address.
   - State hashes: #bag, #wishlist, #search, #menu, #care/<tab>, #newsletter-thanks, #filters (the Collection
     page's filter panel on tablets and phones). Any other hash is an
     ordinary anchor and scrolls as usual.
   - A link to a state hash (a[href="#bag"]) or an element with data-open="bag" (or "care/faqs") opens it.
   - Opening from the page adds a history entry; closing with ×, Esc or the scrim goes back, so Back never
     reopens it. A state that was in the address when the page loaded closes by rewriting the address.
   - While a modal state is open: role="dialog" and aria-modal, focus moved in and kept inside, the rest of the
     page inert and still (the scroll bar's room is kept, so nothing jumps), the shared scrim shown, and
     <html data-overlay-open="name"> set; focus returns to the opener on closing.
   - Leaving the open state through one of its own links (an anchor on the page, or another page) closes it
     cleanly first, so Back never brings it back.
   - Events: "overlay:open" and "overlay:close" with {name, arg, modal, from}.
   - With less motion the element shows and hides at once (the stylesheets drop the slide). */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var doc = document;
  var html = doc.documentElement;
  var STATES = ['bag', 'wishlist', 'search', 'menu', 'care', 'newsletter-thanks', 'filters'];
  var WITH_ARG = { care: true };
  var FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), iframe, summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
  var HIDE_AFTER = 420;   /* ms: longer than the slowest closing slide */

  var reg = {};
  var cur = null;         /* {name, arg, mode: 'pushed' | 'loaded', opener, modal} */
  var inerted = [];
  var scrim = null;
  var pending = null;     /* where to go once the closing history step has landed */
  var pendingTimer = 0;
  var initialDone = false;

  /* ---------- Hash helpers ---------- */
  function parse(hash) {
    hash = (hash || '').replace(/^#/, '');
    if (!hash) return null;
    try { hash = decodeURIComponent(hash); } catch (e) { /* keep as written */ }
    var slash = hash.indexOf('/');
    var name = slash >= 0 ? hash.slice(0, slash) : hash;
    var arg = slash >= 0 ? hash.slice(slash + 1) : null;
    if (STATES.indexOf(name) < 0) return null;
    if (arg !== null && !WITH_ARG[name]) return null;
    return { name: name, arg: arg || null };
  }
  function hashFor(name, arg) { return '#' + name + (arg ? '/' + arg : ''); }
  function bare() { return location.href.split('#')[0]; }
  /* the same page, also when the home page is served at "/" and the link names "index.html" */
  function pagePath(p) { return String(p || '').replace(/\/index\.html?$/i, '/'); }
  function sameDoc(a) {
    return a.protocol === location.protocol && a.host === location.host &&
      pagePath(a.pathname) === pagePath(location.pathname) && a.search === location.search;
  }
  function push(url) { try { history.pushState(null, '', url); return true; } catch (e) { return false; } }
  function replace(url) { try { history.replaceState(null, '', url); return true; } catch (e) { return false; } }

  /* ---------- Shared scrim ---------- */
  function getScrim() {
    if (scrim && scrim.isConnected) return scrim;
    scrim = doc.querySelector('.scrim[data-scrim]');
    if (!scrim) {
      scrim = doc.createElement('div');
      scrim.className = 'scrim';
      scrim.setAttribute('data-scrim', '');
      scrim.setAttribute('aria-hidden', 'true');
      doc.body.appendChild(scrim);
    }
    scrim.addEventListener('click', function () { if (cur && cur.modal) close(cur.name); });
    return scrim;
  }

  /* ---------- The page behind ---------- */
  function keep(node) {
    return node === scrim || node.hasAttribute('data-overlay-keep') ||
      /^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/.test(node.tagName);
  }
  function setInert(el) {
    var node = el;
    while (node && node !== doc.body && node.parentElement) {
      var parent = node.parentElement;
      Array.prototype.forEach.call(parent.children, function (sib) {
        if (sib === node || sib.inert || keep(sib)) return;
        sib.inert = true;
        inerted.push(sib);
      });
      node = parent;
    }
  }
  function clearInert() {
    inerted.forEach(function (n) { n.inert = false; });
    inerted = [];
  }

  var gutterOk = !!(window.CSS && CSS.supports && CSS.supports('scrollbar-gutter', 'stable'));
  function lock() {
    if (!gutterOk) {
      var gap = window.innerWidth - html.clientWidth;
      if (gap > 0) doc.body.style.paddingRight = gap + 'px';
    }
    html.classList.add('is-locked');
  }
  function unlock() {
    html.classList.remove('is-locked');
    if (!gutterOk) doc.body.style.paddingRight = '';
  }

  /* ---------- Focus ---------- */
  function visible(n) {
    if (!n.getClientRects().length) return false;
    var s = getComputedStyle(n);
    return s.visibility !== 'hidden';
  }
  function focusables(el) {
    return Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), function (n) {
      return !n.closest('[hidden], [inert]') && visible(n);
    });
  }
  function focusEl(n) {
    if (!n) return;
    try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); }
  }
  function firstFocus(r, arg) {
    var f = r.initialFocus;
    if (typeof f === 'function') f = f(arg);
    if (typeof f === 'string') f = r.el.querySelector(f);
    if (f && f.nodeType === 1) return f;
    return r.el.querySelector('[autofocus]') || r.el.querySelector('[data-close]') || focusables(r.el)[0] || r.el;
  }

  /* ---------- Show and hide ---------- */
  function label(r) {
    var el = r.el;
    if (!el.hasAttribute('role')) el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    if (!el.hasAttribute('aria-labelledby') && !el.hasAttribute('aria-label')) {
      var t = el.querySelector('[data-overlay-title], .drawer__title, h1, h2, h3');
      if (t) {
        if (!t.id) t.id = 'ovl-' + r.name + '-title';
        el.setAttribute('aria-labelledby', t.id);
      }
    }
  }

  function show(r) {
    var el = r.el;
    clearTimeout(r.hideTimer);
    el.hidden = false;
    void el.offsetWidth;          /* start the slide from the closed place */
    el.classList.add('is-open');
    if (r.scrim !== false) {
      var s = getScrim();
      s.hidden = false;
      void s.offsetWidth;
      s.classList.add('is-open');
    }
  }

  function hide(r, keepScrim) {
    var el = r.el;
    el.classList.remove('is-open');
    var quick = P.reduced();
    clearTimeout(r.hideTimer);
    if (quick) el.hidden = true;
    else r.hideTimer = setTimeout(function () { if (!el.classList.contains('is-open')) el.hidden = true; }, HIDE_AFTER);
    if (!keepScrim && scrim) {
      var s = scrim;
      s.classList.remove('is-open');
      clearTimeout(s._t);
      if (quick) s.hidden = true;
      else s._t = setTimeout(function () { if (!s.classList.contains('is-open')) s.hidden = true; }, HIDE_AFTER);
    }
  }

  /* ---------- Open and close ---------- */
  function teardown(from, switching) {
    if (!cur) return null;
    var was = cur;
    var r = reg[was.name];
    cur = null;
    if (was.modal && r && r.el) {
      hide(r, switching);
      clearInert();
      if (!switching) {
        unlock();
        html.removeAttribute('data-overlay-open');
      }
    }
    if (r && r.onClose) { try { r.onClose({ name: was.name, arg: was.arg, from: from }); } catch (e) { setTimeout(function () { throw e; }); } }
    P.emit('overlay:close', { name: was.name, arg: was.arg, modal: was.modal, from: from, switching: !!switching });
    if (!switching && was.modal) {
      var back = was.opener;
      if (back && back.isConnected && !back.closest('[inert]')) focusEl(back);
      else if (doc.activeElement && r && r.el && r.el.contains(doc.activeElement)) doc.activeElement.blur();
    }
    return was;
  }

  /* open(name, {arg, opener, from}): from is "page" (default), "load" or "history" */
  function open(name, opts) {
    opts = opts || {};
    var r = reg[name];
    if (!r) return false;
    var arg = opts.arg != null ? String(opts.arg) : null;
    var from = opts.from || 'page';
    var modal = r.modal !== false;

    /* the same state again: only the tab (or other argument) changes */
    if (cur && cur.name === name) {
      if (cur.arg !== arg) {
        cur.arg = arg;
        if (from === 'page') replace(hashFor(name, arg));
        if (r.onOpen) r.onOpen(arg, { name: name, from: from, again: true });
        P.emit('overlay:open', { name: name, arg: arg, modal: modal, from: from, again: true });
      }
      return true;
    }

    var opener = opts.opener || doc.activeElement;
    var mode = from === 'load' ? 'loaded' : 'pushed';
    var switching = !!cur;
    var keptModal = false;
    if (switching) {
      keptModal = modal && !!r.el && cur.modal;
      var was = teardown('switch', keptModal);
      mode = was.mode;
      if (was.modal && was.opener) opener = was.opener;
      if (from === 'page') replace(hashFor(name, arg));
    } else if (from === 'page') {
      if (!push(hashFor(name, arg))) mode = 'loaded';
    }
    if (opener === doc.body || (opener && r.el && r.el.contains(opener))) opener = null;

    cur = { name: name, arg: arg, mode: mode, opener: opener, modal: modal && !!r.el };

    if (cur.modal) {
      label(r);
      if (!keptModal) lock();
      html.setAttribute('data-overlay-open', name);
      show(r);
      setInert(r.el);
    }
    if (r.onOpen) { try { r.onOpen(arg, { name: name, from: from }); } catch (e) { setTimeout(function () { throw e; }); } }
    if (cur && cur.name === name && cur.modal) focusEl(firstFocus(r, arg));
    P.emit('overlay:open', { name: name, arg: arg, modal: cur ? cur.modal : modal, from: from });
    return true;
  }

  /* close(name): closes the open state (any open state when name is left out) */
  function close(name, then) {
    if (!cur || (name && cur.name !== name)) return false;
    var mode = cur.mode;
    teardown('close', false);
    if (mode === 'pushed') {
      if (then) wait(then);
      history.back();
    } else {
      replace(bare());
      if (then) then();
    }
    return true;
  }

  function wait(fn) {
    pending = fn;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(runPending, 400);
  }
  function runPending() {
    clearTimeout(pendingTimer);
    var fn = pending;
    pending = null;
    if (fn) fn();
  }

  /* ---------- Keep the open state in step with the address ---------- */
  function sync() {
    if (pending) { runPending(); return; }
    var want = parse(location.hash);
    if (want && !reg[want.name]) want = null;
    if (!want) {
      if (cur) teardown('history', false);
      return;
    }
    if (cur && cur.name === want.name && cur.arg === want.arg) return;
    open(want.name, { arg: want.arg, from: 'history' });
  }
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);
  window.addEventListener('pageshow', function (e) { if (e.persisted) sync(); });

  /* ---------- Links, keys, close buttons ---------- */
  function plainClick(e) {
    return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
  }

  doc.addEventListener('click', function (e) {
    if (!plainClick(e)) return;
    var t = e.target.closest ? e.target : e.target.parentElement;
    if (!t) return;

    var closer = cur && cur.modal && t.closest('[data-close]');
    if (closer && reg[cur.name] && reg[cur.name].el && reg[cur.name].el.contains(closer)) {
      e.preventDefault();
      close(cur.name);
      return;
    }

    var opener = t.closest('[data-open]');
    if (opener) {
      var st = parse(opener.getAttribute('data-open'));
      if (st && reg[st.name]) {
        e.preventDefault();
        open(st.name, { arg: st.arg, opener: opener });
      }
      return;
    }

    var a = t.closest('a[href]');
    if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return;
    var raw = a.getAttribute('href') || '';
    if (raw === '#' || /^javascript:/i.test(raw)) return;
    var here = raw.charAt(0) === '#' || sameDoc(a);
    var state = here ? parse(a.hash) : null;
    if (state && reg[state.name]) {
      e.preventDefault();
      open(state.name, { arg: state.arg, opener: a });
      return;
    }

    /* a link inside the open state that leaves it: close first, then follow */
    var box = cur && cur.modal && reg[cur.name] && reg[cur.name].el;
    if (box && box.contains(a)) {
      e.preventDefault();
      if (here && a.hash) {
        /* the state's own history entry becomes the anchor, so Back returns to where the visitor was before the
           state (going back first would let the browser put the old scroll place back over the jump) */
        var anchor = a.hash;
        teardown('close', false);
        location.replace(anchor);
      } else {
        var href = a.href;
        close(cur.name, function () { location.assign(href); });
      }
      return;
    }

    /* an anchor on this page (#visit). A state that does not cover the page (the sign-up thanks) gives way to it
       without being undone; Back still returns to it. "index.html#visit" on the home page served at "/" stays a
       jump within the page instead of loading the page again. */
    if (!here || !a.hash) return;
    if (cur && !cur.modal) teardown('leave', false);
    if (a.pathname !== location.pathname) {
      e.preventDefault();
      if (location.hash === a.hash) {
        var target = doc.getElementById(a.hash.slice(1));
        if (target) target.scrollIntoView();
      } else {
        location.hash = a.hash;
      }
    }
  });

  doc.addEventListener('keydown', function (e) {
    if (!cur || !cur.modal) return;
    var r = reg[cur.name];
    if (!r || !r.el) return;
    if ((e.key === 'Escape' || e.key === 'Esc') && !e.defaultPrevented) {
      e.preventDefault();
      close(cur.name);
      return;
    }
    if (e.key !== 'Tab') return;
    var list = focusables(r.el);
    if (!list.length) { e.preventDefault(); focusEl(r.el); return; }
    var first = list[0];
    var last = list[list.length - 1];
    var active = doc.activeElement;
    if (!r.el.contains(active)) { e.preventDefault(); focusEl(e.shiftKey ? last : first); return; }
    if (e.shiftKey && (active === first || active === r.el)) { e.preventDefault(); focusEl(last); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); focusEl(first); }
  });

  doc.addEventListener('focusin', function (e) {
    if (!cur || !cur.modal) return;
    var r = reg[cur.name];
    if (!r || !r.el || r.el.contains(e.target)) return;
    if (e.target.closest && e.target.closest('[data-overlay-keep]')) return;
    focusEl(firstFocus(r, cur.arg));
  });

  /* ---------- Registration ---------- */
  /* register(name, {el, onOpen(arg, info), onClose(info), initialFocus, modal, scrim}) */
  function register(name, opts) {
    if (STATES.indexOf(name) < 0) return null;
    opts = opts || {};
    var r = reg[name] || { name: name };
    ['onOpen', 'onClose', 'initialFocus', 'modal', 'scrim'].forEach(function (k) { if (k in opts) r[k] = opts[k]; });
    var el = opts.el || r.el || doc.querySelector('[data-overlay="' + name + '"]');
    if (r.modal !== false && !el) return null;
    r.el = el || null;
    reg[name] = r;
    if (r.el && !(cur && cur.name === name)) {
      r.el.classList.remove('is-open');
      r.el.hidden = true;
    }
    if (initialDone && !cur) {
      var want = parse(location.hash);
      if (want && want.name === name) open(name, { arg: want.arg, from: 'load' });
    }
    return r;
  }

  P.overlay = {
    states: STATES.slice(),
    register: register,
    open: function (name, opts) {
      if (typeof name === 'string' && name.indexOf('/') > 0) {
        var st = parse(name);
        if (!st) return false;
        opts = opts || {};
        if (opts.arg == null) opts.arg = st.arg;
        name = st.name;
      }
      return open(name, opts);
    },
    close: function (name) { return close(name); },
    current: function () { return cur ? cur.name : null; },
    arg: function () { return cur ? cur.arg : null; },
    isOpen: function (name) { return !!cur && cur.name === name; },
    /* update(name, arg): change the open state's argument (a client-care tab) without a new history entry */
    update: function (name, arg) {
      if (!cur || cur.name !== name) return false;
      cur.arg = arg == null ? null : String(arg);
      replace(hashFor(name, cur.arg));
      return true;
    }
  };

  /* ---------- Start: register what the page marks up, then open the address's state ---------- */
  P.ready(function () {
    P.$$('[data-overlay]').forEach(function (el) {
      var name = el.getAttribute('data-overlay');
      if (!reg[name]) register(name, { el: el });
    });
    setTimeout(function () {
      initialDone = true;
      var want = parse(location.hash);
      if (want && reg[want.name] && !cur) open(want.name, { arg: want.arg, from: 'load' });
    }, 0);
  });
})();
