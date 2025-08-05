# KeyLink Naming Standards & Alias Resolution

## Overview

KeyLink establishes **comprehensive naming conventions** and **alias resolution** to ensure unified tonal synchronization across all platforms and musical traditions. This system addresses the fundamental challenge of inconsistent tonal naming across music software by providing canonical representations with extensive alias support.

## The Problem

Different systems and users refer to the same musical constructs in various ways:

- **Root Notes**: `C#` vs `Db` vs `Cis` vs `Des`
- **Modes**: `Major` vs `Maj` vs `M` vs `Ionian`
- **Chords**: `maj7` vs `M7` vs `major7` vs `Major7`
- **Cultural Variations**: Western classical, jazz, world music, contemporary electronic
- **Note Patterns**: Interval-based vs name-based representations

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

## Note Primitives

KeyLink introduces a **note primitives system** that provides interval-based representations for all musical constructs. This system allows for precise, mathematical representation of tonal relationships that can be transposed to any root note.

### Comprehensive Indexed List

KeyLink includes a complete set of **2067 note combinations** in 12-tone equal temperament, organized by index and name. This comprehensive list covers:

- All possible note combinations from 1 to 12 notes
- Traditional Western harmony (triads, seventh chords, etc.)
- Extended harmony (ninth, eleventh, thirteenth chords)
- Altered chords (sharp 5, flat 9, etc.)
- Modal scales (dorian, phrygian, lydian, etc.)
- Pentatonic scales (major, minor, blues variants)
- World music scales (Japanese, Chinese, Indian, Arabic)
- Messiaen modes and other modern scales
- Bebop scales and jazz harmony
- Cluster chords and dense harmonies
- Quartal, quintal, secundal, and tertian harmony
- Chromatic and atonal structures

The comprehensive list is stored in `docs/comprehensive-note-primitives.json` and can be accessed by index number (0-2066).

**Key Indices Include**:
- `0`: null
- `1-12`: Basic notes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- `52`: dim (diminished triad)
- `53`: min (minor triad)
- `60`: maj (major triad)
- `61`: aug (augmented triad)
- `63`: dom7 (dominant seventh)
- `182`: dim7 (diminished seventh)
- `183`: m7b5 (half diminished)
- `209`: maj7 (major seventh)
- `223`: 7sus4 (dominant seventh suspended fourth)
- `324`: dom7b5b9 (dominant seventh flat five flat nine)
- `389`: minor-pentatonic
- `391`: m9 (minor ninth)
- `413`: maj9 (major ninth)
- `867`: WholeTone
- `2066`: chromatic (full 12-tone scale)

### Interval Patterns

Each note primitive is defined by its **interval pattern** - an array of semitone distances from the root note. For example:

```json
{
  "major_triad": {
    "pattern": [0, 4, 7],
    "aliases": ["major", "maj", "M", "major triad", "major chord"]
  }
}
```

The pattern `[0, 4, 7]` means:
- `0`: Root note (unison)
- `4`: Major third (4 semitones up)
- `7`: Perfect fifth (7 semitones up)

### Primitive Categories

#### Intervals
Basic interval relationships:
- `unison`: `[0]` - Same note
- `minor_second`: `[0, 1]` - Semitone
- `major_second`: `[0, 2]` - Whole tone
- `minor_third`: `[0, 3]` - Minor third
- `major_third`: `[0, 4]` - Major third
- `perfect_fourth`: `[0, 5]` - Perfect fourth
- `tritone`: `[0, 6]` - Augmented fourth/diminished fifth
- `perfect_fifth`: `[0, 7]` - Perfect fifth
- `minor_sixth`: `[0, 8]` - Minor sixth
- `major_sixth`: `[0, 9]` - Major sixth
- `minor_seventh`: `[0, 10]` - Minor seventh
- `major_seventh`: `[0, 11]` - Major seventh
- `octave`: `[0, 12]` - Perfect octave

#### Dyads
Two-note combinations:
- `power_chord`: `[0, 7]` - Perfect fifth
- `minor_second_dyad`: `[0, 1]` - Semitone cluster
- `major_second_dyad`: `[0, 2]` - Whole tone cluster
- `minor_third_dyad`: `[0, 3]` - Minor third
- `major_third_dyad`: `[0, 4]` - Major third
- `tritone_dyad`: `[0, 6]` - Tritone

