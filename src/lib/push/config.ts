/**
 * Firebase Web config — these are PUBLISHABLE values (they ship in every
 * Firebase web app's bundle), so they live in code rather than in secrets.
 * Paste the values from Firebase console → Project settings → Your apps,
 * and the VAPID key from Cloud Messaging → Web Push certificates.
 * The private service-account credential stays server-side in
 * FIREBASE_SERVICE_ACCOUNT_JSON and is never exposed here.
 */
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

/** Cloud Messaging → Web Push certificates → Key pair (public). */
export const vapidKey = "";

export const pushConfigured =
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && vapidKey);

/** Service worker URL carrying the (public) config so the SW can init Firebase. */
export function swUrl() {
  const p = new URLSearchParams(firebaseConfig as Record<string, string>);
  return `/firebase-messaging-sw.js?${p.toString()}`;
}