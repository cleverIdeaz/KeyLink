import React, { useEffect, useRef, useState } from 'react';
import { KeyLinkClient } from './keylink-sdk';
import MidiPlayer, { MidiData } from './components/MidiPlayer';

// Minimal, modern KeyLink Demo UI
// Connects to relay server via WebSocket and syncs with LAN/Max/MSP/Node
// Uses the KeyLink protocol (see README.md)

const WAN_WS_URL = 'wss://keylink-relay.fly.dev/';
const LAN_WS_URL = 'ws://localhost:20801';

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
  const [networkMode, setNetworkMode] = useState<'LAN' | 'WAN'>('LAN');
  const [wanChannel, setWanChannel] = useState<string>('public-lobby');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [room, ] = useState(devMode ? '' : generateRoomName());
  const [root, setRoot] = useState('C');
  const [mode, setMode] = useState('Ionian');
  const [keylinkOn, setKeylinkOn] = useState(true);
  const [tempo, setTempo] = useState(120);
  const [chordLinkOn, setChordLinkOn] = useState(true);
  const [chordRoot, setChordRoot] = useState('C');
  const [chordType, setChordType] = useState('maj');
  const [status, setStatus] = useState('Disconnected');
  const [log, setLog] = useState<{ time: string; msg: string; type: 'sent' | 'received' | 'info' | 'error' }[]>([]);
  const kl = useRef<KeyLinkClient | null>(null);
  const keylinkOnRef = useRef(keylinkOn);

  // Log helper
  const addLog = (msg: string, type: 'sent' | 'received' | 'info' | 'error' = 'info') =>
    setLog(l => [{ time: now(), msg, type }, ...l.slice(0, 9)]);

  // Connect SDK based on network mode and channel
  useEffect(() => {
    const url = networkMode === 'LAN' ? LAN_WS_URL : `${WAN_WS_URL}${wanChannel}`;
    addLog(`Connecting to ${url}...`, 'info');
    setStatus(`Connecting to ${networkMode}...`);

    // Disconnect previous client if it exists
    if (kl.current) {
      kl.current.disconnect();
    }

    kl.current = new KeyLinkClient({ relayUrl: url });
    kl.current.connect();

    kl.current.on('status', (s: string) => setStatus(s));
    kl.current.on('open', () => {
       addLog(`Connected to ${url}`, 'info');
       setStatus(`Connected to ${networkMode} @ ${networkMode === 'WAN' ? wanChannel : 'localhost'}`);
       // On successful connection, send the current state
       if (!keylinkOnRef.current) return;
       kl.current?.setState({ key: root, mode, tempo });
       kl.current?.setChord({ root: chordRoot, type: chordType });
       kl.current?.toggleChordLink(chordLinkOn);
    });

    kl.current.on('close', () => {
      addLog(`Disconnected from ${url}`, 'info');
      setStatus('Disconnected');
    });

    kl.current.on('error', () => {
        addLog(`Connection error on ${url}`, 'error');
        setStatus(`Error connecting to ${networkMode}`);
    });

    kl.current.on('state', (state) => {
      if (!keylinkOnRef.current) return;
      setRoot(state.key);
      setMode(state.mode);
      setTempo(state.tempo || 120);
      setChordLinkOn(state.chordEnabled);
      setChordRoot(state.chord.root);
      setChordType(state.chord.type);
      addLog('← Received: ' + JSON.stringify(state), 'received');
    });

    return () => {
      kl.current?.disconnect();
    };
    // eslint-disable-next-line
  }, [networkMode, wanChannel]);

  // Send state on relevant changes
  useEffect(() => {
    if (!kl.current || !kl.current.isConnected()) return;
    if (!keylinkOn) return; // Only send if enabled
    const state = { key: root, mode, tempo, chordEnabled: chordLinkOn, chord: { root: chordRoot, type: chordType }};
    kl.current.setState(state);
    addLog('→ Sent: ' + JSON.stringify(state), 'sent');
    // eslint-disable-next-line
  }, [root, mode, tempo, chordLinkOn, chordRoot, chordType, keylinkOn]);

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

  // Use a more responsive layout with Flexbox
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#222',
      color: '#fff',
      minHeight: '100vh',
      padding: '16px',
      boxSizing: 'border-box',
      width: '100%'
    }}>

      {/* Main Controls Wrapper */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap', // Allows items to wrap on smaller screens
        justifyContent: 'center',
        gap: '16px',
        width: '100%',
        maxWidth: '600px', // Set a max-width for larger screens
        marginBottom: '24px'
      }}>
        <button onClick={handleKeylinkToggle} style={{ flexGrow: 1, padding: '12px 24px', fontSize: '24px', background: keylinkOn ? '#F5C242' : '#888', color: '#222', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
          KeyLink
        </button>
        <select value={root} onChange={handleRoot} style={{ padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '10px' }}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
        <select value={mode} onChange={handleMode} style={{ padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '10px' }}>{MODES.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <input type="number" min={40} max={240} value={tempo} onChange={handleTempo} style={{ padding: '12px', width: '80px', background: '#333', color: '#fff', border: 'none', borderRadius: '10px' }} title="Tempo (bpm)" />
      </div>

      <button onClick={() => setShowAdvanced(a => !a)} style={{ marginBottom: '16px', background: '#333', color: '#F5C242', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
        {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
      </button>

      {/* Advanced Section */}
      {showAdvanced && (
        <div style={{
          width: '100%',
          maxWidth: '600px',
          background: '#1a1a1a',
          padding: '16px',
          borderRadius: '10px'
        }}>
          {/* Network Controls */}
          <div style={{ marginBottom: '24px', background: '#2a2a2a', padding: '16px', borderRadius: '10px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#F5C242', fontSize: '16px' }}>Network</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <label style={{ cursor: 'pointer' }}><input type="radio" value="LAN" checked={networkMode === 'LAN'} onChange={() => setNetworkMode('LAN')} /> LAN</label>
              <label style={{ cursor: 'pointer' }}><input type="radio" value="WAN" checked={networkMode === 'WAN'} onChange={() => setNetworkMode('WAN')} /> WAN</label>
            </div>
            {networkMode === 'WAN' && (
              <input
                type="text"
                value={wanChannel}
                onChange={(e) => setWanChannel(e.target.value)}
                placeholder="Channel Name"
                style={{ width: 'calc(100% - 24px)', padding: '12px', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '8px' }}
              />
            )}
          </div>

          {/* ChordLink controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <button onClick={handleChordLinkToggle} style={{ flexGrow: 1, padding: '12px 24px', background: chordLinkOn ? '#F5C242' : '#888', color: '#222', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>ChordLink</button>
            <select value={chordRoot} onChange={handleChordRoot} disabled={!chordLinkOn} style={{ padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '10px' }}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
            <select value={chordType} onChange={handleChordType} disabled={!chordLinkOn} style={{ padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '10px' }}>{CHORD_TYPES.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          
          {/* MIDI Player */}
          <MidiPlayer onMidiData={handleMidiData} />
        </div>
      )}

      {/* Status and Log */}
      <div style={{ width: '100%', maxWidth: '600px', marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#aaa' }}>
        Status: {status}
      </div>

      <div style={{ width: '100%', maxWidth: '600px', marginTop: '16px', background: '#181818', borderRadius: '10px', padding: '12px', height: '180px', overflowY: 'auto', fontFamily: 'monospace' }}>
        {log.length > 0 ? log.map((entry, i) => (
          <div key={i} style={{ color: entry.type === 'error' ? '#f55' : entry.type === 'sent' ? '#7CFC00' : '#61dafb' }}>
            <span style={{ marginRight: '8px' }}>{entry.time}</span>{entry.msg}
          </div>
        )) : <div>Log is empty.</div>}
      </div>
    </div>
  );
}
