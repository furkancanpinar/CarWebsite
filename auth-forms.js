// auth-forms.js — Sign up + login form handlers (separate from firebase init)
import {
  auth, db, doc, setDoc,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  serverTimestamp
} from "./firebase.js";

function friendlyAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.'
  };
  return map[code] || 'An unexpected error occurred.';
}

// ── Sign up ──
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name, email,
        role: "Buyer",
        status: "Active",
        listings: 0,
        joinedAt: serverTimestamp()
      });
      signupForm.reset();
      document.getElementById('signup-modal')?.setAttribute('aria-hidden', 'true');
    } catch (err) {
      console.error('Signup error:', err);
      alert(`Signup failed: ${friendlyAuthError(err.code)}`);
    }
  });
}

// ── Login ──
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginForm.reset();
      document.getElementById('login-modal')?.setAttribute('aria-hidden', 'true');
    } catch (err) {
      console.error('Login error:', err);
      alert(`Login failed: ${friendlyAuthError(err.code)}`);
    }
  });
}
