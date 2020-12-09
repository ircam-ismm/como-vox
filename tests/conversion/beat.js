import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {
  beatsToSeconds,
  secondsToBeats,
  positionsToBeatDelta,
  positionsToSecondsDelta,
} from '../../src/server/helpers/conversion.js';

describe(`Check beats conversion helpers`, () => {

  const testValues = [
    [{tempo: 120},
     4,
     2],
    [{tempo: 60},
     1,
     1],
    [{tempo: 60, timeSignature: {division: 2}},
     1,
     2],
    [{tempo: 60, timeSignature: {division: 4}},
     1,
     1],
    [{tempo: 60, timeSignature: {division: 8}},
     1,
     0.5],
    [{tempo: 60, timeSignature: {division: 8}},
     2,
     1],
    [{tempo: 240, timeSignature: {division: 4}},
     4,
     1],
  ];

  it(`should convert and back from`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        values[1],
        secondsToBeats(beatsToSeconds(values[1], values[0]), values[0]),
        `secondsToBeats and beatsToSeconds values: ${JSON.stringify(values[0])}, ${values[1]}` );
    });
  });

  it(`should convert from beats`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        values[2],
        beatsToSeconds(values[1], values[0]),
        `beatsToSeconds values: ${JSON.stringify(values[0])}, ${values[1]}`);
    });
  });

  it(`should convert from seconds`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        values[1],
        secondsToBeats(values[2], values[0]),
        `secondsToBeats values ${JSON.stringify(values[0])}, ${values[2]}`);
    });
  });

});

describe(`Check positionsToBeatDelta conversion helper`, () => {

  const testValues = [
    [{timeSignature: {count: 4} },
     {bar:1, beat: 1},
     {bar:1, beat: 1},
     0],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 2},
     {bar:1, beat: 1},
     1],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 1},
     {bar:1, beat: 2},
     -1],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 4},
     {bar:1, beat: 1},
     3],
    [{timeSignature: {count: 4} },
     {bar:2, beat: 1},
     {bar:1, beat: 1},
     4],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 1},
     {bar:2, beat: 1},
     -4],
    [{timeSignature: {count: 3} },
     {bar:2, beat: 1},
     {bar:1, beat: 1},
     3],
    [{timeSignature: {count: 3} },
     {bar:3, beat: 3.5},
     {bar:1, beat: 1},
     8.5],
    [{timeSignature: {count: 3} },
     {bar:1, beat: 1},
     {bar:3, beat: 3.5},
     -8.5],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      assert.equal(values[3],
                   positionsToBeatDelta(values[1], values[2], values[0]),
                   `values ${
JSON.stringify({...values[0], position: values[1], reference: values[2]})
    }`);
    });

  });

});


describe(`Check positionsToSecondsDelta conversion helper`, () => {

  const testValues = [
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:1, beat: 1},
     {bar:1, beat: 1},
     0],
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:1, beat: 2},
     {bar:1, beat: 1},
     1],
    [{timeSignature: {count: 4, division: 4}, tempo: 120 },
     {bar:1, beat: 2},
     {bar:1, beat: 1},
     0.5],
    [{timeSignature: {count: 4, division: 4}, tempo: 120 },
     {bar:1, beat: 1},
     {bar:1, beat: 2},
     -0.5],
    [{timeSignature: {count: 4, division: 4}, tempo: 30 },
     {bar:1, beat: 2},
     {bar:1, beat: 1},
     2],
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:1, beat: 4},
     {bar:1, beat: 1},
     3],
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:2, beat: 1},
     {bar:1, beat: 1},
     4],
    [{timeSignature: {count: 3, division: 4}, tempo: 60 },
     {bar:2, beat: 1},
     {bar:1, beat: 1},
     3],
    [{timeSignature: {count: 3, division: 4}, tempo: 60 },
     {bar:3, beat: 3.5},
     {bar:1, beat: 1},
     8.5],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      assert.equal(values[3],
                   positionsToSecondsDelta(values[1], values[2], values[0]),
                   `values ${
JSON.stringify({...values[0], position: values[1], reference: values[2]})
    }`);
    });

  });

});
