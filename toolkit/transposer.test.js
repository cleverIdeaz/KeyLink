const { calculateTransposition } = require('./transposer');

function test(fromRoot, fromMode, toRoot, toMode, expected) {
  const result = calculateTransposition(fromRoot, fromMode, toRoot, toMode);
  const pass = result === expected ? 'PASS' : 'FAIL';
  console.log(`${pass}: ${fromRoot} ${fromMode} -> ${toRoot} ${toMode} = ${result} (expected ${expected})`);
}

// Major to major
test('C', 'major', 'D', 'major', 2);
test('C', 'major', 'B', 'major', -1);
// Major to relative minor
test('C', 'major', 'A', 'minor', 0);
// Minor to relative major
test('A', 'minor', 'C', 'major', 0);
// Major to parallel minor
test('C', 'major', 'C', 'minor', 0);
// Minor to minor
test('A', 'minor', 'B', 'minor', 2);
// Major to unrelated minor
test('C', 'major', 'B', 'minor', -1);
// Edge case: wrap around
test('B', 'major', 'C', 'major', 1); 