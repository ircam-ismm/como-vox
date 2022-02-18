import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../../shared/utils.js';

const epsilon = 1e-3;

import {
  beatsToSeconds,
  secondsToBeats,
  notesToSeconds,
  secondsToNotes,
  notesToBeats,
  beatsToNotes,
  positionAddBeats,
  positionAddSeconds,
  positionChangeBeatingUnit,
  positionChangeTimeSignature,
  positionDeltaToSeconds,
  positionsToBeatsDelta,
  positionsToSecondsDelta,
  positionRoundBeats,
  timeSignatureChangeBeatingUnit,
  tempoChangeBeatingUnit,
  tempoChangeTimeSignature,
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
    // half-note and a half
    [{tempo: 60, timeSignature: {division: 4/3}},
     1,
     3],
    [{tempo: 60, timeSignature: {division: 8}},
     1,
     0.5],
    // quarter-note and a half
    [{tempo: 60, timeSignature: {division: 8/3}},
     1,
     1.5],
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

describe(`Check note conversion helpers`, () => {

  // tempo of quarter note
  const testValues = [
    [
      {tempo: 60, timeSignature: {count: 4, division: 4} },
      1, // whole notes
      4, // beats
      4, // seconds
    ],
    [
      {tempo: 120, timeSignature: {count: 4, division: 4} },
      1, // whole notes
      4, // beats
      2, // seconds
    ],
    [
      {tempo: 120, timeSignature: {count: 3, division: 4} },
      1, // whole notes
      4, // beats
      2, // seconds
    ],
    [
      {tempo: 120, timeSignature: {count: 3, division: 8} },
      1, // whole notes
      8, // beats
      2, // seconds
    ],
    [
      {tempo: 120, timeSignature: {count: 3, division: 8} },
      0, // whole notes
      0, // beats
      0, // seconds
    ],
    [
      {tempo: 60, timeSignature: {count: 7, division: 16} },
      0.5, // whole notes
      8, // beats
      2, // seconds
    ],
  ];

  it(`should convert to beats and back`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        beatsToNotes(notesToBeats(values[1], values[0]),
                     values[0]),
        values[1],
        `notesToBeats and beatsToNote values: ${JSON.stringify(values[0])}, ${values[1]}` );
    });
  });

  it(`should convert from notes to beats`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        notesToBeats(values[1], values[0]),
        values[2],
        `notesToBeats values: ${JSON.stringify(values[0])}, ${values[1]}`);
    });
  });

  it(`should convert from beats to notes`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        beatsToNotes(values[2], values[0]),
        values[1],
        `beatsToNotes values: ${JSON.stringify(values[0])}, ${values[2]}`);
    });
  });

  it(`should convert to seconds and back`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        secondsToNotes(notesToSeconds(values[1], values[0]),
                          values[0]),
        values[1],
        `notesToSeconds and secondsToNote values: ${JSON.stringify(values[0])}, ${values[1]}` );
    });
  });

  it(`should convert from notes to seconds`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        notesToSeconds(values[1], values[0]),
        values[3],
        `notesToSeconds values: ${JSON.stringify(values[0])}, ${values[1]}`);
    });
  });

  it(`should convert from seconds to notes`, () => {
    testValues.forEach( (values) => {
      assert.equal(
        secondsToNotes(values[3], values[0]),
        values[1],
        `secondsToNotes values: ${JSON.stringify(values[0])}, ${values[3]}`);
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
     {bar:0, beat: 1},
     {bar:0, beat: 0},
     1],
    [{timeSignature: {count: 4} },
     {bar:1, beat: 0},
     {bar:0, beat: 0},
     4],
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
    // negative values
    [{timeSignature: {count: 4} },
     {bar:-1, beat: 4},
     {bar:-1, beat: 1},
     3],
    [{timeSignature: {count: 3} },
     {bar:-3, beat: 3.5},
     {bar:-3, beat: 3},
     0.5],
    [{timeSignature: {count: 3} },
     {bar:-1, beat: 1},
     {bar:-3, beat: 3.5},
     3.5],
    [{timeSignature: {count: 3} },
     {bar:-1, beat: 3},
     {bar:-3, beat: 3},
     6],
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
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:0, beat: 1},
     {bar:0, beat: 0},
     1],
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:1, beat: 0},
     {bar:0, beat: 0},
     4],
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


