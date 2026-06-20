// theme.js — Persistent theme across pages

const THEME_KEY = 'gamewise-theme';

// Apply theme IMMEDIATELY before page renders (prevents flash)
function applyStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    document.body.dataset.theme = stored;
  } else {
    // No saved theme — use dark as default
    document.body.dataset.theme = 'dark';
  }
}

// Run IMMEDIATELY (synchronously) before anything renders
applyStoredTheme();

// Set up toggle button once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const mobileThemeToggle = document.getElementById('mobile-theme-toggle');

  // Update aria labels based on current theme
  function updateAriaLabels() {
    const isLight = body.dataset.theme === 'light';
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isLight ? 'Toggle dark mode' : 'Toggle light mode');
    }
    if (mobileThemeToggle) {
      mobileThemeToggle.setAttribute('aria-label', isLight ? 'Toggle dark mode' : 'Toggle light mode');
    }
  }

  function swapLogo() {
    const brandImg = document.querySelector('.brand-image');
    if (!brandImg) return;
    const light = brandImg.getAttribute('data-light');
    const dark = brandImg.getAttribute('data-dark');
    brandImg.src = body.dataset.theme === 'light' ? (light || brandImg.src) : (dark || brandImg.src);
  }

  function toggleTheme() {
    const next = body.dataset.theme === 'light' ? 'dark' : 'light';
    body.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);  // ← SAVE to localStorage
    updateAriaLabels();
    swapLogo();
  }

  // Apply correct logo on load (handles light/dark logo swap)
  swapLogo();
  updateAriaLabels();

  // Wire up toggle buttons
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', () => {
      toggleTheme();
      // Close mobile menu after toggle
      const header = document.querySelector('.site-header');
      if (header && header.classList.contains('menu-open')) {
        header.classList.remove('menu-open');
      }
    });
  }
});
