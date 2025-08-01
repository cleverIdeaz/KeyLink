/**
 * KeyLink Alias Resolution SDK
 * Provides standardized naming conventions and alias resolution for unified tonal synchronization
 * @version 1.0.0
 * @license MIT
 */

class KeyLinkAliasResolver {
  constructor() {
    this.standards = null;
    this.initialized = false;
  }

  /**
   * Initialize the resolver with standards data
   * @param {Object} standards - The KeyLink standards object
   */
  async initialize(standards = null) {
    if (standards) {
      this.standards = standards;
    } else {
      // Load from local standards file
      try {
        const response = await fetch('/keylink-standards.json');
        this.standards = await response.json();
      } catch (error) {
        console.warn('Could not load KeyLink standards, using built-in defaults');
        this.standards = this.getDefaultStandards();
      }
    }
    this.initialized = true;
  }

  /**
   * Get default standards if external file is unavailable
   */
  getDefaultStandards() {
    return {
      root_notes: {
        canonical: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        aliases: {
          "C": ["C", "Do", "1", "I"],
          "C#": ["C#", "Db", "Cis", "Des"],
          "D": ["D", "Re", "2", "II"],
          "D#": ["D#", "Eb", "Dis", "Es"],
          "E": ["E", "Mi", "3", "III"],
          "F": ["F", "Fa", "4", "IV"],
          "F#": ["F#", "Gb", "Fis", "Ges"],
          "G": ["G", "Sol", "5", "V"],
          "G#": ["G#", "Ab", "Gis", "As"],
          "A": ["A", "La", "6", "VI"],
          "A#": ["A#", "Bb", "Ais", "B"],
          "B": ["B", "Si", "7", "VII"]
        }
      },
      modes: {
        canonical: ["major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"],
        aliases: {
          "major": ["major", "Maj", "M", "Ionian", "1", "I"],
          "minor": ["minor", "min", "m", "Aeolian", "6", "VI"],
          "dorian": ["dorian", "Dorian", "2", "II"],
          "phrygian": ["phrygian", "Phrygian", "3", "III"],
          "lydian": ["lydian", "Lydian", "4", "IV"],
          "mixolydian": ["mixolydian", "Mixolydian", "5", "V"],
          "aeolian": ["aeolian", "Aeolian", "6", "VI"],
          "locrian": ["locrian", "Locrian", "7", "VII"]
        }
      },
      chord_types: {
        canonical: ["maj", "min", "dim", "aug", "sus2", "sus4", "7", "maj7", "m7", "dim7", "m7b5"],
        aliases: {
          "maj": ["maj", "major", "Major", "M"],
          "min": ["min", "minor", "Minor", "m"],
          "dim": ["dim", "diminished", "Diminished", "d"],
          "aug": ["aug", "augmented", "Augmented", "A"],
          "7": ["7", "dom7", "dominant7"],
          "maj7": ["maj7", "major7", "Major7", "M7"],
          "m7": ["m7", "min7", "minor7", "Minor7"]
        }
      },
      note_primitives: {
        intervals: {
          "unison": {
            "pattern": [0],
            "aliases": ["unison", "prime", "1", "P1", "perfect unison"]
          },
          "minor_second": {
            "pattern": [0, 1],
            "aliases": ["minor second", "m2", "minor 2nd", "semitone", "half step"]
          },
          "major_second": {
            "pattern": [0, 2],
            "aliases": ["major second", "M2", "major 2nd", "whole tone", "whole step"]
          },
          "minor_third": {
            "pattern": [0, 3],
            "aliases": ["minor third", "m3", "minor 3rd"]
          },
          "major_third": {
            "pattern": [0, 4],
            "aliases": ["major third", "M3", "major 3rd"]
          },
          "perfect_fourth": {
            "pattern": [0, 5],
            "aliases": ["perfect fourth", "P4", "perfect 4th", "fourth"]
          },
          "tritone": {
            "pattern": [0, 6],
            "aliases": ["tritone", "augmented fourth", "diminished fifth", "A4", "d5", "devil's interval"]
          },
          "perfect_fifth": {
            "pattern": [0, 7],
            "aliases": ["perfect fifth", "P5", "perfect 5th", "fifth"]
          },
          "minor_sixth": {
            "pattern": [0, 8],
            "aliases": ["minor sixth", "m6", "minor 6th"]
          },
          "major_sixth": {
            "pattern": [0, 9],
            "aliases": ["major sixth", "M6", "major 6th"]
          },
          "minor_seventh": {
            "pattern": [0, 10],
            "aliases": ["minor seventh", "m7", "minor 7th"]
          },
          "major_seventh": {
            "pattern": [0, 11],
            "aliases": ["major seventh", "M7", "major 7th"]
          },
          "octave": {
            "pattern": [0, 12],
            "aliases": ["octave", "8ve", "perfect octave", "P8"]
          }
        },
        triads: {
          "major_triad": {
            "pattern": [0, 4, 7],
            "aliases": ["major", "maj", "M", "major triad", "major chord"]
          },
          "minor_triad": {
            "pattern": [0, 3, 7],
            "aliases": ["minor", "min", "m", "minor triad", "minor chord"]
          },
          "diminished_triad": {
            "pattern": [0, 3, 6],
            "aliases": ["diminished", "dim", "d", "diminished triad", "diminished chord"]
          },
          "augmented_triad": {
            "pattern": [0, 4, 8],
            "aliases": ["augmented", "aug", "A", "augmented triad", "augmented chord"]
          }
        },
        tetrads: {
          "major_seventh": {
            "pattern": [0, 4, 7, 11],
            "aliases": ["maj7", "major7", "M7", "major seventh", "major 7th"]
          },
          "minor_seventh": {
            "pattern": [0, 3, 7, 10],
            "aliases": ["m7", "min7", "minor7", "minor seventh", "minor 7th"]
          },
          "dominant_seventh": {
            "pattern": [0, 4, 7, 10],
            "aliases": ["7", "dom7", "dominant7", "dominant seventh", "dominant 7th"]
          }
        }
      }
    };
  }

