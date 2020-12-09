const e = {};

const c20OverLn10 = 20 / Math.log(10);

export function amplitudeToDB (amplitude) {
  return c20OverLn10 * Math.log(Math.max(Number.EPSILON, amplitude) );
}
Object.assign(e, {amplitudeToDB});

const ln10Over20 = Math.log(10) / 20;

export function dBToAmplitude (dB) {
  const result = Math.exp(ln10Over20 * dB);
  return (result > Number.EPSILON
          ? result
          : 0);
}
Object.assign(e, {dBToAmplitude});

const c12OverLn2 = 12 / Math.log(2);

export function hertzToMidiPitch(
  hertz,
  {midiReference = 69, hertzReference = 440} = {}) {
  return midiReference
    + c12OverLn2 * Math.log(Math.max(Number.EPSILON, hertz) / hertzReference);
}
Object.assign(e, {hertzToMidiPitch});

const ln2Over12 = Math.log(2) / 12;

export function midiPitchToHertz(
  pitch,
  {pitchReference = 69, hertzReference = 440} = {}) {
  return hertzReference * Math.exp((pitch - pitchReference) * ln2Over12);
}
Object.assign(e, {midiPitchToHertz});

const c1Over127 = 1 / 127;

const midiDBRangeDefault = 60;

export function midiIntensityToDB(
  intensity,
  {range = midiDBRangeDefault} = {} ) {
  return intensity * c1Over127 * range - range;
}
Object.assign(e, {midiIntensityToDB});

export function midiIntensityToAmplitude(
  intensity,
  {range = midiDBRangeDefault} = {} ) {
  return dBToAmplitude(midiIntensityToDB(intensity, {range}) );
}
Object.assign(e, {midiIntensityToAmplitude});

export function intensityToDB(
  intensity,
  {range = midiDBRangeDefault} = {} ) {
  return intensity * range - range;
}
Object.assign(e, {intensityToDB});

export function intensityToAmplitude(
  intensity,
  {range = midiDBRangeDefault} = {} ) {
  return dBToAmplitude(intensityToDB(intensity, {range}) );
}
Object.assign(e, {intensityToAmplitude});

const tempoDefault = 120;
const positionDefault = {bar: 1, beat: 1};
const timeSignatureDefault = {count: 4, division: 4};

export function beatsToSeconds(beats = 1, {
  tempo = tempoDefault,
  timeSignature = timeSignatureDefault,
} = {}) {
  return (60 / tempo) * beats * (4 / timeSignature.division);
}
Object.assign(e, {beatsToSeconds});

export function secondsToBeats(seconds = 1, {
  tempo = tempoDefault,
  timeSignature = timeSignatureDefault,
} = {}) {
  return seconds / (60 / tempo) * (timeSignature.division / 4);
}
Object.assign(e, {secondsToBeats});

export function positionsToBeatDelta(position, reference = positionDefault, {
  timeSignature = timeSignatureDefault,
} = {}) {
  const barDelta = position.bar - reference.bar;
  const beatDelta = barDelta * timeSignature.count
        + position.beat - reference.beat;
  return beatDelta;
}
Object.assign(e, {positionsToBeatDelta});

export function positionsToSecondsDelta(position, reference = positionDefault, {
  timeSignature = timeSignatureDefault,
  tempo = tempoDefault,
} = {}) {
  const beats = positionsToBeatDelta(position, reference, {timeSignature});
  const seconds = beatsToSeconds(beats, {tempo, timeSignature});
  return seconds;
}
Object.assign(e, {positionsToSecondsDelta});

export function performanceToAudioContextTime(performanceTime, {audioContext}) {
  let performanceTimeDelta;
  let contextTimeReference;
  if(typeof audioContext.getOutputTimestamp !== 'function') {
    performanceTimeDelta = performanceTime - performance.now();
    contextTimeReference = audioContext.currentTime;
  } else {
    const stamp = audioContext.getOutputTimestamp();
    performanceTimeDelta = performanceTime - stamp.performanceTime;
    contextTimeReference = stamp.contextTime;
  }
  return contextTimeReference + 1e-3 * performanceTimeDelta;
}
Object.assign(e, {performanceToAudioContextTime});


export default e;
