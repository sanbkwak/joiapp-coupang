// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword  } from "firebase/auth";
import { getApps } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZTPyCw77sEAWJ6vdXnYEHEKmS7n9QgL4",
  authDomain: "joiapp-coupang-716f2.firebaseapp.com",
  projectId: "joiapp-coupang-716f2",
  storageBucket: "joiapp-coupang-716f2.firebasestorage.app",
  messagingSenderId: "810063881208",
  appId: "1:810063881208:web:6a7841dbb713f4815d2c0d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// after calling initializeApp(...)
console.log('🔥 Firebase apps:', getApps());
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


export { app, analytics, db, auth, provider, signInWithPopup, signInWithEmailAndPassword };