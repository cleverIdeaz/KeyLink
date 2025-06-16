import React, { useEffect, useRef, useState } from 'react';
import { KeyLinkClient } from './keylink-sdk';
import MidiPlayer, { MidiData } from './components/MidiPlayer';

// Minimal, modern KeyLink Demo UI
// Connects to relay server via WebSocket and syncs with LAN/Max/MSP/Node
// Uses the KeyLink protocol (see README.md)

const LAN_WS_URLS = [
  'wss://keylink-relay.fly.dev/',
  'ws://localhost:20801',
  'ws://192.168.1.1:20801',
  'ws://192.168.0.1:20801',
  'ws://10.0.0.1:20801',
];

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
const CHORD_TYPES = ['maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4', 'none'];

const devMode = process.env.NODE_ENV !== 'production';

function now() {
  return new Date().toLocaleTimeString();
}

async function tryConnect(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const ws = new window.WebSocket(url);
      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => { ws.close(); resolve(); };
        ws.onerror = () => { reject(new Error('Connection failed')); };
        setTimeout(() => reject(new Error('Timeout')), 2000);
      });
      return url;
    } catch (e: any) {
      console.debug(`Connection to ${url} failed: ${e.message}`);
    }
  }
  return null;
}

// Helper to determine if running on HTTPS/Netlify
const isHttps = window.location.protocol === 'https:';
const isNetlify = window.location.hostname.endsWith('netlify.app');

function generateRoomName() {
  const d = new Date();
  return `room-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-${d.getHours()}`;
}

