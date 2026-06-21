// browse-listings.js
import { db, collection, getDocs, query, where, orderBy, limit } from "./firebase.js";

let allListings = [];

async function loadApprovedListings() {
  const grid = document.getElementById('listings-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--muted);">Loading cars from database...</div>';

  try {
    // Get all approved listings
    const q = query(collection(db, "listings"), where("status", "==", "approved"));
    const querySnapshot = await getDocs(q);

    allListings = [];
    querySnapshot.forEach(doc => {
      allListings.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Loaded ${allListings.length} approved listings`);

    // Read URL params and apply filters
    applyFiltersFromURL();

    // Update the count
    const countEl = document.getElementById('listings-count');
    if (countEl) countEl.textContent = allListings.length.toLocaleString();

  } catch (err) {
    console.error('Error loading listings:', err);
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px; color:#f87171;">Error loading cars: ${err.message}</div>`;
  }
}

function applyFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  const makeFilter = params.get('make');
  const maxPrice = params.get('maxPrice');

  let filtered = [...allListings];

  if (makeFilter) {
    filtered = filtered.filter(car => 
      (car.make || '').toLowerCase() === makeFilter.toLowerCase()
    );
    console.log(`Filtered by make: ${makeFilter} → ${filtered.length} results`);
  }

  if (maxPrice) {
    const max = parseInt(maxPrice);
    filtered = filtered.filter(car => (car.price || 0) <= max);
    console.log(`Filtered by max price: £${max} → ${filtered.length} results`);
  }

  // Update the filter inputs to reflect the URL
  if (makeFilter) {
    const makeInput = document.getElementById('search-make');
    if (makeInput) makeInput.value = makeFilter;
  }
  if (maxPrice) {
    const priceInput = document.getElementById('price-range');
    if (priceInput) priceInput.value = maxPrice;
  }

  // Update the page heading
  const pageTitle = document.querySelector('.page-header h1');
  if (pageTitle && (makeFilter || maxPrice)) {
    let title = 'Browse Cars';
    if (makeFilter) title = `${makeFilter} Cars`;
    if (maxPrice && maxPrice !== '999999') title += ` Under £${parseInt(maxPrice).toLocaleString()}`;
    pageTitle.textContent = title;
  }

  renderListings(filtered);
}

function renderListings(cars) {
  const grid = document.getElementById('listings-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (cars.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px;">
        <p style="color:var(--muted); font-size:1.15rem; margin:0 0 8px;">No cars match your filters.</p>
        <p style="color:var(--muted); font-size:0.9rem;">Try adjusting your search criteria.</p>
        <a href="browse.html" class="button button-secondary" style="margin-top:16px;">Show All Cars</a>
      </div>
    `;
    return;
  }

  cars.forEach(car => {
    grid.insertAdjacentHTML('beforeend', buildCarCard(car.id, car));
  });
}

function buildCarCard(id, car) {
  const imageUrl = car.imageUrl || '';
  const price = car.price ? `£${car.price.toLocaleString()}` : '—';
  const title = car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Featured Car';
  const mileage = car.mileage ? `${car.mileage.toLocaleString()} mi` : '— mi';
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

loadApprovedListings();
