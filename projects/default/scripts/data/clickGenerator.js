function clickGenerator(graph, helpers, outputFrame) {
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
      for(const p of Object.keys(updates) ) {
        if(parameters.hasOwnProperty(p) ) {
          parameters[p] = updates[p];
        }
      }
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

      const trigger = parameters.onOff && position.beatChange;

      if(!trigger) {
        outputData['notes'] = notesContainer;
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
      return outputFrame;
    },

    destroy() {

    },
  }
}