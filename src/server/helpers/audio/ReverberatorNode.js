import './monkeyPatch.js'; // OfflineAudioContext

import {
  dBToAmplitude,
  dBToPower,
} from '../conversion.js'

export class ReverberatorNode {
  constructor({
    audioContext,
    OfflineAudioContext = window.OfflineAudioContext, // Class
    sampleRate = audioContext.sampleRate,
    channelCount = audioContext.destination.channelCount,
    attackTime = 50e-3, // in seconds
    decayThreshold = -60, // in dB
    decayTime = 2, // in seconds, RT60 if decayThreshold is -60
    lowpassFrequencyStart = 15000, // Hertz
    lowpassFrequencyEnd = 1000, // Hertz
    preGain = 0, // dB
    wetGain = -6, // dB,
    dryGain, // dB, leave undefined for automatic balance with wetGain
    postGain = 0, // dB
  } = {}) {
    this.audioContext = audioContext;
    this.OfflineAudioContext = OfflineAudioContext;
    this.sampleRate = sampleRate;
    this.channelCount = channelCount;

    this.attackTime = attackTime;
    this.decayThreshold = decayThreshold;
    this.decayTime = decayTime;
    this.lowpassFrequencyStart = lowpassFrequencyStart;
    this.lowpassFrequencyEnd = lowpassFrequencyEnd;

    this.preGain = preGain;
    this.wetGain = wetGain;
    this.dryGain = dryGain;
    this.postGain = postGain;


    this.preGainNode = this.audioContext.createGain()
    this.wetGainNode = this.audioContext.createGain();
    this.dryGainNode = this.audioContext.createGain();
    this.convolverNode = this.audioContext.createConvolver();
    this.postGainNode = this.audioContext.createGain();

    this.preGainNode.connect(this.wetGainNode);
    this.preGainNode.connect(this.dryGainNode);

    this.wetGainNode.connect(this.convolverNode);
    this.convolverNode.connect(this.postGainNode);
    this.dryGainNode.connect(this.postGainNode);

    // aliases for connection
    this.inputNode = this.preGainNode;
    this.outputNode = this.postGainNode;

    this.audioContext = audioContext;
    this.init();
  }

  async init() {
    const preGain = dBToAmplitude(this.preGain);
    this.preGainNode.gain.value = preGain;
    this.preGainNode.gain.setValueAtTime(preGain, this.audioContext.currentTime);

    const wetGain = dBToAmplitude(this.wetGain);
    this.wetGainNode.gain.value = wetGain;
    this.wetGainNode.gain.setValueAtTime(wetGain, this.audioContext.currentTime);


    const dryGain = (typeof this.dryGain !== 'undefined'
                     ? dBToAmplitude(this.dryGain)
                     : 1 - wetGain * wetGain); // constant power
    this.dryGainNode.gain.value = dryGain;
    this.dryGainNode.gain.setValueAtTime(dryGain, this.audioContext.currentTime);

    const postGain = dBToAmplitude(this.postGain);
    this.postGainNode.gain.value = postGain;
    this.postGainNode.gain.setValueAtTime(postGain, this.audioContext.currentTime);

    try {
      this.convolverNode.buffer = await this._generateConvolverBuffer();
    } catch(error) {
      throw new Error('ReverberatorNode: Error while generating convolver buffer'
                      + error.message);
    }
  }

  set(parameters) {
      for(const p of Object.keys(parameters) ) {
        if(this.hasOwnProperty(p) ) {
          this[p] = parameters[p];
        }
      }

    this.init();
  }

  free() {
    try {
      this.preGainNode.disconnect();
      this.wetGainNode.disconnect();
      this.dryGainNode.disconnect();
      this.postGainNode.disconnect();
    } catch (error) {
      // ignore already disconnected nodes
    }

    this.preGainNode = null;
    this.wetGainNode = null;
    this.dryGainNode = null;
    this.convolverNode = null;
    this.postGainNode = null;

    this.inputNode = null;
    this.outputNode = null;
  }

  async _generateConvolverBuffer() {
    const promise = new Promise(async (resolve, reject) => {
      const attackSampleCount = Math.round(this.attackTime * this.sampleRate);
      const decaySampleCount = Math.round(this.decayTime * this.sampleRate);
      const sampleCount = attackSampleCount + decaySampleCount;
      const decayBase = Math.pow(dBToPower(this.decayThreshold),
                                 1 / (sampleCount - 1));

      const context = new this.OfflineAudioContext(this.channelCount,
                                                   sampleCount,
                                                   this.sampleRate);

      if(!context) {
        reject(new Error('ReverberatorNode: error creating offline context', context) );
      }

      const convolverBuffer = context.createBuffer(this.channelCount,
                                                   sampleCount,
                                                   this.sampleRate);

      const attackFactor = 1 / (attackSampleCount - 1);
      for(let c = 0; c < this.channelCount; ++c) {
        var samples = convolverBuffer.getChannelData(c);
        for(let s = 0; s < sampleCount; ++s) {
          samples[s] = (Math.random() * 2 - 1) * Math.pow(decayBase, s);
        }
        for(let s = 0; s < attackSampleCount; ++s) {
          samples[s] *= s * attackFactor;
        }
      }

      try {
        await this._applyLowpass(convolverBuffer).then( (filteredBuffer) => {
          resolve(filteredBuffer);
        });
      } catch(error) {
        throw new Error('ReverberatorNode: Error while filtering convolver buffer:' + error);
      }
    });

    return promise;
  }

  async _applyLowpass(buffer) {
    const promise = new Promise( (resolve, reject) => {

      const context = new this.OfflineAudioContext(buffer.numberOfChannels,
                                                   buffer.length,
                                                   buffer.sampleRate);

      const source = context.createBufferSource();
      source.buffer = buffer;
      const filter = context.createBiquadFilter();

      const filterFrequencyStart = Math.min(this.lowpassFrequencyStart, buffer.sampleRate / 2);
      const filterFrequencyEnd = Math.min(this.lowpassFrequencyEnd, buffer.sampleRate / 2);
      const filterTimeEnd = (buffer.length - 1) * buffer.sampleRate;

      filter.type = 'lowpass';
      filter.Q.value = 0.0001; // almost zero, no resonance
      filter.frequency.setValueAtTime(filterFrequencyStart, 0);
      filter.frequency.exponentialRampToValueAtTime(filterFrequencyEnd, filterTimeEnd);

      source.connect(filter);
      filter.connect(context.destination);
      source.start();
      context.oncomplete = (event) => {
        resolve(event.renderedBuffer);
      };
      context.startRendering();
    });
    return promise;
  }

}
export default ReverberatorNode;