#### Triads
Three-note chords:
- `major_triad`: `[0, 4, 7]` - Major chord
- `minor_triad`: `[0, 3, 7]` - Minor chord
- `diminished_triad`: `[0, 3, 6]` - Diminished chord
- `augmented_triad`: `[0, 4, 8]` - Augmented chord
- `sus2_triad`: `[0, 2, 7]` - Suspended second
- `sus4_triad`: `[0, 5, 7]` - Suspended fourth

#### Tetrads
Four-note chords:
- `major_seventh`: `[0, 4, 7, 11]` - Major seventh
- `minor_seventh`: `[0, 3, 7, 10]` - Minor seventh
- `dominant_seventh`: `[0, 4, 7, 10]` - Dominant seventh
- `diminished_seventh`: `[0, 3, 6, 9]` - Diminished seventh
- `half_diminished`: `[0, 3, 6, 10]` - Half diminished
- `major_sixth`: `[0, 4, 7, 9]` - Major sixth
- `minor_sixth`: `[0, 3, 7, 9]` - Minor sixth

#### Pentads
Five-note chords:
- `major_ninth`: `[0, 4, 7, 11, 14]` - Major ninth
- `minor_ninth`: `[0, 3, 7, 10, 14]` - Minor ninth
- `dominant_ninth`: `[0, 4, 7, 10, 14]` - Dominant ninth
- `major_seventh_sus4`: `[0, 5, 7, 11, 14]` - Major seventh suspended fourth
- `dominant_seventh_sus4`: `[0, 5, 7, 10, 14]` - Dominant seventh suspended fourth

#### Hexads
Six-note chords:
- `major_thirteenth`: `[0, 4, 7, 11, 14, 21]` - Major thirteenth
- `minor_thirteenth`: `[0, 3, 7, 10, 14, 21]` - Minor thirteenth
- `dominant_thirteenth`: `[0, 4, 7, 10, 14, 21]` - Dominant thirteenth

#### Scales
Complete scale patterns:
- `major_scale`: `[0, 2, 4, 5, 7, 9, 11]` - Major scale (Ionian)
- `minor_scale`: `[0, 2, 3, 5, 7, 8, 10]` - Natural minor scale (Aeolian)
- `dorian_mode`: `[0, 2, 3, 5, 7, 9, 10]` - Dorian mode
- `phrygian_mode`: `[0, 1, 3, 5, 7, 8, 10]` - Phrygian mode
- `lydian_mode`: `[0, 2, 4, 6, 7, 9, 11]` - Lydian mode
- `mixolydian_mode`: `[0, 2, 4, 5, 7, 9, 10]` - Mixolydian mode
- `locrian_mode`: `[0, 1, 3, 5, 6, 8, 10]` - Locrian mode
- `harmonic_minor`: `[0, 2, 3, 5, 7, 8, 11]` - Harmonic minor
- `melodic_minor`: `[0, 2, 3, 5, 7, 9, 11]` - Melodic minor
- `major_pentatonic`: `[0, 2, 4, 7, 9]` - Major pentatonic
- `minor_pentatonic`: `[0, 3, 5, 7, 10]` - Minor pentatonic
- `blues_scale`: `[0, 3, 5, 6, 7, 10]` - Blues scale
- `whole_tone_scale`: `[0, 2, 4, 6, 8, 10]` - Whole tone scale
- `chromatic_scale`: `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]` - Chromatic scale

#### Clusters
Dense note clusters:
- `minor_second_cluster`: `[0, 1, 2]` - Semitone cluster
- `major_second_cluster`: `[0, 2, 4]` - Whole tone cluster
- `minor_third_cluster`: `[0, 3, 6]` - Minor third cluster
- `major_third_cluster`: `[0, 4, 8]` - Major third cluster
- `quartal_cluster`: `[0, 5, 10]` - Perfect fourth stack
- `quintal_cluster`: `[0, 7, 14]` - Perfect fifth stack

#### Extended Harmony
Complex chord extensions:
- `major_seventh_sharp_five`: `[0, 4, 8, 11]` - Major seventh sharp five
- `minor_seventh_flat_five`: `[0, 3, 6, 10]` - Minor seventh flat five
- `dominant_seventh_sharp_five`: `[0, 4, 8, 10]` - Dominant seventh sharp five
- `dominant_seventh_flat_five`: `[0, 4, 6, 10]` - Dominant seventh flat five
- `dominant_seventh_sharp_nine`: `[0, 4, 7, 10, 15]` - Dominant seventh sharp nine (Hendrix chord)
- `dominant_seventh_flat_nine`: `[0, 4, 7, 10, 13]` - Dominant seventh flat nine

