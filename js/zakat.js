/* ============================================================
   CNMO — Zakat & Sadaqah Modals
   ============================================================ */

(function () {
  const METALS_API_URL =
    'https://metals-api.com/api/latest?access_key=y2t7bxv2g5nmggsfvcj2dgo8731mvmce5k60nb9n2602e5m30ax1f7cdyz81&base=USD&symbols=XAU,XAG';
  const FOREX_API_URL = 'https://open.er-api.com/v6/latest/USD';

  const GOLD_NISAB_GRAMS = 87.48;
  const SILVER_NISAB_GRAMS = 612.36;
  const TROY_OZ_GRAMS = 31.1034768;
  const NISAB_CACHE_MS = 60 * 60 * 1000; // 1 hour

  const FALLBACK_NISAB = {
    gold: { GBP: 4200, USD: 5200, NGN: 8400000, EUR: 4900 },
    silver: { GBP: 320, USD: 390, NGN: 640000, EUR: 370 }
  };

  const CURRENCY_SYMBOLS = { GBP: '£', USD: '$', NGN: '₦', EUR: '€' };

  const zakatState = {
    nisabType: null,
    currency: null,
    zakatAmount: 0,
    fromCalculator: false
  };

  let nisabData = null;
  let nisabLoadPromise = null;
  let lastFocusedElement = null;
  let focusTrapHandler = null;

  /* --- Live Nisab rates --- */
  function computeNisabFromPrices(goldUsdPerOz, silverUsdPerOz, fxRates) {
    const goldUsd = (GOLD_NISAB_GRAMS / TROY_OZ_GRAMS) * goldUsdPerOz;
    const silverUsd = (SILVER_NISAB_GRAMS / TROY_OZ_GRAMS) * silverUsdPerOz;
    const currencies = ['USD', 'GBP', 'EUR', 'NGN'];
    const values = { gold: {}, silver: {} };

    currencies.forEach((cur) => {
      const rate = cur === 'USD' ? 1 : fxRates[cur];
      if (!rate) throw new Error(`Missing exchange rate for ${cur}`);
      values.gold[cur] = goldUsd * rate;
      values.silver[cur] = silverUsd * rate;
    });

    return values;
  }

  async function loadNisabRates(forceRefresh) {
    if (!forceRefresh && nisabData && Date.now() - nisabData.fetchedAt < NISAB_CACHE_MS) {
      return nisabData;
    }
    if (nisabLoadPromise) return nisabLoadPromise;

    nisabLoadPromise = (async () => {
      try {
        const [metalsRes, forexRes] = await Promise.all([
          fetch(METALS_API_URL),
          fetch(FOREX_API_URL)
        ]);

        if (!metalsRes.ok || !forexRes.ok) throw new Error('Rate request failed');

        const metals = await metalsRes.json();
        const forex = await forexRes.json();

        if (!metals.success || forex.result !== 'success') {
          throw new Error('Invalid rate response');
        }

        const goldUsdPerOz = metals.rates.USDXAU;
        const silverUsdPerOz = metals.rates.USDXAG;
        if (!goldUsdPerOz || !silverUsdPerOz) throw new Error('Missing metal prices');

        const values = computeNisabFromPrices(goldUsdPerOz, silverUsdPerOz, forex.rates);

        nisabData = {
          values,
          fetchedAt: Date.now(),
          priceDate: metals.date || null,
          live: true
        };
      } catch (err) {
        console.warn('Using fallback Nisab values:', err);
        nisabData = {
          values: FALLBACK_NISAB,
          fetchedAt: Date.now(),
          priceDate: null,
          live: false
        };
      } finally {
        nisabLoadPromise = null;
      }

      return nisabData;
    })();

    return nisabLoadPromise;
  }

  function getNisabValue(nisabType, currency) {
    const source = nisabData?.values || FALLBACK_NISAB;
    return source[nisabType]?.[currency] ?? FALLBACK_NISAB[nisabType][currency];
  }

  function setNisabThresholdLoading(isLoading) {
    const el = document.getElementById('zakatNisabThreshold');
    if (!el) return;
    if (isLoading) {
      el.textContent = "Today's Nisab threshold: Loading live prices…";
      el.classList.add('zakat-nisab-loading');
    } else {
      el.classList.remove('zakat-nisab-loading');
    }
  }

  function renderNisabThreshold() {
    const { nisabType, currency } = zakatState;
    const el = document.getElementById('zakatNisabThreshold');
    const noteEl = document.querySelector('.zakat-nisab-note');
    if (!el || !nisabType || !currency) return;

    const nisabValue = getNisabValue(nisabType, currency);
    el.textContent = `Today's Nisab threshold: ${formatMoney(nisabValue, currency)}`;

    if (noteEl) {
      if (nisabData?.live && nisabData.priceDate) {
        const formatted = new Date(nisabData.priceDate + 'T12:00:00').toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        noteEl.textContent =
          `Calculated from live gold & silver prices (${formatted}). Based on ${nisabType === 'gold' ? GOLD_NISAB_GRAMS + 'g gold' : SILVER_NISAB_GRAMS + 'g silver'}.`;
      } else {
        noteEl.textContent = 'Nisab values are approximate — live prices could not be loaded.';
      }
    }
  }

  /* --- Helpers --- */
  function formatMoney(amount, currency) {
    const symbol = CURRENCY_SYMBOLS[currency] || '';
    const formatted = Number(amount).toLocaleString('en-GB', {
      minimumFractionDigits: currency === 'NGN' ? 0 : 2,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2
    });
    return symbol + formatted;
  }

  function lockScroll() {
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
  }

  function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null || el === document.activeElement);
  }

  function trapFocus(modal) {
    focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements(modal);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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

  /* --- Zakat modal steps --- */
  function showZakatStep(stepId) {
    document.querySelectorAll('#zakatModal .modal-step').forEach(step => {
      step.classList.toggle('active', step.id === stepId);
    });
  }

  function resetZakatState() {
    zakatState.nisabType = null;
    zakatState.currency = null;
    zakatState.zakatAmount = 0;
    zakatState.fromCalculator = false;

    document.querySelectorAll('.zakat-nisab-option').forEach(btn => {
      btn.classList.remove('selected');
      btn.setAttribute('aria-pressed', 'false');
    });
    document.getElementById('zakatCurrencyPicker').hidden = true;
    document.querySelectorAll('.zakat-currency-btn').forEach(btn => btn.classList.remove('selected'));

    const form = document.getElementById('zakatCalcForm');
    if (form) {
      form.querySelectorAll('input[type="number"]').forEach(input => { input.value = 0; });
    }

    document.getElementById('zakatBelowNisab').hidden = true;
    document.getElementById('zakatProceedPayment').hidden = true;
    document.getElementById('zakatCalculatedDisplay').hidden = true;
    setNisabThresholdLoading(false);
  }

  function openZakatModal() {
    const overlay = document.getElementById('zakatModalOverlay');
    const modal = document.getElementById('zakatModal');
    if (!overlay || !modal) return;

    lastFocusedElement = document.activeElement;
    resetZakatState();
    showZakatStep('zakat-step-1');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    lockScroll();
    trapFocus(modal);
    loadNisabRates();

    const closeBtn = document.getElementById('closeZakatModal');
    if (closeBtn) closeBtn.focus();
  }

  function closeZakatModal() {
    const overlay = document.getElementById('zakatModalOverlay');
    if (!overlay) return;

    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    unlockScroll();
    releaseFocusTrap();
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function updateCalculator() {
    const { nisabType, currency } = zakatState;
    if (!nisabType || !currency) return;

    const nisabValue = getNisabValue(nisabType, currency);
    const nisabLabel = nisabType === 'gold' ? 'Gold' : 'Silver';

    document.getElementById('zakatCalcTitle').textContent =
      `Zakat Calculator — ${nisabLabel} Nisab (${currency})`;
    renderNisabThreshold();

    const assetFields = [
      'cashHome', 'bankBalance', 'stocksCrypto', 'businessInventory',
      'goldSilver', 'investmentProperty', 'otherIncome'
    ];
    const form = document.getElementById('zakatCalcForm');
    let assetsTotal = 0;
    assetFields.forEach(name => {
      const input = form.querySelector(`[name="${name}"]`);
      assetsTotal += parseFloat(input?.value) || 0;
    });

    const debts = parseFloat(form.querySelector('[name="debts"]')?.value) || 0;
    const expenses = parseFloat(form.querySelector('[name="expenses"]')?.value) || 0;
    const eligible = Math.max(0, assetsTotal - debts - expenses);
    const zakat = eligible * 0.025;

    document.getElementById('zakatEligibleAmount').textContent = formatMoney(eligible, currency);
    document.getElementById('zakatTotalAmount').textContent = formatMoney(zakat, currency);

    const belowNisab = document.getElementById('zakatBelowNisab');
    const proceedBtn = document.getElementById('zakatProceedPayment');

    if (eligible >= nisabValue) {
      belowNisab.hidden = true;
      proceedBtn.hidden = false;
      zakatState.zakatAmount = zakat;
    } else {
      belowNisab.hidden = false;
      proceedBtn.hidden = true;
      zakatState.zakatAmount = 0;
    }
  }

  async function openCalculatorWithCurrency(currency) {
    zakatState.currency = currency;
    showZakatStep('zakat-step-2b');
    setNisabThresholdLoading(true);

    document.querySelectorAll('#zakatCurrencyPicker .zakat-currency-btn').forEach(b => {
      b.classList.toggle('selected', b.dataset.currency === currency);
      b.disabled = true;
    });

    await loadNisabRates();
    setNisabThresholdLoading(false);

    document.querySelectorAll('#zakatCurrencyPicker .zakat-currency-btn').forEach(b => {
      b.disabled = false;
    });

    updateCalculator();
  }

  function goToPaymentStep(fromCalculator) {
    zakatState.fromCalculator = fromCalculator;

    const calcDisplay = document.getElementById('zakatCalculatedDisplay');
    const calcValue = document.getElementById('zakatCalculatedValue');

    if (fromCalculator && zakatState.currency) {
      calcDisplay.hidden = false;
      calcValue.textContent = formatMoney(zakatState.zakatAmount, zakatState.currency);
    } else {
      calcDisplay.hidden = true;
    }

    showZakatStep('zakat-step-3');
  }

  /* --- Sadaqah modal --- */
  function openSadaqahModal() {
    const overlay = document.getElementById('sadaqahModalOverlay');
    const modal = document.getElementById('sadaqahModal');
    if (!overlay || !modal) return;

    lastFocusedElement = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    lockScroll();
    trapFocus(modal);

    const closeBtn = document.getElementById('closeSadaqahModal');
    if (closeBtn) closeBtn.focus();
  }

  function closeSadaqahModal() {
    const overlay = document.getElementById('sadaqahModalOverlay');
    if (!overlay) return;

    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    unlockScroll();
    releaseFocusTrap();
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  /* --- Event bindings --- */
  document.getElementById('openZakatModal')?.addEventListener('click', openZakatModal);
  document.getElementById('openSadaqahModal')?.addEventListener('click', openSadaqahModal);
  document.getElementById('closeZakatModal')?.addEventListener('click', closeZakatModal);
  document.getElementById('closeSadaqahModal')?.addEventListener('click', closeSadaqahModal);

  document.getElementById('zakatModalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'zakatModalOverlay') closeZakatModal();
  });
  document.getElementById('sadaqahModalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'sadaqahModalOverlay') closeSadaqahModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('zakatModalOverlay')?.classList.contains('open')) closeZakatModal();
    if (document.getElementById('sadaqahModalOverlay')?.classList.contains('open')) closeSadaqahModal();
  });

  /* Zakat step 1 actions */
  document.querySelectorAll('[data-zakat-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.zakatAction;
      if (action === 'know-amount') {
        goToPaymentStep(false);
      } else if (action === 'calculate') {
        showZakatStep('zakat-step-2');
        loadNisabRates(true);
      }
    });
  });

  /* Nisab selection */
  document.querySelectorAll('.zakat-nisab-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.zakat-nisab-option').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      zakatState.nisabType = btn.dataset.nisab;
      document.getElementById('zakatCurrencyPicker').hidden = false;
    });
  });

  /* Currency selection in step 2 */
  document.querySelectorAll('#zakatCurrencyPicker .zakat-currency-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openCalculatorWithCurrency(btn.dataset.currency);
    });
  });

  /* Calculator input changes */
  document.getElementById('zakatCalcForm')?.addEventListener('input', updateCalculator);

  /* Proceed to payment from calculator */
  document.getElementById('zakatProceedPayment')?.addEventListener('click', () => {
    goToPaymentStep(true);
  });

  /* Back buttons */
  document.querySelectorAll('[data-zakat-back]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.zakatBack;
      if (target === '1') showZakatStep('zakat-step-1');
      else if (target === '2') showZakatStep('zakat-step-2');
    });
  });

  document.getElementById('zakatStep3Back')?.addEventListener('click', () => {
    if (zakatState.fromCalculator) {
      showZakatStep('zakat-step-2b');
      renderNisabThreshold();
    } else {
      showZakatStep('zakat-step-1');
    }
  });

  /* Prefetch live rates on page load */
  loadNisabRates();
})();
