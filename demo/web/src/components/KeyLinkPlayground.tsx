import React, { useState, useEffect } from 'react';
import KeyLinkAliasResolver from '../keylink-aliases';

interface NotePattern {
  intervals: number[];
  notes: string[];
  name: string;
}

// Popular scales for the simplified interface


const MODE_CATEGORIES = {
  simple: {
    name: 'Simple',
    options: ['major', 'minor']
  },
  modes: {
    name: 'Modes',
    options: ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian']
  },
  chords: {
    name: 'Chords',
    options: ['maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4']
  },
  scales: {
    name: 'Scales',
    options: ['major', 'minor', 'pentatonic', 'blues', 'harmonic-minor', 'melodic-minor', 'whole-tone', 'chromatic']
  }
};

// Root notes - moved outside component to prevent recreation
const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Notation view types
type NotationView = 'piano' | 'staff' | 'guitar' | 'ukulele';

interface KeyLinkPlaygroundProps {
  onStateChange: (state: any) => void;
  resolver: KeyLinkAliasResolver;
  root?: string;
  onRootChange?: (root: string) => void;
  mode?: string;
  modeCategory?: string;
  onModeChange?: (mode: string) => void;
  onModeCategoryChange?: (category: string) => void;
}

export default function KeyLinkPlayground({ 
  onStateChange, 
  resolver, 
  root, 
  onRootChange, 
  mode, 
  modeCategory, 
  onModeChange, 
  onModeCategoryChange 
}: KeyLinkPlaygroundProps) {
  const [selectedRoot, setSelectedRoot] = useState<string>(root || 'C');
  const [selectedMode, setSelectedMode] = useState<string>(mode || 'major');
  const [selectedModeCategory, setSelectedModeCategory] = useState<string>(modeCategory || 'simple');
  const [notationView, setNotationView] = useState<NotationView>('piano');
  const [currentPattern, setCurrentPattern] = useState<NotePattern | null>(null);

  // Sync with parent root when it changes
  useEffect(() => {
    if (root && root !== selectedRoot) {
      setSelectedRoot(root);
    }
  }, [root, selectedRoot]);

  // Sync with parent mode when it changes
  useEffect(() => {
    if (mode && mode !== selectedMode) {
      setSelectedMode(mode);
    }
  }, [mode, selectedMode]);

  // Sync with parent modeCategory when it changes
  useEffect(() => {
    if (modeCategory && modeCategory !== selectedModeCategory) {
      setSelectedModeCategory(modeCategory);
    }
  }, [modeCategory, selectedModeCategory]);

  // Update pattern when root or mode changes
  useEffect(() => {
    const rootIndex = ROOTS.indexOf(selectedRoot);
    
    // Map mode names to patterns
    const modePatterns: { [key: string]: number[] } = {
      'major': [0, 2, 4, 5, 7, 9, 11],
      'minor': [0, 2, 3, 5, 7, 8, 10],
      'dorian': [0, 2, 3, 5, 7, 9, 10],
      'phrygian': [0, 1, 3, 5, 7, 8, 10],
      'lydian': [0, 2, 4, 6, 7, 9, 11],
      'mixolydian': [0, 2, 4, 5, 7, 9, 10],
      'locrian': [0, 1, 3, 5, 6, 8, 10],
      'pentatonic': [0, 2, 4, 7, 9],
      'blues': [0, 3, 5, 6, 7, 10],
      'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
      'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
      'whole-tone': [0, 2, 4, 6, 8, 10],
      // Chord patterns
      'maj': [0, 4, 7],
      'min': [0, 3, 7],
      '7': [0, 4, 7, 10],
      'maj7': [0, 4, 7, 11],
      'min7': [0, 3, 7, 10],
      'dim': [0, 3, 6],
      'aug': [0, 4, 8],
      'sus2': [0, 2, 7],
      'sus4': [0, 5, 7]
    };
    
    const pattern = modePatterns[selectedMode] || modePatterns['major'];
    const notes = pattern.map((interval: number) => ROOTS[(rootIndex + interval) % 12]);
    
    setCurrentPattern({
      intervals: pattern,
      notes,
      name: selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)
    });
    
    // Update parent state
    onStateChange({
      root: selectedRoot,
      mode: selectedMode,
      note_pattern: pattern,
      notes: notes,
      source: 'keylink-playground',
      timestamp: Date.now()
    });
  }, [selectedRoot, selectedMode, onStateChange]);

  if (!resolver) {
    return (
      <div className="keylink-playground" style={{
        background: '#1a1a1a',
        color: '#fff',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#F5C242', margin: '0 0 10px 0' }}>KeyLink Interactive Playground</h2>
        <p style={{ color: '#ccc', margin: 0 }}>Loading note primitives...</p>
      </div>
    );
  }

  return (
    <div className="keylink-playground" style={{
      background: '#1a1a1a',
      color: '#fff',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#F5C242', margin: '0 0 10px 0' }}>Interactive Music Explorer</h2>
        <p style={{ color: '#ccc', margin: 0 }}>Visualize scales, chords, and musical patterns</p>
      </div>

      {/* Root Selection */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#F5C242', fontSize: '16px', fontWeight: 'bold' }}>Root Note</label>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {ROOTS.map(root => (
            <button
              key={root}
              onClick={() => {
                setSelectedRoot(root);
                if (onRootChange) {
                  onRootChange(root);
                }
              }}
              style={{
                background: selectedRoot === root ? '#F5C242' : '#333',
                color: selectedRoot === root ? '#222' : '#ccc',
                border: '1px solid #555',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                minWidth: '40px',
                transition: 'all 0.2s ease'
              }}
            >
              {root}
            </button>
          ))}
        </div>
      </div>

      {/* Mode/Category Selection - Synced with main interface */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#F5C242', fontSize: '16px', fontWeight: 'bold' }}>Mode/Category</label>
        
        {/* Category Selector */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.entries(MODE_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedModeCategory(key);
                  setSelectedMode(cat.options[0]);
                  if (onModeCategoryChange) onModeCategoryChange(key);
                  if (onModeChange) onModeChange(cat.options[0]);
                }}
                style={{
                  background: selectedModeCategory === key ? '#F5C242' : '#333',
                  color: selectedModeCategory === key ? '#222' : '#ccc',
                  border: '1px solid #555',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {MODE_CATEGORIES[selectedModeCategory as keyof typeof MODE_CATEGORIES]?.options.map((option) => (
            <button
              key={option}
              onClick={() => {
                setSelectedMode(option);
                if (onModeChange) onModeChange(option);
              }}
              style={{
                background: selectedMode === option ? '#F5C242' : '#333',
                color: selectedMode === option ? '#222' : '#ccc',
                border: '1px solid #555',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* View Selection */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {(['piano', 'staff', 'guitar', 'ukulele'] as NotationView[]).map(view => (
            <button
              key={view}
              onClick={() => setNotationView(view)}
              style={{
                padding: '10px 20px',
                background: notationView === view ? '#F5C242' : '#333',
                color: notationView === view ? '#000' : '#fff',
                border: '1px solid #555',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              {view === 'piano' ? '🎹 Piano' : 
               view === 'staff' ? '🎼 Staff' : 
               view === 'guitar' ? '🎸 Guitar' : 
               '🪕 Ukulele'}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Representation */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', 
        padding: '30px', 
        borderRadius: '12px',
        minHeight: '300px',
        border: '1px solid #333',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#F5C242', margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold' }}>
            {currentPattern?.name || 'Select a scale'} in {selectedRoot}
          </h3>
          {currentPattern && (
            <p style={{ color: '#ccc', margin: 0, fontSize: '14px' }}>
              {currentPattern.notes.join(' - ')}
            </p>
          )}
        </div>
        
        {/* Piano Keyboard View */}
        {notationView === 'piano' && currentPattern && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <PianoKeyboard 
              root={selectedRoot}
              activeNotes={currentPattern.notes}
              pattern={currentPattern}
            />
          </div>
        )}

        {/* Staff View */}
        {notationView === 'staff' && currentPattern && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <StaffNotation 
              root={selectedRoot}
              activeNotes={currentPattern.notes}
              pattern={currentPattern}
            />
          </div>
        )}

        {/* Guitar Tab View */}
        {notationView === 'guitar' && currentPattern && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <GuitarTab 
              root={selectedRoot}
              activeNotes={currentPattern.notes}
              pattern={currentPattern}
            />
          </div>
        )}

        {/* Ukulele Tab View */}
        {notationView === 'ukulele' && currentPattern && (
          <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <UkuleleTab 
              root={selectedRoot}
              activeNotes={currentPattern.notes}
              pattern={currentPattern}
            />
          </div>
        )}

        {!currentPattern && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            fontSize: '16px'
          }}>
            Select a scale type to visualize the pattern
          </div>
        )}
      </div>

      {/* Pattern Info */}
      {currentPattern && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: '#333', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>Intervals:</strong> [{currentPattern.intervals.join(', ')}] | 
          <strong> Notes:</strong> {currentPattern.notes.join(', ')}
        </div>
      )}
    </div>
  );
}

// Piano Keyboard Component
function PianoKeyboard({ root, activeNotes, pattern }: { root: string; activeNotes: string[]; pattern: NotePattern }) {
  // Create a full octave of keys starting from the root
  const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = allNotes.indexOf(root);
  
  // Generate notes for one octave starting from root
  const octaveNotes = [];
  for (let i = 0; i < 12; i++) {
    const noteIndex = (rootIndex + i) % 12;
    octaveNotes.push(allNotes[noteIndex]);
  }
  
  const whiteKeys = octaveNotes.filter(note => !note.includes('#'));
  const blackKeys = octaveNotes.filter(note => note.includes('#'));
  
  return (
    <div style={{ textAlign: 'center' }}>
      <h4 style={{ color: '#F5C242', margin: '0 0 10px 0' }}>Piano Keyboard - {root} Key</h4>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        position: 'relative',
        height: '120px',
        margin: '0 auto',
        maxWidth: 'fit-content'
      }}>
        {/* White Keys */}
        {whiteKeys.map((note, index) => {
          const isActive = activeNotes.includes(note);
          return (
            <div
              key={note}
              style={{
                width: '40px',
                height: '120px',
                background: isActive ? '#F5C242' : '#fff',
                color: isActive ? '#000' : '#000',
                border: '1px solid #000',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '10px',
                fontWeight: 'bold',
                position: 'relative',
                zIndex: 1
              }}
            >
              {note}
            </div>
          );
        })}
        
        {/* Black Keys - positioned between white keys */}
        {blackKeys.map((note, index) => {
          const isActive = activeNotes.includes(note);
          // Calculate position based on white key positions
          const whiteKeyPositions = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
          const noteIndex = allNotes.indexOf(note);
          const whiteKeyIndex = whiteKeyPositions.findIndex(pos => pos > noteIndex) - 1;
          
          return (
            <div
              key={note}
              style={{
                width: '24px',
                height: '80px',
                background: isActive ? '#F5C242' : '#000',
                color: isActive ? '#000' : '#fff',
                border: '1px solid #000',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '10px',
                fontWeight: 'bold',
                position: 'absolute',
                zIndex: 2,
                left: `${whiteKeyIndex * 40 + 28}px`
              }}
            >
              {note}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Staff Notation Component
function StaffNotation({ root, activeNotes, pattern }: { root: string; activeNotes: string[]; pattern: NotePattern }) {
  // Note positions on staff (relative to middle C)
  const notePositions: { [key: string]: number } = {
    'C': 0, 'C#': 0, 'D': 1, 'D#': 1, 'E': 2, 'F': 3, 'F#': 3, 
    'G': 4, 'G#': 4, 'A': 5, 'A#': 5, 'B': 6
  };
  
  return (
    <div style={{ textAlign: 'center' }}>
      <h4 style={{ color: '#F5C242', margin: '0 0 10px 0' }}>Musical Staff - {root} Key</h4>
      <div style={{ 
        background: '#fff', 
        color: '#000', 
        padding: '20px', 
        borderRadius: '8px',
        fontFamily: 'serif',
        border: '2px solid #333'
      }}>
        {/* Treble Clef Symbol */}
        <div style={{ 
          fontSize: '32px', 
          marginBottom: '10px',
          textAlign: 'left',
          marginLeft: '10px',
          lineHeight: '1'
        }}>
          𝄞
        </div>
        
        {/* Staff Lines */}
        <div style={{ 
          position: 'relative',
          height: '80px',
          margin: '10px 0'
        }}>
          {/* Staff lines */}
          {[0, 1, 2, 3, 4].map(line => (
            <div
              key={line}
              style={{
                position: 'absolute',
                left: '50px',
                right: '20px',
                height: '2px',
                background: '#000',
                top: `${line * 16}px`
              }}
            />
          ))}
          
          {/* Note positions on staff */}
          {activeNotes.slice(0, 8).map((note, index) => {
            const position = notePositions[note] || 0;
            const yPos = 64 - (position * 8); // Invert for staff positioning
            
            return (
              <div
                key={note}
                style={{
                  position: 'absolute',
                  left: `${80 + index * 40}px`,
                  top: `${yPos}px`,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#F5C242',
                  transform: 'translateY(-8px)'
                }}
              >
                ♪
              </div>
            );
          })}
        </div>
        
        <div style={{ 
          fontSize: '12px', 
          marginTop: '10px', 
          color: '#666',
          textAlign: 'left',
          marginLeft: '10px'
        }}>
          {pattern.name} in {root} - Notes: {activeNotes.join(', ')}
        </div>
      </div>
    </div>
  );
}

// Guitar Tab Component
function GuitarTab({ root, activeNotes, pattern }: { root: string; activeNotes: string[]; pattern: NotePattern }) {
  const strings = ['E', 'A', 'D', 'G', 'B', 'E'];
  
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        background: '#fff', 
        color: '#000', 
        padding: '15px', 
        borderRadius: '4px',
        fontFamily: 'monospace'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
          Guitar Tab
        </div>
        {strings.map((string, index) => (
          <div key={string} style={{ 
            display: 'flex', 
            alignItems: 'center',
            borderBottom: '1px solid #ccc',
            padding: '5px 0'
          }}>
            <span style={{ width: '20px', textAlign: 'right', marginRight: '10px' }}>
              {string}
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}>
              {activeNotes.includes(string) ? '●' : '-'}
            </span>
          </div>
        ))}
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
          {pattern.name} in {root}
        </div>
      </div>
    </div>
  );
}

// Ukulele Tab Component
function UkuleleTab({ root, activeNotes, pattern }: { root: string; activeNotes: string[]; pattern: NotePattern }) {
  const strings = ['G', 'C', 'E', 'A'];
  
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        background: '#fff', 
        color: '#000', 
        padding: '15px', 
        borderRadius: '4px',
        fontFamily: 'monospace'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
          Ukulele Tab
        </div>
        {strings.map((string, index) => (
          <div key={string} style={{ 
            display: 'flex', 
            alignItems: 'center',
            borderBottom: '1px solid #ccc',
            padding: '5px 0'
          }}>
            <span style={{ width: '20px', textAlign: 'right', marginRight: '10px' }}>
              {string}
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}>
              {activeNotes.includes(string) ? '●' : '-'}
            </span>
          </div>
        ))}
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
          {pattern.name} in {root}
        </div>
      </div>
    </div>
  );
} 