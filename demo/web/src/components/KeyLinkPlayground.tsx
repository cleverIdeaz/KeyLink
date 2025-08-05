import React, { useState, useEffect } from 'react';
import KeyLinkAliasResolver from '../keylink-aliases';

interface NotePattern {
  intervals: number[];
  notes: string[];
  name: string;
}

// Popular scales for the simplified interface
const POPULAR_SCALES = [
  { name: 'Major', pattern: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Minor', pattern: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Pentatonic', pattern: [0, 2, 4, 7, 9] },
  { name: 'Blues', pattern: [0, 3, 5, 6, 7, 10] },
  { name: 'Chromatic', pattern: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
];

// Root notes - moved outside component to prevent recreation
const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Notation view types
type NotationView = 'piano' | 'staff' | 'guitar' | 'ukulele';

interface KeyLinkPlaygroundProps {
  onStateChange: (state: any) => void;
  resolver: KeyLinkAliasResolver;
}

export default function KeyLinkPlayground({ onStateChange, resolver }: KeyLinkPlaygroundProps) {
  const [selectedRoot, setSelectedRoot] = useState<string>('C');
  const [notationView, setNotationView] = useState<NotationView>('piano');
  const [currentPattern, setCurrentPattern] = useState<NotePattern | null>(null);

  // Set default pattern on mount
  useEffect(() => {
    const rootIndex = ROOTS.indexOf(selectedRoot);
    const defaultScale = POPULAR_SCALES[0]; // Major scale
    const notes = defaultScale.pattern.map((interval: number) => ROOTS[(rootIndex + interval) % 12]);
    
    setCurrentPattern({
      intervals: defaultScale.pattern,
      notes,
      name: defaultScale.name
    });
  }, [selectedRoot]);

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
        <h2 style={{ color: '#F5C242', margin: '0 0 10px 0' }}>Note Explorer</h2>
        <p style={{ color: '#ccc', margin: 0 }}>Discover musical patterns and scales</p>
      </div>

      {/* Simple Selection */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'center' }}>
        {/* Root Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#F5C242', textAlign: 'center' }}>Root</label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {ROOTS.map(root => (
              <button
                key={root}
                onClick={() => setSelectedRoot(root)}
                style={{
                  background: selectedRoot === root ? '#F5C242' : '#333',
                  color: selectedRoot === root ? '#222' : '#ccc',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '32px'
                }}
              >
                {root}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Scales */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#F5C242', textAlign: 'center' }}>Popular Scales</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {POPULAR_SCALES.map((scale) => (
            <button
              key={scale.name}
              onClick={() => {
                const rootIndex = ROOTS.indexOf(selectedRoot);
                const notes = scale.pattern.map((interval: number) => ROOTS[(rootIndex + interval) % 12]);
                setCurrentPattern({
                  intervals: scale.pattern,
                  notes,
                  name: scale.name
                });
                onStateChange({
                  root: selectedRoot,
                  mode: scale.name.toLowerCase(),
                  note_pattern: scale.pattern,
                  notes: notes,
                  source: 'keylink-playground',
                  timestamp: Date.now()
                });
              }}
              style={{
                background: '#333',
                color: '#ccc',
                border: '1px solid #555',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {scale.name}
            </button>
          ))}
        </div>
      </div>

      {/* Notation View Selection */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {(['piano', 'staff'] as NotationView[]).map(view => (
            <button
              key={view}
              onClick={() => setNotationView(view)}
              style={{
                padding: '8px 16px',
                background: notationView === view ? '#F5C242' : '#333',
                color: notationView === view ? '#000' : '#fff',
                border: '1px solid #555',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {view === 'piano' ? '🎹 Piano' : '🎼 Staff'}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Representation */}
      <div style={{ 
        background: '#222', 
        padding: '20px', 
        borderRadius: '8px',
        minHeight: '200px'
      }}>
        <h3 style={{ color: '#F5C242', margin: '0 0 15px 0' }}>
          {currentPattern?.name || 'Select a pattern'} in {selectedRoot}
        </h3>
        
        {/* Piano Keyboard View */}
        {notationView === 'piano' && currentPattern && (
          <PianoKeyboard 
            root={selectedRoot}
            activeNotes={currentPattern.notes}
            pattern={currentPattern}
          />
        )}

        {/* Staff View */}
        {notationView === 'staff' && currentPattern && (
          <StaffNotation 
            root={selectedRoot}
            activeNotes={currentPattern.notes}
            pattern={currentPattern}
          />
        )}

        {/* Guitar Tab View */}
        {notationView === 'guitar' && currentPattern && (
          <GuitarTab 
            root={selectedRoot}
            activeNotes={currentPattern.notes}
            pattern={currentPattern}
          />
        )}

        {/* Ukulele Tab View */}
        {notationView === 'ukulele' && currentPattern && (
          <UkuleleTab 
            root={selectedRoot}
            activeNotes={currentPattern.notes}
            pattern={currentPattern}
          />
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
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
  
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        position: 'relative',
        height: '120px'
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
        
        {/* Black Keys */}
        {blackKeys.map((note, index) => {
          const isActive = activeNotes.includes(note);
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
                left: `${(index < 2 ? index + 1 : index + 2) * 40 - 12}px`
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
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        background: '#fff', 
        color: '#000', 
        padding: '20px', 
        borderRadius: '4px',
        fontFamily: 'serif'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
          Treble Clef
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '80px',
          border: '1px solid #ccc',
          background: '#f9f9f9'
        }}>
          <span style={{ fontSize: '12px' }}>
            {activeNotes.join(' ')}
          </span>
        </div>
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
          {pattern.name} in {root}
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