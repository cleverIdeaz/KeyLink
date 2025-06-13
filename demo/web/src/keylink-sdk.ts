// Minimal KeyLink SDK for browser/Node.js
// Usage: import { KeyLinkClient } from './keylink-sdk';

export type KeyLinkState = {
  enabled: boolean;
  key: string;
  mode: string;
  chordEnabled: boolean;
  chord: { root: string; type: string };
};

type Listener = (state: KeyLinkState) => void;

export class KeyLinkClient {
  private ws: WebSocket | null = null;
  private listeners: Listener[] = [];
  private state: KeyLinkState = {
    enabled: false,
    key: 'C',
    mode: 'major',
    chordEnabled: false,
    chord: { root: 'C', type: 'maj' },
  };

  constructor(public opts: { relayUrl: string }) {}

  connect() {
    this.ws = new WebSocket(this.opts.relayUrl);
    this.ws.onmessage = (e) => {
      try {
        if (e.data instanceof Blob) {
          // Read the Blob as text, then parse JSON
          const reader = new FileReader();
          reader.onload = () => {
            try {
              console.log('[KeyLink SDK] Received raw message:', reader.result);
              const msg = JSON.parse(reader.result as string);
              if (msg.type === 'keylink-state' || msg.type === 'set-state') {
                this.state = msg.state;
                this.listeners.forEach((fn) => fn(this.state));
              }
            } catch (err) {
              console.error('[KeyLink SDK] Failed to parse Blob message:', err);
            }
          };
          reader.readAsText(e.data);
        } else {
          // Fallback for string messages
          console.log('[KeyLink SDK] Received raw message:', e.data);
          const msg = JSON.parse(e.data);
          if (msg.type === 'keylink-state' || msg.type === 'set-state') {
            this.state = msg.state;
            this.listeners.forEach((fn) => fn(this.state));
          }
        }
      } catch (err) {
        console.error('[KeyLink SDK] General onmessage error:', err);
      }
    };
    this.ws.onopen = () => {
      this.send({ type: 'get-state' });
    };
  }

  on(fn: Listener) {
    this.listeners.push(fn);
  }

  setState(state: Partial<Omit<KeyLinkState, 'chord' | 'chordEnabled'>>) {
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
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(msg));
    }
  }
} 