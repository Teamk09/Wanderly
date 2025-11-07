import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
} from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys: Array<keyof typeof firebaseConfig> = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    throw new Error(
      `Missing Firebase configuration value for ${key}. Check your Vite environment variables.`
    );
  }
}

const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Lazily load analytics only when supported to avoid SSR errors.
if (typeof window !== "undefined") {
  void isAnalyticsSupported().then((supported) => {
    if (supported) {
      getAnalytics(firebaseApp);
    }
  });
}

export const auth = getAuth(firebaseApp);
auth.useDeviceLanguage();
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
export const db = getFirestore(firebaseApp);