describe(`Check positionDeltaToSeconds conversion helper`, () => {

  const testValues = [
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:0, beat: 0},
     0],
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:1, beat: 2},
     6],
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:0, beat: 1},
     1],
    [{timeSignature: {count: 4, division: 4}, tempo: 60 },
     {bar:1, beat: 0},
     4],
    [{timeSignature: {count: 4, division: 4}, tempo: 120 },
     {bar:1, beat: 2},
     3],
    [{timeSignature: {count: 4, division: 4}, tempo: 120 },
     {bar:-1, beat: 0},
     -2],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      assert.equal(positionDeltaToSeconds(values[1], values[0]),
                   values[2],
                   `values ${
JSON.stringify({...values[0], positionDelta: values[1]})
    }`);
    });

  });

});


describe(`Check positionAddBeats conversion helper`, () => {

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
     {bar:-5, beat: 2},
     -3,
     {bar: -6, beat: 3}],
    [{timeSignature: {count: 4} },
     {bar:-1, beat: 2},
     8,
     {bar: 1, beat: 2}],
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

describe(`Check positionAddSeconds conversion helper`, () => {

  const testValues = [
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:1, beat: 1},
     1,
     {bar: 1, beat: 2}],
    [{timeSignature: {count: 4, division: 4}, tempo: 120},
     {bar:1, beat: 1},
     1,
     {bar: 1, beat: 3}],
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:1, beat: 4.99},
     0.01,
     {bar: 2, beat: 1}],
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:1, beat: 4},
     1,
     {bar: 2, beat: 1}],
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:1, beat: 4},
     1.2,
     {bar: 2, beat: 1.2}],
    [{timeSignature: {count: 3, division: 4}, tempo: 60},
     {bar:5, beat: 2},
     3,
     {bar: 6, beat: 2}],
    [{timeSignature: {count: 3, division: 4}, tempo: 30},
     {bar:5, beat: 2},
     3,
     {bar: 5, beat: 3.5}],
    [{timeSignature: {count: 3, division: 4} },
     {bar:5, beat: 2},
     0,
     {bar: 5, beat: 2}],
    // negative values
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:5, beat: 2},
     -3,
     {bar: 4, beat: 3}],
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:-5, beat: 2},
     -3,
     {bar: -6, beat: 3}],
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:-1, beat: 2},
     8,
     {bar: 1, beat: 2}],
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:5, beat: 2},
     -3.5,
     {bar: 4, beat: 2.5}],
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:2, beat: 1},
     -8,
     {bar: 0, beat: 1}],
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:2, beat: 1},
     -16,
     {bar: -2, beat: 1}],
    // keep bar 0 for computation (and may offset display by -1)
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:-1, beat: 4},
     1,
     {bar: 0, beat: 1}],
    [{timeSignature: {count: 4, division: 4}, tempo: 60},
     {bar:1, beat: 1},
     -1,
     {bar: 0, beat: 4}],
     // conform bar and beat
     [{timeSignature: {count: 4, division: 4}, tempo: 60},
      {bar:2, beat: 0},
      0,
      {bar: 1, beat: 4}],
     [{timeSignature: {count: 4, division: 4}, tempo: 80},
      {bar:2, beat: 5},
      0,
      {bar: 3, beat: 1}],
     [{timeSignature: {count: 4, division: 4}, tempo: 100},
      {bar:1, beat: 0},
      0,
      {bar: 0, beat: 4}],
     [{timeSignature: {count: 4, division: 4}, tempo: 50},
      {bar:0, beat: 0},
      0,
      {bar: -1, beat: 4}],
    ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const position = positionAddSeconds(values[1], values[2], values[0]);
      assert.equal(position.bar,
                   values[3].bar,
                   `bar ${
JSON.stringify({...values[0], position: values[1], seconds: values[2]})
    }`);
      assertWithRelativeError(position.beat,
                              values[3].beat,
                              epsilon,
                              `beat ${
JSON.stringify({...values[0], position: values[1], seconds: values[2]})
    }`);
    });

  });
});

