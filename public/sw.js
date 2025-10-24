// Service Worker for Family Expense Tracker
const CACHE_NAME = 'expense-tracker-v1';
const urlsToCache = [
  '/',
  '/style.css',
  '/script.js',
  '/offline-storage.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('[SW] Failed to cache resources:', error);
      })
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all clients
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request).then(function(response) {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the response for future use
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(function(error) {
          console.error('[SW] Network fetch failed:', error);
          
          // Return offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          
          throw error;
        });
      })
  );
});

// Background sync event - sync data when online
self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'expense-sync') {
    event.waitUntil(syncExpenseData());
  }
});

async function syncExpenseData() {
  try {
    console.log('[SW] Starting expense data sync');
    
    // Open IndexedDB and sync pending data
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const pendingItems = await getAllFromStore(store);
    
    for (const item of pendingItems) {
      try {
        // Attempt to sync each item
        const response = await fetch('/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          // Remove from sync queue
          const deleteTransaction = db.transaction(['syncQueue'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('syncQueue');
          await deleteStore.delete(item.id);
          console.log('[SW] Synced item:', item.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
      }
    }
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FamilyExpenseTracker', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Push notification event
self.addEventListener('push', function(event) {
  console.log('[SW] Push notification received');
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const title = data.title || 'Family Expense Tracker';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/icon-72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Message event - communication with main app
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service Worker loaded successfully');