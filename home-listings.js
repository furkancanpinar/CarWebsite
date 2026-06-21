// home-listings.js
import { db, collection, getDocs, query, where } from "./firebase.js";

async function loadHomeStats() {
  console.log('📊 home-listings.js loaded - starting stats fetch');
  
  try {
    // Get approved listings count
    const listingsQuery = query(collection(db, "listings"), where("status", "==", "approved"));
    const listingsSnap = await getDocs(listingsQuery);
    const carsCount = listingsSnap.size;
    
    console.log('📊 Approved cars found:', carsCount);

    // Get users count
    const usersSnap = await getDocs(collection(db, "users"));
    const usersCount = usersSnap.size;
    
    console.log('📊 Users found:', usersCount);

    // Update DOM
    const carsEl = document.getElementById('home-stat-cars');
    if (carsEl) {
      carsEl.textContent = carsCount.toLocaleString();
      console.log('✅ Updated home-stat-cars to:', carsCount);
    } else {
      console.error('❌ #home-stat-cars element NOT FOUND in DOM');
    }

    const usersEl = document.getElementById('home-stat-users');
    if (usersEl) {
      usersEl.textContent = usersCount.toLocaleString();
      console.log('✅ Updated home-stat-users to:', usersCount);
    } else {
      console.error('❌ #home-stat-users element NOT FOUND in DOM');
    }

  } catch (err) {
    console.error('❌ Stats load FAILED:', err.message);
    console.error('Full error:', err);
  }
}

async function loadFeaturedCars() {
  const grid = document.getElementById('featured-cars-grid');
  if (!grid) {
    console.log('ℹ️ No featured-cars-grid found (carousel page)');
    return;
  }

  grid.innerHTML = '<div class="loading-message-modern">Loading featured cars...</div>';

  try {
    const q = query(
      collection(db, "listings"),
      where("status", "==", "approved")
    );
    const querySnapshot = await getDocs(q);
    const cars = [];
    querySnapshot.forEach(doc => cars.push({ id: doc.id, ...doc.data() }));
    
    // Pick 3 random cars for the grid (different from carousel)
    const shuffled = cars.sort(() => Math.random() - 0.5).slice(0, 3);

    grid.innerHTML = '';

    if (shuffled.length === 0) {
      grid.innerHTML = `
        <div class="loading-message-modern" style="grid-column:1/-1;">
          <p>No featured cars yet.</p>
          <p style="font-size:0.9rem; margin-top:8px;">Check back soon!</p>
        </div>
      `;
      return;
    }

    shuffled.forEach((car) => {
      const card = buildCarCard(car.id, car);
      grid.insertAdjacentHTML('beforeend', card);
    });
    
    console.log('✅ Featured cars grid loaded:', shuffled.length, 'cars');

  } catch (err) {
    console.error('❌ Featured cars load failed:', err);
    grid.innerHTML = `<div class="loading-message-modern" style="grid-column:1/-1; color:#f87171;">Error: ${err.message}</div>`;
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
