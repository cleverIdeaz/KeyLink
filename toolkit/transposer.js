// transposer.js
// Functions for transposing audio or MIDI clips in response to key, mode, or chord changes

const NOTE_TO_SEMITONE = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

/**
 * Calculate the number of semitones to transpose from one key/mode to another.
 * Handles relative and parallel major/minor cases.
 * @param {string} fromRoot - e.g., 'C'
 * @param {string} fromMode - e.g., 'major' or 'minor'
 * @param {string} toRoot - e.g., 'D'
 * @param {string} toMode - e.g., 'major' or 'minor'
 * @returns {number} - Number of semitones to transpose
 */
function calculateTransposition(fromRoot, fromMode, toRoot, toMode) {
  const from = NOTE_TO_SEMITONE[fromRoot];
  const to = NOTE_TO_SEMITONE[toRoot];
  if (from === undefined || to === undefined) return 0;

  // Relative major/minor: C major <-> A minor, etc.
  // Parallel major/minor: C major <-> C minor, etc.
  // For now, just transpose by root difference
  let semitones = to - from;

  // If going between major and relative minor (e.g., C major to A minor)
  if ((fromMode === 'major' && toMode === 'minor') && (to === (from + 9) % 12)) {
    // No transposition needed (relative minor)
    semitones = 0;
  } else if ((fromMode === 'minor' && toMode === 'major') && (to === (from + 3) % 12)) {
    // No transposition needed (relative major)
    semitones = 0;
  }
  // Normalize to -11..+11
  if (semitones > 6) semitones -= 12;
  if (semitones < -6) semitones += 12;
  return semitones;
}

/**
 * Transpose a MIDI note number by a given number of semitones.
 * @param {number} midiNote - Original MIDI note number
 * @param {number} semitones - Number of semitones to transpose
 * @returns {number} - Transposed MIDI note number
 */
function transposeMIDINote(midiNote, semitones) {
  return midiNote + semitones;
}

/**
 * Transpose an array of MIDI notes.
 * @param {number[]} midiNotes - Array of MIDI note numbers
 * @param {number} semitones - Number of semitones to transpose
 * @returns {number[]} - Transposed MIDI notes
 */
function transposeMIDINotes(midiNotes, semitones) {
  return midiNotes.map(n => transposeMIDINote(n, semitones));
}

// Placeholder for audio transposition (implementation depends on host environment)
function transposeAudio(audioBuffer, semitones) {
  // TODO: Implement audio transposition (e.g., using Web Audio API, Max, or DAW tools)
  return audioBuffer;
}

module.exports = {
  calculateTransposition,
  transposeMIDINote,
  transposeMIDINotes,
  transposeAudio
}; 