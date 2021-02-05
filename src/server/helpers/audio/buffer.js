import {dBToAmplitude} from '../conversion.js';

const e = {};

export function cloneBuffer (original, {audioContext}) {
  const copy = audioContext.createBuffer(
    original.numberOfChannels,
    Math.round(original.duration * original.sampleRate),
    original.sampleRate);

  for(let c = 0; c < original.numberOfChannels; ++c) {
    const copyData = copy.getChannelData(c);
    copyData.set(original.getChannelData(c) );
  }
  return copy;
};
Object.assign(e, {cloneBuffer});

export function playBuffer (buffer, {
  audioContext,
  destination = audioContext.destination,
  duration,
} = {}) {
  const now = audioContext.currentTime;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(destination);
  source.start(now);
  if(duration) {
    source.stop(now + duration);
  }
};
Object.assign(e, {playBuffer});

export function generateDiracBuffer ({
  audioContext,
  gain = -10, // dB
} = {}) {
  const length = 2; // at least 2 samples for Safari
  const channels = 1;

  let buffer = audioContext.createBuffer(channels, length,
                                         audioContext.sampleRate);
  let data = buffer.getChannelData(0);

  const amplitude = dBToAmplitude(gain);
  data[0] = amplitude;

  return buffer;
};
Object.assign(e, {generateDiracBuffer});

export function generateClickBuffer ({
  audioContext,
  gain = -10, // dB
} = {}) {
  const length = 2;
  const channels = 1;

  let buffer = audioContext.createBuffer(channels, length,
                                         audioContext.sampleRate);
  let data = buffer.getChannelData(0);

  const amplitude = dBToAmplitude(gain);
  data[0] = amplitude;
  data[1] = -amplitude;

  return buffer;
};
Object.assign(e, {generateClickBuffer});

export function generateClackBuffer ({
  audioContext,
  length = 5, // in samples
  gain = -10, // dB
} = {}) {
  const channels = 1;

  let buffer = audioContext.createBuffer(channels, length,
                                          audioContext.sampleRate);
  const amplitude = dBToAmplitude(gain);
  let data = buffer.getChannelData(0);

  for(let i = 0; i < length; ++i) {
    data[i] = amplitude; // sic
  }

  return buffer;
};
Object.assign(e, {generateClackBuffer});

export function generateNoiseBuffer ({
  audioContext,
  duration = 0.5, // seconds
  gain = -30, // dB
} = {}) {
  const length = duration * audioContext.sampleRate;
  const amplitude = dBToAmplitude(gain);
  const channelCount = audioContext.destination.channelCount;
  let buffer = audioContext.createBuffer(channelCount, length,
                                          audioContext.sampleRate);
  for(let c = 0; c < channelCount; ++c) {
    let data = buffer.getChannelData(c);
    for(let i = 0; i < length; ++i) {
      data[i] = amplitude * (Math.random() * 2 - 1);
    }
  }
  return buffer;
};
Object.assign(e, {generateNoiseBuffer});

export default e;

