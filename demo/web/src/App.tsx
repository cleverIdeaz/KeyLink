import React, { useEffect, useRef, useState } from 'react';

// Minimal, modern KeyLink Demo UI
// Connects to relay server via WebSocket and syncs with LAN/Max/MSP/Node
// Uses the KeyLink protocol (see README.md)

const LAN_WS_URLS = [
  'ws://localhost:20801',
  'ws://192.168.1.1:20801',
  'ws://192.168.0.1:20801',
  'ws://10.0.0.1:20801',
];
const WAN_WS_URL = 'wss://your-wan-relay.example.com'; // Set your WAN relay URL here

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
const CHORD_TYPES = ['maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4', 'none'];

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

export default function App() {
  // UI state
  const [relayUrl, setRelayUrl] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
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
  const [log, setLog] = useState<{ time: string; msg: string }[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const source = useRef('web-react-demo-' + Math.random().toString(36).slice(2));

  // Log helper
  const addLog = (msg: string) => setLog(l => [{ time: now(), msg }, ...l.slice(0, 99)]);

  // On mount, try to connect to LAN relay
  useEffect(() => {
    (async () => {
      setStatus('Connecting to LAN relay');
      const url = await tryConnect(LAN_WS_URLS);
      if (url) {
        setRelayUrl(url);
        setStatus('Connected to LAN relay');
      } else {
        setStatus('No LAN relay found');
      }
    })();
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!relayUrl || !room) return;
    if (typeof relayUrl !== 'string') return; // Type guard
    function connect() {
      ws.current = new window.WebSocket(relayUrl as string);
      ws.current.onopen = () => {
        setStatus(relayUrl === WAN_WS_URL ? 'Connected to WAN relay' : 'Connected to LAN relay');
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
        setStatus('Disconnected');
        setTimeout(connect, 2000);
      };
      ws.current.onerror = () => {
        setStatus('Connection error');
        addLog('WebSocket connection error');
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
  }, [relayUrl, room]);

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

  // Responsive styles (typed for TS)
  const styles = {
    container: {
      background: '#222', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      padding: 0, width: '100vw', boxSizing: 'border-box' as 'border-box',
    } as React.CSSProperties,
    roomBar: {
      width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'row' as 'row', alignItems: 'center', justifyContent: 'center',
      gap: 12, margin: '32px 0 16px 0', padding: '0 8px',
    } as React.CSSProperties,
    mainPanel: {
      display: 'flex', flexDirection: 'column' as 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 600,
    } as React.CSSProperties,
    row: {
      display: 'flex', flexWrap: 'wrap' as 'wrap', alignItems: 'center', gap: 16, marginBottom: 24, width: '100%', justifyContent: 'center',
    } as React.CSSProperties,
    log: {
      background: '#111', borderRadius: 10, padding: 16, width: '100%', minHeight: 100, marginTop: 8, fontSize: 16, overflowY: 'auto' as 'auto', maxHeight: 200,
    } as React.CSSProperties,
    status: {
      marginLeft: 16, fontSize: 18, color: '#0f0',
    } as React.CSSProperties,
    bigbtn: (active: boolean) => ({
      borderRadius: 10, padding: '12px 24px', fontSize: 28, fontWeight: 600, border: 'none', cursor: 'pointer', background: active ? '#F5C242' : '#888', transition: 'background 0.2s',
      minWidth: 120,
    } as React.CSSProperties),
    select: { fontSize: 24, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none' } as React.CSSProperties,
    input: { fontSize: 24, borderRadius: 8, padding: '8px 16px', background: '#333', color: '#fff', border: 'none', width: 120 } as React.CSSProperties,
    divider: { width: 2, height: 40, background: '#888', margin: '0 12px' } as React.CSSProperties,
    '@media (maxWidth: 700px)': {
      container: { padding: 0 } as React.CSSProperties,
      mainPanel: { maxWidth: '100vw', padding: 0 } as React.CSSProperties,
      row: { flexDirection: 'column' as 'column', gap: 10, marginBottom: 16 } as React.CSSProperties,
      log: { width: '98vw', maxWidth: '98vw', fontSize: 14 } as React.CSSProperties,
      roomBar: { flexDirection: 'column' as 'column', gap: 8, maxWidth: '98vw' } as React.CSSProperties,
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
            onClick={() => { setRoom(''); setRoomInput(''); }}
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
      {/* Room/session controls and status */}
      <div>
        <div>Status: {status}</div>
        {status === 'No LAN relay found' && (
          <div>
            <input
              type="text"
              placeholder="Enter LAN relay ws://... or leave blank for WAN"
              value={manualUrl}
              onChange={e => setManualUrl(e.target.value)}
            />
            <button onClick={() => setRelayUrl(manualUrl || WAN_WS_URL)}>
              {manualUrl ? 'Connect to LAN relay' : 'Connect to WAN relay'}
            </button>
          </div>
        )}
      </div>
      {/* Advanced/dev features toggle */}
      <div>
        <button onClick={() => setShowAdvanced(a => !a)}>
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
        {showAdvanced && (
          <div>
            <div>Network Activity</div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {log.map((entry, i) => (
                <div key={i} style={{ color: '#ccc', marginBottom: 4 }}>
                  <span style={{ color: '#888', marginRight: 8 }}>{entry.time}</span>{entry.msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
