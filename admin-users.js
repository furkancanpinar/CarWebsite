// admin-users.js — User management with pagination
import {
  auth, db, doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, serverTimestamp
} from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── Module-scoped config & state ───
const SECTION_ID = "users-section";
const NAV_ID     = "users-pagination";
const BODY_ID    = "users-tbody";
const PAGE_SIZE  = 5;

const state = {
  all: [],
  page: 1,
  search: "",
  role: ""
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
  const search = document.getElementById("user-search");
  const role   = document.getElementById("user-filter-role");

  if (search) {
    search.addEventListener("input", (e) => {
      state.search = e.target.value.toLowerCase().trim();
      state.page = 1;
      renderPage();
    });
  }
  if (role) {
    role.addEventListener("change", (e) => {
      state.role = e.target.value;
      state.page = 1;
      renderPage();
    });
  }
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
  const uid    = btn.dataset.uid;
  if (!uid) return;

  const messages = {
    "toggle-admin": "Change admin privileges for this user?",
    "toggle-status": "Change this user's status?",
    "delete-user": "Delete this user permanently?"
  };
  if (messages[action] && !confirm(messages[action])) return;

  try {
    const row   = btn.closest("tr");
    const email = row?.dataset.email;

    switch (action) {
      case "toggle-admin": {
        const isAdmin = row?.querySelector(".admin-badge.admin");
        if (isAdmin) {
          await deleteDoc(doc(db, "admins", uid));
          await setDoc(doc(db, "users", uid), { role: "Buyer" }, { merge: true });
        } else {
          await setDoc(doc(db, "admins", uid), {
            email, role: "admin", promotedAt: serverTimestamp()
          }, { merge: true });
          await setDoc(doc(db, "users", uid), { role: "Admin" }, { merge: true });
        }
        break;
      }
      case "toggle-status": {
        const isSuspended = row?.querySelector(".admin-badge.suspended");
        await setDoc(doc(db, "users", uid), {
          status: isSuspended ? "Active" : "Suspended"
        }, { merge: true });
        break;
      }
      case "delete-user":
        await deleteDoc(doc(db, "users", uid));
        await deleteDoc(doc(db, "admins", uid)).catch(() => {});
        break;
    }
    await loadData();
  } catch (err) {
    console.error(err);
    alert("Failed: " + err.message);
  }
}

// ─── Load ───
async function loadData() {
  const tbody = document.getElementById(BODY_ID);
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">Loading users...</td></tr>`;

  try {
    const snap = await getDocs(collection(db, "users"));
    state.all = [];
    snap.forEach(d => state.all.push({ uid: d.id, ...d.data() }));
    state.page = 1;
    renderPage();
  } catch (err) {
    console.error("Load users error:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#f87171;">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

// ─── Render ───
function renderPage() {
  const tbody = document.getElementById(BODY_ID);
  const nav   = document.getElementById(NAV_ID);
  if (!tbody || !nav) return;

  const filtered = state.all.filter(u => {
    const name  = (u.name  || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const role  = u.role || "Buyer";
    const matchSearch = !state.search || name.includes(state.search) || email.includes(state.search);
    const matchRole   = !state.role   || role === state.role;
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const start     = (state.page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = pageItems.length === 0
    ? `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">No users match your filters.</td></tr>`
    : pageItems.map(u => buildRow(u.uid, u)).join("");

  renderPagination(nav, totalPages);
}

function buildRow(uid, user) {
  const name      = user.name || user.displayName || "Unnamed User";
  const email     = user.email || "No email";
  const role      = user.role  || "Buyer";
  const status    = user.status || "Active";
  const joinedAt  = user.joinedAt ? formatDate(user.joinedAt) : "Unknown";
  const initials  = (name.split(" ").map(p => p[0]).slice(0, 2).join("") || "??").toUpperCase();

  return `
    <tr data-role="${escapeAttr(role)}" data-name="${escapeAttr(name)}" data-email="${escapeAttr(email)}" data-uid="${escapeAttr(uid)}">
      <td data-label="User">
        <div class="admin-user-cell">
          <div class="admin-avatar">${escapeHtml(initials)}</div>
          <div>
            <p class="admin-user-name">${escapeHtml(name)}</p>
            <p class="admin-user-id">#${uid.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </td>
      <td data-label="Email">${escapeHtml(email)}</td>
      <td data-label="Role"><span class="admin-badge ${role.toLowerCase()}">${escapeHtml(role)}</span></td>
      <td data-label="Joined">${joinedAt}</td>
      <td data-label="Status"><span class="admin-badge ${status.toLowerCase()}">${escapeHtml(status)}</span></td>
      <td data-label="Actions">
        <div class="admin-actions">
          <button type="button" class="admin-action-btn" data-action="toggle-admin" data-uid="${escapeAttr(uid)}" data-email="${escapeAttr(email)}">${role === "Admin" ? "Remove Admin" : "Make Admin"}</button>
          <button type="button" class="admin-action-btn" data-action="toggle-status" data-uid="${escapeAttr(uid)}">${status === "Suspended" ? "Reactivate" : "Suspend"}</button>
          <button type="button" class="admin-action-btn danger" data-action="delete-user" data-uid="${escapeAttr(uid)}">Delete</button>
        </div>
      </td>
    </tr>`;
}

// ─── Pagination ───
function renderPagination(nav, totalPages) {
  if (totalPages <= 1) { nav.innerHTML = ""; return; }

  const pages = buildPageList(state.page, totalPages);
  const html  = [];

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
  if (!ts) return "Unknown";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  } catch { return "Unknown"; }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s) { return escapeHtml(s); }
