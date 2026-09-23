import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrkQFR7bxcbvCytaQPaYFQriKxeQUIxZg",
  authDomain: "pubginfo-web-registr.firebaseapp.com",
  projectId: "pubginfo-web-registr",
  storageBucket: "pubginfo-web-registr.firebasestorage.app",
  messagingSenderId: "673173742278",
  appId: "1:673173742278:web:efdefd9cce6e72ba162dc7",
  measurementId: "G-8X4CKQ6DWR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
