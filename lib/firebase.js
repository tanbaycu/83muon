import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAewM8I0Tgk7G7ZKMzdM8WPg5rQT-K644w",
  authDomain: "makeyourwish-4fa49.firebaseapp.com",
  projectId: "makeyourwish-4fa49",
  storageBucket: "makeyourwish-4fa49.firebasestorage.app",
  messagingSenderId: "281281429128",
  appId: "1:281281429128:web:d65cf55b1785c8cc67e93d",
  measurementId: "G-WGSVEV5NYJ",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const storage = getStorage(app);
