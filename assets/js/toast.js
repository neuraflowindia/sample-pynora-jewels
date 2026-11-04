/* Pynora toast: one short message at a time, at the bottom of the screen.
   Pynora.toast.show({icon, text, action}):
     icon    a sprite name without "i-" ("heart", "check", "shopping-bag"); a heart is filled dusty rose
     text    the words
     action  optional {text, href} (a link, for example "#wishlist") or {text, onClick} (a button); onClick may
             return the element that should take focus afterwards (the line put back by "Undo")
   After the action is pressed, focus goes back to the control that was focused when the message appeared (or
   the element onClick returned), never to the top of the page; a drawer opened by "View" returns focus there
   when it closes. It stays 3.2 s, or 5 s with an action, and waits while the pointer or focus is on it. A new message
   replaces the one showing. The words are read out through the role="status" region [data-toast].
   Pynora.toast.hide() takes it away at once. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var doc = document;
  var SVG = 'http://www.w3.org/2000/svg';
  var STAY = 3200;
  var STAY_ACTION = 5000;
  var OUT = 220;   /* ms, the closing slide */

  var region = null;
  var card = null;
  var timer = 0;
  var outTimer = 0;
  var left = 0;
  var startedAt = 0;
  var held = { hover: false, focus: false };
  var origin = null;   /* the control focused when the message appeared */

  function getRegion() {
    if (region && region.isConnected) return region;
    region = doc.querySelector('[data-toast]');
    if (!region) {
      region = doc.createElement('div');
      region.className = 'toast';
      region.setAttribute('data-toast', '');
      region.setAttribute('data-overlay-keep', '');
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      doc.body.appendChild(region);
    }
    region.addEventListener('mouseenter', function () { held.hover = true; pause(); });
    region.addEventListener('mouseleave', function () { held.hover = false; resume(); });
    region.addEventListener('focusin', function () { held.focus = true; pause(); });
    region.addEventListener('focusout', function (e) {
      if (region.contains(e.relatedTarget)) return;
      held.focus = false;
      resume();
    });
    return region;
  }

  function icon(name) {
    var svg = doc.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'i');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = doc.createElementNS(SVG, 'use');
    use.setAttribute('href', '#i-' + name);
    svg.appendChild(use);
    return svg;
  }

  function build(opts) {
    var el = doc.createElement('div');
    el.className = 'toast__card';
    if (opts.icon) {
      var orb = doc.createElement('span');
      orb.className = 'toast__orb';
      orb.setAttribute('data-icon', opts.icon);
      orb.appendChild(icon(opts.icon));
      el.appendChild(orb);
    }
    var words = doc.createElement('span');
    words.className = 'toast__text';
    words.textContent = opts.text || '';
    el.appendChild(words);
    var act = opts.action;
    if (act && act.text) {
      var link;
      if (act.href) {
        link = doc.createElement('a');
        link.href = act.href;
      } else {
        link = doc.createElement('button');
        link.type = 'button';
      }
      link.className = 'toast__action';
      link.textContent = act.text;
      link.addEventListener('click', function (e) {
        var back = origin;
        var state = act.href ? stateOf(act.href) : null;
        if (state) {
          /* "View": the drawer opens as if from the control the message is about, so closing it returns there */
          e.preventDefault();
          hide();
          P.overlay.open(state, { opener: usable(back) ? back : null });
          return;
        }
        var made = typeof act.onClick === 'function' ? act.onClick(e) : null;
        hide();
        if (!act.href) settle(made, back);
      });
      el.appendChild(link);
    }
    return el;
  }

  /* "#wishlist" → "wishlist" when the address is one of the page's own states */
  function stateOf(href) {
    if (!P.overlay || href.charAt(0) !== '#') return null;
    var name = href.slice(1);
    return P.overlay.states.indexOf(name.split('/')[0]) >= 0 ? name : null;
  }
  function usable(n) {
    return !!(n && n.nodeType === 1 && n.isConnected && n.getClientRects().length && !n.closest('[inert]') && !n.closest('[hidden]') && !(region && region.contains(n)));
  }
  function focusEl(n) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }
  /* after the action: the element it named, else the control the message was about, else the open drawer */
  function settle(made, back) {
    var list = [made, back];
    for (var i = 0; i < list.length; i++) if (usable(list[i])) { focusEl(list[i]); return; }
    var open = doc.querySelector('[data-overlay].is-open');
    var close = open && open.querySelector('[data-close]');
    if (close && usable(close)) focusEl(close);
  }

  function pause() {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
    left = Math.max(600, left - (Date.now() - startedAt));
  }
  function resume() {
    if (!card || timer || held.hover || held.focus) return;
    run(left);
  }
  function run(ms) {
    clearTimeout(timer);
    left = ms;
    startedAt = Date.now();
    timer = setTimeout(function () { timer = 0; hide(); }, ms);
  }

  function hide() {
    clearTimeout(timer);
    timer = 0;
    if (!card) return;
    var old = card;
    card = null;
    held.hover = false;
    held.focus = false;
    if (old.contains(doc.activeElement)) doc.activeElement.blur();
    old.classList.remove('is-shown');
    if (P.reduced()) { old.remove(); return; }
    clearTimeout(outTimer);
    outTimer = setTimeout(function () { old.remove(); }, OUT);
  }

  function show(opts) {
    opts = opts || {};
    if (!opts.text) return;
    var reg = getRegion();
    clearTimeout(outTimer);
    var wasFocused = card && card.contains(doc.activeElement);
    var now = doc.activeElement;
    if (!wasFocused) origin = now && now !== doc.body && now !== doc.documentElement && !reg.contains(now) ? now : null;
    while (reg.firstChild) reg.removeChild(reg.firstChild);
    card = build(opts);
    reg.appendChild(card);
    if (P.reduced()) card.classList.add('is-shown');
    else {
      void card.offsetWidth;
      card.classList.add('is-shown');
    }
    held.hover = reg.matches(':hover');
    held.focus = false;
    if (wasFocused) {
      var next = card.querySelector('.toast__action');
      if (next) { next.focus(); held.focus = true; }
    }
    left = opts.action && opts.action.text ? STAY_ACTION : STAY;
    if (!held.hover) run(left);
  }

  P.toast = { show: show, hide: hide };
})();
