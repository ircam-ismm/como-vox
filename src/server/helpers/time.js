const e = {};

export let getTime;
if(typeof process !== 'undefined'
   && typeof process.hrtime === 'function') {
  // node version
  // avoid loss of precision due to single value
  const startTime = process.hrtime();
  getTime = () => {
    const hrtime = process.hrtime(startTime);
    return hrtime[0] + hrtime[1] * 1e-9;
  };
} else if(typeof self !== 'undefined'
          && typeof self.performance !== 'undefined'
          && typeof self.performance.now === 'function') {
  // modern browser
  const startTime = self.performance.now() * 1e-3;
  getTime = () => {
    return self.performance.now() * 1e-3 - startTime;
  };
} else {
  const startTime = Date.now() * 1e-3;
  getTime = () => {
    return Date.now() * 1e-3 - startTime;
  };
}
Object.assign(e, {getTime});

export default e;
