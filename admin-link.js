// admin-link.js
import { auth, db, doc, getDoc, setDoc, deleteDoc } from "./firebase.js";

async function checkIfAdmin(user) {
  const snap = await getDoc(doc(db, "admins", user.uid));
  return snap.exists();
}

async function bindAdminLink(link) {
  if (!link) return;
  link.addEventListener("click", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      alert("Please log in first.");
      // Open the login modal if it exists
      const loginModal = document.getElementById("login-modal");
      if (loginModal) {
        loginModal.setAttribute("aria-hidden", "false");
        loginModal.classList.add("open");
      }
      return;
    }

    const isAdmin = await checkIfAdmin(user);
    if (isAdmin) {
      window.location.href = "admin.html";
    } else {
      alert("You are not an admin.");
    }
  });
}

bindAdminLink(document.querySelector(".admin-link"));
bindAdminLink(document.getElementById("admin-link"));

// Expose make-admin / remove-admin helpers globally so admin.html can call them
window.adminPromote = async function(userUid, userEmail) {
  await setDoc(doc(db, "admins", userUid), {
    email: userEmail,
    role: "admin",
    promotedAt: new Date()
  });
};

window.adminDemote = async function(userUid) {
  await deleteDoc(doc(db, "admins", userUid));
};
