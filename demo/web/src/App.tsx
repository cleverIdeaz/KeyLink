import React, { useEffect, useRef, useState } from 'react';
import { KeyLinkClient } from './keylink-sdk';
import MidiPlayer, { MidiData } from './components/MidiPlayer';

// Minimal, modern KeyLink Demo UI
// Connects to relay server via WebSocket and syncs with LAN/Max/MSP/Node
// Uses the KeyLink protocol (see README.md)

const WAN_WS_URL = 'wss://keylink-relay.fly.dev/';
const LAN_WS_URL = 'ws://localhost:20801';
const LAN_DISCOVERY_URLS = [
  'ws://localhost:20801',
  'ws://192.168.1.1:20801',  // Common router IP
  'ws://192.168.0.1:20801',  // Alternative router IP
  'ws://10.0.0.1:20801',     // Another common range
];

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
const CHORD_TYPES = ['maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4', 'none'];

function now() {
  return new Date().toLocaleTimeString();
}

// LAN discovery function
async function discoverLANRelay(): Promise<string | null> {
  // If we're on localhost, try local discovery
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    for (const url of LAN_DISCOVERY_URLS) {
      try {
        const ws = new WebSocket(url);
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Timeout'));
          }, 2000);
          
          ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            resolve(url);
          };
          
          ws.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Connection failed'));
          };
        });
        return url;
      } catch (e) {
        console.log(`LAN discovery failed for ${url}:`, e);
      }
    }
  }
  
  // If deployed, don't try local discovery - use cloud relay
  return null;
}

