function beatTriggerFromGestureOnset(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;

  const medianOrder = 5;
  const medianThreshold = 0.003;
  const timeIntervalThreshold = 0.2; //  in seconds
  const movingMedian = new helpers.algo.MovingMedian(medianOrder);

  let lastBeatTime = null;
  let lastMedian = +Infinity; // prevent kick on first frame

  const parameters = {
  };

  return {
    updateParams(updates) {
      for(const p of Object.keys(updates) ) {
        if(parameters.hasOwnProperty(p) ) {
          parameters[p] = updates[p];
        }
      }
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const sensorsLatency = inputData.metas.period;

      // use logical time tag from frame
      const now = inputData['time'].local;

      const timeSignature = inputData['timeSignature'];

      const intensity = inputData['intensity'].linear;
      const delta = intensity - lastMedian;

      // @TODO should compensate latency depending on algorithm
      const time = now - sensorsLatency;

      const beat = {
        time,
        trigger: 0,
        // for off-line analysis
        type: 'onset',
        delta,
        median: lastMedian,
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