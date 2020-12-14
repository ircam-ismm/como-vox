function beatTriggerFromGesture(graph, helpers, outputFrame) {
  const app = (typeof process !== 'undefined' ? process.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;

  const medianOrder = 5; //5
  const medianThreshold =  0.003; //0.003
  const timeIntervalThreshold = 0.1; //  0.2 in seconds
  const movingMedian = new helpers.algo.MovingMedian(medianOrder);

  let lastBeatTime = null;
  let lastMedian = +Infinity; // prevent kick on first frame
  let maxIntensity = 0; // max value after detection
  let previousIntensity = 0; //intensity at previous frame 
  let overMedian = 0; // 1 if intensity > delta


  const parameters = {
    sensorsLatency: 1 / 60, // 60 Hz?
  };

  return {
    updateParams(updates) {
      Object.assign(parameters, updates);
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const now = performance.now() * 1e-3;

      let position = inputData['position'];
      const timeSignature = inputData['timeSignature'];

      const intensity = inputData['intensity'].linear;
      //const intensity = inputData['accelerationIncludingGravity'].x ** 2 +  inputData['accelerationIncludingGravity'].y ** 2 +  inputData['accelerationIncludingGravity'].z ** 2;
      //const intensity = inputData['rotationRate'].alpha ** 2 +  inputData['rotationRate'].beta ** 2 +  inputData['rotationRate'].gamma ** 2;
      const delta = intensity - lastMedian;
      //const delta = intensity; 

      // @TODO should compensate latency depending on algorithm
      const positionCompensation = secondsToBeats(-parameters.sensorsLatency);
      position = positionAddBeats(position, positionCompensation, {timeSignature});

      const beat = {
        position,
        trigger: 0,
      };

      if (overMedian === 0) {
        if (delta > medianThreshold && lastBeatTime === null) {
          overMedian = 1;
          previousIntensity = intensity;
        }
      } else {
        if (intensity > previousIntensity) {
          previousIntensity = intensity;
        } else {
          lastBeatTime = now;
          beat.trigger = 1;
          maxIntensity = previousIntensity;
          previousIntensity = 0;
          overMedian = 0;
        } 
      }

      if (lastBeatTime !== null
          && now - lastBeatTime > timeIntervalThreshold) {
        lastBeatTime = null;
      }

      lastMedian = movingMedian.process(intensity);

      outputData['beat'] = beat;
      return outputFrame;
    },

    destroy() {

    },
  }
}