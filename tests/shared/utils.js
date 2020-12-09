import {assert} from 'chai';

const e = {};

export function assertWithin(value, valueMin, valueMax, message) {
  assert.isAtLeast(value, valueMin, `${message} min`);
  assert.isAtMost(value, valueMax, `${message} max`);
}
Object.assign(e, {assertWithin});

export function assertWithRelativeError(value, valueExpected, relativeError,
                                        message) {
  assert.isAtLeast(value, valueExpected - Math.abs(value) * relativeError,
                   `${message} min`);
  assert.isAtMost(value, valueExpected + Math.abs(value) * relativeError,
                  `${message} max`);
}
Object.assign(e, {assertWithRelativeError});


export default e;
