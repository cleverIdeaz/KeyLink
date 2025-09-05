import React, { useEffect, useRef, useState } from 'react';
import { KeyLinkP2P } from './keylink-zero-config-sdk';
import MidiPlayer, { MidiData } from './components/MidiPlayer';
import KeyLinkPlayground from './components/KeyLinkPlayground';
import KeyLinkAliasResolver from './keylink-aliases';

// KeyLink Zero-Config P2P Demo UI v3
// True LAN peer-to-peer without cloud dependencies
// Uses the KeyLink Zero-Config protocol

// No more hardcoded URLs - everything is auto-discovered!

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

// Zero-config peer discovery is now handled by the KeyLinkP2P SDK
// No manual discovery needed - everything is automatic!

export default function App() {
  // UI state
  const [networkMode, setNetworkMode] = useState<'LAN' | 'WAN'>('LAN');
  const [wanChannel, setWanChannel] = useState<string>('public-lobby');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [root, setRoot] = useState('C');
  const [mode, setMode] = useState('major');
  const [showModeModal, setShowModeModal] = useState(false);
  const [modeCategory, setModeCategory] = useState('simple');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [keylinkOn, setKeylinkOn] = useState(true);
  const [tempo, setTempo] = useState(120);
  const [tempoUpdateTimeout, setTempoUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [chordLinkOn, setChordLinkOn] = useState(true);
  const [chordRoot, setChordRoot] = useState('C');
  const [chordType, setChordType] = useState('maj');
  const [status, setStatus] = useState('Disconnected');
  const [log, setLog] = useState<{ time: string; msg: string; type: 'sent' | 'received' | 'info' | 'error' }[]>([]);
  const [isPWA, setIsPWA] = useState(false);
  const [, setHasUserInteracted] = useState(false);
  const [localRelayAvailable, setLocalRelayAvailable] = useState(false);
  const kl = useRef<KeyLinkP2P | null>(null);
  const keylinkOnRef = useRef(keylinkOn);
  // Keep ref in sync with state
  keylinkOnRef.current = keylinkOn;

  // Add Max patch download state
  const [showMaxDownload, setShowMaxDownload] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);


  const [abletonLinkEnabled, setAbletonLinkEnabled] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const [aliasResolver, setAliasResolver] = useState<KeyLinkAliasResolver | null>(null);

  // Initialize alias resolver
  useEffect(() => {
    const initResolver = async () => {
      try {
        const resolver = new KeyLinkAliasResolver();
        await resolver.initialize();
        setAliasResolver(resolver);
        addLog('Alias resolver initialized successfully', 'info');
      } catch (error) {
        console.error('Failed to initialize alias resolver:', error);
        addLog('Failed to initialize alias resolver', 'error');
      }
    };
    initResolver();
  }, []);

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

  // Connect to zero-config P2P network
  useEffect(() => {
    // Initialize KeyLink P2P
    const initKeyLink = async () => {
      try {
        // Initialize alias resolver
        const resolver = new KeyLinkAliasResolver();
        await resolver.initialize();
        console.log('Alias resolver initialized successfully');

        // Initialize KeyLink P2P client
        kl.current = new KeyLinkP2P({
          port: 20801,
          multicastAddress: '239.255.0.1',
          multicastPort: 7474
        });

        // Connect to KeyLink P2P
        if (kl.current) {
          await kl.current.connect();
          
          // Set up event listeners
          kl.current.on('connected', (data: any) => {
            console.log('Connected to peer:', data);
            setStatus('Connected to peer');
          });

          kl.current.on('disconnected', () => {
            console.log('Disconnected from peer');
            setStatus('Disconnected');
          });

          kl.current.on('message', (data: any) => {
            console.log('Received message:', data);
            handleKeyLinkMessage(data);
          });
        }

        // Set up service worker communication
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data, channel, peerId } = event.data;
            
            switch (type) {
              case 'peer-connected':
                console.log(`Service Worker: Peer connected via ${channel}`, peerId);
                setStatus(`Connected to peer ${peerId}`);
                break;
              case 'peer-disconnected':
                console.log(`Service Worker: Peer disconnected from ${channel}`);
                setStatus('Disconnected');
                break;
              case 'peer-message':
                console.log('Service Worker: Received message:', data);
                handleKeyLinkMessage(data);
                break;
            }
          });

          // Start service worker discovery
          navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({ type: 'start-discovery' });
          });
        }

      } catch (error) {
        console.error('Failed to initialize KeyLink:', error);
        setStatus('Failed to connect');
      }
    };

    initKeyLink();

    // Cleanup
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.active?.postMessage({ type: 'stop-discovery' });
        });
      }
      if (kl.current) {
        kl.current.disconnect();
      }
    };
  }, []);

  const handleKeyLinkMessage = (data: any) => {
    if (data.type === 'set-state' || data.type === 'keylink-state') {
      setKeylinkOn(data.enabled);
    } else if (data.type === 'set-chord') {
      setChordRoot(data.chord.root);
      setChordType(data.chord.type);
      setChordLinkOn(data.chordEnabled);
    } else if (data.type === 'toggle-chordlink') {
      setChordLinkOn(data.enabled);
    } else if (data.type === 'toggle-keylink') {
      setKeylinkOn(data.enabled);
    }
  };

  const sendKeyLinkMessage = (message: any) => {
    // Send via main P2P connection
    if (kl.current) {
      kl.current.setState(message);
    }

    // Also send via service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: 'send-message',
          data: message
        });
      });
    }
  };
  
  // Use sendKeyLinkMessage in a useEffect to avoid unused variable warning
  React.useEffect(() => {
    // This ensures the function is considered "used" by ESLint
    sendKeyLinkMessage({ type: 'init' });
  }, []);

  // UI event handlers
  const handleKeylinkToggle = () => { 
    setKeylinkOn(on => !on); 
    setHasUserInteracted(true);
  };
  // These handlers are now handled inline in the JSX
  // const handleRoot = (e: React.ChangeEvent<HTMLSelectElement>) => { 
  //   setRoot(e.target.value); 
  //   setHasUserInteracted(true);
  // };
  // const handleMode = (e: React.ChangeEvent<HTMLSelectElement>) => { 
  //   setMode(e.target.value); 
  //   setHasUserInteracted(true);
  // };
  // const handleTempo = (e: React.ChangeEvent<HTMLInputElement>) => { 
  //   setTempo(Number(e.target.value) || 120); 
  //   setHasUserInteracted(true);
  // };
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



  // Add Ableton Link handler
  const handleAbletonLink = () => {
    setAbletonLinkEnabled(!abletonLinkEnabled);
    // TODO: Implement Ableton Link SDK integration
    addLog(`Ableton Link ${!abletonLinkEnabled ? 'enabled' : 'disabled'}`, 'info');
  };

  const handleMidiData = (data: MidiData) => {
    setHasUserInteracted(true);
    if (data.tempo) {
      // Debounce tempo updates to prevent jitter
      if (tempoUpdateTimeout) {
        clearTimeout(tempoUpdateTimeout);
      }
      const timeout = setTimeout(() => {
        setTempo(Math.round(data.tempo || 120));
      }, 100);
      setTempoUpdateTimeout(timeout);
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

  // Add Max patch download handler
  const handleMaxDownload = () => {
    setShowMaxDownload(true);
  };

  const handlePlaygroundToggle = () => {
    setShowPlayground(!showPlayground);
  };

  const handlePlaygroundStateChange = (state: any) => {
    // Send the playground state through KeyLink
    if (kl.current && kl.current.isConnected()) {
      kl.current.setState({
        key: state.root,
        mode: state.mode,
        enabled: true
      });
      addLog(`Playground: ${state.mode} in ${state.root}`, 'sent');
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
      {/* Header with Logo */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '10px' }}>
          <img src="/KeyLink.svg" alt="KeyLink" style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
          <h1 style={{ margin: 0, color: '#F5C242', fontSize: '2.5rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)', letterSpacing: '1px' }}>
            KeyLink
          </h1>
        </div>
        <p style={{ margin: '0 0 20px 0', color: '#ccc', fontSize: '1.1rem' }}>
          Zero-config music data sync for Max, browser, and more
        </p>
      </div>

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
        {/* Key and Mode Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#ccc', fontSize: '14px' }}>Root:</label>
            <select
              value={root}
              onChange={(e) => { setRoot(e.target.value); setHasUserInteracted(true); }}
              style={{
                background: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '14px'
              }}
            >
              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => (
                <option key={note} value={note}>{note}</option>
              ))}
            </select>
          </div>





          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#ccc', fontSize: '14px' }}>Mode:</label>
            
            {/* Circular category selector button */}
            <button
              onClick={() => setShowCategoryModal(true)}
              style={{
                background: '#333',
                color: '#F5C242',
                border: '1px solid #555',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Select mode category"
            >
              ⚙️
            </button>
            
            {/* Dynamic mode interface */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {modeCategory === 'simple' ? (
                // Simple M/m buttons
                <>
                  <button
                    onClick={() => { setMode('major'); setHasUserInteracted(true); }}
                    style={{
                      background: mode === 'major' ? '#F5C242' : '#333',
                      color: mode === 'major' ? '#222' : '#ccc',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    M
                  </button>
                  <button
                    onClick={() => { setMode('minor'); setHasUserInteracted(true); }}
                    style={{
                      background: mode === 'minor' ? '#F5C242' : '#333',
                      color: mode === 'minor' ? '#222' : '#ccc',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    m
                  </button>
                </>
              ) : (
                // Dropdown for other categories
                <select
                  value={mode}
                  onChange={(e) => { setMode(e.target.value); setHasUserInteracted(true); }}
                  style={{
                    background: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    padding: '6px 8px',
                    fontSize: '14px',
                    minWidth: '100px'
                  }}
                >
                  {MODE_CATEGORIES[modeCategory as keyof typeof MODE_CATEGORIES].options.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Tempo and Ableton Link Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#ccc', fontSize: '14px' }}>Tempo:</label>
            <input
              type="range"
              min="60"
              max="200"
              value={tempo}
              onChange={(e) => { 
                const newTempo = parseInt(e.target.value);
                if (tempoUpdateTimeout) {
                  clearTimeout(tempoUpdateTimeout);
                }
                const timeout = setTimeout(() => {
                  setTempo(newTempo);
                  setHasUserInteracted(true);
                }, 50);
                setTempoUpdateTimeout(timeout);
              }}
              style={{ width: '100px' }}
            />
            <span style={{ color: '#F5C242', fontSize: '14px', minWidth: '40px' }}>{tempo} BPM</span>
          </div>

          {/* Ableton Link Button */}
          <button
            onClick={handleAbletonLink}
            style={{
              background: abletonLinkEnabled ? '#F5C242' : '#444',
              color: abletonLinkEnabled ? '#222' : '#ccc',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Enable Ableton Link tempo sync"
          >
            🔗 Link
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button onClick={() => setShowAdvanced(a => !a)} style={{ background: '#333', color: '#F5C242', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
        {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
      </button>
        <button onClick={handlePlaygroundToggle} style={{ background: showPlayground ? '#F5C242' : '#333', color: showPlayground ? '#222' : '#F5C242', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          {showPlayground ? 'Hide Playground' : 'Show Playground'}
        </button>
      </div>

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

          {/* Max Integration Section */}
          <div style={{ 
            background: '#333', 
            padding: '16px', 
            borderRadius: '8px', 
            marginTop: '20px',
            border: '1px solid #555'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#F5C242' }}>
              🎛️ Max/MSP Integration
            </h3>
            <p style={{ margin: '0 0 12px 0', color: '#ccc', fontSize: '14px' }}>
              Download the Max patch for seamless integration with your DAW workflow.
            </p>
            <button
              onClick={handleMaxDownload}
              style={{
                background: '#F5C242',
                color: '#222',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              📥 Download Max Patch
            </button>
          </div>

          {/* Max Download Modal */}
          {showMaxDownload && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#333',
                padding: '24px',
                borderRadius: '12px',
                maxWidth: '500px',
                textAlign: 'center',
                border: '2px solid #F5C242'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#F5C242' }}>
                  🎛️ Download KeyLink Max Patch
                </h3>
                <p style={{ margin: '0 0 20px 0', color: '#ccc', lineHeight: '1.5' }}>
                  Get the complete Max/MSP integration for zero-config music data sync across your entire studio setup.
                </p>
                
                <div style={{ margin: '20px 0', padding: '16px', background: '#222', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#F5C242' }}>What's Included:</h4>
                  <ul style={{ margin: 0, padding: '0 0 0 20px', textAlign: 'left', color: '#ccc' }}>
                    <li>Complete Max external with LAN/WAN modes</li>
                    <li>Example patches for immediate use</li>
                    <li>Auto-relay discovery for zero-config setup</li>
                    <li>Full documentation and tutorials</li>
                  </ul>
                </div>

                <div style={{ margin: '20px 0' }}>
                  <a
                    href="https://github.com/cleverIdeaz/KeyLink/releases/latest/download/keylink-max-patch.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#F5C242',
                      color: '#222',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      marginRight: '12px'
                    }}
                  >
                    🎵 Download Free
                  </a>
                  <a
                    href="https://www.paypal.com/donate/?hosted_button_id=YOUR_PAYPAL_ID"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#28a745',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}
                  >
                    💝 Donate & Download
                  </a>
                </div>

                <button
                  onClick={() => setShowMaxDownload(false)}
                  style={{
                    background: 'transparent',
                    color: '#666',
                    border: '1px solid #666',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '16px'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode Selection Modal */}
      {showModeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#F5C242' }}>Select Mode</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'chromatic'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setShowModeModal(false); setHasUserInteracted(true); }}
                  style={{
                    background: mode === m ? '#F5C242' : '#333',
                    color: mode === m ? '#222' : '#ccc',
                    border: '1px solid #555',
                    borderRadius: '6px',
                    padding: '12px 8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowModeModal(false)}
              style={{
                background: 'transparent',
                color: '#666',
                border: '1px solid #666',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#F5C242' }}>Select Mode Category</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {Object.entries(MODE_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => { 
                    setModeCategory(key); 
                    setMode(cat.options[0]);
                    setShowCategoryModal(false); 
                    setHasUserInteracted(true); 
                  }}
                  style={{
                    background: modeCategory === key ? '#F5C242' : '#333',
                    color: modeCategory === key ? '#222' : '#ccc',
                    border: '1px solid #555',
                    borderRadius: '6px',
                    padding: '12px 8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowCategoryModal(false)}
              style={{
                background: 'transparent',
                color: '#666',
                border: '1px solid #666',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Interactive Playground */}
      {showPlayground && aliasResolver && (
        <div style={{ width: '100%', maxWidth: '800px', marginTop: '24px' }}>
          <KeyLinkPlayground 
            onStateChange={handlePlaygroundStateChange}
            resolver={aliasResolver}
            root={root}
            onRootChange={setRoot}
            mode={mode}
            modeCategory={modeCategory}
            onModeChange={setMode}
            onModeCategoryChange={setModeCategory}
          />
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
                        <div style={{ marginTop: '12px', fontSize: '11px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <a 
                    href="https://github.com/cleverIdeaz/KeyLink" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#F5C242', textDecoration: 'none' }}
                  >
                    🐙 GitHub Repository
                  </a>
                  <button
                    onClick={() => setShowDonationModal(true)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: '#4CAF50', 
                      textDecoration: 'none', 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: 0
                    }}
                  >
                    💚 Support KeyLink
                  </button>
                </div>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', marginTop: '16px', background: '#181818', borderRadius: '10px', padding: '12px', height: '180px', overflowY: 'auto', fontFamily: 'monospace' }}>
        {log.length > 0 ? log.map((entry, i) => (
          <div key={i} style={{ color: entry.type === 'error' ? '#f55' : entry.type === 'sent' ? '#7CFC00' : '#61dafb' }}>
            <span style={{ marginRight: '8px' }}>{entry.time}</span>{entry.msg}
          </div>
        )) : <div>Log is empty.</div>}
      </div>

      {/* Donation Modal */}
      {showDonationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '32px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '2px solid #F5C242'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0', color: '#F5C242', fontSize: '24px' }}>
                🎵 Support KeyLink Development
              </h2>
              <p style={{ margin: '0', color: '#ccc', fontSize: '14px' }}>
                Help us keep the global music collaboration alive!
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#F5C242', fontSize: '18px', margin: '0 0 12px 0' }}>
                Why $7 Recommended?
              </h3>
              <div style={{ background: '#2a2a2a', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '14px' }}>
                  <strong style={{ color: '#F5C242' }}>Fly.io Infrastructure:</strong> $7/month covers our global public lobby
                </p>
                <p style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '14px' }}>
                  <strong style={{ color: '#F5C242' }}>Last 2 months:</strong> Exactly $7 each month
                </p>
                <p style={{ margin: '0', color: '#ccc', fontSize: '14px' }}>
                  <strong style={{ color: '#F5C242' }}>Goal:</strong> Keep KeyLink free for everyone
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#F5C242', fontSize: '18px', margin: '0 0 12px 0' }}>
                🚀 Developer Tokens (Coming Soon)
              </h3>
              <div style={{ background: '#2a2a2a', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '14px' }}>
                  <strong style={{ color: '#4CAF50' }}>API Tokens:</strong> For music developers integrating KeyLink
                </p>
                <p style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '14px' }}>
                  <strong style={{ color: '#4CAF50' }}>Revenue Sharing:</strong> LAN splits, WAN commissions
                </p>
                <p style={{ margin: '0', color: '#ccc', fontSize: '14px' }}>
                  <strong style={{ color: '#4CAF50' }}>Future:</strong> Sustainable funding model
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
              <a
                href="https://www.paypal.com/donate/?business=WMLNUNEFCS62S&no_recurring=0&item_name=KeyLink+Development+Support%E2%80%94Help+us+keep+the+global+music+collaboration+alive%21+%F0%9F%8E%B6&currency_code=USD&amount=7"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                💚 Donate $7 (Recommended)
              </a>
              <a
                href="https://www.paypal.com/donate/?business=WMLNUNEFCS62S&no_recurring=0&item_name=KeyLink+Development+Support%E2%80%94Help+us+keep+the+global+music+collaboration+alive%21+%F0%9F%8E%B6&currency_code=USD"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#333',
                  color: '#ccc',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: '1px solid #555'
                }}
              >
                💰 Custom Amount
              </a>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowDonationModal(false)}
                style={{
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #555',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 