const CACHE_NAME = 'studysphere-v1';
const STATIC_CACHE = 'studysphere-static-v1';
const DYNAMIC_CACHE = 'studysphere-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/Ai-services.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
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
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (API calls, etc.)
  if (!url.origin.includes(self.location.origin)) return;

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => response || fetch(request))
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response.ok) return response;

            // Cache successful responses
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));

            return response;
          })
          .catch(() => {
            // Return offline fallback for HTML pages
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered');

  if (event.tag === 'flashcard-sync') {
    event.waitUntil(syncFlashcards());
  }
});

async function syncFlashcards() {
  try {
    // Get pending flashcards from IndexedDB
    const pendingFlashcards = await getPendingFlashcards();

    for (const flashcard of pendingFlashcards) {
      try {
        // Sync with server
        await syncFlashcardWithServer(flashcard);
        // Mark as synced
        await markFlashcardSynced(flashcard.id);
      } catch (error) {
        console.error('Failed to sync flashcard:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for offline functionality
async function getPendingFlashcards() {
  // Implement IndexedDB logic here
  return [];
}

async function syncFlashcardWithServer(flashcard) {
  // Implement server sync logic here
  return Promise.resolve();
}

async function markFlashcardSynced(id) {
  // Implement sync marking logic here
  return Promise.resolve();
}

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: data.data
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});