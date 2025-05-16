// osc-mapper.js
// Utilities for mapping KeyLink JSON messages to and from integer-indexed OSC messages

/**
 * Convert a KeyLink JSON message to an integer-indexed OSC message.
 * @param {Object} keylinkMsg - The KeyLink JSON message
 * @returns {Object} - OSC message (e.g., { address: '/KeyLink/x', args: [index] })
 */
function keylinkToOSC(keylinkMsg) {
  // TODO: Implement mapping logic using lookup tables
  return { address: '/KeyLink/0', args: [0] };
}

/**
 * Convert an integer-indexed OSC message to a KeyLink JSON message.
 * @param {Object} oscMsg - OSC message (e.g., { address: '/KeyLink/x', args: [index] })
 * @returns {Object} - KeyLink JSON message
 */
function oscToKeylink(oscMsg) {
  // TODO: Implement mapping logic using lookup tables
  return {};
}

module.exports = {
  keylinkToOSC,
  oscToKeylink
}; 