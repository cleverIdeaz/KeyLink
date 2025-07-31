# KeyLink Max/MSP Integration

**Zero-config music data sync for Max/MSP, browser, and more**

## 🚀 Quick Start

### 1. Build the External
```bash
cd demo/max/externals
./build_keylink.sh
```

### 2. Start the Relay Server (Required for Max-Web Communication)
```bash
cd ../../relay
node relay.js
```

**This is the key step!** The relay server bridges UDP (Max) ↔ WebSocket (Web/PWA).

### 3. Test in Max/MSP
```maxmsp
[keylink lan] → [start] → [bang]
```

## 🔧 Max-Web Communication Setup

### **The Problem:**
- Max external uses UDP multicast (port 7474)
- Web app uses WebSocket (port 20801)
- They need a bridge to communicate

### **The Solution:**
The relay server automatically bridges UDP ↔ WebSocket.

### **Setup Steps:**

1. **Start Relay Server:**
   ```bash
   cd relay
   node relay.js
   ```
   You should see:
   ```
   KeyLink UDP relay listening on 239.255.0.1:7474
   KeyLink WS relay listening on ws://0.0.0.0:20801
   ```

2. **Open Web App:**
   - Go to `http://localhost:3000`
   - Set to LAN mode
   - Should connect to `ws://localhost:20801`

3. **Test Max External:**
   ```maxmsp
   [keylink lan] → [start] → [bang]
   ```

4. **Verify Communication:**
   - Messages from Max should appear in web app
   - Messages from web app should appear in Max console

## 🎯 Max Patch Examples

### Basic Test Patch
```maxmsp
[keylink lan] → [start] → [bang] → [print json]
```

### Send JSON Message
```maxmsp
[tosymbol {"key":"G","mode":"major","tempo":120}] → [keylink lan]
```

### Monitor Status
```maxmsp
[keylink lan] → [print status] → [print mode]
```

## 🔄 Network Modes

### LAN Mode (UDP + WebSocket Bridge)
- Max: UDP multicast on 239.255.0.1:7474
- Web: WebSocket on localhost:20801
- Bridge: Relay server connects both

### WAN Mode (WebSocket Only)
- Max: WebSocket to cloud relay
- Web: WebSocket to cloud relay
- No local relay needed

## 🛠️ Troubleshooting

### "No messages in Max console"
1. **Check relay server is running:**
   ```bash
   ps aux | grep relay
   ```

2. **Check UDP port:**
   ```bash
   netstat -an | grep 7474
   ```

3. **Check WebSocket port:**
   ```bash
   netstat -an | grep 20801
   ```

### "Max external crashes when offline"
- Use `[keylink offline]` for completely offline mode
- Or use `[keylink lan]` with relay server running

### "Web app can't connect"
- Ensure relay server is running
- Check browser console for WebSocket errors
- Try `ws://localhost:20801` in browser

## 📁 File Structure
```
demo/max/
├── externals/
│   ├── keylink.cpp          # Main external source
│   ├── keylink.mxo          # Compiled external
│   ├── build_keylink.sh     # Build script
│   └── start_relay.sh       # Auto-relay starter
├── examples/
│   ├── keylink_demo.maxpat  # Full demo patch
│   └── keylink_test.maxpat  # Simple test patch
└── README.md               # This file
```

## 🎵 Protocol Details

### UDP Message Format (Max → Web)
```json
{
  "key": "C",
  "mode": "major", 
  "tempo": 120,
  "chordEnabled": true,
  "chord": {"root": "C", "type": "maj"}
}
```

### WebSocket Message Format (Web → Max)
Same JSON format, sent via WebSocket to relay server.

## 🔗 Links
- [GitHub Repository](https://github.com/cleverIdeaz/KeyLink)
- [Protocol Documentation](https://github.com/cleverIdeaz/KeyLink/blob/main/docs/protocol.md)
- [Web Demo](https://key-link.netlify.app/)
- [Relay Server](../relay/README.md)

---

**Need help?** Check the troubleshooting section or open an issue on GitHub! 