#### Altered Chords
Modified chord structures:
- `augmented_major_seventh`: `[0, 4, 8, 11]` - Augmented major seventh
- `augmented_minor_seventh`: `[0, 4, 8, 10]` - Augmented minor seventh
- `diminished_major_seventh`: `[0, 3, 6, 11]` - Diminished major seventh
- `diminished_minor_seventh`: `[0, 3, 6, 9]` - Diminished minor seventh

#### Polychords
Stacked chord structures:
- `major_over_minor`: `[0, 4, 7, 12, 15, 19]` - Major chord over minor chord
- `minor_over_major`: `[0, 3, 7, 12, 16, 19]` - Minor chord over major chord
- `major_over_dominant`: `[0, 4, 7, 12, 16, 19, 22]` - Major chord over dominant chord

#### Quartal Harmony
Fourth-based harmony:
- `quartal_triad`: `[0, 5, 10]` - Quartal triad
- `quartal_tetrad`: `[0, 5, 10, 15]` - Quartal four-note chord
- `quartal_pentad`: `[0, 5, 10, 15, 20]` - Quartal five-note chord

#### Quintal Harmony
Fifth-based harmony:
- `quintal_triad`: `[0, 7, 14]` - Quintal triad
- `quintal_tetrad`: `[0, 7, 14, 21]` - Quintal four-note chord
- `quintal_pentad`: `[0, 7, 14, 21, 28]` - Quintal five-note chord

#### Secundal Harmony
Second-based harmony:
- `secundal_triad`: `[0, 1, 2]` - Secundal triad
- `secundal_tetrad`: `[0, 1, 2, 3]` - Secundal four-note chord
- `secundal_pentad`: `[0, 1, 2, 3, 4]` - Secundal five-note chord

#### Tertian Harmony
Third-based harmony:
- `tertian_triad`: `[0, 4, 7]` - Tertian triad
- `tertian_tetrad`: `[0, 4, 7, 11]` - Tertian four-note chord
- `tertian_pentad`: `[0, 4, 7, 11, 14]` - Tertian five-note chord

### Pattern Application

The note primitives system allows for **transposition** of any pattern to any root note:

```javascript
// Apply major triad pattern to C
const resolver = new KeyLinkAliasResolver();
const pattern = resolver.getPatternByType("major"); // [0, 4, 7]
const notes = resolver.applyPatternToRoot("C", pattern); // ["C", "E", "G"]

// Apply same pattern to F#
const notes2 = resolver.applyPatternToRoot("F#", pattern); // ["F#", "A#", "C#"]
```

### Pattern Resolution

The system can resolve patterns from various inputs:

```javascript
// From string name
const pattern1 = resolver.resolveNotePattern("major"); // { type: "major_triad", pattern: [0, 4, 7] }

// From interval array
const pattern2 = resolver.resolveNotePattern([0, 4, 7]); // { type: "major_triad", pattern: [0, 4, 7] }

// From alias
const pattern3 = resolver.resolveNotePattern("M"); // { type: "major_triad", pattern: [0, 4, 7] }
```

## Special Scales

### Blues Variants
- `blues_pentatonic`, `BluesPentatonic`, `blues_pentatonic`
- `blues_hexatonic`, `BluesHexatonic`, `blues_hexatonic`
- `blues_heptatonic`, `BluesHeptatonic`, `blues_heptatonic`
- `blues_octatonic`, `BluesOctatonic`, `blues_octatonic`
- `blues_enneatonic`, `BluesEnneatonic`, `blues_enneatonic`

### Bebop Scales
- `bebop_major`, `BebopMajor`, `bebop_major`
- `bebop_dominant`, `BebopDominant`, `bebop_dominant`
- `bebop_minor`, `BebopMinor`, `bebop_minor`
- `bebop_half_diminished`, `BebopHalfDiminished`, `bebop_half_diminished`

### World Scales
- **Japanese**: `hira_joshi`, `HiraJoshi`, `kokin_joshi`, `KokinJoshi`, `iwato`, `Iwato`, `sakura`, `Sakura`
- **Chinese**: `youlan`, `Youlan`, `biyu`, `BiYu`, `kung`, `Kung`
- **Indian**: `raga`, `Raga`, `maqam`, `Maqam`, `hijaz`, `Hijaz`, `shadd'araban`, `Shadd'araban`

