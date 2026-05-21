const CACHE_NAME = "agrihub-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/community.html",
  "/land-market.html",
  "/profile.html",
  "/learning.html",
  "/smart-home.html",
  "/payment.html",
  "/manifest.json",
  "/favicon.svg",
  "/theme.css",
  "/theme-engine.js",
  "/agrihub-ui.css",
  "/agrihub-products.js",
  "/agrihub-icons.js"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener("fetch", (e) => {
  // Avoid caching API requests
  if (e.request.url.includes("/api/")) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

// Alarm / Push Notification Event
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "CROP_ALARM") {
    self.registration.showNotification("🌾 Crop Alarm Triggered!", {
      body: `It is time to: ${e.data.message}`,
      icon: "/icon-192.png",
      vibrate: [200, 100, 200]
    });
  }
});
