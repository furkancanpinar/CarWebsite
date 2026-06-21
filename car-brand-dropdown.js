// car-brand-dropdown.js
export function initCarBrandDropdown(selectId) {
  const oldSelect = document.getElementById(selectId);
  if (!oldSelect) return;

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'car-brand-dropdown';
  wrapper.id = selectId + '-wrapper';
  wrapper.style.cssText = 'position: relative; z-index: 9999;';

  // Create button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'car-brand-button';
  button.setAttribute('aria-haspopup', 'listbox');
  button.innerHTML = `
    <span class="car-brand-display">
      <span class="car-brand-display-name">Any make</span>
    </span>
    <svg class="car-brand-chevron" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M7 10l5 5 5-5z"/>
    </svg>
  `;

  // Create dropdown menu
  const menu = document.createElement('div');
  menu.className = 'car-brand-menu';
  menu.setAttribute('role', 'listbox');
  menu.style.cssText = 'z-index: 99999; position: absolute; top: calc(100% + 6px); left: 0; right: 0;';

  const carBrands = [
    'BMW', 'Tesla', 'Audi', 'Porsche', 'Mercedes-Benz',
    'Land Rover', 'Toyota', 'Honda', 'Ford', 'Volkswagen',
    'Bentley', 'Lamborghini', 'Ferrari', 'Rolls-Royce', 'Maserati'
  ];

  // Add "Any make" option
  menu.appendChild(createOption('Any make', '', 'Any make'));

  // Add all brands
  carBrands.forEach(brand => {
    menu.appendChild(createOption(brand, brand, brand));
  });

  // Replace select
  oldSelect.style.display = 'none';
  oldSelect.parentNode.insertBefore(wrapper, oldSelect);
  wrapper.appendChild(button);
  wrapper.appendChild(menu);

  // Toggle dropdown
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const isOpen = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape
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

  function createOption(name, value, displayName) {
    const opt = document.createElement('div');
    opt.className = 'car-brand-option';
    opt.setAttribute('role', 'option');
    opt.dataset.value = value;
    opt.innerHTML = `<span>${displayName}</span>`;
    opt.addEventListener('click', () => selectBrand(value, displayName));
    return opt;
  }
}
