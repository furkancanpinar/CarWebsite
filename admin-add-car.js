// admin-add-car.js — Admin-only "Add Car" with multiple Cloudinary uploads
import {
  auth, db,
  doc, getDoc, setDoc, collection,
  serverTimestamp
} from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { uploadToCloudinary } from "./cloudinary-upload.js";

// ─── State ───
let isAdmin = false;
let selectedFiles = []; // Array of File objects (max 5)
const MAX_PHOTOS = 35;

// ─── Boot ───
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const snap = await getDoc(doc(db, "admins", user.uid));
  if (!snap.exists()) return;

  isAdmin = true;
  bindUI();
});

function bindUI() {
  const toggleBtn = document.getElementById("toggle-add-car-form");
  const wrapper   = document.getElementById("add-car-form-wrapper");
  const cancelBtn = document.getElementById("cancel-add-car");
  const form      = document.getElementById("add-car-form");
  const fileInput = document.getElementById("car-image-file");
  const pickBtn   = document.getElementById("car-image-pick-btn");

  if (!toggleBtn || !wrapper || !form) return;

  // Toggle form visibility
  toggleBtn.addEventListener("click", () => {
    const isOpen = wrapper.style.display !== "none";
    wrapper.style.display = isOpen ? "none" : "block";
    if (!isOpen) {
      window.scrollTo({ top: wrapper.offsetTop - 100, behavior: "smooth" });
    }
  });

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      form.reset();
      clearAllPreviews();
      selectedFiles = [];
      if (fileInput) fileInput.value = "";
      wrapper.style.display = "none";
      setStatus("");
    });
  }

  // "Choose Images" button → triggers hidden file input
  if (pickBtn && fileInput) {
    pickBtn.addEventListener("click", () => {
      fileInput.click();
    });
  }

  // File input change handler
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const newFiles = Array.from(e.target.files || []);

      // Validate each file
      const valid = [];
      for (const file of newFiles) {
        if (!file.type.startsWith("image/")) {
          setStatus(`❌ "${file.name}" is not an image.`, "error");
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setStatus(`❌ "${file.name}" is too large (max 10MB).`, "error");
          continue;
        }
        valid.push(file);
      }

      // Add to existing selection, enforce max
      selectedFiles = [...selectedFiles, ...valid].slice(0, MAX_PHOTOS);

      if (selectedFiles.length >= MAX_PHOTOS && valid.length > 0) {
        setStatus(`ℹ️ Max ${MAX_PHOTOS} photos reached.`, "");
      } else if (valid.length > 0) {
        setStatus("");
      }

      // Reset input so user can re-select same file
      fileInput.value = "";

      renderPreviews();
    });
  }

  // Submit
  form.addEventListener("submit", handleSubmit);
}

