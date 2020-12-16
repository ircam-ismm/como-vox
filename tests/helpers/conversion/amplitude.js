import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../../shared/utils.js';

import {amplitudeToDB, dBToAmplitude} from '../../../src/server/helpers/conversion.js';

const epsilon = 1e-3;

describe(`Check dB conversion helpers`, () => {

  const testValues = [
    [20, 10],
    [6, 1.995],
    [0, 1],
    [-6, 0.501],
    [-20, 0.1],
  ];

  it(`should convert and back from dB values`, () => {
    testValues.forEach( (values) => {
      assertWithRelativeError(amplitudeToDB(dBToAmplitude(values[0]) ),
                              values[0],
                              epsilon,
                              `from ${values[0]} dB`);
    });
  });

  it(`should convert and back from linear values`, () => {
    testValues.forEach( (values) => {
      assertWithRelativeError(dBToAmplitude(amplitudeToDB(values[1]) ),
                              values[1],
                              epsilon,
                              `from ${values[1]} amplitude`);
    });
  });

  it(`should conform from dB values`, () => {
    testValues.forEach( (values) => {
      assertWithRelativeError(dBToAmplitude(values[0]),
                              values[1],
                              epsilon,
                              `from ${values[0]} dB`);
    });
  });

  it(`should conform from linear values`, () => {
    testValues.forEach( (values) => {
      assertWithRelativeError(amplitudeToDB(values[1]),
                              values[0],
                              epsilon,
                              `from ${values[1]} amplitude`);
    });
  });

});

