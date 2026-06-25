// theme.js — Bulletproof theme handler (no FOUC, works everywhere)
(function () {
  'use strict';

  const THEME_KEY = 'autex-theme';
  const VALID_THEMES = ['light', 'dark'];
  const DEFAULT_THEME = 'dark';

  // ─── 1. Apply theme EARLY (before body renders) ───
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

  // Apply immediately, or wait for DOM
  if (!applyTheme()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
    } else {
      applyTheme();
    }
  }

  // ─── 2. Toggle handler ───
  function toggleTheme() {
    const body = document.body;
    if (!body) return;
    const current = body.dataset.theme;
    const next = current === 'light' ? 'dark' : 'light';

    body.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    swapLogo(next);
    updateAria(next);

    // Close mobile menu if open
    const header = document.querySelector('.site-header');
    if (header) header.classList.remove('menu-open');

    console.log('[Theme] switched to:', next);
  }

  function updateAria(theme) {
    const isLight = theme === 'light';
    document.querySelectorAll('#theme-toggle, #mobile-theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    });
  }

  // ─── 3. Bind click handler (works on dynamically-added buttons) ───
  function handleThemeClick(e) {
    const btn = e.target.closest('#theme-toggle, #mobile-theme-toggle');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  }

  // Use both delegation AND direct binding for maximum compatibility
  function bindThemeToggle() {
    // Delegated click on document (catches dynamically added buttons)
    document.addEventListener('click', handleThemeClick, true); // capture phase

    // Direct binding for initial buttons (faster response)
    document.querySelectorAll('#theme-toggle, #mobile-theme-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      });
    });
  }

  // ─── 4. Re-bind when new buttons appear ───
  function watchForNewToggles() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          // Check if the added node IS a theme toggle
          if (node.id === 'theme-toggle' || node.id === 'mobile-theme-toggle') {
            // Direct bind
            node.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleTheme();
            });
          }
          // Check if the added node CONTAINS theme toggles
          if (node.querySelectorAll) {
            const toggles = node.querySelectorAll('#theme-toggle, #mobile-theme-toggle');
            toggles.forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
              });
            });
          }
        }
      }
      updateAria(document.body.dataset.theme);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── 5. Cross-tab sync ───
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY && e.newValue) {
      document.body.dataset.theme = e.newValue;
      swapLogo(e.newValue);
      updateAria(e.newValue);
    }
  });

  // ─── 6. Boot ───
  function boot() {
    bindThemeToggle();
    updateAria(document.body.dataset.theme);
    watchForNewToggles();
    console.log('[Theme] initialized. Current theme:', document.body.dataset.theme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // Expose globally for debugging
  window.__themeToggle = toggleTheme;
  window.getTheme = () => document.body.dataset.theme;
})();
