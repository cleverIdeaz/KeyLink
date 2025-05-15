// KeyLink Relay Server
// Bridges UDP multicast (LAN/Max/MSP/Node) and WebSocket (browser/mobile) for KeyLink protocol
// Usage: node relay.js

const dgram = require('dgram');
const WebSocket = require('ws');

// Configurable settings
const UDP_PORT = 20800; // KeyLink UDP port
const UDP_MULTICAST_ADDR = '239.255.60.60'; // Arbitrary multicast address
const WS_PORT = 20801; // WebSocket port

// UDP socket for multicast
const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

// WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

// Store connected WebSocket clients
let wsClients = new Set();

// Broadcast a message to all WebSocket clients
function broadcastWS(msg) {
  for (const ws of wsClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

// Broadcast a message to UDP multicast
function broadcastUDP(msg) {
  const buf = Buffer.from(msg);
  udpSocket.send(buf, 0, buf.length, UDP_PORT, UDP_MULTICAST_ADDR);
}

// Handle incoming UDP messages
udpSocket.on('message', (msg, rinfo) => {
  try {
    // Forward to all WebSocket clients
    broadcastWS(msg);
  } catch (e) {
    console.error('UDP->WS error:', e);
  }
});

// Join multicast group and bind UDP socket
udpSocket.bind(UDP_PORT, () => {
  udpSocket.addMembership(UDP_MULTICAST_ADDR);
  udpSocket.setBroadcast(true);
  udpSocket.setMulticastTTL(128);
  console.log(`KeyLink UDP relay listening on ${UDP_MULTICAST_ADDR}:${UDP_PORT}`);
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.on('message', (msg) => {
    try {
      // Forward to UDP multicast
      broadcastUDP(msg);
    } catch (e) {
      console.error('WS->UDP error:', e);
    }
  });
  ws.on('close', () => wsClients.delete(ws));
});

console.log(`KeyLink WebSocket relay listening on ws://localhost:${WS_PORT}`);

// Forwards all KeyLink JSON messages between UDP multicast and WebSocket clients.
// Works with Max/MSP (udpsend/udpreceive), Node.js, browser, and more. 