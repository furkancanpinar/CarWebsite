// quick-search.js — Quick search bar on home page
import { initCarBrandDropdown } from './car-brand-dropdown.js';

function init() {
  const searchBtn = document.getElementById('home-quick-search-btn');
  if (!searchBtn) return;

  // Initialize custom dropdown with logos
  initCarBrandDropdown('home-search-make');

  searchBtn.addEventListener('click', performQuickSearch);

  // Also allow Enter key
  const selects = ['home-search-make', 'home-search-price'];
  selects.forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performQuickSearch();
      }
    });
  });
}

function performQuickSearch() {
  const make = document.getElementById('home-search-make')?.value || '';
  const price = document.getElementById('home-search-price')?.value || '';

  const params = new URLSearchParams();
  if (make) params.set('make', make);
  if (price) params.set('maxPrice', price);

  window.location.href = 'browse.html' + (params.toString() ? '?' + params : '');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
