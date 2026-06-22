// browse-listings.js — Load + filter + paginate approved listings
import { db, collection, getDocs, query, where } from "./firebase.js";

// ============================================================
// STATE
// ============================================================
let allListings = [];
const PAGE_SIZE = 6;
let currentPage = 1;
let lastFilterKey = '';

// ============================================================
// LOAD
// ============================================================
async function loadApprovedListings() {
  const grid = document.getElementById('listings-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-message-modern" style="grid-column:1/-1;">Loading cars...</div>';

  try {
    const snapshot = await getDocs(
      query(collection(db, "listings"), where("status", "==", "approved"))
    );
    allListings = [];
    snapshot.forEach(doc => allListings.push({ id: doc.id, ...doc.data() }));

    // Total available count (across all pages)
    const countEl = document.getElementById('listings-count');
    if (countEl) countEl.textContent = allListings.length.toLocaleString();

    // Pre-fill filters from URL params (from quick-search redirect)
    const params = new URLSearchParams(window.location.search);
    const urlMake = (params.get('make') || '').toLowerCase();
    const urlMaxPrice = params.get('maxPrice') || '';

    if (urlMake) {
      const makeInput = document.getElementById('search-make');
      if (makeInput) makeInput.value = urlMake;
    }
    if (urlMaxPrice) {
      const range = document.getElementById('price-range');
      const label = document.getElementById('price-range-value');
      if (range) range.value = urlMaxPrice;
      if (label) label.textContent = `£${parseInt(urlMaxPrice, 10).toLocaleString()}`;
    }

    bindFilterControls();
    initMobileFilterSheet();
    applyFilters();
  } catch (err) {
    console.error('Load listings error:', err);
    grid.innerHTML = `<div class="loading-message-modern" style="grid-column:1/-1; color:#f87171;">Error: ${escapeHtml(err.message)}</div>`;
  }
}

// ============================================================
// BIND FILTER CONTROLS
// ============================================================
function bindFilterControls() {
  const filterInputs = [
    { id: 'search-make',        evt: 'input' },
    { id: 'price-range',        evt: 'input' },
    { id: 'filter-year',        evt: 'change' },
    { id: 'filter-fuel',        evt: 'change' },
    { id: 'filter-mileage',     evt: 'change' },
    { id: 'filter-transmission',evt: 'change' },
    { id: 'sort-by',            evt: 'change' },
  ];

  filterInputs.forEach(({ id, evt }) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, applyFilters);
  });

  // Live price label update
  const range = document.getElementById('price-range');
  const rangeLabel = document.getElementById('price-range-value');
  if (range && rangeLabel) {
    range.addEventListener('input', () => {
      const val = parseInt(range.value, 10);
      rangeLabel.textContent = val >= 250000 ? '£250k+' : `£${val.toLocaleString()}`;
    });
  }

  // Apply Filters button (also closes mobile sheet)
  document.getElementById('apply-filters')?.addEventListener('click', () => {
    applyFilters();
    if (window.innerWidth <= 760) {
      setTimeout(closeFilterSheet, 200);
    }
  });

  // Reset button (desktop)
  document.getElementById('reset-filters')?.addEventListener('click', () => {
    ['search-make', 'filter-year', 'filter-fuel', 'filter-mileage',
     'filter-transmission', 'sort-by'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const r = document.getElementById('price-range');
    if (r) {
      r.value = r.max;
      if (rangeLabel) rangeLabel.textContent = '£250k+';
    }
    applyFilters();
  });
}

// ============================================================
// APPLY FILTERS + PAGINATION
// ============================================================
function applyFilters() {
  const search        = (document.getElementById('search-make')?.value || '').trim().toLowerCase();
  const maxPrice      = parseInt(document.getElementById('price-range')?.value, 10) || Infinity;
  const year          = document.getElementById('filter-year')?.value || '';
  const fuel          = document.getElementById('filter-fuel')?.value || '';
  const maxMileage    = parseInt(document.getElementById('filter-mileage')?.value, 10) || Infinity;
  const transmission  = document.getElementById('filter-transmission')?.value || '';
  const sortBy        = document.getElementById('sort-by')?.value || 'recommended';

  // Filter
  let filtered = allListings.filter(car => {
    const haystack = `${car.make || ''} ${car.model || ''} ${car.title || ''}`.toLowerCase();
    if (search && !haystack.includes(search)) return false;
    if ((car.price || 0) > maxPrice) return false;

    if (year) {
      const cy = car.year || 0;
      if (year === '2024' && cy < 2024) return false;
      if (year === '2021' && (cy < 2021 || cy > 2023)) return false;
      if (year === '2018' && (cy < 2018 || cy > 2020)) return false;
      if (year === '2015' && (cy < 2015 || cy > 2017)) return false;
    }

    if (fuel && car.fuel !== fuel) return false;
    if ((car.mileage || 0) > maxMileage) return false;
    if (transmission && car.transmission !== transmission) return false;
    return true;
  });

  // Sort
  switch (sortBy) {
    case 'price-asc':  filtered.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
    case 'price-desc': filtered.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
    case 'newest':     filtered.sort((a, b) => timeMs(b.createdAt) - timeMs(a.createdAt)); break;
    case 'mileage':    filtered.sort((a, b) => (a.mileage || 0) - (b.mileage || 0)); break;
  }

  // If filters changed, reset to page 1
  const filterKey = `${search}|${maxPrice}|${year}|${fuel}|${maxMileage}|${transmission}|${sortBy}`;
  if (filterKey !== lastFilterKey) {
    currentPage = 1;
    lastFilterKey = filterKey;
  }

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  renderListings(pageItems);
  renderPagination(totalPages);
  updatePageTitle(search, maxPrice);
  updateFilterCount(search, maxPrice, year, fuel, maxMileage, transmission);
}

