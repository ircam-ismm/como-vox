const e = {};

export class MasterTrack {
  constructor({ppqn = 96,
               timeSignature = [4, 4],
               tempo = 120} = {}) {
    this.events = [];
    this.ppqn = ppqn;
    this.timeSignature = timeSignature;
    this.tempo = tempo;
  }

}
Object.assign(e, {MasterTrack});

export default e;
