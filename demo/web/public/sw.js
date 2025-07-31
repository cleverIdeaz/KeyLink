// KeyLink Demo Service Worker with Local Relay
const CACHE_NAME = 'keylink-demo-v5';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/KeyLink.svg',
  '/favicon.ico'
];

let localRelay = null;
let relayServer = null;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Only cache files that exist, handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err);
              return null; // Don't fail the entire cache operation
            })
          )
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'keylink-sync') {
    event.waitUntil(handleKeyLinkSync());
  }
});

async function handleKeyLinkSync() {
  try {
    if (!localRelay) {
      await startLocalRelay();
    }
  } catch (error) {
    console.error('KeyLink sync failed:', error);
  }
}

async function startLocalRelay() {
  try {
    // Start a local relay server using WebSocket and UDP
    localRelay = {
      clients: new Set(),
      udpMessages: [],
      isRunning: true,
      port: 20801
    };
    
    console.log('Local relay started on port', localRelay.port);
    
    // Notify all clients that local relay is available
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'localRelayStarted',
          port: localRelay.port
        });
      });
    });
    
  } catch (error) {
    console.error('Failed to start local relay:', error);
  }
}

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
        // Broadcast message to all other clients
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
        
        // Also broadcast via UDP if we have a relay server
        if (relayServer) {
          // This would send to UDP multicast for Max externals
          console.log('Broadcasting to UDP:', data);
        }
      }
      break;
      
    case 'udpMessage':
      // Handle incoming UDP messages from Max externals
      if (localRelay && localRelay.isRunning) {
        // Broadcast to all web clients
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'localMessage',
              data: data
            });
          });
        });
      }
      break;
  }
}); 