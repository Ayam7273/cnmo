/* ============================================================
   CNMO — Events Page Modal
   ============================================================ */

(function () {
  const overlay = document.getElementById('eventModalOverlay');
  const modal = document.getElementById('eventModal');
  if (!overlay || !modal) return;

  const els = {
    image: document.getElementById('eventModalImage'),
    badge: document.getElementById('eventModalBadge'),
    title: document.getElementById('eventModalTitle'),
    subtitle: document.getElementById('eventModalSubtitle'),
    meta: document.getElementById('eventModalMeta'),
    description: document.getElementById('eventModalDescription'),
    cta: document.getElementById('eventModalCta'),
    ended: document.getElementById('eventModalEnded'),
    close: document.getElementById('closeEventModal')
  };

  let lastFocused = null;
  let focusTrapHandler = null;

  function getFocusable(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
  }

  function trapFocus() {
    focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable(modal);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', focusTrapHandler);
  }

  function releaseFocusTrap() {
    if (focusTrapHandler) {
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
  }

  function lockScroll() { document.body.style.overflow = 'hidden'; }
  function unlockScroll() { document.body.style.overflow = ''; }

  function buildMeta(card) {
    const items = [];
    const fields = [
      { key: 'date', icon: 'fa-calendar' },
      { key: 'time', icon: 'fa-clock' },
      { key: 'location', icon: 'fa-map-marker-alt' },
      { key: 'platform', icon: 'fa-video' }
    ];

    fields.forEach(({ key, icon }) => {
      const value = card.dataset[key];
      if (value) {
        items.push(`<p><i class="fas ${icon}"></i>${value}</p>`);
      }
    });

    return items.join('');
  }

  function openModal(card) {
    const type = card.dataset.eventType || 'inperson';
    const isPast = type === 'past';

    els.image.src = card.dataset.image || '';
    els.image.alt = card.dataset.title || 'Event image';
    els.title.textContent = card.dataset.title || '';

    const subtitle = card.dataset.subtitle;
    if (subtitle) {
      els.subtitle.textContent = subtitle;
      els.subtitle.hidden = false;
    } else {
      els.subtitle.hidden = true;
    }

    els.badge.textContent = card.dataset.badge || '';
    els.badge.className = 'event-modal-badge';
    if (type === 'zoom') els.badge.classList.add('badge-zoom');
    else if (type === 'inperson') els.badge.classList.add('badge-inperson');
    else if (isPast) els.badge.classList.add('badge-past');

    els.meta.innerHTML = buildMeta(card);
    els.description.textContent = card.dataset.description || '';

    if (isPast) {
      els.cta.hidden = true;
      els.ended.hidden = false;
    } else {
      els.ended.hidden = true;
      els.cta.hidden = false;
      const href = card.dataset.ctaHref || 'contact.html';
      els.cta.href = href;
      els.cta.textContent = type === 'zoom' ? 'Join Event' : 'Register for Event';
      if (/^https?:\/\//i.test(href)) {
        els.cta.setAttribute('target', '_blank');
        els.cta.setAttribute('rel', 'noopener noreferrer');
      } else {
        els.cta.removeAttribute('target');
        els.cta.removeAttribute('rel');
      }
    }

    lastFocused = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    lockScroll();
    trapFocus();
    els.close.focus();
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    unlockScroll();
    releaseFocusTrap();
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('.event-card[data-event]').forEach(card => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-haspopup', 'dialog');

    card.addEventListener('click', () => openModal(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card);
      }
    });
  });

  els.close.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });
})();
