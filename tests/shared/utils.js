import {assert} from 'chai';

const e = {};

export function assertWithin(value, valueMin, valueMax, message) {
  assert.isAtLeast(value, valueMin, `${message} min`);
  assert.isAtMost(value, valueMax, `${message} max`);
}
Object.assign(e, {assertWithin});

export default e;
