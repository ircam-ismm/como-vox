import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../shared/utils.js';

import {Scaler} from '../../src/server/helpers/Scaler.js';

const epsilon = 1e-7;

describe(`Check Scaler object`, () => {

  const testSetups = [
    // linear
    [
      // forward
      {
        inputMin: 5,
        inputMax: 47,
        outputMin: -12,
        outputMax: 3,
        base: 1,
        clip: true,
      },
      [ // input, scaled, inversed
        [5, -12, 5],
        [47, 3, 47],
        [33, -2, 33],
        // clip, then inverse
        [-12, -12, 5],
        [55, 3, 47]
      ],
    ],
    // MIDI pitch to Hertz
    [
      // forward
      {
        inputMin:69,
        inputMax: 81,
        outputMin: 440,
        outputMax: 880,
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
    // decibel to amplitude
    [
      // forward
      {
        inputMin: 0,
        inputMax: 20,
        outputMin: 1,
        outputMax: 10,
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
    testSetups.forEach( (setup) => {
      const scalerSetup = setup[0];
      const scaler = new Scaler(scalerSetup);

      const scalerInverseSetup = {
        inputMin: setup[0].outputMin,
        inputMax: setup[0].outputMax,
        outputMin: setup[0].inputMin,
        outputMax: setup[0].inputMax,
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

        const transformInverse = scalerInverse.process(transform);
        assertWithRelativeError(transformInverse, testValues[2], epsilon,
                                `inverse scaler ${
JSON.stringify({setup: scalerInverseSetup, value: transform, expected: testValues[2]})
      }`);

      }); // for each values

    }); // for each setup

  });

});
