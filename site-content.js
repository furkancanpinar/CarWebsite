// site-content.js — Dynamic site text for homepage with admin edit mode
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged } from "./firebase.js";

const PAGE_DOC_PREFIX = "site";
const EDIT_HINT = "Click to edit";
const IMAGE_HINT = "Click to change image";
const SAVE_MESSAGE = "Content published";
const NO_CHANGES_MESSAGE = "No changes to publish";
const FAILED_MESSAGE = "Publish failed";
const TOAST_DURATION = 1800;
let isAdminUser = false;
let editingActive = false;
let pageDirty = false;
let toastTimeout = null;

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
  if (el.tagName === 'IMG' && el.dataset.contentType === 'image') {
    return el.src.trim();
  }
  if ('value' in el && el.value !== undefined) return el.value.trim();
  if (el.dataset.contentType === 'html') return el.innerHTML.trim();
  return el.textContent.trim();
}

function setElementValue(el, value) {
  if (value === undefined || value === null) return;
  if (el.tagName === 'IMG' && el.dataset.contentType === 'image') {
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
  let panel = document.getElementById('admin-edit-panel');
  if (panel) return panel;

  panel = document.createElement('div');
  panel.id = 'admin-edit-panel';
  panel.className = 'admin-edit-panel';

  const label = document.createElement('span');
  label.className = 'admin-edit-panel-label';
  label.textContent = 'Admin editor';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'admin-edit-toggle';
  toggle.className = 'admin-edit-toggle button button-secondary-outline';
  toggle.textContent = 'Enable edit mode';

  const publish = document.createElement('button');
  publish.type = 'button';
  publish.id = 'admin-edit-publish';
  publish.className = 'admin-edit-publish button button-accent';
  publish.textContent = 'Publish changes';
  publish.disabled = true;

  const status = document.createElement('span');
  status.id = 'admin-edit-panel-status';
  status.className = 'admin-edit-panel-status';
  status.textContent = 'Signed in as admin';

  panel.append(label, toggle, publish, status);
  document.body.appendChild(panel);

  toggle.addEventListener('click', () => {
    setEditingActive(!editingActive);
  });

  publish.addEventListener('click', publishEditableContent);
  return panel;
}

function updateAdminPanel() {
  const toggle = document.getElementById('admin-edit-toggle');
  const publish = document.getElementById('admin-edit-publish');
  const status = document.getElementById('admin-edit-panel-status');
  if (!toggle || !publish || !status) return;

  toggle.textContent = editingActive ? 'Disable edit mode' : 'Enable edit mode';
  publish.disabled = !editingActive || !pageDirty;
  status.textContent = editingActive ? 'Edit mode is ON' : 'Signed in as admin';
}

async function setEditingActive(enabled) {
  if (!isAdminUser) return;
  editingActive = enabled;
  updateAdminPanel();

  if (enabled) {
    await loadSiteContent();
    applyAdminEditing();
  } else {
    clearAdminEditing();
  }
}

function markDirty(hasChanges = true) {
  pageDirty = hasChanges;
  updateAdminPanel();
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

function bindAdminEditableElement(el) {
  if (el.dataset.adminBound) return;

  if (el.tagName === 'IMG' && el.dataset.contentType === 'image') {
    el.addEventListener('click', async (event) => {
      if (!editingActive || !isAdminUser) return;
      event.preventDefault();
      event.stopPropagation();
      const current = getElementValue(el);
      const newSrc = window.prompt('Enter image URL:', current);
      if (newSrc && newSrc.trim() !== '' && newSrc !== current) {
        setElementValue(el, newSrc.trim());
        el.dataset.prevContent = el.dataset.prevContent || current;
        markDirty(true);
        el.classList.add('editing');
      }
    });
    el.style.cursor = 'pointer';
  } else {
    el.addEventListener('input', () => {
      if (!editingActive || !isAdminUser) return;
      markDirty(getElementValue(el) !== (el.dataset.prevContent || ''));
    });

    el.addEventListener('keydown', (event) => {
      if (!editingActive || !isAdminUser) return;
      if (event.key === 'Enter' && !event.shiftKey && el.isContentEditable) {
        event.preventDefault();
        el.blur();
      }
    });

    el.addEventListener('focus', () => {
      if (!editingActive || !isAdminUser) return;
      el.classList.add('editing');
    });

    el.addEventListener('blur', () => {
      if (!editingActive || !isAdminUser) return;
      el.classList.remove('editing');
    });
  }

  el.dataset.adminBound = 'true';
}

function applyAdminEditing() {
  if (!editingActive) return;
  createAdminPanel();

  getEditableElements().forEach((el) => {
    const value = getElementValue(el);
    el.dataset.prevContent = value;

    if (el.tagName === 'IMG' && el.dataset.contentType === 'image') {
      el.classList.add('admin-editable');
      el.dataset.editHint = IMAGE_HINT;
      el.setAttribute('aria-label', 'Editable image for admins. Click to change URL.');
      bindAdminEditableElement(el);
      return;
    }

    el.classList.add('admin-editable');
    el.dataset.editHint = EDIT_HINT;
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    el.setAttribute('aria-label', 'Editable text for admins. Press Enter to publish changes.');
    bindAdminEditableElement(el);
  });
}

function clearAdminEditing() {
  getEditableElements().forEach((el) => {
    el.classList.remove('admin-editable', 'editing');
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.removeAttribute('aria-label');
    el.removeAttribute('data-edit-hint');
  });
  markDirty(false);
}

async function publishEditableContent() {
  if (!isAdminUser) return;

  const elements = getEditableElements();
  if (!elements.length) return;

  const data = {};
  elements.forEach((el) => {
    const key = el.dataset.contentKey;
    const value = getElementValue(el);
    data[key] = value;
  });

  try {
    await setDoc(SITE_CONTENT_DOC, data, { merge: true });
    elements.forEach((el) => {
      el.dataset.prevContent = getElementValue(el);
    });
    markDirty(false);
    updateAdminPanel();
    showToast(SAVE_MESSAGE);
  } catch (err) {
    console.error('Failed to publish editable content', err);
    showToast(FAILED_MESSAGE);
  }
}

function initAdminWatcher() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));
      if (!adminSnap.exists()) return;
      isAdminUser = true;
      createAdminPanel();
      updateAdminPanel();
    } catch (err) {
      console.error('Admin verification failed', err);
    }
  });
}

function init() {
  loadSiteContent();
  initAdminWatcher();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
