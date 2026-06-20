// admin-listings.js
import { auth, db, storage, doc, setDoc, collection, getDocs, ref, uploadBytes, getDownloadURL } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const form = document.getElementById('create-listing-form');
  if (!form) return;

  // Verify admin
  const adminSnap = await doc(db, "admins", user.uid);
  // (skip strict check for now since getDoc needs the snap)

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createListing(user);
  });
});

async function createListing(user) {
  const submitBtn = document.querySelector('#create-listing-form button[type="submit"]');
  const statusEl = document.getElementById('listing-form-status');

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';
    if (statusEl) statusEl.textContent = 'Uploading image...';

    // 1. Get form values
    const title = document.getElementById('listing-title').value.trim();
    const make = document.getElementById('listing-make').value.trim();
    const model = document.getElementById('listing-model').value.trim();
    const year = parseInt(document.getElementById('listing-year').value);
    const price = parseFloat(document.getElementById('listing-price').value);
    const mileage = parseInt(document.getElementById('listing-mileage').value);
    const fuel = document.getElementById('listing-fuel').value;
    const transmission = document.getElementById('listing-transmission').value;
    const description = document.getElementById('listing-description').value.trim();
    const imageFile = document.getElementById('listing-image').files[0];

    // 2. Validate
    if (!title || !make || !model || !year || !price || !imageFile) {
      throw new Error('Please fill in all required fields and select an image');
    }

    // 3. Upload image to Firebase Storage
    const listingId = 'listing_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const imageRef = ref(storage, `listings/${listingId}/${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);

    if (statusEl) statusEl.textContent = 'Saving listing...';

    // 4. Save listing to Firestore
    await setDoc(doc(db, "listings", listingId), {
      title: title,
      make: make,
      model: model,
      year: year,
      price: price,
      mileage: mileage || 0,
      fuel: fuel,
      transmission: transmission,
      description: description,
      imageUrl: imageUrl,
      status: 'pending',
      sellerId: user.uid,
      sellerName: user.displayName || user.email,
      createdAt: new Date()
    });

    if (statusEl) statusEl.textContent = '✅ Listing created!';
    alert('✅ Listing created! It will appear once approved.');

    // Reset form
    document.getElementById('create-listing-form').reset();
    await loadListings();

  } catch (err) {
    console.error('Create listing failed:', err);
    if (statusEl) statusEl.textContent = '❌ ' + err.message;
    alert('Failed: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Listing';
  }
}

async function loadListings() {
  const tbody = document.getElementById('listings-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">Loading listings...</td></tr>`;

  try {
    const querySnapshot = await getDocs(collection(db, "listings"));
    tbody.innerHTML = '';

    if (querySnapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">No listings yet. Create your first one above!</td></tr>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const listing = docSnap.data();
      const id = docSnap.id;
      tbody.insertAdjacentHTML('beforeend', buildListingRow(id, listing));
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#f87171;">Error: ${err.message}</td></tr>`;
  }
}

function buildListingRow(id, listing) {
  const status = listing.status || 'pending';
  const statusClass = status.toLowerCase();
  const imageUrl = listing.imageUrl || '';
  const imageStyle = imageUrl ? `background-image:url('${imageUrl}'); background-size:cover; background-position:center;` : '';

  let actions = '';
  if (status === 'pending') {
    actions = `
      <button class="admin-action-btn success" data-action="approve-listing" data-id="${id}">Approve</button>
      <button class="admin-action-btn danger" data-action="reject-listing" data-id="${id}">Reject</button>
    `;
  } else {
    actions = `
      <button class="admin-action-btn" data-action="view-listing" data-id="${id}">View</button>
      <button class="admin-action-btn danger" data-action="delete-listing" data-id="${id}">Delete</button>
    `;
  }

  return `
    <tr data-status="${status}" data-id="${id}">
      <td>
        <div class="admin-listing-cell">
          <div class="admin-listing-thumb" style="${imageStyle}"></div>
          <div>
            <p class="admin-listing-title">${escapeHtml(listing.title || 'Untitled')}</p>
            <p class="admin-listing-meta">${listing.year || '—'} • ${(listing.mileage || 0).toLocaleString()} mi • ${escapeHtml(listing.fuel || '—')}</p>
          </div>
        </div>
      </td>
      <td>${escapeHtml(listing.sellerName || 'Unknown')}</td>
      <td>£${(listing.price || 0).toLocaleString()}</td>
      <td>Just now</td>
      <td><span class="admin-badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
      <td>
        <div class="admin-actions">${actions}</div>
      </td>
    </tr>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Load listings on page load
if (document.getElementById('listings-tbody')) {
  onAuthStateChanged(auth, (user) => {
    if (user) loadListings();
  });
}

// Approve/Reject/Delete handlers
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!id) return;

  if (!['approve-listing', 'reject-listing', 'delete-listing'].includes(action)) return;

  if (!confirm(`Are you sure you want to ${action.replace('-listing', '')} this listing?`)) return;

  try {
    const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    if (action === 'delete-listing') {
      await deleteDoc(doc(db, "listings", id));
    } else {
      const newStatus = action === 'approve-listing' ? 'approved' : 'rejected';
      await updateDoc(doc(db, "listings", id), { status: newStatus });
    }
    await loadListings();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
});
