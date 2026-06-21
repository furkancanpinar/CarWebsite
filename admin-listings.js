// admin-listings.js
import { auth, db, doc, setDoc, collection, getDocs, onAuthStateChanged, deleteDoc } from "./firebase.js";

// ===== Cloudinary Upload =====
async function uploadToCloudinary(file) {
  const cloudName = document.getElementById('cloudinary-cloud-name').value;
  const uploadPreset = document.getElementById('cloudinary-upload-preset').value;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}

// ===== Auth Setup =====
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const form = document.getElementById('create-listing-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await createListing(user);
    });
  }

  // Image preview
  const imageInput = document.getElementById('listing-image');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const preview = document.getElementById('upload-preview');
      const img = document.getElementById('preview-img');
      const status = document.getElementById('upload-status');
      img.src = URL.createObjectURL(file);
      preview.style.display = 'block';
      status.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    });
  }

  await loadListings();
});

// ===== Create Listing =====
async function createListing(user) {
  const submitBtn = document.querySelector('#create-listing-form button[type="submit"]');
  const statusEl = document.getElementById('listing-form-status');

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';
    if (statusEl) statusEl.textContent = '⬆️ Uploading image...';

    const title = document.getElementById('listing-title').value.trim();
    const make = document.getElementById('listing-make').value.trim();
    const model = document.getElementById('listing-model').value.trim();
    const year = parseInt(document.getElementById('listing-year').value);
    const price = parseFloat(document.getElementById('listing-price').value);
    const mileage = parseInt(document.getElementById('listing-mileage').value) || 0;
    const fuel = document.getElementById('listing-fuel').value;
    const transmission = document.getElementById('listing-transmission').value;
    const description = document.getElementById('listing-description').value.trim();
    const imageFile = document.getElementById('listing-image').files[0];

    if (!title || !make || !model || !year || !price || !imageFile) {
      throw new Error('Please fill in all required fields');
    }

    const imageUrl = await uploadToCloudinary(imageFile);
    if (statusEl) statusEl.textContent = '💾 Saving...';

    const listingId = 'listing_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await setDoc(doc(db, "listings", listingId), {
      title, make, model, year, price, mileage, fuel, transmission, description,
      imageUrl,
      status: 'pending',
      sellerId: user.uid,
      sellerName: user.email,
      createdAt: new Date()
    });

    if (statusEl) statusEl.textContent = '✅ Created!';
    alert('✅ Listing created! Approve it in the list below.');
    document.getElementById('create-listing-form').reset();
    document.getElementById('upload-preview').style.display = 'none';
    await loadListings();
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = '❌ ' + err.message;
    alert('Failed: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Listing';
  }
}

// ===== Load Listings =====
async function loadListings() {
  const tbody = document.getElementById('listings-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">Loading...</td></tr>`;

  try {
    const querySnapshot = await getDocs(collection(db, "listings"));
    tbody.innerHTML = '';

    if (querySnapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--muted);">No listings yet.</td></tr>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      tbody.insertAdjacentHTML('beforeend', buildListingRow(docSnap.id, docSnap.data()));
    });
  } catch (err) {
    console.error(err);
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
      <button class="admin-action-btn admin-action-btn-success" data-action="approve-listing" data-id="${id}">Approve</button>
      <button class="admin-action-btn admin-action-btn-danger" data-action="reject-listing" data-id="${id}">Reject</button>
    `;
  } else if (status === 'approved') {
    // ✅ NEW: "Mark as Sold" button for approved listings
    actions = `
      <button class="admin-action-btn admin-action-btn-sold" data-action="mark-as-sold" data-id="${id}">💰 Mark Sold</button>
      <button class="admin-action-btn admin-action-btn-danger" data-action="delete-listing" data-id="${id}">Delete</button>
    `;
  } else if (status === 'sold') {
    actions = `
      <button class="admin-action-btn admin-action-btn-warning" data-action="restore-listing" data-id="${id}">Restore</button>
      <button class="admin-action-btn admin-action-btn-danger" data-action="delete-listing" data-id="${id}">Delete</button>
    `;
  } else {
    actions = `
      <button class="admin-action-btn" data-action="view-listing" data-id="${id}">View</button>
      <button class="admin-action-btn admin-action-btn-danger" data-action="delete-listing" data-id="${id}">Delete</button>
    `;
  }

  return `
    <tr data-status="${status}" data-id="${id}">
      <td data-label="Listing">
        <div class="admin-listing-cell">
          <div class="admin-listing-thumb" style="${imageStyle}"></div>
          <div>
            <p class="admin-listing-title">${escapeHtml(listing.title || 'Untitled')}</p>
            <p class="admin-listing-meta">${listing.year || '—'} • ${(listing.mileage || 0).toLocaleString()} mi • ${escapeHtml(listing.fuel || '—')}</p>
          </div>
        </div>
      </td>
      <td data-label="Seller">${escapeHtml(listing.sellerName || 'Unknown')}</td>
      <td data-label="Price">£${(listing.price || 0).toLocaleString()}</td>
      <td data-label="Submitted">${formatDate(listing.createdAt)}</td>
      <td data-label="Status"><span class="admin-badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
      <td data-label="Actions">
        <div class="admin-actions">${actions}</div>
      </td>
    </tr>
  `;
}

function formatDate(timestamp) {
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Action Handlers =====
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!id) return;

  try {
    const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    switch (action) {
      case 'approve-listing':
        if (!confirm('Approve this listing? It will go live on the marketplace.')) return;
        await updateDoc(doc(db, "listings", id), { status: 'approved' });
        break;

      case 'reject-listing':
        if (!confirm('Reject this listing?')) return;
        await updateDoc(doc(db, "listings", id), { status: 'rejected' });
        break;

      // ✅ NEW: Mark as Sold — moves to sold collection
      case 'mark-as-sold':
        if (!confirm('Mark this car as SOLD? It will be moved to the Previously Sold Vehicles page.')) return;
        await markAsSold(id);
        break;

      case 'restore-listing':
        if (!confirm('Restore this listing to Approved?')) return;
        await updateDoc(doc(db, "listings", id), { status: 'approved' });
        break;

      case 'delete-listing':
        if (!confirm('Delete this listing permanently?')) return;
        await deleteDoc(doc(db, "listings", id));
        break;

      default:
        return;
    }

    await loadListings();
  } catch (err) {
    console.error(err);
    alert('Failed: ' + err.message);
  }
});

// ✅ NEW: Mark as Sold function
async function markAsSold(listingId) {
  try {
    // Get the listing data
    const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const listingSnap = await getDoc(doc(db, "listings", listingId));
    
    if (!listingSnap.exists()) {
      throw new Error('Listing not found');
    }

    const listingData = listingSnap.data();

    // Create a sold record in the "sold" collection
    const soldId = 'sold_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await setDoc(doc(db, "sold", soldId), {
      ...listingData,
      originalListingId: listingId,
      status: 'sold',
      soldAt: new Date(),
      saleDate: new Date().toISOString().split('T')[0]
    });

    // Delete the original listing
    await deleteDoc(doc(db, "listings", listingId));

    console.log('✅ Listing moved to sold collection');
  } catch (err) {
    throw err;
  }
}
