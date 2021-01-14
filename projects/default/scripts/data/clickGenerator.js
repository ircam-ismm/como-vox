function clickGenerator(graph, helpers, outputFrame) {
  let barLast = 0;
  let beatLast = 0;

  const pitchHigh = 91; // G6
  const pitchLow = 86; // D6

  const channel = 'click';
  let pitch = pitchLow;
  const intensity = 60;
  const duration = 0.5; // in beats

  const parameters = {
    onOff: false,
  };

  return {
    updateParams(updates) {
      Object.assign(parameters, updates);
    },

    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const position = inputData['position'];
      const notes = [];
      const notesContainer = {};
      notesContainer[channel] = notes;

      const bar = position.bar;
      const beat = position.beat;

      let trigger = false;

      if(parameters.onOff) {
        // always on a beat, to avoid late beats
        if(beat % 1 > 0.95 || beat % 1 < 0.05) {
          if(barLast === 0) {
            // start
            barLast = bar;
            beatLast = beat;
            trigger = true;
          } else {
            // on beat change
            trigger = (Math.floor(beat) !== Math.floor(beatLast)
                       || bar !== barLast); // count to 1
          }
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

      // put beat back in time (with look-ahead for playback)
      notes.push({
        position: {
          bar: position.bar,
          beat: Math.floor(position.beat),
        },
        pitch,
        intensity,
        duration,
      });

      outputData['notes'] = notesContainer;
      barLast = bar;
      beatLast = beat;
      return outputFrame;
    },

    destroy() {

    },
  }
}