(function(){
  // Centralized scripts: theme toggle, logo swap, mobile header collapse, small UI helpers
  const body = document.body;

  // Ensure default theme
  if (!body.dataset.theme) body.dataset.theme = 'dark';

  const brandImg = document.querySelector('.brand-image');
  const themeToggle = document.getElementById('theme-toggle');

  function applyLogo(){
    if (!brandImg) return;
    const light = brandImg.getAttribute('data-light');
    const dark = brandImg.getAttribute('data-dark');
    brandImg.src = body.dataset.theme === 'light' ? (light || brandImg.src) : (dark || brandImg.src);
  }

  function setTheme(next){
    body.dataset.theme = next;
    if(themeToggle) themeToggle.setAttribute('aria-label', next === 'light' ? 'Toggle dark mode' : 'Toggle light mode');
    applyLogo();
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', ()=>{
      const next = body.dataset.theme === 'light' ? 'dark' : 'light';
      setTheme(next);
    });
  }

  // Initial apply
  applyLogo();

  // Mobile header collapse/expand on scroll and toggle
  (function(){
    const header = document.querySelector('.site-header');
    if(!header) return;
    // Keep header compact on small screens but remove scroll-driven collapsing
    function setHeaderCollapsed(collapsed){
      if(collapsed) {
        header.classList.add('site-collapsed');
      } else {
        header.classList.remove('site-collapsed');
      }
      // no header toggle control — header remains fixed/compact on small screens
    }

    function resetHeaderState(){
      // Ensure header stays expanded and fixed across all viewports
      setHeaderCollapsed(false);
    }

    // header state is set by viewport size only; no manual toggle control

    resetHeaderState();
    window.addEventListener('resize', resetHeaderState);
  })();

  // Small UI helpers: toggle-switch and favorite buttons
  (function(){
    // delegate toggle-switch clicks
    document.addEventListener('click', (e)=>{
      const ts = e.target.closest('.toggle-switch');
      if(ts){
        const pressed = ts.getAttribute('aria-pressed') === 'true';
        ts.setAttribute('aria-pressed', (!pressed).toString());
        ts.classList.toggle('on', !pressed);
      }
      const fav = e.target.closest('.favorite-button');
      if(fav){
        fav.classList.toggle('saved');
        const saved = fav.classList.contains('saved');
        fav.setAttribute('aria-pressed', saved.toString());
        // visual feedback for touch devices
        fav.animate([{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}], {duration:180});
      }
    }, {passive:true});

    // Increase hit area for icon-buttons on small screens
    function enlargeHitTargets(){
      if(window.innerWidth <= 760){
        document.querySelectorAll('.icon-button').forEach(b=> b.style.padding = '10px');
      } else {
        document.querySelectorAll('.icon-button').forEach(b=> b.style.padding = '6px');
      }
    }
    enlargeHitTargets();
    window.addEventListener('resize', enlargeHitTargets);
  })();

  // Modal handling (Opening Hours / Get In Touch)
  (function(){
    // modal open/close with scroll lock and focus handling
    let _savedScroll = 0;
    function openModal(id){
      const m = document.getElementById(id);
      if(!m) return;
      // save scroll position
      _savedScroll = window.scrollY || document.documentElement.scrollTop;
      // lock scrolling by hiding overflow on the root element and preserve scrollbar width
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      // hide overflow on root; CSS `scrollbar-gutter: stable` reserves space
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      m.setAttribute('aria-hidden','false');
      m.classList.add('open');
      // focus first focusable element or panel
      const focusable = m.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      (focusable || m.querySelector('.modal-panel')).focus();
    }
    function closeModal(m){
      if(!m) return;
      m.setAttribute('aria-hidden','true');
      m.classList.remove('open');
      // restore scroll and remove locks
      document.body.classList.remove('modal-open');
      document.documentElement.style.overflow = '';
      window.scrollTo(0, _savedScroll || 0);
    }

    function initModalHandlers(){
      // Attach direct click handlers to modal trigger buttons
      document.querySelectorAll('[data-modal-target]').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
          const id = btn.getAttribute('data-modal-target');
          if(id) openModal(id);
        });
      });

      // Close buttons inside modals
      document.querySelectorAll('.modal .modal-close').forEach(c=>{
        c.addEventListener('click', (e)=>{
          const modal = c.closest('.modal');
          closeModal(modal);
        });
      });

      // Click on modal backdrop closes (ensure event target is the modal element itself)
      document.querySelectorAll('.modal').forEach(m=>{
        m.addEventListener('click', (e)=>{
          if(e.target === m) closeModal(m);
        });
      });

      document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape'){
          document.querySelectorAll('.modal.open').forEach(m=> closeModal(m));
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initModalHandlers);
    } else {
      initModalHandlers();
    }
  })();

  // Mobile hamburger menu toggle and mobile theme toggle
  (function(){
    function initMobileMenu(){
      const header = document.querySelector('.site-header');
      const hamburger = document.querySelector('.hamburger-button');
      const mobileMenu = document.querySelector('.mobile-menu');
      const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
      const mainThemeToggle = document.getElementById('theme-toggle');
      if(!hamburger || !header || !mobileMenu) return;

      function setMenuOpen(open){
        header.classList.toggle('menu-open', open);
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      }

      hamburger.addEventListener('click', ()=>{
        const isOpen = header.classList.contains('menu-open');
        setMenuOpen(!isOpen);
      });

      // Close mobile menu when clicking a nav link
      mobileMenu.addEventListener('click', (e)=>{
        const link = e.target.closest('a');
        if(link) setMenuOpen(false);
      });

      // Close on Escape
      document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape') setMenuOpen(false);
      });

      // mobile theme button toggles theme directly and close menu afterwards
      if(mobileThemeToggle){
        mobileThemeToggle.addEventListener('click', ()=>{
          const next = body.dataset.theme === 'light' ? 'dark' : 'light';
          setTheme(next);
          // close menu so user isn't trapped inside it
          setMenuOpen(false);
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
      initMobileMenu();
    }
  })();

  // Previously Sold page: simple search + filter
  (function(){
    const search = document.getElementById('sold-search');
    const year = document.getElementById('sold-filter-year');
    const grid = document.getElementById('sold-grid');
    if(!grid) return;

    function applyFilters(){
      const q = search ? search.value.trim().toLowerCase() : '';
      const y = year ? year.value : '';
      grid.querySelectorAll('.sold-item').forEach(item=>{
        const make = (item.dataset.make||'').toLowerCase();
        const model = (item.dataset.model||'').toLowerCase();
        const itemYear = (item.dataset.year||'');
        const matchesQ = !q || make.includes(q) || model.includes(q) || `${make} ${model}`.includes(q);
        const matchesY = !y || itemYear === y;
        item.style.display = (matchesQ && matchesY) ? '' : 'none';
      });
    }

    if(search) search.addEventListener('input', applyFilters);
    if(year) year.addEventListener('change', applyFilters);
  })();

})();
