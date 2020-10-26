import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {add} from './babel_helper.js';
import getConfig from '../../src/server/utils/getConfig.js';

describe('Imports using ES6 syntax via Babel', () => {

  it('should accept a local function', () => {
    assert.equal(1+2, add(1, 2));
  });

  it('should import from src', () => {
    assert.doesNotThrow(() => {
      const {env, app} = getConfig('default');
    })
  });
});
