# CNMO — Zakat & Sadaqah Feature Implementation Prompt

---

## Context

I am working on the **CNMO (Council of Nigerian Muslim Organisations)** website — a static HTML/CSS/JS site currently live at `https://cnmo.vercel.app/`. The site uses vanilla HTML, CSS, and JavaScript (no framework).

I need to add a **Zakat & Sadaqah section** to the homepage (`index.html`) with two fully functional modal flows: **"Pay Zakat"** and **"Give Sadaqah"** — all self-contained within the CNMO site without linking away to any external website.

---

## Design System (CNMO Site — do not deviate from this)

Inspect the existing `index.html` and `css/style.css` to extract the exact values. Key conventions observed on the site:

- **Fonts**: The site uses a serif/sans combination consistent with an Islamic organisation — match whatever Google Fonts are already imported in `<head>`.
- **Colour palette**: Extract from the existing CSS variables or recurring hex values. The site uses a **dark navy/teal primary** with **gold/amber accents** and white backgrounds — use these exact values.
- **Buttons**: The existing CTAs (e.g. "Join as Friend", "Become a Member") use a consistent button style — match border-radius, padding, font-weight, and hover states exactly.
- **Modals**: There are no existing modals on the site, so create a new `.modal` pattern that matches the card/section aesthetic (white background, subtle box-shadow, rounded corners consistent with existing cards like `.project-card`).
- **Section layout**: Match the existing section structure — `.section-header` with `<h2>` + subtitle paragraph, content centred, consistent vertical padding (`padding: 80px 0` or whatever the site uses).

---

## What to Build

### 1. Homepage Section — Zakat & Sadaqah

Add a new section to `index.html` **after the "Welcome to CNMO" section and before the "Projects Spotlight" section**.

The section should contain:

```
[Section badge: "Fulfil Your Obligation"]
<h2>Zakat & Sadaqah</h2>
<p class="section-subtitle">
  Purify your wealth and support the ummah. 
  CNMO facilitates your Zakat and Sadaqah to reach 
  those who need it most, right here in the community.
</p>

[Two cards side by side, responsive — stack on mobile]

Card 1 — Pay Zakat:
  Icon: ☪ or a crescent/coin SVG
  Title: "Pay Zakat"
  Body: "Fulfil your annual obligation. Calculate your Nisab and pay your Zakat with confidence."
  CTA Button: "Pay Zakat" → opens Zakat modal

Card 2 — Give Sadaqah:
  Icon: 🤲 or a hands/heart SVG
  Title: "Give Sadaqah"
  Body: "Give voluntary charity at any time. Every act of Sadaqah, big or small, is a blessing."
  CTA Button: "Give Sadaqah" → opens Sadaqah modal
```

Style the cards to match the existing `.project-card` or `.get-involved` card aesthetic on the site (same shadows, border-radius, hover lift).

---

### 2. Pay Zakat Modal Flow

The modal is a **multi-step wizard** rendered inside a single modal container. Steps advance forward/backward without closing the modal.

#### Step 1 — Do you know how much to pay?

```
Title: "Pay Your Zakat"
Body: "Do you already know how much Zakat you need to pay?"

Button A: "Yes, I know the amount"  → goes to Step 3 (currency selection for direct payment)
Button B: "No, help me calculate"   → goes to Step 2 (Nisab calculator)
```

#### Step 2 — Zakat Calculator (Nisab selection)

```
Title: "Calculate Your Zakat"
Subtitle: "First, select the Nisab standard you'd like to use:"

Two option cards (selectable, radio-style):
  Option A: [Gold icon] "Gold Nisab"   — "Based on 87.48g of gold"
  Option B: [Silver icon] "Silver Nisab" — "Based on 612.36g of silver"

Below, once one is selected, show:
  "Select your currency:"
  Four buttons: GBP | USD | NGN | EUR

On currency select → show the inline Zakat calculator form (Step 2b)
```

#### Step 2b — Zakat Calculator Form

```
Title: "Zakat Calculator — [Gold/Silver] Nisab ([Currency])"
Subtitle: "Today's Nisab threshold: [currency symbol][amount]"
  — Nisab values to hardcode (approximate, update as needed):
      Gold Nisab:   GBP £4,200 | USD $5,200 | NGN ₦8,400,000 | EUR €4,900
      Silver Nisab: GBP £320   | USD $390   | NGN ₦640,000   | EUR €370

Form fields (all numeric inputs, default 0):
  Assets:
  + Cash at Home
  + Bank Account Balance
  + Cash value of Stocks & Crypto
  + Profits & Business Inventory
  + Cash value of Gold & Silver
  + Cash value of Investment Property
  + Any Other Income

  Deductions:
  - Debts owed
  - Expenses due

  [Auto-calculated, read-only, highlighted box:]
  = Amount Eligible for Zakat
  = Your Zakat Total (2.5% of Eligible Amount)

Button: "Proceed to Payment →" → goes to Step 3 with the calculated amount pre-filled
Button (secondary): "← Back"
```

#### Step 3 — Currency & Payment (direct pay, or after calculator)

```
Title: "Pay Your Zakat"
Subtitle: "Select your preferred currency to proceed:"

[If coming from calculator, show:]
  "Your calculated Zakat: [currency symbol][amount]"

Four payment buttons in a 2×2 grid:
  GBP → links to: https://buy.stripe.com/8wMbMF2bfg9mfuM28c  (opens in new tab)
  USD → links to: https://buy.stripe.com/8wMdUNg259KY0zScMO  (opens in new tab)
  NGN → links to: https://buy.stripe.com/5kA4kdbLPaP26Yg9AD  (opens in new tab)
  EUR → links to: https://buy.stripe.com/aEU9ExeY1bT6dmE4gh  (opens in new tab)

Small note below: "You will be redirected to our secure Stripe payment page."

Button (secondary): "← Back"
```

