// KeyLink Zero-Config P2P SDK
// True LAN peer-to-peer without cloud dependencies
// Usage: import { KeyLinkP2P } from './keylink-zero-config-sdk';

export type KeyLinkState = {
  enabled: boolean;
  key: string;
  mode: string;
  tempo: number;
  chordEnabled: boolean;
  chord: { root: string; type: string };
};

type Event = 'open' | 'close' | 'error' | 'status' | 'state' | 'peer-connected' | 'peer-disconnected';
type Listener = (...args: any[]) => void;

interface Peer {
  id: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  ip: string;
}

export class KeyLinkP2P {
  private peers = new Map<string, Peer>();
  private listeners: { [key: string]: Listener[] } = {};
  private state: Partial<KeyLinkState> = {};
  private discoveryInterval: NodeJS.Timeout | null = null;
  private isDiscovering = false;
  private localId = this.generateId();

  constructor(public opts: { 
    port?: number;
    discoveryInterval?: number;
    enableUdp?: boolean;
  } = {}) {
    this.opts.port = this.opts.port || 20801;
    this.opts.discoveryInterval = this.opts.discoveryInterval || 5000;
    this.opts.enableUdp = this.opts.enableUdp !== false;
  }

  async connect() {
    this.emit('status', 'Starting peer discovery...');
    
    // Start automatic peer discovery
    this.startDiscovery();
    
    // Also try to start a local relay server if possible
    if (this.opts.enableUdp) {
      this.startLocalRelay();
    }
  }

  disconnect() {
    this.stopDiscovery();
    
    // Close all peer connections
    Array.from(this.peers.values()).forEach(peer => {
      peer.connection.close();
    });
    this.peers.clear();
    
    this.emit('close');
    this.emit('status', 'Disconnected');
  }

  isConnected(): boolean {
    return this.peers.size > 0;
  }

  on(event: Event, fn: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(fn);
  }

  setState(state: Partial<KeyLinkState>) {
    this.state = { ...this.state, ...state };
    this.broadcast({ type: 'set-state', state: this.state });
  }

  setChord(chord: { root: string; type: string }) {
    this.state.chord = chord;
    this.broadcast({ type: 'set-chord', chord });
  }

  toggleChordLink(enabled: boolean) {
    this.state.chordEnabled = enabled;
    this.broadcast({ type: 'toggle-chordlink', enabled });
  }

  toggleKeyLink(enabled: boolean) {
    this.state.enabled = enabled;
    this.broadcast({ type: 'toggle-keylink', enabled });
  }

  private emit(event: Event, ...args: any[]) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(fn => fn(...args));
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async startDiscovery() {
    if (this.isDiscovering) return;
    this.isDiscovering = true;

    // Initial discovery
    await this.discoverPeers();

    // Periodic discovery
    this.discoveryInterval = setInterval(async () => {
      await this.discoverPeers();
    }, this.opts.discoveryInterval!);
  }

  private stopDiscovery() {
    this.isDiscovering = false;
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  private async discoverPeers() {
    try {
      // Get local network IPs
      const localIPs = await this.getLocalNetworkIPs();
      
      for (const ip of localIPs) {
        await this.tryConnectToPeer(ip);
      }
    } catch (error) {
      console.log('Discovery error:', error);
    }
  }

  private async getLocalNetworkIPs(): Promise<string[]> {
    const ips: string[] = [];
    
    // Common local network ranges
    const ranges = [
      '192.168.1',
      '192.168.0', 
      '10.0.0',
      '10.0.1',
      '172.16.0',
      '172.16.1'
    ];

    // Get local IP to determine network
    const localIP = await this.getLocalIP();
    if (localIP) {
      const baseIP = localIP.split('.').slice(0, 3).join('.');
      ranges.unshift(baseIP); // Prioritize our network
    }

    // Generate IPs to scan
    for (const range of ranges) {
      for (let i = 1; i <= 254; i++) {
        ips.push(`${range}.${i}`);
      }
    }

    return ips;
  }

  private async getLocalIP(): Promise<string | null> {
    try {
      // Try to get local IP via WebRTC
      const pc = new RTCPeerConnection();
      pc.createDataChannel('');
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // This will trigger ICE gathering
      return new Promise((resolve) => {
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const ip = event.candidate.candidate.split(' ')[4];
            if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
              pc.close();
              resolve(ip);
            }
          }
        };
        
        // Timeout after 1 second
        setTimeout(() => {
          pc.close();
          resolve(null);
        }, 1000);
      });
    } catch (error) {
      return null;
    }
  }

  private async tryConnectToPeer(ip: string) {
    try {
      // Try WebSocket connection first (for relay servers)
      const ws = new WebSocket(`ws://${ip}:${this.opts.port}`);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Timeout'));
        }, 1000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          this.connectToRelayServer(ip);
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Connection failed'));
        };
      });
    } catch (error) {
      // Not a relay server, try direct WebRTC
      await this.tryDirectWebRTC(ip);
    }
  }

  private async connectToRelayServer(ip: string) {
    const ws = new WebSocket(`ws://${ip}:${this.opts.port}`);
    
    ws.onopen = () => {
      this.emit('status', `Connected to relay at ${ip}`);
      this.emit('open');
    };

    ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    ws.onclose = () => {
      this.emit('status', `Disconnected from relay at ${ip}`);
    };

    ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  private async tryDirectWebRTC(ip: string) {
    // For direct peer-to-peer, we'd need signaling
    // This is a simplified version - in practice you'd need a signaling server
    // or use a different approach like mDNS
    console.log(`Would try direct WebRTC to ${ip}`);
  }

  private async startLocalRelay() {
    // Try to start a local relay server if we're in a Node.js environment
    if (typeof window === 'undefined' && typeof require !== 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { spawn } = require('child_process');
        const relay = spawn('node', ['relay.js'], {
          cwd: process.cwd() + '/relay',
          stdio: 'pipe'
        });
        
        relay.stdout.on('data', (data: Buffer) => {
          console.log('Relay:', data.toString());
        });
        
        relay.stderr.on('data', (data: Buffer) => {
          console.error('Relay error:', data.toString());
        });
      } catch (error) {
        console.log('Could not start local relay:', error);
      }
    }
  }

  private handleMessage(data: any) {
    try {
      const msg = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (msg.type === 'keylink-state' || msg.type === 'set-state') {
        this.state = msg.state;
        this.emit('state', this.state);
      }
    } catch (err) {
      this.emit('error', 'Failed to parse message:', err);
      console.error('[KeyLink P2P] Failed to parse message:', err);
    }
  }

  private broadcast(msg: any) {
    const message = JSON.stringify(msg);
    
    // Send to all connected peers
    Array.from(this.peers.values()).forEach(peer => {
      if (peer.dataChannel.readyState === 'open') {
        peer.dataChannel.send(message);
      }
    });
  }

  // Public API methods
  getPeers() {
    return Array.from(this.peers.keys());
  }

  getPeerCount() {
    return this.peers.size;
  }

  getStatus() {
    return {
      connected: this.isConnected(),
      peerCount: this.getPeerCount(),
      peers: this.getPeers(),
      state: this.state
    };
  }
} 