// admin-listings.js — Listing approvals with pagination
import {
  auth, db, doc, getDoc, setDoc, deleteDoc, updateDoc,
  collection, getDocs, serverTimestamp
} from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Expose refresh so admin-add-car.js can call it
window.__refreshListings = async () => {
  if (typeof loadData === "function") await loadData();
};


// ─── Module-scoped config & state ───
const SECTION_ID = "listings-section";
const NAV_ID = "listings-pagination";
const BODY_ID = "listings-tbody";
const PAGE_SIZE = 5;

const state = {
  all: [],
  page: 1,
  status: ""
};

// ─── Boot ───
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  if (!adminSnap.exists()) return;
  bindFilters();
  bindSectionEvents();
  await loadData();
});

// ─── Filters ───
function bindFilters() {
  const filter = document.getElementById("listing-filter-status");
  if (!filter) return;
  filter.addEventListener("change", (e) => {
    state.status = e.target.value;
    state.page = 1;
    renderPage();
  });
}

// ─── Section-scoped events (THE KEY FIX) ───
function bindSectionEvents() {
  const section = document.getElementById(SECTION_ID);
  if (!section) return;

  section.addEventListener("click", async (e) => {
    // Pagination
    const pageBtn = e.target.closest(`#${NAV_ID} [data-nav]`);
    if (pageBtn && !pageBtn.disabled) {
      handlePagination(pageBtn);
      return;
    }

    // Action button
    const actionBtn = e.target.closest("[data-action]");
    if (actionBtn && section.contains(actionBtn)) {
      await handleAction(actionBtn);
    }
  });
}

