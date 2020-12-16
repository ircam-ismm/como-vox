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

export default e;
