import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../../shared/utils.js';

import {
  hertzToNormalised,
  normalisedToHertz,
} from '../../../src/server/helpers/conversion.js';

const epsilon = 1e-3;

describe(`Check frequency conversion helpers`, () => {

  const testValues = [
    [{sampleRate: 44100}, 22050, 1],
    [{sampleRate: 44100}, 0, 0],
    [{sampleRate: 30}, 15, 1],
    [{sampleRate: 30}, 0, 0],
    [{sampleRate: 30}, 7.5, 0.5],
    [{sampleRate: 2}, 1.22, 1.22],
  ];

  it(`should convert and back from Hertz values`, () => {
    testValues.forEach( (values) => {
      assertWithRelativeError(normalisedToHertz(hertzToNormalised(values[1], values[0]),
                                                values[0]),
                              values[1],
                              epsilon,
                              `from ${values[1]} hz`);
    });
  });

  it(`should convert and back from Hertz values`, () => {
    testValues.forEach( (values) => {
      assertWithRelativeError(hertzToNormalised(normalisedToHertz(values[2], values[0]),
                                                values[0]),
                              values[2],
                              epsilon,
                              `from ${values[2]} normalised`);
    });
  });

  it(`should conform from Hertz values`, () => {
    testValues.forEach( (values) => {
      assertWithRelativeError(hertzToNormalised(values[1], values[0]),
                              values[2],
                              epsilon,
                              `from ${values[1]} hz`);
    });
  });

  it(`should conform from normalised values`, () => {
    testValues.forEach( (values) => {
      assertWithRelativeError(normalisedToHertz(values[2], values[0]),
                              values[1],
                              epsilon,
                              `from ${values[1]} normalised`);
    });
  });

});
