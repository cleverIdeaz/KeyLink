# KeyLink Web Demo

This is a browser-based demo of KeyLink, showcasing real-time LAN synchronization of key, mode, and chord information using WebSockets.

## What It Demonstrates
- Interactive UI for selecting key, mode, and chord
- Real-time sync with other clients on the LAN
- Integration with the KeyLink relay server
- Clear connection status, relay URL, and room/session info
- Always-visible network log of sent/received messages
- Test message and reconnect buttons for easy debugging

## How to Run
1. **Start the Relay Server:**
   ```sh
   node relay.js
   ```
   - This starts the UDP multicast (for Max) and WebSocket (for browser) relay on your LAN.
   - Default WebSocket relay URL: `ws://localhost:20801` (or your LAN IP)

2. **Start the Web Demo:**
   ```sh
   cd demo/web
   npm install
   npm start
   ```
   - Open your browser to the provided local URL (usually http://localhost:3000)

3. **Connect to the Relay:**
   - The app will auto-detect the relay URL for local or Netlify deployment.
   - You can manually enter a relay URL if needed (e.g., `ws://192.168.1.42:20801` for LAN, or your deployed relay for WAN).
   - Join a room/session (or use the default).
   - The status bar will show connection status, relay URL, and room.

4. **Test Communication:**
   - Open the web demo in two browsers (or two devices) and join the same room.
   - Change any value or use the "Send Test Message" button. You should see the message appear in both browsers and in the network log.
   - Open a Max patch (see below) to test Max-to-browser and Max-to-Max sync.

## Max Patch for Testing

**To send messages:**
```
[dict]
  |
[dict.serialize]
  |
[udpsend 239.255.60.60 20800]
```

**To receive messages:**
```
[udpreceive 20800]
  |
[fromsymbol]
  |
[dict.deserialize]
  |
[dict]
```

- Use `[udpsend 239.255.60.60 20800]` and `[udpreceive 20800]` for LAN multicast.
- Messages sent from Max will appear in the browser and vice versa.

## Deploying to Netlify or WAN
- Deploy the web demo to Netlify or your own server.
- Make sure your relay server is accessible from the deployed site (use a public IP or domain, and open port 20801).
- The app will auto-suggest the correct relay URL for Netlify deployments.

## Troubleshooting
- If you see "No LAN relay found":
  - Make sure the relay server is running and accessible from your device.
  - Check your firewall and network settings (UDP port 20800, WebSocket port 20801).
  - Try entering the relay URL manually (e.g., `ws://your-lan-ip:20801`).
- If messages do not sync between Max and browser:
  - Ensure both are on the same LAN and using the correct ports/addresses.
  - Check the network log for sent/received messages and errors.

## More Info
- For protocol details and toolkit usage, see the main project `README.md`.
