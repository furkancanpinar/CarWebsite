// site-content.js — Dynamic site text with admin edit toggle and image support
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged } from "./firebase.js";
import { uploadToCloudinary } from "./cloudinary-upload.js";

const PAGE_DOC_PREFIX = "site";
const EDIT_HINT = "Click to edit";
const SAVE_MESSAGE = "Content published";
const FAILED_MESSAGE = "Publish failed";
const TOAST_DURATION = 1800;
const ADMIN_PANEL_ID = 'admin-edit-panel';
const ADMIN_TOGGLE_ID = 'admin-edit-toggle';
const ADMIN_STATUS_ID = 'admin-edit-panel-status';
const ADMIN_PILL_ID = 'admin-edit-pill';

let adminMode = false;
let editEnabled = false;
let toastTimeout = null;
const editableListeners = new WeakMap();
const imageEditors = new WeakMap();

const pageKey = document.body.dataset.pageKey || derivePageKey();
const SITE_CONTENT_DOC = doc(db, PAGE_DOC_PREFIX, pageKey);

function derivePageKey() {
  const filename = window.location.pathname.split("/").pop();
  const name = filename.replace(/\.html$/, "");
  if (name === "" || name === "index") return "home";
  return name;
}

function getEditableElements() {
  return Array.from(document.querySelectorAll('[data-content-key]'));
}

function getElementValue(el) {
  if (el.dataset.contentType === 'image' && el.tagName === 'IMG') return el.src.trim();
  if ('value' in el && el.value !== undefined) return el.value.trim();
  if (el.dataset.contentType === 'html') return el.innerHTML.trim();
  return el.textContent.trim();
}

function setElementValue(el, value) {
  if (value === undefined || value === null) return;
  if (el.dataset.contentType === 'image' && el.tagName === 'IMG') {
    el.src = value;
    return;
  }
  if ('value' in el && el.value !== undefined) {
    el.value = value;
    return;
  }
  if (el.dataset.contentType === 'html') {
    el.innerHTML = value;
    return;
  }
  el.textContent = value;
}

async function loadSiteContent() {
  const elements = getEditableElements();
  if (!elements.length) return;

  let snapshot;
  try {
    snapshot = await getDoc(SITE_CONTENT_DOC);
  } catch (err) {
    console.error('Failed to load site content', err);
    return;
  }

  const data = snapshot.exists() ? snapshot.data() : {};
  elements.forEach((el) => {
    const key = el.dataset.contentKey;
    const value = typeof data[key] === 'string' ? data[key] : getElementValue(el);
    setElementValue(el, value);
    el.dataset.prevContent = getElementValue(el);
  });
}

function createAdminPanel() {
  if (document.getElementById(ADMIN_PANEL_ID)) return;

  const panel = document.createElement('div');
  panel.id = ADMIN_PANEL_ID;
  panel.className = 'admin-edit-panel';

  const label = document.createElement('span');
  label.className = 'admin-edit-panel-label';
  label.textContent = 'Admin content editing';

  const status = document.createElement('span');
  status.id = ADMIN_STATUS_ID;
  status.className = 'admin-edit-panel-status';
  status.textContent = editEnabled ? 'Editing enabled' : 'Editing off';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = ADMIN_TOGGLE_ID;
  toggle.className = 'button button-accent';
  toggle.textContent = editEnabled ? 'Disable editing' : 'Enable editing';
  toggle.addEventListener('click', () => {
    setEditingState(!editEnabled);
  });

  panel.append(label, status, toggle);
  document.body.appendChild(panel);
}

function updateAdminPanel() {
  const status = document.getElementById(ADMIN_STATUS_ID);
  const toggle = document.getElementById(ADMIN_TOGGLE_ID);
  if (status) status.textContent = editEnabled ? 'Editing enabled' : 'Editing off';
  if (toggle) toggle.textContent = editEnabled ? 'Disable editing' : 'Enable editing';
}

function setEditingState(enabled) {
  if (!adminMode) return;
  if (enabled === editEnabled) return;

  editEnabled = enabled;
  updateAdminPanel();

  if (editEnabled) {
    createAdminPill();
    document.body.classList.add('admin-edit-mode');
    getEditableElements().forEach((el) => {
      if (el.dataset.contentType === 'image' && el.tagName === 'IMG') {
        attachImageEditor(el);
      } else {
        initializeTextEditable(el);
      }
    });
  } else {
    document.body.classList.remove('admin-edit-mode');
    removeAdminPill();
    getEditableElements().forEach((el) => {
      if (el.dataset.contentType === 'image' && el.tagName === 'IMG') {
        removeImageEditor(el);
      } else {
        removeTextEditable(el);
      }
    });
  }
}

function createAdminPill() {
  if (document.getElementById(ADMIN_PILL_ID)) return;
  const pill = document.createElement('div');
  pill.id = ADMIN_PILL_ID;
  pill.className = 'admin-edit-mode-pill';
  pill.textContent = 'Admin edit mode enabled';
  document.body.appendChild(pill);
}

function removeAdminPill() {
  const pill = document.getElementById(ADMIN_PILL_ID);
  if (pill) pill.remove();
}