export default function App() {
  // UI state
  const [relayUrl, setRelayUrl] = useState<string>('wss://keylink-relay.fly.dev/');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [room, setRoom] = useState(devMode ? '' : generateRoomName());
  const [roomInput, setRoomInput] = useState('');
  const [root, setRoot] = useState('C');
  const [mode, setMode] = useState('Ionian');
  const [keylinkOn, setKeylinkOn] = useState(true);
  const [tempo, setTempo] = useState(120);
  const [chordLinkOn, setChordLinkOn] = useState(true);
  const [chordRoot, setChordRoot] = useState('C');
  const [chordType, setChordType] = useState('maj');
  const [status, setStatus] = useState('Disconnected');
  const [log, setLog] = useState<{ time: string; msg: string; type: 'sent' | 'received' | 'info' | 'error' }[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const source = useRef('web-react-demo-' + Math.random().toString(36).slice(2));
  const kl = useRef<KeyLinkClient | null>(null);
  const keylinkOnRef = useRef(keylinkOn);

  // Log helper
  const addLog = (msg: string, type: 'sent' | 'received' | 'info' | 'error' = 'info') =>
    setLog(l => [{ time: now(), msg, type }, ...l.slice(0, 9)]);

  // On mount, auto-detect relay URL for Netlify or local
  useEffect(() => {
    let suggested = '';
    if (isNetlify || isHttps) {
      suggested = 'wss://keylink-relay.fly.dev/'; // Always use the Fly.io relay in prod
    } else if (window.location.hostname !== 'localhost') {
      suggested = 'ws://' + window.location.hostname + ':20801';
    } else {
      suggested = LAN_WS_URLS[0];
    }
    setRelayUrl(suggested);
  }, []);

  // On mount, try to connect to LAN relay
  useEffect(() => {
    (async () => {
      setStatus('Connecting to LAN relay...');
      const url = await tryConnect(LAN_WS_URLS);
      if (url) {
        setRelayUrl(url);
        setStatus('Connected to LAN relay');
      } else {
        setStatus('No LAN relay found');
    }
    })();
  }, []);

  // On mount, connect SDK
  useEffect(() => {
    if (!room) return;
    kl.current = new KeyLinkClient({ relayUrl });
    kl.current.connect();
    kl.current.on((state) => {
      // Only process incoming state if keylinkOn is true (using ref for latest value)
      if (!keylinkOnRef.current) return;
      setRoot(state.key);
      setMode(state.mode);
      setChordLinkOn(state.chordEnabled);
      setChordRoot(state.chord.root);
      setChordType(state.chord.type);
      addLog('← Received: ' + JSON.stringify(state), 'received');
    });
    setStatus('Connected to WSS relay');
    addLog('KeyLink SDK connected', 'info');
    // eslint-disable-next-line
  }, [room, relayUrl]);

  // Send state on relevant changes
  useEffect(() => {
    if (!kl.current) return;
    if (!keylinkOn) return; // Only send if enabled
    kl.current.setState({ key: root, mode });
    kl.current.setChord({ root: chordRoot, type: chordType });
    kl.current.toggleChordLink(chordLinkOn);
    addLog('→ Sent: ' + JSON.stringify({ key: root, mode, chord: { root: chordRoot, type: chordType }, chordEnabled: chordLinkOn }), 'sent');
    // eslint-disable-next-line
  }, [root, mode, chordLinkOn, chordRoot, chordType, keylinkOn]);

  // UI event handlers
  const handleKeylinkToggle = () => { setKeylinkOn(on => !on); };
  const handleRoot = (e: React.ChangeEvent<HTMLSelectElement>) => { setRoot(e.target.value); };
  const handleMode = (e: React.ChangeEvent<HTMLSelectElement>) => { setMode(e.target.value); };
  const handleTempo = (e: React.ChangeEvent<HTMLInputElement>) => { setTempo(Number(e.target.value) || 120); };
  const handleChordRoot = (e: React.ChangeEvent<HTMLSelectElement>) => { setChordRoot(e.target.value); };
  const handleChordType = (e: React.ChangeEvent<HTMLSelectElement>) => { setChordType(e.target.value); };
  const handleChordLinkToggle = () => { setChordLinkOn(on => !on); };

  const handleMidiData = (data: MidiData) => {
    if (data.tempo) {
      setTempo(Math.round(data.tempo));
    }
    if (data.key) {
      const rootNote = data.key.charAt(0).toUpperCase() + data.key.slice(1).toLowerCase();
      if (ROOTS.includes(rootNote.replace('b', '#'))) { // Basic flat to sharp conversion
          setRoot(rootNote.replace('b', '#'));
      }
    }
    if (data.mode) {
      const modeName = data.mode.charAt(0).toUpperCase() + data.mode.slice(1).toLowerCase();
      const matchedMode = MODES.find(m => m.toLowerCase() === modeName);
      if (matchedMode) {
        setMode(matchedMode);
      }
    }
  };

  // Styles
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      background: '#222', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      padding: 0, width: '100vw', boxSizing: 'border-box',
    },
    topBar: {
      width: '100%', maxWidth: 480, margin: '32px 0 16px 0', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    section: {
      width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16,
    },
    chordSection: {
      width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24,
    },
    status: {
      margin: '8px 0', fontSize: 16, fontWeight: 500, color: status.includes('Connected') ? '#7CFC00' : status.includes('error') ? '#f55' : '#F5C242',
      textAlign: 'center',
    },
    roomBar: {
      width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '32px 0 8px 0',
    },
    input: { fontSize: 20, borderRadius: 8, padding: '8px 12px', background: '#333', color: '#fff', border: 'none', width: 220 },
    joinBtn: { fontSize: 20, borderRadius: 8, padding: '8px 24px', background: '#F5C242', color: '#222', fontWeight: 700, border: 'none', cursor: 'pointer' },
    select: { fontSize: 22, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' },
    tempo: { fontSize: 22, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none', width: 80 },
    advancedBox: { background: '#111', borderRadius: 10, padding: 16, width: 480, minHeight: 80, marginTop: 16, fontSize: 15, overflowY: 'auto', maxHeight: 180 },
    advBtn: { margin: '16px 0 0 0', fontSize: 15, borderRadius: 8, padding: '6px 16px', background: '#333', color: '#F5C242', border: 'none', cursor: 'pointer' },
    connectBox: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, margin: '8px 0' },
  };

  // Standalone style function for main buttons
  const mainBtn = (active: boolean): React.CSSProperties => ({
    fontSize: 28,
    borderRadius: 10,
    padding: '12px 32px',
    background: active ? '#F5C242' : '#888',
    color: '#222',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    minWidth: 120,
  });

  // Add Test Message button handler
  const sendTestMessage = () => {
    if (ws.current && ws.current.readyState === 1 && room) {
      const msg = {
        room,
        root: 'C',
        mode: 'Ionian',
        keylinkEnabled: true,
        abletonLinkEnabled: false,
        tempo: 120,
        source: source.current,
        timestamp: Date.now(),
        test: true
      };
      ws.current.send(JSON.stringify(msg));
      addLog('→ Sent: ' + JSON.stringify(msg), 'sent');
    }
  };

  // On mount, update keylinkOnRef
  useEffect(() => { keylinkOnRef.current = keylinkOn; }, [keylinkOn]);

  // UI
  return (
    <div style={styles.container}>
      {/* Room/session join bar (dev only) */}
      {devMode && (
        <div style={styles.roomBar}>
          <input
            type="text"
            placeholder="Enter room/session name (optional)"
            value={roomInput}
            onChange={e => setRoomInput(e.target.value)}
            style={styles.input}
            disabled={!!room}
          />
          {!room ? (
            <button
              style={styles.joinBtn}
              onClick={() => setRoom(roomInput.trim() || generateRoomName())}
              disabled={!!roomInput.trim() === false}
              title="Join a session. Leave blank for default session."
            >
              Join
            </button>
          ) : (
            <button
              style={{ ...styles.joinBtn, background: '#888', color: '#fff' }}
              onClick={() => { setRoom(''); setRoomInput(''); }}
              title="Leave session"
            >
              Leave
            </button>
          )}
        </div>
      )}
      {/* Main KeyLink controls */}
      <div style={styles.topBar}>
        <button onClick={handleKeylinkToggle} style={{ ...mainBtn(keylinkOn), display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 160, height: 60, fontSize: 32, letterSpacing: 1 }} title="Toggle KeyLink">
          KeyLink
        </button>
        <select value={root} onChange={handleRoot} style={styles.select}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
        <select value={mode} onChange={handleMode} style={styles.select}>{MODES.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <input type="number" min={40} max={240} value={tempo} onChange={handleTempo} style={styles.tempo} title="Tempo (bpm)" />
      </div>
      {/* Advanced controls dropdown */}
      <div style={{ marginTop: 16 }}>
        <button style={styles.advBtn} onClick={() => setShowAdvanced(a => !a)}>
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
        {showAdvanced && (
          <div style={{ marginTop: 16, width: '100%', maxWidth: 480, padding: '0 16px', boxSizing: 'border-box' }}>
            {/* ChordLink controls */}
            <div style={styles.chordSection}>
              <button onClick={handleChordLinkToggle} style={mainBtn(chordLinkOn)} title="Toggle ChordLink">ChordLink</button>
              <select value={chordRoot} onChange={handleChordRoot} disabled={!chordLinkOn} style={styles.select}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
              <select value={chordType} onChange={handleChordType} disabled={!chordLinkOn} style={styles.select}>{CHORD_TYPES.map(c => <option key={c} value={c}>{c === 'none' ? '(no chord)' : c}</option>)}</select>
            </div>
            {/* Link/tempo controls */}
            <div style={{ ...styles.section, marginTop: 8 }}>
              <span style={{ fontWeight: 600, color: '#F5C242', marginRight: 8 }}>Link (tempo):</span>
              <input type="number" min={40} max={240} value={tempo} onChange={handleTempo} style={styles.tempo} title="Tempo (bpm)" />
            </div>
            {/* MIDI Player / Uploader */}
            <div style={{ marginTop: 16 }}>
              <MidiPlayer onMidiData={handleMidiData} />
            </div>
          </div>
        )}
      </div>
      {/* Status and connection info */}
      <div style={{ ...styles.status, marginBottom: 8 }}>
        <span>Status: {status}</span>
        <span style={{ marginLeft: 16 }}>Relay: {relayUrl}</span>
        <span style={{ marginLeft: 16 }}>Room: {room || '(none)'}</span>
      </div>
      {/* Log display for debug/info */}
      <div style={{ width: '100%', maxWidth: 480, margin: '16px 0', background: '#181818', borderRadius: 10, padding: 12, minHeight: 60, fontSize: 14, color: '#ccc', fontFamily: 'monospace', maxHeight: 180, overflowY: 'auto' }}>
        <div style={{ fontWeight: 600, color: '#F5C242', marginBottom: 4 }}>Log:</div>
        {log.length === 0 ? (
          <div style={{ color: '#555' }}>No messages yet.</div>
        ) : (
          log.map((entry, i) => (
            <div key={i} style={{ color: entry.type === 'error' ? '#f55' : entry.type === 'sent' ? '#7CFC00' : entry.type === 'received' ? '#61dafb' : '#ccc' }}>
              <span style={{ marginRight: 8 }}>{entry.time}</span>
              <span>{entry.msg}</span>
            </div>
          ))
        )}
      </div>
      {/* Test Message button (dev only) */}
      {devMode && (
        <div style={styles.connectBox}>
          <button style={{ ...styles.joinBtn, background: '#7CFC00', color: '#222', marginBottom: 8 }} onClick={sendTestMessage} disabled={!room || !relayUrl || status.includes('Disconnected')}>
            Send Test Message
          </button>
        </div>
      )}
    </div>
  );
}
