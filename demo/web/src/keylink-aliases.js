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