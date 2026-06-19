/* ============================================================
   CNMO Website - Shared JavaScript
   ============================================================ */

/* --- Navbar scroll effect --- */
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* --- Mobile nav toggle --- */
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
      navToggle.classList.remove('active');
      navMenu.classList.remove('open');
    }
  });
}

/* --- Mobile dropdown toggle --- */
document.querySelectorAll('.nav-item').forEach(item => {
  const link = item.querySelector('.nav-link');
  const dropdown = item.querySelector('.dropdown');
  if (link && dropdown && window.innerWidth <= 768) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      item.classList.toggle('open');
    });
  }
});

/* --- Active nav link --- */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link, .dropdown a').forEach(link => {
  const href = link.getAttribute('href');
  if (href && href !== '#' && currentPage && href.includes(currentPage)) {
    link.classList.add('active');
  }
});

/* --- Hero Carousel --- */
function initCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const textItems = document.querySelectorAll('.hero-text-item');
  if (!slides.length) return;

  let current = 0;
  let timer = null;

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    textItems[current]?.classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
    textItems[current]?.classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  document.querySelector('.hero-arrow-next')?.addEventListener('click', () => { next(); startTimer(); });
  document.querySelector('.hero-arrow-prev')?.addEventListener('click', () => { prev(); startTimer(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); startTimer(); }));

  goTo(0);
  startTimer();
}
initCarousel();

/* --- Accordion --- */
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.closest('.accordion-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* --- Stats counter animation --- */
function animateCounters() {
  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString() + suffix;
      if (current >= target) clearInterval(interval);
    }, 16);
  });
}

/* Trigger counter when stats row is visible */
const statsRow = document.querySelector('.stats-row');
if (statsRow) {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCounters();
      observer.disconnect();
    }
  }, { threshold: 0.3 });
  observer.observe(statsRow);
}

/* --- Lightbox for Gallery --- */
function initLightbox() {
  const lightbox = document.querySelector('.lightbox');
  if (!lightbox) return;
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.src || item.querySelector('img')?.getAttribute('src') || '';
      const alt = item.querySelector('img')?.alt || item.getAttribute('aria-label') || 'Gallery image';
      if (lightboxImg) {
        lightboxImg.src = src;
        lightboxImg.alt = alt;
      }
      lightbox.classList.add('open');
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', () => lightbox.classList.remove('open'));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('open'); });
}
initLightbox();

/* --- Form Validation --- */
function validateForm(form) {
  let valid = true;
  form.querySelectorAll('.form-group').forEach(group => {
    const input = group.querySelector('input, textarea, select');
    if (!input || !input.required) return;
    group.classList.remove('error');
    if (!input.value.trim()) {
      group.classList.add('error');
      let err = group.querySelector('.form-error');
      if (!err) { err = document.createElement('span'); err.className = 'form-error'; group.appendChild(err); }
      err.textContent = 'This field is required.';
      valid = false;
    } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      group.classList.add('error');
      let err = group.querySelector('.form-error');
      if (!err) { err = document.createElement('span'); err.className = 'form-error'; group.appendChild(err); }
      err.textContent = 'Please enter a valid email address.';
      valid = false;
    }
  });
  return valid;
}

document.querySelectorAll('form[data-validate]').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm(form)) {
      const success = form.querySelector('.form-success');
      if (success) { success.style.display = 'block'; form.reset(); }
    }
  });
});

/* --- Camera icon SVG helper --- */
const CAMERA_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
  <path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
</svg>`;

/* Inject camera SVGs into placeholders that are missing them */
document.querySelectorAll('.img-placeholder-inner svg').forEach(svg => {
  if (!svg.getAttribute('viewBox')) svg.outerHTML = CAMERA_SVG;
});


/* --- Contact Form Submission with reCAPTCHA --- */

const contactForm = document.getElementById("contact-form");
const successMessage = document.querySelector(".form-success");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const captcha = grecaptcha.getResponse();

  if (!captcha) {
    alert("Please complete the reCAPTCHA verification.");
    return;
  }

  const payload = {
    fullName: document.getElementById("full-name").value.trim(),
    email: document.getElementById("email").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    message: document.getElementById("message").value.trim(),
    captcha
  };

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.log("API Response:", result);

throw new Error(
  result.error || result.message || "Failed to send message"
);
    }

    contactForm.reset();
    grecaptcha.reset();

    if (successMessage) {
      successMessage.style.display = "block";
    }

  } catch (error) {
    console.error("Contact form error:", error);
    alert(error.message || "An error occurred while sending your message.");
  }
});
