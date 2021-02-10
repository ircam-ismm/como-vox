import './audio/monkeyPatch.js' // AudioContext

const e = {};

export let getLocalTime;
if(typeof process !== 'undefined'
   && typeof process.hrtime === 'function') {
  // node version
  // avoid loss of precision due to single value
  const startTime = process.hrtime();
  getLocalTime = () => {
    const hrtime = process.hrtime(startTime);
    return hrtime[0] + hrtime[1] * 1e-9;
  };
} else if(typeof self !== 'undefined'
          && typeof self.performance !== 'undefined'
          && typeof self.performance.now === 'function') {
  // modern browser
  const startTime = self.performance.now() * 1e-3;
  getLocalTime = () => {
    return self.performance.now() * 1e-3 - startTime;
  };
} else {
  const startTime = Date.now() * 1e-3;
  getLocalTime = () => {
    return Date.now() * 1e-3 - startTime;
  };
}
Object.assign(e, {getLocalTime});

export let performanceToAudioContextTime;
if(typeof AudioContext === 'undefined' || self === 'undefined'
   || typeof self.performance === 'undefined'
   || typeof self.performance.now !== 'function') {
  performanceToAudioContextTime = undefined;
} else {
  const tmpContext = new AudioContext();
  if(typeof tmpContext.getOutputTimestamp !== 'function') {
    performanceToAudioContextTime = (performanceTime, {audioContext}) => {
      const performanceTimeDelta = performanceTime - window.performance.now();
      const contextTimeReference = audioContext.currentTime;
      return contextTimeReference + 1e-3 * performanceTimeDelta;
    };
  } else {
    performanceToAudioContextTime = (performanceTime, {audioContext}) => {
      const stamp = audioContext.getOutputTimestamp();
      const performanceTimeDelta = performanceTime - stamp.performanceTime;
      const contextTimeReference = stamp.contextTime;
      return contextTimeReference + 1e-3 * performanceTimeDelta;
    };
  }
}
Object.assign(e, {performanceToAudioContextTime});

export let localToAudioContextTime;
if(typeof self !== 'undefined'
          && typeof self.performance !== 'undefined'
          && typeof self.performance.now === 'function') {
  localToAudioContextTime = (localTime, {audioContext}) => {
    const timeDelta = localTime - getLocalTime();
    return performanceToAudioContextTime(self.performance.now()
                                         + 1e3 * timeDelta,
                                         {audioContext});
  };

} else {
  localToAudioContextTime = (localTime, {audioContext}) => {
    const timeDelta = localTime - getLocalTime();
    return audioContext.currentTime + timeDelta;
  };
}
Object.assign(e, {localToAudioContextTime});

export default e;
