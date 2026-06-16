// Firebase (CDN version for plain HTML/JS)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCTU-OyTtNPSe99xtl681yAKfPNayHyNg0",
  authDomain: "autexlogs.firebaseapp.com",
  projectId: "autexlogs",
  storageBucket: "autexlogs.appspot.com",
  messagingSenderId: "51671319885",
  appId: "1:51671319885:web:b12595c4b18902547c6304",
  measurementId: "G-TMNFSVBMTV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

// --- AUTHENTICATION LOGIC ---

// 1. Sign Up Handler
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Stop page refresh

    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    // Note: To save the "Name", you would typically use updateProfile(auth.currentUser, { displayName: name })

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        alert("Account created successfully! Welcome " + user.email);
        
        // Optional: Close modal automatically if your scripts.js supports it
        signupForm.reset();
        document.getElementById('signup-modal').setAttribute('aria-hidden', 'true');
      })
      .catch((error) => {
        console.error("Signup Error:", error.message);
        alert("Signup failed: " + error.message);
      });
  });
}

// 2. Log In Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Stop page refresh

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        alert("Logged in successfully! Hello, " + user.email);
        
        // Optional: Close modal automatically
        loginForm.reset();
        document.getElementById('login-modal').setAttribute('aria-hidden', 'true');
      })
      .catch((error) => {
        console.error("Login Error:", error.message);
        alert("Login failed: " + error.message);
      });
  });
}