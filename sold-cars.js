// sold-cars.js — Display sold vehicles archive with pagination
import { db, collection, getDocs } from "./firebase.js";

// ============================================================
// STATE
// ============================================================
let allSold = [];
let filteredSold = [];
const PAGE_SIZE = 6;
let currentPage = 1;
let lastFilterKey = '';

// ============================================================
// LOAD
// ============================================================
async function loadSoldCars() {
  const grid = document.getElementById('sold-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-message-modern" style="grid-column:1/-1;">Loading sold vehicles...</div>';

  try {
    const snapshot = await getDocs(collection(db, "sold"));
    allSold = [];
    snapshot.forEach(doc => allSold.push(doc.data()));

    // Sort newest first (client-side, no Firestore index needed)
    allSold.sort((a, b) => timeMs(b.soldAt) - timeMs(a.soldAt));

    // Update top stats from full dataset (not affected by filters/pagination)
    updateStats(allSold.length, totalValue(allSold), thisMonthCount(allSold));

    if (allSold.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:80px 20px;">
          <p style="color:var(--muted); font-size:1.15rem; margin:0 0 8px;">No sold vehicles yet.</p>
          <p style="color:var(--muted); font-size:0.9rem;">When admins mark cars as sold, they'll appear here.</p>
        </div>
      `;
      renderPagination(0);
      return;
    }

    populateYearFilter(allSold);
    bindFilters();
    applyFilters();
  } catch (err) {
    console.error('Load sold cars error:', err);
    grid.innerHTML = `<div class="loading-message-modern" style="grid-column:1/-1; color:#f87171;">Error: ${escapeHtml(err.message)}</div>`;
  }
}

// ============================================================
// FILTERS
// ============================================================
function bindFilters() {
  const search = document.getElementById('sold-search');
  const year = document.getElementById('sold-filter-year');

  if (search) search.addEventListener('input', applyFilters);
  if (year) year.addEventListener('change', applyFilters);
}

function applyFilters() {
  const search = (document.getElementById('sold-search')?.value || '').trim().toLowerCase();
  const year = document.getElementById('sold-filter-year')?.value || '';

  filteredSold = allSold.filter(car => {
    const make = (car.make || '').toLowerCase();
    const model = (car.model || '').toLowerCase();
    const haystack = `${car.title || ''} ${make} ${model} ${car.year || ''}`.toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesYear = !year || String(car.year || '') === year;

    return matchesSearch && matchesYear;
  });

  // If filters changed since last render, reset to page 1
  const filterKey = `${search}|${year}`;
  if (filterKey !== lastFilterKey) {
    currentPage = 1;
    lastFilterKey = filterKey;
  }

  const totalPages = Math.max(1, Math.ceil(filteredSold.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredSold.slice(start, start + PAGE_SIZE);

  renderListings(pageItems);
  renderPagination(totalPages);
}

// ============================================================
// RENDER
// ============================================================
function renderListings(cars) {
  const grid = document.getElementById('sold-grid');
  if (!grid) return;

  if (cars.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
        <p style="color:var(--muted); font-size:1.15rem; margin:0 0 8px;">No sold vehicles match your search.</p>
        <p style="color:var(--muted); font-size:0.9rem;">Try a different search term or year filter.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = cars.map(buildSoldCard).join('');
}

function buildSoldCard(car) {
  const imageUrl = car.imageUrl || '';
  const imageStyle = imageUrl
    ? `background-image:url('${escapeAttr(imageUrl)}'); background-size:cover; background-position:center;`
    : `background: linear-gradient(135deg, #1e293b 0%, #334155 100%);`;

  const title = car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Sold Vehicle';
  const desc = car.description
    ? `<p class="car-muted">${escapeHtml(car.description.substring(0, 100))}${car.description.length > 100 ? '...' : ''}</p>`
    : '';

  return `
    <article class="car-card sold-item"
             data-make="${escapeAttr(car.make || '')}"
             data-model="${escapeAttr(car.model || '')}"
             data-year="${car.year || ''}">
      <div class="car-image" style="${imageStyle}">
        <span class="badge sold">SOLD</span>
      </div>
      <div class="car-content">
        <h3>${escapeHtml(title)}</h3>
        <p class="car-price">£${(car.price || 0).toLocaleString()}</p>
        <ul class="car-specs">
          <li>${(car.mileage || 0).toLocaleString()} mi</li>
          <li>${car.year || '—'}</li>
          <li>${escapeHtml(car.fuel || '—')}</li>
        </ul>
        <p class="car-muted">📅 Sold on ${formatSaleDate(car.soldAt)}</p>
        ${desc}
      </div>
    </article>
  `;
}

// ============================================================
// PAGINATION
// ============================================================
function renderPagination(totalPages) {
  const nav = document.getElementById('sold-pagination');
  if (!nav) return;

  if (totalPages <= 1) {
    nav.innerHTML = '';
    return;
  }

  const pages = buildPageList(currentPage, totalPages);
  const parts = [];

  // Prev arrow
  parts.push(`
    <button type="button" class="page-button page-arrow" data-page="${currentPage - 1}"
      ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </button>
  `);

  // Numbered buttons + ellipses
  pages.forEach(p => {
    if (p === '...') {
      parts.push('<span class="page-ellipsis" aria-hidden="true">…</span>');
    } else {
      const isActive = p === currentPage;
      parts.push(
        `<button type="button" class="page-button ${isActive ? 'active' : ''}"
          data-page="${p}" ${isActive ? 'aria-current="page"' : ''}>${p}</button>`
      );
    }
  });

  // Next arrow
  parts.push(`
    <button type="button" class="page-button page-arrow" data-page="${currentPage + 1}"
      ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
      </svg>
    </button>
  `);

  nav.innerHTML = parts.join('');

  // Wire clicks
  nav.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.dataset.page, 10);
      if (Number.isNaN(target) || target < 1 || target > totalPages) return;
      if (target === currentPage) return;
      currentPage = target;
      applyFilters();
      document.getElementById('sold-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function buildPageList(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set();
  pages.add(1);
  pages.add(total);
  pages.add(current);

  if (current - 1 >= 1) pages.add(current - 1);
  if (current + 1 <= total) pages.add(current + 1);

  if (current <= 3) {
    pages.add(2);
    pages.add(3);
  }

  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
    result.push(sorted[i]);
  }
  return result;
}

// ============================================================
// STATS
// ============================================================
function updateStats(total, value, monthCount) {
  const totalEl = document.getElementById('sold-stat-total');
  const valueEl = document.getElementById('sold-stat-value');
  const monthEl = document.getElementById('sold-stat-month');

  if (totalEl) totalEl.textContent = total.toLocaleString();
  if (valueEl) valueEl.textContent = value > 0 ? `£${(value / 1000).toFixed(0)}k` : '£0';
  if (monthEl) monthEl.textContent = monthCount.toLocaleString();
}

function totalValue(cars) {
  return cars.reduce((sum, c) => sum + (c.price || 0), 0);
}

function thisMonthCount(cars) {
  const now = new Date();
  return cars.filter(car => {
    const d = car.soldAt?.toDate?.() || new Date(car.soldAt);
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

function populateYearFilter(cars) {
  const filter = document.getElementById('sold-filter-year');
  if (!filter) return;

  const years = [...new Set(cars.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);

  filter.innerHTML = '<option value="">All years</option>' +
    years.map(y => `<option value="${y}">${y}</option>`).join('');
}

// ============================================================
// HELPERS
// ============================================================
function formatSaleDate(timestamp) {
  if (!timestamp) return 'Recently';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function timeMs(ts) {
  if (!ts) return 0;
  try { return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime(); }
  catch { return 0; }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

// ============================================================
// BOOT
// ============================================================
loadSoldCars();
