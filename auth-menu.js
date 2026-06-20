// auth-menu.js
import { auth, onAuthStateChanged, signOut } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
  updateAuthUI(user);
});

function updateAuthUI(user) {
  // Find ALL login/signup buttons across the page
  const loginButtons = document.querySelectorAll('[data-modal-target="login-modal"]');
  const signupButtons = document.querySelectorAll('[data-modal-target="signup-modal"]');
  
  // Find the mobile versions too
  const mobileLogin = document.getElementById('mobile-login');
  const mobileSignup = document.getElementById('mobile-signup');

  if (user) {
    // ============ LOGGED IN ============
    const userEmail = user.email;
    const userInitial = userEmail.charAt(0).toUpperCase();

    // Replace desktop login button with user menu
    loginButtons.forEach(btn => {
      if (btn.id === 'mobile-login') return; // skip mobile, handled separately
      btn.outerHTML = `
        <div class="user-menu-wrapper">
          <button class="button user-menu-button" id="user-menu-toggle" aria-label="User menu">
            <span class="user-avatar">${userInitial}</span>
            <span class="user-email-short">${shortenEmail(userEmail)}</span>
            <svg viewBox="0 0 24 24" style="width:14px; height:14px; fill:currentColor;">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          <div class="user-dropdown" id="user-dropdown" aria-hidden="true">
            <div class="user-dropdown-header">
              <div class="user-avatar-large">${userInitial}</div>
              <div>
                <p class="user-dropdown-name">${escapeHtml(userEmail)}</p>
                <p class="user-dropdown-status">Signed in</p>
              </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <a href="#" class="user-dropdown-item" id="my-listings-link">
              <span>🚗</span> My Listings
            </a>
            <a href="#" class="user-dropdown-item" id="my-profile-link">
              <span>👤</span> My Profile
            </a>
            <a href="#" class="user-dropdown-item" id="favorites-link">
              <span>♥</span> Saved Cars
            </a>
            <div class="user-dropdown-divider"></div>
            <button class="user-dropdown-item danger" id="logout-btn">
              <span>↪</span> Log Out
            </button>
          </div>
        </div>
      `;
    });

    // Hide desktop signup buttons when logged in
    signupButtons.forEach(btn => {
      if (btn.id === 'mobile-signup') return;
      btn.style.display = 'none';
    });

    // Update mobile menu login/signup
    if (mobileLogin) {
      mobileLogin.outerHTML = `
        <button class="button button-secondary" id="mobile-logout-btn">
          Log Out (${shortenEmail(userEmail)})
        </button>
      `;
    }
    if (mobileSignup) {
      mobileSignup.style.display = 'none';
    }

    // Attach dropdown toggle handler
    attachDropdownHandlers();
    
    // Attach logout handler
    attachLogoutHandlers();

  } else {
    // ============ LOGGED OUT ============
    // Restore original login/signup buttons if they were replaced
    const userMenu = document.querySelectorAll('.user-menu-wrapper');
    userMenu.forEach(el => {
      el.outerHTML = `<button class="button button-secondary" data-modal-target="login-modal">Login</button>`;
    });

    // Re-show signup buttons
    signupButtons.forEach(btn => {
      btn.style.display = '';
    });

    // Restore mobile login
    if (mobileLogin && mobileLogin.id === 'mobile-logout-btn') {
      mobileLogin.outerHTML = `<button class="button button-secondary" id="mobile-login" data-modal-target="login-modal">Login</button>`;
    }
    if (mobileSignup) {
      mobileSignup.style.display = '';
    }
    
    // Re-attach modal handlers since DOM changed
    if (typeof window.reInitModals === 'function') {
      window.reInitModals();
    }
  }
}

function shortenEmail(email) {
  if (!email) return '';
  const max = 18;
  if (email.length <= max) return email;
  return email.substring(0, max - 3) + '...';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function attachDropdownHandlers() {
  const toggle = document.getElementById('user-menu-toggle');
  const dropdown = document.getElementById('user-dropdown');
  if (!toggle || !dropdown) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    dropdown.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      dropdown.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.remove('open');
      dropdown.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function attachLogoutHandlers() {
  const logoutBtns = document.querySelectorAll('#logout-btn, #mobile-logout-btn');
  logoutBtns.forEach(btn => {
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
