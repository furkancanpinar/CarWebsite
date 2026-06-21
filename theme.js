// theme.js — Persistent theme with reliable toggle
(function() {
  const THEME_KEY = 'gamewise-theme';

  // Apply IMMEDIATELY before page renders
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    document.body.dataset.theme = stored;
  } else {
    document.body.dataset.theme = 'dark';
  }

  function init() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const brandImg = document.querySelector('.brand-image');

    console.log('🎨 Theme.js loaded. Current theme:', body.dataset.theme);

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
      // ✅ FIX: Check brandImg exists before accessing dataset
      if (!brandImg) {
        console.log('🎨 No .brand-image element on this page');
        return;
      }
      const light = brandImg.getAttribute('data-light');
      const dark = brandImg.getAttribute('data-dark');
      if (light && dark) {
        brandImg.src = body.dataset.theme === 'light' ? light : dark;
      }
    }

    function toggleTheme() {
      const current = body.dataset.theme || 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      body.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
      console.log('🎨 Theme toggled to:', next);
      updateAriaLabels();
      swapLogo();
    }

    swapLogo();
    updateAriaLabels();

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
    if (mobileThemeToggle) {
      mobileThemeToggle.addEventListener('click', function() {
        toggleTheme();
        const header = document.querySelector('.site-header');
        if (header && header.classList.contains('menu-open')) {
          header.classList.remove('menu-open');
        }
      });
    }

    window.toggleTheme = toggleTheme;
    window.getCurrentTheme = function() { return body.dataset.theme; };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
