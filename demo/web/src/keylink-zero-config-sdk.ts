// KeyLink Zero-Config P2P SDK
// True LAN peer-to-peer without cloud dependencies
// Usage: import { KeyLinkP2P } from './keylink-zero-config-sdk';

interface KeyLinkP2POptions {
  port?: number;
  multicastAddress?: string;
  multicastPort?: number;
}

export interface KeyLinkState {
  enabled?: boolean;
  chordEnabled?: boolean;
  chord?: { root: string; type: string };
  [key: string]: any;
}

export class KeyLinkP2P {
  private opts: KeyLinkP2POptions;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private signalingChannel?: RTCDataChannel;
  private localPeerId: string;
  private _isConnected = false;
  private eventListeners: Map<string, Function[]> = new Map();
  private state: Partial<KeyLinkState> = {};

  constructor(opts: KeyLinkP2POptions = {}) {
    this.opts = {
      port: 20801,
      multicastAddress: '239.255.0.1',
      multicastPort: 7474,
      ...opts
    };
    this.localPeerId = this.generatePeerId();
  }

  private generatePeerId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async connect(): Promise<void> {
    console.log('Starting zero-config peer discovery...');
    
    // First try to find existing relay servers
    const localIPs = await this.getLocalNetworkIPs();
    let relayFound = false;

    for (const ip of localIPs) {
      try {
        const connected = await this.tryConnectToRelay(ip);
        if (connected) {
          relayFound = true;
          break;
        }
      } catch (error) {
        console.log(`No relay found at ${ip}`);
      }
    }

    // If no relay found, try cloud relay as fallback
    if (!relayFound) {
      console.log('No local relay found, trying cloud relay...');
      try {
        const cloudConnected = await this.tryConnectToCloudRelay();
        if (cloudConnected) {
          console.log('Connected to cloud relay');
        } else {
          console.log('Cloud relay also failed, starting WebRTC discovery...');
          await this.startWebRTCDiscovery();
        }
      } catch (error) {
        console.log('Cloud relay failed, starting WebRTC discovery...');
        await this.startWebRTCDiscovery();
      }
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

  private async tryConnectToRelay(ip: string): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 1000);

      try {
        // Try secure WebSocket first (for HTTPS compatibility)
        const ws = new WebSocket(`wss://${ip}:${this.opts.port}`);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          console.log(`Connected to relay at ${ip}`);
          this.setupRelayConnection(ws);
          resolve(true);
        };

        ws.onerror = () => {
          // Fallback to HTTP health check
          this.checkRelayHealth(ip).then(healthy => {
            clearTimeout(timeout);
            if (healthy) {
              console.log(`Found relay at ${ip} via health check`);
              resolve(true);
            } else {
              resolve(false);
            }
          });
        };
      } catch (error) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  private async checkRelayHealth(ip: string): Promise<boolean> {
    try {
      await fetch(`https://${ip}:${this.opts.port}/health`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private setupRelayConnection(ws: WebSocket): void {
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing relay message:', error);
      }
    };

          ws.onclose = () => {
        console.log('Relay connection closed');
        this._isConnected = false;
      };
  }

  private async tryConnectToCloudRelay(): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      try {
        const ws = new WebSocket('wss://keylink-relay.fly.dev/public-lobby');
        
        ws.onopen = () => {
          clearTimeout(timeout);
          console.log('Connected to cloud relay');
          this.setupRelayConnection(ws);
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          console.log('Cloud relay connection failed');
          resolve(false);
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          console.log('Cloud relay connection closed');
          resolve(false);
        };
      } catch (error) {
        clearTimeout(timeout);
        console.log('Cloud relay connection error:', error);
        resolve(false);
      }
    });
  }

  private async startWebRTCDiscovery(): Promise<void> {
    console.log('Starting WebRTC peer discovery...');
    
    // Create a signaling peer connection for discovery
    const signalingPC = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Create data channel for signaling
    this.signalingChannel = signalingPC.createDataChannel('keylink-signaling', {
      ordered: true
    });

    this.signalingChannel.onopen = () => {
      console.log('Signaling channel opened');
      this.broadcastDiscovery();
    };

    this.signalingChannel.onmessage = (event) => {
      this.handleSignalingMessage(event.data);
    };

    // Start listening for other peers
    signalingPC.ondatachannel = (event) => {
      const channel = event.channel;
      if (channel.label === 'keylink-signaling') {
        channel.onmessage = (event) => {
          this.handleSignalingMessage(event.data);
        };
      } else if (channel.label === 'keylink-data') {
        this.setupDataChannel(channel);
      }
    };

    // Create offer for discovery
    const offer = await signalingPC.createOffer();
    await signalingPC.setLocalDescription(offer);

    // Store the signaling connection
    this.peers.set('signaling', signalingPC);
  }

  private broadcastDiscovery(): void {
    if (this.signalingChannel?.readyState === 'open') {
      const discoveryMessage = {
        type: 'discovery',
        peerId: this.localPeerId,
        timestamp: Date.now()
      };
      this.signalingChannel.send(JSON.stringify(discoveryMessage));
    }
  }

  private async handleSignalingMessage(data: any): Promise<void> {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      switch (message.type) {
        case 'discovery':
          await this.handleDiscovery(message);
          break;
        case 'offer':
          await this.handleOffer(message);
          break;
        case 'answer':
          await this.handleAnswer(message);
          break;
        case 'ice-candidate':
          await this.handleICECandidate(message);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  private async handleDiscovery(message: any): Promise<void> {
    if (message.peerId === this.localPeerId) return;

    console.log(`Discovered peer: ${message.peerId}`);
    
    // Create peer connection
    const peerPC = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Create data channel
    const dataChannel = peerPC.createDataChannel('keylink-data', {
      ordered: true
    });

    this.setupDataChannel(dataChannel);

    // Store peer connection
    this.peers.set(message.peerId, peerPC);
    this.dataChannels.set(message.peerId, dataChannel);

    // Create and send offer
    const offer = await peerPC.createOffer();
    await peerPC.setLocalDescription(offer);

    const offerMessage = {
      type: 'offer',
      peerId: this.localPeerId,
      targetPeerId: message.peerId,
      offer: offer
    };

    if (this.signalingChannel?.readyState === 'open') {
      this.signalingChannel.send(JSON.stringify(offerMessage));
    }
  }

  private async handleOffer(message: any): Promise<void> {
    if (message.targetPeerId !== this.localPeerId) return;

    console.log(`Received offer from ${message.peerId}`);

    const peerPC = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Handle incoming data channel
    peerPC.ondatachannel = (event) => {
      if (event.channel.label === 'keylink-data') {
        this.setupDataChannel(event.channel);
        this.dataChannels.set(message.peerId, event.channel);
      }
    };

    // Store peer connection
    this.peers.set(message.peerId, peerPC);

    // Set remote description
    await peerPC.setRemoteDescription(new RTCSessionDescription(message.offer));

    // Create and send answer
    const answer = await peerPC.createAnswer();
    await peerPC.setLocalDescription(answer);

    const answerMessage = {
      type: 'answer',
      peerId: this.localPeerId,
      targetPeerId: message.peerId,
      answer: answer
    };

    if (this.signalingChannel?.readyState === 'open') {
      this.signalingChannel.send(JSON.stringify(answerMessage));
    }
  }

  private async handleAnswer(message: any): Promise<void> {
    if (message.targetPeerId !== this.localPeerId) return;

    console.log(`Received answer from ${message.peerId}`);

    const peerPC = this.peers.get(message.peerId);
    if (peerPC) {
      await peerPC.setRemoteDescription(new RTCSessionDescription(message.answer));
    }
  }

  private async handleICECandidate(message: any): Promise<void> {
    if (message.targetPeerId !== this.localPeerId) return;

    const peerPC = this.peers.get(message.peerId);
    if (peerPC) {
      await peerPC.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log(`Data channel opened: ${channel.label}`);
      this._isConnected = true;
      this.emit('connected', { channel: channel.label });
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };

    channel.onclose = () => {
      console.log(`Data channel closed: ${channel.label}`);
      this._isConnected = false;
      this.emit('disconnected', { channel: channel.label });
    };
  }

  private handleMessage(data: any): void {
    // Emit the message to listeners
    this.emit('message', data);
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  disconnect(): void {
    // Close all peer connections
    this.peers.forEach(peer => peer.close());
    this.peers.clear();
    this.dataChannels.clear();
    this._isConnected = false;
    this.emit('disconnected');
  }

  setState(state: Partial<KeyLinkState>): void {
    this.state = { ...this.state, ...state };
    this.broadcast({ type: 'set-state', state: this.state });
  }

  setChord(chord: { root: string; type: string }): void {
    this.state.chord = chord;
    this.broadcast({ type: 'set-chord', chord });
  }

  toggleChordLink(enabled: boolean): void {
    this.state.chordEnabled = enabled;
    this.broadcast({ type: 'toggle-chordlink', enabled });
  }

  toggleKeyLink(enabled: boolean): void {
    this.state.enabled = enabled;
    this.broadcast({ type: 'toggle-keylink', enabled });
  }

  private broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    // Send to all connected data channels
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(messageStr);
      }
    });
  }

  getStatus() {
    return {
      connected: this._isConnected,
      peerCount: this.getPeerCount(),
      peers: this.getPeers(),
      state: this.state
    };
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  getPeerCount(): number {
    return this.peers.size;
  }

  getPeers(): string[] {
    return Array.from(this.peers.keys());
  }
} 