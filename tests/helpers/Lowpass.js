import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../shared/utils.js';

import {Lowpass} from '../../src/server/helpers/Lowpass.js';

const epsilon = 1e-4; // low-resolution of reference values

describe(`Check Lowpass object`, () => {

  const testSetups = [
    [
      {
        sampleRate: 2, // normalised frequency
        lowpassFrequency: 0.9,
      },
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0.9, 0.99, 0.999, 0.9999, 0.99999, 0.999999],
    ],
    [
      {
        sampleRate: 2, // normalised frequency
        lowpassFrequency: 0.1,
      },
      [1, 1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 0.899999, 0.809999, 0.728999, 0.656099, 0.590489],
    ],
    [
      {
        sampleRate: 30, // Hertz
        lowpassFrequency: 5, // Hertz (same unit)
      },
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0.333333, 0.555556, 0.703704, 0.802469, 0.868313, 0.912209],
    ],
    [
      {
        sampleRate: 30, // Hertz
        lowpassFrequencyDown: 10, // Hertz (same unit)
      },
      [1, 1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 0.666667, 0.444444, 0.2962963, 0.19753086, 0.1316872, 0.01128175],
    ],
    // no filtering
    [
      {
        sampleRate: 2, // normalised frequency
        lowpassFrequency: 1,
      },
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    ],
    // infinite hold
    [
      {
        sampleRate: 2, // normalised frequency
        lowpassFrequency: 0,
      },
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // infinite hold
    [
      {
        sampleRate: 2, // normalised frequency
        lowpassFrequency: 0,
      },
      [1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
  ];

  it(`should validate values`, () => {
    // test for set method
    const lowpassReused = new Lowpass();

    testSetups.forEach( (setup) => {

      const parameters = setup[0];
      const testValues = setup[1];
      const expectedValues = setup[2];


      // // test for constructor
      // const lowpass = new Lowpass(parameters);

      // test for set method
      lowpassReused.set(parameters);
      // be sure to reset to NOT continue with last test value
      lowpassReused.reset();

      testValues.forEach( (testValue, v) => {
//         const transform = lowpass.process(testValues[v]);
//         assertWithRelativeError(transform, expectedValues[v], epsilon,
//                                 `lowpass ${
// JSON.stringify({
//   setup: parameters,
//   values: testValues,
//   v,
//   value: testValues[v],
//   expected: expectedValues[v],
// })
//       }`);

        const transformReused = lowpassReused.process(testValues[v]);
        assertWithRelativeError(transformReused, expectedValues[v], epsilon,
                                `lowpass re-used ${
JSON.stringify({
  setup: parameters,
  values: testValues,
  v,
  value: testValues[v],
  expected: expectedValues[v],
})
      }`);


      }); // for each values

    }); // for each setup

  });

});
