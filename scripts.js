(function(){
  const body = document.body;

  // ✅ Theme handling moved to theme.js (loads from localStorage)

  // Mobile header collapse/expand
  (function(){
    const header = document.querySelector('.site-header');
    if(!header) return;
    function setHeaderCollapsed(collapsed){
      header.classList.toggle('site-collapsed', collapsed);
    }
    function resetHeaderState(){ setHeaderCollapsed(false); }
    resetHeaderState();
    window.addEventListener('resize', resetHeaderState);
  })();

  // Toggle switches and favorite buttons
  (function(){
    document.addEventListener('click', (e)=>{
      const ts = e.target.closest('.toggle-switch');
      if(ts){
        const pressed = ts.getAttribute('aria-pressed') === 'true';
        ts.setAttribute('aria-pressed', (!pressed).toString());
        ts.classList.toggle('on', !pressed);
      }
      const fav = e.target.closest('.favorite-button');
      if(fav){
        fav.classList.toggle('saved');
        const saved = fav.classList.contains('saved');
        fav.setAttribute('aria-pressed', saved.toString());
        fav.animate([{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}], {duration:180});
      }
    }, {passive:true});

    function enlargeHitTargets(){
      const pad = window.innerWidth <= 760 ? '10px' : '6px';
      document.querySelectorAll('.icon-button').forEach(b=> b.style.padding = pad);
    }
    enlargeHitTargets();
    window.addEventListener('resize', enlargeHitTargets);
  })();

  // Modal handling
  (function(){
    let _savedScroll = 0;
    function openModal(id){
      const m = document.getElementById(id);
      if(!m) return;
      _savedScroll = window.scrollY || document.documentElement.scrollTop;
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      m.setAttribute('aria-hidden','false');
      m.classList.add('open');
      const focusable = m.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      (focusable || m.querySelector('.modal-panel')).focus();
    }
    function closeModal(m){
      if(!m) return;
      m.setAttribute('aria-hidden','true');
      m.classList.remove('open');
      document.body.classList.remove('modal-open');
      document.documentElement.style.overflow = '';
      window.scrollTo(0, _savedScroll || 0);
    }

    function initModalHandlers(){
      document.addEventListener('click', (e)=>{
        const btn = e.target.closest('[data-modal-target]');
        if(btn){
          const id = btn.getAttribute('data-modal-target');
          if(!id) return;
          document.querySelectorAll('.modal.open, .modal[aria-hidden="false"]').forEach(m=>{
            if(m.id !== id) closeModal(m);
          });
          openModal(id);
          return;
        }
        const close = e.target.closest('.modal .modal-close');
        if(close){
          closeModal(close.closest('.modal'));
        }
      }, {passive:true});

      document.querySelectorAll('.modal').forEach(m=>{
        m.addEventListener('click', (e)=>{
          if(e.target === m) closeModal(m);
        });
      });

      document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape'){
          document.querySelectorAll('.modal.open').forEach(m=> closeModal(m));
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initModalHandlers);
    } else {
      initModalHandlers();
    }
  })();

  // Mobile hamburger menu
  (function(){
    function initMobileMenu(){
      const header = document.querySelector('.site-header');
      const hamburger = document.querySelector('.hamburger-button');
      const mobileMenu = document.querySelector('.mobile-menu');
      if(!hamburger || !header || !mobileMenu) {
        console.error('Mobile menu elements missing!');
        return;
      }

      console.log('✅ Mobile menu initialized');

      function setMenuOpen(open){
        header.classList.toggle('menu-open', open);
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      }

      hamburger.addEventListener('click', (e)=>{
        e.stopPropagation();
        console.log('🍔 Burger clicked!');
        const isOpen = header.classList.contains('menu-open');
        setMenuOpen(!isOpen);
      });

      document.addEventListener('click', (e) => {
        const isOpen = header.classList.contains('menu-open');
        if (isOpen && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
          setMenuOpen(false);
        }
      });

      mobileMenu.addEventListener('click', (e)=>{
        if(e.target.closest('a')) setMenuOpen(false);
      });

      document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape') setMenuOpen(false);
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
      initMobileMenu();
    }
  })();

  // Sold page filters
  (function(){
    const search = document.getElementById('sold-search');
    const year = document.getElementById('sold-filter-year');
    const grid = document.getElementById('sold-grid');
    if(!grid) return;

    function applyFilters(){
      const q = search ? search.value.trim().toLowerCase() : '';
      const y = year ? year.value : '';
      grid.querySelectorAll('.sold-item').forEach(item=>{
        const make = (item.dataset.make||'').toLowerCase();
        const model = (item.dataset.model||'').toLowerCase();
        const itemYear = (item.dataset.year||'');
        const matchesQ = !q || make.includes(q) || model.includes(q) || `${make} ${model}`.includes(q);
        const matchesY = !y || itemYear === y;
        item.style.display = (matchesQ && matchesY) ? '' : 'none';
      });
    }

    if(search) search.addEventListener('input', applyFilters);
    if(year) year.addEventListener('change', applyFilters);
  })();

})();

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */
(function adminModule() {
  if (!document.getElementById('users-tbody')) return;

  const userSearch = document.getElementById('user-search');
  const userRoleFilter = document.getElementById('user-filter-role');
  const userRows = document.querySelectorAll('#users-tbody tr');

  function filterUsers() {
    if (!userSearch) return;
    const query = userSearch.value.toLowerCase();
    const role = userRoleFilter.value;
    userRows.forEach((row) => {
      const name = (row.dataset.name || '').toLowerCase();
      const email = (row.dataset.email || '').toLowerCase();
      const rowRole = row.dataset.role;
      const matchesQuery = !query || name.includes(query) || email.includes(query);
      const matchesRole = !role || rowRole === role;
      row.style.display = matchesQuery && matchesRole ? '' : 'none';
    });
  }

  if (userSearch) userSearch.addEventListener('input', filterUsers);
  if (userRoleFilter) userRoleFilter.addEventListener('change', filterUsers);

  const listingFilter = document.getElementById('listing-filter-status');
  const listingRows = document.querySelectorAll('#listings-tbody tr');
  if (listingFilter) {
    listingFilter.addEventListener('change', () => {
      const status = listingFilter.value;
      listingRows.forEach((row) => {
        row.style.display = !status || row.dataset.status === status ? '' : 'none';
      });
    });
  }

  const actionMessages = {
    'suspend-user': "Suspend this user? They won't be able to list or buy cars.",
    'reactivate-user': "Reactivate this user's account?",
    'delete-user': 'Delete this user permanently? This cannot be undone.',
    'approve-listing': 'Approve this listing? It will go live on the marketplace.',
    'reject-listing': 'Reject this listing? The seller will be notified.',
    'delete-listing': 'Delete this listing permanently?',
    'make-admin': 'Grant this user admin privileges?',
    'remove-admin': 'Remove admin privileges from this user?',
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'view-user' || action === 'view-listing') {
      const row = btn.closest('tr');
      const titleEl = row?.querySelector('.admin-user-name, .admin-listing-title');
      if (titleEl) alert('Viewing details for: ' + titleEl.textContent);
      return;
    }

    if (action === 'cancel') {
      closeConfirmModal();
      return;
    }

    const message = actionMessages[action] || 'Are you sure?';
    showConfirmModal(message, () => handleAdminAction(action, btn));
  });

  function handleAdminAction(action, btn) {
    const row = btn.closest('tr');
    if (!row) return;

    if (action === 'suspend-user' || action === 'reactivate-user') {
      const statusCell = row.querySelector('.admin-badge.active, .admin-badge.suspended');
      if (statusCell) {
        if (action === 'suspend-user') {
          statusCell.className = 'admin-badge suspended';
          statusCell.textContent = 'Suspended';
        } else {
          statusCell.className = 'admin-badge active';
          statusCell.textContent = 'Active';
        }
      }
      const actionsCell = row.querySelector('.admin-actions');
      if (actionsCell) {
        const isSuspended = action === 'suspend-user';
        actionsCell.innerHTML = `
          <button class="admin-action-btn" data-action="view-user">View</button>
          <button class="admin-action-btn" data-action="${isSuspended ? 'reactivate-user' : 'suspend-user'}">${isSuspended ? 'Reactivate' : 'Suspend'}</button>
          <button class="admin-action-btn danger" data-action="delete-user">Delete</button>
        `;
      }
    } else if (action === 'delete-user' || action === 'delete-listing') {
      row.style.transition = 'opacity 0.3s, transform 0.3s';
      row.style.opacity = '0';
      row.style.transform = 'translateX(-12px)';
      setTimeout(() => row.remove(), 300);
    } else if (action === 'approve-listing' || action === 'reject-listing') {
      const statusCell = row.querySelector('.admin-badge');
      if (statusCell) {
        if (action === 'approve-listing') {
          statusCell.className = 'admin-badge approved';
          statusCell.textContent = 'Approved';
          row.dataset.status = 'approved';
        } else {
          statusCell.className = 'admin-badge rejected';
          statusCell.textContent = 'Rejected';
          row.dataset.status = 'rejected';
        }
      }
      const actionsCell = row.querySelector('.admin-actions');
      if (actionsCell) {
        actionsCell.innerHTML = `
          <button class="admin-action-btn" data-action="view-listing">View</button>
          <button class="admin-action-btn danger" data-action="delete-listing">Delete</button>
        `;
      }
    } else if (action === 'make-admin' || action === 'remove-admin') {
      const roleCell = row.querySelector('.admin-badge.admin, .admin-badge.seller, .admin-badge.buyer');
      const actionsCell = row.querySelector('.admin-actions');
      if (action === 'make-admin') {
        if (roleCell) {
          roleCell.className = 'admin-badge admin';
          roleCell.textContent = 'Admin';
        }
        row.dataset.role = 'Admin';
        if (actionsCell) {
          actionsCell.innerHTML = `
            <button class="admin-action-btn" data-action="view-user">View</button>
            <button class="admin-action-btn" data-action="remove-admin">Remove Admin</button>
            <button class="admin-action-btn danger" data-action="delete-user">Delete</button>
          `;
        }
      } else {
        if (roleCell) {
          roleCell.className = 'admin-badge buyer';
          roleCell.textContent = 'Buyer';
        }
        row.dataset.role = 'Buyer';
        if (actionsCell) {
          actionsCell.innerHTML = `
            <button class="admin-action-btn" data-action="view-user">View</button>
            <button class="admin-action-btn" data-action="make-admin">Make Admin</button>
            <button class="admin-action-btn danger" data-action="delete-user">Delete</button>
          `;
        }
      }
    }
  }

  function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const messageEl = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    if (!modal || !messageEl || !yesBtn) return;

    messageEl.textContent = message;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');

    const newYes = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);
    newYes.addEventListener('click', () => {
      onConfirm();
      closeConfirmModal();
    });
  }

  function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
  }

  const confirmModal = document.getElementById('confirm-modal');
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeConfirmModal();
    });
  }

  document.querySelectorAll('#confirm-modal .modal-close').forEach((btn) => {
    btn.addEventListener('click', closeConfirmModal);
  });
})();
