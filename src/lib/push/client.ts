import { firebaseConfig, pushConfigured, swUrl, vapidKey } from "./config";
import { savePushToken } from "@/lib/push.functions";

const LAST_TOKEN_KEY = "sq_fcm_token_v1";
export const PUSH_ASKED_KEY = "sq_push_asked_v1";

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

export function pushReady() {
  return pushSupported() && pushConfigured;
}

async function getMessagingInstance() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { getMessaging, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return null;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getMessaging(app);
}

async function registerSw() {
  return navigator.serviceWorker.register(swUrl(), { scope: "/" });
}

/** Fetches (or rotates) the FCM token and persists it against the signed-in user. */
export async function syncPushToken(): Promise<string | null> {
  if (!pushReady() || Notification.permission !== "granted") return null;
  const messaging = await getMessagingInstance();
  if (!messaging) return null;
  const { getToken } = await import("firebase/messaging");
  const registration = await registerSw();
  await navigator.serviceWorker.ready;
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) return null;
  const previous = localStorage.getItem(LAST_TOKEN_KEY);
  await savePushToken({
    data: {
      token,
      user_agent: navigator.userAgent.slice(0, 300),
      replaces: previous && previous !== token ? previous : null,
    },
  });
  localStorage.setItem(LAST_TOKEN_KEY, token);
  return token;
}

/** Asks the browser for permission, then registers the token. */
export async function enablePush(): Promise<NotificationPermission | "unsupported"> {
  if (!pushReady()) return "unsupported";
  localStorage.setItem(PUSH_ASKED_KEY, "1");
  const permission = await Notification.requestPermission();
  if (permission === "granted") await syncPushToken();
  return permission;
}

/** Foreground messages: Firebase does not show a notification, so we surface it. */
export async function listenForeground(handler: (p: Record<string, string>) => void) {
  if (!pushReady() || Notification.permission !== "granted") return () => {};
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, (payload) => {
    handler({ ...(payload.data ?? {}) } as Record<string, string>);
  });
}