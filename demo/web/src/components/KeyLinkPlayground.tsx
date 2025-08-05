import React, { useState, useEffect } from 'react';
import KeyLinkAliasResolver from '../keylink-aliases';

// Types for our hierarchical selection system
interface CategoryOption {
  id: string;
  name: string;
  description: string;
  hasSubCategories: boolean;
}

interface SubCategoryOption {
  id: string;
  name: string;
  description: string;
  primitiveIndex?: number;
}

interface NotePattern {
  intervals: number[];
  notes: string[];
  name: string;
}

// Categories inspired by the Max patch
const CATEGORIES: CategoryOption[] = [
  { id: 'simple', name: 'SIMPLE(M/m)', description: 'Basic major and minor scales', hasSubCategories: true },
  { id: 'common', name: 'COMMON', description: 'Commonly used scales and modes', hasSubCategories: true },
  { id: 'chords', name: 'CHORDS(C)', description: 'Chord types and progressions', hasSubCategories: true },
  { id: 'modal', name: 'MODAL', description: 'Modal scales and variations', hasSubCategories: true },
  { id: 'jazz', name: 'JAZZ', description: 'Jazz scales and harmony', hasSubCategories: true },
  { id: 'blues', name: 'BLUES', description: 'Blues scales and variations', hasSubCategories: true },
  { id: 'world', name: 'WORLD', description: 'World music scales', hasSubCategories: true },
  { id: 'intervals', name: 'INTERVALS', description: 'Interval patterns', hasSubCategories: true },
  { id: 'other', name: 'OTHER', description: 'Other scales and patterns', hasSubCategories: true },
];

