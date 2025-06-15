import React, { useEffect, useRef, useState } from 'react';

// Simple MIDI player/uploader component using the html-midi-player web component.
// This can be embedded anywhere (KeyLink demo, RecipeFlower, etc.).
// Future: expose callbacks to sync playback with KeyLink.

const MIDI_PLAYER_JS = 'https://cdn.jsdelivr.net/npm/html-midi-player@1.4.0/dist/html-midi-player.js';

export default function MidiPlayer() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
      <input
        type="file"
        accept=".mid,.midi"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ color: '#fff' }}
      />
      {fileUrl && (
        <div style={{ width: '100%' }}>
          {/* midi-player & visualizer web components */}
          {React.createElement('midi-player', {
            src: fileUrl,
            'sound-font': 'https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus',
            style: { width: '100%', marginTop: 8 }
          })}
          {React.createElement('midi-visualizer', {
            src: fileUrl,
            type: 'piano-roll',
            style: { width: '100%', height: 200, marginTop: 8, background: '#111' }
          })}
        </div>
      )}
    </div>
  );
} 