/* The page-not-found page (404.html, served for any address that matches no file).
   - "Search the shop" leads to every piece when no script runs; with the script it opens the search sheet.
   - The four new pieces under the message are drawn by cards.js from the catalogue; when the page is ready each
     card's list item is marked data-row for the scroll arrival.
   A classic script, loaded with defer after cards.js. */
(function () {
  'use strict';

  var P = window.Pynora;
  if (!P) return;

  var search = P.$('[data-nf-search]');
  if (search) search.setAttribute('href', '#search');

  P.ready(function () {
    P.$$('main [data-cards] > li').forEach(function (li) { li.setAttribute('data-row', ''); });
    if (P.motion && typeof P.motion.refresh === 'function') { try { P.motion.refresh(document.getElementById('main')); } catch (e) { /* the page stays still */ } }
  });
})();
