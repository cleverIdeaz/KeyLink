const express = require("express");
const app = express();

// This will serve the static files in the /public folder on our server
app.use(express.static("public"));

const server = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + server.address().port);
});

// Websocket Server:
const WebSocket = require("ws");
const wsServer = new WebSocket.Server({ server });

// Function to broadcast message to all clients
function broadcast(data) {
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wsServer.on("connection", ws => {
  console.log("A new client connected!");

  ws.on("message", data => {
    console.log("Message Received:");
    console.log(data);
    const parsedData = JSON.parse(data);
    console.log("Parsed Message Data:");
    console.log(parsedData);

    // Broadcast the selected note to all clients
    broadcast(JSON.stringify({ note: parsedData.note }));
  });

  ws.on("close", () => {
    console.log("A client disconnected!");
  });
});

// Handle Major/Minor selection
// This code assumes you have a corresponding event listener on the client side
socket.on('noteSelected', (selectedNote) => {
  console.log('Selected Note:', selectedNote);
  // Add logic here to handle Major/Minor selection broadcast
});