// Sub-categories for each main category
const SUB_CATEGORIES: Record<string, SubCategoryOption[]> = {
  simple: [
    { id: 'major', name: 'Major', description: 'Major scale', primitiveIndex: 60 },
    { id: 'minor', name: 'Minor', description: 'Natural minor scale', primitiveIndex: 53 },
    { id: 'major-pentatonic', name: 'Major Pentatonic', description: 'Major pentatonic scale', primitiveIndex: 389 },
    { id: 'minor-pentatonic', name: 'Minor Pentatonic', description: 'Minor pentatonic scale', primitiveIndex: 389 },
  ],
  common: [
    { id: 'major', name: 'Major', description: 'Major scale', primitiveIndex: 60 },
    { id: 'minor', name: 'Minor', description: 'Natural minor scale', primitiveIndex: 53 },
    { id: 'harmonic-minor', name: 'Harmonic Minor', description: 'Harmonic minor scale', primitiveIndex: 1342 },
    { id: 'melodic-minor', name: 'Melodic Minor', description: 'Melodic minor scale', primitiveIndex: 1344 },
    { id: 'dorian', name: 'Dorian', description: 'Dorian mode', primitiveIndex: 1343 },
    { id: 'mixolydian', name: 'Mixolydian', description: 'Mixolydian mode', primitiveIndex: 1380 },
    { id: 'lydian', name: 'Lydian', description: 'Lydian mode', primitiveIndex: 1389 },
    { id: 'phrygian', name: 'Phrygian', description: 'Phrygian mode', primitiveIndex: 1215 },
    { id: 'locrian', name: 'Locrian', description: 'Locrian mode', primitiveIndex: 1335 },
  ],
  chords: [
    { id: 'major', name: 'Major', description: 'Major triad', primitiveIndex: 60 },
    { id: 'minor', name: 'Minor', description: 'Minor triad', primitiveIndex: 53 },
    { id: 'diminished', name: 'Diminished', description: 'Diminished triad', primitiveIndex: 52 },
    { id: 'augmented', name: 'Augmented', description: 'Augmented triad', primitiveIndex: 61 },
    { id: 'major7', name: 'Major 7', description: 'Major seventh chord', primitiveIndex: 209 },
    { id: 'minor7', name: 'Minor 7', description: 'Minor seventh chord', primitiveIndex: 187 },
    { id: 'dominant7', name: 'Dominant 7', description: 'Dominant seventh chord', primitiveIndex: 63 },
    { id: 'diminished7', name: 'Diminished 7', description: 'Diminished seventh chord', primitiveIndex: 182 },
    { id: 'half-diminished', name: 'Half Diminished', description: 'Half diminished chord', primitiveIndex: 183 },
    { id: 'sus2', name: 'Sus2', description: 'Suspended second chord', primitiveIndex: 45 },
    { id: 'sus4', name: 'Sus4', description: 'Suspended fourth chord', primitiveIndex: 66 },
  ],
  modal: [
    { id: 'ionian', name: 'Ionian', description: 'Ionian mode (Major)', primitiveIndex: 1379 },
    { id: 'dorian', name: 'Dorian', description: 'Dorian mode', primitiveIndex: 1343 },
    { id: 'phrygian', name: 'Phrygian', description: 'Phrygian mode', primitiveIndex: 1215 },
    { id: 'lydian', name: 'Lydian', description: 'Lydian mode', primitiveIndex: 1389 },
    { id: 'mixolydian', name: 'Mixolydian', description: 'Mixolydian mode', primitiveIndex: 1380 },
    { id: 'aeolian', name: 'Aeolian', description: 'Aeolian mode (Natural Minor)', primitiveIndex: 1341 },
    { id: 'locrian', name: 'Locrian', description: 'Locrian mode', primitiveIndex: 1335 },
  ],
  jazz: [
    { id: 'major-bebop', name: 'Major Bebop', description: 'Major bebop scale', primitiveIndex: 1782 },
    { id: 'dominant-bebop', name: 'Dominant Bebop', description: 'Dominant bebop scale', primitiveIndex: 1490 },
    { id: 'minor-bebop', name: 'Minor Bebop', description: 'Minor bebop scale', primitiveIndex: 1323 },
    { id: 'chromatic-bebop', name: 'Chromatic Bebop', description: 'Chromatic bebop scale', primitiveIndex: 1624 },
    { id: 'altered', name: 'Altered', description: 'Altered scale', primitiveIndex: 1188 },
    { id: 'whole-tone', name: 'Whole Tone', description: 'Whole tone scale', primitiveIndex: 867 },
  ],
  blues: [
    { id: 'major-blues', name: 'Major Blues', description: 'Major blues scale', primitiveIndex: 1457 },
    { id: 'minor-blues', name: 'Minor Blues', description: 'Minor blues scale', primitiveIndex: 1457 },
    { id: 'blues-heptatonic', name: 'Blues Heptatonic', description: 'Blues heptatonic scale', primitiveIndex: 1459 },
    { id: 'blues-enneatonic', name: 'Blues Enneatonic', description: 'Blues enneatonic scale', primitiveIndex: 1958 },
  ],
  world: [
    { id: 'hira-joshi', name: 'Hira Joshi', description: 'Japanese Hira Joshi scale', primitiveIndex: 425 },
    { id: 'pelog', name: 'Pelog', description: 'Indonesian Pelog scale', primitiveIndex: 305 },
    { id: 'iwato', name: 'Iwato', description: 'Japanese Iwato scale', primitiveIndex: 1879 },
    { id: 'maqam-hijaz', name: 'Maqam Hijaz', description: 'Arabic Maqam Hijaz', primitiveIndex: 1699 },
    { id: 'kung', name: 'Kung', description: 'Chinese Kung scale', primitiveIndex: 407 },
  ],
  intervals: [
    { id: 'unison', name: 'Unison', description: 'Single note', primitiveIndex: 1 },
    { id: 'minor-second', name: 'Minor Second', description: 'Minor second interval', primitiveIndex: 2 },
    { id: 'major-second', name: 'Major Second', description: 'Major second interval', primitiveIndex: 3 },
    { id: 'minor-third', name: 'Minor Third', description: 'Minor third interval', primitiveIndex: 15 },
    { id: 'major-third', name: 'Major Third', description: 'Major third interval', primitiveIndex: 16 },
    { id: 'perfect-fourth', name: 'Perfect Fourth', description: 'Perfect fourth interval', primitiveIndex: 17 },
    { id: 'tritone', name: 'Tritone', description: 'Tritone interval', primitiveIndex: 18 },
    { id: 'perfect-fifth', name: 'Perfect Fifth', description: 'Perfect fifth interval', primitiveIndex: 19 },
    { id: 'minor-sixth', name: 'Minor Sixth', description: 'Minor sixth interval', primitiveIndex: 21 },
    { id: 'major-sixth', name: 'Major Sixth', description: 'Major sixth interval', primitiveIndex: 21 },
    { id: 'minor-seventh', name: 'Minor Seventh', description: 'Minor seventh interval', primitiveIndex: 22 },
    { id: 'major-seventh', name: 'Major Seventh', description: 'Major seventh interval', primitiveIndex: 23 },
  ],
  other: [
    { id: 'chromatic', name: 'Chromatic', description: 'Chromatic scale (all 12 notes)', primitiveIndex: 2066 },
    { id: 'octatonic', name: 'Octatonic', description: 'Octatonic scale', primitiveIndex: 1644 },
    { id: 'hexatonic', name: 'Hexatonic', description: 'Hexatonic scale', primitiveIndex: 581 },
    { id: 'pentatonic', name: 'Pentatonic', description: 'Pentatonic scale', primitiveIndex: 389 },
  ],
};

