/* SideQuest - Firebase Cloud Messaging service worker.
   Firebase web config is public by design; it is passed in from the app at
   registration time via query params so it can live in env vars. */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

const params = new URL(self.location.href).searchParams;
const config = {
  apiKey: params.get("apiKey") || "",
  authDomain: params.get("authDomain") || "",
  projectId: params.get("projectId") || "",
  storageBucket: params.get("storageBucket") || "",
  messagingSenderId: params.get("messagingSenderId") || "",
  appId: params.get("appId") || "",
};

if (config.projectId && config.apiKey) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const d = payload.data || {};
    const title = d.title || (payload.notification && payload.notification.title) || "SideQuest";
    const options = {
      body: d.body || (payload.notification && payload.notification.body) || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      image: d.image || undefined,
      tag: d.campaign_id || undefined,
      data: { deep_link: d.deep_link || "/home", action_url: d.action_url || "" },
      actions: d.action_label ? [{ action: "open_action", title: d.action_label }] : [],
    };
    return self.registration.showNotification(title, options);
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target =
    event.action === "open_action" && data.action_url ? data.action_url : data.deep_link || "/home";
  const url = new URL(target, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
