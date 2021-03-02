function kick(graph, helpers, outputFrame) {
  const medianOrder = 5;
  const threshold = 0.003;
  const minInter = 0.2;
  const movingMedian = new helpers.algo.MovingMedian(medianOrder);

  let lastKickTime = null;
  let lastMedian = +Infinity; // prevent kick on first frame

  return {
    updateParams(updates) {

    },
    process(inputFrame, outputFrame) {
      const inputData = app.data;
      const outputData = app.data;

      const now = Date.now() / 1000;
      const intensity = inputData['intensity'].linear;
      const delta = intensity - lastMedian;

      outputData['beat-trigger'] = 0;

      if (delta > threshold && lastKickTime === null) {
        lastKickTime = now;
        outputData['beat-trigger'] = 1;
      }

      if (lastKickTime !== null && now - lastKickTime > minInter) {
        lastKickTime = null;
      }

      lastMedian = movingMedian.process(intensity);

      return outputFrame;
    },
    destroy() {

    },
  }
}