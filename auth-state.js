// auth-state.js
import { auth, onAuthStateChanged } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ Logged in:', user.email);
    document.body.classList.add('user-logged-in');
    hideAuthUI();
  } else {
    document.body.classList.remove('user-logged-in');
  }
});

function hideAuthUI() {
  // Hide login/signup buttons in desktop nav
  document.querySelectorAll('[data-modal-target="login-modal"]').forEach(btn => {
    if (!btn.closest('.mobile-menu')) btn.style.display = 'none';
  });
  document.querySelectorAll('[data-modal-target="signup-modal"]').forEach(btn => {
    if (!btn.closest('.mobile-menu')) btn.style.display = 'none';
  });

  // Hide mobile menu login/signup buttons
  const mobileLogin = document.getElementById('mobile-login');
  const mobileSignup = document.getElementById('mobile-signup');
  if (mobileLogin) mobileLogin.style.display = 'none';
  if (mobileSignup) mobileSignup.style.display = 'none';

  // ✅ KEY FIX: Remove the modals from the DOM entirely
  // This stops iCloud Keychain from detecting password fields
  setTimeout(() => {
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    if (loginModal) loginModal.remove();
    if (signupModal) signupModal.remove();
    console.log('🔐 Login/signup modals removed from DOM');
  }, 200);
}
