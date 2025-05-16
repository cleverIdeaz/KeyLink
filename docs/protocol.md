# KeyLink Protocol Specification

This document defines the KeyLink protocol for sharing tonal information (key, mode, chord, etc.) across networked music applications and devices.

## Message Structure

- **Format:** JSON object
- **Transport:** UDP multicast (LAN), WebSocket (optional), OSC (optional)

### Fields
| Field                | Type           | Required | Description |
|----------------------|----------------|----------|-------------|
| `root`               | string         | Yes      | Key/root note (e.g., "C", "D#") |
| `mode`               | string         | Yes      | Mode/scale (e.g., "Dorian", "Major") |
| `chord`              | string/object  | No       | Chord type (e.g., "maj7") or `{root, type}` object |
| `confidence`         | number         | No       | Confidence in chord/key detection (0.0–1.0) |
| `scale`              | string/array   | No       | Scale name or pitch class set (e.g., [0,2,4,5,7,9,11]) |
| `notes`              | array          | No       | MIDI note numbers for custom voicings |
| `keylinkEnabled`     | boolean        | Yes      | Is KeyLink active on this client? |
| `abletonLinkEnabled` | boolean        | No       | Is Ableton Link active? |
| `tempo`              | number         | No       | Current tempo (bpm, if Ableton Link active) |
| `source`             | string         | No       | Unique identifier for sending client |
| `timestamp`          | number         | No       | ms since epoch (for ordering) |

- **Extensibility:** Additional custom fields are allowed and encouraged for future features (e.g., microtonality, user tags).

## Example Message
```json
{
  "root": "C",
  "mode": "Dorian",
  "chord": { "root": "G", "type": "min7" },
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

## Field Details
- **root:** Use standard note names (C, C#, D, etc.).
- **mode:** Use common mode/scale names (Ionian, Dorian, Major, Minor, etc.).
- **chord:** Can be a string ("maj7") or an object `{root, type}` for more detail.
- **scale:** Can be a string or an array of pitch classes (0=C, 1=C#/Db, ..., 11=B).
- **notes:** Array of MIDI note numbers (integers).
- **keylinkEnabled:** Always present; controls network participation.
- **abletonLinkEnabled/tempo:** Only present if Ableton Link is active.
- **Custom fields:** Allowed for extensibility (e.g., microtonality, user tags).

## Mapping to MIDI and OSC
- **MIDI 2.0 UMP:** Use toolkit utilities to map `root`, `mode`, and `chord` to MIDI key signature and chord messages.
- **OSC:** Use toolkit utilities to map JSON fields to integer-indexed OSC messages for legacy/embedded use.
- **Best Practice:** Always preserve the original JSON message for maximum interoperability.

## Best Practices
- Always send `root`, `mode`, and `keylinkEnabled`.
- Only send `chord` and `confidence` if chord info is enabled.
- Accept and ignore unknown fields for forward compatibility.
- Use human-readable values for easy debugging and extension.
- Document any custom fields in your implementation.

## See Also
- [Main README](../README.md) for project overview
- [Toolkit](../toolkit/) for MIDI/OSC mapping utilities
- [Examples](../examples/) for usage samples 