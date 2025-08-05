import React, { useEffect, useState } from 'react';
import KeyLinkAliasResolver from '../keylink-aliases';

interface NotePattern {
  intervals: number[];
  notes: string[];
  name: string;
}

type NotationView = 'piano' | 'staff';

interface KeyLinkPlaygroundProps {
  onStateChange: (state: any) => void;
  resolver: KeyLinkAliasResolver;
}

// Root notes - moved outside component to prevent recreation
const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function KeyLinkPlayground({ onStateChange, resolver }: KeyLinkPlaygroundProps) {
  const [selectedRoot, setSelectedRoot] = useState<string>('C');
  const [notationView, setNotationView] = useState<NotationView>('piano');
  const [currentPattern, setCurrentPattern] = useState<NotePattern | null>(null);

  // Set default pattern on mount
  useEffect(() => {
    const rootIndex = ROOTS.indexOf(selectedRoot);
    const defaultPattern = [0, 2, 4, 5, 7, 9, 11]; // Major scale pattern
    const notes = defaultPattern.map((interval: number) => ROOTS[(rootIndex + interval) % 12]);
    
    setCurrentPattern({
      intervals: defaultPattern,
      notes,
      name: 'Major'
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
        <h2 style={{ color: '#F5C242', margin: '0 0 10px 0' }}>Visual Explorer</h2>
        <p style={{ color: '#ccc', margin: 0 }}>Loading musical patterns...</p>
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
        <h2 style={{ color: '#F5C242', margin: '0 0 10px 0' }}>Visual Explorer</h2>
        <p style={{ color: '#ccc', margin: 0 }}>Interactive piano and staff notation</p>
      </div>

      {/* Root Selection */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {ROOTS.map(root => (
          <button
            key={root}
            onClick={() => setSelectedRoot(root)}
            style={{
              background: selectedRoot === root ? '#F5C242' : '#333',
              color: selectedRoot === root ? '#222' : '#ccc',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              minWidth: '40px'
            }}
          >
            {root}
          </button>
        ))}
      </div>

      {/* Notation View Selection */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {(['piano', 'staff'] as NotationView[]).map(view => (
            <button
              key={view}
              onClick={() => setNotationView(view)}
              style={{
                padding: '10px 20px',
                background: notationView === view ? '#F5C242' : '#333',
                color: notationView === view ? '#000' : '#fff',
                border: '1px solid #555',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '16px',
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
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h3 style={{ color: '#F5C242', margin: '0 0 15px 0', textAlign: 'center' }}>
          {currentPattern?.name || 'Major'} in {selectedRoot}
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
      </div>

      {/* Pattern Info */}
      {currentPattern && (
        <div style={{ 
          background: '#2a2a2a', 
          padding: '16px', 
          borderRadius: '8px', 
          marginTop: '16px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#F5C242', fontWeight: 'bold', marginBottom: '8px' }}>
            Notes: {currentPattern.notes.join(' - ')}
          </div>
          <div style={{ color: '#ccc', fontSize: '14px' }}>
            Intervals: {currentPattern.intervals.map(i => i === 0 ? 'R' : i).join(' - ')}
          </div>
        </div>
      )}
    </div>
  );
}

// Piano Keyboard Component
function PianoKeyboard({ root, activeNotes, pattern }: { root: string; activeNotes: string[]; pattern: NotePattern }) {
  // Create a full octave of keys
  const allKeys = [
    { note: 'C', isBlack: false },
    { note: 'C#', isBlack: true },
    { note: 'D', isBlack: false },
    { note: 'D#', isBlack: true },
    { note: 'E', isBlack: false },
    { note: 'F', isBlack: false },
    { note: 'F#', isBlack: true },
    { note: 'G', isBlack: false },
    { note: 'G#', isBlack: true },
    { note: 'A', isBlack: false },
    { note: 'A#', isBlack: true },
    { note: 'B', isBlack: false }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      margin: '20px 0',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        position: 'relative',
        height: '120px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
        {/* White Keys */}
        {allKeys.map((key, index) => (
          <div
            key={key.note}
            style={{
              width: '40px',
              height: '120px',
              background: activeNotes.includes(key.note) ? '#F5C242' : '#fff',
              color: activeNotes.includes(key.note) ? '#222' : '#333',
              border: '1px solid #ccc',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              position: 'relative',
              zIndex: key.isBlack ? 2 : 1,
              marginLeft: key.isBlack ? '-12px' : '0',
              marginRight: key.isBlack ? '-12px' : '0'
            }}
          >
            {key.note}
          </div>
        ))}
        
        {/* Black Keys */}
        {allKeys.map((key, index) => key.isBlack && (
          <div
            key={`black-${key.note}`}
            style={{
              width: '24px',
              height: '80px',
              background: activeNotes.includes(key.note) ? '#F5C242' : '#333',
              color: activeNotes.includes(key.note) ? '#222' : '#fff',
              border: '1px solid #222',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '8px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              position: 'absolute',
              zIndex: 3,
              left: `${index * 40 - 12}px`,
              borderRadius: '0 0 4px 4px'
            }}
          >
            {key.note}
          </div>
        ))}
      </div>
    </div>
  );
}

// Staff Notation Component
function StaffNotation({ root, activeNotes, pattern }: { root: string; activeNotes: string[]; pattern: NotePattern }) {
  // Simple staff representation
  const staffLines = 5;
  const lineHeight = 8;
  const staffWidth = 300;
  
  // Note positions (simplified - in a real implementation you'd use proper music notation)
  const notePositions: { [key: string]: number } = {
    'C': 0, 'C#': 0.5, 'D': 1, 'D#': 1.5, 'E': 2, 'F': 3, 'F#': 3.5,
    'G': 4, 'G#': 4.5, 'A': 5, 'A#': 5.5, 'B': 6
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      margin: '20px 0'
    }}>
      {/* Treble Clef */}
      <div style={{ 
        fontSize: '24px', 
        marginBottom: '10px',
        color: '#F5C242'
      }}>
        𝄞
      </div>
      
      {/* Staff */}
      <div style={{
        position: 'relative',
        width: staffWidth,
        height: staffLines * lineHeight + 20,
        background: '#fff',
        borderRadius: '4px',
        padding: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        {/* Staff Lines */}
        {Array.from({ length: staffLines }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${i * lineHeight + 10}px`,
              height: '1px',
              background: '#333'
            }}
          />
        ))}
        
        {/* Notes */}
        {activeNotes.map((note, index) => {
          const position = notePositions[note] || 0;
          const x = 50 + (index * 30);
          const y = 10 + (position * lineHeight / 2);
          
          return (
            <div
              key={`${note}-${index}`}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: '12px',
                height: '12px',
                background: '#F5C242',
                borderRadius: '50%',
                border: '2px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                color: '#222'
              }}
            >
              {note}
            </div>
          );
        })}
        
        {/* Time Signature */}
        <div style={{
          position: 'absolute',
          left: '10px',
          top: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          4/4
        </div>
      </div>
      
      {/* Pattern Name */}
      <div style={{
        marginTop: '10px',
        fontSize: '14px',
        color: '#F5C242',
        fontWeight: 'bold'
      }}>
        {pattern.name} Scale
      </div>
    </div>
  );
} 