function handlePagination(btn) {
  const action = btn.dataset.nav;
  if (action === "prev") state.page--;
  else if (action === "next") state.page++;
  else if (action === "num") state.page = parseInt(btn.dataset.page, 10);
  else return;

  renderPage();
  document.getElementById(BODY_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleAction(btn) {
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!id) return;

  const messages = {
    "approve-listing": "Approve this listing?",
    "reject-listing": "Reject this listing?",
    "mark-as-sold": "Mark this car as SOLD?",
    "restore-listing": "Restore this listing?",
    "delete-listing": "Delete this listing permanently?"
  };
  if (messages[action] && !confirm(messages[action])) return;

  try {
    switch (action) {
      case "approve-listing":
        await updateDoc(doc(db, "listings", id), { status: "approved" });
        break;
      case "reject-listing":
        await updateDoc(doc(db, "listings", id), { status: "rejected" });
        break;
      case "restore-listing":
        await updateDoc(doc(db, "listings", id), { status: "approved" });
        break;
      case "delete-listing":
        await deleteDoc(doc(db, "listings", id));
        break;
      case "mark-as-sold":
        await markAsSold(id);
        break;
    }
    await loadData();
  } catch (err) {
    console.error(err);
    alert("Failed: " + err.message);
  }
}

async function markAsSold(listingId) {
  const snap = await getDoc(doc(db, "listings", listingId));
  if (!snap.exists()) throw new Error("Listing not found");
  const data = snap.data();
  const soldId = `sold_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(doc(db, "sold", soldId), {
    ...data,
    originalListingId: listingId,
    status: "sold",
    soldAt: serverTimestamp()
  });
  await deleteDoc(doc(db, "listings", listingId));
}

// ─── Load ───
async function loadData() {
  const tbody = document.getElementById(BODY_ID);
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">Loading listings...</td></tr>`;

  try {
    const snap = await getDocs(collection(db, "listings"));
    state.all = [];
    snap.forEach(d => state.all.push({ id: d.id, ...d.data() }));
    state.page = 1;
    renderPage();
  } catch (err) {
    console.error("Load listings error:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#f87171;">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

// ─── Render ───
function renderPage() {
  const tbody = document.getElementById(BODY_ID);
  const nav = document.getElementById(NAV_ID);
  if (!tbody || !nav) return;

  const filtered = state.status
    ? state.all.filter(l => (l.status || "pending") === state.status)
    : state.all;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const start = (state.page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = pageItems.length === 0
    ? `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">No listings.</td></tr>`
    : pageItems.map(l => buildRow(l.id, l)).join("");

  renderPagination(nav, totalPages);
}

function buildRow(id, listing) {
  const status = listing.status || "pending";
  const imageUrl = listing.imageUrl || "";
  const imageStyle = imageUrl
    ? `background-image:url('${escapeAttr(imageUrl)}'); background-size:cover; background-position:center;`
    : "";

  let actions = "";
  if (status === "pending") {
    actions = `
      <button type="button" class="admin-action-btn admin-action-btn-success" data-action="approve-listing" data-id="${escapeAttr(id)}">Approve</button>
      <button type="button" class="admin-action-btn admin-action-btn-danger"  data-action="reject-listing"  data-id="${escapeAttr(id)}">Reject</button>`;
  } else if (status === "approved") {
    actions = `
      <button type="button" class="admin-action-btn admin-action-btn-sold"   data-action="mark-as-sold"    data-id="${escapeAttr(id)}">💰 Mark Sold</button>
      <button type="button" class="admin-action-btn admin-action-btn-danger" data-action="delete-listing"  data-id="${escapeAttr(id)}">Delete</button>`;
  } else if (status === "sold") {
    actions = `
      <button type="button" class="admin-action-btn admin-action-btn-warning" data-action="restore-listing" data-id="${escapeAttr(id)}">Restore</button>
      <button type="button" class="admin-action-btn admin-action-btn-danger"  data-action="delete-listing"  data-id="${escapeAttr(id)}">Delete</button>`;
  } else {
    actions = `<button type="button" class="admin-action-btn admin-action-btn-danger" data-action="delete-listing" data-id="${escapeAttr(id)}">Delete</button>`;
  }

  return `
    <tr data-status="${status}" data-id="${escapeAttr(id)}">
      <td data-label="Listing">
        <div class="admin-listing-cell">
          <div class="admin-listing-thumb" style="${imageStyle}"></div>
          <div>
            <p class="admin-listing-title">${escapeHtml(listing.title || "Untitled")}</p>
            <p class="admin-listing-meta">${listing.year || "—"} • ${(listing.mileage || 0).toLocaleString()} mi • ${escapeHtml(listing.fuel || "—")}</p>
          </div>
        </div>
      </td>
      <td data-label="Seller">${escapeHtml(listing.sellerName || "Unknown")}</td>
      <td data-label="Price">£${(listing.price || 0).toLocaleString()}</td>
      <td data-label="Submitted">${formatDate(listing.createdAt)}</td>
      <td data-label="Status"><span class="admin-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
      <td data-label="Actions"><div class="admin-actions">${actions}</div></td>
    </tr>`;
}

// ─── Pagination (identical logic, no shared state) ───
function renderPagination(nav, totalPages) {
  if (totalPages <= 1) { nav.innerHTML = ""; return; }

  const pages = buildPageList(state.page, totalPages);
  const html = [];

  html.push(`<button type="button" class="page-button page-arrow" data-nav="prev" ${state.page === 1 ? "disabled" : ""} aria-label="Previous page">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
  </button>`);

  pages.forEach(p => {
    if (p === "...") {
      html.push('<span class="page-ellipsis" aria-hidden="true">…</span>');
    } else {
      const active = p === state.page;
      html.push(`<button type="button" class="page-button ${active ? "active" : ""}" data-nav="num" data-page="${p}" ${active ? 'aria-current="page"' : ""}>${p}</button>`);
    }
  });

  html.push(`<button type="button" class="page-button page-arrow" data-nav="next" ${state.page === totalPages ? "disabled" : ""} aria-label="Next page">
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
function formatDate(ts) {
  if (!ts) return "Recently";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "Recently"; }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s) { return escapeHtml(s); }
// Expose refresh function for admin-add-car.js
window.__refreshListings = async () => {
  await loadData();
};
