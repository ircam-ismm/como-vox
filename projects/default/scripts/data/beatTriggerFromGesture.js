function beatTriggerFromGesture(graph, helpers, outputFrame) {
  const medianOrder = 5;
  const medianThreshold = 0.003;
  const timeIntervalThreshold = 0.2; //  in seconds
  const movingMedian = new helpers.algo.MovingMedian(medianOrder);

  let lastBeatTime = null;
  let lastMedian = +Infinity; // prevent kick on first frame

  return {
    updateParams(updates) {

    },
    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const now = performance.now() * 1e-3;

      const position = inputData['position'];

      const intensity = inputData['intensity'].linear;
      const delta = intensity - lastMedian;

      outputData['position'] = position;
      outputData['beat'] = 0;

      if (delta > medianThreshold && lastBeatTime === null) {
        lastBeatTime = now;
        outputData['beat'] = 1;
      }

      if (lastBeatTime !== null
          && now - lastBeatTime > timeIntervalThreshold) {
        lastBeatTime = null;
      }

      lastMedian = movingMedian.process(intensity);
      return outputFrame;
    },
    destroy() {

    },
  }
}