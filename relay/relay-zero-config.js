// KeyLink Zero-Config Relay Server
// Enhanced relay with automatic discovery and health checks
// Usage: node relay-zero-config.js

const dgram = require('dgram');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const https = require('https');
const os = require('os');

// Configurable settings
const UDP_PORT = process.env.UDP_PORT || 7474;
const UDP_MULTICAST_ADDR = process.env.UDP_MULTICAST_ADDR || '239.255.0.1';
const WS_PORT = process.env.PORT || 20801;
const DEFAULT_CHANNEL = '__LAN__';
const ENABLE_UDP = process.env.ENABLE_UDP !== 'false';
const AUTO_DISCOVERY = process.env.AUTO_DISCOVERY !== 'false';

// Get local network info
function getLocalNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const localIPs = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        localIPs.push({
          name: name,
          address: interface.address,
          netmask: interface.netmask,
          cidr: interface.cidr
        });
      }
    }
  }
  
  return localIPs;
}

// UDP socket for multicast
const udpSocket = ENABLE_UDP ? dgram.createSocket({ type: 'udp4', reuseAddr: true }) : null;

// HTTP server for health checks and WebSocket
let server, wss;

// Create HTTP server with health check endpoint
server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'KeyLink Relay',
      version: '2.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      network: getLocalNetworkInfo(),
      connections: {
        websocket: wss ? wss.clients.size : 0,
        udp: ENABLE_UDP ? 'enabled' : 'disabled'
      }
    }));
    return;
  }
  
  // Discovery endpoint
  if (req.url === '/discover') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'KeyLink Relay',
      port: WS_PORT,
      udpPort: UDP_PORT,
      multicastAddr: UDP_MULTICAST_ADDR,
      network: getLocalNetworkInfo()
    }));
    return;
  }
  
  // Default response
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('KeyLink Relay Server - Use /health for status');
});

// WebSocket server
wss = new WebSocket.Server({ server });

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
  if (!ENABLE_UDP || !udpSocket) return;
  const buf = Buffer.from(msg);
  udpSocket.send(buf, 0, buf.length, UDP_PORT, UDP_MULTICAST_ADDR);
}

// Handle incoming UDP messages
if (ENABLE_UDP && udpSocket) {
  udpSocket.on('message', (msg, rinfo) => {
    try {
      console.log(`[UDP] Received from ${rinfo.address}:${rinfo.port}`);
      // Forward to all WebSocket clients in the default LAN channel
      broadcastWSToChannel(msg, DEFAULT_CHANNEL);
    } catch (e) {
      console.error('UDP->WS error:', e);
    }
  });
}

// Join multicast group and bind UDP socket
if (ENABLE_UDP && udpSocket) {
  udpSocket.bind(UDP_PORT, () => {
    udpSocket.addMembership(UDP_MULTICAST_ADDR);
    udpSocket.setBroadcast(true);
    udpSocket.setMulticastTTL(128);
    console.log(`[UDP] Listening on ${UDP_MULTICAST_ADDR}:${UDP_PORT}`);
  });
} else {
  console.log('[UDP] Multicast disabled (ENABLE_UDP=false)');
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  // Use the URL path as the channel name. Default to LAN channel.
  const channel = req.url.slice(1) || DEFAULT_CHANNEL;

  // Add client to the channel
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }
  channels.get(channel).add(ws);

  console.log(`[WS] New client connected to channel "${channel}". Total clients: ${channels.get(channel).size}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    channel: channel,
    timestamp: new Date().toISOString(),
    server: {
      version: '2.0.0',
      network: getLocalNetworkInfo()
    }
  }));

  ws.on('message', (msg) => {
    try {
      console.log(`[WS] Received message in channel "${channel}"`);
      
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
      console.log(`[WS] Client disconnected from channel "${channel}". Total clients: ${clients.size}`);
      if (clients.size === 0) {
        channels.delete(channel);
        console.log(`[WS] Channel "${channel}" is now empty and has been removed.`);
      }
    }
  });
});

// Start the server
server.listen(WS_PORT, '0.0.0.0', () => {
  const localIPs = getLocalNetworkInfo();
  console.log(`[HTTP] Server listening on port ${WS_PORT}`);
  console.log(`[HTTP] Health check available at http://localhost:${WS_PORT}/health`);
  console.log(`[HTTP] Discovery available at http://localhost:${WS_PORT}/discover`);
  
  if (localIPs.length > 0) {
    console.log('[NETWORK] Available network interfaces:');
    localIPs.forEach(iface => {
      console.log(`  - ${iface.name}: ${iface.address}/${iface.cidr}`);
    });
  }
  
  console.log(`[INFO] KeyLink Zero-Config Relay Server v2.0.0 started`);
  console.log(`[INFO] UDP Multicast: ${ENABLE_UDP ? 'enabled' : 'disabled'}`);
  console.log(`[INFO] Auto Discovery: ${AUTO_DISCOVERY ? 'enabled' : 'disabled'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[INFO] Shutting down KeyLink Relay Server...');
  
  if (udpSocket) {
    udpSocket.close();
  }
  
  if (wss) {
    wss.close();
  }
  
  if (server) {
    server.close();
  }
  
  process.exit(0);
});

// Export for use as module
module.exports = {
  server,
  wss,
  udpSocket,
  getLocalNetworkInfo,
  broadcastUDP,
  broadcastWSToChannel
}; 