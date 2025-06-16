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
const DEFAULT_CHANNEL = '__LAN__'; // Special channel name for LAN/UDP bridge

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
  server.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`KeyLink WSS relay listening on wss://0.0.0.0:${WS_PORT}`);
  });
} else {
  // Fallback to plain WS (for local/Fly.io, which terminates SSL at the edge)
  const http = require('http');
  server = http.createServer();
  wss = new WebSocket.Server({ server });
  server.listen(WS_PORT, '0.0.0.0', () => {
    console.log(`KeyLink WS relay listening on ws://0.0.0.0:${WS_PORT}`);
  });
}

// Store connected WebSocket clients by channel
const channels = new Map();

// Broadcast a message to all WebSocket clients in a specific channel
function broadcastWSToChannel(msg, channel) {
  const clients = channels.get(channel);
  if (!clients) return;

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

// Broadcast a message to all WebSocket clients except the sender in a specific channel
function broadcastWSToChannelExceptSender(msg, channel, senderWs) {
  const clients = channels.get(channel);
  if (!clients) return;

  for (const ws of clients) {
    if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
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
    // Forward to all WebSocket clients in the default LAN channel
    broadcastWSToChannel(msg, DEFAULT_CHANNEL);
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
wss.on('connection', (ws, req) => {
  // Use the URL path as the channel name. Default to LAN channel.
  const channel = req.url.slice(1) || DEFAULT_CHANNEL;

  // Add client to the channel
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }
  channels.get(channel).add(ws);

  console.log(`[Relay] New client connected to channel "${channel}". Total clients in channel: ${channels.get(channel).size}`);

  ws.on('message', (msg) => {
    try {
      // If client is in the LAN channel, also broadcast to UDP
      if (channel === DEFAULT_CHANNEL) {
        broadcastUDP(msg);
      }
      
      // Forward to all other WebSocket clients in the same channel
      broadcastWSToChannelExceptSender(msg, channel, ws);

    } catch (e) {
      console.error('WS->UDP/WS error:', e);
    }
  });

  ws.on('close', () => {
    const clients = channels.get(channel);
    if (clients) {
      clients.delete(ws);
      console.log(`[Relay] Client disconnected from channel "${channel}". Total clients in channel: ${clients.size}`);
      if (clients.size === 0) {
        channels.delete(channel);
        console.log(`[Relay] Channel "${channel}" is now empty and has been removed.`);
      }
    }
  });
});

// Forwards all KeyLink JSON messages between UDP multicast and WebSocket clients.
// Works with Max/MSP (udpsend/udpreceive), Node.js, browser, and more. 