// ─── Previews ───
function renderPreviews() {
  const grid = document.getElementById("car-image-previews-grid");
  const placeholder = document.getElementById("car-image-placeholder");
  const counter = document.getElementById("car-image-counter");

  if (!grid) return;

  if (selectedFiles.length === 0) {
    grid.innerHTML = "";
    grid.style.display = "none";
    if (placeholder) placeholder.style.display = "flex";
    if (counter) counter.textContent = `0 / ${MAX_PHOTOS}`;
    return;
  }

  if (placeholder) placeholder.style.display = "none";
  grid.style.display = "grid";
  if (counter) counter.textContent = `${selectedFiles.length} / ${MAX_PHOTOS}`;

  grid.innerHTML = selectedFiles.map((file, idx) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="car-thumb-preview">
        <img src="${url}" alt="Preview ${idx + 1}">
        <button type="button" class="car-thumb-remove" data-idx="${idx}" aria-label="Remove photo">×</button>
        ${idx === 0 ? '<span class="car-thumb-badge">Main</span>' : ''}
      </div>
    `;
  }).join("");

  // Wire remove buttons
  grid.querySelectorAll(".car-thumb-remove").forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      selectedFiles.splice(idx, 1);
      renderPreviews();
    });
  });
}

function clearAllPreviews() {
  const grid = document.getElementById("car-image-previews-grid");
  const placeholder = document.getElementById("car-image-placeholder");
  const counter = document.getElementById("car-image-counter");
  if (grid) {
    grid.innerHTML = "";
    grid.style.display = "none";
  }
  if (placeholder) placeholder.style.display = "flex";
  if (counter) counter.textContent = `0 / ${MAX_PHOTOS}`;
}

// ─── Submit ───
async function handleSubmit(e) {
  e.preventDefault();
  if (!isAdmin) {
    setStatus("You must be an admin to add cars.", "error");
    return;
  }

  if (selectedFiles.length === 0) {
    setStatus("❌ Please choose at least 1 image for the car.", "error");
    return;
  }

  const submitBtn = document.getElementById("add-car-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = `Uploading 1 / ${selectedFiles.length}...`;

  try {
    // Upload all images sequentially
    const imageUrls = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      submitBtn.textContent = `Uploading ${i + 1} / ${selectedFiles.length}...`;
      const url = await uploadToCloudinary(selectedFiles[i]);
      imageUrls.push(url);
    }

    submitBtn.textContent = "Saving listing...";

    // Admin info
    const adminUser = auth.currentUser;
    const adminSnap = await getDoc(doc(db, "admins", adminUser.uid));
    const adminData = adminSnap.data() || {};

    // Autotrader link (optional)
    const autotraderLink = getVal("car-autotrader");
    const hasAutotrader = autotraderLink && autotraderLink.trim() !== "";

    // Build listing
    const carData = {
      title: `${getVal("car-make")} ${getVal("car-model")}`.trim(),
      make: getVal("car-make"),
      model: getVal("car-model"),
      year: parseInt(getVal("car-year"), 10),
      price: parseInt(getVal("car-price"), 10),
      mileage: parseInt(getVal("car-mileage"), 10),
      fuel: getVal("car-fuel"),
      transmission: getVal("car-transmission"),
      bodyType: getVal("car-body"),
      colour: getVal("car-colour"),
      engineSize: getVal("car-engine") ? parseFloat(getVal("car-engine")) : null,
      description: getVal("car-description"),

      // Multiple images
      imageUrl: imageUrls[0],
      images: imageUrls,

      // Autotrader link (optional)
      autotraderUrl: hasAutotrader ? autotraderLink.trim() : null,

      // Admin-added listings skip approval
      status: "approved",
      submittedBy: adminUser.uid,
      sellerName: adminData.email || "Autex Motors",
      isAdminListing: true,

      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp()
    };

    const docRef = doc(collection(db, "listings"));
    await setDoc(docRef, carData);

    setStatus(`✅ Car added successfully with ${imageUrls.length} photo(s)!`, "success");

    // Reset form
    document.getElementById("add-car-form").reset();
    selectedFiles = [];
    clearAllPreviews();
    const fileInputEl = document.getElementById("car-image-file");
    if (fileInputEl) fileInputEl.value = "";

    // Refresh listings table
    if (typeof window.__refreshListings === "function") {
      await window.__refreshListings();
    }

    // Close form after 2.5 seconds
    setTimeout(() => {
      const wrapperEl = document.getElementById("add-car-form-wrapper");
      if (wrapperEl) wrapperEl.style.display = "none";
      setStatus("");
    }, 2500);

  } catch (err) {
    console.error("Add car error:", err);
    setStatus(`❌ Failed: ${err.message}`, "error");
  } finally {
    // ALWAYS re-enable the button
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Car to Inventory";
  }
}

// ─── Helpers ───
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setStatus(msg, type = "") {
  const el = document.getElementById("add-car-status");
  if (!el) return;
  el.textContent = msg;
  el.style.color = type === "error" ? "#f87171"
                : type === "success" ? "#34d399"
                : "var(--muted)";
}
