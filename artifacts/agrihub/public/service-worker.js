<<<<<<< HEAD
const CACHE_NAME = "agrihub-v2";
=======
const CACHE_NAME = "agrihub-v1";
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/community.html",
  "/land-market.html",
  "/profile.html",
<<<<<<< HEAD
  "/favicon.svg",
=======
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn("AgriHub SW: Some assets failed to cache during install", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") return response;
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => {
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html");
          }
        });
    })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "AgriHub Alert", body: "Check your crops!" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
<<<<<<< HEAD
      icon: "/favicon.svg",
      badge: "/favicon.svg",
=======
      icon: "/manifest.json",
      badge: "/manifest.json",
>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
      tag: "agrihub-alert",
      requireInteraction: true,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      const url = event.notification.data?.url || "/";
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