function timeMs(ts) {
  if (!ts) return 0;
  try { return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime(); }
  catch { return 0; }
}

// ============================================================
// RENDER LISTINGS
// ============================================================
function renderListings(cars) {
  const grid = document.getElementById('listings-grid');
  if (!grid) return;

  if (cars.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
        <p style="color:var(--muted); font-size:1.15rem; margin:0 0 8px;">No cars match your filters.</p>
        <p style="color:var(--muted); font-size:0.9rem; margin:0 0 16px;">Try adjusting your search criteria.</p>
        <button type="button" class="button button-secondary" onclick="document.getElementById('reset-filters').click()">Show All Cars</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = cars.map(car => buildCarCard(car.id, car)).join('');
}

function buildCarCard(id, car) {
  const imageUrl = car.imageUrl || '';
  const imageStyle = imageUrl
    ? `background-image:url('${escapeAttr(imageUrl)}'); background-size:cover; background-position:center;`
    : `background: linear-gradient(160deg, #1e293b 0%, #334155 100%);`;

  const title = car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Featured Car';
  const price = car.price ? `£${car.price.toLocaleString()}` : '—';

  return `
    <article class="car-card" data-id="${escapeAttr(id)}">
      <div class="car-image" style="${imageStyle}">
        <button type="button" class="favorite-button" aria-label="Save car">♥</button>
        <span class="badge verified">Available</span>
      </div>
      <div class="car-content">
        <div class="car-title">
          <h3>${escapeHtml(title)}</h3>
          <p class="car-price">${price}</p>
        </div>
        <ul class="car-specs">
          <li>${(car.mileage || 0).toLocaleString()} mi</li>
          <li>${car.year || '—'}</li>
          <li>${escapeHtml(car.fuel || '—')}</li>
        </ul>
        <a href="car.html?id=${escapeAttr(id)}" class="button button-secondary-outline">View Details</a>
      </div>
    </article>
  `;
}

// ============================================================
// PAGINATION (sliding window with arrows + ellipsis)
// ============================================================
function renderPagination(totalPages) {
  const nav = document.getElementById('pagination');
  if (!nav) return;

  // No pagination needed for 0 or 1 page
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

  // Click handlers
  nav.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.dataset.page, 10);
      if (Number.isNaN(target) || target < 1 || target > totalPages) return;
      if (target === currentPage) return;
      currentPage = target;
      applyFilters();
      // Smooth scroll to top of listings
      document.getElementById('listings-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/**
 * Build a list of page numbers + '...' for a sliding window.
 *
 * Examples (totalPages=10):
 *   current=1  → [1, 2, 3, 4, 5, '...', 10]
 *   current=3  → [1, 2, 3, 4, 5, '...', 10]      (3 in the middle-ish, 4 next)
 *   current=5  → [1, '...', 4, 5, 6, '...', 10]  (5 dead centre, 4 + 6 flanking)
 *   current=8  → [1, '...', 6, 7, 8, 9, 10]
 *   current=10 → [1, '...', 6, 7, 8, 9, 10]
 */
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

  // Near start: show 2 and 3 too
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
  }

  // Near end: show total-1 and total-2 too
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
// TITLE + FILTER COUNT BADGE
// ============================================================
function updatePageTitle(search, maxPrice) {
  const titleEl = document.getElementById('page-title');
  if (!titleEl) return;
  let title = 'Browse Cars';
  if (search) {
    title = search.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') + ' Cars';
  }
  if (maxPrice < 250000) title += ` Under £${maxPrice.toLocaleString()}`;
  titleEl.textContent = title;
}

function updateFilterCount(search, maxPrice, year, fuel, maxMileage, transmission) {
  const badge = document.getElementById('mobile-filter-count');
  if (!badge) return;
  let count = 0;
  if (search) count++;
  if (maxPrice && maxPrice < 250000) count++;
  if (year) count++;
  if (fuel) count++;
  if (maxMileage && maxMileage < Infinity) count++;
  if (transmission) count++;

  if (count > 0) {
    badge.textContent = count;
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}

// ============================================================
// MOBILE FILTER SHEET (open/close + backdrop)
// ============================================================
function initMobileFilterSheet() {
  const trigger = document.getElementById('mobile-filter-trigger');
  const panel = document.getElementById('filter-panel');
  const closeBtn = document.getElementById('filter-panel-close');
  if (!trigger || !panel) return;

  // Create backdrop once
  let backdrop = document.querySelector('.filter-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'filter-backdrop';
    document.body.appendChild(backdrop);
  }

  function openSheet() {
    panel.classList.add('is-open');
    backdrop.classList.add('is-visible');
    panel.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  // exposed for apply-filters button
  window.closeFilterSheet = function() {
    panel.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    panel.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  trigger.addEventListener('click', openSheet);
  closeBtn?.addEventListener('click', window.closeFilterSheet);
  backdrop.addEventListener('click', window.closeFilterSheet);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) {
      window.closeFilterSheet();
    }
  });

  // Swipe down to close
  let touchStartY = 0;
  panel.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  panel.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientY - touchStartY;
    if (diff > 100 && panel.scrollTop === 0) window.closeFilterSheet();
  }, { passive: true });
}

// ============================================================
// ESCAPE HELPERS
// ============================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escapeAttr(str) { return escapeHtml(str); }

// ============================================================
// BOOT
// ============================================================
loadApprovedListings();
