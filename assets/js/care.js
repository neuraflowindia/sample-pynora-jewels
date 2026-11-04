/* Client care: the six tabs of the client-care drawer, kept in the address as #care/<tab>.
   - Tabs: shipping, exchanges, made-to-order, care-guide, faqs, our-story. Any link to #care/<tab> (the strip,
     the footer, the menu) opens the drawer on that tab; an unknown tab opens Shipping & delivery.
   - The tabs follow the usual keys: ← and → move between them (and choose), Home and End jump to the first and
     last. Choosing a tab changes the address without a new history entry, so Back still closes the drawer.
   - Every word comes from the catalogue’s blocks (delivery, payment, exchange, packaging, mtoSteps, care, faq,
     ourStory). A tab whose words are missing is left out; without the catalogue each panel holds one line,
     "Ask us anything on WhatsApp", the same link as the foot. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var DEFAULT = 'shipping';
  var el = null;
  var tabs = [];
  var body = null;
  var current = DEFAULT;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function icon(name) { return '<svg class="i" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; }
  function p(text) { return text ? '<p>' + esc(text) + '</p>' : ''; }
  function h(text) { return '<h3>' + esc(text) + '</h3>'; }

  /* "10 days to 4 weeks": the shortest and longest making times of the made-to-order pieces */
  function makingTime() {
    var list = ((P.cat && P.cat.products) || []).filter(function (x) { return x.availability && x.availability.type !== 'ready'; });
    if (!list.length) return '';
    var days = function (n, unit) { return unit === 'weeks' ? n * 7 : n; };
    var lo = null, hi = null;
    list.forEach(function (x) {
      var a = x.availability;
      var mn = days(a.min, a.unit), mx = days(a.max != null ? a.max : a.min, a.unit);
      if (!lo || mn < lo.d) lo = { d: mn, n: a.min, unit: a.unit };
      if (!hi || mx > hi.d) hi = { d: mx, n: a.max != null ? a.max : a.min, unit: a.unit };
    });
    if (!isFinite(lo.d) || !isFinite(hi.d)) return '';
    var say = function (x) { return x.n + ' ' + (x.unit === 'weeks' ? (x.n === 1 ? 'week' : 'weeks') : (x.n === 1 ? 'day' : 'days')); };
    return lo.d === hi.d ? say(hi) : say(lo) + ' to ' + say(hi);
  }
  function fillTime(text) {
    if (!text || text.indexOf('{time}') < 0) return text;
    var t = makingTime();
    return t ? text.replace('{time}', t) : text.replace(' in {time}', '').replace('{time}', '');
  }

  /* ---------- Each tab’s words ---------- */
  function write(b) {
    var d = b.delivery || {}, pay = b.payment || {}, ex = b.exchange || {}, care = b.care || {};
    var out = {};
    if (d.ready || d.mto) {
      out.shipping =
        (d.ready ? h('Pieces ready to ship') + p(d.ready) + p(pay.ready) : '') +
        (d.mto ? h('Pieces made to order') + p(fillTime(d.mto)) + p(pay.mto) : '') +
        (d.worldwide ? h('Outside India') + p(d.worldwide) : '') +
        (b.packaging ? h('In the box') + p(b.packaging) : '');
    }
    if (ex.ready || ex.mto) {
      out.exchanges =
        (ex.ready ? h('Pieces ready to ship') + p(ex.ready) : '') +
        (ex.mto ? h('Pieces made to order') + p(ex.mto) : '');
    }
    if (b.mtoSteps && b.mtoSteps.length) {
      out['made-to-order'] =
        h('How it works') +
        '<ol class="care__steps">' + b.mtoSteps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        p(fillTime(d.mto)) + p(pay.mto) + (ex.mto ? p(ex.mto) : '');
    }
    if (care.jewellery || care.bag || care.decor) {
      out['care-guide'] =
        (care.jewellery ? h('Jewellery') + p(care.jewellery) : '') +
        (care.bag ? h('Bags') + p(care.bag) : '') +
        (care.decor ? h('Décor') + p(care.decor) : '');
    }
    if (b.faq && b.faq.length) {
      out.faqs = '<div class="care__faq">' + b.faq.map(function (qa) {
        return '<details><summary>' + esc(qa[0]) + icon('down') + '</summary><div class="care__answer"><p>' + esc(qa[1]) + '</p></div></details>';
      }).join('') + '</div>';
    }
    var s = b.ourStory;
    if (s) {
      var paras = typeof s === 'string' ? [s] : Array.isArray(s) ? s : (s.paragraphs || (s.text ? [].concat(s.text) : []));
      var html = paras.map(function (x) { return Array.isArray(x) ? h(x[0]) + p(x[1]) : p(x); }).join('');
      if (s.quote) {
        html += '<blockquote class="care__quote"><p>“' + esc(s.quote) + '”</p>' + (s.quoteBy ? '<footer>' + esc(s.quoteBy) + '</footer>' : '') + '</blockquote>';
      }
      if (html) out['our-story'] = html;
    }
    return out;
  }

  /* ---------- Tabs ---------- */
  function shown() { return tabs.filter(function (t) { return !t.hidden; }); }
  function known(name) { return shown().some(function (t) { return t.getAttribute('data-tab') === name; }); }
  function tabFor(name) { return tabs.filter(function (t) { return t.getAttribute('data-tab') === name; })[0] || null; }

  function select(name, opts) {
    opts = opts || {};
    if (!known(name)) name = known(DEFAULT) ? DEFAULT : (shown()[0] && shown()[0].getAttribute('data-tab'));
    if (!name) return;
    var changed = name !== current;
    current = name;
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (changed && body) body.scrollTop = 0;
    if (opts.focus) { var t = tabFor(name); if (t) t.focus(); }
    if (opts.address && P.overlay && P.overlay.isOpen('care') && P.overlay.arg() !== name) P.overlay.update('care', name);
  }

  function onKey(e) {
    var t = e.target.closest && e.target.closest('.care__tab');
    if (!t) return;
    var list = shown();
    var i = list.indexOf(t);
    var j = -1;
    if (e.key === 'ArrowRight' || e.key === 'Right') j = (i + 1) % list.length;
    else if (e.key === 'ArrowLeft' || e.key === 'Left') j = (i - 1 + list.length) % list.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = list.length - 1;
    if (j < 0) return;
    e.preventDefault();
    select(list[j].getAttribute('data-tab'), { focus: true, address: true });
  }

  function setup() {
    el = P.$('[data-overlay="care"]');
    if (!el) return;
    tabs = P.$$('.care__tab', el);
    body = P.$('[data-care-body]', el);
    if (P.cat && P.cat.blocks) {
      var words = write(P.cat.blocks);
      tabs.forEach(function (t) {
        var name = t.getAttribute('data-tab');
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (!panel) return;
        if (words[name]) panel.innerHTML = words[name];
        else { t.hidden = true; panel.hidden = true; }
      });
    }
    /* a panel left without words (no catalogue) holds one line: the foot's WhatsApp link */
    var ask = P.$('.care__foot a', el);
    if (ask) {
      tabs.forEach(function (t) {
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (!panel || t.hidden || panel.textContent.trim()) return;
        var line = document.createElement('p');
        line.className = 'care__ask';
        line.appendChild(ask.cloneNode(true));
        panel.appendChild(line);
      });
    }
    el.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('.care__tab');
      if (t) select(t.getAttribute('data-tab'), { address: true });
    });
    el.addEventListener('keydown', onKey);
    select(DEFAULT);
    if (P.overlay) {
      P.overlay.register('care', {
        onOpen: function (arg, info) {
          /* already open and the address chose another tab (Back, a link): focus follows the chosen tab */
          var follow = !!(info && info.again && el.contains(document.activeElement));
          select(arg || DEFAULT, { address: !!arg && !known(arg), focus: follow });
          if (!arg) P.overlay.update('care', current);
        },
        initialFocus: function () { return tabFor(current); }
      });
    }
  }

  P.ready(setup);
})();