// Root notes - moved outside component to prevent recreation
const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Notation view types
type NotationView = 'piano' | 'staff' | 'guitar' | 'ukulele';

interface KeyLinkPlaygroundProps {
  onStateChange: (state: any) => void;
  resolver: KeyLinkAliasResolver;
}

export default function KeyLinkPlayground({ onStateChange, resolver }: KeyLinkPlaygroundProps) {
  const [selectedCategory] = useState<string>('simple');
  const [selectedSubCategory] = useState<string>('major');
  const [selectedRoot, setSelectedRoot] = useState<string>('C');
  const [notationView, setNotationView] = useState<NotationView>('piano');
  const [currentPattern, setCurrentPattern] = useState<NotePattern | null>(null);
  // const [showSubModal, setShowSubModal] = useState(false);

  // Get current sub-categories - memoized to prevent recreation
  const currentSubCategories = React.useMemo(() => 
    SUB_CATEGORIES[selectedCategory] || [], 
    [selectedCategory]
  );

    // Update pattern when selection changes
  useEffect(() => {
    const updatePattern = async () => {
      if (!resolver) {
        console.warn('Resolver not initialized yet');
        return;
      }

      const subCategory = currentSubCategories.find(sub => sub.id === selectedSubCategory);
      if (subCategory?.primitiveIndex !== undefined) {
        try {
          const primitive = await resolver.resolvePrimitiveByIndex(subCategory.primitiveIndex);
          if (primitive) {
            // Apply the pattern to the selected root
            const rootIndex = ROOTS.indexOf(selectedRoot);
            const intervals = (primitive as any).intervals || [0, 2, 4, 5, 7, 9, 11]; // Default major scale
            const notes = intervals.map((interval: number) => ROOTS[(rootIndex + interval) % 12]);
            
            setCurrentPattern({
              intervals,
              notes,
              name: (primitive as any).name || subCategory.name
            });

            // Send KeyLink message
            onStateChange({
              root: selectedRoot,
              mode: subCategory.name.toLowerCase(),
              note_pattern: intervals,
              notes: notes,
              source: 'keylink-playground',
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('Error resolving primitive:', error);
          // Set a default pattern if resolution fails
          setCurrentPattern({
            intervals: [0, 2, 4, 5, 7, 9, 11],
            notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            name: subCategory.name
          });
        }
      }
    };

    updatePattern();
  }, [selectedCategory, selectedSubCategory, selectedRoot, resolver, onStateChange, currentSubCategories]);

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
          {[
            { name: 'Major', pattern: [0, 2, 4, 5, 7, 9, 11] },
            { name: 'Minor', pattern: [0, 2, 3, 5, 7, 8, 10] },
            { name: 'Pentatonic', pattern: [0, 2, 4, 7, 9] },
            { name: 'Blues', pattern: [0, 3, 5, 6, 7, 10] },
            { name: 'Chromatic', pattern: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
          ].map((scale) => (
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