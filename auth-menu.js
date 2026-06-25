// auth-menu.js — Update UI based on auth state (mobile-safe)
import { auth, onAuthStateChanged, signOut } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
  if (user) showLoggedIn(user);
  else showLoggedOut();
});

function showLoggedIn(user) {
  const initial = (user.email || '?').charAt(0).toUpperCase();
  const emailShort = shortenEmail(user.email);

  // ─── DESKTOP: Replace login button with user menu ───
  document.querySelectorAll('[data-modal-target="login-modal"]').forEach(btn => {
    if (btn.closest('.mobile-menu')) return;
    btn.outerHTML = buildUserMenu(initial, user.email);
  });

  // ─── DESKTOP: Hide signup button ───
  document.querySelectorAll('[data-modal-target="signup-modal"]').forEach(btn => {
    if (!btn.closest('.mobile-menu')) btn.style.display = 'none';
  });

  // ─── MOBILE: Force replace entire mobile menu actions ───
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    const mobileActions = mobileMenu.querySelector('.mobile-menu-actions');
    if (mobileActions) {
      mobileActions.innerHTML = `
        <button type="button" class="button user-menu-button" id="mobile-user-toggle" aria-expanded="false" aria-controls="mobile-user-dropdown" style="width:100%; justify-content:flex-start;">
          <span class="user-avatar">${escapeHtml(initial)}</span>
          <span style="flex:1; text-align:left; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(emailShort)}</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
        <div id="mobile-user-dropdown" class="user-dropdown" style="position:static; visibility:visible; opacity:1; transform:none; display:none; width:100%; margin:8px 0;">
          <div class="user-dropdown-header">
            <div class="user-avatar-large">${escapeHtml(initial)}</div>
            <div>
              <p class="user-dropdown-name">${escapeHtml(user.email)}</p>
              <p class="user-dropdown-status">Signed in</p>
            </div>
          </div>
          <div class="user-dropdown-divider"></div>
          <button type="button" class="user-dropdown-item danger" id="mobile-logout-btn">
            <span aria-hidden="true">↪</span> Log Out
          </button>
        </div>
        <button type="button" class="button" id="mobile-theme-toggle" aria-label="Toggle theme" aria-pressed="false">Toggle theme</button>
      `;
    }
  }

  attachDropdownHandlers();
  attachLogoutHandlers();

  if (typeof window.reInitModals === 'function') window.reInitModals();
}

function showLoggedOut() {
  // Restore desktop login buttons
  document.querySelectorAll('.user-menu-wrapper').forEach(el => {
    el.outerHTML = `<button type="button" class="button button-secondary" data-modal-target="login-modal">Login</button>`;
  });

  // Re-show desktop signup
  document.querySelectorAll('[data-modal-target="signup-modal"]').forEach(btn => {
    btn.style.display = '';
  });

  // Restore mobile menu actions
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    const mobileActions = mobileMenu.querySelector('.mobile-menu-actions');
    if (mobileActions) {
      mobileActions.innerHTML = `
        <button type="button" class="button button-secondary" data-modal-target="login-modal">Login</button>
        <button type="button" class="button button-secondary" data-modal-target="signup-modal">Sign Up</button>
        <button type="button" class="button" id="mobile-theme-toggle" aria-label="Toggle theme" aria-pressed="false">Toggle theme</button>
      `;
    }
  }

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
  // Desktop dropdown
  const toggle = document.getElementById('user-menu-toggle');
  const dropdown = document.getElementById('user-dropdown');
  if (toggle && dropdown) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      dropdown.setAttribute('aria-hidden', String(!isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('aria-hidden', 'true');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Mobile dropdown (inline expand)
  const mobileToggle = document.getElementById('mobile-user-toggle');
  const mobileDropdown = document.getElementById('mobile-user-dropdown');
  if (mobileToggle && mobileDropdown) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileDropdown.style.display !== 'none';
      mobileDropdown.style.display = isOpen ? 'none' : 'block';
      mobileToggle.setAttribute('aria-expanded', String(!isOpen));
    });
  }
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
