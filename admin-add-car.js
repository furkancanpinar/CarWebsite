// admin-add-car.js — Admin-only "Add Car" with Cloudinary image upload
import {
  auth, db,
  doc, getDoc, setDoc, collection,
  serverTimestamp
} from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { uploadToCloudinary } from "./cloudinary-upload.js";

// ─── State ───
let isAdmin = false;
let selectedFile = null;

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

  if (!toggleBtn || !wrapper || !form) return;

  // Toggle form visibility
  toggleBtn.addEventListener("click", () => {
    const isOpen = wrapper.style.display !== "none";
    wrapper.style.display = isOpen ? "none" : "block";
    toggleBtn.innerHTML = isOpen
      ? '<span aria-hidden="true">＋</span> Add New Car'
      : '<span aria-hidden="true">×</span> Close Form';
    if (!isOpen) {
      window.scrollTo({ top: wrapper.offsetTop - 100, behavior: "smooth" });
    }
  });

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      form.reset();
      clearPreview();
      wrapper.style.display = "none";
      toggleBtn.innerHTML = '<span aria-hidden="true">＋</span> Add New Car';
      setStatus("");
    });
  }

  // Image file picker — preview + validate
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) {
        selectedFile = null;
        clearPreview();
        return;
      }

      // Validate type
      if (!file.type.startsWith("image/")) {
        setStatus("❌ Please choose an image file (JPG, PNG, WEBP).", "error");
        fileInput.value = "";
        selectedFile = null;
        clearPreview();
        return;
      }

      // Validate size (max 10MB — Cloudinary free tier limit)
      const maxMB = 10;
      if (file.size > maxMB * 1024 * 1024) {
        setStatus(`❌ Image too large. Max ${maxMB}MB.`, "error");
        fileInput.value = "";
        selectedFile = null;
        clearPreview();
        return;
      }

      selectedFile = file;
      showPreview(file);
      setStatus("");
    });

    // Change Image button — clears current selection
    const removeBtn = document.getElementById("car-image-remove");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        fileInput.value = "";
        selectedFile = null;
        clearPreview();
      });
    }
  }

  // Submit
  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!isAdmin) {
    setStatus("You must be an admin to add cars.", "error");
    return;
  }

  if (!selectedFile) {
    setStatus("❌ Please choose an image for the car.", "error");
    return;
  }

  const submitBtn = document.getElementById("add-car-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Uploading image...";

  try {
    // 1) Upload image to Cloudinary (no CORS issues)
    const imageUrl = await uploadToCloudinary(selectedFile);
    submitBtn.textContent = "Saving listing...";

    // 2) Get admin info
    const adminUser = auth.currentUser;
    const adminSnap = await getDoc(doc(db, "admins", adminUser.uid));
    const adminData = adminSnap.data() || {};

    // 3) Build listing
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
      imageUrl: imageUrl,

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

    setStatus(`✅ Car added successfully!`, "success");

    // Reset form
    document.getElementById("add-car-form").reset();
    selectedFile = null;
    clearPreview();

    // Refresh listings table
    if (typeof window.__refreshListings === "function") {
      await window.__refreshListings();
    }

    // Close form after 2 seconds
    setTimeout(() => {
      const wrapper = document.getElementById("add-car-form-wrapper");
      const toggleBtn = document.getElementById("toggle-add-car-form");
      if (wrapper) wrapper.style.display = "none";
      if (toggleBtn) toggleBtn.innerHTML = '<span aria-hidden="true">＋</span> Add New Car';
      setStatus("");
    }, 2500);

  } catch (err) {
    console.error("Add car error:", err);
    setStatus(`❌ Failed: ${err.message}`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Car to Inventory";
  }
}

// ─── Preview helpers ───
function showPreview(file) {
  const previewWrap = document.getElementById("car-image-preview");
  const previewImg  = document.getElementById("car-image-preview-img");
  const fileName    = document.getElementById("car-image-filename");
  const placeholder = document.getElementById("car-image-placeholder");

  if (!previewWrap || !previewImg) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewWrap.style.display = "flex";
    if (placeholder) placeholder.style.display = "none";
    if (fileName) fileName.textContent = `${file.name} (${formatSize(file.size)})`;
  };
  reader.readAsDataURL(file);
}

function clearPreview() {
  const previewWrap = document.getElementById("car-image-preview");
  const previewImg  = document.getElementById("car-image-preview-img");
  const fileName    = document.getElementById("car-image-filename");
  const placeholder = document.getElementById("car-image-placeholder");

  if (previewWrap) previewWrap.style.display = "none";
  if (previewImg) previewImg.src = "";
  if (fileName) fileName.textContent = "";
  if (placeholder) placeholder.style.display = "flex";
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

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
