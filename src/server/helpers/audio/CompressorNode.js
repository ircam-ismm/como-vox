import {dBToAmplitude} from '../conversion.js'

export class CompressorNode {
  constructor({
    audioContext,
    attack = 10e-3, // seconds, quick
    release = 250e-3, // seconds, slow
    threshold = -3, // dB
    ratio = 20, // ratio, hard limiter
    knee = 3, // dB
    preGain = 0, // dB
    postGain = -1, // dB, little headroom
  } = {}) {
    this.audioContext = audioContext;
    this.attack = attack;
    this.release = release;
    this.threshold = threshold;
    this.ratio = ratio;
    this.knee = knee;
    this.preGain = preGain;
    this.postGain = postGain;

    this.preGainNode = this.audioContext.createGain();
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.postGainNode = this.audioContext.createGain();

    this.preGainNode.connect(this.compressorNode);
    this.compressorNode.connect(this.postGainNode);

    // aliases for connection
    this.inputNode = this.preGainNode;
    this.outputNode = this.postGainNode;

    this.init();
  }

  init() {
    const preGain = dBToAmplitude(this.preGain);
    this.preGainNode.gain.value = preGain;
    this.preGainNode.gain.setValueAtTime(preGain, this.audioContext.currentTime);

    this.compressorNode.attack.value = this.attack;
    this.compressorNode.release.value = this.release;

    // WebAudio compressor node adds knee to threshold (sic)
    // https://webaudio.github.io/web-audio-api/#DynamicsCompressorOptions-processing
    this.compressorNode.threshold.value = this.threshold - 0.5 * this.knee;
    this.compressorNode.ratio.value = this.ratio;
    this.compressorNode.knee.value = this.knee;

    const postGain = dBToAmplitude(this.postGain);
    this.postGainNode.gain.value = postGain;
    this.postGainNode.gain.setValueAtTime(postGain, this.audioContext.currentTime);
  }

  set(parameters) {
      for(const p of Object.keys(parameters) ) {
        if(this.hasOwnProperty(p) ) {
          this[p] = parameters[p];
        }
      }

    this.init();
  }

  getReduction() {
    const reduction = (typeof this.compressorNode.reduction.value !== 'undefined'
                       ? this.compressorNode.reduction.value
                       : this.compressorNode.reduction);

    return reduction;
  }

  free() {
    try {
      this.preGainNode.disconnect();
      this.compressorNode.disconnect();
      this.postGainNode.disconnect();
    } catch (error) {
      // ignore already disconnected nodes
    }

    this.preGainNode = null;
    this.compressorNode = null;
    this.postGainNode = null;

    this.inputNode = null;
    this.outputNode = null;
  }
}
export default CompressorNode;
