import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
];

if (requiredConfig.some((value) => !value)) {
  throw new Error(
    "Falta configuración de Firebase. Revisa las variables VITE_FIREBASE_*.",
  );
}

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

const authEmulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL?.trim();
if (authEmulatorUrl && import.meta.env.DEV) {
  const url = new URL(authEmulatorUrl);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.username || url.password || url.pathname !== "/") {
    throw new Error("VITE_FIREBASE_AUTH_EMULATOR_URL must point to a loopback Auth Emulator");
  }
  connectAuthEmulator(auth, url.href, { disableWarnings: true });
}

const firestoreEmulator = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST?.trim();
if (firestoreEmulator && import.meta.env.DEV) {
  const [host, rawPort] = firestoreEmulator.split(":");
  const port = Number(rawPort);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !["127.0.0.1", "localhost", "[::1]"].includes(host)) {
    throw new Error("VITE_FIRESTORE_EMULATOR_HOST must be a loopback host and valid port");
  }
  connectFirestoreEmulator(db, host, port);
}
