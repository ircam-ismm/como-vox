const e = {};

export class Event {
  constructor({
    channel = 'master',
    type,
    tick,
    bar,
    beat,
    data,
  } = {}) {
    this.channel = channel;
    this.type = type;
    this.tick = tick;
    this.bar = bar;
    this.beat = beat;
    this.data = data;
  }
}
Object.assign(e, {Event});

export class Note extends Event {
  constructor({
    channel = 0,
    tick,
    bar,
    beat,
    type = 'noteOn',
    pitch,
    intensity = 127,
  } = {}) {
    super({
      channel,
      type,
      tick,
      bar,
      beat,
      data: {
        pitch,
        intensity,
      },
    });
  }
}
Object.assign(e, {Note});
export class Tempo extends Event {
  constructor({
    channel,
    tick,
    bar,
    beat,
    tempo,
  } = {}) {
    super({
      channel,
      type: 'tempo',
      tick,
      bar,
      beat,
      data: tempo,
    });
  }
}
Object.assign(e, {Tempo});

export class TimeSignature extends Event {
  constructor({
    channel,
    tick,
    bar,
    beat,
    timeSignature,
  } = {}) {
    super({
      channel,
      type: 'timeSignature',
      tick,
      bar,
      beat,
      data: timeSignature,
    });
  }
}
Object.assign(e, {TimeSignature});

export default e;

