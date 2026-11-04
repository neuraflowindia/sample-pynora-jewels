/* Menu: the phone and tablet menu drawer (#menu), which slides in from the left.
   overlay.js opens and closes it, keeps focus inside and returns it to the menu button; this file starts it on
   the close button and closes it when the window widens to laptop size, where the header shows the collections
   itself and the menu button is gone. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  P.ready(function () {
    if (!P.overlay || !P.$('[data-overlay="menu"]')) return;
    P.overlay.register('menu', { initialFocus: '[data-close]' });

    var wide = window.matchMedia ? window.matchMedia('(min-width: 1080px)') : null;
    if (!wide) return;
    function onWide() { if (wide.matches && P.overlay.isOpen('menu')) P.overlay.close('menu'); }
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  });
})();
