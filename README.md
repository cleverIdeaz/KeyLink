# KeyLink

**KeyLink** is a universal, open-source protocol and SDK for sharing tonal information (key, mode, chord, etc.) across music apps and devices on a local network. It is designed to be the *tonal* counterpart to Ableton Link, but is a completely independent protocol and library. Developers can use KeyLink and Ableton Link together or independently, depending on their needs.

---

## Protocol Overview

- **Transport:**
  - LAN: UDP multicast (default, for zero-config discovery)
  - WAN: Optional WebSocket (for future expansion)
- **Message Format:** JSON

### Example Message
```json
{
  "root": "C",
  "mode": "Dorian",
  "chord": "maj7",
  "confidence": 0.98,
  "scale": [0, 2, 3, 5, 7, 9, 10],
  "notes": [60, 62, 63, 65, 67, 69, 70],
  "keylinkEnabled": true,
  "abletonLinkEnabled": true,
  "tempo": 120,
  "source": "client-1234",
  "timestamp": 1718040000000
}
```

- `root` and `mode` are always sent.
- `chord` and `confidence` are optional and only sent if 'Send chord info' is enabled. `chord` is just the chord type (e.g., "maj7").
- `confidence` is for future audio/MIDI chord detection and is not used for manual chord selection.
- `scale` can be a string (e.g., "Major") or an array of pitch classes (e.g., [0,2,4,5,7,9,11]).
- `notes` is an array of MIDI note numbers (optional, for custom voicings).
- `keylinkEnabled` indicates if KeyLink is active on this client.
- `abletonLinkEnabled` and `tempo` refer to Ableton Link (tempo/beat sync) and are only present if Ableton Link is active.
- `source` is a unique identifier for the sending client.
- `timestamp` is ms since epoch (optional, for ordering).
- Custom/unknown values are allowed for maximum flexibility.

---

## Chord Info as a Sub-Segment

- By default, only key (root) and mode (scale) are sent, as these are most universally useful for music theory and application headers.
- Chord info is a sub-segment: it is only sent if the user enables 'Send chord info'.
- When enabled, the `chord` field (just the chord type, e.g., "maj7") and a `confidence` value (for future audio/MIDI detection) are included in outgoing messages.
- Receiving applications can choose to use only key/mode, or also use chord/confidence for more granular harmony.
- This allows for flexible, musician-friendly handling of global key signature/mode and local chord context.

---

## Vocabularies & Interoperability

- **Roots, Modes, Chords:**
  - Use vocabularies from [tonal-index](https://github.com/slurmulon/tonal-index) or [tonal.js](https://github.com/tonaljs/tonal) for maximum coverage.
  - Custom or experimental values are allowed (free-form strings or arrays).
- **Scale/Chord Formulas:**
  - Use pitch class sets (e.g., [0,2,4,5,7,9,11] for major scale).
  - Compatible with MIDI 2.0 UMP and other music theory libraries.
- **MIDI 2.0:**
  - Fields can be mapped to MIDI 2.0 key signature, chord, and scale data for DAW/plugin integration.

---

## Best Practices

- Expose both string and array representations for scales/chords in SDKs.
- Validate incoming/outgoing data using a library like tonal-index.
- Allow for custom/unknown values—do not restrict to a fixed set.
- Document expected vocabularies and formats for developers.
- Keep Ableton Link and KeyLink logic and fields clearly separated in code, protocol, and UI.
- Chord/confidence are optional and only sent if enabled; key/mode are always sent.

---

## KeyLink vs. Ableton Link

| Field                | Protocol         | Purpose                        |
|----------------------|------------------|--------------------------------|
| abletonLinkEnabled   | Ableton Link     | Is Ableton Link active?        |
| tempo                | Ableton Link     | Current tempo (bpm)            |
| keylinkEnabled       | KeyLink          | Is KeyLink active?             |
| root, mode           | KeyLink          | Tonal/harmonic state           |
| chord, confidence    | KeyLink          | Chord sub-segment (optional)   |

| Feature         | Ableton Link         | KeyLink                |
|-----------------|---------------------|------------------------|
| Purpose         | Tempo/beat sync     | Tonal/harmonic sync    |
| Protocol        | Binary, custom      | JSON, simple           |
| Transport       | UDP multicast (LAN) | UDP multicast (LAN), WebSocket (optional) |
| SDK Language    | C++ (header-only)   | C++ (header-only), JS, etc. |
| Dependency      | Standalone          | Standalone             |
| Interoperable?  | Yes (side-by-side)  | Yes (side-by-side)     |

---

## Quick Start

### C++ Example
```cpp
#include "keylink.hpp"
KeyLink kl;
kl.onMessage([](const KeyLinkMessage& msg) {
    // handle incoming tonal state
});
kl.send({"root": "C", "mode": "Dorian", "keylinkEnabled": true});
// To send chord info as well:
// kl.send({"root": "C", "mode": "Dorian", "chord": "maj7", "confidence": 0.98, "keylinkEnabled": true});
```

### JavaScript Example (Node.js)
```js
const { KeyLink } = require('keylink');
const kl = new KeyLink();
kl.on('message', msg => {
  // handle incoming tonal state
});
kl.send({ root: 'C', mode: 'Dorian', keylinkEnabled: true });
// To send chord info as well:
// kl.send({ root: 'C', mode: 'Dorian', chord: 'maj7', confidence: 0.98, keylinkEnabled: true });
```

### Max/MSP Example
- Use the provided Max external or patch.
- Connect to the same LAN as other KeyLink clients.
- Messages are received as JSON lists.

---

## Running the Demo

1. Start the KeyLink relay server (for browser demo):
   ```sh
   node relay.js
   ```
2. Open the React demo in your browser:
   ```sh
   npm start
   ```
3. All changes to tonal state are broadcast to the LAN and reflected in the UI.
4. The demo can show and control both Ableton Link (tempo/beat) and KeyLink (tonal/harmonic) states, but keeps them separate in the UI and protocol.

---

## Extending KeyLink
- Add new fields to the JSON message as needed (e.g., microtonality, user name).
- Support new protocols (OSC, MQTT) by adapting the transport layer.

---

## License
MIT 