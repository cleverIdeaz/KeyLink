import React, { useState, useEffect, useRef } from 'react';

// Minimal, modern KeyLink Demo UI
// Connects to relay server via WebSocket and syncs with LAN/Max/MSP/Node
// Uses the KeyLink protocol (see README.md)

const WS_URL = 'ws://localhost:20801'; // Relay server WebSocket URL

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
const CHORDS = (root: string) => [
  `${root}maj7`, `${root}min7`, `${root}7`, `${root}dim7`, `${root}sus4`, `${root}aug`
];

type LogEntry = { time: Date; message: string };

export default function App() {
  // UI state
  const [root, setRoot] = useState<string>('C');
  const [mode, setMode] = useState<string>('Ionian');
  const [chord, setChord] = useState<string>('Cmaj7');
  const [confidence, setConfidence] = useState<number>(100);
  const [tempo, setTempo] = useState<number>(120);
  const [keylinkEnabled, setKeylinkEnabled] = useState<boolean>(true);
  const [abletonLinkEnabled, setAbletonLinkEnabled] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  // Send current state to network
  const sendState = (custom = {}) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      const msg = {
        root,
        mode,
        chord,
        confidence: confidence / 100,
        keylinkEnabled,
        abletonLinkEnabled,
        tempo: abletonLinkEnabled ? tempo : undefined,
        source: 'web-demo',
        timestamp: Date.now(),
        ...custom
      };
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  // WebSocket connection
  useEffect(() => {
    const ws = new window.WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        // Only log messages from other sources
        if (msg.source !== 'web-demo') {
          setLogs(l => [
            { time: new Date(), message: `Received: ${JSON.stringify(msg)}` },
            ...(l || []).slice(0, 99)
          ]);
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

  // Broadcast state on change
  useEffect(() => {
    sendState();
    // eslint-disable-next-line
  }, [root, mode, chord, confidence, keylinkEnabled, abletonLinkEnabled, tempo]);

  // UI event handlers
  const handleRoot = (v: string) => {
    setRoot(v);
    setChord(`${v}maj7`);
  };

  // UI layout
  return (
    <div style={{ background: '#222', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#F5C242', borderRadius: 10, padding: '16px 32px', fontSize: 36, fontWeight: 600 }}>KeyLink</div>
        <select value={root} onChange={e => handleRoot(e.target.value)} style={{ fontSize: 32, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' }}>
          {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={mode} onChange={e => setMode(e.target.value)} style={{ fontSize: 32, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' }}>
          {MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div style={{ width: 2, height: 48, background: '#888', margin: '0 16px' }} />
        <div style={{ background: '#F5C242', borderRadius: 10, padding: '16px 32px', fontSize: 36, fontWeight: 600 }}>Link</div>
        <input type="number" min={40} max={240} value={tempo} onChange={e => setTempo(Number(e.target.value) || 120)} disabled={!abletonLinkEnabled} style={{ fontSize: 32, borderRadius: 8, padding: '8px 16px', width: 120, background: '#333', color: '#fff', border: 'none', marginLeft: 8 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <label style={{ fontSize: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={keylinkEnabled} onChange={e => setKeylinkEnabled(e.target.checked)} style={{ width: 24, height: 24 }} /> KeyLink
        </label>
        <label style={{ fontSize: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={abletonLinkEnabled} onChange={e => setAbletonLinkEnabled(e.target.checked)} style={{ width: 24, height: 24 }} /> Ableton Link
        </label>
        <select value={chord} onChange={e => setChord(e.target.value)} style={{ fontSize: 24, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' }}>
          {CHORDS(root).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ fontSize: 24, marginLeft: 16 }}>Confidence
          <input type="range" min={0} max={100} value={confidence} onChange={e => setConfidence(Number(e.target.value))} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
          <span style={{ marginLeft: 8 }}>{confidence}%</span>
        </label>
        <span style={{ marginLeft: 32, fontSize: 18, color: connected ? '#0f0' : '#f55' }}>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div style={{ background: '#111', borderRadius: 10, padding: 24, width: 600, minHeight: 120, marginTop: 16, fontSize: 16, overflowY: 'auto', maxHeight: 200 }}>
        <div style={{ color: '#F5C242', fontWeight: 600, marginBottom: 8 }}>Network Activity</div>
        {logs.length === 0 ? <div style={{ color: '#888' }}>No network messages yet.</div> : logs.map((log, i) => (
          <div key={i} style={{ color: '#ccc', marginBottom: 4 }}>
            <span style={{ color: '#888', marginRight: 8 }}>{log.time.toLocaleTimeString()}</span>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
