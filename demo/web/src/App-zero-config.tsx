import React, { useEffect, useRef, useState } from 'react';
import { KeyLinkP2P } from './keylink-zero-config-sdk';
import MidiPlayer, { MidiData } from './components/MidiPlayer';
import KeyLinkPlayground from './components/KeyLinkPlayground';
import KeyLinkAliasResolver from './keylink-aliases';

// KeyLink Zero-Config P2P Demo UI v3
// True LAN peer-to-peer without cloud dependencies
// Uses the KeyLink Zero-Config protocol

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];
const CHORD_TYPES = ['maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4', 'none'];

// Mode categories and their options
const MODE_CATEGORIES = {
  simple: {
    name: 'Simple',
    options: ['major', 'minor']
  },
  modes: {
    name: 'Modes',
    options: ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian']
  },
  chords: {
    name: 'Chords',
    options: ['maj', 'min', '7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4']
  },
  scales: {
    name: 'Scales',
    options: ['major', 'minor', 'pentatonic', 'blues', 'harmonic-minor', 'melodic-minor', 'whole-tone', 'chromatic']
  }
};

function now() {
  return new Date().toLocaleTimeString();
}

export default function App() {
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [root, setRoot] = useState('C');
  const [mode, setMode] = useState('major');
  const [showModeModal, setShowModeModal] = useState(false);
  const [modeCategory, setModeCategory] = useState('simple');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [keylinkOn, setKeylinkOn] = useState(true);
  const [tempo, setTempo] = useState(120);
  const [chordLinkOn, setChordLinkOn] = useState(true);
  const [chordRoot, setChordRoot] = useState('C');
  const [chordType, setChordType] = useState('maj');
  const [status, setStatus] = useState('Starting peer discovery...');
  const [log, setLog] = useState<{ time: string; msg: string; type: 'sent' | 'received' | 'info' | 'error' }[]>([]);
  const [isPWA, setIsPWA] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [peers, setPeers] = useState<string[]>([]);
  const [aliasResolver, setAliasResolver] = useState<KeyLinkAliasResolver | null>(null);
  const kl = useRef<KeyLinkP2P | null>(null);
  const keylinkOnRef = useRef(keylinkOn);

  // Add Max patch download state
  const [showMaxDownload, setShowMaxDownload] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);

  // Initialize alias resolver
  useEffect(() => {
    const initResolver = async () => {
      try {
        const resolver = new KeyLinkAliasResolver();
        await resolver.initialize();
        setAliasResolver(resolver);
        addLog('Alias resolver initialized', 'info');
      } catch (error) {
        addLog('Failed to initialize alias resolver', 'error');
      }
    };
    initResolver();
  }, []);

  // Check if running as PWA
  useEffect(() => {
    const checkPWA = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true;
      setIsPWA(isPWA);
      addLog(`Running as ${isPWA ? 'PWA' : 'Web App'}`, 'info');
    };
    checkPWA();
  }, []);

  // Register service worker for P2P discovery
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/keylink-sw.js')
        .then(registration => {
          addLog('Service worker registered for P2P discovery', 'info');
        })
        .catch(error => {
          addLog('Service worker registration failed', 'error');
        });
    }
  }, []);

  const addLog = (msg: string, type: 'sent' | 'received' | 'info' | 'error' = 'info') =>
    setLog(l => [{ time: now(), msg, type }, ...l.slice(0, 9)]);

  // Connect to zero-config P2P network
  useEffect(() => {
    const connectToP2P = async () => {
      addLog('Starting zero-config peer discovery...', 'info');
      setStatus('Starting peer discovery...');

      // Disconnect previous client if it exists
      if (kl.current) {
        kl.current.disconnect();
      }

      // Create new P2P client
      kl.current = new KeyLinkP2P({
        port: 20801,
        multicastAddress: '239.255.0.1',
        multicastPort: 7474
      });

      // Set up event listeners
      kl.current.on('status', (s: string) => setStatus(s));
      kl.current.on('open', () => {
        addLog('Connected to P2P network', 'info');
        setStatus('Connected to P2P network');
      });

      kl.current.on('close', () => {
        addLog('Disconnected from P2P network', 'info');
        setStatus('Disconnected');
      });

      kl.current.on('error', (error: any) => {
        addLog(`P2P connection error: ${error}`, 'error');
        setStatus('Connection error');
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

      kl.current.on('peer-connected', (peerId: string) => {
        addLog(`Peer connected: ${peerId}`, 'info');
        updatePeerInfo();
      });

      kl.current.on('peer-disconnected', (peerId: string) => {
        addLog(`Peer disconnected: ${peerId}`, 'info');
        updatePeerInfo();
      });

      // Start connection
      await kl.current.connect();
    };

    const updatePeerInfo = () => {
      if (kl.current) {
        const status = kl.current.getStatus();
        setPeerCount(status.peerCount);
        setPeers(status.peers);
      }
    };

    connectToP2P();

    return () => {
      kl.current?.disconnect();
    };
  }, []);

  // Send state on relevant changes
  useEffect(() => {
    if (!kl.current || !kl.current.isConnected()) return;
    if (!keylinkOn) return; // Only send if enabled
    if (!hasUserInteracted) return; // Only send after user has manually changed something
    
    const state = { key: root, mode, tempo, chordEnabled: chordLinkOn, chord: { root: chordRoot, type: chordType }};
    kl.current.setState(state);
    addLog('→ Sent: ' + JSON.stringify(state), 'sent');
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
    setTempo(Number(e.target.value)); 
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

  const handleAbletonLink = () => {
    addLog('Ableton Link integration coming soon!', 'info');
  };

  const handleMidiData = (data: MidiData) => {
    addLog(`MIDI data received: ${data.key} ${data.mode} ${data.tempo}`, 'info');
  };

  const handleMaxDownload = () => {
    setShowMaxDownload(true);
  };

  const handlePlaygroundToggle = () => {
    setShowPlayground(!showPlayground);
  };

  const handlePlaygroundStateChange = (state: any) => {
    addLog('Playground state: ' + JSON.stringify(state), 'info');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '32px', 
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #F5C242, #FF6B6B)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          KeyLink Zero-Config P2P
        </h1>
        <p style={{ margin: '0', color: '#ccc', fontSize: '16px' }}>
          True LAN peer-to-peer music sync • Zero cloud dependencies
        </p>
      </div>

      {/* Status Bar */}
      <div style={{ 
        background: '#2a2a2a', 
        padding: '12px 16px', 
        borderRadius: '10px', 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            background: kl.current?.isConnected() ? '#4CAF50' : '#f44336',
            animation: kl.current?.isConnected() ? 'none' : 'pulse 2s infinite'
          }} />
          <span style={{ color: '#F5C242', fontWeight: 'bold' }}>
            {status}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#ccc', fontSize: '14px' }}>
            Peers: {peerCount}
          </span>
          <span style={{ color: '#ccc', fontSize: '14px' }}>
            P2P: {isPWA ? '✅' : '⚠️'}
          </span>
        </div>
      </div>

      {/* Main Controls */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Key & Mode Controls */}
        <div style={{ background: '#2a2a2a', padding: '24px', borderRadius: '10px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#F5C242', fontSize: '18px' }}>
            Key & Mode
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <select 
              value={root} 
              onChange={handleRoot}
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: '#333', 
                color: '#fff', 
                border: '1px solid #444', 
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            
            <select 
              value={mode} 
              onChange={handleMode}
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: '#333', 
                color: '#fff', 
                border: '1px solid #444', 
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                checked={keylinkOn} 
                onChange={handleKeylinkToggle}
                style={{ transform: 'scale(1.2)' }}
              />
              <span style={{ color: '#ccc' }}>KeyLink Enabled</span>
            </label>
          </div>
        </div>

        {/* Tempo Control */}
        <div style={{ background: '#2a2a2a', padding: '24px', borderRadius: '10px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#F5C242', fontSize: '18px' }}>
            Tempo
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="range" 
              min="60" 
              max="200" 
              value={tempo} 
              onChange={handleTempo}
              style={{ flex: 1 }}
            />
            <span style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#F5C242',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {tempo}
            </span>
          </div>
        </div>

        {/* Chord Controls */}
        <div style={{ background: '#2a2a2a', padding: '24px', borderRadius: '10px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#F5C242', fontSize: '18px' }}>
            Chord
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <select 
              value={chordRoot} 
              onChange={handleChordRoot}
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: '#333', 
                color: '#fff', 
                border: '1px solid #444', 
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            
            <select 
              value={chordType} 
              onChange={handleChordType}
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: '#333', 
                color: '#fff', 
                border: '1px solid #444', 
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              {CHORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                checked={chordLinkOn} 
                onChange={handleChordLinkToggle}
                style={{ transform: 'scale(1.2)' }}
              />
              <span style={{ color: '#ccc' }}>Chord Link Enabled</span>
            </label>
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div style={{ marginBottom: '24px', background: '#2a2a2a', padding: '16px', borderRadius: '10px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#F5C242', fontSize: '16px' }}>Zero-Config P2P Network</h4>
        
        <div style={{ marginBottom: '12px', padding: '8px', background: '#333', borderRadius: '6px', fontSize: '12px' }}>
          <div style={{ color: '#F5C242', fontWeight: 'bold', marginBottom: '4px' }}>
            ✅ True Zero-Configuration
          </div>
          <div style={{ color: '#ccc', lineHeight: '1.4' }}>
            • Automatic peer discovery on local network<br/>
            • No cloud dependencies or hosting costs<br/>
            • Works offline once connected<br/>
            • Direct peer-to-peer communication
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <span style={{ color: '#ccc', fontSize: '14px' }}>
            Connected Peers: {peerCount}
          </span>
          <span style={{ color: '#ccc', fontSize: '14px' }}>
            Network Mode: P2P
          </span>
        </div>
        
        {peers.length > 0 && (
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            Peers: {peers.join(', ')}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div style={{ background: '#2a2a2a', padding: '16px', borderRadius: '10px', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#F5C242', fontSize: '16px' }}>Activity Log</h4>
        <div style={{ 
          background: '#1a1a1a', 
          padding: '12px', 
          borderRadius: '6px', 
          fontSize: '12px',
          fontFamily: 'monospace',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {log.map((entry, i) => (
            <div key={i} style={{ 
              marginBottom: '4px',
              color: entry.type === 'error' ? '#ff6b6b' : 
                     entry.type === 'sent' ? '#4CAF50' : 
                     entry.type === 'received' ? '#2196F3' : '#ccc'
            }}>
              [{entry.time}] {entry.msg}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={handlePlaygroundToggle}
          style={{ 
            padding: '12px 24px', 
            background: '#F5C242', 
            color: '#1e1e1e', 
            border: 'none', 
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {showPlayground ? 'Hide' : 'Show'} Playground
        </button>
        
        <button 
          onClick={handleMaxDownload}
          style={{ 
            padding: '12px 24px', 
            background: '#333', 
            color: '#fff', 
            border: '1px solid #444', 
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Download Max/MSP
        </button>
        
        <button 
          onClick={handleAbletonLink}
          style={{ 
            padding: '12px 24px', 
            background: '#333', 
            color: '#fff', 
            border: '1px solid #444', 
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Ableton Link
        </button>
      </div>

      {/* Playground */}
      {showPlayground && aliasResolver && (
        <div style={{ marginTop: '24px' }}>
          <KeyLinkPlayground resolver={aliasResolver} onStateChange={handlePlaygroundStateChange} />
        </div>
      )}

      {/* MIDI Player */}
      <div style={{ marginTop: '24px' }}>
        <MidiPlayer onMidiData={handleMidiData} />
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
} 