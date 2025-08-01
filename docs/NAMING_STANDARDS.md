# KeyLink Naming Standards & Alias Resolution

## Overview

KeyLink establishes **comprehensive naming conventions** and **alias resolution** to ensure unified tonal synchronization across all platforms and musical traditions. This system addresses the fundamental challenge of inconsistent tonal naming across music software by providing canonical representations with extensive alias support.

## The Problem

Different systems and users refer to the same musical constructs in various ways:

- **Root Notes**: `C#` vs `Db` vs `Cis` vs `Des`
- **Modes**: `Major` vs `Maj` vs `M` vs `Ionian`
- **Chords**: `maj7` vs `M7` vs `major7` vs `Major7`
- **Cultural Variations**: Western classical, jazz, world music, contemporary electronic

This diversity impedes interoperability and introduces ambiguity when exchanging messages between Max patches, browser apps, and other clients.

## The Solution

KeyLink introduces an **alias resolution system** that maps common synonyms, abbreviations, and culturally distinct labels into canonical forms. This ensures that messages sent from one client can be understood unambiguously by all others, regardless of their origin environment.

## Canonical Forms

### Root Notes
**Canonical**: `C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`

**Aliases Include**:
- Solfège: `Do`, `Re`, `Mi`, `Fa`, `Sol`, `La`, `Si`
- German: `Cis`, `Dis`, `Fis`, `Gis`, `Ais`, `Des`, `Es`, `Ges`, `As`, `B`
- Italian: `Do#`, `Re#`, `Fa#`, `Sol#`, `La#`, `Reb`, `Mib`, `Solb`, `Lab`, `Sib`
- Numeric: `1`, `2`, `3`, `4`, `5`, `6`, `7` (Roman: `I`, `II`, `III`, `IV`, `V`, `VI`, `VII`)

### Modes
**Canonical**: `major`, `minor`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `aeolian`, `locrian`

**Aliases Include**:
- **Major**: `Maj`, `M`, `Ionian`, `1`, `I`, `dur`, `major scale`
- **Minor**: `min`, `m`, `Aeolian`, `6`, `VI`, `moll`, `natural minor`, `minor scale`
- **Dorian**: `Dorian`, `2`, `II`, `dorian mode`
- **Phrygian**: `Phrygian`, `3`, `III`, `phrygian mode`
- **Lydian**: `Lydian`, `4`, `IV`, `lydian mode`
- **Mixolydian**: `Mixolydian`, `5`, `V`, `mixolydian mode`
- **Aeolian**: `Aeolian`, `6`, `VI`, `aeolian mode`
- **Locrian**: `Locrian`, `7`, `VII`, `locrian mode`

### Chord Types
**Canonical**: `maj`, `min`, `dim`, `aug`, `sus2`, `sus4`, `7`, `maj7`, `m7`, `dim7`, `m7b5`

**Aliases Include**:
- **Major**: `major`, `Major`, `M`, `triad`, `major triad`, `major_triad`
- **Minor**: `minor`, `Minor`, `m`, `minor triad`, `minor_triad`
- **Diminished**: `diminished`, `Diminished`, `d`, `diminished triad`, `diminished_triad`
- **Augmented**: `augmented`, `Augmented`, `A`, `augmented triad`, `augmented_triad`
- **Dominant 7**: `dom7`, `dominant7`, `dominant 7`, `dominant_seventh`, `seventh`
- **Major 7**: `major7`, `Major7`, `M7`, `major seventh`, `major_seventh`
- **Minor 7**: `min7`, `minor7`, `Minor7`, `minor seventh`, `minor_seventh`

## Special Scales

### Blues Variants
- `blues pentatonic`, `BluesPentatonic`, `blues_pentatonic`
- `blues hexatonic`, `BluesHexatonic`, `blues_hexatonic`
- `blues heptatonic`, `BluesHeptatonic`, `blues_heptatonic`
- `blues octatonic`, `BluesOctatonic`, `blues_octatonic`
- `blues enneatonic`, `BluesEnneatonic`, `blues_enneatonic`

### Bebop Scales
- `bebop major`, `BebopMajor`, `bebop_major`
- `bebop dominant`, `BebopDominant`, `bebop_dominant`
- `bebop minor`, `BebopMinor`, `bebop_minor`
- `bebop half diminished`, `BebopHalfDiminished`, `bebop_half_diminished`

### World Scales
- **Japanese**: `hira joshi`, `HiraJoshi`, `kokin joshi`, `KokinJoshi`, `iwato`, `Iwato`, `sakura`, `Sakura`
- **Chinese**: `youlan`, `Youlan`, `biyu`, `BiYu`, `kung`, `Kung`
- **Indian**: `raga`, `Raga`, `maqam`, `Maqam`, `hijaz`, `Hijaz`, `shadd'araban`, `Shadd'araban`

