import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../../shared/utils.js';

const epsilon = 1e-3;

import {
  beatsToSeconds,
  secondsToBeats,
  positionsToBeatsDelta,
  positionsToSecondsDelta,
  positionAddBeats,
  positionRoundBeats,
  timeDeltaToTempo,
} from '../../../src/server/helpers/conversion.js';

describe(`Check beats conversion helpers`, () => {

  const testValues = [
    [{tempo: 120},
     4,
     2],
    [{tempo: 120},
     -4,
     -2],
    [{tempo: 60},
     1,
     1],
    [{tempo: 60},
     -1,
     -1],
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
     -1,
     -0.5],
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
        secondsToBeats(beatsToSeconds(values[1], values[0]), values[0]),
        values[1],
        `secondsToBeats and beatsToSeconds values: ${JSON.stringify(values[0])}, ${values[1]}` );
    });
  });

  it(`should convert from beats`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        beatsToSeconds(values[1], values[0]),
        values[2],
        `beatsToSeconds values: ${JSON.stringify(values[0])}, ${values[1]}`);
    });
  });

  it(`should convert from seconds`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        secondsToBeats(values[2], values[0]),
        values[1],
        `secondsToBeats values ${JSON.stringify(values[0])}, ${values[2]}`);
    });
  });

});

describe(`Check positionsToBeatsDelta conversion helper`, () => {

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
      assert.equal(positionsToBeatsDelta(values[1], values[2], values[0]),
                   values[3],
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
      assert.equal(positionsToSecondsDelta(values[1], values[2], values[0]),
                   values[3],
                   `values ${
JSON.stringify({...values[0], position: values[1], reference: values[2]})
    }`);
    });

  });

});


describe(`Check positionsAddBeats conversion helper`, () => {

  const testValues = [
    [{timeSignature: {count: 4} },
     {bar:1, beat: 1},
     1,
     {bar: 1, beat: 2}],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 4.99},
     0.01,
     {bar: 2, beat: 1}],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 4},
     1,
     {bar: 2, beat: 1}],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 4},
     1.2,
     {bar: 2, beat: 1.2}],
    [{timeSignature: {count: 3} },
     {bar:5, beat: 2},
     3,
     {bar: 6, beat: 2}],
    [{timeSignature: {count: 3} },
     {bar:5, beat: 2},
     0,
     {bar: 5, beat: 2}],
    // negative values
    [{timeSignature: {count: 4} },
     {bar:5, beat: 2},
     -3,
     {bar: 4, beat: 3}],
    [{timeSignature: {count: 4} },
     {bar:5, beat: 2},
     -3.5,
     {bar: 4, beat: 2.5}],
    [{timeSignature: {count: 4} },
     {bar:2, beat: 1},
     -8,
     {bar: 0, beat: 1}],
    [{timeSignature: {count: 4} },
     {bar:2, beat: 1},
     -16,
     {bar: -2, beat: 1}],
    // keep bar 0 for computation (and may offset display by -1)
    [{timeSignature: {count: 4} },
     {bar:-1, beat: 4},
     1,
     {bar: 0, beat: 1}],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 1},
     -1,
     {bar: 0, beat: 4}],
     // conform bar and beat
     [{timeSignature: {count: 4} },
      {bar:2, beat: 0},
      0,
      {bar: 1, beat: 4}],
     [{timeSignature: {count: 4} },
      {bar:2, beat: 5},
      0,
      {bar: 3, beat: 1}],
     [{timeSignature: {count: 4} },
      {bar:1, beat: 0},
      0,
      {bar: 0, beat: 4}],
     [{timeSignature: {count: 4} },
      {bar:0, beat: 0},
      0,
      {bar: -1, beat: 4}],
    ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const position = positionAddBeats(values[1], values[2], values[0]);
      assert.equal(position.bar,
                   values[3].bar,
                   `bar ${
JSON.stringify({...values[0], position: values[1], beats: values[2]})
    }`);
      assertWithRelativeError(position.beat,
                              values[3].beat,
                              epsilon,
                              `beat ${
JSON.stringify({...values[0], position: values[1], beats: values[2]})
    }`);
    });

  });
});

describe(`Check positionsRoundBeats conversion helper`, () => {

  const testValues = [
    [{timeSignature: {count: 4} },
     {bar:1, beat: 1.1},
     {bar: 1, beat: 1}],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 4.5},
     {bar: 2, beat: 1}],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 1.1},
     {bar: 1, beat: 1}],
    [{timeSignature: {count: 3} },
     {bar:5, beat: 2.4},
     {bar: 5, beat: 2}],
    [{timeSignature: {count: 3} },
     {bar:5, beat: 3.8},
     {bar: 6, beat: 1}],
    // negative values
    [{timeSignature: {count: 4} },
     {bar:-5, beat: 2.3},
     {bar: -5, beat: 2}],
    [{timeSignature: {count: 4} },
     {bar:-5, beat: 2.7},
     {bar: -5, beat: 3}],
    [{timeSignature: {count: 4} },
     {bar:-5, beat: 4.7},
     {bar: -4, beat: 1}],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const position = positionRoundBeats(values[1], values[0]);
      assert.deepEqual(position, values[2], `bar ${
JSON.stringify({...values[0], position: values[1] })
    }`);
    });
  });

});

describe(`Check beatTimeDeltaToTempo conversion helper`, () => {

  const testValues = [
    [{timeSignature: {division: 4} },
     1,
     1,
     60],
    [{timeSignature: {division: 4} },
     2,
     1,
     30],
    [{timeSignature: {division: 4} },
     0.5,
     1,
     120],
    [{timeSignature: {division: 2} },
     1,
     1,
     120],
    [{timeSignature: {division: 8} },
     1,
     1,
     30],
    [{timeSignature: {division: 8} },
     2,
     1,
     15],
    [undefined,
     2,
     1,
     30],
    // default values
    [{timeSignature: {division: 4} },
     2,
     undefined,
     30],
    [undefined,
     2,
     undefined,
     30],
    // exceptions
    [{timeSignature: {division: 4} },
     0,
     1,
     undefined],
    [{timeSignature: {division: 4} },
     0,
     0,
     undefined],
    [{timeSignature: {division: 4} },
     1,
     0,
     undefined],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const tempo = timeDeltaToTempo(values[1], values[2], values[0]);
      assert.equal(tempo, values[3], `beatTimeDelta ${
JSON.stringify({...values[0], timeDelta: values[1], beatDelta: values[2] })
    }`);
    });
  });

});
