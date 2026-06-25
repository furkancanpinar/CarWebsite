// admin-guard.js — Safe admin gate with fallback
import { auth, db, doc, getDoc } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const TIMEOUT_MS = 10000; // 10 seconds max wait

// Safety timeout — if anything hangs, redirect after 10s
const fallbackTimer = setTimeout(() => {
  console.warn('Admin guard: timeout — redirecting');
  window.location.replace("index.html");
}, TIMEOUT_MS);

// Show body IMMEDIATELY (don't hide it before auth check)
// This prevents the "invisible page on mobile" issue
function revealPage() {
  document.body.style.visibility = "visible";
  document.body.classList.add("admin-verified");
}

onAuthStateChanged(auth, async (user) => {
  try {
    clearTimeout(fallbackTimer);

    if (!user) {
      // Close any open modals so they don't flash
      document.querySelectorAll('.modal').forEach(m => {
        m.classList.remove('open');
        m.setAttribute('aria-hidden', 'true');
      });
      document.body.classList.remove('modal-open');
      document.documentElement.style.overflow = '';

      window.location.replace("index.html");
      return;
    }

    const snap = await getDoc(doc(db, "admins", user.uid));
    if (!snap.exists()) {
      console.warn('User is not admin');
      window.location.replace("index.html");
      return;
    }

    // Only NOW confirm page should stay visible
    revealPage();

    // Store admin data for other scripts
    window.__adminData = snap.data();
  } catch (err) {
    console.error('Admin check failed:', err);
    window.location.replace("index.html");
  }
});
