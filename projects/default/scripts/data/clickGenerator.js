function clickGenerator(graph, helpers, outputFrame) {
  let barLast = 0;
  let beatLast = 0;

  const pitchHigh = 91; // D6
  const pitchLow = 86; // G6

  const channel = 'click';
  let pitch = pitchLow;
  const intensity = 127;
  const duration = 50e-3;

  return {
    updateParams(updates) {

    },

    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;

      const outputData = outputFrame.data;

      const position = inputData['position'];
      const notes = [];

      const bar = position.bar;
      const beat = position.beat;

      let trigger = false;

      // always on a beat, to avoid late beats
      if(beat % 1 > 0.95 || beat % 1 < 0.05) {
        if(barLast === 0) {
          // start
          barLast = bar;
          beatLast = beat;
          trigger = true;
        } else {
          // on beat change
          trigger = Math.floor(beat) !== Math.floor(beatLast);
        }
      }

      if(!trigger) {
        outputData['notes'] = [];
        return outputFrame;
      }

      if(Math.floor(beat) === 1) {
        pitch = pitchHigh;
      } else {
        pitch = pitchLow;
      }

      notes.push({
        channel,
        pitch,
        intensity,
        duration,
      });

      outputData['notes'] = notes;
      barLast = bar;
      beatLast = beat;
      return outputFrame;
    },

    destroy() {

    },
  }
}
