import {assert} from 'chai';

const e = {};

export function assertBeatEqual(beat, beatMin, beatMax, message) {
  assert.isAtLeast(beat, beatMin, `${message} min`);
  assert.isAtMost(beat, beatMax, `${message} max`);
}
Object.assign(e, {assertBeatEqual});

export default e;
