// admin-sold.js — Admin Previously Sold section (view, relist, delete)
import {
  auth, db,
  doc, getDoc, setDoc, deleteDoc, updateDoc,
  collection, getDocs, serverTimestamp
} from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── State ───
let allSold = [];
const PAGE_SIZE = 5;
let currentPage = 1;
let lastFilterKey = '';

// ─── Boot ───
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  if (!adminSnap.exists()) return;
  bindFilters();
  bindSectionEvents();
  await loadData();
});

function bindFilters() {
  const search = document.getElementById("sold-search-admin");
  if (search) {
    search.addEventListener("input", () => {
      currentPage = 1;
      renderPage();
    });
  }
}

function bindSectionEvents() {
  const section = document.getElementById("sold-section-admin");
  if (!section) return;

  // Pagination
  section.addEventListener("click", async (e) => {
    const pageBtn = e.target.closest('#sold-pagination-admin [data-nav]');
    if (pageBtn && !pageBtn.disabled) {
      handlePagination(pageBtn);
      return;
    }

    // Action buttons
    const actionBtn = e.target.closest("[data-action]");
    if (actionBtn && section.contains(actionBtn)) {
      await handleAction(actionBtn);
    }
  });
}

function handlePagination(btn) {
  const action = btn.dataset.nav;
  if (action === "prev") currentPage--;
  else if (action === "next") currentPage++;
  else if (action === "num") currentPage = parseInt(btn.dataset.page, 10);
  else return;
  renderPage();
}

// ─── Actions ───
async function handleAction(btn) {
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!id) return;

  const messages = {
    "relist-sold": "Re-list this car? It will be moved back to active listings.",
    "delete-sold": "Permanently delete this sold car from the archive?"
  };
  if (messages[action] && !confirm(messages[action])) return;

  try {
    switch (action) {
      case "relist-sold":
        await relistCar(id);
        break;
      case "delete-sold":
        await deleteDoc(doc(db, "sold", id));
        break;
    }
    await loadData();
  } catch (err) {
    console.error(err);
    alert("Failed: " + err.message);
  }
}

async function relistCar(soldId) {
  try {
    // Get sold data
    const soldSnap = await getDoc(doc(db, "sold", soldId));
    if (!soldSnap.exists()) throw new Error("Sold car not found");
    const data = soldSnap.data();
    console.log('[relist] Sold data keys:', Object.keys(data));

    // Strip sold-specific fields
    const cleanData = {
      title: data.title || '',
      make: data.make || '',
      model: data.model || '',
      year: data.year || 0,
      price: data.price || 0,
      mileage: data.mileage || 0,
      fuel: data.fuel || '',
      transmission: data.transmission || '',
      description: data.description || '',
      imageUrl: data.imageUrl || (data.images && data.images[0]) || '',
      status: 'approved',
      sellerId: data.sellerId || '',
      sellerName: data.sellerName || '',
      createdAt: serverTimestamp(),  // Use serverTimestamp for new doc
      relistedAt: serverTimestamp(),
      relistedFrom: soldId
    };

    console.log('[relist] Clean data:', cleanData);

    // Create new listing
    const newListingRef = doc(collection(db, "listings"));
    await setDoc(newListingRef, cleanData);
    console.log('[relist] Listing created:', newListingRef.id);

    // Delete from sold
    await deleteDoc(doc(db, "sold", soldId));
    console.log('[relist] Done!');
  } catch (err) {
    console.error('[relist] Failed at step:', err.code, err.message);
    throw err;
  }
}


// ─── Load ───
async function loadData() {
  const tbody = document.getElementById("sold-tbody-admin");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">Loading sold cars...</td></tr>`;

  try {
    const snap = await getDocs(collection(db, "sold"));
    allSold = [];
    snap.forEach(d => allSold.push({ id: d.id, ...d.data() }));

    // Sort newest sold first
    allSold.sort((a, b) => timeMs(b.soldAt) - timeMs(a.soldAt));

    currentPage = 1;
    renderPage();
  } catch (err) {
    console.error("Load sold error:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#f87171;">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

// ─── Render ───
function renderPage() {
  const tbody = document.getElementById("sold-tbody-admin");
  const nav = document.getElementById("sold-pagination-admin");
  if (!tbody || !nav) return;

  const search = (document.getElementById("sold-search-admin")?.value || "").toLowerCase().trim();
  const filtered = allSold.filter(car => {
    const haystack = `${car.title || ''} ${car.make || ''} ${car.model || ''}`.toLowerCase();
    return !search || haystack.includes(search);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = pageItems.length === 0
    ? `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">No sold cars match your search.</td></tr>`
    : pageItems.map(car => buildRow(car.id, car)).join("");

  renderPagination(nav, totalPages);
}

function buildRow(id, car) {
  const title = car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Untitled';
  const imageUrl = (car.images && car.images[0]) || car.imageUrl || '';
  const imageStyle = imageUrl
    ? `background-image:url('${escapeAttr(imageUrl)}'); background-size:cover; background-position:center;`
    : "";

  return `
    <tr data-id="${escapeAttr(id)}">
      <td data-label="Car">
        <div class="admin-listing-cell">
          <div class="admin-listing-thumb" style="${imageStyle}"></div>
          <div>
            <p class="admin-listing-title">${escapeHtml(title)}</p>
            <p class="admin-listing-meta">${car.year || '—'} • ${(car.mileage || 0).toLocaleString()} mi</p>
          </div>
        </div>
      </td>
      <td data-label="Sold Price">£${(car.price || 0).toLocaleString()}</td>
      <td data-label="Sold On">${formatDate(car.soldAt)}</td>
      <td data-label="Photos">${(car.images && car.images.length) || 1}</td>
      <td data-label="Status"><span class="admin-badge sold">Sold</span></td>
      <td data-label="Actions">
        <div class="admin-actions">
          <button type="button" class="admin-action-btn admin-action-btn-success" data-action="relist-sold" data-id="${escapeAttr(id)}">↻ Re-list</button>
          <button type="button" class="admin-action-btn admin-action-btn-danger" data-action="delete-sold" data-id="${escapeAttr(id)}">Delete</button>
        </div>
      </td>
    </tr>`;
}

// ─── Pagination ───
function renderPagination(nav, totalPages) {
  if (totalPages <= 1) { nav.innerHTML = ""; return; }

  const pages = buildPageList(currentPage, totalPages);
  const html = [];

  html.push(`<button type="button" class="page-button page-arrow" data-nav="prev" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous page">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
  </button>`);

  pages.forEach(p => {
    if (p === "...") {
      html.push('<span class="page-ellipsis" aria-hidden="true">…</span>');
    } else {
      const active = p === currentPage;
      html.push(`<button type="button" class="page-button ${active ? "active" : ""}" data-nav="num" data-page="${p}" ${active ? 'aria-current="page"' : ""}>${p}</button>`);
    }
  });

  html.push(`<button type="button" class="page-button page-arrow" data-nav="next" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next page">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
  </button>`);

  nav.innerHTML = html.join("");
}

function buildPageList(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current]);
  if (current - 1 >= 1) set.add(current - 1);
  if (current + 1 <= total) set.add(current + 1);
  if (current <= 3) { set.add(2); set.add(3); }
  if (current >= total - 2) { set.add(total - 1); set.add(total - 2); }
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("...");
    out.push(sorted[i]);
  }
  return out;
}

// ─── Helpers ───
function timeMs(ts) {
  if (!ts) return 0;
  try { return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime(); }
  catch { return 0; }
}

function formatDate(ts) {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s) { return escapeHtml(s); }
