import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../shared/utils.js';

import {
  modulo,
  median,
  mean,
  weightedMean,
  unwrap,
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

describe(`Check weighted mean`, () => {

  const testValues = [
    [ [0, 1, 2, 3, 4, 5],
      [1, 1, 1, 1, 1, 1],
      {},
      2.5],
    [ [0, 1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 3, 2, 1],
      {},
      3],
    [ [0, 1, 2, 3, 4, 5],
      [1, 1],
      {},
      0.5],
    [ [0, 1],
      [1, 1, 1, 1, 1, 1, 1],
      {},
      0.5],
    [ [0, 1, 2, 3, 4, 5],
      [0, 0, 0, 1, 0, 0],
      {},
      3],
    // undefined is not valid as default value
    // [ [0, 1, 2, 3, 4, 5],
    //   [0, 0, 0, 0, 0, 0], // sum of weights is zero
    //   {defaultValue: undefined},
    //   undefined], // default value
    [ [0, 1, 2, 3, 4, 5],
      [0, 0, 0, 0, 0, 0], // sum of weights is zero
      {defaultValue: null},
      null], // default value
    [ [0, 1, 2, 3, 4, 5],
      [0, 0, 0, 0, 0, 0], // sum of weights is zero
      {defaultValue: 0}, // default value
      0],
    [ [0, 1, 2, 3, 4, 5],
      [0, 0, 0, 0, 0, 0], // sum of weights is zero
      {defaultValue: 123}, // default value
      123],
    [ [1, 2, 3],
      [-1, 0, 1], // sum of weights is zero
      {defaultValue: null},
      null], // default value
    [ [-0, -1, -2, -3, -4, -5],
      [1, 1, 1, 1, 1, 1],
      {},
      -2.5],
    [ [],
      [],
      {defaultValue: null},
      null], // default value
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const result = weightedMean(values[0], values[1], values[2]);
      const message = `weightedMean ${
JSON.stringify({values: values[0], weights: values[1], options: values[2]})
    }`;

      if(values[3] != null) {
        assertWithRelativeError(result, values[3], epsilon, message);
      } else {
        assert.equal(result, values[3], message);
      }
    });
  });

});

describe(`Check unwrap`, () => {

  const testValues = [
    [0, 0, {}, 0],
    [-1, 0, {range: 1}, 0],
    [-1, 0, {range: 2}, -1],
    [-1, 1, {range: 1}, 1],
    [-1, 2, {range: 1}, 2],
    [-0.9, 0, {range: 1}, 0.1],
    [0.9, 0, {range: 1}, -0.1],
    [0.9, 0.5, {range: 1}, 0.9],
    [-0.49, 0.5, {range: 1}, 0.51],
    [-0.49, -0.5, {range: 1}, -0.49],
    [0.49, 0.5, {range: 1}, 0.49],
    [0.49, -0.5, {range: 1}, -0.51],
    [0.49, 12, {range: 1}, 12.49],
    [0.49, -12, {range: 1}, -11.51],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const result = unwrap(values[0], values[1], values[2]);
      const message = `unwrap ${
JSON.stringify({value: values[0], reference: values[1], options: values[2]})
    }`;

      assertWithRelativeError(result, values[3], epsilon, message);
    });
  });

});

