import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

let auth = null;
if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
} else {
  console.warn(
    "⚠️  Firebase is not configured. Copy client/.env.example to client/.env and fill in your Firebase project's web config."
  );
}

export { auth };
