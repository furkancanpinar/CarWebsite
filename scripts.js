(function(){
  // Centralized scripts: theme toggle, logo swap, mobile header collapse, small UI helpers
  const body = document.body;

  // Ensure default theme
  if (!body.dataset.theme) body.dataset.theme = 'dark';

  const brandImg = document.querySelector('.brand-image');
  const themeToggle = document.getElementById('theme-toggle');

  function applyLogo(){
    if (!brandImg) return;
    const light = brandImg.getAttribute('data-light');
    const dark = brandImg.getAttribute('data-dark');
    brandImg.src = body.dataset.theme === 'light' ? (light || brandImg.src) : (dark || brandImg.src);
  }

  function setTheme(next){
    body.dataset.theme = next;
    if(themeToggle) themeToggle.setAttribute('aria-label', next === 'light' ? 'Toggle dark mode' : 'Toggle light mode');
    applyLogo();
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', ()=>{
      const next = body.dataset.theme === 'light' ? 'dark' : 'light';
      setTheme(next);
    });
  }

  // Initial apply
  applyLogo();

  // Mobile header collapse/expand on scroll and toggle
  (function(){
    const header = document.querySelector('.site-header');
    if(!header) return;
    // Keep header compact on small screens but remove scroll-driven collapsing
    function setHeaderCollapsed(collapsed){
      if(collapsed) {
        header.classList.add('site-collapsed');
      } else {
        header.classList.remove('site-collapsed');
      }
      // no header toggle control — header remains fixed/compact on small screens
    }

    function resetHeaderState(){
      // Ensure header stays expanded and fixed across all viewports
      setHeaderCollapsed(false);
    }

    // header state is set by viewport size only; no manual toggle control

    resetHeaderState();
    window.addEventListener('resize', resetHeaderState);
  })();

  // Small UI helpers: toggle-switch and favorite buttons
  (function(){
    // delegate toggle-switch clicks
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
        // visual feedback for touch devices
        fav.animate([{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}], {duration:180});
      }
    }, {passive:true});

    // Increase hit area for icon-buttons on small screens
    function enlargeHitTargets(){
      if(window.innerWidth <= 760){
        document.querySelectorAll('.icon-button').forEach(b=> b.style.padding = '10px');
      } else {
        document.querySelectorAll('.icon-button').forEach(b=> b.style.padding = '6px');
      }
    }
    enlargeHitTargets();
    window.addEventListener('resize', enlargeHitTargets);
  })();

  // Modal handling (Opening Hours / Get In Touch)
  (function(){
    // modal open/close with scroll lock and focus handling
    let _savedScroll = 0;
    function openModal(id){
      const m = document.getElementById(id);
      if(!m) return;
      // save scroll position
      _savedScroll = window.scrollY || document.documentElement.scrollTop;
      // lock scrolling by hiding overflow on the root element and preserve scrollbar width
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      // hide overflow on root; CSS `scrollbar-gutter: stable` reserves space
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      m.setAttribute('aria-hidden','false');
      m.classList.add('open');
      // focus first focusable element or panel
      const focusable = m.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      (focusable || m.querySelector('.modal-panel')).focus();
    }
    function closeModal(m){
      if(!m) return;
      m.setAttribute('aria-hidden','true');
      m.classList.remove('open');
      // restore scroll and remove locks
      document.body.classList.remove('modal-open');
      document.documentElement.style.overflow = '';
      window.scrollTo(0, _savedScroll || 0);
    }

    function initModalHandlers(){
      // Delegated click handler for any element with data-modal-target
      document.addEventListener('click', (e)=>{
        const btn = e.target.closest('[data-modal-target]');
        if(btn){
          const id = btn.getAttribute('data-modal-target');
          if(!id) return;
          // Close any open modals first
          document.querySelectorAll('.modal.open, .modal[aria-hidden="false"]').forEach(m=>{
            if(m.id !== id) closeModal(m);
          });
          openModal(id);
          return;
        }

        // modal close buttons
        const close = e.target.closest('.modal .modal-close');
        if(close){
          const modal = close.closest('.modal');
          closeModal(modal);
          return;
        }

        // backdrop click (handled below per-modal)
      }, {passive:true});

      // Click on modal backdrop closes (ensure event target is the modal element itself)
      document.querySelectorAll('.modal').forEach(m=>{
        m.addEventListener('click', (e)=>{
          if(e.target === m) closeModal(m);
        });
      });

      // Escape closes all modals
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

  // Mobile hamburger menu toggle and mobile theme toggle
// Mobile hamburger menu toggle and mobile theme toggle
  (function(){
    function initMobileMenu(){
      const body = document.body; // Ensure body is accessible if not already
      const header = document.querySelector('.site-header');
      const hamburger = document.querySelector('.hamburger-button');
      const mobileMenu = document.querySelector('.mobile-menu');
      const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
      if(!hamburger || !header || !mobileMenu) return;

      function setMenuOpen(open){
        header.classList.toggle('menu-open', open);
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      }

      hamburger.addEventListener('click', (e)=>{
        e.stopPropagation(); // Prevents immediate closing from the document listener below
        const isOpen = header.classList.contains('menu-open');
        setMenuOpen(!isOpen);
      });

      // --- FIX: Close menu when clicking outside ---
      document.addEventListener('click', (e) => {
        const isOpen = header.classList.contains('menu-open');
        // If the menu is open, and the click is NOT on the menu or the hamburger button
        if (isOpen && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
          setMenuOpen(false);
        }
      });
      // ---------------------------------------------

      // Close mobile menu when clicking a nav link
      mobileMenu.addEventListener('click', (e)=>{
        const link = e.target.closest('a');
        if(link) setMenuOpen(false);
      });

      // Close on Escape
      document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape') setMenuOpen(false);
      });

      // mobile theme button toggles theme directly and close menu afterwards
      if(mobileThemeToggle){
        mobileThemeToggle.addEventListener('click', ()=>{
          const next = body.dataset.theme === 'light' ? 'dark' : 'light';
          setTheme(next); // Assumes setTheme is available in the outer scope
          setMenuOpen(false);
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
      initMobileMenu();
    }
  })();

  // Previously Sold page: simple search + filter
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
  // Only run on admin page
  if (!document.getElementById('users-tbody')) return;

  // ---- User search & role filter ----
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

  // ---- Listing status filter ----
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

  // ---- Action confirmations ----
  const actionMessages = {
    'suspend-user': "Suspend this user? They won't be able to list or buy cars.",
    'reactivate-user': "Reactivate this user's account?",
    'delete-user': 'Delete this user permanently? This cannot be undone.',
    'approve-listing': 'Approve this listing? It will go live on the marketplace.',
    'reject-listing': 'Reject this listing? The seller will be notified.',
    'delete-listing': 'Delete this listing permanently?',
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'view-user' || action === 'view-listing') {
      const row = btn.closest('tr');
      const titleEl = row?.querySelector('.admin-user-name, .admin-listing-title');
      if (titleEl) {
        alert('Viewing details for: ' + titleEl.textContent);
      }
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
      // Update the available action buttons
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
    }
  }

  // ---- Confirm modal helpers ----
  function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const messageEl = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    if (!modal || !messageEl || !yesBtn) return;

    messageEl.textContent = message;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');

    // Replace the button to drop any old listeners
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

  // Close on backdrop click
  const confirmModal = document.getElementById('confirm-modal');
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeConfirmModal();
    });
  }

  // Close on X button
  document.querySelectorAll('#confirm-modal .modal-close').forEach((btn) => {
    btn.addEventListener('click', closeConfirmModal);
  });
})();

// admin-check.js
import { auth, db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function checkIfAdmin(user) {
  const snap = await getDoc(doc(db, "admins", user.uid));
  return snap.exists();
}

// Attach to BOTH the desktop nav link and the mobile nav link
function bindAdminLink(link) {
  if (!link) return;
  link.addEventListener("click", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      alert("Please log in first.");
      return;
    }

    const isAdmin = await checkIfAdmin(user);
    if (isAdmin) {
      window.location.href = "admin.html";
    } else {
      alert("You are not an admin.");
    }
  });
}

bindAdminLink(document.querySelector(".admin-link"));         // desktop nav
bindAdminLink(document.getElementById("admin-link"));         // mobile nav


// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 👇 Replace this with YOUR Firebase config (from Project Settings → Your apps)
const firebaseConfig = {
  apiKey: "AIzaSyCTU-OyTtNPSe99xtl681yAKfPNayHyNg0",
  authDomain: "autexlogs.firebaseapp.com",
  projectId: "autexlogs",
  storageBucket: "autexlogs.firebasestorage.app",
  messagingSenderId: "51671319885",
  appId: "1:51671319885:web:b12595c4b18902547c6304",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

  