describe(`Check positionChangeBeatingUnit conversion helper`, () => {

  const testValues = [
    {
      // preserve bar change
      position: {bar: 2, beat: 1},
      timeSignature: {count: 4, division: 4},
      beatingUnit: 1/8,
      positionExpected: {bar: 2, beat: 1},
    },
    {
      // preserve bar change
      position: {bar: 2, beat: 1},
      timeSignature: {count: 8, division: 8},
      beatingUnit: 1/4,
      positionExpected: {bar: 2, beat: 1},
    },
    {
      position: {bar: 2, beat: 2},
      timeSignature: {count: 4, division: 4},
      beatingUnit: 1/8,
      positionExpected: {bar: 2, beat: 3},
    },
    {
      position: {bar: 2, beat: 3},
      timeSignature: {count: 8, division: 8},
      beatingUnit: 1/4,
      positionExpected: {bar: 2, beat: 2},
    },
    {
      position: {bar: 1, beat: 4},
      timeSignature: {count: 6, division: 8},
      beatingUnit: 3/8, // dotted quarter-note
      positionExpected: {bar: 1, beat: 2},
    },
    {
      // no bar change expected
      position: {bar: 21, beat: 4},
      timeSignature: {count: 6, division: 8},
      beatingUnit: 3/8, // dotted quarter-note
      positionExpected: {bar: 21, beat: 2},
    },
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const {
        position,
        reference,
        timeSignature,
        beatingUnit,
        beatingUnitNew,
        positionExpected,
      } = values;
      const positionResult = positionChangeBeatingUnit(position, {
        reference,
        timeSignature,
        beatingUnit,
        beatingUnitNew
      });

      assertWithRelativeError(positionResult.beat,
                              positionExpected.beat,
                              epsilon,
                              `beat ${
JSON.stringify({...values, positionResult})
}`);

    });

  });

});


