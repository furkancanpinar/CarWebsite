// firebase.js — Firebase initialization + exports ONLY
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc, getDoc, setDoc, deleteDoc, updateDoc,
  collection, getDocs, query, where, orderBy,
  serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTU-OyTtNPSe99xtl681yAKfPNayHyNg0",
  authDomain: "autexlogs.firebaseapp.com",
  projectId: "autexlogs",
  storageBucket: "autexlogs.appspot.com",
  messagingSenderId: "51671319885",
  appId: "1:51671319885:web:b12595c4b18902547c6304",
  measurementId: "G-TMNFSVBMTV"
};

const app = initializeApp(firebaseConfig);

// Analytics loaded separately, non-blocking (no top-level await)
loadAnalytics(app);

function loadAnalytics(app) {
  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js")
    .then(({ getAnalytics }) => {
      try { getAnalytics(app); } catch { /* ignore */ }
    })
    .catch(() => { /* analytics not available */ });
}

// Services - defined first
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Exports at the bottom - all definitions are complete by now
export { auth, db, storage };

export {
  doc, getDoc, setDoc, deleteDoc, updateDoc,
  collection, getDocs, query, where, orderBy,
  serverTimestamp, Timestamp
};
export { ref, uploadBytes, getDownloadURL };
export {
  onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
};
