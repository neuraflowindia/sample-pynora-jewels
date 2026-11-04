/* Footer: the sign-up box and the lists that fold on phones.
   - Sign-up ([data-nl]): accepts an email, or an Indian mobile number (10 digits starting 6-9, with or without
     +91, 91 or 0 in front; spaces and dashes allowed). Anything else shows the error line under the field
     (between the field and the button on phones), with aria-invalid and aria-describedby on the field, until
     the words are corrected. An accepted entry wipes the
     box across to the thank-you line and puts #newsletter-thanks in the address (Back brings the empty box
     again; the same address on arrival shows the thank-you line). Nothing is sent and nothing is stored.
   - Folding lists (.ftr__col[data-fold]): the “+” button opens and closes its list; the stylesheet folds them on
     phones only. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;
  var MOBILE = /^(?:\+?91|0)?[6-9]\d{9}$/;

  function accepted(value) {
    var v = String(value || '').trim();
    if (!v) return false;
    if (v.indexOf('@') >= 0) return EMAIL.test(v);
    return MOBILE.test(v.replace(/[\s-]/g, ''));
  }

  function setupSignUp(box) {
    var form = P.$('form', box);
    var input = form && P.$('input', form);
    var field = form && P.$('.nl__field', form);
    var err = P.$('.nl__err', box);
    var ok = P.$('.nl__ok', box);
    if (!form || !input || !field || !err || !ok) return;

    function showError(on) {
      field.classList.toggle('is-err', on);
      err.hidden = !on;
      if (on) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', err.id);
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }

    function thank(moving) {
      if (box.classList.contains('is-done')) return;
      box.classList.toggle('no-wipe', !moving || P.reduced());
      box.classList.add('is-done');
      form.inert = true;
      form.setAttribute('aria-hidden', 'true');
      if (moving) {
        try { ok.focus({ preventScroll: true }); } catch (e) { ok.focus(); }
      }
    }

    function reset() {
      if (!box.classList.contains('is-done')) return;
      box.classList.add('no-wipe');
      box.classList.remove('is-done');
      form.inert = false;
      form.removeAttribute('aria-hidden');
      input.value = '';
      showError(false);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!accepted(input.value)) {
        showError(true);
        input.focus();
        return;
      }
      showError(false);
      input.blur();
      thank(true);
      if (P.overlay && !P.overlay.isOpen('newsletter-thanks')) P.overlay.open('newsletter-thanks');
    });

    input.addEventListener('input', function () {
      if (field.classList.contains('is-err') && accepted(input.value)) showError(false);
    });

    if (P.overlay) {
      P.overlay.register('newsletter-thanks', {
        modal: false,
        onOpen: function () { thank(false); },
        onClose: function (info) { if (info && info.from === 'history') reset(); }
      });
    }
  }

  function setupFold(col) {
    var btn = P.$('.ftr__fold', col);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      col.classList.toggle('is-open', open);
    });
  }

  P.newsletter = { accepted: accepted };

  P.ready(function () {
    P.$$('[data-nl]').forEach(setupSignUp);
    P.$$('.ftr__col[data-fold]').forEach(setupFold);
  });
})();
