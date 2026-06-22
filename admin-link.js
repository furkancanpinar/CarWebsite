// admin-link.js — Wire up admin link in nav/mobile menu
import { auth, db, doc, getDoc } from "./firebase.js";

async function checkIfAdmin(user) {
  if (!user) return false;
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

async function bindAdminLink(link) {
  if (!link) return;
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      // Open login modal
      const loginModal = document.getElementById('login-modal');
      if (loginModal) {
        loginModal.setAttribute('aria-hidden', 'false');
        loginModal.classList.add('open');
      }
      return;
    }

    const isAdmin = await checkIfAdmin(user);
    if (isAdmin) {
      window.location.href = 'admin.html';
    } else {
      // Show inline error in a better way than alert (e.g., toast)
      showToast('You don\'t have admin access.');
    }
  });
}

function showToast(message) {
  // Simple toast — replace with your toast system if you have one
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #1f2937; color: white; padding: 12px 20px;
    border-radius: 12px; z-index: 9999; font-size: 0.95rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Bind both desktop and mobile links
bindAdminLink(document.querySelector('.admin-link'));
bindAdminLink(document.getElementById('admin-link'));

// NOTE: adminPromote/adminDemote moved to admin-users.js
// and now require admin verification server-side via Firestore rules.
