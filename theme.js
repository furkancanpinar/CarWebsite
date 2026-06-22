// theme.js — Bulletproof theme handler with no FOUC
(function () {
  const THEME_KEY = 'autex-theme';
  const VALID_THEMES = ['light', 'dark'];
  const DEFAULT_THEME = 'dark';

  // ─────────────────────────────────────────────────────────
  // 1. Apply theme as EARLY as possible — runs synchronously
  // ─────────────────────────────────────────────────────────
  function readStoredTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      return VALID_THEMES.includes(stored) ? stored : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }

  // Inline script in <head> calls this BEFORE body parses
  // (or we wait for DOMContentLoaded if loaded async)
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

  // Try immediately (will fail if body not parsed yet)
  if (!applyTheme()) {
    // Try again on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
    } else {
      applyTheme();
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2. Wire up toggle buttons — runs after DOM is ready
  // ─────────────────────────────────────────────────────────
  function setupToggles() {
    const body = document.body;
    if (!body) return;

    const toggles = document.querySelectorAll('#theme-toggle, #mobile-theme-toggle');

    toggles.forEach((btn) => {
      // Remove any previously-attached handler by cloning
      const fresh = btn.cloneNode(true);
      btn.parentNode.replaceChild(fresh, btn);
      fresh.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = body.dataset.theme === 'light' ? 'dark' : 'light';
        body.dataset.theme = next;
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        swapLogo(next);
        updateAria(next);

        // Close mobile menu if open
        const header = document.querySelector('.site-header');
        if (header) header.classList.remove('menu-open');
      });
    });

    updateAria(body.dataset.theme);
  }

  function updateAria(theme) {
    const isLight = theme === 'light';
    document.querySelectorAll('#theme-toggle, #mobile-theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    });
  }

  // ─────────────────────────────────────────────────────────
  // 3. Cross-tab sync — theme updates instantly across tabs
  // ─────────────────────────────────────────────────────────
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY && e.newValue) {
      document.body.dataset.theme = e.newValue;
      swapLogo(e.newValue);
      updateAria(e.newValue);
    }
  });

  // ─────────────────────────────────────────────────────────
  // 4. Boot
  // ─────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupToggles, { once: true });
  } else {
    setupToggles();
  }

  // Debug helper
  window.getTheme = () => document.body.dataset.theme;
})();