  /**
   * Resolve a root note to its canonical form
   * @param {string} input - The input root note
   * @returns {string} The canonical root note
   */
  resolveRootNote(input) {
    if (!this.initialized) {
      console.warn('KeyLinkAliasResolver not initialized');
      return input;
    }

    const normalized = this.normalizeInput(input);
    
    // Check canonical first
    if (this.standards.root_notes.canonical.includes(normalized)) {
      return normalized;
    }

    // Check aliases
    for (const [canonical, aliases] of Object.entries(this.standards.root_notes.aliases)) {
      if (aliases.includes(normalized)) {
        return canonical;
      }
    }

    // Fallback to input
    return input;
  }

  /**
   * Resolve a mode to its canonical form
   * @param {string} input - The input mode
   * @returns {string} The canonical mode
   */
  resolveMode(input) {
    if (!this.initialized) {
      console.warn('KeyLinkAliasResolver not initialized');
      return input;
    }

    const normalized = this.normalizeInput(input);
    
    // Check canonical first
    if (this.standards.modes.canonical.includes(normalized)) {
      return normalized;
    }

    // Check aliases
    for (const [canonical, aliases] of Object.entries(this.standards.modes.aliases)) {
      if (aliases.includes(normalized)) {
        return canonical;
      }
    }

    // Check special scales
    if (this.standards.special_scales) {
      for (const category of Object.values(this.standards.special_scales)) {
        for (const [canonical, aliases] of Object.entries(category)) {
          if (aliases.includes(normalized)) {
            return canonical;
          }
        }
      }
    }

    // Fallback to input
    return input;
  }

