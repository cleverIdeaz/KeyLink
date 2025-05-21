# KeyLink Max Package (Planned)

This directory will contain the official Max package for KeyLink, enabling zero-config, cross-platform music data sync between Max, browser, and other platforms.

## Planned Structure

```
KeyLink/
├── externals/         # Compiled Max externals (.mxo/.mxe64)
├── help/              # Max help patches
├── examples/          # Example Max patches
├── docs/              # Documentation (PDF, markdown, etc.)
├── package-info.json  # Max package metadata
└── README.md          # This file
```

- The main external will be `[keylink]`, written in C++ using the Max SDK.
- It will support UDP multicast (LAN), optional WebSocket bridging (browser), and JSON message parsing.
- All messages are cross-platform and compatible with the KeyLink protocol.

---

# KeyLink Max Demo

This directory contains Max/MSP and Max for Live patches that demonstrate KeyLink in a real-time, networked music environment.

## What It Demonstrates
- Sending and receiving KeyLink messages over UDP/OSC
- Real-time key, mode, and chord sync with other KeyLink clients
- Example UI for selecting and displaying tonal information

## How to Use
1. Open the patch file in Max/MSP (or Max for Live, if provided).
2. Follow any setup instructions in the patch or comments.
3. Ensure the KeyLink relay server is running (see main README for details).
4. Interact with the UI to send/receive key, mode, and chord changes.

## Requirements
- Max/MSP (or Max for Live)
- KeyLink relay server running

## More Info
- For protocol details and toolkit usage, see the main project `README.md`. 