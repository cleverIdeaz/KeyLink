// KeyLink Zero-Config API
// Simple API wrapper for the zero-config P2P framework
// Usage: import { KeyLinkAPI } from './keylink-zero-config-api';

import { KeyLinkP2P, KeyLinkState } from './keylink-zero-config-sdk';

export class KeyLinkAPI {
  private p2p: KeyLinkP2P;
  private isInitialized = false;

  constructor(options: {
    port?: number;
    discoveryInterval?: number;
    enableUdp?: boolean;
  } = {}) {
    this.p2p = new KeyLinkP2P(options);
  }

  /**
   * Initialize and connect to the P2P network
   */
  async connect(): Promise<void> {
    if (this.isInitialized) {
      console.warn('KeyLink API already initialized');
      return;
    }

    await this.p2p.connect();
    this.isInitialized = true;
  }

  /**
   * Disconnect from the P2P network
   */
  disconnect(): void {
    this.p2p.disconnect();
    this.isInitialized = false;
  }

  /**
   * Check if connected to the P2P network
   */
  isConnected(): boolean {
    return this.p2p.isConnected();
  }

  /**
   * Set the musical state (key, mode, tempo, etc.)
   */
  setState(state: Partial<KeyLinkState>): void {
    this.p2p.setState(state);
  }

  /**
   * Set the key and mode
   */
  setKey(key: string, mode: string): void {
    this.p2p.setState({ key, mode });
  }

  /**
   * Set the tempo
   */
  setTempo(tempo: number): void {
    this.p2p.setState({ tempo });
  }

  /**
   * Set the chord
   */
  setChord(root: string, type: string): void {
    this.p2p.setChord({ root, type });
  }

  /**
   * Enable/disable KeyLink synchronization
   */
  setEnabled(enabled: boolean): void {
    this.p2p.toggleKeyLink(enabled);
  }

  /**
   * Enable/disable chord synchronization
   */
  setChordEnabled(enabled: boolean): void {
    this.p2p.toggleChordLink(enabled);
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return this.p2p.getStatus();
  }

  /**
   * Get number of connected peers
   */
  getPeerCount(): number {
    return this.p2p.getPeerCount();
  }

  /**
   * Get list of connected peer IDs
   */
  getPeers(): string[] {
    return this.p2p.getPeers();
  }

  /**
   * Listen for events
   */
  on(event: 'open' | 'close' | 'error' | 'status' | 'state' | 'peer-connected' | 'peer-disconnected', callback: (...args: any[]) => void): void {
    this.p2p.on(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: any[]) => void): void {
    // Note: The underlying P2P SDK doesn't support removing listeners yet
    // This is a placeholder for future implementation
    console.warn('Event listener removal not yet implemented');
  }
}

// Convenience function to create and connect to KeyLink
export async function createKeyLink(options?: {
  port?: number;
  discoveryInterval?: number;
  enableUdp?: boolean;
}): Promise<KeyLinkAPI> {
  const api = new KeyLinkAPI(options);
  await api.connect();
  return api;
}

// Example usage:
/*
import { createKeyLink } from './keylink-zero-config-api';

// Create and connect
const keylink = await createKeyLink();

// Set up event listeners
keylink.on('open', () => {
  console.log('Connected to P2P network');
});

keylink.on('state', (state) => {
  console.log('Received state:', state);
});

keylink.on('peer-connected', (peerId) => {
  console.log('Peer connected:', peerId);
});

// Send musical data
keylink.setKey('C', 'major');
keylink.setTempo(120);
keylink.setChord('F', 'maj7');

// Check status
console.log('Connected peers:', keylink.getPeerCount());
console.log('Status:', keylink.getStatus());
*/ 