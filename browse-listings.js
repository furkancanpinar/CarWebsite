// browse-listings.js
import { db, collection, getDocs, query, where } from "./firebase.js";

async function loadApprovedListings() {
  const grid = document.querySelector('.listings-grid');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--muted);">Loading cars...</div>`;

  try {
    // Get only approved listings
    const q = query(collection(db, "listings"), where("status", "==", "approved"));
    const querySnapshot = await getDocs(q);

    grid.innerHTML = '';

    if (querySnapshot.empty) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px;">
          <p style="color:var(--muted); font-size:1.1rem;">No cars available yet.</p>
          <p style="color:var(--muted);">Check back soon — we're adding new listings every week!</p>
        </div>
      `;
      return;
    }

    let count = 0;
    querySnapshot.forEach((docSnap) => {
      const car = docSnap.data();
      const id = docSnap.id;
      grid.insertAdjacentHTML('beforeend', buildCarCard(id, car));
      count++;
    });

    // Update the count in page header
    const statEl = document.querySelector('.stat-card span');
    if (statEl) statEl.textContent = count.toLocaleString();

  } catch (err) {
    console.error('Error loading listings:', err);
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px; color:#f87171;">Error loading cars: ${err.message}</div>`;
  }
}

function buildCarCard(id, car) {
  const imageUrl = car.imageUrl || '';
  const price = car.price ? `£${car.price.toLocaleString()}` : '—';
  const title = car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Untitled';
  const mileage = car.mileage ? `${car.mileage.toLocaleString()} mi` : '— mi';
  const year = car.year || '—';
  const fuel = car.fuel || '—';

  const imageStyle = imageUrl 
    ? `background-image:url('${imageUrl}'); background-size:cover; background-position:center;` 
    : `background: linear-gradient(160deg, #1e293b 0%, #334155 100%);`;

  return `
    <article class="car-card" data-id="${id}" data-make="${escapeHtml(car.make || '')}" data-model="${escapeHtml(car.model || '')}" data-year="${year}" data-fuel="${escapeHtml(fuel)}" data-price="${car.price || 0}">
      <div class="car-image" style="${imageStyle}">
        <button class="favorite-button" aria-label="Save car">♥</button>
        <span class="badge verified">Available</span>
      </div>
      <div class="car-content">
        <div class="car-title">
          <div>
            <h3>${escapeHtml(title)}</h3>
            <p>${year} • ${escapeHtml(fuel)}</p>
          </div>
          <p class="car-price">${price}</p>
        </div>
        <ul class="car-specs">
          <li>${mileage}</li>
          <li>${year}</li>
          <li>${escapeHtml(fuel)}</li>
        </ul>
        <div class="card-actions">
          <button class="button button-secondary-outline">View Details</button>
          <button class="button button-primary">Save</button>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

loadApprovedListings();
