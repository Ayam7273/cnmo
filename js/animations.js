/* ============================================================
   CNMO — Scroll Animation Engine (Intersection Observer)
   ============================================================ */

(function () {
  'use strict';

  const SCROLL_CLASSES = [
    'anim-fade-up',
    'anim-fade-down',
    'anim-from-left',
    'anim-from-right',
    'anim-fade-in',
    'anim-scale-up'
  ];

  const SCROLL_SELECTOR = SCROLL_CLASSES.map((c) => `.${c}`).join(', ');
  const THRESHOLD = 0.15;
  const STAGGER_STEP_MS = 120;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyStaggerChildren() {
    document.querySelectorAll('.anim-stagger-children').forEach((parent) => {
      Array.from(parent.children).forEach((child, index) => {
        if (!SCROLL_CLASSES.some((cls) => child.classList.contains(cls))) {
          child.classList.add('anim-fade-up');
        }
        if (!child.dataset.delay) {
          child.dataset.delay = String(index * STAGGER_STEP_MS);
        }
      });
    });
  }

  function getDelayMs(el) {
    const value = parseInt(el.dataset.delay, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function primeWillChange(el) {
    el.style.willChange = 'transform, opacity';
  }

  function clearWillChange(el) {
    el.style.willChange = '';
  }

  function revealElement(el) {
    const delay = getDelayMs(el);

    if (prefersReduced) {
      el.classList.add('is-animated');
      return;
    }

    primeWillChange(el);

    if (delay > 0) {
      window.setTimeout(() => el.classList.add('is-animated'), delay);
    } else {
      el.classList.add('is-animated');
    }
  }

  function initScrollAnimations() {
    applyStaggerChildren();

    const targets = document.querySelectorAll(SCROLL_SELECTOR);
    if (!targets.length) return;

    if (prefersReduced) {
      targets.forEach((el) => el.classList.add('is-animated'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          revealElement(el);
          observer.unobserve(el);
        });
      },
      { threshold: THRESHOLD }
    );

    targets.forEach((el) => observer.observe(el));
  }

  document.addEventListener('animationend', (event) => {
    const el = event.target;
    if (el instanceof HTMLElement && el.classList.contains('is-animated')) {
      clearWillChange(el);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
})();
