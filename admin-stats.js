// admin-stats.js — Platform statistics for admin dashboard
import { auth, db, collection, getDocs, query, where } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  // Verify admin
  const { doc, getDoc } = await import("./firebase.js");
  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  if (!adminSnap.exists()) return;

  await loadStats();
});

async function loadStats() {
  try {
    // Run all queries in parallel
    const [usersSnap, approvedSnap, pendingSnap, soldSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(query(collection(db, "listings"), where("status", "==", "approved"))),
      getDocs(query(collection(db, "listings"), where("status", "==", "pending"))),
      getDocs(collection(db, "sold"))
    ]);

    setText('stat-total-users', usersSnap.size);
    setText('stat-active-listings', approvedSnap.size);
    setText('stat-pending', pendingSnap.size);
    setText('stat-sold', soldSnap.size);
  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value.toLocaleString();
}