  /**
   * Resolve a chord type to its canonical form
   * @param {string} input - The input chord type
   * @returns {string} The canonical chord type
   */
  resolveChordType(input) {
    if (!this.initialized) {
      console.warn('KeyLinkAliasResolver not initialized');
      return input;
    }

    const normalized = this.normalizeInput(input);
    
    // Check canonical first
    if (this.standards.chord_types.canonical.includes(normalized)) {
      return normalized;
    }

    // Check aliases
    for (const [canonical, aliases] of Object.entries(this.standards.chord_types.aliases)) {
      if (aliases.includes(normalized)) {
        return canonical;
      }
    }

    // Fallback to input
    return input;
  }

  /**
   * Resolve a note pattern to its primitive type
   * @param {Array} pattern - The interval pattern array
   * @returns {Object} Object containing primitive type and metadata
   */
  resolveNotePattern(pattern) {
    if (!this.initialized || !this.standards.note_primitives) {
      return { type: 'unknown', pattern: pattern };
    }

    // Normalize pattern to start at 0 and sort
    const normalizedPattern = this.normalizePattern(pattern);
    
    // Search through all primitive categories
    for (const [category, primitives] of Object.entries(this.standards.note_primitives)) {
      for (const [primitiveName, primitiveData] of Object.entries(primitives)) {
        if (this.patternsMatch(normalizedPattern, primitiveData.pattern)) {
          return {
            type: primitiveName,
            category: category,
            pattern: normalizedPattern,
            aliases: primitiveData.aliases || []
          };
        }
      }
    }

    // If no match found, return unknown
    return {
      type: 'unknown',
      category: 'custom',
      pattern: normalizedPattern,
      aliases: []
    };
  }

  /**
   * Normalize a pattern to start at 0 and sort
   * @param {Array} pattern - The input pattern
   * @returns {Array} The normalized pattern
   */
  normalizePattern(pattern) {
    if (!Array.isArray(pattern) || pattern.length === 0) {
      return [0];
    }

    // Find the minimum value and subtract it from all values
    const min = Math.min(...pattern);
    const normalized = pattern.map(n => n - min).sort((a, b) => a - b);
    
    return normalized;
  }

