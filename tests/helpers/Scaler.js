import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../shared/utils.js';

import {Scaler} from '../../src/server/helpers/Scaler.js';

const epsilon = 1e-7;

describe(`Check Scaler object`, () => {

  const testSetups = [
    // linear
    [
      {
        inputStart: 5,
        inputEnd: 47,
        outputStart: -12,
        outputEnd: 3,
        base: 1,
        clip: true,
      },
      [ // input, scaled, inverse
        [5, -12, 5],
        [47, 3, 47],
        [33, -2, 33],
        // clip, then inverse
        [-12, -12, 5],
        [55, 3, 47],
      ],
    ],
    // start > end
    [
      {
        inputStart: 47,
        inputEnd: 5,
        outputStart: 3,
        outputEnd: -12,
        base: 1,
        clip: true,
      },
      [ // input, scaled, inverse
        [5, -12, 5],
        [47, 3, 47],
        [33, -2, 33],
        // clip, then inverse
        [-12, -12, 5],
        [55, 3, 47],
      ],
    ],
    // start > end
    [
      {
        inputStart: 47,
        inputEnd: 5,
        outputStart: -12,
        outputEnd: 3,
        base: 1,
        clip: true,
      },
      [ // input, scaled, inverse
        [5, 3, 5],
        [47, -12, 47],
        // clip, then inverse
        [-12, 3, 5],
        [55, -12, 47],
      ],
    ],
    // no input or output range
    [
      // linear
      {
        inputStart: 5,
        inputEnd: 5,
        outputStart: -5,
        outputEnd: 0,
        base: 1,
        clip: false,
      },
      [
        [5, -5, 5],
        [2, -5, 5],
        [12, 0, 5],
      ],
    ],
    [
      // logarithmic
      {
        inputStart: 5,
        inputEnd: 5,
        outputStart: -5,
        outputEnd: -5,
        base: 2,
        type: 'logarithmic',
        clip: false,
      },
      [
        [5, -5, 5],
        [2, -5, 5],
        [12, -5, 5],
      ],
    ],
    [
      // exponential
      {
        inputStart: 5,
        inputEnd: 5,
        outputStart: -5,
        outputEnd: -5,
        base: 2,
        type: 'exponential',
        clip: false,
      },
      [
        [5, -5, 5],
        [2, -5, 5],
        [12, -5, 5],
      ],
    ],
    // MIDI pitch to Hertz
    [
      // forward
      {
        inputStart: 69,
        inputEnd: 81,
        outputStart: 440,
        outputEnd: 880,
        type: 'exponential',
        base: 2,
        clip: false,
      },
      [
        [69, 440, 69],
        [72, 523.251131, 72],
        [81, 880, 81],
        // no clip
        [57, 220, 57],
        [93, 1760, 93],
      ],
    ],
    [
      // start > end
      {
        inputStart: 81,
        inputEnd: 69,
        outputStart: 880,
        outputEnd: 440,
        type: 'exponential',
        base: 0.5,
        clip: false,
      },
      [
        [69, 440, 69],
        [72, 523.251131, 72],
        [81, 880, 81],
        // no clip
        [57, 220, 57],
        [93, 1760, 93],
      ],
    ],
    // decibel to amplitude
    [
      // forward
      {
        inputStart: 0,
        inputEnd: 20,
        outputStart: 1,
        outputEnd: 10,
        type: 'exponential',
        base: 10,
        clip: false,
      },
      [
        [0, 1, 0],
        [20, 10, 20],
        // no clip
        [-20, 0.1, -20],
      ],
    ],
  ];

  it(`should validate values`, () => {
    // test for set method
    const scalerReused = new Scaler();

    testSetups.forEach( (setup) => {
      const scalerSetup = setup[0];

      // test for constructor
      const scaler = new Scaler(scalerSetup);

      // test for set method
      scalerReused.set(scalerSetup);

      const scalerInverseSetup = {
        inputStart: setup[0].outputStart,
        inputEnd: setup[0].outputEnd,
        outputStart: setup[0].inputStart,
        outputEnd: setup[0].inputEnd,
        type: (setup[0].type === 'logarithmic'
               ? 'exponential'
               : 'logarithmic'),
        base: setup[0].base,
      };
      const scalerInverse = new Scaler(scalerInverseSetup);

      setup[1].forEach( (testValues) => {
        const transform = scaler.process(testValues[0]);
        assertWithRelativeError(transform, testValues[1], epsilon,
                                `scaler ${
JSON.stringify({setup: setup[0], value: testValues[0], expected: testValues[1]})
      }`);

        const transformReused = scalerReused.process(testValues[0]);
        assertWithRelativeError(transformReused, testValues[1], epsilon,
                                `scaler ${
JSON.stringify({setup: setup[0], value: testValues[0], expected: testValues[1]})
      }`);

        const transformInverse = scalerInverse.process(transform);
        assertWithRelativeError(transformInverse, testValues[2], epsilon,
                                `inverse scaler ${
JSON.stringify({setup: scalerInverseSetup, value: transform, expected: testValues[2]})
      }`);

      }); // for each values

    }); // for each setup

  });

});
