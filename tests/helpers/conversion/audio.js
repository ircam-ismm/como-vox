import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithRelativeError} from '../../shared/utils.js';

import {
  performanceToAudioContextTime,
} from '../../../src/server/helpers/conversion.js';

const epsilon = 1e-7;

describe(`Check performanceToAudioContextTime helper`, () => {

  const testValues = [
    [{audioContext: {getOutputTimestamp: () => {
      return {contextTime: 1, performanceTime: 2e3};
    }}},
     3e3,
     2,
    ],
    [{audioContext: {getOutputTimestamp: () => {
      return {contextTime: 5, performanceTime: 4e3};
    }}},
     3e3,
     4,
    ],
    // use performance.now when there is no time-stamp
    [{audioContext: {currentTime: 1} ,
      performance: {now: () => 2e3} },
     3e3,
     2,
    ],
  ];

  it(`should validate values`, () => {
    testValues.forEach( (values) => {
      global.window = {
        performance: values[0].performance,
      };

      const time = performanceToAudioContextTime(values[1], values[0]);
      assertWithRelativeError(time, values[2], epsilon, `time ${
JSON.stringify({...values[0], performance: values[1], audio: values[2]})
    }`);

    });

  });

});

