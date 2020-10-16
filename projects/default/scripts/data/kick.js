function kick(graph, helpers, outputFrame) {
  const medianOrder = 5;
  const threshold = 0.003;
  const minInter = 0.2;
  const movingMedian = new helpers.algo.MovingMedian(medianOrder);

  let lastKickTime = null;
  let lastMedian = +Infinity; // prevent kick on first frame

  return function(inputFrame, outputFrame) {
    const now = Date.now() / 1000;
    const intensity = inputFrame.data['intensity'].linear;
    const delta = intensity - lastMedian;

    outputFrame.data['beat'] = 0;

    if (delta > threshold && lastKickTime === null) {
      lastKickTime = now;
      outputFrame.data['beat'] = 1;
    }

    if (lastKickTime !== null && now - lastKickTime > minInter) {
      lastKickTime = null;
    }

    lastMedian = movingMedian.process(intensity);

    return outputFrame;
  }
}
