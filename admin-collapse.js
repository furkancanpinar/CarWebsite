// admin-collapse.js — Collapsible admin sections
function bindCollapsibleSections() {
  const headers = document.querySelectorAll('.admin-collapse-header');
  if (!headers.length) return;

  headers.forEach(header => {
    const id = header.dataset.collapse;
    const body = document.getElementById(`collapse-${id}`);
    if (!body) return;

    function toggle() {
      const isOpen = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', String(!isOpen));
      body.classList.toggle('is-open', !isOpen);
    }

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    // Default: open on desktop, closed on mobile
    if (window.innerWidth >= 1024) {
      header.setAttribute('aria-expanded', 'true');
      body.classList.add('is-open');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindCollapsibleSections);
} else {
  bindCollapsibleSections();
}