export default function App() {
  // UI state
  const [networkMode, setNetworkMode] = useState<'LAN' | 'WAN'>('LAN');
  const [wanChannel, setWanChannel] = useState<string>('public-lobby');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [root, setRoot] = useState('C');
  const [mode, setMode] = useState('Ionian');
  const [keylinkOn, setKeylinkOn] = useState(true);
  const [tempo, setTempo] = useState(120);
  const [chordLinkOn, setChordLinkOn] = useState(true);
  const [chordRoot, setChordRoot] = useState('C');
  const [chordType, setChordType] = useState('maj');
  const [status, setStatus] = useState('Disconnected');
  const [log, setLog] = useState<{ time: string; msg: string; type: 'sent' | 'received' | 'info' | 'error' }[]>([]);
  const [isPWA, setIsPWA] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [localRelayAvailable, setLocalRelayAvailable] = useState(false);
  const kl = useRef<KeyLinkClient | null>(null);
  const keylinkOnRef = useRef(keylinkOn);

  // PWA Detection
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = (window.navigator as any).standalone === true;
      setIsPWA(isStandalone || isInstalled);
    };
    checkPWA();
    window.addEventListener('appinstalled', checkPWA);
    return () => window.removeEventListener('appinstalled', checkPWA);
  }, []);

  // Service Worker Message Handling
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'localRelayStarted':
          setLocalRelayAvailable(true);
          addLog('Local relay server started', 'info');
          break;
          
        case 'localMessage':
          // Handle messages from local relay
          if (kl.current && kl.current.isConnected()) {
            // Simulate receiving a message
            const state = JSON.parse(data);
            setRoot(state.key);
            setMode(state.mode);
            setTempo(state.tempo || 120);
            addLog('← Local: ' + JSON.stringify(state), 'received');
          }
          break;
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      // Request local relay if PWA
      if (isPWA) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.active?.postMessage({ type: 'startLocalRelay' });
        });
      }
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [isPWA]);

  // Log helper
  const addLog = (msg: string, type: 'sent' | 'received' | 'info' | 'error' = 'info') =>
    setLog(l => [{ time: now(), msg, type }, ...l.slice(0, 9)]);

  // Connect SDK based on network mode and channel
  useEffect(() => {
    const connectToRelay = async () => {
      let url: string;
      let isDeployed = false;
      
      if (networkMode === 'LAN') {
        // Check if we're deployed or local
        isDeployed = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        
        if (isDeployed && !isPWA) {
          // Deployed web app (not PWA): Use cloud relay for LAN mode (web-to-web communication)
          url = `${WAN_WS_URL}${wanChannel}`;
          addLog('Deployed web app: Using cloud relay for LAN mode', 'info');
        } else if (isPWA && localRelayAvailable) {
          // PWA with local relay: Use local relay for true offline LAN
          url = 'ws://localhost:20801';
          addLog('PWA: Using local relay for offline LAN mode', 'info');
        } else {
          // Local or PWA: Try to discover local relay first
          addLog('Discovering LAN relay server...', 'info');
          const discoveredUrl = await discoverLANRelay();
          if (discoveredUrl) {
            url = discoveredUrl;
            addLog(`Found LAN relay at ${discoveredUrl}`, 'info');
          } else {
            if (isPWA) {
              // PWA with no local relay: fall back to cloud
              url = `${WAN_WS_URL}${wanChannel}`;
              addLog('PWA: No local relay found, using cloud relay', 'info');
            } else {
              addLog('No LAN relay found, falling back to localhost', 'info');
              url = LAN_WS_URL;
            }
          }
        }
      } else {
        // WAN mode: Always use cloud relay
        isDeployed = true;
        url = `${WAN_WS_URL}${wanChannel}`;
      }
      
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
         const connectionType = isDeployed ? 'Cloud' : 'Local';
         setStatus(`Connected to ${networkMode} @ ${connectionType}`);
         // Don't send state on connection - only receive
         addLog('Connected - listening for updates from other clients', 'info');
      });

      kl.current.on('close', () => {
        addLog(`Disconnected from ${url}`, 'info');
        setStatus('Disconnected');
      });

      kl.current.on('error', () => {
          addLog(`Connection error on ${url}`, 'error');
          setStatus(`Error connecting to ${networkMode}`);
      });

      kl.current.on('state', (state: any) => {
        if (!keylinkOnRef.current) return;
        setRoot(state.key);
        setMode(state.mode);
        setTempo(state.tempo || 120);
        setChordLinkOn(state.chordEnabled);
        setChordRoot(state.chord.root);
        setChordType(state.chord.type);
        addLog('← Received: ' + JSON.stringify(state), 'received');
      });
    };

    connectToRelay();

    return () => {
      kl.current?.disconnect();
    };
    // eslint-disable-next-line
  }, [networkMode, wanChannel]);

  // Send state on relevant changes
  useEffect(() => {
    if (!kl.current || !kl.current.isConnected()) return;
    if (!keylinkOn) return; // Only send if enabled
    if (!hasUserInteracted) return; // Only send after user has manually changed something
    
    const state = { key: root, mode, tempo, chordEnabled: chordLinkOn, chord: { root: chordRoot, type: chordType }};
    kl.current.setState(state);
    addLog('→ Sent: ' + JSON.stringify(state), 'sent');
    // eslint-disable-next-line
  }, [root, mode, tempo, chordLinkOn, chordRoot, chordType, keylinkOn, hasUserInteracted]);

  // UI event handlers
  const handleKeylinkToggle = () => { 
    setKeylinkOn(on => !on); 
    setHasUserInteracted(true);
  };
  const handleRoot = (e: React.ChangeEvent<HTMLSelectElement>) => { 
    setRoot(e.target.value); 
    setHasUserInteracted(true);
  };
  const handleMode = (e: React.ChangeEvent<HTMLSelectElement>) => { 
    setMode(e.target.value); 
    setHasUserInteracted(true);
  };
  const handleTempo = (e: React.ChangeEvent<HTMLInputElement>) => { 
    setTempo(Number(e.target.value) || 120); 
    setHasUserInteracted(true);
  };
  const handleChordRoot = (e: React.ChangeEvent<HTMLSelectElement>) => { 
    setChordRoot(e.target.value); 
    setHasUserInteracted(true);
  };
  const handleChordType = (e: React.ChangeEvent<HTMLSelectElement>) => { 
    setChordType(e.target.value); 
    setHasUserInteracted(true);
  };
  const handleChordLinkToggle = () => { 
    setChordLinkOn(on => !on); 
    setHasUserInteracted(true);
  };

  const handleMidiData = (data: MidiData) => {
    setHasUserInteracted(true);
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
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <img src="/KeyLink.svg" alt="KeyLink" style={{ width: '48px', height: '48px' }} />
          <h1 style={{ margin: 0, color: '#F5C242', fontSize: '2.5rem', fontWeight: 'bold' }}>
            KeyLink
          </h1>
        </div>
        <p style={{ margin: '0 0 20px 0', color: '#ccc', fontSize: '1.1rem' }}>
          Zero-config music data sync for Max, browser, and more
        </p>
      </header>

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
            
            {/* LAN Mode Info */}
            <div style={{ marginBottom: '12px', padding: '8px', background: '#333', borderRadius: '6px', fontSize: '12px' }}>
              <div style={{ color: '#F5C242', fontWeight: 'bold', marginBottom: '4px' }}>
                LAN Mode: {isPWA ? (localRelayAvailable ? '✅ Offline' : '✅ Available') : '⚠️ Limited'}
              </div>
              <div style={{ color: '#ccc', lineHeight: '1.4' }}>
                {isPWA ? (
                  localRelayAvailable ? (
                    <>
                      • Works offline with local relay<br/>
                      • Zero latency, no internet required<br/>
                      • Perfect for Max/MSP integration
                    </>
                  ) : (
                    <>
                      • Works with local relay server<br/>
                      • Zero latency, no internet required<br/>
                      • Perfect for Max/MSP integration
                    </>
                  )
                ) : (
                  <>
                    • Requires local relay server running<br/>
                    • Or install as PWA for full LAN support<br/>
                    • Web-only: uses cloud relay
                  </>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <label style={{ cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  value="LAN" 
                  checked={networkMode === 'LAN'} 
                  onChange={() => setNetworkMode('LAN')} 
                /> 
                LAN
                <span style={{ marginLeft: '4px', fontSize: '12px', color: '#888' }}>
                  {isPWA ? '(Local)' : '(Cloud)'}
                </span>
              </label>
              <label style={{ cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  value="WAN" 
                  checked={networkMode === 'WAN'} 
                  onChange={() => setNetworkMode('WAN')} 
                /> 
                WAN
                <span style={{ marginLeft: '4px', fontSize: '12px', color: '#888' }}>
                  (Cloud)
                </span>
              </label>
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
            
            {/* Setup Instructions */}
            {networkMode === 'LAN' && !isPWA && (
              <div style={{ marginTop: '12px', padding: '8px', background: '#444', borderRadius: '6px', fontSize: '11px', color: '#aaa' }}>
                💡 <strong>To use true LAN mode:</strong><br/>
                1. Install this app as a PWA (see install button above)<br/>
                2. The PWA will automatically discover local relay servers
              </div>
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
        {isPWA && (
          <div style={{ marginTop: '8px', color: '#F5C242', fontSize: '12px' }}>
            📱 Running as installed app
          </div>
        )}
                        <div style={{ marginTop: '12px', fontSize: '11px' }}>
                  <a 
                    href="https://github.com/cleverIdeaz/KeyLink" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#F5C242', textDecoration: 'none' }}
                  >
                    🐙 GitHub Repository
                  </a>
                </div>
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