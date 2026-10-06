// Minimal service worker for the timer spike. It exists so that:
//  1. notifications can be shown via registration.showNotification()
//     (required on Android Chrome),
//  2. a Web Push from our server can wake the phone and show the
//     "Rest over" notification even when the app is locked or in the
//     background (the page's own JavaScript is frozen then), and
//  3. the app can be installed as a PWA.
// It does no page caching. The Cache below only stores push arrival times.

const RECEIPT_CACHE = "settimer-push"; // must match src/lib/push/client.ts

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// The server sends { endTime }. iOS requires that every push shows a
// notification, so we always do.
self.addEventListener("push", (event) => {
  const receivedAt = Date.now();
  let endTime = null;
  try {
    endTime = event.data ? event.data.json().endTime : null;
  } catch {
    // Payload wasn't JSON; still show the notification.
  }

  event.waitUntil(
    (async () => {
      // 1. Record when the push arrived, so the page can log the real lag
      //    even if it was frozen when this happened.
      if (endTime !== null) {
        const cache = await caches.open(RECEIPT_CACHE);
        await cache.put(`/push-received/${endTime}`, new Response(String(receivedAt)));
      }
      // 2. Show the alert. Same tag as the in-page alert, so the two replace
      //    each other instead of stacking. renotify makes a replacement still
      //    make a sound.
      await self.registration.showNotification("Rest over", {
        body: "Time for your next set.",
        tag: "settimer-rest",
        renotify: true,
      });
      // 3. If the page is alive, tell it right away.
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        client.postMessage({ type: "push-received", endTime, receivedAt });
      }
    })(),
  );
});

// Tapping the notification brings the app back to the front.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/");
    }),
  );
});
