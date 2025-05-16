const {
  keylinkToMIDIUMP,
  midiUMPToKeylink,
  keylinkToMIDI1,
  midi1ToKeylink
} = require('./midi-bridge');

// Example KeyLink message
const keylinkMsg = {
  root: 'C',
  mode: 'Dorian',
  chord: { root: 'G', type: 'min7' },
  keylinkEnabled: true,
  abletonLinkEnabled: false,
  tempo: 120,
  source: 'test',
  timestamp: Date.now()
};

function testRoundTripMIDIUMP(msg) {
  const midi = keylinkToMIDIUMP(msg);
  const roundTrip = midiUMPToKeylink(midi);
  console.log('MIDI UMP round-trip:', JSON.stringify(roundTrip));
}

function testRoundTripMIDI1(msg) {
  const midi = keylinkToMIDI1(msg);
  const roundTrip = midi1ToKeylink(midi);
  console.log('MIDI 1.0 round-trip:', JSON.stringify(roundTrip));
}

console.log('Testing MIDI 2.0 UMP round-trip:');
testRoundTripMIDIUMP(keylinkMsg);

console.log('Testing MIDI 1.0 round-trip:');
testRoundTripMIDI1(keylinkMsg); 