import {hertzToNormalised} from './conversion.js';

export class Hysteresis {
  constructor({
    sampleRate = 2, // in Hertz, or 2 for normalised frequency
    lowpassFrequencyUp = 0.5, // in Hertz if sampleRate is defined, or normalised
    lowpassFrequencyDown = 0.5, // in Hertz if sampleRate is defined, or normalised
  } = {}) {
    this.sampleRate = sampleRate,
    this.lowpassFrequencyUp = lowpassFrequencyUp;
    this.lowpassFrequencyDown = lowpassFrequencyDown;

    this.init();
  }

  set(attributes) {
    Object.assign(this, attributes);

    this.init();
  }

  init() {
    // one low-pass filter with two separate frequencies for going up or down

    let inputScale;
    let feedbackScale;

    inputScale = Math.max(0,
                          Math.min(1,
                                   hertzToNormalised(this.lowpassFrequencyUp, {
                                     sampleRate: this.sampleRate,
                                   }) ) );
    feedbackScale = 1 - inputScale;
    this.up = {
      inputScale,
      feedbackScale,
    };

    inputScale = Math.max(0,
                          Math.min(1,
                                   hertzToNormalised(this.lowpassFrequencyDown, {
                                     sampleRate: this.sampleRate,
                                   }) ) );
    feedbackScale = 1 - inputScale;
    this.down = {
      inputScale,
      feedbackScale,
    };
  }

  process(inputValue) {
    if(typeof this.outputValueLast === 'undefined') {
      this.outputValueLast = inputValue;
    }

    const direction = (inputValue > this.outputValueLast
                       ? 'up'
                       : 'down');

    const {inputScale, feedbackScale} = this[direction];
    // be sure to recompute feedback now with last output value
    // for smooth transition of frequency change
    const feedback = this.outputValueLast * feedbackScale;

    const outputValue = inputValue * inputScale + feedback;
    this.outputValueLast = outputValue;
    return outputValue;
  }

  reset() {
    this.outputValueLast = undefined;
  }
}
export default Hysteresis;

