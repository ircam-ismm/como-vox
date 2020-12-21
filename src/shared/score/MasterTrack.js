const e = {};

export class MasterTrack {
  constructor({
    ppqn = 96,
    timeSignature = {count: 4, division: 4},
    tempo = 120,
    events = [],
  } = {}) {
    this.ppqn = ppqn;
    this.timeSignature = timeSignature;
    this.tempo = tempo;
    this.events = events;
  }

}
Object.assign(e, {MasterTrack});

export default e;
