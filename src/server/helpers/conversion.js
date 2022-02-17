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

const c10OverLn10 = 10 / Math.log(10);

export function powerToDB (power) {
  return c10OverLn10 * Math.log(Math.max(Number.EPSILON, power) );
}
Object.assign(e, {powerToDB});

const ln10Over10 = Math.log(10) / 10;

export function dBToPower (dB) {
  const result = Math.exp(ln10Over10 * dB);
  return (result > Number.EPSILON
          ? result
          : 0);
}
Object.assign(e, {dBToPower});

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

const intensityDBRangeDefault = 60;

export function midiIntensityToDB(
  intensity,
  {range = intensityDBRangeDefault} = {} ) {
  return intensity * c1Over127 * range - range;
}
Object.assign(e, {midiIntensityToDB});

export function midiIntensityToAmplitude(
  intensity,
  {range = intensityDBRangeDefault} = {} ) {
  return dBToAmplitude(midiIntensityToDB(intensity, {range}) );
}
Object.assign(e, {midiIntensityToAmplitude});

export function intensityToDB(
  intensity,
  {range = intensityDBRangeDefault} = {} ) {
  return intensity * range - range;
}
Object.assign(e, {intensityToDB});

export function intensityToAmplitude(
  intensity,
  {range = intensityDBRangeDefault} = {} ) {
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

export function notesToSeconds(notes = 1, {
  tempo = tempoDefault,
} = {}) {
  return (60 / tempo) * notes * 4;
}
Object.assign(e, {notesToSeconds});

export function secondsToNotes(seconds = 1, {
  tempo = tempoDefault,
} = {}) {
  return seconds / (4 * 60 / tempo);
}
Object.assign(e, {secondsToNotes});

export function notesToBeats(notes = 1, {
  timeSignature = timeSignatureDefault,
} = {}) {
  return notes * timeSignature.division;
}
Object.assign(e, {notesToBeats});

export function beatsToNotes(beats = 1, {
  timeSignature = timeSignatureDefault,
} = {}) {
  return beats / timeSignature.division;
}
Object.assign(e, {beatsToNotes});

export function positionDeltaToSeconds(position, {
  timeSignature = timeSignatureDefault,
  tempo = tempoDefault,
} = {}) {
  return positionsToSecondsDelta(position, {bar: 0, beat: 0}, {
    timeSignature,
    tempo,
  });
}
Object.assign(e, {positionDeltaToSeconds});

export function positionsToBeatsDelta(position, reference = positionDefault, {
  timeSignature = timeSignatureDefault,
} = {}) {
  const barDelta = position.bar - reference.bar;
  const beatDelta = barDelta * timeSignature.count
        + position.beat - reference.beat;
  return beatDelta;
}
Object.assign(e, {positionsToBeatsDelta});

export function positionsToSecondsDelta(position, reference = positionDefault, {
  timeSignature = timeSignatureDefault,
  tempo = tempoDefault,
} = {}) {
  const beats = positionsToBeatsDelta(position, reference, {timeSignature});
  const seconds = beatsToSeconds(beats, {tempo, timeSignature});
  return seconds;
}
Object.assign(e, {positionsToSecondsDelta});

export function positionAddBeats(position, beats, {
  timeSignature = timeSignatureDefault,
} = {}) {
  let beatRaw = position.beat + beats;

  // modulo of beat that starts at 1
  // cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
  const count = timeSignature.count;
  const beat = ( ( ( (beatRaw - 1) % count ) + count) % count) + 1;
  const bar = position.bar + Math.floor((beatRaw - 1)/ timeSignature.count);
  return {bar, beat};
}
Object.assign(e, {positionAddBeats});

export function positionAddSeconds(position, seconds, {
  timeSignature = timeSignatureDefault,
  tempo = tempoDefault,
} = {}) {
  const beats = secondsToBeats(seconds, {timeSignature, tempo});

  return  positionAddBeats(position, beats, {timeSignature});
}
Object.assign(e, {positionAddSeconds});

/**
 * Convert a position to a new time-signature.
 *
 * @param position to convert to new time-signature
 * @param reference is position of the last time-signature change
 * @param timeSignature is original time-signature until position
 * @param timeSignatureNew is the new time-signature at position
 *
 * @return
 */
export function positionChangeTimeSignature(position, {
  reference = positionDefault,
  timeSignature = timeSignatureDefault,
  timeSignatureNew = timeSignatureDefault,
} = {}) {
  const beatsFromReferenceOriginal = positionsToBeatsDelta(position,
                                                           reference,
                                                           {timeSignature});
  const beatsRatio = timeSignatureNew.division / timeSignature.division;
  const beatsFromReferenceNew = beatsFromReferenceOriginal * beatsRatio;
  return positionAddBeats(reference,
                          beatsFromReferenceNew,
                          {timeSignature: timeSignatureNew});
}
Object.assign(e, {positionChangeTimeSignature});

export function positionRoundBeats(position, {timeSignature = timeSignatureDefault}) {
  return positionAddBeats(
    {
      bar: position.bar,
      beat: Math.round(position.beat),
    },
    0, // conform beat to [1, timeSignature.count]
    {timeSignature});
}
Object.assign(e, {positionRoundBeats});

export function barBeatToPosition(event) {
  const position = {
    bar: event.bar,
    beat: event.beat,
  };
  return { ...{position}, ...event};
};
Object.assign(e, {barBeatToPosition});

export function tempoChangeTimeSignature(tempo, {
  timeSignature = timeSignatureDefault,
  timeSignatureNew = timeSignatureDefault,
} = {}) {
  const beatsRatio = timeSignatureNew.division / timeSignature.division;
  return tempo * beatsRatio;
}
Object.assign(e, {tempoChangeTimeSignature});

export function timeDeltaToTempo(timeDelta, beatDelta = 1, {
  timeSignature = timeSignatureDefault,
} = {}) {
  return (timeDelta !== 0 && beatDelta !== 0
          ? 4 / timeSignature.division * 60 * beatDelta / timeDelta
          : undefined);
};
Object.assign(e, {timeDeltaToTempo});

// Nyquist normalised frequency is 1
export function hertzToNormalised(frequencyHertz, {
  sampleRate = 2,
} = {}) {
  return frequencyHertz * 2 / sampleRate;
}
Object.assign(e, {hertzToNormalised});

export function normalisedToHertz(frequencyNormalised, {
  sampleRate = 2,
} = {}) {
  return frequencyNormalised * sampleRate * 0.5;
}
Object.assign(e, {normalisedToHertz});

export default e;
