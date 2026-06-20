// admin-users.js
import { auth, db, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, async (currentUser) => {
  if (!currentUser) return;

  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  // Verify admin before loading
  const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));
  if (!adminSnap.exists()) return;

  await loadUsers();
});

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  const totalUsersEl = document.getElementById('stat-total-users');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; padding:40px; color:var(--muted);">
        Loading users from database...
      </td>
    </tr>
  `;

  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    tbody.innerHTML = '';

    // Update the total users stat
    if (totalUsersEl) {
      totalUsersEl.textContent = querySnapshot.size.toLocaleString();
    }

    if (querySnapshot.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:40px; color:var(--muted);">
            No users yet. Users will appear here after they sign up.
          </td>
        </tr>
      `;
      return;
    }

    querySnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const uid = userDoc.id;
      const row = buildUserRow(uid, userData);
      tbody.insertAdjacentHTML('beforeend', row);
    });

    attachAdminActionHandlers();
  } catch (err) {
    console.error("Error loading users:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:#f87171;">
          Error loading users: ${err.message}
        </td>
      </tr>
    `;
  }
}

function buildUserRow(uid, user) {
  const name = user.name || user.displayName || 'Unnamed User';
  const email = user.email || 'No email';
  const role = user.role || 'Buyer';
  const status = user.status || 'Active';
  const listings = user.listings || 0;
  const joinedAt = user.joinedAt ? formatDate(user.joinedAt) : 'Unknown';
  const initials = getInitials(name);
  const roleClass = role.toLowerCase();
  const statusClass = status.toLowerCase();

  return `
    <tr data-role="${escapeHtml(role)}" data-name="${escapeHtml(name)}" data-email="${escapeHtml(email)}" data-uid="${uid}">
      <td>
        <div class="admin-user-cell">
          <div class="admin-avatar">${initials}</div>
          <div>
            <p class="admin-user-name">${escapeHtml(name)}</p>
            <p class="admin-user-id">#${uid.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </td>
      <td>${escapeHtml(email)}</td>
      <td><span class="admin-badge ${roleClass}">${escapeHtml(role)}</span></td>
      <td>${joinedAt}</td>
      <td>${listings}</td>
      <td><span class="admin-badge ${statusClass}">${escapeHtml(status)}</span></td>
      <td>
        <div class="admin-actions">
          <button class="admin-action-btn" data-action="view-user">View</button>
          ${role === 'Admin' 
            ? `<button class="admin-action-btn" data-action="remove-admin">Remove Admin</button>`
            : `<button class="admin-action-btn" data-action="make-admin">Make Admin</button>`
          }
          ${status === 'Suspended' 
            ? `<button class="admin-action-btn" data-action="reactivate-user">Reactivate</button>`
            : `<button class="admin-action-btn danger" data-action="suspend-user">Suspend</button>`
          }
          <button class="admin-action-btn danger" data-action="delete-user">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function getInitials(name) {
  if (!name) return "??";
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(timestamp) {
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch {
    return 'Unknown';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.adminPromoteUser = async function(uid, email) {
  await setDoc(doc(db, "admins", uid), {
    email: email,
    role: "admin",
    promotedAt: new Date()
  });
};

window.adminDemoteUser = async function(uid) {
  await deleteDoc(doc(db, "admins", uid));
};

window.updateUserStatus = async function(uid, status) {
  await setDoc(doc(db, "users", uid), { status: status }, { merge: true });
};

window.deleteUserDoc = async function(uid) {
  await deleteDoc(doc(db, "users", uid));
};

function attachAdminActionHandlers() {
  document.querySelectorAll('#users-tbody [data-action="make-admin"], #users-tbody [data-action="remove-admin"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const row = btn.closest('tr');
      const uid = row?.dataset.uid;
      const email = row?.dataset.email;
      const action = btn.dataset.action;
      if (!uid) return;

      try {
        if (action === 'make-admin') {
          await window.adminPromoteUser(uid, email);
          await setDoc(doc(db, "users", uid), { role: 'Admin' }, { merge: true });
          alert(`✅ ${email} is now an admin`);
        } else {
          await window.adminDemoteUser(uid);
          await setDoc(doc(db, "users", uid), { role: 'Buyer' }, { merge: true });
          alert(`✅ Removed admin from ${email}`);
        }
        await loadUsers();
      } catch (err) {
        console.error(err);
        alert('Failed: ' + err.message);
      }
    });
  });
}
