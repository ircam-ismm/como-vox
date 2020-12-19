export class Part {
  constructor({
    track,
    channel,
    instrument,
    name,
    events = [],
  } = {}) {
    this.track = track;
    this.channel = channel;
    this.instrument = instrument;
    this.name = name;
    this.events = events;
  }
}

export default Part;
