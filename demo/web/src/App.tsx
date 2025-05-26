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
  const [log, setLog] = useState<{ time: string; msg: string; type: 'sent' | 'received' | 'info' | 'error' }[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const source = useRef('web-react-demo-' + Math.random().toString(36).slice(2));
  const [connectionDropped, setConnectionDropped] = useState(false);
  const [autoRelayUrl, setAutoRelayUrl] = useState('');
  const [keylinkText, setKeylinkText] = useState('');

  // Log helper
  const addLog = (msg: string, type: 'sent' | 'received' | 'info' | 'error' = 'info') =>
    setLog(l => [{ time: now(), msg, type }, ...l.slice(0, 9)]);

  // On mount, auto-detect relay URL for Netlify or local
  useEffect(() => {
    let suggested = '';
    if (window.location.hostname.endsWith('netlify.app')) {
      suggested = 'wss://' + window.location.hostname.replace(/^www\./, '') + '/relay';
    } else if (window.location.hostname !== 'localhost') {
      suggested = 'ws://' + window.location.hostname + ':20801';
    } else {
      suggested = LAN_WS_URLS[0];
    }
    setAutoRelayUrl(suggested);
    setManualUrl(suggested);
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

  // WebSocket connection
  useEffect(() => {
    if (!relayUrl || !room) return;
    if (typeof relayUrl !== 'string') return; // Type guard
    function connect() {
      ws.current = new window.WebSocket(relayUrl as string);
      ws.current.onopen = () => {
        setStatus(relayUrl === WAN_WS_URL ? 'Connected to WAN relay' : 'Connected to LAN relay');
        setConnectionDropped(false);
        addLog('WebSocket connected', 'info');
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
            addLog('→ Sent: ' + JSON.stringify(msg), 'sent');
          }
        }
      };
      ws.current.onclose = () => {
        setStatus('Disconnected');
        setConnectionDropped(true);
        addLog('WebSocket disconnected', 'error');
        setTimeout(connect, 2000);
      };
      ws.current.onerror = () => {
        setStatus('Connection error');
        setConnectionDropped(true);
        addLog('WebSocket connection error', 'error');
      };
      ws.current.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
          if (msg.room !== room) return; // Only process messages for this room
          if (msg.source !== source.current) {
            addLog('← Received: ' + JSON.stringify(msg), 'received');
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
            setKeylinkText(JSON.stringify(msg, null, 2));
        }
      } catch {}
    };
    }
    connect();
    return () => { ws.current?.close(); };
    // eslint-disable-next-line
  }, [relayUrl, room]);

  // UI event handlers
  const handleKeylinkToggle = () => { setKeylinkOn(on => !on); };
  const handleLinkToggle = () => { setLinkOn(on => !on); };
  const handleChordLinkToggle = () => { setChordLinkOn(on => !on); };
  const handleRoot = (e: React.ChangeEvent<HTMLSelectElement>) => { setRoot(e.target.value); };
  const handleMode = (e: React.ChangeEvent<HTMLSelectElement>) => { setMode(e.target.value); };
  const handleTempo = (e: React.ChangeEvent<HTMLInputElement>) => { setTempo(Number(e.target.value) || 120); };
  const handleChordRoot = (e: React.ChangeEvent<HTMLSelectElement>) => { setChordRoot(e.target.value); };
  const handleChordType = (e: React.ChangeEvent<HTMLSelectElement>) => { setChordType(e.target.value); };

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
        addLog('→ Sent: ' + JSON.stringify(msg), 'sent');
      }
      setKeylinkText(JSON.stringify(msg, null, 2));
    }
  }, [root, mode, keylinkOn, linkOn, tempo, chordLinkOn, chordRoot, chordType, room]);

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

  // Add Reconnect button handler
  const handleReconnect = () => {
    setRelayUrl(null);
    setTimeout(() => setRelayUrl(manualUrl || autoRelayUrl), 100);
  };

  // UI
  return (
    <div style={styles.container}>
      {/* Room/session join bar */}
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
            onClick={() => setRoom(roomInput.trim() || 'default')}
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
      {/* KeyLink and Link controls */}
      <div style={styles.topBar}>
        <button onClick={handleKeylinkToggle} style={{ ...mainBtn(keylinkOn), display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 160, height: 60, fontSize: 32, letterSpacing: 1 }} title="Toggle KeyLink">
          KeyLink
        </button>
        <select value={root} onChange={handleRoot} style={styles.select}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
        <select value={mode} onChange={handleMode} style={styles.select}>{MODES.map(m => <option key={m} value={m}>{m}</option>)}</select>
        <button onClick={handleLinkToggle} style={mainBtn(linkOn)} title="Toggle Ableton Link">Link</button>
        <input type="number" min={40} max={240} value={tempo} onChange={handleTempo} style={styles.tempo} title="Tempo (bpm)" />
      </div>
      {/* ChordLink controls */}
      <div style={styles.chordSection}>
        <button onClick={handleChordLinkToggle} style={mainBtn(chordLinkOn)} title="Toggle ChordLink">ChordLink</button>
        <select value={chordRoot} onChange={handleChordRoot} disabled={!chordLinkOn} style={styles.select}>{ROOTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
        <select value={chordType} onChange={handleChordType} disabled={!chordLinkOn} style={styles.select}>{CHORD_TYPES.map(c => <option key={c} value={c}>{c === 'none' ? '(no chord)' : c}</option>)}</select>
      </div>
      {/* Status and connection info */}
      <div style={{ ...styles.status, marginBottom: 8 }}>
        <span>Status: {status}</span>
        <span style={{ marginLeft: 16 }}>Relay: {relayUrl || manualUrl || autoRelayUrl}</span>
        <span style={{ marginLeft: 16 }}>Room: {room || '(none)'}</span>
      </div>
      {connectionDropped && (
        <button style={{ ...styles.joinBtn, background: '#f55', color: '#fff', marginBottom: 8 }} onClick={handleReconnect}>
          Reconnect
        </button>
      )}
      {/* Advanced/dev features toggle and log */}
      <button style={styles.advBtn} onClick={() => setShowAdvanced(a => !a)}>
        {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
      </button>
      {showAdvanced && (
        <div style={styles.advancedBox}>
          <div style={{ color: '#F5C242', fontWeight: 600, marginBottom: 8 }}>Network Log</div>
          <div>
            {log.length === 0 ? <div style={{ color: '#888' }}>No network messages yet.</div> : log.map((entry, i) => (
              <div key={i} style={{ color: entry.type === 'error' ? '#f55' : entry.type === 'sent' ? '#7CFC00' : entry.type === 'received' ? '#F5C242' : '#ccc', marginBottom: 4 }}>
                <span style={{ color: '#888', marginRight: 8 }}>{entry.time}</span>{entry.msg}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Test Message button */}
      <div style={styles.connectBox}>
        <button style={{ ...styles.joinBtn, background: '#7CFC00', color: '#222', marginBottom: 8 }} onClick={sendTestMessage} disabled={!room || !relayUrl || status.includes('Disconnected')}>
          Send Test Message
        </button>
      </div>
      <textarea
        value={keylinkText}
        readOnly
        style={{ width: 400, height: 120, fontSize: 16, background: '#111', color: '#fff', borderRadius: 8, marginTop: 16 }}
      />
    </div>
  );
}
