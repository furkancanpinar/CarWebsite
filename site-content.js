// site-content.js — Dynamic site text for homepage with admin edit mode
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged } from "./firebase.js";

const PAGE_DOC_PREFIX = "site";
const EDIT_HINT = "Click to edit";
const SAVE_MESSAGE = "Content published";
const NO_CHANGES_MESSAGE = "No changes to publish";
const FAILED_MESSAGE = "Publish failed";
const TOAST_DURATION = 1800;
let adminMode = false;
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
  if ('value' in el && el.value !== undefined) return el.value.trim();
  if (el.dataset.contentType === 'html') return el.innerHTML.trim();
  return el.textContent.trim();
}

function setElementValue(el, value) {
  if (value === undefined || value === null) return;
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

function createAdminPill() {
  if (document.getElementById('admin-edit-pill')) return;
  const pill = document.createElement('div');
  pill.id = 'admin-edit-pill';
  pill.className = 'admin-edit-mode-pill';
  pill.textContent = 'Admin edit mode enabled';
  document.body.appendChild(pill);
}

function createAdminControls(el) {
  if (el.dataset.adminControlsAttached) return null;

  const target = el.closest('a, button') || el;
  const wrapper = document.createElement('div');
  wrapper.className = 'admin-edit-wrapper';
  target.parentNode.insertBefore(wrapper, target);
  wrapper.appendChild(target);

  const toolbar = document.createElement('div');
  toolbar.className = 'admin-edit-toolbar';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'admin-edit-save button button-secondary-outline';
  saveBtn.textContent = 'Publish';

  const status = document.createElement('span');
  status.className = 'admin-edit-status';
  status.textContent = 'Not published';

  toolbar.append(saveBtn, status);
  wrapper.appendChild(toolbar);
  el.dataset.adminControlsAttached = 'true';

  saveBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const key = el.dataset.contentKey;
    const value = getElementValue(el);
    const previous = el.dataset.prevContent || '';

    if (value === previous) {
      status.textContent = NO_CHANGES_MESSAGE;
      status.classList.remove('published', 'publish-failed');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Publishing...';

    try {
      await setDoc(SITE_CONTENT_DOC, { [key]: value }, { merge: true });
      el.dataset.prevContent = value;
      status.textContent = SAVE_MESSAGE;
      status.classList.remove('publish-failed');
      status.classList.add('published');
      showToast(SAVE_MESSAGE);
    } catch (err) {
      console.error('Failed to publish editable content', err);
      status.textContent = FAILED_MESSAGE;
      status.classList.add('publish-failed');
      showToast(FAILED_MESSAGE);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Publish';
    }
  });

  el.addEventListener('input', () => {
    const value = getElementValue(el);
    status.textContent = value !== el.dataset.prevContent ? 'Ready to publish' : SAVE_MESSAGE;
    status.classList.remove('published', 'publish-failed');
  });

  return { saveBtn, status };
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

function applyAdminEditing() {
  if (adminMode === false) return;
  createAdminPill();

  getEditableElements().forEach((el) => {
    const controls = createAdminControls(el);
    const isInteractive = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);

    if (isInteractive) {
      if (controls) {
        el.dataset.prevContent = getElementValue(el);
      }
      return;
    }

    el.classList.add('admin-editable');
    el.dataset.editHint = EDIT_HINT;
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    el.setAttribute('aria-label', 'Editable text for admins. Press Enter to publish changes.');

    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    });

    el.addEventListener('focus', () => {
      el.classList.add('editing');
    });

    el.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    el.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
    });
  });
}

function initAdminWatcher() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));
      if (!adminSnap.exists()) return;
      adminMode = true;
      applyAdminEditing();
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