### Messiaen Modes
- `messiaen mode 1`, `MessiaenMode1`, `messiaen_1`
- `messiaen mode 2`, `MessiaenMode2`, `messiaen_2`
- `messiaen mode 3`, `MessiaenMode3`, `messiaen_3`
- `messiaen mode 4`, `MessiaenMode4`, `messiaen_4`
- `messiaen mode 5`, `MessiaenMode5`, `messiaen_5`
- `messiaen mode 6`, `MessiaenMode6`, `messiaen_6`
- `messiaen mode 7`, `MessiaenMode7`, `messiaen_7`

## Message Schema

All KeyLink messages conform to a unified structure:

```json
{
  "root_note": "G#",
  "mode": "aeolian",
  "chord_type": "m7",
  "tempo": 120,
  "key_signature": "G# minor",
  "timestamp": 1698702712000,
  "source": "max_patch_1",
  "metadata": {
    "version": "1.0.0",
    "confidence": 0.95,
    "detection_method": "manual",
    "resolved_by": "KeyLinkAliasResolver",
    "resolution_version": "1.0.0"
  }
}
```

### Required Fields
- `root_note`: Canonical root note (C, C#, D, etc.)
- `mode`: Canonical mode (major, minor, dorian, etc.)
- `timestamp`: Unix timestamp for temporal alignment
- `source`: Unique identifier for the sending device

### Optional Fields
- `chord_type`: Canonical chord type (maj, min, 7, etc.)
- `tempo`: BPM (Ableton Link compatible)
- `key_signature`: Human-readable key signature
- `metadata`: Additional information and resolution data

## Implementation

### Web/JavaScript SDK

```javascript
// Initialize the resolver
const resolver = new KeyLinkAliasResolver();
await resolver.initialize();

// Resolve individual components
const canonicalRoot = resolver.resolveRootNote("Db");  // Returns "C#"
const canonicalMode = resolver.resolveMode("Ionian");  // Returns "major"
const canonicalChord = resolver.resolveChordType("M7"); // Returns "maj7"

// Resolve complete message
const resolvedMessage = resolver.resolveMessage({
  root_note: "Db",
  mode: "Ionian",
  chord_type: "M7",
  tempo: 120
});
```

### Max/MSP External

```maxmsp
[keylink_aliases] → [root Db] → [print root]  // Outputs: C#
[keylink_aliases] → [mode Ionian] → [print mode]  // Outputs: major
[keylink_aliases] → [chord M7] → [print chord]  // Outputs: maj7

// Resolve complete JSON message
[keylink_aliases] → [resolve {"root_note":"Db","mode":"Ionian"}] → [print json]
```

## Resolution Rules

1. **Priority Order**: canonical → aliases → special_scales
2. **Case Sensitivity**: Case-insensitive by default
3. **Whitespace Handling**: Trim and normalize multiple spaces
4. **Fallback Behavior**: Use input as canonical if no match found

## Extensibility

The alias system is built for growth and community contribution:

- **Custom Aliases**: Supported for local implementations
- **Community Contributions**: Encouraged via GitHub pull requests
- **Versioning**: Semantic versioning for standards evolution
- **Backward Compatibility**: Required for all updates

## Cultural Inclusion

KeyLink's alias system includes support for:

- **Western Classical Theory**: Major, minor, diminished, augmented
- **Jazz and Popular Symbols**: maj7, m7, sus4, etc.
- **Global Modal Systems**: Indian Ragas, Messiaen's Modes, microtonal variants
- **Experimental Constructs**: Contemporary and avant-garde terminology

## Usage Examples

### Cross-Platform Compatibility

```javascript
// Max/MSP sends: {"root_note":"Db","mode":"Ionian","chord_type":"M7"}
// Web app receives: {"root_note":"C#","mode":"major","chord_type":"maj7"}
// Both understand the same musical content despite different input formats
```

### Educational Applications

```javascript
// Student enters: "Do major" (solfège)
// System resolves to: "C major" (standard notation)
// All connected devices receive consistent data
```

### Jazz and Contemporary Music

```javascript
// Jazz musician enters: "Bb7#9" (Hendrix chord)
// System resolves to: "A#7#9" (canonical form)
// All devices interpret the same harmonic content
```

## Contributing

To add new aliases or cultural variations:

1. Fork the KeyLink repository
2. Add entries to `docs/keylink-standards.json`
3. Update documentation in this file
4. Submit a pull request with clear justification

## Future Directions

- **Microtonal Support**: Extended beyond 12-tone equal temperament
- **Machine Learning**: Automatic alias detection and learning
- **Cultural Expansion**: Additional world music traditions
- **Real-time Learning**: Adaptive alias resolution based on usage patterns

---

**KeyLink Naming Standards v1.0.0** - The universal language for networked tonal synchronization. 