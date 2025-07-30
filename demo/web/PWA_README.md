# KeyLink Demo - PWA (Progressive Web App) Guide

## Overview

The KeyLink Demo is now available as a **Progressive Web App (PWA)** that can be installed on desktop and mobile devices. This eliminates the need for cloud hosting costs and provides a better user experience.

**[🐙 GitHub Repository](https://github.com/cleverIdeaz/KeyLink)** • **[📖 Protocol Docs](https://github.com/cleverIdeaz/KeyLink/blob/main/docs/protocol.md)** • **[🤝 Contributing](https://github.com/cleverIdeaz/KeyLink/blob/main/CONTRIBUTING.md)**

## Benefits of PWA

✅ **No Cloud Costs** - Runs locally, no server fees  
✅ **Offline Capable** - Works without internet connection  
✅ **Native App Feel** - Installs like a desktop/mobile app  
✅ **LAN Discovery** - Automatically finds local relay servers  
✅ **Cross-Platform** - Works on Windows, Mac, Linux, iOS, Android  

## Installation Options

### Option 1: Install from Web (Recommended)
1. Visit the KeyLink Demo in your browser
2. Look for the "Install" button in the top-right corner
3. Click "Install" to add to your device
4. The app will now run as a native application

### Option 2: Manual Installation
1. Open the web app in Chrome/Edge
2. Click the menu (⋮) → "Install KeyLink Demo"
3. Follow the prompts to install

### Option 3: Download and Run Locally
```bash
# Clone the repository
git clone https://github.com/cleverIdeaz/KeyLink.git
cd KeyLink/demo/web

# Install dependencies
npm install

# Build and serve locally
npm run build
npx serve -s build
```

## Setting Up the Relay Server

For LAN functionality, you need a relay server running on your local network:

### Quick Setup
```bash
# Download and install relay server
cd relay
./install.sh

# Start the relay server
./start-relay.sh
```

### Manual Setup
```bash
cd relay
npm install
npm start
```

The relay server will:
- Listen for UDP multicast on `239.255.0.1:7474`
- Accept WebSocket connections on `ws://localhost:20801`
- Bridge between Max/MSP and web apps

## Usage Scenarios

### Scenario 1: Local Development
```
[Max/MSP] ←→ [Relay Server] ←→ [Web App (PWA)]
```
- All components on the same machine
- Perfect for development and testing

### Scenario 2: LAN Performance
```
[Max/MSP] ←→ [Relay Server] ←→ [Web App (PWA)]
     ↑              ↑              ↑
  Local PC      Local PC      Mobile/Tablet
```
- All devices on the same network
- Low latency, no internet required
- No cloud costs

### Scenario 3: Hybrid Setup
```
[Max/MSP] ←→ [Relay Server] ←→ [Web App (PWA)]
     ↑              ↑              ↑
  Local PC      Local PC      Mobile/Tablet
                                    ↓
                              [Cloud Relay] ←→ [Remote Users]
```
- Local devices use LAN for low latency
- Remote users connect via cloud
- Best of both worlds

## Network Modes

### LAN Mode (Recommended for PWA)
- **Local**: Discovers and connects to local relay servers
- **PWA**: Falls back to cloud relay if no local server found
- **Web**: Uses cloud relay for web-to-web communication

### WAN Mode
- Always uses cloud relay
- Works from anywhere with internet
- Higher latency but global access

## Troubleshooting

### PWA Not Installing
- Ensure you're using a supported browser (Chrome, Edge, Safari)
- Check that the site is served over HTTPS (required for PWA)
- Try refreshing the page and waiting for the install prompt

### LAN Connection Issues
1. **Check relay server**: Ensure it's running on your network
2. **Firewall**: Allow UDP port 7474 and TCP port 20801
3. **Network**: Ensure all devices are on the same network
4. **Discovery**: The app will try common network addresses automatically

### Max/MSP Integration
1. **Build external**: Run `./build_keylink.sh` in the max/externals directory
2. **Test UDP**: Send test messages to `239.255.0.1:7474`
3. **Check logs**: Monitor the relay server console for incoming messages

## Development

### Building the PWA
```bash
npm run build
```

### Testing PWA Features
```bash
# Serve with HTTPS (required for PWA)
npx serve -s build --ssl-cert

# Or use a local HTTPS server
npm run start:https
```

### Updating the PWA
- Increment the version in `package.json`
- Update the cache name in `sw.js`
- Deploy the new version

## Cost Comparison

| Setup | Monthly Cost | Latency | Features |
|-------|-------------|---------|----------|
| **PWA + Local Relay** | $0 | ~1ms | Full functionality |
| **Cloud Hosting** | $5-50+ | ~50-200ms | Global access |
| **Hybrid** | $5-20 | ~1ms local, ~100ms remote | Best of both |

## Security Considerations

- **Local Network**: Only devices on your network can connect
- **No Cloud Data**: All data stays on your local network
- **HTTPS Required**: PWA installation requires secure connection
- **Firewall**: Configure your firewall to allow the relay server ports

## Support

For issues and questions:
- **GitHub Issues**: [Report bugs or request features](https://github.com/cleverIdeaz/KeyLink/issues)
- **GitHub Discussions**: [Join the conversation](https://github.com/cleverIdeaz/KeyLink/discussions)
- **Documentation**: Check the main [README.md](https://github.com/cleverIdeaz/KeyLink/blob/main/README.md)
- **Protocol Spec**: Review [docs/protocol.md](https://github.com/cleverIdeaz/KeyLink/blob/main/docs/protocol.md)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/cleverIdeaz/KeyLink/blob/main/CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors
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

---

**🎵 Happy syncing!**

**[🐙 GitHub Repository](https://github.com/cleverIdeaz/KeyLink)** • **[📖 Protocol Docs](https://github.com/cleverIdeaz/KeyLink/blob/main/docs/protocol.md)** • **[🤝 Contributing](https://github.com/cleverIdeaz/KeyLink/blob/main/CONTRIBUTING.md)** 