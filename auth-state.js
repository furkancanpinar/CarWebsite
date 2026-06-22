// auth-state.js — Lightweight auth state indicator (no DOM removal!)
import { auth, onAuthStateChanged } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.body.classList.add('user-logged-in');
  } else {
    document.body.classList.remove('user-logged-in');
  }
});

// NOTE: Removed the modal DOM removal — it conflicts with auth-menu.js
// If you want to hide auth UI, do it via CSS:
// body.user-logged-in [data-modal-target="login-modal"] { display: none; }
