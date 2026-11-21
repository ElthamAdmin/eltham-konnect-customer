self.addEventListener("push", (event) => {
  const messages = {
    "At Warehouse": "Your package is at our warehouse.",
    "Ready for Pickup": "Your package is ready for pickup.",
  };

  let body = "You have a package update. Open the portal for details.";

  try {
    const payload = event.data?.json();
    if (payload && Object.hasOwn(messages, payload.status)) {
      body = messages[payload.status];
    }
  } catch {
    // Show the general update if the message cannot be read.
  }

  event.waitUntil(
    self.registration.showNotification("Eltham Konnect", {
      body,
      icon: "/icons/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const packagesUrl = new URL("/my-packages", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const packagesWindow = windows.find((client) => client.url === packagesUrl);

      if (packagesWindow) {
        await packagesWindow.focus();
        return;
      }

      await self.clients.openWindow(packagesUrl);
    })()
  );
});