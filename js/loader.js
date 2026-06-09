/* ============================================================
   CNMO — Homepage Load Animation (session-aware)
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'cnmo_visited';
  const SEQUENCE_MS = 3500;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createLoader() {
    const overlay = document.createElement('div');
    overlay.id = 'cnmo-loader';
    overlay.className = 'cnmo-loader';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-label', 'Loading CNMO');

    overlay.innerHTML = `
      <div class="cnmo-loader-glow" aria-hidden="true"></div>
      <div class="cnmo-loader-content">
        <img src="images/cnmo-logo-remove-bg.png" alt="" class="cnmo-loader-logo" width="96" height="96">
        <p class="cnmo-loader-name">CNMO</p>
        <div class="cnmo-loader-bar-track" aria-hidden="true">
          <span class="cnmo-loader-bar-fill"></span>
        </div>
      </div>
    `;

    return overlay;
  }

  function removeLoader(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  function finish(overlay) {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    removeLoader(overlay);
  }

  function runSequence(overlay) {
    if (prefersReduced) {
      finish(overlay);
      return;
    }

    requestAnimationFrame(() => {
      overlay.classList.add('is-running');
      overlay.classList.add('is-exiting');
    });

    window.setTimeout(() => finish(overlay), SEQUENCE_MS);
  }

  function init() {
    const existing = document.getElementById('cnmo-loader');

    if (sessionStorage.getItem(STORAGE_KEY)) {
      removeLoader(existing);
      return;
    }

    const overlay = existing || createLoader();

    if (!existing) {
      document.body.insertBefore(overlay, document.body.firstChild);
    }

    runSequence(overlay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
