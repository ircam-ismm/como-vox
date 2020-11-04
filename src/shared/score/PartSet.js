import {Part} from './Part.js';

const e = {};

export class PartSet {
  constructor() {
    this.parts = [];
  }

  create({
    track,
    channel,
    instrument} = {}) {
    this.parts.push(new Part({track, channel, instrument}) );
    return this.parts[this.parts.length - 1];
  }

  select(testFunction) {
    return this.parts.filter(testFunction);
  }

  selectOrCreate({
    track,
    channel,
    instrument} = {}) {

    const trackRequest = track;
    const channelRequest = channel;
    const instrumentRequest = instrument;
    const selection = this.select( ({
      track,
      channel,
      instrument}) => {
        return (typeof track === 'undefined'
                || typeof trackRequest === 'undefined'
                || track === trackRequest)
          && (typeof channel === 'undefined'
              || typeof channelRequest === 'undefined'
              || channel === channelRequest)
          && (typeof instrument === 'undefined'
              || typeof instrumentRequest === 'undefined'
              || instrument === instrumentRequest);
      });

    let part;
    if(selection.length === 0) {
      part = this.create({track, channel, instrument});
    } else {
      part = selection[0];
      if(typeof part.track === 'undefined') {
        part.track = track;
      }
      if(typeof part.channel === 'undefined') {
        part.channel = channel;
      }
      if(typeof part.instrument === 'undefined') {
        part.instrument = instrument;
      }

    }

    return part;
  }

  removeEmpty() {
    this.parts = this.parts.filter( (part) => {
      return part.events.length > 0;
    });
  }

  selectPiano() {
    return this.select( ({instrument}) => {
      return typeof instrument === 'undefined'
        || (instrument <= 5);
    });
  }

  selectNonPiano() {
    return this.select( ({instrument}) => {
      return instrument > 5;
    });
  }

  selectVoice() {
    return this.select( ({instrument}) => {
      return instrument >= 52 && instrument <= 54;
    });
  }

  selectNonVoice() {
    return this.select( ({instrument}) => {
      return instrument < 52 && instrument > 54;
    });
  }

  forEach(callback) {
    this.parts.forEach(callback);
  }

  length() {
    return this.parts.length;
  }

}
Object.assign(e, {PartSet});

export default e;
