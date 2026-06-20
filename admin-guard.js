// admin-guard.js
import { auth, db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Make page invisible until verified (prevents flash of admin UI)
document.documentElement.style.visibility = "hidden";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("index.html");
    return;
  }

  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    if (!snap.exists()) {
      window.location.replace("index.html");
      return;
    }

    // ✅ Verified admin — show the page
    document.documentElement.style.visibility = "visible";
    document.body.classList.add("admin-verified");
  } catch (err) {
    console.error("Admin check failed:", err);
    window.location.replace("index.html");
  }
});
