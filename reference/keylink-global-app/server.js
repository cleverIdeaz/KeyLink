const express = require("express");
const app = express();
const server = require("http").createServer(app); // Import HTTP module for server creation

// This will serve the static files in the /public folder on our server
app.use(express.static("public"));

// Websocket Server:
const WebSocket = require("ws");
const wsServer = new WebSocket.Server({ server });

// Map to track which client is in which room
const clientRooms = new Map();

// Broadcast to all clients in the same room
function broadcastToRoom(room, data, sender) {
  wsServer.clients.forEach(client => {
    if (
      client.readyState === WebSocket.OPEN &&
      clientRooms.get(client) === room &&
      client !== sender
    ) {
      client.send(data);
    }
  });
}

wsServer.on("connection", ws => {
  console.log("A new client connected!");

  ws.on("message", data => {
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.log("Invalid JSON received:", data);
      return;
    }
    // Room is required for all messages
    const room = parsedData.room;
    if (!room) {
      ws.send(JSON.stringify({ error: "Room is required in all messages." }));
      return;
    }
    // Track the client's room
    clientRooms.set(ws, room);
    // Broadcast to all clients in the same room (except sender)
    broadcastToRoom(room, data, ws);
  });

  ws.on("close", () => {
    clientRooms.delete(ws);
    console.log("A client disconnected!");
  });
});

// Start the server
server.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + server.address().port);
});
