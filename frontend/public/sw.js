self.addEventListener('push', e => {
  const data = e.data.json();
  console.log('Push Received...', data);
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    data: data.data
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.notification.data && e.notification.data.url) {
    if (clients.openWindow) {
      e.waitUntil(clients.openWindow(e.notification.data.url));
    }
  }
});
