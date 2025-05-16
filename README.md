[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/cleverIdeaz/KeyLink)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

# KeyLink

**KeyLink** is a universal, open-source protocol and SDK for sharing tonal information (key, mode, chord, etc.) across music apps and devices on a local network. It is designed to be the *tonal* counterpart to Ableton Link, but is a completely independent protocol and library. Developers can use KeyLink and Ableton Link together or independently, depending on their needs.

## Why KeyLink? (A Real-World Scenario)

Imagine a modern music collaboration: a composer is writing in Sibelius, a producer is building tracks in Ableton Live, someone else is live-sequencing on an OP-1, and another participant is generating music with an AI tool like Lemonaide, Udio, or Suno. They all want to work together, ensuring that every part—human or machine—stays in the same key and mode. Tempo sync is easy with Ableton Link, but there's no universal way to share key signature and harmonic context across all these platforms. KeyLink fills this gap, providing a simple, open protocol for sharing tonal information in real time, so every participant and every app can stay harmonically connected. This is the missing link for truly collaborative, cross-platform, and AI-integrated music creation.

---

## Table of Contents
- [Open Source License & Attribution](#open-source-license--attribution)
- [Directory Structure](#directory-structure)
- [Quick Start](#quick-start)
- [Protocol Overview](#protocol-overview)
- [Chord Info as a Sub-Segment](#chord-info-as-a-sub-segment)
- [Vocabularies & Interoperability](#vocabularies--interoperability)
- [Best Practices](#best-practices)
- [KeyLink vs. Ableton Link](#keylink-vs-ableton-link)
- [Extending KeyLink](#extending-keylink)
- [Why JSON? Why Not MIDI 2.0 or Integer Indexes?](#why-json-why-not-midi-20-or-integer-indexes)
- [MIDI Integration and Toolkit Roadmap](#midi-integration-and-toolkit-roadmap)
- [FAQ: Why Not Just Use MIDI?](#faq-why-not-just-use-midi)
- [Collaborative Tonal and Temporal Control](#collaborative-tonal-and-temporal-control)
- [License](#license)

---

## Open Source License & Attribution

KeyLink is released as open source software and is freely available for use, modification, and distribution under the terms of its license. 

**Attribution:**
KeyLink was created and is maintained by Neal Anderson. Please credit Neal Anderson in any derivative works, publications, or presentations that use or build upon this project.

---

## Directory Structure

- `demo/web/` — Web/React and HTML demos for browser-based testing and development.
- `demo/max/` — Max/MSP patch and related files for Max-based integration.
- `toolkit/` — Utilities for MIDI, transposition, and OSC mapping.
- `docs/` — Developer and API documentation (expand as needed).
- `examples/` — Minimal usage examples for Node.js, browser, or Max.
- `relay.js` — Node.js relay server for LAN/WebSocket/UDP bridging.

---

## Quick Start

### 1. Run the Relay Server
```sh
node relay.js
```

### 2. Web Demo (React/HTML)
```sh
cd demo/web
npm install
npm start
# Open http://localhost:3000
```
Or open `keylink-demo.html` in a browser (served via local web server).

### 3. Max/MSP Demo
- Open `demo/max/KeyLinkDemo.maxpat` in Max.
- Ensure Max is on the same LAN and can access UDP multicast.
- The patch will send/receive JSON messages as described in the protocol.

### 4. Toolkit Utilities
- See `toolkit/README.md` for MIDI, transposition, and OSC mapping utilities.

### 5. Examples
- See `examples/` for minimal usage examples (Node.js, browser, Max, etc.).

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

## Extending KeyLink
- Add new fields to the JSON message as needed (e.g., microtonality, user name).
- Support new protocols (OSC, MQTT) by adapting the transport layer.

---

## Why JSON? Why Not MIDI 2.0 or Integer Indexes?

KeyLink uses a human-readable JSON protocol for all network messages, rather than MIDI 2.0 UMP or integer-indexed OSC protocols. This is a deliberate choice for several reasons:

- **Extensibility:** JSON allows for easy addition of new fields (e.g., microtonality, user tags, confidence, etc.) without breaking compatibility.
- **Human-Readable:** Debugging, logging, and integration with web/mobile/modern apps is much easier with JSON.
- **Flexible Vocabulary:** Supports arbitrary roots, modes, chords, and custom/experimental values, not just those in the MIDI spec.
- **Interoperability:** JSON can be mapped to/from MIDI 2.0 UMP, OSC, or any other protocol as needed. We will provide utilities for this in the toolkit.
- **Community-Friendly:** Easier for contributors and users to extend, adapt, and build upon.

While MIDI 2.0 UMP is a powerful standard for device-to-device communication, it is binary, less flexible, and not as easy to use for rapid prototyping, web/mobile, or cross-platform development. KeyLink is designed to be a superset that can interoperate with MIDI 2.0, but is much easier to use and extend for modern music tech workflows.

---

## MIDI Integration and Toolkit Roadmap

KeyLink will provide a toolkit with utilities for:
- **MIDI Input/Output:** Mapping KeyLink JSON messages to and from MIDI 2.0 UMP and MIDI 1.0 messages.
- **Audio/MIDI Transposition:** Functions to transpose audio or MIDI clips when changing key/mode/chord, e.g.:
  - C Major to D Major: +2 semitones
  - C Major to A minor: 0 semitones (relative minor)
  - C Major to B minor: +2 semitones
- **OSC/UDP Support:** Optional mapping to integer-indexed OSC for legacy/embedded/ultra-low-latency use.
- **Max/MSP, Web, Node, and React Demos:** Each platform will have a simple, rock-solid demo showing:
  - Ableton Link tempo sync
  - KeyLink key signature/mode assignment
  - Chord selection and sharing
  - Recursive network control (all clients update in real time)

---

## FAQ: Why Not Just Use MIDI?

KeyLink is designed for LAN multiplayer sessions and recursive, multi-client control of key signatures, modes, and chords. MIDI 2.0 is great for device-to-device communication, but is not as flexible or easy to extend for modern, cross-platform, and web-based music tech. KeyLink offers a simple, comprehensive solution for these scenarios, with planned utilities for MIDI integration and audio/MIDI transposition.

---

## Collaborative Tonal and Temporal Control

KeyLink is designed to encourage musicians and musical machines to collaborate and work together to find common musical goals. By sharing key, mode, chord, and tempo information in real time, KeyLink enables recursive control across all connected clients—whether human or algorithmic. This allows for dynamic, decentralized negotiation of tonal centers and harmonic context, fostering a new kind of musical interaction where all participants can influence and respond to the evolving musical environment. Temporal synchronization is supported via Ableton Link integration, ensuring that both timing and tonality can be shared and controlled collaboratively across the network.

---

## License
MIT 