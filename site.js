// site.js - common UI behaviors for AutoWise
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar toggle
  const toggle = document.getElementById('toggleSidebar');
  const sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    const toggleIcon = document.getElementById('toggle-icon');
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      if (sidebar.classList.contains('collapsed')) {
        sidebar.style.width = '60px';
        if (toggleIcon) toggleIcon.src = 'editables/toggle-expand.svg';
      } else {
        sidebar.style.width = '';
        if (toggleIcon) toggleIcon.src = 'editables/toggle-collapse.svg';
      }
    });
  }

  // User menu dropdown (click toggles for touch devices)
  const userIcon = document.getElementById('userIcon');
  const dropdown = document.getElementById('dropdownMenu');
  if (userIcon && dropdown) {
    userIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => { dropdown.style.display = 'none'; });
  }

  // Hero slider simple rotator
  const sliderImage = document.getElementById('sliderImage');
  if (sliderImage) {
    const imgs = [
      'Editables/car1.jpg',
      'Editables/car2.jpg',
      'Editables/car3.jpg'
    ];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % imgs.length;
      sliderImage.src = imgs[idx];
    }, 4000);
  }

  // Close search results on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const results = document.getElementById('searchResults');
      if (results) results.classList.remove('active');
    }
  });

  // Simple smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length > 1) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
