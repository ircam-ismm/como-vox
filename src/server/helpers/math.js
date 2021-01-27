const e = {};

// cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
export function modulo(value, modulus) {
  return ( ( (value) % modulus ) + modulus) % modulus;
}
Object.assign(e, {modulo});

export function median(values) {
  if(values.length === 0) {
    return undefined;
  }

  const valuesSorted = [...values].sort( (a, b) => a - b);

  let median;
  // odd
  if(valuesSorted.length % 2 === 1) {
    median = valuesSorted[(valuesSorted.length - 1) / 2];
  } else {
    median = 0.5 * (valuesSorted[valuesSorted.length / 2 - 1]
                    + valuesSorted[valuesSorted.length / 2]);
  }

  return median;
}
Object.assign(e, {median});

export function mean(values) {
  if(values.length === 0) {
    return undefined;
  }

  return values.reduce( (value, sum) => {
    return value + sum;
  }) / values.length;

}
Object.assign(e, {mean});


/**
 * Compute the weighted mean of an array of values, with an other array of
 * weights.
 *
 * @param {Array<Number>} values
 * @param {Array<Number>} weights
 * @param {Object} [options]
 * @param {Any} [options.defaultValue=0] any value, except undefined
 *
 * @returns weight mean or defaultValue if undefined (no values, no weights, or
 * sum of weights is zero)
 */
export function weightedMean(values, weights, {
  defaultValue = 0,
} = {}) {
  if(values.length === 0) {
    return defaultValue;
  }

  let valuesSum = 0;
  let weightsSum = 0;
  for(let i = 0; i < values.length && i < weights.length; ++i) {
    valuesSum += values[i] * weights[i];
    weightsSum += weights[i];
  }

  return (weightsSum !== 0
          ? valuesSum / weightsSum
          : defaultValue);

}
Object.assign(e, {weightedMean});

/**
 * Adjust a value to be as close as possible to a reference, by repetitively
 * adding or subtracting a range.
 *
 * @example
 * unwrap(value, 0, {range: 1}) // unroll normalised phase in [-0.5, 0.5]
 *
 * @example
 * unwrap(value, 0.5, {range: 1}) // unroll normalised phase in [0, 1]
 *
 * @example
 * unwrap(value, 12.3, {range: 1}) // unroll normalised phase in [11.8, 12.8]
 *
 * @param {Number} value to be unwrapped
 * @param {Number} reference to match
 * @param {Object} [options]
 * @param {Number} [options.range=1] any value, except undefined
 *
 * @returns weight mean or defaultValue if undefined (no values, no weights, or
 * sum of weights is zero)
 */
export function unwrap(value, reference, {
  range = 1,
} = {}) {
  let unwrapped = value;

  for(let low = value - range;
      Math.abs(low - reference) < Math.abs(unwrapped - reference);
      low -= range) {
    unwrapped = low;
  }

  for(let high = value + range;
      Math.abs(high - reference) < Math.abs(unwrapped - reference);
      high += range) {
    unwrapped = high;
  }

  return unwrapped;
}
Object.assign(e, {unwrap});


export default e;
