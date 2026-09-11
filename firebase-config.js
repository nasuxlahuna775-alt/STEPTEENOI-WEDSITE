/**
 * firebase-config.js — Firebase config
 * Configured with actual Firebase credentials.
 */
var firebaseConfig = {
  apiKey: "AIzaSyBwKXYJji4qQNoOvhcqpDBWHdpPLQ4sXJ0",
  authDomain: "tarsaray1.firebaseapp.com",
  databaseURL: "https://tarsaray1-default-rtdb.firebaseio.com",
  projectId: "tarsaray1",
  storageBucket: "tarsaray1.firebasestorage.app",
  messagingSenderId: "782765725846",
  appId: "1:782765725846:web:d645224c9942a0075acab7"
};

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}