describe(`Check positionChangeTimeSignature conversion helper`, () => {

  const testValues = [
    {
      position: {bar: 2, beat: 1},
      timeSignature: {count: 4, division: 4},
      timeSignatureNew: {count: 8, division: 8},
      positionExpected: {bar: 2, beat: 1},
    },
    {
      position: {bar: 2, beat: 1},
      timeSignature: {count: 4, division: 4},
      timeSignatureNew: {count: 4, division: 8},
      positionExpected: {bar: 4, beat: 1},
    },
    {
      position: {bar: 3, beat: 1},
      timeSignature: {count: 4, division: 4},
      reference: {bar: 2, beat: 1}, // position of time-signature change
      timeSignatureNew: {count: 4, division: 8},
      positionExpected: {bar: 4, beat: 1},
    },
    {
      position: {bar: 2, beat: 1},
      timeSignature: {count: 4, division: 4},
      timeSignatureNew: {count: 3, division: 4},
      positionExpected: {bar: 2, beat: 2},
    },
    {
      position: {bar: 1, beat: 4},
      timeSignature: {count: 6, division: 8},
      timeSignatureNew: {count: 6/3, division: 8/3}, // dotted quarter-note
      positionExpected: {bar: 1, beat: 2},
    },
    {
      // no bar change expected
      position: {bar: 21, beat: 4},
      timeSignature: {count: 6, division: 8},
      timeSignatureNew: {count: 6/3, division: 8/3}, // dotted quarter-note
      positionExpected: {bar: 21, beat: 2},
    },
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const {
        position,
        reference,
        timeSignature,
        timeSignatureNew,
        positionExpected,
      } = values;
      const positionResult = positionChangeTimeSignature(position, {
        reference,
        timeSignature,
        timeSignatureNew,
      });

      assertWithRelativeError(positionResult.beat,
                              positionExpected.beat,
                              epsilon,
                              `beat ${
JSON.stringify({...values, positionResult})
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

describe(`Check timeSignatureChangeBeatingUnit conversion helper`, () => {

  const testValues = [
    {
      timeSignature: {count: 6, division: 8},
      beatingUnitNew: 1/8,
      timeSignatureExpected: {count: 6, division: 8},
    },
    {
      timeSignature: {count: 8, division: 8},
      beatingUnitNew: 1/4,
      timeSignatureExpected: {count: 4, division: 4},
    },
    {
      timeSignature: {count: 6, division: 8},
      beatingUnitNew: 3/8, // dotted quarter-note
      timeSignatureExpected: {count: 2, division: 8/3},
    },
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const {
        timeSignature,
        beatingUnitNew,
        timeSignatureExpected,
      } = values;
      const timeSignatureResult = timeSignatureChangeBeatingUnit(timeSignature, {
        beatingUnitNew,
      });

      assertWithRelativeError(timeSignatureResult.count,
                              timeSignatureExpected.count,
                              epsilon,
                              `timeSignature count ${
JSON.stringify({...values, timeSignatureResult})
}`);

      assertWithRelativeError(timeSignatureResult.division,
                              timeSignatureExpected.division,
                              epsilon,
                              `timeSignature division ${
JSON.stringify({...values, timeSignatureResult})
}`);

    });

  });

});


describe(`Check tempoChangeBeatingUnit conversion helper`, () => {

  const testValues = [
    {
      tempo: 60,
      timeSignature: {count: 4, division: 4},
      beatingUnitNew: 1/8,
      tempoExpected: 120,
    },
    {
      tempo: 120,
      timeSignature: {count: 8, division: 8},
      beatingUnitNew: 1/4,
      tempoExpected: 60,
    },
    {
      tempo: 180,
      timeSignature: {count: 6, division: 8},
      beatingUnitNew: 3/8, // dotted quarter-note
      tempoExpected: 60,
    },
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const {
        tempo,
        timeSignature,
        beatingUnitNew,
        tempoExpected,
      } = values;
      const tempoResult = tempoChangeBeatingUnit(tempo, {
        timeSignature,
        beatingUnitNew,
      });

      assertWithRelativeError(tempoResult,
                              tempoExpected,
                              epsilon,
                              `tempo ${
JSON.stringify({...values, tempoResult})
}`);

    });

  });

});


describe(`Check tempoChangeTimeSignature conversion helper`, () => {

  const testValues = [
    {
      tempo: 60,
      timeSignature: {count: 4, division: 4},
      timeSignatureNew: {count: 8, division: 8},
      tempoExpected: 120,
    },
    {
      tempo: 60,
      timeSignature: {count: 4, division: 4},
      timeSignatureNew: {count: 4, division: 8},
      tempoExpected: 120,
    },
    {
      tempo: 120,
      timeSignature: {count: 8, division: 8},
      timeSignatureNew: {count: 4, division: 4},
      tempoExpected: 60,
    },
    {
      tempo: 60,
      timeSignature: {count: 4, division: 4},
      timeSignatureNew: {count: 3, division: 4},
      tempoExpected: 60,
    },
    {
      tempo: 180,
      timeSignature: {count: 6, division: 8},
      timeSignatureNew: {count: 6/3, division: 8/3}, // dotted quarter-note
      tempoExpected: 60,
    },
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const {
        tempo,
        timeSignature,
        timeSignatureNew,
        tempoExpected,
      } = values;
      const tempoResult = tempoChangeTimeSignature(tempo, {
        timeSignature,
        timeSignatureNew,
      });

      assertWithRelativeError(tempoResult,
                              tempoExpected,
                              epsilon,
                              `tempo ${
JSON.stringify({...values, tempoResult})
}`);

    });

  });

});


describe(`Check timeDeltaToTempo conversion helper`, () => {

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
