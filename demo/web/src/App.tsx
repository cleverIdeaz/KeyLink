import React, { useEffect, useRef, useState } from 'react';

// Minimal, modern KeyLink Demo UI
// Connects to relay server via WebSocket and syncs with LAN/Max/MSP/Node
// Uses the KeyLink protocol (see README.md)

const WS_URL = 'ws://localhost:20801'; // Change to your relay server URL for production

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
const CHORD_TYPES = ['maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4', 'none'];

function now() {
  return new Date().toLocaleTimeString();
}

export default function App() {
  // UI state
  const [room, setRoom] = useState('');
  const [roomInput, setRoomInput] = useState('');
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
    if (!room) return;
    function connect() {
      ws.current = new window.WebSocket(WS_URL);
      ws.current.onopen = () => {
        setConnected(true);
        setStatus('Connected');
        addLog('WebSocket connected');
        // Send initial state
        if (ws.current && ws.current.readyState === 1) {
          const msg: any = {
            room,
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
          if (msg.room !== room) return; // Only process messages for this room
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
  }, [room]);

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
    if (ws.current && ws.current.readyState === 1 && room) {
      const msg: any = {
        room,
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
  }, [root, mode, keylinkOn, linkOn, tempo, chordLinkOn, chordRoot, chordType, room]);

  // Responsive styles
  const styles = {
    container: {
      background: '#222', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      padding: '0', width: '100vw', boxSizing: 'border-box',
    },
    roomBar: {
      width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 12, margin: '32px 0 16px 0', padding: '0 8px',
    },
    mainPanel: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 600,
    },
    row: {
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 24, width: '100%', justifyContent: 'center',
    },
    log: {
      background: '#111', borderRadius: 10, padding: 16, width: '100%', minHeight: 100, marginTop: 8, fontSize: 16, overflowY: 'auto', maxHeight: 200,
    },
    status: {
      marginLeft: 16, fontSize: 18, color: connected ? '#0f0' : '#f55',
    },
    bigbtn: (active: boolean) => ({
      borderRadius: 10, padding: '12px 24px', fontSize: 28, fontWeight: 600, border: 'none', cursor: 'pointer', background: active ? '#F5C242' : '#888', transition: 'background 0.2s',
      minWidth: 120,
    }),
    select: { fontSize: 24, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' },
    input: { fontSize: 24, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none', width: 120 },
    divider: { width: 2, height: 40, background: '#888', margin: '0 12px' },
    '@media (maxWidth: 700px)': {
      container: { padding: 0 },
      mainPanel: { maxWidth: '100vw', padding: 0 },
      row: { flexDirection: 'column', gap: 10, marginBottom: 16 },
      log: { width: '98vw', maxWidth: '98vw', fontSize: 14 },
      roomBar: { flexDirection: 'column', gap: 8, maxWidth: '98vw' },
    },
  };

  // Responsive media query (simple JS approach)
  const isMobile = window.innerWidth < 700;

  return (
    <div style={{ ...styles.container, ...(isMobile ? styles['@media (maxWidth: 700px)'].container : {}) }}>
      {/* Room/session input bar */}
      <div style={{ ...styles.roomBar, ...(isMobile ? styles['@media (maxWidth: 700px)'].roomBar : {}) }}>
        <input
          type="text"
          placeholder="Enter room/session name"
          value={roomInput}
          onChange={e => setRoomInput(e.target.value)}
          style={{ ...styles.input, width: isMobile ? '70vw' : 220 }}
          disabled={!!room}
        />
        {!room ? (
          <button
            style={{ ...styles.bigbtn(true), fontSize: 22, minWidth: 80, padding: '8px 16px' }}
            onClick={() => setRoom(roomInput.trim() || 'default')}
            disabled={!roomInput.trim()}
          >
            Join
          </button>
        ) : (
          <button
            style={{ ...styles.bigbtn(false), fontSize: 22, minWidth: 80, padding: '8px 16px', background: '#888' }}
            onClick={() => { setRoom(''); setRoomInput(''); setConnected(false); setStatus('Disconnected'); }}
          >
            Leave
          </button>
        )}
        {room && <span style={{ marginLeft: 12, fontSize: 18, color: '#F5C242' }}>Room: <b>{room}</b></span>}
      </div>
      {/* Main control panel */}
      <div style={{ ...styles.mainPanel, ...(isMobile ? styles['@media (maxWidth: 700px)'].mainPanel : {}) }}>
        <div style={{ ...styles.row, ...(isMobile ? styles['@media (maxWidth: 700px)'].row : {}) }}>
          <button onClick={handleKeylinkToggle} className="bigbtn" style={styles.bigbtn(keylinkOn)}>KeyLink</button>
          <select value={root} onChange={handleRoot} style={styles.select}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
          <select value={mode} onChange={handleMode} style={styles.select}>{MODES.map(m => <option key={m} value={m}>{m}</option>)}</select>
          <div style={styles.divider} />
          <button onClick={handleLinkToggle} className="bigbtn" style={styles.bigbtn(linkOn)}>Link</button>
          <input type="number" min={40} max={240} value={tempo} onChange={handleTempo} style={{ ...styles.input, width: 80, marginLeft: 8 }} />
        </div>
        <div style={{ ...styles.row, ...(isMobile ? styles['@media (maxWidth: 700px)'].row : {}) }}>
          <button onClick={handleChordLinkToggle} className="bigbtn" style={styles.bigbtn(chordLinkOn)}>ChordLink</button>
          <select value={chordRoot} onChange={handleChordRoot} disabled={!chordLinkOn} style={styles.select}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
          <select value={chordType} onChange={handleChordType} disabled={!chordLinkOn} style={styles.select}>{CHORD_TYPES.map(c => <option key={c} value={c}>{c === 'none' ? '(no chord)' : c}</option>)}</select>
          <span style={styles.status}>{status}</span>
        </div>
        <div style={{ ...styles.log, ...(isMobile ? styles['@media (maxWidth: 700px)'].log : {}) }}>
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
    </div>
  );
}
