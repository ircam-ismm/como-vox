import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {
  performanceToAudioContextTime,
} from '../../src/server/helpers/conversion.js';

describe(`Check performanceToAudioContextTime helper`, () => {

  const testValues = [
  ];

  testValues.forEach( (values) => {
    it(`should convert and back from ${values[0]} dB`, () => {
      assertWithRelativeError(values[0], epsilon,
                              amplitudeToDB(dBToAmplitude(values[0]) ),
                              `from ${values[0]} dB`);
    });

    it(`should convert and back from ${values[1]} linear`, () => {
      assertWithRelativeError(values[1], epsilon,
                              dBToAmplitude(amplitudeToDB(values[1]) ),
                              `from ${values[1]} amplitude`);
    });

    it(`should conform from ${values[0]} dB`, () => {
      assertWithRelativeError(values[1], epsilon, dBToAmplitude(values[0]),
                              `from ${values[0]} dB`);
    });

    it(`should conform from ${values[1]} linear`, () => {
      assertWithRelativeError(values[0], epsilon, amplitudeToDB(values[1]),
                              `from ${values[1]} amplitude`);
    });


  });

});

