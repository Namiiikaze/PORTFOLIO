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
  var loaderVideo = loader && loader.querySelector('.loader-video');
  var introSequence = document.getElementById('introSequence');
  var introVideo = introSequence && introSequence.querySelector('.intro-sequence__video');

  if (loaderVideo) {
    loaderVideo.muted = true;
    loaderVideo.defaultMuted = true;
    loaderVideo.volume = 0;
    loaderVideo.playbackRate = 1.1;
  }

  // The dance loader belongs only to the initial portfolio entry page.
  var isFirstVisit = body.hasAttribute('data-loader-entry');

  var LOADER_TIMELINE = 11370;
  var loaderPct   = 0;      // current displayed percentage
  var loaderStart = null;   // rAF timestamp of the first frame
  var loaderRAF   = null;
  var loaderExitTimer = null;
  var loaderRemoveTimer = null;
  var introRemoveTimer = null;
  var introFallbackTimer = null;
  var entrySequenceStarted = false;

  function paintLoader(p) {
    var v = p < 0 ? 0 : p > 100 ? 100 : Math.round(p);
    if (loaderFill)  loaderFill.style.transform = 'scaleX(' + (v / 100) + ')';
    if (loaderLabel) loaderLabel.textContent = v + '%';
  }

  function loaderFrame(now) {
    if (loaderStart === null) loaderStart = now;
    var t = Math.min(1, (now - loaderStart) / LOADER_TIMELINE);
    var next = t * 100;
    if (next > loaderPct) loaderPct = next;
    paintLoader(loaderPct);

    if (t >= 1) {
      paintLoader(100);
      finishLoader();
      return;
    }
    loaderRAF = requestAnimationFrame(loaderFrame);
  }

  function hideLoader() {
    if (!loader) return;
    loader.classList.add('is-hidden');
    if (loaderRemoveTimer) clearTimeout(loaderRemoveTimer);
    loaderRemoveTimer = setTimeout(function () {
      if (loader.classList.contains('is-hidden')) loader.style.display = 'none';
    }, 220);
  }

  function hideIntroSequence() {
    if (!introSequence) return;
    if (introFallbackTimer) clearTimeout(introFallbackTimer);
    introSequence.classList.add('is-hidden');
    introSequence.setAttribute('aria-hidden', 'true');
    if (introRemoveTimer) clearTimeout(introRemoveTimer);
    introRemoveTimer = setTimeout(function () {
      if (introSequence.classList.contains('is-hidden')) introSequence.style.display = 'none';
    }, 720);
  }

  function startIntroSequence() {
    if (!introSequence || !isFirstVisit) return;
    if (introRemoveTimer) clearTimeout(introRemoveTimer);
    introSequence.style.display = 'grid';
    introSequence.classList.remove('is-hidden');
    introSequence.setAttribute('aria-hidden', 'false');

    if (!introVideo) {
      hideIntroSequence();
      return;
    }

    introVideo.muted = true;
    introVideo.defaultMuted = true;
    introVideo.volume = 0;
    introVideo.currentTime = 0;
    introVideo.play().catch(hideIntroSequence);

    if (isFinite(introVideo.duration) && introVideo.duration > 0) {
      introFallbackTimer = setTimeout(hideIntroSequence, (introVideo.duration * 1000) + 500);
    }
  }

  function finishLoader() {
    if (entrySequenceStarted) return;
    entrySequenceStarted = true;
    hideLoader();
    // Allow the loader fade to complete before the intro motion takes over.
    setTimeout(startIntroSequence, 220);
  }

  function startLoader() {
    if (!loader || !isFirstVisit) return;
    if (loaderRAF) cancelAnimationFrame(loaderRAF);
    if (loaderExitTimer) clearTimeout(loaderExitTimer);
    if (loaderRemoveTimer) clearTimeout(loaderRemoveTimer);
    loaderPct = 0; loaderStart = null;
    loader.style.display = 'grid';
    loader.classList.remove('is-hidden');
    if (loaderVideo) {
      loaderVideo.currentTime = 0;
      loaderVideo.playbackRate = 1.1;
      loaderVideo.play().catch(function () {});
    }
    paintLoader(0);
    loaderRAF = requestAnimationFrame(loaderFrame);
    loaderExitTimer = setTimeout(function () {
      paintLoader(100);
      finishLoader();
      if (loaderRAF) cancelAnimationFrame(loaderRAF);
    }, LOADER_TIMELINE);
  }

  if (introVideo) {
    introVideo.addEventListener('ended', hideIntroSequence);
    introVideo.addEventListener('error', hideIntroSequence);
    introVideo.addEventListener('loadedmetadata', function () {
      if (!introSequence || introSequence.classList.contains('is-hidden') || !isFinite(introVideo.duration)) return;
      if (introFallbackTimer) clearTimeout(introFallbackTimer);
      introFallbackTimer = setTimeout(hideIntroSequence, (introVideo.duration * 1000) + 500);
    });
  }

  if (loader) {
    if (isFirstVisit) {
      startLoader();
    } else {
      loader.style.display = 'none';
    }
  }

  if (introSequence && !isFirstVisit) introSequence.style.display = 'none';

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

  /* ---------- Billie Jean hover floor ---------- */
  var billieFloor = document.getElementById('billieFloor');
  var billieTile = billieFloor && billieFloor.querySelector('.billie-floor__tile');
  var activeFloorCell = '';
  var queuedFloorCell = '';
  var queuedFloorX = 0;
  var queuedFloorY = 0;
  var floorFadeTimer = null;
  var isFloorFading = false;

  function lightQueuedFloorCell() {
    if (!billieTile || !queuedFloorCell) return;
    billieTile.style.setProperty('--floor-x', queuedFloorX + 'px');
    billieTile.style.setProperty('--floor-y', queuedFloorY + 'px');
    activeFloorCell = queuedFloorCell;
    queuedFloorCell = '';
    isFloorFading = false;
    requestAnimationFrame(function () {
      billieTile.classList.add('is-lit');
    });
  }

  function lightFloorCell(x, y) {
    if (!billieTile) return;
    var unit = billieTile.getBoundingClientRect().width || Math.max(48, Math.min(88, window.innerWidth * 0.05));
    var floorX = Math.floor(x / unit) * unit;
    var floorY = Math.floor(y / unit) * unit;
    var cell = floorX + ':' + floorY;
    if (cell === activeFloorCell || cell === queuedFloorCell) return;
    queuedFloorCell = cell;
    queuedFloorX = floorX;
    queuedFloorY = floorY;

    if (isFloorFading) return;

    if (!billieTile.classList.contains('is-lit')) {
      lightQueuedFloorCell();
      return;
    }

    billieTile.classList.remove('is-lit');
    activeFloorCell = '';
    isFloorFading = true;
    if (floorFadeTimer) clearTimeout(floorFadeTimer);
    floorFadeTimer = setTimeout(lightQueuedFloorCell, 400);
  }

  document.addEventListener('pointermove', function (event) {
    lightFloorCell(event.clientX, event.clientY);
  }, { passive: true });

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
