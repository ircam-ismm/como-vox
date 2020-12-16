import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../shared/utils.js';

import {
  modulo,
  median,
  mean,
} from '../../src/server/helpers/math.js';

const epsilon = 1e-7;

describe(`Check modulo`, () => {

  const testValues = [
    [2.34, 2, 0.34],
    [-2.34, 2, 1.66],
    [0, 2, 0],
    [-1, 2, 1],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const result = modulo(values[0], values[1]);
      assertWithRelativeError(result, values[2], epsilon, `modulo ${
JSON.stringify({value: values[0], modulus: values[1] })
    }`);
    });
  });

});

describe(`Check median`, () => {

  const testValues = [
    [ [1, 2, 3, 4, 5],
      3],
    [ [1, 2, 3, 4, 12],
      3],
    [ [-1, -2, -3, -4, -12],
      -3],
    [ [58, 60],
      59],
    [ [58],
      58],
    [ [],
      undefined],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const result = median(values[0]);
      const message = `median ${
JSON.stringify({value: values[0]})
    }`;

      if(typeof values[1] !== 'undefined') {
        assertWithRelativeError(result, values[1], epsilon, message);
      } else {
        assert.equal(result, values[1], message);
      }
    });
  });

});

describe(`Check mean`, () => {

  const testValues = [
    [ [0, 1, 2, 3, 4, 5],
      2.5],
    [ [-0, -1, -2, -3, -4, -5],
      -2.5],
    [ [58, 60],
      59],
    [ [58],
      58],
    [ [],
      undefined],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const result = mean(values[0]);
      const message = `mean ${
JSON.stringify({value: values[0]})
    }`;

      if(typeof values[1] !== 'undefined') {
        assertWithRelativeError(result, values[1], epsilon, message);
      } else {
        assert.equal(result, values[1], message);
      }
    });
  });

});