### Messiaen Modes
- `messiaen_1`, `MessiaenMode1`, `messiaen_1`
- `messiaen_2`, `MessiaenMode2`, `messiaen_2`
- `messiaen_3`, `MessiaenMode3`, `messiaen_3`
- `messiaen_4`, `MessiaenMode4`, `messiaen_4`
- `messiaen_5`, `MessiaenMode5`, `messiaen_5`
- `messiaen_6`, `MessiaenMode6`, `messiaen_6`
- `messiaen_7`, `MessiaenMode7`, `messiaen_7`

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
  "note_pattern": [0, 3, 7, 10],
  "metadata": {
    "version": "1.0.0",
    "confidence": 0.95,
    "detection_method": "manual",
    "resolved_by": "KeyLinkAliasResolver",
    "resolution_version": "1.0.0",
    "primitive_type": "minor_seventh",
    "primitive_category": "tetrads"
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
- `note_pattern`: Interval pattern array for precise representation
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

// Resolve note patterns
const pattern = resolver.resolveNotePattern("major"); // { type: "major_triad", pattern: [0, 4, 7] }
const notes = resolver.applyPatternToRoot("C", pattern.pattern); // ["C", "E", "G"]

// Resolve complete message
const resolvedMessage = resolver.resolveMessage({
  root_note: "Db",
  mode: "Ionian",
  chord_type: "M7",
  note_pattern: [0, 4, 7, 11],
  tempo: 120
});
```

### Max/MSP External

```maxmsp
[keylink_aliases] → [root Db] → [print root]  // Outputs: C#
[keylink_aliases] → [mode Ionian] → [print mode]  // Outputs: major
[keylink_aliases] → [chord M7] → [print chord]  // Outputs: maj7
[keylink_aliases] → [pattern major] → [print pattern]  // Outputs: [0, 4, 7]
[keylink_aliases] → [apply C major] → [print notes]  // Outputs: ["C", "E", "G"]

// Resolve complete JSON message
[keylink_aliases] → [resolve {"root_note":"Db","mode":"Ionian","note_pattern":[0,4,7]}] → [print json]
```

## Resolution Rules

1. **Priority Order**: canonical → aliases → note_primitives → special_scales
2. **Case Sensitivity**: Case-insensitive by default
3. **Whitespace Handling**: Trim and normalize multiple spaces
4. **Fallback Behavior**: Use input as canonical if no match found
5. **Pattern Normalization**: Patterns are normalized to start at 0 and sorted

## Extensibility

The alias system is built for growth and community contribution:

- **Custom Aliases**: Supported for local implementations
- **Community Contributions**: Encouraged via GitHub pull requests
- **Versioning**: Semantic versioning for standards evolution
- **Backward Compatibility**: Required for all updates
- **Pattern Extensions**: New interval patterns can be added to the primitives system

## Cultural Inclusion

KeyLink's alias system includes support for:

- **Western Classical Theory**: Major, minor, diminished, augmented
- **Jazz and Popular Symbols**: maj7, m7, sus4, etc.
- **Global Modal Systems**: Indian Ragas, Messiaen's Modes, microtonal variants
- **Experimental Constructs**: Contemporary and avant-garde terminology
- **Mathematical Representations**: Interval patterns for precise transposition

## Usage Examples

### Cross-Platform Compatibility

```javascript
// Max/MSP sends: {"root_note":"Db","mode":"Ionian","note_pattern":[0,4,7,11]}
// Web app receives: {"root_note":"C#","mode":"major","note_pattern":[0,4,7,11],"primitive_type":"major_seventh"}
// Both understand the same musical content despite different input formats
```

### Educational Applications

```javascript
// Student enters: "Do major" (solfège)
// System resolves to: "C major" (standard notation) with pattern [0,2,4,5,7,9,11]
// All connected devices receive consistent data
```

### Jazz and Contemporary Music

```javascript
// Jazz musician enters: "Bb7#9" (Hendrix chord)
// System resolves to: "A#7#9" (canonical form) with pattern [0,4,7,10,15]
// All devices interpret the same harmonic content
```

### Pattern-Based Composition

```javascript
// Composer works with interval patterns
const pattern = [0, 2, 7, 11]; // sus2 with major seventh
const notes = resolver.applyPatternToRoot("F", pattern); // ["F", "G", "C", "E"]
// Pattern can be transposed to any root note while maintaining harmonic relationship
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
- **Pattern Recognition**: Automatic detection of interval patterns from audio input
- **Harmonic Analysis**: Real-time chord and scale detection with pattern matching

---

**KeyLink Naming Standards v1.0.0** - The universal language for networked tonal synchronization with comprehensive note primitives support. 