  /**
   * Check if two patterns match (allowing for octave transposition)
   * @param {Array} pattern1 - First pattern
   * @param {Array} pattern2 - Second pattern
   * @returns {boolean} True if patterns match
   */
  patternsMatch(pattern1, pattern2) {
    if (!Array.isArray(pattern1) || !Array.isArray(pattern2)) {
      return false;
    }

    if (pattern1.length !== pattern2.length) {
      return false;
    }

    // Check if patterns are identical
    for (let i = 0; i < pattern1.length; i++) {
      if (pattern1[i] !== pattern2[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get a note pattern by primitive type
   * @param {string} primitiveType - The primitive type name
   * @returns {Array|null} The pattern array or null if not found
   */
  getPatternByType(primitiveType) {
    if (!this.initialized || !this.standards.note_primitives) {
      return null;
    }

    const normalized = this.normalizeInput(primitiveType);

    // Search through all primitive categories
    for (const [category, primitives] of Object.entries(this.standards.note_primitives)) {
      for (const [primitiveName, primitiveData] of Object.entries(primitives)) {
        if (primitiveName === normalized || 
            (primitiveData.aliases && primitiveData.aliases.includes(normalized))) {
          return primitiveData.pattern;
        }
      }
    }

    return null;
  }

  /**
   * Apply a pattern to a root note
   * @param {string} rootNote - The root note
   * @param {Array} pattern - The interval pattern
   * @returns {Array} Array of note names
   */
  applyPatternToRoot(rootNote, pattern) {
    if (!Array.isArray(pattern) || pattern.length === 0) {
      return [rootNote];
    }

    const rootIndex = this.getRootNoteIndex(rootNote);
    if (rootIndex === -1) {
      return [rootNote];
    }

    const noteNames = this.standards.root_notes.canonical;
    const result = [];

    for (const interval of pattern) {
      const noteIndex = (rootIndex + interval) % 12;
      result.push(noteNames[noteIndex]);
    }

    return result;
  }

  /**
   * Get the index of a root note in the canonical array
   * @param {string} rootNote - The root note
   * @returns {number} The index or -1 if not found
   */
  getRootNoteIndex(rootNote) {
    if (!this.standards.root_notes.canonical) {
      return -1;
    }

    const resolved = this.resolveRootNote(rootNote);
    return this.standards.root_notes.canonical.indexOf(resolved);
  }

  /**
   * Normalize input according to resolution rules
   * @param {string} input - The input string
   * @returns {string} The normalized string
   */
  normalizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let normalized = input.trim();
    
    // Handle case sensitivity
    if (this.standards.resolution_rules?.case_sensitivity === false) {
      normalized = normalized.toLowerCase();
    }

    // Handle whitespace
    if (this.standards.resolution_rules?.whitespace_handling === 'trim_and_normalize') {
      normalized = normalized.replace(/\s+/g, ' ');
    }

    return normalized;
  }

  /**
   * Resolve a complete KeyLink message to canonical form
   * @param {Object} message - The input message
   * @returns {Object} The canonical message
   */
  resolveMessage(message) {
    if (!this.initialized) {
      console.warn('KeyLinkAliasResolver not initialized');
      return message;
    }

    const resolved = { ...message };

    // Resolve root note
    if (resolved.root_note) {
      resolved.root_note = this.resolveRootNote(resolved.root_note);
    }

    // Resolve mode
    if (resolved.mode) {
      resolved.mode = this.resolveMode(resolved.mode);
    }

    // Resolve chord type
    if (resolved.chord_type) {
      resolved.chord_type = this.resolveChordType(resolved.chord_type);
    }

    // Resolve note pattern if present
    if (resolved.note_pattern) {
      const patternResolution = this.resolveNotePattern(resolved.note_pattern);
      resolved.note_pattern = patternResolution.pattern;
      
      // Add primitive type to metadata
      if (!resolved.metadata) {
        resolved.metadata = {};
      }
      resolved.metadata.primitive_type = patternResolution.type;
      resolved.metadata.primitive_category = patternResolution.category;
    }

    // Add resolution metadata
    resolved.metadata = resolved.metadata || {};
    resolved.metadata.resolved_by = 'KeyLinkAliasResolver';
    resolved.metadata.resolution_version = this.standards.keylink_version;

    return resolved;
  }

  /**
   * Get all available aliases for a canonical term
   * @param {string} canonical - The canonical term
   * @param {string} category - The category (root_notes, modes, chord_types)
   * @returns {Array} Array of aliases
   */
  getAliases(canonical, category) {
    if (!this.initialized || !this.standards[category]) {
      return [];
    }

    return this.standards[category].aliases[canonical] || [];
  }

  /**
   * Get all canonical terms for a category
   * @param {string} category - The category (root_notes, modes, chord_types)
   * @returns {Array} Array of canonical terms
   */
  getCanonicalTerms(category) {
    if (!this.initialized || !this.standards[category]) {
      return [];
    }

    return this.standards[category].canonical || [];
  }

  /**
   * Get all available primitive types
   * @returns {Object} Object with categories and their primitive types
   */
  getPrimitiveTypes() {
    if (!this.initialized || !this.standards.note_primitives) {
      return {};
    }

    const result = {};
    for (const [category, primitives] of Object.entries(this.standards.note_primitives)) {
      result[category] = Object.keys(primitives);
    }
    return result;
  }

  /**
   * Validate a message against the schema
   * @param {Object} message - The message to validate
   * @returns {Object} Validation result
   */
  validateMessage(message) {
    if (!this.initialized) {
      return { valid: false, errors: ['Resolver not initialized'] };
    }

    const errors = [];
    const required = this.standards.message_schema.required_fields;

    for (const field of required) {
      if (!message[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyLinkAliasResolver;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
  window.KeyLinkAliasResolver = KeyLinkAliasResolver;
} 