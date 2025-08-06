// KeyLink Zero-Config Service Worker
// Handles automatic peer discovery and WebRTC signaling

const CACHE_NAME = 'keylink-p2p-v1';
const DISCOVERY_INTERVAL = 5000; // 5 seconds
const KEYLINK_PORT = 20801;

let discoveryInterval = null;
let connectedPeers = new Set();

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[KeyLink SW] Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css'
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[KeyLink SW] Activating service worker');
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

// Handle messages from the main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_DISCOVERY':
      startPeerDiscovery();
      break;
      
    case 'STOP_DISCOVERY':
      stopPeerDiscovery();
      break;
      
    case 'SEND_MESSAGE':
      broadcastToPeers(data);
      break;
      
    case 'GET_PEERS':
      event.ports[0].postMessage({
        type: 'PEERS_LIST',
        peers: Array.from(connectedPeers)
      });
      break;
  }
});

// Start automatic peer discovery
function startPeerDiscovery() {
  if (discoveryInterval) {
    clearInterval(discoveryInterval);
  }
  
  console.log('[KeyLink SW] Starting peer discovery');
  
  // Initial discovery
  discoverPeers();
  
  // Periodic discovery
  discoveryInterval = setInterval(discoverPeers, DISCOVERY_INTERVAL);
}

// Stop peer discovery
function stopPeerDiscovery() {
  if (discoveryInterval) {
    clearInterval(discoveryInterval);
    discoveryInterval = null;
  }
  console.log('[KeyLink SW] Stopped peer discovery');
}

// Discover peers on local network
async function discoverPeers() {
  try {
    // Get local network IPs to scan
    const localIPs = await getLocalNetworkIPs();
    
    for (const ip of localIPs) {
      await tryConnectToPeer(ip);
    }
  } catch (error) {
    console.log('[KeyLink SW] Discovery error:', error);
  }
}

// Get local network IP ranges
async function getLocalNetworkIPs() {
  const ips = [];
  
  // Common local network ranges
  const ranges = [
    '192.168.1',
    '192.168.0',
    '10.0.0',
    '10.0.1',
    '172.16.0',
    '172.16.1'
  ];
  
  // Generate IPs to scan (limit to first 50 for performance)
  for (const range of ranges) {
    for (let i = 1; i <= 50; i++) {
      ips.push(`${range}.${i}`);
    }
  }
  
  return ips;
}

// Try to connect to a peer at specific IP
async function tryConnectToPeer(ip) {
  try {
    // Try WebSocket connection to KeyLink relay
    const response = await fetch(`http://${ip}:${KEYLINK_PORT}/health`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    
    // If we get a response, try WebSocket connection
    await connectToRelay(ip);
    
  } catch (error) {
    // Not a KeyLink peer, continue
  }
}

// Connect to KeyLink relay server
async function connectToRelay(ip) {
  try {
    const ws = new WebSocket(`ws://${ip}:${KEYLINK_PORT}`);
    
    ws.onopen = () => {
      console.log(`[KeyLink SW] Connected to relay at ${ip}`);
      connectedPeers.add(ip);
      
      // Notify main app
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PEER_CONNECTED',
            ip: ip
          });
        });
      });
    };
    
    ws.onmessage = (event) => {
      // Forward messages to main app
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'MESSAGE_RECEIVED',
            data: event.data
          });
        });
      });
    };
    
    ws.onclose = () => {
      console.log(`[KeyLink SW] Disconnected from relay at ${ip}`);
      connectedPeers.delete(ip);
      
      // Notify main app
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PEER_DISCONNECTED',
            ip: ip
          });
        });
      });
    };
    
    ws.onerror = (error) => {
      console.log(`[KeyLink SW] WebSocket error for ${ip}:`, error);
    };
    
  } catch (error) {
    console.log(`[KeyLink SW] Failed to connect to ${ip}:`, error);
  }
}

// Broadcast message to all connected peers
function broadcastToPeers(message) {
  // This would be implemented to send to all connected WebSocket connections
  console.log('[KeyLink SW] Broadcasting message:', message);
}

// Handle fetch events (for caching)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

console.log('[KeyLink SW] Service worker loaded'); 