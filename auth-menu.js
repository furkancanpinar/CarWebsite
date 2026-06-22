// auth-menu.js — Update UI based on auth state
import { auth, onAuthStateChanged, signOut } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
  if (user) showLoggedIn(user);
  else showLoggedOut();
});

function showLoggedIn(user) {
  const initial = (user.email || '?').charAt(0).toUpperCase();
  const emailShort = shortenEmail(user.email);

  // Desktop login button → user menu
  document.querySelectorAll('[data-modal-target="login-modal"]').forEach(btn => {
    if (btn.closest('.mobile-menu')) return;
    btn.outerHTML = buildUserMenu(initial, user.email);
  });

  // Hide desktop signup
  document.querySelectorAll('[data-modal-target="signup-modal"]').forEach(btn => {
    if (!btn.closest('.mobile-menu')) btn.style.display = 'none';
  });

  // Mobile: replace login with logout
  const mobileLogin = document.getElementById('mobile-login');
  if (mobileLogin) {
    mobileLogin.outerHTML = `<button type="button" class="button button-secondary" id="mobile-logout-btn">Log Out (${emailShort})</button>`;
  }

  const mobileSignup = document.getElementById('mobile-signup');
  if (mobileSignup) mobileSignup.style.display = 'none';

  attachDropdownHandlers();
  attachLogoutHandlers();

  // Re-bind modals because we replaced buttons
  if (typeof window.reInitModals === 'function') window.reInitModals();
}

function showLoggedOut() {
  // Restore login buttons (those that became user menus)
  document.querySelectorAll('.user-menu-wrapper').forEach(el => {
    el.outerHTML = `<button type="button" class="button button-secondary" data-modal-target="login-modal">Login</button>`;
  });

  // Re-show signup
  document.querySelectorAll('[data-modal-target="signup-modal"]').forEach(btn => {
    btn.style.display = '';
  });

  // Restore mobile login
  const mobileLogout = document.getElementById('mobile-logout-btn');
  if (mobileLogout) {
    mobileLogout.outerHTML = `<button type="button" class="button button-secondary" id="mobile-login" data-modal-target="login-modal">Login</button>`;
  }

  const mobileSignup = document.getElementById('mobile-signup');
  if (mobileSignup) mobileSignup.style.display = '';

  if (typeof window.reInitModals === 'function') window.reInitModals();
}

function buildUserMenu(initial, email) {
  return `
    <div class="user-menu-wrapper">
      <button type="button" class="button user-menu-button" id="user-menu-toggle" aria-label="User menu" aria-expanded="false" aria-controls="user-dropdown">
        <span class="user-avatar">${escapeHtml(initial)}</span>
        <span class="user-email-short">${escapeHtml(shortenEmail(email))}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      <div class="user-dropdown" id="user-dropdown" aria-hidden="true">
        <div class="user-dropdown-header">
          <div class="user-avatar-large">${escapeHtml(initial)}</div>
          <div>
            <p class="user-dropdown-name">${escapeHtml(email)}</p>
            <p class="user-dropdown-status">Signed in</p>
          </div>
        </div>
        <div class="user-dropdown-divider"></div>
        <a href="my-listings.html" class="user-dropdown-item"><span aria-hidden="true">🚗</span> My Listings</a>
        <a href="profile.html" class="user-dropdown-item"><span aria-hidden="true">👤</span> My Profile</a>
        <a href="favorites.html" class="user-dropdown-item"><span aria-hidden="true">♥</span> Saved Cars</a>
        <div class="user-dropdown-divider"></div>
        <button type="button" class="user-dropdown-item danger" id="logout-btn"><span aria-hidden="true">↪</span> Log Out</button>
      </div>
    </div>
  `;
}

function attachDropdownHandlers() {
  const toggle = document.getElementById('user-menu-toggle');
  const dropdown = document.getElementById('user-dropdown');
  if (!toggle || !dropdown) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    dropdown.setAttribute('aria-hidden', String(!isOpen));
  });

  // Use AbortController for clean removal
  const controller = new AbortController();
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      dropdown.setAttribute('aria-hidden', 'true');
    }
  }, { signal: controller.signal });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdown.classList.contains('open')) {
      dropdown.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      dropdown.setAttribute('aria-hidden', 'true');
    }
  }, { signal: controller.signal });
}

function attachLogoutHandlers() {
  document.querySelectorAll('#logout-btn, #mobile-logout-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!confirm('Log out of your account?')) return;
      try {
        await signOut(auth);
        window.location.reload();
      } catch (err) {
        console.error('Logout failed:', err);
        alert('Failed to log out: ' + err.message);
      }
    });
  });
}

function shortenEmail(email) {
  if (!email) return '';
  const max = 18;
  return email.length <= max ? email : email.substring(0, max - 3) + '...';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
