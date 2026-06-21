// quick-search.js
import { initCarBrandDropdown } from './car-brand-dropdown.js';

document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('home-quick-search-btn');
  if (!searchBtn) return;

  // Initialize custom dropdown with logos
  initCarBrandDropdown('home-search-make');

  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    performQuickSearch();
  });
});

function performQuickSearch() {
  const make = document.getElementById('home-search-make')?.value || '';
  const price = document.getElementById('home-search-price')?.value || '';

  const params = new URLSearchParams();
  if (make) params.set('make', make);
  if (price) params.set('maxPrice', price);

  const url = 'browse.html' + (params.toString() ? '?' + params.toString() : '');
  window.location.href = url;
}
