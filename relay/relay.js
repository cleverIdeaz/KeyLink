// KeyLink Relay Server
// Bridges UDP multicast (LAN/Max/MSP/Node) and WebSocket (browser/mobile) for KeyLink protocol
// Usage: node relay.js

const dgram = require('dgram');
const WebSocket = require('ws');
const fs = require('fs');
const https = require('https');

// Configurable settings
const UDP_PORT = 20800; // KeyLink UDP port
const UDP_MULTICAST_ADDR = '239.255.60.60'; // Arbitrary multicast address
const WS_PORT = process.env.PORT || 20801; // WebSocket port for Fly.io

// UDP socket for multicast
const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

// HTTPS server for WSS
let server, wss;
if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
  server = https.createServer({
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  });
  wss = new WebSocket.Server({ server });
  server.listen(WS_PORT, () => {
    console.log(`KeyLink WSS relay listening on wss://localhost:${WS_PORT}`);
  });
} else {
  // Fallback to plain WS (for local/Fly.io, which terminates SSL at the edge)
  const http = require('http');
  server = http.createServer();
  wss = new WebSocket.Server({ server });
  server.listen(WS_PORT, () => {
    console.log(`KeyLink WS relay listening on ws://localhost:${WS_PORT}`);
  });
}

// Store connected WebSocket clients
let wsClients = new Set();
let wsIdCounter = 1;
const wsIds = new Map();

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
  const wsId = wsIdCounter++;
  wsIds.set(ws, wsId);
  console.log(`[Relay] New client connected. Total clients: ${wsClients.size}`);
  ws.on('message', (msg) => {
    try {
      // Forward to UDP multicast
      broadcastUDP(msg);
      // Log number of clients
      console.log(`[Relay] Broadcasting message from client ${wsId}. Total clients: ${wsClients.size}`);
      // Forward to all other WebSocket clients (except sender)
      for (const client of wsClients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          const clientId = wsIds.get(client);
          console.log(`[Relay] Forwarding message from client ${wsId} to client ${clientId}`);
          client.send(msg);
        }
      }
    } catch (e) {
      console.error('WS->UDP error:', e);
    }
  });
  ws.on('close', () => {
    wsClients.delete(ws);
    wsIds.delete(ws);
    console.log(`[Relay] Client ${wsId} disconnected. Total clients: ${wsClients.size}`);
  });
});

// Forwards all KeyLink JSON messages between UDP multicast and WebSocket clients.
// Works with Max/MSP (udpsend/udpreceive), Node.js, browser, and more. 