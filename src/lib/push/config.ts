/** Firebase Web config — publishable values, supplied via env vars. */
export const firebaseConfig = {
  apiKey: import.meta.env['VITE_FIREBASE_API_KEY'] ?? "",
  authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] ?? "",
  projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'] ?? "",
  storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] ?? "",
  messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] ?? "",
  appId: import.meta.env['VITE_FIREBASE_APP_ID'] ?? "",
};

export const vapidKey = import.meta.env['VITE_FIREBASE_VAPID_KEY'] ?? "";

export const pushConfigured =
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && vapidKey);

/** Service worker URL carrying the (public) config so the SW can init Firebase. */
export function swUrl() {
  const p = new URLSearchParams(firebaseConfig as Record<string, string>);
  return `/firebase-messaging-sw.js?${p.toString()}`;
}