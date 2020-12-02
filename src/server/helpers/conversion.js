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

export function midiIntensityToDB(
  intensity,
  {range = 60} = {} ) {
  return intensity * c1Over127 * range - range;
}
Object.assign(e, {midiIntensityToDB});

export function midiIntensityToAmplitude(
  intensity,
  {range = 60} = {} ) {
  return dBToAmplitude(midiIntensityToDB(intensity, {range}) );
}
Object.assign(e, {midiIntensityToAmplitude});

export function intensityToDB(
  intensity,
  {range = 60} = {} ) {
  return intensity * range - range;
}
Object.assign(e, {intensityToDB});

export function intensityToAmplitude(
  intensity,
  {range = 60} = {} ) {
  return dBToAmplitude(intensityToDB(intensity, {range}) );
}
Object.assign(e, {intensityToAmplitude});

export default e;
