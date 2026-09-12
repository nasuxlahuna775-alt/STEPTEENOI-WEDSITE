/**
 * firebase-config.js — Firebase Realtime Database config
 * 
 * HOW TO SETUP:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (any name)
 * 3. Click "Add app" → Web app (</>) → Register
 * 4. Copy the config values below
 * 5. Go to Build → Realtime Database → Create database
 * 6. Set rules to: { "rules": { ".read": true, ".write": true } }
 * 7. Fill in YOUR config below
 */

// ========== YOUR FIREBASE CONFIG ==========
var firebaseConfig = {
  apiKey: "AIzaSyBwKXYJji4qQNoOvhcqpdBWHdpPLQ4sXJ0",
  authDomain: "tarsaray1.firebaseapp.com",
  databaseURL: "https://tarsaray1-default-rtdb.us-central1.firebasedatabase.app",
  projectId: "tarsaray1",
  storageBucket: "tarsaray1.firebasestorage.app",
  messagingSenderId: "782765725846",
  appId: "1:782765725846:web:d645224c9942a0075acab7",
  measurementId: "G-WF8T4DSX5D"
};
// ====================================================

// Check if config is filled
var FIREBASE_READY = false;
try {
  FIREBASE_READY = typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5
    && firebaseConfig.databaseURL && firebaseConfig.databaseURL.length > 5;
} catch(e) {}

// Initialize Firebase if configured
if (FIREBASE_READY) {
  try {
    // Load Firebase SDK from CDN if not already loaded
    if (typeof firebase === 'undefined') {
      var s1 = document.createElement('script');
      s1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
      document.head.appendChild(s1);
      var s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js';
      s2.onload = function() {
        firebase.initializeApp(firebaseConfig);
        console.log('[Firebase] Connected!');
        // Re-apply config from Firebase after connection
        if (typeof applySiteConfig === 'function') applySiteConfig();
        if (typeof loadAdminMembers === 'function') loadAdminMembers();
      };
      document.head.appendChild(s2);
    } else {
      firebase.initializeApp(firebaseConfig);
      console.log('[Firebase] Connected!');
    }
  } catch(e) {
    console.warn('[Firebase] Init failed:', e);
  }
} else {
  console.log('[Firebase] Not configured — using localStorage + demo data');
}
