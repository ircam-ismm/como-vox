function kick(graph, helpers, outputFrame) {
  const medianOrder = 5;
  const threshold = 0.003;
  const minInter = 0.2;
  const movingMedian = new helpers.algo.MovingMedian(medianOrder);

  let lastKickTime = null;
  let lastMedian = +Infinity; // prevent kick on first frame

  return {
    updateParams(updates) {
      console.log('updates from noop', updates);
    },
    process(inputFrame, outputFrame) {
      outputFrame.data['beat'] = inputFrame.data['beat'];
//       console.log(outputFrame);
      return outputFrame;
    },
    destroy() {

    },
  }
}