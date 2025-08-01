[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/cleverIdeaz/KeyLink)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

# KeyLink

**Real-time music data synchronization for Max/MSP, browser, and more**

[![GitHub](https://img.shields.io/badge/GitHub-KeyLink-blue?style=flat&logo=github)](https://github.com/cleverIdeaz/KeyLink)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/cleverIdeaz/KeyLink/blob/main/LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen)](https://github.com/cleverIdeaz/KeyLink)

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

## 🛠️ For Developers

### Get the Source Code
```bash
git clone https://github.com/cleverIdeaz/KeyLink.git
cd KeyLink
```

### Quick Development Setup
```bash
# Web app
cd demo/web && npm install && npm start

# Relay server
cd relay && npm install && npm start

# Max external (macOS)
cd demo/max/externals && ./build_keylink.sh
```

### Documentation
- **[Protocol Specification](docs/protocol.md)** - Technical protocol details
- **[API Reference](demo/web/src/keylink-sdk.ts)** - JavaScript/TypeScript SDK
- **[Max/MSP Integration](demo/max/README.md)** - C++ external object
- **[PWA Guide](demo/web/PWA_README.md)** - Progressive Web App setup

### Contributing
- **Issues**: [Report bugs or request features](https://github.com/cleverIdeaz/KeyLink/issues)
- **Discussions**: [Join the conversation](https://github.com/cleverIdeaz/KeyLink/discussions)
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)

## 🎯 Key Features

✅ **Zero Latency** - Local network synchronization  
✅ **Zero Cost** - PWA + local relay = no hosting fees  
✅ **Cross-Platform** - Windows, Mac, Linux, iOS, Android  
✅ **Max/MSP Integration** - Native external object  
✅ **Offline Capable** - Works without internet  
✅ **Real-time Sync** - Key, tempo, chord progressions  
✅ **Open Source** - MIT licensed, community-driven  

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
2. **The PWA automatically discovers local relay servers**
3. **Connect Max/MSP** using the external object (optional)

### For Developers
1. **Clone repository**: `git clone https://github.com/cleverIdeaz/KeyLink.git`
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
- **[API Reference](demo/web/src/keylink-sdk.ts)** - JavaScript/TypeScript SDK

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

## 🎯 Universal Naming Standards

KeyLink establishes **comprehensive naming conventions** and **alias resolution** to ensure unified tonal synchronization across all platforms and musical traditions.

### 🌍 **Cross-Cultural Support**
- **Root Notes**: `C#` ↔ `Db` ↔ `Cis` ↔ `Des` → canonical `C#`
- **Modes**: `Major` ↔ `Maj` ↔ `M` ↔ `Ionian` → canonical `major`
- **Chords**: `maj7` ↔ `M7` ↔ `major7` → canonical `maj7`

### 🎵 **Musical Traditions**
- **Western Classical**: Major, minor, diminished, augmented
- **Jazz & Popular**: maj7, m7, sus4, Hendrix chords
- **World Music**: Indian Ragas, Japanese scales, Arabic Maqam
- **Contemporary**: Messiaen modes, experimental constructs

### 📚 **Implementation**
- **[Naming Standards](docs/NAMING_STANDARDS.md)** - Complete alias reference
- **[Protocol Standards](docs/keylink-standards.json)** - Machine-readable specifications
- **[JavaScript SDK](demo/web/src/keylink-aliases.js)** - Web implementation
- **[Max/MSP External](demo/max/externals/keylink_aliases.cpp)** - Max implementation

## 🛠️ Technical Details

- **Protocol**: JSON over UDP multicast + WebSocket
- **Network**: UDP 239.255.0.1:7474, WebSocket :20801
- **PWA**: Service Worker + Manifest
- **Max/MSP**: C++ external with ASIO networking
- **Alias Resolution**: Comprehensive naming standards
- **License**: MIT (open source)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute
- 🐛 **Report bugs** via [GitHub Issues](https://github.com/cleverIdeaz/KeyLink/issues)
- 💡 **Request features** via [GitHub Discussions](https://github.com/cleverIdeaz/KeyLink/discussions)
- 📝 **Improve documentation** via pull requests
- 🔧 **Submit code** via pull requests
- 🌟 **Star the repository** to show support

### Development Setup
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/KeyLink.git
cd KeyLink

# Install dependencies
cd demo/web && npm install
cd ../../relay && npm install

# Start development
cd ../demo/web && npm start
cd ../../relay && npm start
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

**Copyright (c) 2024 Neal Anderson**

---

**🎵 Happy syncing!**

**[🐙 GitHub Repository](https://github.com/cleverIdeaz/KeyLink)** • **[📖 Protocol Docs](docs/protocol.md)** • **[🤝 Contributing](CONTRIBUTING.md)** 