// theme.js — Persistent theme with reliable toggle
(function() {
  const THEME_KEY = 'gamewise-theme';

  // Apply IMMEDIATELY before page renders (prevents flash)
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    document.body.dataset.theme = stored;
  } else {
    document.body.dataset.theme = 'dark';
  }

  // Run when DOM is ready
  function init() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const brandImg = document.querySelector('.brand-image');

    console.log('🎨 Theme.js loaded. Current theme:', body.dataset.theme);
    console.log('🎨 Theme toggle button found:', !!themeToggle);
    console.log('🎨 Mobile theme toggle found:', !!mobileThemeToggle);

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
      if (!brandImg) return;
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

    // Initial setup
    swapLogo();
    updateAriaLabels();

    // Attach toggle handlers
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    } else {
      console.warn('🎨 #theme-toggle button NOT found');
    }

    if (mobileThemeToggle) {
      mobileThemeToggle.addEventListener('click', function() {
        toggleTheme();
        // Close mobile menu
        const header = document.querySelector('.site-header');
        if (header && header.classList.contains('menu-open')) {
          header.classList.remove('menu-open');
        }
      });
    }

    // Expose globally for debugging
    window.toggleTheme = toggleTheme;
    window.getCurrentTheme = function() { return body.dataset.theme; };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
