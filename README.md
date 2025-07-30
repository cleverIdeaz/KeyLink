[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/cleverIdeaz/KeyLink)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

# KeyLink

**Real-time music data synchronization for Max/MSP, browser, and more**

KeyLink enables seamless synchronization of musical parameters (key, tempo, chord progressions) across multiple applications and devices in real-time.

## 🚀 Quick Start

### Option 1: Install as PWA (Recommended)
1. **Visit the demo** in your browser
2. **Click "Install"** to add as a desktop/mobile app
3. **Run local relay**: `cd relay && ./start-relay.sh`
4. **Enjoy** zero-cost, zero-latency music sync!

### Option 2: Web App
- **LAN Mode**: Requires local relay server or PWA installation
- **WAN Mode**: Works from anywhere via cloud relay

## 🎯 Key Features

✅ **Zero Latency** - Local network synchronization  
✅ **Zero Cost** - PWA + local relay = no hosting fees  
✅ **Cross-Platform** - Windows, Mac, Linux, iOS, Android  
✅ **Max/MSP Integration** - Native external object  
✅ **Offline Capable** - Works without internet  
✅ **Real-time Sync** - Key, tempo, chord progressions  

## 📱 PWA vs Web App

| Feature | PWA (Installed) | Web App (Browser) |
|---------|----------------|-------------------|
| **LAN Mode** | ✅ Full support | ⚠️ Limited (cloud fallback) |
| **Offline** | ✅ Works offline | ❌ Requires internet |
| **Latency** | ~1ms (local) | ~50-200ms (cloud) |
| **Cost** | $0/month | $5-50+/month |
| **Installation** | One-click install | Browser only |

## 🔧 Setup Guide

### For Users (PWA)
1. **Install the app** from your browser
2. **Download relay server**: `git clone https://github.com/your-repo/KeyLink.git`
3. **Start relay**: `cd relay && ./start-relay.sh`
4. **Connect Max/MSP** using the external object

### For Developers
1. **Clone repository**: `git clone https://github.com/your-repo/KeyLink.git`
2. **Install dependencies**: `cd demo/web && npm install`
3. **Start development**: `npm start`
4. **Build PWA**: `npm run build`

## 🌐 Network Modes

### LAN Mode (Local Network)
- **PWA**: Connects to local relay server
- **Web App**: Falls back to cloud relay
- **Max/MSP**: Direct UDP multicast
- **Latency**: ~1ms
- **Cost**: $0

### WAN Mode (Internet)
- **All clients**: Connect via cloud relay
- **Global access**: Works from anywhere
- **Latency**: ~50-200ms
- **Cost**: $5-50+/month

## 📚 Documentation

- **[PWA Guide](demo/web/PWA_README.md)** - Complete PWA setup and usage
- **[Deployment Guide](relay/DEPLOYMENT.md)** - Server deployment options
- **[Protocol Spec](docs/protocol.md)** - Technical protocol details
- **[Max/MSP Guide](demo/max/README.md)** - Max external setup

## 🎵 Use Cases

### Live Performance
- Sync tempo across multiple devices
- Real-time key changes
- Chord progression coordination

### Studio Workflow
- Max/MSP to DAW synchronization
- Mobile app control
- Multi-device parameter sync

### Education
- Classroom tempo coordination
- Remote music lessons
- Collaborative composition

## 🔌 Max/MSP Integration

The KeyLink external object provides:
- UDP multicast communication
- JSON message parsing
- Real-time state synchronization
- Automatic reconnection

```maxmsp
[keylink] → [udpsend 239.255.0.1 7474]
[udpreceive 7474] → [keylink]
```

## 🛠️ Technical Details

- **Protocol**: JSON over UDP multicast + WebSocket
- **Network**: UDP 239.255.0.1:7474, WebSocket :20801
- **PWA**: Service Worker + Manifest
- **Max/MSP**: C++ external with ASIO networking

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

**�� Happy syncing!** 