import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {Clipper} from '../../src/server/helpers/Clipper.js';

describe(`Check Clipper object`, () => {

  const testSetups = [
    // default values: no clip
    [
      {},
      [ // input, clipped
        [5, 5],
        [47, 47],
        [33, 33],
        [-12, -12],
        [-Infinity, -Infinity],
        [Infinity, Infinity],
      ],
    ],
    // min, no max
    [
      {
        min: 1,
      },
      [
        [5, 5],
        [47, 47],
        [33, 33],
        [-12, 1],
        [1, 1],
        [0, 1],
        [-Infinity, 1],
        [Infinity, Infinity],
      ],
    ],
    // min and max
    [
      {
        min: -23,
        max: 21,
      },
      [
        [5, 5],
        [47, 21],
        [33, 21],
        [-122, -23],
        [-23, -23],
        [21, 21],
        [1, 1],
        [0, 0],
        [-Infinity, -23],
        [Infinity, 21],
      ],
    ],
  ];

  it(`should validate values`, () => {
    // test for set method
    const clipperReused = new Clipper();

    testSetups.forEach( (setup) => {
      const clipperSetup = setup[0];

      // test for constructor
      const clipper = new Clipper(clipperSetup);

      // test for set method
      clipperReused.set(clipperSetup);

      setup[1].forEach( (testValues) => {
        debugger;

        const transform = clipper.process(testValues[0]);
        assert.equal(transform, testValues[1], `clipper ${
JSON.stringify({setup: setup[0], value: testValues[0], expected: testValues[1]})
      }`);

        const transformReused = clipperReused.process(testValues[0]);
        assert.equal(transformReused, testValues[1], `clipper ${
JSON.stringify({setup: setup[0], value: testValues[0], expected: testValues[1]})
      }`);

      }); // for each values

    }); // for each setup

  });

});
