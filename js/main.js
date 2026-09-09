/* =====================================================================
   Ayobami Shoyombo | Portfolio
   Menu toggle · scroll reveals · page-transition loader
   ===================================================================== */
(function () {
  'use strict';

  var body = document.body;

  /* ---------- Page transition loader ---------- */
  var loader      = document.getElementById('pageLoader');
  var loaderFill  = loader && loader.querySelector('.loader-fill');
  var loaderLabel = document.getElementById('loaderPercent');

  // Only animate once per browser session, the first time someone enters the site.
  var LOADER_SEEN_KEY = 'portfolioLoaderSeen';
  var isFirstVisit;
  try {
    isFirstVisit = !sessionStorage.getItem(LOADER_SEEN_KEY);
  } catch (err) {
    isFirstVisit = true; // sessionStorage unavailable (e.g. privacy mode); default to showing it once
  }

  var MIN_VISIBLE = 2200;   // ms for the count-up to climb 0 -> 100% (deliberately unhurried)
  var loaderPct   = 0;      // current displayed percentage
  var loaderStart = null;   // rAF timestamp of the first frame
  var pageLoaded  = false;  // window 'load' has fired
  var loaderRAF   = null;

  function paintLoader(p) {
    var v = p < 0 ? 0 : p > 100 ? 100 : Math.round(p);
    if (loaderFill)  loaderFill.style.width = v + '%';
    if (loaderLabel) loaderLabel.textContent = v + '%';
  }

  function loaderFrame(now) {
    if (loaderStart === null) loaderStart = now;
    var t = Math.min(1, (now - loaderStart) / MIN_VISIBLE);
    var eased = 1 - Math.pow(1 - t, 3);           // easeOutCubic
    // Hold at 90% until the page has actually loaded, then let it finish to 100%.
    var next = eased * (pageLoaded ? 100 : 90);
    if (next > loaderPct) loaderPct = next;
    paintLoader(loaderPct);

    if (pageLoaded && loaderPct >= 100) {
      paintLoader(100);
      setTimeout(hideLoader, 260);                // let 100% register before fading out
      return;
    }
    loaderRAF = requestAnimationFrame(loaderFrame);
  }

  function hideLoader() {
    if (loader) loader.classList.add('is-hidden');
  }

  function markLoaderSeen() {
    try { sessionStorage.setItem(LOADER_SEEN_KEY, '1'); } catch (err) { /* ignore */ }
  }

  function startLoader() {
    if (!loader || !isFirstVisit) return;
    if (loaderRAF) cancelAnimationFrame(loaderRAF);
    loaderPct = 0; loaderStart = null; pageLoaded = false;
    loader.classList.remove('is-hidden');
    paintLoader(0);
    loaderRAF = requestAnimationFrame(loaderFrame);
  }

  if (loader) {
    if (isFirstVisit) {
      if (document.readyState === 'complete') pageLoaded = true;
      window.addEventListener('load', function () { pageLoaded = true; });
      setTimeout(function () { pageLoaded = true; }, 6000);   // safety: never stall forever
      loaderRAF = requestAnimationFrame(loaderFrame);
      markLoaderSeen();
    } else {
      loader.style.transition = 'none';   // hide instantly, no fade, on repeat visits
      hideLoader();
    }
  }

  // Show the loader when navigating to another internal page (first visit only)
  document.querySelectorAll('a[href]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!isFirstVisit) return;
      var href = link.getAttribute('href');
      // Skip: new-tab, modifier-clicks, anchors, mailto/tel, external links
      if (
        link.target === '_blank' ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
        !href || href.charAt(0) === '#' ||
        /^(mailto:|tel:)/.test(href) ||
        /^https?:\/\//.test(href)
      ) return;
      startLoader();
    });
  });
  // Restore state if the user navigates back (bfcache)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) hideLoader();
  });

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('menuToggle');
  var menu   = document.getElementById('mobileMenu');

  function openMenu() {
    body.classList.add('menu-open');
    body.style.overflow = 'hidden';                 // lock scroll
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    menu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    body.classList.remove('menu-open');
    body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    menu.setAttribute('aria-hidden', 'true');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      body.classList.contains('menu-open') ? closeMenu() : openMenu();
    });

    // Close when a menu link is tapped
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) closeMenu();
    });

    // Reset menu state if resized up to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && body.classList.contains('menu-open')) closeMenu();
    });
  }

  /* ---------- Scroll reveals ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Play project videos only while in view ---------- */
  var vids = document.querySelectorAll('.project__media video');
  if ('IntersectionObserver' in window && vids.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          v.play().catch(function () {});   // muted autoplay is allowed
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });

    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- Dark mode toggle ---------- */
  function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }

  ['themeToggle', 'themeToggleMob'].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function () {
        applyTheme(!document.documentElement.classList.contains('dark'));
      });
    }
  });
})();
