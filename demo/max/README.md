# KeyLink Max/MSP Integration

**Real-time music synchronization for Max/MSP with PWA and web integration**

**[🐙 GitHub Repository](https://github.com/cleverIdeaz/KeyLink)** • **[📖 Protocol Docs](https://github.com/cleverIdeaz/KeyLink/blob/main/docs/protocol.md)** • **[🤝 Contributing](https://github.com/cleverIdeaz/KeyLink/blob/main/CONTRIBUTING.md)**

## 🚀 Quick Start

### Prerequisites
1. **Install PWA**: Get the KeyLink web app installed on your device
2. **Start Relay Server**: `cd relay && ./start-relay.sh`
3. **Build Max External**: `cd demo/max/externals && ./build_keylink.sh`

### Basic Setup
```maxmsp
[keylink] → [udpsend 239.255.0.1 7474]
[udpreceive 7474] → [keylink]
```

## 📱 PWA + Max Integration

### Scenario 1: Local Performance (Recommended)
```
[Max/MSP] ←→ [Relay Server] ←→ [PWA App]
```
- **Latency**: ~1ms
- **Cost**: $0
- **Setup**: Local relay server

### Scenario 2: Remote Collaboration
```
[Max/MSP] ←→ [Relay Server] ←→ [Cloud] ←→ [Remote PWA]
```
- **Latency**: ~50-200ms
- **Cost**: $5-50+/month
- **Setup**: Cloud relay server

## 🔧 Building the External

### Automatic Build
```bash
cd demo/max/externals
./build_keylink.sh
```

### Manual Build
```bash
cd demo/max/externals
mkdir build && cd build
cmake ..
make
cp keylink.mxo /Applications/Max.app/Contents/Resources/C74/externals/
```

## 📋 Max Object Reference

### [keylink]
The main KeyLink external object for Max/MSP.

#### Inlets
- **Input 1**: JSON messages, commands, or bang to get state

#### Outlets
- **Output 1**: JSON messages from other clients

#### Messages
- `bang`: Get current state
- `start`: Start UDP multicast
- `stop`: Stop UDP multicast
- `symbol`: Send JSON message
- `dictionary`: Send structured data

#### Arguments
- `port`: UDP port (default: 7474)
- `address`: Multicast address (default: 239.255.0.1)

## 🎵 Example Patches

### Basic Key Sync
```maxmsp
[sel key] → [keylink]
[keylink] → [sel key] → [live.text key_display]
```

### Tempo Sync
```maxmsp
[sel tempo] → [keylink]
[keylink] → [sel tempo] → [live.text tempo_display]
```

### Chord Progression
```maxmsp
[sel chord] → [keylink]
[keylink] → [sel chord] → [live.text chord_display]
```

## 🔌 Integration with PWA

### Sending to PWA
```maxmsp
[tosymbol {"type":"set-state","state":{"key":"C","mode":"Ionian","tempo":120}}] → [keylink]
```

### Receiving from PWA
```maxmsp
[keylink] → [fromsymbol] → [dict.fromsymbol] → [live.text display]
```

## 🌐 Network Configuration

### UDP Multicast
- **Address**: 239.255.0.1
- **Port**: 7474
- **Protocol**: JSON over UDP

### WebSocket Bridge
- **Port**: 20801
- **Protocol**: JSON over WebSocket
- **Bridge**: Relay server handles UDP ↔ WebSocket

## 🛠️ Troubleshooting

### Common Issues

**1. No Messages Received**
- Check relay server is running
- Verify firewall allows UDP port 7474
- Ensure Max is on same network

**2. Build Errors**
- Install Xcode Command Line Tools
- Check ASIO library is present
- Verify CMake version 3.10+

**3. PWA Not Connecting**
- Install PWA from browser
- Start local relay server
- Check network connectivity

### Debug Commands
```maxmsp
[keylink] → [print]
[udpsend 239.255.0.1 7474] → [tosymbol {"type":"test"}]
[udpreceive 7474] → [print]
```

## 📚 Advanced Usage

### Custom Message Types
```maxmsp
[tosymbol {"type":"custom","data":{"param":"value"}}] → [keylink]
```

### State Management
```maxmsp
[keylink] → [dict.fromsymbol] → [dict.get state] → [live.text state_display]
```

### Error Handling
```maxmsp
[keylink] → [sel error] → [live.text error_display]
```

## 🔄 Protocol Messages

### Outgoing Messages
```json
{
  "type": "set-state",
  "state": {
    "key": "C",
    "mode": "Ionian", 
    "tempo": 120,
    "chordEnabled": true,
    "chord": {"root": "C", "type": "maj"}
  }
}
```

### Incoming Messages
```json
{
  "type": "keylink-state",
  "state": {
    "key": "F#",
    "mode": "Mixolydian",
    "tempo": 140,
    "chordEnabled": false
  }
}
```

## 🎯 Use Cases

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

## 📖 Additional Resources

- **[PWA Guide](../web/PWA_README.md)** - Web app setup
- **[Protocol Spec](../../docs/protocol.md)** - Technical details
- **[Relay Server](../../relay/README.md)** - Server setup
- **[GitHub Repository](https://github.com/cleverIdeaz/KeyLink)** - Source code
- **[Issues](https://github.com/cleverIdeaz/KeyLink/issues)** - Report bugs
- **[Discussions](https://github.com/cleverIdeaz/KeyLink/discussions)** - Get help

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/cleverIdeaz/KeyLink/blob/main/CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/KeyLink.git
cd KeyLink

# Build Max external
cd demo/max/externals && ./build_keylink.sh

# Start relay server
cd ../../relay && npm start
```

---

**🎵 Happy syncing with Max/MSP!**

**[🐙 GitHub Repository](https://github.com/cleverIdeaz/KeyLink)** • **[📖 Protocol Docs](https://github.com/cleverIdeaz/KeyLink/blob/main/docs/protocol.md)** • **[🤝 Contributing](https://github.com/cleverIdeaz/KeyLink/blob/main/CONTRIBUTING.md)** 