const e = {};

export class Scaler {

  constructor({
    inputMin = 0,
    inputMax = 0,
    outputMin = 0,
    outputMax = 1,
    clip = false,
    type = 'linear',
    base = 1,
  } = {}) {
    this.inputMin = inputMin;
    this.inputMax = inputMax;
    this.outputMin = outputMin;
    this.outputMax = outputMax;
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

    this.inputRange = this.inputMax - this.inputMin;
    this.outputRange = this.outputMax - this.outputMin;

    this.logBase = Math.log(this.base);
  }

  process(inputValue) {
    if(this.inputRange === 0 || this.outputRange === 0) {
      return this.outputMin;
    }

    const input = (this.clip
                   ? Math.max(this.inputMin,
                              Math.min(this.inputMax,
                                       inputValue) )
                   : inputValue);

    if(this.base === 1 || this.type === 'linear') {
      return this.outputMin + this.outputRange
        * (input - this.inputMin) / this.inputRange;
    }
    else if(this.type === 'logarithmic') {
      return this.outputMin + this.outputRange
        * Math.log((this.base - 1) * (input - this.inputMin) / this.inputRange + 1)
        / this.logBase;
    } else {
      return this.outputMin + this.outputRange
        * (Math.exp(this.logBase * (input - this.inputMin) / this.inputRange) - 1)
        / (this.base - 1);
    }

  }


}
Object.assign(e, {Scaler});

export default e;

