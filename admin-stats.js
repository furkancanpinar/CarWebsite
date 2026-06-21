// admin-stats.js
import { db, collection, getDocs, query, where } from "./firebase.js";

async function loadAdminStats() {
  try {
    // Users count
    const usersSnap = await getDocs(collection(db, "users"));
    const totalUsers = usersSnap.size;

    // Active (approved) listings
    const approvedQ = query(collection(db, "listings"), where("status", "==", "approved"));
    const approvedSnap = await getDocs(approvedQ);
    const activeListings = approvedSnap.size;

    // Pending listings
    const pendingQ = query(collection(db, "listings"), where("status", "==", "pending"));
    const pendingSnap = await getDocs(pendingQ);
    const pending = pendingSnap.size;

    // Sold cars
    const soldSnap = await getDocs(collection(db, "sold"));
    const sold = soldSnap.size;

    // Update DOM
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val.toLocaleString();
    };

    setText('stat-total-users', totalUsers);
    setText('stat-active-listings', activeListings);
    setText('stat-pending', pending);
    setText('stat-sold', sold);

  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

loadAdminStats();
