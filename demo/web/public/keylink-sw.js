// KeyLink Zero-Config Service Worker
// Handles background peer discovery and caching

const KEYLINK_PORT = 20801;
const CACHE_NAME = 'keylink-v' + Date.now();

// Install event - cache essential resources and force update
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/keylink-standards.json',
        '/KeyLink.png'
      ]);
    }).then(() => {
      // Force update for mobile Safari
      self.skipWaiting();
    })
  );
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Background peer discovery using WebRTC
let discoveryInterval = null;
let peerConnections = new Map();
let dataChannels = new Map();
let localPeerId = generatePeerId();

function generatePeerId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function startPeerDiscovery() {
  console.log('Service Worker: Starting WebRTC peer discovery...');
  
  // Create signaling peer connection
  const signalingPC = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });

  // Create signaling data channel
  const signalingChannel = signalingPC.createDataChannel('keylink-signaling', {
    ordered: true
  });

  signalingChannel.onopen = () => {
    console.log('Service Worker: Signaling channel opened');
    broadcastDiscovery();
  };

  signalingChannel.onmessage = (event) => {
    handleSignalingMessage(event.data);
  };

  // Handle incoming data channels
  signalingPC.ondatachannel = (event) => {
    const channel = event.channel;
    if (channel.label === 'keylink-signaling') {
      channel.onmessage = (event) => {
        handleSignalingMessage(event.data);
      };
    } else if (channel.label === 'keylink-data') {
      setupDataChannel(channel);
    }
  };

  // Create offer for discovery
  const offer = await signalingPC.createOffer();
  await signalingPC.setLocalDescription(offer);

  // Store signaling connection
  peerConnections.set('signaling', signalingPC);

  // Start periodic discovery
  discoveryInterval = setInterval(() => {
    broadcastDiscovery();
  }, 5000);
}

function broadcastDiscovery() {
  const signalingChannel = dataChannels.get('signaling');
  if (signalingChannel?.readyState === 'open') {
    const discoveryMessage = {
      type: 'discovery',
      peerId: localPeerId,
      timestamp: Date.now(),
      source: 'service-worker'
    };
    signalingChannel.send(JSON.stringify(discoveryMessage));
  }
}

async function handleSignalingMessage(data) {
  try {
    const message = typeof data === 'string' ? JSON.parse(data) : data;
    
    switch (message.type) {
      case 'discovery':
        await handleDiscovery(message);
        break;
      case 'offer':
        await handleOffer(message);
        break;
      case 'answer':
        await handleAnswer(message);
        break;
      case 'ice-candidate':
        await handleICECandidate(message);
        break;
    }
  } catch (error) {
    console.error('Service Worker: Error handling signaling message:', error);
  }
}

async function handleDiscovery(message) {
  if (message.peerId === localPeerId) return;

  console.log(`Service Worker: Discovered peer: ${message.peerId}`);
  
  // Create peer connection
  const peerPC = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });

  // Create data channel
  const dataChannel = peerPC.createDataChannel('keylink-data', {
    ordered: true
  });

  setupDataChannel(dataChannel);

  // Store peer connection
  peerConnections.set(message.peerId, peerPC);
  dataChannels.set(message.peerId, dataChannel);

  // Create and send offer
  const offer = await peerPC.createOffer();
  await peerPC.setLocalDescription(offer);

  const offerMessage = {
    type: 'offer',
    peerId: localPeerId,
    targetPeerId: message.peerId,
    offer: offer
  };

  const signalingChannel = dataChannels.get('signaling');
  if (signalingChannel?.readyState === 'open') {
    signalingChannel.send(JSON.stringify(offerMessage));
  }
}

async function handleOffer(message) {
  if (message.targetPeerId !== localPeerId) return;

  console.log(`Service Worker: Received offer from ${message.peerId}`);

  const peerPC = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });

  // Handle incoming data channel
  peerPC.ondatachannel = (event) => {
    if (event.channel.label === 'keylink-data') {
      setupDataChannel(event.channel);
      dataChannels.set(message.peerId, event.channel);
    }
  };

  // Store peer connection
  peerConnections.set(message.peerId, peerPC);

  // Set remote description
  await peerPC.setRemoteDescription(new RTCSessionDescription(message.offer));

  // Create and send answer
  const answer = await peerPC.createAnswer();
  await peerPC.setLocalDescription(answer);

  const answerMessage = {
    type: 'answer',
    peerId: localPeerId,
    targetPeerId: message.peerId,
    answer: answer
  };

  const signalingChannel = dataChannels.get('signaling');
  if (signalingChannel?.readyState === 'open') {
    signalingChannel.send(JSON.stringify(answerMessage));
  }
}

async function handleAnswer(message) {
  if (message.targetPeerId !== localPeerId) return;

  console.log(`Service Worker: Received answer from ${message.peerId}`);

  const peerPC = peerConnections.get(message.peerId);
  if (peerPC) {
    await peerPC.setRemoteDescription(new RTCSessionDescription(message.answer));
  }
}

async function handleICECandidate(message) {
  if (message.targetPeerId !== localPeerId) return;

  const peerPC = peerConnections.get(message.peerId);
  if (peerPC) {
    await peerPC.addIceCandidate(new RTCIceCandidate(message.candidate));
  }
}

function setupDataChannel(channel) {
  channel.onopen = () => {
    console.log(`Service Worker: Data channel opened: ${channel.label}`);
    
    // Notify main thread of new connection
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'peer-connected',
          channel: channel.label,
          peerId: Array.from(peerConnections.keys()).find(key => 
            dataChannels.get(key) === channel
          )
        });
      });
    });
  };

  channel.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Forward messages to main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'peer-message',
            data: data,
            channel: channel.label
          });
        });
      });
    } catch (error) {
      console.error('Service Worker: Error parsing data channel message:', error);
    }
  };

  channel.onclose = () => {
    console.log(`Service Worker: Data channel closed: ${channel.label}`);
    
    // Notify main thread of disconnection
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'peer-disconnected',
          channel: channel.label
        });
      });
    });
  };
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'start-discovery':
      startPeerDiscovery();
      break;
    case 'stop-discovery':
      if (discoveryInterval) {
        clearInterval(discoveryInterval);
        discoveryInterval = null;
      }
      // Close all connections
      peerConnections.forEach(peer => peer.close());
      peerConnections.clear();
      dataChannels.clear();
      break;
    case 'send-message':
      // Forward message to all connected peers
      const messageStr = JSON.stringify(data);
      dataChannels.forEach(channel => {
        if (channel.readyState === 'open') {
          channel.send(messageStr);
        }
      });
      break;
  }
});

// Start discovery when service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    startPeerDiscovery()
  );
}); 