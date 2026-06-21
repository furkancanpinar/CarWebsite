// sold-cars.js
import { db, collection, getDocs, query, orderBy } from "./firebase.js";

async function loadSoldCars() {
  const grid = document.getElementById('sold-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--muted);">Loading sold vehicles from database...</div>';

  try {
    console.log('📦 Loading sold cars from Firestore...');
    
    const q = query(collection(db, "sold"), orderBy("soldAt", "desc"));
    const querySnapshot = await getDocs(q);

    console.log('📦 Found sold cars:', querySnapshot.size);

    grid.innerHTML = '';

    if (querySnapshot.empty) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:80px 20px;">
          <p style="color:var(--muted); font-size:1.15rem; margin:0 0 8px;">No sold vehicles yet.</p>
          <p style="color:var(--muted); font-size:0.9rem;">When admins mark cars as sold, they'll appear here.</p>
        </div>
      `;
      updateSoldStats(0, 0, 0);
      return;
    }

    const allSold = [];
    querySnapshot.forEach(doc => allSold.push(doc.data()));

    populateYearFilter(allSold);

    allSold.forEach(car => {
      grid.insertAdjacentHTML('beforeend', buildSoldCard(car));
    });

    const totalValue = allSold.reduce((sum, car) => sum + (car.price || 0), 0);
    const thisMonth = allSold.filter(car => {
      if (!car.soldAt) return false;
      const saleDate = car.soldAt.toDate ? car.soldAt.toDate() : new Date(car.soldAt);
      const now = new Date();
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    }).length;
    
    updateSoldStats(allSold.length, totalValue, thisMonth);
    setupSoldFilters();

    console.log('✅ Sold cars loaded successfully');

  } catch (err) {
    console.error('❌ Failed to load sold cars:', err);
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px; color:#f87171;">Error loading sold vehicles: ${err.message}</div>`;
  }
}

function buildSoldCard(car) {
  const imageUrl = car.imageUrl || '';
  const imageStyle = imageUrl 
    ? `background-image:url('${imageUrl}'); background-size:cover; background-position:center;` 
    : `background: linear-gradient(135deg, #1e293b 0%, #334155 100%);`;
  
  const title = car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Sold Vehicle';
  const price = car.price ? `£${car.price.toLocaleString()}` : '—';
  const mileage = car.mileage ? `${car.mileage.toLocaleString()} mi` : '— mi';
  const year = car.year || '—';
  const fuel = car.fuel || '—';
  const saleDate = formatSaleDate(car.soldAt || car.saleDate);
  const originalDesc = car.description ? `<p class="car-muted">${escapeHtml(car.description.substring(0, 100))}${car.description.length > 100 ? '...' : ''}</p>` : '';

  return `
    <article class="car-card sold-item" 
             data-make="${escapeHtml(car.make || '')}" 
             data-model="${escapeHtml(car.model || '')}" 
             data-year="${year}"
             data-fuel="${escapeHtml(fuel)}"
             data-mileage="${car.mileage || 0}">
      <div class="car-image" style="${imageStyle}">
        <span class="badge sold">SOLD</span>
      </div>
      <div class="car-content">
        <div class="car-title">
          <div>
            <h3>${escapeHtml(title)}</h3>
            <p class="car-price">${price}</p>
          </div>
        </div>
        <ul class="car-specs">
          <li>${mileage}</li>
          <li>${year}</li>
          <li>${escapeHtml(fuel)}</li>
        </ul>
        <p class="car-muted">📅 Sold on ${saleDate}</p>
        ${originalDesc}
      </div>
    </article>
  `;
}

function formatSaleDate(timestamp) {
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return 'Recently';
  }
}

function populateYearFilter(cars) {
  const filter = document.getElementById('sold-filter-year');
  if (!filter) return;

  const years = [...new Set(cars.map(c => c.year).filter(y => y))].sort((a, b) => b - a);
  
  filter.innerHTML = '<option value="">All years</option>';
  years.forEach(year => {
    filter.insertAdjacentHTML('beforeend', `<option value="${year}">${year}</option>`);
  });
}

function updateSoldStats(total, value, monthCount) {
  const totalEl = document.getElementById('sold-stat-total');
  const valueEl = document.getElementById('sold-stat-value');
  const monthEl = document.getElementById('sold-stat-month');

  if (totalEl) totalEl.textContent = total.toLocaleString();
  if (valueEl) valueEl.textContent = value > 0 ? `£${(value / 1000).toFixed(0)}k` : '£0';
  if (monthEl) monthEl.textContent = monthCount.toLocaleString();
}

function setupSoldFilters() {
  const search = document.getElementById('sold-search');
  const year = document.getElementById('sold-filter-year');

  function applyFilters() {
    const q = search ? search.value.trim().toLowerCase() : '';
    const y = year ? year.value : '';
    
    document.querySelectorAll('.sold-item').forEach(item => {
      const make = (item.dataset.make || '').toLowerCase();
      const model = (item.dataset.model || '').toLowerCase();
      const itemYear = (item.dataset.year || '');
      
      const matchesQ = !q || make.includes(q) || model.includes(q) || `${make} ${model}`.includes(q);
      const matchesY = !y || itemYear === y;
      
      item.style.display = (matchesQ && matchesY) ? '' : 'none';
    });
  }

  if (search) search.addEventListener('input', applyFilters);
  if (year) year.addEventListener('change', applyFilters);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

loadSoldCars();
