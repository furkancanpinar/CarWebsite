// theme.js — Bulletproof theme handler
(function() {
  const THEME_KEY = 'gamewise-theme';

  // Apply theme as early as possible
  function applyTheme() {
    const body = document.body;
    if (!body) return false;

    const stored = localStorage.getItem(THEME_KEY);
    const theme = (stored === 'light' || stored === 'dark') ? stored : 'light';
    body.dataset.theme = theme;
    return true;
  }

  // Apply theme ASAP (handles both early and late body availability)
  if (!applyTheme()) {
    document.addEventListener('DOMContentLoaded', applyTheme);
  }

  // Setup toggle buttons
  function setupToggle() {
    const body = document.body;
    if (!body) return;

    const themeToggle = document.getElementById('theme-toggle');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const brandImg = document.querySelector('.brand-image');

    console.log('🎨 Theme initialized. Current:', body.dataset.theme);
    console.log('🎨 Desktop toggle:', themeToggle ? '✓ found' : '✗ MISSING');
    console.log('🎨 Mobile toggle:', mobileThemeToggle ? '✓ found' : '✗ MISSING');

    function swapLogo() {
      if (!brandImg) return;
      const light = brandImg.getAttribute('data-light');
      const dark = brandImg.getAttribute('data-dark');
      if (light && dark) {
        brandImg.src = body.dataset.theme === 'light' ? light : dark;
      }
    }

    function updateAriaLabels() {
      const isLight = body.dataset.theme === 'light';
      if (themeToggle) themeToggle.setAttribute('aria-label', isLight ? 'Toggle dark mode' : 'Toggle light mode');
      if (mobileThemeToggle) mobileThemeToggle.setAttribute('aria-label', isLight ? 'Toggle dark mode' : 'Toggle light mode');
    }

    function toggleTheme(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const current = body.dataset.theme || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      body.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
      console.log('🎨 Toggled to:', next);
      updateAriaLabels();
      swapLogo();
    }

    // Initial setup
    swapLogo();
    updateAriaLabels();

    // ✅ Attach desktop toggle (remove any existing handler first)
    if (themeToggle) {
      const newToggle = themeToggle.cloneNode(true);
      themeToggle.parentNode.replaceChild(newToggle, themeToggle);
      newToggle.addEventListener('click', toggleTheme);
      console.log('✅ Desktop toggle wired');
    }

    // ✅ Attach mobile toggle
    if (mobileThemeToggle) {
      const newMobile = mobileThemeToggle.cloneNode(true);
      mobileThemeToggle.parentNode.replaceChild(newMobile, mobileThemeToggle);
      newMobile.addEventListener('click', function(e) {
        toggleTheme(e);
        const header = document.querySelector('.site-header');
        if (header && header.classList.contains('menu-open')) {
          header.classList.remove('menu-open');
        }
      });
      console.log('✅ Mobile toggle wired');
    }

    // Expose globally for debugging
    window.toggleTheme = toggleTheme;
    window.getCurrentTheme = function() { return body.dataset.theme; };
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupToggle);
  } else {
    setupToggle();
  }
})();
