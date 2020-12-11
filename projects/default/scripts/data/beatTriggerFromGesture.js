function beatTriggerFromGesture(graph, helpers, outputFrame) {
  const app = (typeof process !== 'undefined' ? process.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;

  const medianOrder = 5;
  const medianThreshold = 0.003;
  const timeIntervalThreshold = 0.2; //  in seconds
  const movingMedian = new helpers.algo.MovingMedian(medianOrder);

  let lastBeatTime = null;
  let lastMedian = +Infinity; // prevent kick on first frame

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

      const timeSignature = inputData['timeSignature'];

      const intensity = inputData['intensity'].linear;
      const delta = intensity - lastMedian;

      // @TODO should compensate latency depending on algorithm
      const time = now - parameters.sensorsLatency;

      const beat = {
        time,
        trigger: 0,
      };

      if (delta > medianThreshold && lastBeatTime === null) {
        lastBeatTime = now;
        beat.trigger = 1;
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
