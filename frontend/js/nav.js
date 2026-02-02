// nav.js — add subtle shadow on scroll and highlight active page link
(function () {
  'use strict';

  function onScrollToggle(nav) {
    var should = window.scrollY > 8;
    nav.classList.toggle('site-nav--scrolled', should);
  }

  function setActiveLink(links) {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(function (a) {
      var href = a.getAttribute('href');
      // Normalize index behavior
      if (!href) return;
      var hrefName = href.split('/').pop();
      if (hrefName === path || (hrefName === 'index.html' && (path === '' || path === 'index.html'))) {
        a.classList.add('is-active');
      } else {
        a.classList.remove('is-active');
      }
      // add click handler to update active immediately on navigation within SPA-like flows
      a.addEventListener('click', function () {
        links.forEach(function (el) { el.classList.remove('is-active'); });
        a.classList.add('is-active');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav__links a'));

    // mobile toggle: create button if not present
    var wrapper = document.querySelector('.site-nav__wrapper');
    if (wrapper) {
      var toggle = wrapper.querySelector('.site-nav__toggle');
      if (!toggle) {
        toggle = document.createElement('button');
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.className = 'site-nav__toggle';
        toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
        // insert before the links so it appears left of them on narrow screens
        wrapper.insertBefore(toggle, wrapper.querySelector('.site-nav__links'));

        toggle.addEventListener('click', function (e) {
          var isOpen = nav.classList.toggle('site-nav--open');
          toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // close when clicking outside
        document.addEventListener('click', function (ev) {
          if (!nav.classList.contains('site-nav--open')) return;
          if (nav.contains(ev.target)) return;
          nav.classList.remove('site-nav--open');
          toggle.setAttribute('aria-expanded', 'false');
        }, { passive: true });

        // close on resize wider
        window.addEventListener('resize', function () {
          if (window.innerWidth > 900 && nav.classList.contains('site-nav--open')) {
            nav.classList.remove('site-nav--open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }

    // initial state
    onScrollToggle(nav);
    setActiveLink(links);

    // efficient scroll listener
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          onScrollToggle(nav);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  });
})();
