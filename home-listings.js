// home-listings.js
import { db, collection, getDocs, query, where, orderBy, limit } from "./firebase.js";

async function loadHomeStats() {
  try {
    // Get listings count
    const listingsQuery = query(collection(db, "listings"), where("status", "==", "approved"));
    const listingsSnap = await getDocs(listingsQuery);
    
    const carsEl = document.getElementById('home-stat-cars');
    if (carsEl) carsEl.textContent = listingsSnap.size.toLocaleString();

    // Get users count
    const usersSnap = await getDocs(collection(db, "users"));
    const usersEl = document.getElementById('home-stat-users');
    if (usersEl) usersEl.textContent = usersSnap.size.toLocaleString();

  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

async function loadFeaturedCars() {
  const grid = document.getElementById('featured-cars-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-message-modern">Loading featured cars...</div>';

  try {
    // Get the latest 6 approved listings
    const q = query(
      collection(db, "listings"),
      where("status", "==", "approved"),
      limit(6)
    );
    const querySnapshot = await getDocs(q);

    grid.innerHTML = '';

    if (querySnapshot.empty) {
      grid.innerHTML = `
        <div class="loading-message-modern" style="grid-column:1/-1;">
          <p>No featured cars yet.</p>
          <p style="font-size:0.9rem; margin-top:8px;">Check back soon — we're adding new listings every week!</p>
        </div>
      `;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const car = docSnap.data();
      const id = docSnap.id;
      grid.insertAdjacentHTML('beforeend', buildCarCard(id, car));
    });

  } catch (err) {
    console.error('Featured cars load failed:', err);
    grid.innerHTML = `<div class="loading-message-modern" style="grid-column:1/-1; color:#f87171;">Error loading cars: ${err.message}</div>`;
  }
}

function buildCarCard(id, car) {
  const imageUrl = car.imageUrl || '';
  const price = car.price ? `£${car.price.toLocaleString()}` : '—';
  const title = car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Featured Car';
  const mileage = car.mileage ? `${car.mileage.toLocaleString()} mi` : '—';
  const year = car.year || '—';
  const fuel = car.fuel || '—';

  const imageStyle = imageUrl 
    ? `background-image:url('${imageUrl}'); background-size:cover; background-position:center;` 
    : `background: linear-gradient(160deg, #1e293b 0%, #334155 100%);`;

  return `
    <article class="car-card" data-id="${id}">
      <div class="car-image" style="${imageStyle}">
        <button class="favorite-button" aria-label="Save car">♥</button>
        <span class="badge verified">Available</span>
      </div>
      <div class="car-content">
        <div class="car-title">
          <h3>${escapeHtml(title)}</h3>
          <p class="car-price">${price}</p>
        </div>
        <ul class="car-specs">
          <li>${mileage}</li>
          <li>${year}</li>
          <li>${escapeHtml(fuel)}</li>
        </ul>
        <a href="browse.html" class="button button-secondary-outline">View Details</a>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Run on load
loadHomeStats();
loadFeaturedCars();
