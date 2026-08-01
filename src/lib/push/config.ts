import type { FirebaseOptions } from "firebase/app";

/**
 * Firebase Web config — these are PUBLISHABLE values (they ship in every
 * Firebase web app's bundle), so they live in code rather than in secrets.
 * The private service-account credential stays server-side in
 * FIREBASE_SERVICE_ACCOUNT_JSON and is never exposed here.
 */

/**
 * PASTE YOUR FIREBASE WEB API KEY HERE ("AIza...").
 * Firebase console → Project settings → Your apps → SDK setup → apiKey.
 * It is public by design (protected by Firebase security rules + key
 * restrictions), so it must be a literal here — browser code cannot read
 * backend secrets. Optionally override via VITE_FIREBASE_API_KEY.
 */
const FIREBASE_API_KEY = "";

const apiKey = (import.meta.env['VITE_FIREBASE_API_KEY'] as string | undefined) || FIREBASE_API_KEY;

export const firebaseConfig: FirebaseOptions & Record<string, string> = {
  apiKey,
  authDomain: "side-quest-1c186.firebaseapp.com",
  projectId: "side-quest-1c186",
  storageBucket: "side-quest-1c186.firebasestorage.app",
  messagingSenderId: "880111479799",
  appId: "1:880111479799:web:10a525c1a5e223c319dcf2",
  measurementId: "G-D5Y4C6RX6Y",
};

/** Cloud Messaging → Web Push certificates → Key pair (public). */
export const vapidKey =
  "BOXBg44ADayquld0Td4ddIi1iDaivCvgj7YZFrx76M1fyPvsyLr0hYe-0U64UV0IhYK5qBqmmYBMVac0X_OPyms";

export const pushConfigured =
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && vapidKey);

/** Service worker URL carrying the (public) config so the SW can init Firebase. */
export function swUrl() {
  const p = new URLSearchParams(firebaseConfig as Record<string, string>);
  return `/firebase-messaging-sw.js?${p.toString()}`;
}