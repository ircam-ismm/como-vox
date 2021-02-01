export class Clipper {

  constructor({
    min = -Infinity,
    max = Infinity,
  } = {}) {
    this.min = min;
    this.max = max;
  }

  set(attributes) {
    Object.assign(this, attributes);
  }

  process(inputValue) {
    return Math.min(this.max,
                    Math.max(this.min,
                             inputValue) );
  }
}
export default Clipper;

