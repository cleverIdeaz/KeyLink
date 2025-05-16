var selectedNote = 'C'; // Default selected note
var recursiveControlEnabled = true; // Default recursive control state
var keyLinkEnabled = true; // Default KeyLink toggle state

// Match websocket protocol to page protocol (ws/http or wss/https):
var wsProtocol = window.location.protocol == "https:" ? "wss" : "ws";

// Set up new websocket connection to server
var connection = new WebSocket(`${wsProtocol}://${window.location.hostname}:${window.location.port}`);

// Log successful connection
connection.onopen = function() {
  console.log("Websocket connected!");
  sendSelectedNote(); // Send the default selected note to the server
};

// Function to handle incoming messages from the server
function handleMessage(message) {
  console.log("New Message:");
  console.log(message);
  var parsedMessageData = JSON.parse(message.data);
  console.log("Parsed Message Data:");
  console.log(parsedMessageData);

  // Update selected note if received from the server
  if (parsedMessageData.note && recursiveControlEnabled) {
    selectedNote = parsedMessageData.note;
    updateDropdown(selectedNote);
  }

  // Update selected Major/Minor type if received from the server
  if (parsedMessageData.selectedType && recursiveControlEnabled) {
    var selectedType = parsedMessageData.selectedType;
    updateMajorMinorDropdown(selectedType);
  }
}

// Function to send the selected note to the server
function sendSelectedNote() {
  if (keyLinkEnabled && recursiveControlEnabled) { // Check if KeyLink toggle and recursive control are enabled
    connection.send(JSON.stringify({ note: selectedNote }));
  }
}

// Function to update the note dropdown menu
function updateDropdown(note) {
  document.getElementById('noteSelect').value = note;
}

// Function to update the Major/Minor dropdown menu
function updateMajorMinorDropdown(selectedType) {
  document.getElementById('majorMinorSelect').value = selectedType;
}

// Event listener for note dropdown menu changes
document.getElementById('noteSelect').addEventListener('change', function(event) {
  selectedNote = event.target.value;
  sendSelectedNote(); // Send the updated selected note to the server
});

// Event listener for toggle button
document.getElementById('toggleButton').addEventListener('click', function() {
  keyLinkEnabled = !keyLinkEnabled; // Toggle KeyLink state
  if (keyLinkEnabled) {
    document.getElementById('toggleButton').style.backgroundColor = '#ffd500'; // Yellow when enabled
  } else {
    document.getElementById('toggleButton').style.backgroundColor = '#363636'; // Dark greyish yellow when disabled
  }
  // You can add logic here to enable/disable recursive control over WebSocket for dropdowns
});

// Event listener for major/minor dropdown changes
document.getElementById('majorMinorSelect').addEventListener('change', function(event) {
  if (keyLinkEnabled && recursiveControlEnabled) { // Check if KeyLink toggle and recursive control are enabled
    var selectedType = event.target.value;
    console.log("Selected Type:", selectedType);
    connection.send(JSON.stringify({ selectedType: selectedType })); // Send the selected Major/Minor type to the server
  }
});

// Event listener for receiving messages from the server
connection.onmessage = function(message) {
  if (keyLinkEnabled && recursiveControlEnabled) { // Check if KeyLink toggle and recursive control are enabled
    handleMessage(message);
  }
};
