import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../shared/utils.js';

import {Hysteresis} from '../../src/server/helpers/Hysteresis.js';

const epsilon = 1e-4; // low-resolution of reference values

describe(`Check Hysteresis object`, () => {

  const testSetups = [
    [
      {
        sampleRate: 2, // normalised frequency
        lowpassFrequencyUp: 0.9,
        lowpassFrequencyDown: 0.1,
      },
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0., 0., 0., 0., 0., 0., 0.9, 0.99, 0.999, 0.9999, 0.99999, 0.999999, 0.899999, 0.809999, 0.728999, 0.656099, 0.590489],
    ],
    [
      {
        sampleRate: 30, // Hertz
        lowpassFrequencyUp: 5, // Hertz (same unit)
        lowpassFrequencyDown: 10, // Hertz (same unit)
      },
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0., 0., 0., 0., 0., 0., 0.333333, 0.555556, 0.703704, 0.802469, 0.868313, 0.912209, 0.30407, 0.101357, 0.033786, 0.011262, 0.003754],
    ],
    // no filtering
    [
      {
        sampleRate: 2, // normalised frequency
        lowpassFrequencyUp: 1,
        lowpassFrequencyDown: 1,
      },
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    ],
    // infinite hold
    [
      {
        sampleRate: 2, // normalised frequency
        lowpassFrequencyUp: 1,
        lowpassFrequencyDown: 0,
      },
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  ];

  it(`should validate values`, () => {
    // test for set method
    const hysteresisReused = new Hysteresis();

    testSetups.forEach( (setup) => {

      const parameters = setup[0];
      const testValues = setup[1];
      const expectedValues = setup[2];


      // // test for constructor
      // const hysteresis = new Hysteresis(parameters);

      // test for set method
      hysteresisReused.set(parameters);
      // be sure to reset to NOT continue with last test value
      hysteresisReused.reset();

      testValues.forEach( (testValue, v) => {
//         const transform = hysteresis.process(testValues[v]);
//         assertWithRelativeError(transform, expectedValues[v], epsilon,
//                                 `hysteresis ${
// JSON.stringify({
//   setup: parameters,
//   values: testValues,
//   v,
//   value: testValues[v],
//   expected: expectedValues[v],
// })
//       }`);

        const transformReused = hysteresisReused.process(testValues[v]);
        assertWithRelativeError(transformReused, expectedValues[v], epsilon,
                                `hysteresis re-used ${
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
