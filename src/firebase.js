// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbGAGaeqw1TwmFoxFVX19LV8c1R3773lc",
  authDomain: "real-time-chat-app-ef833.firebaseapp.com",
  projectId: "real-time-chat-app-ef833",
  storageBucket: "real-time-chat-app-ef833.firebasestorage.app",
  messagingSenderId: "983505650599",
  appId: "1:983505650599:web:4b55d2486f24369aeb6c82",
  measurementId: "G-DX7S0FLPBE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

// Export app
export default app;