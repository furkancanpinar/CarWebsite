// scripts.js — General UI handlers (no Firebase imports here!)
(function () {
  'use strict';

  // ─── Welcome logo fallback ───
  function setupLogoFallback(imgId, parentClass) {
    const img = document.getElementById(imgId);
    if (!img) return;
    img.addEventListener('error', () => {
      if (parentClass) {
        img.parentElement?.classList.add(parentClass);
      } else {
        img.style.display = 'none';
      }
    });
  }

  // ─── Header collapse on resize ───
  function initHeaderCollapse() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const reset = () => header.classList.remove('site-collapsed');
    reset();
    window.addEventListener('resize', reset);
  }

  // ─── Toggle switches + favorite buttons (event delegation) ───
  function initDelegatedClicks() {
    document.addEventListener('click', (e) => {
      const ts = e.target.closest('.toggle-switch');
      if (ts) {
        const pressed = ts.getAttribute('aria-pressed') === 'true';
        ts.setAttribute('aria-pressed', String(!pressed));
        ts.classList.toggle('on', !pressed);
        return;
      }

      const fav = e.target.closest('.favorite-button');
      if (fav) {
        fav.classList.toggle('saved');
        const saved = fav.classList.contains('saved');
        fav.setAttribute('aria-pressed', String(saved));
        try {
          fav.animate(
            [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }],
            { duration: 200 }
          );
        } catch { /* animate not supported */ }
      }
    });
  }

  // ─── Enlarge touch targets on mobile ───
  function adjustHitTargets() {
    const pad = window.innerWidth <= 760 ? '10px' : '6px';
    document.querySelectorAll('.icon-button').forEach(b => b.style.padding = pad);
  }

  // ─── Mobile menu ───
  function initMobileMenu() {
    const header = document.querySelector('.site-header');
    const hamburger = document.querySelector('.hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!hamburger || !header || !mobileMenu) return;

    function setOpen(open) {
      header.classList.toggle('menu-open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
    }

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!header.classList.contains('menu-open'));
    });

    document.addEventListener('click', (e) => {
      if (header.classList.contains('menu-open') &&
          !mobileMenu.contains(e.target) &&
          !hamburger.contains(e.target)) {
        setOpen(false);
      }
    });

    mobileMenu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  // ─── iOS PASSWORD AUTOFILL FIX ───
  // Mark all closed modals as inert on load (prevents iOS password autofill)
  function initInertModals() {
    document.querySelectorAll('.modal[aria-hidden="true"]').forEach(modal => {
      modal.setAttribute('inert', '');
    });
  }

  // ─── Modal handling (shared) ───
  let savedScroll = 0;
  let lastFocusedTrigger = null;

  function openModal(id, trigger) {
    const modal = document.getElementById(id);
    if (!modal) return;
    lastFocusedTrigger = trigger || null;
    savedScroll = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    modal.removeAttribute('inert'); // ← Remove inert when opening

    const focusable = modal.querySelector(
      'input, select, textarea, button:not(.modal-close), [href], [tabindex]:not([tabindex="-1"])'
    );
    (focusable || modal.querySelector('.modal-panel'))?.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
    modal.setAttribute('inert', ''); // ← Add inert when closing (iOS autofill fix)
    document.body.classList.remove('modal-open');
    document.documentElement.style.overflow = '';
    window.scrollTo(0, savedScroll);
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
    }
    lastFocusedTrigger = null;
  }

  function initModals() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-modal-target]');
      if (trigger) {
        e.preventDefault();
        const id = trigger.getAttribute('data-modal-target');
        if (!id) return;
        document.querySelectorAll('.modal.open').forEach(m => {
          if (m.id !== id) closeModal(m);
        });
        openModal(id, trigger);
        return;
      }

      const closeBtn = e.target.closest('.modal .modal-close');
      if (closeBtn) {
        closeModal(closeBtn.closest('.modal'));
        return;
      }
    });

    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.open').forEach(closeModal);
      }
      if (e.key === 'Tab') {
        const openModalEl = document.querySelector('.modal.open');
        if (!openModalEl) return;
        const focusable = openModalEl.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // ─── Boot ───
  function init() {
    setupLogoFallback('welcome-logo', 'logo-failed');
    setupLogoFallback('admin-welcome-logo', null);
    initHeaderCollapse();
    initDelegatedClicks();
    adjustHitTargets();
    window.addEventListener('resize', adjustHitTargets);
    initMobileMenu();
    initModals();
    initInertModals(); // ← iOS autofill fix on load
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Mark any newly added modals as inert immediately
  const observer = new MutationObserver(() => {
    initInertModals();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Allow other scripts to re-bind modal handlers after replacing DOM
  window.reInitModals = initModals;
})();
  