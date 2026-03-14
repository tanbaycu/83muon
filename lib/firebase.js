import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB_BZGZ92rP0-cPR9wRsWyI2s0ge8bldvY",
  authDomain: "chochiem-73006.firebaseapp.com",
  projectId: "chochiem-73006",
  storageBucket: "chochiem-73006.firebasestorage.app",
  messagingSenderId: "346741833183",
  appId: "1:346741833183:web:f3afdd472afccc6c55186a",
  measurementId: "G-P33LPSNKKS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const storage = getStorage(app);
