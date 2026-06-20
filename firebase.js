// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
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
try { getAnalytics(app); } catch(e) { /* analytics optional */ }

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firestore helpers
export { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, getDocs, query, where, orderBy };

// Storage helpers
export { ref, uploadBytes, getDownloadURL };

// Auth helpers
export { onAuthStateChanged, signOut };

// ---- Sign Up ----
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: "Buyer",
        status: "Active",
        listings: 0,
        joinedAt: new Date()
      });
      alert("Account created! Welcome " + name);
      signupForm.reset();
      document.getElementById('signup-modal').setAttribute('aria-hidden', 'true');
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Signup failed: " + error.message);
    }
  });
}

// ---- Log In ----
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in!");
      loginForm.reset();
      document.getElementById('login-modal').setAttribute('aria-hidden', 'true');
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login failed: " + error.message);
    }
  });
}

// ---- Global Logout Helper ----
window.firebaseLogout = async function() {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
  }
};
