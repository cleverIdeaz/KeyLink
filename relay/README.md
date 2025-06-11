# KeyLink Relay Server

This is the UDP/WebSocket relay for KeyLink, suitable for deployment on Fly.io, Railway, Render, or any Node.js host.

## Local Development

```sh
cd relay
npm install
node relay.js
```

- By default, listens on ws://localhost:20801 (or process.env.PORT)
- UDP multicast on 239.255.60.60:20800

## Deploy to Fly.io

1. Install Fly CLI:
   ```sh
   brew install flyctl
   # or
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```
2. Launch app:
   ```sh
   fly launch --name keylink-relay --no-deploy
   # answer prompts, pick a region
   fly deploy
   ```
3. Your relay will be available at:
   ```
   wss://keylink-relay.fly.dev/
   ```

- No SSL certs needed; Fly.io handles HTTPS/WSS at the edge.
- The relay listens on process.env.PORT or 20801.

## Environment Variables
- `PORT`: WebSocket server port (default: 20801)
- `SSL_KEY_PATH`, `SSL_CERT_PATH`: Optional, for custom SSL (not needed on Fly.io)

## Usage
- Point your KeyLink clients (web, Max, etc.) to the public WSS URL.
- All KeyLink JSON messages are relayed between UDP multicast and WebSocket clients. 