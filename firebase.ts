import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyATl3aZY837F1dGP3UeZ2ex_ArST5UcZU0",
  authDomain: "onflow-a4d1c.firebaseapp.com",
  projectId: "onflow-a4d1c",
  storageBucket: "onflow-a4d1c.firebasestorage.app",
  messagingSenderId: "37558351562",
  appId: "1:37558351562:web:064a9fcfb8d77311552633",
  measurementId: "G-2NWT64TYW9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics };
