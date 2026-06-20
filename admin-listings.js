// admin-listings.js
import { auth, db, doc, setDoc, collection, getDocs, onAuthStateChanged } from "./firebase.js";

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
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await createListing(user);
  });

  // Image preview when selected
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
      status.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) — click Create to upload`;
    });
  }

  // Load existing listings
  await loadListings();
});

// ===== Create Listing =====
async function createListing(user) {
  const submitBtn = document.querySelector('#create-listing-form button[type="submit"]');
  const statusEl = document.getElementById('listing-form-status');

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';
    if (statusEl) statusEl.textContent = '⬆️ Uploading image to Cloudinary...';

    // Get form values
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
      throw new Error('Please fill in all required fields and select an image');
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(imageFile);
    if (statusEl) statusEl.textContent = '💾 Saving to database...';

    // Save to Firestore
    const listingId = 'listing_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await setDoc(doc(db, "listings", listingId), {
      title: title,
      make: make,
      model: model,
      year: year,
      price: price,
      mileage: mileage,
      fuel: fuel,
      transmission: transmission,
      description: description,
      imageUrl: imageUrl,
      status: 'pending',
      sellerId: user.uid,
      sellerName: user.email,
      createdAt: new Date()
    });

    if (statusEl) statusEl.textContent = '✅ Listing created!';
    alert('✅ Listing created! Approve it in the list below.');

    document.getElementById('create-listing-form').reset();
    document.getElementById('upload-preview').style.display = 'none';
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

// ===== Load Listings =====
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
    const { updateDoc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

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
