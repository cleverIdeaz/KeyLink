// KeyLink Demo Service Worker with Local Relay
const CACHE_NAME = 'keylink-demo-v3';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/KeyLink.svg',
  '/favicon.ico'
];

// Local relay server for offline LAN mode
let localRelay = null;

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'keylink-sync') {
    event.waitUntil(handleKeyLinkSync());
  }
});

// Handle KeyLink sync
async function handleKeyLinkSync() {
  try {
    // Start local relay if not running
    if (!localRelay) {
      await startLocalRelay();
    }
  } catch (error) {
    console.error('KeyLink sync failed:', error);
  }
}

// Start local relay server
async function startLocalRelay() {
  try {
    // Create a minimal relay using WebRTC or WebSocket server
    // For now, we'll use a simple message passing approach
    localRelay = {
      clients: new Set(),
      udpMessages: [],
      isRunning: true
    };
    
    console.log('Local relay started');
    
    // Broadcast to all clients that local relay is available
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'localRelayStarted',
          port: 20801
        });
      });
    });
    
  } catch (error) {
    console.error('Failed to start local relay:', error);
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'startLocalRelay':
      startLocalRelay();
      break;
      
    case 'stopLocalRelay':
      if (localRelay) {
        localRelay.isRunning = false;
        localRelay = null;
      }
      break;
      
    case 'broadcastMessage':
      if (localRelay && localRelay.isRunning) {
        // Broadcast to all other clients
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            if (client !== event.source) {
              client.postMessage({
                type: 'localMessage',
                data: data
              });
            }
          });
        });
      }
      break;
  }
}); 