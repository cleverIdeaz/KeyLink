# KeyLink Relay Server

**Bridge between UDP multicast (Max/MSP) and WebSocket (PWA/Web) for real-time music sync**

## 🚀 Quick Start

### For PWA Users (Recommended)
```bash
# Download and install
git clone https://github.com/your-repo/KeyLink.git
cd KeyLink/relay

# Quick setup
./install.sh

# Start server
./start-relay.sh
```

### For Developers
```bash
cd relay
npm install
npm start
```

## 📱 PWA Integration

The relay server enables seamless communication between:
- **Max/MSP** (UDP multicast)
- **PWA Apps** (WebSocket)
- **Web Apps** (WebSocket with cloud fallback)

### Connection Flow
```
[Max/MSP] ←→ [Relay Server] ←→ [PWA/Web App]
     ↑              ↑              ↑
   UDP 7474    WebSocket 20801   Browser
```

## 🌐 Network Modes

### LAN Mode (Local Network)
- **PWA**: Connects directly to local relay
- **Web App**: Falls back to cloud relay
- **Max/MSP**: Direct UDP multicast
- **Latency**: ~1ms
- **Cost**: $0

### WAN Mode (Internet)
- **All clients**: Connect via cloud relay
- **Global access**: Works from anywhere
- **Latency**: ~50-200ms
- **Cost**: $5-50+/month

## 🔧 Configuration

### Environment Variables
```bash
# Network settings
UDP_PORT=7474                    # UDP multicast port
UDP_MULTICAST_ADDR=239.255.0.1   # Multicast address
WS_PORT=20801                    # WebSocket port
ENABLE_UDP=true                  # Enable UDP (false for cloud)

# Server settings
PORT=20801                       # WebSocket port (for Fly.io)
```

### Local Development
```bash
# Start with UDP enabled (default)
npm start

# Start with UDP disabled (for testing)
ENABLE_UDP=false npm start
```

### Cloud Deployment
```bash
# Deploy to Fly.io with UDP disabled
fly deploy --env ENABLE_UDP=false
```

## 📊 Protocol Bridge

### UDP → WebSocket
```
Max/MSP sends: {"type":"set-state","state":{"key":"C","mode":"Ionian"}}
Relay receives: UDP multicast on 239.255.0.1:7474
Relay forwards: WebSocket to all connected clients
PWA receives: {"type":"set-state","state":{"key":"C","mode":"Ionian"}}
```

### WebSocket → UDP
```
PWA sends: {"type":"set-state","state":{"key":"F#","mode":"Mixolydian"}}
Relay receives: WebSocket on ws://localhost:20801
Relay forwards: UDP multicast to 239.255.0.1:7474
Max/MSP receives: {"type":"set-state","state":{"key":"F#","mode":"Mixolydian"}}
```

## 🛠️ Installation Options

### Option 1: Quick Install (Recommended)
```bash
./install.sh
```

### Option 2: Manual Setup
```bash
npm install
npm start
```

### Option 3: System Service (Linux)
```bash
./install.sh
sudo systemctl enable keylink-relay
sudo systemctl start keylink-relay
```

## 🔍 Monitoring

### Log Output
```
KeyLink UDP relay listening on 239.255.0.1:7474
KeyLink WS relay listening on ws://0.0.0.0:20801
[Relay] New client connected to channel "__LAN__". Total clients in channel: 1
[Relay] Client disconnected from channel "__LAN__". Total clients in channel: 0
```

### Health Check
```bash
# Check if server is running
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:20801/

# Test UDP multicast
echo '{"type":"test"}' | nc -u 239.255.0.1 7474
```

## 🚨 Troubleshooting

### Common Issues

**1. UDP Not Working**
- Check firewall allows port 7474
- Verify multicast is enabled on network
- Ensure Max/MSP is on same network

**2. WebSocket Not Connecting**
- Check firewall allows port 20801
- Verify relay server is running
- Check browser console for errors

**3. PWA Not Discovering Relay**
- Ensure relay is running on local network
- Check network connectivity
- Verify PWA is installed (not just web app)

### Debug Commands
```bash
# Check ports
lsof -i :20801
lsof -i :7474

# Test UDP
echo '{"type":"test"}' | nc -u 239.255.0.1 7474

# Test WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:20801/
```

## 📚 Advanced Usage

### Custom Channels
```bash
# Connect to specific channel
ws://localhost:20801/my-channel
```

### Multiple Instances
```bash
# Run multiple relays on different ports
UDP_PORT=7475 WS_PORT=20802 npm start &
UDP_PORT=7476 WS_PORT=20803 npm start &
```

### Load Balancing
```bash
# Use nginx to load balance multiple relays
upstream keylink_relays {
    server localhost:20801;
    server localhost:20802;
    server localhost:20803;
}
```

## 🔒 Security Considerations

- **Local Network**: Only devices on your network can connect
- **No Authentication**: Anyone on the network can connect
- **Firewall**: Configure to allow required ports
- **HTTPS**: Use for production deployments

## 📖 Related Documentation

- **[PWA Guide](../web/PWA_README.md)** - Web app setup
- **[Max/MSP Guide](../max/README.md)** - Max external setup
- **[Deployment Guide](DEPLOYMENT.md)** - Cloud deployment options

---

**🎵 Happy bridging!** 