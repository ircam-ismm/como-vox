export class Part {
  constructor({
    track,
    channel,
    instrument,
    name,
  } = {}) {
    this.track = track;
    this.channel = channel;
    this.instrument = instrument;
    this.name = name;
    this.events = [];
  }
}

export default Part;
