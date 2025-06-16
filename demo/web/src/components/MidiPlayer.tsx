import React, { useEffect, useRef, useState } from 'react';
import { Midi } from '@tonejs/midi';

// Simple MIDI player/uploader component using the html-midi-player web component.
// This can be embedded anywhere (KeyLink demo, RecipeFlower, etc.).
// Future: expose callbacks to sync playback with KeyLink.

const MIDI_PLAYER_JS = 'https://cdn.jsdelivr.net/npm/html-midi-player@1.4.0/dist/html-midi-player.js';

export interface MidiData {
  key?: string;
  mode?: string;
  tempo?: number;
}

interface MidiPlayerProps {
  onMidiData: (data: MidiData) => void;
}

export default function MidiPlayer({ onMidiData }: MidiPlayerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [tracks, setTracks] = useState<{ name: string; index: number; gain: number }[]>([]);
  const playerRef = useRef<any>(null);

  // Dynamically load the html-midi-player script once.
  useEffect(() => {
    if (window.customElements && window.customElements.get('midi-player')) return; // already loaded
    const script = document.createElement('script');
    script.src = MIDI_PLAYER_JS;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    const buffer = await file.arrayBuffer();
    const midi = new Midi(buffer);

    let key = midi.header.keySignatures[0]?.key;
    const scale = midi.header.keySignatures[0]?.scale;
    let tempo = midi.header.tempos[0]?.bpm;

    if (!key || !tempo) {
      const match = file.name.match(/([A-G][#b]?)[_-]([a-zA-Z]+)[_-](\d{2,3})/i);
      if (match) {
        if (!key) key = match[1];
        if (!tempo) tempo = parseInt(match[3], 10);
      }
    }

    let mode = scale;
    if (scale === 'major') mode = 'Ionian';
    if (scale === 'minor') mode = 'Aeolian';
    else if (scale) mode = scale;


    const trackData = midi.tracks.map((t, i) => ({
      name: t.name || `Track ${i + 1}`,
      index: i,
      gain: 1,
    }));
    setTracks(trackData);

    onMidiData({ key, mode, tempo });
  };

  const handleGainChange = (trackIndex: number, gain: number) => {
    if (playerRef.current) {
      playerRef.current.setTrackGain(trackIndex, gain);
    }
    setTracks(currentTracks =>
      currentTracks.map(t => (t.index === trackIndex ? { ...t, gain } : t))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%', padding: '16px', background: '#2a2a2a', borderRadius: '10px' }}>
      <div style={{color: '#aaa', fontSize: '14px', marginBottom: '8px'}}>
        MIDI Player (Demo) - Load a file to auto-set KeyLink
      </div>
      <input
        type="file"
        accept=".mid,.midi"
        onChange={handleFileChange}
        style={{ color: '#fff' }}
      />
      {fileUrl && (
        <div style={{ width: '100%', marginTop: '16px' }}>
          {React.createElement('midi-player', {
            ref: playerRef,
            src: fileUrl,
            controls: true,
            'sound-font': 'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus',
            style: { width: '100%', borderRadius: '5px' }
          })}
          {tracks.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#F5C242', fontSize: '16px' }}>Track Mixer</h4>
              {tracks.map(track => (
                <div key={track.index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px' }}>
                  <span style={{color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px'}}>{track.name}</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.01"
                    value={track.gain}
                    onChange={(e) => handleGainChange(track.index, parseFloat(e.target.value))}
                    style={{width: '60%'}}
                  />
                </div>
              ))}
            </div>
          )}
           {React.createElement('midi-visualizer', {
            src: fileUrl,
            type: 'piano-roll',
            style: { width: '100%', height: 150, marginTop: 16, background: '#111', borderRadius: '5px' }
          })}
        </div>
      )}
    </div>
  );
} 