function initializeTextEditable(el) {
  if (el.dataset.adminEditableAttached === 'true') return;
  el.dataset.adminEditableAttached = 'true';
  el.dataset.prevContent = getElementValue(el);
  el.classList.add('admin-editable');
  el.dataset.editHint = EDIT_HINT;
  el.setAttribute('contenteditable', 'true');
  el.setAttribute('spellcheck', 'true');
  el.setAttribute('aria-label', 'Editable content for admins. Press Enter to save changes.');

  const handlers = {
    blur: async () => {
      await saveEditableField(el);
    },
    keydown: (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        el.blur();
      }
    },
    mousedown: (event) => {
      event.stopPropagation();
    }
  };

  el.addEventListener('blur', handlers.blur);
  el.addEventListener('keydown', handlers.keydown);
  el.addEventListener('mousedown', handlers.mousedown);
  editableListeners.set(el, handlers);
}

function removeTextEditable(el) {
  const handlers = editableListeners.get(el);
  if (handlers) {
    el.removeEventListener('blur', handlers.blur);
    el.removeEventListener('keydown', handlers.keydown);
    el.removeEventListener('mousedown', handlers.mousedown);
    editableListeners.delete(el);
  }
  el.removeAttribute('contenteditable');
  el.removeAttribute('spellcheck');
  el.removeAttribute('aria-label');
  el.classList.remove('admin-editable');
  delete el.dataset.adminEditableAttached;
  delete el.dataset.editHint;
}

function attachImageEditor(el) {
  if (imageEditors.has(el)) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'admin-image-edit-wrapper';
  wrapper.dataset.adminImageWrapper = 'true';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'admin-image-edit-button';
  button.textContent = 'Edit image';
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await openImageUploadPicker(el, button);
  });

  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
  wrapper.appendChild(button);
  imageEditors.set(el, { wrapper, button });
}

function removeImageEditor(el) {
  const state = imageEditors.get(el);
  if (!state) return;

  const { wrapper, button } = state;
  button.remove();
  if (wrapper.parentNode) {
    wrapper.parentNode.insertBefore(el, wrapper);
    wrapper.remove();
  }
  imageEditors.delete(el);
}

async function openImageUploadPicker(el, button) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      fileInput.remove();
      return;
    }

    await uploadImageFile(file, el, button);
    fileInput.remove();
  });

  document.body.appendChild(fileInput);
  fileInput.click();
}

async function uploadImageFile(file, el, button) {
  const key = el.dataset.contentKey;
  const previousLabel = button.textContent;

  button.disabled = true;
  button.textContent = 'Uploading...';

  try {
    const imageUrl = await uploadToCloudinary(file);
    await setDoc(SITE_CONTENT_DOC, { [key]: imageUrl }, { merge: true });
    setElementValue(el, imageUrl);
    el.dataset.prevContent = imageUrl;
    showToast(SAVE_MESSAGE);
  } catch (err) {
    console.error('Failed to upload image', err);
    showToast(FAILED_MESSAGE);
  } finally {
    button.disabled = false;
    button.textContent = previousLabel;
  }
}

async function editImageUrl(el) {
  const currentUrl = el.src || '';
  const newUrl = window.prompt('Enter image URL', currentUrl);
  if (!newUrl || newUrl.trim() === '' || newUrl.trim() === currentUrl) return;

  const key = el.dataset.contentKey;
  const value = newUrl.trim();

  try {
    await setDoc(SITE_CONTENT_DOC, { [key]: value }, { merge: true });
    setElementValue(el, value);
    el.dataset.prevContent = value;
    showToast(SAVE_MESSAGE);
  } catch (err) {
    console.error('Failed to update image content', err);
    showToast(FAILED_MESSAGE);
  }
}

async function saveEditableField(el) {
  if (!adminMode || !editEnabled) return;
  const key = el.dataset.contentKey;
  const value = getElementValue(el);
  const previous = el.dataset.prevContent || '';

  if (value === previous) return;

  try {
    await setDoc(SITE_CONTENT_DOC, { [key]: value }, { merge: true });
    el.dataset.prevContent = value;
    showToast(SAVE_MESSAGE);
  } catch (err) {
    console.error('Failed to publish editable content', err);
    showToast(FAILED_MESSAGE);
  }
}

function createToast() {
  let toast = document.getElementById('admin-save-toast');
  if (toast) return toast;

  toast = document.createElement('div');
  toast.id = 'admin-save-toast';
  toast.className = 'admin-save-toast';
  document.body.appendChild(toast);
  return toast;
}

function showToast(message) {
  const toast = createToast();
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove('show');
  }, TOAST_DURATION);
}

function initAdminWatcher() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      adminMode = false;
      setEditingState(false);
      const panel = document.getElementById(ADMIN_PANEL_ID);
      if (panel) panel.remove();
      return;
    }
    try {
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));
      if (!adminSnap.exists()) return;
      adminMode = true;
      createAdminPanel();
      updateAdminPanel();
    } catch (err) {
      console.error('Admin verification failed', err);
    }
  });
}

async function init() {
  await loadSiteContent();
  initAdminWatcher();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
