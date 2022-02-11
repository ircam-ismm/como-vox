import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../shared/utils.js';

import {
  almostEquals,
  modulo,
  median,
  mean,
  meanVariance,
  meanStandardDeviation,
  weightedMean,
  unwrap,
} from '../../src/server/helpers/math.js';

const epsilon = 1e-7;

describe(`Check almostEquals`, () => {

  const testValues = [
    [1, 1 + 1e-6, 2e-6, true],
    [1, 1 - 1e-6, 2e-6, true],
    [-1, -1 + 1e-6, 2e-6, true],
    [-1, -1 - 1e-6, 2e-6, true],
    [5, 6, 0.5, false],
    [5, 6, 1.1, true],
 ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const message = `almostEquals ${JSON.stringify({values})}`;
      const result = almostEquals(values[0], values[1], values[2]);

      assert.equal(result, values[3], message);
    });

  });
});

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

describe(`Check meanVariance`, () => {

  const testValues = [
    [
      [0, 1, 2, 3, 4, 5],
      {},
      2.5,
      3.5,
    ],
    [
      [1],
      {},
      1,
      0,
    ],
    [
      [1, 1, 1, 1],
      {},
      1,
      0,
    ],
    [
      [-1, -2, -3, -4, -5, -6],
      {},
      -3.5,
      3.5,
    ],
    [
      [-1, -2, -3, -4, -5, -6],
      {ddof: 0},
      -3.5,
      2.9166666666666665,
    ],
    [
      [],
      {},
      undefined,
      undefined,
    ],
    [
      [1.00000215, 1.00000565, 1.00000415, 1.00000662, 1.00000092,
       1.00000936, 1.00000927, 1.00000263, 1.00000505, 1.00000961,
       1.00000352, 1.00000879],
      {ddof:1},
      1.0000056433333333,
      9.47638787886104e-12,
    ],
    [
      [-9.44562587e-08, -9.96113376e-08, -1.21355574e-08,
       -6.77897627e-08, -1.88355609e-08, -7.80563837e-08,
       -2.02915118e-08, -8.32988367e-10, -6.10574243e-08,
       -5.75168583e-08, -3.97120528e-08, -8.26938609e-08],
      {ddof: 0},
      -5.274912978891667e-08,
      1.0424179395847646e-15,
    ],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const {mean, variance} = meanVariance(values[0], values[1],);
      const message = `mean and variance of ${
JSON.stringify({value: values[0]})
    }`;

      if(typeof values[2] !== 'undefined') {
        assertWithRelativeError(mean, values[2], epsilon, message);
        assertWithRelativeError(variance, values[3], epsilon, message);
      } else {
        assert.equal(mean, values[2], message);
      }
    });
  });

});

describe(`Check meanStandardDeviation`, () => {

  const testValues = [
    [
      [0.21303774,  0.89997134, -0.37517438,  0.81750941, -0.04164248,
       -0.74802398, -0.30554039,  0.88507207, -0.90798882, -0.31987083,
       -0.08444975,  0.57774603],
      {ddof: 1},
      0.05088716404492407,
      0.39445469563854624,
      0.6280562853892474,
    ],
    [
      [-2.02570449e-08, -9.71379288e-08, -5.07470563e-08,
       -5.37664590e-08, -4.34064805e-08,  8.70830886e-08,
       5.17209012e-08, -5.99759314e-10,  3.77759546e-08,
       -8.07596797e-08, -2.69648582e-08, -1.61997655e-08],
      {ddof: 0},
      -1.7771590655074106e-08,
      2.716995874812758e-15,
      5.212481054941838e-08,
    ],
    [
      [],
      {},
      undefined,
      undefined,
      undefined,
    ],
    [
      [2],
      {},
      2,
      0,
      0,
    ],
    [
      [-3, -3, -3, -3],
      {},
      -3,
      0,
      0,
    ],

  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      const {mean, variance, standardDeviation} = meanStandardDeviation(values[0], values[1]);
      const message = `mean, variance, and standard deviation of ${
JSON.stringify({value: values[0]})
    }`;

      if(typeof values[2] !== 'undefined') {
        assertWithRelativeError(mean, values[2], epsilon, message);
        assertWithRelativeError(variance, values[3], epsilon, message);
        assertWithRelativeError(standardDeviation, values[4], epsilon, message);
        assertWithRelativeError(Math.sqrt(variance), standardDeviation, epsilon, message);
      } else {
        assert.equal(mean, values[2], message);
      }
    });
  });

});


describe(`Check weightedMean`, () => {

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

