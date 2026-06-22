// car-brand-dropdown.js — Custom dropdown with car brand logos
import { getCarLogo } from './car-logos.js';

const CAR_BRANDS = [
  'BMW', 'Tesla', 'Audi', 'Porsche', 'Mercedes-Benz',
  'Land Rover', 'Toyota', 'Honda', 'Ford', 'Volkswagen',
  'Bentley', 'Lamborghini', 'Ferrari', 'Rolls-Royce', 'Maserati',
  'McLaren', 'Bugatti', 'Aston Martin', 'Jaguar', 'Volvo',
  'Mazda', 'Nissan', 'Hyundai', 'Kia', 'Subaru', 'Lexus'
];

export function initCarBrandDropdown(selectId) {
  const oldSelect = document.getElementById(selectId);
  if (!oldSelect) return;

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'car-brand-dropdown';

  // Create button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'car-brand-button';
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `
    <span class="car-brand-display">
      <span class="car-brand-display-name">Any make</span>
    </span>
    <svg class="car-brand-chevron" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M7 10l5 5 5-5z"/>
    </svg>
  `;

  // Create dropdown menu
  const menu = document.createElement('div');
  menu.className = 'car-brand-menu';
  menu.setAttribute('role', 'listbox');

  // Add "Any make" option
  menu.appendChild(createOption('Any make', '', null));

  CAR_BRANDS.forEach(brand => {
    menu.appendChild(createOption(brand, brand, getCarLogo(brand)));
  });

  // Insert into DOM
  oldSelect.style.display = 'none';
  oldSelect.parentNode.insertBefore(wrapper, oldSelect);
  wrapper.appendChild(button);
  wrapper.appendChild(menu);

  // Toggle
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
  });

  // Close handlers
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  function selectBrand(value, displayName) {
    oldSelect.value = value;
    oldSelect.dispatchEvent(new Event('change', { bubbles: true }));
    button.querySelector('.car-brand-display-name').textContent = displayName;
    menu.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
  }

  function createOption(name, value, logoUrl) {
    const opt = document.createElement('div');
    opt.className = 'car-brand-option';
    opt.setAttribute('role', 'option');
    opt.dataset.value = value;

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="" class="car-brand-option-logo">`
      : `<span class="car-brand-option-emoji" aria-hidden="true">🚗</span>`;

    opt.innerHTML = `${logoHtml}<span>${name}</span>`;
    opt.addEventListener('click', () => selectBrand(value, name));
    return opt;
  }
}
