// theme.js — Bulletproof theme handler with no FOUC + mobile menu support
(function () {
  const THEME_KEY = 'autex-theme';
  const VALID_THEMES = ['light', 'dark'];
  const DEFAULT_THEME = 'dark';

  function readStoredTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      return VALID_THEMES.includes(stored) ? stored : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }

  function applyTheme() {
    const body = document.body;
    if (!body) return false;
    const theme = readStoredTheme();
    body.dataset.theme = theme;
    swapLogo(theme);
    return true;
  }

  function swapLogo(theme) {
    const img = document.querySelector('.brand-image');
    if (!img) return;
    const src = img.dataset[theme];
    if (src) img.src = src;
  }

  // Apply theme as early as possible
  if (!applyTheme()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
    } else {
      applyTheme();
    }
  }

  // Toggle theme handler
  function toggleTheme() {
    const body = document.body;
    if (!body) return;
    const next = body.dataset.theme === 'light' ? 'dark' : 'light';
    body.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    swapLogo(next);
    updateAria(next);

    // Close mobile menu if open
    const header = document.querySelector('.site-header');
    if (header) header.classList.remove('menu-open');
  }

  function updateAria(theme) {
    const isLight = theme === 'light';
    document.querySelectorAll('#theme-toggle, #mobile-theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    });
  }

  // Wire up theme toggle using event delegation (works even for dynamically added buttons)
  function bindThemeToggle() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#theme-toggle, #mobile-theme-toggle');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      }
    });
  }

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY && e.newValue) {
      document.body.dataset.theme = e.newValue;
      swapLogo(e.newValue);
      updateAria(e.newValue);
    }
  });

  // Watch for new theme toggle buttons and update their ARIA
  function watchForNewToggles() {
    const observer = new MutationObserver(() => {
      updateAria(document.body.dataset.theme);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Boot
  function boot() {
    bindThemeToggle();
    updateAria(document.body.dataset.theme);
    watchForNewToggles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // Expose for external re-binding if needed
  window.__themeToggle = toggleTheme;
  window.__refreshThemeAria = updateAria;

  window.getTheme = () => document.body.dataset.theme;
})();
