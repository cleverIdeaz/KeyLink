import React, { useEffect, useRef, useState } from 'react';

// Minimal, modern KeyLink Demo UI
// Connects to relay server via WebSocket and syncs with LAN/Max/MSP/Node
// Uses the KeyLink protocol (see README.md)

const WS_URL = 'ws://localhost:20801'; // Relay server WebSocket URL

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
const CHORD_TYPES = ['maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4', 'none'];

function now() {
  return new Date().toLocaleTimeString();
}

export default function App() {
  // UI state
  const [root, setRoot] = useState('C');
  const [mode, setMode] = useState('Ionian');
  const [keylinkOn, setKeylinkOn] = useState(true);
  const [linkOn, setLinkOn] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [chordLinkOn, setChordLinkOn] = useState(true);
  const [chordRoot, setChordRoot] = useState('C');
  const [chordType, setChordType] = useState('maj');
  const [status, setStatus] = useState('Disconnected');
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState<{ time: string; msg: string }[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const source = useRef('web-react-demo-' + Math.random().toString(36).slice(2));

  // Log helper
  const addLog = (msg: string) => setLog(l => [{ time: now(), msg }, ...l.slice(0, 99)]);

  // WebSocket connection
  useEffect(() => {
    function connect() {
      ws.current = new window.WebSocket(WS_URL);
      ws.current.onopen = () => {
        setConnected(true);
        setStatus('Connected');
        addLog('WebSocket connected');
        // Send initial state
        if (ws.current && ws.current.readyState === 1) {
          const msg: any = {
            root,
            mode,
            keylinkEnabled: keylinkOn,
            abletonLinkEnabled: linkOn,
            tempo,
            source: source.current,
            timestamp: Date.now()
          };
          if (chordLinkOn && chordType !== 'none') {
            msg.chord = { root: chordRoot, type: chordType };
          }
          if (keylinkOn || linkOn) {
            ws.current.send(JSON.stringify(msg));
          }
        }
      };
      ws.current.onclose = () => {
        setConnected(false);
        setStatus('Disconnected');
        addLog('WebSocket disconnected');
        setTimeout(connect, 2000);
      };
      ws.current.onmessage = e => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.source !== source.current) {
            addLog('Received: ' + JSON.stringify(msg));
            // Update KeyLink state
            if (msg.keylinkEnabled) {
              if (msg.root && msg.root !== root) setRoot(msg.root);
              if (msg.mode && msg.mode !== mode) setMode(msg.mode);
            }
            // Update ChordLink state
            if (msg.chord && chordLinkOn) {
              if (msg.chord.root && msg.chord.root !== chordRoot) setChordRoot(msg.chord.root);
              if (msg.chord.type && msg.chord.type !== chordType) setChordType(msg.chord.type);
            }
            // Update tempo if present
            if (msg.tempo && msg.tempo !== tempo) setTempo(msg.tempo);
          }
        } catch {}
      };
    }
    connect();
    return () => { ws.current?.close(); };
    // eslint-disable-next-line
  }, []);

  // UI event handlers
  const handleKeylinkToggle = () => { setKeylinkOn(on => { setTimeout(() => {}, 0); return !on; }); };
  const handleLinkToggle = () => { setLinkOn(on => { setTimeout(() => {}, 0); return !on; }); };
  const handleChordLinkToggle = () => { setChordLinkOn(on => { setTimeout(() => {}, 0); return !on; }); };
  const handleRoot = (e: React.ChangeEvent<HTMLSelectElement>) => { setRoot(e.target.value); setTimeout(() => {}, 0); };
  const handleMode = (e: React.ChangeEvent<HTMLSelectElement>) => { setMode(e.target.value); setTimeout(() => {}, 0); };
  const handleTempo = (e: React.ChangeEvent<HTMLInputElement>) => { setTempo(Number(e.target.value) || 120); setTimeout(() => {}, 0); };
  const handleChordRoot = (e: React.ChangeEvent<HTMLSelectElement>) => { setChordRoot(e.target.value); setTimeout(() => {}, 0); };
  const handleChordType = (e: React.ChangeEvent<HTMLSelectElement>) => { setChordType(e.target.value); setTimeout(() => {}, 0); };

  // Send state on relevant changes
  useEffect(() => {
    if (ws.current && ws.current.readyState === 1) {
      const msg: any = {
        root,
        mode,
        keylinkEnabled: keylinkOn,
        abletonLinkEnabled: linkOn,
        tempo,
        source: source.current,
        timestamp: Date.now()
      };
      if (chordLinkOn && chordType !== 'none') {
        msg.chord = { root: chordRoot, type: chordType };
      }
      if (keylinkOn || linkOn) {
        ws.current.send(JSON.stringify(msg));
      }
    }
  }, [root, mode, keylinkOn, linkOn, tempo, chordLinkOn, chordRoot, chordType]);

  // UI
  return (
    <div style={{ background: '#222', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button onClick={handleKeylinkToggle} className="bigbtn" style={{ borderRadius: 10, padding: '16px 32px', fontSize: 36, fontWeight: 600, border: 'none', cursor: 'pointer', background: keylinkOn ? '#F5C242' : '#888', transition: 'background 0.2s' }}>KeyLink</button>
        <select value={root} onChange={handleRoot} style={{ fontSize: 32, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' }}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
        <select value={mode} onChange={handleMode} style={{ fontSize: 32, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' }}>{MODES.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <div style={{ width: 2, height: 48, background: '#888', margin: '0 16px' }} />
        <button onClick={handleLinkToggle} className="bigbtn" style={{ borderRadius: 10, padding: '16px 32px', fontSize: 36, fontWeight: 600, border: 'none', cursor: 'pointer', background: linkOn ? '#F5C242' : '#888', transition: 'background 0.2s' }}>Link</button>
        <input type="number" min={40} max={240} value={tempo} onChange={handleTempo} style={{ marginLeft: 8, width: 120, fontSize: 32, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button onClick={handleChordLinkToggle} className="bigbtn" style={{ borderRadius: 10, padding: '16px 32px', fontSize: 36, fontWeight: 600, border: 'none', cursor: 'pointer', background: chordLinkOn ? '#F5C242' : '#888', transition: 'background 0.2s' }}>ChordLink</button>
        <select value={chordRoot} onChange={handleChordRoot} disabled={!chordLinkOn} style={{ fontSize: 32, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' }}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
        <select value={chordType} onChange={handleChordType} disabled={!chordLinkOn} style={{ fontSize: 32, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' }}>{CHORD_TYPES.map(c => <option key={c} value={c}>{c === 'none' ? '(no chord)' : c}</option>)}</select>
        <span style={{ marginLeft: 32, fontSize: 18, color: connected ? '#0f0' : '#f55' }}>{status}</span>
      </div>
      <div style={{ background: '#111', borderRadius: 10, padding: 24, width: 600, minHeight: 120, marginTop: 16, fontSize: 16, overflowY: 'auto', maxHeight: 200 }}>
        <div style={{ color: '#F5C242', fontWeight: 600, marginBottom: 8 }}>Network Activity</div>
        <div>
          {log.map((entry, i) => (
            <div key={i} style={{ color: '#ccc', marginBottom: 4 }}>
              <span style={{ color: '#888', marginRight: 8 }}>{entry.time}</span>{entry.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
