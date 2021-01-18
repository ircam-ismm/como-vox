export class Scaler {

  constructor({
    inputStart = 0,
    inputEnd = 0,
    outputStart = 0,
    outputEnd = 1,
    clip = false,
    type = 'linear',
    base = 1,
  } = {}) {
    this.inputStart = inputStart;
    this.inputEnd = inputEnd;
    this.outputStart = outputStart;
    this.outputEnd = outputEnd;
    this.clip = clip;
    this.type = type;
    this.base = base;

    this.init();
  }

  set(attributes) {
    Object.assign(this, attributes);
    this.init();
  }

  init() {
    if(this.type === 'lin') {
      this.type = 'linear';
    } else if(this.type === 'log') {
      this.type = 'logarithmic';
    } else if (this.type === 'exp') {
      this.type = 'exponential';
    }

    this.base = Math.max(0, this.base);

    this.inputRange = this.inputEnd - this.inputStart;
    this.outputRange = this.outputEnd - this.outputStart;

    this.inputMin = Math.min(this.inputStart, this.inputEnd);
    this.inputMax = Math.max(this.inputStart, this.inputEnd);

    this.logBase = Math.log(this.base);
  }

  process(inputValue) {
    if(this.inputRange === 0 || this.outputRange === 0) {
      return this.outputStart;
    }

    const input = (this.clip
                   ? Math.max(this.inputMin,
                              Math.min(this.inputMax,
                                       inputValue) )
                   : inputValue);

    if(this.base === 1 || this.type === 'linear') {
      return this.outputStart + this.outputRange
        * (input - this.inputStart) / this.inputRange;
    }
    else if(this.type === 'logarithmic') {
      return this.outputStart + this.outputRange
        * Math.log((this.base - 1) * (input - this.inputStart) / this.inputRange + 1)
        / this.logBase;
    } else {
      return this.outputStart + this.outputRange
        * (Math.exp(this.logBase * (input - this.inputStart) / this.inputRange) - 1)
        / (this.base - 1);
    }

  }


}
export default Scaler;

