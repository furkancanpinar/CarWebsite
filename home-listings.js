// home-listings.js — Home page stats + featured cars
import { db, collection, getDocs, query, where } from "./firebase.js";

async function loadHomeStats() {
  try {
    const [approvedSnap, usersSnap] = await Promise.all([
      getDocs(query(collection(db, "listings"), where("status", "==", "approved"))),
      getDocs(collection(db, "users"))
    ]);

    setText('home-stat-cars', approvedSnap.size);
    setText('home-stat-users', usersSnap.size);
  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

async function loadFeaturedCars() {
  // Featured cars now come from the carousel, not a separate grid.
  // This function is kept as a no-op for backward compatibility.
  const grid = document.getElementById('featured-cars-grid');
  if (!grid) return;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value.toLocaleString();
}

loadHomeStats();
loadFeaturedCars();
