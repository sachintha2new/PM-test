// UoM Parking Management Service Worker
const CACHE_NAME = 'uom-parking-v3.0';
const OFFLINE_URL = '/offline.html';

// Resources to cache on install
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/service-worker.js',
  
  
  // Icons
  'https://github.com/sachintha2new/PM-test/blob/main/icons/favicon-3.png',
  'https://github.com/sachintha2new/PM-test/blob/main/icons/i1.png',
  'https://github.com/sachintha2new/PM-test/blob/main/icons/i2.png'
];

// Install event - precache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell and content');
        return cache.addAll(PRECACHE_RESOURCES)
          .then(() => {
            console.log('All resources cached successfully');
          })
          .catch(error => {
            console.error('Failed to cache resources:', error);
          });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Handle API/data requests differently
  if (event.request.url.includes('/api/')) {
    // Network first for API calls
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to cache it
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // For static resources: Cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached response
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          return fetch(event.request)
            .then(networkResponse => {
              // Check if valid response
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              
              // Clone the response to cache it
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return networkResponse;
            })
            .catch(() => {
              // If both cache and network fail, show offline page for HTML requests
              if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match(OFFLINE_URL);
              }
              
              // For other resources, return a fallback
              if (event.request.url.includes('.css')) {
                return new Response('body { background: #1a2980; color: white; }', {
                  headers: { 'Content-Type': 'text/css' }
                });
              }
              
              if (event.request.url.includes('.js')) {
                return new Response('console.log("Offline mode");', {
                  headers: { 'Content-Type': 'application/javascript' }
                });
              }
            });
        })
    );
  }
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-parking-data') {
    event.waitUntil(syncParkingData());
  }
});

// Push notification handler
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const data = event.data ? event.data.json() : {
    title: 'UoM Parking',
    body: 'You have a new notification',
    icon: 'https://github.com/sachintha2new/PM-test/blob/main/icons/favicon-3.png'
  };
  
  const options = {
    body: data.body,
    icon: data.icon || 'favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: 'https://img.icons8.com/color/96/000000/external-link.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: 'https://img.icons8.com/color/96/000000/delete-sign.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  } else if (event.action === 'close') {
    // Do nothing
  } else {
    // Default action when notification is clicked
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Periodically update cache in background


// Helper function for background sync
function syncParkingData() {
  // In a real app, this would sync local data with server
  console.log('Syncing parking data...');
  return Promise.resolve();
}

// Helper function to update cache
function updateCache() {
  console.log('Updating cache...');
  return caches.open(CACHE_NAME)
    .then(cache => {
      return Promise.all(
        PRECACHE_RESOURCES.map(url => {
          return fetch(url)
            .then(response => {
              if (response.status === 200) {
                return cache.put(url, response);
              }
            })
            .catch(() => {
              // Ignore errors for individual resources
            });
        })
      );
    });
}

// Message handler for communication from web app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

});