---

### 3. Give Sadaqah Modal Flow

Simpler, single-step modal.

#### Step 1 — Currency Selection

```
Title: "Give Sadaqah"
Subtitle: "JazakAllah Khayran for your generosity. Select your preferred currency:"
Quranic quote (small, italicised):
  "The likeness of those who spend their wealth in the way of Allah is as the likeness of a grain of corn; 
   it grows seven ears and each ear has a hundred grains." (Quran 2:261)

Four payment buttons in a 2×2 grid:
  GBP → links to: https://donate.stripe.com/6oEeYReY10aociA149  (opens in new tab)
  USD → links to: https://donate.stripe.com/aEU7wpaHL3mAdmE8wC  (opens in new tab)
  NGN → links to: https://donate.stripe.com/fZe8At17baP2eqI3ck  (opens in new tab)
  EUR → links to: https://donate.stripe.com/4gw8AtdTXe1ebewfZ5  (opens in new tab)

Small note: "You will be redirected to our secure Stripe donation page."
```

---

## Technical Implementation Requirements

### File Changes

Modify only these files:
1. `index.html` — add the section HTML and modal HTML (modals go at the bottom of `<body>` before `</body>`)
2. `css/style.css` — add new styles at the bottom, namespaced under `.zakat-section`, `.zakat-modal`, `.sadaqah-modal` to avoid conflicts
3. `js/main.js` (or create `js/zakat.js` and include it) — add modal open/close/step logic

### Modal Behaviour

- Triggered by buttons: `id="openZakatModal"` and `id="openSadaqahModal"`
- Modal overlay: fixed full-screen, `background: rgba(0,0,0,0.55)`, `z-index: 9999`
- Modal container: centred, `max-width: 560px`, white background, `border-radius` matching site cards, `padding: 40px`, `box-shadow` matching site aesthetic
- Close button: `×` top-right, also close on overlay click
- Step transitions: hide/show `.modal-step` divs by toggling a `.active` class; optionally add a subtle fade (CSS `opacity` + `transition`)
- Scroll lock: add `overflow: hidden` to `<body>` when modal is open, remove on close
- Mobile: modal should be `width: 90%` on small screens, scrollable if content overflows

### Calculator Logic (JavaScript)

```js
// All inputs default to 0
// Eligible = (sum of all assets) - debts - expenses
// Zakat = eligible * 0.025
// Only show "Proceed to Payment" button if eligible >= nisab threshold
// If eligible < nisab, show message: "Based on your inputs, you may not be liable for Zakat this year."
// Display currency symbol dynamically based on selected currency
```

### Accessibility

- Modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the modal title
- Focus is trapped inside modal while open
- Escape key closes the modal
- All form inputs have `<label>` elements

### Currency Buttons Styling

Style the GBP / USD / NGN / EUR payment buttons as solid blocks matching the site's primary button colour, with the currency code in bold and a subtle flag emoji or icon if desired. On hover, apply the site's standard button hover state (darken or lift).

---

## Nisab Hardcoded Values Reference

Use these approximate values (display a small note: "Nisab values are approximate and updated periodically"):

| Nisab Type | GBP     | USD     | NGN          | EUR     |
|------------|---------|---------|--------------|---------|
| Gold       | £4,200  | $5,200  | ₦8,400,000   | €4,900  |
| Silver     | £320    | $390    | ₦640,000     | €370    |

---

## Section Copy (Final)

Use this exact copy for the homepage section:

```html
<!-- Section badge -->
<span class="section-badge">Fulfil Your Obligation</span>

<!-- Section heading -->
<h2>Zakat & Sadaqah</h2>

<!-- Subtitle -->
<p class="section-subtitle">
  Purify your wealth and earn Allah's blessings. CNMO makes it easy to fulfil 
  your Zakat obligation and give Sadaqah — helping the ummah thrive right here 
  in the United Kingdom.
</p>

<!-- Quranic reminder (small, centered, italicised) -->
<p class="ayah-quote">
  "And establish prayer and give Zakāh, and whatever good you put forward 
   for yourselves — you will find it with Allah." (Quran 2:110)
</p>
```

---

## Summary of All Stripe Links

| Type     | Currency | Stripe URL |
|----------|----------|------------|
| Zakat    | USD      | https://buy.stripe.com/8wMdUNg259KY0zScMO |
| Zakat    | GBP      | https://buy.stripe.com/8wMbMF2bfg9mfuM28c |
| Zakat    | NGN      | https://buy.stripe.com/5kA4kdbLPaP26Yg9AD |
| Zakat    | EUR      | https://buy.stripe.com/aEU9ExeY1bT6dmE4gh |
| Sadaqah  | USD      | https://donate.stripe.com/aEU7wpaHL3mAdmE8wC |
| Sadaqah  | GBP      | https://donate.stripe.com/6oEeYReY10aociA149 |
| Sadaqah  | NGN      | https://donate.stripe.com/fZe8At17baP2eqI3ck |
| Sadaqah  | EUR      | https://donate.stripe.com/4gw8AtdTXe1ebewfZ5 |

All payment links open in a **new tab** (`target="_blank" rel="noopener noreferrer"`).

---

## What NOT to Do

- Do NOT link to `al-ihsanzakat.com` anywhere
- Do NOT change any existing section, nav, footer, font, or colour outside the new `.zakat-section` and modal code
- Do NOT add any new external CSS frameworks or JS libraries
- Do NOT change the existing Donate nav link behaviour
- Do NOT create a new page — everything is modal-based, staying on `index.html`
