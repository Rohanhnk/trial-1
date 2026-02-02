// ux.js — lightweight UX enhancements: fade-in on scroll and smooth page fades
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fade-in on scroll
  function setupFadeIn() {
    if (prefersReduced) return;

    var selector = 'main > section, .hero, .page-header, .gallery-preview__item, .highlight-card, .form-card, .contact-card, .map-placeholder';
    var items = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!items.length) return;

    items.forEach(function (el) {
      if (!el.classList.contains('fade-in-section')) el.classList.add('fade-in-section');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  // Smooth page transition on link click (fade-out)
  function setupPageTransitions() {
    if (prefersReduced) return;

    document.addEventListener('click', function (ev) {
      var a = ev.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      // ignore external links, anchors, javascript, download, or targets that open new tab
      var target = a.getAttribute('target');
      var isSameOrigin = a.origin === window.location.origin;
      if (target === '_blank' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      if (href[0] === '#') return; // in-page anchor
      if (!isSameOrigin) return;

      // allow normal clicks for non-navigation (e.g. buttons with href="#")
      ev.preventDefault();
      document.body.classList.add('page-transition');
      setTimeout(function () { window.location.href = href; }, 260);
    }, { passive: false });

    // remove transition class on load (in case user navigated back)
    window.addEventListener('pageshow', function () {
      document.body.classList.remove('page-transition');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupFadeIn();
    setupPageTransitions();
  });
})();
