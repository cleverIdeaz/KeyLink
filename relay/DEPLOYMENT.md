# KeyLink Relay Server Deployment Guide

## Local Development (LAN Mode)
```bash
# Start relay server with UDP multicast enabled
node relay.js
```

## Cloud Deployment (WAN Mode)
```bash
# Deploy to Fly.io with UDP disabled (cloud providers don't support multicast)
fly deploy --env ENABLE_UDP=false
```

## Hybrid Setup (Both LAN and WAN)
1. **Local Network**: Run relay server on a machine in your local network
   ```bash
   # On your local machine/router
   node relay.js
   ```

2. **Cloud**: Deploy web app with LAN discovery
   ```bash
   # Web app will automatically discover local relay servers
   npm run build && fly deploy
   ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UDP_PORT` | `7474` | UDP multicast port |
| `UDP_MULTICAST_ADDR` | `239.255.0.1` | Multicast address |
| `WS_PORT` | `20801` | WebSocket port |
| `ENABLE_UDP` | `true` | Enable UDP multicast (set to `false` for cloud) |
| `PORT` | `20801` | WebSocket port (used by Fly.io) |

## Network Configuration

### For LAN Mode to Work:
1. Relay server must be running on a machine in the same network
2. Firewall must allow UDP port 7474 and TCP port 20801
3. Router must support multicast traffic

### For WAN Mode:
1. Deploy relay server to cloud (Fly.io, Heroku, etc.)
2. Set `ENABLE_UDP=false` for cloud deployment
3. Web app connects via WebSocket to cloud relay

## Testing

### Test LAN Mode:
```bash
# Terminal 1: Start relay
node relay.js

# Terminal 2: Test UDP
echo '{"type":"test"}' | nc -u 239.255.0.1 7474

# Terminal 3: Test WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:20801/
```

### Test WAN Mode:
```bash
# Deploy to cloud
fly deploy --env ENABLE_UDP=false

# Test from anywhere
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://your-app.fly.dev/
``` 