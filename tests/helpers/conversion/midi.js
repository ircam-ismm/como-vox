import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../../shared/utils.js';

import {midiIntensityToDB} from '../../../src/server/helpers/conversion.js';

const epsilon = 1e-3;

describe(`Check dB conversion helpers`, () => {

  const testValues = [
    [0, 30, -30],
    [63.5, 30, -15],
    [127, 30, 0],
    [0, 0, 0],
    [63.5, 0, 0],
    [127, 0, 0],
    [0, 10, -10],
    [0, 0, 0],
    [63.5, 10, -5],
    [127, 10, 0],
  ];

  it(`should conform to dB values`, () => {
    testValues.forEach( (values) => {
      assertWithRelativeError(midiIntensityToDB(values[0], {range: values[1]}),
                              values[2],
                              epsilon,
                              `from ${values[0]} with range ${values[1]} dB`);
    });
  });

});

