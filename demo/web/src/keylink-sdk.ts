// Minimal KeyLink SDK for browser/Node.js
// Usage: import { KeyLinkClient } from './keylink-sdk';

export type KeyLinkState = {
  enabled: boolean;
  key: string;
  mode: string;
  tempo: number;
  chordEnabled: boolean;
  chord: { root: string; type: string };
};

type Event = 'open' | 'close' | 'error' | 'status' | 'state';
type Listener = (...args: any[]) => void;

export class KeyLinkClient {
  private ws: WebSocket | null = null;
  private listeners: { [key: string]: Listener[] } = {};
  private state: Partial<KeyLinkState> = {};

  constructor(public opts: { relayUrl: string }) {}

  connect() {
    this.emit('status', 'Connecting...');
    try {
      this.ws = new WebSocket(this.opts.relayUrl);
    } catch (e) {
      this.emit('error', e);
      this.emit('status', 'Connection failed');
      return;
    }

    this.ws.onopen = () => {
      this.emit('open');
      this.emit('status', 'Connected');
      this.send({ type: 'get-state' });
    };

    this.ws.onclose = () => {
      this.emit('close');
      this.emit('status', 'Disconnected');
    };
    
    this.ws.onerror = (err) => {
      this.emit('error', err);
      this.emit('status', 'Error');
    };
    
    this.ws.onmessage = (e) => {
      this.handleMessage(e.data);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  on(event: Event, fn: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(fn);
  }

  private emit(event: Event, ...args: any[]) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(fn => fn(...args));
    }
  }

  private handleMessage(data: any) {
    if (data instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        this.parseMessage(reader.result as string);
      };
      reader.readAsText(data);
    } else {
      this.parseMessage(data);
    }
  }
  
  private parseMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'keylink-state' || msg.type === 'set-state') {
        this.state = msg.state;
        this.emit('state', this.state);
      }
    } catch (err) {
      this.emit('error', 'Failed to parse message:', err);
      console.error('[KeyLink SDK] Failed to parse message:', err);
    }
  }

  setState(state: Partial<KeyLinkState>) {
    this.state = { ...this.state, ...state };
    this.send({ type: 'set-state', state: this.state });
  }

  setChord(chord: { root: string; type: string }) {
    this.state.chord = chord;
    this.send({ type: 'set-chord', chord });
  }

  toggleChordLink(enabled: boolean) {
    this.state.chordEnabled = enabled;
    this.send({ type: 'toggle-chordlink', enabled });
  }

  toggleKeyLink(enabled: boolean) {
    this.state.enabled = enabled;
    this.send({ type: 'toggle-keylink', enabled });
  }

  private send(msg: any) {
    if (this.isConnected()) {
      this.ws?.send(JSON.stringify(msg));
    }
  }
} 